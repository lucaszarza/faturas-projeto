import { UploadZone } from "@/components/faturas/UploadZone";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Enviar faturas em PDF
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Selecione um ou mais arquivos PDF de fatura de cartão de crédito.
          Eles serão processados automaticamente e as transações importadas.
        </p>
      </div>

      <UploadZone />
    </div>
  );
}
