import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./components/layout/AppLayout";
import HomeButton from "./components/common/HomeButton";

import Home from "./home/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import LessonImport from "./pages/LessonImport";
import ImportPreview from "./pages/ImportPreview";
import LessonLibrary from "./pages/LessonLibrary";
import LessonDetail from "./pages/LessonDetail";
import History from "./pages/History";

import DailyLessonDetail from "./pages/DailyLessonDetail";
import Prepositions from "./pages/Prepositions";
import PrepositionDetail from "./pages/PrepositionDetail";
import DailyLessonPractice from "./pages/DailyLessonPractice";
import PrepositionPractice from "./pages/PrepositionPractice";
import Speaking from "./pages/Speaking";
import Writing from "./pages/Writing";
import Reading from "./pages/Reading";
import Vocabulary from "./pages/Vocabulary";
import Grammar from "./pages/Grammar";
import Homework from "./pages/Homework";
import Mistakes from "./pages/Mistakes";
import Progress from "./pages/Progress";
import Profile from "./userProfile/UserProfilePage";
import ExtensionInbox from "./pages/ExtensionInbox";
import EnglishSetup from "./pages/EnglishSetup";
import NotFound from "./pages/NotFound";
import PersonalImport from "./pages/PersonalImport";
import EnglishAssessment from "./pages/EnglishAssessment";
import EnglishAssessmentResult from "./pages/EnglishAssessmentResult";

// New separated module routes
import Modules from "./pages/Modules";
import EnglishModule from "./pages/EnglishModule";
import EnglishCourse from "./pages/EnglishCourse";
import EnglishPractice from "./pages/EnglishPractice";
import EnglishReport from "./pages/EnglishReport";
import PrepositionsPractice from "./pages/PrepositionsPractice";
import PrepositionsReport from "./pages/PrepositionsReport";
import Reports from "./pages/Reports";
import AINotebook from "./pages/AINotebook";
import SectionDetailView from "./components/lesson/SectionDetailView";
import SmartRevision from "./pages/SmartRevision";
import PracticeCenter from "./pages/PracticeCenter";

// Admin Pages & Layout
import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminDayLessons from "./admin/pages/AdminDayLessons";
import AdminSelectedDay from "./admin/pages/AdminSelectedDay";
import AdminPasteDayContent from "./admin/pages/AdminPasteDayContent";
import AdminEditSection from "./admin/pages/AdminEditSection";
import AdminSettings from "./admin/pages/AdminSettings";

/** Redirects to /login when the user is not authenticated. */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/** Wraps all protected pages in the app shell (sidebar + navbar + bottom nav). */
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <>
      {/* Global floating Home button — auto-applies to every page.
          It hides itself on "/" and on app-shell pages (those show the
          inline Home button inside the navbar instead). */}
      <HomeButton />

      <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lesson-import" element={<LessonImport />} />
        <Route path="/import-preview" element={<ImportPreview />} />
        <Route path="/personal-import" element={<PersonalImport />} />
        <Route path="/lesson-library" element={<LessonLibrary />} />
        <Route path="/lesson/:id" element={<LessonDetail />} />
        <Route path="/extension-inbox" element={<ExtensionInbox />} />
        <Route path="/history" element={<History />} />
          <Route path="/english-course" element={<EnglishCourse />} />
          <Route path="/daily-lessons/day/:dayNumber" element={<DailyLessonDetail />} />
          <Route path="/daily-lessons/day/:dayNumber/practice" element={<DailyLessonPractice />} />
          <Route path="/daily-lessons/day/:dayNumber/section/:sectionId" element={<SectionDetailView />} />
          <Route path="/daily-lessons" element={<Navigate to="/english-course" replace />} />
          <Route path="/daily-lessons/*" element={<Navigate to="/english-course" replace />} />
          <Route path="/english-course/daily-lessons" element={<Navigate to="/english-course" replace />} />
          <Route path="/english-course/daily-lessons/*" element={<Navigate to="/english-course" replace />} />
          <Route path="/lesson/:id/section/:sectionId" element={<SectionDetailView />} />
        
        {/* Separated Modules & Reports Entrypoints */}
        <Route path="/modules" element={<Modules />} />
        <Route path="/modules/english-course" element={<EnglishCourse />} />
        <Route path="/english" element={<EnglishModule />} />
        <Route path="/english/practice" element={<EnglishPractice />} />
        <Route path="/english/report" element={<EnglishReport />} />
        
        <Route path="/prepositions" element={<Prepositions />} />
        <Route path="/prepositions/practice" element={<PrepositionsPractice />} />
        <Route path="/prepositions/report" element={<PrepositionsReport />} />
        <Route path="/prepositions/:type" element={<PrepositionDetail />} />
        <Route path="/prepositions/:type/section/:sectionId" element={<SectionDetailView />} />
        
        <Route path="/reports" element={<Reports />} />

        <Route path="/practice/daily/:lessonId" element={<DailyLessonPractice />} />
        <Route
          path="/practice/preposition/:type"
          element={<PrepositionPractice />}
        />
        <Route path="/speaking" element={<Speaking />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/grammar" element={<Grammar />} />
        <Route path="/homework" element={<Homework />} />
        <Route path="/mistakes" element={<Mistakes />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/english-setup" element={<EnglishSetup />} />
        <Route path="/ai-notebook" element={<AINotebook />} />
        <Route path="/revision" element={<SmartRevision />} />
        <Route path="/practice-center" element={<PracticeCenter />} />
        <Route path="/english-assessment" element={<EnglishAssessment />} />
        <Route path="/english-assessment/result" element={<EnglishAssessmentResult />} />

      </Route>

      {/* Admin Routes with Dedicated AdminLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/day-lessons" element={<AdminDayLessons />} />
        <Route path="/admin/day-lessons/:dayNumber" element={<AdminSelectedDay />} />
        <Route path="/admin/day-lessons/:dayNumber/paste" element={<AdminPasteDayContent />} />
        <Route path="/admin/day-lessons/:dayNumber/section/:sectionHeading/edit" element={<AdminEditSection />} />
        <Route path="/admin/sections/:sectionId/edit" element={<AdminEditSection />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
