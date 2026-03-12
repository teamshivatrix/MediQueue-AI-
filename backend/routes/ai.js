const express = require('express');
const router = express.Router();

// Symptom-to-department mapping for fallback AI
const symptomDepartmentMap = {
  'chest pain': { department: 'Cardiology', priority: 'high' },
  'heart': { department: 'Cardiology', priority: 'high' },
  'palpitation': { department: 'Cardiology', priority: 'high' },
  'shortness of breath': { department: 'Cardiology', priority: 'high' },
  'breathing difficulty': { department: 'Pulmonology', priority: 'high' },
  'asthma': { department: 'Pulmonology', priority: 'medium' },
  'fever': { department: 'General Medicine', priority: 'medium' },
  'cold': { department: 'General Medicine', priority: 'low' },
  'cough': { department: 'General Medicine', priority: 'low' },
  'flu': { department: 'General Medicine', priority: 'low' },
  'headache': { department: 'Neurology', priority: 'medium' },
  'migraine': { department: 'Neurology', priority: 'medium' },
  'dizziness': { department: 'Neurology', priority: 'medium' },
  'seizure': { department: 'Neurology', priority: 'emergency' },
  'numbness': { department: 'Neurology', priority: 'medium' },
  'bone': { department: 'Orthopedics', priority: 'medium' },
  'fracture': { department: 'Orthopedics', priority: 'high' },
  'joint pain': { department: 'Orthopedics', priority: 'medium' },
  'back pain': { department: 'Orthopedics', priority: 'medium' },
  'sprain': { department: 'Orthopedics', priority: 'medium' },
  'skin': { department: 'Dermatology', priority: 'low' },
  'rash': { department: 'Dermatology', priority: 'low' },
  'acne': { department: 'Dermatology', priority: 'low' },
  'itching': { department: 'Dermatology', priority: 'low' },
  'allergy': { department: 'Dermatology', priority: 'medium' },
  'child': { department: 'Pediatrics', priority: 'medium' },
  'baby': { department: 'Pediatrics', priority: 'medium' },
  'infant': { department: 'Pediatrics', priority: 'medium' },
  'ear': { department: 'ENT', priority: 'low' },
  'nose': { department: 'ENT', priority: 'low' },
  'throat': { department: 'ENT', priority: 'low' },
  'sore throat': { department: 'ENT', priority: 'low' },
  'hearing': { department: 'ENT', priority: 'medium' },
  'eye': { department: 'Ophthalmology', priority: 'medium' },
  'vision': { department: 'Ophthalmology', priority: 'medium' },
  'blurry': { department: 'Ophthalmology', priority: 'medium' },
  'stomach': { department: 'Gastroenterology', priority: 'medium' },
  'abdomen': { department: 'Gastroenterology', priority: 'medium' },
  'vomiting': { department: 'Gastroenterology', priority: 'medium' },
  'nausea': { department: 'Gastroenterology', priority: 'medium' },
  'diarrhea': { department: 'Gastroenterology', priority: 'medium' },
  'diabetes': { department: 'Endocrinology', priority: 'medium' },
  'thyroid': { department: 'Endocrinology', priority: 'medium' },
  'depression': { department: 'Psychiatry', priority: 'medium' },
  'anxiety': { department: 'Psychiatry', priority: 'medium' },
  'stress': { department: 'Psychiatry', priority: 'low' },
  'insomnia': { department: 'Psychiatry', priority: 'low' },
  'pregnancy': { department: 'Gynecology', priority: 'medium' },
  'menstrual': { department: 'Gynecology', priority: 'medium' },
  'dental': { department: 'Dental', priority: 'low' },
  'tooth': { department: 'Dental', priority: 'medium' },
  'toothache': { department: 'Dental', priority: 'medium' },
  'urinary': { department: 'Urology', priority: 'medium' },
  'kidney': { department: 'Urology', priority: 'medium' }
};

// Fallback AI: analyze symptoms using keyword matching
function fallbackSymptomAnalysis(symptoms) {
  const lower = symptoms.toLowerCase();
  let bestMatch = { department: 'General Medicine', priority: 'medium', confidence: 0.6 };

  for (const [keyword, info] of Object.entries(symptomDepartmentMap)) {
    if (lower.includes(keyword)) {
      bestMatch = { ...info, confidence: 0.85 };
      // Higher priority conditions take precedence
      if (info.priority === 'emergency' || info.priority === 'high') break;
    }
  }

  return {
    department: bestMatch.department,
    priority: bestMatch.priority,
    confidence: bestMatch.confidence,
    reasoning: `Based on symptoms "${symptoms}", the recommended department is ${bestMatch.department} with ${bestMatch.priority} priority.`,
    recommendations: [
      `Please visit the ${bestMatch.department} department`,
      bestMatch.priority === 'high' || bestMatch.priority === 'emergency'
        ? 'This appears urgent. Please seek immediate medical attention.'
        : 'Please book an appointment at your earliest convenience.',
      'Bring any previous medical records or prescriptions.'
    ]
  };
}

