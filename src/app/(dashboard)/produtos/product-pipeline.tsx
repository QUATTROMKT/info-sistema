"use client";

import { useState } from "react";
import { Plus, ExternalLink, Trash, Rocket, Search, Monitor, PenTool } from "lucide-react";
import { createProduct, deleteProduct, updateProductStatus } from "./actions";
import { cn } from "@/lib/utils";

type Product = {
    id: string;
    name: string;
    plataform: string | null;
    status: string; // MINING, VALIDATING, SCALING, PAUSED
    driveLink: string | null;
    miroLink: string | null;
    notionLink: string | null;
};

export function ProductPipeline({
    initialProducts,
    createAction,
    deleteAction,
    updateStatusAction
}: {
    initialProducts: Product[],
    createAction: (formData: FormData) => Promise<void>,
    deleteAction: (id: string) => Promise<void>,
    updateStatusAction: (id: string, status: string) => Promise<void>
}) {
    const [showForm, setShowForm] = useState(false);

    const miningProducts = initialProducts.filter(p => p.status === "MINING");
    const validatingProducts = initialProducts.filter(p => p.status === "VALIDATING");
    const scalingProducts = initialProducts.filter(p => p.status === "SCALING");

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Esteira de Produtos</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Produto
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
                    <h3 className="font-semibold text-lg">Novo Produto</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-sm font-medium">Nome do Produto</label>
                            <input name="name" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="Nome da oferta" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Plataforma</label>
                            <input name="plataform" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="Ex: Hotmart, Kiwify" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status Inicial</label>
                            <select name="status" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                                <option value="MINING">Mineração</option>
                                <option value="VALIDATING">Validação</option>
                                <option value="SCALING">Escala</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><Monitor className="h-3 w-3" /> Link Drive</label>
                            <input name="driveLink" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://drive.google.com..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><PenTool className="h-3 w-3" /> Link Miro</label>
                            <input name="miroLink" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://miro.com..." />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><ExternalLink className="h-3 w-3" /> Link Notion/Outros</label>
                            <input name="notionLink" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="https://notion.so..." />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-md hover:bg-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                    </div>
                </form>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Mining Column */}
                <div className="bg-secondary/10 border border-dashed border-border rounded-lg p-4 h-full flex flex-col">
                    <h3 className="font-semibold mb-4 text-center border-b border-border pb-2">MINERAÇÃO ({miningProducts.length})</h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {miningProducts.map(product => (
                            <ProductCard key={product.id} product={product} deleteAction={deleteAction} updateStatusAction={updateStatusAction} />
                        ))}
                    </div>
                </div>

                {/* Validating Column */}
                <div className="bg-secondary/10 border border-dashed border-border rounded-lg p-4 h-full flex flex-col">
                    <h3 className="font-semibold mb-4 text-center border-b border-border pb-2 text-blue-500">VALIDAÇÃO ({validatingProducts.length})</h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {validatingProducts.map(product => (
                            <ProductCard key={product.id} product={product} deleteAction={deleteAction} updateStatusAction={updateStatusAction} />
                        ))}
                    </div>
                </div>

                {/* Scaling Column */}
                <div className="bg-secondary/10 border border-dashed border-border rounded-lg p-4 h-full flex flex-col">
                    <h3 className="font-semibold mb-4 text-center border-b border-border pb-2 text-purple-500">ESCALA ({scalingProducts.length})</h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {scalingProducts.map(product => (
                            <ProductCard key={product.id} product={product} deleteAction={deleteAction} updateStatusAction={updateStatusAction} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProductCard({ product, deleteAction, updateStatusAction }: { product: Product, deleteAction: any, updateStatusAction: any }) {
    return (
        <div className="card p-4 space-y-3 hover:border-primary/50 transition-colors group relative">
            <div className="flex justify-between items-start">
                <div className="font-semibold text-base">{product.name}</div>
                <button
                    onClick={() => deleteAction(product.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                >
                    <Trash className="h-4 w-4" />
                </button>
            </div>

            <div className="text-xs text-muted-foreground">{product.plataform || "Plataforma não definida"}</div>

            <div className="flex gap-2 py-2">
                {product.driveLink && (
                    <a href={product.driveLink} target="_blank" className="p-1.5 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20" title="Drive">
                        <Monitor className="h-4 w-4" />
                    </a>
                )}
                {product.miroLink && (
                    <a href={product.miroLink} target="_blank" className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded hover:bg-yellow-500/20" title="Miro">
                        <PenTool className="h-4 w-4" />
                    </a>
                )}
                {product.notionLink && (
                    <a href={product.notionLink} target="_blank" className="p-1.5 bg-gray-500/10 text-gray-400 rounded hover:bg-gray-500/20" title="Notion">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                )}
            </div>

            <div className="flex justify-end gap-1 mt-2 border-t border-border/50 pt-2">
                {product.status === "MINING" && (
                    <button onClick={() => updateStatusAction(product.id, "VALIDATING")} className="text-xs flex items-center gap-1 text-primary hover:underline">
                        Validar <Rocket className="h-3 w-3" />
                    </button>
                )}
                {product.status === "VALIDATING" && (
                    <button onClick={() => updateStatusAction(product.id, "SCALING")} className="text-xs flex items-center gap-1 text-indigo-400 hover:underline">
                        Escalar <Rocket className="h-3 w-3" />
                    </button>
                )}
                {product.status !== "MINING" && (
                    <button onClick={() => updateStatusAction(product.id, "MINING")} className="text-xs text-muted-foreground hover:underline mr-auto">
                        Voltar
                    </button>
                )}
            </div>
        </div>
    )
}
