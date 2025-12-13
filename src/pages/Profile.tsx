import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, ChevronRight, Loader2, Palette, GraduationCap, Target, Trash2, Download, FileText, Sparkles, RefreshCw, Trophy, Calendar } from 'lucide-react';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { AppSettingsModal } from '../components/profile/AppSettingsModal';
import { ManageCoursesModal } from '../components/profile/ManageCoursesModal';
import { cn } from '../lib/utils';
import { fetchAIQuote, AIQuoteResponse } from '../lib/ai';
import { SEO } from '../components/SEO';
import { useTheme } from '../context/ThemeContext';
import { exportDataAsJSON, generatePDFReport } from '../lib/export';
import { useToast } from '../context/ToastContext';
import { useGamification } from '../context/GamificationContext';

interface ProfileData {
    full_name: string | null;
    university: string | null;
    branch: string | null;
    semester: string | null;

    theme_preference: string;
    attendance_goal: number;
    accent_color: string;
    cgpa: number;
    credits: number;
    avatar_url: string | null;
}

const THEMES = [
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-emerald-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
];

export function Profile() {
    const { user } = useAuth();
    const { setTheme } = useTheme();
    const { addToast } = useToast();
    const { level, xp } = useGamification();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isManageCoursesModalOpen, setIsManageCoursesModalOpen] = useState(false);
    const [quote, setQuote] = useState<AIQuoteResponse | null>(null);
    const [isQuoteLoading, setIsQuoteLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const loadQuote = async () => {
        try {
            setIsQuoteLoading(true);
            const data = await fetchAIQuote();
            setQuote(data);
        } catch (error) {
            console.error("Failed to load quote", error);
        } finally {
            setIsQuoteLoading(false);
        }
    };

    useEffect(() => {
        loadQuote();
    }, []);

    const fetchProfile = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            // If no profile exists, use defaults
            const profileData = data || {
                full_name: '',
                university: '',
                branch: '',
                semester: '',

                theme_preference: 'light',
                attendance_goal: 75,
                accent_color: 'purple',
                cgpa: 0,
                credits: 0,
                avatar_url: null
            };
            setProfile(profileData);

            if (profileData.accent_color) setTheme(profileData.accent_color as any);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleThemeChange = async (color: string) => {
        if (!user || !profile) return;
        setTheme(color as any);
        setProfile({ ...profile, accent_color: color });

        await supabase
            .from('profiles')
            .update({ accent_color: color })
            .eq('id', user.id);
    };

    const handleAttendanceGoalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !profile) return;
        const goal = parseInt(e.target.value);
        setProfile({ ...profile, attendance_goal: goal });

        await supabase
            .from('profiles')
            .update({ attendance_goal: goal })
            .eq('id', user.id);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            if (user && profile) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: publicUrl })
                    .eq('id', user.id);

                if (updateError) {
                    throw updateError;
                }

                setProfile({ ...profile, avatar_url: publicUrl });
                addToast('Profile picture updated!', 'success');
            }
        } catch (error) {
            addToast('Error uploading avatar!', 'error');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleExportJSON = async () => {
        if (!user) return;
        try {
            setExporting(true);
            await exportDataAsJSON(user.id);
            addToast('Backup downloaded successfully.', 'success');
        } catch (e) {
            addToast('Failed to backup data.', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (!user) return;
        try {
            setExporting(true);
            await generatePDFReport(user.id);
            addToast('PDF report generated.', 'success');
        } catch (e) {
            addToast('Failed to generate PDF report.', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleResetData = async () => {
        if (!user || !confirm('Are you sure you want to delete all timetable and attendance data? This action cannot be undone.')) return;

        try {
            setLoading(true);
            await supabase.from('timetable_entries').delete().eq('user_id', user.id);
            await supabase.from('smart_timetable_entries').delete().eq('user_id', user.id);
            await supabase.from('attendance_logs').delete().eq('user_id', user.id);
            addToast('All data has been reset successfully.', 'success');
        } catch (error) {
            console.error('Error resetting data:', error);
            addToast('Failed to reset data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="pb-32 space-y-10 animate-fade-in-up md:px-4">
            <SEO
                title="Profile"
                description="Manage your profile settings and goals."
            />
            <div className="flex flex-col gap-2 mt-4 ml-2">
                <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tighter leading-none">Profile</h1>
                <p className="text-lg text-slate-500 font-medium font-display tracking-wide">Identity & Preferences.</p>
            </div>

            {/* NikiOS Profile Hero */}
            <div className="glass-vision rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden group shadow-2xl">
                {/* Top Controls */}
                <div className="absolute top-8 right-8 z-20">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="glass-button p-3 rounded-full text-slate-500 hover:text-slate-900 shadow-lg"
                    >
                        <Settings className="h-6 w-6" />
                    </button>
                </div>

                <div className="relative z-10 mb-6 group-hover:scale-105 transition-transform duration-700">
                    <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-8 ring-white/30 overflow-hidden relative animate-breathe cursor-pointer">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                {profile?.full_name ? profile.full_name[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                            </div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                            <span className="text-white text-xs font-bold uppercase tracking-wider">
                                {uploading ? '...' : 'Change'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    </div>
                    {(profile?.university || profile?.branch) && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-1.5 rounded-full shadow-lg border border-white/60 flex items-center gap-2 whitespace-nowrap">
                            <GraduationCap className="h-4 w-4 text-indigo-500" />
                            <span className="text-sm font-bold text-slate-800">{profile.branch || 'Student'}</span>
                        </div>
                    )}
                </div>

                <div className="relative z-10 mt-6 space-y-1">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {profile?.full_name || 'Student'}
                    </h2>
                    <p className="text-lg text-slate-500 font-medium">{user?.email}</p>
                </div>

                {/* Level Pills */}
                <div className="flex items-center justify-center gap-4 mt-8">
                    <div className="glass-panel px-5 py-2 rounded-2xl flex items-center gap-2 text-indigo-700 bg-indigo-50/50 border-indigo-100/50">
                        <Trophy className="h-5 w-5 text-indigo-500" />
                        <span className="font-bold">Lvl {level}</span>
                        <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
                        <span className="font-bold">{xp} XP</span>
                    </div>
                    {profile?.cgpa && profile.cgpa > 0 && (
                        <div className="glass-panel px-5 py-2 rounded-2xl text-emerald-700 font-bold bg-emerald-50/50 border-emerald-100/50">
                            CGPA {profile.cgpa}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Quote - Minimal */}
            <div className="glass-vision p-6 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <Sparkles className="h-40 w-40 text-slate-900 rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Daily Inspiration
                        </h3>
                        <button onClick={loadQuote} className="glass-button p-2 rounded-full"><RefreshCw className={cn("h-4 w-4", isQuoteLoading && "animate-spin")} /></button>
                    </div>
                    {isQuoteLoading && !quote ? (
                        <div className="animate-pulse space-y-2">
                            <div className="h-6 bg-slate-200 rounded-full w-2/3"></div>
                            <div className="h-4 bg-slate-200 rounded-full w-1/3"></div>
                        </div>
                    ) : (
                        <div className="md:pr-20">
                            <p className="text-3xl md:text-4xl font-serif italic text-slate-800 leading-tight">
                                "{quote?.quote || "Believe you can and you're halfway there."}"
                            </p>
                            <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest text-sm">— {quote?.author || "Theodore Roosevelt"}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appearance */}
                <div className="glass-vision p-6 rounded-[2rem]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><Palette className="h-6 w-6" /></div>
                        <div>
                            <span className="block text-xl font-bold text-slate-900">Theme</span>
                            <span className="text-slate-500 text-sm">Personalize accent</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {THEMES.map((theme) => (
                            <button
                                key={theme.value}
                                onClick={() => handleThemeChange(theme.value)}
                                className={cn(
                                    "w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm hover:scale-110",
                                    theme.class,
                                    profile?.accent_color === theme.value ? "ring-[6px] ring-white shadow-xl scale-110" : "opacity-60"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Goals */}
                <div className="glass-vision p-6 rounded-[2rem]">
                    <div className="flex items-center gap-4 mb-6 justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm"><Target className="h-6 w-6" /></div>
                            <div>
                                <span className="block text-xl font-bold text-slate-900">Goal</span>
                                <span className="text-slate-500 text-sm">Attendance Target</span>
                            </div>
                        </div>
                        <span className="text-3xl font-black text-emerald-500">{profile?.attendance_goal}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={profile?.attendance_goal || 75}
                        onChange={handleAttendanceGoalChange}
                        className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                    />
                </div>
            </div>

            {/* Actions List */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-4">Quick Actions</h3>
                <div className="glass-vision p-2 rounded-[2.5rem] grid gap-2">
                    {[
                        { icon: Calendar, label: "Manage Timetable", sub: "Add or edit classes", action: () => setIsManageCoursesModalOpen(true), color: "purple" },
                        { icon: FileText, label: "Export Report", sub: "Download PDF summary", action: handleExportPDF, color: "blue" },
                        { icon: Download, label: "Backup Data", sub: "Save as JSON", action: handleExportJSON, color: "sky" },
                        { icon: Trash2, label: "Reset All Data", sub: "Clear database", action: handleResetData, color: "red" }
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={item.action}
                            className="w-full p-6 flex items-center justify-between hover:bg-white/50 rounded-[2rem] transition-all group"
                        >
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                                    `bg-${item.color}-500`
                                )}>
                                    {item.label === 'Export Report' && exporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <item.icon className="h-6 w-6" />}
                                </div>
                                <div className="text-left">
                                    <span className="block text-lg font-bold text-slate-800">{item.label}</span>
                                    <span className="text-slate-500 font-medium">{item.sub}</span>
                                </div>
                            </div>
                            <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-slate-900 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center py-8">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">TT Tracker v10.5 NikiOS</p>
            </div>

            <button
                onClick={handleSignOut}
                className="w-full glass-button p-5 rounded-[2rem] flex items-center justify-center gap-3 text-red-500 font-bold hover:bg-red-50/50"
            >
                <LogOut className="h-5 w-5" />
                Sign Out
            </button>

            <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} currentProfile={profile} onSuccess={fetchProfile} />
            <AppSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
            <ManageCoursesModal isOpen={isManageCoursesModalOpen} onClose={() => setIsManageCoursesModalOpen(false)} />
        </div>
    );
}
