import React, { useState, useRef, useMemo } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { User as UserIcon, Award, BookOpen, Clock, ChevronRight, Upload, Camera, Flame, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const UserProfile: React.FC = () => {
  const { user, progress, subjects, t, updateUserProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  
  // File upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!user) return null;

  const totalLectures = subjects.reduce((acc, sub) => acc + sub.lectures.length, 0);
  const completedCount = progress.completedLectures.length;
  const overallProgress = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;
  
  const quizIds = Object.keys(progress.quizScores);
  const avgQuizScore = quizIds.length > 0 
    ? Math.round((Object.values(progress.quizScores) as number[]).reduce((a: number, b: number) => a + b, 0) / quizIds.length) 
    : 0;

  // --- Gamification Data Prep ---
  const streak = progress.studyStreak || 0;
  const studyTimeHours = Math.floor((progress.totalStudyMinutes || 0) / 60);
  const studyTimeMins = (progress.totalStudyMinutes || 0) % 60;

  const chartData = useMemo(() => {
    // Transform quiz scores into chart friendly format
    // Map lecture ID to lecture title for tooltip
    return Object.entries(progress.quizScores).map(([lecId, score]) => {
        // Find lecture title
        let title = lecId;
        subjects.forEach(s => {
            const l = s.lectures.find(l => l.id === lecId);
            if(l) title = l.title;
        });
        return { name: title.substring(0, 15) + '...', fullTitle: title, score };
    }).slice(-5); // Last 5 quizzes
  }, [progress.quizScores, subjects]);

  const recommendations = useMemo(() => {
    // Suggest review for lectures where quiz score < 4 (assuming out of 5 usually) or not visited recently
    // Simplified: Find up to 2 lectures with scores < 4
    const lowScores = Object.entries(progress.quizScores)
        .filter(([_, score]) => score < 4)
        .slice(0, 2)
        .map(([lecId]) => {
             let subId = '';
             let lecTitle = '';
             subjects.forEach(s => {
                 const l = s.lectures.find(l => l.id === lecId);
                 if(l) { subId = s.id; lecTitle = l.title; }
             });
             return { subId, lecId, title: lecTitle, reason: 'Improve Score' };
        });

    // If we don't have enough low scores, suggest uncompleted lectures
    if (lowScores.length < 2) {
        subjects.forEach(s => {
            if (lowScores.length >= 2) return;
            const nextLec = s.lectures.find(l => !progress.completedLectures.includes(l.id));
            if (nextLec) {
                lowScores.push({ subId: s.id, lecId: nextLec.id, title: nextLec.title, reason: 'Next Up' });
            }
        });
    }
    return lowScores;
  }, [progress, subjects]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Helper to convert image to resized Base64 string
  const processImageForDb = (file: File): Promise<string> => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
              const img = new Image();
              img.src = e.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  // Resize to reasonable avatar size (e.g. 300x300 max) to save DB space
                  const MAX_SIZE = 300;
                  let width = img.width;
                  let height = img.height;
                  
                  if (width > height) {
                      if (width > MAX_SIZE) {
                          height *= MAX_SIZE / width;
                          width = MAX_SIZE;
                      }
                  } else {
                      if (height > MAX_SIZE) {
                          width *= MAX_SIZE / height;
                          height = MAX_SIZE;
                      }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                      ctx.drawImage(img, 0, 0, width, height);
                      // Return as JPEG base64 with 0.7 quality
                      resolve(canvas.toDataURL('image/jpeg', 0.7));
                  } else {
                      // Fallback if canvas fails
                      resolve(e.target?.result as string);
                  }
              };
              img.onerror = () => {
                   resolve(e.target?.result as string);
              }
          };
      });
  };

  const handleSave = async () => {
    setLoading(true);
    setMsg('');
    try {
        let finalAvatarUrl = user.avatarUrl || '';

        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.uid}-${Date.now()}.${fileExt}`;
            let uploadSuccessful = false;

            // 1. Try Supabase Storage first
            try {
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile, { upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);
                    finalAvatarUrl = data.publicUrl;
                    uploadSuccessful = true;
                } else {
                    console.warn("Storage upload failed (likely missing bucket), falling back to Base64:", uploadError.message);
                }
            } catch (err) {
                console.warn("Storage access error:", err);
            }

            // 2. Fallback to Base64 if storage failed
            if (!uploadSuccessful) {
                finalAvatarUrl = await processImageForDb(avatarFile);
            }
        }

        await updateUserProfile(name, finalAvatarUrl);
        setMsg('Profile updated successfully!');
        setIsEditing(false);
        setAvatarFile(null);
        setPreviewUrl(null);
        setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
        setMsg(e.message || 'Failed to update profile.');
    } finally {
        setLoading(false);
    }
  };

  const currentDisplayAvatar = previewUrl || user.avatarUrl;

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Profile Card & Stats */}
            <div className="md:col-span-1 space-y-6">
                {/* Profile Card */}
                <div className="bg-card dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div className="relative inline-block mb-4 group">
                        <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg mx-auto">
                            {currentDisplayAvatar ? (
                                <img src={currentDisplayAvatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={64} />
                            )}
                        </div>
                        {isEditing && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
                                title="Upload Photo"
                            >
                                <Camera size={18} />
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                placeholder="Your Name"
                            />
                            <div className="flex gap-2 justify-center">
                                <button onClick={handleSave} disabled={loading} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">{loading ? '...' : 'Save'}</button>
                                <button onClick={() => setIsEditing(false)} disabled={loading} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name || 'Student'}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{user.email}</p>
                            <button 
                                onClick={() => { setIsEditing(true); setName(user.name || ''); }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Edit Profile
                            </button>
                        </>
                    )}
                </div>

                {/* Streak Card */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold opacity-90">Study Streak</span>
                        <Flame size={24} className="fill-white" />
                    </div>
                    <div className="text-4xl font-bold mb-1">{streak} Days</div>
                    <p className="text-xs opacity-75">Keep learning daily to increase your streak!</p>
                </div>
            </div>

            {/* Right Column: Analytics & Progress */}
            <div className="md:col-span-2 space-y-6">
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     <div className="bg-card dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-2">Total Time</div>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{studyTimeHours}h</span>
                            <span className="text-sm text-gray-500 mb-1">{studyTimeMins}m</span>
                        </div>
                    </div>
                    <div className="bg-card dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-2">Completed</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount} <span className="text-sm text-gray-400 font-normal">/ {totalLectures}</span></div>
                    </div>
                    <div className="bg-card dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-2">Avg. Score</div>
                        <div className="text-2xl font-bold text-blue-600">{avgQuizScore} <span className="text-sm text-gray-400 font-normal">pts</span></div>
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-card dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500" />
                        Recent Quiz Performance
                    </h3>
                    <div className="h-64 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                        cursor={{fill: 'transparent'}}
                                    />
                                    <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                Take some quizzes to see your stats!
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommended Review */}
                <div className="bg-card dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-blue-500" />
                        Recommended For You
                    </h3>
                    <div className="space-y-3">
                        {recommendations.length > 0 ? (
                            recommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <div>
                                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">{rec.reason}</div>
                                        <div className="font-medium text-gray-900 dark:text-white">{rec.title}</div>
                                    </div>
                                    <Link to={`/lecture/${rec.subId}/${rec.lecId}`} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <ArrowRight size={18} className="text-gray-600 dark:text-gray-300" />
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-500 text-sm">
                                You're all caught up! Great job.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>

        {/* Quick Links Footer */}
        <div className="flex justify-center mt-12">
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