"use client";

import { useState, useEffect, useCallback } from "react";
import {
    RefreshCw, TrendingUp, DollarSign, Target, Loader2, Settings,
    AlertCircle, ChevronDown, Filter, Pencil, Check, X, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Insights = {
    spend: string; impressions: number; clicks: number;
    cpc: string; ctr: string; purchases: number;
    revenue: string; roas: string; cpa: string;
};

type Campaign = {
    id: string; name: string; status: string; objective: string;
    daily_budget?: string; lifetime_budget?: string; insights: Insights | null;
};

type AdSet = {
    id: string; name: string; status: string; campaign_id: string;
    daily_budget: number | null; lifetime_budget: number | null;
    optimization_goal?: string; insights: Insights | null;
};

type Ad = {
    id: string; name: string; status: string; adset_id: string;
    campaign_id: string; creative?: any; insights: Insights | null;
};

type AggregatedInsights = {
    spend: string; revenue: string; roas: string; purchases: number;
    cpa: string; impressions: number; clicks: number; ctr: string; cpc: string;
};

const DATE_PRESETS = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "last_7d", label: "7 dias" },
    { value: "last_14d", label: "14 dias" },
    { value: "last_30d", label: "30 dias" },
    { value: "this_month", label: "Mês atual" },
    { value: "last_month", label: "Mês passado" },
];

const STATUS_FILTERS = [
    { value: "ALL", label: "Todos" },
    { value: "ACTIVE", label: "Ativo" },
    { value: "PAUSED", label: "Pausado" },
];

type TabType = "campaigns" | "adsets" | "ads";

