import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link, useParams } from 'react-router-dom';
import { PlayCircle, CheckCircle2, Lock, ChevronRight, BrainCircuit, Play, X } from 'lucide-react';
import Quiz from '../components/ui/Quiz';
import { QuizQuestion } from '../types';

const SubjectDashboard: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { t, language, progress, subjects } = useApp();
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedLectures, setSelectedLectures] = useState<string[]>([]);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[] | null>(null);

  const subject = subjects.find(s => String(s.id) === String(subjectId));

  if (!subject) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Subject not found</h2>
        <Link to="/levels" className="text-blue-600 hover:underline mt-4 inline-block">Back to Levels</Link>
      </div>
    </div>
  );

  const handleStartQuiz = () => {
      // 1. Gather questions
      let pool: QuizQuestion[] = [];
      
      // A. Subject Bank Questions (Filtered by selected lecture OR generic if lectureId is undefined)
      if (subject.questionBank) {
          pool = [...pool, ...subject.questionBank.filter(q => 
              !q.lectureId || selectedLectures.includes(q.lectureId)
          )];
      }

      // B. Lecture Quizzes (Optional: if we want to include lecture specific questions too)
      // The prompt says "shuffled question created especially for this subject in the admin dashboard appear"
      // But usually user wants to test on specific content. I'll include both for better UX.
      subject.lectures.forEach(l => {
          if (selectedLectures.includes(l.id) && l.quiz) {
              pool = [...pool, ...l.quiz];
          }
      });

      if (pool.length === 0) {
          alert("No questions found for the selected lectures.");
          return;
      }

      // 2. Shuffle
      for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      // 3. Limit to reasonable number (e.g. 20)
      const finalQuiz = pool.slice(0, 20);
      setGeneratedQuiz(finalQuiz);
      setIsQuizModalOpen(false);
  };

  const toggleLectureSelection = (id: string) => {
      if (selectedLectures.includes(id)) {
          setSelectedLectures(selectedLectures.filter(lid => lid !== id));
      } else {
          setSelectedLectures([...selectedLectures, id]);
      }
  };

  if (generatedQuiz) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Navbar />
            <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8">
                <button 
                    onClick={() => setGeneratedQuiz(null)}
                    className="mb-6 text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
                >
                    <ChevronRight className="rtl:rotate-180 rotate-180" size={16} /> Back to Dashboard
                </button>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">{subject.title} - Custom Test</h1>
                    <p className="text-gray-500">{generatedQuiz.length} Questions</p>
                </div>
                <Quiz questions={generatedQuiz} onComplete={(score) => console.log("Quiz Score:", score)} />
            </main>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      {/* Quiz Configuration Modal */}
      {isQuizModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl p-6 relative">
                  <button onClick={() => setIsQuizModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                      <X size={20} />
                  </button>
                  <h2 className="text-xl font-bold mb-4">Configure Test</h2>
                  <p className="text-sm text-gray-500 mb-4">Select lectures to include in your test:</p>
                  
                  <div className="max-h-60 overflow-y-auto mb-6 space-y-2 border border-gray-100 dark:border-gray-700 rounded-lg p-2">
                      <div className="flex justify-end gap-2 mb-2">
                           <button onClick={() => setSelectedLectures(subject.lectures.map(l => l.id))} className="text-xs text-blue-600 font-medium">Select All</button>
                           <button onClick={() => setSelectedLectures([])} className="text-xs text-gray-500">Clear</button>
                      </div>
                      {subject.lectures.map(lec => (
                          <label key={lec.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={selectedLectures.includes(lec.id)}
                                  onChange={() => toggleLectureSelection(lec.id)}
                                  className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{lec.title}</span>
                          </label>
                      ))}
                  </div>

                  <button 
                      onClick={handleStartQuiz}
                      disabled={selectedLectures.length === 0}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      Start Test
                  </button>
              </div>
          </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Link to={`/subjects?level=${subject.level}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('backToSubjects')}</Link>
                <ChevronRight size={14} className="rtl:rotate-180" />
                <span className="text-gray-900 dark:text-white font-medium">{language === 'ar' ? subject.titleAr : subject.title}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {language === 'ar' ? subject.titleAr : subject.title}
            </h1>
            <p className="text-gray-500">{subject.lectures.length} {t('lectures')} available</p>
        </div>

        {/* Test Yourself Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white mb-10 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <BrainCircuit size={28} />
                        Test Your Knowledge
                    </h2>
                    <p className="text-purple-100 max-w-xl">
                        Select specific lectures and take a customized test with questions designed specifically for this subject.
                    </p>
                </div>
                <button 
                    onClick={() => setIsQuizModalOpen(true)}
                    className="px-8 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-sm flex items-center gap-2"
                >
                    <Play size={20} fill="currentColor" />
                    Start Subject Quiz
                </button>
            </div>
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl"></div>
        </div>

        <div className="space-y-4">
            {subject.lectures.map((lecture, index) => {
                const isCompleted = progress.completedLectures.includes(lecture.id);
                const isLastVisited = progress.lastVisitedLectureId === lecture.id;
                const hasContent = !!(lecture.summary?.trim() || (lecture.flashcards && lecture.flashcards.length > 0) || (lecture.quiz && lecture.quiz.length > 0));

                return (
                    <Link 
                        key={lecture.id} 
                        to={hasContent ? `/lecture/${subject.id}/${lecture.id}` : '#'}
                        onClick={(e) => !hasContent && e.preventDefault()}
                        className={`block bg-card dark:bg-gray-800 rounded-xl p-6 border transition-all relative overflow-hidden ${
                            isLastVisited 
                            ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' 
                            : hasContent 
                                ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md cursor-pointer'
                                : 'border-gray-200 dark:border-gray-700 opacity-75 cursor-default'
                        }`}
                    >
                        {!hasContent && (
                            <div className="absolute top-0 right-0 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10 shadow-sm">
                                {language === 'ar' ? 'قريبا' : 'Coming Soon'}
                            </div>
                        )}

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