import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { useParams, Link } from 'react-router-dom';
import { FileText, Layers, BrainCircuit, ChevronRight, CheckCircle, ChevronLeft, Shuffle, RefreshCw } from 'lucide-react';
import Flashcard from '../components/ui/Flashcard';
import Quiz from '../components/ui/Quiz';
import ReactMarkdown from 'react-markdown';
import { Flashcard as IFlashcard } from '../types';

const LectureRoom: React.FC = () => {
  const { subjectId, lectureId } = useParams<{ subjectId: string, lectureId: string }>();
  const { t, language, markLectureComplete, updateQuizScore, progress, subjects } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz'>('summary');

  const subject = subjects.find(s => s.id === subjectId);
  const lecture = subject?.lectures.find(l => l.id === lectureId);

  // Flashcard Deck State
  const [deck, setDeck] = useState<IFlashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);

  useEffect(() => {
    if (lectureId) {
      markLectureComplete(lectureId);
    }
  }, [lectureId]);

  // Reset/Init Deck when lecture changes
  useEffect(() => {
    if (lecture?.flashcards) {
        setDeck(lecture.flashcards);
        setCurrentCardIdx(0);
    }
  }, [lecture]);

  if (!subject || !lecture) return <div className="p-8">Lecture not found</div>;

  const handleQuizComplete = (score: number) => {
    updateQuizScore(lecture.id, score);
  };

  const shuffleDeck = () => {
      // Fisher-Yates shuffle
      const newDeck = [...deck];
      for (let i = newDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
      }
      setDeck(newDeck);
      setCurrentCardIdx(0);
  };

  const nextCard = () => {
      if (currentCardIdx < deck.length - 1) {
          setCurrentCardIdx(prev => prev + 1);
      }
  };

  const prevCard = () => {
      if (currentCardIdx > 0) {
          setCurrentCardIdx(prev => prev - 1);
      }
  };

  const tabs = [
    { id: 'summary', icon: FileText, label: t('summary') },
    { id: 'flashcards', icon: Layers, label: t('flashcards') },
    { id: 'quiz', icon: BrainCircuit, label: t('quiz') },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-8">
             <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Link to={`/subject/${subject.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {language === 'ar' ? subject.titleAr : subject.title}
                </Link>
                <ChevronRight size={14} className="rtl:rotate-180" />
                <span className="text-gray-900 dark:text-white font-medium line-clamp-1">
                    {language === 'ar' ? lecture.titleAr : lecture.title}
                </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {language === 'ar' ? lecture.titleAr : lecture.title}
                {progress.completedLectures.includes(lecture.id) && (
                    <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                )}
            </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm sm:text-base border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <tab.icon size={18} />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
            {activeTab === 'summary' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{lecture.summary}</ReactMarkdown>
                    
                    {lecture.topics && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold mb-3">{t('topics')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {lecture.topics.map(topic => (
                                    <span key={topic} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        #{topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'flashcards' && (
                <div className="max-w-4xl mx-auto">
                    {deck && deck.length > 0 ? (
                        <div className="flex flex-col gap-8">
                            
                            <div className="flex items-center justify-center gap-4 sm:gap-8">
                                {/* Desktop Previous Arrow */}
                                <button 
                                    onClick={prevCard}
                                    disabled={currentCardIdx === 0}
                                    className="hidden sm:flex p-4 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                                    title={t('previous')}
                                >
                                    <ChevronLeft size={32} className="rtl:rotate-180" />
                                </button>
                                
                                {/* Card Container */}
                                <div className="flex-1 w-full max-w-xl mx-auto">
                                    <Flashcard 
                                        key={`${lecture.id}-${currentCardIdx}-${deck[currentCardIdx].question}`} // Unique key forces reset of flip state
                                        data={deck[currentCardIdx]} 
                                    />
                                </div>

                                {/* Desktop Next Arrow */}
                                <button 
                                    onClick={nextCard}
                                    disabled={currentCardIdx === deck.length - 1}
                                    className="hidden sm:flex p-4 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                                    title={t('next')}
                                >
                                    <ChevronRight size={32} className="rtl:rotate-180" />
                                </button>
                            </div>
                            
                            {/* Controls Bar (Mobile Nav + Shuffle) */}
                            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-xl mx-auto w-full">
                                {/* Mobile Previous */}
                                <button 
                                    onClick={prevCard}
                                    disabled={currentCardIdx === 0}
                                    className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={24} className="rtl:rotate-180" />
                                </button>
                                
                                <div className="flex items-center gap-4 mx-auto sm:mx-0">
                                    <span className="font-mono font-medium text-gray-600 dark:text-gray-300">
                                        {currentCardIdx + 1} / {deck.length}
                                    </span>
                                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                                    <button 
                                        onClick={shuffleDeck}
                                        className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    >
                                        <Shuffle size={18} />
                                        Shuffle
                                    </button>
                                </div>

                                {/* Mobile Next */}
                                <button 
                                    onClick={nextCard}
                                    disabled={currentCardIdx === deck.length - 1}
                                    className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={24} className="rtl:rotate-180" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                            No flashcards available for this lecture yet.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'quiz' && (
                <div className="max-w-2xl mx-auto">
                    {lecture.quiz && lecture.quiz.length > 0 ? (
                        <Quiz questions={lecture.quiz} onComplete={handleQuizComplete} />
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                            No quiz available for this lecture yet.
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default LectureRoom;