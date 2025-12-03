import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Timetable } from './pages/Timetable';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Developer } from './pages/Developer';
import { StickyNotes } from './pages/StickyNotes';
import { Countdown } from './pages/Countdown';
import { Tasks } from './pages/Tasks';
import { Attendance } from './pages/Attendance';
import { Layout } from './components/Layout';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ReloadPrompt } from './components/ReloadPrompt';
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
}

import { NotificationProvider } from './context/NotificationContext';

function App() {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <ReloadPrompt />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/schedule" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Timetable />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/attendance" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Attendance />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Profile />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/developer" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Developer />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/notes" element={
                            <ProtectedRoute>
                                <Layout>
                                    <StickyNotes />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/countdown" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Countdown />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/tasks" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Tasks />
                                </Layout>
                            </ProtectedRoute>
                        } />
                    </Routes>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
