import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, BookOpen, MapPin, MoreHorizontal } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { cn, formatTime } from '../lib/utils';
import { SEO } from '../components/SEO';
import { SubjectVault } from '../components/vault/SubjectVault';

export function Dashboard() {
    const { user } = useAuth();
    const { syncHealth } = useGamification();
    const [ongoingClass, setOngoingClass] = useState<any>(null);
    const [nextClass, setNextClass] = useState<any>(null);
    const [userName, setUserName] = useState('Student');
    const [attendancePercentage, setAttendancePercentage] = useState(0);

    const [todayClasses, setTodayClasses] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [cgpa, setCgpa] = useState(0);
    const [credits, setCredits] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Vault State
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [vaultSubject, setVaultSubject] = useState<{ name: string, code: string } | null>(null);

    const openVault = (subjectName: string, subjectCode: string) => {
        setVaultSubject({ name: subjectName, code: subjectCode });
        setIsVaultOpen(true);
    };

    const colors = [
        'bg-rose-100 border-rose-200 text-rose-900',
        'bg-indigo-100 border-indigo-200 text-indigo-900',
        'bg-amber-100 border-amber-200 text-amber-900',
        'bg-emerald-100 border-emerald-200 text-emerald-900',
        'bg-cyan-100 border-cyan-200 text-cyan-900',
    ];

    const dotColors = [
        'bg-rose-500',
        'bg-indigo-500',
        'bg-amber-500',
        'bg-emerald-500',
        'bg-cyan-500',
    ];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchDashboardData = async () => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            // For demo, if weekend, default to Monday
            const { getDayOrder } = await import('../lib/dayOrder');
            const todayStr = new Date().toISOString().split('T')[0];
            const order = getDayOrder(todayStr);
            const queryDay = order ? order : (['Saturday', 'Sunday'].includes(today) ? 'Monday' : today);

            try {
                const [profileRes, basicRes, smartRes, logsRes] = await Promise.all([
                    supabase.from('profiles').select('full_name, attendance_goal, cgpa, credits, avatar_url').eq('id', user.id).single(),
                    supabase.from('timetable_entries').select('*').eq('user_id', user.id).eq('day', queryDay),
                    supabase.from('smart_timetable_entries').select('*').eq('user_id', user.id).eq('day', queryDay),
                    supabase.from('attendance_logs').select('status').eq('user_id', user.id)
                ]);

                if (profileRes.data) {
                    const profile = profileRes.data;
                    if (profile.full_name) setUserName(profile.full_name.split(' ')[0]);
                    if (profile.cgpa) setCgpa(profile.cgpa);
                    if (profile.credits) setCredits(profile.credits);
                    if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
                }

                const all = [...(basicRes.data || []), ...(smartRes.data || [])];
                all.sort((a, b) => a.start_time.localeCompare(b.start_time));
                setTodayClasses(all);

                const now = new Date();
                const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

                const current = all.find(c => c.start_time <= timeStr && c.end_time > timeStr);
                const upcoming = all.find(c => c.start_time > timeStr);

                setOngoingClass(current || null);
                setNextClass(upcoming || all[0]);

                if (logsRes.data && logsRes.data.length > 0) {
                    const present = logsRes.data.filter(l => l.status === 'present').length;
                    const total = logsRes.data.length;
                    setAttendancePercentage(Math.round((present / total) * 100));
                    syncHealth(Math.round((present / total) * 100));
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
        const dataTimer = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(dataTimer);
    }, [user]);

    return (
        <div className="p-6 md:p-10 pb-32 animate-fade-in-up max-w-7xl mx-auto min-h-screen bg-stone-50/50">
            <SEO title="Dashboard" description="Your focus space." />

            {/* Mobile Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Dashboard</h1>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                        Hello, {userName}.
                    </h2>
                    <p className="text-slate-500 font-medium">
                        Your focus space is ready.
                    </p>
                </div>
                <div className="flex flex-col-reverse md:flex-row items-end md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-lg md:text-2xl font-bold text-slate-900 leading-none">{currentTime.getDate()}</div>
                            <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">{currentTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
                        </div>
                        <div className="h-8 md:h-10 w-px bg-slate-300"></div>
                        <div className="text-right">
                            <div className="text-base md:text-xl font-bold text-slate-900 leading-none">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                            <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Time</div>
                        </div>
                    </div>

                    <Link to="/profile" className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold">?</div>
                        )}
                    </Link>
                </div>
            </div>

            {/* HERO CARD */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden mb-8">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-80 decoration-slice"></div>

                <div className="relative z-10 flex flex-col gap-6">
                    <div>
                        <span className="inline-block px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-[10px] font-bold uppercase tracking-wider mb-4">
                            {ongoingClass ? "LIVE CLASS" : "NEXT CLASS"}
                        </span>

                        {ongoingClass || nextClass ? (
                            <>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-4">
                                    {(ongoingClass || nextClass).subject_name}
                                </h3>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                        <BookOpen className="h-4 w-4" />
                                        {(ongoingClass || nextClass).subject_code}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                        <Clock className="h-4 w-4" />
                                        {formatTime((ongoingClass || nextClass).start_time)} - {formatTime((ongoingClass || nextClass).end_time)}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                        <MapPin className="h-4 w-4" />
                                        {(ongoingClass || nextClass).room_number || "SJT802"}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <h3 className="text-xl font-bold text-slate-300 py-8">No classes scheduled.</h3>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">

                        {(ongoingClass || nextClass) && (
                            <>
                                <button
                                    onClick={() => openVault((ongoingClass || nextClass).subject_name, (ongoingClass || nextClass).subject_code)}
                                    className="px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Open Notes
                                </button>

                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* LEFT COL: Stats Widgets */}
                <div className="space-y-6">
                    {/* CGPA & Credits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#F5F5F4] rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center h-32">
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">CGPA</div>
                            <div className="text-3xl font-bold text-slate-900">{cgpa || '-'}</div>
                        </div>
                        <div className="bg-[#F5F5F4] rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center h-32">
                            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">CREDITS</div>
                            <div className="text-3xl font-bold text-slate-900">{credits || '-'}</div>
                        </div>
                    </div>

                    {/* Attendance */}
                    <div className="bg-[#EFEEEE] rounded-[1.5rem] p-6 flex items-center justify-between min-h-[120px]">
                        <div>
                            <div className="text-4xl font-bold text-slate-900 leading-none mb-1">{attendancePercentage}%</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">ATTENDANCE</div>
                        </div>
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className="text-[#EA580C]" strokeDasharray={`${attendancePercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    </div>


                </div>

                {/* RIGHT COL: Today's Schedule */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <div className="font-bold text-slate-900 text-lg">Today's Schedule</div>
                        <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="relative pl-3 space-y-4">
                        {/* Timeline Line */}
                        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-300"></div>

                        {todayClasses.map((c, i) => {
                            const colorIndex = i % colors.length;
                            return (
                                <div key={i} className="relative pl-8">
                                    {/* Dot */}
                                    <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-[#FDFBF7] z-10", dotColors[colorIndex])}></div>

                                    <div className={cn("rounded-xl p-4 flex justify-between items-center shadow-sm", colors[colorIndex])}>
                                        <div>
                                            <div className="font-bold text-sm leading-tight mb-0.5">{c.subject_name}</div>
                                            {/* <div className="text-xs opacity-70">{c.subject_code}</div> */}
                                        </div>
                                        <div className="text-sm font-bold opacity-80 pl-4">{formatTime(c.start_time)}</div>
                                    </div>
                                </div>
                            )
                        })}
                        {todayClasses.length === 0 && (
                            <div className="text-center text-slate-400 italic py-8">No classes today</div>
                        )}
                    </div>
                </div>
            </div>



            {/* Vault Modal */}
            {SubjectVault && vaultSubject && (
                <SubjectVault
                    isOpen={isVaultOpen}
                    onClose={() => setIsVaultOpen(false)}
                    subjectName={vaultSubject.name}
                    subjectCode={vaultSubject.code}
                />
            )}
        </div>
    );
}
