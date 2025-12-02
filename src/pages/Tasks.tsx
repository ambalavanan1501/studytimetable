import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, Upload, FileJson, FileText } from 'lucide-react';
import { db } from '../lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface Task {
    id: string;
    text: string;
    completed: boolean;
    createdAt: Date;
}

export function Tasks() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await db.getAllTasks();
            setTasks(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        } catch (error) {
            console.error("Failed to load tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        const item = {
            id: crypto.randomUUID(),
            text: newTask.trim(),
            completed: false,
            createdAt: new Date()
        };

        await db.saveTask(item);
        setTasks([item, ...tasks]);
        setNewTask('');
    };

    const handleToggle = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const updated = { ...task, completed: !task.completed };
            await db.saveTask(updated);
            setTasks(tasks.map(t => t.id === id ? updated : t));
        }
    };

    const handleDelete = async (id: string) => {
        await db.deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
    };

    const exportJSON = () => {
        const dataStr = JSON.stringify(tasks, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "tasks.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Tasks", 14, 15);

        const tableData = tasks.map(task => [
            task.text,
            task.completed ? 'Completed' : 'Pending',
            task.createdAt.toLocaleDateString()
        ]);

        autoTable(doc, {
            head: [['Task', 'Status', 'Created At']],
            body: tableData,
            startY: 20,
        });

        doc.save("tasks.pdf");
    };

    const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                if (Array.isArray(imported)) {
                    for (const item of imported) {
                        const parsed = {
                            ...item,
                            createdAt: new Date(item.createdAt)
                        };
                        await db.saveTask(parsed);
                    }
                    loadTasks();
                    alert('Tasks imported successfully!');
                }
            } catch (error) {
                console.error("Import failed", error);
                alert('Failed to import. Invalid format.');
            }
        };
        reader.readAsText(file);
    };

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={exportJSON}
                        className="flex items-center gap-2 bg-white text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                        title="Export JSON"
                    >
                        <FileJson className="h-4 w-4" />
                        <span className="hidden sm:inline">JSON</span>
                    </button>
                    <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 bg-white text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                        title="Export PDF"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <label className="flex items-center gap-2 bg-white text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Import</span>
                        <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                    </label>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-8">
                {/* Add Task Input */}
                <form onSubmit={handleAdd} className="relative">
                    <input
                        type="text"
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        placeholder="Add a new task..."
                        className="w-full pl-6 pr-14 py-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-primary-500 text-lg"
                    />
                    <button
                        type="submit"
                        disabled={!newTask.trim()}
                        className="absolute right-2 top-2 bottom-2 aspect-square bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                </form>

                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p>No tasks yet. Stay organized by adding one!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Active Tasks */}
                        {activeTasks.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">To Do</h2>
                                {activeTasks.map(task => (
                                    <div key={task.id} className="glass-card p-4 rounded-2xl flex items-center gap-4 group">
                                        <button
                                            onClick={() => handleToggle(task.id)}
                                            className="text-slate-400 hover:text-primary-600 transition-colors"
                                        >
                                            <Circle className="h-6 w-6" />
                                        </button>
                                        <span className="flex-1 text-slate-700 font-medium">{task.text}</span>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Completed Tasks */}
                        {completedTasks.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">Completed</h2>
                                {completedTasks.map(task => (
                                    <div key={task.id} className="bg-slate-100/50 p-4 rounded-2xl flex items-center gap-4 opacity-75">
                                        <button
                                            onClick={() => handleToggle(task.id)}
                                            className="text-emerald-500"
                                        >
                                            <CheckCircle2 className="h-6 w-6" />
                                        </button>
                                        <span className="flex-1 text-slate-500 line-through">{task.text}</span>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
