import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Save, Edit2, BookOpen } from 'lucide-react';

interface Props {
  lectureId: string;
}

const LectureNotes: React.FC<Props> = ({ lectureId }) => {
  const { progress, saveLectureNotes, t } = useApp();
  
  const initialNotes = progress.lectureNotes?.[lectureId] || '';
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    setNotes(progress.lectureNotes?.[lectureId] || '');
  }, [lectureId, progress.lectureNotes]);

  const handleSave = () => {
    saveLectureNotes(lectureId, notes);
    setIsEditing(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen size={18} className="text-blue-500" />
                My Notes
            </h3>
            
            <div className="flex items-center gap-3">
                {saveStatus === 'saved' && (
                    <span className="text-xs text-green-500 font-medium">Saved!</span>
                )}
                
                {isEditing ? (
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Save size={14} />
                        Save
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Edit2 size={14} />
                        Edit
                    </button>
                )}
            </div>
        </div>

        <div className="p-0 h-[60vh] flex flex-col">
            {isEditing ? (
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your personal notes here... (Markdown is supported in future versions)"
                    className="w-full flex-grow p-6 bg-transparent resize-none outline-none text-gray-700 dark:text-gray-300 focus:ring-inset focus:ring-2 focus:ring-blue-500 transition-all"
                />
            ) : (
                <div className="w-full flex-grow p-6 overflow-y-auto prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    {notes ? (
                        <div className="whitespace-pre-wrap">{notes}</div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <BookOpen size={48} className="mb-4 opacity-20" />
                            <p>No notes for this lecture yet.</p>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="mt-4 text-blue-500 hover:underline"
                            >
                                Start writing
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default LectureNotes;
