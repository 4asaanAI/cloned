import { useAuth } from '../../contexts/AuthContext';
import { HeadDashboard } from './HeadDashboard';
import { PrincipalDashboard } from './PrincipalDashboard';
import { HODDashboard } from './HODDashboard';

export function AdminDashboard() {
  const { profile } = useAuth();

  if (!profile) return null;

  switch (profile.sub_role) {
    case 'head':
      return <HeadDashboard />;
    case 'principal':
      return <PrincipalDashboard />;
    case 'hod':
      return <HODDashboard />;
    case 'other':
      return <PrincipalDashboard />;
    default:
      return <PrincipalDashboard />;
  }
}
