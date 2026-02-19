import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2, Edit, ArrowLeft, Layers, Book, BrainCircuit, Users, Database, FileJson, Check, X, AlertCircle, Sparkles, Wand2, MessageSquarePlus, UploadCloud, FileText, MessageSquare, Library, Image as ImageIcon, Video, Network } from 'lucide-react';
import { Subject, Lecture, Flashcard, QuizQuestion, FlashcardSuggestion, LectureMedia, MediaType } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import MindMapRenderer from '../components/ui/MindMapRenderer';

type ViewMode = 'SUBJECT_LIST' | 'SUBJECT_EDIT' | 'LECTURE_EDIT' | 'STUDENT_LIST' | 'SUGGESTIONS';

interface StudentData {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    completed_lectures: number;
    quiz_points: number;
    last_active: string;
    password_text?: string;
}

const AdminDashboard: React.FC = () => {
  const { subjects: contextSubjects, refreshSubjects, isAdmin } = useApp();
  
  // Content State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [view, setView] = useState<ViewMode>('SUBJECT_LIST');
  const [activeSubjectIdx, setActiveSubjectIdx] = useState<number>(-1);
  const [activeLectureIdx, setActiveLectureIdx] = useState<number>(-1);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileContextModalOpen, setIsFileContextModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ data: string; mimeType: string } | null>(null);
  const [selectedFileContextId, setSelectedFileContextId] = useState<string>(''); // '' = general bank

  // Media Upload State
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('image');

  // JSON Edit State
  const [editMode, setEditMode] = useState<'VISUAL' | 'JSON'>('VISUAL');
  const [jsonText, setJsonText] = useState('');

  // Student State
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<FlashcardSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Subject Question Bank State
  const [isQuestionBankMode, setIsQuestionBankMode] = useState(false);


  useEffect(() => {
    if (contextSubjects) {
        setSubjects(JSON.parse(JSON.stringify(contextSubjects)));
    }
  }, [contextSubjects]);

  const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
          const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
          if (pError) throw pError;

          const { data: progress, error: prError } = await supabase.from('user_progress').select('*');
          if (prError) throw prError;

          const merged: StudentData[] = profiles.map((p: any) => {
              const prog = progress.find((pr: any) => pr.user_id === p.id)?.progress_data || {};
              const completedCount = prog.completedLectures?.length || 0;
              const quizScores = prog.quizScores || {};
              const totalPoints = Object.values(quizScores).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number;

              return {
                  id: p.id,
                  email: p.email,
                  full_name: p.full_name,
                  avatar_url: p.avatar_url,
                  completed_lectures: completedCount,
                  quiz_points: totalPoints,
                  last_active: p.updated_at || 'N/A',
                  password_text: p.password_text || 'N/A'
              };
          });

          setStudents(merged);
      } catch (e) {
          console.error("Error fetching students", e);
      } finally {
          setLoadingStudents(false);
      }
  };

  const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
          const { data } = await supabase.from('app_content').select('content').eq('id', 'suggestions').maybeSingle();
          if (data && Array.isArray(data.content)) {
              setSuggestions(data.content);
          } else {
              setSuggestions([]);
          }
      } catch (e) {
          console.error("Error fetching suggestions", e);
      } finally {
          setLoadingSuggestions(false);
      }
  };

  useEffect(() => {
      if (view === 'STUDENT_LIST') {
          fetchStudents();
      } else if (view === 'SUGGESTIONS') {
          fetchSuggestions();
      }
  }, [view]);

  const saveToDatabase = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('app_content')
        .upsert({ id: 'main', content: subjects }, { onConflict: 'id' });

      if (error) throw error;
      
      try {
        await refreshSubjects();
      } catch (refErr) {
        console.warn("Saved successfully, but failed to refresh local data immediately:", refErr);
      }
      
      setMsg({ type: 'success', text: 'Changes saved successfully to database! All users will see updates shortly.' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      setMsg({ type: 'error', text: 'Failed to save: ' + (err.message || "Unknown error") });
    } finally {
      setSaving(false);
    }
  };

  const saveSuggestionsList = async (newList: FlashcardSuggestion[]) => {
      try {
          await supabase.from('app_content').upsert({
              id: 'suggestions',
              content: newList
          });
          setSuggestions(newList);
      } catch (e) {
          console.error("Error saving suggestions list", e);
          alert("Failed to update suggestions list.");
      }
  };

  const handleAcceptSuggestion = async (sugg: FlashcardSuggestion) => {
      // 1. Find the subject and lecture
      const subIdx = subjects.findIndex(s => s.id === sugg.subjectId);
      if (subIdx === -1) {
          alert("Subject not found. It might have been deleted.");
          return;
      }
      const lecIdx = subjects[subIdx].lectures.findIndex(l => l.id === sugg.lectureId);
      if (lecIdx === -1) {
          alert("Lecture not found. It might have been deleted.");
          return;
      }

      // 2. Add flashcard locally
      const newSubjects = [...subjects];
      const lecture = newSubjects[subIdx].lectures[lecIdx];
      const newCard = { question: sugg.question, answer: sugg.answer };
      lecture.flashcards = [...(lecture.flashcards || []), newCard];
      
      setSubjects(newSubjects);

      // 3. Persist Content Changes immediately to avoid data loss if admin leaves
      try {
          await supabase.from('app_content').upsert({ id: 'main', content: newSubjects }, { onConflict: 'id' });
          
          // 4. Remove from suggestions list and persist
          const newSuggestions = suggestions.filter(s => s.id !== sugg.id);
          await saveSuggestionsList(newSuggestions);
          
          setMsg({ type: 'success', text: 'Suggestion accepted and added to lecture.' });
          setTimeout(() => setMsg(null), 3000);
          refreshSubjects(); // sync context
      } catch (e) {
          console.error("Error accepting suggestion", e);
          alert("Error processing acceptance.");
      }
  };

  const handleDeclineSuggestion = async (id: string) => {
      if (!window.confirm("Are you sure you want to decline and remove this suggestion?")) return;
      const newSuggestions = suggestions.filter(s => s.id !== id);
      await saveSuggestionsList(newSuggestions);
  };

  // Robust function to clean, repair, and parse JSON from AI
  const repairAndParseJSON = (jsonStr: string) => {
    let result = '';
    let inString = false;
    let escaped = false;
    const stack: ('{' | '[')[] = [];
    let started = false;
    
    // Process character by character
    for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        
        if (inString) {
            if (escaped) {
                // Was escaped, just add current char (e.g. \" or \\ or \n)
                result += char;
                escaped = false;
            } else {
                if (char === '\\') {
                    escaped = true;
                    result += char;
                } else if (char === '"') {
                    inString = false;
                    result += char;
                } else {
                    // Inside string, unescaped char
                    if (char === '\n') result += '\\n';
                    else if (char === '\r') result += '\\r';
                    else if (char === '\t') result += '\\t';
                    // Escape unescaped control chars
                    else if (char.charCodeAt(0) < 32) {
                         // Skip other control chars to avoid JSON parse errors
                    } else {
                        result += char;
                    }
                }
            }
        } else {
            // Not in string
            if (char === '"') {
                inString = true;
                result += char;
            } else if (char === '{' || char === '[') {
                stack.push(char);
                result += char;
                started = true;
            } else if (char === '}' || char === ']') {
                if (stack.length > 0) {
                    const expected = stack[stack.length - 1];
                    if ((char === '}' && expected === '{') || (char === ']' && expected === '[')) {
                        stack.pop();
                        result += char;
                        
                        // If stack is empty and we have started, we found the end of the root object.
                        // Stop processing further characters to avoid trailing garbage (e.g. AI chatter after JSON).
                        if (stack.length === 0 && started) {
                            break; 
                        }
                    } else {
                        // Mismatched closer or stray character. 
                        // We append it, but it likely indicates a malformed response.
                        // However, we only do so if it doesn't break the structure.
                        // Actually, ignoring it is safer than appending it for parse recovery.
                    }
                } else {
                     // Extra closer at root level, ignore.
                }
            } else {
                // whitespace, colon, comma, numbers, booleans, null
                result += char;
            }
        }
    }
    
    // Repair Truncation if loop finished without clean break
    if (inString) {
        if (escaped) result = result.slice(0, -1); // Remove trailing backslash if string ended with one
        result += '"';
    }
    
    // Remove trailing comma if present (ignoring whitespace)
    result = result.replace(/,\s*$/, '');
    
    // Check if we ended with a key but no value e.g. {"key": 
    if (/:\s*$/.test(result)) {
        result += 'null';
    }

    // Close remaining open structures
    while (stack.length > 0) {
        const type = stack.pop();
        if (type === '{') result += '}';
        else if (type === '[') result += ']';
    }
    
    return JSON.parse(result);
  };

  const generateContentWithAI = async (promptContext: string, imagePart?: any, target: 'LECTURE' | 'BANK' = 'LECTURE', linkedLectureId?: string) => {
    
    let subjectTitle = subjects[activeSubjectIdx].title;
    let lectureTitle = target === 'LECTURE' ? subjects[activeSubjectIdx].lectures[activeLectureIdx].title : "General Subject Knowledge";

    setGeneratingAI(true);
    setMsg({ type: 'info', text: 'AI is analyzing and generating content... This may take a moment due to the large volume of content.' });

    try {
        const ai = new GoogleGenAI({ apiKey: (process as any).env.API_KEY });
        const isImageModel = !!imagePart;
        const modelName = isImageModel ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';
        
        let systemPrompt = "";

        if (target === 'LECTURE') {
             systemPrompt = `Generate comprehensive, high-quality university-level lecture content.
                The subject is "${subjectTitle}".
                Lecture Context: ${promptContext || lectureTitle}
                
                Requirements:
                1. Summary: Create a detailed summary in Markdown. Use headers (#, ##), bullet points, and bold text for emphasis. Ensure it covers key concepts thoroughly.
                2. Topics: List 5-8 key topics.
                3. Flashcards: Generate at least 15 high-quality flashcards.
                4. Quiz: Generate at least 10 questions. Mix Multiple Choice (MCQ) and Short Answer (SHORT) types.
                   - For MCQ, provide 4 options and the correctIndex.
                   - For SHORT, provide the main correctAnswer and a list of acceptedAnswers (variations, typos, synonyms).
                
                Output strictly valid JSON. No markdown code blocks.`;
        } else {
             systemPrompt = `Generate a robust question bank for the university subject: "${subjectTitle}".
                Context: ${promptContext || "General comprehensive review"}
                
                Requirements:
                1. Generate at least 20 high-quality questions.
                2. Mix Multiple Choice (MCQ) and Short Answer (SHORT) types (~50/50 split).
                3. Structure:
                   - For MCQ: { "type": "MCQ", "question": "...", "options": ["..."], "correctIndex": 0 }
                   - For SHORT: { "type": "SHORT", "question": "...", "correctAnswer": "Main Answer", "acceptedAnswers": ["Var1", "Var2"] }
                
                Output strictly valid JSON array of questions.`;
        }

        if (isImageModel) {
             // Simplify schema hint for image model as it doesn't support responseSchema
             systemPrompt += `\n\nReturn JSON only.`;
        }

        let contents: any;
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

        const config: any = {
            maxOutputTokens: 8192, 
        };
        
        if (!isImageModel) {
            config.responseMimeType = "application/json";
            
            if (target === 'LECTURE') {
                config.responseSchema = {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        flashcards: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } },
                                required: ['question', 'answer']
                            }
                        },
                        quiz: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ["MCQ", "SHORT"] },
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctIndex: { type: Type.INTEGER },
                                    correctAnswer: { type: Type.STRING },
                                    acceptedAnswers: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ['type', 'question']
                            }
                        }
                    },
                    required: ['summary', 'topics', 'flashcards', 'quiz']
                };
            } else {
                 config.responseSchema = {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ["MCQ", "SHORT"] },
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctIndex: { type: Type.INTEGER },
                            correctAnswer: { type: Type.STRING },
                            acceptedAnswers: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['type', 'question']
                    }
                };
            }
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: config
        });

        const text = response.text || "{}";
        const cleanedText = text.replace(/```json\s*|```/g, '').trim();

        let data;
        try {
            data = JSON.parse(cleanedText);
        } catch (parseErr: any) {
            console.warn("Standard JSON parse failed, attempting robust repair...", parseErr.message);
            data = repairAndParseJSON(cleanedText);
        }
        
        const newSubs = [...subjects];
        
        if (target === 'LECTURE') {
            const updatedLecture = {
                ...newSubs[activeSubjectIdx].lectures[activeLectureIdx],
                summary: data.summary,
                topics: data.topics,
                flashcards: data.flashcards,
                quiz: data.quiz.map((q: any, i: number) => ({ ...q, id: Date.now() + i }))
            };
            newSubs[activeSubjectIdx].lectures[activeLectureIdx] = updatedLecture;
            setMsg({ type: 'success', text: 'Lecture content generated successfully!' });
        } else {
            // Bank Generation
            const newQuestions = Array.isArray(data) ? data : [];
            const timestamp = Date.now();
            const questionsWithIds = newQuestions.map((q: any, i: number) => ({
                ...q,
                id: timestamp + i,
                lectureId: linkedLectureId || undefined 
            }));
            
            const currentBank = newSubs[activeSubjectIdx].questionBank || [];
            newSubs[activeSubjectIdx].questionBank = [...currentBank, ...questionsWithIds];
            const addedCount = newQuestions.length;
            const targetName = linkedLectureId ? subjects[activeSubjectIdx].lectures.find(l => l.id === linkedLectureId)?.title : 'Subject Bank';
            setMsg({ type: 'success', text: `Added ${addedCount} questions linked to ${targetName}.` });
        }
        
        setSubjects(newSubs);

    } catch (err: any) {
        console.error("AI Generation Error:", err);
        setMsg({ type: 'error', text: 'AI Generation failed: ' + err.message });
    } finally {
        setGeneratingAI(false);
    }
  };

  const handleAIContentGen = () => generateContentWithAI("", undefined, isQuestionBankMode ? 'BANK' : 'LECTURE');

  const handleAIContentGenFromTopic = () => {
    const topic = window.prompt("Enter a specific topic or focus:");
    if (topic) generateContentWithAI(topic, undefined, isQuestionBankMode ? 'BANK' : 'LECTURE');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const base64Data = (event.target?.result as string).split(',')[1];
          const mimeType = file.type;
          
          setPendingFile({ data: base64Data, mimeType });
          setIsFileContextModalOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
  };

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Only handle image uploads here for now (Videos usually via URL to save DB space)
      const reader = new FileReader();
      reader.onload = (event) => {
          const result = event.target?.result as string;
          addMedia('image', file.name, undefined, result); // Use result as content (Base64)
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const confirmFileUploadGeneration = async () => {
      if (!pendingFile) return;
      setIsFileContextModalOpen(false);
      
      const imagePart = {
          inlineData: {
              data: pendingFile.data,
              mimeType: pendingFile.mimeType
          }
      };
      
      // Determine target and linkage
      // If we are in LECTURE_EDIT mode, we default to that lecture context.
      // If we are in Question Bank Mode, we check the selectedFileContextId.
      let target: 'LECTURE' | 'BANK' = 'LECTURE';
      let linkedLectureId: string | undefined = undefined;

      if (isQuestionBankMode) {
          target = 'BANK';
          linkedLectureId = selectedFileContextId || undefined;
      } else {
          // If in lecture edit, target is implicitly the active lecture
          target = 'LECTURE'; 
      }

      await generateContentWithAI("Analyze the uploaded file content thoroughly. Extract all key concepts, definitions, and details to generate the requested JSON content. Ensure the output is comprehensive and directly derived from the file material.", imagePart, target, linkedLectureId);
      setPendingFile(null);
  };

  // --- HANDLERS ---
  const handleAddSubject = () => {
    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      title: 'New Subject',
      titleAr: 'مادة جديدة',
      level: 'Level-2',
      color: 'blue',
      lectures: [],
      questionBank: []
    };
    setSubjects([...subjects, newSubject]);
  };

  const handleDeleteSubject = (idx: number) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
        const newSubs = [...subjects];
        newSubs.splice(idx, 1);
        setSubjects(newSubs);
    }
  };

  const handleAddLecture = () => {
    if (activeSubjectIdx === -1) return;
    const newLecture: Lecture = {
        id: `lec-${Date.now()}`,
        title: 'New Lecture',
        titleAr: 'محاضرة جديدة',
        summary: '',
        flashcards: [],
        quiz: [],
        topics: [],
        media: []
    };
    const newSubs = [...subjects];
    newSubs[activeSubjectIdx].lectures.push(newLecture);
    setSubjects(newSubs);
  };

  const handleDeleteLecture = (lecIdx: number) => {
    if (window.confirm('Delete this lecture?')) {
        const newSubs = [...subjects];
        newSubs[activeSubjectIdx].lectures.splice(lecIdx, 1);
        setSubjects(newSubs);
    }
  };

  const addMedia = (type: MediaType, title: string = 'New Media', url?: string, content?: string) => {
      const newMedia: LectureMedia = {
          id: `media-${Date.now()}`,
          type,
          title,
          url,
          content: content || (type === 'mindmap' ? '{"label": "Central Topic", "children": [{"label": "Branch 1"}]}' : undefined)
      };
      
      const newSubs = [...subjects];
      const lecture = newSubs[activeSubjectIdx].lectures[activeLectureIdx];
      lecture.media = [...(lecture.media || []), newMedia];
      setSubjects(newSubs);
  };

  const updateMedia = (idx: number, field: keyof LectureMedia, val: any) => {
      const newSubs = [...subjects];
      const media = [...(newSubs[activeSubjectIdx].lectures[activeLectureIdx].media || [])];
      media[idx] = { ...media[idx], [field]: val };
      newSubs[activeSubjectIdx].lectures[activeLectureIdx].media = media;
      setSubjects(newSubs);
  };

  const deleteMedia = (idx: number) => {
       if (window.confirm('Delete this media item?')) {
            const newSubs = [...subjects];
            const media = [...(newSubs[activeSubjectIdx].lectures[activeLectureIdx].media || [])];
            media.splice(idx, 1);
            newSubs[activeSubjectIdx].lectures[activeLectureIdx].media = media;
            setSubjects(newSubs);
       }
  };

  // --- RENDERERS ---

  const renderSidebar = () => (
      <div className="w-full md:w-64 flex flex-col gap-2 mb-8 md:mb-0">
          <button 
            onClick={() => setView('SUBJECT_LIST')}
            className={`flex items-center gap-3 p-3 rounded-lg text-left font-medium transition-colors ${
                ['SUBJECT_LIST', 'SUBJECT_EDIT', 'LECTURE_EDIT'].includes(view)
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
              <Database size={20} />
              Content Manager
          </button>
          <button 
            onClick={() => setView('STUDENT_LIST')}
            className={`flex items-center gap-3 p-3 rounded-lg text-left font-medium transition-colors ${
                view === 'STUDENT_LIST'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
              <Users size={20} />
              Student Progress
          </button>
          <button 
            onClick={() => setView('SUGGESTIONS')}
            className={`flex items-center gap-3 p-3 rounded-lg text-left font-medium transition-colors ${
                view === 'SUGGESTIONS'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
              <MessageSquare size={20} />
              Suggestions
          </button>
      </div>
  );

  const renderSubjectList = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Subjects</h2>
            <button onClick={handleAddSubject} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus size={18} /> Add Subject
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub, idx) => (
                <div key={sub.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${sub.color}-100 text-${sub.color}-600`}>
                                <Book size={20} />
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                {sub.level.replace('-', ' ')}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{sub.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{sub.titleAr}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                            {sub.lectures.length} Lectures
                        </span>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button 
                            onClick={() => { setActiveSubjectIdx(idx); setView('SUBJECT_EDIT'); setIsQuestionBankMode(false); }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg text-sm font-medium"
                        >
                            <Edit size={16} /> Edit
                        </button>
                        <button 
                            onClick={() => handleDeleteSubject(idx)}
                            className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderSubjectEdit = () => {
    const subject = subjects[activeSubjectIdx];

    // Helper for Question Bank
    const addBankQuestion = () => {
        const newQ: QuizQuestion = { id: Date.now(), type: 'MCQ', question: '', options: ['', '', '', ''], correctIndex: 0 };
        const newSubs = [...subjects];
        newSubs[activeSubjectIdx].questionBank = [...(newSubs[activeSubjectIdx].questionBank || []), newQ];
        setSubjects(newSubs);
    };

    const updateBankQuestion = (idx: number, field: keyof QuizQuestion | 'option' | 'acceptedAnswer', val: any, subIdx?: number) => {
        const bank = [...(subjects[activeSubjectIdx].questionBank || [])];
        const q = { ...bank[idx] };

        if (field === 'option' && typeof subIdx === 'number') {
            const newOpts = [...(q.options || [])];
            newOpts[subIdx] = val;
            q.options = newOpts;
        } else if (field === 'acceptedAnswer' && typeof subIdx === 'number') {
            const newAcc = [...(q.acceptedAnswers || [])];
            newAcc[subIdx] = val;
            q.acceptedAnswers = newAcc;
        } else {
            // @ts-ignore
            q[field] = val;
        }
        
        bank[idx] = q;
        const newSubs = [...subjects];
        newSubs[activeSubjectIdx].questionBank = bank;
        setSubjects(newSubs);
    };

    const deleteBankQuestion = (idx: number) => {
        const newSubs = [...subjects];
        newSubs[activeSubjectIdx].questionBank?.splice(idx, 1);
        setSubjects(newSubs);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setView('SUBJECT_LIST')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold">Edit Subject</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Title (EN)</label>
                        <input value={subject.title} onChange={(e) => { const n = [...subjects]; n[activeSubjectIdx].title = e.target.value; setSubjects(n); }} className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Title (AR)</label>
                        <input value={subject.titleAr} onChange={(e) => { const n = [...subjects]; n[activeSubjectIdx].titleAr = e.target.value; setSubjects(n); }} className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 text-right" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Academic Level</label>
                        <select 
                            value={subject.level} 
                            onChange={(e) => { const n = [...subjects]; n[activeSubjectIdx].level = e.target.value; setSubjects(n); }}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:bg-gray-800"
                        >
                            <option value="Level-1">Level 1</option>
                            <option value="Level-2">Level 2</option>
                            <option value="Level-3">Level 3</option>
                            <option value="Level-4">Level 4</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Color Theme</label>
                        <select 
                            value={subject.color} 
                            onChange={(e) => { const n = [...subjects]; n[activeSubjectIdx].color = e.target.value; setSubjects(n); }}
                            className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 dark:bg-gray-800"
                        >
                            <option value="blue">Blue</option>
                            <option value="emerald">Emerald</option>
                            <option value="indigo">Indigo</option>
                            <option value="purple">Purple</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setIsQuestionBankMode(false)}
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${!isQuestionBankMode ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                >
                    Lectures
                </button>
                <button 
                    onClick={() => setIsQuestionBankMode(true)}
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${isQuestionBankMode ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                >
                    Question Bank
                </button>
            </div>

            {isQuestionBankMode ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><Library size={20} /> Subject Question Bank</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{subject.questionBank?.length || 0} questions</span>
                        </div>
                        <div className="flex gap-2">
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*,application/pdf,text/*"
                                className="hidden"
                            />
                            <button 
                                onClick={handleAIContentGen}
                                disabled={generatingAI}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                            >
                                <Wand2 size={16} /> AI Gen
                            </button>
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={generatingAI}
                                className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                            >
                                <UploadCloud size={16} /> AI File
                            </button>
                            <button onClick={addBankQuestion} className="text-sm flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                                <Plus size={16} /> Add Question
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {subject.questionBank?.map((q, qIdx) => (
                            <div key={q.id || qIdx} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                <div className="flex gap-2 mb-3 items-start">
                                    <select 
                                        value={q.type || 'MCQ'} 
                                        onChange={(e) => updateBankQuestion(qIdx, 'type', e.target.value)}
                                        className="p-2 text-xs border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600"
                                    >
                                        <option value="MCQ">MCQ</option>
                                        <option value="SHORT">Short Answer</option>
                                    </select>
                                    <div className="flex-1 space-y-1">
                                        <input value={q.question} onChange={(e) => updateBankQuestion(qIdx, 'question', e.target.value)} placeholder="Question" className="w-full p-2 text-sm border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-600 font-medium" />
                                        <select
                                             value={q.lectureId || ""}
                                             onChange={(e) => updateBankQuestion(qIdx, 'lectureId', e.target.value || undefined)}
                                             className="w-full p-1 text-xs border rounded text-gray-500 bg-transparent"
                                        >
                                            <option value="">General Subject Question</option>
                                            {subject.lectures.map(l => (
                                                <option key={l.id} value={l.id}>Link to: {l.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button onClick={() => deleteBankQuestion(qIdx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                </div>
                                
                                {q.type === 'SHORT' ? (
                                    <div className="space-y-2 pl-2 border-l-2 border-purple-200">
                                        <input 
                                            value={q.correctAnswer || ''} 
                                            onChange={(e) => updateBankQuestion(qIdx, 'correctAnswer', e.target.value)}
                                            placeholder="Main Correct Answer" 
                                            className="w-full p-2 text-sm border border-green-300 rounded bg-green-50 dark:bg-green-900/10 text-gray-900 dark:text-gray-100"
                                        />
                                        <div className="text-xs text-gray-500">Accepted Variations (comma separated for display, handled as array):</div>
                                        <input 
                                            value={q.acceptedAnswers?.join(', ') || ''}
                                            onChange={(e) => updateBankQuestion(qIdx, 'acceptedAnswers', e.target.value.split(',').map(s => s.trim()))}
                                            placeholder="e.g. paris, Paris, City of Lights"
                                            className="w-full p-2 text-xs border rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {q.options?.map((opt, oIdx) => (
                                            <div key={oIdx} className="relative">
                                                <input 
                                                    value={opt} 
                                                    onChange={(e) => updateBankQuestion(qIdx, 'option', e.target.value, oIdx)} 
                                                    placeholder={`Option ${oIdx+1}`} 
                                                    className={`w-full p-2 pl-8 text-sm border rounded bg-gray-50 dark:bg-gray-900 ${q.correctIndex === oIdx ? 'border-green-500 ring-1 ring-green-500' : 'dark:border-gray-600'}`} 
                                                />
                                                <button 
                                                    onClick={() => updateBankQuestion(qIdx, 'correctIndex', oIdx)}
                                                    className={`absolute left-2 top-2.5 w-4 h-4 rounded-full border ${q.correctIndex === oIdx ? 'bg-green-500 border-green-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500'}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Layers size={20} /> Lectures</h3>
                        <button onClick={handleAddLecture} className="text-sm flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200"><Plus size={16} /> Add Lecture</button>
                    </div>
                    <div className="space-y-3">
                        {subject.lectures.map((lec, idx) => (
                            <div key={lec.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <span className="font-medium text-gray-900 dark:text-white">{lec.title}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => { setActiveLectureIdx(idx); setEditMode('VISUAL'); setView('LECTURE_EDIT'); }} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteLecture(idx)} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File Upload Context Modal */}
            {isFileContextModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl p-6 relative">
                        <h3 className="text-lg font-bold mb-4">Select Content Context</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Where should the content generated from this file be added?
                        </p>
                        
                        <div className="space-y-4 mb-6">
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                <input 
                                    type="radio" 
                                    name="fileContext" 
                                    value="" 
                                    checked={selectedFileContextId === ''}
                                    onChange={() => setSelectedFileContextId('')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="block font-medium">General Subject Bank</span>
                                    <span className="text-xs text-gray-500">Questions will be added to the subject's question bank.</span>
                                </div>
                            </label>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Or Link to Specific Lecture:</p>
                                {subjects[activeSubjectIdx].lectures.map(lec => (
                                    <label key={lec.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <input 
                                            type="radio" 
                                            name="fileContext" 
                                            value={lec.id}
                                            checked={selectedFileContextId === lec.id}
                                            onChange={() => setSelectedFileContextId(lec.id)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="font-medium text-sm">{lec.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setIsFileContextModalOpen(false); setPendingFile(null); }}
                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmFileUploadGeneration}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderLectureEdit = () => {
    const lecture = subjects[activeSubjectIdx].lectures[activeLectureIdx];

    const updateLecture = (field: keyof Lecture, value: any) => {
        const newSubs = [...subjects];
        newSubs[activeSubjectIdx].lectures[activeLectureIdx] = { ...newSubs[activeSubjectIdx].lectures[activeLectureIdx], [field]: value };
        setSubjects(newSubs);
    };

    // --- JSON Logic ---
    const handleEnterJsonMode = () => {
        setJsonText(JSON.stringify(lecture, null, 2));
        setEditMode('JSON');
    };

    const handleApplyJson = () => {
        try {
            const parsed = JSON.parse(jsonText);
            const newSubs = [...subjects];
            newSubs[activeSubjectIdx].lectures[activeLectureIdx] = parsed;
            setSubjects(newSubs);
            setEditMode('VISUAL');
            setMsg({ type: 'success', text: 'JSON applied locally.' });
            setTimeout(() => setMsg(null), 3000);
        } catch (e: any) {
            setMsg({ type: 'error', text: 'Invalid JSON: ' + e.message });
        }
    };

    // --- Visual Editor Helpers ---
    const addFlashcard = () => {
        const cards = [...(lecture.flashcards || []), { question: '', answer: '' }];
        updateLecture('flashcards', cards);
    };
    const updateFlashcard = (idx: number, field: keyof Flashcard, val: string) => {
        const cards = [...lecture.flashcards];
        cards[idx] = { ...cards[idx], [field]: val };
        updateLecture('flashcards', cards);
    };
    const deleteFlashcard = (idx: number) => {
        const cards = [...lecture.flashcards];
        cards.splice(idx, 1);
        updateLecture('flashcards', cards);
    };

    const addQuizQ = () => {
        const quiz = lecture.quiz || [];
        const newQ: QuizQuestion = { id: Date.now(), type: 'MCQ', question: '', options: ['', '', '', ''], correctIndex: 0 };
        updateLecture('quiz', [...quiz, newQ]);
    };
    const updateQuizQ = (idx: number, field: keyof QuizQuestion | 'option' | 'acceptedAnswer', val: any, subIdx?: number) => {
        const quiz = [...(lecture.quiz || [])];
        if (field === 'option' && typeof subIdx === 'number') {
            quiz[idx].options![subIdx] = val;
        } else if (field === 'acceptedAnswer' && typeof subIdx === 'number') {
            const acc = [...(quiz[idx].acceptedAnswers || [])];
            acc[subIdx] = val;
            quiz[idx].acceptedAnswers = acc;
        } else {
            // @ts-ignore
            quiz[idx][field] = val;
        }
        updateLecture('quiz', quiz);
    };
    const deleteQuizQ = (idx: number) => {
        const quiz = [...(lecture.quiz || [])];
        quiz.splice(idx, 1);
        updateLecture('quiz', quiz);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('SUBJECT_EDIT')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold">
                        {editMode === 'JSON' ? 'Edit Raw JSON' : 'Edit Lecture'}
                    </h2>
                </div>

                <div className="flex gap-2">
                    {editMode === 'VISUAL' && (
                        <>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*,application/pdf,text/*"
                            className="hidden"
                        />
                         <button 
                            onClick={handleAIContentGen}
                            disabled={generatingAI}
                            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            {generatingAI ? <Sparkles size={16} className="animate-spin" /> : <Wand2 size={16} />}
                            AI Magic
                        </button>
                        <button 
                            onClick={handleAIContentGenFromTopic}
                            disabled={generatingAI}
                            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            {generatingAI ? <Sparkles size={16} className="animate-spin" /> : <MessageSquarePlus size={16} />}
                            AI from Topic
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={generatingAI}
                            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            {generatingAI ? <Sparkles size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                            AI from File
                        </button>
                        </>
                    )}
                    {editMode === 'VISUAL' ? (
                        <button 
                            onClick={handleEnterJsonMode}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <FileJson size={16} /> JSON Editor
                        </button>
                    ) : (
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setEditMode('VISUAL')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg"
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button 
                                onClick={handleApplyJson}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Check size={16} /> Apply JSON
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {editMode === 'JSON' ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <textarea 
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        className="w-full h-[600px] p-4 font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none resize-y"
                        spellCheck={false}
                    />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Title (EN)</label>
                                <input value={lecture.title} onChange={(e) => updateLecture('title', e.target.value)} placeholder="e.g. Intro to Memory Management" className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Title (AR)</label>
                                <input value={lecture.titleAr} onChange={(e) => updateLecture('titleAr', e.target.value)} placeholder="العنوان بالعربية" className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 text-right" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Topics (comma separated)</label>
                             <input value={lecture.topics?.join(', ')} onChange={(e) => updateLecture('topics', e.target.value.split(',').map(s => s.trim()))} className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Summary (Markdown Supported)</label>
                            <textarea 
                                value={lecture.summary} 
                                onChange={(e) => updateLecture('summary', e.target.value)} 
                                placeholder="# Main Point&#10;- Sub point&#10;**Bold text**" 
                                className="w-full h-72 p-4 border rounded-lg bg-transparent dark:border-gray-600 font-mono text-sm leading-relaxed" 
                            />
                            <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                                <span># Header</span>
                                <span>- List</span>
                                <span>**Bold**</span>
                                <span>*Italic*</span>
                            </div>
                        </div>
                    </div>

                    {/* Media Management Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white"><Network size={18}/> Lecture Media</h3>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={activeMediaType} 
                                    onChange={(e) => setActiveMediaType(e.target.value as MediaType)}
                                    className="text-xs p-1.5 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                    <option value="mindmap">Mind Map (JSON)</option>
                                </select>
                                <button 
                                    onClick={() => {
                                        if (activeMediaType === 'image') mediaInputRef.current?.click();
                                        else addMedia(activeMediaType, `New ${activeMediaType}`);
                                    }} 
                                    className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add {activeMediaType === 'mindmap' ? 'Map' : activeMediaType.charAt(0).toUpperCase() + activeMediaType.slice(1)}
                                </button>
                                <input 
                                    type="file" 
                                    ref={mediaInputRef} 
                                    onChange={handleMediaFileChange} 
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {!lecture.media || lecture.media.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No media added yet.</p>
                            ) : (
                                lecture.media.map((item, idx) => (
                                    <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                {item.type === 'video' ? <Video size={16} className="text-red-500" /> : item.type === 'image' ? <ImageIcon size={16} className="text-blue-500" /> : <Network size={16} className="text-purple-500" />}
                                                <input 
                                                    value={item.title} 
                                                    onChange={(e) => updateMedia(idx, 'title', e.target.value)}
                                                    className="font-medium bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm w-40 sm:w-64"
                                                    placeholder="Media Title"
                                                />
                                            </div>
                                            <button onClick={() => deleteMedia(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>

                                        {item.type === 'video' && (
                                            <div>
                                                <input 
                                                    value={item.url || ''} 
                                                    onChange={(e) => updateMedia(idx, 'url', e.target.value)}
                                                    placeholder="YouTube URL or Video Link"
                                                    className="w-full p-2 text-xs border rounded bg-white dark:bg-gray-800 dark:border-gray-600 mb-2"
                                                />
                                                {item.url && (
                                                    <div className="text-xs text-gray-500">Preview available in lecture room.</div>
                                                )}
                                            </div>
                                        )}

                                        {item.type === 'image' && (
                                            <div className="flex gap-4 items-center">
                                                {item.content ? (
                                                    <img src={item.content} alt="preview" className="w-20 h-20 object-cover rounded border" />
                                                ) : (
                                                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 mb-2">Image stored as Base64.</p>
                                                    {/* Option to re-upload could go here */}
                                                </div>
                                            </div>
                                        )}

                                        {item.type === 'mindmap' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">JSON Structure</label>
                                                    <textarea 
                                                        value={item.content} 
                                                        onChange={(e) => updateMedia(idx, 'content', e.target.value)}
                                                        className="w-full h-32 p-2 text-xs font-mono border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
                                                    />
                                                </div>
                                                <div className="border rounded bg-white dark:bg-gray-800 p-2 overflow-hidden h-32">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Preview</label>
                                                    <div className="transform scale-50 origin-top-left w-[200%]">
                                                        <MindMapRenderer data={item.content || '{}'} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Flashcards */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white"><Layers size={18}/> Flashcards</h3>
                            <button onClick={addFlashcard} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded hover:bg-blue-100 transition-colors">+ Add Manual</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {lecture.flashcards?.map((card, idx) => (
                                <div key={idx} className="flex gap-2 items-start p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 group">
                                    <div className="flex-1 space-y-2">
                                        <textarea value={card.question} onChange={(e) => updateFlashcard(idx, 'question', e.target.value)} placeholder="Question" className="w-full p-1.5 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600 resize-none h-16" />
                                        <textarea value={card.answer} onChange={(e) => updateFlashcard(idx, 'answer', e.target.value)} placeholder="Answer" className="w-full p-1.5 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600 resize-none h-16" />
                                    </div>
                                    <button onClick={() => deleteFlashcard(idx)} className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quiz */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white"><BrainCircuit size={18}/> Quiz Questions</h3>
                            <button onClick={addQuizQ} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded hover:bg-blue-100 transition-colors">+ Add Manual</button>
                        </div>
                        <div className="space-y-4">
                            {lecture.quiz?.map((q, qIdx) => (
                                <div key={q.id || qIdx} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 group relative">
                                    <div className="flex gap-2 mb-3 items-center">
                                        <select 
                                            value={q.type || 'MCQ'} 
                                            onChange={(e) => updateQuizQ(qIdx, 'type', e.target.value)}
                                            className="p-2 text-xs border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
                                        >
                                            <option value="MCQ">MCQ</option>
                                            <option value="SHORT">Short</option>
                                        </select>
                                        <input value={q.question} onChange={(e) => updateQuizQ(qIdx, 'question', e.target.value)} placeholder="Question" className="flex-1 p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600 font-medium" />
                                        <button onClick={() => deleteQuizQ(qIdx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                    </div>
                                    
                                    {q.type === 'SHORT' ? (
                                        <div className="space-y-2 pl-2 border-l-2 border-purple-200">
                                            <input 
                                                value={q.correctAnswer || ''} 
                                                onChange={(e) => updateQuizQ(qIdx, 'correctAnswer', e.target.value)}
                                                placeholder="Main Correct Answer" 
                                                className="w-full p-2 text-sm border border-green-300 rounded bg-green-50 dark:bg-green-900/10 text-gray-900 dark:text-gray-100"
                                            />
                                            <div className="text-xs text-gray-500">Accepted Variations:</div>
                                            <input 
                                                value={q.acceptedAnswers?.join(', ') || ''}
                                                onChange={(e) => updateQuizQ(qIdx, 'acceptedAnswers', e.target.value.split(',').map(s => s.trim()))}
                                                placeholder="e.g. paris, Paris, City of Lights"
                                                className="w-full p-2 text-xs border rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {q.options?.map((opt, oIdx) => (
                                                <div key={oIdx} className="relative">
                                                    <input 
                                                        value={opt} 
                                                        onChange={(e) => updateQuizQ(qIdx, 'option', e.target.value, oIdx)} 
                                                        placeholder={`Option ${oIdx+1}`} 
                                                        className={`w-full p-2 pl-8 text-sm border rounded bg-white dark:bg-gray-800 ${q.correctIndex === oIdx ? 'border-green-500 ring-1 ring-green-500' : 'dark:border-gray-600'}`} 
                                                    />
                                                    <button 
                                                        onClick={() => updateQuizQ(qIdx, 'correctIndex', oIdx)}
                                                        className={`absolute left-2 top-2.5 w-4 h-4 rounded-full border ${q.correctIndex === oIdx ? 'bg-green-500 border-green-600' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500'}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* File Upload Context Modal */}
            {isFileContextModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl p-6 relative">
                        <h3 className="text-lg font-bold mb-4">Select Content Context</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Where should the content generated from this file be added?
                        </p>
                        
                        <div className="space-y-4 mb-6">
                            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                <input 
                                    type="radio" 
                                    name="fileContext" 
                                    value="" 
                                    checked={selectedFileContextId === ''}
                                    onChange={() => setSelectedFileContextId('')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="block font-medium">General Subject Bank</span>
                                    <span className="text-xs text-gray-500">Questions will be added to the subject's question bank.</span>
                                </div>
                            </label>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Or Link to Specific Lecture:</p>
                                {subjects[activeSubjectIdx].lectures.map(lec => (
                                    <label key={lec.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <input 
                                            type="radio" 
                                            name="fileContext" 
                                            value={lec.id}
                                            checked={selectedFileContextId === lec.id}
                                            onChange={() => setSelectedFileContextId(lec.id)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="font-medium text-sm">{lec.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setIsFileContextModalOpen(false); setPendingFile(null); }}
                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmFileUploadGeneration}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderStudentList = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Registered Students</h2>
              <button onClick={fetchStudents} className="text-sm text-blue-600 hover:underline">Refresh List</button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-medium">
                          <tr>
                              <th className="px-6 py-4">Student</th>
                              <th className="px-6 py-4">Password (Admin View)</th>
                              <th className="px-6 py-4">Completed</th>
                              <th className="px-6 py-4">Quiz Points</th>
                              <th className="px-6 py-4">Last Active</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {loadingStudents ? (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading data...</td></tr>
                          ) : students.length === 0 ? (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No students found.</td></tr>
                          ) : (
                              students.map(std => (
                                  <tr key={std.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              {std.avatar_url ? (
                                                  <img src={std.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                                              ) : (
                                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                      {std.full_name?.[0] || std.email[0]}
                                                  </div>
                                              )}
                                              <div>
                                                  <div className="font-medium text-gray-900 dark:text-white">{std.full_name || 'No Name'}</div>
                                                  <div className="text-xs text-gray-500">{std.email}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-xs text-gray-500 select-all">
                                          {std.password_text}
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                              {std.completed_lectures} Lectures
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">
                                          {std.quiz_points}
                                      </td>
                                      <td className="px-6 py-4 text-gray-500 text-xs">
                                          {new Date(std.last_active).toLocaleDateString()}
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const renderSuggestionsList = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Flashcard Suggestions</h2>
              <button onClick={fetchSuggestions} className="text-sm text-blue-600 hover:underline">Refresh List</button>
          </div>
          
          <div className="space-y-4">
              {loadingSuggestions ? (
                  <div className="text-center py-12 text-gray-500">Loading suggestions...</div>
              ) : suggestions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      No pending suggestions.
                  </div>
              ) : (
                  suggestions.map(sugg => (
                      <div key={sugg.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{sugg.lectureTitle}</div>
                                  <div className="text-xs text-gray-500">Suggested by <span className="font-medium text-gray-900 dark:text-white">{sugg.userName}</span> on {new Date(sugg.timestamp).toLocaleDateString()}</div>
                              </div>
                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => handleAcceptSuggestion(sugg)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 text-sm font-medium"
                                  >
                                      <Check size={16} /> Accept
                                  </button>
                                  <button 
                                      onClick={() => handleDeclineSuggestion(sugg.id)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium"
                                  >
                                      <X size={16} /> Decline
                                  </button>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">Question</div>
                                  <div className="text-gray-900 dark:text-white text-sm">{sugg.question}</div>
                              </div>
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                  <div className="text-xs font-bold text-blue-500 uppercase mb-2">Answer</div>
                                  <div className="text-gray-900 dark:text-white text-sm">{sugg.answer}</div>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
  );

  if (!isAdmin) {
    return <div className="p-12 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 relative">
      <Navbar />
      
      {/* Fixed Toast Notification */}
      {msg && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up border ${
            msg.type === 'success' 
            ? 'bg-green-600 text-white border-green-700' 
            : msg.type === 'info'
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-red-600 text-white border-red-700'
        }`}>
            {msg.type === 'success' ? <Check size={24} /> : msg.type === 'info' ? <Sparkles size={24} className="animate-pulse" /> : <AlertCircle size={24} />}
            <span className="font-medium">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="ml-2 opacity-70 hover:opacity-100">
                <X size={16} />
            </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sticky top-16 z-40 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-4 border-b border-gray-200 dark:border-gray-700 mb-8 flex justify-between items-center transition-all">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            </div>
            
            {['SUBJECT_LIST', 'SUBJECT_EDIT', 'LECTURE_EDIT'].includes(view) && (
                <button 
                    onClick={saveToDatabase}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-sm transition-all ${
                        saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-lg'
                    }`}
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <><Save size={18} /> Save Content Changes</>
                    )}
                </button>
            )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
            {renderSidebar()}
            
            <div className="flex-1">
                {view === 'SUBJECT_LIST' && renderSubjectList()}
                {view === 'SUBJECT_EDIT' && activeSubjectIdx !== -1 && renderSubjectEdit()}
                {view === 'LECTURE_EDIT' && activeLectureIdx !== -1 && renderLectureEdit()}
                {view === 'STUDENT_LIST' && renderStudentList()}
                {view === 'SUGGESTIONS' && renderSuggestionsList()}
            </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
