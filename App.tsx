import React, { ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Landing from './pages/Landing';
import LevelSelection from './pages/LevelSelection';
import SubjectCatalog from './pages/SubjectCatalog';
import SubjectDashboard from './pages/SubjectDashboard';
import LectureRoom from './pages/LectureRoom';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import { LogIn, X } from 'lucide-react';

const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const { user, isLoading } = useApp();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  // Since we auto-login guests, 'user' should rarely be null unless initial load failed.
  // But if it is null, redirect to root which redirects to levels (initiating guest).
  if (!user) {
    return <Navigate to="/" replace />;
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

const AppRoutes = () => {
  return (
    <>
      <LoginReminderModal />
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