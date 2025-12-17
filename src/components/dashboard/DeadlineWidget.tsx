import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertCircle } from 'lucide-react';
import { db } from '../../lib/db';
import { cn } from '../../lib/utils';

interface Task {
    id: string;
    text: string;
    status: 'todo' | 'in-progress' | 'done';
    dueDate?: Date;
}

export function DeadlineWidget() {
    const navigate = useNavigate();
    const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);

    useEffect(() => {
        loadDeadlines();
        // Refresh periodically (e.g. when focusing window) - basic interval for now
        const interval = setInterval(loadDeadlines, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDeadlines = async () => {
        try {
            const allTasks = await db.getAllTasks();
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Start of today

            const filtered = allTasks
                .filter((t: any) => t.status !== 'done' && t.dueDate)
                .map((t: any) => ({ ...t, dueDate: new Date(t.dueDate) }))
                .sort((a: any, b: any) => a.dueDate.getTime() - b.dueDate.getTime()) // Soonest first
                .slice(0, 3); // Take top 3

            setUrgentTasks(filtered);
        } catch (error) {
            console.error("Failed to load deadlines", error);
        }
    };

    const getDueLabel = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 bg-red-50' };
        if (diffDays === 0) return { label: 'Today', color: 'text-amber-600 bg-amber-50' };
        if (diffDays === 1) return { label: 'Tomorrow', color: 'text-blue-600 bg-blue-50' };
        return { label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), color: 'text-slate-500 bg-slate-50' };
    };

    return (
        <div className="card-base p-5 rounded-3xl relative h-full flex flex-col group cursor-pointer hover:border-slate-300 transition-all" onClick={() => navigate('/tasks')}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    Deadlines
                </h3>
            </div>

            <div className="flex-1 space-y-3">
                {urgentTasks.length > 0 ? (
                    urgentTasks.map(task => {
                        const { label, color } = getDueLabel(task.dueDate!);
                        return (
                            <div key={task.id} className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-700 truncate max-w-[60%]">{task.text}</span>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide", color)}>
                                    {label}
                                </span>
                            </div>
                        )
                    })
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Calendar className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-xs">No upcoming deadlines.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
