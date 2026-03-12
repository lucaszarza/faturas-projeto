from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import faturas, transacoes, resumo


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Faturas API",
    description="API para processamento de faturas de cartão de crédito",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(faturas.router, prefix="/api")
app.include_router(transacoes.router, prefix="/api")
app.include_router(resumo.router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok"}
