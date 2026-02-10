"use client";

import { useState } from "react";
import { Plus, GripVertical, Trash, CheckCircle2, Circle } from "lucide-react";
import { createTask, deleteTask, updateTaskStatus } from "./actions";
import { cn } from "@/lib/utils";

type Task = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    assignee: string | null;
};

export function TaskBoard({
    initialTasks,
    createAction,
    deleteAction,
    updateStatusAction
}: {
    initialTasks: Task[],
    createAction: (formData: FormData) => Promise<void>,
    deleteAction: (id: string) => Promise<void>,
    updateStatusAction: (id: string, status: string) => Promise<void>
}) {
    const [showForm, setShowForm] = useState(false);

    // Group tasks by status
    const todoTasks = initialTasks.filter(t => t.status === "TODO");
    const inProgressTasks = initialTasks.filter(t => t.status === "IN_PROGRESS");
    const doneTasks = initialTasks.filter(t => t.status === "DONE");

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Quadro de Tarefas</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Tarefa
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
                    <h3 className="font-semibold text-lg">Nova Tarefa</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-sm font-medium">Título</label>
                            <input name="title" required className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="O que precisa ser feito?" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Prioridade</label>
                            <select name="priority" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                                <option value="LOW">Baixa</option>
                                <option value="MEDIUM">Média</option>
                                <option value="HIGH">Alta</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Responsável</label>
                            <input name="assignee" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="Quem vai fazer?" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-sm font-medium">Descrição</label>
                            <textarea name="description" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" rows={3} placeholder="Detalhes da tarefa..." />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-md hover:bg-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                    </div>
                </form>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* To Do Column */}
                <div className="flex flex-col bg-secondary/30 rounded-lg p-4 h-full">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                        A Fazer ({todoTasks.length})
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {todoTasks.map(task => (
                            <TaskCard key={task.id} task={task} deleteAction={deleteAction} updateStatusAction={updateStatusAction} />
                        ))}
                    </div>
                </div>

                {/* In Progress Column */}
                <div className="flex flex-col bg-secondary/30 rounded-lg p-4 h-full">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        Em Progresso ({inProgressTasks.length})
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {inProgressTasks.map(task => (
                            <TaskCard key={task.id} task={task} deleteAction={deleteAction} updateStatusAction={updateStatusAction} />
                        ))}
                    </div>
                </div>

                {/* Done Column */}
                <div className="flex flex-col bg-secondary/30 rounded-lg p-4 h-full">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        Concluído ({doneTasks.length})
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {doneTasks.map(task => (
                            <TaskCard key={task.id} task={task} deleteAction={deleteAction} updateStatusAction={updateStatusAction} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TaskCard({ task, deleteAction, updateStatusAction }: { task: Task, deleteAction: any, updateStatusAction: any }) {
    return (
        <div className="card p-3 bg-card hover:border-primary/50 transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm">{task.title}</h4>
                <button
                    onClick={() => deleteAction(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-opacity"
                >
                    <Trash className="h-3 w-3" />
                </button>
            </div>

            {task.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>}

            <div className="flex items-center justify-between mt-2">
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                    task.priority === "HIGH" ? "bg-red-500/20 text-red-500" :
                        task.priority === "MEDIUM" ? "bg-yellow-500/20 text-yellow-500" :
                            "bg-blue-500/20 text-blue-500"
                )}>
                    {task.priority === "HIGH" ? "Alta" : task.priority === "MEDIUM" ? "Média" : "Baixa"}
                </span>

                <div className="flex gap-1">
                    {task.status !== "TODO" && (
                        <button onClick={() => updateStatusAction(task.id, "TODO")} className="text-[10px] bg-secondary hover:bg-muted px-2 py-1 rounded">
                            Voltar
                        </button>
                    )}
                    {task.status === "TODO" && (
                        <button onClick={() => updateStatusAction(task.id, "IN_PROGRESS")} className="text-[10px] bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 px-2 py-1 rounded">
                            Iniciar
                        </button>
                    )}
                    {task.status === "IN_PROGRESS" && (
                        <button onClick={() => updateStatusAction(task.id, "DONE")} className="text-[10px] bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 px-2 py-1 rounded">
                            Concluir
                        </button>
                    )}
                </div>
            </div>
            {task.assignee && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold text-[8px]">
                        {task.assignee.substring(0, 1)}
                    </span>
                    {task.assignee}
                </div>
            )}
        </div>
    )
}
