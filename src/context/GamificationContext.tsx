import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type PetState = 'happy' | 'sick' | 'sleeping' | 'focusing' | 'cool';

interface GamificationContextType {
    xp: number;
    level: number;
    streak: number;
    health: number;
    petState: PetState;
    addXP: (amount: number, reason: string) => void;
    syncHealth: (attendancePercentage: number) => void;
    setFocusMode: (isFocusing: boolean) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [xp, setXP] = useState(0);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);
    const [health, setHealth] = useState(100);
    const [petState, setPetState] = useState<PetState>('happy');
    const [isFocusing, setIsFocusing] = useState(false);

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

    // Pet State Logic
    useEffect(() => {
        const updatePetState = () => {
            const now = new Date();
            const hour = now.getHours();

            if (isFocusing) {
                setPetState('focusing');
                return;
            }

            // Sleeping hours: 11 PM to 6 AM (23 to 6)
            if (hour >= 23 || hour < 6) {
                setPetState('sleeping');
                return;
            }

            // Health based state
            if (health < 75) {
                setPetState('sick');
                return;
            }

            // Default
            setPetState('happy');
        };

        updatePetState();
        const interval = setInterval(updatePetState, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [health, isFocusing]);

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

    const syncHealth = (attendancePercentage: number) => {
        setHealth(attendancePercentage);
    };

    const setFocusMode = (focusing: boolean) => {
        setIsFocusing(focusing);
    };

    return (
        <GamificationContext.Provider value={{ xp, level, streak, health, petState, addXP, syncHealth, setFocusMode }}>
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
