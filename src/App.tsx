import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { DashboardRouter } from './pages/dashboards/DashboardRouter';
import { UsersPage } from './pages/dashboards/UsersPage';
import { ClassesPage } from './pages/dashboards/ClassesPage';
import { ProfilePage } from './pages/dashboards/ProfilePage';
import { MessagesPage } from './pages/dashboards/MessagesPage';
import { AnnouncementsPage } from './pages/dashboards/AnnouncementsPage';
import { AssignmentsPage } from './pages/dashboards/AssignmentsPage';
import { NewApprovalsPage } from './pages/dashboards/NewApprovalsPage';
import { ExamsPage } from './pages/dashboards/ExamsPage';
import { ResultsPage } from './pages/dashboards/ResultsPage';
import { EventsPage } from './pages/dashboards/EventsPage';
import { FinancePage } from './pages/dashboards/FinancePage';
import { SupportPage } from './pages/dashboards/SupportPage';
import { LeavesPage } from './pages/dashboards/LeavesPage';
import { TransportPage } from './pages/dashboards/TransportPage';
import { InventoryPage } from './pages/dashboards/InventoryPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/classes"
              element={
                <ProtectedRoute>
                  <ClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/announcements"
              element={
                <ProtectedRoute>
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/assignments"
              element={
                <ProtectedRoute>
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/finance"
              element={
                <ProtectedRoute>
                  <FinancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/support"
              element={
                <ProtectedRoute>
                  <SupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/approvals"
              element={
                <ProtectedRoute>
                  <NewApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exams"
              element={
                <ProtectedRoute>
                  <ExamsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/results"
              element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/leaves"
              element={
                <ProtectedRoute>
                  <LeavesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/transport"
              element={
                <ProtectedRoute>
                  <TransportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
