"use client";

import { useState } from "react";
import { Save, Trash, ToggleLeft, ToggleRight, Shield, ExternalLink, Eye, EyeOff, Plus, Sparkles, X } from "lucide-react";
import { saveIntegration, toggleIntegration, deleteIntegration, addAdAccount, removeAdAccount } from "./actions";
import { cn } from "@/lib/utils";

type Integration = {
    id: string;
    platform: string;
    apiKey: string | null;
    apiSecret: string | null;
    accountId: string | null;
    isActive: boolean;
};

type AdAccountType = {
    id: string;
    name: string;
    accountId: string;
    isActive: boolean;
};

const PLATFORMS = [
    {
        id: "FACEBOOK",
        name: "Meta Ads (Facebook/Instagram)",
        description: "Monitore campanhas, gastos e ROAS do Facebook e Instagram Ads.",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        fields: [
            { name: "apiKey", label: "Access Token", placeholder: "EAAxxxxxxx...", type: "password" },
        ],
        helpUrl: "https://developers.facebook.com/tools/explorer/",
    },
    {
        id: "OPENAI",
        name: "OpenAI (IA)",
        description: "Habilite geração de copy e análise de anúncios com inteligência artificial.",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        fields: [
            { name: "apiKey", label: "API Key", placeholder: "sk-...", type: "password" },
        ],
        helpUrl: "https://platform.openai.com/api-keys",
    },
    {
        id: "GOOGLE",
        name: "Google Ads",
        description: "Conecte ao Google Ads para monitorar campanhas de pesquisa e display.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        fields: [
            { name: "apiKey", label: "API Key / Token", placeholder: "AIza...", type: "password" },
            { name: "accountId", label: "Customer ID", placeholder: "123-456-7890", type: "text" },
        ],
        helpUrl: "https://ads.google.com",
    },
];

