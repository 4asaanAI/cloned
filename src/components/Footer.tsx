import { Facebook, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">TA</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">THE AARYANS</h3>
                <p className="text-xs text-slate-400">Chariot of Knowledge</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Inspiring young minds to achieve excellence through quality education and holistic development.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="text-slate-400 hover:text-orange-500 transition-colors">About Us</a></li>
              <li><a href="#infrastructure" className="text-slate-400 hover:text-orange-500 transition-colors">Infrastructure</a></li>
              <li><a href="#facilities" className="text-slate-400 hover:text-orange-500 transition-colors">Facilities</a></li>
              <li><a href="#admission" className="text-slate-400 hover:text-orange-500 transition-colors">Admissions</a></li>
              <li><a href="#contact" className="text-slate-400 hover:text-orange-500 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Important Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#fee" className="text-slate-400 hover:text-orange-500 transition-colors">Fee Structure 2025-26</a></li>
              <li><a href="#registration" className="text-slate-400 hover:text-orange-500 transition-colors">Online Registration</a></li>
              <li><a href="#career" className="text-slate-400 hover:text-orange-500 transition-colors">Career @ Aaryans</a></li>
              <li><a href="#verify-tc" className="text-slate-400 hover:text-orange-500 transition-colors">Verify TC</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contact Info</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                Prem Nagar, Joya, N.H.24<br />
                District - Amroha<br />
                Uttar Pradesh, INDIA
              </li>
              <li>
                <a href="tel:8126965555" className="hover:text-orange-500">8126965555</a>,{' '}
                <a href="tel:8126968888" className="hover:text-orange-500">8126968888</a>
              </li>
              <li>
                <a href="mailto:theaaryansjoya@gmail.com" className="hover:text-orange-500">
                  theaaryansjoya@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center">
          <p className="text-slate-400 text-sm">
            &copy; 2025 THE AARYANS. All rights reserved. | Founded April 13, 2015 | CBSE Affiliated
          </p>
        </div>
      </div>
    </footer>
  );
}
