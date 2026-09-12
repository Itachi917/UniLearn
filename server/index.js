import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

// Load environment variables from .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large payloads (e.g. base64 images)

// --- Simple Rate Limiting ---
const rateLimits = new Map();
const MAX_REQUESTS_PER_MINUTE = process.env.AI_MAX_REQUESTS_PER_MINUTE || 15;

const checkRateLimit = (ip) => {
  const now = Date.now();
  const windowStart = now - 60 * 1000;
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, startTime: now });
    return true;
  }
  
  const record = rateLimits.get(ip);
  if (record.startTime < windowStart) {
    // Reset window
    record.count = 1;
    record.startTime = now;
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  record.count += 1;
  return true;
};

// --- API Endpoints ---
app.post('/api/chat', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      success: false,
      error: "لقد وصلت إلى حد الاستخدام المؤقت. حاول مرة أخرى لاحقًا. (You've reached the temporary usage limit. Please try again later.)",
      provider: 'none'
    });
  }

  const { messages, systemInstruction, temperature, model = 'gemini-3-flash-preview' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: "Invalid messages format" });
  }

  const timeoutMs = 15000; // 15 seconds timeout for Gemini

  // 1. Try Gemini First
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
    
    // Map messages to Gemini format
    const geminiMessages = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Promise wrapper for timeout
    const geminiPromise = ai.models.generateContent({
      model: model,
      contents: geminiMessages,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature || 0.2
      }
    });

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini Timeout')), timeoutMs));
    
    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const botText = response.text || "";

    return res.json({
      success: true,
      content: botText,
      provider: 'gemini'
    });

  } catch (geminiError) {
    console.error("Gemini failed, falling back to Groq:", geminiError.message);
    
    // 2. Fallback to Groq
    try {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        throw new Error("GROQ_API_KEY is missing from server environment");
      }

      const groq = new Groq({ apiKey: groqKey });
      
      // Map messages to Groq (OpenAI) format
      const groqMessages = [];
      if (systemInstruction) {
        groqMessages.push({ role: 'system', content: systemInstruction });
      }
      
      messages.forEach(m => {
        groqMessages.push({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.content
        });
      });

      const completion = await groq.chat.completions.create({
        messages: groqMessages,
        model: "llama-3.1-8b-instant", // Supported Groq fast fallback model
        temperature: temperature || 0.2,
      });

      const botText = completion.choices[0]?.message?.content || "";

      return res.json({
        success: true,
        content: botText,
        provider: 'groq'
      });
      
    } catch (groqError) {
      console.error("Groq fallback also failed:", groqError.message);
      return res.status(500).json({
        success: false,
        error: "An error occurred connecting to the AI services. Please try again later.",
        provider: 'none'
      });
    }
  }
});

app.post('/api/generate', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ success: false, error: "Rate limit exceeded" });
  }

  const { target, subjectTitle, lectureTitle, promptContext, imagePart } = req.body;
  const isImageModel = !!imagePart;
  const modelName = isImageModel ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';

  let systemPrompt = "";
  if (target === 'LECTURE') {
       systemPrompt = `Generate comprehensive, high-quality university-level lecture content in BOTH English and Arabic.
          The subject is "${subjectTitle}".
          Lecture Context: ${promptContext || lectureTitle}
          
          Requirements:
          1. Summary: Create a detailed summary in Markdown (field: summary) and its Arabic translation (field: summaryAr). Use headers (#, ##), bullet points, and bold text for emphasis. Ensure it covers key concepts thoroughly.
          2. Topics: List 5-8 key topics (English only).
          3. Flashcards: Generate at least 15 high-quality flashcards. Each card must have:
             - question (English)
             - questionAr (Arabic)
             - answer (English)
             - answerAr (Arabic)
          4. Quiz: Generate at least 10 questions. Mix Multiple Choice (MCQ) and Short Answer (SHORT) types.
             - For MCQ, provide 4 options (options) and their Arabic translations (optionsAr), and the correctIndex.
             - For SHORT, provide the main correctAnswer (English) and correctAnswerAr (Arabic), and a list of acceptedAnswers (variations, typos, synonyms in English).`;
  } else if (target === 'BANK') {
       systemPrompt = `Generate a comprehensive Question Bank in BOTH English and Arabic.
          The subject is "${subjectTitle}".
          Context: ${promptContext || "General comprehensive review"}
          
          Requirements:
          1. Generate at least 20 high-quality questions.
          2. Mix Multiple Choice (MCQ) and Short Answer (SHORT) types (~50/50 split).
          3. Structure:
             - For MCQ: { "type": "MCQ", "question": "...", "questionAr": "...", "options": ["..."], "optionsAr": ["..."], "correctIndex": 0 }
             - For SHORT: { "type": "SHORT", "question": "...", "questionAr": "...", "correctAnswer": "...", "correctAnswerAr": "...", "acceptedAnswers": ["..."] }
          
          Output strictly valid JSON array of questions.`;
  } else if (target === 'TRANSLATE_LECTURE') {
       systemPrompt = `Translate the following university lecture content from English to Arabic.
          Maintain the Markdown formatting for the summary.
          Ensure the translation is accurate and uses appropriate academic terminology.
          
          Content to translate:
          1. Summary: ${req.body.lectureSummary}
          2. Flashcards: ${req.body.lectureFlashcards}
          3. Quiz: ${req.body.lectureQuiz}
          
          Output STRICTLY valid JSON with the following structure:
          {
            "summaryAr": "...",
            "flashcards": [{ "questionAr": "...", "answerAr": "..." }],
            "quiz": [{ "questionAr": "...", "optionsAr": ["..."], "correctAnswerAr": "..." }]
          }`;
  }

  if (isImageModel) {
       systemPrompt += `\n\nReturn JSON only.`;
  }

  let contents;
  if (imagePart) {
       contents = {
          parts: [
              imagePart,
              { text: systemPrompt }
          ]
      };
  } else {
       contents = systemPrompt;
  }

  const config = {
      maxOutputTokens: 8192, 
  };
  
  if (!isImageModel) {
      config.responseMimeType = "application/json";
      // We rely on standard text instructions for schema to keep the proxy generic
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
    });

    const text = response.text || "{}";
    
    // Attempt parsing strictly
    return res.json({ success: true, content: text });
  } catch (error) {
    console.error("Generate API Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`UniLearn secure AI backend listening on port ${port}`);
});
