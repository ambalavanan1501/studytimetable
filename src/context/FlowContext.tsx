import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useGamification } from './GamificationContext';

type AudioType = 'none' | 'rain' | 'cafe' | 'lofi';

interface FlowContextType {
    isFocusing: boolean;
    timeLeft: number; // in seconds
    initialTime: number; // in minutes
    isActive: boolean;
    audioType: AudioType;
    activeTask: string | null;
    startFocus: (minutes: number, task?: string) => void;
    pauseFocus: () => void;
    resumeFocus: () => void;
    stopFocus: () => void;
    setAudio: (type: AudioType) => void;
    formatTime: (seconds: number) => string;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export function FlowProvider({ children }: { children: React.ReactNode }) {
    const { addXP } = useGamification();

    // State
    const [isFocusing, setIsFocusing] = useState(false);
    const [isActive, setIsActive] = useState(false); // Timer running?
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [initialTime, setInitialTime] = useState(25);
    const [audioType, setAudioType] = useState<AudioType>('none');
    const [activeTask, setActiveTask] = useState<string | null>(null);

    // Audio Refs (We'll use HTMLAudioElement for simplicity)
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Timer Finished
            handleComplete();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Audio Logic
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }

        const audio = audioRef.current;

        if (isFocusing && isActive && audioType !== 'none') {
            let src = '';
            // Using reliable CDN for standard white noise/rain sounds
            switch (audioType) {
                // Rain sound (Google Actions Library)
                case 'rain': src = 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg'; break;
                // Cafe/Ambience (Google Actions Library)
                case 'cafe': src = 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg'; break;
                // Lofi (simulated with a chill beat - keeping pixabay for now as fallback, or use empty if broken)
                case 'lofi': src = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'; break;
            }

            if (audio.src !== src && src) {
                audio.src = src;
                audio.play().catch(e => console.log("Audio play failed (interaction needed)", e));
            } else if (src && audio.paused) {
                audio.play().catch(() => { });
            }
        } else {
            audio.pause();
        }

        return () => {
            // cleanup handled by ref
        };
    }, [isFocusing, isActive, audioType]);

    const handleComplete = () => {
        setIsActive(false);
        setIsFocusing(false);
        // Award XP: 10 XP per minute focused
        const xpEarned = initialTime * 10;
        addXP(xpEarned, `Deep Work: ${initialTime}m - ${activeTask || 'Focus Session'}`);

        // Reset
        if (audioRef.current) audioRef.current.pause();
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { }); // Success chime
    };

    const startFocus = (minutes: number, task?: string) => {
        setInitialTime(minutes);
        setTimeLeft(minutes * 60);
        setActiveTask(task || null); // This acts as the session goal
        setIsFocusing(true);
        setIsActive(true);
    };

    const pauseFocus = () => setIsActive(false);
    const resumeFocus = () => setIsActive(true);

    const stopFocus = () => {
        setIsActive(false);
        setIsFocusing(false);
        setTimeLeft(25 * 60);
        setActiveTask(null);
        if (audioRef.current) audioRef.current.pause();
    };

    const setAudio = (type: AudioType) => setAudioType(type);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <FlowContext.Provider value={{
            isFocusing,
            timeLeft,
            initialTime,
            isActive,
            audioType,
            activeTask,
            startFocus,
            pauseFocus,
            resumeFocus,
            stopFocus,
            setAudio,
            formatTime
        }}>
            {children}
        </FlowContext.Provider>
    );
}

export function useFlow() {
    const context = useContext(FlowContext);
    if (context === undefined) {
        throw new Error('useFlow must be used within a FlowProvider');
    }
    return context;
}
