import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Moon, Sun, Languages, LogOut, User as UserIcon, Settings, Palette, Check, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_THEMES } from '../../constants';

const Navbar: React.FC = () => {
  const { user, theme, toggleTheme, language, setLanguage, logout, t, isAdmin, changeAppTheme, currentTheme } = useApp();
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/'); // Will redirect to levels
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
            setShowThemeMenu(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-card/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/levels')}>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              UniLearn
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              PRO
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="Switch Language"
            >
              <Languages size={20} />
            </button>

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors hidden xs:block"
              title="Toggle Dark/Light Mode"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {/* Logged In Actions */}
            {user && (
              <>
                {/* Theme Palette Dropdown */}
                <div className="relative" ref={themeMenuRef}>
                    <button 
                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                        className={`p-2 rounded-lg transition-colors ${
                            showThemeMenu 
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                        title={t('selectTheme')}
                    >
                        <Palette size={20} />
                    </button>

                    {showThemeMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-fade-in-up">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {t('selectTheme')}
                            </div>
                            {APP_THEMES.map((th) => (
                                <button
                                    key={th.id}
                                    onClick={() => { changeAppTheme(th.id); setShowThemeMenu(false); }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between text-sm text-gray-700 dark:text-gray-200"
                                >
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" 
                                            style={{ backgroundColor: th.colors.primary[500] }} 
                                        />
                                        <span>{th.name}</span>
                                    </div>
                                    {currentTheme.id === th.id && <Check size={16} className="text-blue-500" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
                    
                    {isAdmin && (
                    <Link
                        to="/admin"
                        className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                    >
                        <Settings size={16} />
                        <span>Admin</span>
                    </Link>
                    )}

                    {user.isGuest ? (
                        <Link 
                            to="/login"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <LogIn size={16} />
                            {t('login')}
                        </Link>
                    ) : (
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[100px] truncate">
                                {user.name || user.email?.split('@')[0]}
                            </span>
                        </div>
                    )}
                    
                    <div className="relative group flex items-center gap-1">
                        <Link to="/profile" className="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:opacity-80 transition-opacity">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <UserIcon size={20} />
                                </div>
                            )}
                        </Link>
                        {!user.isGuest && (
                            <button 
                                onClick={handleLogout}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title={t('signOut')}
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;