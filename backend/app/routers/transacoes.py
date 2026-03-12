import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Transacao
from ..schemas import TransacaoRead, TransacaoUpdate

router = APIRouter(prefix="/transacoes", tags=["transacoes"])


@router.get("", response_model=list[TransacaoRead])
async def list_transacoes(
    fatura_id: Optional[uuid.UUID] = Query(None),
    cartao: Optional[str] = Query(None),
    mes: Optional[str] = Query(None, description="Formato YYYY-MM"),
    tipo: Optional[str] = Query(None, description="Débito ou Crédito"),
    categoria: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """List transactions with optional filters and pagination."""
    stmt = select(Transacao)

    if fatura_id is not None:
        stmt = stmt.where(Transacao.fatura_id == fatura_id)

    if cartao is not None:
        stmt = stmt.where(Transacao.cartao.ilike(f"%{cartao}%"))

    if mes is not None:
        # mes format: YYYY-MM
        try:
            year, month = mes.split("-")
            year, month = int(year), int(month)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=422, detail="Parâmetro 'mes' deve estar no formato YYYY-MM.")
        from sqlalchemy import extract
        stmt = stmt.where(
            extract("year", Transacao.data) == year,
            extract("month", Transacao.data) == month,
        )

    if tipo is not None:
        stmt = stmt.where(Transacao.tipo == tipo)

    if categoria is not None:
        stmt = stmt.where(Transacao.categoria.ilike(f"%{categoria}%"))

    stmt = stmt.order_by(Transacao.data.asc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/{transacao_id}", response_model=TransacaoRead)
async def update_transacao(
    transacao_id: uuid.UUID,
    payload: TransacaoUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update categoria and/or observacoes of a transaction."""
    result = await db.execute(select(Transacao).where(Transacao.id == transacao_id))
    transacao = result.scalar_one_or_none()
    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transacao, field, value)

    await db.commit()
    await db.refresh(transacao)
    return transacao
