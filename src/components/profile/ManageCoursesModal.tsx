import { useState, useEffect } from 'react';
import { X, Search, Edit2, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { EditClassModal } from '../timetable/EditClassModal';

interface ManageCoursesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ManageCoursesModal({ isOpen, onClose }: ManageCoursesModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingClass, setEditingClass] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchCourses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch from both tables
            const { data: basicEntries } = await supabase
                .from('timetable_entries')
                .select('*')
                .eq('user_id', user.id);

            const { data: smartEntries } = await supabase
                .from('smart_timetable_entries')
                .select('*')
                .eq('user_id', user.id);

            const allEntries = [...(basicEntries || []), ...(smartEntries || [])];

            // Sort by day then time
            const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
            allEntries.sort((a, b) => {
                const dayDiff = (dayOrder[a.day as keyof typeof dayOrder] || 8) - (dayOrder[b.day as keyof typeof dayOrder] || 8);
                if (dayDiff !== 0) return dayDiff;
                return a.start_time.localeCompare(b.start_time);
            });

            setCourses(allEntries);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCourses();
        }
    }, [isOpen, user]);

    const filteredCourses = courses.filter(course =>
        course.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.subject_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (course: any) => {
        setEditingClass(course);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchCourses(); // Refresh list
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Manage Timetable</h2>
                        <p className="text-sm text-slate-500">Edit or remove your scheduled classes</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <p>No classes found.</p>
                        </div>
                    ) : (
                        filteredCourses.map((course) => (
                            <div key={course.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary-200 transition-colors">
                                <div className="flex-1 min-w-0 mr-4">
                                    <h3 className="font-bold text-slate-800 truncate">{course.subject_name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{course.subject_code}</span>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{course.day}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{course.start_time} - {course.end_time}</span>
                                        </div>
                                        {course.room_number && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                <span>{course.room_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEdit(course)}
                                    className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <EditClassModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                classData={editingClass}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
