import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { useParams, Link } from 'react-router-dom';
import { FileText, Layers, BrainCircuit, ChevronRight, CheckCircle, ChevronLeft, Shuffle, Download, Printer, FileType, PlusCircle, X, Network } from 'lucide-react';
import Flashcard from '../components/ui/Flashcard';
import Quiz from '../components/ui/Quiz';
import ReactMarkdown from 'react-markdown';
import { Flashcard as IFlashcard, MediaType } from '../types';
import MindMapRenderer from '../components/ui/MindMapRenderer';

const LectureRoom: React.FC = () => {
  const { subjectId, lectureId } = useParams<{ subjectId: string, lectureId: string }>();
  const { t, language, markLectureComplete, updateQuizScore, logStudyTime, progress, subjects, user, submitFlashcardSuggestion } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz' | 'media'>('summary');

  const subject = subjects.find(s => s.id === subjectId);
  const lecture = subject?.lectures.find(l => l.id === lectureId);

  // Flashcard Deck State
  const [deck, setDeck] = useState<IFlashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);

  // Suggestion Modal State
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestionQ, setSuggestionQ] = useState('');
  const [suggestionA, setSuggestionA] = useState('');
  const [suggestionStatus, setSuggestionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Time Tracking State
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (lectureId) {
      markLectureComplete(lectureId);
    }
    // Reset timer on mount
    startTimeRef.current = Date.now();

    return () => {
        // Log time on unmount
        const durationMs = Date.now() - startTimeRef.current;
        const minutes = Math.floor(durationMs / 60000);
        if (minutes > 0) {
            logStudyTime(minutes);
        }
    };
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

  // --- Export Functions ---
  const downloadSummary = () => {
      const element = document.createElement("a");
      const file = new Blob([lecture.summary], {type: 'text/markdown'});
      element.href = URL.createObjectURL(file);
      element.download = `${lecture.title.replace(/\s+/g, '_')}_Summary.md`;
      document.body.appendChild(element);
      element.click();
  };

  const downloadFlashcardsCSV = () => {
      if (!deck.length) return;
      // Simple CSV escape
      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
      const csvContent = "Question,Answer\n" + deck.map(e => `${escapeCsv(e.question)},${escapeCsv(e.answer)}`).join("\n");
      
      const element = document.createElement("a");
      const file = new Blob([csvContent], {type: 'text/csv'});
      element.href = URL.createObjectURL(file);
      element.download = `${lecture.title.replace(/\s+/g, '_')}_Flashcards.csv`;
      document.body.appendChild(element);
      element.click();
  };

  const printQuiz = () => {
      window.print();
  };

  const handleSuggestSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!suggestionQ.trim() || !suggestionA.trim()) return;
      
      setSuggestionStatus('submitting');
      try {
          await submitFlashcardSuggestion({
              subjectId: subject.id,
              lectureId: lecture.id,
              lectureTitle: lecture.title,
              question: suggestionQ,
              answer: suggestionA
          });
          setSuggestionStatus('success');
          setSuggestionQ('');
          setSuggestionA('');
          setTimeout(() => {
              setIsSuggestModalOpen(false);
              setSuggestionStatus('idle');
          }, 2000);
      } catch (error) {
          console.error(error);
          setSuggestionStatus('error');
      }
  };

  // Helper to extract Embed URL from various video link formats
  const getEmbedUrl = (url: string) => {
      if (!url) return '';
      if (url.includes('youtube.com/watch?v=')) {
          return url.replace('watch?v=', 'embed/');
      } else if (url.includes('youtu.be/')) {
          const id = url.split('/').pop();
          return `https://www.youtube.com/embed/${id}`;
      }
      return url; // Direct MP4 or embedded
  };

  const tabs = [
    { id: 'summary', icon: FileText, label: t('summary') },
    { id: 'flashcards', icon: Layers, label: t('flashcards') },
    { id: 'media', icon: Network, label: 'Media' },
    { id: 'quiz', icon: BrainCircuit, label: t('quiz') },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative">
      <Navbar />
      
      {/* Suggestion Modal */}
      {isSuggestModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl p-6 relative">
                  <button 
                      onClick={() => setIsSuggestModalOpen(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                      <X size={20} />
                  </button>
                  
                  <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Suggest a Flashcard</h3>
                  <p className="text-sm text-gray-500 mb-6">Help improve this lecture by suggesting a new Q&A card.</p>
                  
                  {suggestionStatus === 'success' ? (
                      <div className="py-8 text-center text-green-600 dark:text-green-400 animate-pulse">
                          <CheckCircle size={48} className="mx-auto mb-2" />
                          <p className="font-semibold">Suggestion Sent!</p>
                          <p className="text-xs">The admin will review it shortly.</p>
                      </div>
                  ) : (
                      <form onSubmit={handleSuggestSubmit} className="space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Question</label>
                              <textarea 
                                  value={suggestionQ}
                                  onChange={(e) => setSuggestionQ(e.target.value)}
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                  rows={3}
                                  placeholder="Enter the question..."
                                  required
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Answer</label>
                              <textarea 
                                  value={suggestionA}
                                  onChange={(e) => setSuggestionA(e.target.value)}
                                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                  rows={3}
                                  placeholder="Enter the answer..."
                                  required
                              />
                          </div>
                          
                          {suggestionStatus === 'error' && (
                              <p className="text-xs text-red-500">Failed to submit. Please try again.</p>
                          )}

                          <button 
                              type="submit"
                              disabled={suggestionStatus === 'submitting'}
                              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
                          >
                              {suggestionStatus === 'submitting' ? 'Sending...' : 'Submit Suggestion'}
                          </button>
                      </form>
                  )}
              </div>
          </div>
      )}

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 print:w-full print:max-w-none">
        {/* Breadcrumb & Header */}
        <div className="mb-8 no-print">
             <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <Link to={`/subject/${subject.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {language === 'ar' ? subject.titleAr : subject.title}
                </Link>
                <ChevronRight size={14} className="rtl:rotate-180" />
                <span className="text-gray-900 dark:text-white font-medium line-clamp-1">
                    {language === 'ar' ? lecture.titleAr : lecture.title}
                </span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    {language === 'ar' ? lecture.titleAr : lecture.title}
                    {progress.completedLectures.includes(lecture.id) && (
                        <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                    )}
                </h1>

                {/* Export Tools */}
                <div className="flex gap-2">
                    {activeTab === 'summary' && (
                        <button onClick={downloadSummary} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                            <Download size={16} /> MD
                        </button>
                    )}
                    {activeTab === 'flashcards' && (
                        <button onClick={downloadFlashcardsCSV} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                            <FileType size={16} /> CSV
                        </button>
                    )}
                    {activeTab === 'quiz' && (
                        <button onClick={printQuiz} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                            <Printer size={16} /> Print
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto no-scrollbar no-print">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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
                <div className="bg-card dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none">
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
                                    className="hidden sm:flex p-4 rounded-full bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
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
                                    className="hidden sm:flex p-4 rounded-full bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                                    title={t('next')}
                                >
                                    <ChevronRight size={32} className="rtl:rotate-180" />
                                </button>
                            </div>
                            
                            {/* Controls Bar (Mobile Nav + Shuffle) */}
                            <div className="flex items-center justify-between bg-card dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-xl mx-auto w-full">
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
                            
                            {/* Suggestion Button - Only for logged in users */}
                            {user && !user.isGuest && (
                                <div className="text-center">
                                    <button 
                                        onClick={() => setIsSuggestModalOpen(true)}
                                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <PlusCircle size={16} />
                                        Suggest a Flashcard
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-card dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <p className="mb-4">No flashcards available for this lecture yet.</p>
                            {user && !user.isGuest && (
                                <button 
                                    onClick={() => setIsSuggestModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <PlusCircle size={16} />
                                    Be the first to suggest one
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Media Tab with Lazy Loading Logic */}
            {activeTab === 'media' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                    {(!lecture.media || lecture.media.length === 0) ? (
                         <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-card dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <Network size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No extra media resources available for this lecture.</p>
                        </div>
                    ) : (
                        lecture.media.map(item => (
                            <div key={item.id} className="bg-card dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-3">
                                    <span className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400">
                                        {item.type === 'video' ? <Network size={20} /> : item.type === 'image' ? <FileType size={20} /> : <BrainCircuit size={20} />}
                                    </span>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                </div>
                                
                                <div className="p-6 flex justify-center bg-gray-50/50 dark:bg-gray-900/20">
                                    {/* Video Renderer */}
                                    {item.type === 'video' && item.url && (
                                        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                                            <iframe 
                                                src={getEmbedUrl(item.url)} 
                                                title={item.title}
                                                className="w-full h-full border-0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                                loading="lazy" // Native lazy loading for iframes
                                            />
                                        </div>
                                    )}

                                    {/* Image Renderer */}
                                    {item.type === 'image' && item.content && (
                                        <div className="relative group">
                                            <img 
                                                src={item.content} 
                                                alt={item.title} 
                                                className="max-w-full max-h-[500px] rounded-xl shadow-md object-contain"
                                                loading="lazy" // Native lazy loading for images
                                            />
                                        </div>
                                    )}

                                    {/* Mind Map Renderer */}
                                    {item.type === 'mindmap' && item.content && (
                                        <div className="w-full overflow-x-auto">
                                            <MindMapRenderer data={item.content} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'quiz' && (
                <div className="max-w-2xl mx-auto print:max-w-none print:w-full">
                    {/* Print Header - Visible only when printing */}
                    <div className="hidden print-only mb-8">
                        <h1 className="text-2xl font-bold">{lecture.title} - Quiz</h1>
                        <p>Name: __________________________  Date: ______________</p>
                    </div>

                    {lecture.quiz && lecture.quiz.length > 0 ? (
                        <Quiz questions={lecture.quiz} onComplete={handleQuizComplete} />
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-card dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
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