export default function CampanhasPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [adSets, setAdSets] = useState<AdSet[]>([]);
    const [ads, setAds] = useState<Ad[]>([]);
    const [insights, setInsights] = useState<AggregatedInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [datePreset, setDatePreset] = useState("last_30d");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [activeTab, setActiveTab] = useState<TabType>("campaigns");
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editingBudget, setEditingBudget] = useState<string | null>(null);
    const [budgetValue, setBudgetValue] = useState("");

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
            } else if (campaignsData.error) {
                setConnected(true);
                setError(campaignsData.error);
            } else {
                setConnected(true);
                setCampaigns(campaignsData.campaigns || []);
            }

            if (insightsData.insights) setInsights(insightsData.insights);
        } catch { setError("Erro ao conectar com a API."); }
        finally { setLoading(false); }
    }, [datePreset]);

    const fetchAdSets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/meta/adsets?date_preset=${datePreset}`);
            const data = await res.json();
            if (data.adSets) setAdSets(data.adSets);
            if (data.error) setError(data.error);
        } catch { setError("Erro ao buscar conjuntos."); }
        finally { setLoading(false); }
    }, [datePreset]);

    const fetchAds = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/meta/ads?date_preset=${datePreset}`);
            const data = await res.json();
            if (data.ads) setAds(data.ads);
            if (data.error) setError(data.error);
        } catch { setError("Erro ao buscar anúncios."); }
        finally { setLoading(false); }
    }, [datePreset]);

    useEffect(() => {
        if (activeTab === "campaigns") fetchData();
        else if (activeTab === "adsets") fetchAdSets();
        else if (activeTab === "ads") fetchAds();
    }, [activeTab, fetchData, fetchAdSets, fetchAds]);

    const toggleStatus = async (id: string, currentStatus: string, type: TabType) => {
        const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
        setUpdatingId(id);
        try {
            const endpoint = type === "campaigns" ? "/api/meta/campaigns/update"
                : type === "adsets" ? "/api/meta/adsets" : "/api/meta/ads";
            const bodyKey = type === "campaigns" ? "campaignId"
                : type === "adsets" ? "adSetId" : "adId";

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [bodyKey]: id, status: newStatus }),
            });

            const data = await res.json();
            if (data.error) { setError(data.error); return; }

            // Update local state
            if (type === "campaigns") {
                setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            } else if (type === "adsets") {
                setAdSets(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            } else {
                setAds(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            }
        } catch { setError("Erro ao atualizar status."); }
        finally { setUpdatingId(null); }
    };

    const saveBudget = async (id: string, type: "campaigns" | "adsets") => {
        const value = parseFloat(budgetValue);
        if (isNaN(value) || value < 0) return;
        setUpdatingId(id);
        try {
            const endpoint = type === "campaigns" ? "/api/meta/campaigns/update" : "/api/meta/adsets";
            const bodyKey = type === "campaigns" ? "campaignId" : "adSetId";

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [bodyKey]: id, dailyBudget: value }),
            });

            const data = await res.json();
            if (data.error) { setError(data.error); return; }

            setEditingBudget(null);
            setBudgetValue("");
            // Refresh data
            if (type === "campaigns") fetchData();
            else fetchAdSets();
        } catch { setError("Erro ao atualizar orçamento."); }
        finally { setUpdatingId(null); }
    };

    const fmt = (val: string | number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(val));
    const fmtNum = (val: number) => new Intl.NumberFormat("pt-BR").format(val);

    const filterByStatus = <T extends { status: string; name: string }>(items: T[]) =>
        items.filter(i =>
            (statusFilter === "ALL" || i.status === statusFilter) &&
            (!searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    // Not connected
    if (!loading && !connected) {
        return (
            <div className="space-y-6">
                <div><h1 className="text-3xl font-bold tracking-tight">Campanhas de Tráfego</h1></div>
                <div className="card max-w-2xl mx-auto mt-10 p-8 text-center space-y-4 border-dashed border-2">
                    <Settings className="h-10 w-10 text-blue-500 mx-auto" />
                    <h2 className="text-xl font-semibold">Configurar Integração</h2>
                    <p className="text-muted-foreground text-sm">Conecte sua conta Meta Ads em Configurações.</p>
                    <Link href="/configuracoes" className="btn btn-primary inline-flex"><Settings className="mr-2 h-4 w-4" />Configurações</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campanhas de Tráfego</h1>
                    <p className="text-muted-foreground text-sm">Gerencie campanhas, conjuntos e anúncios do Meta Ads.</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    if (activeTab === "campaigns") fetchData();
                    else if (activeTab === "adsets") fetchAdSets();
                    else fetchAds();
                }} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Atualizar
                </button>
            </div>

            {error && (
                <div className="card p-3 border-amber-500/50 bg-amber-500/5 flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-500">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-amber-500 hover:text-amber-400"><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* KPIs */}
            {insights && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <KpiCard label="Gastos" value={fmt(insights.spend)} color="text-rose-500" />
                    <KpiCard label="Receita" value={fmt(insights.revenue)} color="text-emerald-500" />
                    <KpiCard label="ROAS" value={`${insights.roas}x`} color={Number(insights.roas) >= 2 ? "text-emerald-500" : "text-amber-500"} />
                    <KpiCard label="Lucro" value={fmt(Number(insights.revenue) - Number(insights.spend))} color={Number(insights.revenue) - Number(insights.spend) >= 0 ? "text-emerald-500" : "text-rose-500"} />
                    <KpiCard label="CPA" value={fmt(insights.cpa)} color="text-blue-500" />
                    <KpiCard label="Vendas" value={String(insights.purchases)} color="text-purple-500" sub={`${fmtNum(insights.clicks)} cliques`} />
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
                {(["campaigns", "adsets", "ads"] as TabType[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px]",
                            activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                        {tab === "campaigns" ? `Campanhas (${campaigns.length})`
                            : tab === "adsets" ? `Conjuntos (${adSets.length})`
                                : `Anúncios (${ads.length})`}
                    </button>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-3 flex-wrap">
                <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="bg-background border border-border rounded-md px-3 py-1.5 text-sm w-64 focus:border-primary outline-none" />
                <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                    {STATUS_FILTERS.map(f => (
                        <button key={f.value} onClick={() => setStatusFilter(f.value)}
                            className={cn("px-2.5 py-1 text-xs rounded-md transition-colors",
                                statusFilter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 bg-secondary rounded-lg p-0.5 ml-auto">
                    {DATE_PRESETS.map(p => (
                        <button key={p.value} onClick={() => setDatePreset(p.value)}
                            className={cn("px-2 py-1 text-xs rounded-md transition-colors",
                                datePreset === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {activeTab === "campaigns" && <CampaignTable items={filterByStatus(campaigns)} fmt={fmt} fmtNum={fmtNum}
                        toggleStatus={(id, s) => toggleStatus(id, s, "campaigns")} updatingId={updatingId}
                        editingBudget={editingBudget} setEditingBudget={setEditingBudget}
                        budgetValue={budgetValue} setBudgetValue={setBudgetValue}
                        saveBudget={(id) => saveBudget(id, "campaigns")} />}

                    {activeTab === "adsets" && <AdSetTable items={filterByStatus(adSets)} fmt={fmt} fmtNum={fmtNum}
                        toggleStatus={(id, s) => toggleStatus(id, s, "adsets")} updatingId={updatingId}
                        editingBudget={editingBudget} setEditingBudget={setEditingBudget}
                        budgetValue={budgetValue} setBudgetValue={setBudgetValue}
                        saveBudget={(id) => saveBudget(id, "adsets")} />}

                    {activeTab === "ads" && <AdTable items={filterByStatus(ads)} fmt={fmt} fmtNum={fmtNum}
                        toggleStatus={(id, s) => toggleStatus(id, s, "ads")} updatingId={updatingId} />}
                </div>
            )}
        </div>
    );
}

function KpiCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
    return (
        <div className="card p-3">
            <div className="text-xs text-muted-foreground font-medium">{label}</div>
            <div className={cn("text-lg font-bold mt-0.5", color)}>{value}</div>
            {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
        </div>
    );
}

function StatusToggle({ status, onClick, loading }: { status: string; onClick: () => void; loading: boolean }) {
    const isActive = status === "ACTIVE";
    return (
        <button onClick={onClick} disabled={loading}
            className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0",
                isActive ? "bg-emerald-500" : "bg-zinc-600",
                loading && "opacity-50")}>
            <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                isActive ? "left-[22px]" : "left-0.5")} />
        </button>
    );
}

type TableProps = {
    fmt: (v: string | number) => string;
    fmtNum: (v: number) => string;
    toggleStatus: (id: string, status: string) => void;
    updatingId: string | null;
};

type BudgetProps = {
    editingBudget: string | null;
    setEditingBudget: (id: string | null) => void;
    budgetValue: string;
    setBudgetValue: (v: string) => void;
    saveBudget: (id: string) => void;
};

function CampaignTable({ items, fmt, fmtNum, toggleStatus, updatingId, editingBudget, setEditingBudget, budgetValue, setBudgetValue, saveBudget }: TableProps & BudgetProps & { items: Campaign[] }) {
    if (items.length === 0) return <EmptyState text="Nenhuma campanha encontrada." />;
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <th className="py-2 px-2 w-12"></th>
                    <th className="py-2 px-2 w-12">Status</th>
                    <th className="py-2 px-2">Campanha</th>
                    <th className="py-2 px-2 text-right">Orçamento</th>
                    <th className="py-2 px-2 text-right">Vendas</th>
                    <th className="py-2 px-2 text-right">CPA</th>
                    <th className="py-2 px-2 text-right">Gastos</th>
                    <th className="py-2 px-2 text-right">Receita</th>
                    <th className="py-2 px-2 text-right">ROAS</th>
                    <th className="py-2 px-2 text-right">Lucro</th>
                    <th className="py-2 px-2 text-right">Cliques</th>
                    <th className="py-2 px-2 text-right">CPM</th>
                </tr>
            </thead>
            <tbody>
                {items.map(c => {
                    const ins = c.insights;
                    const budget = c.daily_budget ? parseInt(c.daily_budget) / 100 : c.lifetime_budget ? parseInt(c.lifetime_budget) / 100 : null;
                    const spent = Number(ins?.spend || 0);
                    const rev = Number(ins?.revenue || 0);
                    const profit = rev - spent;

                    return (
                        <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                            <td className="py-2.5 px-2">
                                <a href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${c.id}`} target="_blank"
                                    className="text-muted-foreground hover:text-primary" title="Abrir no Gerenciador">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </td>
                            <td className="py-2.5 px-2">
                                <StatusToggle status={c.status} onClick={() => toggleStatus(c.id, c.status)} loading={updatingId === c.id} />
                            </td>
                            <td className="py-2.5 px-2">
                                <div className="font-medium truncate max-w-[200px]" title={c.name}>{c.name}</div>
                                <div className="text-[10px] text-muted-foreground">{c.status === "ACTIVE" ? "Ativo" : "Pausado"}</div>
                            </td>
                            <td className="py-2.5 px-2 text-right">
                                {editingBudget === c.id ? (
                                    <div className="flex items-center gap-1 justify-end">
                                        <input type="number" value={budgetValue} onChange={e => setBudgetValue(e.target.value)}
                                            className="w-20 bg-background border border-border rounded px-1.5 py-0.5 text-xs text-right" autoFocus />
                                        <button onClick={() => saveBudget(c.id)} className="text-emerald-500 hover:text-emerald-400"><Check className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => setEditingBudget(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => { setEditingBudget(c.id); setBudgetValue(budget?.toString() || ""); }}
                                        className="text-xs hover:text-primary transition-colors group flex items-center gap-1 justify-end w-full">
                                        {budget ? fmt(budget) : "—"}
                                        <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                )}
                            </td>
                            <td className="py-2.5 px-2 text-right font-medium">{ins?.purchases || 0}</td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmt(ins.cpa) : "—"}</td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmt(ins.spend) : "—"}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-500 font-medium">{ins ? fmt(ins.revenue) : "—"}</td>
                            <td className="py-2.5 px-2 text-right">
                                <span className={cn("font-bold", Number(ins?.roas || 0) >= 2 ? "text-emerald-500" : Number(ins?.roas || 0) >= 1 ? "text-amber-500" : "text-rose-500")}>
                                    {ins ? `${ins.roas}x` : "—"}
                                </span>
                            </td>
                            <td className={cn("py-2.5 px-2 text-right font-medium", profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {ins ? fmt(profit) : "—"}
                            </td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmtNum(ins.clicks) : "—"}</td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmt(Number(ins.spend) / (ins.impressions / 1000 || 1)) : "—"}</td>
                        </tr>
                    );
                })}
                {/* Totals Row */}
                <TotalsRow items={items.map(c => c.insights).filter(Boolean) as Insights[]} fmt={fmt} fmtNum={fmtNum} colCount={12} />
            </tbody>
        </table>
    );
}

function AdSetTable({ items, fmt, fmtNum, toggleStatus, updatingId, editingBudget, setEditingBudget, budgetValue, setBudgetValue, saveBudget }: TableProps & BudgetProps & { items: AdSet[] }) {
    if (items.length === 0) return <EmptyState text="Nenhum conjunto encontrado." />;
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <th className="py-2 px-2 w-12">Status</th>
                    <th className="py-2 px-2">Conjunto</th>
                    <th className="py-2 px-2 text-right">Orçamento</th>
                    <th className="py-2 px-2 text-right">Vendas</th>
                    <th className="py-2 px-2 text-right">CPA</th>
                    <th className="py-2 px-2 text-right">Gastos</th>
                    <th className="py-2 px-2 text-right">Receita</th>
                    <th className="py-2 px-2 text-right">ROAS</th>
                    <th className="py-2 px-2 text-right">Lucro</th>
                    <th className="py-2 px-2 text-right">Cliques</th>
                </tr>
            </thead>
            <tbody>
                {items.map(a => {
                    const ins = a.insights;
                    const budget = a.daily_budget || a.lifetime_budget;
                    const spent = Number(ins?.spend || 0);
                    const rev = Number(ins?.revenue || 0);
                    return (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-2.5 px-2">
                                <StatusToggle status={a.status} onClick={() => toggleStatus(a.id, a.status)} loading={updatingId === a.id} />
                            </td>
                            <td className="py-2.5 px-2">
                                <div className="font-medium truncate max-w-[200px]" title={a.name}>{a.name}</div>
                                <div className="text-[10px] text-muted-foreground">{a.status === "ACTIVE" ? "Ativo" : "Pausado"}</div>
                            </td>
                            <td className="py-2.5 px-2 text-right">
                                {editingBudget === a.id ? (
                                    <div className="flex items-center gap-1 justify-end">
                                        <input type="number" value={budgetValue} onChange={e => setBudgetValue(e.target.value)}
                                            className="w-20 bg-background border border-border rounded px-1.5 py-0.5 text-xs text-right" autoFocus />
                                        <button onClick={() => saveBudget(a.id)} className="text-emerald-500"><Check className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => setEditingBudget(null)} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => { setEditingBudget(a.id); setBudgetValue(budget?.toString() || ""); }}
                                        className="text-xs hover:text-primary group flex items-center gap-1 justify-end w-full">
                                        {budget ? fmt(budget) : "—"}
                                        <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
                                    </button>
                                )}
                            </td>
                            <td className="py-2.5 px-2 text-right font-medium">{ins?.purchases || 0}</td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmt(ins.cpa) : "—"}</td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmt(ins.spend) : "—"}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-500 font-medium">{ins ? fmt(ins.revenue) : "—"}</td>
                            <td className="py-2.5 px-2 text-right">
                                <span className={cn("font-bold", Number(ins?.roas || 0) >= 2 ? "text-emerald-500" : Number(ins?.roas || 0) >= 1 ? "text-amber-500" : "text-rose-500")}>
                                    {ins ? `${ins.roas}x` : "—"}
                                </span>
                            </td>
                            <td className={cn("py-2.5 px-2 text-right font-medium", rev - spent >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {ins ? fmt(rev - spent) : "—"}
                            </td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmtNum(ins.clicks) : "—"}</td>
                        </tr>
                    );
                })}
                <TotalsRow items={items.map(a => a.insights).filter(Boolean) as Insights[]} fmt={fmt} fmtNum={fmtNum} colCount={10} />
            </tbody>
        </table>
    );
}

function AdTable({ items, fmt, fmtNum, toggleStatus, updatingId }: TableProps & { items: Ad[] }) {
    if (items.length === 0) return <EmptyState text="Nenhum anúncio encontrado." />;
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <th className="py-2 px-2 w-12">Status</th>
                    <th className="py-2 px-2">Anúncio</th>
                    <th className="py-2 px-2 text-right">Vendas</th>
                    <th className="py-2 px-2 text-right">CPA</th>
                    <th className="py-2 px-2 text-right">Gastos</th>
                    <th className="py-2 px-2 text-right">Receita</th>
                    <th className="py-2 px-2 text-right">ROAS</th>
                    <th className="py-2 px-2 text-right">Lucro</th>
                    <th className="py-2 px-2 text-right">Cliques</th>
                    <th className="py-2 px-2 text-right">CTR</th>
                </tr>
            </thead>
            <tbody>
                {items.map(ad => {
                    const ins = ad.insights;
                    const spent = Number(ins?.spend || 0);
                    const rev = Number(ins?.revenue || 0);
                    return (
                        <tr key={ad.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-2.5 px-2">
                                <StatusToggle status={ad.status} onClick={() => toggleStatus(ad.id, ad.status)} loading={updatingId === ad.id} />
                            </td>
                            <td className="py-2.5 px-2">
                                <div className="font-medium truncate max-w-[200px]" title={ad.name}>{ad.name}</div>
                                <div className="text-[10px] text-muted-foreground">{ad.status === "ACTIVE" ? "Ativo" : "Pausado"}</div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-medium">{ins?.purchases || 0}</td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmt(ins.cpa) : "—"}</td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmt(ins.spend) : "—"}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-500 font-medium">{ins ? fmt(ins.revenue) : "—"}</td>
                            <td className="py-2.5 px-2 text-right">
                                <span className={cn("font-bold", Number(ins?.roas || 0) >= 2 ? "text-emerald-500" : Number(ins?.roas || 0) >= 1 ? "text-amber-500" : "text-rose-500")}>
                                    {ins ? `${ins.roas}x` : "—"}
                                </span>
                            </td>
                            <td className={cn("py-2.5 px-2 text-right font-medium", rev - spent >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {ins ? fmt(rev - spent) : "—"}
                            </td>
                            <td className="py-2.5 px-2 text-right">{ins ? fmtNum(ins.clicks) : "—"}</td>
                            <td className="py-2.5 px-2 text-right">{ins ? `${ins.ctr}%` : "—"}</td>
                        </tr>
                    );
                })}
                <TotalsRow items={items.map(a => a.insights).filter(Boolean) as Insights[]} fmt={fmt} fmtNum={fmtNum} colCount={10} />
            </tbody>
        </table>
    );
}

function TotalsRow({ items, fmt, fmtNum, colCount }: { items: Insights[]; fmt: (v: string | number) => string; fmtNum: (v: number) => string; colCount: number }) {
    if (items.length === 0) return null;
    const totals = items.reduce((acc, ins) => ({
        spend: acc.spend + Number(ins.spend),
        revenue: acc.revenue + Number(ins.revenue),
        purchases: acc.purchases + ins.purchases,
        clicks: acc.clicks + ins.clicks,
        impressions: acc.impressions + ins.impressions,
    }), { spend: 0, revenue: 0, purchases: 0, clicks: 0, impressions: 0 });

    const profit = totals.revenue - totals.spend;
    const roas = totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : "0.00";
    const cpa = totals.purchases > 0 ? (totals.spend / totals.purchases).toFixed(2) : "0.00";

    const hasExtraCol = colCount === 12;

    return (
        <tr className="bg-secondary/50 font-bold text-xs border-t-2 border-border">
            {hasExtraCol && <td className="py-2.5 px-2"></td>}
            <td className="py-2.5 px-2"></td>
            <td className="py-2.5 px-2">TOTAL ({items.length})</td>
            <td className="py-2.5 px-2 text-right">—</td>
            <td className="py-2.5 px-2 text-right">{totals.purchases}</td>
            <td className="py-2.5 px-2 text-right">{fmt(cpa)}</td>
            <td className="py-2.5 px-2 text-right">{fmt(totals.spend)}</td>
            <td className="py-2.5 px-2 text-right text-emerald-500">{fmt(totals.revenue)}</td>
            <td className="py-2.5 px-2 text-right">
                <span className={cn(Number(roas) >= 2 ? "text-emerald-500" : Number(roas) >= 1 ? "text-amber-500" : "text-rose-500")}>{roas}x</span>
            </td>
            <td className={cn("py-2.5 px-2 text-right", profit >= 0 ? "text-emerald-500" : "text-rose-500")}>{fmt(profit)}</td>
            <td className="py-2.5 px-2 text-right">{fmtNum(totals.clicks)}</td>
            {hasExtraCol && <td className="py-2.5 px-2 text-right">—</td>}
        </tr>
    );
}

function EmptyState({ text }: { text: string }) {
    return <div className="text-center py-12 text-muted-foreground text-sm">{text}</div>;
}
