import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Book, ChevronRight, Search, BarChart3, Settings2, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { Subject } from '../types';

const SubjectSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  initialSelected: string[];
  onSave: (ids: string[]) => void;
}> = ({ isOpen, subjects, initialSelected, onSave }) => {
  const { t, language } = useApp();
  const [selected, setSelected] = useState<string[]>(initialSelected);

  useEffect(() => {
    if (isOpen) {
        setSelected(initialSelected.length > 0 ? initialSelected : []);
    }
  }, [isOpen, initialSelected]);

  if (!isOpen) return null;

  const toggleSubject = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSave = () => {
    onSave(selected);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('welcomeTitle')}</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t('selectSubjectsPrompt')}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-end gap-3 mb-4">
                <button 
                    onClick={() => setSelected(subjects.map(s => s.id))}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    {t('selectAll')}
                </button>
                <button 
                    onClick={() => setSelected([])}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                    {t('deselectAll')}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map(sub => {
                    const isSelected = selected.includes(sub.id);
                    return (
                        <div 
                            key={sub.id}
                            onClick={() => toggleSubject(sub.id)}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            <div className={`flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                {isSelected ? <CheckCircle size={22} className="fill-blue-600 text-white" /> : <Circle size={22} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                    {language === 'ar' ? sub.titleAr : sub.title}
                                </h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 bg-${sub.color}-100 text-${sub.color}-700 dark:bg-gray-700 dark:text-gray-300`}>
                                    Level 2
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button 
                onClick={handleSave}
                disabled={selected.length === 0}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {t('startLearning')} <ArrowRight size={20} className="rtl:rotate-180" />
            </button>
        </div>
      </div>
    </div>
  );
};

const SubjectCatalog: React.FC = () => {
  const { t, language, progress, subjects, enrollSubjects, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if first time login (enrolledSubjectIds is undefined)
  useEffect(() => {
    if (!user?.isGuest && progress.enrolledSubjectIds === undefined) {
        setIsModalOpen(true);
    }
  }, [progress.enrolledSubjectIds, user]);

  const handleEnrollmentSave = (ids: string[]) => {
      enrollSubjects(ids);
      setIsModalOpen(false);
  };

  // Filter based on enrollment AND search term
  const enrolledIds = progress.enrolledSubjectIds || [];
  
  // If enrollment is undefined (loading/first-time), show nothing or all.
  // If enrollment is defined but empty, user actively deselected all.
  // We want to filter subjects that are IN enrolledIds.
  // However, if it is a guest, show all.
  
  const subjectsToShow = user?.isGuest 
    ? subjects 
    : subjects.filter(s => enrolledIds.includes(s.id));

  const filteredSubjects = subjectsToShow.filter(subject => {
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
      
      <SubjectSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Prevent closing without saving if first time? Handled by disabled button
        subjects={subjects}
        initialSelected={enrolledIds}
        onSave={handleEnrollmentSave}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link to="/levels" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('backToLevels')}</Link>
                    <ChevronRight size={14} className="rtl:rotate-180" />
                    <span className="text-gray-900 dark:text-white font-medium">Level 2</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-4">
                    {t('subjects')}
                    {!user?.isGuest && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="text-sm font-medium px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                            <Settings2 size={16} />
                            {t('manageSubjects')}
                        </button>
                    )}
                </h1>
            </div>

            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-card dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
        </div>

        {filteredSubjects.length === 0 && (
            <div className="text-center py-20 bg-card dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <Book size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No subjects found</h3>
                <p className="text-gray-500 mb-4">You haven't enrolled in any subjects matching your search.</p>
                {!user?.isGuest && (
                    <button onClick={() => setIsModalOpen(true)} className="text-blue-600 hover:underline">
                        Manage your enrolled subjects
                    </button>
                )}
            </div>
        )}

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
                        className="group bg-card dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
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