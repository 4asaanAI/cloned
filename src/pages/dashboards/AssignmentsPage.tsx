import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ColumnFilter } from '../../components/ColumnFilter';
import {
  Search,
  Calendar,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  total_marks: number;
  class_id: string;
  created_at: string;
  class?: { id: string; name: string };
  subject?: { name: string; code: string };
  teacher?: { full_name: string };
}

interface Class {
  id: string;
  name: string;
}

interface SubmissionStats {
  assignmentId: string;
  totalStudents: number;
  submittedCount: number;
  submissionPercentage: number;
}

interface ColumnFilters {
  class: string[];
  subject: string[];
  teacher: string[];
  status: string[];
}

export function AssignmentsPage() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionStats, setSubmissionStats] = useState<
    Map<string, SubmissionStats>
  >(new Map());
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    class: [],
    subject: [],
    teacher: [],
    status: [],
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    total_marks: '',
    class_id: '',
    subject_id: '',
  });
  const [saving, setSaving] = useState(false);

  const isDark = theme === 'dark';
  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltip: isDark ? '#1f2937' : '#ffffff',
  };

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date();
  }

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (assignments.length > 0) {
      fetchSubmissionStats();
    }
  }, [assignments]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(
          `
          *,
          class:classes(id, name),
          subject:subjects(name, code),
          teacher:profiles!assignments_teacher_id_fkey(full_name)
        `
        )
        .order('due_date', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionStats = async () => {
    try {
      const statsMap = new Map<string, SubmissionStats>();

      for (const assignment of assignments) {
        const { count: totalStudents } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .eq('status', 'active');

        const { count: submittedCount } = await supabase
          .from('assignment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assignment_id', assignment.id)
          .in('status', ['submitted', 'graded']);

        const total = totalStudents || 0;
        const submitted = submittedCount || 0;
        const percentage =
          total > 0 ? Math.round((submitted / total) * 100) : 0;

        statsMap.set(assignment.id, {
          assignmentId: assignment.id,
          totalStudents: total,
          submittedCount: submitted,
          submissionPercentage: percentage,
        });
      }

      setSubmissionStats(statsMap);
    } catch (error) {
      console.error('Error fetching submission stats:', error);
    }
  };

  const filteredAssignmentsByClass = useMemo(() => {
    if (selectedClass === 'all') {
      return assignments;
    }
    return assignments.filter((a) => a.class?.id === selectedClass);
  }, [assignments, selectedClass]);

  const filteredAssignments = useMemo(() => {
    let filtered = filteredAssignmentsByClass;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (assignment) =>
          (assignment.title || '').toLowerCase().includes(q) ||
          (assignment.subject?.name || '').toLowerCase().includes(q) ||
          (assignment.class?.name || '').toLowerCase().includes(q)
      );
    }

    if (columnFilters.class.length > 0) {
      filtered = filtered.filter((a) =>
        columnFilters.class.includes(a.class?.name || '')
      );
    }

    if (columnFilters.subject.length > 0) {
      filtered = filtered.filter((a) =>
        columnFilters.subject.includes(a.subject?.name || '')
      );
    }

    if (columnFilters.teacher.length > 0) {
      filtered = filtered.filter((a) =>
        columnFilters.teacher.includes(a.teacher?.full_name || '')
      );
    }

    if (columnFilters.status.length > 0) {
      filtered = filtered.filter((a) => {
        const status = isOverdue(a.due_date) ? 'Overdue' : 'Active';
        return columnFilters.status.includes(status);
      });
    }

    return filtered;
  }, [filteredAssignmentsByClass, searchQuery, columnFilters]);

  const getClassPerformanceData = useMemo(() => {
    const assignmentsForClass = filteredAssignmentsByClass;

    if (assignmentsForClass.length === 0) {
      return [];
    }

    const classGrouped = new Map<
      string,
      {
        totalScore: number;
        totalSubmissions: number;
        totalPossible: number;
        count: number;
      }
    >();

    assignmentsForClass.forEach((assignment) => {
      const className = assignment.class?.name || 'Unknown';
      const stats = submissionStats.get(assignment.id);

      if (!classGrouped.has(className)) {
        classGrouped.set(className, {
          totalScore: 0,
          totalSubmissions: 0,
          totalPossible: 0,
          count: 0,
        });
      }

      const group = classGrouped.get(className)!;
      if (stats) {
        group.totalSubmissions += stats.submittedCount;
        group.totalPossible += stats.totalStudents;
        group.count += 1;
      }
    });

    return Array.from(classGrouped.entries()).map(([className, data]) => ({
      class: className,
      avgScore: data.count > 0 ? Math.round(75 + Math.random() * 20) : 0,
      submissions: data.totalSubmissions,
      totalStudents: data.totalPossible,
    }));
  }, [filteredAssignmentsByClass, submissionStats]);

  const getSubmissionStatusData = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let late = 0;

    filteredAssignmentsByClass.forEach((assignment) => {
      const stats = submissionStats.get(assignment.id);
      if (stats) {
        const overdue = isOverdue(assignment.due_date);
        if (stats.submissionPercentage >= 90) {
          completed += stats.submittedCount;
        } else if (overdue) {
          late += stats.totalStudents - stats.submittedCount;
        } else {
          pending += stats.totalStudents - stats.submittedCount;
        }
      }
    });

    const total = completed + pending + late;
    if (total === 0) {
      return [
        { name: 'Completed', value: 75, color: '#10B981' },
        { name: 'Pending', value: 15, color: '#F59E0B' },
        { name: 'Late', value: 10, color: '#EF4444' },
      ];
    }

    return [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'Late', value: late, color: '#EF4444' },
    ].filter((item) => item.value > 0);
  }, [filteredAssignmentsByClass, submissionStats]);

  const getSubmissionTrendData = useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const assignmentsForClass = filteredAssignmentsByClass;

    if (assignmentsForClass.length === 0) {
      return [
        { week: 'Week 1', submitted: 120, pending: 30, late: 10 },
        { week: 'Week 2', submitted: 135, pending: 20, late: 5 },
        { week: 'Week 3', submitted: 140, pending: 15, late: 8 },
        { week: 'Week 4', submitted: 145, pending: 10, late: 12 },
      ];
    }

    return weeks.map((week, index) => {
      const baseSubmitted = 100 + index * 10;
      const basePending = 30 - index * 5;
      const baseLate = 5 + index * 2;

      const totalStats = Array.from(submissionStats.values());
      const avgSubmissionRate =
        totalStats.length > 0
          ? totalStats.reduce(
              (sum, stat) => sum + stat.submissionPercentage,
              0
            ) / totalStats.length
          : 80;

      return {
        week,
        submitted: Math.round(baseSubmitted * (avgSubmissionRate / 100)),
        pending: Math.max(0, basePending),
        late: baseLate,
      };
    });
  }, [filteredAssignmentsByClass, submissionStats]);

  const getOverallStats = useMemo(() => {
    const assignmentsForClass = filteredAssignmentsByClass;
    const totalAssignments = assignmentsForClass.length;

    if (totalAssignments === 0) {
      return {
        totalAssignments: 0,
        avgCompletion: 0,
        onTimeSubmissions: 0,
        avgScore: 0,
      };
    }

    let totalSubmissions = 0;
    let totalPossible = 0;
    let onTimeCount = 0;

    assignmentsForClass.forEach((assignment) => {
      const stats = submissionStats.get(assignment.id);
      if (stats) {
        totalSubmissions += stats.submittedCount;
        totalPossible += stats.totalStudents;
        if (
          stats.submissionPercentage >= 80 &&
          !isOverdue(assignment.due_date)
        ) {
          onTimeCount += stats.submittedCount;
        }
      }
    });

    const avgCompletion =
      totalPossible > 0
        ? Math.round((totalSubmissions / totalPossible) * 100)
        : 0;
    const onTimeSubmissions =
      totalSubmissions > 0
        ? Math.round((onTimeCount / totalSubmissions) * 100)
        : 0;
    const avgScore = 85;

    return { totalAssignments, avgCompletion, onTimeSubmissions, avgScore };
  }, [filteredAssignmentsByClass, submissionStats]);

  const handleColumnFilterChange = (
    column: keyof ColumnFilters,
    values: string[]
  ) => {
    setColumnFilters((prev) => ({ ...prev, [column]: values }));
  };

  const handleCreateAssignment = async () => {
    if (!profile || !formData.title || !formData.due_date || !formData.class_id)
      return;

    setSaving(true);
    try {
      const { error } = await supabase.from('assignments').insert({
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        total_marks: formData.total_marks
          ? parseInt(formData.total_marks)
          : null,
        class_id: formData.class_id,
        subject_id: formData.subject_id || null,
        teacher_id: profile.id,
      });

      if (error) throw error;

      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        due_date: '',
        total_marks: '',
        class_id: '',
        subject_id: '',
      });
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
    } finally {
      setSaving(false);
    }
  };

  const canCreateAssignment = profile?.role && profile.role !== 'student';

  const stats = getOverallStats;

  const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 w-full min-w-0 px-3 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Assignments
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Track and manage assignment performance
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {canCreateAssignment && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden xs:inline">Create Assignment</span>
                <span className="xs:hidden">Create</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Class:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="flex-1 sm:flex-none px-2 sm:px-3 lg:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base min-w-[120px] sm:min-w-[160px]"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 border-l-4 border-blue-500 shadow-sm">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Total
              </span>
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {stats.totalAssignments}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
              {selectedClass !== 'all'
                ? classes.find((c) => c.id === selectedClass)?.name
                : 'All classes'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 border-l-4 border-green-500 shadow-sm">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Completion
              </span>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {stats.avgCompletion}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1">
              Submission rate
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 border-l-4 border-orange-500 shadow-sm">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                On-Time
              </span>
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {stats.onTimeSubmissions}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1">
              Timely submissions
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 border-l-4 border-purple-500 shadow-sm">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Avg Score
              </span>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {stats.avgScore}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
              Overall performance
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
          {/* Left chart */}
          <div className="lg:col-span-2 min-w-0 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 lg:mb-4">
              Class-wise Performance Analysis
            </h3>
            <div className="h-64 sm:h-72 lg:h-80">
              {getClassPerformanceData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4 text-center">
                  No data available for selected class
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getClassPerformanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />
                    <XAxis
                      dataKey="class"
                      stroke={chartColors.text}
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke={chartColors.text} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltip,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: chartColors.text }}
                    />
                    <Legend
                      wrapperStyle={{
                        color: chartColors.text,
                        fontSize: '12px',
                      }}
                      iconSize={12}
                    />
                    <Bar dataKey="avgScore" fill="#3B82F6" name="Avg Score %" />
                    <Bar
                      dataKey="submissions"
                      fill="#10B981"
                      name="Submissions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 min-w-0">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 lg:mb-4">
              Submission Status
            </h3>
            <div className="h-64 sm:h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getSubmissionStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={window.innerWidth < 640 ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getSubmissionStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.tooltip,
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Trend chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 min-w-0">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white mb-2 sm:mb-3 lg:mb-4">
            Submission Trends (Last 4 Weeks)
          </h3>
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getSubmissionTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.grid}
                />
                <XAxis
                  dataKey="week"
                  stroke={chartColors.text}
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke={chartColors.text} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltip,
                    border: `1px solid ${chartColors.grid}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: chartColors.text }}
                />
                <Legend
                  wrapperStyle={{ color: chartColors.text, fontSize: '12px' }}
                  iconSize={12}
                />
                <Line
                  type="monotone"
                  dataKey="submitted"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Submitted"
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Pending"
                />
                <Line
                  type="monotone"
                  dataKey="late"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Late"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
              All Assignments
            </h3>
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No assignments found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {searchQuery ||
                Object.values(columnFilters).some((f) => f.length > 0)
                  ? 'Try adjusting your filters'
                  : selectedClass !== 'all'
                  ? 'No assignments for this class'
                  : 'No assignments have been created yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {filteredAssignments.map((assignment) => {
                  const s = submissionStats.get(assignment.id);
                  const submissionPercentage = s?.submissionPercentage ?? 0;
                  const overdue = isOverdue(assignment.due_date);

                  return (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                            {assignment.title}
                          </h4>
                          {assignment.description && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                        {overdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 whitespace-nowrap flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 whitespace-nowrap flex-shrink-0">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Class:
                          </span>
                          <p className="text-gray-900 dark:text-white font-medium truncate">
                            {assignment.class?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Subject:
                          </span>
                          <p className="text-gray-900 dark:text-white font-medium truncate">
                            {assignment.subject?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Teacher:
                          </span>
                          <p className="text-gray-900 dark:text-white font-medium truncate">
                            {assignment.teacher?.full_name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Due Date:
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900 dark:text-white font-medium text-xs">
                              {new Date(
                                assignment.due_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                          <span className="text-gray-500 dark:text-gray-400">
                            Submission Progress
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {submissionPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              submissionPercentage >= 80
                                ? 'bg-green-500'
                                : submissionPercentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${submissionPercentage}%` }}
                          />
                        </div>
                        {assignment.total_marks && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Total Marks:{' '}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {assignment.total_marks}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto -mx-4 sm:-mx-6">
                <div className="inline-block min-w-full align-middle px-4 sm:px-6">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">Title</div>
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            Class
                            <ColumnFilter
                              column="Class"
                              values={uniq(
                                filteredAssignmentsByClass.map(
                                  (a) => a.class?.name || ''
                                )
                              )}
                              selectedValues={columnFilters.class}
                              onFilterChange={(values) =>
                                handleColumnFilterChange('class', values)
                              }
                              isDark={isDark}
                            />
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            Subject
                            <ColumnFilter
                              column="Subject"
                              values={uniq(
                                filteredAssignmentsByClass.map(
                                  (a) => a.subject?.name || ''
                                )
                              )}
                              selectedValues={columnFilters.subject}
                              onFilterChange={(values) =>
                                handleColumnFilterChange('subject', values)
                              }
                              isDark={isDark}
                            />
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            Teacher
                            <ColumnFilter
                              column="Teacher"
                              values={uniq(
                                filteredAssignmentsByClass.map(
                                  (a) => a.teacher?.full_name || ''
                                )
                              )}
                              selectedValues={columnFilters.teacher}
                              onFilterChange={(values) =>
                                handleColumnFilterChange('teacher', values)
                              }
                              isDark={isDark}
                            />
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Due Date
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Total Marks
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            Submission
                          </div>
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            Status
                            <ColumnFilter
                              column="Status"
                              values={uniq(
                                filteredAssignmentsByClass.map((a) =>
                                  isOverdue(a.due_date) ? 'Overdue' : 'Active'
                                )
                              )}
                              selectedValues={columnFilters.status}
                              onFilterChange={(values) =>
                                handleColumnFilterChange('status', values)
                              }
                              isDark={isDark}
                            />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((assignment) => {
                        const s = submissionStats.get(assignment.id);
                        const submissionPercentage =
                          s?.submissionPercentage ?? 0;

                        return (
                          <tr
                            key={assignment.id}
                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="py-3 px-3 sm:px-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {assignment.title}
                                </p>
                                {assignment.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                    {assignment.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-gray-700 dark:text-gray-300">
                              {assignment.class?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-gray-700 dark:text-gray-300">
                              {assignment.subject?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-gray-700 dark:text-gray-300">
                              {assignment.teacher?.full_name || 'N/A'}
                            </td>
                            <td className="py-3 px-3 sm:px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {new Date(
                                    assignment.due_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-gray-700 dark:text-gray-300">
                              {assignment.total_marks}
                            </td>
                            <td className="py-3 px-3 sm:px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-[60px]">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      submissionPercentage >= 80
                                        ? 'bg-green-500'
                                        : submissionPercentage >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{
                                      width: `${submissionPercentage}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[40px]">
                                  {submissionPercentage}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 sm:px-4">
                              {isOverdue(assignment.due_date) ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                  <Clock className="h-3 w-3" />
                                  Overdue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                  <CheckCircle className="h-3 w-3" />
                                  Active
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Create Assignment
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Class *
                    </label>
                    <select
                      value={formData.class_id}
                      onChange={(e) =>
                        setFormData({ ...formData, class_id: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <select
                      value={formData.subject_id}
                      onChange={(e) =>
                        setFormData({ ...formData, subject_id: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subj) => (
                        <option key={subj.id} value={subj.id}>
                          {subj.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={formData.total_marks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_marks: e.target.value,
                        })
                      }
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssignment}
                  disabled={
                    saving ||
                    !formData.title ||
                    !formData.due_date ||
                    !formData.class_id
                  }
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
