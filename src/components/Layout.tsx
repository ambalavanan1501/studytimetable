import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, CalendarCheck, LogOut, Calculator, Menu, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from './PageTransition';
import { useClassReminders } from '../hooks/useClassReminders';

export function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const { signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useClassReminders();

    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label?: string }) => (
        <Link
            to={to}
            className={cn(
                "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                isActive(to)
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
        >
            <Icon className={cn(
                "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                isActive(to) ? "stroke-white" : "stroke-current"
            )} />

            {isDesktop && (
                <span className="font-bold text-sm tracking-wide">
                    {label}
                </span>
            )}
        </Link>
    );

    return (
        <div className="min-h-screen pb-24 relative font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden bg-slate-50/50">
            {/* Desktop Sidebar */}
            {isDesktop && (
                <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 z-50 p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-3 px-2 mb-8">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-slate-900/20">
                            <span className="text-lg">A</span>
                        </div>
                        <div>
                            <span className="block text-xl font-bold text-slate-900 tracking-tight">TT Tracker</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Niki OS</span>
                        </div>
                    </div>

                    <nav className="space-y-6 flex-1 overflow-y-auto no-scrollbar py-2">
                        <div className="space-y-1">
                            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Menu</p>
                            <NavItem to="/" icon={Home} label="Dashboard" />
                            <NavItem to="/schedule" icon={Calendar} label="Schedule" />
                            <NavItem to="/tasks" icon={CalendarCheck} label="Assignments" />
                            <NavItem to="/notes" icon={FileText} label="Notes" />
                        </div>

                        <div className="space-y-1">
                            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tools</p>
                            <NavItem to="/simulator" icon={Calculator} label="Simulator" />
                            <NavItem to="/attendance" icon={CalendarCheck} label="Attendance" />
                            <NavItem to="/profile" icon={User} label="Profile" />
                        </div>
                    </nav>

                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all mt-6 group font-bold text-sm"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                    </button>
                </aside>
            )}

            {/* Main Content Area */}
            <div className={cn(
                "relative z-10 min-h-screen transition-all duration-300 ease-out",
                isDesktop ? "ml-64 p-8" : "pb-32 px-4 pt-6 max-w-lg mx-auto"
            )}>
                <div className={cn("mx-auto h-full", isDesktop ? "max-w-6xl" : "")}>
                    <PageTransition>
                        {children}
                    </PageTransition>
                </div>
            </div>

            {/* Mobile Navigation */}
            {!isDesktop && (
                <>
                    {/* Menu Overlay */}
                    <div className={cn(
                        "fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-all duration-300",
                        isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                    )} onClick={() => setIsMenuOpen(false)} />

                    {/* Menu Popup */}
                    <div className={cn(
                        "fixed bottom-24 right-4 z-50 bg-white p-4 rounded-[2rem] shadow-2xl border border-slate-100 min-w-[200px] transform transition-all duration-300 origin-bottom-right",
                        isMenuOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none"
                    )}>
                        <div className="flex flex-col gap-1">
                            {[
                                { to: '/tasks', icon: CalendarCheck, label: 'Assignments' },
                                { to: '/notes', icon: FileText, label: 'Notes' },
                                { to: '/simulator', icon: Calculator, label: 'Simulator' }
                            ].map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm tracking-wide">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Floating Bar */}
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                        <nav className="bg-white/90 backdrop-blur-xl px-2 py-2 rounded-full flex items-center gap-2 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100">
                            {[
                                { to: '/', icon: Home },
                                { to: '/schedule', icon: Calendar },
                                { to: '/attendance', icon: CalendarCheck },
                            ].map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                                        isActive(item.to)
                                            ? "bg-slate-900 text-white shadow-lg scale-105"
                                            : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                </Link>
                            ))}

                            <div className="w-px h-8 bg-slate-200 mx-1" />

                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={cn(
                                    "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                                    isMenuOpen
                                        ? "bg-slate-900 text-white rotate-90"
                                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                )}
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </nav>
                    </div>
                </>
            )}
        </div>
    );
}
