import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, FileJson, FileText, StickyNote } from 'lucide-react';
import { db } from '../lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';

interface Note {
    id: string;
    title: string;
    content: string;
    updatedAt: Date;
}

export function StickyNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const data = await db.getAllNotes();
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
            title: 'Untitled Note',
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
        <div className="min-h-screen p-2 md:p-6 pb-24 space-y-8">
            <SEO title="Sticky Notes" description="Quick thoughts." />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Sticky Notes</h1>
                    <p className="text-slate-400 font-medium md:-mt-1 text-sm">Capture your thoughts.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={exportJSON}
                        className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-slate-200 font-bold text-sm"
                    >
                        <FileJson className="h-4 w-4" />
                        <span className="hidden sm:inline">JSON</span>
                    </button>
                    <button
                        onClick={exportPDF}
                        className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-slate-200 font-bold text-sm"
                    >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <label className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-slate-200 font-bold text-sm cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Import</span>
                        <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                    </label>
                    <button
                        onClick={handleAddNote}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-300 ml-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="font-bold">New Note</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="animate-pulse">Loading notes...</div>
                </div>
            ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100">
                        <StickyNote className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">Empty Board</h3>
                    <p className="text-slate-400 font-medium mb-8">Add a note to get started.</p>
                    <button onClick={handleAddNote} className="text-amber-500 font-bold hover:bg-amber-50 px-6 py-2.5 rounded-full transition-colors">
                        Create first note
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[220px]">
                    {notes.map((note, i) => (
                        <div
                            key={note.id}
                            className={cn(
                                "p-5 rounded-[1.25rem] flex flex-col relative group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border",
                                // Cyclic Coloring for clean variation
                                i % 3 === 0 ? "bg-amber-50 border-amber-100" :
                                    i % 3 === 1 ? "bg-blue-50 border-blue-100" :
                                        "bg-rose-50 border-rose-100"
                            )}
                        >
                            <textarea
                                value={note.content}
                                onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                                placeholder="Type here..."
                                className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-slate-800 placeholder:text-slate-300 p-0 text-lg font-medium leading-relaxed"
                                spellCheck={false}
                            />
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-900/5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {note.updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-1.5 hover:bg-white/50 text-slate-400 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
