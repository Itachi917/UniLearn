import React from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link, useParams } from 'react-router-dom';
import { PlayCircle, CheckCircle2, Lock, ChevronRight } from 'lucide-react';

const SubjectDashboard: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { t, language, progress, subjects } = useApp();

  const subject = subjects.find(s => s.id === subjectId);

  if (!subject) return <div>Subject not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Link to="/subjects" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('backToSubjects')}</Link>
                <ChevronRight size={14} className="rtl:rotate-180" />
                <span className="text-gray-900 dark:text-white font-medium">{language === 'ar' ? subject.titleAr : subject.title}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {language === 'ar' ? subject.titleAr : subject.title}
            </h1>
            <p className="text-gray-500">{subject.lectures.length} {t('lectures')} available</p>
        </div>

        <div className="space-y-4">
            {subject.lectures.map((lecture, index) => {
                const isCompleted = progress.completedLectures.includes(lecture.id);
                const isLastVisited = progress.lastVisitedLectureId === lecture.id;
                
                return (
                    <Link 
                        key={lecture.id} 
                        to={`/lecture/${subject.id}/${lecture.id}`}
                        className={`block bg-white dark:bg-gray-800 rounded-xl p-6 border transition-all ${
                            isLastVisited 
                            ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${
                                    isCompleted 
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                    {isCompleted ? <CheckCircle2 size={24} /> : <PlayCircle size={24} />}
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {language === 'ar' ? lecture.titleAr : lecture.title}
                                    </h3>
                                    {lecture.topics && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                            {lecture.topics.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {isLastVisited && (
                                    <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                                        Last Read
                                    </span>
                                )}
                                <ChevronRight className="text-gray-400 rtl:rotate-180" />
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
      </main>
    </div>
  );
};

export default SubjectDashboard;
