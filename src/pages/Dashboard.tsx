import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, BookOpen, User, ArrowRight, MapPin } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { CountdownWidget } from '../components/dashboard/CountdownWidget';
import { PetWidget } from '../components/gamification/PetWidget';
import { cn } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';
import { SEO } from '../components/SEO';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableWidget } from '../components/dashboard/SortableWidget';
import { SubjectVault } from '../components/vault/SubjectVault';



export function Dashboard() {
    const { user } = useAuth();
    const { syncHealth } = useGamification();
    const [nextClass, setNextClass] = useState<any>(null);
    const [ongoingClass, setOngoingClass] = useState<any>(null);
    const [userName, setUserName] = useState('Student');
    const [attendancePercentage, setAttendancePercentage] = useState(0);

    const [todayClasses, setTodayClasses] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [cgpa, setCgpa] = useState(0);
    const [credits, setCredits] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const { privacyMode } = useSettings();

    // Vault State
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [vaultSubject, setVaultSubject] = useState<{ name: string, code: string } | null>(null);

    const openVault = (subjectName: string, subjectCode: string) => {
        setVaultSubject({ name: subjectName, code: subjectCode });
        setIsVaultOpen(true);
    };

    useEffect(() => {
        // Live Clock
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

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

            // For demo, if weekend, default to Monday, UNLESS there is a specific order
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

                // Find next and ongoing class based on current time
                const now = new Date();
                const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

                const current = all.find(c => c.start_time <= timeStr && c.end_time > timeStr);
                const upcoming = all.find(c => c.start_time > timeStr);

                setOngoingClass(current || null);
                setNextClass(upcoming || all[0]); // Default to first class if day is over or just started

                if (logsRes.data && logsRes.data.length > 0) {
                    const present = logsRes.data.filter(l => l.status === 'present').length;
                    const total = logsRes.data.length;
                    const percentage = Math.round((present / total) * 100);
                    setAttendancePercentage(percentage);
                    syncHealth(percentage);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
        // Refresh data every minute to update ongoing status
        const dataTimer = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(dataTimer);
    }, [user]);

    // DnD State
    const [items, setItems] = useState<string[]>(() => {
        const saved = localStorage.getItem('dashboard-layout');
        const defaultItems = ['countdown'];
        if (saved) {
            const parsed = JSON.parse(saved);
            // Filter out 'tasks' if legacy data exists
            return parsed.filter((i: string) => i !== 'tasks');
        }
        return defaultItems;
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newItems = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('dashboard-layout', JSON.stringify(newItems)); // Persist
                return newItems;
            });
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 pb-32 animate-fade-in-up max-w-[1600px] mx-auto min-h-screen">
            <SEO
                title="Dashboard"
                description="Your student command center."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* === LEFT COLUMN (Main Focus) === */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. HEADER (Reference Style: Avatar Left, Text Right) */}
                    <div className="flex items-center gap-4 px-2">
                        <Link to="/profile" className="group/avatar relative shrink-0">
                            {avatarUrl ? (
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-xl transition-transform group-hover/avatar:scale-105 ring-2 ring-slate-100">
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-xl ring-2 ring-slate-100">
                                    <User className="h-8 w-8" />
                                </div>
                            )}
                            {/* Online Badge */}
                            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                                Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">{userName}</span>
                            </h1>
                            <p className="text-sm font-medium text-slate-500 tracking-wide">
                                Your focus space is ready.
                            </p>
                        </div>
                    </div>

                    {/* 2. DATE & TIME BAR */}
                    <div className="w-full card-base px-8 py-6 flex justify-between items-center bg-white/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }).toUpperCase()}
                            </div>
                        </div>
                        <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-variant-numeric tabular-nums">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                    </div>

                    {/* 3. LIVE FOCUS CARD - Full Width on Desktop */}
                    <div className="card-base p-8 md:p-12 relative overflow-hidden group hover-lift bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 border-slate-100">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors duration-700"></div>

                        {/* Header: Status */}
                        <div className="relative z-10 flex justify-between items-start mb-10">
                            {ongoingClass ? (
                                <span className="px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live
                                </span>
                            ) : (
                                <span className="px-4 py-2 rounded-full bg-white text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm border border-slate-100">
                                    <div className="w-2 h-2 rounded-full bg-slate-400" /> Up Next
                                </span>
                            )}

                            {(ongoingClass || nextClass) && (
                                <button
                                    onClick={() => openVault((ongoingClass || nextClass).subject_name, (ongoingClass || nextClass).subject_code)}
                                    className="p-3 rounded-full bg-white shadow-sm border border-slate-100 hover:scale-110 hover:shadow-md transition-all active:scale-95"
                                >
                                    <BookOpen className="h-5 w-5 text-slate-900" />
                                </button>
                            )}
                        </div>

                        {/* Content: Subject Info */}
                        <div className="relative z-10">
                            {ongoingClass || nextClass ? (
                                <div className="mb-10">
                                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight mb-3">
                                        {(ongoingClass || nextClass).subject_name}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
                                        {(ongoingClass || nextClass).subject_code}
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-10 py-6">
                                    <h2 className="text-4xl md:text-5xl font-black text-slate-300 tracking-tighter leading-tight">No classes scheduled.</h2>
                                    <p className="text-sm font-bold text-slate-400 mt-2">Time to relax.</p>
                                </div>
                            )}

                            {/* Footer: Metadata Pills - Monochrome */}
                            {(ongoingClass || nextClass) && (
                                <div className="flex flex-wrap gap-3">
                                    <div className="px-5 py-3 rounded-2xl bg-white border border-slate-100 flex items-center gap-3 shadow-sm">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span className="text-base font-bold text-slate-700 tabular-nums">
                                            {ongoingClass
                                                ? `${ongoingClass.start_time.slice(0, 5)} - ${ongoingClass.end_time.slice(0, 5)}`
                                                : `${nextClass.start_time.slice(0, 5)} - ${nextClass.end_time.slice(0, 5)}`
                                            }
                                        </span>
                                    </div>
                                    {(ongoingClass || nextClass).room_number && (
                                        <div className="px-5 py-3 rounded-2xl bg-white border border-slate-100 flex items-center gap-3 shadow-sm">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                            <span className="text-base font-bold text-slate-700">
                                                {(ongoingClass || nextClass).room_number}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* === RIGHT COLUMN (Stats & Widgets) === */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Pet Widget (Study Buddy) */}
                    <div className="hover-lift">
                        <PetWidget />
                    </div>

                    {/* 5. STATS STACK - Clean Monochrome */}
                    <div className="card-base p-8 text-center relative overflow-hidden group hover-lift flex flex-col items-center justify-center bg-white">
                        <div className="mb-4 p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <Clock className="h-8 w-8 text-slate-900" />
                        </div>
                        <div className={cn("text-6xl font-black text-slate-900 tracking-tighter mb-2 tabular-nums", privacyMode && "blur-md select-none")}>
                            {attendancePercentage}%
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Attendance</div>
                    </div>

                    {/* Academics Split Row - Clean Monochrome */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card-base p-6 flex flex-col items-center justify-center text-center hover-lift bg-white">
                            <div className={cn("text-3xl font-black text-slate-900 tracking-tighter mb-1", privacyMode && "blur-md select-none")}>
                                {cgpa > 0 ? cgpa : '-'}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CGPA</div>
                        </div>
                        <div className="card-base p-6 flex flex-col items-center justify-center text-center hover-lift bg-white">
                            <div className={cn("text-3xl font-black text-slate-900 tracking-tighter mb-1", privacyMode && "blur-md select-none")}>
                                {credits > 0 ? credits : '-'}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credits</div>
                        </div>
                    </div>

                    {/* 6. COMPACT WIDGETS (Countdown only) */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={items} strategy={rectSortingStrategy}>
                            <div className="space-y-4">
                                {items.map(id => {
                                    if (id === 'countdown') {
                                        return (
                                            <SortableWidget key={id} id={id}>
                                                <div className="bg-white/60 p-6 rounded-[2rem] hover:bg-white transition-colors">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><Clock className="h-4 w-4" /></div>
                                                            <span className="font-bold text-slate-700">Timer</span>
                                                        </div>
                                                    </div>
                                                    <CountdownWidget />
                                                </div>
                                            </SortableWidget>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Schedule List (Compact) */}
                    <div className="bg-white/40 p-6 rounded-[2rem] flex flex-col max-h-[300px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700">Today's Schedule</h3>
                            <Link to="/timetable" className="p-2 hover:bg-white rounded-full transition-colors"><ArrowRight className="h-4 w-4 text-slate-400" /></Link>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                            {todayClasses.length > 0 ? (
                                todayClasses.map((c, i) => {
                                    const now = new Date();
                                    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                                    const isCurrent = c.start_time <= timeStr && c.end_time > timeStr;
                                    return (
                                        <div key={i} className={cn("p-3 rounded-xl flex items-center justify-between text-sm", isCurrent ? "bg-white shadow-sm" : "text-slate-500")}>
                                            <span className="font-bold truncate max-w-[120px]">{c.subject_name}</span>
                                            <span className="font-mono text-xs opacity-70">{c.start_time.slice(0, 5)}</span>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-center text-xs text-slate-400 py-4">No classes.</p>
                            )}
                        </div>
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
