import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ChevronLeft, CheckCircle } from 'lucide-react';
import Flashcard from '../components/ui/Flashcard';
import { Flashcard as IFlashcard } from '../types';

const ReviewMode: React.FC = () => {
  const { progress, subjects, rateSRSCard } = useApp();
  const navigate = useNavigate();

  const [dueCards, setDueCards] = useState<{cardId: string, data: IFlashcard, lectureId: string}[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Collect all due cards
    const now = new Date();
    const collected: {cardId: string, data: IFlashcard, lectureId: string}[] = [];

    if (progress.srsData) {
        Object.entries(progress.srsData).forEach(([cardId, data]) => {
            if (new Date(data.nextReviewDate) <= now) {
                // Find the original flashcard
                // cardId format: lectureId-questionHash
                const lectureId = cardId.split('-')[0];
                let foundCard: IFlashcard | undefined;
                
                // Search all subjects and lectures
                subjects.forEach(subject => {
                    const lecture = subject.lectures.find(l => l.id === lectureId);
                    if (lecture && lecture.flashcards) {
                        const card = lecture.flashcards.find(f => 
                            `${lecture.id}-${f.question.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '')}` === cardId
                        );
                        if (card) foundCard = card;
                    }
                });

                if (foundCard) {
                    collected.push({ cardId, data: foundCard, lectureId });
                }
            }
        });
    }

    setDueCards(collected);
  }, [progress.srsData, subjects]);

  const handleNext = (rating: 'again' | 'hard' | 'good' | 'easy') => {
      const current = dueCards[currentIdx];
      if (rating !== 'again') {
          rateSRSCard(current.cardId, rating);
      }
      
      if (currentIdx < dueCards.length - 1) {
          setCurrentIdx(prev => prev + 1);
      } else {
          setIsFinished(true);
      }
  };

  if (isFinished || dueCards.length === 0) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
              <Navbar />
              <div className="flex-grow flex items-center justify-center p-8">
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100 dark:border-gray-700">
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle size={40} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You're All Caught Up!</h2>
                      <p className="text-gray-500 dark:text-gray-400 mb-8">
                          No more flashcards due for review today. Great job keeping your streak alive!
                      </p>
                      <button 
                          onClick={() => navigate('/levels')}
                          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                      >
                          Back to Dashboard
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative overflow-hidden">
        <Navbar />
        
        <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-8 flex flex-col h-full">
            <div className="mb-8">
                <Link to="/levels" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4">
                    <ChevronLeft size={16} /> Back
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layers className="text-blue-600" /> Daily Review
                    </h1>
                    <div className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {currentIdx + 1} / {dueCards.length}
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-6">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIdx) / dueCards.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-center max-w-xl w-full mx-auto pb-20">
                <Flashcard 
                    key={`${dueCards[currentIdx].cardId}-${currentIdx}`}
                    data={dueCards[currentIdx].data} 
                    onNext={handleNext}
                />
            </div>
        </main>
    </div>
  );
};

export default ReviewMode;
