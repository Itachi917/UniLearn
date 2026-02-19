import Fuse from 'fuse.js';

export function gradeShortAnswer(userAnswer: string, correctAnswers: string[]): { correct: boolean; score: number } {
  if (!userAnswer || !correctAnswers || !correctAnswers.length) return { correct: false, score: 0 };

  const normalizedUser = userAnswer.trim().toLowerCase().replace(/[^\w\s]/g, ''); // remove punctuation

  // First try exact match (fastest)
  if (correctAnswers.some(ans => ans.toLowerCase().trim() === normalizedUser)) {
    return { correct: true, score: 100 };
  }

  // Fuzzy match with Fuse.js (handles typos like "paris" → "pariss")
  const fuse = new Fuse(correctAnswers.map(a => ({ text: a })), {
    keys: ['text'],
    threshold: 0.4,     // 0.0 = exact, 0.4 = quite forgiving
    ignoreCase: true,
  });

  const result = fuse.search(normalizedUser);
  
  // Fuse returns matches with a score (0 is perfect, 1 is no match)
  const bestMatch = result.length > 0 ? result[0] : null;
  const matchScore = bestMatch?.score || 1;
  const isCorrect = matchScore < 0.4; // Corresponds to threshold

  return {
    correct: isCorrect,
    score: isCorrect ? 1 : 0 // Simplified: 1 (True) or 0 (False) for quiz logic
  };
}