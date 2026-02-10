"use client";

import { useState } from "react";
import { AlertCircle, BarChart, Settings, RefreshCw } from "lucide-react";

export default function CampanhasPage() {
    const [apiKey, setApiKey] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = () => {
        // Simulating connection check
        if (apiKey.length > 10) {
            setIsConnected(true);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campanhas de Tráfego</h1>
                    <p className="text-muted-foreground">Monitore o desempenho das suas campanhas (FB Ads & Google Ads).</p>
                </div>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar Dados
                </button>
            </div>

            {!isConnected ? (
                <div className="card max-w-2xl mx-auto mt-10 p-8 text-center space-y-4 border-dashed border-2">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
                        <Settings className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-semibold">Configurar Integração</h2>
                    <p className="text-muted-foreground">
                        Para visualizar suas campanhas, você precisa conectar sua conta de anúncios.
                        Insira seu Token de API abaixo.
                    </p>

                    <div className="max-w-md mx-auto space-y-2 text-left">
                        <label className="text-sm font-medium">Token de Acesso (Meta Ads / Google Ads)</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                                placeholder="EAA..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <button
                                onClick={handleConnect}
                                className="btn btn-primary"
                                disabled={!apiKey}
                            >
                                Conectar
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Seus dados são criptografados e salvos localmente.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <KpiCard title="Investimento Total" value="R$ 12.450,00" change="+15%" positive />
                        <KpiCard title="Receita (Rastr.)" value="R$ 32.100,00" change="+22%" positive />
                        <KpiCard title="ROAS Médio" value="2.58" change="+0.2" positive />
                        <KpiCard title="CPA Médio" value="R$ 15,40" change="-5%" positive />
                    </div>

                    <h3 className="font-semibold text-lg mt-8">Campanhas Ativas</h3>
                    <div className="space-y-3">
                        <CampaignRow name="[Escala] Produto X - Latam" status="ACTIVE" spend="R$ 4.500" roas="3.1" />
                        <CampaignRow name="[Teste] Criativo Y - Video" status="LEARNING" spend="R$ 800" roas="1.2" />
                        <CampaignRow name="[Rmkt] Público Quente" status="ACTIVE" spend="R$ 1.200" roas="4.5" />
                        <CampaignRow name="[Topo] Interesses Amplos" status="PAUSED" spend="R$ 2.150" roas="0.8" />
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCard({ title, value, change, positive }: { title: string, value: string, change: string, positive: boolean }) {
    return (
        <div className="card p-4">
            <div className="text-sm text-muted-foreground mb-1">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
            <div className={cn("text-xs mt-1", positive ? "text-emerald-500" : "text-rose-500")}>
                {change} vs. período anterior
            </div>
        </div>
    )
}

function CampaignRow({ name, status, spend, roas }: { name: string, status: string, spend: string, roas: string }) {
    return (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
                <span className={cn("w-2 h-2 rounded-full",
                    status === "ACTIVE" ? "bg-emerald-500" :
                        status === "LEARNING" ? "bg-amber-500" :
                            "bg-muted-foreground"
                )}></span>
                <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{status === "ACTIVE" ? "Ativa" : status === "LEARNING" ? "Aprendizado" : "Pausada"}</div>
                </div>
            </div>
            <div className="flex gap-8 text-right">
                <div>
                    <div className="text-xs text-muted-foreground">Gasto</div>
                    <div className="font-medium">{spend}</div>
                </div>
                <div className="w-20">
                    <div className="text-xs text-muted-foreground">ROAS</div>
                    <div className={cn("font-bold", Number(roas) >= 2 ? "text-emerald-500" : "text-amber-500")}>{roas}x</div>
                </div>
            </div>
        </div>
    )
}

// Simple CN utility mock if not imported (but it is available in lib/utils)
import { cn } from "@/lib/utils";
