import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Flashcard as IFlashcard } from '../../types';
import { RotateCw, Volume2 } from 'lucide-react';

interface Props {
  data: IFlashcard;
  onNext?: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

const Flashcard: React.FC<Props> = ({ data, onNext }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { t, language } = useApp();

  const question = (language === 'ar' && data.questionAr) ? data.questionAr : data.question;
  const answer = (language === 'ar' && data.answerAr) ? data.answerAr : data.answer;

  const playTTS = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      window.speechSynthesis.speak(msg);
    }
  };

  const handleRating = (e: React.MouseEvent, rating: 'again' | 'hard' | 'good' | 'easy') => {
    e.stopPropagation();
    if (onNext) onNext(rating);
  };

  return (
    <div 
      className="relative w-full h-80 perspective-1000 cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-card dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4">{language === 'ar' ? 'سؤال' : 'Question'}</div>
          <p className="text-xl font-medium text-gray-900 dark:text-white flex-grow flex items-center">{question}</p>
          <div className="absolute bottom-4 flex items-center justify-center w-full gap-4">
             <button onClick={(e) => playTTS(e, question)} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Volume2 size={18} />
             </button>
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <RotateCw size={14} />
              {t('flip')}
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-blue-50 dark:bg-blue-900/30 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-8 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-4">{language === 'ar' ? 'إجابة' : 'Answer'}</div>
          <p className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed flex-grow flex items-center">{answer}</p>
          
          <div className="absolute bottom-16 right-4 left-4 flex justify-center">
            <button onClick={(e) => playTTS(e, answer)} className="p-2 text-gray-500 hover:text-green-600 rounded-full hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
               <Volume2 size={18} />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 z-10" onClick={e => e.stopPropagation()}>
             <button onClick={(e) => handleRating(e, 'again')} className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 rounded-md">Again</button>
             <button onClick={(e) => handleRating(e, 'hard')} className="px-3 py-1.5 text-xs font-bold bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md">Hard</button>
             <button onClick={(e) => handleRating(e, 'good')} className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md">Good</button>
             <button onClick={(e) => handleRating(e, 'easy')} className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 rounded-md">Easy</button>
          </div>
        </div>

      </div>
      
      {/* CSS for 3D flip */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default Flashcard;