import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, ListChecks, BookOpen, User, Flame } from 'lucide-react';
import { StickyNoteWidget } from '../components/dashboard/StickyNoteWidget';
import { useGamification } from '../context/GamificationContext';
import { CountdownWidget } from '../components/dashboard/CountdownWidget';
import { MiniTaskWidget } from '../components/dashboard/MiniTaskWidget';
import { cn } from '../lib/utils';
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
    const { streak } = useGamification();
    const [nextClass, setNextClass] = useState<any>(null);
    const [ongoingClass, setOngoingClass] = useState<any>(null);
    const [userName, setUserName] = useState('Student');
    const [attendancePercentage, setAttendancePercentage] = useState(0);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendanceGoal, setAttendanceGoal] = useState(75);
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
            const queryDay = ['Saturday', 'Sunday'].includes(today) ? 'Monday' : today;

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
                    if (profile.attendance_goal) setAttendanceGoal(profile.attendance_goal);
                    if (profile.cgpa) setCgpa(profile.cgpa);
                    if (profile.credits) setCredits(profile.credits);
                    if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
                }

                const all = [...(basicRes.data || []), ...(smartRes.data || [])];
                all.sort((a, b) => a.start_time.localeCompare(b.start_time));

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
                    setAttendancePercentage(Math.round((present / total) * 100));
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
        return saved ? JSON.parse(saved) : ['tasks', 'countdown'];
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
        <div className="p-2 md:p-4 space-y-8 pb-32 animate-fade-in-up max-w-5xl mx-auto">
            <SEO
                title="Dashboard"
                description="View your daily schedule, attendance stats, and upcoming classes."
            />
            {/* iOS 26 Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="flex items-center gap-8">
                    <Link to="/profile">
                        {avatarUrl ? (
                            <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border border-white/50 shadow-2xl shadow-indigo-500/20 animate-breathe transition-transform hover:scale-105 active:scale-95">
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-[1.5rem] glass-vision flex items-center justify-center text-slate-400 border border-white/50 shadow-2xl animate-breathe transition-transform hover:scale-105 active:scale-95">
                                <User className="h-8 w-8 text-primary-300" />
                            </div>
                        )}
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-semibold tracking-tighter text-slate-900 leading-none">
                            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-400">{userName}</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium mt-1 tracking-wide font-display">Your focus space is ready.</p>
                    </div>
                </div>

                <div className="text-right hidden sm:flex items-center gap-4">
                    <div className="glass-panel px-5 py-3 rounded-full flex items-center gap-2 animate-fade-in-up">
                        <Flame className={cn("h-6 w-6", streak > 0 ? "text-orange-500 fill-orange-500/20" : "text-slate-300")} />
                        <div>
                            <div className="text-xl font-black text-slate-800 leading-none">{streak}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Day Streak</div>
                        </div>
                    </div>

                    <div className="glass-panel px-6 py-3 rounded-full">
                        <div className="text-3xl font-bold text-slate-800 tracking-tight font-variant-numeric tabular-nums">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Clock */}
            <div className="sm:hidden glass-vision p-6 rounded-[2rem] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                    </div>
                    {streak > 0 && (
                        <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                            <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />
                            <span className="text-xs font-bold text-orange-600">{streak}</span>
                        </div>
                    )}
                </div>
                <div className="text-3xl font-black text-slate-800 font-variant-numeric tabular-nums">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Column: Schedule (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Hero Spatial Card */}
                    <div className={cn(
                        "relative overflow-hidden group transition-all duration-700 ease-out rounded-[2.5rem] min-h-[220px] flex flex-col justify-between p-8",
                        ongoingClass
                            ? "bg-white shadow-[0_30px_60px_rgba(255,100,100,0.2)] ring-1 ring-red-100/50"
                            : "bg-white shadow-[0_30px_60px_rgba(100,100,255,0.15)] ring-1 ring-white/60"
                    )}>
                        {/* Aurora Blob inside card */}
                        <div className="absolute top-[-50%] right-[-20%] w-[400px] h-[400px] bg-gradient-to-br from-primary-200/40 to-indigo-200/40 rounded-full blur-[80px] animate-blob mix-blend-multiply opacity-60"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                {ongoingClass ? (
                                    <span className="glass-panel px-4 py-2 rounded-full text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-red-200/50 shadow-lg">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Live Now
                                    </span>
                                ) : (
                                    <span className="glass-panel px-4 py-2 rounded-full text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-primary-400"></span> Up Next
                                    </span>
                                )}

                                {(ongoingClass || nextClass) && (
                                    <button
                                        onClick={() => openVault((ongoingClass || nextClass).subject_name, (ongoingClass || nextClass).subject_code)}
                                        className="glass-button p-4 rounded-full text-slate-600 hover:text-primary-600 hover:scale-110 active:scale-90"
                                    >
                                        <BookOpen className="h-6 w-6" />
                                    </button>
                                )}
                            </div>

                            {ongoingClass ? (
                                <div className="space-y-2">
                                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tighter leading-[0.9]">{ongoingClass.subject_name}</h2>
                                    <p className="text-lg md:text-xl text-slate-500 font-medium tracking-wide">{ongoingClass.subject_code}</p>
                                </div>
                            ) : nextClass ? (
                                <div className="space-y-2">
                                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tighter leading-[0.9] opacity-90">{nextClass.subject_name}</h2>
                                    <p className="text-lg md:text-xl text-slate-500 font-medium tracking-wide">{nextClass.subject_code}</p>
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-2xl font-bold text-slate-300 tracking-tight">No classes scheduled.</p>
                                </div>
                            )}
                        </div>

                        <div className="relative z-10 md:self-end mt-4 flex flex-wrap gap-3">
                            {((ongoingClass || nextClass)) && (
                                <>
                                    <div className="glass-panel px-6 py-4 rounded-[1.5rem] flex items-center gap-3">
                                        <Clock className={cn("h-5 w-5", ongoingClass ? "text-red-500" : "text-primary-500")} />
                                        <span className="text-lg font-bold text-slate-700 tracking-tight font-variant-numeric">
                                            {ongoingClass ? ongoingClass.end_time.slice(0, 5) : `${nextClass.start_time.slice(0, 5)} - ${nextClass.end_time.slice(0, 5)}`}
                                        </span>
                                    </div>
                                    {(ongoingClass || nextClass).room_number && (
                                        <div className="glass-panel px-6 py-4 rounded-[1.5rem] flex items-center gap-3">
                                            <MapPin className="h-5 w-5 text-indigo-500" />
                                            <span className="text-lg font-bold text-slate-700 tracking-tight">{(ongoingClass || nextClass).room_number}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Widgets Grid */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {items.map(id => {
                                    if (id === 'tasks') {
                                        return (
                                            <SortableWidget key={id} id={id}>
                                                <div className="glass-vision p-6 rounded-[2rem] hover:scale-[1.02] transition-transform duration-500 h-full">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><ListChecks className="h-4 w-4" /></span>
                                                        <span className="text-base font-bold text-slate-700 tracking-tight">Tasks</span>
                                                    </div>
                                                    <MiniTaskWidget />
                                                </div>
                                            </SortableWidget>
                                        );
                                    } else if (id === 'countdown') {
                                        return (
                                            <SortableWidget key={id} id={id}>
                                                <div className="glass-vision p-6 rounded-[2rem] hover:scale-[1.02] transition-transform duration-500 h-full">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 shadow-sm"><Clock className="h-4 w-4" /></span>
                                                        <span className="text-base font-bold text-slate-700 tracking-tight">Countdown</span>
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
                </div>

                {/* Sidebar Column: Stats (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Attendance Stack */}
                    <div className="glass-vision p-6 rounded-[2.5rem] text-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-200"></div>
                        <div className={cn(
                            "w-16 h-16 mx-auto rounded-[1.5rem] flex items-center justify-center mb-4 shadow-xl transition-transform group-hover:rotate-12 duration-500",
                            attendancePercentage < attendanceGoal ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                        )}>
                            <Clock className="h-6 w-6" />
                        </div>
                        <div className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tighter mb-2 font-variant-numeric tabular-nums">
                            {attendancePercentage}%
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Attendance</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-vision p-5 rounded-[2rem] flex flex-col items-center justify-center hover:-translate-y-2 transition-transform duration-500">
                            <div className="text-3xl font-bold text-slate-800 tracking-tighter font-variant-numeric">{cgpa > 0 ? cgpa : '-'}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">CGPA</div>
                        </div>
                        <div className="glass-vision p-5 rounded-[2rem] flex flex-col items-center justify-center hover:-translate-y-2 transition-transform duration-500">
                            <div className="text-3xl font-bold text-slate-800 tracking-tighter font-variant-numeric">{credits > 0 ? credits : '-'}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Credits</div>
                        </div>
                    </div>

                    <div className="glass-vision p-0 rounded-[2.5rem] overflow-hidden">
                        <StickyNoteWidget />
                    </div>
                </div>
            </div>

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
