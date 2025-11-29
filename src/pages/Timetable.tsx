import { useEffect, useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Trash2, Edit2 } from 'lucide-react';
import { SmartAddModal } from '../components/timetable/SmartAddModal';
import { EditClassModal } from '../components/timetable/EditClassModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function Timetable() {
    const { user } = useAuth();
    const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string>('Monday');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingClass, setEditingClass] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Permanently remove weekends as per user request
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    useEffect(() => {
        // Set current day on load
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (days.includes(today)) {
            setSelectedDay(today);
        }
    }, []);

    const fetchEntries = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Fetch from both tables
            const { data: basicEntries } = await supabase
                .from('timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', selectedDay);

            const { data: smartEntries } = await supabase
                .from('smart_timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', selectedDay);

            const allEntries = [...(basicEntries || []), ...(smartEntries || [])];

            // Sort by start time
            allEntries.sort((a, b) => a.start_time.localeCompare(b.start_time));

            setEntries(allEntries);
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [user, selectedDay]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this class?')) return;

        try {
            // Try deleting from both tables (one will succeed)
            await supabase.from('timetable_entries').delete().eq('id', id);
            await supabase.from('smart_timetable_entries').delete().eq('id', id);

            fetchEntries();
        } catch (error) {
            console.error('Error deleting class:', error);
        }
    };

    const handleEdit = (entry: any) => {
        setEditingClass(entry);
        setIsEditModalOpen(true);
    };

    return (
        <div className="p-6 pb-24 space-y-6">
            <div className="flex justify-between items-center mt-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Schedule</h1>
                    <p className="text-slate-500 text-sm">Manage your classes</p>
                </div>
                <button
                    onClick={() => setIsSmartAddOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-2xl shadow-lg shadow-primary-200 transition-all active:scale-95"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </div>

            {/* Day Selector */}
            <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar snap-x">
                {days.map((day) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[70px] h-[80px] rounded-2xl transition-all snap-center border",
                            selectedDay === day
                                ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200 scale-105"
                                : "bg-white text-slate-400 border-slate-100 hover:border-primary-200"
                        )}
                    >
                        <span className="text-xs font-medium uppercase tracking-wider">{day.slice(0, 3)}</span>
                        <CalendarIcon className={cn("h-5 w-5 mt-1", selectedDay === day ? "text-white" : "text-slate-300")} />
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading...</div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <CalendarIcon className="h-8 w-8 text-slate-300" />
                        </div>
                        <p>No classes for {selectedDay}</p>
                        <button
                            onClick={() => setIsSmartAddOpen(true)}
                            className="text-primary-600 font-bold mt-2 hover:underline"
                        >
                            Add a class
                        </button>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className="glass-card p-5 rounded-2xl group relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{entry.subject_name}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{entry.subject_code}</p>
                                </div>
                                <span className={cn(
                                    "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide",
                                    entry.type === 'theory' ? "bg-primary-100 text-primary-600" : "bg-pink-100 text-pink-600"
                                )}>
                                    {entry.type}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-primary-400" />
                                    <span className="font-medium">{entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}</span>
                                </div>
                                {entry.room_number && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-primary-400" />
                                        <span className="font-medium">{entry.room_number}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(entry)}
                                    className="p-2 bg-white/80 hover:bg-white text-blue-500 rounded-full shadow-sm transition-colors"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="p-2 bg-white/80 hover:bg-white text-red-500 rounded-full shadow-sm transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <SmartAddModal
                isOpen={isSmartAddOpen}
                onClose={() => setIsSmartAddOpen(false)}
                onSuccess={fetchEntries}
            />

            <EditClassModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                classData={editingClass}
                onSuccess={fetchEntries}
            />
        </div>
    );
}
