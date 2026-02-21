import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../../types';
import { useApp } from '../../context/AppContext';
import { CheckCircle, XCircle, Timer, Clock, Play, HelpCircle, SkipForward } from 'lucide-react';
import { gradeShortAnswer } from '../../utils/grading';

interface Props {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const Quiz: React.FC<Props> = ({ questions, onComplete }) => {
  const { t, triggerLoginPopup, language } = useApp();
  
  // Setup State
  const [hasStarted, setHasStarted] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(0); // 0 means no timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null); // For MCQ
  const [textAnswer, setTextAnswer] = useState(''); // For Short Answer
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Track if current answer is correct for UI feedback (Short Answer)
  const [shortAnswerResult, setShortAnswerResult] = useState<{correct: boolean, score: number} | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (hasStarted && timeLeft !== null && timeLeft > 0 && !completed) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
             finishQuiz(true); // Auto finish
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, timeLeft, completed]);

  const startQuiz = () => {
    setHasStarted(true);
    if (timerMinutes > 0) {
      setTimeLeft(timerMinutes * 60);
    } else {
      setTimeLeft(null);
    }
  };

  const finishQuiz = (timeRanOut = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCompleted(true);
    
    // Calculate final score based on current progress
    onComplete(score);
    // Suggest login if guest
    triggerLoginPopup();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    const question = questions[currentQIndex];

    if (question.type === 'MCQ' || !question.type) { // Default to MCQ if type missing
        if (selectedOption === null) return;
        const isCorrect = selectedOption === question.correctIndex;
        if (isCorrect) setScore(s => s + 1);
    } else if (question.type === 'SHORT') {
        if (!textAnswer.trim()) return;
        const result = gradeShortAnswer(textAnswer, question.acceptedAnswers || [question.correctAnswer || '']);
        if (result.correct) {
            setScore(s => s + 1);
        }
        setShortAnswerResult(result);
    }
    
    setIsSubmitted(true);
  };

  const handleSkip = () => {
    const question = questions[currentQIndex];
    
    if (question.type === 'SHORT') {
        // Mark as incorrect and show result
        setShortAnswerResult({ correct: false, score: 0 });
    }
    
    // For MCQ, we just don't select anything (or keep current selection) 
    // and setSubmitted to true. The UI will show the correct answer.
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setTextAnswer('');
      setShortAnswerResult(null);
      setIsSubmitted(false);
    } else {
      finishQuiz();
    }
  };

  // Helper to render the interactive screen based on state
  const renderInteractiveScreen = () => {
    // --- RENDER: SETUP ---
    if (!hasStarted) {
      return (
        <div className="bg-card dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('quiz')} Setup</h3>
          <p className="text-gray-500 mb-8">{questions.length} questions available.</p>
          
          <div className="max-w-xs mx-auto mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Set Timer (Minutes) <span className="text-gray-400 font-normal">(0 for no limit)</span>
              </label>
              <div className="relative">
                  <Timer className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input 
                      type="number" 
                      min="0" 
                      max="60"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
              </div>
          </div>

          <button 
              onClick={startQuiz}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all transform active:scale-95 flex items-center gap-2 mx-auto"
          >
              <Play size={20} className="fill-current" />
              Start Quiz
          </button>
        </div>
      );
    }

    // --- RENDER: RESULTS ---
    if (completed) {
      return (
        <div className="text-center p-8 bg-card dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold mb-4">{t('score')}</h3>
          <div className="text-5xl font-black text-blue-600 mb-4">
            {Math.round((score / questions.length) * 100)}%
          </div>
          <p className="text-gray-500 mb-2">{score} / {questions.length} {t('correct')}</p>
          {timeLeft === 0 && <p className="text-red-500 text-sm font-medium">Time's Up!</p>}

          <button 
              onClick={() => {
                  setCurrentQIndex(0);
                  setScore(0);
                  setCompleted(false);
                  setIsSubmitted(false);
                  setSelectedOption(null);
                  setTextAnswer('');
                  setShortAnswerResult(null);
                  setHasStarted(false); // Go back to setup
              }}
              className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
              Retry Quiz
          </button>
        </div>
      );
    }

    // --- RENDER: ACTIVE QUIZ ---
    const question = questions[currentQIndex];
    const isMCQ = question.type === 'MCQ' || !question.type;

    const displayQuestion = (language === 'ar' && question.questionAr) ? question.questionAr : question.question;
    const displayOptions = (language === 'ar' && question.optionsAr) ? question.optionsAr : question.options;
    const displayCorrectAnswer = (language === 'ar' && question.correctAnswerAr) ? question.correctAnswerAr : (question.correctAnswer || question.acceptedAnswers?.[0] || (language === 'ar' ? "لا توجد إجابة مقدمة" : "No answer provided"));

    return (
      <div className="bg-card dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with Progress & Timer */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {language === 'ar' ? `سؤال ${currentQIndex + 1} من ${questions.length}` : `Question ${currentQIndex + 1} of ${questions.length}`}
          </span>
          
          {timeLeft !== null && (
              <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                  <Timer size={20} />
                  {formatTime(timeLeft)}
              </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
          <div 
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex gap-3 mb-6">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${isMCQ ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {isMCQ ? 'MCQ' : 'SA'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex-1">
                  {displayQuestion}
              </h3>
          </div>

          <div className="space-y-4">
            {isMCQ ? (
                // MCQ RENDER
                displayOptions?.map((opt, idx) => {
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
                })
            ) : (
                // SHORT ANSWER RENDER
                <div className="space-y-4">
                    <textarea 
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        disabled={isSubmitted}
                        placeholder={language === 'ar' ? "اكتب إجابتك هنا..." : "Type your answer here..."}
                        className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        rows={3}
                    />
                    {isSubmitted && (
                        <div className={`p-4 rounded-lg border ${shortAnswerResult?.correct ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'}`}>
                            <div className="font-bold mb-1 flex items-center gap-2">
                                {shortAnswerResult?.correct ? <CheckCircle size={18}/> : <XCircle size={18}/>}
                                {shortAnswerResult?.correct ? (language === 'ar' ? 'صحيح!' : 'Correct!') : (language === 'ar' ? 'غير صحيح' : 'Incorrect')}
                            </div>
                            {!shortAnswerResult?.correct && (
                                <p className="text-sm mt-1">
                                    <span className="font-semibold">{language === 'ar' ? 'المتوقع:' : 'Expected:'}</span> {displayCorrectAnswer}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            {!isSubmitted ? (
              <>
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    Skip <SkipForward size={16} />
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isMCQ ? selectedOption === null : !textAnswer.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('submit')}
                  </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 font-medium rounded-lg transition-colors"
              >
                {currentQIndex === questions.length - 1 ? "Finish" : t('next')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen Mode: Interactive */}
      <div className="print:hidden">
        {renderInteractiveScreen()}
      </div>

      {/* Print Mode: Full List */}
      <div className="hidden print:block text-black bg-white">
          <div className="space-y-6">
              {questions.map((q, idx) => {
                  const displayQ = (language === 'ar' && q.questionAr) ? q.questionAr : q.question;
                  const displayOpts = (language === 'ar' && q.optionsAr) ? q.optionsAr : q.options;

                  return (
                    <div key={idx} className="break-inside-avoid border-b border-gray-200 pb-4">
                        <div className="flex gap-2 font-bold text-lg mb-2">
                            <span>{idx + 1}.</span>
                            <span>{displayQ}</span>
                            <span className="text-xs font-normal border px-1 ml-2">{q.type || 'MCQ'}</span>
                        </div>
                        
                        {(!q.type || q.type === 'MCQ') ? (
                            <div className="pl-6 space-y-2">
                                {displayOpts?.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full border border-gray-400"></div>
                                        <span className="text-gray-800">{opt}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="pl-6 h-20 border-b border-dotted border-gray-400"></div>
                        )}
                    </div>
                  );
              })}
          </div>

          {/* Answer Key on a new page */}
          <div className="break-before-page mt-8 pt-8">
              <h2 className="text-xl font-bold mb-4 border-b border-black pb-2">{language === 'ar' ? 'مفتاح الإجابة' : 'Answer Key'}</h2>
              <div className="grid grid-cols-1 gap-y-2">
                  {questions.map((q, idx) => {
                      const displayAns = (language === 'ar' && q.correctAnswerAr) ? q.correctAnswerAr : (q.correctAnswer || (q.optionsAr && language === 'ar' ? q.optionsAr[q.correctIndex || 0] : q.options?.[q.correctIndex || 0]));
                      return (
                        <div key={idx} className="flex gap-2">
                            <span className="font-bold w-8">{idx + 1}.</span>
                            <span>{displayAns}</span>
                        </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </>
  );
};

export default Quiz;