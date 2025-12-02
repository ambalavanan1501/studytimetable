import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, GraduationCap, Github, Instagram, Globe } from 'lucide-react';

export function Developer() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-slate-600" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Developer</h1>
            </div>

            <div className="max-w-md mx-auto space-y-6">
                {/* Profile Card */}
                <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-500 to-purple-600 opacity-10"></div>

                    <div className="relative z-10 w-32 h-32 rounded-full p-1 bg-white shadow-xl mb-4">
                        <img
                            src="/developer.png"
                            alt="Ambalavanan M"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Ambalavanan M</h2>
                    <p className="text-primary-600 font-medium mb-6">Developer</p>

                    <div className="w-full space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-slate-400 font-medium uppercase">Degree</p>
                                <p className="text-slate-700 font-semibold">BSc Computer Science</p>
                            </div>
                        </div>

                        <a href="tel:+919894797490" className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white transition-colors">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Phone className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-slate-400 font-medium uppercase">Phone</p>
                                <p className="text-slate-700 font-semibold">+91 9894797490</p>
                            </div>
                        </a>

                        <a href="mailto:ambalavanan275@gmail.com" className="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white transition-colors">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div className="text-left overflow-hidden">
                                <p className="text-xs text-slate-400 font-medium uppercase">Email</p>
                                <p className="text-slate-700 font-semibold truncate">ambalavanan275@gmail.com</p>
                            </div>
                        </a>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <a href="https://github.com/ambalavanan01" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors">
                            <Github className="h-5 w-5" />
                        </a>
                        <a href="https://instagram.com/iam_ambalavanan" target="_blank" rel="noopener noreferrer" className="p-3 bg-pink-600 text-white rounded-full hover:bg-pink-500 transition-colors">
                            <Instagram className="h-5 w-5" />
                        </a>
                        <a href="https://ambalavanan-m.netlify.app/" target="_blank" rel="noopener noreferrer" className="p-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-400 transition-colors">
                            <Globe className="h-5 w-5" />
                        </a>
                    </div>
                </div>

                <div className="text-center text-slate-400 text-sm">
                    <p>Designed & Built By Ambalavanan</p>
                </div>
            </div>
        </div>
    );
}
