import { useAuth } from '../../contexts/AuthContext';
import { CoordinatorDashboard } from './CoordinatorDashboard';
import { TeacherDashboard } from './TeacherDashboard';

export function ProfessorDashboard() {
  const { profile } = useAuth();

  if (!profile) return null;

  switch (profile.sub_role) {
    case 'coordinator':
      return <CoordinatorDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    default:
      return <TeacherDashboard />;
  }
}
