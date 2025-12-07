import { useEffect, useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Edit2 } from 'lucide-react';
import { SmartAddModal } from '../components/timetable/SmartAddModal';
import { EditClassModal } from '../components/timetable/EditClassModal';
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

    // Edit State
    const [editingClass, setEditingClass] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

    const handleEdit = (entry: any) => {
        setEditingClass(entry);
        setIsEditModalOpen(true);
    };

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
                <div className="space-y-5">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-purple-200">Loading schedule...</p>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center">
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
                                {/* Glass Card */}
                                <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-lg border border-white/50 flex flex-col gap-4">
                                    <div className="flex flex-col gap-1 pr-8">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-slate-900 text-xl leading-tight">{entry.subject_name}</h3>
                                            <span className={cn(
                                                "text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide shadow-sm",
                                                entry.type === 'theory'
                                                    ? "bg-blue-500 text-white shadow-blue-200"
                                                    : "bg-pink-500 text-white shadow-pink-200"
                                            )}>
                                                {entry.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{entry.subject_code}</p>
                                    </div>

                                    {/* Attendance Badge */}
                                    {attendanceStats[entry.subject_code] !== undefined && (
                                        <div className={cn(
                                            "absolute top-5 right-16 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1",
                                            attendanceStats[entry.subject_code] >= 75
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        )}>
                                            {attendanceStats[entry.subject_code] < 75 && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                            )}
                                            {attendanceStats[entry.subject_code]}%
                                        </div>
                                    )}

                                    <div className="flex items-center gap-6 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <span className="font-semibold">{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
                                        </div>
                                        {entry.room_number && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-400" />
                                                <span className="font-semibold">{entry.room_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Single Edit Button */}
                                <button
                                    onClick={() => handleEdit(entry)}
                                    className="absolute top-5 right-4 p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button>
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

            <EditClassModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                classData={editingClass}
                onSuccess={fetchEntries}
            />
        </div>
    );
}
