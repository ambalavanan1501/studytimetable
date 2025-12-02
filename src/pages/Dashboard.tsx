import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, Quote, Radio, BarChart3, ListChecks } from 'lucide-react';
import { StickyNoteWidget } from '../components/dashboard/StickyNoteWidget';
import { CountdownWidget } from '../components/dashboard/CountdownWidget';
import { MiniTaskWidget } from '../components/dashboard/MiniTaskWidget';
import { cn } from '../lib/utils';

const QUOTES = [
    { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
    { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
    { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
];

export function Dashboard() {
    const { user } = useAuth();
    const [nextClass, setNextClass] = useState<any>(null);
    const [ongoingClass, setOngoingClass] = useState<any>(null);
    const [userName, setUserName] = useState('Student');
    const [attendancePercentage, setAttendancePercentage] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [quote, setQuote] = useState(QUOTES[0]);
    const [attendanceGoal, setAttendanceGoal] = useState(75);
    const [cgpa, setCgpa] = useState(0);
    const [credits, setCredits] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        // Live Clock
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Daily Quote
        const dayOfMonth = new Date().getDate();
        setQuote(QUOTES[dayOfMonth % QUOTES.length]);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchDashboardData = async () => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, attendance_goal, cgpa, credits, avatar_url')
                .eq('id', user.id)
                .single();

            if (profile) {
                if (profile.full_name) setUserName(profile.full_name.split(' ')[0]);
                if (profile.attendance_goal) setAttendanceGoal(profile.attendance_goal);
                if (profile.cgpa) setCgpa(profile.cgpa);
                if (profile.credits) setCredits(profile.credits);
                if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
            }

            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            // For demo, if weekend, default to Monday
            const queryDay = ['Saturday', 'Sunday'].includes(today) ? 'Monday' : today;

            const { data: basic } = await supabase
                .from('timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', queryDay);

            const { data: smart } = await supabase
                .from('smart_timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', queryDay);

            const all = [...(basic || []), ...(smart || [])];
            all.sort((a, b) => a.start_time.localeCompare(b.start_time));



            // Find next and ongoing class based on current time
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

            const current = all.find(c => c.start_time <= timeStr && c.end_time > timeStr);
            const upcoming = all.find(c => c.start_time > timeStr);

            setOngoingClass(current || null);
            setNextClass(upcoming || all[0]); // Default to first class if day is over or just started

            // Calculate Attendance Percentage
            const { data: logs } = await supabase
                .from('attendance_logs')
                .select('status')
                .eq('user_id', user.id);

            if (logs && logs.length > 0) {
                const present = logs.filter(l => l.status === 'present').length;
                const total = logs.length;
                setAttendancePercentage(Math.round((present / total) * 100));
            }
        };

        fetchDashboardData();
        // Refresh data every minute to update ongoing status
        const dataTimer = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(dataTimer);
    }, [user]);

    return (
        <div className="p-6 space-y-8 pb-24">
            {/* Welcome Header & Clock */}
            <div className="mt-4 flex justify-between items-end">
                <div className="flex items-center gap-4">
                    {avatarUrl && (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            Hello, <span className="text-primary-600">{userName}</span>
                        </h1>
                        <p className="text-slate-500 mt-1">Ready to learn?</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-2xl font-bold text-slate-700 font-mono">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Mobile Clock (Visible only on small screens) */}
            <div className="sm:hidden flex justify-between items-center bg-white/50 p-3 rounded-xl border border-white/50 shadow-sm">
                <div className="text-xs text-slate-500 font-medium">
                    {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xl font-bold text-slate-700 font-mono">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </div>
            </div>

            {/* Ongoing / Next Class Widget */}
            <div className={cn(
                "glass-card rounded-3xl p-6 relative overflow-hidden group transition-all duration-500",
                ongoingClass ? "border-primary-500/30 shadow-primary-200" : ""
            )}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        {ongoingClass ? (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                <Radio className="h-3 w-3" />
                                Live Now
                            </span>
                        ) : (
                            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Up Next
                            </span>
                        )}
                        <Clock className={cn("h-5 w-5", ongoingClass ? "text-red-400" : "text-primary-400")} />
                    </div>

                    {ongoingClass ? (
                        <>
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">{ongoingClass.subject_name}</h2>
                            <p className="text-slate-500 font-medium mb-6">{ongoingClass.subject_code}</p>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-semibold">
                                        Ends at {ongoingClass.end_time.slice(0, 5)}
                                    </span>
                                </div>
                                {ongoingClass.room_number && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm font-semibold">{ongoingClass.room_number}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : nextClass ? (
                        <>
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">{nextClass.subject_name}</h2>
                            <p className="text-slate-500 font-medium mb-6">{nextClass.subject_code}</p>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-semibold">
                                        {nextClass.start_time.slice(0, 5)} - {nextClass.end_time.slice(0, 5)}
                                    </span>
                                </div>
                                {nextClass.room_number && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm font-semibold">{nextClass.room_number}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-center text-slate-400">
                            <p>No classes scheduled for today!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform",
                        attendancePercentage < attendanceGoal ? "bg-red-100 text-red-600" : "bg-primary-100 text-primary-600"
                    )}>
                        <Clock className="h-6 w-6" />
                    </div>
                    <div className={cn(
                        "text-2xl font-bold mb-1",
                        attendancePercentage < attendanceGoal ? "text-red-600" : "text-slate-800"
                    )}>
                        {attendancePercentage}%
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Attendance</div>
                </div>

                <div className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center text-center hover:bg-white/50 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 mb-3 group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 mb-1">{cgpa > 0 ? cgpa : '-'}</div>
                    <div className="text-xs text-slate-500 font-medium">CGPA</div>
                </div>

                <div className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center text-center hover:bg-white/50 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                        <ListChecks className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 mb-1">{credits > 0 ? credits : '-'}</div>
                    <div className="text-xs text-slate-500 font-medium">Credits</div>
                </div>
            </div>

            {/* Productivity Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-48">
                <StickyNoteWidget />
                <CountdownWidget />
                <MiniTaskWidget />
            </div>

            {/* Quote of the Day */}
            <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Quote className="h-5 w-5 text-primary-500" />
                        <h3 className="font-bold text-slate-700">Quote of the Day</h3>
                    </div>
                    <p className="text-slate-600 italic mb-2">"{quote.text}"</p>
                    <p className="text-sm text-primary-600 font-medium">- {quote.author}</p>
                </div>
            </div>

            {/* Developer Button */}
            <div className="flex justify-center">
                <button
                    onClick={() => window.location.href = '/developer'}
                    className="glass-card px-6 py-2 rounded-full flex items-center gap-2 text-slate-500 font-medium text-sm hover:bg-white/50 transition-colors group"
                >
                    <span>Made by Developer</span>
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                        <span className="text-[10px]">Dev</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
