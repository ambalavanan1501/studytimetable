import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Download, Upload, FileJson, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AppSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AppSettingsModal({ isOpen, onClose }: AppSettingsModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const exportJSON = async () => {
        if (!user) return;
        setLoading(true);
        setMessage(null);
        try {
            const [basic, smart] = await Promise.all([
                supabase.from('timetable_entries').select('*').eq('user_id', user.id),
                supabase.from('smart_timetable_entries').select('*').eq('user_id', user.id)
            ]);

            const data = {
                timestamp: new Date().toISOString(),
                timetable_entries: basic.data || [],
                smart_timetable_entries: smart.data || []
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timetable_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'Backup downloaded successfully!' });
        } catch (error) {
            console.error('Export error:', error);
            setMessage({ type: 'error', text: 'Failed to export data.' });
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = async () => {
        if (!user) return;
        setLoading(true);
        setMessage(null);
        try {
            const { data: entries } = await supabase
                .from('timetable_entries')
                .select('*')
                .eq('user_id', user.id);

            const { data: smartEntries } = await supabase
                .from('smart_timetable_entries')
                .select('*')
                .eq('user_id', user.id);

            const allEntries = [...(entries || []), ...(smartEntries || [])];

            // Sort by Day then Time
            const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
            allEntries.sort((a, b) => {
                const dayDiff = (dayOrder[a.day as keyof typeof dayOrder] || 0) - (dayOrder[b.day as keyof typeof dayOrder] || 0);
                if (dayDiff !== 0) return dayDiff;
                return a.start_time.localeCompare(b.start_time);
            });

            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text("My Timetable", 14, 22);
            doc.setFontSize(10);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

            const tableData = allEntries.map(entry => [
                entry.day,
                `${entry.start_time.slice(0, 5)} - ${entry.end_time.slice(0, 5)}`,
                entry.subject_name,
                entry.room_number || '-',
                entry.type.toUpperCase()
            ]);

            autoTable(doc, {
                head: [['Day', 'Time', 'Subject', 'Room', 'Type']],
                body: tableData,
                startY: 40,
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: { fillColor: [147, 51, 234] }, // Purple-600
                alternateRowStyles: { fillColor: [243, 244, 246] } // Gray-100
            });

            doc.save('timetable.pdf');
            setMessage({ type: 'success', text: 'PDF downloaded successfully!' });
        } catch (error) {
            console.error('PDF Export error:', error);
            setMessage({ type: 'error', text: 'Failed to generate PDF.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        setMessage(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);

                if (!json.timetable_entries && !json.smart_timetable_entries) {
                    throw new Error('Invalid backup file format');
                }

                // Clean data for import (remove IDs to avoid conflicts)
                const cleanEntries = (json.timetable_entries || []).map(({ id, created_at, ...rest }: any) => ({
                    ...rest,
                    user_id: user.id
                }));

                const cleanSmartEntries = (json.smart_timetable_entries || []).map(({ id, created_at, ...rest }: any) => ({
                    ...rest,
                    user_id: user.id
                }));

                if (cleanEntries.length > 0) {
                    const { error } = await supabase.from('timetable_entries').insert(cleanEntries);
                    if (error) throw error;
                }

                if (cleanSmartEntries.length > 0) {
                    const { error } = await supabase.from('smart_timetable_entries').insert(cleanSmartEntries);
                    if (error) throw error;
                }

                setMessage({ type: 'success', text: 'Data imported successfully! Refreshing...' });
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error('Import error:', error);
                setMessage({ type: 'error', text: 'Failed to import data. Invalid file.' });
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">App Settings</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>

                    {message && (
                        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            <AlertCircle className="h-4 w-4" />
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Export Data</h3>
                            <button
                                onClick={exportJSON}
                                disabled={loading}
                                className="w-full p-4 glass-card rounded-xl flex items-center justify-between hover:bg-white/60 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <FileJson className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-700">Backup as JSON</p>
                                        <p className="text-xs text-slate-500">Save all your data to a file</p>
                                    </div>
                                </div>
                                <Download className="h-5 w-5 text-slate-400" />
                            </button>

                            <button
                                onClick={exportPDF}
                                disabled={loading}
                                className="w-full p-4 glass-card rounded-xl flex items-center justify-between hover:bg-white/60 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-700">Export as PDF</p>
                                        <p className="text-xs text-slate-500">Download printable timetable</p>
                                    </div>
                                </div>
                                <Download className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-2 pt-2">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Import Data</h3>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="w-full p-4 glass-card rounded-xl flex items-center justify-between hover:bg-white/60 transition-colors group border-2 border-dashed border-slate-300 hover:border-purple-400"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-700">Restore from Backup</p>
                                        <p className="text-xs text-slate-500">Upload a JSON file to restore</p>
                                    </div>
                                </div>
                                {loading && <Loader2 className="h-5 w-5 animate-spin text-purple-600" />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImport}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
