import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { BirthdayCard } from '../../components/dashboard/BirthdayCard';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AcademicYear {
  id: string;
  year_label: string;
  is_current: boolean;
}

export function PrincipalDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalStaff: 0
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [yearComparisonData, setYearComparisonData] = useState<any[]>([]);

  useEffect(() => {
    fetchAcademicYears();
    fetchStats();
    fetchAttendanceData();
    fetchYearComparison();
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
        const current = data.find(y => y.is_current);
        if (current) setSelectedYear(current.id);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchYearComparison = async () => {
    try {
      const { data: years, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, year_label')
        .order('start_date', { ascending: false })
        .limit(3);

      if (yearsError) throw yearsError;

      const { data: stats, error: statsError } = await supabase
        .from('academic_year_stats')
        .select('*')
        .eq('metric_name', 'students')
        .in('academic_year_id', years?.map(y => y.id) || []);

      if (statsError) throw statsError;

      const monthlyData = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(month => {
        const entry: any = { month };
        years?.forEach(year => {
          const stat = stats?.find(s => s.academic_year_id === year.id && s.month === month);
          entry[year.year_label] = stat?.metric_value || 0;
        });
        return entry;
      });

      setYearComparisonData(monthlyData);
    } catch (error) {
      console.error('Error fetching year comparison:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [students, teachers] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student').eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'professor')
      ]);

      setStats({
        totalStudents: students.count || 0,
        totalTeachers: teachers.count || 0,
        totalStaff: (teachers.count || 0) + 15
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

  const allEvents = [
    { date: '2025-11-05', title: 'Science Fair Preparation', time: '09:00 AM - 11:00 AM', description: 'Students showcase their innovative projects' },
    { date: '2025-11-05', title: 'Parent-Teacher Meeting', time: '02:00 PM - 05:00 PM', description: 'Quarterly academic performance review' },
    { date: '2025-11-10', title: 'Sports Day Practice', time: '03:30 PM - 05:00 PM', description: 'Athletic events preparation session' },
    { date: '2025-11-15', title: 'Music Recital', time: '04:00 PM - 06:00 PM', description: 'Annual music performance by students' }
  ];


  const studentDistribution = [
    { name: 'Boys', value: 55 },
    { name: 'Girls', value: 45 }
  ];

  const financeData = [
    { month: 'Jan', revenue: 65, profit: 33, costs: 32 },
    { month: 'Feb', revenue: 68, profit: 33, costs: 35 },
    { month: 'Mar', revenue: 72, profit: 34, costs: 38 },
    { month: 'Apr', revenue: 69, profit: 33, costs: 36 },
    { month: 'May', revenue: 75, profit: 35, costs: 40 },
    { month: 'Jun', revenue: 78, profit: 36, costs: 42 }
  ];

  const attendanceData = [
    { month: 'Jan', rate: 92 },
    { month: 'Feb', rate: 88 },
    { month: 'Mar', rate: 90 },
    { month: 'Apr', rate: 85 },
    { month: 'May', rate: 89 },
    { month: 'Jun', rate: 91 }
  ];

  const filteredEvents = allEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const previousMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const selectDate = (day: number) => setSelectedDate(new Date(year, month, day));
  const isSelectedDate = (day: number) => new Date(year, month, day).toDateString() === selectedDate.toDateString();
  const hasEvent = (day: number) => {
    const date = new Date(year, month, day);
    return allEvents.some(event => new Date(event.date).toDateString() === date.toDateString());
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const COLORS = ['#3B82F6', '#EC4899'];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Academic Year: {academicYears.find(y => y.id === selectedYear)?.year_label || '2024/25'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {showYearDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                {academicYears.map(year => (
                  <button
                    key={year.id}
                    onClick={() => {
                      setSelectedYear(year.id);
                      setShowYearDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      selectedYear === year.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {year.year_label} {year.is_current && '(Current)'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-400 rounded-2xl p-5">
              <div className="text-3xl font-semibold mb-1 text-white pt-9">{stats.totalStudents.toLocaleString()}</div>
              <div className="text-blue-50 text-sm font-medium">Students</div>
            </div>

            <div className="bg-blue-300 rounded-2xl p-5">
              <div className="text-3xl font-semibold mb-1 text-white pt-9">{stats.totalTeachers.toLocaleString()}</div>
              <div className="text-blue-50 text-sm font-medium">Teachers</div>
            </div>

            <div className="bg-blue-400 rounded-2xl p-5">
              <div className="text-3xl font-semibold mb-1 text-white pt-9">{stats.totalStaff.toLocaleString()}</div>
              <div className="text-blue-50 text-sm font-medium">Employees</div>
            </div>
          </div>

          {/* Row 1: Attendance and Students side by side */}
          <div className="grid grid-cols-2 gap-5">
            {/* Attendance Chart */}
            <div className="bg-white rounded-2xl p-5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold">Attendance</h3>
              </div>
              <div className="h-[300px] bg-gray-50 rounded-xl flex flex-col items-center justify-center p-4">
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: "#10B981" }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Attendance Rate (%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Distribution Chart */}
            <div className="bg-white rounded-2xl p-5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold">Students</h3>
              </div>
              <div className="h-[300px] bg-gray-50 rounded-xl flex flex-col items-center justify-center">
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
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-xs mt-2 text-gray-500">
                  <div>Boys: 55% | Girls: 45%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Finance Chart - Full Width */}
          <div className="bg-white rounded-2xl p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">Finance</h3>
            </div>
            <div className="h-[300px] bg-gray-50 rounded-xl flex flex-col items-center justify-center p-4">
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={financeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="costs" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">Profit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600">Costs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Year Comparison Chart */}
          {yearComparisonData.length > 0 && (
            <div className="bg-white rounded-2xl p-5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold">Student Enrollment - Year Comparison</h3>
              </div>
              <div className="h-[300px] bg-gray-50 rounded-xl flex flex-col items-center justify-center p-4">
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={yearComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Line type="monotone" dataKey="2024/25" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="2023/24" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="2022/23" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">2024/25</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">2023/24</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-gray-600">2022/23</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - 1fr */}
        <div className="space-y-5">
          {/* Calendar */}
          <div className="bg-white rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <button onClick={previousMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="font-semibold">{monthNames[month]} {year}</h3>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={'empty-' + index} className="aspect-square"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    className={'aspect-square rounded-lg text-sm font-medium transition-colors relative ' +
                      (isSelectedDate(day) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 ') +
                      (hasEvent(day) && !isSelectedDate(day) ? 'bg-blue-50 text-blue-600' : '')}
                  >
                    {day}
                    {hasEvent(day) && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events */}
          <div className="bg-white rounded-2xl p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">Events</h3>
            </div>

            <div className="space-y-3">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <div
                    key={index}
                    className={'p-4 border-2 border-gray-100 border-t-4 rounded-lg ' +
                      (index % 2 === 0 ? 'border-t-blue-400' : 'border-t-blue-300')}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700 text-sm">{event.title}</span>
                      <span className="text-xs text-gray-400">{event.time}</span>
                    </div>
                    <p className="text-sm text-gray-500">{event.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No events for this date
                </div>
              )}
            </div>
          </div>

        </div>

        <BirthdayCard />
      </div>
      </div>
    </DashboardLayout>
  );
}
