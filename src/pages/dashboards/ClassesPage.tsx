import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { RightSidebar } from '../../components/dashboard/RightSidebar';
import { Download, FileText, Image as ImageIcon, TrendingUp, TrendingDown, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../../components/Notification';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ClassData {
  id: string;
  name: string;
  grade_level: number;
  section: string;
  remarks?: string;
}

interface TeacherSubject {
  id: string;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  teacher_email: string;
}

interface PerformanceMetrics {
  subject: string;
  avgMarks: number;
  attendance: number;
  assignmentRate: number;
  participation: number;
  topStudents: number;
  midStudents: number;
  lowStudents: number;
}

export function ClassesPage() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classTeachers, setClassTeachers] = useState<TeacherSubject[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [remarksText, setRemarksText] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isDark = theme === 'dark';
  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltip: isDark ? '#1f2937' : '#ffffff'
  };

  const performanceData: PerformanceMetrics[] = [
    { subject: 'Mathematics', avgMarks: 78, attendance: 92, assignmentRate: 85, participation: 88, topStudents: 12, midStudents: 18, lowStudents: 5 },
    { subject: 'Science', avgMarks: 82, attendance: 90, assignmentRate: 88, participation: 85, topStudents: 15, midStudents: 15, lowStudents: 5 },
    { subject: 'English', avgMarks: 75, attendance: 88, assignmentRate: 90, participation: 92, topStudents: 10, midStudents: 20, lowStudents: 5 },
    { subject: 'History', avgMarks: 80, attendance: 85, assignmentRate: 82, participation: 80, topStudents: 13, midStudents: 17, lowStudents: 5 },
    { subject: 'Geography', avgMarks: 76, attendance: 87, assignmentRate: 84, participation: 83, topStudents: 11, midStudents: 19, lowStudents: 5 }
  ];

  const trendData = [
    { exam: 'Term 1', avgScore: 72, attendance: 88 },
    { exam: 'Mid-Term', avgScore: 76, attendance: 90 },
    { exam: 'Term 2', avgScore: 78, attendance: 89 }
  ];

  const radarData = performanceData.map(item => ({
    subject: item.subject,
    Performance: item.avgMarks,
    Attendance: item.attendance,
    Assignments: item.assignmentRate,
    Participation: item.participation
  }));

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassTeachers();
      const currentClass = classes.find(c => c.id === selectedClass);
      setRemarksText(currentClass?.remarks || '');
      setEditingRemarks(false);
    }
  }, [selectedClass, classes]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('status', 'active')
        .order('grade_level', { ascending: true });

      if (error) throw error;

      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchClassTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const { data, error } = await supabase
        .from('class_subjects')
        .select(`
          id,
          subjects(name, code),
          profiles(full_name, email)
        `)
        .eq('class_id', selectedClass);

      if (error) throw error;

      const formattedData: TeacherSubject[] = (data || []).map((item: any) => ({
        id: item.id,
        subject_name: item.subjects?.name || 'N/A',
        subject_code: item.subjects?.code || 'N/A',
        teacher_name: item.profiles?.full_name || 'N/A',
        teacher_email: item.profiles?.email || 'N/A'
      }));

      setClassTeachers(formattedData);
    } catch (error) {
      console.error('Error fetching class teachers:', error);
      setClassTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const getSelectedClassName = () => {
    const classData = classes.find(c => c.id === selectedClass);
    return classData ? `${classData.name}` : 'Select a Class';
  };

  const calculateOverallMetrics = () => {
    const avgMarks = performanceData.reduce((sum, item) => sum + item.avgMarks, 0) / performanceData.length;
    const avgAttendance = performanceData.reduce((sum, item) => sum + item.attendance, 0) / performanceData.length;
    const avgAssignment = performanceData.reduce((sum, item) => sum + item.assignmentRate, 0) / performanceData.length;
    const avgParticipation = performanceData.reduce((sum, item) => sum + item.participation, 0) / performanceData.length;

    return { avgMarks, avgAttendance, avgAssignment, avgParticipation };
  };

  const metrics = calculateOverallMetrics();

  const exportToPDF = () => {
    setNotification({ type: 'success', message: 'PDF export functionality would be implemented here' });
  };

  const exportToExcel = () => {
    setNotification({ type: 'success', message: 'Excel export functionality would be implemented here' });
  };

  const exportToImage = () => {
    setNotification({ type: 'success', message: 'Image export functionality would be implemented here' });
  };

  const handleSaveRemarks = async () => {
    if (!selectedClass) return;

    setSavingRemarks(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({ remarks: remarksText.trim() || null })
        .eq('id', selectedClass);

      if (error) throw error;

      setClasses(prev => prev.map(c =>
        c.id === selectedClass ? { ...c, remarks: remarksText.trim() || undefined } : c
      ));
      setEditingRemarks(false);
      setNotification({ type: 'success', message: 'Remarks saved successfully!' });
    } catch (error) {
      console.error('Error saving remarks:', error);
      setNotification({ type: 'error', message: 'Failed to save remarks. Please try again.' });
    } finally {
      setSavingRemarks(false);
    }
  };

  const canEditRemarks = () => {
    return profile?.sub_role === 'head' || profile?.sub_role === 'principal';
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Class Performance Analytics</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comprehensive performance metrics and insights</p>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[180px]"
              >
                {classes.map(classItem => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={exportToPDF}
                  className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  title="Export as PDF"
                >
                  <FileText className="h-5 w-5" />
                </button>
                <button
                  onClick={exportToExcel}
                  className="p-2.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  title="Export as Excel"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={exportToImage}
                  className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  title="Export as Image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-4 sm:p-6 text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{getSelectedClassName()} Performance Overview (2024-25)</h3>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-100 dark:text-blue-200 text-sm font-medium">Class Teacher:</span>
                <p className="text-white text-sm">Ms. Sarah Johnson</p>
              </div>
              <span className="hidden sm:inline text-blue-200 dark:text-blue-300">•</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-100 dark:text-blue-200 text-sm font-medium">Class Monitor:</span>
                <p className="text-white text-sm">John Doe</p>
              </div>
            </div>
          </div>

          {canEditRemarks() && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Class Remarks</h3>
                {!editingRemarks ? (
                  <button
                    onClick={() => setEditingRemarks(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Remarks
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveRemarks}
                      disabled={savingRemarks}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      {savingRemarks ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingRemarks(false);
                        const currentClass = classes.find(c => c.id === selectedClass);
                        setRemarksText(currentClass?.remarks || '');
                      }}
                      disabled={savingRemarks}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {editingRemarks ? (
                <textarea
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  placeholder="Enter remarks for this class..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                />
              ) : (
                <div className="min-h-[100px] px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {remarksText ? (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{remarksText}</p>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">No remarks added yet</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Marks</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{metrics.avgMarks.toFixed(1)}%</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">+3.2% from last term</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Attendance</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{metrics.avgAttendance.toFixed(1)}%</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">+1.5% from last term</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Assignments</span>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{metrics.avgAssignment.toFixed(1)}%</div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">-0.8% from last term</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Participation</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{metrics.avgParticipation.toFixed(1)}%</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">+2.1% from last term</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">Subject-wise Performance Metrics</h3>
            <div className="h-[320px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="subject" stroke={chartColors.text} />
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
                  <Bar dataKey="avgMarks" fill="#3B82F6" name="Avg Marks" />
                  <Bar dataKey="attendance" fill="#10B981" name="Attendance %" />
                  <Bar dataKey="assignmentRate" fill="#8B5CF6" name="Assignment Rate" />
                  <Bar dataKey="participation" fill="#F59E0B" name="Participation" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">Performance Radar Analysis</h3>
              <div className="h-[260px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={chartColors.grid} />
                    <PolarAngleAxis dataKey="subject" stroke={chartColors.text} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={chartColors.text} />
                    <Radar name="Performance" dataKey="Performance" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    <Radar name="Attendance" dataKey="Attendance" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Legend wrapperStyle={{ color: chartColors.text }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">Performance Trend - Last 3 Exams</h3>
              <div className="h-[260px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="exam" stroke={chartColors.text} />
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
                    <Line type="monotone" dataKey="avgScore" stroke="#3B82F6" strokeWidth={3} name="Avg Score" />
                    <Line type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={3} name="Attendance" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Detailed Performance Table</h3>
              <button className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
                Download Table
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Subject</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Avg Marks</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Attendance %</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Assignment Rate</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Participation</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Top</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Mid</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">Low</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-medium text-gray-800 dark:text-gray-200">{item.subject}</td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                          item.avgMarks >= 80 ? 'bg-green-100 text-green-700' :
                          item.avgMarks >= 70 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.avgMarks}%
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400">{item.attendance}%</td>
                      <td className="py-3 px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400">{item.assignmentRate}%</td>
                      <td className="py-3 px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400">{item.participation}%</td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {item.topStudents}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {item.midStudents}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          {item.lowStudents}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
            <div className="flex justify-between items-start sm:items-center mb-3 sm:mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Subject Teachers</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Teachers assigned to {getSelectedClassName()}</p>
              </div>
            </div>

            {loadingTeachers ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : classTeachers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No teachers assigned to this class yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{teacher.subject_name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{teacher.subject_code}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-semibold text-sm">
                        {teacher.teacher_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{teacher.teacher_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{teacher.teacher_email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <RightSidebar />
      </div>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </DashboardLayout>
  );
}
