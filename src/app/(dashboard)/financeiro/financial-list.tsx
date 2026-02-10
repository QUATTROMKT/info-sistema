"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Calendar, CheckCircle2, Circle, Trash } from "lucide-react";
import { createFinancialRecord, deleteFinancialRecord, toggleFinancialStatus } from "./actions";
import { cn } from "@/lib/utils";

type FinancialRecord = {
    id: string;
    type: string;
    amount: number;
    description: string;
    category: string | null;
    status: string;
    dueDate: Date | null;
};

export function FinancialList({
    initialRecords,
    createAction,
    deleteAction,
    toggleStatusAction
}: {
    initialRecords: FinancialRecord[],
    createAction: (formData: FormData) => Promise<void>,
    deleteAction: (id: string) => Promise<void>,
    toggleStatusAction: (id: string, status: string) => Promise<void>
}) {
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState("ALL"); // ALL, INCOME, EXPENSE

    const filteredRecords = initialRecords.filter(r => {
        if (filter === "ALL") return true;
        return r.type === filter;
    });

    const totalIncome = initialRecords
        .filter(r => r.type === "INCOME" && r.status === "PAID")
        .reduce((acc, r) => acc + r.amount, 0);

    const totalExpense = initialRecords
        .filter(r => r.type === "EXPENSE" && r.status === "PAID") // Or include pending based on requirement, usually cash flow is paid only
        .reduce((acc, r) => acc + r.amount, 0);

    const pendingPayables = initialRecords
        .filter(r => r.type === "EXPENSE" && r.status === "PENDING")
        .reduce((acc, r) => acc + r.amount, 0);

    return (
        <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-emerald-500/10 border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Entradas (Recebido)</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
                    </div>
                </div>
                <div className="card bg-rose-500/10 border-rose-500/20">
                    <div className="flex items-center gap-2 text-rose-500 mb-2">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-sm font-medium">Saídas (Pago)</span>
                    </div>
                    <div className="text-2xl font-bold text-rose-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                    </div>
                </div>
                <div className="card bg-amber-500/10 border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Contas a Pagar (Pendente)</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingPayables)}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter("ALL")}
                        className={cn("px-3 py-1.5 text-sm rounded-md transition-colors", filter === "ALL" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter("INCOME")}
                        className={cn("px-3 py-1.5 text-sm rounded-md transition-colors", filter === "INCOME" ? "bg-emerald-500/20 text-emerald-500" : "bg-secondary text-muted-foreground hover:text-foreground")}
                    >
                        Entradas
                    </button>
                    <button
                        onClick={() => setFilter("EXPENSE")}
                        className={cn("px-3 py-1.5 text-sm rounded-md transition-colors", filter === "EXPENSE" ? "bg-rose-500/20 text-rose-500" : "bg-secondary text-muted-foreground hover:text-foreground")}
                    >
                        Saídas
                    </button>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Lançamento
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
                    <h3 className="font-semibold text-lg">Adicionar Movimentação</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-sm font-medium">Descrição</label>
                            <input name="description" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="Ex: Pagamento Ferramenta X" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Valor (R$)</label>
                            <input name="amount" type="number" step="0.01" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="0,00" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Tipo</label>
                            <select name="type" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                                <option value="EXPENSE">Saída (Despesa)</option>
                                <option value="INCOME">Entrada (Receita)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Vencimento / Data</label>
                            <input name="dueDate" type="date" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status Inicial</label>
                            <select name="status" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                                <option value="PENDING">Pendente</option>
                                <option value="PAID">Pago / Recebido</option>
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-sm font-medium">Categoria</label>
                            <input name="category" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="Ex: Ferramentas, Tráfego, Pessoal" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-md hover:bg-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {filteredRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => toggleStatusAction(record.id, record.status)}
                                className={cn("transition-colors", record.status === "PAID" ? "text-emerald-500" : "text-muted-foreground hover:text-foreground")}
                            >
                                {record.status === "PAID" ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </button>
                            <div>
                                <div className="font-medium text-base">{record.description}</div>
                                <div className="text-xs text-muted-foreground flex gap-2">
                                    <span>{record.category || "Geral"}</span>
                                    <span>•</span>
                                    <span>{record.dueDate ? new Date(record.dueDate).toLocaleDateString('pt-BR') : "Sem data"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={cn("font-bold", record.type === "INCOME" ? "text-emerald-500" : "text-foreground")}>
                                {record.type === "EXPENSE" ? "- " : "+ "}
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.amount)}
                            </div>
                            <button
                                onClick={() => deleteAction(record.id)}
                                className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                            >
                                <Trash className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredRecords.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        Nenhum registro encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
