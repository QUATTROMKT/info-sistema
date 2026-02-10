"use client";

import { useState, useEffect } from "react";
import { Loader2, Lock, Mail, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "register" | "checking">("checking");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if any user exists to determine login vs register mode
    useEffect(() => {
        async function check() {
            try {
                const res = await fetch("/api/auth/register", { method: "HEAD" }).catch(() => null);
                // If we can't check, default to login
                setMode("login");
            } catch {
                setMode("login");
            }
        }
        check();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
            const body = mode === "register"
                ? { email, password, name }
                : { email, password };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.error) {
                if (data.error.includes("Registro desabilitado")) {
                    setMode("login");
                    setError("Conta admin já existe. Faça login.");
                } else {
                    setError(data.error);
                }
                return;
            }

            if (data.success) {
                router.push("/");
                router.refresh();
            }
        } catch {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (mode === "checking") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/5 rounded-full blur-[128px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">SISTEMA INFO</h1>
                    <p className="text-sm text-zinc-500 mt-1">Central de Operações</p>
                </div>

                {/* Card */}
                <div className="bg-[#111118] border border-zinc-800/50 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-1">
                        {mode === "register" ? "Criar conta admin" : "Entrar"}
                    </h2>
                    <p className="text-sm text-zinc-500 mb-6">
                        {mode === "register"
                            ? "Configure seu primeiro acesso ao sistema."
                            : "Insira suas credenciais para acessar o painel."}
                    </p>

                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                            <p className="text-sm text-rose-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "register" && (
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Seu nome" required
                                        className="w-full bg-[#0a0a12] border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors" />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com" required autoComplete="email"
                                    className="w-full bg-[#0a0a12] border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"} required
                                    minLength={mode === "register" ? 6 : 1} autoComplete={mode === "register" ? "new-password" : "current-password"}
                                    className="w-full bg-[#0a0a12] border border-zinc-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-6">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {mode === "register" ? "Criar conta" : "Entrar"}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <div className="mt-6 text-center">
                        <button onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(null); }}
                            className="text-xs text-zinc-500 hover:text-blue-400 transition-colors">
                            {mode === "register"
                                ? "Já tem uma conta? Faça login"
                                : "Primeiro acesso? Criar conta admin"}
                        </button>
                    </div>
                </div>

                <p className="text-center text-[10px] text-zinc-600 mt-6">
                    QUATTRO MKT © 2026 · Todos os direitos reservados
                </p>
            </div>
        </div>
    );
}
