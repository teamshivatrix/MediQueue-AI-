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

  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    try {
      const Groq = require('groq-sdk');
      return { provider: 'groq', client: new Groq({ apiKey: process.env.GROQ_API_KEY }) };
    } catch (e) {
      console.log('Groq SDK not available, using fallback');
    }
  }

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

    if (provider === 'groq') {
      try {
        const completion = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `You are a medical triage assistant. Analyze symptoms and respond ONLY with valid JSON (no markdown, no backticks).
Available departments: General Medicine, Cardiology, Orthopedics, Neurology, Pediatrics, Dermatology, ENT, Ophthalmology, Gastroenterology, Psychiatry, Gynecology, Dental, Pulmonology, Urology, Endocrinology
Format: {"department":"name","priority":"low/medium/high/emergency","confidence":0.0-1.0,"reasoning":"warm empathetic explanation","recommendations":["tip1","tip2","tip3"]}` },
            { role: 'user', content: `Patient symptoms: ${symptoms}` }
          ],
          temperature: 0.3, max_tokens: 400
        });
        const text = completion.choices[0].message.content;
        const jsonMatch = text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim().match(/\{[\s\S]*\}/);
        if (jsonMatch) return res.json({ ...JSON.parse(jsonMatch[0]), aiProvider: 'groq' });
      } catch (groqErr) {
        console.error('Groq analyze error:', groqErr.message?.substring(0, 100));
      }
    }

    if (provider === 'gemini') {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a warm and caring medical triage assistant at MediQueue AI Hospital. Analyze the patient's symptoms and suggest the right department.

IMPORTANT: Respond ONLY with valid JSON, no markdown, no backticks, no extra text.

Available departments: General Medicine, Cardiology, Orthopedics, Neurology, Pediatrics, Dermatology, ENT, Ophthalmology, Gastroenterology, Psychiatry, Gynecology, Dental, Pulmonology, Urology, Endocrinology

JSON format:
{
  "department": "department name from list above",
  "priority": "low/medium/high/emergency",
  "confidence": 0.0-1.0,
  "reasoning": "Write a warm, human-like explanation in 1-2 sentences. If patient wrote in Hindi/Hinglish, respond in Hinglish. Be empathetic and caring.",
  "recommendations": ["Practical tip 1 in patient's language", "Practical tip 2", "Tip 3"]
}

Patient symptoms: ${symptoms}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ ...parsed, aiProvider: 'gemini' });
        }
      } catch (geminiErr) {
        console.error('Gemini analyze error:', geminiErr.message?.substring(0, 100));
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

    const MEERA_SYSTEM = `You are "Meera" — a warm, caring, friendly hospital assistant at MediQueue AI Government Hospital. Talk like a real helpful person, not a robot.

Personality:
- Warm, empathetic, conversational — like a caring friend at a hospital
- Understand Hindi, Hinglish, English — respond in same language patient uses
- Show genuine concern for patient's health
- Give practical helpful advice
- Keep responses short and natural (2-4 sentences max)
- Use emojis occasionally 😊
- Address patient as "aap" in Hindi

APPOINTMENT BOOKING: If patient wants to book, when you have department + symptoms info, add this EXACT JSON at END of message:
BOOKING_DATA:{"action":"book_appointment","department":"Department Name","symptoms":"patient symptoms","suggestedDate":"${new Date().toISOString().split('T')[0]}"}

Hospital: MediQueue AI Govt Hospital | Hours: Mon-Fri 9AM-5PM, Sat 9AM-1PM, Emergency 24/7
Departments: General Medicine, Cardiology, Orthopedics, Neurology, Pediatrics, Dermatology, ENT, Ophthalmology, Gynecology, Dental, Psychiatry, Gastroenterology, Pulmonology, Urology, Endocrinology
Emergency: 108`;

    if (provider === 'groq') {
      try {
        const messages = [{ role: 'system', content: MEERA_SYSTEM }];
        if (req.body.history) {
          req.body.history.split('\n').forEach(line => {
            if (line.startsWith('user:')) messages.push({ role: 'user', content: line.replace('user:', '').trim() });
            else if (line.startsWith('meera:')) messages.push({ role: 'assistant', content: line.replace('meera:', '').trim() });
          });
        }
        messages.push({ role: 'user', content: message });

        const completion = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 300
        });
        const fullText = completion.choices[0].message.content;
        const bookingMatch = fullText.match(/BOOKING_DATA:(\{[^}]+\})/);
        if (bookingMatch) {
          try {
            const bookingData = JSON.parse(bookingMatch[1]);
            const cleanResponse = fullText.replace(/BOOKING_DATA:\{[^}]+\}/, '').trim();
            return res.json({ response: cleanResponse, aiProvider: 'groq', bookingAction: bookingData });
          } catch (_) {}
        }
        return res.json({ response: fullText, aiProvider: 'groq' });
      } catch (groqErr) {
        console.error('Groq chat error:', groqErr.message?.substring(0, 100));
      }
    }

    if (provider === 'gemini') {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are "Meera" — a warm, caring, and friendly hospital assistant at MediQueue AI Government Hospital. You talk like a real helpful person, not a robot.

Your personality:
- Warm, empathetic, and conversational — like a caring friend who works at a hospital
- You understand Hindi, Hinglish, and English — respond in the same language the patient uses
- If patient writes in Hindi/Hinglish, reply in Hinglish naturally (mix of Hindi and English)
- Show genuine concern for the patient's health
- Give practical, helpful advice — not just "consult a doctor"
- Use simple words, not medical jargon
- Keep responses short and natural (2-4 sentences max)
- Use emojis occasionally to feel warm 😊
- Address the patient as "aap" if they write in Hindi

IMPORTANT — APPOINTMENT BOOKING:
If the patient wants to book an appointment, collect info step by step:
1. First ask for their symptoms/reason for visit
2. Then suggest department based on symptoms
3. Ask for preferred date (suggest today's date or tomorrow)
4. Confirm and tell them to use the booking page OR say you'll help them book

When you have enough info to book (department + reason), respond with this EXACT JSON at the END of your message (after your normal reply):
BOOKING_DATA:{"action":"book_appointment","department":"Department Name","symptoms":"patient symptoms","suggestedDate":"YYYY-MM-DD"}

Hospital Info:
- Name: MediQueue AI Government Hospital
- Hours: Mon-Fri 9AM-5PM, Sat 9AM-1PM, Emergency 24/7
- Departments: General Medicine, Cardiology, Orthopedics, Neurology, Pediatrics, Dermatology, ENT, Ophthalmology, Gynecology, Dental, Psychiatry, Gastroenterology, Pulmonology, Urology, Endocrinology
- Emergency number: 108

Conversation history context: ${req.body.history || 'No previous messages'}

Patient message: ${message}`;

        const result = await model.generateContent(prompt);
        const fullText = result.response.text();

        // Check if AI wants to trigger booking
        const bookingMatch = fullText.match(/BOOKING_DATA:(\{[^}]+\})/);
        if (bookingMatch) {
          try {
            const bookingData = JSON.parse(bookingMatch[1]);
            const cleanResponse = fullText.replace(/BOOKING_DATA:\{[^}]+\}/, '').trim();
            return res.json({
              response: cleanResponse,
              aiProvider: 'gemini',
              bookingAction: bookingData
            });
          } catch (_) {}
        }

        return res.json({ response: fullText, aiProvider: 'gemini' });
      } catch (geminiErr) {
        console.error('Gemini chat error:', geminiErr.message?.substring(0, 100));
      }
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

// POST /api/ai/risk-score — Patient Risk Scoring
router.post('/risk-score', async (req, res) => {
  try {
    const { symptoms, age, history } = req.body;
    if (!symptoms) return res.status(400).json({ error: 'Symptoms required' });

    const { provider, client } = getAIClient();

    const prompt = `You are a medical triage AI. Assess patient risk level.
Patient: Age ${age || 'unknown'}, Symptoms: ${symptoms}, History: ${history || 'none'}
Respond ONLY with valid JSON (no markdown):
{"riskLevel":"low/medium/high/emergency","score":1-10,"reason":"brief reason","action":"recommended action","color":"#hex"}
Emergency examples: chest pain+sweating, difficulty breathing, unconscious, stroke symptoms.`;

    if (provider === 'groq') {
      try {
        const completion = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2, max_tokens: 200
        });
        const text = completion.choices[0].message.content;
        const match = text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim().match(/\{[\s\S]*\}/);
        if (match) return res.json({ ...JSON.parse(match[0]), aiProvider: 'groq' });
      } catch (e) { console.error('Groq risk-score:', e.message?.substring(0,80)); }
    }

    // Fallback rule-based risk scoring
    const lower = (symptoms + ' ' + (history||'')).toLowerCase();
    let riskLevel = 'low', score = 2, color = '#059669';
    const emergencyKw = ['chest pain','heart attack','stroke','unconscious','breathing','seizure','severe bleeding'];
    const highKw = ['high fever','vomiting blood','severe pain','fracture','head injury'];
    const medKw = ['fever','pain','dizziness','nausea','infection'];

    if (emergencyKw.some(k => lower.includes(k)) || (age && age > 70 && lower.includes('chest'))) {
      riskLevel = 'emergency'; score = 10; color = '#dc2626';
    } else if (highKw.some(k => lower.includes(k)) || (age && age > 65)) {
      riskLevel = 'high'; score = 7; color = '#f97316';
    } else if (medKw.some(k => lower.includes(k))) {
      riskLevel = 'medium'; score = 5; color = '#f59e0b';
    }

    res.json({
      riskLevel, score, color,
      reason: `Based on symptoms and age ${age||'unknown'}`,
      action: riskLevel === 'emergency' ? 'Immediate attention required' : riskLevel === 'high' ? 'See doctor today' : 'Book appointment',
      aiProvider: 'built-in'
    });
  } catch (error) {
    console.error('Risk score error:', error);
    res.status(500).json({ error: 'Risk scoring failed' });
  }
});

// POST /api/ai/smart-schedule — Smart Appointment Scheduling
router.post('/smart-schedule', async (req, res) => {
  try {
    const { symptoms, age, preferredDate } = req.body;
    if (!symptoms) return res.status(400).json({ error: 'Symptoms required' });

    const { provider, client } = getAIClient();

    const prompt = `You are a smart hospital scheduling AI.
Patient symptoms: ${symptoms}, Age: ${age || 'unknown'}, Preferred date: ${preferredDate || 'today'}
Suggest the best department and time slot.
Respond ONLY with valid JSON (no markdown):
{"department":"name","suggestedTime":"HH:MM","urgency":"routine/urgent/emergency","reason":"brief reason","tips":["tip1","tip2"]}`;

    if (provider === 'groq') {
      try {
        const completion = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3, max_tokens: 250
        });
        const text = completion.choices[0].message.content;
        const match = text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim().match(/\{[\s\S]*\}/);
        if (match) return res.json({ ...JSON.parse(match[0]), aiProvider: 'groq' });
      } catch (e) { console.error('Groq smart-schedule:', e.message?.substring(0,80)); }
    }

    // Fallback
    const result = fallbackSymptomAnalysis(symptoms);
    res.json({
      department: result.department,
      suggestedTime: '10:00',
      urgency: result.priority === 'emergency' ? 'emergency' : result.priority === 'high' ? 'urgent' : 'routine',
      reason: result.reasoning,
      tips: result.recommendations,
      aiProvider: 'built-in'
    });
  } catch (error) {
    console.error('Smart schedule error:', error);
    res.status(500).json({ error: 'Smart scheduling failed' });
  }
});

// POST /api/ai/check-interactions — Medicine Interaction Check
router.post('/check-interactions', async (req, res) => {
  try {
    const { medicines, diagnosis } = req.body;
    if (!medicines || !medicines.length) return res.status(400).json({ error: 'Medicines list required' });

    const { provider, client } = getAIClient();
    const medList = Array.isArray(medicines) ? medicines.join(', ') : medicines;

    const prompt = `You are a clinical pharmacist AI. Check for drug interactions.
Medicines: ${medList}
Diagnosis: ${diagnosis || 'not specified'}
Respond ONLY with valid JSON (no markdown):
{"safe":true/false,"interactions":[{"drugs":"drug1 + drug2","severity":"mild/moderate/severe","description":"what happens","recommendation":"what to do"}],"warnings":["warning1"],"generalAdvice":"advice"}`;

    if (provider === 'groq') {
      try {
        const completion = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2, max_tokens: 500
        });
        const text = completion.choices[0].message.content;
        const match = text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim().match(/\{[\s\S]*\}/);
        if (match) return res.json({ ...JSON.parse(match[0]), aiProvider: 'groq' });
      } catch (e) { console.error('Groq interactions:', e.message?.substring(0,80)); }
    }

    // Fallback — basic known interactions
    const knownInteractions = [
      { drugs: ['warfarin','aspirin'], severity: 'severe', description: 'Increased bleeding risk', recommendation: 'Avoid combination or monitor closely' },
      { drugs: ['metformin','alcohol'], severity: 'moderate', description: 'Risk of lactic acidosis', recommendation: 'Avoid alcohol while on metformin' },
      { drugs: ['ssri','tramadol'], severity: 'severe', description: 'Serotonin syndrome risk', recommendation: 'Use with extreme caution' },
    ];
    const lower = medList.toLowerCase();
    const found = knownInteractions.filter(i => i.drugs.every(d => lower.includes(d)));

    res.json({
      safe: found.length === 0,
      interactions: found,
      warnings: found.length > 0 ? ['Please review interactions with prescribing doctor'] : [],
      generalAdvice: 'Always take medicines as prescribed. Inform doctor of all current medications.',
      aiProvider: 'built-in'
    });
  } catch (error) {
    console.error('Interaction check error:', error);
    res.status(500).json({ error: 'Interaction check failed' });
  }
});

module.exports = router;
