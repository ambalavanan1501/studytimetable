import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export function LockScreen() {
    const { isLocked, unlockApp } = useSettings();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    if (!isLocked) return null;

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                // Auto submit
                setTimeout(() => attemptUnlock(newPin), 100);
            }
        }
    };

    const handleClear = () => {
        setPin('');
        setError(false);
    };

    const attemptUnlock = (inputPin: string) => {
        if (unlockApp(inputPin)) {
            setPin('');
        } else {
            setError(true);
            setShake(true);
            setTimeout(() => {
                setPin('');
                setShake(false);
            }, 500);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-fade-in">
            <div className="mb-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center animate-bounce-slow">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">App Locked</h2>
                <p className="text-slate-400">Enter your PIN to continue</p>
            </div>

            {/* PIN Dots */}
            <div className={`flex gap-4 mb-12 ${shake ? 'animate-shake' : ''}`}>
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length
                            ? error ? 'bg-red-500 scale-125' : 'bg-white scale-110'
                            : 'bg-white/20'
                            }`}
                    />
                ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-6 max-w-xs w-full px-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num.toString())}
                        className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 flex items-center justify-center text-2xl font-bold transition-all active:scale-95"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    onClick={() => handleNumberClick("0")}
                    className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 flex items-center justify-center text-2xl font-bold transition-all active:scale-95"
                >
                    0
                </button>
                <button
                    onClick={handleClear}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                    CLR
                </button>
            </div>

            {error && <p className="mt-8 text-red-500 font-bold animate-pulse">Incorrect PIN</p>}
        </div>
    );
}
