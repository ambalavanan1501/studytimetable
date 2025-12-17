import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_VERSION = 5; // Increment version for Subject Details & Task Dates

interface MyDB extends DBSchema {
    notes: {
        key: string;
        value: {
            id: string;
            subjectId?: string; // Optional link to a subject
            title: string;
            content: string;
            updatedAt: Date;
        };
        indexes: { 'by-date': Date, 'by-subject': string };
    };
    countdowns: {
        key: string;
        value: {
            id: string;
            title: string;
            targetDate: Date;
        };
    };
    tasks: {
        key: string;
        value: {
            id: string;
            text: string;
            status: 'todo' | 'in-progress' | 'done';
            dueDate?: Date; // Added Due Date
            createdAt: Date;
        };
    };
    subject_details: { // NEW STORE
        key: string; // subjectCode
        value: {
            subjectCode: string;
            professorName?: string;
            professorEmail?: string;
            // storing resources as a simple array within the subject object for simplicity
            resources: { id: string; title: string; url: string; type: 'drive' | 'link' | 'other' }[];
        };
    };
    simulator_subjects: {
        key: string;
        value: {
            id: string;
            name: string;
            credits: number;
            grade: string;
        };
    };
}

const DB_NAME = 'student-dashboard-db';

let dbPromise: Promise<IDBPDatabase<MyDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
            upgrade(db, _oldVersion, _, transaction) {
                // Sticky Notes Store
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                    notesStore.createIndex('by-date', 'updatedAt');
                    notesStore.createIndex('by-subject', 'subjectId');
                } else {
                    const tx = transaction;
                    const notesStore = tx.objectStore('notes');
                    if (!notesStore.indexNames.contains('by-subject')) {
                        notesStore.createIndex('by-subject', 'subjectId');
                    }
                }

                // Countdown Store
                if (!db.objectStoreNames.contains('countdowns')) {
                    db.createObjectStore('countdowns', { keyPath: 'id' });
                }

                // Tasks Store
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id' });
                }

                // Subject Details Store (NEW)
                if (!db.objectStoreNames.contains('subject_details')) {
                    db.createObjectStore('subject_details', { keyPath: 'subjectCode' });
                }

                // Simulator Subjects Store
                if (!db.objectStoreNames.contains('simulator_subjects')) {
                    db.createObjectStore('simulator_subjects', { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

export const db = {
    // Notes
    async getNote(id: string) {
        return (await initDB()).get('notes', id);
    },
    async getAllNotes() {
        return (await initDB()).getAllFromIndex('notes', 'by-date');
    },
    async saveNote(note: { id: string; subjectId?: string; title: string; content: string; updatedAt: Date }) {
        return (await initDB()).put('notes', note);
    },
    async getNotesBySubject(subjectId: string) {
        return (await initDB()).getAllFromIndex('notes', 'by-subject', subjectId);
    },
    async deleteNote(id: string) {
        return (await initDB()).delete('notes', id);
    },

    // Countdowns
    async getAllCountdowns() {
        return (await initDB()).getAll('countdowns');
    },
    async saveCountdown(countdown: { id: string; title: string; targetDate: Date }) {
        return (await initDB()).put('countdowns', countdown);
    },
    async deleteCountdown(id: string) {
        return (await initDB()).delete('countdowns', id);
    },

    // Tasks
    async getAllTasks() {
        return (await initDB()).getAll('tasks');
    },
    async saveTask(task: { id: string; text: string; status: 'todo' | 'in-progress' | 'done'; dueDate?: Date; createdAt: Date }) {
        return (await initDB()).put('tasks', task);
    },
    async deleteTask(id: string) {
        return (await initDB()).delete('tasks', id);
    },

    // Subject Details (NEW)
    async getSubjectDetails(subjectCode: string) {
        return (await initDB()).get('subject_details', subjectCode);
    },
    async saveSubjectDetails(details: { subjectCode: string; professorName?: string; professorEmail?: string; resources: any[] }) {
        return (await initDB()).put('subject_details', details);
    },

    // Simulator Subjects
    async getAllSimulatorSubjects() {
        return (await initDB()).getAll('simulator_subjects');
    },
    async saveSimulatorSubject(subject: { id: string; name: string; credits: number; grade: string }) {
        return (await initDB()).put('simulator_subjects', subject);
    },
    async deleteSimulatorSubject(id: string) {
        return (await initDB()).delete('simulator_subjects', id);
    },
};
