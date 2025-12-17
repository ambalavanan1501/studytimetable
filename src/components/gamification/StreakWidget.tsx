import { Flame, ChevronRight } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';

export function StreakWidget() {
    const { streak, xp, level } = useGamification();

    return (
        <div className="bg-[#EA580C] p-8 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-shadow text-white h-full min-h-[250px] flex flex-col justify-between">
            {/* Background Decorations */}
            <div className="absolute top-1/2 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

            {/* Header */}
            <div>
                <div className="flex justify-between items-center mb-4 text-white/90 font-medium">
                    <span className="text-sm">Day Streak / XP</span>
                    <ChevronRight className="h-4 w-4" />
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-black/20 rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full w-2/3"></div>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Level {level}</div>
                        <div className="text-3xl font-bold tracking-tight">{xp} XP</div>
                    </div>
                    <Flame className="h-8 w-8 text-white fill-white animate-pulse" />
                </div>
            </div>

            {/* Content Center */}
            <div className="text-center py-4 relative z-10">
                <div className="text-6xl font-bold tracking-tighter mb-1 leading-none">
                    {streak}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-90">
                    Day Streak
                </div>
            </div>

            {/* Footer Text */}
            <div className="text-center text-sm font-medium text-white/80 px-2 leading-relaxed opacity-90">
                Log in daily to build your streak!
            </div>
        </div>
    );
}
