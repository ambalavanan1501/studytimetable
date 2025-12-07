import { cn } from '../../lib/utils';
import { Edit2 } from 'lucide-react';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'N';

interface GradeSliderProps {
    subjectName: string;
    credits: number;
    currentGrade: Grade;
    onChange: (grade: Grade) => void;
    onDelete: () => void;
    onEdit: () => void;
}

const GRADES: { label: Grade; value: number; color: string }[] = [
    { label: 'S', value: 10, color: 'text-purple-500 bg-purple-100 border-purple-200' },
    { label: 'A', value: 9, color: 'text-blue-500 bg-blue-100 border-blue-200' },
    { label: 'B', value: 8, color: 'text-green-500 bg-green-100 border-green-200' },
    { label: 'C', value: 7, color: 'text-yellow-500 bg-yellow-100 border-yellow-200' },
    { label: 'D', value: 6, color: 'text-orange-500 bg-orange-100 border-orange-200' },
    { label: 'E', value: 5, color: 'text-red-500 bg-red-100 border-red-200' },
    { label: 'F', value: 0, color: 'text-slate-500 bg-slate-100 border-slate-200' },
    { label: 'N', value: 0, color: 'text-slate-400 bg-slate-50 border-slate-200' },
];

export function GradeSlider({ subjectName, credits, currentGrade, onChange, onDelete, onEdit }: GradeSliderProps) {
    const currentIndex = GRADES.findIndex(g => g.label === currentGrade);

    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Range: 0 (N) to 7 (S)
        const reversedIndex = parseInt(e.target.value);
        const gradeIndex = 7 - reversedIndex;
        onChange(GRADES[gradeIndex].label);
    };

    const rangeValue = 7 - currentIndex;
    const activeGrade = GRADES[currentIndex];

    return (
        <div className="glass-card p-4 rounded-2xl relative group transition-all duration-300 hover:shadow-lg border border-white/40">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="text-slate-300 hover:text-primary-400 p-1 transition-colors"
                >
                    <Edit2 className="h-4 w-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="text-slate-300 hover:text-red-400 p-1 transition-colors"
                >
                    &times;
                </button>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-slate-800">{subjectName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{credits} Credits</p>
                </div>
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-300 shadow-sm border",
                    activeGrade.color
                )}>
                    {currentGrade}
                </div>
            </div>

            <div className="relative h-6 flex items-center">
                <input
                    type="range"
                    min="0"
                    max="7"
                    step="1"
                    value={rangeValue}
                    onChange={handleRangeChange}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
            </div>

            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 px-1">
                <span>N</span>
                <span>E</span>
                <span>C</span>
                <span>A</span>
                <span>S</span>
            </div>
        </div>
    );
}
