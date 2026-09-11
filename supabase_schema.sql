-- Supabase Relational Schema for UniLearn Pro
-- Run this in the Supabase SQL Editor to initialize the new high-performance architecture.

-- 1. Subjects Table
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  icon TEXT DEFAULT 'Book',
  level TEXT DEFAULT 'Freshman',
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Lectures Table
CREATE TABLE lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  summary TEXT,
  summary_ar TEXT,
  topics TEXT[],
  is_locked BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Flashcards Table
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_ar TEXT,
  answer TEXT NOT NULL,
  answer_ar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Quiz Questions Table (used for both lecture quizzes and subject question banks)
CREATE TABLE quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE, -- If it's a general subject bank question
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE, -- If it belongs strictly to a lecture quiz
  type TEXT CHECK (type IN ('MCQ', 'SHORT')) NOT NULL,
  question TEXT NOT NULL,
  question_ar TEXT,
  options TEXT[], -- JSON array of strings
  options_ar TEXT[],
  correct_index INTEGER,
  correct_answer TEXT,
  correct_answer_ar TEXT,
  accepted_answers TEXT[],
  explanation TEXT,
  explanation_ar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Media Table
CREATE TABLE media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('video', 'image', 'document', 'link')) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
-- Allow anyone to read
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow admins all subjects" ON subjects USING (auth.role() = 'authenticated'); -- Needs specific admin check in prod

ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read lectures" ON lectures FOR SELECT USING (true);
CREATE POLICY "Allow admins all lectures" ON lectures USING (auth.role() = 'authenticated');

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read flashcards" ON flashcards FOR SELECT USING (true);
CREATE POLICY "Allow admins all flashcards" ON flashcards USING (auth.role() = 'authenticated');

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read quiz" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow admins all quiz" ON quiz_questions USING (auth.role() = 'authenticated');

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read media" ON media FOR SELECT USING (true);
CREATE POLICY "Allow admins all media" ON media USING (auth.role() = 'authenticated');
