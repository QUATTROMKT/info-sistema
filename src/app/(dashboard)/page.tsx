import { prisma } from "@/lib/prisma";
import { KeyRound, Wallet, CheckSquare, ShoppingBag, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    // Fetch real data from the database
    const [
        pendingExpenses,
        totalIncome,
        totalExpense,
        taskCount,
        pendingTasks,
        highPriorityTasks,
        scalingProducts,
        miningProducts,
        credentialCount,
        recentTasks,
        recentFinancials,
    ] = await Promise.all([
        prisma.financialRecord.aggregate({
            _sum: { amount: true },
            where: { type: "EXPENSE", status: "PENDING" },
        }),
        prisma.financialRecord.aggregate({
            _sum: { amount: true },
            where: { type: "INCOME", status: "PAID" },
        }),
        prisma.financialRecord.aggregate({
            _sum: { amount: true },
            where: { type: "EXPENSE", status: "PAID" },
        }),
        prisma.task.count(),
        prisma.task.count({ where: { status: { not: "DONE" } } }),
        prisma.task.count({ where: { priority: "HIGH", status: { not: "DONE" } } }),
        prisma.product.count({ where: { status: "SCALING" } }),
        prisma.product.count({ where: { status: "MINING" } }),
        prisma.credential.count(),
        prisma.task.findMany({ take: 5, orderBy: { createdAt: "desc" }, where: { status: { not: "DONE" } } }),
        prisma.financialRecord.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    ]);

    const formatCurrency = (val: number | null) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

    const balance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Visão geral da sua operação</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/financeiro" className="card hover:border-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Contas a Pagar</span>
                        <Wallet className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-amber-500">{formatCurrency(pendingExpenses._sum.amount)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Saldo: <span className={balance >= 0 ? "text-emerald-500" : "text-rose-500"}>{formatCurrency(balance)}</span>
                    </p>
                </Link>

                <Link href="/produtos" className="card hover:border-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Produtos em Escala</span>
                        <ShoppingBag className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold">{scalingProducts}</div>
                    <p className="text-xs text-muted-foreground mt-1">{miningProducts} em mineração</p>
                </Link>

                <Link href="/tarefas" className="card hover:border-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Tarefas Pendentes</span>
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">{pendingTasks}</div>
                    <p className="text-xs text-muted-foreground mt-1">{highPriorityTasks} alta prioridade</p>
                </Link>

                <Link href="/acessos" className="card hover:border-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Acessos Salvos</span>
                        <KeyRound className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="text-2xl font-bold">{credentialCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Logins e senhas</p>
                </Link>
            </div>

            {/* Two-column layout */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Tasks */}
                <div className="card col-span-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Tarefas Recentes</h3>
                        <Link href="/tarefas" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Ver todas <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {recentTasks.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            Nenhuma tarefa pendente. 🎉
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-2.5 hover:bg-secondary rounded-md transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${task.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-slate-500"}`}></span>
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">{task.title}</div>
                                            <div className="text-xs text-muted-foreground">{task.assignee || "Sem responsável"}</div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${task.priority === "HIGH" ? "bg-red-500/20 text-red-500" :
                                            task.priority === "MEDIUM" ? "bg-yellow-500/20 text-yellow-500" :
                                                "bg-blue-500/20 text-blue-500"
                                        }`}>
                                        {task.priority === "HIGH" ? "Alta" : task.priority === "MEDIUM" ? "Média" : "Baixa"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Financial */}
                <div className="card col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Movimentações Recentes</h3>
                        <Link href="/financeiro" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Ver todas <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {recentFinancials.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            Nenhuma movimentação registrada.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentFinancials.map((record) => (
                                <div key={record.id} className="flex items-center justify-between p-2.5 hover:bg-secondary rounded-md transition-colors">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">{record.description}</div>
                                        <div className="text-xs text-muted-foreground">{record.category || "Geral"}</div>
                                    </div>
                                    <div className={`font-bold text-sm shrink-0 ${record.type === "INCOME" ? "text-emerald-500" : ""}`}>
                                        {record.type === "EXPENSE" ? "- " : "+ "}
                                        {formatCurrency(record.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div className="card">
                <h3 className="font-semibold mb-4">Acesso Rápido</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link href="/campanhas" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium">Campanhas</span>
                    </Link>
                    <Link href="/tarefas" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                        <CheckSquare className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm font-medium">Tarefas</span>
                    </Link>
                    <Link href="/financeiro" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                        <Wallet className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-medium">Financeiro</span>
                    </Link>
                    <Link href="/acessos" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                        <KeyRound className="h-5 w-5 text-indigo-500" />
                        <span className="text-sm font-medium">Acessos</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
