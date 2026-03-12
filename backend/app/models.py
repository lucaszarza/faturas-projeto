import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Fatura(Base):
    __tablename__ = "faturas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nome_arquivo: Mapped[str] = mapped_column(String, nullable=False)
    banco: Mapped[str] = mapped_column(String, nullable=False)
    data_upload: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    total_debitos: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_creditos: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    qtd_transacoes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    periodo_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    periodo_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    mes_referencia: Mapped[str | None] = mapped_column(String(7), nullable=True)

    transacoes: Mapped[list["Transacao"]] = relationship(
        "Transacao", back_populates="fatura", cascade="all, delete-orphan"
    )


class Transacao(Base):
    __tablename__ = "transacoes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    fatura_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("faturas.id", ondelete="CASCADE"), nullable=False
    )
    data: Mapped[date | None] = mapped_column(Date, nullable=True)
    descricao: Mapped[str | None] = mapped_column(String, nullable=True)
    valor: Mapped[float | None] = mapped_column(Float, nullable=True)
    tipo: Mapped[str | None] = mapped_column(String(20), nullable=True)
    parcela: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cartao: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    observacoes: Mapped[str | None] = mapped_column(String, nullable=True)

    fatura: Mapped["Fatura"] = relationship("Fatura", back_populates="transacoes")
