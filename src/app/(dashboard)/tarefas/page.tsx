import { getTasks, createTask, deleteTask, updateTaskStatus } from "./actions";
import { TaskBoard } from "./task-board";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
    const tasks = await getTasks();

    return (
        <div className="space-y-6 h-[calc(100vh-4rem)] flex flex-col">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
                <p className="text-muted-foreground">Gerencie o fluxo de trabalho da equipe.</p>
            </div>

            <TaskBoard
                initialTasks={tasks}
                createAction={createTask}
                deleteAction={deleteTask}
                updateStatusAction={updateTaskStatus}
            />
        </div>
    );
}
