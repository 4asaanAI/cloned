import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { searchDatabase, DatabaseSearchResult } from '../../lib/searchService';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  category: string;
  keywords?: string[];
  table?: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const getSearchableItems = (): SearchResult[] => {
    if (!profile) return [];

    const commonItems: SearchResult[] = [
      {
        id: 'home',
        title: 'Home Dashboard',
        path: '/dashboard',
        category: 'Navigation',
        keywords: ['home', 'dashboard', 'main', 'overview']
      },
      {
        id: 'profile',
        title: 'My Profile',
        path: '/dashboard/profile',
        category: 'User',
        keywords: ['profile', 'account', 'settings', 'user', 'personal']
      }
    ];

    if (profile.role === 'admin' || (profile.sub_role && (profile.sub_role === 'principal' || profile.sub_role === 'head'))) {
      return [
        ...commonItems,
        {
          id: 'users',
          title: 'User Management',
          path: '/dashboard/users',
          category: 'Administration',
          keywords: ['users', 'people', 'staff', 'students', 'management', 'accounts']
        },
        {
          id: 'approvals',
          title: 'New Approvals',
          path: '/dashboard/approvals',
          category: 'Administration',
          keywords: ['approvals', 'pending', 'new', 'registrations', 'verify']
        },
        {
          id: 'classes',
          title: 'Classes',
          path: '/dashboard/classes',
          category: 'Academic',
          keywords: ['classes', 'courses', 'subjects', 'academic', 'sections']
        },
        {
          id: 'exams',
          title: 'Exams',
          path: '/dashboard/exams',
          category: 'Academic',
          keywords: ['exams', 'tests', 'assessments', 'examinations']
        },
        {
          id: 'assignments',
          title: 'Assignments',
          path: '/dashboard/assignments',
          category: 'Academic',
          keywords: ['assignments', 'homework', 'tasks', 'work']
        },
        {
          id: 'results',
          title: 'Results',
          path: '/dashboard/results',
          category: 'Academic',
          keywords: ['results', 'marks', 'grades', 'scores', 'performance']
        },
        {
          id: 'events',
          title: 'Events',
          path: '/dashboard/events',
          category: 'Activities',
          keywords: ['events', 'calendar', 'activities', 'schedule']
        },
        {
          id: 'announcements',
          title: 'Announcements',
          path: '/dashboard/announcements',
          category: 'Communication',
          keywords: ['announcements', 'news', 'updates', 'notices']
        },
        {
          id: 'messages',
          title: 'Messages',
          path: '/dashboard/messages',
          category: 'Communication',
          keywords: ['messages', 'chat', 'communication', 'inbox']
        },
        {
          id: 'finance',
          title: 'Finance Management',
          path: '/dashboard/finance',
          category: 'Finance',
          keywords: ['finance', 'fees', 'payments', 'money', 'billing']
        },
        {
          id: 'leaves',
          title: 'Leave Management',
          path: '/dashboard/leaves',
          category: 'HR',
          keywords: ['leaves', 'absence', 'vacation', 'time off']
        },
        {
          id: 'transport',
          title: 'Transport',
          path: '/dashboard/transport',
          category: 'Facilities',
          keywords: ['transport', 'bus', 'vehicles', 'routes']
        },
        {
          id: 'support',
          title: 'Support Tickets',
          path: '/dashboard/support',
          category: 'Support',
          keywords: ['support', 'help', 'tickets', 'issues', 'problems']
        }
      ];
    }

    if (profile.role === 'professor') {
      return [
        ...commonItems,
        {
          id: 'courses',
          title: 'My Courses',
          path: '/dashboard/courses',
          category: 'Academic',
          keywords: ['courses', 'classes', 'teaching', 'subjects']
        },
        {
          id: 'students',
          title: 'Students',
          path: '/dashboard/students',
          category: 'Academic',
          keywords: ['students', 'learners', 'class']
        },
        {
          id: 'attendance',
          title: 'Attendance',
          path: '/dashboard/attendance',
          category: 'Academic',
          keywords: ['attendance', 'present', 'absent', 'roll call']
        },
        {
          id: 'grades',
          title: 'Grades',
          path: '/dashboard/grades',
          category: 'Academic',
          keywords: ['grades', 'marks', 'scores', 'results']
        }
      ];
    }

    if (profile.role === 'student') {
      return [
        ...commonItems,
        {
          id: 'courses',
          title: 'My Courses',
          path: '/dashboard/courses',
          category: 'Academic',
          keywords: ['courses', 'classes', 'subjects', 'enrolled']
        },
        {
          id: 'enrollments',
          title: 'Enrollments',
          path: '/dashboard/enrollments',
          category: 'Academic',
          keywords: ['enrollments', 'registration', 'courses']
        },
        {
          id: 'library',
          title: 'Library',
          path: '/dashboard/library',
          category: 'Resources',
          keywords: ['library', 'books', 'resources', 'reading']
        },
        {
          id: 'grades',
          title: 'My Grades',
          path: '/dashboard/grades',
          category: 'Academic',
          keywords: ['grades', 'marks', 'results', 'performance']
        }
      ];
    }

    return commonItems;
  };

  const searchableItems = getSearchableItems();

  const fuzzyMatch = (text: string, query: string): boolean => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    if (textLower.includes(queryLower)) return true;

    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  const highlightMatch = (text: string, query: string): JSX.Element => {
    if (!query) return <>{text}</>;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    const index = textLower.indexOf(queryLower);

    if (index === -1) {
      return <>{text}</>;
    }

    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-600 font-semibold">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      setLoading(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const pageResults = searchableItems.filter(item => {
        return (
          fuzzyMatch(item.title, query) ||
          fuzzyMatch(item.category, query) ||
          (item.keywords && item.keywords.some(keyword => fuzzyMatch(keyword, query)))
        );
      });

      let dbResults: DatabaseSearchResult[] = [];
      if (profile?.id && profile.role) {
        try {
          dbResults = await searchDatabase(query, profile.role, profile.id);
        } catch (error) {
          console.error('Database search error:', error);
        }
      }

      const combined = [
        ...pageResults,
        ...dbResults.map(r => ({
          id: `db-${r.table}-${r.id}`,
          title: r.title,
          subtitle: r.subtitle,
          path: r.path,
          category: r.category,
          table: r.table,
        }))
      ];

      setResults(combined);
      setSelectedIndex(0);
      setLoading(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, profile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }

      if (isOpen && results.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (results[selectedIndex]) {
            handleNavigate(results[selectedIndex].path);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    setIsOpen(false);
    setQuery('');
  }, [location]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xl mx-4">
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="w-full flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-lg transition-colors text-white text-sm"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left opacity-70">Search...</span>
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono bg-white/20 dark:bg-gray-600 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, users, classes, and more..."
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-96 p-2">
              {loading ? (
                <div className="px-4 py-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Searching...
                </div>
              ) : query && results.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No results found for "{query}"
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleNavigate(result.path)}
                      className={`w-full flex flex-col px-4 py-3 rounded-lg text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {highlightMatch(result.title, query)}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                              {result.subtitle}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              {result.category}
                            </span>
                            {result.table && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                from {result.table}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !query ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  <p className="mb-2">Search across all pages and database records</p>
                  <p className="text-xs">Users, Classes, Exams, Events, and more...</p>
                </div>
              ) : null}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Enter</kbd>
                    <span>Select</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Esc</kbd>
                    <span>Close</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
