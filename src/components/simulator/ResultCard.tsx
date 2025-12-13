import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface ResultCardProps {
    gpa: number;
    totalCredits: number;
    initialGpa?: number; // Previous/Current actual GPA to compare against
}

export function ResultCard({ gpa, totalCredits, initialGpa }: ResultCardProps) {
    const [displayGpa, setDisplayGpa] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Animate the number
        const duration = 1000;
        const steps = 60;
        const intervalTime = duration / steps;
        const increment = (gpa - displayGpa) / steps;

        let current = displayGpa;
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= gpa) || (increment < 0 && current <= gpa)) {
                setDisplayGpa(gpa);
                clearInterval(timer);
                if (gpa >= 9.0) setShowConfetti(true);
            } else {
                setDisplayGpa(current);
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [gpa]);

    const getGradeColor = (score: number) => {
        if (score >= 9) return 'text-purple-600';
        if (score >= 8) return 'text-blue-600';
        if (score >= 7) return 'text-green-600';
        if (score >= 5) return 'text-orange-600';
        return 'text-red-600';
    };

    const getMessage = (score: number) => {
        if (score >= 9.5) return "Absolute Legend! 🏆";
        if (score >= 9.0) return "Outstanding! ⭐";
        if (score >= 8.5) return "Excellent Work! 🚀";
        if (score >= 8.0) return "Great Job! 👍";
        if (score >= 7.0) return "Good, keep pushing! 💪";
        if (score >= 5.0) return "You can do better! 📚";
        return "Warning Zone! ⚠️";
    };

    const diff = initialGpa ? gpa - initialGpa : 0;

    return (
        <div className="glass-card p-6 rounded-3xl text-center relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10">
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 left-1/4 w-2 h-2 bg-red-400 rounded-full animate-bounce delay-75"></div>
                    <div className="absolute top-10 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                </div>
            )}

            <div className="relative z-10">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mb-2 animate-pulse">Predicted GPA</h2>
                <div className="flex items-center justify-center gap-4">
                    <span className={cn(
                        "text-7xl font-bold tracking-tighter leading-none font-variant-numeric animate-float",
                        getGradeColor(displayGpa)
                    )}>
                        {displayGpa.toFixed(2)}
                    </span>
                    {gpa >= 9 && <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />}
                </div>

                {initialGpa !== undefined && (
                    <p className="text-slate-400 font-medium mt-2 text-sm bg-white/40 inline-block px-3 py-1 rounded-lg">
                        Cumulative with existing {initialGpa} CGPA
                    </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-4 max-w-xs mx-auto">
                    <div className="glass-panel p-2 rounded-xl">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Credits</div>
                        <div className="text-lg font-bold text-slate-700">{totalCredits}</div>
                    </div>
                    <div className="glass-panel p-2 rounded-xl">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Classification</div>
                        {/* Assuming getDegreeClassification is not imported but was in original code, simplifying for now if missing, or use logic */}
                        <div className="text-lg font-bold text-slate-700">{gpa >= 9 ? 'First Class Dist.' : gpa >= 6.5 ? 'First Class' : 'Second Class'}</div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 mb-2">
                    {initialGpa && Math.abs(diff) > 0.01 && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                            diff > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                            {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(diff).toFixed(2)}
                        </div>
                    )}
                </div>

                <p className={cn(
                    "font-medium text-lg animate-fade-in mt-4",
                    getGradeColor(gpa)
                )}>
                    {getMessage(gpa)}
                </p>
            </div>

            {/* Background Glow */}
            <div className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[60px] -z-10 opacity-20 transition-colors duration-700",
                gpa >= 9 ? "bg-purple-500" :
                    gpa >= 8 ? "bg-blue-500" :
                        gpa >= 5 ? "bg-orange-500" : "bg-red-500"
            )}></div>
        </div>
    );
}
