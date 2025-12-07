import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, FileText, BookOpen } from 'lucide-react';
import { db } from '../../lib/db';
import { cn } from '../../lib/utils';
import { NoteEditor } from './NoteEditor';

interface SubjectVaultProps {
    isOpen: boolean;
    onClose: () => void;
    subjectName: string;
    subjectCode: string;
}

interface Note {
    id: string;
    title: string;
    content: string;
    updatedAt: Date;
    subjectId?: string;
}

export function SubjectVault({ isOpen, onClose, subjectName, subjectCode }: SubjectVaultProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Use subject code as ID for simplification in this demo, usually would be a UUID
    const subjectId = subjectCode;

    const loadNotes = async () => {
        try {
            setLoading(true);
            const data = await db.getNotesBySubject(subjectId);
            setNotes(data || []);
        } catch (error) {
            console.error("Failed to load notes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadNotes();
        }
    }, [isOpen, subjectId]);

    if (!isOpen) return null;

    const handleCreateNew = () => {
        setSelectedNote(null);
        setIsEditing(true);
    };

    const handleCloseEditor = () => {
        setIsEditing(false);
        setSelectedNote(null);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

            <div className="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex">

                {/* Sidebar - Note List */}
                <div className={cn(
                    "w-full sm:w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300",
                    isEditing ? "hidden sm:flex" : "flex"
                )}>
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">{subjectName}</h2>
                                <p className="text-xs text-slate-500 font-mono">{subjectCode}</p>
                            </div>
                        </div>
                    </div>

                    {/* Search & Add */}
                    <div className="p-4 space-y-3">
                        <button
                            onClick={handleCreateNew}
                            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>New Note</span>
                        </button>
                    </div>

                    {/* Notes List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-50/30">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No notes yet.</p>
                                <p className="text-xs">Create one to get started!</p>
                            </div>
                        ) : (
                            notes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => {
                                        setSelectedNote(note);
                                        setIsEditing(true);
                                    }}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md text-left group",
                                        selectedNote?.id === note.id
                                            ? "bg-white border-primary-500 shadow-md ring-1 ring-primary-500"
                                            : "bg-white border-slate-200 hover:border-primary-300"
                                    )}
                                >
                                    <h3 className="font-bold text-slate-800 mb-1 truncate group-hover:text-primary-600 transition-colors">{note.title}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-2">{note.content || "Empty note..."}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 text-right">
                                        {new Date(note.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content - Editor or Placeholder */}
                <div className={cn(
                    "flex-1 flex flex-col bg-slate-50 dark:bg-slate-950",
                    isEditing ? "flex" : "hidden sm:flex"
                )}>
                    {isEditing ? (
                        <NoteEditor
                            noteId={selectedNote?.id}
                            subjectId={subjectId}
                            initialTitle={selectedNote?.title}
                            initialContent={selectedNote?.content}
                            onClose={handleCloseEditor}
                            onSave={loadNotes}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center bg-slate-50/50">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <BookOpen className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-400 mb-2">Select a note to view</h3>
                            <p className="max-w-xs mx-auto text-sm">Or create a new one to start building your knowledge base for {subjectName}.</p>
                        </div>
                    )}
                </div>

                {/* Close Button (Absolute) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-slate-500 hover:text-red-500 transition-all z-10"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>,
        document.body
    );
}
