import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';

export interface SubjectData {
    name: string;
    credits: number;
}

interface AddSubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: SubjectData) => void;
    initialData?: SubjectData;
}

export function AddSubjectModal({ isOpen, onClose, onSuccess, initialData }: AddSubjectModalProps) {
    if (!isOpen) return null;

    // Use key to force re-mount when switching between add/edit or different subjects
    // This simplifies state management significantly
    return (
        <ModalContent
            key={initialData ? `edit-${initialData.name}` : 'add-new'}
            isOpen={isOpen}
            onClose={onClose}
            onSuccess={onSuccess}
            initialData={initialData}
        />
    );
}

function ModalContent({ onClose, onSuccess, initialData }: AddSubjectModalProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [credits, setCredits] = useState<number>(initialData?.credits || 3);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!name.trim()) return;
            if (credits < 0) return;

            onSuccess({ name, credits });
            onClose();
        } catch (error) {
            console.error('Error saving subject:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">
                            {initialData ? 'Edit Subject' : 'Add New Subject'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Operating Systems"
                                className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Credits</label>
                            <input
                                type="number"
                                value={credits}
                                onChange={e => setCredits(parseInt(e.target.value) || 0)}
                                min="1"
                                max="10"
                                className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 mt-4 active:scale-95"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {initialData ? 'Update Subject' : 'Add Subject'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
