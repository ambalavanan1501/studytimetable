import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Check, X, Clock, ChevronLeft, ChevronRight, BarChart3, ListChecks, AlertTriangle } from 'lucide-react';
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
        <div className="p-2 md:p-6 space-y-8 pb-32 animate-fade-in-up md:px-4">
            <div className="flex flex-col gap-2 mt-4 ml-2">
                <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tighter leading-none">Attendance</h1>
                <p className="text-lg text-slate-500 font-medium font-display tracking-wide">Stay present, stay ahead.</p>
            </div>

            {/* View Switcher - Floating Glass Capsule */}
            <div className="flex justify-center sticky top-4 z-40">
                <div className="glass-vision p-1.5 rounded-full flex gap-1 shadow-2xl backdrop-blur-3xl border border-white/60">
                    <button
                        onClick={() => setView('mark')}
                        className={cn(
                            "px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2",
                            view === 'mark'
                                ? "bg-slate-900 text-white shadow-lg scale-105"
                                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
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
                                ? "bg-slate-900 text-white shadow-lg scale-105"
                                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
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
                    <div className="glass-vision p-4 rounded-[2rem] flex items-center justify-between shadow-xl">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-4 hover:bg-white/50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">{getDayName(selectedDate)}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-slate-900 tracking-tighter tabular-nums">
                                    {selectedDate.toLocaleDateString(undefined, { day: 'numeric' })}
                                </span>
                                <span className="text-xl font-medium text-slate-500">
                                    {selectedDate.toLocaleDateString(undefined, { month: 'long' })}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => changeDate(1)}
                            className="p-4 hover:bg-white/50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Class List */}
                    <div className="space-y-6">
                        {classes.length === 0 ? (
                            <div className="text-center py-20 px-6 glass-vision rounded-[3rem] border-2 border-dashed border-white/30">
                                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300 animate-float">
                                    <CalendarIcon className="h-10 w-10" />
                                </div>
                                <p className="text-2xl font-bold text-slate-300 tracking-tight">No classes scheduled</p>
                            </div>
                        ) : (
                            classes.map((cls) => {
                                const log = attendanceLogs.find(l => l.subject_code === cls.subject_code);
                                const isPresent = log?.status === 'present';
                                const isAbsent = log?.status === 'absent';

                                return (
                                    <div key={cls.id} className="glass-vision p-5 rounded-[1.5rem] group hover:bg-white/60 transition-all duration-300">
                                        <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="glass-panel px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        {cls.subject_code}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest",
                                                        cls.type === 'theory' ? "bg-indigo-100 text-indigo-700" : "bg-pink-100 text-pink-700"
                                                    )}>
                                                        {cls.type}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-2xl text-slate-900 tracking-tight leading-none">{cls.subject_name}</h3>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white/40 px-4 py-2 rounded-xl self-start">
                                                <Clock className="h-4 w-4" />
                                                {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => markAttendance(cls.subject_code, 'present')}
                                                className={cn(
                                                    "flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-bold transition-all duration-300 relative overflow-hidden group/btn",
                                                    isPresent
                                                        ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]"
                                                        : "bg-white/50 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600"
                                                )}
                                            >
                                                <Check className="h-5 w-5 stroke-[3px]" />
                                                <span>Present</span>
                                                {isPresent && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                            </button>
                                            <button
                                                onClick={() => markAttendance(cls.subject_code, 'absent')}
                                                className={cn(
                                                    "flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-bold transition-all duration-300 relative overflow-hidden group/btn",
                                                    isAbsent
                                                        ? "bg-red-500 text-white shadow-xl shadow-red-500/30 scale-[1.02]"
                                                        : "bg-white/50 text-slate-400 hover:bg-red-100 hover:text-red-600"
                                                )}
                                            >
                                                <X className="h-5 w-5 stroke-[3px]" />
                                                <span>Absent</span>
                                                {isAbsent && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-400 glass-vision rounded-[3rem]">
                            <p className="text-xl font-bold">No attendance data yet</p>
                            <p className="text-sm mt-2 opacity-60">Start marking your classes to see stats!</p>
                        </div>
                    ) : (
                        stats.map((stat) => {
                            const percentageColor = stat.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500';

                            return (
                                <div key={stat.subject_code} className="glass-vision p-5 rounded-[1.5rem] hover:scale-[1.02] transition-all duration-500 group relative overflow-hidden">
                                    {/* Background Gradient based on percentage */}
                                    {stat.percentage < 75 && <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-50 pointer-events-none" />}

                                    <div className="relative z-10 flex justify-between items-start mb-6">
                                        <div className="flex-1 pr-4">
                                            <h3 className="font-bold text-slate-900 text-xl leading-tight mb-2 line-clamp-1" title={stat.subject_name}>{stat.subject_name}</h3>
                                            <span className="glass-panel px-2 py-1 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.subject_code}</span>
                                        </div>
                                        <div className={cn(
                                            "min-w-[4rem] h-[4rem] rounded-[1.5rem] flex items-center justify-center text-xl font-black shadow-lg",
                                            stat.percentage >= 75 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                        )}>
                                            {stat.percentage}
                                            <span className="text-xs ml-0.5">%</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar Container */}
                                    <div className="h-4 w-full bg-slate-100/50 rounded-full overflow-hidden mb-6 ring-1 ring-white/50">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", percentageColor)}
                                            style={{ width: `${stat.percentage}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="bg-white/40 rounded-2xl p-3 border border-white/60">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Present</div>
                                            <div className="text-xl font-black text-emerald-600">{stat.present}</div>
                                        </div>
                                        <div className="bg-white/40 rounded-2xl p-3 border border-white/60">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Absent</div>
                                            <div className="text-xl font-black text-red-600">{stat.absent}</div>
                                        </div>
                                        <div className="bg-white/40 rounded-2xl p-3 border border-white/60">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total</div>
                                            <div className="text-xl font-black text-slate-700">{stat.total_classes}</div>
                                        </div>
                                    </div>

                                    {stat.percentage < 75 && (
                                        <div className="mt-6 flex items-center gap-3 text-xs font-bold text-red-600 bg-red-100/50 px-4 py-3 rounded-xl border border-red-100/50">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Attendance Critical</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
