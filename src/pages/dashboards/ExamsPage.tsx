import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { RightSidebar } from '../../components/dashboard/RightSidebar';
import { ColumnFilter } from '../../components/ColumnFilter';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Calendar, Clock, MapPin, Users, UserCheck, UserX,
  TrendingUp, Search, Plus, Eye, Edit2, Trash2, Download, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface Exam {
  id: string;
  name: string;
  exam_code: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  status: string;
  total_marks: number;
  class_name?: string;
  subject_name?: string;
}

interface ExamFootfall {
  exam_id: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_percentage: number;
}

export function ExamsPage() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [footfallData, setFootfallData] = useState<Map<string, ExamFootfall>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [classes, setClasses] = useState<Array<{id: string; name: string}>>([]);
  const [subjects, setSubjects] = useState<Array<{id: string; name: string}>>([]);
  const [formData, setFormData] = useState({
    name: '',
    exam_code: '',
    exam_type: 'midterm',
    class_id: '',
    subject_id: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: '',
    total_marks: '',
    passing_marks: '',
    venue: '',
    instructions: '',
    status: 'scheduled',
  });
  const [saving, setSaving] = useState(false);

  const isDark = theme === 'dark';
  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltip: isDark ? '#1f2937' : '#ffffff'
  };

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchSubjects();
  }, []);

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

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          classes(name),
          subjects(name)
        `)
        .order('exam_date', { ascending: false });

      if (error) throw error;

      const formattedExams: Exam[] = (data || []).map((exam: any) => ({
        id: exam.id,
        name: exam.name,
        exam_code: exam.exam_code,
        exam_type: exam.exam_type,
        exam_date: exam.exam_date,
        start_time: exam.start_time,
        end_time: exam.end_time,
        venue: exam.venue,
        status: exam.status,
        total_marks: exam.total_marks,
        class_name: exam.classes?.name || 'N/A',
        subject_name: exam.subjects?.name || 'N/A'
      }));

      setExams(formattedExams);

      await fetchFootfallData(formattedExams.map(e => e.id));
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFootfallData = async (examIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('exam_attendance')
        .select('exam_id, status, student_id')
        .in('exam_id', examIds);

      if (error) throw error;

      const footfallMap = new Map<string, ExamFootfall>();

      examIds.forEach(examId => {
        const examAttendance = (data || []).filter((a: any) => a.exam_id === examId);
        const total = examAttendance.length;
        const present = examAttendance.filter((a: any) => a.status === 'present').length;
        const absent = examAttendance.filter((a: any) => a.status === 'absent').length;
        const late = examAttendance.filter((a: any) => a.status === 'late').length;

        footfallMap.set(examId, {
          exam_id: examId,
          total_students: total,
          present_count: present,
          absent_count: absent,
          late_count: late,
          attendance_percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0
        });
      });

      setFootfallData(footfallMap);
    } catch (error) {
      console.error('Error fetching footfall data:', error);
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch =
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.exam_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClasses.length === 0 || selectedClasses.includes(exam.class_name || '');
    const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(exam.subject_name || '');
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(exam.exam_type);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(exam.status);

    return matchesSearch && matchesClass && matchesSubject && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      ongoing: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const calculateOverallStats = () => {
    let totalExams = filteredExams.length;
    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let avgAttendance = 0;

    filteredExams.forEach(exam => {
      const footfall = footfallData.get(exam.id);
      if (footfall) {
        totalStudents += footfall.total_students;
        totalPresent += footfall.present_count;
        totalAbsent += footfall.absent_count;
      }
    });

    avgAttendance = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    return { totalExams, totalStudents, totalPresent, totalAbsent, avgAttendance };
  };

  const stats = calculateOverallStats();

  const handleCreateExam = async () => {
    if (!profile || !formData.name || !formData.exam_code || !formData.exam_date) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('exams').insert({
        name: formData.name,
        exam_code: formData.exam_code,
        exam_type: formData.exam_type,
        class_id: formData.class_id || null,
        subject_id: formData.subject_id || null,
        exam_date: formData.exam_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : 0,
        total_marks: formData.total_marks ? parseInt(formData.total_marks) : 0,
        passing_marks: formData.passing_marks ? parseInt(formData.passing_marks) : 0,
        venue: formData.venue,
        instructions: formData.instructions,
        status: formData.status,
        created_by: profile.id,
      });

      if (error) throw error;

      setShowCreateModal(false);
      setFormData({
        name: '',
        exam_code: '',
        exam_type: 'midterm',
        class_id: '',
        subject_id: '',
        exam_date: '',
        start_time: '',
        end_time: '',
        duration_minutes: '',
        total_marks: '',
        passing_marks: '',
        venue: '',
        instructions: '',
        status: 'scheduled',
      });
      fetchExams();
    } catch (error) {
      console.error('Error creating exam:', error);
    } finally {
      setSaving(false);
    }
  };

  const canCreateExam = profile?.role && profile.role !== 'student';

  const attendanceChartData = filteredExams.slice(0, 10).map(exam => {
    const footfall = footfallData.get(exam.id);
    return {
      name: exam.exam_code,
      present: footfall?.present_count || 0,
      absent: footfall?.absent_count || 0,
      late: footfall?.late_count || 0
    };
  });

  const pieData = [
    { name: 'Present', value: stats.totalPresent, color: '#10B981' },
    { name: 'Absent', value: stats.totalAbsent, color: '#EF4444' }
  ];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Exam Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage exams, track attendance, and monitor performance
              </p>
            </div>
            {canCreateExam && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add New Exam
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Exams</span>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.totalExams}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Present</span>
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.totalPresent}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Absent</span>
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.totalAbsent}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Attendance</span>
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.avgAttendance}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
                Attendance Overview (Last 10 Exams)
              </h3>
              <div className="h-[240px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="name" stroke={chartColors.text} />
                    <YAxis stroke={chartColors.text} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltip,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: chartColors.text }}
                    />
                    <Legend wrapperStyle={{ color: chartColors.text }} />
                    <Bar dataKey="present" fill="#10B981" name="Present" />
                    <Bar dataKey="late" fill="#F59E0B" name="Late" />
                    <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
                Overall Attendance Distribution
              </h3>
              <div className="h-[240px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name}: ${entry.value} (${(entry.percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltip,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Exam List</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-72 pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">Exam Code</div>
                      </th>
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">Name</div>
                      </th>
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Class
                          <ColumnFilter
                            column="Class"
                            values={exams.map(e => e.class_name || '')}
                            selectedValues={selectedClasses}
                            onFilterChange={setSelectedClasses}
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Subject
                          <ColumnFilter
                            column="Subject"
                            values={exams.map(e => e.subject_name || '')}
                            selectedValues={selectedSubjects}
                            onFilterChange={setSelectedSubjects}
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Type
                          <ColumnFilter
                            column="Type"
                            values={exams.map(e => e.exam_type)}
                            selectedValues={selectedTypes}
                            onFilterChange={setSelectedTypes}
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Venue</th>
                      <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Footfall</th>
                      <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Attendance %</th>
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Status
                          <ColumnFilter
                            column="Status"
                            values={exams.map(e => e.status)}
                            selectedValues={selectedStatuses}
                            onFilterChange={setSelectedStatuses}
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((exam) => {
                      const footfall = footfallData.get(exam.id);
                      return (
                        <tr
                          key={exam.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="py-3 px-3 sm:px-4 font-medium text-gray-800 dark:text-gray-200">
                            {exam.exam_code}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400">{exam.name}</td>
                          <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400">{exam.class_name}</td>
                          <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400">{exam.subject_name}</td>
                          <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400 capitalize">{exam.exam_type}</td>
                          <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(exam.exam_date).toLocaleDateString()}
                            </div>
                            {exam.start_time && (
                              <div className="flex items-center gap-2 text-xs mt-1">
                                <Clock className="h-3 w-3" />
                                {exam.start_time} - {exam.end_time}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400">
                            {exam.venue && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {exam.venue}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {footfall?.present_count || 0}/{footfall?.total_students || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                (footfall?.attendance_percentage || 0) >= 75
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : (footfall?.attendance_percentage || 0) >= 50
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {footfall?.attendance_percentage || 0}%
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4">{getStatusBadge(exam.status)}</td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredExams.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No exams found matching your filters
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <RightSidebar />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Exam</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Code *
                    </label>
                    <input
                      type="text"
                      value={formData.exam_code}
                      onChange={(e) => setFormData({ ...formData, exam_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Type *
                    </label>
                    <select
                      value={formData.exam_type}
                      onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="midterm">Midterm</option>
                      <option value="final">Final</option>
                      <option value="quiz">Quiz</option>
                      <option value="practical">Practical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Class
                    </label>
                    <select
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <select
                      value={formData.subject_id}
                      onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subj) => (
                        <option key={subj.id} value={subj.id}>{subj.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exam Date *
                    </label>
                    <input
                      type="date"
                      value={formData.exam_date}
                      onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Marks *
                    </label>
                    <input
                      type="number"
                      value={formData.total_marks}
                      onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Passing Marks *
                    </label>
                    <input
                      type="number"
                      value={formData.passing_marks}
                      onChange={(e) => setFormData({ ...formData, passing_marks: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateExam}
                  disabled={saving || !formData.name || !formData.exam_code || !formData.exam_date}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
