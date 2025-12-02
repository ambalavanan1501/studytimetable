import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MyDB extends DBSchema {
    notes: {
        key: string;
        value: {
            id: string;
            content: string;
            updatedAt: Date;
        };
        indexes: { 'by-date': Date };
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
            completed: boolean;
            createdAt: Date;
        };
    };
}

const DB_NAME = 'student-dashboard-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MyDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Sticky Notes Store
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                    notesStore.createIndex('by-date', 'updatedAt');
                }

                // Countdown Store
                if (!db.objectStoreNames.contains('countdowns')) {
                    db.createObjectStore('countdowns', { keyPath: 'id' });
                }

                // Tasks Store
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id' });
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
    async saveNote(note: { id: string; content: string; updatedAt: Date }) {
        return (await initDB()).put('notes', note);
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
    async saveTask(task: { id: string; text: string; completed: boolean; createdAt: Date }) {
        return (await initDB()).put('tasks', task);
    },
    async deleteTask(id: string) {
        return (await initDB()).delete('tasks', id);
    },
};