export function SettingsPanel({ initialIntegrations, initialAdAccounts }: {
    initialIntegrations: Integration[];
    initialAdAccounts: AdAccountType[];
}) {
    const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
    const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
    const [adAccounts, setAdAccounts] = useState<AdAccountType[]>(initialAdAccounts);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [addingAccount, setAddingAccount] = useState(false);

    const toggleTokenVisibility = (platformId: string) => {
        setVisibleTokens(prev => ({ ...prev, [platformId]: !prev[platformId] }));
    };

    const getIntegration = (platform: string) =>
        initialIntegrations.find(i => i.platform === platform);

    const handleRemoveAccount = async (id: string) => {
        await removeAdAccount(id);
        setAdAccounts(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="space-y-8">
            {/* Integration Cards */}
            {PLATFORMS.map((platform) => {
                const integration = getIntegration(platform.id);
                const isConnected = integration?.isActive && integration?.apiKey;

                return (
                    <div key={platform.id} className="card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", platform.bgColor)}>
                                    {platform.id === "OPENAI"
                                        ? <Sparkles className={cn("h-5 w-5", platform.color)} />
                                        : <Shield className={cn("h-5 w-5", platform.color)} />
                                    }
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{platform.name}</h3>
                                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isConnected && (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Conectado
                                    </span>
                                )}
                                {integration && (
                                    <>
                                        <button
                                            onClick={() => toggleIntegration(integration.id, integration.isActive)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            title={integration.isActive ? "Desativar" : "Ativar"}
                                        >
                                            {integration.isActive
                                                ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                                                : <ToggleLeft className="h-6 w-6" />
                                            }
                                        </button>
                                        <button
                                            onClick={() => deleteIntegration(integration.id)}
                                            className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                            title="Remover integração"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <form
                            action={async (formData) => {
                                setSavingPlatform(platform.id);
                                formData.set("platform", platform.id);
                                await saveIntegration(formData);
                                setSavingPlatform(null);
                            }}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {platform.fields.map((field) => (
                                    <div key={field.name} className="space-y-1.5">
                                        <label className="text-sm font-medium flex items-center justify-between">
                                            {field.label}
                                            {field.type === "password" && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleTokenVisibility(platform.id)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {visibleTokens[platform.id]
                                                        ? <EyeOff className="h-3.5 w-3.5" />
                                                        : <Eye className="h-3.5 w-3.5" />
                                                    }
                                                </button>
                                            )}
                                        </label>
                                        <input
                                            name={field.name}
                                            type={field.type === "password" && !visibleTokens[platform.id] ? "password" : "text"}
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
                                            placeholder={field.placeholder}
                                            defaultValue={
                                                field.name === "apiKey"
                                                    ? integration?.apiKey || ""
                                                    : integration?.accountId || ""
                                            }
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <a
                                    href={platform.helpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Como obter o token?
                                </a>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={savingPlatform === platform.id}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {savingPlatform === platform.id ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>

                        {/* Ad Accounts Section — only for FACEBOOK */}
                        {platform.id === "FACEBOOK" && integration?.isActive && (
                            <div className="border-t border-border pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold">Contas de Anúncios</h4>
                                        <p className="text-xs text-muted-foreground">Gerencie múltiplas contas para ver campanhas.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddAccount(!showAddAccount)}
                                        className="btn text-xs px-3 py-1.5 border border-border bg-secondary text-foreground hover:bg-secondary/80"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />Adicionar Conta
                                    </button>
                                </div>

                                {/* Add Account Form */}
                                {showAddAccount && (
                                    <form
                                        action={async (formData) => {
                                            setAddingAccount(true);
                                            await addAdAccount(formData);
                                            setAddingAccount(false);
                                            setShowAddAccount(false);
                                            // Refresh page to get new accounts
                                            window.location.reload();
                                        }}
                                        className="flex items-end gap-3 bg-secondary/30 rounded-lg p-3"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Apelido</label>
                                            <input name="name" required placeholder="Ex: Conta Principal"
                                                className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:border-primary outline-none" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Account ID</label>
                                            <input name="accountId" required placeholder="act_123456789"
                                                className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:border-primary outline-none" />
                                        </div>
                                        <button type="submit" disabled={addingAccount}
                                            className="btn btn-primary text-xs px-4 py-1.5 shrink-0">
                                            {addingAccount ? "..." : "Salvar"}
                                        </button>
                                        <button type="button" onClick={() => setShowAddAccount(false)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground shrink-0">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </form>
                                )}

                                {/* Account List */}
                                {adAccounts.length > 0 ? (
                                    <div className="space-y-2">
                                        {adAccounts.map(acc => (
                                            <div key={acc.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-4 py-2.5">
                                                <div>
                                                    <span className="text-sm font-medium">{acc.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">{acc.accountId}</span>
                                                </div>
                                                <button onClick={() => handleRemoveAccount(acc.id)}
                                                    className="p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Remover">
                                                    <Trash className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">
                                        Nenhuma conta adicionada. {integration?.accountId && `Usando conta padrão: ${integration.accountId}`}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Info Card */}
            <div className="card p-6 border-dashed border-2 border-border/50">
                <h3 className="font-semibold mb-2">📋 Como integrar o Meta Ads</h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Acesse <a href="https://developers.facebook.com/apps" target="_blank" className="text-primary hover:underline">developers.facebook.com</a> e crie/selecione um App</li>
                    <li>Vá em <strong className="text-foreground">Tools → Graph API Explorer</strong></li>
                    <li>Selecione seu App e adicione as permissões: <code className="bg-secondary px-1 rounded text-xs">ads_read</code></li>
                    <li>Gere um <strong className="text-foreground">User Token</strong> e estenda para Long-Lived (60 dias)</li>
                    <li>Copie o <strong className="text-foreground">Access Token</strong> e salve acima</li>
                    <li>Adicione suas contas de anúncios na seção <strong className="text-foreground">Contas de Anúncios</strong></li>
                </ol>
            </div>
        </div>
    );
}
