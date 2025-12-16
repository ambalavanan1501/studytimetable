import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { useGamification } from '../context/GamificationContext';
import { useToast } from '../context/ToastContext';
import { SEO } from '../components/SEO';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Task {
    id: string;
    text: string;
    status: 'todo' | 'in-progress' | 'done';
    createdAt: Date;
}

type ColumnId = 'todo' | 'in-progress' | 'done';

const COLUMNS: { id: ColumnId; title: string; color: string; icon: any }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-50 border-slate-200', icon: Circle },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50/50 border-blue-100', icon: Clock },
    { id: 'done', title: 'Completed', color: 'bg-emerald-50/50 border-emerald-100', icon: CheckCircle2 },
];

export function Tasks() {
    const { addXP } = useGamification();
    const { addToast } = useToast();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [newTask, setNewTask] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await db.getAllTasks();
            const parsed = data.map((t: any) => ({
                ...t,
                status: t.status ? t.status : (t.completed ? 'done' : 'todo')
            }));
            setTasks(parsed.sort((a: Task, b: Task) => b.createdAt.getTime() - a.createdAt.getTime()));
        } catch (error) {
            console.error("Failed to load tasks", error);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        const task: Task = {
            id: crypto.randomUUID(),
            text: newTask.trim(),
            status: 'todo',
            createdAt: new Date()
        };

        await db.saveTask(task);
        setTasks([task, ...tasks]);
        setNewTask('');
        addXP(10, 'Task Created');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this task?')) {
            await db.deleteTask(id);
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    const handleStatusChange = async (id: string, newStatus: ColumnId) => {
        const task = tasks.find(t => t.id === id);
        if (!task || task.status === newStatus) return;

        const updatedTask = { ...task, status: newStatus };
        setTasks(tasks.map(t => t.id === id ? updatedTask : t));
        await db.saveTask(updatedTask);

        if (newStatus === 'done') {
            addXP(50, 'Task Completed');
            addToast('Task completed! +50 XP', 'success');
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        if (!activeTask) return;

        let newStatus: ColumnId | null = null;
        if (COLUMNS.some(c => c.id === over.id)) {
            newStatus = over.id as ColumnId;
        } else {
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (newStatus && newStatus !== activeTask.status) {
            const updatedTask = { ...activeTask, status: newStatus };
            setTasks(tasks.map(t => t.id === active.id ? updatedTask : t));
            await db.saveTask(updatedTask);
            if (newStatus === 'done' && activeTask.status !== 'done') {
                addXP(50, 'Task Completed');
                addToast('Task moved to Completed! +50 XP', 'success');
            }
        }
    };

    return (
        <div className="min-h-screen p-2 md:p-6 pb-24 space-y-6">
            <SEO title="Kanban Board" description="Manage your tasks efficiently." />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tighter">Assignments</h1>
                    <p className="text-slate-500 font-medium text-sm">Organize your academic workload.</p>
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        placeholder="Add new assignment..."
                        className="bg-white px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 w-full md:w-80 shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newTask.trim()}
                        className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 shadow-md"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </form>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start mt-4">
                    {COLUMNS.map(col => (
                        <Column
                            key={col.id}
                            column={col}
                            tasks={tasks.filter(t => t.status === col.id)}
                            onDelete={handleDelete}
                            onUpdateStatus={handleStatusChange}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeId ? <TaskCard task={tasks.find(t => t.id === activeId)!} onDelete={() => { }} onUpdateStatus={() => { }} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function Column({ column, tasks, onDelete, onUpdateStatus }: { column: any, tasks: Task[], onDelete: (id: string) => void, onUpdateStatus: (id: string, status: ColumnId) => void }) {
    const { setNodeRef } = useSortable({
        id: column.id,
        data: { type: 'Column', column },
    });

    return (
        <div ref={setNodeRef} className={cn("rounded-2xl p-4 min-h-[500px] border", column.color)}>
            <div className="flex items-center gap-2 mb-4 text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                <column.icon className="h-4 w-4" />
                {column.title}
                <span className="bg-white px-2 py-0.5 rounded-md text-[9px] ml-auto border border-slate-100 shadow-sm text-slate-400">
                    {tasks.length}
                </span>
            </div>

            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {tasks.map(task => (
                        <SortableTask key={task.id} task={task} onDelete={onDelete} onUpdateStatus={onUpdateStatus} />
                    ))}
                    {tasks.length === 0 && (
                        <div className="h-24 flex flex-col items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-wider border-2 border-dashed border-slate-200/50 rounded-xl">
                            <span>Empty</span>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableTask({ task, onDelete, onUpdateStatus }: { task: Task, onDelete: (id: string) => void, onUpdateStatus: (id: string, status: ColumnId) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: 'Task', task },
    });

    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none sensitive-touch">
            <TaskCard task={task} onDelete={onDelete} onUpdateStatus={onUpdateStatus} isDragging={isDragging} />
        </div>
    );
}

function TaskCard({ task, onDelete, isDragging, isOverlay }: { task: Task, onDelete: (id: string) => void, onUpdateStatus?: (id: string, status: ColumnId) => void, isDragging?: boolean, isOverlay?: boolean }) {
    return (
        <div
            className={cn(
                "card-base p-4 rounded-xl flex items-start gap-3 group bg-white hover:border-slate-300 transition-all duration-200 relative",
                isDragging && "opacity-40",
                isOverlay && "rotate-2 shadow-xl border-slate-300 cursor-grabbing z-50",
                task.status === 'done' && "bg-slate-50 opacity-75"
            )}
        >
            <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
                task.status === 'done' ? "bg-emerald-400" : task.status === 'in-progress' ? "bg-blue-400" : "bg-slate-300"
            )} />

            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-bold text-slate-800 break-words leading-relaxed",
                    task.status === 'done' && "text-slate-400 line-through decoration-slate-300"
                )}>
                    {task.text}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-400">
                        {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
