import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, FileJson, FileText } from 'lucide-react';
import { db } from '../lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Note {
    id: string;
    content: string;
    updatedAt: Date;
}

export function StickyNotes() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const data = await db.getAllNotes();
            // Sort by date desc
            setNotes(data.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
        } catch (error) {
            console.error("Failed to load notes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        const newNote = {
            id: crypto.randomUUID(),
            content: '',
            updatedAt: new Date()
        };
        await db.saveNote(newNote);
        setNotes([newNote, ...notes]);
    };

    const handleUpdateNote = async (id: string, content: string) => {
        const note = notes.find(n => n.id === id);
        if (note) {
            const updatedNote = { ...note, content, updatedAt: new Date() };
            await db.saveNote(updatedNote);
            setNotes(notes.map(n => n.id === id ? updatedNote : n));
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (confirm('Delete this note?')) {
            await db.deleteNote(id);
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    const exportJSON = () => {
        const dataStr = JSON.stringify(notes, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "sticky_notes.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Sticky Notes", 14, 15);

        const tableData = notes.map(note => [
            note.updatedAt.toLocaleDateString(),
            note.content
        ]);

        autoTable(doc, {
            head: [['Date', 'Content']],
            body: tableData,
            startY: 20,
        });

        doc.save("sticky_notes.pdf");
    };

    const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedNotes = JSON.parse(e.target?.result as string);
                if (Array.isArray(importedNotes)) {
                    for (const note of importedNotes) {
                        // Ensure dates are parsed back to Date objects
                        const parsedNote = {
                            ...note,
                            updatedAt: new Date(note.updatedAt)
                        };
                        await db.saveNote(parsedNote);
                    }
                    loadNotes();
                    alert('Notes imported successfully!');
                }
            } catch (error) {
                console.error("Import failed", error);
                alert('Failed to import notes. Invalid format.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">Sticky Notes</h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={exportJSON}
                        className="flex items-center gap-2 bg-white text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                        title="Export JSON"
                    >
                        <FileJson className="h-4 w-4" />
                        <span className="hidden sm:inline">JSON</span>
                    </button>
                    <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 bg-white text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                        title="Export PDF"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <label className="flex items-center gap-2 bg-white text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Import</span>
                        <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                    </label>
                    <button
                        onClick={handleAddNote}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-full hover:bg-primary-700 transition-colors shadow-md ml-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>New Note</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading notes...</div>
            ) : notes.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <p>No notes yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <div key={note.id} className="glass-card p-4 rounded-2xl flex flex-col h-64 relative group transition-all hover:shadow-lg bg-yellow-50/50 border-yellow-100">
                            <textarea
                                value={note.content}
                                onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                                placeholder="Type your note here..."
                                className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-slate-700 placeholder:text-slate-400 p-0 text-lg leading-relaxed"
                            />
                            <div className="flex justify-between items-center mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-slate-400">
                                    {note.updatedAt.toLocaleDateString()}
                                </span>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
