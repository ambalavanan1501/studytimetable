import { useEffect, useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
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
    const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({});
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

    const fetchEntries = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            console.log('Fetching entries for:', selectedDay);
            // Fetch from both tables
            const { data: basicEntries, error: basicError } = await supabase
                .from('timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', selectedDay);

            if (basicError) console.error('Basic Fetch Error:', basicError);

            const { data: smartEntries, error: smartError } = await supabase
                .from('smart_timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', selectedDay);

            if (smartError) console.error('Smart Fetch Error:', smartError);

            // Fetch attendance logs for all subjects
            const { data: logs } = await supabase
                .from('attendance_logs')
                .select('subject_code, status')
                .eq('user_id', user.id);

            // Calculate stats
            const stats: Record<string, number> = {};
            if (logs) {
                const subjectLogs: Record<string, { present: number; total: number }> = {};
                logs.forEach(log => {
                    if (!subjectLogs[log.subject_code]) {
                        subjectLogs[log.subject_code] = { present: 0, total: 0 };
                    }
                    subjectLogs[log.subject_code].total++;
                    if (log.status === 'present') {
                        subjectLogs[log.subject_code].present++;
                    }
                });

                Object.keys(subjectLogs).forEach(code => {
                    const { present, total } = subjectLogs[code];
                    stats[code] = total > 0 ? Math.round((present / total) * 100) : 0;
                });
            }
            setAttendanceStats(stats);

            const allEntries = [...(basicEntries || []), ...(smartEntries || [])];
            console.log(`Found ${allEntries.length} entries for ${selectedDay}`);

            // Sort by start time
            allEntries.sort((a, b) => a.start_time.localeCompare(b.start_time));

            setEntries(allEntries);
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [user, selectedDay]);

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
                    <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tighter leading-none">Schedule</h1>
                    <p className="text-lg text-slate-500 font-medium font-display tracking-wide">Your week at a glance.</p>
                </div>
                <CalendarExportBtn />
            </div>

            {/* NikiOS Day Selector */}
            <div className="sticky top-4 z-40 mx-auto max-w-fit">
                <div className="glass-vision rounded-full p-2 flex gap-1 shadow-2xl backdrop-blur-3xl border border-white/60">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={cn(
                                "relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ease-out flex-shrink-0",
                                selectedDay === day
                                    ? "text-white shadow-lg scale-105"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                            )}
                        >
                            {/* Active background pill */}
                            {selectedDay === day && (
                                <div className="absolute inset-0 bg-slate-900 rounded-full -z-10 animate-breathe" />
                            )}
                            <span className="tracking-wide">{day.slice(0, 3)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[50vh]">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-6"></div>
                        <p className="font-bold text-slate-400 animate-pulse tracking-widest uppercase text-xs">Loading...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-32 h-32 glass-vision rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl animate-float">
                            <CalendarIcon className="h-12 w-12 text-slate-300" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">No classes</h3>
                        <p className="text-slate-400 font-medium mb-10 text-lg">Enjoy your free time!</p>
                        <button
                            onClick={() => setIsSmartAddOpen(true)}
                            className="glass-button px-8 py-4 rounded-full text-slate-700 font-bold hover:scale-105 transition-transform flex items-center gap-3"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Add Class</span>
                        </button>
                    </div>
                ) : (
                    entries.map((entry, index) => (
                        <div
                            key={entry.id}
                            className="group animate-fade-in-up opacity-0"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="glass-vision p-5 rounded-[1.5rem] h-full flex flex-col relative overflow-hidden group-hover:bg-white/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                {/* Vertical Accent Bar */}
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-3",
                                    entry.type === 'theory' ? "bg-indigo-500" : "bg-pink-500"
                                )} />

                                <div className="flex justify-between items-start mb-6 pl-4">
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <span className="glass-panel px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {entry.subject_code}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-xl text-slate-800 leading-tight tracking-tight">{entry.subject_name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs font-bold uppercase tracking-wider",
                                                entry.type === 'theory' ? "text-indigo-500" : "text-pink-500"
                                            )}>
                                                {entry.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Attendance Pill */}
                                    {attendanceStats[entry.subject_code] !== undefined && (
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-white/50 backdrop-blur-md",
                                            attendanceStats[entry.subject_code] >= 75
                                                ? "bg-emerald-100/50 text-emerald-700"
                                                : attendanceStats[entry.subject_code] >= 65
                                                    ? "bg-amber-100/50 text-amber-700"
                                                    : "bg-red-100/50 text-red-700"
                                        )}>
                                            {attendanceStats[entry.subject_code]}%
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pl-4 pt-6 border-t border-white/20 flex items-center justify-between text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span className="font-bold text-sm bg-white/40 px-3 py-1 rounded-lg">
                                            {formatTime(entry.start_time)}
                                        </span>
                                    </div>
                                    {entry.room_number && (
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                            <MapPin className="h-4 w-4" />
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
                onSuccess={fetchEntries}
            />
        </div>
    );
}
