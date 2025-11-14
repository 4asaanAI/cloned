import { ClipboardList, FileText, Calendar } from 'lucide-react';
import { Carousel } from './Carousel';

export function Admission() {
  const admissionSteps = [
    {
      icon: FileText,
      step: 'Step 1',
      description: 'Download and fill the admission form from our website or collect it from the school office'
    },
    {
      icon: Calendar,
      step: 'Step 2',
      description: 'Schedule a campus tour and submit the completed form with required documents'
    },
    {
      icon: ClipboardList,
      step: 'Step 3',
      description: 'Complete the interaction process and document verification for final admission'
    }
  ];

  return (
    <section id="admission" className="py-20 px-6 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-orange-100 text-orange-600 rounded-full font-semibold mb-4">
            Admissions Open 2024-25
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Admission Guidelines</h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Join THE AARYANS family and provide your child with quality education in a nurturing environment. Academic Session: April to March. Nursery admission age: 3 years (as of April 1st).
          </p>
        </div>

        <div className="hidden md:grid md:grid-cols-3 gap-8 mb-12">
          {admissionSteps.map((item, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border-2 border-white/20 hover:bg-white/20 transition-all text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.step}</h3>
              <p className="text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="md:hidden mb-12 px-4">
          <Carousel
            itemsPerView={{ mobile: 1, tablet: 1, desktop: 3 }}
            autoPlay={true}
            gap="1rem"
          >
            {admissionSteps.map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 border-white/20 text-center h-full">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.step}</h3>
                <p className="text-sm text-slate-300">{item.description}</p>
              </div>
            ))}
          </Carousel>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl overflow-hidden">
          <div className="grid md:grid-cols-5">
            <div className="md:col-span-3 p-12 flex flex-col justify-center">
              <h3 className="text-3xl font-bold mb-4 text-white">Ready to Enroll?</h3>
              <p className="text-lg mb-8 text-white/90">
                Take the first step towards your child's bright future. Contact us today for more information about our admission process.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-slate-100 transition-all hover:scale-105 transform text-center"
                >
                  Contact for Admission
                </a>
                <a
                  href="#registration"
                  className="px-8 py-4 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-all backdrop-blur-sm border border-white/30 text-center"
                >
                  Online Registration
                </a>
              </div>
            </div>
            <div className="md:col-span-2 h-64 md:h-auto">
              <img
                src="https://theaaryans.in/wp-content/uploads/2025/09/257-1.jpg"
                alt="Student admission"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border-2 border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">Required Documents</h3>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Birth Certificate (original and photocopy)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Transfer Certificate (if applicable)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Previous academic records</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <span>Passport size photographs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                <span>Address proof</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
