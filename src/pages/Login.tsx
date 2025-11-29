import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2 } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Check your email for the login link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#021B20] to-[#052E35] font-sans">
            <div className="w-full max-w-sm px-8">
                <h1 className="text-3xl font-bold text-white text-center mb-12 tracking-wider">
                    USER LOGIN
                </h1>

                <form onSubmit={handleAuth} className="space-y-6">
                    {/* Username / Email Input */}
                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-white rounded-l-full flex items-center justify-center z-10">
                            <User className="h-6 w-6 text-black" />
                        </div>
                        <input
                            type="email"
                            placeholder="Username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/10 text-white placeholder:text-white/50 h-12 rounded-full pl-16 pr-6 outline-none focus:bg-white/20 transition-all border-none"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/10 text-white placeholder:text-white/50 h-12 rounded-full pl-6 pr-16 outline-none focus:bg-white/20 transition-all border-none"
                            required
                        />
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-white rounded-r-full flex items-center justify-center z-10">
                            <Lock className="h-5 w-5 text-black" />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-400 text-center bg-red-900/20 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold h-12 rounded-full hover:bg-gray-100 transition-colors mt-8 uppercase tracking-wide flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'LOGIN')}
                    </button>

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-white/60 text-sm hover:text-white transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
