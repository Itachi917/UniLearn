import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash2, Edit, ArrowLeft, Layers, Book, BrainCircuit, Users, Database, FileJson, Check, X, AlertCircle } from 'lucide-react';
import { Subject, Lecture, Flashcard, QuizQuestion } from '../types';

type ViewMode = 'SUBJECT_LIST' | 'SUBJECT_EDIT' | 'LECTURE_EDIT' | 'STUDENT_LIST';

interface StudentData {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    completed_lectures: number;
    quiz_points: number;
    last_active: string;
}

const AdminDashboard: React.FC = () => {
  const { subjects: contextSubjects, refreshSubjects, isAdmin } = useApp();
  
  // Content State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [view, setView] = useState<ViewMode>('SUBJECT_LIST');
  const [activeSubjectIdx, setActiveSubjectIdx] = useState<number>(-1);
  const [activeLectureIdx, setActiveLectureIdx] = useState<number>(-1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // JSON Edit State
  const [editMode, setEditMode] = useState<'VISUAL' | 'JSON'>('VISUAL');
  const [jsonText, setJsonText] = useState('');

  // Student State
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (contextSubjects) {
        setSubjects(JSON.parse(JSON.stringify(contextSubjects)));
    }
  }, [contextSubjects]);

  // Fetch Students Logic
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
              const totalPoints = Object.values(quizScores).reduce((a: any, b: any) => a + b, 0) as number;

              return {
                  id: p.id,
                  email: p.email,
                  full_name: p.full_name,
                  avatar_url: p.avatar_url,
                  completed_lectures: completedCount,
                  quiz_points: totalPoints,
                  last_active: p.updated_at || 'N/A'
              };
          });

          setStudents(merged);
      } catch (e) {
          console.error("Error fetching students", e);
      } finally {
          setLoadingStudents(false);
      }
  };

  useEffect(() => {
      if (view === 'STUDENT_LIST') {
          fetchStudents();
      }
  }, [view]);

  const saveToDatabase = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // 1. Check if table exists (implicit in upsert error handling, but good to know)
      const { error } = await supabase
        .from('app_content')
        .upsert({ id: 'main', content: subjects }, { onConflict: 'id' });

      if (error) throw error;
      
      await refreshSubjects();
      setMsg({ type: 'success', text: 'Changes saved successfully to database!' });
      
      // Clear success message after 4 seconds
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message;
      if (err.message?.includes('relation "public.app_content" does not exist')) {
          errorMessage = 'Database table missing. Please run the SQL setup script.';
      }
      setMsg({ type: 'error', text: 'Failed to save: ' + errorMessage });
    } finally {
      setSaving(false);
    }
  };

  // --- HANDLERS ---
  const handleAddSubject = () => {
    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      title: 'New Subject',
      titleAr: 'مادة جديدة',
      level: 'Level-2',
      color: 'blue',
      lectures: []
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
        summary: 'Enter summary here...',
        flashcards: [],
        quiz: [],
        topics: []
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
                            onClick={() => { setActiveSubjectIdx(idx); setView('SUBJECT_EDIT'); }}
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
            if (!parsed.id || !parsed.title) throw new Error("JSON must include at least an id and title");
            
            const newSubs = [...subjects];
            newSubs[activeSubjectIdx].lectures[activeLectureIdx] = parsed;
            setSubjects(newSubs);
            setEditMode('VISUAL');
            setMsg({ type: 'success', text: 'JSON applied to local state. Remember to SAVE to database.' });
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
        const newQ: QuizQuestion = { id: Date.now(), question: '', options: ['', '', '', ''], correctIndex: 0 };
        updateLecture('quiz', [...quiz, newQ]);
    };
    const updateQuizQ = (idx: number, field: keyof QuizQuestion | 'option', val: any, optIdx?: number) => {
        const quiz = [...(lecture.quiz || [])];
        if (field === 'option' && typeof optIdx === 'number') {
            quiz[idx].options[optIdx] = val;
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
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-xs font-mono text-gray-500 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span>Edit the lecture object directly. Changes are local until you click "Save Content Changes" at the top right.</span>
                        <span className="text-blue-600 font-bold">unsaved changes</span>
                    </div>
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
                            <input value={lecture.title} onChange={(e) => updateLecture('title', e.target.value)} placeholder="Title (EN)" className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600" />
                            <input value={lecture.titleAr} onChange={(e) => updateLecture('titleAr', e.target.value)} placeholder="Title (AR)" className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600 text-right" />
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Topics (comma separated)</label>
                             <input value={lecture.topics?.join(', ')} onChange={(e) => updateLecture('topics', e.target.value.split(',').map(s => s.trim()))} className="w-full p-2 border rounded-lg bg-transparent dark:border-gray-600" />
                        </div>
                        <textarea value={lecture.summary} onChange={(e) => updateLecture('summary', e.target.value)} placeholder="Summary (Markdown)" className="w-full h-32 p-2 border rounded-lg bg-transparent dark:border-gray-600" />
                    </div>

                    {/* Flashcards */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold flex items-center gap-2"><Layers size={18}/> Flashcards</h3>
                            <button onClick={addFlashcard} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200">+ Add</button>
                        </div>
                        <div className="space-y-3">
                            {lecture.flashcards?.map((card, idx) => (
                                <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex-1 space-y-2">
                                        <input value={card.question} onChange={(e) => updateFlashcard(idx, 'question', e.target.value)} placeholder="Q" className="w-full p-1.5 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600" />
                                        <input value={card.answer} onChange={(e) => updateFlashcard(idx, 'answer', e.target.value)} placeholder="A" className="w-full p-1.5 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600" />
                                    </div>
                                    <button onClick={() => deleteFlashcard(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quiz */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold flex items-center gap-2"><BrainCircuit size={18}/> Quiz</h3>
                            <button onClick={addQuizQ} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200">+ Add</button>
                        </div>
                        <div className="space-y-4">
                            {lecture.quiz?.map((q, qIdx) => (
                                <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex gap-2 mb-2">
                                        <input value={q.question} onChange={(e) => updateQuizQ(qIdx, 'question', e.target.value)} placeholder="Question" className="flex-1 p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600 font-medium" />
                                        <button onClick={() => deleteQuizQ(qIdx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {q.options.map((opt, oIdx) => (
                                            <input key={oIdx} value={opt} onChange={(e) => updateQuizQ(qIdx, 'option', e.target.value, oIdx)} placeholder={`Opt ${oIdx+1}`} className={`w-full p-1.5 text-sm border rounded bg-white dark:bg-gray-800 ${q.correctIndex === oIdx ? 'border-green-500 ring-1 ring-green-500' : 'dark:border-gray-600'}`} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span>Correct Index:</span>
                                        <input type="number" min="0" max="3" value={q.correctIndex} onChange={(e) => updateQuizQ(qIdx, 'correctIndex', parseInt(e.target.value))} className="w-16 p-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-600" />
                                    </div>
                                </div>
                            ))}
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
                              <th className="px-6 py-4">Completed</th>
                              <th className="px-6 py-4">Quiz Points</th>
                              <th className="px-6 py-4">Last Active</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {loadingStudents ? (
                              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading data...</td></tr>
                          ) : students.length === 0 ? (
                              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No students found.</td></tr>
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
            : 'bg-red-600 text-white border-red-700'
        }`}>
            {msg.type === 'success' ? <Check size={24} /> : <AlertCircle size={24} />}
            <span className="font-medium">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="ml-2 opacity-70 hover:opacity-100">
                <X size={16} />
            </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Made Sticky for better access */}
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
            </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
