import React, { ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Landing from './pages/Landing';
import LevelSelection from './pages/LevelSelection';
import SubjectCatalog from './pages/SubjectCatalog';
import SubjectDashboard from './pages/SubjectDashboard';
import LectureRoom from './pages/LectureRoom';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';

// Protected Route Component
// Fix: Make children optional to resolve "children missing" errors during JSX instantiation in element props
const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const { user, isLoading } = useApp();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
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