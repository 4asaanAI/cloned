import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { RightSidebar } from '../../components/dashboard/RightSidebar';
import { ColumnFilter } from '../../components/ColumnFilter';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  Search,
  Users as UsersIcon,
  GraduationCap,
  Briefcase,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  UserCheck,
  X,
  AlertCircle,
  FileText,
  Award,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BadgeCheck,
  Droplets,
  Clock,
  Home,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../components/Notification';
import { TransferCertificateModal } from '../../components/TransferCertificateModal';
import { EditHouseDutiesModal } from '../../components/EditHouseDutiesModal';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
  sub_role?: string;
  phone?: string;
  status: string;
  department_id?: string;
  employee_id?: string;
  admission_no?: string;
  created_at: string;
  updated_at?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  blood_group?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  parent_phone: string;
  parent_name?: string;
  photo_url?: string;
  house?: 'green' | 'blue' | 'red' | 'yellow' | null;
  duties?: string[] | null;
}

interface ColumnFilters {
  role: string[];
  status: string[];
  subRole: string[];
}

export function UsersPage() {
  const { profile: currentProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfile, setNewProfile] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    sub_role: '',
    phone: '',
    admission_no: '',
    employee_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    role: [],
    status: [],
    subRole: [],
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    type: 'approve' | 'delete';
    profile: Profile;
  } | null>(null);
  const [showTCModal, setShowTCModal] = useState<Profile | null>(null);
  const [showHouseDutiesModal, setShowHouseDutiesModal] =
    useState<Profile | null>(null);

  const isDark = theme === 'dark';

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    employees: 0,
  });

  useEffect(() => {
    fetchProfiles();
    if (currentProfile?.role === 'admin') {
      fetchPendingApprovals();
      subscribeToPendingApprovals();
    }
  }, [currentProfile]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);

      const students = data?.filter((p) => p.role === 'student').length || 0;
      const teachers =
        data?.filter((p) => p.role === 'professor' || p.role === 'teacher')
          .length || 0;
      const employees =
        data?.filter((p) => p.role === 'admin' || p.role === 'staff').length ||
        0;

      setStats({ students, teachers, employees });
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const subscribeToPendingApprovals = () => {
    const channel = supabase
      .channel('pending-approvals-users-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'approval_status=eq.pending',
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

  const handleApprove = async (profileId: string) => {
    setShowConfirmModal(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: currentProfile?.id,
          status: 'active',
        })
        .eq('id', profileId);

      if (error) throw error;

      setPendingApprovals((prev) => prev.filter((p) => p.id !== profileId));
      fetchProfiles();
      setNotification({
        type: 'success',
        message: 'User approved successfully!',
      });
    } catch (error) {
      console.error('Error approving user:', error);
      setNotification({
        type: 'error',
        message: 'Failed to approve user. Please try again.',
      });
    }
  };

  const canEditUser = (targetProfile: Profile): boolean => {
    if (!currentProfile) return false;

    if (
      currentProfile.sub_role !== 'head' &&
      currentProfile.sub_role !== 'principal'
    ) {
      return false;
    }

    if (targetProfile.id === currentProfile.id) {
      return false;
    }

    if (targetProfile.sub_role === 'head') {
      return false;
    }

    if (
      currentProfile.sub_role === 'head' &&
      targetProfile.sub_role === 'principal'
    ) {
      return false;
    }

    return true;
  };

  const canDeleteUser = (targetProfile: Profile): boolean => {
    return canEditUser(targetProfile);
  };

  const handleEditClick = (profile: Profile) => {
    setEditingProfile(profile);
    setShowEditModal(true);
  };

  const handleViewClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowDetailModal(true);
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // ⚠️ Use a separate client that never persists sessions
      const signUpClient = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false, // <-- prevents writing new tokens
            autoRefreshToken: false, // optional: don’t auto-refresh
            storageKey: 'sb-signup-helper', // isolated key if storage were used
          },
        }
      );

      // 1) Create auth user WITHOUT mutating your current session
      const { data: authData, error: authError } =
        await signUpClient.auth.signUp({
          email: newProfile.email,
          password: newProfile.password,
          options: {
            data: {
              full_name: newProfile.full_name,
              role: newProfile.role,
              sub_role: newProfile.sub_role,
            },
            // Optional: keep confirmations but send users back to YOUR app
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

      if (authError) throw authError;

      // 2) Set profile fields on the newly created user
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: newProfile.phone || null,
            admission_no: newProfile.admission_no || null,
            employee_id: newProfile.employee_id || null,
            approval_status: 'approved',
            approved_by: currentProfile?.id || null,
            approved_at: new Date().toISOString(),
            status: 'active',
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      setNotification({
        type: 'success',
        message: 'User created successfully!',
      });
      setShowAddModal(false);
      setNewProfile({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        sub_role: '',
        phone: '',
        admission_no: '',
        employee_id: '',
      });
      fetchProfiles();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to create user',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editingProfile.role,
          sub_role: editingProfile.sub_role,
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'User updated successfully!',
      });
      setShowEditModal(false);
      setEditingProfile(null);
      fetchProfiles();
    } catch (error) {
      console.error('Error updating user:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update user. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (!canDeleteUser(profile)) {
      setNotification({
        type: 'error',
        message: 'You do not have permission to delete this user.',
      });
      return;
    }

    setShowConfirmModal(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'User deleted successfully.',
      });
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.message.includes('foreign key')) {
        setNotification({
          type: 'error',
          message:
            'Cannot delete user: This user is referenced in other records (e.g., as HOD, class teacher, or assignment teacher). Please reassign those roles first.',
        });
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to delete user. Please try again.',
        });
      }
    }
  };

  const filteredProfiles = useMemo(() => {
    let filtered = [...profiles];

    if (searchTerm) {
      filtered = filtered.filter(
        (profile) =>
          profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.employee_id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          profile.admission_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (columnFilters.role.length > 0) {
      filtered = filtered.filter((profile) =>
        columnFilters.role.includes(profile.role)
      );
    }

    if (columnFilters.status.length > 0) {
      filtered = filtered.filter((profile) =>
        columnFilters.status.includes(profile.status)
      );
    }

    if (columnFilters.subRole.length > 0) {
      filtered = filtered.filter((profile) =>
        columnFilters.subRole.includes(profile.sub_role || '')
      );
    }

    return filtered;
  }, [profiles, searchTerm, columnFilters]);

  const handleColumnFilterChange = (
    column: keyof ColumnFilters,
    values: string[]
  ) => {
    setColumnFilters((prev) => ({ ...prev, [column]: values }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'professor':
      case 'teacher':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getHouseBadgeColor = (house?: string | null) => {
    switch (house) {
      case 'green':
        return 'bg-green-500 text-white';
      case 'blue':
        return 'bg-blue-500 text-white';
      case 'red':
        return 'bg-red-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'suspended':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const availableRoles = ['admin', 'professor', 'student'];
  const availableSubRoles: Record<string, string[]> = {
    admin: ['head', 'principal', 'hod', 'other'],
    professor: ['coordinator', 'teacher'],
    student: ['student'],
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Users Management
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Add User</span>
              </button>
              {currentProfile?.role === 'admin' &&
                pendingApprovals.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowPendingDropdown(!showPendingDropdown)
                      }
                      className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                      title={`${pendingApprovals.length} pending approvals`}
                    >
                      <Plus className="h-5 w-5" />
                      <span className="font-semibold">
                        {pendingApprovals.length}
                      </span>
                      {showPendingDropdown ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {showPendingDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Pending Approvals
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {pendingApprovals.length} new registration
                            {pendingApprovals.length !== 1 ? 's' : ''} awaiting
                            approval
                          </p>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {pendingApprovals.slice(0, 5).map((pending) => (
                            <div
                              key={pending.id}
                              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {pending.full_name}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {pending.email}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                        pending.role
                                      )}`}
                                    >
                                      {pending.role}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                      {new Date(
                                        pending.created_at
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    setShowConfirmModal({
                                      type: 'approve',
                                      profile: pending,
                                    })
                                  }
                                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium flex items-center gap-1"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Approve
                                </button>
                              </div>
                            </div>
                          ))}
                          {pendingApprovals.length > 5 && (
                            <button
                              onClick={() => {
                                setShowPendingDropdown(false);
                                navigate('/dashboard/approvals');
                              }}
                              className="w-full px-4 py-3 text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              See more ({pendingApprovals.length - 5} remaining)
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-400 dark:bg-blue-600 rounded-2xl p-5 cursor-pointer hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <GraduationCap className="h-8 w-8 text-white" />
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.students}
              </div>
              <div className="text-blue-50 text-sm font-medium">Students</div>
            </div>

            <div className="bg-green-400 dark:bg-green-600 rounded-2xl p-5 cursor-pointer hover:bg-green-500 dark:hover:bg-green-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <Briefcase className="h-8 w-8 text-white" />
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.teachers}
              </div>
              <div className="text-green-50 text-sm font-medium">Teachers</div>
            </div>

            <div className="bg-purple-400 dark:bg-purple-600 rounded-2xl p-5 cursor-pointer hover:bg-purple-500 dark:hover:bg-purple-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <UsersIcon className="h-8 w-8 text-white" />
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.employees}
              </div>
              <div className="text-purple-50 text-sm font-medium">
                Employees
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5">
            <div className="flex flex-col lg:flex-row gap-4 mb-5">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Loading users...
                  </p>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No users found matching your criteria
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Role
                          <ColumnFilter
                            column="Role"
                            values={profiles.map((p) => p.role)}
                            selectedValues={columnFilters.role}
                            onFilterChange={(values) =>
                              handleColumnFilterChange('role', values)
                            }
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Sub Role
                          <ColumnFilter
                            column="Sub Role"
                            values={profiles.map((p) => p.sub_role || '')}
                            selectedValues={columnFilters.subRole}
                            onFilterChange={(values) =>
                              handleColumnFilterChange('subRole', values)
                            }
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Contact
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Status
                          <ColumnFilter
                            column="Status"
                            values={profiles.map((p) => p.status)}
                            selectedValues={columnFilters.status}
                            onFilterChange={(values) =>
                              handleColumnFilterChange('status', values)
                            }
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => (
                      <tr
                        key={profile.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                {profile.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {profile.full_name}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {profile.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                              profile.role
                            )}`}
                          >
                            {profile.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 capitalize">
                          {profile.sub_role || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {profile.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {profile.employee_id || profile.admission_no || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              profile.status
                            )}`}
                          >
                            {profile.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewClick(profile)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canEditUser(profile) && (
                              <button
                                onClick={() => handleEditClick(profile)}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canDeleteUser(profile) && (
                              <button
                                onClick={() =>
                                  setShowConfirmModal({
                                    type: 'delete',
                                    profile,
                                  })
                                }
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredProfiles.length} of {profiles.length} users
              </div>
            </div>
          </div>
        </div>

        <RightSidebar />
      </div>

      {showEditModal && editingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit User Role
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-semibold mb-1">
                      Editing: {editingProfile.full_name}
                    </p>
                    <p className="text-blue-800 dark:text-blue-400">
                      {editingProfile.email}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={editingProfile.role}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      role: e.target.value as 'admin' | 'professor' | 'student',
                      sub_role: '',
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sub Role
                </label>
                <select
                  value={editingProfile.sub_role || ''}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      sub_role: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select sub role</option>
                  {availableSubRoles[editingProfile.role]?.map((subRole) => (
                    <option key={subRole} value={subRole}>
                      {subRole}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {showConfirmModal.type === 'approve'
                    ? 'Approve User'
                    : 'Delete User'}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {showConfirmModal.type === 'approve'
                    ? `Are you sure you want to approve ${showConfirmModal.profile.full_name}? This action cannot be undone.`
                    : `Are you sure you want to delete ${showConfirmModal.profile.full_name}?`}
                </p>
                {showConfirmModal.type === 'delete' && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-900 dark:text-red-300 font-semibold mb-2">
                      This will permanently delete:
                    </p>
                    <ul className="text-xs text-red-800 dark:text-red-400 list-disc list-inside space-y-1">
                      <li>User profile</li>
                      <li>All messages sent/received</li>
                      <li>
                        Student records (attendance, assignments, exam results,
                        fees, etc.)
                      </li>
                      <li>Leave applications</li>
                      <li>Library transactions</li>
                      <li>Transport records</li>
                    </ul>
                    <p className="text-sm text-red-900 dark:text-red-300 font-semibold mt-2">
                      This action CANNOT be undone!
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  showConfirmModal.type === 'approve'
                    ? handleApprove(showConfirmModal.profile.id)
                    : handleDeleteUser(showConfirmModal.profile)
                }
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  showConfirmModal.type === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {showConfirmModal.type === 'approve' ? 'Approve' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl my-6 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
            {/* Header (reduced height) */}
            <div className="relative h-32 md:h-36 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAxMmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all duration-200 hover:scale-110"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile header (tightened spacing) */}
            <div className="px-6 md:px-8 mb-5">
              <div className="flex flex-col md:flex-row md:items-end gap-5">
                {/* Avatar */}
                <div className="shrink-0 -translate-y-12 md:-translate-y-14 relative z-10">
                  {selectedProfile.photo_url ? (
                    <img
                      src={selectedProfile.photo_url}
                      alt={selectedProfile.full_name}
                      className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-900 shadow-xl"
                    />
                  ) : (
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 ring-4 ring-white dark:ring-gray-900 shadow-xl flex items-center justify-center">
                      <span className="text-white text-4xl md:text-5xl font-bold">
                        {selectedProfile.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name and badges */}
                <div className="flex-1 pb-1 -mt-8 md:-mt-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                    {selectedProfile.full_name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${getRoleBadgeColor(
                        selectedProfile.role
                      )}`}
                    >
                      {selectedProfile.role}
                      {selectedProfile.sub_role &&
                        ` • ${selectedProfile.sub_role}`}
                    </span>

                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase ${getStatusBadgeColor(
                        selectedProfile.status
                      )}`}
                    >
                      {selectedProfile.status}
                    </span>

                    {selectedProfile.house && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getHouseBadgeColor(
                          selectedProfile.house
                        )}`}
                      >
                        <Home className="h-3.5 w-3.5" />
                        {selectedProfile.house} House
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedProfile.email}
                  </p>

                  {Array.isArray(selectedProfile.duties) &&
                    selectedProfile.duties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.duties.map((duty, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm"
                          >
                            {duty}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Main content (reduced gaps & padding) */}
            <div className="px-6 md:px-8 pb-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left column - Contact & IDs */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Contact Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm md:text-base">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <BadgeCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Email Address
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words">
                            {selectedProfile.email || 'Not provided'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Phone Number
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words">
                            {selectedProfile.phone || 'Not provided'}
                          </div>
                        </div>
                      </div>

                      {selectedProfile.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                              Address
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white break-words">
                              {selectedProfile.address}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Identifiers */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm md:text-base">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <BadgeCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      Identifiers
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Admission No
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedProfile.admission_no || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Employee ID
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedProfile.employee_id || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle column - Personal Info */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm md:text-base">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Date of Birth
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words">
                            {selectedProfile.date_of_birth
                              ? new Date(
                                  selectedProfile.date_of_birth
                                ).toLocaleDateString()
                              : 'Not provided'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Droplets className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Blood Group
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words">
                            {selectedProfile.blood_group || 'Not provided'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <UsersIcon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Gender
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words capitalize">
                            {selectedProfile.gender || 'Not provided'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <BadgeCheck className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Approval Status
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words capitalize">
                            {selectedProfile.approval_status || 'Pending'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 col-span-full">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                            Joined Date
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words">
                            {selectedProfile.created_at
                              ? new Date(
                                  selectedProfile.created_at
                                ).toLocaleDateString()
                              : 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parent/Guardian (only if phone exists) */}
                  {selectedProfile.parent_phone && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm md:text-base">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <UsersIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        Parent / Guardian
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-start gap-3">
                          <UsersIcon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                              Full Name
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white break-words">
                              {selectedProfile.parent_name || 'Not provided'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                              Contact Number
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white break-words">
                              {selectedProfile.parent_phone}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column - Actions & Audit */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Actions */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm md:text-base">
                      Quick Actions
                    </h3>
                    <div className="space-y-2">
                      {selectedProfile.role === 'student' &&
                        (currentProfile?.sub_role === 'head' ||
                          currentProfile?.sub_role === 'principal') && (
                          <button
                            onClick={() => {
                              setShowDetailModal(false);
                              setShowTCModal(selectedProfile);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Generate Transfer Certificate
                            </span>
                          </button>
                        )}

                      {(currentProfile?.sub_role === 'head' ||
                        currentProfile?.sub_role === 'principal') && (
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            setShowHouseDutiesModal(selectedProfile);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                        >
                          <Award className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Edit House & Duties
                          </span>
                        </button>
                      )}

                      {canEditUser(selectedProfile) && (
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            handleEditClick(selectedProfile);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Edit User Profile
                          </span>
                        </button>
                      )}

                      {canDeleteUser(selectedProfile) && (
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            setShowConfirmModal({
                              type: 'delete',
                              profile: selectedProfile,
                            });
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Delete User
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Audit Trail (kept minimal as per your latest) */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm md:text-base">
                      Audit Trail
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start py-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Last Updated
                        </span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white text-right">
                          {selectedProfile.updated_at
                            ? new Date(
                                selectedProfile.updated_at
                              ).toLocaleString()
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer (slimmer) */}
            <div className="px-6 md:px-8 pb-5 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-5">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New User
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProfile.full_name}
                    onChange={(e) =>
                      setNewProfile({
                        ...newProfile,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newProfile.email}
                    onChange={(e) =>
                      setNewProfile({ ...newProfile, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newProfile.password}
                    onChange={(e) =>
                      setNewProfile({ ...newProfile, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newProfile.phone}
                    onChange={(e) =>
                      setNewProfile({ ...newProfile, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={newProfile.role}
                    onChange={(e) =>
                      setNewProfile({
                        ...newProfile,
                        role: e.target.value,
                        sub_role: '',
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sub Role
                  </label>
                  <select
                    value={newProfile.sub_role}
                    onChange={(e) =>
                      setNewProfile({ ...newProfile, sub_role: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select sub role</option>
                    {availableSubRoles[newProfile.role]?.map((subRole) => (
                      <option key={subRole} value={subRole}>
                        {subRole}
                      </option>
                    ))}
                  </select>
                </div>
                {newProfile.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admission No
                    </label>
                    <input
                      type="text"
                      value={newProfile.admission_no}
                      onChange={(e) =>
                        setNewProfile({
                          ...newProfile,
                          admission_no: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
                {(newProfile.role === 'professor' ||
                  newProfile.role === 'admin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={newProfile.employee_id}
                      onChange={(e) =>
                        setNewProfile({
                          ...newProfile,
                          employee_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTCModal && currentProfile && (
        <TransferCertificateModal
          student={showTCModal}
          issuerId={currentProfile.id}
          onClose={() => setShowTCModal(null)}
          onSuccess={() => {
            setNotification({
              type: 'success',
              message: 'Transfer Certificate created successfully!',
            });
          }}
        />
      )}

      {showHouseDutiesModal && (
        <EditHouseDutiesModal
          profile={showHouseDutiesModal}
          onClose={() => setShowHouseDutiesModal(null)}
          onSuccess={() => {
            setNotification({
              type: 'success',
              message: 'House and Duties updated successfully!',
            });
            fetchProfiles();
          }}
        />
      )}
    </DashboardLayout>
  );
}
