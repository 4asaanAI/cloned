import { useEffect, useState } from 'react';
import { Cake } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Birthday {
  id: string;
  full_name: string;
  date_of_birth: string;
  role: string;
}

export function BirthdayCard() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingBirthdays();
  }, []);

  const fetchUpcomingBirthdays = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, date_of_birth, role')
        .not('date_of_birth', 'is', null)
        .eq('approval_status', 'approved');

      if (error) throw error;

      const today = new Date();
      const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const upcoming = (data || []).filter(profile => {
        if (!profile.date_of_birth) return false;
        const dob = new Date(profile.date_of_birth);
        const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        const nextYearBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
        return (thisYearBirthday >= today && thisYearBirthday <= next30Days) ||
               (nextYearBirthday >= today && nextYearBirthday <= next30Days);
      }).sort((a, b) => {
        const dobA = new Date(a.date_of_birth!);
        const dobB = new Date(b.date_of_birth!);
        const thisYearA = new Date(today.getFullYear(), dobA.getMonth(), dobA.getDate());
        const thisYearB = new Date(today.getFullYear(), dobB.getMonth(), dobB.getDate());
        const nextYearA = new Date(today.getFullYear() + 1, dobA.getMonth(), dobA.getDate());
        const nextYearB = new Date(today.getFullYear() + 1, dobB.getMonth(), dobB.getDate());

        const dateA = thisYearA >= today ? thisYearA : nextYearA;
        const dateB = thisYearB >= today ? thisYearB : nextYearB;

        return dateA.getTime() - dateB.getTime();
      });

      setBirthdays(upcoming);
    } catch (error) {
      console.error('Error fetching birthdays:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBirthday = (dob: string) => {
    const date = new Date(dob);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getDaysUntil = (dob: string) => {
    const today = new Date();
    const date = new Date(dob);
    const thisYearBirthday = new Date(today.getFullYear(), date.getMonth(), date.getDate());
    const nextYearBirthday = new Date(today.getFullYear() + 1, date.getMonth(), date.getDate());
    const targetDate = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 'Today' : `${diffDays} days`;
  };

  const students = birthdays.filter(b => b.role === 'student');
  const staff = birthdays.filter(b => b.role !== 'student');

  if (loading) return null;
  if (birthdays.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Cake className="h-6 w-6 text-pink-600 dark:text-pink-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Birthdays</h3>
      </div>

      {students.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Students</h4>
          <div className="space-y-2">
            {students.slice(0, 3).map(student => (
              <div key={student.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{student.full_name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{formatBirthday(student.date_of_birth)}</p>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{getDaysUntil(student.date_of_birth)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {staff.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Staff</h4>
          <div className="space-y-2">
            {staff.slice(0, 3).map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{member.role} • {formatBirthday(member.date_of_birth)}</p>
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">{getDaysUntil(member.date_of_birth)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
