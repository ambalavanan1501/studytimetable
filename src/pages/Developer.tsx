import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, GraduationCap, Github, Instagram, Globe } from 'lucide-react';
import { SEO } from '../components/SEO';


export function Developer() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24 font-sans">
            <SEO
                title="Developer"
                description="Information about the developer of this application."
            />
            {/* Header */}
            <div className="flex items-center gap-4 mb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-700" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access</h1>
                    <p className="text-slate-400 font-medium text-sm">Developer Contact Info</p>
                </div>
            </div>

            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">

                    <div className="relative mx-auto w-32 h-32 mb-6">
                        <div className="absolute inset-0 bg-slate-100 rounded-full animate-pulse"></div>
                        <img
                            src="/developer.png"
                            alt="Ambalavanan M"
                            className="relative z-10 w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                        />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Ambalavanan M</h2>
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-8">Full Stack Developer</p>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 text-left group hover:border-slate-300 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-700 shadow-sm">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Education</span>
                                <span className="font-bold text-slate-900">BSc Computer Science</span>
                            </div>
                        </div>

                        <a href="tel:+919894797490" className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 text-left group hover:border-slate-300 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-700 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <Phone className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</span>
                                <span className="font-bold text-slate-900">+91 9894797490</span>
                            </div>
                        </a>

                        <a href="mailto:ambalavanan275@gmail.com" className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 text-left group hover:border-slate-300 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-700 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <Mail className="h-6 w-6" />
                            </div>
                            <div className="overflow-hidden">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                                <span className="font-bold text-slate-900 truncate block">ambalavanan275@gmail.com</span>
                            </div>
                        </a>
                    </div>

                    <div className="flex gap-3 mt-8 justify-center">
                        <a href="https://github.com/ambalavanan01" target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-900 text-white rounded-2xl hover:scale-105 transition-transform">
                            <Github className="h-6 w-6" />
                        </a>
                        <a href="https://instagram.com/iam_ambalavanan" target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-900 text-white rounded-2xl hover:scale-105 transition-transform">
                            <Instagram className="h-6 w-6" />
                        </a>
                        <a href="https://ambalavanan-m.netlify.app/" target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-900 text-white rounded-2xl hover:scale-105 transition-transform">
                            <Globe className="h-6 w-6" />
                        </a>
                    </div>
                </div>

                <div className="text-center mt-12 pb-8">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Built by Amba</p>
                </div>
            </div>
        </div>
    );
}


