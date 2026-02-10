"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Target, Loader2, Settings, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CampaignInsights = {
    spend: string;
    impressions: number;
    clicks: number;
    cpc: string;
    cpm: string;
    ctr: string;
    purchases: number;
    revenue: string;
    roas: string;
    cpa: string;
};

type Campaign = {
    id: string;
    name: string;
    status: string;
    objective: string;
    insights: CampaignInsights | null;
};

type AggregatedInsights = {
    spend: string;
    revenue: string;
    roas: string;
    purchases: number;
    cpa: string;
    impressions: number;
    clicks: number;
    ctr: string;
    cpc: string;
};

const DATE_PRESETS = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "last_7d", label: "7 dias" },
    { value: "last_14d", label: "14 dias" },
    { value: "last_30d", label: "30 dias" },
    { value: "this_month", label: "Mês atual" },
    { value: "last_month", label: "Mês anterior" },
];

export default function CampanhasPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [insights, setInsights] = useState<AggregatedInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [datePreset, setDatePreset] = useState("last_30d");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [campaignsRes, insightsRes] = await Promise.all([
                fetch(`/api/meta/campaigns?date_preset=${datePreset}`),
                fetch(`/api/meta/insights?date_preset=${datePreset}`),
            ]);

            const campaignsData = await campaignsRes.json();
            const insightsData = await insightsRes.json();

            if (campaignsData.error && !campaignsData.connected) {
                setConnected(false);
                setError(campaignsData.error);
            } else if (campaignsData.error && campaignsData.connected) {
                setConnected(true);
                setError(campaignsData.error);
            } else {
                setConnected(true);
                setCampaigns(campaignsData.campaigns || []);
            }

            if (insightsData.insights) {
                setInsights(insightsData.insights);
            }
        } catch (err) {
            setError("Erro ao conectar com a API.");
        } finally {
            setLoading(false);
        }
    }, [datePreset]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (val: string | number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(val));

    const formatNumber = (val: number) =>
        new Intl.NumberFormat("pt-BR").format(val);

    // Not connected state
    if (!loading && !connected) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campanhas de Tráfego</h1>
                    <p className="text-muted-foreground">Monitore o desempenho das suas campanhas (FB Ads & Google Ads).</p>
                </div>

                <div className="card max-w-2xl mx-auto mt-10 p-8 text-center space-y-4 border-dashed border-2">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
                        <Settings className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-semibold">Configurar Integração</h2>
                    <p className="text-muted-foreground">
                        Para visualizar suas campanhas, você precisa conectar sua conta de anúncios.
                        Vá em Configurações para adicionar seu Access Token e Ad Account ID.
                    </p>
                    <Link href="/configuracoes" className="btn btn-primary inline-flex">
                        <Settings className="mr-2 h-4 w-4" />
                        Ir para Configurações
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campanhas de Tráfego</h1>
                    <p className="text-muted-foreground">Monitore o desempenho das suas campanhas (FB Ads & Google Ads).</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                        {DATE_PRESETS.map((preset) => (
                            <button
                                key={preset.value}
                                onClick={() => setDatePreset(preset.value)}
                                className={cn(
                                    "px-2.5 py-1 text-xs rounded-md transition-colors",
                                    datePreset === preset.value
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Atualizar
                    </button>
                </div>
            </div>

            {error && (
                <div className="card p-4 border-amber-500/50 bg-amber-500/5 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-500">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-muted-foreground text-sm">Carregando dados da Meta...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    {insights && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                                title="Investimento Total"
                                value={formatCurrency(insights.spend)}
                                icon={<DollarSign className="h-4 w-4" />}
                                color="text-rose-500"
                                bgColor="bg-rose-500/10"
                            />
                            <KpiCard
                                title="Receita (Rastreada)"
                                value={formatCurrency(insights.revenue)}
                                icon={<TrendingUp className="h-4 w-4" />}
                                color="text-emerald-500"
                                bgColor="bg-emerald-500/10"
                            />
                            <KpiCard
                                title="ROAS"
                                value={`${insights.roas}x`}
                                icon={<Target className="h-4 w-4" />}
                                color={Number(insights.roas) >= 2 ? "text-emerald-500" : "text-amber-500"}
                                bgColor={Number(insights.roas) >= 2 ? "bg-emerald-500/10" : "bg-amber-500/10"}
                            />
                            <KpiCard
                                title="CPA Médio"
                                value={formatCurrency(insights.cpa)}
                                icon={<TrendingDown className="h-4 w-4" />}
                                color="text-blue-500"
                                bgColor="bg-blue-500/10"
                                subtitle={`${insights.purchases} conversões · ${formatNumber(insights.clicks)} cliques`}
                            />
                        </div>
                    )}

                    {/* Campaign List */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">
                            Campanhas ({campaigns.length})
                        </h3>

                        {campaigns.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                Nenhuma campanha encontrada neste período.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {campaigns.map((campaign) => (
                                    <CampaignRow key={campaign.id} campaign={campaign} formatCurrency={formatCurrency} />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function KpiCard({
    title, value, icon, color, bgColor, subtitle
}: {
    title: string; value: string; icon: React.ReactNode; color: string; bgColor: string; subtitle?: string;
}) {
    return (
        <div className="card p-4">
            <div className={cn("flex items-center gap-2 mb-2", color)}>
                <div className={cn("p-1.5 rounded-md", bgColor)}>{icon}</div>
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <div className={cn("text-2xl font-bold", color)}>{value}</div>
            {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        </div>
    );
}

function CampaignRow({ campaign, formatCurrency }: { campaign: Campaign; formatCurrency: (v: string | number) => string }) {
    const statusMap: Record<string, { label: string; color: string }> = {
        ACTIVE: { label: "Ativa", color: "bg-emerald-500" },
        PAUSED: { label: "Pausada", color: "bg-muted-foreground" },
        DELETED: { label: "Excluída", color: "bg-rose-500" },
        ARCHIVED: { label: "Arquivada", color: "bg-muted-foreground" },
    };

    const statusInfo = statusMap[campaign.status] || { label: campaign.status, color: "bg-muted-foreground" };
    const ins = campaign.insights;

    return (
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={cn("w-2 h-2 rounded-full shrink-0", statusInfo.color)}></span>
                <div className="min-w-0">
                    <div className="font-medium truncate">{campaign.name}</div>
                    <div className="text-xs text-muted-foreground">{statusInfo.label}</div>
                </div>
            </div>
            {ins ? (
                <div className="flex gap-6 text-right shrink-0">
                    <div className="w-24">
                        <div className="text-xs text-muted-foreground">Gasto</div>
                        <div className="font-medium text-sm">{formatCurrency(ins.spend)}</div>
                    </div>
                    <div className="w-20">
                        <div className="text-xs text-muted-foreground">Receita</div>
                        <div className="font-medium text-sm text-emerald-500">{formatCurrency(ins.revenue)}</div>
                    </div>
                    <div className="w-16">
                        <div className="text-xs text-muted-foreground">ROAS</div>
                        <div className={cn("font-bold text-sm", Number(ins.roas) >= 2 ? "text-emerald-500" : Number(ins.roas) >= 1 ? "text-amber-500" : "text-rose-500")}>
                            {ins.roas}x
                        </div>
                    </div>
                    <div className="w-20">
                        <div className="text-xs text-muted-foreground">CPA</div>
                        <div className="font-medium text-sm">{formatCurrency(ins.cpa)}</div>
                    </div>
                    <div className="w-16">
                        <div className="text-xs text-muted-foreground">Cliques</div>
                        <div className="font-medium text-sm">{new Intl.NumberFormat("pt-BR").format(ins.clicks)}</div>
                    </div>
                </div>
            ) : (
                <div className="text-xs text-muted-foreground">Sem dados</div>
            )}
        </div>
    );
}
