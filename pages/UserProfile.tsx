import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { User as UserIcon, Award, BookOpen, Clock, ChevronRight, Save, Camera } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user, progress, subjects, t, updateUserProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!user) return null;

  const totalLectures = subjects.reduce((acc, sub) => acc + sub.lectures.length, 0);
  const completedCount = progress.completedLectures.length;
  const overallProgress = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;
  
  // Calculate Average Quiz Score
  const quizIds = Object.keys(progress.quizScores);
  const avgQuizScore = quizIds.length > 0 
    ? Math.round(Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / quizIds.length) // Simplified
    : 0;

  const handleSave = async () => {
    setLoading(true);
    setMsg('');
    try {
        await updateUserProfile(name, avatarUrl);
        setMsg('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setMsg(''), 3000);
    } catch (e) {
        setMsg('Failed to update profile.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

        {msg && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${msg.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {msg}
            </div>
        )}

        {/* User Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={56} />
                        )}
                    </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                    {isEditing ? (
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">Display Name</label>
                                <input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="Your Name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">Avatar Image URL</label>
                                <input 
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="https://example.com/me.jpg"
                                />
                            </div>
                            <div className="flex gap-2 justify-center sm:justify-start pt-2">
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                                {user.name || 'Student'} 
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {user.email}
                            </p>
                            <div className="pt-2">
                                <button 
                                    onClick={() => {
                                        setIsEditing(true);
                                        setName(user.name || '');
                                        setAvatarUrl(user.avatarUrl || '');
                                    }}
                                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        </>
                    )}
                    
                    {user.isGuest && (
                        <p className="text-sm text-orange-500 mt-2">
                            <span className="font-bold">Guest Mode:</span> Progress will be lost upon logout.
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full mb-3">
                    <BookOpen size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount} / {totalLectures}</div>
                <div className="text-sm text-gray-500">Lectures Completed</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full mb-3">
                    <Award size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{avgQuizScore}</div>
                <div className="text-sm text-gray-500">Total Quiz Points</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-full mb-3">
                    <Clock size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallProgress}%</div>
                <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
        </div>

        {/* Quick Links */}
        <div className="flex justify-center">
            <Link 
                to="/subjects" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
                {t('backToSubjects')}
                <ChevronRight size={18} />
            </Link>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
