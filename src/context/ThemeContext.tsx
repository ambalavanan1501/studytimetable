import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Theme = 'purple' | 'blue' | 'green' | 'orange' | 'pink';
type Mode = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    mode: Mode;
    setTheme: (theme: Theme) => void;
    setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    // Initialize from localStorage to prevent flash
    const [theme, setThemeState] = useState<Theme>(
        (localStorage.getItem('app-theme') as Theme) || 'purple'
    );
    const [mode, setModeState] = useState<Mode>(
        (localStorage.getItem('app-mode') as Mode) || 'light'
    );

    // Apply to DOM immediately
    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old classes
        root.classList.remove('light', 'dark');

        // Add new mode class
        root.classList.add(mode);

        // Set data-theme attribute
        root.setAttribute('data-theme', theme);

        // Persist to localStorage
        localStorage.setItem('app-theme', theme);
        localStorage.setItem('app-mode', mode);
    }, [theme, mode]);

    // Sync with Supabase when user logs in
    useEffect(() => {
        if (user) {
            const fetchPreferences = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('accent_color, theme_preference') // Assuming theme_preference maps to 'light'/'dark'? Or maybe we need a new column?
                    // Based on Profile.tsx, 'theme_preference' existed but seemed unused or generic. 
                    // Let's assume accent_color is the color theme. We might need a new column for mode if not present.
                    // For now, let's sync accent_color -> theme.
                    .eq('id', user.id)
                    .single();

                if (data) {
                    if (data.accent_color) setThemeState(data.accent_color as Theme);
                    // If we had a mode column, we'd sync it here. 
                    // For MVP, we stick to localStorage for mode unless requested to persist to DB.
                }
            };
            fetchPreferences();
        }
    }, [user]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (user) {
            supabase.from('profiles').update({ accent_color: newTheme }).eq('id', user.id).then();
        }
    };

    const setMode = (newMode: Mode) => {
        setModeState(newMode);
        // If we want to persist mode to DB, add update here
    };

    return (
        <ThemeContext.Provider value={{ theme, mode, setTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
