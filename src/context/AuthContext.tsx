import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
// @ts-ignore
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => { } });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and subscribe to auth changes
        // @ts-ignore
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        }).catch((err: any) => {
            console.error('Auth initialization error:', err);
        }).finally(() => {
            setLoading(false);
        });

        // @ts-ignore
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        const now = new Date();
        const midnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // Tomorrow
            0, 0, 0 // 00:00:00
        );

        const timeUntilMidnight = midnight.getTime() - now.getTime();

        const timer = setTimeout(() => {
            signOut();
        }, timeUntilMidnight);

        return () => clearTimeout(timer);
    }, [user]);

    const signOut = async () => {
        // @ts-ignore
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
