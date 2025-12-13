import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, CalendarCheck, LogOut, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from './PageTransition';

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const { signOut } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label?: string }) => (
        <Link
            to={to}
            className={cn(
                "group relative flex items-center gap-3 p-3 rounded-[1.5rem] transition-all duration-500 ease-out hover:bg-white/40",
                isActive(to)
                    ? "text-primary-600 bg-white/60 shadow-[0_8px_20px_rgba(0,0,0,0.05)] scale-105"
                    : "text-slate-500 hover:scale-105"
            )}
        >
            <div className={cn(
                "absolute left-2 w-1 h-8 bg-primary-500 rounded-full transition-all duration-500 ease-spring",
                isActive(to) ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
            )} />

            <Icon className={cn(
                "h-6 w-6 transition-transform duration-500 ease-spring group-hover:rotate-12",
                isActive(to) ? "fill-primary-500/20 stroke-primary-600" : "stroke-slate-500"
            )} />

            {isDesktop && (
                <span className={cn(
                    "font-bold text-xs tracking-wide transition-all duration-300",
                    isActive(to) ? "text-slate-900" : "text-slate-500"
                )}>
                    {label}
                </span>
            )}
        </Link>
    );

    return (
        <div className="min-h-screen pb-24 relative font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
            {/* Aurora Background is handled in index.css body, but we can add an overlay if needed */}

            {/* Desktop Floating Dock (Sidebar) */}
            {isDesktop && (
                <aside className="fixed left-4 top-1/2 -translate-y-1/2 h-[90vh] w-64 glass-vision rounded-[2rem] z-50 p-6 flex flex-col justify-between shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/40">
                    <div className="flex items-center gap-4 px-2 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30 animate-float">
                            <span className="text-xl">A</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">TT Tracker</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold ml-0.5">Niki OS</span>
                        </div>
                    </div>

                    <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar py-4 -mx-4 px-4 mask-fade">
                        <div className="space-y-1">
                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-50">Menu</p>
                            <NavItem to="/" icon={Home} label="Dashboard" />
                            <NavItem to="/schedule" icon={Calendar} label="Schedule" />
                            <NavItem to="/tasks" icon={CalendarCheck} label="Assignments" />
                            <NavItem to="/notes" icon={Calendar} label="Notes" />
                        </div>

                        <div className="space-y-1 mt-8">
                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-50">Tools</p>
                            <NavItem to="/simulator" icon={Calculator} label="Simulator" />
                            <NavItem to="/attendance" icon={CalendarCheck} label="Attendance" />
                            <NavItem to="/profile" icon={User} label="Profile" />
                        </div>
                    </nav>

                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 p-4 rounded-3xl text-slate-500 hover:text-red-500 hover:bg-red-50/50 transition-all mt-6 group border border-transparent hover:border-red-100"
                    >
                        <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </aside>
            )}

            {/* Main Content Area */}
            <div className={cn(
                "relative z-10 min-h-screen transition-all duration-500 ease-out",
                isDesktop ? "ml-72 p-6" : "pb-32 px-4 pt-4 max-w-lg mx-auto"
            )}>
                <div className={cn("mx-auto h-full", isDesktop ? "max-w-5xl" : "")}>
                    <PageTransition>
                        {children}
                    </PageTransition>
                </div>
            </div>

            {/* Mobile Floating Capsule */}
            {!isDesktop && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50">
                    <nav className="glass-vision rounded-full px-2 py-2 flex justify-between items-center ring-1 ring-white/40 shadow-2xl">
                        {[
                            { to: '/', icon: Home },
                            { to: '/schedule', icon: Calendar },
                            { to: '/tasks', icon: CalendarCheck },
                            { to: '/notes', icon: Calendar }, // Reusing Calendar icon as placeholder or needs Note icon
                            { to: '/profile', icon: User }
                        ].map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={cn(
                                    "p-4 rounded-full transition-all duration-500 ease-spring relative isolate",
                                    isActive(item.to)
                                        ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] -translate-y-4 scale-110 z-10"
                                        : "text-slate-400 hover:text-primary-500"
                                )}
                            >
                                <item.icon className={cn("h-6 w-6 transition-all", isActive(item.to) ? "text-primary-600 fill-primary-100 scale-110" : "")} />
                                {isActive(item.to) && <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-md opacity-0 animate-fade-in-up">Active</span>}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </div>
    );
}
