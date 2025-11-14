import { useState, useEffect } from 'react';

export function Hero() {
  const images = [
    'https://theaaryans.in/wp-content/uploads/2025/09/257.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/256.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/258.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/259.jpg',
    'https://theaaryans.in/wp-content/uploads/2025/09/257-1.jpg'
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section id="home" className="relative h-[40rem] md:min-h-screen h-screen md:h-auto flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="absolute inset-0">
        {images.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={img}
              alt={`THE AARYANS School Campus ${index + 1}`}
              className="w-full h-full object-fit md:object-cover object-center"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          THE AARYANS
        </h1>
        <p className="text-xl md:text-2xl text-orange-400 mb-4 font-semibold">
          Chariot of Knowledge
        </p>
        <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          An institution of the Vedic Educational Trust that embraces traditional values while forging ahead to face the challenges of the world with courage and conviction.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#admission"
            className="px-8 py-4 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all hover:scale-105 transform"
          >
            Apply for Admission
          </a>
          <a
            href="#contact"
            className="px-8 py-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
