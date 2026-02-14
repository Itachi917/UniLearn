import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../../types';
import { useApp } from '../../context/AppContext';
import { CheckCircle, XCircle, Timer, Clock, Play, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

interface Props {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const Quiz: React.FC<Props> = ({ questions, onComplete }) => {
  const { t } = useApp();
  
  // Setup State
  const [hasStarted, setHasStarted] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(0); 
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Multiple Choice State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Short Answer State
  const [textAnswer, setTextAnswer] = useState('');
  const [aiFeedback, setAiFeedback] = useState<{correct: boolean, feedback: string} | null>(null);
  const [isMarking, setIsMarking] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (hasStarted && timeLeft !== null && timeLeft > 0 && !completed) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
             finishQuiz(true); 
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
    onComplete(score); 
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const question = questions[currentQIndex];

  const markShortAnswer = async (userAns: string, modelAns: string) => {
      setIsMarking(true);
      try {
          const ai = new GoogleGenAI({ apiKey: 'AIzaSyCkoVKHYFUXNwmIKGN2LEyRFX4Tqy6SAhY' });
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Evaluate the student's answer.
              Question: "${question.question}"
              Model Answer: "${modelAns}"
              Student Answer: "${userAns}"
              
              Task: Determine if the student answer is essentially correct based on the model answer.
              Provide a JSON response: { "correct": boolean, "feedback": "very short explanation (1 sentence)" }`,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          correct: { type: Type.BOOLEAN },
                          feedback: { type: Type.STRING }
                      }
                  }
              }
          });
          
          const result = JSON.parse(response.text);
          setAiFeedback(result);
          if (result.correct) {
              setScore(s => s + 1);
          }
      } catch (e) {
          console.error("AI Marking Error", e);
          setAiFeedback({ correct: false, feedback: "Error grading answer. Please try again." });
      } finally {
          setIsMarking(false);
          setIsSubmitted(true);
      }
  };

  const handleSubmit = () => {
    if (question.type === 'multiple-choice') {
        if (selectedOption === null) return;
        const isCorrect = selectedOption === question.correctIndex;
        if (isCorrect) setScore(s => s + 1);
        setIsSubmitted(true);
    } else {
        // Short Answer
        if (!textAnswer.trim()) return;
        markShortAnswer(textAnswer, question.modelAnswer || "Correctly answer the question.");
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setTextAnswer('');
      setAiFeedback(null);
      setIsSubmitted(false);
    } else {
      finishQuiz();
    }
  };

  // --- RENDER: SETUP ---
  if (!hasStarted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
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
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
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
                setAiFeedback(null);
                setHasStarted(false); 
            }}
            className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
            Retry Quiz
        </button>
      </div>
    );
  }

  // --- RENDER: ACTIVE QUIZ ---
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with Progress & Timer */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Question {currentQIndex + 1} of {questions.length}
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
        <h3 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            {question.question}
        </h3>

        {/* Question Type Logic */}
        {question.type === 'multiple-choice' ? (
            <div className="space-y-3">
            {question.options?.map((opt, idx) => {
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
        ) : (
            // Short Answer Input
            <div className="space-y-4">
                <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    disabled={isSubmitted || isMarking}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70"
                />
                
                {isMarking && (
                    <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                        <Sparkles size={18} />
                        <span className="font-medium">AI is grading your answer...</span>
                    </div>
                )}
                
                {aiFeedback && (
                    <div className={`p-4 rounded-lg border ${
                        aiFeedback.correct 
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' 
                        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
                    }`}>
                        <div className="flex items-center gap-2 font-bold mb-1">
                            {aiFeedback.correct ? <CheckCircle size={18} /> : <XCircle size={18} />}
                            {aiFeedback.correct ? t('correct') : t('incorrect')}
                        </div>
                        <p className="text-sm">{aiFeedback.feedback}</p>
                    </div>
                )}
            </div>
        )}

        <div className="mt-8 flex justify-end">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={question.type === 'multiple-choice' ? selectedOption === null : (!textAnswer.trim() || isMarking)}
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
        
        {isSubmitted && question.type === 'multiple-choice' && (
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