import React, { useState, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { User as UserIcon, Award, BookOpen, Clock, ChevronRight, Upload, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  // Fix: Cast Object.values to number[] to resolve "Operator '+' cannot be applied to types 'unknown' and 'unknown'" error.
  const avgQuizScore = quizIds.length > 0 
    ? Math.round((Object.values(progress.quizScores) as number[]).reduce((a: number, b: number) => a + b, 0) / quizIds.length) 
    : 0;

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

        {/* User Card */}
        <div className="bg-card dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
                        {currentDisplayAvatar ? (
                            <img src={currentDisplayAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={56} />
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
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
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
                            
                            <div className="flex gap-2 justify-center sm:justify-start pt-2">
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setName(user.name || '');
                                        setAvatarFile(null);
                                        setPreviewUrl(null);
                                    }}
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
            <div className="bg-card dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full mb-3">
                    <BookOpen size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount} / {totalLectures}</div>
                <div className="text-sm text-gray-500">Lectures Completed</div>
            </div>

            <div className="bg-card dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full mb-3">
                    <Award size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{avgQuizScore}</div>
                <div className="text-sm text-gray-500">Total Quiz Points</div>
            </div>

            <div className="bg-card dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
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