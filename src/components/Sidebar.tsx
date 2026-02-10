"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    KeyRound,
    Wallet,
    CheckSquare,
    ShoppingBag,
    BarChart3,
    Pickaxe,
    Settings,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Acessos", href: "/acessos", icon: KeyRound },
    { name: "Financeiro", href: "/financeiro", icon: Wallet },
    { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
    { name: "Produtos", href: "/produtos", icon: ShoppingBag },
    { name: "Campanhas", href: "/campanhas", icon: BarChart3 },
    { name: "Mineração", href: "/mineracao", icon: Pickaxe },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="sidebar">
            <div className="mb-8 px-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    SISTEMA INFO
                </h1>
                <p className="text-xs text-muted-foreground">Central de Operações</p>
            </div>

            <nav className="space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-4 border-t border-border space-y-1">
                <Link
                    href="/configuracoes"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground rounded-md"
                >
                    <Settings className="h-5 w-5" />
                    Configurações
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-md w-full transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Sair
                </button>
            </div>
        </div>
    );
}

