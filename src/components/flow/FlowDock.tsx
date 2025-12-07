import { useState, useEffect } from 'react';
import { useFlow } from '../../context/FlowContext';
import { Play, Pause, StopCircle, Headphones, Maximize2, Minimize2, Music2, Coffee, CloudRain, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocation } from 'react-router-dom';
import { db } from '../../lib/db';

export function FlowDock() {
    const { isFocusing, timeLeft, isActive, audioType, activeTask, startFocus, pauseFocus, resumeFocus, stopFocus, setAudio, formatTime } = useFlow();
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();
    const [suggestion, setSuggestion] = useState<{ name: string, duration: number } | null>(null);
    const [sessionGoal, setSessionGoal] = useState('');

    // Drag State
    const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight - 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isExpanded && !isFocusing) {
            checkSmartSuggestion();
        }
    }, [isExpanded, isFocusing]);

    // Handle Resize to keep it on screen
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(Math.max(40, prev.x), window.innerWidth - 40),
                y: Math.min(Math.max(40, prev.y), window.innerHeight - 40)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const checkSmartSuggestion = async () => {
        try {
            const subjects = await db.getAllSimulatorSubjects();
            if (subjects.length > 0) {
                // Simple logic: Find subject with lowest grade weight
                const gradeVal = (g: string) => {
                    const map: any = { 'S': 10, 'A+': 9.5, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'F': 0 };
                    return map[g.toUpperCase()] || 5;
                };

                const sorted = subjects.sort((a, b) => gradeVal(a.grade) - gradeVal(b.grade));
                const worst = sorted[0];
                setSuggestion({ name: worst.name, duration: 45 });
            }
        } catch (e) { console.error(e); }
    };

    const handleStart = (mins: number) => {
        startFocus(mins, sessionGoal || (suggestion ? suggestion.name : undefined));
        setIsExpanded(false);
        setSessionGoal('');
    };

    // Drag Handlers
    const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (isExpanded) return; // Disable drag when expanded
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setDragOffset({
            x: clientX - position.x,
            y: clientY - position.y
        });
    };

    useEffect(() => {
        const onDragMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling while dragging

            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

            setPosition({
                x: clientX - dragOffset.x,
                y: clientY - dragOffset.y
            });
        };

        const onDragEnd = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', onDragMove, { passive: false });
            window.addEventListener('touchmove', onDragMove, { passive: false });
            window.addEventListener('mouseup', onDragEnd);
            window.addEventListener('touchend', onDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('touchmove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            window.removeEventListener('touchend', onDragEnd);
        };
    }, [isDragging, dragOffset]);

    // Don't show on login
    if (location.pathname === '/login') return null;

    if (!isFocusing && !isExpanded) {
        return (
            <div
                className="fixed z-50 touch-none"
                style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
                onMouseDown={onDragStart}
                onTouchStart={onDragStart}
            >
                <button
                    onClick={() => !isDragging && setIsExpanded(true)}
                    className="bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group border border-slate-700/50 cursor-grab active:cursor-grabbing"
                >
                    <div className="relative pointer-events-none">
                        <Headphones className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "fixed bg-slate-900/95 backdrop-blur-xl text-white shadow-2xl border border-slate-700 transition-all duration-300 ease-spring z-50 overflow-hidden touch-none",
                isExpanded ? "w-[90vw] max-w-md rounded-3xl p-6 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "w-fit rounded-full px-6 py-3 flex items-center gap-6 cursor-grab active:cursor-grabbing"
            )}
            style={!isExpanded ? { left: position.x, top: position.y, transform: 'translate(-50%, -50%)' } : {}}
            onMouseDown={!isExpanded ? onDragStart : undefined}
            onTouchStart={!isExpanded ? onDragStart : undefined}
        >
            {/* Visualizer Background (Subtle) */}
            {isFocusing && isActive && audioType !== 'none' && (
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-end justify-center gap-1 select-none">
                    {/* CSS-based random bars */}
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-2 bg-emerald-500 rounded-t-full animate-music-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>
            )}

            {/* Collapsed View */}
            {!isExpanded && (
                <div className="relative z-10 flex items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <span className="font-mono text-xl font-bold text-emerald-400">
                                {formatTime(timeLeft)}
                            </span>
                            {isActive && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            )}
                        </div>
                        <div className="h-8 w-px bg-slate-700" />
                        <div className="flex items-center gap-2">
                            {isActive ? (
                                <button onClick={pauseFocus} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Pause className="h-5 w-5" /></button>
                            ) : (
                                <button onClick={resumeFocus} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Play className="h-5 w-5" /></button>
                            )}
                            <button onClick={stopFocus} className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400"><StopCircle className="h-5 w-5" /></button>
                        </div>
                    </div>
                    {activeTask && (
                        <div className="hidden md:block max-w-[150px] truncate text-xs text-slate-400 font-medium">
                            Goal: <span className="text-white">{activeTask}</span>
                        </div>
                    )}
                    <button onClick={() => setIsExpanded(true)} className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors"><Maximize2 className="h-4 w-4" /></button>
                </div>
            )}

            {/* Expanded View */}
            {isExpanded && (
                <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <Headphones className="h-5 w-5 text-emerald-400" />
                            Flow Station
                        </h3>
                        <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Minimize2 className="h-5 w-5" /></button>
                    </div>

                    <div className="text-center py-4 relative">
                        {/* Circle Progress Concept could go here, keeping it simple for now */}
                        <div className={cn("text-7xl font-mono font-bold tracking-tighter mb-2 transition-colors", isActive ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" : "text-slate-500")}>
                            {formatTime(timeLeft)}
                        </div>
                        <p className="text-sm text-slate-400">
                            {activeTask ? `Working on: ${activeTask}` : (isActive ? "Deep Focus Session" : "Ready to Focus?")}
                        </p>
                    </div>

                    {!isActive && !isFocusing && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Session Goal Input */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10 focus-within:border-emerald-500/50 transition-colors">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Session Goal</label>
                                <input
                                    type="text"
                                    value={sessionGoal}
                                    onChange={(e) => setSessionGoal(e.target.value)}
                                    placeholder="What will you achieve? (e.g. Finish Calculus Ch.1)"
                                    className="bg-transparent w-full text-white placeholder-slate-600 focus:outline-none text-sm font-medium"
                                />
                            </div>

                            {suggestion && (
                                <button
                                    onClick={() => { setSessionGoal(`Focus on ${suggestion.name}`); }}
                                    className="w-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 p-3 rounded-xl text-left border border-purple-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="h-4 w-4 text-purple-300" />
                                        <div>
                                            <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Smart Suggestion</div>
                                            <div className="text-xs text-purple-100">Study <span className="font-bold">{suggestion.name}</span> (Low Grade)</div>
                                        </div>
                                    </div>
                                </button>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                                {[15, 25, 45].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => handleStart(mins)}
                                        className="bg-white/5 hover:bg-white/10 hover:scale-105 py-3 rounded-xl text-sm font-bold border border-white/5 transition-all hover:border-emerald-500/50 hover:text-emerald-400 active:scale-95"
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isFocusing && (
                        <div className="flex justify-center gap-6">
                            {isActive ? (
                                <button onClick={pauseFocus} className="bg-white text-slate-900 rounded-full p-4 hover:scale-105 transition-transform"><Pause className="h-8 w-8 fill-current" /></button>
                            ) : (
                                <button onClick={resumeFocus} className="bg-emerald-500 text-white rounded-full p-4 hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20"><Play className="h-8 w-8 fill-current ml-1" /></button>
                            )}
                            <button onClick={stopFocus} className="bg-white/10 text-slate-300 rounded-full p-4 hover:bg-white/20 transition-colors"><StopCircle className="h-8 w-8" /></button>
                        </div>
                    )}

                    <div className="bg-black/20 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ambience</p>
                            {audioType !== 'none' && <div className="flex gap-1">
                                {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-emerald-500/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />)}
                            </div>}
                        </div>
                        <div className="flex justify-between">
                            {[
                                { id: 'none', icon: Music2, label: 'Off' },
                                { id: 'rain', icon: CloudRain, label: 'Rain' },
                                { id: 'cafe', icon: Coffee, label: 'Cafe' },
                                { id: 'lofi', icon: Headphones, label: 'Lofi' },
                            ].map((audio) => (
                                <button
                                    key={audio.id}
                                    onClick={() => setAudio(audio.id as any)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-2 rounded-xl text-xs font-medium transition-all w-16",
                                        audioType === audio.id ? "bg-emerald-500 text-white shadow-lg scale-105" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <audio.icon className="h-4 w-4" />
                                    {audio.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
