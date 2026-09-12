import React, { useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';

interface Props {
  isActive: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FocusMode: React.FC<Props> = ({ isActive, onClose, children }) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Hide body overflow
    if (isActive) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isActive, onClose]);

  if (!isActive) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-10">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <Maximize2 size={18} />
                Focus Mode
            </div>
            <button 
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium transition-colors text-sm"
            >
                <kbd className="hidden sm:inline-block px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">ESC</kbd>
                Exit Focus
                <X size={16} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow pt-20 pb-12 overflow-y-auto w-full flex items-center justify-center">
            {children}
        </div>
    </div>
  );
};

export default FocusMode;
