import React, { useState } from 'react';
import { QuizQuestion } from '../../types';
import { useApp } from '../../context/AppContext';
import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const Quiz: React.FC<Props> = ({ questions, onComplete }) => {
  const { t } = useApp();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const question = questions[currentQIndex];

  const handleSubmit = () => {
    if (selectedOption === null) return;
    
    const isCorrect = selectedOption === question.correctIndex;
    if (isCorrect) setScore(s => s + 1);
    
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setCompleted(true);
      // Final score calculation including the last question handled in previous step
      // But wait, the state update is async. Let's calculate final passed score.
      const finalScore = score + (selectedOption === question.correctIndex ? 1 : 0);
      onComplete(finalScore); 
    }
  };

  if (completed) {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold mb-4">{t('score')}</h3>
        <div className="text-5xl font-black text-blue-600 mb-4">
          {Math.round((score / questions.length) * 100)}%
        </div>
        <p className="text-gray-500">{score} / {questions.length} {t('correct')}</p>
        <button 
            onClick={() => {
                setCurrentQIndex(0);
                setScore(0);
                setCompleted(false);
                setIsSubmitted(false);
                setSelectedOption(null);
            }}
            className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
            Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
        <div 
          className="bg-blue-600 h-2 transition-all duration-300"
          style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <span className="text-sm font-semibold text-blue-500 uppercase tracking-wide">
            Question {currentQIndex + 1} of {questions.length}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold mt-2 text-gray-900 dark:text-white">
            {question.question}
          </h3>
        </div>

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            let itemClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex justify-between items-center ";
            
            if (isSubmitted) {
                if (idx === question.correctIndex) {
                    itemClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                } else if (idx === selectedOption) {
                    itemClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                } else {
                    itemClass += "border-gray-100 dark:border-gray-700 opacity-50";
                }
            } else {
                if (selectedOption === idx) {
                    itemClass += "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
                } else {
                    itemClass += "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700";
                }
            }

            return (
              <button
                key={idx}
                onClick={() => !isSubmitted && setSelectedOption(idx)}
                disabled={isSubmitted}
                className={itemClass}
              >
                <span>{opt}</span>
                {isSubmitted && idx === question.correctIndex && <CheckCircle size={20} />}
                {isSubmitted && idx === selectedOption && idx !== question.correctIndex && <XCircle size={20} />}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('submit')}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 font-medium rounded-lg transition-colors"
            >
              {currentQIndex === questions.length - 1 ? "Finish" : t('next')}
            </button>
          )}
        </div>
        
        {isSubmitted && (
            <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${
                selectedOption === question.correctIndex 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
                {selectedOption === question.correctIndex ? t('correct') : t('incorrect')}
            </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
