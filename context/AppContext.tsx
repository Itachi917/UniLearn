import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserProgress, Language, Subject } from '../types';
import { TRANSLATIONS, SEED_DATA } from '../constants';
import { supabase } from '../lib/supabase';

interface AppContextType {
  user: User | null;
  language: Language;
  theme: 'light' | 'dark';
  progress: UserProgress;
  subjects: Subject[];
  isLoading: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  markLectureComplete: (lectureId: string) => void;
  updateQuizScore: (lectureId: string, score: number) => void;
  updateUserProfile: (name: string, avatarUrl: string) => Promise<void>;
  enrollSubjects: (subjectIds: string[]) => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  loginAsGuest: () => void;
  logout: () => void;
  refreshSubjects: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Fix: Make children optional to resolve "children missing" errors in App.tsx usage
export const AppProvider = ({ children }: { children?: ReactNode }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [progress, setProgress] = useState<UserProgress>({
    completedLectures: [],
    quizScores: {},
    enrolledSubjectIds: undefined 
  });
  const [subjects, setSubjects] = useState<Subject[]>(SEED_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Computed
  const isAdmin = user?.email === 'asm977661@gmail.com';

  const refreshSubjects = async () => {
    try {
      console.log("Fetching subjects from DB...");
      const { data, error } = await supabase
        .from('app_content')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching subjects from Supabase:", error);
        return;
      }

      if (data && data.content && Array.isArray(data.content)) {
        console.log("Subjects loaded from DB successfully.");
        setSubjects(data.content);
      } else {
        console.warn("No content found in DB, using SEED_DATA.");
        // We do NOT set SEED_DATA here to avoid overwriting existing state if fetch fails temporarily
        // unless subjects is empty? No, keep current state.
      }
    } catch (err) {
      console.error("Error executing fetch subjects:", err);
    }
  };

  // Re-fetch subjects when user logs in to handle RLS policies that might block unauthenticated access
  // Also runs on mount implicitly via the auth listener logic below
  useEffect(() => {
    if (user) {
        refreshSubjects();
    }
  }, [user]);

  const loadUserData = async (authUser: any) => {
    try {
        let profileData = { name: authUser.user_metadata?.name || 'Student', avatarUrl: '' };
        
        // Attempt to fetch profile but don't hang if it fails
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (profile) {
            // Fix: Change avatar_url to avatarUrl to match the local variable structure defined on line 66
            profileData = { name: profile.full_name, avatarUrl: profile.avatar_url };
        } else if (!pError) {
            // Create profile if it doesn't exist
            const newProfile = {
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.name || '',
                avatar_url: ''
            };
            await supabase.from('profiles').insert(newProfile);
        }

        setUser({
            uid: authUser.id,
            email: authUser.email || null,
            isGuest: false,
            name: profileData.name,
            avatarUrl: profileData.avatarUrl
        });

        // Get Progress
        const { data: progressData } = await supabase
            .from('user_progress')
            .select('progress_data')
            .eq('user_id', authUser.id)
            .maybeSingle();
            
        if (progressData && progressData.progress_data) {
            setProgress(progressData.progress_data);
        }
    } catch (err) {
        console.error("Error in loadUserData:", err);
        // Fallback to basic user data so app isn't bricked
        setUser({
            uid: authUser.id,
            email: authUser.email || null,
            isGuest: false,
            name: authUser.user_metadata?.name || 'Student'
        });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial Fetch
    refreshSubjects();

    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user && mounted) {
          await loadUserData(session.user);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
            if (user?.uid !== session.user.id) {
                await loadUserData(session.user);
            }
            setIsLoading(false);
        } else {
            // If no session exists (or logout occurred), ensure loading is stopped
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProgress({ completedLectures: [], quizScores: {} });
                // Reset to seed data on logout to be safe
                setSubjects(SEED_DATA);
                refreshSubjects(); // Try to fetch public content if available
            }
            setIsLoading(false);
        }
    });

    // Safeguard timeout: If anything takes more than 8 seconds, clear the loading state
    const timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("Auth check timed out, clearing loading state manually");
            setIsLoading(false);
        }
    }, 8000);

    return () => {
        mounted = false;
        subscription.unsubscribe();
        clearTimeout(timeoutId);
    };
  }, []);

  const updateUserProfile = async (name: string, avatarUrl: string) => {
    if (!user || user.isGuest) return;
    try {
        const updates = {
            id: user.uid,
            full_name: name,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;
        setUser(prevUser => prevUser ? { ...prevUser, name, avatarUrl } : null);
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (language === 'ar') {
      document.body.classList.add('rtl');
      document.documentElement.lang = 'ar';
    } else {
      document.body.classList.remove('rtl');
      document.documentElement.lang = 'en';
    }
  }, [language]);

  const saveProgress = async (newProgress: UserProgress) => {
    setProgress(newProgress);
    if (user && !user.isGuest) {
      try {
        await supabase.from('user_progress').upsert({
            user_id: user.uid,
            progress_data: newProgress
        });
      } catch (err) {
        console.error("Failed to save progress to DB", err);
      }
    }
  };

  const markLectureComplete = (lectureId: string) => {
    if (!progress.completedLectures.includes(lectureId)) {
      saveProgress({
        ...progress,
        completedLectures: [...progress.completedLectures, lectureId],
        lastVisitedLectureId: lectureId
      });
    } else {
      saveProgress({
        ...progress,
        lastVisitedLectureId: lectureId
      });
    }
  };

  const updateQuizScore = (lectureId: string, score: number) => {
    saveProgress({
      ...progress,
      quizScores: { ...progress.quizScores, [lectureId]: score }
    });
  };

  const enrollSubjects = (subjectIds: string[]) => {
      saveProgress({
          ...progress,
          enrolledSubjectIds: subjectIds
      });
  };

  const loginAsGuest = () => {
    setUser({ uid: 'guest', email: null, isGuest: true, name: 'Guest Student' });
    setProgress({ 
        completedLectures: [], 
        quizScores: {},
        enrolledSubjectIds: SEED_DATA.map(s => s.id) 
    });
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
        if (!user?.isGuest) {
            await supabase.auth.signOut();
        }
    } finally {
        setUser(null);
        setProgress({ completedLectures: [], quizScores: {} });
        setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const t = (key: keyof typeof TRANSLATIONS['en']) => {
    return TRANSLATIONS[language][key] || key;
  };

  return (
    <AppContext.Provider value={{
      user,
      language,
      theme,
      progress,
      subjects,
      isLoading,
      isAdmin,
      setUser,
      setLanguage,
      toggleTheme,
      markLectureComplete,
      updateQuizScore,
      updateUserProfile,
      enrollSubjects,
      t,
      loginAsGuest,
      logout,
      refreshSubjects
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};