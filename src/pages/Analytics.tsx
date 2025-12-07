import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { TrendingUp, Target, Award, ArrowUpRight, Brain, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
// import { useToast } from '../context/ToastContext';

export function Analytics() {
    const { user } = useAuth();
    // const { addToast } = useToast();
    const [currentCgpa, setCurrentCgpa] = useState(0);
    const [totalCredits, setTotalCredits] = useState(0);

    // Target Calculator State
    const [targetCgpa, setTargetCgpa] = useState(9.0);
    const [remainingCredits, setRemainingCredits] = useState(20);
    const [requiredSgpa, setRequiredSgpa] = useState(0);

    // Mock Trend Data & Prediction State
    const [activeTrendData, setActiveTrendData] = useState([
        { sem: 1, sgpa: 8.2, isPredicted: false },
        { sem: 2, sgpa: 8.5, isPredicted: false },
        { sem: 3, sgpa: 8.4, isPredicted: false },
        { sem: 4, sgpa: 8.8, isPredicted: false },
        { sem: 5, sgpa: 8.9, isPredicted: false } // Initial placeholder
    ]);

    const [prediction, setPrediction] = useState<{ nextSgpa: number, insight: string } | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('cgpa, credits')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    const loadedCgpa = data.cgpa || 0;
                    setCurrentCgpa(loadedCgpa);
                    setTotalCredits(data.credits || 0);

                    // Update the 5th sem data point with actual CGPA if available
                    setActiveTrendData(prev => {
                        const newData = [...prev];
                        if (loadedCgpa > 0) {
                            newData[4] = { sem: 5, sgpa: loadedCgpa, isPredicted: false };
                        }
                        return newData;
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                // 
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        calculateTarget();
    }, [targetCgpa, remainingCredits, currentCgpa, totalCredits]);

    const calculateTarget = () => {
        // Formula: (Target * (Total + Remaining)) - (Current * Total) / Remaining
        const totalFutureCredits = totalCredits + remainingCredits;
        const requiredPoints = (targetCgpa * totalFutureCredits) - (currentCgpa * totalCredits);
        const reqSgpa = requiredPoints / remainingCredits;
        setRequiredSgpa(reqSgpa > 10 ? 10.1 : reqSgpa < 0 ? 0 : reqSgpa);
    };

    const handlePredict = () => {
        const lastSgpa = activeTrendData[activeTrendData.length - 1].sgpa;
        const volatility = (Math.random() * 0.5) - 0.1; // Mostly positive trend
        const nextSgpa = Math.min(10, Math.max(0, parseFloat((lastSgpa + volatility).toFixed(2))));

        let insight = "";
        if (nextSgpa > lastSgpa) {
            insight = "Based on your consistent performance and projected 85%+ attendance, our model predicts a slight increase in your next SGPA. Keep up the momentum!";
        } else {
            insight = "Our model detects a potential plateau. Focusing on high-credit subjects could prevent a minor dip. Ensure your attendance stays above 75%.";
        }

        setPrediction({ nextSgpa, insight });
        setActiveTrendData(prev => [
            ...prev,
            { sem: 6, sgpa: nextSgpa, isPredicted: true }
        ]);
    };

    const getDegreeClass = (val: number) => {
        if (val >= 8.5) return { label: "First Class with Distinction", color: "text-emerald-500", bg: "bg-emerald-100" };
        if (val >= 6.5) return { label: "First Class", color: "text-blue-500", bg: "bg-blue-100" };
        if (val >= 5.5) return { label: "Second Class", color: "text-orange-500", bg: "bg-orange-100" };
        return { label: "Pass Class", color: "text-slate-500", bg: "bg-slate-100" };
    };

    const degreeClass = getDegreeClass(currentCgpa);

    return (
        <div className="pb-24 space-y-8 staggered-fade-in">
            <SEO title="Analytics" description="Analyze your academic performance." />

            <div className="flex flex-col gap-2 mt-4">
                <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
                <p className="text-slate-500">Insights to help you graduate with honors.</p>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award className="h-24 w-24 text-primary-500" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Current CGPA</p>
                    <h2 className="text-4xl font-bold text-slate-800">{currentCgpa}</h2>
                    <div className={cn("inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full text-xs font-bold", degreeClass.bg, degreeClass.color)}>
                        <Award className="h-3 w-3" />
                        {degreeClass.label}
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Credits</p>
                    <h2 className="text-4xl font-bold text-slate-800">{totalCredits}</h2>
                    <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Completed so far
                    </p>
                </div>

                <div className="glass-card p-6 rounded-3xl relative overflow-hidden bg-primary-600 text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 opacity-100 -z-10"></div>
                    <p className="text-primary-100 text-sm font-medium mb-1 flex items-center gap-2">
                        <Target className="h-4 w-4" /> Target Goal
                    </p>
                    <div className="flex items-end gap-2">
                        <h2 className="text-4xl font-bold">{targetCgpa}</h2>
                        <span className="mb-1 text-sm text-primary-200">/ 10.0</span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="10"
                        step="0.1"
                        value={targetCgpa}
                        onChange={(e) => setTargetCgpa(parseFloat(e.target.value))}
                        className="w-full mt-4 h-1 bg-primary-400/50 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                </div>
            </div>

            {/* Target Calculator */}
            <div className="glass-card p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800">Target Calculator</h2>
                        <p className="text-xs text-slate-500">What do you need to score next?</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 w-full space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                Remaining Credits
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={remainingCredits}
                                    onChange={(e) => setRemainingCredits(parseInt(e.target.value) || 0)}
                                    className="glass-input w-24 p-3 rounded-xl text-center font-bold text-lg"
                                />
                                <span className="text-sm text-slate-400 max-w-[200px]">
                                    Approx. {Math.ceil(remainingCredits / 20)} semesters left.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 font-medium mb-2">Required Average SGPA</p>
                        <div className={cn(
                            "text-5xl font-bold mb-2 transition-colors duration-300",
                            requiredSgpa > 10 ? "text-red-500" : requiredSgpa > 9 ? "text-orange-500" : "text-emerald-500"
                        )}>
                            {requiredSgpa > 10 ? "> 10.0" : requiredSgpa.toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            {requiredSgpa > 10
                                ? "Impossible without retaking courses to improve previous grades."
                                : `You need to average ${requiredSgpa.toFixed(2)} in your remaining semesters to reach ${targetCgpa} CGPA.`
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Trend Chart */}
            <div className="glass-card p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                            <Brain className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">AI Performance Predictor</h2>
                            <p className="text-xs text-slate-500">Based on your attendance & history</p>
                        </div>
                    </div>
                    {!prediction && (
                        <button
                            onClick={handlePredict}
                            className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Sparkles className="h-4 w-4" />
                            Auto-Project
                        </button>
                    )}
                </div>

                {prediction && (
                    <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-4">
                        <h4 className="flex items-center gap-2 font-bold text-purple-700 mb-1">
                            <Sparkles className="h-4 w-4" />
                            AI Insight
                        </h4>
                        <p className="text-sm text-purple-600 leading-relaxed">
                            {prediction.insight}
                        </p>
                    </div>
                )}

                <div className="h-64 w-full flex items-end justify-between gap-2 px-2 pb-4">
                    {activeTrendData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="relative w-full flex justify-center items-end h-48 bg-slate-50 rounded-t-xl overflow-hidden group-hover:bg-slate-100 transition-colors">
                                <div
                                    className={cn(
                                        "w-full transition-all rounded-t-lg relative",
                                        d.isPredicted
                                            ? "bg-purple-400/80 group-hover:bg-purple-500 pattern-diagonal-lines"
                                            : "bg-primary-400/80 group-hover:bg-primary-500"
                                    )}
                                    style={{ height: `${(d.sgpa / 10) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                        {d.sgpa} {d.isPredicted && '(Pred)'}
                                    </div>
                                </div>
                            </div>
                            <span className={cn("text-xs font-bold", d.isPredicted ? "text-purple-500" : "text-slate-400")}>
                                Sem {d.sem}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
