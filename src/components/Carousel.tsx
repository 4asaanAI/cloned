import { useState, useEffect, ReactNode, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  children: ReactNode[];
  autoPlay?: boolean;
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  showDots?: boolean;
  gap?: string;
}

export function Carousel({
  children,
  autoPlay = false,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 },
  showDots = true,
  gap = '2rem'
}: CarouselProps) {
  const [itemsVisible, setItemsVisible] = useState(itemsPerView.desktop);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const scrollPositionRef = useRef(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsVisible(itemsPerView.mobile);
        setIsMobile(true);
      } else if (width < 1024) {
        setItemsVisible(itemsPerView.tablet);
        setIsMobile(false);
      } else {
        setItemsVisible(itemsPerView.desktop);
        setIsMobile(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerView]);

  useEffect(() => {
    if (isMobile && autoPlay) {
      const interval = setInterval(() => {
        if (!isPaused) {
          setCurrentIndex((prev) => (prev + 1) % children.length);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isMobile, autoPlay, isPaused, children.length]);

  const duplicatedChildren = [...children, ...children, ...children];

  useEffect(() => {
    if (isMobile || !autoPlay || !scrollRef.current) return;

    const scrollContainer = scrollRef.current;
    const itemWidth = scrollContainer.scrollWidth / duplicatedChildren.length;
    const speed = 0.375;

    const animate = () => {
      if (!isPaused) {
        scrollPositionRef.current += speed;

        if (scrollPositionRef.current >= itemWidth * children.length) {
          scrollPositionRef.current = 0;
        }

        if (scrollContainer) {
          scrollContainer.style.transform = `translateX(-${scrollPositionRef.current}px)`;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoPlay, children.length, duplicatedChildren.length, isPaused, isMobile]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (isMobile) {
      setCurrentIndex((prev) => (prev - 1 + children.length) % children.length);
    } else {
      if (scrollRef.current) {
        const itemWidth = scrollRef.current.scrollWidth / duplicatedChildren.length;
        scrollPositionRef.current = Math.max(0, scrollPositionRef.current - itemWidth);
      }
    }
  };

  const goToNext = () => {
    if (isMobile) {
      setCurrentIndex((prev) => (prev + 1) % children.length);
    } else {
      if (scrollRef.current) {
        const itemWidth = scrollRef.current.scrollWidth / duplicatedChildren.length;
        scrollPositionRef.current += itemWidth;
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  if (isMobile) {
    return (
      <div
        className="relative w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="overflow-hidden px-4">
          <div className="relative w-full" style={{ minHeight: '280px' }}>
            {children.map((child, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full transition-opacity duration-500 ${
                  index === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ fontSize: '0.9rem' }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>

        {showDots && (
          <div className="flex justify-center gap-2 mt-6">
            {children.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-orange-500 w-7'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="overflow-hidden">
        <div
          ref={scrollRef}
          className="flex"
          style={{ gap, willChange: 'transform' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {duplicatedChildren.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ width: `calc((100% - ${gap} * ${itemsVisible - 1}) / ${itemsVisible})` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all group z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-slate-700 group-hover:text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all group z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-white" />
      </button>
    </div>
  );
}
