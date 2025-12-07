import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Circle, ListTodo } from 'lucide-react';
import { db } from '../../lib/db';



export function MiniTaskWidget() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<any[]>([]); // using any or updated interface

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const all = await db.getAllTasks();
        // Filter: Show top 3 'todo' or 'in-progress' tasks
        // Adapt legacy data if needed
        const active = all.filter((t: any) => {
            const status = t.status || (t.completed ? 'done' : 'todo');
            return status !== 'done';
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setTasks(active.slice(0, 3));
    };

    const handleToggle = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const fullTask: any = await db.getAllTasks().then(ts => ts.find(t => t.id === id));
            if (fullTask) {
                // Move to done
                const updated = { ...fullTask, status: 'done' };
                await db.saveTask(updated);

                // Optimistic update - remove from list
                setTasks(tasks.filter(t => t.id !== id));
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
                                <Circle className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-slate-600 truncate">
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
