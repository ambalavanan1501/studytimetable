import { useState, useEffect } from 'react';
import { Target, Calculator, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function GradeStrategist() {
    const { user } = useAuth();
    const [currentCGPA, setCurrentCGPA] = useState(0);
    const [completedCredits, setCompletedCredits] = useState(0);
    const [targetCGPA, setTargetCGPA] = useState('');
    const [nextCredits, setNextCredits] = useState('20');
    const [result, setResult] = useState<{ requiredGPA: number, feasible: boolean } | null>(null);

    useEffect(() => {
        if (user) {
            supabase.from('profiles').select('cgpa, credits').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data) {
                        setCurrentCGPA(data.cgpa || 0);
                        setCompletedCredits(data.credits || 0);
                    }
                });
        }
    }, [user]);

    const calculateStrategy = () => {
        const target = parseFloat(targetCGPA);
        const upcoming = parseFloat(nextCredits);

        if (!target || !upcoming || upcoming <= 0) return;

        const totalCredits = completedCredits + upcoming;
        const targetPoints = target * totalCredits;
        const currentPoints = currentCGPA * completedCredits;
        const requiredPoints = targetPoints - currentPoints;
        const requiredGPA = requiredPoints / upcoming;

        setResult({
            requiredGPA: parseFloat(requiredGPA.toFixed(2)),
            feasible: requiredGPA <= 10 && requiredGPA >= 0
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h3 className="flex items-center gap-2 font-bold text-indigo-900 mb-2">
                    <Target className="h-5 w-5" />
                    Target Analyzer
                </h3>
                <p className="text-sm text-indigo-700">
                    Current: <span className="font-bold">{currentCGPA}</span> ({completedCredits} Credits)
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Target CGPA</label>
                    <Input
                        type="number"
                        step="0.01"
                        max="10"
                        value={targetCGPA}
                        onChange={(e) => setTargetCGPA(e.target.value)}
                        placeholder="e.g. 9.0"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Next Sem Credits</label>
                    <Input
                        type="number"
                        value={nextCredits}
                        onChange={(e) => setNextCredits(e.target.value)}
                        placeholder="20"
                    />
                </div>
            </div>

            <Button onClick={calculateStrategy} className="w-full bg-slate-800 hover:bg-slate-900">
                <Calculator className="mr-2 h-4 w-4" /> Calculate Strategy
            </Button>

            {result && (
                <div className={cn(
                    "p-4 rounded-xl border animate-in slide-in-from-top-2",
                    result.feasible ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                )}>
                    {result.feasible ? (
                        <div className="text-center">
                            <div className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1">You need a GPA of</div>
                            <div className="text-4xl font-black">{result.requiredGPA}</div>
                            <div className="text-sm mt-2 font-medium">in the upcoming semester</div>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <div className="text-sm">
                                <strong>Mathematically Impossible:</strong> You would need a GPA of {result.requiredGPA} to reach this goal next semester. Try adjusting your target or extending the timeline.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
