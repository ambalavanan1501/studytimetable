import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getDayOrder } from '../lib/dayOrder';

export function useClassReminders() {
    const { user } = useAuth();
    const { notificationsEnabled, classReminders } = useSettings();
    const notifiedClasses = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user || !notificationsEnabled || !classReminders) return;

        const checkClasses = async () => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todayStr = new Date().toISOString().split('T')[0];
            const order = getDayOrder(todayStr);
            const queryDay = order ? order : (['Saturday', 'Sunday'].includes(today) ? 'Monday' : today);

            // Fetch classes for today
            const [basicRes, smartRes] = await Promise.all([
                supabase.from('timetable_entries').select('*').eq('user_id', user.id).eq('day', queryDay),
                supabase.from('smart_timetable_entries').select('*').eq('user_id', user.id).eq('day', queryDay)
            ]);

            const allClasses = [...(basicRes.data || []), ...(smartRes.data || [])];

            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTimeInMinutes = currentHours * 60 + currentMinutes;

            allClasses.forEach(cls => {
                const [h, m] = cls.start_time.split(':').map(Number);
                const classTimeInMinutes = h * 60 + m;
                const diff = classTimeInMinutes - currentTimeInMinutes;

                // Notify if class is in 10 minutes (inclusive 5-10 range to catch polling)
                // And hasn't been notified yet today
                if (diff <= 10 && diff > 0) {
                    const key = `${todayStr}-${cls.id}`;
                    if (!notifiedClasses.current.has(key)) {
                        new Notification(`Upcoming Class: ${cls.subject_name}`, {
                            body: `Starts in ${diff} minutes at ${cls.room_number || 'classroom'}.`,
                            icon: '/icon.png' // Ensure this exists or omit
                        });
                        notifiedClasses.current.add(key);
                    }
                }
            });
        };

        // Check immediately and then every minute
        checkClasses();
        const interval = setInterval(checkClasses, 60000);

        return () => clearInterval(interval);
    }, [user, notificationsEnabled, classReminders]);
}
