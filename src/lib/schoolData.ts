import { supabase } from './supabase';

export interface SchoolDataItem {
  id?: string;
  category: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export async function populateSchoolData(): Promise<{ success: boolean; alreadyPopulated?: boolean; error?: any }> {
  try {
    const { data: existingData, error: checkError } = await supabase
      .from('school_data')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing data:', checkError);
    }

    if (existingData && existingData.length > 0) {
      return { success: true, alreadyPopulated: true };
    }
  } catch (err) {
    console.error('Error in populateSchoolData check:', err);
  }

  const schoolData: Omit<SchoolDataItem, 'id'>[] = [
    {
      category: 'basic_info',
      title: 'School Name',
      content: 'THE AARYANS',
      metadata: { type: 'name', tagline: 'Chariot of Knowledge' }
    },
    {
      category: 'basic_info',
      title: 'School Description',
      content: 'THE AARYANS, an institution of the Vedic Educational Trust, embraces traditional values while forging ahead on the "Chariot of Knowledge" to face the challenges of the world with courage and conviction. Founded on April 13, 2015, by visionaries Ch. Hatpal Singh & Sh. Anil Kumar Singh, on a peaceful, verdant campus.',
      metadata: { type: 'description', founded: '2015', affiliation: 'CBSE', location: 'Amroha' }
    },
    {
      category: 'basic_info',
      title: 'Vision',
      content: 'Good Education is a journey, not a destination. THE AARYANS embraces traditional values while forging ahead on the "Chariot of Knowledge" to face the challenges of the world with courage and conviction.',
      metadata: { type: 'vision' }
    },
    {
      category: 'basic_info',
      title: 'Mission',
      content: 'We care for our values and belief and aim for a perfect balance of complementary factors: ancient and modern, traditional and innovative. The School aims to help students develop intellectual, emotional, social, physical, and spiritual potentials through state-of-the-art laboratories and holistic activities including yoga, meditation, athletics, and arts.',
      metadata: { type: 'mission' }
    },
    {
      category: 'features',
      title: 'Experienced Staff',
      content: 'Trained and experienced educators dedicated to academic excellence and student development.',
      metadata: { icon: 'users' }
    },
    {
      category: 'features',
      title: 'CBSE Affiliation',
      content: 'Affiliated with CBSE, New Delhi, following a career-oriented syllabus for comprehensive education.',
      metadata: { icon: 'book' }
    },
    {
      category: 'features',
      title: 'Holistic Development',
      content: 'Activity-oriented education focusing on personality development, communication skills, and social growth.',
      metadata: { icon: 'award' }
    },
    {
      category: 'features',
      title: 'Sports Excellence',
      content: 'Comprehensive sports and games facilities promoting physical fitness and competitive spirit.',
      metadata: { icon: 'trophy' }
    },
    {
      category: 'facilities',
      title: 'Sports and Games',
      content: 'Comprehensive sports facilities with dedicated areas for various games and physical education activities.',
      metadata: {}
    },
    {
      category: 'facilities',
      title: 'Library and Study Room',
      content: 'Well-stocked library with extensive collection of books and dedicated study areas for focused learning.',
      metadata: {}
    },
    {
      category: 'facilities',
      title: 'Seminar and Workshop Spaces',
      content: 'Modern facilities for conducting seminars, workshops, and interactive learning sessions.',
      metadata: {}
    },
    {
      category: 'facilities',
      title: 'Educational Excursions',
      content: 'Regular educational trips and excursions to enhance practical knowledge and real-world learning.',
      metadata: {}
    },
    {
      category: 'facilities',
      title: 'Transport Routes',
      content: 'Safe and convenient transportation services covering multiple routes across the region.',
      metadata: {}
    },
    {
      category: 'facilities',
      title: '8-Acre Campus',
      content: 'Spacious, peaceful campus spread across 8 acres providing ample space for learning and recreation.',
      metadata: {}
    },
    {
      category: 'objectives',
      title: 'Love for Learning',
      content: 'To inculcate in our children love for learning.',
      metadata: {}
    },
    {
      category: 'objectives',
      title: 'Well-Rounded Personalities',
      content: 'To nurture well rounded personalities who are confident, creative and able to adjust and adopt to any circumstances of environment.',
      metadata: {}
    },
    {
      category: 'objectives',
      title: 'Lead by Example',
      content: 'To lead by example and be good role models so that our children imbibe our qualities and take pride in what they do.',
      metadata: {}
    },
    {
      category: 'objectives',
      title: 'Global Citizens',
      content: 'Preparing global citizens committed to humanistic values and democratic traditions with strong secular ethos.',
      metadata: {}
    },
    {
      category: 'activities',
      title: 'Science Experiments',
      content: 'Our state-of-the-art science laboratory provides students with hands-on experience in conducting experiments and exploring scientific concepts.',
      metadata: {}
    },
    {
      category: 'activities',
      title: 'Art & Drawing',
      content: 'Our comprehensive art program nurtures creativity and self-expression through various artistic mediums including painting, drawing, sculpture, and mixed media.',
      metadata: {}
    },
    {
      category: 'activities',
      title: 'Music & Singing',
      content: 'Our music program offers comprehensive training in vocal techniques, instrument playing, and music theory with access to various instruments.',
      metadata: {}
    },
    {
      category: 'faq',
      title: 'What is the admission process?',
      content: 'Our admission process begins with filling out an application form, followed by a campus tour, student assessment, and parent interview.',
      metadata: {}
    },
    {
      category: 'faq',
      title: 'Do you provide transportation?',
      content: 'Yes, we provide safe transportation services with GPS tracking and CCTV cameras covering all major areas.',
      metadata: {}
    },
    {
      category: 'faq',
      title: 'Are there extracurricular activities?',
      content: 'Yes! We offer sports, arts, music, dance, coding clubs, robotics, debate society, and environmental clubs.',
      metadata: {}
    },
    {
      category: 'faq',
      title: 'What are the school timings?',
      content: 'Regular hours: 8:30 AM to 3:00 PM, Monday through Friday. Extended care: 7:00 AM to 6:00 PM.',
      metadata: {}
    },
    {
      category: 'faq',
      title: 'What curriculum do you follow?',
      content: 'We follow CBSE curriculum with emphasis on critical thinking, creativity, and traditional values with modern teaching methodologies.',
      metadata: {}
    },
    {
      category: 'faq',
      title: 'How do you ensure child safety?',
      content: 'We have 24/7 security, CCTV surveillance, controlled access, background-checked staff, school nurse, fire safety systems, and regular emergency drills.',
      metadata: {}
    },
    {
      category: 'contact',
      title: 'Address',
      content: 'Prem Nagar, Joya, N.H.24, District - Amroha (U.P.), INDIA',
      metadata: { type: 'address' }
    },
    {
      category: 'contact',
      title: 'Phone',
      content: '8126965555, 8126968888',
      metadata: { type: 'phone' }
    },
    {
      category: 'contact',
      title: 'Email',
      content: 'theaaryansjoya@gmail.com',
      metadata: { type: 'email' }
    },
    {
      category: 'contact',
      title: 'School Info',
      content: 'Founded: April 13, 2015 | CBSE Affiliated',
      metadata: { type: 'info' }
    },
    {
      category: 'admissions',
      title: 'Admissions Status',
      content: 'Admissions Open 2024-25! Academic Session: April to March. Nursery admission age: 3 years (as of April 1st).',
      metadata: {}
    },
    {
      category: 'leadership',
      title: 'Founders',
      content: 'Ch. Hatpal Singh & Sh. Anil Kumar Singh - Visionaries committed to providing quality education with traditional values.',
      metadata: { role: 'Founders' }
    }
  ];

  try {
    const { error } = await supabase
      .from('school_data')
      .insert(schoolData);

    if (error) {
      console.error('Error populating school data:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in populateSchoolData:', err);
    return { success: false, error: err };
  }
}

export async function getSchoolData(): Promise<SchoolDataItem[]> {
  try {
    const { data, error } = await supabase
      .from('school_data')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching school data:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getSchoolData:', err);
    return [];
  }
}
