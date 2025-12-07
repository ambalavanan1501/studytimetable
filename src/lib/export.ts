import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';
import { db } from './db';

// --- JSON Backup ---

export async function exportDataAsJSON(userId: string) {
    try {
        // 1. Fetch Supabase Data
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        const { data: timetable } = await supabase.from('timetable_entries').select('*').eq('user_id', userId);
        const { data: smartTimetable } = await supabase.from('smart_timetable_entries').select('*').eq('user_id', userId);
        const { data: attendance } = await supabase.from('attendance_logs').select('*').eq('user_id', userId);

        // 2. Fetch Local Data (IndexedDB)
        const simulatorSubjects = await db.getAllSimulatorSubjects();
        const notes = await db.getAllNotes();
        const countdowns = await db.getAllCountdowns();
        const tasks = await db.getAllTasks();

        // 3. Construct Backup Object
        const backupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            user: {
                id: userId,
                profile: profile || {},
            },
            academics: {
                timetable: timetable || [],
                smart_timetable: smartTimetable || [],
                attendance_logs: attendance || [],
            },
            local_data: {
                simulator_subjects: simulatorSubjects || [],
                notes: notes || [],
                countdowns: countdowns || [],
                tasks: tasks || []
            }
        };

        // 4. Trigger Download
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `academic_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Export JSON failed:', error);
        throw error;
    }
}


// --- PDF Report ---

export async function generatePDFReport(userId: string) {
    try {
        const doc = new jsPDF();
        const margin = 20;
        let yPos = 20;

        // Fetch Data needed for report
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        const { data: attendanceLogs } = await supabase.from('attendance_logs').select('*').eq('user_id', userId);

        // --- Header ---
        doc.setFontSize(24);
        doc.setTextColor(80, 70, 229); // Primary color roughly
        doc.text("Student Academic Report", margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos);
        yPos += 15;

        // --- Profile Summary ---
        doc.setDrawColor(200);
        doc.line(margin, yPos, 190, yPos);
        yPos += 10;

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Student Profile", margin, yPos);
        yPos += 8;

        doc.setFontSize(11);
        doc.setTextColor(60);

        const name = profile?.full_name || "N/A";
        const university = profile?.university || "N/A";
        const branch = `${profile?.branch || "-"} (${profile?.semester || "-"})`;
        const cgpa = profile?.cgpa ? `${profile.cgpa}` : "N/A";

        doc.text(`Name: ${name}`, margin, yPos);
        doc.text(`University: ${university}`, 110, yPos);
        yPos += 7;
        doc.text(`Branch: ${branch}`, margin, yPos);
        doc.text(`CGPA: ${cgpa}`, 110, yPos);
        yPos += 15;

        // --- Attendance Stats ---
        // Calculate stats
        const subjectStats = new Map<string, { total: number, attended: number }>();

        attendanceLogs?.forEach(log => {
            const current = subjectStats.get(log.subject_name) || { total: 0, attended: 0 };
            current.total += 1;
            if (log.status === 'present') current.attended += 1;
            subjectStats.set(log.subject_name, current);
        });

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Attendance Summary", margin, yPos);
        yPos += 5;

        const tableBody = Array.from(subjectStats.entries()).map(([subject, stats]) => {
            const absent = stats.total - stats.attended;
            const percentage = stats.total > 0 ? ((stats.attended / stats.total) * 100).toFixed(1) + '%' : '0%';
            return [subject, stats.attended, absent, stats.total, percentage];
        });

        if (tableBody.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Subject', 'Attended', 'Absent', 'Total Classes', 'Percentage']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [80, 70, 229] },
                styles: { fontSize: 10 },
                margin: { top: 20 }
            });
            // @ts-ignore - autoTable adds lastAutoTable to doc
            yPos = doc.lastAutoTable.finalY + 20;
        } else {
            yPos += 10;
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("No attendance records found.", margin, yPos);
            yPos += 20;
            yPos += 20;
        }

        // --- Academic Vault (Notes) ---
        const notes = await db.getAllNotes();
        if (notes && notes.length > 0) {
            // Add page break if needed
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Academic Vault (Notes)", margin, yPos);
            yPos += 10;

            notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            notes.forEach(note => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(12);
                doc.setTextColor(0);
                const title = note.title || "Untitled Note";
                // Ideally subject name should be fetched, but we only have ID here efficiently. 
                // For now, note title is good.
                doc.text(`• ${title}`, margin, yPos);
                yPos += 7;

                doc.setFontSize(10);
                doc.setTextColor(80);
                const dateStr = new Date(note.updatedAt).toLocaleDateString();
                doc.text(`${dateStr}`, margin + 5, yPos);
                yPos += 5;

                doc.setFontSize(10);
                doc.setTextColor(100);
                const contentPreview = doc.splitTextToSize(note.content || "No content", 170);
                doc.text(contentPreview, margin + 5, yPos);

                yPos += (contentPreview.length * 5) + 10;
            });
        }

        // --- Footer ---
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Generated by CGPA Calculator", margin, 280);

        doc.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
        return true;
    } catch (error) {
        console.error('Export PDF failed:', error);
        throw error;
    }
}
