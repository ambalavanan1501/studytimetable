import { useState, useEffect } from 'react';
import { X, Loader2, Save, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { cn } from '../../lib/utils';
import { Lock } from 'lucide-react';


interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: any;
    onSuccess: () => void;
}

export function EditProfileModal({ isOpen, onClose, currentProfile, onSuccess }: EditProfileModalProps) {
    const { user } = useAuth();
    const { level } = useGamification();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        university: '',
        branch: '',
        semester: '',
        cgpa: '',
        credits: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (currentProfile) {
            setFormData({
                full_name: currentProfile.full_name || '',
                university: currentProfile.university || '',
                branch: currentProfile.branch || '',
                semester: currentProfile.semester || '',
                cgpa: currentProfile.cgpa?.toString() || '',
                credits: currentProfile.credits?.toString() || '',
                avatar_url: currentProfile.avatar_url || ''
            });
        }
    }, [currentProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: formData.full_name,
                    university: formData.university,
                    branch: formData.branch,
                    semester: formData.semester,
                    cgpa: parseFloat(formData.cgpa) || 0,
                    credits: parseFloat(formData.credits) || 0,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <div className={cn(
                            "w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 shadow-lg transition-all duration-300",
                            level >= 5 ? "border-indigo-400 shadow-indigo-200" : "border-white"
                        )}>
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-slate-400" />
                            )}
                        </div>

                        {/* XP Level Badge */}
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
                                Lvl {level}
                            </div>
                            {level < 5 && (
                                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    <span>Lvl 5 unlocks border</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="glass-input w-full px-4 py-2.5 rounded-xl font-bold text-slate-700 focus:bg-white/80 transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">University</label>
                            <input
                                type="text"
                                value={formData.university}
                                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                className="glass-input w-full px-4 py-2.5 rounded-xl font-bold text-slate-700 focus:bg-white/80 transition-all"
                                placeholder="University Name"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Branch/Major</label>
                            <input
                                type="text"
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="glass-input w-full px-4 py-2.5 rounded-xl font-bold text-slate-700 focus:bg-white/80 transition-all"
                                placeholder="Computer Science"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Semester</label>
                            <input
                                type="text"
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                className="glass-input w-full px-4 py-2.5 rounded-xl font-bold text-slate-700 focus:bg-white/80 transition-all"
                                placeholder="Fall 2024"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CGPA</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                value={formData.cgpa}
                                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                                className="glass-input w-full px-4 py-2.5 rounded-xl font-bold text-slate-700 focus:bg-white/80 transition-all"
                                placeholder="9.5"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Credits</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={formData.credits}
                                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                className="glass-input w-full px-4 py-2.5 rounded-xl font-bold text-slate-700 focus:bg-white/80 transition-all"
                                placeholder="24.5"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
