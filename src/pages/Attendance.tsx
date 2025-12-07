import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Check, X, Clock, MapPin, ChevronLeft, ChevronRight, BarChart3, ListChecks, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface AttendanceLog {
    subject_code: string;
    status: 'present' | 'absent';
}

interface CourseStats {
    subject_name: string;
    subject_code: string;
    total_classes: number;
    present: number;
    absent: number;
    percentage: number;
}

export function Attendance() {
    const { user } = useAuth();
    const [view, setView] = useState<'mark' | 'stats'>('mark');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [classes, setClasses] = useState<any[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
    const [stats, setStats] = useState<CourseStats[]>([]);


    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getDayName = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    const fetchAttendanceData = async () => {
        if (!user) return;

        try {
            if (view === 'mark') {
                const dayName = getDayName(selectedDate);
                const dateStr = formatDate(selectedDate);

                // 1. Fetch Timetable for the day
                const [basic, smart] = await Promise.all([
                    supabase.from('timetable_entries').select('*').eq('user_id', user.id).eq('day', dayName),
                    supabase.from('smart_timetable_entries').select('*').eq('user_id', user.id).eq('day', dayName)
                ]);

                const allClasses = [...(basic.data || []), ...(smart.data || [])];
                allClasses.sort((a, b) => a.start_time.localeCompare(b.start_time));
                setClasses(allClasses);

                // 2. Fetch Attendance Logs for the date
                const { data: logs } = await supabase
                    .from('attendance_logs')
                    .select('subject_code, status')
                    .eq('user_id', user.id)
                    .eq('date', dateStr);

                setAttendanceLogs(logs || []);
            } else {
                // Fetch Stats
                // 1. Get all unique subjects from timetable
                const [basic, smart] = await Promise.all([
                    supabase.from('timetable_entries').select('subject_name, subject_code').eq('user_id', user.id),
                    supabase.from('smart_timetable_entries').select('subject_name, subject_code').eq('user_id', user.id)
                ]);

                const uniqueSubjects = new Map();
                [...(basic.data || []), ...(smart.data || [])].forEach(s => {
                    if (!uniqueSubjects.has(s.subject_code)) {
                        uniqueSubjects.set(s.subject_code, s.subject_name);
                    }
                });

                // 2. Get all attendance logs
                const { data: allLogs } = await supabase
                    .from('attendance_logs')
                    .select('subject_code, status')
                    .eq('user_id', user.id);

                // 3. Calculate Stats
                const statsData: CourseStats[] = [];
                uniqueSubjects.forEach((name, code) => {
                    const subjectLogs = allLogs?.filter(l => l.subject_code === code) || [];
                    const present = subjectLogs.filter(l => l.status === 'present').length;
                    const absent = subjectLogs.filter(l => l.status === 'absent').length;
                    const total = present + absent;

                    statsData.push({
                        subject_name: name,
                        subject_code: code,
                        total_classes: total,
                        present,
                        absent,
                        percentage: total > 0 ? Math.round((present / total) * 100) : 0
                    });
                });

                setStats(statsData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {

        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [selectedDate, user, view]);

    const markAttendance = async (subjectCode: string, status: 'present' | 'absent') => {
        if (!user) return;

        const dateStr = formatDate(selectedDate);

        // Optimistic Update
        setAttendanceLogs(prev => {
            const filtered = prev.filter(log => log.subject_code !== subjectCode);
            return [...filtered, { subject_code: subjectCode, status }];
        });

        try {
            const { error } = await supabase
                .from('attendance_logs')
                .upsert({
                    user_id: user.id,
                    date: dateStr,
                    subject_code: subjectCode,
                    status: status
                }, { onConflict: 'user_id, date, subject_code' });

            if (error) throw error;
        } catch (error) {
            console.error('Error marking attendance:', error);
            fetchAttendanceData();
        }
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <div className="p-6 space-y-6 pb-24 staggered-fade-in">
            <h1 className="text-2xl font-bold text-slate-800 mt-4">Attendance</h1>

            {/* View Switcher */}
            <div className="flex p-1 bg-slate-200/50 rounded-xl">
                <button
                    onClick={() => setView('mark')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                        view === 'mark' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <ListChecks className="h-4 w-4" />
                    Mark Attendance
                </button>
                <button
                    onClick={() => setView('stats')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                        view === 'stats' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <BarChart3 className="h-4 w-4" />
                    Statistics
                </button>
            </div>

            {view === 'mark' ? (
                <>
                    {/* Date Selector */}
                    <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium text-slate-500">{getDayName(selectedDate)}</span>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-primary-600" />
                                <span className="text-lg font-bold text-slate-800">{selectedDate.toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>

                    {/* Class List */}
                    <div className="space-y-4">
                        {classes.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p>No classes scheduled for this day.</p>
                            </div>
                        ) : (
                            classes.map((cls) => {
                                const log = attendanceLogs.find(l => l.subject_code === cls.subject_code);
                                const isPresent = log?.status === 'present';
                                const isAbsent = log?.status === 'absent';

                                return (
                                    <div key={cls.id} className="glass-card p-5 rounded-2xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">{cls.subject_name}</h3>
                                                <p className="text-sm text-slate-500 font-medium">{cls.subject_code}</p>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide",
                                                cls.type === 'theory' ? "bg-primary-100 text-primary-600" : "bg-pink-100 text-pink-600"
                                            )}>
                                                {cls.type}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-4 w-4 text-primary-400" />
                                                <span className="font-medium">{cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}</span>
                                            </div>
                                            {cls.room_number && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-primary-400" />
                                                    <span className="font-medium">{cls.room_number}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => markAttendance(cls.subject_code, 'present')}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                                                    isPresent
                                                        ? "bg-green-500 text-white shadow-lg shadow-green-200 scale-[1.02]"
                                                        : "bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600"
                                                )}
                                            >
                                                <Check className="h-5 w-5" />
                                                Present
                                            </button>
                                            <button
                                                onClick={() => markAttendance(cls.subject_code, 'absent')}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                                                    isAbsent
                                                        ? "bg-red-500 text-white shadow-lg shadow-red-200 scale-[1.02]"
                                                        : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                )}
                                            >
                                                <X className="h-5 w-5" />
                                                Absent
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    {stats.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <p>No attendance data recorded yet.</p>
                        </div>
                    ) : (
                        stats.map((stat) => (
                            <div key={stat.subject_code} className="glass-card p-5 rounded-2xl">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{stat.subject_name}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{stat.subject_code}</p>
                                    </div>
                                    <div className={cn(
                                        "text-lg font-bold",
                                        stat.percentage >= 75 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {stat.percentage}%
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-500", stat.percentage >= 75 ? "bg-green-500" : "bg-red-500")}
                                        style={{ width: `${stat.percentage}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Present</span>
                                            <span className="font-bold text-green-600">{stat.present}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Absent</span>
                                            <span className="font-bold text-red-600">{stat.absent}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Total</span>
                                            <span className="font-bold text-slate-700">{stat.total_classes}</span>
                                        </div>
                                    </div>

                                    {stat.percentage < 75 && (
                                        <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                            <AlertTriangle className="h-3 w-3" />
                                            Low Attendance
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
