import io
import os
import sys
import tempfile
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db, AsyncSessionLocal
from ..models import Fatura, Transacao
from ..schemas import FaturaRead, FaturaReadWithTransacoes

# Make processar_faturas importable when running inside Docker (/app) or locally
sys.path.insert(0, "/app")
# Also support local development: project root is three levels up from this file
_project_root = str(Path(__file__).resolve().parents[4])
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from processar_faturas import criar_parser, COLUNAS_FINAIS  # noqa: E402

router = APIRouter(prefix="/faturas", tags=["faturas"])

ALLOWED_EXTENSIONS = {".pdf", ".xlsx", ".xls", ".csv"}


def _parse_date_str(date_str: Optional[str]) -> Optional[date]:
    """Parse DD/MM/YYYY string returned by the parser into a date object."""
    if not date_str or str(date_str).lower() in ("nan", "none", "nat", ""):
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y", "%d-%m-%Y"):
        try:
            return datetime.strptime(str(date_str).strip(), fmt).date()
        except ValueError:
            continue
    return None


def _df_to_transacoes(df: pd.DataFrame, fatura_id: uuid.UUID) -> list[Transacao]:
    """Convert a parsed DataFrame into a list of Transacao ORM objects."""
    transacoes = []
    for _, row in df.iterrows():
        valor_raw = row.get("Valor (R$)")
        try:
            valor = float(valor_raw) if valor_raw is not None and str(valor_raw) not in ("nan", "") else None
        except (TypeError, ValueError):
            valor = None

        transacoes.append(
            Transacao(
                id=uuid.uuid4(),
                fatura_id=fatura_id,
                data=_parse_date_str(row.get("Data")),
                descricao=str(row.get("Descrição", "") or ""),
                valor=valor,
                tipo=str(row.get("Tipo", "") or ""),
                parcela=str(row.get("Parcela", "") or ""),
                cartao=str(row.get("Cartão", "") or ""),
                categoria=str(row.get("Categoria", "") or ""),
                observacoes=str(row.get("Observações", "") or ""),
            )
        )
    return transacoes


def _compute_fatura_stats(df: pd.DataFrame, nome_arquivo: str, banco: str) -> dict:
    """Compute aggregate stats from a parsed DataFrame."""
    valores = pd.to_numeric(df["Valor (R$)"], errors="coerce").dropna()
    total_debitos = float(valores[valores > 0].sum())
    total_creditos = float(valores[valores < 0].sum())
    qtd_transacoes = len(df)

    datas = []
    for d in df["Data"]:
        parsed = _parse_date_str(d)
        if parsed:
            datas.append(parsed)

    periodo_inicio = min(datas) if datas else None
    periodo_fim = max(datas) if datas else None
    mes_referencia = periodo_inicio.strftime("%Y-%m") if periodo_inicio else None

    return {
        "nome_arquivo": nome_arquivo,
        "banco": banco,
        "total_debitos": total_debitos,
        "total_creditos": total_creditos,
        "qtd_transacoes": qtd_transacoes,
        "periodo_inicio": periodo_inicio,
        "periodo_fim": periodo_fim,
        "mes_referencia": mes_referencia,
    }


async def _process_and_save(
    file: UploadFile,
    senha: Optional[str],
    session: AsyncSession,
) -> Optional[Fatura]:
    """Save an uploaded file to a temp path, parse it, persist to DB, return Fatura."""
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Formato não suportado: {suffix}. Use PDF, XLSX, XLS ou CSV.",
        )

    content = await file.read()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        parser = criar_parser(tmp_path)
        # Preserve the original filename for bank detection
        parser.caminho = parser.caminho  # already set; overwrite nome_cartao if needed

        if senha and hasattr(parser, "senha"):
            parser.senha = senha

        df = parser.parsear()

        if df.empty:
            return None

        banco = parser.nome_cartao
        stats = _compute_fatura_stats(df, file.filename, banco)

        fatura_id = uuid.uuid4()
        fatura = Fatura(
            id=fatura_id,
            data_upload=datetime.utcnow(),
            **stats,
        )
        session.add(fatura)

        transacoes = _df_to_transacoes(df, fatura_id)
        for t in transacoes:
            session.add(t)

        await session.commit()
        await session.refresh(fatura)
        return fatura

    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@router.post("/upload", response_model=list[FaturaRead])
