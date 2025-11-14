import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Department, Class } from '../types';
import { adminSubRoles, teacherSubRoles } from '../types';

export function Register() {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: '' as 'admin' | 'professor' | 'student' | '',
    sub_role: '',
    department_id: '',
    phone: '',
    admission_no: '',
    employee_id: '',
    parent_name: '',
    parent_phone: '',
    class_id: ''
  });
  const [, setDepartments] = useState<Department[]>([]);
  const [, setClasses] = useState<Class[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
    fetchClasses();
  }, []);

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    if (data) setDepartments(data);
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('status', 'active')
      .order('grade_level, section');
    if (data) setClasses(data);
  };

  const handleRoleSelect = (role: 'admin' | 'professor' | 'student') => {
    setFormData({ ...formData, role, sub_role: '' });
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const profileData: any = {
      full_name: formData.full_name,
      role: formData.role,
      phone: formData.phone
    };

    if (formData.role === 'admin' || formData.role === 'professor') {
      profileData.sub_role = formData.sub_role;
      profileData.employee_id = formData.employee_id;
      profileData.department_id = formData.department_id || null;
    }

    if (formData.role === 'student') {
      profileData.sub_role = 'student';
      profileData.admission_no = formData.admission_no;
      profileData.parent_name = formData.parent_name;
      profileData.parent_phone = formData.parent_phone;
      profileData.status = 'pending_approval';
    }

    const { error } = await signUp(formData.email, formData.password, profileData);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (formData.role === 'student') {
        navigate('/login', { state: { message: 'Registration submitted! Please wait for admin approval.' } });
      } else {
        navigate('/dashboard');
      }
    }
  };

  const getSubRoles = () => {
    if (formData.role === 'admin') return adminSubRoles;
    if (formData.role === 'professor') return teacherSubRoles;
    return [];
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-4xl w-full">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Choose Your Role
            </h2>
            <p className="mt-2 text-gray-600">
              Select the role that best describes you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => handleRoleSelect('admin')}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                <span className="text-3xl">👨‍💼</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Admin</h3>
              <p className="text-sm text-gray-600 mb-4">
                Head, Principal, or HOD
              </p>
              <ul className="text-xs text-gray-500 text-left space-y-1">
                <li>• School management</li>
                <li>• Staff oversight</li>
                <li>• Reports & analytics</li>
              </ul>
            </button>

            <button
              onClick={() => handleRoleSelect('professor')}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <span className="text-3xl">👨‍🏫</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Teacher</h3>
              <p className="text-sm text-gray-600 mb-4">
                Coordinator or Teacher
              </p>
              <ul className="text-xs text-gray-500 text-left space-y-1">
                <li>• Class management</li>
                <li>• Attendance & grades</li>
                <li>• Student monitoring</li>
              </ul>
            </button>

            <button
              onClick={() => handleRoleSelect('student')}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="text-3xl">👨‍🎓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Student</h3>
              <p className="text-sm text-gray-600 mb-4">
                Student enrollment
              </p>
              <ul className="text-xs text-gray-500 text-left space-y-1">
                <li>• View grades</li>
                <li>• Track attendance</li>
                <li>• Submit assignments</li>
              </ul>
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => setStep('role')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Change Role
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {formData.role === 'admin' && 'Admin Registration'}
            {formData.role === 'professor' && 'Teacher Registration'}
            {formData.role === 'student' && 'Student Registration'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Fill in your details to create an account
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(formData.role === 'admin' || formData.role === 'professor') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {(formData.role === 'admin' || formData.role === 'professor') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <select
                  required
                  value={formData.sub_role}
                  onChange={(e) => setFormData({ ...formData, sub_role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select designation</option>
                  {getSubRoles().map((sr) => (
                    <option key={sr.value} value={sr.value}>
                      {sr.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {formData.role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.admission_no}
                  onChange={(e) => setFormData({ ...formData, admission_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>

          {formData.role === 'student' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Your registration requires admin approval. You will be notified once approved.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
