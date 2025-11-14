import { getSchoolData } from './schoolData';

export interface AIResponse {
  response: string;
  success: boolean;
  error?: string;
}

export async function generateAIResponse(userMessage: string): Promise<AIResponse> {
  try {
    const schoolData = await getSchoolData();
    const context = buildContext(schoolData);

    const response = await queryOpenAI(userMessage, context);

    return {
      response,
      success: true
    };
  } catch (error) {
    console.error('Error generating AI response:', error);

    try {
      const fallbackResponse = getFallbackResponse(userMessage);

      return {
        response: fallbackResponse,
        success: true
      };
    } catch (fallbackError) {
      return {
        response: "I apologize, but I'm having trouble processing your question right now. Please try again or contact us directly at 8126965555, 8126968888 or theaaryansjoya@gmail.com.",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

function buildContext(schoolData: any[]): string {
  let context = '';

  const categories = {
    basic_info: 'School Information',
    features: 'Key Features',
    facilities: 'Facilities',
    objectives: 'Our Objectives',
    activities: 'Activities',
    teachers: 'Our Teachers',
    faq: 'Frequently Asked Questions',
    contact: 'Contact Information',
    admissions: 'Admissions'
  };

  for (const [key, label] of Object.entries(categories)) {
    const items = schoolData.filter(item => item.category === key);
    if (items.length > 0) {
      context += `\n${label}:\n`;
      items.forEach(item => {
        context += `- ${item.title}: ${item.content}\n`;
      });
    }
  }

  return context;
}

async function queryOpenAI(userMessage: string, context: string): Promise<string> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userMessage,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Chat AI API error:', response.status, errorData);

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 401) {
        throw new Error('Authentication error. Please try again.');
      } else if (response.status === 500) {
        throw new Error('Service is temporarily unavailable.');
      }

      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.response) {
      return data.response;
    }

    throw new Error('Invalid response format from API');
  } catch (error) {
    console.error('Chat AI API error:', error);
    throw error;
  }
}

function getFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  const keywords: Record<string, string[]> = {
    admission: ['admission', 'admissions', 'apply', 'enroll', 'enrollment', 'join', 'register'],
    timing: ['time', 'timing', 'hours', 'schedule', 'when', 'open', 'close'],
    facilities: ['facility', 'facilities', 'playground', 'library', 'lab', 'computer', 'sports'],
    activities: ['activity', 'activities', 'extracurricular', 'clubs', 'events'],
    teachers: ['teacher', 'teachers', 'staff', 'faculty', 'qualification'],
    fees: ['fee', 'fees', 'cost', 'price', 'tuition', 'payment'],
    contact: ['contact', 'phone', 'email', 'address', 'location', 'reach'],
    curriculum: ['curriculum', 'syllabus', 'course', 'subjects', 'teach']
  };

  const responses: Record<string, string> = {
    admission: "Admissions are open for 2024-25! Academic Session: April to March. Nursery admission age: 3 years (as of April 1st). Our admission process includes written test and parent-child interaction.\n\nFor detailed information, please contact us at 8126965555, 8126968888 or email theaaryansjoya@gmail.com",
    timing: "Academic Session runs from April to March. For detailed school timings, please contact our office at 8126965555 or 8126968888. We're located at Prem Nagar, Joya, N.H.24, Amroha.",
    facilities: "THE AARYANS offers excellent facilities including:\n- Sports and games facilities\n- Library and study rooms\n- Seminar and workshop spaces\n- Educational excursions\n- Transport services\n- 8-acre peaceful campus\n\nWould you like to schedule a campus tour?",
    activities: "We offer diverse activities for holistic development through activity-oriented education. Our programs focus on personality development, communication skills, and social growth. Contact us to learn more!",
    teachers: "THE AARYANS has experienced and trained staff dedicated to academic excellence. Our educators focus on helping students develop their intellectual, emotional, social, physical, artistic, creative and spiritual potentials.",
    fees: "For detailed information about fee structure and payment plans, please contact our office at 8126965555, 8126968888 or email theaaryansjoya@gmail.com",
    contact: "You can reach us at:\n- Phone: 8126965555, 8126968888\n- Email: theaaryansjoya@gmail.com\n- Address: Prem Nagar, Joya, N.H.24, District - Amroha (U.P.), INDIA\n- Founded: April 13, 2015 | CBSE Affiliated",
    curriculum: "We follow CBSE curriculum with a career-oriented syllabus focused on:\n- Holistic child development\n- Activity-based learning\n- Traditional values with modern approach\n- Development of intellectual, emotional, social, physical, artistic, creative and spiritual potentials"
  };

  for (const [category, keywordList] of Object.entries(keywords)) {
    if (keywordList.some(keyword => lowerMessage.includes(keyword))) {
      return responses[category];
    }
  }

  return "Thank you for your question! I'm here to help you learn more about THE AARYANS - Chariot of Knowledge. You can ask me about:\n- Admissions process\n- School timings\n- Facilities and infrastructure\n- CBSE curriculum\n- Our objectives\n\nFeel free to ask anything, or contact us directly at 8126965555, 8126968888!";
}
