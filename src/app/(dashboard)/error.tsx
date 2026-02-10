"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="space-y-6">
            <div className="card p-6 border-amber-500/50 bg-amber-500/5 flex items-start gap-4 max-w-2xl mx-auto mt-10">
                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-3">
                    <h3 className="font-semibold text-amber-500">Erro ao carregar a página</h3>
                    <p className="text-sm text-muted-foreground">
                        Provavelmente o banco de dados não está conectado. Configure a variável
                        <code className="bg-secondary px-1.5 py-0.5 rounded text-xs mx-1">DATABASE_URL</code>
                        nas variáveis de ambiente do Vercel.
                    </p>
                    <div className="flex gap-2 pt-2">
                        <button onClick={reset} className="btn btn-primary text-sm">
                            Tentar novamente
                        </button>
                        <Link href="/" className="px-4 py-2 text-sm rounded-md hover:bg-secondary transition-colors">
                            Voltar ao Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
