// @ts-ignore
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../../context/GamificationContext';
import { cn } from '../../lib/utils';
import { Heart, Thermometer } from 'lucide-react';

export function PetWidget() {
    const { petState, health, xp, level } = useGamification();

    // Mapping states to colors/themes
    const theme = {
        happy: { bg: 'bg-amber-400', shadow: 'shadow-amber-500/50', ring: 'ring-amber-200' },
        sick: { bg: 'bg-emerald-200', shadow: 'shadow-emerald-500/50', ring: 'ring-emerald-100' }, // Sick face is usually pale/greenish
        sleeping: { bg: 'bg-indigo-900', shadow: 'shadow-indigo-900/50', ring: 'ring-indigo-800' },
        focusing: { bg: 'bg-violet-500', shadow: 'shadow-violet-500/50', ring: 'ring-violet-300' },
        cool: { bg: 'bg-pink-400', shadow: 'shadow-pink-500/50', ring: 'ring-pink-200' },
    }[petState];

    return (
        <div className="relative w-full h-full min-h-[220px] rounded-[2.5rem] bg-white p-6 shadow-xl overflow-hidden flex flex-col items-center justify-between transition-colors duration-500">

            {/* Background Atmosphere (Optional Clouds/Stars) */}
            {petState === 'sleeping' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ top: `${Math.random() * 80}%`, left: `${Math.random() * 100}%`, opacity: 0 }}
                            animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
                            className="absolute w-1 h-1 bg-white rounded-full"
                        />
                    ))}
                </div>
            )}

            {/* Header Stats */}
            <div className="w-full flex justify-between items-start z-10">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level {level}</span>
                    <div className="h-2 w-24 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(xp % 100)}%` }}
                            className="h-full bg-indigo-500 rounded-full"
                        />
                    </div>
                </div>

                {/* Health Bar (Hearts) */}
                <div className="flex items-center gap-1">
                    <Heart className={cn("h-4 w-4", health > 30 ? "fill-rose-500 text-rose-500" : "text-slate-300")} />
                    <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: `${health}%` }}
                            className={cn("h-full rounded-full transition-colors", health > 50 ? "bg-rose-500" : "bg-red-600")}
                        />
                    </div>
                </div>
            </div>

            {/* THE PET AVATAR */}
            <div className="flex-1 flex items-center justify-center relative w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={petState}
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: (petState === 'happy' || petState === 'focusing') ? [0, -10, 0] : 0
                        }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        transition={{
                            layout: { duration: 0.5 },
                            ...(petState === 'happy' || petState === 'focusing' ? {
                                y: {
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut"
                                }
                            } : {
                                type: 'spring', stiffness: 200, damping: 20
                            })
                        }}
                        className={cn(
                            "w-32 h-32 rounded-full flex items-center justify-center relative transition-colors duration-500",
                            theme.bg, theme.shadow, "shadow-2xl ring-4", theme.ring
                        )}
                    >
                        {/* FACES based on State */}
                        {petState === 'happy' && <HappyFace />}
                        {petState === 'sick' && <SickFace />}
                        {petState === 'sleeping' && <SleepFace />}
                        {petState === 'focusing' && <FocusFace />}
                        {petState === 'cool' && <CoolFace />}

                        {/* Speech Bubble (Typewriter effect driven by state?) */}
                        {/* Simplified for now */}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Text */}
            <div className="z-10 text-center">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    {petState === 'happy' && "Ready to learn!"}
                    {petState === 'sick' && "I don't feel so good..."}
                    {petState === 'sleeping' && "Zzz..."}
                    {petState === 'focusing' && "Locked In."}
                    {petState === 'cool' && "You're on fire!"}
                </h3>
                <p className="text-xs font-medium text-slate-400">
                    {petState === 'sick' ? "Attend classes to heal me!" : "Keep up the streak!"}
                </p>
            </div>
        </div>
    );
}

// --- Face Components (Simple SVGs) ---

const HappyFace = () => (
    <svg viewBox="0 0 100 100" className="w-20 h-20 text-white fill-current">
        {/* Eyes */}
        <circle cx="30" cy="40" r="8" />
        <circle cx="70" cy="40" r="8" />
        {/* Smile */}
        <path d="M 30 60 Q 50 80 70 60" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        {/* Cheeks */}
        <circle cx="20" cy="55" r="5" className="text-red-200 fill-current opacity-50" />
        <circle cx="80" cy="55" r="5" className="text-red-200 fill-current opacity-50" />
    </svg>
);

const SickFace = () => (
    <div className="relative">
        <svg viewBox="0 0 100 100" className="w-20 h-20 text-emerald-800 fill-current">
            {/* Sad Eyes */}
            <path d="M 25 45 Q 30 40 35 45" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="M 65 45 Q 70 40 75 45" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            {/* Squiggly Mouth */}
            <path d="M 35 75 Q 45 65 50 75 T 65 75" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <Thermometer className="absolute -right-6 top-0 w-8 h-8 text-red-500 animate-pulse" />
    </div>
);

const SleepFace = () => (
    <div className="relative">
        <svg viewBox="0 0 100 100" className="w-20 h-20 text-indigo-200 fill-current">
            {/* Closed Eyes */}
            <path d="M 25 50 Q 30 55 35 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="M 65 50 Q 70 55 75 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            {/* Open Mouth (Breathing) */}
            <circle cx="50" cy="70" r="5" />
        </svg>
        <motion.div
            animate={{ opacity: [0, 1, 0], y: -20, x: 20 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-0 right-0 text-xl font-bold text-white opacity-80"
        >
            Zzz
        </motion.div>
    </div>
);

const FocusFace = () => (
    <svg viewBox="0 0 100 100" className="w-20 h-20 text-white fill-current">
        {/* Glasses Frame */}
        <rect x="20" y="35" width="25" height="15" rx="5" fill="none" stroke="currentColor" strokeWidth="4" />
        <rect x="55" y="35" width="25" height="15" rx="5" fill="none" stroke="currentColor" strokeWidth="4" />
        <line x1="45" y1="42" x2="55" y2="42" stroke="currentColor" strokeWidth="4" />
        {/* Eyes (Focused) */}
        <circle cx="32.5" cy="42.5" r="3" />
        <circle cx="67.5" cy="42.5" r="3" />
        {/* Serious Mouth */}
        <line x1="40" y1="70" x2="60" y2="70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        {/* Lightning Bolt on Forehead */}
        <path d="M 50 15 L 45 25 L 50 25 L 48 35 L 55 22 L 50 22 Z" className="text-yellow-300 fill-current" />
    </svg>
);

const CoolFace = () => (
    <svg viewBox="0 0 100 100" className="w-20 h-20 text-white fill-current">
        {/* Sunglasses */}
        <path d="M 15 35 Q 30 35 30 50 L 30 50 Q 30 55 25 55 L 20 55 Q 15 55 15 50 Z" fill="#1e293b" />
        <path d="M 85 35 Q 70 35 70 50 L 70 50 Q 70 55 75 55 L 80 55 Q 85 55 85 50 Z" fill="#1e293b" />
        <line x1="30" y1="40" x2="70" y2="40" stroke="#1e293b" strokeWidth="5" />
        {/* Smirk */}
        <path d="M 35 70 Q 50 75 65 65" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
);
