import {
  NotebookText,
  Shapes,
  Library,
  Mic,
  BookOpen,
  PenLine,
  GraduationCap,
  CalendarDays,
  type LucideIcon
} from "lucide-react";

export interface SubModule {
  key: string;
  title: string;
  status: "active" | "coming-soon";
  route?: string;
  icon: LucideIcon;
}

export interface LearningModule {
  moduleKey: string;
  title: string;
  description: string;
  icon: LucideIcon;
  mainRoute: string;
  status: "active" | "coming-soon";
  subModules?: SubModule[];
  practiceRoute?: string;
  reportRoute?: string;
  historySourceTypes?: string[];
  progressSourceTypes?: string[];
}

export const learningModules: LearningModule[] = [
  {
    moduleKey: "english-course",
    title: "English Course",
    description: "Follow a beginner English path with lessons, vocabulary, reading, writing, speaking, and grammar practice.",
    icon: NotebookText,
    mainRoute: "/english",
    status: "active",
    practiceRoute: "/english/practice",
    reportRoute: "/english/report",
    subModules: [
      { key: "daily-lessons", title: "Daily Lessons", status: "active", route: "/english-course", icon: CalendarDays },
      { key: "vocabulary", title: "Vocabulary", status: "coming-soon", icon: Library },
      { key: "speaking-ai", title: "Speaking AI", status: "coming-soon", icon: Mic },
      { key: "reading", title: "Reading", status: "coming-soon", icon: BookOpen },
      { key: "writing-drafts", title: "Writing Drafts", status: "coming-soon", icon: PenLine },
      { key: "grammar-core", title: "Grammar Core", status: "coming-soon", icon: GraduationCap },
    ]
  },
  {
    moduleKey: "prepositions",
    title: "Prepositions",
    description: "Focus on in, on, at, and other small direction and time indicator words.",
    icon: Shapes,
    mainRoute: "/prepositions",
    status: "active",
    practiceRoute: "/prepositions/practice",
    reportRoute: "/prepositions/report",
    subModules: []
  }
];
