import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickLinksMenuOpen, setQuickLinksMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const quickLinksRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About Us', href: '#about' },
    { name: 'Infrastructure', href: '#infrastructure' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'Admission', href: '#admission' },
    { name: 'Contact', href: '#contact' }
  ];

  const quickLinks = [
    { name: 'Fee 2025-26', href: '#fee' },
    { name: 'Online Registration', href: '#registration' },
    { name: 'Admission Open 2024-25', href: '#admission' },
    { name: 'Career @ Aaryans', href: '#career' },
    { name: 'Enquiry', href: '#contact' },
    { name: 'Verify TC', href: '#verify-tc' }
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (quickLinksRef.current && !quickLinksRef.current.contains(event.target as Node)) {
        setQuickLinksMenuOpen(false);
      }
    }

    if (mobileMenuOpen || quickLinksMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen, quickLinksMenuOpen]);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm">

      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">THE AARYANS</h1>
              <p className="text-xs text-slate-600">Chariot of Knowledge</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all border border-slate-300"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Login
            </Link>
            <div className="relative" ref={quickLinksRef}>
              <button
                onClick={() => setQuickLinksMenuOpen(!quickLinksMenuOpen)}
                className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {quickLinksMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-slideDown">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={() => setQuickLinksMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      {link.name}
                    </a>
                  ))}
                  <div className="border-t border-slate-200 my-2"></div>
                  {quickLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={() => setQuickLinksMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden mt-4 pb-4 space-y-3 animate-slideDown">
            <div className="flex gap-2 mb-3">
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-sm font-medium text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all border border-slate-300"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-sm font-medium text-white bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                Login
              </Link>
            </div>
            <div className="space-y-2 border-b border-slate-200 pb-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 text-sm font-medium text-slate-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                >
                  {link.name}
                </a>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 text-sm text-slate-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slideDown {
            animation: slideDown 0.3s ease-out;
          }
        `}</style>
      </nav>
    </header>
  );
}
