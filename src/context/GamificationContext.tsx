import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';

interface GamificationContextType {
    xp: number;
    level: number;
    addXP: (amount: number, reason: string) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [xp, setXP] = useState(0);
    const [level, setLevel] = useState(1);
    const { addToast } = useToast();

    useEffect(() => {
        // Load from local storage
        const savedXP = parseInt(localStorage.getItem('student_xp') || '0');
        setXP(savedXP);
        calculateLevel(savedXP);
    }, []);

    const calculateLevel = (currentXP: number) => {
        // Formula: Level = floor(sqrt(XP / 100)) + 1
        // 0-99 XP = Level 1
        // 100-399 XP = Level 2
        // 400-899 XP = Level 3
        const newLevel = Math.floor(Math.sqrt(currentXP / 100)) + 1;
        setLevel(newLevel);
    };

    const addXP = (amount: number, reason: string) => {
        setXP(prev => {
            const newXP = prev + amount;
            localStorage.setItem('student_xp', newXP.toString());

            // Check for level up
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
        <GamificationContext.Provider value={{ xp, level, addXP }}>
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
