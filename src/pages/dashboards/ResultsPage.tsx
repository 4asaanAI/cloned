import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ColumnFilter } from '../../components/ColumnFilter';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Target,
  UserSearch,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface ExamResult {
  id: string;
  exam_name: string;
  exam_code: string;
  exam_type: string;
  class_name: string;
  subject_name: string;
  student_name: string;
  student_admission_no: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  exam_date: string;
}

interface StudentStats {
  student_id: string;
  student_name: string;
  admission_no: string;
  class_name: string;
  total_exams: number;
  average_marks: number;
  highest_marks: number;
  lowest_marks: number;
  subjects: string[];
}

interface ClassStats {
  class_name: string;
  subject_name: string;
  total_students: number;
  average_marks: number;
  highest_marks: number;
  lowest_marks: number;
  pass_count: number;
  pass_percentage: number;
}

export function ResultsPage() {
  const { theme } = useTheme();
  const [searchMode, setSearchMode] = useState<'class' | 'student'>('class');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  const isDark = theme === 'dark';
  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltip: isDark ? '#1f2937' : '#ffffff',
  };

  const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

  useEffect(() => {
    if (searchMode === 'class') {
      fetchClassResults();
    }
  }, [searchMode]);

  const fetchClassResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(
          `
          *,
          exams(name, exam_code, exam_type, exam_date, total_marks, classes(name), subjects(name)),
          profiles(full_name, admission_no)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedResults: ExamResult[] = (data || []).map((result: any) => {
        const percentage =
          (result.marks_obtained / result.exams.total_marks) * 100;
        return {
          id: result.id,
          exam_name: result.exams?.name || 'N/A',
          exam_code: result.exams?.exam_code || 'N/A',
          exam_type: result.exams?.exam_type || 'N/A',
          class_name: result.exams?.classes?.name || 'N/A',
          subject_name: result.exams?.subjects?.name || 'N/A',
          student_name: result.profiles?.full_name || 'N/A',
          student_admission_no: result.profiles?.admission_no || 'N/A',
          marks_obtained: result.marks_obtained,
          total_marks: result.exams?.total_marks || 0,
          percentage: Math.round(percentage),
          grade: result.grade || calculateGrade(percentage),
          exam_date: result.exams?.exam_date || '',
        };
      });

      setResults(formattedResults);
      calculateClassStats(formattedResults);
    } catch (error) {
      console.error('Error fetching class results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResults = async (searchTerm: string) => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, admission_no')
        .or(
          `full_name.ilike.%${searchTerm}%,admission_no.ilike.%${searchTerm}%`
        )
        .eq('role', 'student')
        .limit(1)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setStudentStats(null);
        setResults([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('exam_results')
        .select(
          `
          *,
          exams(name, exam_code, exam_type, exam_date, total_marks, classes(name), subjects(name))
        `
        )
        .eq('student_id', profileData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedResults: ExamResult[] = (data || []).map((result: any) => {
        const percentage =
          (result.marks_obtained / result.exams.total_marks) * 100;
        return {
          id: result.id,
          exam_name: result.exams?.name || 'N/A',
          exam_code: result.exams?.exam_code || 'N/A',
          exam_type: result.exams?.exam_type || 'N/A',
          class_name: result.exams?.classes?.name || 'N/A',
          subject_name: result.exams?.subjects?.name || 'N/A',
          student_name: profileData.full_name,
          student_admission_no: profileData.admission_no || 'N/A',
          marks_obtained: result.marks_obtained,
          total_marks: result.exams?.total_marks || 0,
          percentage: Math.round(percentage),
          grade: result.grade || calculateGrade(percentage),
          exam_date: result.exams?.exam_date || '',
        };
      });

      setResults(formattedResults);
      calculateStudentStats(profileData, formattedResults);
    } catch (error) {
      console.error('Error fetching student results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const calculateClassStats = (results: ExamResult[]) => {
    const statsMap = new Map<string, ClassStats>();

    results.forEach((result) => {
      const key = `${result.class_name}-${result.subject_name}`;

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          class_name: result.class_name,
          subject_name: result.subject_name,
          total_students: 0,
          average_marks: 0,
          highest_marks: 0,
          lowest_marks: 100,
          pass_count: 0,
          pass_percentage: 0,
        });
      }

      const stats = statsMap.get(key)!;
      stats.total_students++;
      stats.average_marks += result.percentage;
      stats.highest_marks = Math.max(stats.highest_marks, result.percentage);
      stats.lowest_marks = Math.min(stats.lowest_marks, result.percentage);
      if (result.percentage >= 40) stats.pass_count++;
    });

    const finalStats = Array.from(statsMap.values()).map((stats) => ({
      ...stats,
      average_marks: Math.round(stats.average_marks / stats.total_students),
      pass_percentage: Math.round(
        (stats.pass_count / stats.total_students) * 100
      ),
    }));

    setClassStats(finalStats);
  };

  const calculateStudentStats = (profile: any, results: ExamResult[]) => {
    if (results.length === 0) {
      setStudentStats(null);
      return;
    }

    const subjects = Array.from(new Set(results.map((r) => r.subject_name)));
    const averageMarks = Math.round(
      results.reduce((sum, r) => sum + r.percentage, 0) / results.length
    );
    const highestMarks = Math.max(...results.map((r) => r.percentage));
    const lowestMarks = Math.min(...results.map((r) => r.percentage));

    setStudentStats({
      student_id: profile.id,
      student_name: profile.full_name,
      admission_no: profile.admission_no || 'N/A',
      class_name: results[0]?.class_name || 'N/A',
      total_exams: results.length,
      average_marks: averageMarks,
      highest_marks: highestMarks,
      lowest_marks: lowestMarks,
      subjects,
    });
  };

  const handleSearch = () => {
    if (searchMode === 'student' && searchQuery.trim()) {
      fetchStudentResults(searchQuery.trim());
    } else if (searchMode === 'class') {
      fetchClassResults();
    }
  };

  const filteredResults = results.filter((result) => {
    const matchesClass =
      selectedClasses.length === 0 ||
      selectedClasses.includes(result.class_name);
    const matchesSubject =
      selectedSubjects.length === 0 ||
      selectedSubjects.includes(result.subject_name);
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(result.exam_type);
    const matchesGrade =
      selectedGrades.length === 0 || selectedGrades.includes(result.grade);

    return matchesClass && matchesSubject && matchesType && matchesGrade;
  });

  const getGradeBadge = (grade: string) => {
    const gradeConfig: Record<string, { bg: string; text: string }> = {
      'A+': {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
      },
      A: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
      },
      'B+': {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
      },
      B: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
      },
      C: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
      },
      D: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
      },
      F: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
      },
    };

    const config = gradeConfig[grade] || gradeConfig.F;
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {grade}
      </span>
    );
  };

  const classPerformanceChart = classStats.slice(0, 10).map((stat) => ({
    name: `${stat.class_name} - ${stat.subject_name}`,
    avg: stat.average_marks,
    highest: stat.highest_marks,
    lowest: stat.lowest_marks,
  }));

  const studentSubjectPerformance = studentStats
    ? studentStats.subjects.map((subject) => {
        const subjectResults = results.filter(
          (r) => r.subject_name === subject
        );
        const avg =
          subjectResults.reduce((sum, r) => sum + r.percentage, 0) /
          subjectResults.length;
        return {
          subject,
          average: Math.round(avg),
          exams: subjectResults.length,
        };
      })
    : [];

  const studentTrendData = results
    .slice(0, 10)
    .reverse()
    .map((r) => ({
      exam: r.exam_code,
      marks: r.percentage,
    }));

  const examTermAnalysis = () => {
    const termMap = new Map<
      string,
      { total: number; count: number; exams: number }
    >();

    results.forEach((result) => {
      const term = result.exam_type;
      if (!termMap.has(term)) {
        termMap.set(term, { total: 0, count: 0, exams: 0 });
      }
      const data = termMap.get(term)!;
      data.total += result.percentage;
      data.count++;
      data.exams++;
    });

    return Array.from(termMap.entries()).map(([term, data]) => ({
      term: term.charAt(0).toUpperCase() + term.slice(1),
      average: Math.round(data.total / data.count),
      exams: data.exams,
    }));
  };

  const termAnalysisData = examTermAnalysis();

  // --- Mobile card renderer (only for <md) ---
  const MobileResultCard = ({ r }: { r: ExamResult }) => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {r.exam_code}
          </div>
          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {r.class_name} • {r.subject_name} •{' '}
            <span className="capitalize">{r.exam_type}</span>
          </div>
          {/* Show student line only in class mode */}
          {searchMode === 'class' && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {r.student_name} ({r.student_admission_no})
            </div>
          )}
        </div>
        <div className="text-right">
          <div
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
              r.percentage >= 75
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : r.percentage >= 50
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {r.percentage}%
          </div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {r.marks_obtained}/{r.total_marks}
          </div>
          <div className="mt-1">{getGradeBadge(r.grade)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Page wrapper: responsive paddings + prevent horizontal scroll on mobile */}
      <div className="space-y-5 w-full min-w-0 px-4 sm:px-6 md:px-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Exam Results
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and analyze exam performance by class or student
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchMode('class');
                setSearchQuery('');
                setStudentStats(null);
                fetchClassResults();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                searchMode === 'class'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">By</span> Class
            </button>
            <button
              onClick={() => {
                setSearchMode('student');
                setResults([]);
                setClassStats([]);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                searchMode === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <UserSearch className="h-4 w-4" />
              <span className="hidden sm:inline">By</span> Student
            </button>
          </div>
        </div>

        {/* Student search */}
        {searchMode === 'student' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </div>
        )}

        {/* Student summary & charts */}
        {studentStats && searchMode === 'student' && (
          <>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-5 text-white">
              <h3 className="text-lg sm:text-xl font-bold mb-3">
                Student Performance Overview
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-xs">Name</p>
                  <p className="text-base sm:text-lg font-semibold">
                    {studentStats.student_name}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-xs">Admission No</p>
                  <p className="text-base sm:text-lg font-semibold">
                    {studentStats.admission_no}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-xs">Class</p>
                  <p className="text-base sm:text-lg font-semibold">
                    {studentStats.class_name}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-xs">Total Exams</p>
                  <p className="text-base sm:text-lg font-semibold">
                    {studentStats.total_exams}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Average
                  </span>
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {studentStats.average_marks}%
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Highest
                  </span>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {studentStats.highest_marks}%
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Lowest
                  </span>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {studentStats.lowest_marks}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
                  Subject-wise Performance
                </h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={studentSubjectPerformance}>
                      <PolarGrid stroke={chartColors.grid} />
                      <PolarAngleAxis
                        dataKey="subject"
                        stroke={chartColors.text}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        stroke={chartColors.text}
                      />
                      <Radar
                        name="Average %"
                        dataKey="average"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.tooltip,
                          border: `1px solid ${chartColors.grid}`,
                          borderRadius: '8px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
                  Performance Trend (Last 10 Exams)
                </h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentTrendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartColors.grid}
                      />
                      <XAxis dataKey="exam" stroke={chartColors.text} />
                      <YAxis stroke={chartColors.text} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.tooltip,
                          border: `1px solid ${chartColors.grid}`,
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: chartColors.text }}
                      />
                      <Line
                        type="monotone"
                        dataKey="marks"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="Marks %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Class charts */}
        {searchMode === 'class' && classStats.length > 0 && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
                Class Performance Overview
              </h3>
              <div className="h-[360px] sm:h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformanceChart}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={chartColors.text}
                      angle={-30}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis stroke={chartColors.text} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltip,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: chartColors.text }}
                    />
                    <Legend wrapperStyle={{ color: chartColors.text }} />
                    <Bar dataKey="avg" fill="#3B82F6" name="Average" />
                    <Bar dataKey="highest" fill="#10B981" name="Highest" />
                    <Bar dataKey="lowest" fill="#EF4444" name="Lowest" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {termAnalysisData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
                  Performance Analysis by Exam Terms
                </h3>
                <div className="h-72 sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={termAnalysisData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartColors.grid}
                      />
                      <XAxis dataKey="term" stroke={chartColors.text} />
                      <YAxis stroke={chartColors.text} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.tooltip,
                          border: `1px solid ${chartColors.grid}`,
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: chartColors.text }}
                      />
                      <Legend wrapperStyle={{ color: chartColors.text }} />
                      <Bar
                        dataKey="average"
                        fill="#8B5CF6"
                        name="Average Score %"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {termAnalysisData.map((term, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {term.term}
                      </div>
                      <div className="text-lg font-bold text-gray-800 dark:text-white">
                        {term.average}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {term.exams} exam{term.exams !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Results list/table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
              {searchMode === 'class' ? 'All Results' : 'Student Results'}
            </h3>
            <div className="flex gap-2 items-center">
              {searchMode === 'class' && (
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              <button className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Small-screen inline search (to avoid cramping the header) */}
          {searchMode === 'class' && (
            <div className="sm:hidden mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Mobile cards (only visible on <md) */}
              <div className="md:hidden space-y-3">
                {filteredResults.length > 0 ? (
                  filteredResults.map((r) => (
                    <MobileResultCard key={r.id} r={r} />
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    {searchMode === 'student' && !searchQuery.trim()
                      ? 'Search for a student to view results'
                      : 'No results found'}
                  </div>
                )}
              </div>

              {/* Desktop table (unchanged UI/behavior, hidden on mobile) */}
              <div className="hidden md:block w-full min-w-0 overflow-x-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Exam Code
                      </th>

                      {searchMode === 'class' && (
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Student
                        </th>
                      )}

                      <th className="hidden md:table-cell text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Class
                          <span className="hidden lg:inline">
                            <ColumnFilter
                              column="Class"
                              values={uniq(results.map((r) => r.class_name))}
                              selectedValues={selectedClasses}
                              onFilterChange={setSelectedClasses}
                              isDark={isDark}
                            />
                          </span>
                        </div>
                      </th>

                      <th className="hidden md:table-cell text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Subject
                          <span className="hidden lg:inline">
                            <ColumnFilter
                              column="Subject"
                              values={uniq(results.map((r) => r.subject_name))}
                              selectedValues={selectedSubjects}
                              onFilterChange={setSelectedSubjects}
                              isDark={isDark}
                            />
                          </span>
                        </div>
                      </th>

                      <th className="hidden lg:table-cell text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Type
                          <ColumnFilter
                            column="Type"
                            values={uniq(results.map((r) => r.exam_type))}
                            selectedValues={selectedTypes}
                            onFilterChange={setSelectedTypes}
                            isDark={isDark}
                          />
                        </div>
                      </th>

                      <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Marks
                      </th>
                      <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        %
                      </th>
                      <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center justify-center gap-1">
                          Grade
                          <span className="hidden lg:inline">
                            <ColumnFilter
                              column="Grade"
                              values={uniq(results.map((r) => r.grade))}
                              selectedValues={selectedGrades}
                              onFilterChange={setSelectedGrades}
                              isDark={isDark}
                            />
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredResults.map((result) => (
                      <tr
                        key={result.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="py-3 px-3 sm:px-4 font-medium text-gray-800 dark:text-gray-200">
                          {result.exam_code}
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 md:hidden">
                            {result.class_name} • {result.subject_name} •{' '}
                            <span className="capitalize">
                              {result.exam_type}
                            </span>
                          </div>
                          {searchMode === 'class' && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 md:hidden">
                              {result.student_name} (
                              {result.student_admission_no})
                            </div>
                          )}
                        </td>

                        {searchMode === 'class' && (
                          <td className="hidden md:table-cell py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400">
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {result.student_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {result.student_admission_no}
                              </div>
                            </div>
                          </td>
                        )}

                        <td className="hidden md:table-cell py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400">
                          {result.class_name}
                        </td>

                        <td className="hidden md:table-cell py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400">
                          {result.subject_name}
                        </td>

                        <td className="hidden lg:table-cell py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400 capitalize">
                          {result.exam_type}
                        </td>

                        <td className="py-3 px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400">
                          {result.marks_obtained}/{result.total_marks}
                        </td>

                        <td className="py-3 px-3 sm:px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              result.percentage >= 75
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : result.percentage >= 50
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {result.percentage}%
                          </span>
                        </td>

                        <td className="py-3 px-3 sm:px-4 text-center">
                          {getGradeBadge(result.grade)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredResults.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchMode === 'student' && !searchQuery.trim()
                      ? 'Search for a student to view results'
                      : 'No results found'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
