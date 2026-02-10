import { Card } from "@/components/ui/card"; // We need to create this wrapper or just use div for now
// I'll use raw divs with classes since I haven't created the ui components yet, effectively implementing the card design.

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                {/* Date or other info can go here */}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Statistics Cards */}
                <div className="card">
                    <div className="text-sm font-medium text-muted-foreground">Contas a Pagar (Semana)</div>
                    <div className="text-2xl font-bold mt-2">R$ 1.250,00</div>
                    <p className="text-xs text-muted-foreground mt-1">+20% desde o mês passado</p>
                </div>
                <div className="card">
                    <div className="text-sm font-medium text-muted-foreground">Produtos em Escala</div>
                    <div className="text-2xl font-bold mt-2">3</div>
                    <p className="text-xs text-muted-foreground mt-1">2 novos minerados</p>
                </div>
                <div className="card">
                    <div className="text-sm font-medium text-muted-foreground">Tarefas Pendentes</div>
                    <div className="text-2xl font-bold mt-2">12</div>
                    <p className="text-xs text-muted-foreground mt-1">4 alta prioridade</p>
                </div>
                <div className="card">
                    <div className="text-sm font-medium text-muted-foreground">Investimento (Ads)</div>
                    <div className="text-2xl font-bold mt-2">R$ 4.320,00</div>
                    <p className="text-xs text-muted-foreground mt-1">ROI Atual: 2.1x</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="card col-span-4">
                    <h3 className="font-semibold mb-4">Campanhas Recentes</h3>
                    <div className="h-[200px] flex items-center justify-center border rounded border-dashed border-muted text-muted-foreground">
                        Gráfico de Desempenho (Em Breve)
                    </div>
                </div>
                <div className="card col-span-3">
                    <h3 className="font-semibold mb-4">Acesso Rápido</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 hover:bg-secondary rounded cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>Google Drive</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Ver pasta</span>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-secondary rounded cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span>Miro Board</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Abrir</span>
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-secondary rounded cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                <span>Hotmart</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Login</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
