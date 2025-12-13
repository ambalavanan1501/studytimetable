import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { GradeSlider, Grade } from '../components/simulator/GradeSlider';
import { ResultCard } from '../components/simulator/ResultCard';
import { AddSubjectModal, SubjectData } from '../components/simulator/AddSubjectModal';
import { SEO } from '../components/SEO';
import { Plus, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { cn } from '../lib/utils';

interface MockSubject {
    id: string;
    name: string;
    credits: number;
    grade: Grade;
}

const GRADE_POINTS: Record<Grade, number> = {
    'S': 10,
    'A': 9,
    'B': 8,
    'C': 7,
    'D': 6,
    'E': 5,
    'F': 0,
    'N': 0
};

export function Simulator() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [subjects, setSubjects] = useState<MockSubject[]>([]);
    const [calculatedGpa, setCalculatedGpa] = useState(0);
    const [totalCredits, setTotalCredits] = useState(0);

    // For "What-If" on top of actual existing CGPA
    const [existingCgpa, setExistingCgpa] = useState<number | null>(null);
    const [existingCredits, setExistingCredits] = useState<number | null>(null);
    const [isCumulativeMode, setIsCumulativeMode] = useState(false);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<MockSubject | null>(null);

    useEffect(() => {
        // Fetch existing data if available
        if (user) {
            const fetchData = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('cgpa, credits')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    if (data.cgpa) setExistingCgpa(data.cgpa);
                    if (data.credits) setExistingCredits(data.credits);
                }
            };
            fetchData();
        }
    }, [user]);

    // Fetch saved subjects from IndexedDB
    useEffect(() => {
        const loadSubjects = async () => {
            const savedSubjects = await db.getAllSimulatorSubjects();
            if (savedSubjects && savedSubjects.length > 0) {
                // Cast string grade back to Grade type carefully
                const castedSubjects = savedSubjects.map(s => ({
                    ...s,
                    grade: s.grade as Grade
                }));
                setSubjects(castedSubjects);
            }
        };
        loadSubjects();
    }, []);

    useEffect(() => {
        calculate();
    }, [subjects, isCumulativeMode, existingCgpa, existingCredits]);

    const calculate = () => {
        let totalPoints = 0;
        let currentCredits = 0;

        subjects.forEach(sub => {
            const points = GRADE_POINTS[sub.grade];
            totalPoints += points * sub.credits;
            currentCredits += sub.credits;
        });

        if (isCumulativeMode && existingCgpa != null && existingCredits != null) {
            // Formula: ( (ExistingCGPA * ExistingCredits) + (NewPoints) ) / (ExistingCredits + NewCredits)
            const existingPoints = existingCgpa * existingCredits;
            const finalPoints = existingPoints + totalPoints;
            const finalCredits = existingCredits + currentCredits;

            setCalculatedGpa(finalCredits > 0 ? finalPoints / finalCredits : 0);
            setTotalCredits(finalCredits);
        } else {
            // Just SGPA for these subjects
            setCalculatedGpa(currentCredits > 0 ? totalPoints / currentCredits : 0);
            setTotalCredits(currentCredits);
        }
    };

    const handleGradeChange = async (id: string, newGrade: Grade) => {
        const updated = subjects.map(s =>
            s.id === id ? { ...s, grade: newGrade } : s
        );
        setSubjects(updated);

        const subject = updated.find(s => s.id === id);
        if (subject) {
            await db.saveSimulatorSubject(subject);
        }
    };

    const handleSaveSubject = async (data: SubjectData) => {
        if (editingSubject) {
            // Edit existing
            const updatedSubject = { ...editingSubject, name: data.name, credits: data.credits };
            const updatedList = subjects.map(s => s.id === editingSubject.id ? updatedSubject : s);

            setSubjects(updatedList);
            await db.saveSimulatorSubject(updatedSubject);
            setEditingSubject(null);
            addToast('Subject updated successfully', 'success');
        } else {
            // Add new
            const newId = crypto.randomUUID();
            const newSubject: MockSubject = {
                id: newId,
                name: data.name,
                credits: data.credits,
                grade: 'A'
            };

            setSubjects([...subjects, newSubject]);
            await db.saveSimulatorSubject(newSubject);
            addToast('Subject added successfully', 'success');
        }
    };

    const removeSubject = async (id: string) => {
        setSubjects(prev => prev.filter(s => s.id !== id));
        await db.deleteSimulatorSubject(id);
        addToast('Subject deleted', 'info');
    };

    const handleEditClick = (subject: MockSubject) => {
        setEditingSubject(subject);
        setIsAddModalOpen(true);
    };

    const handleReset = async () => {
        // Clear all from DB
        await Promise.all(subjects.map(s => db.deleteSimulatorSubject(s.id)));
        setSubjects([]);
        addToast('Simulator reset', 'info');
    };

    const openAddModal = () => {
        setEditingSubject(null);
        setIsAddModalOpen(true);
    };

    return (
        <div className="pb-32 space-y-8 animate-fade-in-up md:px-4">
            <SEO
                title="CGPA Simulator"
                description="Predict your future grades with our interactive GPA calculator."
            />

            <div className="flex flex-col gap-2 mt-4 ml-2">
                <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tighter leading-none">Simulator</h1>
                <p className="text-lg text-slate-500 font-medium font-display tracking-wide">Predict your academic future.</p>
            </div>

            <div className="glass-vision p-6 rounded-[2rem] shadow-2xl ring-1 ring-white/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                <ResultCard
                    gpa={calculatedGpa}
                    totalCredits={totalCredits}
                    initialGpa={isCumulativeMode ? (existingCgpa || 0) : undefined}
                />
            </div>

            {/* Mode Switcher - Floating Glass */}
            {existingCgpa !== null && (
                <div className="flex justify-center -mt-4 relative z-10">
                    <div className="glass-panel p-2 rounded-full flex gap-1 shadow-lg backdrop-blur-3xl">
                        <button
                            onClick={() => setIsCumulativeMode(false)}
                            className={cn(
                                "px-6 py-2 rounded-full text-xs font-bold transition-all duration-300",
                                !isCumulativeMode
                                    ? "bg-slate-900 text-white shadow-lg scale-105"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                            )}
                        >
                            Semester Only
                        </button>
                        <button
                            onClick={() => setIsCumulativeMode(true)}
                            className={cn(
                                "px-6 py-2 rounded-full text-xs font-bold transition-all duration-300",
                                isCumulativeMode
                                    ? "bg-slate-900 text-white shadow-lg scale-105"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                            )}
                        >
                            Cumulative Effect
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map(subject => (
                    <div key={subject.id} className="glass-vision p-3 rounded-[1.5rem] hover:bg-white/50 transition-colors">
                        <GradeSlider
                            subjectName={subject.name}
                            credits={subject.credits}
                            currentGrade={subject.grade}
                            onChange={(g) => handleGradeChange(subject.id, g)}
                            onDelete={() => removeSubject(subject.id)}
                            onEdit={() => handleEditClick(subject)}
                        />
                    </div>
                ))}

                {/* Empty State */}
                {subjects.length === 0 && (
                    <div className="col-span-1 md:col-span-2 py-16 glass-vision rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-4 border-2 border-dashed border-white/20">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner mb-2 animate-float">
                            <Plus className="h-8 w-8 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-xl text-slate-600">No subjects added yet</p>
                            <p className="text-slate-400">Add subjects to start simulating</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-4 pt-6 pb-12">
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-2xl shadow-slate-400/50 hover:scale-105 transition-all active:scale-95 group text-sm"
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    Add Subject
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 glass-button px-8 py-3 rounded-full font-bold text-slate-600 hover:text-red-500 text-sm"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                </button>
            </div>

            <AddSubjectModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingSubject(null);
                }}
                onSuccess={handleSaveSubject}
                initialData={editingSubject ? { name: editingSubject.name, credits: editingSubject.credits } : undefined}
            />
        </div>
    );
}
