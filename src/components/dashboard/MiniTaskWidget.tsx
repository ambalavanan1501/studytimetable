import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { db } from '../../lib/db';

interface Task {
    id: string;
    text: string;
    completed: boolean;
}

export function MiniTaskWidget() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const all = await db.getAllTasks();
        // Show top 3 incomplete tasks, or recent completed if all done
        const incomplete = all.filter(t => !t.completed).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const completed = all.filter(t => t.completed).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setTasks([...incomplete, ...completed].slice(0, 3));
    };

    const handleToggle = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            // We need to fetch the full object to save it back correctly if we had more fields, 
            // but for now this is fine or we can re-fetch.
            // Better: get from DB, update, save.
            const fullTask = await db.getAllTasks().then(ts => ts.find(t => t.id === id));
            if (fullTask) {
                await db.saveTask({ ...fullTask, completed: !task.completed });
                // Optimistic update
                setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
            }
        }
    };

    return (
        <div className="glass-card p-5 rounded-3xl relative group h-full flex flex-col bg-emerald-50/30 border-emerald-100/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-emerald-500" />
                    Tasks
                </h3>
                <button
                    onClick={() => navigate('/tasks')}
                    className="p-1.5 rounded-full hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                    <ArrowUpRight className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 space-y-3">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 group/item">
                            <button
                                onClick={() => handleToggle(task.id)}
                                className="text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                {task.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Circle className="h-4 w-4" />
                                )}
                            </button>
                            <span className={`text-sm truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                                {task.text}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        No pending tasks
                    </div>
                )}
            </div>
        </div>
    );
}
