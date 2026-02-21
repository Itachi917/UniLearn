
export type Language = 'en' | 'ar';

export interface Flashcard {
  question: string;
  questionAr?: string;
  answer: string;
  answerAr?: string;
}

export interface QuizQuestion {
  id: number;
  type: 'MCQ' | 'SHORT'; 
  question: string;
  questionAr?: string;
  // For MCQ
  options?: string[];
  optionsAr?: string[];
  correctIndex?: number;
  // For Short Answer
  correctAnswer?: string; // The display answer
  correctAnswerAr?: string;
  acceptedAnswers?: string[]; // Variations for auto-marking
  acceptedAnswersAr?: string[];
  // Metadata
  lectureId?: string; // To link specific questions to lectures within the subject bank
}

export type MediaType = 'video' | 'image' | 'mindmap';

export interface LectureMedia {
  id: string;
  type: MediaType;
  title: string;
  url?: string; // For videos or external images
  content?: string; // Base64 for images, or JSON string for mindmaps
}

export interface Lecture {
  id: string;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr?: string;
  flashcards: Flashcard[];
  quiz?: QuizQuestion[];
  topics?: string[];
  media?: LectureMedia[];
}

export interface Subject {
  id: string;
  title: string;
  titleAr: string;
  level: string;
  color: string; // Tailwind color class prefix e.g. "blue"
  lectures: Lecture[];
  questionBank?: QuizQuestion[]; // Dedicated subject-wide questions
}

export interface UserProgress {
  completedLectures: string[]; // IDs of completed lectures
  lastVisitedLectureId?: string;
  quizScores: Record<string, number>; // lectureId -> score
  enrolledSubjectIds?: string[]; // IDs of subjects the user has chosen
  
  // Gamification & Tracking
  studyStreak?: number; // Current streak in days
  lastStudyDate?: string; // ISO String of last active day
  totalStudyMinutes?: number; // Total minutes spent in LectureRoom
}

export interface User {
  uid: string;
  email: string | null;
  isGuest: boolean;
  name?: string;
  avatarUrl?: string;
}

export interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  password_text?: string;
}

export interface FlashcardSuggestion {
  id: string;
  userId: string;
  userName: string;
  subjectId: string;
  lectureId: string;
  lectureTitle: string;
  question: string;
  answer: string;
  timestamp: string;
}

export interface AppTheme {
  id: string;
  name: string;
  colors: {
    primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    surface?: {
        50: string; // Page Background
        800: string; // Dark mode background
        900: string;
    };
    card?: string; // Component Background
  };
  backgroundImage?: string;
  isTransparent?: boolean; // If true, make backgrounds semi-transparent
}
