import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, FileText, BookOpen, Link as LinkIcon, ExternalLink, Mail, User } from 'lucide-react';
import { db } from '../../lib/db';
import { cn } from '../../lib/utils';
import { NoteEditor } from './NoteEditor';
import * as Tabs from '@radix-ui/react-tabs';

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

interface Resource {
    id: string;
    title: string;
    url: string;
    type: 'drive' | 'link' | 'other';
}

interface SubjectDetails {
    subjectCode: string;
    professorName?: string;
    professorEmail?: string;
    resources: Resource[];
}

export function SubjectVault({ isOpen, onClose, subjectName, subjectCode }: SubjectVaultProps) {
    const [activeTab, setActiveTab] = useState('notes');
    const [notes, setNotes] = useState<Note[]>([]);
    const [details, setDetails] = useState<SubjectDetails>({ subjectCode, resources: [] });
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [loading, setLoading] = useState(true);

    // Edit Details State
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [profName, setProfName] = useState('');
    const [profEmail, setProfEmail] = useState('');

    // New Resource State
    const [isAddingResource, setIsAddingResource] = useState(false);
    const [newResTitle, setNewResTitle] = useState('');
    const [newResUrl, setNewResUrl] = useState('');

    const subjectId = subjectCode;

    const loadData = async () => {
        try {
            setLoading(true);
            const [notesData, detailsData] = await Promise.all([
                db.getNotesBySubject(subjectId),
                db.getSubjectDetails(subjectId)
            ]);

            setNotes(notesData || []);
            if (detailsData) {
                setDetails(detailsData);
                setProfName(detailsData.professorName || '');
                setProfEmail(detailsData.professorEmail || '');
            } else {
                setDetails({ subjectCode, resources: [] });
                setProfName('');
                setProfEmail('');
            }
        } catch (error) {
            console.error("Failed to load vault data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadData();
            setActiveTab('notes');
            setIsEditingNote(false);
        }
    }, [isOpen, subjectId]);

    const handleSaveDetails = async () => {
        const newDetails: SubjectDetails = {
            ...details,
            professorName: profName,
            professorEmail: profEmail
        };
        await db.saveSubjectDetails(newDetails);
        setDetails(newDetails);
        setIsEditingDetails(false);
    };

    const handleAddResource = async () => {
        if (!newResTitle || !newResUrl) return;

        const newRes: Resource = {
            id: crypto.randomUUID(),
            title: newResTitle,
            url: newResUrl,
            type: 'link' // defaulting for now
        };

        const newDetails: SubjectDetails = {
            ...details,
            resources: [...details.resources, newRes]
        };

        await db.saveSubjectDetails(newDetails);
        setDetails(newDetails);
        setNewResTitle('');
        setNewResUrl('');
        setIsAddingResource(false);
    };

    const handleDeleteResource = async (id: string) => {
        const newDetails: SubjectDetails = {
            ...details,
            resources: details.resources.filter(r => r.id !== id)
        };
        await db.saveSubjectDetails(newDetails);
        setDetails(newDetails);
    };

    // Note handlers
    const handleCreateNewNote = () => {
        setSelectedNote(null);
        setIsEditingNote(true);
    };

    const handleCloseNoteEditor = () => {
        setIsEditingNote(false);
        setSelectedNote(null);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

            <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate max-w-[300px]">{subjectName}</h2>
                            <p className="text-sm text-slate-500 font-mono">{subjectCode}</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="h-6 w-6 text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-b border-slate-100">
                        <Tabs.List className="flex gap-6">
                            <Tabs.Trigger value="notes" className="py-4 text-sm font-bold text-slate-500 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 transition-all">
                                Notes
                            </Tabs.Trigger>
                            <Tabs.Trigger value="resources" className="py-4 text-sm font-bold text-slate-500 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 transition-all">
                                Resources
                            </Tabs.Trigger>
                            <Tabs.Trigger value="info" className="py-4 text-sm font-bold text-slate-500 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 transition-all">
                                Info
                            </Tabs.Trigger>
                        </Tabs.List>
                    </div>

                    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-0 overflow-hidden flex">

                        {/* === NOTES TAB === */}
                        <Tabs.Content value="notes" className="flex-1 flex w-full h-full data-[state=inactive]:hidden">
                            {/* Sidebar - Note List */}
                            <div className={cn(
                                "w-full sm:w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 bg-white",
                                isEditingNote ? "hidden sm:flex" : "flex"
                            )}>
                                <div className="p-4">
                                    <button
                                        onClick={handleCreateNewNote}
                                        className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>New Note</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
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
                                        </div>
                                    ) : (
                                        notes.map(note => (
                                            <div
                                                key={note.id}
                                                onClick={() => { setSelectedNote(note); setIsEditingNote(true); }}
                                                className={cn(
                                                    "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md text-left group",
                                                    selectedNote?.id === note.id
                                                        ? "bg-primary-50 border-primary-500 shadow-md ring-1 ring-primary-500"
                                                        : "bg-white border-slate-200 hover:border-primary-300"
                                                )}
                                            >
                                                <h3 className="font-bold text-slate-800 mb-1 truncate">{note.title}</h3>
                                                <p className="text-xs text-slate-500 line-clamp-2">{note.content || "Empty note..."}</p>
                                                <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(note.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Editor Area */}
                            <div className={cn(
                                "flex-1 flex flex-col bg-slate-50 dark:bg-slate-950",
                                isEditingNote ? "flex" : "hidden sm:flex"
                            )}>
                                {isEditingNote ? (
                                    <NoteEditor
                                        noteId={selectedNote?.id}
                                        subjectId={subjectId}
                                        initialTitle={selectedNote?.title}
                                        initialContent={selectedNote?.content}
                                        onClose={handleCloseNoteEditor}
                                        onSave={loadData}
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center">
                                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                            <BookOpen className="h-10 w-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-400 mb-2">Select a note to view</h3>
                                    </div>
                                )}
                            </div>
                        </Tabs.Content>

                        {/* === RESOURCES TAB === */}
                        <Tabs.Content value="resources" className="flex-1 p-6 overflow-y-auto w-full max-w-4xl mx-auto data-[state=inactive]:hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-800">Study Materials</h3>
                                <button
                                    onClick={() => setIsAddingResource(true)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <Plus className="h-4 w-4" /> Add Link
                                </button>
                            </div>

                            {isAddingResource && (
                                <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2">
                                    <h4 className="font-bold text-sm mb-3">Add New Resource</h4>
                                    <div className="space-y-3">
                                        <input
                                            type="text" placeholder="Title (e.g., Folder Link)"
                                            value={newResTitle} onChange={e => setNewResTitle(e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        />
                                        <input
                                            type="url" placeholder="URL (https://...)"
                                            value={newResUrl} onChange={e => setNewResUrl(e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setIsAddingResource(false)} className="px-3 py-1 text-sm text-slate-500">Cancel</button>
                                            <button onClick={handleAddResource} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm">Save</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {details.resources.length > 0 ? (
                                    details.resources.map(res => (
                                        <div key={res.id} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-400 transition-all group relative">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <LinkIcon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 truncate">{res.title}</h4>
                                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                                        Visit Link <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                                <button onClick={() => handleDeleteResource(res.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-50 rounded-md transition-all">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                                        <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        <p>No resources added yet.</p>
                                    </div>
                                )}
                            </div>
                        </Tabs.Content>

                        {/* === INFO TAB === */}
                        <Tabs.Content value="info" className="flex-1 p-6 w-full max-w-2xl mx-auto data-[state=inactive]:hidden">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="font-bold text-lg text-slate-800">Professor Details</h3>
                                    {!isEditingDetails ? (
                                        <button onClick={() => setIsEditingDetails(true)} className="text-sm font-bold text-primary-600 hover:underline">Edit</button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditingDetails(false)} className="text-sm text-slate-500">Cancel</button>
                                            <button onClick={handleSaveDetails} className="text-sm font-bold text-green-600">Save</button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Name</label>
                                            {isEditingDetails ? (
                                                <input
                                                    type="text" className="w-full p-2 border rounded-lg"
                                                    value={profName} onChange={e => setProfName(e.target.value)} placeholder="Professor Name"
                                                />
                                            ) : (
                                                <p className="font-bold text-slate-800 text-lg">{details.professorName || "Not set"}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <Mail className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                                            {isEditingDetails ? (
                                                <input
                                                    type="text" className="w-full p-2 border rounded-lg"
                                                    value={profEmail} onChange={e => setProfEmail(e.target.value)} placeholder="email@university.edu"
                                                />
                                            ) : (
                                                <p className="font-bold text-slate-800 text-lg">{details.professorEmail || "Not set"}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Tabs.Content>
                    </div>
                </Tabs.Root>

            </div>
        </div>,
        document.body
    );
}
