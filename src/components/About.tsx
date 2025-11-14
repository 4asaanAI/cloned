import { Building2, Users, Award, Target, MapPin } from 'lucide-react';
import { Carousel } from './Carousel';

export function About() {
  const infoCards = [
    {
      icon: Target,
      title: 'Our Vision',
      description: 'Good education is a journey. We embrace traditional values while forging ahead to face world challenges with courage.',
      bgColor: 'bg-slate-50'
    },
    {
      icon: Award,
      title: 'Our Mission',
      description: 'We balance ancient and modern, traditional and innovative approaches to develop students\' full potential.',
      bgColor: 'bg-slate-50'
    },
    {
      icon: Building2,
      title: 'CBSE Affiliated',
      description: 'CBSE Affiliated Co-educational Institution',
      bgColor: 'bg-slate-50'
    },
    {
      icon: Users,
      title: 'Leadership',
      description: 'Founded by Ch. Hatpal Singh & Sh. Anil Kumar Singh, visionaries committed to quality education.',
      bgColor: 'bg-slate-50'
    }
  ];

  return (
    <section id="about" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">About Us</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            THE AARYANS, an institution of the Vedic Educational Trust, was founded on April 13, 2015, by visionaries Ch. Hatpal Singh & Sh. Anil Kumar Singh. Situated on a peaceful, verdant campus, we embrace traditional values while forging ahead on the 'Chariot of Knowledge'.
          </p>
        </div>

        {/* Mobile View - Carousel */}
        <div className="md:hidden mb-12">
          <Carousel
            itemsPerView={{ mobile: 1, tablet: 1, desktop: 1 }}
            autoPlay={true}
            gap="1rem"
          >
            {infoCards.map((card, index) => (
              <div key={index} className={`${card.bgColor} rounded-xl p-6 border border-slate-200 h-full min-h-[180px]`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <card.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">{card.title}</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </Carousel>
        </div>

        {/* Desktop View - Grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-8 mb-12">
          {infoCards.map((card, index) => (
            <div key={index} className={`${card.bgColor} rounded-xl p-6 border border-slate-200`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <card.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-bold text-slate-900 text-xl">{card.title}</h4>
              </div>
              <p className="text-slate-600 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Campus Highlights - Full Width */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-white text-xl">Campus Highlights</h4>
          </div>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-white">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></span>
              <span>8-acre peaceful campus</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></span>
              <span>Co-educational institution</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></span>
              <span>Founded in 2015</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></span>
              <span>Amroha, Uttar Pradesh</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
