import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { RightSidebar } from '../../components/dashboard/RightSidebar';
import { BirthdayCard } from '../../components/dashboard/BirthdayCard';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AcademicYear {
  id: string;
  year_label: string;
  is_current: boolean;
}

export function HeadDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalStaff: 0,
  });
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
    fetchStats();
    fetchAttendanceData();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      if (data) {
        setAcademicYears(data);
        const current = data.find((y) => y.is_current);
        if (current) setSelectedYear(current.id);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [students, teachers] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'student')
          .eq('status', 'active'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'professor'),
      ]);

      setStats({
        totalStudents: students.count || 0,
        totalTeachers: teachers.count || 0,
        totalStaff: (teachers.count || 0) + 15,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const { error } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', new Date(new Date().getFullYear(), 0, 1).toISOString())
        .order('date');

      if (error) throw error;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const studentDistribution = [
    { name: 'Boys', value: 55 },
    { name: 'Girls', value: 45 },
  ];

  const financeData = [
    { month: 'Jan', revenue: 65, profit: 33, costs: 32 },
    { month: 'Feb', revenue: 68, profit: 33, costs: 35 },
    { month: 'Mar', revenue: 72, profit: 34, costs: 38 },
    { month: 'Apr', revenue: 69, profit: 33, costs: 36 },
    { month: 'May', revenue: 75, profit: 35, costs: 40 },
    { month: 'Jun', revenue: 78, profit: 36, costs: 42 },
  ];

  const attendanceData = [
    { month: 'Jan', rate: 92 },
    { month: 'Feb', rate: 88 },
    { month: 'Mar', rate: 90 },
    { month: 'Apr', rate: 85 },
    { month: 'May', rate: 89 },
    { month: 'Jun', rate: 91 },
  ];

  const COLORS = ['#3B82F6', '#EC4899'];

  // Dark mode color palette for charts
  const chartColors = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    background: isDark ? '#1f2937' : '#f9fafb',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipText: isDark ? '#f9fafb' : '#111827',
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center px-2 sm:px-0">
            <div className="relative">
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Academic Year:{' '}
                  {academicYears.find((y) => y.id === selectedYear)
                    ?.year_label || '2024/25'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              {showYearDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  {academicYears.map((year) => (
                    <button
                      key={year.id}
                      onClick={() => {
                        setSelectedYear(year.id);
                        setShowYearDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        selectedYear === year.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {year.year_label} {year.is_current && '(Current)'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-400 rounded-2xl p-5">
              <div className="text-2xl sm:text-3xl font-semibold mb-1 text-white pt-6 sm:pt-9">
                {stats.totalStudents.toLocaleString()}
              </div>
              <div className="text-blue-50 text-xs sm:text-sm font-medium">
                Students
              </div>
            </div>

            <div className="bg-blue-300 rounded-2xl p-5">
              <div className="text-2xl sm:text-3xl font-semibold mb-1 text-white pt-6 sm:pt-9">
                {stats.totalTeachers.toLocaleString()}
              </div>
              <div className="text-blue-50 text-xs sm:text-sm font-medium">
                Teachers
              </div>
            </div>

            <div className="bg-blue-400 rounded-2xl p-5">
              <div className="text-2xl sm:text-3xl font-semibold mb-1 text-white pt-6 sm:pt-9">
                {stats.totalStaff.toLocaleString()}
              </div>
              <div className="text-blue-50 text-xs sm:text-sm font-medium">
                Employees
              </div>
            </div>
          </div>

          {/* Row 1: Attendance and Students side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Attendance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-5">
                Attendance
              </h3>
              <div
                className="h-[240px] md:h-[300px] rounded-xl p-3 sm:p-4"
                style={{
                  backgroundColor: chartColors.background,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={chartColors.grid}
                    />
                    <XAxis dataKey="month" stroke={chartColors.text} />
                    <YAxis stroke={chartColors.text} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        color: chartColors.tooltipText,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: chartColors.tooltipText }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke={isDark ? '#10B981' : '#10B981'}
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-5">
                Students
              </h3>
              <div
                className="h-[240px] md:h-[300px] rounded-xl flex flex-col items-center justify-center"
                style={{
                  backgroundColor: chartColors.background,
                }}
              >
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={studentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {studentDistribution.map((_entry, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                  Boys: 55% | Girls: 45%
                </div>
              </div>
            </div>
          </div>

          {/* Finance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-5">
              Finance
            </h3>
            <div
              className="h-[240px] md:h-[300px] rounded-xl p-3 sm:p-4"
              style={{
                backgroundColor: chartColors.background,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartColors.grid}
                  />
                  <XAxis dataKey="month" stroke={chartColors.text} />
                  <YAxis stroke={chartColors.text} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      color: chartColors.tooltipText,
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: chartColors.tooltipText }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={isDark ? '#60A5FA' : '#3B82F6'}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke={isDark ? '#34D399' : '#10B981'}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="costs"
                    stroke={isDark ? '#F87171' : '#EF4444'}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <BirthdayCard />
        </div>

        <RightSidebar />
      </div>
    </DashboardLayout>
  );
}
