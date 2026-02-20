import React, { ReactNode, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Landing from './pages/Landing';
import LevelSelection from './pages/LevelSelection';
import SubjectCatalog from './pages/SubjectCatalog';
import SubjectDashboard from './pages/SubjectDashboard';
import LectureRoom from './pages/LectureRoom';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import Leaderboard from './pages/Leaderboard';
import { LogIn, X, Lock } from 'lucide-react';

const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const { user, isLoading } = useApp();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  // Since we auto-login guests, 'user' should rarely be null unless initial load failed.
  // But if it is null, redirect to login page to avoid infinite loop with root redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const LoginReminderModal = () => {
    const { showLoginPopup, closeLoginPopup } = useApp();
    const navigate = useNavigate();

    if (!showLoginPopup) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative border border-gray-100 dark:border-gray-700">
                <button onClick={closeLoginPopup} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={20} />
                </button>
                <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Save Your Progress?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        You're currently in Guest Mode. Log in to save your quiz scores, streaks, and tracked progress permanently!
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={closeLoginPopup}
                            className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Maybe Later
                        </button>
                        <button 
                            onClick={() => { closeLoginPopup(); navigate('/login'); }}
                            className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md"
                        >
                            Log In / Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GooglePasswordSetModal = () => {
    const { showGooglePasswordModal, saveGooglePassword, logout } = useApp();
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    if (!showGooglePasswordModal) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await saveGooglePassword(password);
        } catch (e) {
            alert("Failed to save password.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Set Password Required</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        To secure your account and allow alternative login methods, please set a password for your account.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                            <input 
                                type="text" // Shown as text so user can see it (since it's being stored for admin ref)
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none"
                                required
                                minLength={6}
                                placeholder="Enter password"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={saving}
                            className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors shadow-sm"
                        >
                            {saving ? 'Saving...' : 'Set Password & Continue'}
                        </button>
                    </form>
                    
                    <button 
                        onClick={() => logout()}
                        className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                        Cancel & Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

const AppRoutes = () => {
  return (
    <>
      <LoginReminderModal />
      <GooglePasswordSetModal />
      <Routes>
        <Route path="/" element={<Navigate to="/levels" replace />} />
        <Route path="/login" element={<Landing />} />
        <Route 
          path="/levels" 
          element={
            <ProtectedRoute>
              <LevelSelection />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subjects" 
          element={
            <ProtectedRoute>
              <SubjectCatalog />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subject/:subjectId" 
          element={
            <ProtectedRoute>
              <SubjectDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lecture/:subjectId/:lectureId" 
          element={
            <ProtectedRoute>
              <LectureRoom />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;