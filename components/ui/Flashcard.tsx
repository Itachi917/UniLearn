import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Flashcard as IFlashcard } from '../../types';
import { RotateCw, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <motion.div 
        className="relative w-full h-full transform-style-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-4">{language === 'ar' ? 'سؤال' : 'Question'}</div>
          <p className="text-2xl font-medium text-gray-900 dark:text-white flex-grow flex items-center">{question}</p>
          <div className="absolute bottom-6 flex items-center justify-center w-full gap-4">
             <button onClick={(e) => playTTS(e, question)} className="p-3 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                <Volume2 size={20} />
             </button>
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <RotateCw size={16} />
              {t('flip')}
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-800/50 p-8 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4">{language === 'ar' ? 'إجابة' : 'Answer'}</div>
          <p className="text-xl text-gray-800 dark:text-gray-100 font-medium leading-relaxed flex-grow flex items-center">{answer}</p>
          
          <div className="absolute bottom-20 right-4 left-4 flex justify-center">
            <button onClick={(e) => playTTS(e, answer)} className="p-3 text-gray-500 hover:text-purple-600 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
               <Volume2 size={20} />
            </button>
          </div>

          <div className="absolute bottom-6 left-4 right-4 flex justify-center gap-3 z-10" onClick={e => e.stopPropagation()}>
             <button onClick={(e) => handleRating(e, 'again')} className="px-4 py-2 text-sm font-bold bg-white/80 dark:bg-gray-800/80 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/50 rounded-xl transition-all shadow-sm">Again</button>
             <button onClick={(e) => handleRating(e, 'hard')} className="px-4 py-2 text-sm font-bold bg-white/80 dark:bg-gray-800/80 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 border border-orange-100 dark:border-orange-900/50 rounded-xl transition-all shadow-sm">Hard</button>
             <button onClick={(e) => handleRating(e, 'good')} className="px-4 py-2 text-sm font-bold bg-white/80 dark:bg-gray-800/80 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 rounded-xl transition-all shadow-sm">Good</button>
             <button onClick={(e) => handleRating(e, 'easy')} className="px-4 py-2 text-sm font-bold bg-white/80 dark:bg-gray-800/80 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 border border-green-100 dark:border-green-900/50 rounded-xl transition-all shadow-sm">Easy</button>
          </div>
        </div>

      </motion.div>
      
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