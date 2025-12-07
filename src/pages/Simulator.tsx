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
        <div className="pb-24 space-y-8">
            <SEO
                title="CGPA Simulator"
                description="Predict your future grades with our interactive GPA calculator."
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-800">Simulator</h1>
                <p className="text-slate-500">Play with grades to see your future.</p>
            </div>

            <ResultCard
                gpa={calculatedGpa}
                totalCredits={totalCredits}
                initialGpa={isCumulativeMode ? (existingCgpa || 0) : undefined}
            />

            {/* Mode Switcher */}
            {existingCgpa !== null && (
                <div className="flex justify-center">
                    <div className="bg-white/50 backdrop-blur-sm p-1 rounded-xl flex gap-1 border border-white/40">
                        <button
                            onClick={() => setIsCumulativeMode(false)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isCumulativeMode ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Semester Only
                        </button>
                        <button
                            onClick={() => setIsCumulativeMode(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isCumulativeMode ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Cumulative Effect
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map(subject => (
                    <GradeSlider
                        key={subject.id}
                        subjectName={subject.name}
                        credits={subject.credits}
                        currentGrade={subject.grade}
                        onChange={(g) => handleGradeChange(subject.id, g)}
                        onDelete={() => removeSubject(subject.id)}
                        onEdit={() => handleEditClick(subject)}
                    />
                ))}
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    Add Subject
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 bg-white text-slate-600 px-6 py-3 rounded-full font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                    <RotateCcw className="h-5 w-5" />
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
