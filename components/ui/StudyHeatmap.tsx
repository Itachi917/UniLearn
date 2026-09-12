import React from 'react';
import { useApp } from '../../context/AppContext';

const StudyHeatmap: React.FC = () => {
  const { progress } = useApp();
  const history = progress.activityHistory || {};

  // Generate last 90 days
  const today = new Date();
  const days = [];
  
  for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
          date: dateStr,
          minutes: history[dateStr] || 0
      });
  }

  // Calculate intensity (0-4)
  const getIntensityClass = (minutes: number) => {
      if (minutes === 0) return 'bg-gray-100 dark:bg-gray-800';
      if (minutes < 30) return 'bg-blue-200 dark:bg-blue-900/40';
      if (minutes < 60) return 'bg-blue-400 dark:bg-blue-700/60';
      if (minutes < 120) return 'bg-blue-600 dark:bg-blue-600';
      return 'bg-blue-800 dark:bg-blue-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Study Activity (Last 90 Days)</h3>
        
        <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
            {days.map((day, i) => (
                <div 
                    key={day.date}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${getIntensityClass(day.minutes)}`}
                    title={`${day.date}: ${day.minutes} mins`}
                />
            ))}
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900/40" />
            <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-700/60" />
            <div className="w-3 h-3 rounded-sm bg-blue-600 dark:bg-blue-600" />
            <div className="w-3 h-3 rounded-sm bg-blue-800 dark:bg-blue-400" />
            <span>More</span>
        </div>
    </div>
  );
};

export default StudyHeatmap;
