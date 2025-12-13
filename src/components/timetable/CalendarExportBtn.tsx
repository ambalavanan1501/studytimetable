import { useState } from 'react';
import { Loader2, CalendarCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { generateIcs, downloadIcs, IcsEvent } from '../../lib/ics';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

export function CalendarExportBtn() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Fetch ALL entries for ALL days
            const { data: basicEntries, error: basicError } = await supabase
                .from('timetable_entries')
                .select('*')
                .eq('user_id', user.id);

            if (basicError) throw basicError;

            const { data: smartEntries, error: smartError } = await supabase
                .from('smart_timetable_entries')
                .select('*')
                .eq('user_id', user.id);

            if (smartError) throw smartError;

            const allEntries = [...(basicEntries || []), ...(smartEntries || [])];

            if (allEntries.length === 0) {
                addToast('No classes to export!', 'info');
                return;
            }

            const events: IcsEvent[] = allEntries.map(entry => ({
                subject_name: entry.subject_name,
                subject_code: entry.subject_code,
                day: entry.day,
                start_time: entry.start_time,
                end_time: entry.end_time,
                location: entry.room_number || undefined,
                type: entry.type
            }));

            const icsContent = generateIcs(events);
            downloadIcs(icsContent, 'my-timetable.ics');
            addToast('Calendar exported successfully!', 'success');

        } catch (error) {
            console.error('Export failed:', error);
            addToast('Failed to export calendar', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className={cn(
                "glass-button px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/40 transition-all",
                loading && "opacity-70 cursor-not-allowed"
            )}
            title="Export to Calendar"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
            <span className="hidden md:inline">Sync Calendar</span>
        </button>
    );
}
