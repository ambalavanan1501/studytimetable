export interface CourseInput {
    subject_name: string;
    subject_code: string;
    type: string;
    slot: string;
    room_number: string;
    credit: number;
}

export interface ParsedEntry {
    day: string;
    start_time: string;
    end_time: string;
    subject_name: string;
    subject_code: string;
    type: 'theory' | 'lab';
    room_number: string;
    slot_code: string;
    slot_label: string;
    credit: number;
}

export const SLOT_TIMINGS: Record<string, { start: string; end: string; day: string }> = {
    // Theory Slots (Morning)
    'A1': { start: '08:00', end: '08:50', day: 'Monday' },
    'B1': { start: '09:00', end: '09:50', day: 'Tuesday' },
    'C1': { start: '10:00', end: '10:50', day: 'Wednesday' },
    'D1': { start: '11:00', end: '11:50', day: 'Thursday' },
    'E1': { start: '12:00', end: '12:50', day: 'Friday' },
    'F1': { start: '08:00', end: '08:50', day: 'Tuesday' }, // Example mapping, needs verification
    'G1': { start: '09:00', end: '09:50', day: 'Wednesday' },

    // Theory Slots (Evening)
    'A2': { start: '14:00', end: '14:50', day: 'Monday' },
    'B2': { start: '15:00', end: '15:50', day: 'Tuesday' },
    'C2': { start: '16:00', end: '16:50', day: 'Wednesday' },
    'D2': { start: '17:00', end: '17:50', day: 'Thursday' },
    'E2': { start: '18:00', end: '18:50', day: 'Friday' },

    // Lab Slots (L) - usually mapped to combinations like L1+L2 etc.
    // This is a simplified mapping. Real FFCS is complex.
};

// Helper to map slots to days/times. 
// Note: This is a simplified implementation. A full implementation requires the complete slot mapping table.
function getSlotDetails(slot: string): { day: string; start: string; end: string } | null {
    // Basic hardcoded slots for demo purposes
    const map: Record<string, any> = {
        'A1': { day: 'Monday', start: '08:00', end: '08:50' },
        'TA1': { day: 'Thursday', start: '09:00', end: '09:50' }, // Example
        'TAA1': { day: 'Friday', start: '10:00', end: '10:50' }, // Example

        'B1': { day: 'Tuesday', start: '09:00', end: '09:50' },
        'TB1': { day: 'Friday', start: '08:00', end: '08:50' },

        'C1': { day: 'Wednesday', start: '10:00', end: '10:50' },
        'TC1': { day: 'Monday', start: '09:00', end: '09:50' },

        'D1': { day: 'Thursday', start: '11:00', end: '11:50' },
        'TD1': { day: 'Tuesday', start: '10:00', end: '10:50' },

        'E1': { day: 'Friday', start: '12:00', end: '12:50' },
        'TE1': { day: 'Wednesday', start: '11:00', end: '11:50' },

        'F1': { day: 'Monday', start: '12:00', end: '12:50' },
        'TF1': { day: 'Thursday', start: '12:00', end: '12:50' },

        'G1': { day: 'Tuesday', start: '12:00', end: '12:50' },
        'TG1': { day: 'Friday', start: '11:00', end: '11:50' },

        // Afternoon
        'A2': { day: 'Monday', start: '14:00', end: '14:50' },
        'TA2': { day: 'Thursday', start: '15:00', end: '15:50' },

        'B2': { day: 'Tuesday', start: '15:00', end: '15:50' },
        'TB2': { day: 'Friday', start: '14:00', end: '14:50' },

        'C2': { day: 'Wednesday', start: '16:00', end: '16:50' },
        'TC2': { day: 'Monday', start: '15:00', end: '15:50' },

        'D2': { day: 'Thursday', start: '17:00', end: '17:50' },
        'TD2': { day: 'Tuesday', start: '16:00', end: '16:50' },

        'E2': { day: 'Friday', start: '18:00', end: '18:50' },
        'TE2': { day: 'Wednesday', start: '17:00', end: '17:50' },

        'F2': { day: 'Monday', start: '18:00', end: '18:50' },
        'TF2': { day: 'Thursday', start: '18:00', end: '18:50' },

        'G2': { day: 'Tuesday', start: '18:00', end: '18:50' },
        'TG2': { day: 'Friday', start: '17:00', end: '17:50' },
    };

    return map[slot.toUpperCase()] || null;
}

export function parseCourseEntries(inputs: CourseInput[]): { entries: ParsedEntry[], errors: string[] } {
    const entries: ParsedEntry[] = [];
    const errors: string[] = [];

    inputs.forEach((input, index) => {
        if (!input.subject_name || !input.slot) return;

        // Split slots by '+'
        const slots = input.slot.split('+').map(s => s.trim());

        slots.forEach(slot => {
            const details = getSlotDetails(slot);
            if (details) {
                entries.push({
                    day: details.day,
                    start_time: details.start,
                    end_time: details.end,
                    subject_name: input.subject_name,
                    subject_code: input.subject_code,
                    type: input.type as 'theory' | 'lab',
                    room_number: input.room_number,
                    slot_code: slot,
                    slot_label: input.slot,
                    credit: input.credit
                });
            } else {
                errors.push(`Row ${index + 1}: Unknown slot code '${slot}'`);
            }
        });
    });

    return { entries, errors };
}
