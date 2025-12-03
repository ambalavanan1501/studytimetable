import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    permission: NotificationPermission;
    subscription: PushSubscription | null;
    requestPermission: () => Promise<void>;
    sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
    const [notifiedClasses, setNotifiedClasses] = useState<Set<string>>(new Set());

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Fetch today's classes
    useEffect(() => {
        if (!user) return;

        const fetchTodaysClasses = async () => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];

            try {
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
                setTodaysClasses(allEntries);
            } catch (error) {
                console.error('Error fetching today classes:', error);
            }
        };

        fetchTodaysClasses();
        // Refresh every hour to handle day changes or updates
        const interval = setInterval(fetchTodaysClasses, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    // Check for upcoming classes every minute
    useEffect(() => {
        if (permission !== 'granted' || todaysClasses.length === 0) return;

        const checkClasses = () => {
            const now = new Date();

            todaysClasses.forEach(entry => {
                if (notifiedClasses.has(entry.id)) return;

                const [hours, minutes] = entry.start_time.split(':').map(Number);
                const classTime = new Date();
                classTime.setHours(hours, minutes, 0, 0);

                const timeDiff = classTime.getTime() - now.getTime();
                const minutesDiff = timeDiff / (1000 * 60);

                // Notify if class is starting in 5 minutes (checking range 4.5 to 5.5 to be safe)
                if (minutesDiff > 4.5 && minutesDiff <= 5.5) {
                    sendNotification(`Upcoming Class: ${entry.subject_name}`, {
                        body: `Your ${entry.type} class starts in 5 minutes at ${entry.room_number || 'Unknown Room'}`,
                        icon: '/pwa-192x192.png',
                        tag: entry.id // Prevent duplicate notifications on system level
                    });

                    setNotifiedClasses(prev => new Set(prev).add(entry.id));
                }
            });
        };

        const interval = setInterval(checkClasses, 60 * 1000); // Check every minute
        checkClasses(); // Check immediately

        return () => clearInterval(interval);
    }, [todaysClasses, permission, notifiedClasses]);

    const sendNotification = (title: string, options?: NotificationOptions) => {
        if (permission === 'granted') {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            } else {
                new Notification(title, options);
            }
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.error('This browser does not support desktop notification');
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                await subscribeUser();
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
        }
    };

    const subscribeUser = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const existingSubscription = await registration.pushManager.getSubscription();

                if (existingSubscription) {
                    setSubscription(existingSubscription);
                    console.log('Existing subscription:', existingSubscription);
                    return;
                }

                const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) {
                    console.error('VAPID Public Key is missing!');
                    return;
                }

                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
                const newSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });

                setSubscription(newSubscription);
                console.log('New subscription:', newSubscription);

                // Save subscription to backend
                if (user) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ subscription: newSubscription })
                        .eq('id', user.id);

                    if (error) {
                        console.error('Error saving subscription to database:', error);
                    } else {
                        console.log('Subscription saved to database');
                    }
                }
            } catch (error) {
                console.error('Error subscribing to push:', error);
            }
        }
    };

    const sendTestNotification = async () => {
        sendNotification('Test Notification', {
            body: 'This is a test notification from your app!',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png'
        });
    };

    return (
        <NotificationContext.Provider value={{ permission, subscription, requestPermission, sendTestNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
