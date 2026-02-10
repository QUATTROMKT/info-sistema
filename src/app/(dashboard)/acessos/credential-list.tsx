"use client";

import { useState } from "react";
import { Plus, Eye, EyeOff, Copy, Trash, ExternalLink, Search } from "lucide-react";
import { createCredential, deleteCredential } from "./actions"; // Import server actions
import { cn } from "@/lib/utils";

// Define the type since we don't have generated types on client easily without import
type Credential = {
    id: string;
    service: string;
    username: string | null;
    password?: string | null;
    url: string | null;
    category: string | null;
    createdAt: Date;
};

export function CredentialList({
    initialCredentials,
    createAction,
    deleteAction
}: {
    initialCredentials: Credential[],
    createAction: (formData: FormData) => Promise<void>,
    deleteAction: (id: string) => Promise<void>
}) {
    const [credentials, setCredentials] = useState(initialCredentials);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    // We need to re-fetch or optimistically update, but server actions with revalidatePath usually handle it if we wrapped in transition.
    // For simplicity, we just reload or rely on nextjs router refresh if we used router.
    // Actually initialCredentials come from server component, so checking if they update automatically
    // might require useOptimistic or router.refresh().
    // Let's keep it simple: just list them for now. 
    // Wait, initialCredentials won't update on client unless we do router.refresh() after action.

    // Actually, better to just use the prop and let parent re-render?
    // Next.js server actions revalidatePath SHOULD trigger a re-render of the server component and send new data.
    // So initialCredentials prop will update.
    // We need to sync state with props.
    // Or just use props directly if we don't need local state for the list (except search).

    const filteredCredentials = initialCredentials.filter(c =>
        c.service.toLowerCase().includes(search.toLowerCase()) ||
        (c.username && c.username.toLowerCase().includes(search.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(search.toLowerCase()))
    );

    const togglePassword = (id: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show toast here
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar acessos..."
                        className="w-full bg-secondary text-foreground text-sm pl-9 pr-4 py-2 rounded-md outline-none border border-transparent focus:border-primary transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Acesso
                </button>
            </div>

            {showForm && (
                <form
                    action={async (formData) => {
                        await createAction(formData);
                        setShowForm(false);
                    }}
                    className="card p-4 space-y-4 mb-6 border-primary/50"
                >
                    <h3 className="font-semibold text-lg">Adicionar Novo Acesso</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Serviço / Plataforma</label>
                            <input name="service" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="Ex: Hotmart" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Categoria</label>
                            <input name="category" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="Ex: Ferramentas" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Login / Email</label>
                            <input name="username" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Senha</label>
                            <input name="password" type="text" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-sm font-medium">URL de login</label>
                            <input name="url" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://..." />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-md hover:bg-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCredentials.map((cred) => (
                    <div key={cred.id} className="card relative group hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                    {cred.service.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base">{cred.service}</h3>
                                    <p className="text-xs text-muted-foreground">{cred.category || "Geral"}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {cred.url && (
                                    <a href={cred.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                                <button
                                    onClick={() => deleteAction(cred.id)}
                                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <div className="flex items-center justify-between text-sm bg-secondary/50 p-2 rounded">
                                <span className="text-muted-foreground text-xs">Login:</span>
                                <div className="flex items-center gap-2 truncate max-w-[150px]">
                                    <span className="truncate">{cred.username || "-"}</span>
                                    {cred.username && (
                                        <button onClick={() => copyToClipboard(cred.username!)}><Copy className="h-3 w-3 hover:text-primary" /></button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm bg-secondary/50 p-2 rounded">
                                <span className="text-muted-foreground text-xs">Senha:</span>
                                <div className="flex items-center gap-2">
                                    <span>
                                        {visiblePasswords[cred.id] ? cred.password : "••••••••"}
                                    </span>
                                    <button onClick={() => togglePassword(cred.id)}>
                                        {visiblePasswords[cred.id] ? <EyeOff className="h-3 w-3 hover:text-primary" /> : <Eye className="h-3 w-3 hover:text-primary" />}
                                    </button>
                                    {cred.password && (
                                        <button onClick={() => copyToClipboard(cred.password!)}><Copy className="h-3 w-3 hover:text-primary" /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCredentials.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    Nenhum acesso encontrado. Crie o primeiro!
                </div>
            )}
        </div>
    );
}
