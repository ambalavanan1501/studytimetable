export interface IcsEvent {
    subject_name: string;
    subject_code: string;
    day: string; // 'Monday', 'Tuesday', ...
    start_time: string; // '09:00:00'
    end_time: string; // '10:00:00'
    location?: string;
    type?: string;
}

const DAY_MAP: Record<string, string> = {
    'Sunday': 'SU',
    'Monday': 'MO',
    'Tuesday': 'TU',
    'Wednesday': 'WE',
    'Thursday': 'TH',
    'Friday': 'FR',
    'Saturday': 'SA'
};

const DAY_INDEX: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
};

// Helper: Get the next Date object for a specific day of the week
function getNextDay(dayName: string): Date {
    const today = new Date();
    const resultDate = new Date(today);
    const targetDay = DAY_INDEX[dayName];
    const currentDay = today.getDay();

    // Calculate days until target day
    // If today is Monday(1) and target is Wednesday(3) -> 3-1 = 2 days
    // If today is Friday(5) and target is Monday(1) -> 1-5 = -4 -> +7 = 3 days
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) {
        daysUntil += 7;
    }

    resultDate.setDate(today.getDate() + daysUntil);
    return resultDate;
}

// Helper: Format date to YYYYMMDDTHHmmSS
function formatIcsDate(date: Date, timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);

    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateIcs(events: IcsEvent[]): string {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CGPA Calculator//Student Timetable//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    events.forEach(event => {
        const nextOccurrence = getNextDay(event.day);
        const dtStart = formatIcsDate(nextOccurrence, event.start_time);
        const dtEnd = formatIcsDate(nextOccurrence, event.end_time);
        const dayCode = DAY_MAP[event.day];

        icsContent = icsContent.concat([
            'BEGIN:VEVENT',
            `UID:${crypto.randomUUID()}`,
            `DTSTAMP:${now}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
            `SUMMARY:${event.subject_name} (${event.subject_code})`,
            `DESCRIPTION:Class Type: ${event.type || 'Class'}`,
            event.location ? `LOCATION:${event.location}` : '',
            'STATUS:CONFIRMED',
            'END:VEVENT'
        ]);
    });

    icsContent.push('END:VCALENDAR');

    // Remove empty lines
    return icsContent.filter(line => line).join('\r\n');
}

export function downloadIcs(content: string, filename: string = 'timetable.ics') {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
