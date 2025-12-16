import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
    privacyMode: boolean;
    setPrivacyMode: (enabled: boolean) => void;

    appLockEnabled: boolean;
    setAppLockEnabled: (enabled: boolean) => void;
    appPin: string | null;
    setAppPin: (pin: string | null) => void;
    isLocked: boolean;
    unlockApp: (pin: string) => boolean;

    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
    classReminders: boolean;
    setClassReminders: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // 1. Privacy Mode
    const [privacyMode, setPrivacyModeState] = useState(() => {
        return localStorage.getItem('privacy-mode') === 'true';
    });

    const setPrivacyMode = (enabled: boolean) => {
        setPrivacyModeState(enabled);
        localStorage.setItem('privacy-mode', String(enabled));
    };

    // 2. App Lock
    const [appLockEnabled, setAppLockEnabledState] = useState(() => {
        return localStorage.getItem('app-lock-enabled') === 'true';
    });
    const [appPin, setAppPinState] = useState<string | null>(() => {
        return localStorage.getItem('app-pin');
    });
    const [isLocked, setIsLocked] = useState(() => {
        // If lock is enabled, start locked
        return localStorage.getItem('app-lock-enabled') === 'true';
    });

    const setAppLockEnabled = (enabled: boolean) => {
        setAppLockEnabledState(enabled);
        localStorage.setItem('app-lock-enabled', String(enabled));
        if (enabled) setIsLocked(true); // Lock immediately when enabling
    };

    const setAppPin = (pin: string | null) => {
        setAppPinState(pin);
        if (pin) localStorage.setItem('app-pin', pin);
        else localStorage.removeItem('app-pin');
    };

    const unlockApp = (pin: string): boolean => {
        if (!appPin || pin === appPin) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    // 3. Notifications
    const [notificationsEnabled, setNotificationsEnabledState] = useState(() => {
        return localStorage.getItem('notifications-enabled') === 'true';
    });
    const [classReminders, setClassRemindersState] = useState(() => {
        return localStorage.getItem('class-reminders') === 'true';
    });

    const setNotificationsEnabled = (enabled: boolean) => {
        setNotificationsEnabledState(enabled);
        localStorage.setItem('notifications-enabled', String(enabled));
        if (enabled && 'Notification' in window) {
            Notification.requestPermission();
        }
    };

    const setClassReminders = (enabled: boolean) => {
        setClassRemindersState(enabled);
        localStorage.setItem('class-reminders', String(enabled));
    };

    return (
        <SettingsContext.Provider value={{
            privacyMode, setPrivacyMode,
            appLockEnabled, setAppLockEnabled,
            appPin, setAppPin,
            isLocked, unlockApp,
            notificationsEnabled, setNotificationsEnabled,
            classReminders, setClassReminders
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
