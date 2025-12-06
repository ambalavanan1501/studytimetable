import { useState, useEffect } from 'react';
import { X, Loader2, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    classData: any;
    onSuccess: () => void;
}

export function EditClassModal({ isOpen, onClose, classData, onSuccess }: EditClassModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        room_number: '',
        start_time: '',
        end_time: ''
    });

    useEffect(() => {
        if (classData) {
            setFormData({
                subject_name: classData.subject_name || '',
                subject_code: classData.subject_code || '',
                room_number: classData.room_number || '',
                start_time: classData.start_time || '',
                end_time: classData.end_time || ''
            });
        }
    }, [classData]);

    if (!isOpen || !classData) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Determine which table to update based on some property or just try both?
            // Usually we know the table from the parent, but let's assume we pass it or infer it.
            // For simplicity, we'll try to update based on ID in both tables, or pass a 'type' prop.
            // But since we don't have a 'source' field, we'll check where it came from in the parent.
            // Actually, let's assume the parent passes the table name or we try both.
            // A safer bet is to assume 'timetable_entries' unless it has specific fields, 
            // but IDs are UUIDs so we can try updating both tables with the ID. 
            // Only one will succeed in finding the row.

            const updates = {
                subject_name: formData.subject_name,
                subject_code: formData.subject_code,
                room_number: formData.room_number,
                start_time: formData.start_time,
                end_time: formData.end_time
            };

            const { error: error1 } = await supabase
                .from('timetable_entries')
                .update(updates)
                .eq('id', classData.id);

            const { error: error2 } = await supabase
                .from('smart_timetable_entries')
                .update(updates)
                .eq('id', classData.id);

            if (error1 && error2) throw new Error('Failed to update class');

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating class:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Edit Class</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
                            <input
                                type="text"
                                value={formData.subject_name}
                                onChange={e => setFormData({ ...formData, subject_name: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Code</label>
                                <input
                                    type="text"
                                    value={formData.subject_code}
                                    onChange={e => setFormData({ ...formData, subject_code: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Room</label>
                                <input
                                    type="text"
                                    value={formData.room_number}
                                    onChange={e => setFormData({ ...formData, room_number: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                                <input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                                <input
                                    type="time"
                                    value={formData.end_time}
                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                    className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Save Changes
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                if (!confirm('Are you sure you want to delete this class?')) return;
                                setLoading(true);
                                try {
                                    await supabase.from('timetable_entries').delete().eq('id', classData.id);
                                    await supabase.from('smart_timetable_entries').delete().eq('id', classData.id);
                                    onSuccess();
                                    onClose();
                                } catch (error) {
                                    console.error('Error deleting class:', error);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 className="h-5 w-5" />
                            Delete Class
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
