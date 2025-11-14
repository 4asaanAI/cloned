import { Heart, Users, Star, Globe } from 'lucide-react';
import { Carousel } from './Carousel';

export function Objectives() {
  const objectives = [
    {
      icon: Heart,
      title: 'Love for Learning',
      description: 'To inculcate in our children love for learning.',
    },
    {
      icon: Users,
      title: 'Well-Rounded Personalities',
      description:
        'To nurture well rounded personalities who are confident, creative and able to adjust and adopt to any circumstances of environment.',
    },
    {
      icon: Star,
      title: 'Lead by Example',
      description:
        'To lead by example and be good role models so that our children imbibe our qualities and take pride in what they do.',
    },
    {
      icon: Globe,
      title: 'Global Citizens',
      description:
        'Preparing global citizens committed to humanistic values and democratic traditions with strong secular ethos.',
    },
  ];

  return (
    <section
      id="objectives"
      className="bg-slate-50 px-4 sm:px-6 py-14 md:py-20"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 md:mb-4">
            Our Objectives
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto px-1">
            At THE AARYANS, we are committed to developing compassionate,
            capable, and confident individuals ready to make a positive impact
            on the world.
          </p>
        </div>

        <div className="px-2 sm:px-6 md:px-12">
          <Carousel
            itemsPerView={{ mobile: 1, tablet: 2, desktop: 2 }}
            autoPlay={true}
            gap="1.5rem"
          >
            {objectives.map((objective, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all border-2 border-slate-200 hover:border-orange-500 group h-full"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <objective.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
                  {objective.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {objective.description}
                </p>
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
