import { useEffect, useState, useCallback } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Loader2 } from 'lucide-react';
import { SmartAddModal } from '../components/timetable/SmartAddModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { CalendarExportBtn } from '../components/timetable/CalendarExportBtn';

export function Timetable() {
    const { user } = useAuth();
    const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string>('Monday');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Permanently remove weekends as per user request
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    useEffect(() => {
        // Set current day on load
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (days.includes(today)) {
            setSelectedDay(today);
        }
    }, []);


    const fetchTimetable = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            // Fetch from both tables concurrently
            const [basicRes, smartRes] = await Promise.all([
                supabase.from('timetable_entries').select('*').eq('user_id', user.id).eq('day', selectedDay),
                supabase.from('smart_timetable_entries').select('*').eq('user_id', user.id).eq('day', selectedDay)
            ]);

            if (basicRes.error) console.error('Basic Fetch Error:', basicRes.error);
            if (smartRes.error) console.error('Smart Fetch Error:', smartRes.error);

            const allEntries = [...(basicRes.data || []), ...(smartRes.data || [])];

            // Sort by start time
            allEntries.sort((a, b) => a.start_time.localeCompare(b.start_time));

            setEntries(allEntries);
        } catch (error) {
            console.error('Error fetching timetable:', error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedDay]); // Dependencies for useCallback

    // Fetch Timetable Entries (Run when day changes)
    useEffect(() => {
        fetchTimetable();
    }, [fetchTimetable]); // fetchTimetable is now a stable dependency due to useCallback

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    return (
        <div className="pb-32 space-y-10 animate-fade-in-up">
            <SEO
                title="Schedule"
                description="Manage your class timetable and track attendance."
            />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4 px-2">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-5xl font-semibold text-slate-900 tracking-tighter leading-none">Schedule</h1>
                    <p className="text-lg text-slate-500 font-medium font-display tracking-wide">Your week at a glance.</p>
                </div>
                <CalendarExportBtn />
            </div>

            {/* Day Selector - Clean & Minimal */}
            <div className="sticky top-4 z-40 mx-auto max-w-fit">
                <div className="bg-white/80 backdrop-blur-xl rounded-full p-1.5 flex gap-1 shadow-sm border border-slate-200/50 overflow-x-auto no-scrollbar max-w-full">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={cn(
                                "relative px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out flex-shrink-0",
                                selectedDay === day
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                            )}
                        >
                            <span className="tracking-wide">{day.slice(0, 3)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[50vh]">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-300 mb-4" />
                        <p className="font-bold text-slate-300 uppercase tracking-widest text-xs">Loading Schedule...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <CalendarIcon className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No classes</h3>
                        <p className="text-slate-400 font-medium mb-8">Enjoy your free time!</p>
                        <button
                            onClick={() => setIsSmartAddOpen(true)}
                            className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Class</span>
                        </button>
                    </div>
                ) : (
                    entries.map((entry, index) => (
                        <div
                            key={entry.id}
                            className="group animate-fade-in-up opacity-0"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="card-base p-6 h-full flex flex-col relative group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden">
                                {/* Side Accent Line */}
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1.5",
                                    entry.type === 'theory' ? "bg-indigo-500" : "bg-pink-500"
                                )}></div>

                                <div className="flex justify-between items-start mb-6 pl-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                                                {formatTime(entry.start_time)}
                                            </span>
                                            {/* Type Badge */}
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded text-white",
                                                entry.type === 'theory' ? "bg-indigo-500" : "bg-pink-500"
                                            )}>
                                                {entry.type}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{entry.subject_name}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.subject_code}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between pl-2">


                                    {entry.room_number && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                            <MapPin className="h-3 w-3" />
                                            {entry.room_number}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* NikiOS Floating Action Button */}
            <button
                onClick={() => setIsSmartAddOpen(true)}
                className="fixed bottom-24 right-8 w-14 h-14 glass-vision bg-slate-900/90 text-white rounded-[1.5rem] shadow-2xl z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group ring-1 ring-white/20"
            >
                <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
            </button>

            <SmartAddModal
                isOpen={isSmartAddOpen}
                onClose={() => setIsSmartAddOpen(false)}
                onSuccess={fetchTimetable}
            />
        </div>
    );
}
