"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { uploadFaturas } from "@/lib/api";
import { cn } from "@/lib/utils";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    count: number;
    errors: string[];
  } | null>(null);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const newFiles = Array.from(incoming).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !existing.has(f.name))];
    });
  }, []);

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  // Drag events
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave() {
    setDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;

    setStatus("uploading");
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const result = await uploadFaturas(files, password || undefined);
      setSuccessInfo({
        count: result.faturas.length,
        errors: result.errors ?? [],
      });
      setStatus("success");
      // Redirect after short delay
      setTimeout(() => router.push("/faturas"), 2000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao fazer upload"
      );
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200",
            "flex flex-col items-center justify-center gap-3 p-12",
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
          )}
        >
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
              dragging ? "bg-blue-100" : "bg-slate-100"
            )}
          >
            <Upload
              className={cn(
                "h-6 w-6 transition-colors",
                dragging ? "text-blue-600" : "text-slate-500"
              )}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Arraste os PDFs aqui ou{" "}
              <span className="text-blue-600">clique para selecionar</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Apenas arquivos PDF são aceitos
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50">
              <p className="text-xs font-medium text-slate-600">
                {files.length} arquivo{files.length !== 1 ? "s" : ""}{" "}
                selecionado{files.length !== 1 ? "s" : ""}
              </p>
            </div>
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-3 px-4 py-3"
              >
                <FileText className="h-4 w-4 shrink-0 text-red-500" />
                <span className="flex-1 text-sm text-slate-700 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Password field */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Senha do PDF{" "}
            <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco se não houver senha"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {status === "error" && errorMessage && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3.5">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Erro no upload</p>
              <p className="text-sm text-red-600 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {status === "success" && successInfo && (
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3.5">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {successInfo.count} fatura{successInfo.count !== 1 ? "s" : ""}{" "}
                processada{successInfo.count !== 1 ? "s" : ""} com sucesso!
              </p>
              {successInfo.errors.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {successInfo.errors.map((err, i) => (
                    <li key={i} className="text-xs text-amber-600">
                      {err}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-emerald-600 mt-1">
                Redirecionando para faturas…
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={files.length === 0 || status === "uploading" || status === "success"}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200",
            "flex items-center justify-center gap-2",
            files.length === 0 || status === "uploading" || status === "success"
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
          )}
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Enviar {files.length > 0 ? `${files.length} arquivo${files.length !== 1 ? "s" : ""}` : "arquivos"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
