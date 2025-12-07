import { useEffect, useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { SmartAddModal } from '../components/timetable/SmartAddModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';

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
        if (!user) return;
        setLoading(true);

        try {
            // Fetch from both tables
            const { data: basicEntries } = await supabase
                .from('timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', selectedDay);

            const { data: smartEntries } = await supabase
                .from('smart_timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', selectedDay);

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
        <div className="min-h-screen pb-24 relative overflow-hidden">
            <SEO
                title="Schedule"
                description="Manage your class timetable and track attendance."
            />
            {/* Dark Purple Gradient Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#1e1b4b] z-0" />

            {/* Ambient Glows */}
            <div className="fixed top-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-500/30 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="fixed bottom-[10%] left-[-10%] w-[250px] h-[250px] bg-indigo-500/30 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="p-6 relative z-10 space-y-8">
                <div className="mt-4">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Schedule</h1>
                    <p className="text-purple-200/80 text-lg font-medium">Manage your classes</p>
                </div>

                {/* Day Selector */}
                <div className="flex overflow-x-auto pb-2 gap-4 no-scrollbar snap-x">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[60px] py-2 rounded-2xl transition-all snap-center",
                                selectedDay === day
                                    ? "bg-primary-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] scale-110"
                                    : "text-purple-200/60 hover:text-white"
                            )}
                        >
                            <span className="text-sm font-bold capitalize tracking-wide">{day.slice(0, 3)}</span>
                        </button>
                    ))}
                </div>

                {/* Timeline */}
                <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
                    {loading ? (
                        <div className="col-span-full text-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-purple-200">Loading schedule...</p>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="col-span-full text-center py-20 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20">
                                <CalendarIcon className="h-10 w-10 text-purple-200" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">No classes today</h3>
                            <p className="text-purple-200/60 mb-6">Enjoy your free time!</p>
                            <button
                                onClick={() => setIsSmartAddOpen(true)}
                                className="text-white font-bold hover:underline bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm"
                            >
                                Add a class
                            </button>
                        </div>
                    ) : (
                        entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className="relative group animate-fade-in-up opacity-0"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Glass Card Redesigned for Mobile */}
                                <div className="bg-white/95 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/50 flex flex-col gap-3 relative overflow-hidden">
                                    {/* Side Bar for Time Conext */}
                                    <div className={cn(
                                        "absolute left-0 top-0 bottom-0 w-2",
                                        entry.type === 'theory' ? "bg-blue-500" : "bg-pink-500"
                                    )} />

                                    <div className="flex justify-between items-start pl-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                                    {entry.subject_code}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide",
                                                    entry.type === 'theory' ? "text-blue-600 bg-blue-50" : "text-pink-600 bg-pink-50"
                                                )}>
                                                    {entry.type}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">{entry.subject_name}</h3>
                                        </div>

                                        {/* Attendance Badge */}
                                        {attendanceStats[entry.subject_code] !== undefined && (
                                            <div className="flex flex-col items-end">
                                                <div className={cn(
                                                    "px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm border",
                                                    attendanceStats[entry.subject_code] >= 75
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : attendanceStats[entry.subject_code] >= 65
                                                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                            : "bg-red-50 text-red-700 border-red-200"
                                                )}>
                                                    {attendanceStats[entry.subject_code]}%
                                                    <span className="text-[10px] font-normal opacity-70">Att.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-600 pl-3 mt-2">
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="font-bold text-slate-700">{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
                                        </div>
                                        {entry.room_number && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="font-medium text-slate-500">{entry.room_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsSmartAddOpen(true)}
                className="fixed bottom-24 right-6 bg-white hover:bg-slate-50 text-slate-900 p-5 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-95 z-50 flex items-center justify-center"
            >
                <Plus className="h-8 w-8" />
            </button>

            <SmartAddModal
                isOpen={isSmartAddOpen}
                onClose={() => setIsSmartAddOpen(false)}
                onSuccess={fetchEntries}
            />
        </div>
    );
}
