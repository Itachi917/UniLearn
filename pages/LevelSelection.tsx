import React from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers, Trophy, Flame } from 'lucide-react';

const levels = ['Level-1', 'Level-2', 'Level-3', 'Level-4'];

const LevelSelection: React.FC = () => {
  const { t, language, subjects } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('selectLevel')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {language === 'ar' 
                 ? "اختر مستواك الأكاديمي للوصول إلى المواد والمحاضرات المناسبة."
                 : "Choose your academic level to access relevant subjects and lectures."}
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {levels.map((level, idx) => {
            // Check if there are any subjects for this level
            const hasSubjects = subjects.some(s => s.level === level);
            const isActive = hasSubjects;
            
            return (
              <Link 
                key={level}
                to={isActive ? `/subjects?level=${level}` : '#'}
                className={`group relative p-8 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 ${
                  isActive 
                    ? 'bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer' 
                    : 'bg-gray-100 dark:bg-gray-800/50 border-transparent opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isActive 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white' 
                    : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                }`}>
                    <Layers size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? t(`level${idx+1}` as any) : level.replace('-', ' ')}
                </h3>
                
                {isActive && (
                    <span className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('subjects')} <ChevronRight size={16} className="ml-1 rtl:rotate-180" />
                    </span>
                )}

                {!isActive && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/20 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                       {/* Locked overlay visual */}
                    </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Leaderboard Section */}
        <Link to="/leaderboard" className="block group">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-1 shadow-lg transform transition-all duration-300 hover:scale-[1.01]">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center shrink-0">
                            <Trophy size={32} />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 justify-center md:justify-start">
                                Champions Leaderboard <Flame size={24} className="text-orange-500 fill-orange-500 animate-pulse" />
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                See who's leading the streak and who has the most XP points!
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold group-hover:bg-orange-600 dark:group-hover:bg-orange-500 dark:group-hover:text-white transition-colors">
                        View Rankings <ChevronRight size={20} className="rtl:rotate-180" />
                    </div>
                </div>
            </div>
        </Link>

      </main>
    </div>
  );
};

export default LevelSelection;