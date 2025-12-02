import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Settings, ChevronRight, Loader2, Palette, GraduationCap, Target, Trash2, Info } from 'lucide-react';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { AppSettingsModal } from '../components/profile/AppSettingsModal';
import { cn } from '../lib/utils';
import { fetchAIQuote, AIQuoteResponse } from '../lib/ai';
import { Sparkles, RefreshCw } from 'lucide-react';

interface ProfileData {
    full_name: string | null;
    university: string | null;
    branch: string | null;
    semester: string | null;
    notifications_enabled: boolean;
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
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [quote, setQuote] = useState<AIQuoteResponse | null>(null);
    const [isQuoteLoading, setIsQuoteLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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
                notifications_enabled: true,
                theme_preference: 'light',
                attendance_goal: 75,
                accent_color: 'purple',
                cgpa: 0,
                credits: 0,
                avatar_url: null
            };
            setProfile(profileData);

            // Apply theme
            document.documentElement.setAttribute('data-theme', profileData.accent_color || 'purple');
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

    const toggleNotification = async () => {
        if (!user || !profile) return;

        const newValue = !profile.notifications_enabled;
        setProfile({ ...profile, notifications_enabled: newValue });

        await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                notifications_enabled: newValue,
                updated_at: new Date().toISOString()
            });
    };

    const handleThemeChange = async (color: string) => {
        if (!user || !profile) return;

        setProfile({ ...profile, accent_color: color });
        document.documentElement.setAttribute('data-theme', color);

        await supabase
            .from('profiles')
            .update({ accent_color: color })
            .eq('id', user.id);
    };

    const handleAttendanceGoalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !profile) return;
        const goal = parseInt(e.target.value);
        setProfile({ ...profile, attendance_goal: goal });

        // Debounce update to DB could be better, but direct update for now
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
            }
        } catch (error) {
            alert('Error uploading avatar!');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleResetData = async () => {
        if (!user || !confirm('Are you sure you want to delete all timetable and attendance data? This action cannot be undone.')) return;

        try {
            setLoading(true);
            await supabase.from('timetable_entries').delete().eq('user_id', user.id);
            await supabase.from('smart_timetable_entries').delete().eq('user_id', user.id);
            await supabase.from('attendance_logs').delete().eq('user_id', user.id);
            alert('All data has been reset successfully.');
        } catch (error) {
            console.error('Error resetting data:', error);
            alert('Failed to reset data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>;
    }

    return (
        <div className="p-6 space-y-8 pb-32">
            <h1 className="text-2xl font-bold text-slate-800 mt-4">Profile</h1>

            {/* User Card */}
            <div className="glass-card rounded-3xl p-6 flex items-center gap-4">
                <div className="relative group">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            profile?.full_name ? profile.full_name[0].toUpperCase() : user?.email?.[0].toUpperCase()
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-xs font-medium">
                            {uploading ? '...' : 'Edit'}
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
                <div className="overflow-hidden flex-1">
                    <h2 className="text-lg font-bold text-slate-800 truncate">
                        {profile?.full_name || 'Student'}
                    </h2>
                    <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                    {(profile?.university || profile?.branch) && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <GraduationCap className="h-3 w-3" />
                            <span className="truncate">
                                {profile.university} {profile.branch && `• ${profile.branch}`} {profile.semester && `• ${profile.semester}`}
                            </span>
                        </div>
                    )}
                    {(profile?.cgpa || profile?.credits) && (
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                            {profile.cgpa > 0 && (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                                    CGPA: {profile.cgpa}
                                </span>
                            )}
                            {profile.credits > 0 && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                                    Credits: {profile.credits}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors"
                >
                    <Settings className="h-5 w-5 text-slate-600" />
                </button>
            </div>

            {/* AI Quote Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between ml-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Daily Inspiration</h3>
                    <button
                        onClick={loadQuote}
                        disabled={isQuoteLoading}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", isQuoteLoading && "animate-spin")} />
                    </button>
                </div>
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="h-24 w-24 text-primary-500" />
                    </div>

                    {isQuoteLoading && !quote ? (
                        <div className="flex flex-col gap-2 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/4 mt-2 ml-auto"></div>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <p className="text-lg font-medium text-slate-700 italic leading-relaxed">
                                "{quote?.quote || "Believe you can and you're halfway there."}"
                            </p>
                            <p className="text-sm text-primary-600 font-semibold mt-3 text-right">
                                — {quote?.author || "Theodore Roosevelt"}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Appearance Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">Appearance</h3>
                <div className="glass-card rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                            <Palette className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-700">Accent Color</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        {THEMES.map((theme) => (
                            <button
                                key={theme.value}
                                onClick={() => handleThemeChange(theme.value)}
                                className={cn(
                                    "w-10 h-10 rounded-full transition-all flex items-center justify-center",
                                    theme.class,
                                    profile?.accent_color === theme.value ? "ring-4 ring-white shadow-lg scale-110" : "opacity-70 hover:opacity-100"
                                )}
                                title={theme.name}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Goals Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">Goals</h3>
                <div className="glass-card rounded-3xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Target className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-slate-700">Attendance Goal</span>
                        </div>
                        <span className="font-bold text-primary-600">{profile?.attendance_goal}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={profile?.attendance_goal || 75}
                        onChange={handleAttendanceGoalChange}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>

            {/* Settings List */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">Preferences</h3>
                <div className="glass-card rounded-3xl overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        <button
                            onClick={toggleNotification}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-700">Notifications</span>
                            </div>
                            <div className={cn(
                                "w-11 h-6 rounded-full transition-colors relative",
                                profile?.notifications_enabled ? "bg-primary-500" : "bg-slate-200"
                            )}>
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                    profile?.notifications_enabled ? "left-6" : "left-1"
                                )} />
                            </div>
                        </button>

                        <button
                            onClick={() => setIsSettingsModalOpen(true)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <Settings className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-700">App Settings</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">Data Management</h3>
                <div className="glass-card rounded-3xl overflow-hidden">
                    <button
                        onClick={handleResetData}
                        className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200 transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-slate-700 group-hover:text-red-700 transition-colors">Reset All Data</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* About Section */}
            <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 text-slate-500 text-xs font-medium">
                    <Info className="h-3 w-3" />
                    <span>Version 2.9.0 • Made By Ambalavanan </span>
                </div>
            </div>

            {/* Sign Out Button */}
            <button
                onClick={handleSignOut}
                className="w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 transition-colors"
            >
                <LogOut className="h-5 w-5" />
                Sign Out
            </button>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentProfile={profile}
                onSuccess={fetchProfile}
            />

            <AppSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
}
