import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { useGamification } from '../context/GamificationContext';
import { useToast } from '../context/ToastContext';
import { SEO } from '../components/SEO';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Plus, Trash2, GripVertical, CheckCircle2, Clock, Circle, Headphones } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFlow } from '../context/FlowContext'; // Assuming you have this utility

interface Task {
    id: string;
    text: string;
    status: 'todo' | 'in-progress' | 'done';
    createdAt: Date;
    // index field isn't in DB yet, we'll sort by createdAt for now or in-memory
}

type ColumnId = 'todo' | 'in-progress' | 'done';

const COLUMNS: { id: ColumnId; title: string; color: string; icon: any }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-100 border-slate-200', icon: Circle },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 border-blue-100', icon: Clock },
    { id: 'done', title: 'Completed', color: 'bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
];

export function Tasks() {
    const navigate = useNavigate();
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
            // Data Migration for legacy 'completed' boolean
            const parsed = data.map((t: any) => ({
                ...t,
                status: t.status ? t.status : (t.completed ? 'done' : 'todo')
            }));
            // Sort by date descending
            setTasks(parsed.sort((a: Task, b: Task) => b.createdAt.getTime() - a.createdAt.getTime()));
        } catch (error) {
            console.error("Failed to load tasks", error);
        } finally {
            // 
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

        // If dropped over a column container or a task in that column
        let newStatus: ColumnId | null = null;

        // Check if over is a container column
        if (COLUMNS.some(c => c.id === over.id)) {
            newStatus = over.id as ColumnId;
        } else {
            // Check if over is a task
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (newStatus && newStatus !== activeTask.status) {
            const updatedTask = { ...activeTask, status: newStatus };

            // Optimistic Update
            setTasks(tasks.map(t => t.id === active.id ? updatedTask : t));

            // DB Update
            await db.saveTask(updatedTask);

            // Gamification Trigger
            if (newStatus === 'done' && activeTask.status !== 'done') {
                addXP(50, 'Task Completed');
                addToast('Task moved to Completed! +50 XP', 'success');
            }
        }
    };

    return (
        <div className="min-h-screen p-6 pb-24 space-y-6">
            <SEO title="Kanban Board" description="Manage your tasks efficiently." />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Task Board</h1>
                        <p className="text-slate-500 text-xs">Drag and drop to manage workflow</p>
                    </div>
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2">
                    <input
                        type="text"
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        placeholder="Add new task..."
                        className="glass-input px-4 py-2 rounded-xl focus:ring-2 focus:ring-primary-500 w-full md:w-64"
                    />
                    <button
                        type="submit"
                        disabled={!newTask.trim()}
                        className="bg-primary-600 text-white p-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                </form>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
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
        data: {
            type: 'Column',
            column,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn("bg-slate-50/50 rounded-2xl p-4 min-h-[500px] border-2 border-dashed border-slate-200 transition-colors", column.color)}
        >
            <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <column.icon className="h-4 w-4" />
                {column.title} <span className="bg-white/50 px-2 py-0.5 rounded-full text-[10px] ml-auto">{tasks.length}</span>
            </div>

            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {tasks.map(task => (
                        <SortableTask key={task.id} task={task} onDelete={onDelete} onUpdateStatus={onUpdateStatus} />
                    ))}
                    {tasks.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-slate-300 text-xs italic">
                            Empty
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
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} onDelete={onDelete} onUpdateStatus={onUpdateStatus} isDragging={isDragging} />
        </div>
    );
}

function TaskCard({ task, onDelete, onUpdateStatus, isDragging, isOverlay }: { task: Task, onDelete: (id: string) => void, onUpdateStatus: (id: string, status: ColumnId) => void, isDragging?: boolean, isOverlay?: boolean }) {
    const { startFocus } = useFlow();

    const handleFocus = (e: React.MouseEvent) => {
        e.stopPropagation();
        startFocus(25, task.text);
        if (task.status !== 'in-progress' && task.status !== 'done') {
            onUpdateStatus(task.id, 'in-progress');
        }
    };

    return (
        <div
            className={cn(
                "glass-card p-4 rounded-xl flex items-start gap-3 group bg-white shadow-sm border border-slate-100",
                isDragging && "opacity-30",
                isOverlay && "rotate-2 scale-105 shadow-xl cursor-grabbing ring-2 ring-primary-500 ring-offset-2 z-50",
            )}
        >
            <button className="mt-1 text-slate-300 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 break-words leading-relaxed">{task.text}</p>
                <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(task.createdAt).toLocaleDateString()}
                </span>
            </div>
            {task.status !== 'done' && (
                <button
                    onClick={handleFocus}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Start Deep Work Session"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Headphones className="h-4 w-4" />
                </button>
            )}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
