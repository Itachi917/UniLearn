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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [progress, setProgress] = useState<UserProgress>({
    completedLectures: [],
    quizScores: {},
    enrolledSubjectIds: undefined // Undefined initially allows checking for "first time"
  });
  const [subjects, setSubjects] = useState<Subject[]>(SEED_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Computed
  const isAdmin = user?.email === 'asm977661@gmail.com';

  // Fetch Content (Subjects) from Supabase
  const refreshSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('app_content')
        .select('content')
        .eq('id', 'main')
        .single();
      
      if (data && data.content) {
        setSubjects(data.content);
      } else {
        console.log("No remote content found, using seed data.");
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  useEffect(() => {
    refreshSubjects();
  }, []);

  // Check Active Session on Mount
  useEffect(() => {
    let mounted = true;

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user && mounted) {
            await loadUserData(session.user);
            setIsLoading(false); // Ensure loading is cleared on auth change too
        } else if (!_event.includes('INITIAL') && mounted) {
             // Only clear user if explicit sign out or session loss, not during initial load
             // But we do nothing here as we rely on explicit actions usually.
        }
    });

    // Safeguard: Force stop loading after 8 seconds if something gets stuck
    const timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("Forcing loading state to false due to timeout");
            setIsLoading(false);
        }
    }, 8000);

    return () => {
        mounted = false;
        subscription.unsubscribe();
        clearTimeout(timeoutId);
    };
  }, []);

  const loadUserData = async (authUser: any) => {
    try {
        // 1. Get Profile
        let profileData = { name: authUser.user_metadata?.name, avatarUrl: '' };
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profile) {
            profileData = { name: profile.full_name, avatarUrl: profile.avatar_url };
        } else {
            // Create initial profile if missing
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

        // 2. Get Progress
        const { data: progressData } = await supabase
            .from('user_progress')
            .select('progress_data')
            .eq('user_id', authUser.id)
            .single();
            
        if (progressData && progressData.progress_data) {
            setProgress(progressData.progress_data);
        }
    } catch (err) {
        console.error("Error loading user data:", err);
        // Even if profile load fails, set basic user so they aren't stuck
        setUser({
            uid: authUser.id,
            email: authUser.email || null,
            isGuest: false,
            name: authUser.user_metadata?.name || 'Student'
        });
    }
  };

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

        // Functional update ensures we use the most recent state and avoid staleness
        setUser(prevUser => prevUser ? { ...prevUser, name, avatarUrl } : null);
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
  };

  // Theme Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Language Effect (RTL)
  useEffect(() => {
    if (language === 'ar') {
      document.body.classList.add('rtl');
      document.documentElement.lang = 'ar';
    } else {
      document.body.classList.remove('rtl');
      document.documentElement.lang = 'en';
    }
  }, [language]);

  // Persist Progress
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
    // Guests see all subjects by default or none? Let's give them all for exploration
    setProgress({ 
        completedLectures: [], 
        quizScores: {},
        enrolledSubjectIds: SEED_DATA.map(s => s.id) 
    });
  };

  const logout = async () => {
    if (!user?.isGuest) {
        await supabase.auth.signOut();
    }
    setUser(null);
    setProgress({ completedLectures: [], quizScores: {} });
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