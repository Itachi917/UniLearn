import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Book, ChevronRight, Search, BarChart3 } from 'lucide-react';
import { Subject } from '../types';

const SubjectCatalog: React.FC = () => {
  const { t, language, progress, subjects } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubjects = subjects.filter(subject => {
    const term = searchTerm.toLowerCase();
    return (
        subject.title.toLowerCase().includes(term) ||
        subject.titleAr.includes(term) ||
        subject.lectures.some(l => l.title.toLowerCase().includes(term) || l.summary.toLowerCase().includes(term))
    );
  });

  const getSubjectProgress = (subject: Subject) => {
    if (subject.lectures.length === 0) return 0;
    const completedCount = subject.lectures.filter(l => progress.completedLectures.includes(l.id)).length;
    return Math.round((completedCount / subject.lectures.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link to="/levels" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('backToLevels')}</Link>
                    <ChevronRight size={14} className="rtl:rotate-180" />
                    <span className="text-gray-900 dark:text-white font-medium">Level 2</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('subjects')}
                </h1>
            </div>

            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSubjects.map(subject => {
                const percentage = getSubjectProgress(subject);
                
                // Dynamic Color Mapping for Tailwind (safelist approach simulation)
                const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-500',
                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-500',
                    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-500',
                    purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-500',
                };
                const darkColorMap: Record<string, string> = {
                     blue: 'dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
                     emerald: 'dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
                     indigo: 'dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
                     purple: 'dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
                };

                const baseClasses = colorMap[subject.color] || colorMap.blue;
                const darkClasses = darkColorMap[subject.color] || darkColorMap.blue;

                return (
                    <Link 
                        key={subject.id} 
                        to={`/subject/${subject.id}`}
                        className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className={`p-3 rounded-xl ${baseClasses} ${darkClasses}`}>
                                <Book size={28} />
                            </div>
                            {percentage > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-semibold">
                                    <BarChart3 size={14} className="text-green-500" />
                                    <span>{percentage}%</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {language === 'ar' ? subject.titleAr : subject.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {subject.lectures.length} {t('lectures')}
                            </p>
                        </div>

                        {/* Progress Bar Visual */}
                        {percentage > 0 && (
                            <div className="mt-6 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                ></div>
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

export default SubjectCatalog;
