import { useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import { db } from '../../lib/db';
import { useToast } from '../../context/ToastContext';

interface NoteEditorProps {
    noteId?: string;
    subjectId?: string;
    initialTitle?: string;
    initialContent?: string;
    onClose: () => void;
    onSave: () => void;
}

export function NoteEditor({ noteId, subjectId, initialTitle = '', initialContent = '', onClose, onSave }: NoteEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const { addToast } = useToast();

    const handleSave = async () => {
        if (!title.trim()) {
            addToast('Please enter a title', 'error');
            return;
        }

        try {
            const id = noteId || crypto.randomUUID();
            await db.saveNote({
                id,
                subjectId,
                title,
                content,
                updatedAt: new Date()
            });
            addToast('Note saved successfully', 'success');
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving note:', error);
            addToast('Failed to save note', 'error');
        }
    };

    const handleDelete = async () => {
        if (!noteId) return;
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await db.deleteNote(noteId);
                addToast('Note deleted', 'info');
                onSave();
                onClose();
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <input
                    type="text"
                    placeholder="Note Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-bold bg-transparent border-none focus:outline-none flex-1 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <div className="flex items-center gap-2">
                    {noteId && (
                        <button
                            onClick={handleDelete}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Note"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2"
                        title="Save Note"
                    >
                        <Save className="h-5 w-5" />
                        <span className="font-semibold text-sm">Save</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-4 overflow-auto">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start typing your notes here..."
                    className="w-full h-full resize-none bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar"
                />
            </div>
        </div>
    );
}
