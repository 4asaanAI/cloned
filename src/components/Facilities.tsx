import {
  GraduationCap,
  Users2,
  TrendingUp,
  Languages,
  Lightbulb,
  Heart,
  School,
  Plane,
} from 'lucide-react';
import { Carousel } from './Carousel';

export function Facilities() {
  const facilities = [
    {
      icon: Users2,
      title: 'Experienced/Trained Staff',
      description:
        'Dedicated educators with specialized training and years of experience in nurturing young minds.',
    },
    {
      icon: GraduationCap,
      title: 'Academic Excellence',
      description:
        'Focus on building strong foundations in core subjects with innovative teaching methodologies.',
    },
    {
      icon: Languages,
      title: 'Communication & Social Skills',
      description:
        'Comprehensive programs to develop effective communication and interpersonal skills.',
    },
    {
      icon: TrendingUp,
      title: 'Personality Development',
      description:
        'Structured programs to build confidence, leadership qualities, and character.',
    },
    {
      icon: Lightbulb,
      title: 'Activity-Oriented Education',
      description:
        'Hands-on learning experiences that make education engaging and practical.',
    },
    {
      icon: Heart,
      title: 'Holistic Development',
      description:
        'Balanced approach focusing on intellectual, emotional, social, and physical growth.',
    },
    {
      icon: School,
      title: 'Co-Educational System',
      description:
        'Our co-educational environment promotes mutual respect, collaborative learning, and prepares students for real-world interactions with equal opportunities for all.',
    },
    {
      icon: Plane,
      title: 'Educational Excursions',
      description:
        'Regular field trips and educational excursions enhance practical learning and provide real-world context to classroom lessons with safe and supervised trips.',
    },
  ];

  const galleryImages = [
    'https://theaaryans.in/wp-content/uploads/2025/09/IMG-20250103-WA0026.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/1000460825.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/IMG-20240516-WA0016.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/IMG-20231102-WA0005.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/IMG-20230831-WA0028-300x300.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/IMG-20240816-WA0013.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/257.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/256.jpg',
  ];

  return (
    <section id="facilities" className="bg-white px-4 sm:px-6 py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 md:mb-4">
            Facilities
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto px-1">
            We provide comprehensive facilities and programs designed to nurture
            well-rounded individuals ready to excel in all aspects of life.
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
                className="group bg-slate-50 rounded-lg p-4 sm:p-6 border-2 border-slate-200 hover:border-orange-500 hover:shadow-xl transition-all h-full"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <facility.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  {facility.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {facility.description}
                </p>
              </div>
            ))}
          </Carousel>
        </div>

        <div className="mb-12 md:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 sm:mb-8 text-center">
            Campus Gallery
          </h3>
          <div className="px-2 sm:px-6 md:px-12">
            <Carousel
              itemsPerView={{ mobile: 1, tablet: 3, desktop: 4 }}
              autoPlay={true}
              gap="0.75rem"
            >
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl hover:scale-105 transition-all border-2 border-slate-200"
                >
                  <img
                    src={img}
                    alt={`School activity ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
