import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Visual Style (Shapes, Borders, Shadows)
export type ThemeStyle = 'spatial' | 'neo' | 'swiss';
// Color Mode (Light vs Dark)
export type ThemeMode = 'light' | 'dark';
// Accent Color (unchanged)
export type ThemeColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink';

interface ThemeContextType {
    themeStyle: ThemeStyle;
    mode: ThemeMode;
    accent: ThemeColor;
    setThemeStyle: (style: ThemeStyle) => void;
    setMode: (mode: ThemeMode) => void;
    setAccent: (accent: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    // 1. Visual Style State
    const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(
        (localStorage.getItem('app-theme-style') as ThemeStyle) || 'spatial'
    );

    // 2. Color Mode State
    const [mode, setModeState] = useState<ThemeMode>(
        (localStorage.getItem('app-mode') as ThemeMode) || 'light'
    );

    // 3. Accent Color State
    const [accent, setAccentState] = useState<ThemeColor>(
        (localStorage.getItem('app-accent') as ThemeColor) || 'purple'
    );

    // Apply Logic
    useEffect(() => {
        const root = window.document.documentElement;

        // Apply Style
        root.setAttribute('data-theme-style', themeStyle);
        localStorage.setItem('app-theme-style', themeStyle);

        // Apply Mode
        root.classList.remove('light', 'dark');
        root.classList.add(mode);
        localStorage.setItem('app-mode', mode);

        // Apply Accent
        root.setAttribute('data-theme-accent', accent);
        localStorage.setItem('app-accent', accent);

        // Dynamic Aurora (Only active in 'spatial' style usually, but we keep the logic generic)

        // updateAurora(); // We will rely more on CSS variables now in index.css

    }, [themeStyle, mode, accent]);


    // Sync with Supabase (Optional: Persist preferences)
    useEffect(() => {
        if (user) {
            const fetchPreferences = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('accent_color') // We could add theme_style column later
                    .eq('id', user.id)
                    .single();

                if (data && data.accent_color) {
                    setAccentState(data.accent_color as ThemeColor);
                }
            };
            fetchPreferences();
        }
    }, [user]);

    const setThemeStyle = (style: ThemeStyle) => setThemeStyleState(style);
    const setMode = (m: ThemeMode) => setModeState(m);
    const setAccent = (c: ThemeColor) => {
        setAccentState(c);
        if (user) {
            supabase.from('profiles').update({ accent_color: c }).eq('id', user.id).then();
        }
    };

    return (
        <ThemeContext.Provider value={{ themeStyle, mode, accent, setThemeStyle, setMode, setAccent }}>
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
