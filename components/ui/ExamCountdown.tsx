import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface Props {
  subjectId: string;
}

const ExamCountdown: React.FC<Props> = ({ subjectId }) => {
  const { progress, setExamDate, subjects } = useApp();
  
  const savedDate = progress.examDates?.[subjectId];
  const [isEditing, setIsEditing] = useState(!savedDate);
  const [tempDate, setTempDate] = useState(savedDate || '');

  const subject = subjects.find(s => s.id === subjectId);
  const completedCount = subject?.lectures.filter(l => progress.completedLectures.includes(l.id)).length || 0;
  const totalCount = subject?.lectures.length || 0;

  const handleSave = () => {
    if (tempDate) {
      setExamDate(subjectId, tempDate);
      setIsEditing(false);
    }
  };

  const renderCountdown = () => {
    if (!savedDate) return null;

    const examTime = new Date(savedDate).getTime();
    const now = new Date().getTime();
    const diff = examTime - now;

    if (diff < 0) {
        return (
            <div className="flex items-center gap-2 text-red-500 font-bold bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-lg">
                <AlertCircle size={20} /> Exam has passed!
            </div>
        );
    }

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    let colorClass = 'text-green-500 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (days <= 7) colorClass = 'text-orange-500 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
    if (days <= 3) colorClass = 'text-red-500 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 animate-pulse';

    return (
        <div className="flex flex-col gap-4">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${colorClass}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-80">Exam In</h4>
                        <div className="text-2xl font-black">{days} {days === 1 ? 'Day' : 'Days'}</div>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="text-xs font-bold uppercase opacity-80 mb-1">Completion</div>
                    <div className="text-lg font-bold">{completedCount} / {totalCount}</div>
                </div>
            </div>
            
            <button 
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center gap-1"
            >
                <Clock size={12} /> Change Exam Date
            </button>
        </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Exam Countdown</h3>
        
        {isEditing ? (
            <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Set your exam date:</label>
                <input 
                    type="date" 
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                    min={new Date().toISOString().split('T')[0]}
                />
                <div className="flex gap-2">
                    <button 
                        onClick={handleSave}
                        disabled={!tempDate}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        Save
                    </button>
                    {savedDate && (
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        ) : (
            renderCountdown()
        )}
    </div>
  );
};

export default ExamCountdown;
