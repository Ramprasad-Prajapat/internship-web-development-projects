import lessonService from "./lessonService";
import prepositionService from "./prepositionService";
import learningService from "./mockLearningService";
import historyService from "./historyService";
import aiPracticeService from "./aiPracticeService";
import extensionImportService from "./extensionImportService";
import mistakeService from "./mistakeService";
import { DB_KEYS, setCollection, getCollection, uid, nowIso } from "./mockDatabase";
import type { Lesson } from "../types/lesson.types";
import type { Mistake } from "../types/mistake.types";
import type { PracticeSession, PracticeAnswer } from "../types/ai.types";
import type { HistoryEntry } from "../types/history.types";
import type { ExtensionInboxItem } from "../types/extension.types";

export function ensureDemoPreviewData() {
  const seedFlag = "english_learning_demo_seed_v1";
  if (localStorage.getItem(seedFlag)) return;

  // 1. Profile / Auth Setup
  const existingUser = localStorage.getItem("user");
  if (!existingUser) {
    const demoUser = {
      id: "u_demo",
      name: "Demo Learner",
      email: "demo@english.app",
      level: "BEGINNER",
      learningGoal: "Speak English daily with confidence",
      dailyGoalMinutes: 30,
      preferredPracticeFocus: "speaking",
    };
    const demoToken = `mock.${btoa(JSON.stringify({ id: demoUser.id, email: demoUser.email }))}.demo`;
    localStorage.setItem("user", JSON.stringify(demoUser));
    localStorage.setItem("token", demoToken);
    
    // Write user to mock users too
    const users = JSON.parse(localStorage.getItem("eng_mock_users") || "[]");
    if (!users.some((u: any) => u.email === demoUser.email)) {
      users.push({ ...demoUser, password: "demo1234" });
      localStorage.setItem("eng_mock_users", JSON.stringify(users));
    }
  }

  // 2. Daily Lessons Day 1 to Day 7
  const lessons = JSON.parse(localStorage.getItem("eng_lessons") || "[]") as Lesson[];
  const existingDays = new Set(
    lessons
      .filter((l) => l.dayNumber != null && l.topicType === "week-day")
      .map((l) => l.dayNumber)
  );
  
  const demoLessons = [
    {
      weekNumber: 1,
      dayNumber: 1,
      title: "Week 1 Day 1 — Daily Routine",
      topicType: "week-day" as const,
      sourceType: "chatgpt" as const,
      tags: ["routine", "present-simple"],
      rawContent: `Goal:
Learn to talk about your daily routine.

Vocabulary:
- wake up: uthna
- breakfast: subah ka khana
- routine: dincharya

Grammar:
Use simple present for daily habits. Add "s" for he/she/it.
Example: I wake up at 7. She wakes up at 6.

Examples:
1. I brush my teeth every morning.
2. He goes to office by bus.

Speaking Drill:
Say out loud: "I wake up at 7 AM and drink tea."

Homework:
Write 5 sentences about your morning routine.`
    },
    {
      weekNumber: 1,
      dayNumber: 2,
      title: "Week 1 Day 2 — Basic Sentences",
      topicType: "week-day" as const,
      sourceType: "manual" as const,
      tags: ["sentences", "basics"],
      rawContent: `Goal:
Make simple, correct sentences using Subject + Verb + Object.

Grammar:
English word order is Subject + Verb + Object.
Example: I (subject) eat (verb) rice (object).

Examples:
1. I read a book.
2. She likes tea.
3. We play cricket.

Speaking Drill:
Say out loud: "I drink water. She drinks milk. They drink juice."

Homework:
Write 5 simple sentences about your family.`
    },
    {
      weekNumber: 1,
      dayNumber: 3,
      title: "Week 1 Day 3 — Self Introduction",
      topicType: "week-day" as const,
      sourceType: "manual" as const,
      tags: ["introduction", "speaking"],
      rawContent: `Goal:
Introduce yourself in English in a few simple sentences.

Vocabulary:
- name: naam
- from: kahaan se
- work: kaam

Examples:
1. My name is Rahul.
2. I am from Delhi.
3. I am a student.

Speaking Drill:
Say out loud: "Hello, my name is ___. I am from ___. I like ___."

Homework:
Write 5 sentences to introduce yourself.`
    },
    {
      weekNumber: 1,
      dayNumber: 4,
      title: "Week 1 Day 4 — This / That / These / Those",
      topicType: "week-day" as const,
      sourceType: "manual" as const,
      tags: ["demonstratives", "grammar"],
      rawContent: `Goal:
Use this, that, these and those correctly.

Grammar:
- this = one thing near you
- that = one thing far from you
- these = many things near you
- those = many things far from you

Examples:
1. This is my pen.
2. That is your car.
3. These are my books.
4. Those are her shoes.

Speaking Drill:
Point at things and say: "This is a ___. That is a ___."

Homework:
Write one sentence each with this, that, these and those.`
    },
    {
      weekNumber: 1,
      dayNumber: 5,
      title: "Week 1 Day 5 — There is / There are",
      topicType: "week-day" as const,
      sourceType: "manual" as const,
      tags: ["there-is", "grammar"],
      rawContent: `Goal:
Use "there is" and "there are" to say what exists.

Grammar:
- there is = one thing (singular)
- there are = many things (plural)

Examples:
1. There is a book on the table.
2. There is one apple.
3. There are five students in the class.
4. There are many cars on the road.

Speaking Drill:
Say out loud: "There is a pen. There are two pens."

Homework:
Write 3 sentences with "there is" and 3 with "there are".`
    },
    {
      weekNumber: 1,
      dayNumber: 6,
      title: "Week 1 Day 6 — Common Daily Questions",
      topicType: "week-day" as const,
      sourceType: "chatgpt" as const,
      tags: ["questions", "conversation"],
      rawContent: `Goal:
Learn to ask and answer common daily questions in English.

Vocabulary:
- What: Kya
- Where: Kahaan
- Why: Kyun
- How: Kaise

Grammar:
Use "do" for I/you/we/they, and "does" for he/she/it.
Example: Where do you live? Where does she live?

Speaking Drill:
Say out loud: "How are you? I am fine, thank you."

Homework:
Write 3 questions you ask your friends every day.`
    },
    {
      weekNumber: 1,
      dayNumber: 7,
      title: "Week 1 Day 7 — Mini Revision Practice",
      topicType: "week-day" as const,
      sourceType: "manual" as const,
      tags: ["revision", "practice"],
      rawContent: `Goal:
Revise what you learned from Day 1 to Day 6.

Grammar:
Simple present tense, demonstratives, there is/are, and basic questions.

Examples:
My name is Amit. I wake up at 6 AM. This is my book. There are many apples on the table.

Speaking Drill:
Say out loud: "I practice English every day to improve my skills."

Homework:
Write a short paragraph combining introduction, routine, and a description of your room.`
    }
  ];

  let addedLessonsCount = 0;
  const newLessonsList = [...lessons];
  
  demoLessons.forEach((dl) => {
    if (!existingDays.has(dl.dayNumber)) {
      const created: Lesson = {
        ...dl,
        id: `l_day${dl.dayNumber}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      newLessonsList.push(created);
      addedLessonsCount++;
    }
  });

  if (addedLessonsCount > 0 || lessons.length === 0) {
    localStorage.setItem("eng_lessons", JSON.stringify(newLessonsList));
    localStorage.setItem("eng_lessons_seeded_v1", "1");
    localStorage.setItem("eng_daily_lessons_seeded_v1", "1");
  }

  // 3. Prepositions custom notes
  const existingNotes = JSON.parse(localStorage.getItem("eng_prep_notes") || "[]");
  if (existingNotes.length === 0) {
    const demoNotes = [
      { id: "pn_1", type: "in" as const, text: "Remember: Use 'in' for years (in 2026), months (in May), and large cities (in Delhi).", createdAt: nowIso() },
      { id: "pn_2", type: "at" as const, text: "Tip: 'at home', 'at school', and 'at work' are specific points, so they always take AT.", createdAt: nowIso() },
    ];
    localStorage.setItem("eng_prep_notes", JSON.stringify(demoNotes));
  }

  // 4. Practice Session preview & answers
  const existingSessions = getCollection<PracticeSession>(DB_KEYS.practiceSessions);
  if (existingSessions.length === 0) {
    const demoSessions: PracticeSession[] = [
      {
        id: "ps_demo_daily",
        sourceType: "DAILY_LESSON",
        sourceId: "l_day1",
        sourceTitle: "Week 1 Day 1 — Daily Routine",
        answered: 5,
        correct: 4,
        lastScore: 90,
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: "ps_demo_prep",
        sourceType: "PREPOSITION",
        sourceId: "in",
        sourceTitle: "Preposition IN",
        answered: 5,
        correct: 5,
        lastScore: 100,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ];
    setCollection(DB_KEYS.practiceSessions, demoSessions);

    // Add practice answers to match
    const demoAnswers: PracticeAnswer[] = [
      {
        id: "pa_1",
        questionId: "q_DAILY_LESSON_l_day1_1",
        sourceType: "DAILY_LESSON",
        sourceId: "l_day1",
        questionText: "Write 3 simple sentences about Daily Routine.",
        userAnswer: "I wake up at 6. I brush my teeth. I drink hot milk.",
        result: {
          wrongSentence: "",
          correctSentence: "I wake up at 6. I brush my teeth. I drink hot milk.",
          simpleRule: "Great! Your sentences look correct. 👍",
          practiceAgain: "Keep practicing — try a longer sentence next time.",
          score: 95,
          isCorrect: true
        },
        createdAt: nowIso()
      },
      {
        id: "pa_2",
        questionId: "q_PREPOSITION_in_1",
        sourceType: "PREPOSITION",
        sourceId: "in",
        questionText: "Make 3 sentences using IN.",
        userAnswer: "I live in Delhi. He was born in June. It is hot in summer.",
        result: {
          wrongSentence: "",
          correctSentence: "I live in Delhi. He was born in June. It is hot in summer.",
          simpleRule: "Perfect! All sentences are correct.",
          practiceAgain: "Try using complex phrases.",
          score: 100,
          isCorrect: true
        },
        createdAt: nowIso()
      }
    ];
    setCollection(DB_KEYS.practiceAnswers, demoAnswers);
  }

  // 5. Mistakes demo
  const mistakes = getCollection<Mistake>(DB_KEYS.mistakes);
  if (mistakes.length === 0) {
    const demoMistakes: Mistake[] = [
      {
        id: "mk_demo_1",
        sourceType: "DAILY_LESSON",
        sourceId: "l_day1",
        sourceTitle: "Week 1 Day 1 — Daily Routine",
        wrongSentence: "I am go to market.",
        correctSentence: "I am going to the market.",
        simpleRule: "Use verb + ing (going) after 'am/is/are' for actions happening now.",
        mistakeType: "grammar",
        practicedCount: 0,
        createdAt: nowIso()
      },
      {
        id: "mk_demo_2",
        sourceType: "DAILY_LESSON",
        sourceId: "l_day2",
        sourceTitle: "Week 1 Day 2 — Basic Sentences",
        wrongSentence: "She like tea.",
        correctSentence: "She likes tea.",
        simpleRule: "Add 's' to the verb (likes) for singular third-person (he/she/it).",
        mistakeType: "grammar",
        practicedCount: 0,
        createdAt: nowIso()
      },
      {
        id: "mk_demo_3",
        sourceType: "DAILY_LESSON",
        sourceId: "l_day3",
        sourceTitle: "Week 1 Day 3 — Self Introduction",
        wrongSentence: "I am born in 1999.",
        correctSentence: "I was born in 1999.",
        simpleRule: "Use 'was born' for birth (past completed event).",
        mistakeType: "grammar",
        practicedCount: 0,
        createdAt: nowIso()
      },
      {
        id: "mk_demo_4",
        sourceType: "PREPOSITION",
        sourceId: "in",
        sourceTitle: "Preposition IN",
        wrongSentence: "He is at the room.",
        correctSentence: "He is in the room.",
        simpleRule: "Use 'in' for enclosed, 3-dimensional spaces like rooms or boxes.",
        mistakeType: "grammar",
        practicedCount: 0,
        createdAt: nowIso()
      },
      {
        id: "mk_demo_5",
        sourceType: "PREPOSITION",
        sourceId: "on",
        sourceTitle: "Preposition ON",
        wrongSentence: "I will meet you in Monday.",
        correctSentence: "I will meet you on Monday.",
        simpleRule: "Use 'on' for specific days of the week.",
        mistakeType: "grammar",
        practicedCount: 0,
        createdAt: nowIso()
      }
    ];
    setCollection(DB_KEYS.mistakes, demoMistakes);
    
    // Mirror these in legacy mistakes so they show up beautifully
    const legacyMistakes = [
      {
        id: "lm_1",
        category: "grammar" as const,
        wrong: "I am go to market.",
        correct: "I am going to the market.",
        rule: "Use verb + ing after am/is/are (present continuous).",
        source: "Speaking",
        fixed: false,
        createdAt: nowIso()
      },
      {
        id: "lm_2",
        category: "grammar" as const,
        wrong: "She no like tea.",
        correct: "She does not like tea.",
        rule: "Use does not + base verb for he/she/it in negatives.",
        source: "Writing",
        fixed: false,
        createdAt: nowIso()
      }
    ];
    localStorage.setItem("eng_mistakes", JSON.stringify(legacyMistakes));
  }

  // 6. History activities
  const existingHistory = JSON.parse(localStorage.getItem("eng_history") || "[]") as HistoryEntry[];
  if (existingHistory.length === 0) {
    const demoHistory: HistoryEntry[] = [
      {
        id: "h_1",
        type: "DAILY_LESSON_VIEWED",
        title: "Viewed Day 1",
        description: "Daily Routine lesson content read.",
        lessonId: "l_day1",
        dayNumber: 1,
        sourceType: "DAILY_LESSON",
        sourceId: "l_day1",
        createdAt: nowIso()
      },
      {
        id: "h_2",
        type: "PREPOSITION_VIEWED",
        title: "Viewed Preposition IN",
        description: "Studied time and place rules.",
        lessonId: null,
        dayNumber: null,
        sourceType: "PREPOSITION",
        sourceId: "in",
        createdAt: nowIso()
      },
      {
        id: "h_3",
        type: "DAILY_LESSON_PRACTICED",
        title: "AI practice finished",
        description: "Answered questions for Week 1 Day 1 with 95% average score.",
        lessonId: "l_day1",
        dayNumber: 1,
        sourceType: "DAILY_LESSON",
        sourceId: "l_day1",
        createdAt: nowIso()
      },
      {
        id: "h_4",
        type: "MISTAKE_SAVED",
        title: "Mistake saved",
        description: "Saved mistake from practice: 'I am go to market'.",
        lessonId: null,
        dayNumber: null,
        sourceType: "DAILY_LESSON",
        sourceId: "l_day1",
        createdAt: nowIso()
      },
      {
        id: "h_5",
        type: "EXTENSION_CONTENT_CONVERTED",
        title: "Converted inbox content",
        description: "Converted 'Vocabulary: 5 Common Verbs' to study deck.",
        lessonId: null,
        dayNumber: null,
        sourceType: "EXTENSION",
        sourceId: "ext_1",
        createdAt: nowIso()
      }
    ];
    localStorage.setItem("eng_history", JSON.stringify(demoHistory));
  }

  // 7. Extension Inbox demo clips
  const existingInbox = getCollection<ExtensionInboxItem>(DB_KEYS.extensionInboxItems);
  if (existingInbox.length === 0) {
    const demoInbox: ExtensionInboxItem[] = [
      {
        id: "ext_1",
        title: "Vocabulary: 5 Common Verbs in Office Meetings",
        sourceUrl: "https://www.youtube.com/watch?v=meetingverbs",
        rawContent: "1. Schedule (dincharya banana): to plan something at a specific time. Example: Let's schedule the meeting for tomorrow.\n2. Clarify (saaf karna): to make something clear. Example: Can you clarify the goal?\n3. Collaborate (sath kaam karna): to work together. Example: We need to collaborate on this task.\n4. Postpone (aage badhana): to delay to a later time. Example: The meeting is postponed to Monday.\n5. Implement (shuru karna): to start using a plan. Example: We will implement the changes next week.",
        sourceType: "VIDEO",
        receivedAt: nowIso(),
        convertedStatus: "PENDING"
      },
      {
        id: "ext_2",
        title: "Grammar: When to use 'Since' vs 'For'",
        sourceUrl: "https://english.stackexchange.com/q/sincefor",
        rawContent: "Use 'for' to talk about a duration or period of time (length of time):\n- for 2 hours\n- for 3 days\n- for 5 years\n\nUse 'since' to talk about a starting point in time (when it started):\n- since 9 AM\n- since Monday\n- since 2010",
        sourceType: "WEBSITE",
        receivedAt: nowIso(),
        convertedStatus: "PENDING"
      },
      {
        id: "ext_3",
        title: "Preposition AT Rules",
        sourceUrl: "",
        rawContent: "Use 'at' for specific times (at 6 PM, at midnight, at noon).\nUse 'at' for specific points/places (at the bus stop, at the station, at home).",
        sourceType: "CUSTOM",
        receivedAt: nowIso(),
        convertedStatus: "PENDING"
      }
    ];
    setCollection(DB_KEYS.extensionInboxItems, demoInbox);
    localStorage.setItem("eng_extension_seeded_v1", "1");
  }

  // 8. Progress Metrics (Daily progress, weekly scores, activity streak)
  localStorage.setItem("eng_streak", "5");

  const dailyProgress = JSON.parse(localStorage.getItem("eng_daily_progress") || "{}");
  if (Object.keys(dailyProgress).length === 0) {
    const demoDailyProgress = {
      "1": { dayNumber: 1, completed: true, practiceCount: 2, lastPracticedAt: nowIso() },
      "2": { dayNumber: 2, completed: false, practiceCount: 1, lastPracticedAt: nowIso() }
    };
    localStorage.setItem("eng_daily_progress", JSON.stringify(demoDailyProgress));
  }

  const quizResults = JSON.parse(localStorage.getItem("eng_prep_quiz_results") || "[]");
  if (quizResults.length === 0) {
    const demoQuizResults = [
      { id: "pq_in", type: "in", score: 2, total: 2, createdAt: nowIso() },
      { id: "pq_on", type: "on", score: 1, total: 2, createdAt: nowIso() }
    ];
    localStorage.setItem("eng_prep_quiz_results", JSON.stringify(demoQuizResults));
  }

  const existingScores = JSON.parse(localStorage.getItem("eng_daily_scores") || "{}");
  if (Object.keys(existingScores).length === 0) {
    const demoScores: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      demoScores[dateStr] = [60, 70, 75, 80, 85, 90, 95][6 - i];
    }
    localStorage.setItem("eng_daily_scores", JSON.stringify(demoScores));
  }

  const existingCounts = JSON.parse(localStorage.getItem("eng_counts") || "{}");
  if (Object.keys(existingCounts).length === 0) {
    const todayStr = new Date().toISOString().split("T")[0];
    const demoCounts = {
      [todayStr]: {
        speaking: 2,
        writing: 4,
        reading: 1,
        vocabulary: 3,
        grammar: 2
      }
    };
    localStorage.setItem("eng_counts", JSON.stringify(demoCounts));
  }

  // Seed structured Day 5 content
  ensureDay5StructuredSeeded();

  // Seed flag set
  localStorage.setItem(seedFlag, "1");
}

export function ensureDay5StructuredSeeded() {
  const seedFlag = "english_learning_day5_structured_seed_v1";
  if (localStorage.getItem(seedFlag)) return;

  const lessons = JSON.parse(localStorage.getItem("eng_lessons") || "[]") as Lesson[];
  
  const structuredDay5Content = `### Time Table
- 09:00 AM - 09:30 AM: Vocabulary and Pronunciation Drill
- 09:30 AM - 10:00 AM: Grammar and Prepositions
- 10:00 AM - 10:30 AM: Speaking Drill & Speaking Topic
- 10:30 AM - 11:00 AM: 30 Questions & Answers and Mini Conversations
- Afternoon: Homework & Self Check

### Vocabulary
- exist (hona / astitva hona): to be real or present. Example: There are many problems that exist in this city.
- custom (rivaj / aadat): a traditional practice. Example: It is a custom to greet elders in India.
- conversation (baatchit): talking between people. Example: We had a nice conversation about learning English.
- mistake (galti): an error. Example: I made a mistake in the spelling.
- routine (dincharya): regular way of doing things. Example: Exercise is part of my daily routine.

### Grammar
Use "there is" for singular nouns (one thing).
Example: There is a pen on my desk.
Use "there are" for plural nouns (more than one thing).
Example: There are two books on my desk.

### Prepositions
Use "in" for inside a closed space or large area (e.g. in the room, in India).
Use "on" for a surface or day (e.g. on the table, on Monday).
Use "at" for a specific point or time (e.g. at the bus stop, at 5 PM).

### Speaking Drill
Repeat these lines out loud 3 times:
1. There is a beautiful picture on the wall in my room.
2. There are many apples in the basket on the kitchen table.
3. I will meet you at the library at 4 PM on Saturday.

### 30 Questions + Answers
1. Q: Is there a laptop on your table?
   A: Yes, there is a laptop on my table.
2. Q: Are there many trees in your garden?
   A: Yes, there are many trees in your garden.
3. Q: Where do you live?
   A: I live in a quiet apartment in Mumbai.
4. Q: What is on the wall?
   A: There is a clock and a photo frame on the wall.
5. Q: When is your class?
   A: My class is at 6 PM on weekdays.

### Mini Conversations
A: Hello, is there a good restaurant near here?
B: Yes, there is a nice cafe on the corner next to the bank.
A: Thank you! Are there vegetarian options?
B: Yes, there are many vegetarian dishes on their menu.

### Speaking Topic
Topic: Describe your favorite room.
Guidelines: Speak for 1 minute. Tell about what is in the room, using "there is/are" and prepositions (in, on, at).
Example: My favorite room is my bedroom. In my bedroom, there is a large bed. On the bed, there are two pillows. At the corner, there is a study table.

### Pronunciation Drill
Practice speaking these words clearly:
- Literature (lit-er-a-chur)
- Vocabulary (vow-kab-yoo-ler-ee)
- Conversation (kon-ver-say-shun)
- Preposition (prep-o-zish-un)
- Scheduled (sked-yoold)

### Common Mistakes
Wrong: There is many cars on the road.
Correct: There are many cars on the road.
Rule: Use "there are" for plural subjects (cars).

Wrong: I am go to market on Monday.
Correct: I am going to the market on Monday.
Rule: Use verb-ing after "am" for continuous actions.

### Homework
1. Write 5 sentences about your room using "there is" or "there are".
2. Record your voice speaking for 1 minute about your daily schedule.

### Self Check
- Can you correctly choose between "there is" and "there are"?
- Do you know when to use "in", "on", and "at"?
- Can you introduce yourself without hesitation?

### Day 6 Preview
Tomorrow we will learn how to describe past activities using the simple past tense (e.g., "I went", "I worked").`;

  const existingIdx = lessons.findIndex((l) => l.dayNumber === 5 && l.topicType === "week-day");
  if (existingIdx !== -1) {
    lessons[existingIdx].rawContent = structuredDay5Content;
    lessons[existingIdx].title = "Week 1 Day 5 — Structured AI Lesson";
    lessons[existingIdx].updatedAt = nowIso();
  } else {
    const newDay5: Lesson = {
      id: "l_day5_structured",
      weekNumber: 1,
      dayNumber: 5,
      title: "Week 1 Day 5 — Structured AI Lesson",
      topicType: "week-day",
      sourceType: "manual",
      tags: ["there-is", "grammar", "structured"],
      rawContent: structuredDay5Content,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    lessons.push(newDay5);
  }

  localStorage.setItem("eng_lessons", JSON.stringify(lessons));
  localStorage.setItem(seedFlag, "1");
}

