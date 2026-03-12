# Deploy no Dokploy

## Pré-requisitos
- VPS com Docker instalado (ex: Hetzner CX22 ~€4/mês)
- Dokploy instalado: `curl -sSL https://dokploy.com/install.sh | sh`

## Passos

### 1. No painel Dokploy
1. Criar novo **Project** → "faturas-projeto"
2. Criar **Application** do tipo "Docker Compose"
3. Apontar para o repositório: `https://github.com/lucaszarza/faturas-projeto`
4. Branch: `feature/web-app` (ou `main` quando mergeado)
5. Docker Compose file: `docker-compose.prod.yml`

### 2. Variáveis de ambiente no Dokploy
```
DATABASE_URL=postgresql+asyncpg://faturas:SENHA_FORTE@db:5432/faturas
POSTGRES_PASSWORD=SENHA_FORTE
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

### 3. Domínios
- Frontend: `faturas.seudominio.com` → porta 3000
- Backend:  `api.faturas.seudominio.com` → porta 8000

### 4. Deploy
Dokploy faz deploy automático a cada push na branch configurada.
