import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ── Transacao ─────────────────────────────────────────────────────────────────

class TransacaoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    fatura_id: uuid.UUID
    data: Optional[date]
    descricao: Optional[str]
    valor: Optional[float]
    tipo: Optional[str]
    parcela: Optional[str]
    cartao: Optional[str]
    categoria: Optional[str]
    observacoes: Optional[str]


class TransacaoUpdate(BaseModel):
    categoria: Optional[str] = None
    observacoes: Optional[str] = None


# ── Fatura ────────────────────────────────────────────────────────────────────

class FaturaCreate(BaseModel):
    nome_arquivo: str
    banco: str
    total_debitos: float = 0.0
    total_creditos: float = 0.0
    qtd_transacoes: int = 0
    periodo_inicio: Optional[date] = None
    periodo_fim: Optional[date] = None
    mes_referencia: Optional[str] = None


class FaturaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nome_arquivo: str
    banco: str
    data_upload: datetime
    total_debitos: float
    total_creditos: float
    qtd_transacoes: int
    periodo_inicio: Optional[date]
    periodo_fim: Optional[date]
    mes_referencia: Optional[str]


class FaturaReadWithTransacoes(FaturaRead):
    transacoes: list[TransacaoRead] = []


# ── Resumo ────────────────────────────────────────────────────────────────────

class ResumoMes(BaseModel):
    mes: str
    total_debitos: float
    total_creditos: float
    saldo: float


class EvolucaoMensal(BaseModel):
    meses: list[ResumoMes]


class ResumoCategorias(BaseModel):
    categoria: str
    total: float


class ResumoCartoes(BaseModel):
    cartao: str
    total: float
