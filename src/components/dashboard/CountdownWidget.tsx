import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import { db } from '../../lib/db';

export function CountdownWidget() {
    const navigate = useNavigate();
    const [nearest, setNearest] = useState<{ title: string; targetDate: Date } | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number } | null>(null);

    useEffect(() => {
        loadNearest();
        const timer = setInterval(updateTime, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const loadNearest = async () => {
        const all = await db.getAllCountdowns();
        const now = new Date().getTime();
        // Filter future events and sort by nearest
        const upcoming = all
            .filter(c => c.targetDate.getTime() > now)
            .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

        if (upcoming.length > 0) {
            setNearest(upcoming[0]);
            calculateTimeLeft(upcoming[0].targetDate);
        }
    };

    const updateTime = () => {
        if (nearest) {
            calculateTimeLeft(nearest.targetDate);
        }
    };

    const calculateTimeLeft = (target: Date) => {
        const total = target.getTime() - new Date().getTime();
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        setTimeLeft({ days, hours });
    };

    return (
        <div className="card-base p-5 rounded-3xl relative group h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Countdown
                </h3>
                <button
                    onClick={() => navigate('/countdown')}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <ArrowUpRight className="h-4 w-4" />
                </button>
            </div>

            {nearest && timeLeft ? (
                <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm text-slate-500 font-medium truncate mb-1">{nearest.title}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-800">{timeLeft.days}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase mr-2">Days</span>
                        <span className="text-xl font-bold text-slate-600">{timeLeft.hours}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Hrs</span>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                    No active timers
                </div>
            )}
        </div>
    );
}
