import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface GamificationContextType {
    xp: number;
    level: number;
    streak: number;
    addXP: (amount: number, reason: string) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [xp, setXP] = useState(0);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);
    const { addToast } = useToast();

    // Load initial data
    useEffect(() => {
        const initGamification = async () => {
            if (user) {
                // Fetch from Supabase
                const { data } = await supabase
                    .from('profiles')
                    .select('xp, current_streak, last_active_date')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    // XP Logic (assuming XP column exists or we use local storage for now if not in DB yet)
                    // Wait, the plan didn't add XP to DB, but I saw it uses localStorage. 
                    // I will prioritize Streak logic here which IS in DB now.

                    const lastActive = data.last_active_date ? new Date(data.last_active_date) : new Date(0);
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    // Normalize to midnight for comparison
                    lastActive.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    yesterday.setHours(0, 0, 0, 0);

                    let newStreak = data.current_streak || 0;

                    if (lastActive.getTime() === today.getTime()) {
                        // Already logged in today, do nothing
                    } else if (lastActive.getTime() === yesterday.getTime()) {
                        // Creating a streak!
                        newStreak += 1;
                        await updateStreak(newStreak);
                        addToast(`🔥 Streak continued! ${newStreak} days`, 'success');
                    } else {
                        // Streak broken (unless it's the first time ever)
                        if (newStreak > 0) {
                            addToast('Streak broken! Start fresh today.', 'info');
                        }
                        newStreak = 1;
                        await updateStreak(newStreak);
                    }
                    setStreak(newStreak);
                }
            }

            // Legacy Local Storage for XP (preserving existing functionality)
            const savedXP = parseInt(localStorage.getItem('student_xp') || '0');
            setXP(savedXP);
            calculateLevel(savedXP);
        };

        initGamification();
    }, [user]);

    const updateStreak = async (newStreak: number) => {
        if (!user) return;
        const todayStr = new Date().toISOString().split('T')[0];

        await supabase.from('profiles').update({
            current_streak: newStreak,
            last_active_date: todayStr
        }).eq('id', user.id);
    };

    const calculateLevel = (currentXP: number) => {
        // Formula: Level = floor(sqrt(XP / 100)) + 1
        const newLevel = Math.floor(Math.sqrt(currentXP / 100)) + 1;
        setLevel(newLevel);
    };

    const addXP = (amount: number, reason: string) => {
        setXP(prev => {
            const newXP = prev + amount;
            localStorage.setItem('student_xp', newXP.toString());

            const oldLevel = Math.floor(Math.sqrt(prev / 100)) + 1;
            const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

            if (newLevel > oldLevel) {
                addToast(`🎉 Level Up! You are now Level ${newLevel}`, 'success');
                setLevel(newLevel);
            } else {
                addToast(`+${amount} XP: ${reason}`, 'info');
            }

            return newXP;
        });
    };

    return (
        <GamificationContext.Provider value={{ xp, level, streak, addXP }}>
            {children}
        </GamificationContext.Provider>
    );
}

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};
