import React from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Layers } from 'lucide-react';

const levels = ['Level-1', 'Level-2', 'Level-3', 'Level-4'];

const LevelSelection: React.FC = () => {
  const { t, language } = useApp();

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {levels.map((level, idx) => {
            // Only Level 2 is active per requirements
            const isActive = level === 'Level-2';
            
            return (
              <Link 
                key={level}
                to={isActive ? '/subjects' : '#'}
                className={`group relative p-8 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 ${
                  isActive 
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer' 
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
      </main>
    </div>
  );
};

export default LevelSelection;
