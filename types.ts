
export type Language = 'en' | 'ar';

export interface Flashcard {
  question: string;
  answer: string;
}

export type QuestionType = 'multiple-choice' | 'short-answer';

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple-choice
  correctIndex?: number; // For multiple-choice
  modelAnswer?: string; // For short-answer AI grading
}

export interface Lecture {
  id: string;
  title: string;
  titleAr: string;
  summary: string;
  flashcards: Flashcard[];
  quiz?: QuizQuestion[];
  topics?: string[];
}

export interface Subject {
  id: string;
  title: string;
  titleAr: string;
  level: string;
  color: string; // Tailwind color class prefix e.g. "blue"
  lectures: Lecture[];
}

export interface UserProgress {
  completedLectures: string[]; // IDs of completed lectures
  lastVisitedLectureId?: string;
  quizScores: Record<string, number>; // lectureId -> score
  enrolledSubjectIds?: string[]; // IDs of subjects the user has chosen
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
}
