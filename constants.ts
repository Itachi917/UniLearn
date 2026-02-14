import { Subject, Lecture } from './types';

// Seed Data Configuration
export const SEED_DATA: Subject[] = [
  {
    id: 'sub-os',
    title: 'Operating Systems & Security',
    titleAr: 'نظم التشغيل والأمن',
    level: 'Level-2',
    color: 'blue',
    lectures: [
      {
        id: 'lec-os-1',
        title: 'Lecture 1: Intro to OS',
        titleAr: 'المحاضرة 1: مقدمة في نظم التشغيل',
        summary: `
          **OS Definition:** An intermediary between the user of a computer and the computer hardware.
          
          **4 Components of a Computer System:**
          1. **Hardware:** Provides basic computing resources (CPU, memory, I/O devices).
          2. **Operating System:** Controls and coordinates use of hardware among various applications and users.
          3. **Application Programs:** Define the ways in which the system resources are used to solve the computing problems of the users (Word processors, compilers, web browsers).
          4. **Users:** People, machines, other computers.
          
          **Kernel:** The one program running at all times on the computer. Everything else is either a system program or an application program.
          
          **Dual-mode operation:** Allows OS to protect itself and other system components. User mode and Kernel mode.
        `,
        topics: ['Multiprogramming', 'Timesharing', 'Dual-mode operation'],
        flashcards: [
          { question: 'What is the Bootstrap program?', answer: 'Firmware stored in ROM that initializes the system and loads the kernel.' },
          { question: 'What are System Calls?', answer: 'The interface between a running program and the OS.' }
        ],
        quiz: [
          {
            id: 1,
            question: "Which component is considered the intermediary between user and hardware?",
            options: ["Application Programs", "Operating System", "CPU", "Compiler"],
            correctIndex: 1
          },
          {
            id: 2,
            question: "Where is the Bootstrap program stored?",
            options: ["RAM", "Hard Disk", "ROM", "Cache"],
            correctIndex: 2
          }
        ]
      },
      {
        id: 'lec-os-2',
        title: 'Lecture 2: Processes & Threads',
        titleAr: 'المحاضرة 2: العمليات والخيوط',
        summary: `
          **Process:** A program in execution.
          
          **Process States:**
          * **New:** The process is being created.
          * **Running:** Instructions are being executed.
          * **Waiting:** The process is waiting for some event to occur.
          * **Ready:** The process is waiting to be assigned to a processor.
          * **Terminated:** The process has finished execution.
          
          **PCB (Process Control Block):** Information associated with each process (Process state, Program counter, CPU registers, etc.).
          
          **Context Switch:** When CPU switches to another process, the system must save the state of the old process and load the saved state for the new process via a context switch.
        `,
        topics: ['Scheduling Queues', 'Multithreading Models (Many-to-One, One-to-One, Many-to-Many)'],
        flashcards: [
          { question: 'What is a Thread?', answer: 'A basic unit of CPU utilization; a process can have multiple threads.' },
          { question: 'Describe the "Ready" state.', answer: 'The process is waiting to be assigned to a processor.' }
        ],
        quiz: [
          {
            id: 1,
            question: "Which state represents a process waiting for a processor?",
            options: ["Waiting", "Ready", "New", "Running"],
            correctIndex: 1
          },
          {
            id: 2,
            question: "What does PCB stand for?",
            options: ["Program Control Block", "Process Control Block", "Process Central Board", "Program Central Bus"],
            correctIndex: 1
          }
        ]
      }
    ]
  },
  {
    id: 'sub-ecom',
    title: 'Fundamentals of E-Commerce',
    titleAr: 'أساسيات التجارة الإلكترونية',
    level: 'Level-2',
    color: 'emerald',
    lectures: [
      {
        id: 'lec-ecom-1',
        title: 'Lecture 1: Intro to E-Commerce',
        titleAr: 'المحاضرة 1: مقدمة في التجارة الإلكترونية',
        summary: 'Introduction to basic concepts of buying and selling goods and services over the internet.',
        flashcards: [],
        quiz: []
      },
      {
        id: 'lec-ecom-2',
        title: 'Lecture 2: E-Commerce Infrastructure',
        titleAr: 'المحاضرة 2: البنية التحتية للتجارة الإلكترونية',
        summary: `
          **Hardware:** Server computers, Data Centers, Load-balancing systems.
          
          **Software:**
          * **Shopping Carts:** Shopify, Magento.
          * **CRM:** Customer Relationship Management systems like Salesforce.
          
          **Networks:**
          * **Cloud computing:** On-demand availability of computer system resources.
          * **Protocols:** HTTPS (Hypertext Transfer Protocol Secure).
          
          **Payment Gateways:** Stripe, PayPal - mechanisms to authorize credit card payments.
          **Security:** Firewalls, Encryption, SSL/TLS.
        `,
        topics: ['Payment Gateways', 'Security Technologies'],
        flashcards: [
          { question: 'What is a CDN?', answer: 'Content Delivery Network - distributes content globally to ensure fast load times.' },
          { question: 'What is Tokenization?', answer: 'Replacing sensitive payment data with unique tokens for security.' }
        ],
        quiz: [
          {
            id: 1,
            question: "Which of these is a Payment Gateway?",
            options: ["Salesforce", "Magento", "Stripe", "Apache"],
            correctIndex: 2
          },
          {
            id: 2,
            question: "What is the purpose of a CDN?",
            options: ["To encrypt data", "To distribute content for faster load times", "To manage customer relationships", "To process payments"],
            correctIndex: 1
          }
        ]
      }
    ]
  },
  {
    id: 'sub-wis',
    title: 'Web Information Systems',
    titleAr: 'نظم معلومات الويب',
    level: 'Level-2',
    color: 'indigo',
    lectures: [
       { id: 'lec-wis-1', title: 'Lecture 1: Web Architecture', titleAr: 'المحاضرة 1: معمارية الويب', summary: 'Overview of HTTP, Client-Server model.', flashcards: [], quiz: [] }
    ]
  },
  {
    id: 'sub-anim',
    title: 'Computer Animation',
    titleAr: 'الرسوم المتحركة الحاسوبية',
    level: 'Level-2',
    color: 'purple',
    lectures: [
        { id: 'lec-anim-1', title: 'Lecture 1: Principles of Animation', titleAr: 'المحاضرة 1: مبادئ الرسوم المتحركة', summary: 'Squash and stretch, anticipation, staging.', flashcards: [], quiz: [] }
    ]
  },
  {
    id: 'sub-bi',
    title: 'Introduction to Business Intelligence',
    titleAr: 'مقدمة في ذكاء الأعمال',
    level: 'Level-2',
    color: 'indigo',
    lectures: [
        { id: 'lec-bi-1', title: 'Lecture 1: What is BI?', titleAr: 'المحاضرة 1: ما هو ذكاء الأعمال؟', summary: 'Business Intelligence (BI) refers to the procedural and technical infrastructure that collects, stores, and analyzes the data produced by a company’s activities.', flashcards: [], quiz: [] }
    ]
  },
  {
    id: 'sub-se',
    title: 'Software Engineering',
    titleAr: 'هندسة البرمجيات',
    level: 'Level-2',
    color: 'blue',
    lectures: [
        { id: 'lec-se-1', title: 'Lecture 1: SDLC', titleAr: 'المحاضرة 1: دورة حياة تطوير البرمجيات', summary: 'SDLC stands for Software Development Life Cycle.', flashcards: [], quiz: [] }
    ]
  },
  {
    id: 'sub-dmd',
    title: 'Digital Media Design',
    titleAr: 'تصميم الوسائط الرقمية',
    level: 'Level-2',
    color: 'purple',
    lectures: [
        { id: 'lec-dmd-1', title: 'Lecture 1: Color Theory', titleAr: 'المحاضرة 1: نظرية الألوان', summary: 'Understanding how colors interact, combine, and impact perception.', flashcards: [], quiz: [] }
    ]
  },
  {
    id: 'sub-db',
    title: 'Advanced Database Systems',
    titleAr: 'نظم قواعد البيانات المتقدمة',
    level: 'Level-2',
    color: 'emerald',
    lectures: [
        { id: 'lec-db-1', title: 'Lecture 1: Normalization', titleAr: 'المحاضرة 1: التطبيع', summary: 'Database normalization is the process of structuring a relational database in accordance with a series of so-called normal forms in order to reduce data redundancy and improve data integrity.', flashcards: [], quiz: [] }
    ]
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
    backToSubjects: "Back to Subjects",
    backToLevels: "Back to Levels",
    manageSubjects: "Manage Subjects",
    welcomeTitle: "Welcome to UniLearn!",
    selectSubjectsPrompt: "Please select the subjects you are currently enrolled in to personalize your dashboard.",
    startLearning: "Start Learning",
    selectAll: "Select All",
    deselectAll: "Deselect All",
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
    dashboard: "لوحة التحكم",
    backToSubjects: "العودة للمواد",
    backToLevels: "العودة للمستويات",
    manageSubjects: "إدارة المواد",
    welcomeTitle: "مرحباً بك في UniLearn!",
    selectSubjectsPrompt: "يرجى اختيار المواد المسجلة حالياً لتخصيص لوحة التحكم الخاصة بك.",
    startLearning: "ابدأ التعلم",
    selectAll: "تحديد الكل",
    deselectAll: "إلغاء تحديد الكل",
  }
};
