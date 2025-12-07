import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, CalendarCheck, LogOut, Calculator, BarChart2 } from 'lucide-react';
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
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                isActive(to)
                    ? "bg-primary-100 text-primary-600 shadow-sm"
                    : "text-slate-400 hover:text-primary-400 hover:bg-white/50"
            )}
        >
            <Icon className="h-6 w-6" />
            {isDesktop && <span className="font-bold text-sm">{label}</span>}
        </Link>
    );

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-300/30 rounded-full blur-3xl animate-blob mix-blend-multiply filter"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-300/30 rounded-full blur-3xl animate-blob animation-delay-2000 mix-blend-multiply filter"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-pink-300/30 rounded-full blur-3xl animate-blob animation-delay-4000 mix-blend-multiply filter"></div>
            </div>

            {/* Desktop Sidebar */}
            {isDesktop && (
                <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/20 z-50 p-6 flex flex-col">
                    <div className="mb-10 flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                            A
                        </div>
                        <span className="text-xl font-bold text-foreground">Attendance</span>
                    </div>

                    <nav className="space-y-2 flex-1">
                        <NavItem to="/" icon={Home} label="Dashboard" />
                        <NavItem to="/schedule" icon={Calendar} label="Schedule" />
                        <NavItem to="/simulator" icon={Calculator} label="Simulator" />
                        <NavItem to="/analytics" icon={BarChart2} label="Analytics" />
                        <NavItem to="/attendance" icon={CalendarCheck} label="Attendance" />
                        <NavItem to="/profile" icon={User} label="Profile" />
                    </nav>

                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="h-6 w-6" />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </aside>
            )}

            {/* Main Content */}
            <div className={cn(
                "relative z-10 min-h-screen transition-all duration-300",
                isDesktop ? "ml-64 p-8" : "pb-24 max-w-md mx-auto"
            )}>
                <div className={cn("mx-auto", isDesktop ? "max-w-5xl" : "")}>
                    <PageTransition>
                        {children}
                    </PageTransition>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            {!isDesktop && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] z-50">
                    <nav className="glass-nav rounded-2xl px-6 py-4 flex justify-between items-center">
                        <Link to="/" className={cn("p-2 rounded-xl transition-all duration-300", isActive('/') ? "bg-primary-100 text-primary-600 scale-110" : "text-slate-400 hover:text-primary-400")}>
                            <Home className="h-6 w-6" />
                        </Link>
                        <Link to="/schedule" className={cn("p-2 rounded-xl transition-all duration-300", isActive('/schedule') ? "bg-primary-100 text-primary-600 scale-110" : "text-slate-400 hover:text-primary-400")}>
                            <Calendar className="h-6 w-6" />
                        </Link>
                        <Link to="/simulator" className={cn("p-2 rounded-xl transition-all duration-300", isActive('/simulator') ? "bg-primary-100 text-primary-600 scale-110" : "text-slate-400 hover:text-primary-400")}>
                            <Calculator className="h-6 w-6" />
                        </Link>
                        <Link to="/analytics" className={cn("p-2 rounded-xl transition-all duration-300", isActive('/analytics') ? "bg-primary-100 text-primary-600 scale-110" : "text-slate-400 hover:text-primary-400")}>
                            <BarChart2 className="h-6 w-6" />
                        </Link>
                        <Link to="/attendance" className={cn("p-2 rounded-xl transition-all duration-300", isActive('/attendance') ? "bg-primary-100 text-primary-600 scale-110" : "text-slate-400 hover:text-primary-400")}>
                            <CalendarCheck className="h-6 w-6" />
                        </Link>
                        <Link to="/profile" className={cn("p-2 rounded-xl transition-all duration-300", isActive('/profile') ? "bg-primary-100 text-primary-600 scale-110" : "text-slate-400 hover:text-primary-400")}>
                            <User className="h-6 w-6" />
                        </Link>
                    </nav>
                </div>
            )}
        </div>
    );
}
