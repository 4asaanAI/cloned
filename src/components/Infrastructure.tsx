import {
  Library,
  FlaskConical,
  Bus,
  Presentation,
  Map,
  Trophy,
} from 'lucide-react';
import { Carousel } from './Carousel';

export function Infrastructure() {
  const facilities = [
    {
      icon: Trophy,
      title: 'Sports and Games',
      description:
        'Comprehensive sports facilities with dedicated areas for various games and physical education activities.',
    },
    {
      icon: Library,
      title: 'Library and Study Room',
      description:
        'Well-stocked library with extensive collection of books and dedicated study areas for focused learning.',
    },
    {
      icon: Presentation,
      title: 'Seminar and Workshop Spaces',
      description:
        'Modern facilities for conducting seminars, workshops, and interactive learning sessions.',
    },
    {
      icon: Map,
      title: 'Educational Excursions',
      description:
        'Regular educational trips and excursions to enhance practical knowledge and real-world learning.',
    },
    {
      icon: Bus,
      title: 'Transport Routes',
      description:
        'Safe and convenient transportation services covering multiple routes across the region.',
    },
    {
      icon: FlaskConical,
      title: 'Practical Learning',
      description:
        'Hands-on learning facilities for science experiments and practical knowledge development.',
    },
  ];

  return (
    <section
      id="infrastructure"
      className="bg-gradient-to-br from-slate-900 to-slate-800 px-4 sm:px-6 py-14 md:py-20"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-4">
            Infrastructure
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto px-1">
            Our 8-acre campus features state-of-the-art infrastructure designed
            to support comprehensive student development across all domains.
          </p>
        </div>

        <div className="px-2 sm:px-6 md:px-12 mb-12 md:mb-16">
          <Carousel
            itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
            autoPlay={true}
            gap="1.5rem"
          >
            {facilities.map((facility, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border-2 border-white/20 hover:bg-white/20 transition-all group h-full"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-500 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <facility.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                  {facility.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {facility.description}
                </p>
              </div>
            ))}
          </Carousel>
        </div>

        <div className="mt-12 md:mt-16 bg-slate-50 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-2">
            <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-slate-900">
                8-Acre Campus
              </h3>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Spacious, peaceful campus spread across 8 acres providing ample
                space for learning, recreation, and holistic development in a
                serene environment.
              </p>
            </div>
            <div className="h-64 sm:h-80 md:h-auto">
              <img
                src="https://theaaryans.in/wp-content/uploads/2025/09/IMG-20240816-WA0013.jpg"
                alt="THE AARYANS Campus"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
