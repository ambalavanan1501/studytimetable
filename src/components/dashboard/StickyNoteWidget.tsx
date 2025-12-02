import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { db } from '../../lib/db';

export function StickyNoteWidget() {
    const navigate = useNavigate();
    const [note, setNote] = useState<{ id: string; content: string } | null>(null);

    useEffect(() => {
        loadLatestNote();
    }, []);

    const loadLatestNote = async () => {
        const notes = await db.getAllNotes();
        if (notes.length > 0) {
            // Get the most recently updated note
            const latest = notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
            setNote(latest);
        } else {
            // Create a default "Quick Note" if none exists
            const newNote = {
                id: 'quick-note',
                content: '',
                updatedAt: new Date()
            };
            await db.saveNote(newNote);
            setNote(newNote);
        }
    };

    const handleUpdate = async (content: string) => {
        if (note) {
            const updated = { ...note, content, updatedAt: new Date() };
            setNote(updated);
            // Debounce could be added here
            await db.saveNote(updated);
        }
    };

    return (
        <div className="glass-card p-5 rounded-3xl relative group h-full flex flex-col bg-yellow-50/30 border-yellow-100/50">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    Quick Note
                </h3>
                <button
                    onClick={() => navigate('/notes')}
                    className="p-1.5 rounded-full hover:bg-yellow-100 text-slate-400 hover:text-yellow-600 transition-colors"
                >
                    <ArrowUpRight className="h-4 w-4" />
                </button>
            </div>
            <textarea
                value={note?.content || ''}
                onChange={(e) => handleUpdate(e.target.value)}
                placeholder="Jot something down..."
                className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-slate-600 placeholder:text-slate-400 p-0 text-sm leading-relaxed"
            />
        </div>
    );
}
