import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Lock, Mail, User, CheckCircle, Languages } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Landing: React.FC = () => {
  const { loginAsGuest, t, language, setLanguage, user, isLoading: isAuthLoading } = useApp();
  const navigate = useNavigate();
  
  // Auth State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Automatic Redirect if Logged In
  useEffect(() => {
    if (!isAuthLoading && user) {
        navigate('/levels', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  // Check for errors in URL 
  useEffect(() => {
    const handleUrlErrors = () => {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        
        const errorDescription = params.get('error_description') || hashParams.get('error_description');
        if (errorDescription) {
            let userFriendlyMsg = errorDescription.replace(/\+/g, ' ');
            if (userFriendlyMsg.includes("Database error saving new user")) {
                userFriendlyMsg = "Login failed: Database trigger issue. Please contact support.";
            }
            setErrorMsg(userFriendlyMsg);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };
    handleUrlErrors();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLocalLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        if (error) throw error;
        
        // Explicitly save the profile with the password text
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email: email,
                full_name: name,
                password_text: password 
            }, { onConflict: 'id' });
        }
        
        if (data.session) {
             // Session active immediately
        } else if (data.user) {
             setSuccessMsg(t('accountCreated'));
             setIsSignUp(false);
        }
      } else {
        // Login Logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // CAPTURE PASSWORD ON LOGIN
        // This ensures existing users who signed up before the update 
        // will have their passwords saved when they log in next.
        if (data.user) {
            // We use 'upsert' but usually we just want to update the password field 
            // without overwriting name/avatar if they exist. 
            // Using update is safer for existing profiles.
            await supabase.from('profiles')
                .update({ password_text: password })
                .eq('id', data.user.id);
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || t('authFailed'));
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLocalLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMsg(error.message || "Google Login failed");
      setIsLocalLoading(false);
    }
  };

  const handleGuest = () => {
    loginAsGuest();
  };

  // Only show the blocking spinner if the app is checking for a session OR we are authenticated but waiting to redirect
  const isActuallyLoading = isAuthLoading || (user !== null && !isAuthLoading);

  if (isActuallyLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
             <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 dark:text-gray-400 animate-pulse">{t('checkingSession')}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-8 text-sm text-blue-600 hover:underline opacity-50 hover:opacity-100 transition-opacity"
                >
                  {t('takingTooLong')}
                </button>
             </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8 relative">
      {/* Language Switcher */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="absolute top-4 right-4 z-50 p-2 bg-card dark:bg-gray-800 rounded-full shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Switch Language"
      >
        <Languages size={20} />
      </button>

      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 bg-card dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Left Side: Branding */}
        <div className="p-8 md:p-12 bg-blue-600 text-white flex flex-col justify-between relative overflow-hidden min-h-[300px] md:min-h-full">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
             </svg>
          </div>
          
          <div className="z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                <GraduationCap size={32} />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('landingTitle')}</h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              {t('landingSubtitle')}
            </p>
          </div>
          
          <div className="mt-12 text-sm text-blue-200 z-10 hidden md:block">
            © 2024 UniLearn. {t('rightsReserved')}
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isSignUp ? t('createAccount') : t('login')}
            </h2>
          </div>

          {/* Toggle Switch */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6 relative">
             <div 
               className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card dark:bg-gray-600 rounded-lg shadow-sm transition-all duration-300 ease-in-out ${isSignUp ? 'left-[calc(50%)]' : 'left-1'}`}
             ></div>
             <button 
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium z-10 transition-colors duration-300 ${!isSignUp ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
             >
                {t('login')}
             </button>
             <button 
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium z-10 transition-colors duration-300 ${isSignUp ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
             >
                {t('signUp')}
             </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {errorMsg && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2 animate-pulse">
                    <span className="mt-0.5">⚠️</span>
                    <span>{errorMsg}</span>
                </div>
            )}
            
            {successMsg && (
                <div className="p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5" />
                    <span>{successMsg}</span>
                </div>
            )}

            {isSignUp && (
                <div className="animate-fade-in-up">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fullName')}</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="John Doe"
                        required={isSignUp}
                        />
                    </div>
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="example@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLocalLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLocalLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  <>
                    <span>{isSignUp ? t('signUp') : t('login')}</span>
                    <ArrowRight size={18} />
                  </>
              )}
            </button>
          </form>

          <div className="mt-4">
             <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-card dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 font-semibold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
             >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                {isSignUp ? t('googleSignUp') : t('googleSignIn')}
             </button>
          </div>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="px-4 text-sm text-gray-400">{t('or')}</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <button 
            onClick={handleGuest}
            className="w-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:border-blue-500 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-lg transition-all"
          >
            {t('continueGuest')} (Preview Content)
          </button>
          
          <p className="text-xs text-center text-gray-400 mt-4">
            {t('guestWarning')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;