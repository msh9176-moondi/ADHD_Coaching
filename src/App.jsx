import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { AnalysisResultPage } from './pages/AnalysisResultPage'
import { SelfIntroPage } from './pages/SelfIntroPage'
import { CoachSelectionPage } from './pages/CoachSelectionPage'
import { MatchCompletePage } from './pages/MatchCompletePage'

// Coachee Pages - New Navigation Structure
import { TodayPage } from './pages/coachee/TodayPage'
import { CoachingPage } from './pages/coachee/CoachingPage'
import { AnalysisPage } from './pages/coachee/AnalysisPage'
import { UltramindDashboardPage } from './pages/coachee/UltramindDashboardPage'
import { SettingsPage } from './pages/coachee/SettingsPage'

// Coachee Pages - Legacy/Detail Pages
import { GoalsPage } from './pages/coachee/GoalsPage'
import { TasksPage } from './pages/coachee/TasksPage'
import { SchedulePage } from './pages/coachee/SchedulePage'
import { ReflectionsPage } from './pages/coachee/ReflectionsPage'
import { MessagesPage } from './pages/coachee/MessagesPage'
import { ASRSTestPage } from './pages/coachee/ASRSTestPage'
import { SurveyPage } from './pages/coachee/SurveyPage'
import { CoachingReportPage } from './pages/coachee/CoachingReportPage'
import { ExecutionGuidePage } from './pages/coachee/ExecutionGuidePage'
import { SubscriptionPlansPage } from './pages/coachee/SubscriptionPlansPage'
import UltramindProgramPage from './pages/coachee/UltramindProgramPage'
import MyProfilePage from './pages/coachee/MyProfilePage'

// Coach Pages
import { CoachDashboardPage } from './pages/coach/DashboardPage'
import { CoacheesPage } from './pages/coach/CoacheesPage'
import { CoacheeDetailPage } from './pages/coach/CoacheeDetailPage'
import { TasksPage as CoachTasksPage } from './pages/coach/TasksPage'
import { SessionPage } from './pages/coach/SessionPage'
import { CoachSchedulePage } from './pages/coach/SchedulePage'
import { CoachMessagesPage } from './pages/coach/MessagesPage'

function ProtectedRoute({ children, allowedRole }) {
  const { user, onboardingStatus } = useStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'coach' ? '/coach' : '/coachee'} replace />
  }

  // 피코치이고 온보딩이 완료되지 않았으면 온보딩으로 리다이렉트
  if (user.role === 'coachee' && !onboardingStatus?.completed) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

function OnboardingRoute({ children }) {
  const { user, onboardingStatus } = useStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 온보딩 완료된 사용자는 대시보드로
  if (onboardingStatus?.completed && user.role === 'coachee') {
    return <Navigate to="/coachee" replace />
  }

  return children
}

function App() {
  const { user, onboardingStatus } = useStore()

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Onboarding Routes (로그인 필요, 온보딩 미완료) */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <OnboardingRoute>
            <AnalysisResultPage />
          </OnboardingRoute>
        }
      />
      <Route
        path="/self-intro"
        element={
          <OnboardingRoute>
            <SelfIntroPage />
          </OnboardingRoute>
        }
      />
      <Route
        path="/select-coach"
        element={
          <OnboardingRoute>
            <CoachSelectionPage />
          </OnboardingRoute>
        }
      />
      <Route
        path="/match-complete"
        element={
          <OnboardingRoute>
            <MatchCompletePage />
          </OnboardingRoute>
        }
      />

      {/* Coachee Routes */}
      <Route
        path="/coachee"
        element={
          <ProtectedRoute allowedRole="coachee">
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Main Navigation Pages */}
        <Route index element={<Navigate to="today" replace />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="coaching" element={<CoachingPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="ultramind" element={<UltramindDashboardPage />} />
        <Route path="ultramind/program" element={<UltramindProgramPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Detail/Legacy Pages */}
        <Route path="goals" element={<GoalsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="reflections" element={<ReflectionsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="asrs-test" element={<ASRSTestPage />} />
        <Route path="survey" element={<SurveyPage />} />
        <Route path="report" element={<CoachingReportPage />} />
        <Route path="guide" element={<ExecutionGuidePage />} />
        <Route path="subscription" element={<SubscriptionPlansPage />} />
        <Route path="profile" element={<MyProfilePage />} />
      </Route>

      {/* Coach Routes */}
      <Route
        path="/coach"
        element={
          <ProtectedRoute allowedRole="coach">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CoachDashboardPage />} />
        <Route path="coachees" element={<CoacheesPage />} />
        <Route path="coachees/:id" element={<CoacheeDetailPage />} />
        <Route path="tasks" element={<CoachTasksPage />} />
        <Route path="sessions" element={<SessionPage />} />
        <Route path="schedule" element={<CoachSchedulePage />} />
        <Route path="messages" element={<CoachMessagesPage />} />
      </Route>

      {/* Default Redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'coach' ? '/coach' : '/coachee'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
