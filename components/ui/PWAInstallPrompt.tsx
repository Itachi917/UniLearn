import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if they haven't dismissed it recently
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
          setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fade-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-900 p-4 max-w-sm relative flex gap-4 items-start">
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 rounded-full p-1"
        >
          <X size={16} />
        </button>
        
        <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-3 rounded-xl shrink-0">
          <Download size={24} />
        </div>
        
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Study Offline!</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
            Install UniLearn to your device to study flashcards and track streaks without an internet connection.
          </p>
          <button 
            onClick={handleInstall}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 rounded-lg transition-colors shadow-md"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
