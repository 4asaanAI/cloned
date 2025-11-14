import { ReactNode, useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Menu, X, Home, Users, BookOpen, Bell, Moon, Sun, FileText,
  LogOut, Calendar, Library, UserCircle, BarChart3,
  ClipboardList, Award, UserCheck, MailOpen, DollarSign, HelpCircle, Plane, Bus, Package
} from 'lucide-react';
import { DashboardChatbot } from './DashboardChatbot';
import { GlobalSearch } from './GlobalSearch';
import { TokenDisplay } from './TokenDisplay';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [, setPendingApprovalsCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchPendingApprovals();
      subscribeToApprovals();
    }
  }, [profile]);

  const fetchPendingApprovals = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      if (error) throw error;
      setPendingApprovalsCount(count || 0);

      // Generate notifications for pending approvals
      if (count && count > 0) {
        const { data: pendingData } = await supabase
          .from('profiles')
          .select('full_name, created_at, role')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        if (pendingData) {
          const notifs: Notification[] = pendingData.map((profile) => ({
            id: profile.created_at,
            title: 'New User Registration',
            message: `${profile.full_name} has requested ${profile.role} account approval`,
            created_at: profile.created_at
          }));
          setNotifications(notifs);
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const subscribeToApprovals = () => {
    const channel = supabase
      .channel('approval-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
          filter: 'approval_status=eq.pending'
        },
        () => {
          fetchPendingApprovals();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchPendingApprovals();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchPendingApprovals();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);


  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!profile) return [];

    const commonItems = [
      { name: 'Home', href: '/dashboard', icon: Home }
    ];

    if (profile.role === 'admin' || (profile.sub_role && (profile.sub_role === 'principal' || profile.sub_role === 'head'))) {
      return [
        ...commonItems,
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Classes', href: '/dashboard/classes', icon: BookOpen },
        { name: 'Exams', href: '/dashboard/exams', icon: ClipboardList },
        { name: 'Assignments', href: '/dashboard/assignments', icon: Award },
        { name: 'Results', href: '/dashboard/results', icon: BarChart3 },
        { name: 'Events', href: '/dashboard/events', icon: Calendar },
        { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
        { name: 'Messages', href: '/dashboard/messages', icon: MailOpen },
        { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
        { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
        { name: 'Leaves', href: '/dashboard/leaves', icon: Plane },
        { name: 'Transport', href: '/dashboard/transport', icon: Bus },
        { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
        { name: 'New Approvals', href: '/dashboard/approvals', icon: UserCheck }
      ];
    }

    if (profile.role === 'professor') {
      return [
        ...commonItems,
        { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
        { name: 'Students', href: '/dashboard/students', icon: Users },
        { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
        { name: 'Grades', href: '/dashboard/grades', icon: FileText }
      ];
    }

    if (profile.role === 'student') {
      return [
        ...commonItems,
        { name: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
        { name: 'Enrollments', href: '/dashboard/enrollments', icon: FileText },
        { name: 'Library', href: '/dashboard/library', icon: Library },
        { name: 'Grades', href: '/dashboard/grades', icon: BarChart3 }
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="fixed top-0 left-0 right-0 h-16 bg-blue-600 dark:bg-gray-800 text-white z-30 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-blue-700 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="text-xl font-bold hidden sm:block">The Aaryans</h1>
          <h1 className="text-lg font-bold sm:hidden">Aaryans</h1>
        </div>

        <GlobalSearch />

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <div className="hidden lg:block">
            <TokenDisplay />
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-md hover:bg-blue-700 dark:hover:bg-gray-700 relative"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    <>
                      {notifications.slice(0, 5).map((notif) => (
                        <Link
                          key={notif.id}
                          to="/dashboard/approvals"
                          onClick={() => setNotificationsOpen(false)}
                          className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </Link>
                      ))}
                      {notifications.length > 5 && (
                        <Link
                          to="/dashboard/approvals"
                          onClick={() => setNotificationsOpen(false)}
                          className="block px-4 py-3 text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          See all pending approvals
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-700 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {profile?.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-blue-100 dark:text-gray-400 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            transform transition-transform duration-300 ease-in-out lg:transform-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            mt-16 lg:mt-0
          `}
        >
          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-4rem)]">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <Link
                to="/dashboard/profile"
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <UserCircle className="h-5 w-5" />
                <span className="font-medium">Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DashboardChatbot />
    </div>
  );
}
