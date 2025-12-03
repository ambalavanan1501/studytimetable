require('dotenv').config();
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST use Service Role Key for backend
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Web Push
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:example@test.com';

webpush.setVapidDetails(subject, publicVapidKey, privateVapidKey);

console.log('Notification Service Started...');

// Schedule task to run every minute
cron.schedule('* * * * *', async () => {
    console.log('Checking for upcoming classes...');
    await checkAndSendNotifications();
});

async function checkAndSendNotifications() {
    try {
        // 1. Get all users with subscriptions
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('id, subscription')
            .not('subscription', 'is', null);

        if (userError) throw userError;

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        const now = new Date();

        // 2. For each user, check their schedule
        for (const user of users) {
            if (!user.subscription) continue;

            // Fetch today's classes from both tables
            const { data: basicEntries } = await supabase
                .from('timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', today);

            const { data: smartEntries } = await supabase
                .from('smart_timetable_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('day', today);

            const allEntries = [...(basicEntries || []), ...(smartEntries || [])];

            for (const entry of allEntries) {
                const [hours, minutes] = entry.start_time.split(':').map(Number);
                const classTime = new Date();
                classTime.setHours(hours, minutes, 0, 0);

                const timeDiff = classTime.getTime() - now.getTime();
                const minutesDiff = timeDiff / (1000 * 60);

                // Notify if class is starting in 5 minutes (4.5 to 5.5 range)
                if (minutesDiff > 4.5 && minutesDiff <= 5.5) {
                    console.log(`Sending notification to user ${user.id} for class ${entry.subject_name}`);

                    const payload = JSON.stringify({
                        title: `Upcoming Class: ${entry.subject_name}`,
                        body: `Your ${entry.type} class starts in 5 minutes at ${entry.room_number || 'Unknown Room'}`,
                        url: '/'
                    });

                    try {
                        await webpush.sendNotification(user.subscription, payload);
                    } catch (err) {
                        console.error(`Error sending notification to user ${user.id}:`, err);
                        if (err.statusCode === 410) {
                            // Subscription expired, remove it
                            console.log('Subscription expired, removing from DB...');
                            await supabase.from('profiles').update({ subscription: null }).eq('id', user.id);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in checkAndSendNotifications:', error);
    }
}
