import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Clock, Calendar, Upload, FileJson, FileText } from 'lucide-react';
import { db } from '../lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Countdown {
    id: string;
    title: string;
    targetDate: Date;
}

export function Countdown() {
    const navigate = useNavigate();
    const [countdowns, setCountdowns] = useState<Countdown[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        loadCountdowns();
        const timer = setInterval(() => {
            // Force re-render every second to update timers
            setCountdowns(prev => [...prev]);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const loadCountdowns = async () => {
        try {
            const data = await db.getAllCountdowns();
            setCountdowns(data.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime()));
        } catch (error) {
            console.error("Failed to load countdowns", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newDate) return;

        const newItem = {
            id: crypto.randomUUID(),
            title: newTitle,
            targetDate: new Date(newDate)
        };

        await db.saveCountdown(newItem);
        setCountdowns([...countdowns, newItem].sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime()));
        setIsAdding(false);
        setNewTitle('');
        setNewDate('');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this countdown?')) {
            await db.deleteCountdown(id);
            setCountdowns(countdowns.filter(c => c.id !== id));
        }
    };

    const getTimeLeft = (target: Date) => {
        const total = target.getTime() - new Date().getTime();
        if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        return { days, hours, minutes, seconds, expired: false };
    };

    const exportJSON = () => {
        const dataStr = JSON.stringify(countdowns, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "countdowns.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Countdowns", 14, 15);

        const tableData = countdowns.map(item => [
            item.title,
            item.targetDate.toLocaleString()
        ]);

        autoTable(doc, {
            head: [['Title', 'Target Date']],
            body: tableData,
            startY: 20,
        });

        doc.save("countdowns.pdf");
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
                            targetDate: new Date(item.targetDate)
                        };
                        await db.saveCountdown(parsed);
                    }
                    loadCountdowns();
                    alert('Countdowns imported successfully!');
                }
            } catch (error) {
                console.error("Import failed", error);
                alert('Failed to import. Invalid format.');
            }
        };
        reader.readAsText(file);
    };

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
                    <h1 className="text-2xl font-bold text-slate-800">Countdowns</h1>
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
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full hover:bg-primary-700 transition-colors shadow-md ml-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>New Timer</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="glass-card p-6 rounded-2xl mb-8 animate-in slide-in-from-top-4 fade-in">
                    <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="e.g., Final Exams"
                                className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Target Date</label>
                            <input
                                type="datetime-local"
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                                className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full md:w-auto bg-slate-800 text-white px-6 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
                            Start
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading timers...</div>
            ) : countdowns.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <p>No active countdowns. Add one to track important dates!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {countdowns.map(item => {
                        const timeLeft = getTimeLeft(item.targetDate);
                        return (
                            <div key={item.id} className="glass-card p-6 rounded-3xl relative group overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{item.title}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {item.targetDate.toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="bg-slate-50 rounded-xl p-2">
                                        <div className="text-xl font-bold text-slate-800">{timeLeft.days}</div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Days</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2">
                                        <div className="text-xl font-bold text-slate-800">{timeLeft.hours}</div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Hrs</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2">
                                        <div className="text-xl font-bold text-slate-800">{timeLeft.minutes}</div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Mins</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2">
                                        <div className="text-xl font-bold text-slate-800">{timeLeft.seconds}</div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Secs</div>
                                    </div>
                                </div>

                                {timeLeft.expired && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                        <span className="text-red-500 font-bold text-lg">Time's Up!</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
