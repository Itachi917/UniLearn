import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Flashcard as IFlashcard } from '../../types';
import { RotateCw } from 'lucide-react';

interface Props {
  data: IFlashcard;
}

const Flashcard: React.FC<Props> = ({ data }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { t } = useApp();

  return (
    <div 
      className="relative w-full h-64 perspective-1000 cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-card dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4">Question</div>
          <p className="text-xl font-medium text-gray-900 dark:text-white">{data.question}</p>
          <div className="absolute bottom-4 text-sm text-gray-400 flex items-center gap-2">
            <RotateCw size={14} />
            {t('flip')}
          </div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-blue-50 dark:bg-blue-900/30 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-8 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-4">Answer</div>
          <p className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed">{data.answer}</p>
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