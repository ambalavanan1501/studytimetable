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
    // Initialize from localStorage or default to 'light'
    const [theme, setThemeState] = useState<Theme>(
        (localStorage.getItem('app-theme') as Theme) || 'purple'
    );

    // STRICT MODE: Always force light mode
    const mode: Mode = 'light';

    // Apply to DOM immediately
    useEffect(() => {
        const root = window.document.documentElement;

        // Force cleanup of dark mode
        root.classList.remove('dark');
        root.classList.add('light');

        // Set data-theme attribute
        root.setAttribute('data-theme', theme);

        // Contextual Theming Logic
        const updateAurora = () => {
            const hour = new Date().getHours();
            let colors = {
                a1: '238 100% 96%', // Default
                a2: '220 100% 96%',
                a3: '280 100% 96%',
                a4: '180 100% 96%'
            };

            if (hour >= 5 && hour < 11) {
                // Morning Mist (Soft Gold/Pink/Blue)
                colors = {
                    a1: '35 100% 92%',  // Soft Orange
                    a2: '200 100% 94%', // Sky Blue
                    a3: '340 100% 94%', // Pink
                    a4: '60 100% 90%'   // Light Yellow
                };
            } else if (hour >= 11 && hour < 17) {
                // Day (Bright, classic aurora)
                colors = {
                    a1: '238 100% 96%',
                    a2: '220 100% 96%',
                    a3: '280 100% 96%',
                    a4: '180 100% 96%'
                };
            } else {
                // Night Aura (Deep Indigo/Purple - but still light mode translucent)
                colors = {
                    a1: '260 80% 92%',  // Deep Purple
                    a2: '230 80% 94%',  // Deep Blue
                    a3: '290 80% 92%',  // Magenta
                    a4: '200 80% 90%'   // Cyan
                };
            }

            root.style.setProperty('--aurora-1', colors.a1);
            root.style.setProperty('--aurora-2', colors.a2);
            root.style.setProperty('--aurora-3', colors.a3);
            root.style.setProperty('--aurora-4', colors.a4);
        };

        updateAurora();
        // Check every minute
        const timer = setInterval(updateAurora, 60000);

        // Persist to localStorage
        localStorage.setItem('app-theme', theme);
        localStorage.setItem('app-mode', 'light');

        return () => clearInterval(timer);
    }, [theme]);

    // Sync with Supabase when user logs in
    useEffect(() => {
        if (user) {
            const fetchPreferences = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('accent_color')
                    .eq('id', user.id)
                    .single();

                if (data && data.accent_color) {
                    setThemeState(data.accent_color as Theme);
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

    const setMode = (_: Mode) => {
        // No-op: Mode changes are disabled
        console.warn("Dark mode is disabled in this premium theme.");
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
