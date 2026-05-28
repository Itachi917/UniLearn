import { Subject, Lecture, AppTheme } from './types';

// THEMES CONFIGURATION
export const APP_THEMES: AppTheme[] = [
  {
    id: 'default',
    name: 'Default Blue',
    colors: {
      primary: {
        50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
        500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
      }
    },
    isTransparent: false
  },
  {
    id: 'pink-bow',
    name: 'Pink Dream',
    // Updated wallpaper as requested
    backgroundImage: 'https://img.freepik.com/free-vector/pink-lips-with-pink-ribbon-pink-bow_306501-911.jpg?t=st=1771249244~exp=1771252844~hmac=c91f15dec82aa242ca6d69e49cbb593037415bd513d6fb7a5bf88d0e92c1bc54', 
    colors: {
      primary: {
        50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6',
        500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843',
      },
      surface: {
        50: 'rgba(255, 240, 245, 0.4)', // Very transparent page bg to show wallpaper
        800: 'rgba(157, 23, 77, 0.8)',
        900: 'rgba(131, 24, 67, 0.9)'
      },
      card: 'rgba(255, 255, 255, 0.85)' // Semi-transparent white/pinkish cards
    },
    isTransparent: true
  },
  {
    id: 'midnight',
    name: 'Cyber Neon',
    backgroundImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070', // Neon Cyberpunk
    colors: {
      primary: {
        50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
        500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95',
      },
      surface: {
        50: 'rgba(20, 20, 30, 0.8)',
        800: 'rgba(30, 30, 40, 0.8)',
        900: 'rgba(15, 15, 25, 0.9)'
      },
      card: 'rgba(30, 27, 75, 0.7)'
    },
    isTransparent: true
  },
  {
    id: 'forest',
    name: 'Zen Forest',
    backgroundImage: 'https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?q=80&w=2070', // Green Forest
    colors: {
        primary: {
            50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
            500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        }
    },
    isTransparent: true
  }
];


export const TRANSLATIONS = {
  en: {
    login: "Log In",
    continueGuest: "Continue as Guest",
    email: "Email Address",
    password: "Password",
    welcome: "Welcome back",
    selectLevel: "Select Your Level",
    myProgress: "My Progress",
    subjects: "Subjects",
    lectures: "Lectures",
    summary: "Summary",
    flashcards: "Flashcards",
    quiz: "Quiz",
    topics: "Topics Covered",
    next: "Next",
    previous: "Previous",
    flip: "Click to flip",
    search: "Search subjects, lectures...",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    signOut: "Sign Out",
    completed: "Completed",
    notCompleted: "Not Completed",
    score: "Your Score",
    submit: "Submit",
    correct: "Correct!",
    incorrect: "Incorrect. Try again.",
    locked: "Log in to save progress",
    guestMode: "Guest Mode",
    guestWarning: "Progress is not saved in Guest Mode.",
    level1: "Level 1",
    level2: "Level 2",
    level3: "Level 3",
    level4: "Level 4",
    dashboard: "Dashboard",
    unir: "Unir",
    backToSubjects: "Back to Subjects",
    backToLevels: "Back to Levels",
    manageSubjects: "Manage Subjects",
    welcomeTitle: "Welcome to UniLearn!",
    selectSubjectsPrompt: "Please select the subjects you are currently enrolled in to personalize your dashboard.",
    startLearning: "Start Learning",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    // Landing Page
    createAccount: "Create Account",
    signUp: "Sign Up",
    fullName: "Full Name",
    googleSignUp: "Sign up with Google",
    googleSignIn: "Sign in with Google",
    or: "or",
    landingTitle: "UniLearn Pro",
    landingSubtitle: "Advanced e-learning platform for university students. Learn, practice, and excel.",
    rightsReserved: "All rights reserved.",
    checkingSession: "Checking your session...",
    takingTooLong: "Taking too long? Click here to refresh",
    authFailed: "Authentication failed",
    accountCreated: "Account created successfully! You can now log in.",
    // Theme
    theme: "Theme",
    selectTheme: "Select Theme",
  },
  ar: {
    login: "تسجيل الدخول",
    continueGuest: "المتابعة كضيف",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    welcome: "مرحباً بعودتك",
    selectLevel: "اختر المستوى",
    myProgress: "تقدمي",
    subjects: "المواد الدراسية",
    lectures: "المحاضرات",
    summary: "الملخص",
    flashcards: "البطاقات التعليمية",
    quiz: "اختبار",
    topics: "المواضيع",
    next: "التالي",
    previous: "السابق",
    flip: "انقر للقلب",
    search: "بحث في المواد والمحاضرات...",
    darkMode: "الوضع الليلي",
    lightMode: "الوضع النهاري",
    signOut: "تسجيل الخروج",
    completed: "مكتمل",
    notCompleted: "غير مكتمل",
    score: "نتيجتك",
    submit: "إرسال",
    correct: "إجابة صحيحة!",
    incorrect: "إجابة خاطئة. حاول مرة أخرى.",
    locked: "سجل الدخول لحفظ التقدم",
    guestMode: "وضع الضيف",
    guestWarning: "لا يتم حفظ التقدم في وضع الضيف.",
    level1: "المستوى 1",
    level2: "المستوى 2",
    level3: "المستوى 3",
    level4: "المستوى 4",
    unir: "متطلب جامعي",
    dashboard: "لوحة التحكم",
    backToSubjects: "العودة للمواد",
    backToLevels: "العودة للمستويات",
    manageSubjects: "إدارة المواد",
    welcomeTitle: "مرحباً بك في UniLearn!",
    selectSubjectsPrompt: "يرجى اختيار المواد المسجلة حالياً لتخصيص لوحة التحكم الخاصة بك.",
    startLearning: "ابدأ التعلم",
    selectAll: "تحديد الكل",
    deselectAll: "إلغاء تحديد الكل",
    // Landing Page
    createAccount: "إنشاء حساب",
    signUp: "إنشاء حساب",
    fullName: "الاسم الكامل",
    googleSignUp: "التسجيل باستخدام Google",
    googleSignIn: "تسجيل الدخول باستخدام Google",
    or: "أو",
    landingTitle: "UniLearn Pro",
    landingSubtitle: "منصة تعليمية متطورة للطلاب الجامعيين. تعلم، تدرب، وتفوق.",
    rightsReserved: "جميع الحقوق محفوظة.",
    checkingSession: "جاري التحقق من الجلسة...",
    takingTooLong: "هل استغرق الأمر وقتاً طويلاً؟ انقر هنا للتحديث",
    authFailed: "فشلت عملية المصادقة",
    accountCreated: "تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.",
    theme: "المظهر",
    selectTheme: "اختر المظهر",
  }
};
