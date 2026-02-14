import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Landing: React.FC = () => {
  const { loginAsGuest, t, language } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check for errors in URL (e.g. from Google OAuth redirects)
  useEffect(() => {
    const handleUrlErrors = () => {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        
        const errorDescription = params.get('error_description') || hashParams.get('error_description');
        const errorCode = params.get('error_code') || hashParams.get('error_code');
        
        if (errorDescription) {
            let userFriendlyMsg = errorDescription.replace(/\+/g, ' ');
            
            // Translate common Supabase database trigger errors for the user
            if (userFriendlyMsg.includes("Database error saving new user")) {
                userFriendlyMsg = "Login failed: Database setup issue. Please contact support or check database triggers.";
            }
            
            setErrorMsg(userFriendlyMsg);
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };
    
    handleUrlErrors();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      // Auth state listener in AppContext will handle the redirect/state update
      navigate('/levels');
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google Login Error:", error);
      setErrorMsg(error.message || "Failed to initiate Google Login. Please ensure Google provider is enabled in Supabase.");
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate('/levels');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Left Side: Branding */}
        <div className="p-8 md:p-12 bg-blue-600 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
             </svg>
          </div>
          
          <div className="z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                <GraduationCap size={32} />
            </div>
            <h1 className="text-4xl font-bold mb-4">UniLearn Pro</h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              {language === 'ar' 
               ? "منصة تعليمية متطورة للطلاب الجامعيين. تعلم، تدرب، وتفوق."
               : "Advanced e-learning platform for university students. Learn, practice, and excel."}
            </p>
          </div>
          
          <div className="mt-12 text-sm text-blue-200 z-10">
            © 2024 UniLearn. {language === 'ar' ? "جميع الحقوق محفوظة" : "All rights reserved."}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('login')}
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                    {errorMsg}
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
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  <>
                    <span>{t('login')}</span>
                    <ArrowRight size={18} />
                  </>
              )}
            </button>
          </form>

          <div className="mt-4">
             <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 font-semibold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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
                Sign in with Google
             </button>
          </div>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="px-4 text-sm text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <button 
            onClick={handleGuest}
            className="w-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:border-blue-500 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-lg transition-all"
          >
            {t('continueGuest')}
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