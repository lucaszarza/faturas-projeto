// ── Transacao ──────────────────────────────────────────────────────────────

export interface Transacao {
  id: string;
  fatura_id: string;
  data: string | null;
  descricao: string | null;
  valor: number | null;
  tipo: string | null;
  parcela: string | null;
  cartao: string | null;
  categoria: string | null;
  observacoes: string | null;
}

export interface TransacaoUpdate {
  categoria?: string | null;
  observacoes?: string | null;
}

// ── Fatura ─────────────────────────────────────────────────────────────────

export interface Fatura {
  id: string;
  nome_arquivo: string;
  banco: string;
  data_upload: string;
  total_debitos: number;
  total_creditos: number;
  qtd_transacoes: number;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  mes_referencia: string | null;
}

export interface FaturaWithTransacoes extends Fatura {
  transacoes: Transacao[];
}

// ── Resumo ─────────────────────────────────────────────────────────────────

export interface ResumoMes {
  mes: string;
  total_debitos: number;
  total_creditos: number;
  saldo: number;
}

export interface EvolucaoMensal {
  meses: ResumoMes[];
}

export interface ResumoCategorias {
  categoria: string;
  total: number;
}

export interface ResumoCartoes {
  cartao: string;
  total: number;
}

// ── Upload ─────────────────────────────────────────────────────────────────

export interface UploadResponse {
  faturas: Fatura[];
  errors: string[];
}

// ── Pagination ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ── Categories ─────────────────────────────────────────────────────────────

export const CATEGORIAS = [
  "Alimentação",
  "Transporte",
  "Saúde",
  "Moradia",
  "Lazer",
  "Streaming",
  "Compras",
  "Viagem",
  "Educação",
  "Investimentos",
  "Outros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
