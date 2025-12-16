import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Check, X, Clock, ChevronLeft, ChevronRight, BarChart3, ListChecks, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { getDayOrder, setDayOrder as saveDayOrder } from '../lib/dayOrder';

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
    const [dayOrder, setDayOrder] = useState<string | null>(null);
    const [attendanceGoal, setAttendanceGoal] = useState(75);

    // Import helper dynamically or use direct import if top-level
    // Assuming we added the file, we should import it at the top, 
    // but since I'm editing a block, I'll add the hook logic here first.
    // Better: I will do a multi-replace to add imports at top and state here.


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
                const order = getDayOrder(dateStr);
                setDayOrder(order);

                // Use day order if exists, otherwise actual day
                const queryDay = order || dayName;

                // 1. Fetch Timetable for the day
                const [basic, smart] = await Promise.all([
                    supabase.from('timetable_entries').select('*').eq('user_id', user.id).eq('day', queryDay),
                    supabase.from('smart_timetable_entries').select('*').eq('user_id', user.id).eq('day', queryDay)
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
                setAttendanceLogs(logs || []);

                // Fetch attendance goal
                const { data: profile } = await supabase.from('profiles').select('attendance_goal').eq('id', user.id).single();
                if (profile?.attendance_goal) setAttendanceGoal(profile.attendance_goal);

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

                // Fetch attendance goal
                const { data: profile } = await supabase.from('profiles').select('attendance_goal').eq('id', user.id).single();
                if (profile?.attendance_goal) setAttendanceGoal(profile.attendance_goal);

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

    const handleDayOrderChange = (day: string | null) => {
        const dateStr = formatDate(selectedDate);
        if (day) {
            saveDayOrder(dateStr, day);
        }
        // Force refresh
        fetchAttendanceData();
    };

    const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const isSpecialDay = getDayName(selectedDate) === 'Saturday' || dayOrder !== null;



    return (
        <div className="p-2 md:p-6 space-y-8 pb-32 animate-fade-in-up md:px-4">
            <div className="flex flex-col gap-2 mt-4 ml-2">
                <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tighter leading-none">Attendance</h1>
                <p className="text-lg text-slate-500 font-medium font-display tracking-wide">Stay present, stay ahead.</p>
            </div>

            {/* View Switcher - Minimal Pills */}
            <div className="flex justify-center sticky top-4 z-40">
                <div className="bg-white/80 p-1 rounded-full flex gap-1 shadow-sm border border-slate-200/50 backdrop-blur-md">
                    <button
                        onClick={() => setView('mark')}
                        className={cn(
                            "px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2",
                            view === 'mark'
                                ? "bg-slate-900 text-white shadow"
                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                        )}
                    >
                        <ListChecks className="h-4 w-4" />
                        Mark
                    </button>
                    <button
                        onClick={() => setView('stats')}
                        className={cn(
                            "px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2",
                            view === 'stats'
                                ? "bg-slate-900 text-white shadow"
                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                        )}
                    >
                        <BarChart3 className="h-4 w-4" />
                        Stats
                    </button>
                </div>
            </div>

            {view === 'mark' ? (
                <>
                    {/* Date Selector */}
                    <div className="card-base p-4 rounded-[1.5rem] flex items-center justify-between shadow-sm border border-slate-100">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-3 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{getDayName(selectedDate)}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">
                                    {selectedDate.toLocaleDateString(undefined, { day: 'numeric' })}
                                </span>
                                <span className="text-xl font-medium text-slate-500">
                                    {selectedDate.toLocaleDateString(undefined, { month: 'long' })}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => changeDate(1)}
                            className="p-3 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Day Order Selector */}
                    {isSpecialDay && (
                        <div className="flex justify-center mb-6 animate-fade-in-up">
                            <div className="bg-white p-2 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Day Order</span>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {daysList.map(d => (
                                        <button
                                            key={d}
                                            onClick={() => handleDayOrderChange(d)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                (dayOrder === d || (!dayOrder && getDayName(selectedDate) === d))
                                                    ? "bg-slate-900 text-white"
                                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                            )}
                                        >
                                            {d.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Class List */}
                    <div className="space-y-4">
                        {classes.length === 0 ? (
                            <div className="text-center py-20 px-6 card-base rounded-[2rem] border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <CalendarIcon className="h-8 w-8" />
                                </div>
                                <p className="text-lg font-bold text-slate-300 text-center">No classes scheduled</p>
                            </div>
                        ) : (
                            classes.map((cls) => {
                                const log = attendanceLogs.find(l => l.subject_code === cls.subject_code);
                                const isPresent = log?.status === 'present';
                                const isAbsent = log?.status === 'absent';

                                return (
                                    <div key={cls.id} className="card-base p-6 rounded-[1.5rem] group hover:border-slate-300 transition-all duration-300">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {cls.subject_code}
                                                    </span>
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        cls.type === 'theory' ? "bg-indigo-500" : "bg-pink-500"
                                                    )} />
                                                </div>
                                                <h3 className="font-bold text-xl text-slate-900 tracking-tight">{cls.subject_name}</h3>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg self-start md:self-center">
                                                <Clock className="h-3 w-3" />
                                                {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => markAttendance(cls.subject_code, 'present')}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 border-2",
                                                    isPresent
                                                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                                        : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"
                                                )}
                                            >
                                                {isPresent ? <Check className="h-4 w-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-emerald-400" />}
                                                <span>Present</span>
                                            </button>
                                            <button
                                                onClick={() => markAttendance(cls.subject_code, 'absent')}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 border-2",
                                                    isAbsent
                                                        ? "bg-red-50 border-red-500 text-red-700"
                                                        : "bg-white border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-600"
                                                )}
                                            >
                                                {isAbsent ? <X className="h-4 w-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-red-400" />}
                                                <span>Absent</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-400 card-base rounded-[2rem] border-dashed border-slate-200">
                            <p className="text-xl font-bold">No attendance data yet</p>
                            <p className="text-sm mt-2 opacity-60">Start marking your classes to see stats!</p>
                        </div>
                    ) : (
                        stats.map((stat) => {
                            return (
                                <div key={stat.subject_code} className="card-base p-6 rounded-[1.5rem] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                                    <div className="mb-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-4">
                                                <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1" title={stat.subject_name}>{stat.subject_name}</h3>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.subject_code}</span>
                                            </div>
                                            <div className={cn(
                                                "text-xl font-black tabular-nums",
                                                stat.percentage >= attendanceGoal ? "text-emerald-600" : "text-red-500"
                                            )}>
                                                {stat.percentage}%
                                            </div>
                                        </div>

                                        {/* Minimal Progress Bar */}
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000 ease-out", stat.percentage >= attendanceGoal ? "bg-emerald-500" : "bg-red-500")}
                                                style={{ width: `${stat.percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-t border-slate-50 pt-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-emerald-600">{stat.present}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-slate-300">Pres</span>
                                        </div>
                                        <div className="w-px h-4 bg-slate-100" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-red-500">{stat.absent}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-slate-300">Abs</span>
                                        </div>
                                        <div className="w-px h-4 bg-slate-100" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-slate-700">{stat.total_classes}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-slate-300">Tot</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
