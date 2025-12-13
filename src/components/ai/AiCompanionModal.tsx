import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Sparkles, ListChecks, Target, Loader2, Calendar } from 'lucide-react';
import { GradeStrategist } from './GradeStrategist';
import { breakDownTask, generateStudyPlan } from '../../lib/ai';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface AiCompanionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AiCompanionModal({ isOpen, onClose }: AiCompanionModalProps) {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Task Breaker State
    const [taskInput, setTaskInput] = useState('');
    const [subtasks, setSubtasks] = useState<string[]>([]);

    // Scheduler State
    const [studyPlan, setStudyPlan] = useState<any[]>([]);

    const handleBreakDown = async () => {
        if (!taskInput.trim()) return;
        setLoading(true);
        try {
            const steps = await breakDownTask(taskInput);
            setSubtasks(steps);
        } catch (error) {
            addToast('Failed to generate steps.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSchedule = async () => {
        setLoading(true);
        try {
            // Fetch real subjects
            let subjects: string[] = ["General Study"];
            if (user) {
                const { data } = await supabase
                    .from('smart_timetable_entries')
                    .select('subject_name')
                    .eq('user_id', user.id);

                if (data && data.length > 0) {
                    // Get unique subjects
                    subjects = Array.from(new Set(data.map(d => d.subject_name).filter(Boolean)));
                }
            }

            // Start with current mock slots (Finding free slots from FFCS is complex, using placeholders for prototype as requested)
            const slots = ["Monday 18:00-20:00", "Tuesday 19:00-21:00", "Wednesday 18:00-20:00", "Saturday 10:00-12:00", "Sunday 14:00-16:00"];

            const plan = await generateStudyPlan(slots, subjects);
            setStudyPlan(plan);
        } catch (error) {
            console.error(error);
            addToast('Failed to create plan. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Academic Companion" className="max-w-2xl">
            <div className="py-4 min-h-[400px]">
                <Tabs defaultValue="scheduler" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="scheduler" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Calendar className="w-4 h-4 mr-2" /> Study Plan
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <ListChecks className="w-4 h-4 mr-2" /> Breaker
                        </TabsTrigger>
                        <TabsTrigger value="grades" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Target className="w-4 h-4 mr-2" /> Strategist
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="scheduler" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" /> Smart Scheduler
                            </h3>
                            <p className="text-sm text-blue-700">I'll analyze your free slots and assign optimal study sessions.</p>
                        </div>

                        <div className="flex justify-center py-4">
                            <Button onClick={handleGenerateSchedule} disabled={loading} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                Generate Weekly Plan
                            </Button>
                        </div>

                        {studyPlan.length > 0 && (
                            <div className="space-y-2 mt-4">
                                {studyPlan.map((session, i) => (
                                    <div key={i} className="flex items-center p-3 bg-white border rounded-lg shadow-sm">
                                        <div className="w-2 h-12 bg-blue-500 rounded-full mr-4"></div>
                                        <div>
                                            <div className="font-bold text-slate-800">{session.subject || "Study Session"}</div>
                                            <div className="text-xs text-slate-500 font-medium uppercase">{session.day} • {session.time}</div>
                                            <div className="text-sm text-slate-600 mt-1">{session.focus || "General Review"}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex gap-2">
                            <Input
                                value={taskInput}
                                onChange={(e) => setTaskInput(e.target.value)}
                                placeholder="e.g. Complete Final Year Project Report"
                                className="flex-1"
                            />
                            <Button onClick={handleBreakDown} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Break Down"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {subtasks.map((step, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <span className="text-slate-700 text-sm">{step}</span>
                                </div>
                            ))}
                            {subtasks.length === 0 && !loading && (
                                <div className="text-center text-slate-400 py-8 text-sm">
                                    Enter a complex task, and I'll break it into manageable steps.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="grades" className="animate-in fade-in slide-in-from-bottom-2">
                        <GradeStrategist />
                    </TabsContent>
                </Tabs>
            </div>
        </Modal>
    );
}
