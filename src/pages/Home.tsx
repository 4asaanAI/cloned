import { useState } from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { About } from '../components/About';
import { Objectives } from '../components/Objectives';
import { Infrastructure } from '../components/Infrastructure';
import { Facilities } from '../components/Facilities';
import { Admission } from '../components/Admission';
import { Contact } from '../components/Contact';
import { Footer } from '../components/Footer';
import { Notification } from '../components/Notification';
import { ChatWidget } from '../components/ChatWidget';

export function Home() {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-white">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <Header />
      <Hero />
      <About />
      <Objectives />
      <Infrastructure />
      <Facilities />
      <Admission />
      <Contact onNotification={handleNotification} />
      <Footer />
      <ChatWidget />
    </div>
  );
}
