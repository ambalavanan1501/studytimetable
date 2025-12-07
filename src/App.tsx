import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { GamificationProvider } from './context/GamificationContext';
import { FlowProvider } from './context/FlowContext';
import { FlowDock } from './components/flow/FlowDock';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Timetable = lazy(() => import('./pages/Timetable').then(module => ({ default: module.Timetable })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Developer = lazy(() => import('./pages/Developer').then(module => ({ default: module.Developer })));
const StickyNotes = lazy(() => import('./pages/StickyNotes').then(module => ({ default: module.StickyNotes })));
const Countdown = lazy(() => import('./pages/Countdown').then(module => ({ default: module.Countdown })));
const Tasks = lazy(() => import('./pages/Tasks').then(module => ({ default: module.Tasks })));
const Attendance = lazy(() => import('./pages/Attendance').then(module => ({ default: module.Attendance })));
const Simulator = lazy(() => import('./pages/Simulator').then(module => ({ default: module.Simulator })));
const Layout = lazy(() => import('./components/Layout').then(module => ({ default: module.Layout })));
import ScrollToTop from './components/ScrollToTop';

// Loading component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
        </div>
    </div>
);

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

function App() {
    return (
        <HelmetProvider>
            <Router>
                <ScrollToTop />
                <AuthProvider>
                    <ThemeProvider>
                        <ToastProvider>
                            <GamificationProvider>
                                <FlowProvider>
                                    <Suspense fallback={<PageLoader />}>
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
                                            <Route path="/simulator" element={
                                                <ProtectedRoute>
                                                    <Layout>
                                                        <Simulator />
                                                    </Layout>
                                                </ProtectedRoute>
                                            } />
                                        </Routes>
                                    </Suspense>
                                    <FlowDock />
                                </FlowProvider>
                            </GamificationProvider>
                        </ToastProvider>
                    </ThemeProvider>
                </AuthProvider>
            </Router>
        </HelmetProvider>
    );
}

export default App;