// Fallback chatbot responses
function fallbackChatResponse(message) {
  const lower = message.toLowerCase();

  if (lower.includes('book') || lower.includes('appointment')) {
    return 'To book an appointment, go to the "Book Appointment" page. Enter your details, select a department and doctor, then choose your preferred date and time. You\'ll receive a token number and estimated waiting time after booking.';
  }
  if (lower.includes('timing') || lower.includes('hours') || lower.includes('open')) {
    return 'Our hospital operates from Monday to Friday, 9:00 AM to 5:00 PM. Saturday hours are 9:00 AM to 1:00 PM. We are closed on Sundays and public holidays. Emergency services are available 24/7.';
  }
  if (lower.includes('doctor') && (lower.includes('which') || lower.includes('recommend') || lower.includes('visit'))) {
    return 'The right doctor depends on your symptoms. You can use our AI Symptom Analyzer to get a recommendation. Common departments include: General Medicine (fever, cold), Cardiology (chest pain), Orthopedics (bone/joint issues), Neurology (headaches), Dermatology (skin problems), and ENT (ear/nose/throat).';
  }
  if (lower.includes('available') || lower.includes('today')) {
    return 'To check doctor availability for today, please visit the "Book Appointment" page and select your department. Available doctors and their time slots will be shown. You can also check the Admin Dashboard for real-time availability.';
  }
  if (lower.includes('waiting') || lower.includes('queue') || lower.includes('wait time')) {
    return 'Waiting times vary by department and time of day. After booking, you\'ll see an estimated wait time based on patients ahead of you. Check the Queue Display page for real-time queue status. Tip: Early morning appointments usually have shorter wait times!';
  }
  if (lower.includes('emergency') || lower.includes('urgent')) {
    return '🚨 For emergencies, please call 108 (ambulance) or visit the Emergency Department directly. Do not wait for an appointment in case of chest pain, difficulty breathing, severe bleeding, or loss of consciousness.';
  }
  if (lower.includes('cancel')) {
    return 'To cancel an appointment, please contact the front desk or call our helpline. Online cancellation feature will be available soon. Please cancel at least 2 hours before your scheduled time.';
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! 👋 Welcome to MediQueue AI Hospital Assistant. I can help you with:\n\n• Booking appointments\n• Finding the right doctor\n• Hospital timings\n• Queue and waiting times\n• Emergency information\n\nWhat would you like to know?';
  }
  if (lower.includes('thank')) {
    return 'You\'re welcome! If you have any other questions, feel free to ask. Wishing you good health! 🏥';
  }

  return 'I can help you with booking appointments, finding doctors, hospital timings, and queue information. Could you please be more specific about what you need? You can also try our AI Symptom Analyzer for department recommendations.';
}

// Initialize AI client based on provider
function getAIClient() {
  const provider = process.env.AI_PROVIDER || 'fallback';

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      return { provider: 'gemini', client: new GoogleGenerativeAI(process.env.GEMINI_API_KEY) };
    } catch (e) {
      console.log('Gemini SDK not available, using fallback');
    }
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = require('openai');
      return { provider: 'openai', client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) };
    } catch (e) {
      console.log('OpenAI SDK not available, using fallback');
    }
  }

  return { provider: 'fallback', client: null };
}

// POST /api/ai/analyze-symptoms
router.post('/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ error: 'Symptoms are required' });

    const { provider, client } = getAIClient();

    if (provider === 'gemini') {
      const model = client.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `You are a medical triage AI for a government hospital. Analyze these symptoms and suggest the most appropriate hospital department. Respond in JSON format only:
{"department": "department name", "priority": "low/medium/high/emergency", "confidence": 0.0-1.0, "reasoning": "brief explanation", "recommendations": ["rec1", "rec2", "rec3"]}

Patient symptoms: ${symptoms}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ ...parsed, aiProvider: 'gemini' });
      }
    }

    if (provider === 'openai') {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a medical triage AI. Analyze symptoms and suggest hospital departments. Respond in JSON: {"department": "name", "priority": "low/medium/high/emergency", "confidence": 0.0-1.0, "reasoning": "explanation", "recommendations": ["rec1", "rec2"]}'
        }, {
          role: 'user',
          content: `Patient symptoms: ${symptoms}`
        }],
        temperature: 0.3
      });
      const text = response.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ ...parsed, aiProvider: 'openai' });
      }
    }

    // Fallback
    const result = fallbackSymptomAnalysis(symptoms);
    res.json({ ...result, aiProvider: 'built-in' });
  } catch (error) {
    console.error('AI analysis error:', error);
    // Always fall back gracefully
    const result = fallbackSymptomAnalysis(req.body.symptoms || '');
    res.json({ ...result, aiProvider: 'built-in' });
  }
});

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const { provider, client } = getAIClient();

    if (provider === 'gemini') {
      const model = client.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `You are a helpful hospital assistant chatbot for MediQueue AI, a government hospital scheduling system. Be friendly, concise, and helpful. Answer questions about hospital services, appointments, doctors, timings, and general health guidance. Do not provide medical diagnoses.

Hospital Info:
- Hours: Mon-Fri 9AM-5PM, Sat 9AM-1PM
- Departments: General Medicine, Cardiology, Orthopedics, Neurology, Pediatrics, Dermatology, ENT, Ophthalmology, Gynecology, Dental, Psychiatry, Gastroenterology, Pulmonology, Urology, Endocrinology
- Emergency: 24/7
- Booking: Available online through our platform

User message: ${message}`;

      const result = await model.generateContent(prompt);
      return res.json({ response: result.response.text(), aiProvider: 'gemini' });
    }

    if (provider === 'openai') {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a helpful hospital assistant chatbot for MediQueue AI. Be friendly and concise. Answer questions about hospital services, appointments, and general guidance. Do not diagnose.'
        }, {
          role: 'user',
          content: message
        }],
        temperature: 0.7,
        max_tokens: 300
      });
      return res.json({ response: response.choices[0].message.content, aiProvider: 'openai' });
    }

    // Fallback
    res.json({ response: fallbackChatResponse(message), aiProvider: 'built-in' });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ response: fallbackChatResponse(req.body.message || ''), aiProvider: 'built-in' });
  }
});

module.exports = router;
