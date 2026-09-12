import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, UserProgress, Language, Subject, AppTheme, FlashcardSuggestion } from '../types';
import { TRANSLATIONS, APP_THEMES } from '../constants';
import { supabase } from '../lib/supabase';

interface AppContextType {
  user: User | null;
  language: Language;
  theme: 'light' | 'dark';
  currentTheme: AppTheme;
  progress: UserProgress;
  subjects: Subject[];
  isLoading: boolean;
  isAdmin: boolean;
  showLoginPopup: boolean;
  setUser: (user: User | null) => void;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  changeAppTheme: (themeId: string) => void;
  markLectureComplete: (lectureId: string) => void;
  updateQuizScore: (lectureId: string, score: number) => void;
  updateUserProfile: (name: string, avatarUrl: string) => Promise<void>;
  enrollSubjects: (subjectIds: string[]) => void;
  logStudyTime: (minutes: number) => void;
  rateSRSCard: (cardId: string, rating: 'easy' | 'good' | 'hard') => void;
  saveLectureNotes: (lectureId: string, notes: string) => void;
  setExamDate: (subjectId: string, date: string) => void;
  submitFlashcardSuggestion: (suggestion: Omit<FlashcardSuggestion, 'id' | 'timestamp' | 'userId' | 'userName'>) => Promise<void>;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  loginAsGuest: () => void;
  logout: () => void;
  refreshSubjects: () => Promise<void>;
  triggerLoginPopup: () => void;
  closeLoginPopup: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentThemeId, setCurrentThemeId] = useState<string>('default');
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  
  const [progress, setProgress] = useState<UserProgress>({
    completedLectures: [],
    quizScores: {},
    enrolledSubjectIds: undefined,
    studyStreak: 0,
    lastStudyDate: '',
    totalStudyMinutes: 0
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Computed
  const isAdmin = user?.email === 'asm977661@gmail.com';
  const currentTheme = APP_THEMES.find(t => t.id === currentThemeId) || APP_THEMES[0];

  const queryClient = useQueryClient();

  const { data: fetchedSubjects, refetch: refetchSubjectsQuery } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_content')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching subjects from Supabase:", error);
        throw error;
      }
      return Array.isArray(data?.content) ? data.content as Subject[] : [];
    },
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Keep local state in sync with React Query for optimistic updates by Admin
  useEffect(() => {
    if (fetchedSubjects) {
      setSubjects(fetchedSubjects);
    }
  }, [fetchedSubjects]);

  const refreshSubjects = async () => {
    await refetchSubjectsQuery();
  };

  const calculateStreak = (lastDateStr?: string, currentStreak?: number) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today
      
      if (!lastDateStr) return { streak: 1, date: today.toISOString() };

      const last = new Date(lastDateStr);
      const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate()); // Midnight last active
      
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays === 0) {
          // Already studied today
          return { streak: currentStreak || 1, date: today.toISOString() };
      } else if (diffDays === 1) {
          // Studied yesterday, increment
          return { streak: (currentStreak || 0) + 1, date: today.toISOString() };
      } else {
          // Missed a day, reset
          return { streak: 1, date: today.toISOString() };
      }
  };

  const loginAsGuest = () => {
    setUser({ uid: 'guest', email: null, isGuest: true, name: 'Guest Student' });
    setProgress({ 
        completedLectures: [], 
        quizScores: {},
        enrolledSubjectIds: undefined,
        studyStreak: 1,
        totalStudyMinutes: 0
    });
    // Ensure we have fresh subjects even if we just logged in as guest
    refreshSubjects();
    setIsLoading(false);
  };

  const loadUserData = async (authUser: any) => {
    // Set basic user info immediately so ProtectedRoute can proceed
    setUser({
        uid: authUser.id,
        email: authUser.email || null,
        isGuest: false,
        name: authUser.user_metadata?.name || 'Student',
        avatarUrl: ''
    });

    try {
        // Use a Promise.race to timeout database calls if they hang
        const fetchWithTimeout = async (promise: any, timeoutMs: number = 15000) => {
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
            );
            return Promise.race([promise, timeout]);
        };

        let profileData = { name: authUser.user_metadata?.name || 'Student', avatarUrl: '' };
        
        // Attempt to fetch profile
        try {
            const { data: profile, error: pError } = await fetchWithTimeout(
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .maybeSingle()
            );

            if (profile) {
                profileData = { name: profile.full_name, avatarUrl: profile.avatar_url };
            } else if (!pError) {
                const newProfile = {
                    id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.name || '',
                    avatar_url: ''
                };
                await fetchWithTimeout(supabase.from('profiles').insert(newProfile));
            }
        } catch (pErr) {
            console.warn("Profile fetch failed or timed out:", pErr);
        }

        // Update user with profile data if we got it
        setUser(prev => prev ? {
            ...prev,
            name: profileData.name,
            avatarUrl: profileData.avatarUrl
        } : null);

        // Get Progress
        try {
            const { data: progressData } = await fetchWithTimeout(
                supabase
                    .from('user_progress')
                    .select('progress_data')
                    .eq('user_id', authUser.id)
                    .maybeSingle()
            );
                
            if (progressData && progressData.progress_data) {
                const dbProgress = progressData.progress_data;
                const streakInfo = calculateStreak(dbProgress.lastStudyDate, dbProgress.studyStreak);
                
                const updatedProgress = {
                    ...dbProgress,
                    studyStreak: streakInfo.streak,
                    lastStudyDate: streakInfo.date
                };
                
                setProgress(updatedProgress);

                if (streakInfo.streak !== dbProgress.studyStreak || streakInfo.date !== dbProgress.lastStudyDate) {
                    await fetchWithTimeout(supabase.from('user_progress').upsert({
                        user_id: authUser.id,
                        progress_data: updatedProgress
                    }));
                }
            }
        } catch (progErr) {
            console.warn("Progress fetch failed or timed out:", progErr);
        }
    } catch (err) {
        console.error("Error in loadUserData:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkUser = async (retries = 1) => {
      try {
        // Use a Promise.race to timeout database calls if they hang
        const fetchWithTimeout = async (promise: Promise<any>, timeoutMs: number = 20000) => {
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
            );
            return Promise.race([promise, timeout]);
        };

        // getUser() is more secure and sometimes more reliable than getSession() 
        // as it verifies the token with the server
        const { data: { user: authUser }, error } = await fetchWithTimeout(supabase.auth.getUser());
        
        if (error) {
            // If it's just "no session", it's not really an error we need to throw
            if (error.message.includes("Auth session missing")) {
                loginAsGuest();
                return;
            }
            throw error;
        }
        
        if (authUser && mounted) {
          await loadUserData(authUser);
        } else {
          loginAsGuest();
        }
      } catch (error: any) {
        console.error("Error checking session:", error);
        
        // Retry only on network/timeout errors
        const isTimeout = error.message === 'Request timed out';
        if (retries > 0 && mounted && isTimeout) {
            console.log(`Retrying session check... (${retries} left)`);
            await new Promise(r => setTimeout(r, 1500));
            return checkUser(retries - 1);
        }
        loginAsGuest();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        try {
            if (session?.user) {
                // If we have a user, we can stop the global loading state early
                // and let loadUserData handle the background fetching
                await loadUserData(session.user);
                if (mounted) setIsLoading(false);
            } else {
                if (event === 'SIGNED_OUT') {
                    loginAsGuest();
                }
                if (mounted) setIsLoading(false);
            }
        } catch (err) {
            console.error("Auth state change error:", err);
            if (mounted) setIsLoading(false);
        }
    });

    // Safeguard timeout - increased to 30s to allow for retries and slow connections
    const timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
            console.warn("Auth check timed out, clearing loading state manually");
            setIsLoading(false);
            // If we're still loading and no user, fallback to guest to unblock the UI
            if (!user) {
                loginAsGuest();
            }
        }
    }, 30000);

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

  // Theme Logic
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply CSS Variables for currentTheme
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // 1. Set Colors
    Object.entries(currentTheme.colors.primary).forEach(([shade, value]) => {
      root.style.setProperty(`--color-primary-${shade}`, value);
    });

    // 2. Set Background
    if (currentTheme.backgroundImage) {
      body.style.backgroundImage = `url('${currentTheme.backgroundImage}')`;
    } else {
      body.style.backgroundImage = 'none';
    }

    // 3. Set Surfaces & Card
    if (currentTheme.colors.surface) {
         root.style.setProperty('--color-surface-50', currentTheme.colors.surface[50]);
         root.style.setProperty('--color-surface-800', currentTheme.colors.surface[800]);
         root.style.setProperty('--color-surface-900', currentTheme.colors.surface[900]);
    } else {
         // Reset to defaults
         root.style.setProperty('--color-surface-50', '#f9fafb');
         root.style.setProperty('--color-surface-800', '#1f2937');
         root.style.setProperty('--color-surface-900', '#111827');
    }

    if (currentTheme.colors.card) {
        root.style.setProperty('--color-card', currentTheme.colors.card);
    } else {
        root.style.setProperty('--color-card', '#ffffff');
    }

  }, [currentTheme]);

  useEffect(() => {
    if (language === 'ar') {
      document.body.classList.add('rtl');
      document.documentElement.lang = 'ar';
    } else {
      document.body.classList.remove('rtl');
      document.documentElement.lang = 'en';
    }
  }, [language]);

  const triggerLoginPopup = () => {
      if (user?.isGuest) {
          setShowLoginPopup(true);
      }
  };

  const closeLoginPopup = () => {
      setShowLoginPopup(false);
  };

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
  
  const logStudyTime = (minutes: number) => {
      const today = new Date().toISOString().split('T')[0];
      const currentHistory = progress.activityHistory || {};
      const currentTotal = progress.totalStudyMinutes || 0;
      
      saveProgress({
          ...progress,
          totalStudyMinutes: currentTotal + minutes,
          activityHistory: {
              ...currentHistory,
              [today]: (currentHistory[today] || 0) + minutes
          }
      });
  };

  const saveLectureNotes = (lectureId: string, notes: string) => {
      saveProgress({
          ...progress,
          lectureNotes: {
              ...(progress.lectureNotes || {}),
              [lectureId]: notes
          }
      });
  };

  const setExamDate = (subjectId: string, date: string) => {
      saveProgress({
          ...progress,
          examDates: {
              ...(progress.examDates || {}),
              [subjectId]: date
          }
      });
  };

  const rateSRSCard = (cardId: string, rating: 'easy' | 'good' | 'hard') => {
      const existingData = progress.srsData?.[cardId] || {
          nextReviewDate: new Date().toISOString(),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0
      };

      let { interval, easeFactor, repetitions } = existingData;

      if (rating === 'hard') {
          repetitions = 0;
          interval = 1; // 1 day
          easeFactor = Math.max(1.3, easeFactor - 0.2);
      } else if (rating === 'good') {
          if (repetitions === 0) interval = 1;
          else if (repetitions === 1) interval = 3;
          else interval = Math.round(interval * easeFactor);
          repetitions += 1;
      } else if (rating === 'easy') {
          if (repetitions === 0) interval = 2;
          else if (repetitions === 1) interval = 4;
          else interval = Math.round(interval * easeFactor * 1.3);
          easeFactor += 0.15;
          repetitions += 1;
      }

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      saveProgress({
          ...progress,
          srsData: {
              ...(progress.srsData || {}),
              [cardId]: {
                  nextReviewDate: nextReviewDate.toISOString(),
                  interval,
                  easeFactor,
                  repetitions
              }
          }
      });
  };

  const submitFlashcardSuggestion = async (suggestion: Omit<FlashcardSuggestion, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    if (!user) return;
    
    const newSuggestion: FlashcardSuggestion = {
        ...suggestion,
        id: `sugg-${Date.now()}`,
        userId: user.uid,
        userName: user.name || 'Anonymous',
        timestamp: new Date().toISOString()
    };

    try {
        // Fetch existing
        const { data } = await supabase.from('app_content').select('content').eq('id', 'suggestions').maybeSingle();
        const currentList = data?.content || [];
        
        // Append
        await supabase.from('app_content').upsert({
            id: 'suggestions',
            content: [...currentList, newSuggestion]
        });
    } catch (e) {
        console.error("Error submitting suggestion", e);
        throw e;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
        if (!user?.isGuest) {
            await supabase.auth.signOut();
        }
    } finally {
        loginAsGuest(); // Reset to guest instead of null
        changeAppTheme('default'); // Reset theme on logout
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeAppTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
  };

  const t = (key: keyof typeof TRANSLATIONS['en']) => {
    return TRANSLATIONS[language][key] || key;
  };

  return (
    <AppContext.Provider value={{
      user,
      language,
      theme,
      currentTheme,
      progress,
      subjects,
      isLoading,
      isAdmin,
      showLoginPopup,
      setUser,
      setLanguage,
      toggleTheme,
      changeAppTheme,
      markLectureComplete,
      updateQuizScore,
      updateUserProfile,
      enrollSubjects,
      logStudyTime,
      rateSRSCard,
      saveLectureNotes,
      setExamDate,
      submitFlashcardSuggestion,
      t,
      loginAsGuest,
      logout,
      refreshSubjects,
      triggerLoginPopup,
      closeLoginPopup
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
