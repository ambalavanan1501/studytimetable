import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Loader2, Palette, Trash2, Download, FileText, Calendar, Shield, Bell, Lock, EyeOff, Eye } from 'lucide-react';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { AppSettingsModal } from '../components/profile/AppSettingsModal';
import { ManageCoursesModal } from '../components/profile/ManageCoursesModal';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { useTheme } from '../context/ThemeContext';
import { exportDataAsJSON, generatePDFReport } from '../lib/export';
import { useToast } from '../context/ToastContext';
import { useGamification } from '../context/GamificationContext';
import { useSettings } from '../context/SettingsContext';

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



export function Profile() {
    const { user } = useAuth();
    const { themeStyle, setThemeStyle, mode, setMode, setAccent } = useTheme();
    const { addToast } = useToast();
    const { level, xp } = useGamification();
    const {
        privacyMode, setPrivacyMode,
        appLockEnabled, setAppLockEnabled, setAppPin,
        notificationsEnabled, setNotificationsEnabled
    } = useSettings();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isManageCoursesModalOpen, setIsManageCoursesModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Removed Quote Logic as per user request

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

            if (profileData.accent_color) setAccent(profileData.accent_color as any);
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
        // @ts-ignore
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleAppLockToggle = () => {
        if (!appLockEnabled) {
            // Enabling
            const pin = prompt("Set your 4-digit PIN:");
            if (pin && pin.length === 4 && /^\d+$/.test(pin)) {
                setAppPin(pin);
                setAppLockEnabled(true);
                addToast('App Lock enabled!', 'success');
            } else if (pin) {
                addToast('Invalid PIN. Must be 4 digits.', 'error');
            }
        } else {
            // Disabling
            const pin = prompt("Enter PIN to disable:");
            const storedPin = localStorage.getItem('app-pin');
            if (pin === storedPin) {
                setAppLockEnabled(false);
                setAppPin(null);
                addToast('App Lock disabled.', 'success');
            } else {
                addToast('Incorrect PIN.', 'error');
            }
        }
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

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">

                {/* 1. Hero Card - Full Width on Mobile, 2 Cols on Desktop */}
                <div className="md:col-span-2 glass-vision rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <div className="w-32 h-32 rounded-full ring-8 ring-white/30 shadow-2xl overflow-hidden relative cursor-pointer">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-400">
                                        {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider">{uploading ? '...' : 'Change'}</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                                </label>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 glass-panel px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-lg whitespace-nowrap flex gap-2">
                                <span>Lvl {level}</span>
                                <span className="text-indigo-500">{xp} XP</span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="text-center md:text-left space-y-2">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-none">{profile?.full_name || 'Student'}</h2>
                                <p className="text-slate-500 font-medium">{user?.email}</p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                                <button onClick={() => setIsEditModalOpen(true)} className="glass-button px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 text-slate-600 hover:text-slate-900">
                                    <Settings className="h-3 w-3" />
                                    Edit Profile
                                </button>
                                <button onClick={handleSignOut} className="glass-button px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 text-red-500 hover:bg-red-50">
                                    <LogOut className="h-3 w-3" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Appearance Studio (Moved up to replace Goal) */}
                <div className="md:col-span-1 glass-vision rounded-[2.5rem] p-6 flex flex-col gap-6 justify-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center"><Palette className="h-4 w-4" /></div>
                        <h3 className="font-bold text-slate-900">Appearance</h3>
                    </div>

                    {/* Style Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Style</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['spatial', 'neo', 'swiss'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setThemeStyle(s as any)}
                                    className={cn(
                                        "px-2 py-2 rounded-xl text-xs font-bold transition-all border-2",
                                        themeStyle === s
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100">
                        <span className="text-sm font-bold text-slate-600">Dark Mode</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={mode === 'dark'}
                                onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')}
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                    </div>
                </div>

                {/* 3. Control Center - Expanded to Full Width Row */}
                <div className="md:col-span-3 glass-vision rounded-[2.5rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Shield className="h-5 w-5" /></div>
                        <h3 className="text-lg font-bold text-slate-900">Control Center</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Privacy Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/50">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", privacyMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500")}>
                                    {privacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </div>
                                <div>
                                    <span className="block font-bold text-slate-700">Privacy Mode</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Blur Stats</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={privacyMode} onChange={(e) => setPrivacyMode(e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                            </label>
                        </div>

                        {/* App Lock Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/50">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", appLockEnabled ? "bg-red-500 text-white" : "bg-red-50 text-red-400")}>
                                    <Lock className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="block font-bold text-slate-700">App Lock</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PIN Security</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={appLockEnabled} onChange={handleAppLockToggle} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>

                        {/* Notifications Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", notificationsEnabled ? "bg-amber-500 text-white" : "bg-white text-amber-500")}>
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="block font-bold text-slate-700">Class Alerts</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Browser Nots</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-xs font-bold text-slate-500">Enable</span>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>



                {/* 6. Quick Actions Dock */}
                <div className="md:col-span-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-4 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Calendar, label: "Timetable", sub: "Manage", action: () => setIsManageCoursesModalOpen(true), color: "bg-indigo-500" },
                            { icon: FileText, label: "Report", sub: "Export PDF", action: handleExportPDF, color: "bg-blue-500" },
                            { icon: Download, label: "Backup", sub: "Save JSON", action: handleExportJSON, color: "bg-sky-500" },
                            { icon: Trash2, label: "Reset", sub: "Clear Data", action: handleResetData, color: "bg-red-500" }
                        ].map((item, i) => (
                            <button key={i} onClick={item.action} className="glass-vision p-4 rounded-[2rem] flex items-center gap-4 hover:bg-white/60 transition-all hover:-translate-y-1 group">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", item.color)}>
                                    {item.label === 'Report' && exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <item.icon className="h-5 w-5" />}
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-900">{item.label}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.sub}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <div className="text-center py-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">NikiOS v11.0 • Designed by Antigravity</p>
            </div>

            <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} currentProfile={profile} onSuccess={fetchProfile} />
            <AppSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
            <ManageCoursesModal isOpen={isManageCoursesModalOpen} onClose={() => setIsManageCoursesModalOpen(false)} />
        </div>
    );
}
