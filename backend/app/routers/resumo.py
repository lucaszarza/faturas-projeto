from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Transacao
from ..schemas import ResumoCategorias, ResumoCartoes, ResumoMes

router = APIRouter(prefix="/resumo", tags=["resumo"])


@router.get("/mensal", response_model=list[ResumoMes])
async def resumo_mensal(db: AsyncSession = Depends(get_db)):
    """Return monthly summary (debits, credits, balance) for the last 12 months."""
    today = date.today()
    # Build list of last 12 months (YYYY-MM strings) in ascending order
    months = []
    year, month = today.year, today.month
    for _ in range(12):
        months.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    months.reverse()

    # Query aggregate per year/month
    stmt = (
        select(
            extract("year", Transacao.data).label("ano"),
            extract("month", Transacao.data).label("mes_num"),
            func.coalesce(
                func.sum(
                    func.case((Transacao.valor > 0, Transacao.valor), else_=0)
                ),
                0,
            ).label("total_debitos"),
            func.coalesce(
                func.sum(
                    func.case((Transacao.valor < 0, Transacao.valor), else_=0)
                ),
                0,
            ).label("total_creditos"),
        )
        .where(Transacao.data.isnot(None))
        .group_by("ano", "mes_num")
        .order_by("ano", "mes_num")
    )

    result = await db.execute(stmt)
    rows = result.fetchall()

    # Index DB results by YYYY-MM key
    db_by_month: dict[str, dict] = {}
    for row in rows:
        key = f"{int(row.ano):04d}-{int(row.mes_num):02d}"
        db_by_month[key] = {
            "total_debitos": float(row.total_debitos),
            "total_creditos": float(row.total_creditos),
        }

    summary = []
    for mes_key in months:
        data = db_by_month.get(mes_key, {"total_debitos": 0.0, "total_creditos": 0.0})
        summary.append(
            ResumoMes(
                mes=mes_key,
                total_debitos=data["total_debitos"],
                total_creditos=data["total_creditos"],
                saldo=data["total_debitos"] + data["total_creditos"],
            )
        )

    return summary


@router.get("/categorias", response_model=list[ResumoCategorias])
async def resumo_categorias(
    mes: Optional[str] = Query(None, description="Formato YYYY-MM"),
    db: AsyncSession = Depends(get_db),
):
    """Return total per category for a given month (or all time if omitted)."""
    stmt = (
        select(
            Transacao.categoria.label("categoria"),
            func.sum(Transacao.valor).label("total"),
        )
        .where(Transacao.categoria.isnot(None), Transacao.categoria != "")
    )

    if mes is not None:
        try:
            year, month = mes.split("-")
            year, month = int(year), int(month)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=422, detail="Parâmetro 'mes' deve estar no formato YYYY-MM.")
        stmt = stmt.where(
            extract("year", Transacao.data) == year,
            extract("month", Transacao.data) == month,
        )

    stmt = stmt.group_by(Transacao.categoria).order_by(func.sum(Transacao.valor).desc())

    result = await db.execute(stmt)
    rows = result.fetchall()

    return [
        ResumoCategorias(categoria=row.categoria or "", total=float(row.total or 0))
        for row in rows
    ]


@router.get("/cartoes", response_model=list[ResumoCartoes])
async def resumo_cartoes(
    mes: Optional[str] = Query(None, description="Formato YYYY-MM"),
    db: AsyncSession = Depends(get_db),
):
    """Return total per card for a given month (or all time if omitted)."""
    stmt = (
        select(
            Transacao.cartao.label("cartao"),
            func.sum(Transacao.valor).label("total"),
        )
        .where(Transacao.cartao.isnot(None), Transacao.cartao != "")
    )

    if mes is not None:
        try:
            year, month = mes.split("-")
            year, month = int(year), int(month)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=422, detail="Parâmetro 'mes' deve estar no formato YYYY-MM.")
        stmt = stmt.where(
            extract("year", Transacao.data) == year,
            extract("month", Transacao.data) == month,
        )

    stmt = stmt.group_by(Transacao.cartao).order_by(func.sum(Transacao.valor).desc())

    result = await db.execute(stmt)
    rows = result.fetchall()

    return [
        ResumoCartoes(cartao=row.cartao or "", total=float(row.total or 0))
        for row in rows
    ]
