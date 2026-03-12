import type {
  Fatura,
  FaturaWithTransacoes,
  EvolucaoMensal,
  ResumoCategorias,
  ResumoCartoes,
  TransacaoUpdate,
  Transacao,
  UploadResponse,
} from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.detail ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

// ── Faturas ────────────────────────────────────────────────────────────────

export async function getFaturas(): Promise<Fatura[]> {
  return request<Fatura[]>("/api/faturas");
}

export async function getFatura(id: string): Promise<FaturaWithTransacoes> {
  return request<FaturaWithTransacoes>(`/api/faturas/${id}`);
}

export async function deleteFatura(id: string): Promise<void> {
  return request<void>(`/api/faturas/${id}`, { method: "DELETE" });
}

export async function uploadFaturas(
  files: File[],
  password?: string
): Promise<UploadResponse> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  if (password) {
    form.append("password", password);
  }

  const url = `${BASE_URL}/api/faturas/upload`;
  const res = await fetch(url, {
    method: "POST",
    body: form,
    // Do NOT set Content-Type — browser sets multipart boundary automatically
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.detail ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<UploadResponse>;
}

export function getFaturaExportUrl(id: string): string {
  return `${BASE_URL}/api/faturas/${id}/export`;
}

// ── Transacoes ─────────────────────────────────────────────────────────────

export async function updateTransacao(
  id: string,
  data: TransacaoUpdate
): Promise<Transacao> {
  return request<Transacao>(`/api/transacoes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Resumo ─────────────────────────────────────────────────────────────────

export async function getResumoMensal(): Promise<EvolucaoMensal> {
  return request<EvolucaoMensal>("/api/resumo/mensal");
}

export async function getResumoCategorias(
  mes: string
): Promise<ResumoCategorias[]> {
  return request<ResumoCategorias[]>(
    `/api/resumo/categorias?mes=${encodeURIComponent(mes)}`
  );
}

export async function getResumoCartoes(mes: string): Promise<ResumoCartoes[]> {
  return request<ResumoCartoes[]>(
    `/api/resumo/cartoes?mes=${encodeURIComponent(mes)}`
  );
}

export { ApiError };