async def upload_faturas(
    files: list[UploadFile] = File(...),
    senha: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more invoice files (PDF/XLSX/CSV) and save them to the database."""
    results = []
    for file in files:
        fatura = await _process_and_save(file, senha, db)
        if fatura:
            results.append(fatura)

    if not results:
        raise HTTPException(
            status_code=422,
            detail="Nenhuma transação extraída dos arquivos enviados.",
        )
    return results


@router.get("", response_model=list[FaturaRead])
async def list_faturas(db: AsyncSession = Depends(get_db)):
    """Return all invoices ordered by upload date descending."""
    result = await db.execute(
        select(Fatura).order_by(Fatura.data_upload.desc())
    )
    return result.scalars().all()


@router.get("/{fatura_id}", response_model=FaturaReadWithTransacoes)
async def get_fatura(fatura_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return a single invoice with all its transactions."""
    result = await db.execute(
        select(Fatura)
        .options(selectinload(Fatura.transacoes))
        .where(Fatura.id == fatura_id)
    )
    fatura = result.scalar_one_or_none()
    if not fatura:
        raise HTTPException(status_code=404, detail="Fatura não encontrada.")
    return fatura


@router.delete("/{fatura_id}", status_code=204)
async def delete_fatura(fatura_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete an invoice and all its transactions."""
    result = await db.execute(select(Fatura).where(Fatura.id == fatura_id))
    fatura = result.scalar_one_or_none()
    if not fatura:
        raise HTTPException(status_code=404, detail="Fatura não encontrada.")
    await db.delete(fatura)
    await db.commit()


@router.get("/{fatura_id}/export")
async def export_fatura(fatura_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Generate and stream an Excel file for the invoice."""
    result = await db.execute(
        select(Fatura)
        .options(selectinload(Fatura.transacoes))
        .where(Fatura.id == fatura_id)
    )
    fatura = result.scalar_one_or_none()
    if not fatura:
        raise HTTPException(status_code=404, detail="Fatura não encontrada.")

    rows = []
    for t in fatura.transacoes:
        rows.append({
            "Data": t.data.strftime("%d/%m/%Y") if t.data else "",
            "Descrição": t.descricao or "",
            "Valor (R$)": t.valor,
            "Tipo": t.tipo or "",
            "Parcela": t.parcela or "",
            "Cartão": t.cartao or "",
            "Categoria": t.categoria or "",
            "Observações": t.observacoes or "",
        })

    df = pd.DataFrame(rows, columns=COLUNAS_FINAIS) if rows else pd.DataFrame(columns=COLUNAS_FINAIS)

    wb = Workbook()
    ws = wb.active
    ws.title = "Transações"

    HEADER_FILL = PatternFill("solid", fgColor="4472C4")
    HEADER_FONT = Font(bold=True, color="FFFFFF", size=11)
    PAR_FILL = PatternFill("solid", fgColor="DCE6F1")
    RED_FONT = Font(color="C00000")

    ws.append(list(df.columns))
    for col_idx in range(1, len(df.columns) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 22

    valor_col = list(df.columns).index("Valor (R$)") + 1

    for row_idx, row in enumerate(df.itertuples(index=False), start=2):
        ws.append(list(row))
        is_par = row_idx % 2 == 0
        for col_idx in range(1, len(df.columns) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            if is_par:
                cell.fill = PAR_FILL
            cell.alignment = Alignment(vertical="center")
            if col_idx == valor_col:
                cell.number_format = 'R$ #,##0.00'
                if isinstance(cell.value, (int, float)) and cell.value < 0:
                    cell.font = RED_FONT
        ws.row_dimensions[row_idx].height = 16

    ws.auto_filter.ref = ws.dimensions
    ws.freeze_panes = "A2"

    WIDTHS = {
        "Data": 12, "Descrição": 46, "Valor (R$)": 16,
        "Tipo": 10, "Parcela": 10, "Cartão": 20,
        "Categoria": 20, "Observações": 28,
    }
    for cells in ws.columns:
        header = str(cells[0].value or "")
        ws.column_dimensions[get_column_letter(cells[0].column)].width = WIDTHS.get(header, 18)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    safe_name = fatura.nome_arquivo.replace(" ", "_").replace("/", "-")
    filename = f"fatura_{safe_name}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
