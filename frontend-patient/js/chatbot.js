// MediQueue AI - Chatbot with Chat History, Auto-Close Prompt & Smart Booking

const CHAT_STORAGE_KEY = 'mq_chat_history';
const MAX_STORED_MSGS = 50;

let chatHistory = [];
let inactivityTimer = null;
let closePromptShown = false;
let bookingContext = {}; // track booking conversation state

// ── Booking keywords detection ──
const BOOKING_TRIGGERS = [
  'book', 'appointment', 'appoint', 'doctor', 'dikhaana', 'dikhana',
  'book karo', 'book kar', 'appointment chahiye', 'doctor chahiye',
  'sir dukh', 'dard', 'bimaar', 'bimaari', 'problem', 'takleef',
  'consult', 'check', 'treatment', 'ilaj'
];

const DEPT_KEYWORDS = {
  'Neurology':       ['sir', 'head', 'headache', 'migraine', 'dizziness', 'seizure', 'brain', 'neuro', 'sir dard', 'sir dukh'],
  'Cardiology':      ['chest', 'heart', 'dil', 'seena', 'palpitation', 'bp', 'blood pressure'],
  'General Medicine':['fever', 'bukhar', 'cold', 'cough', 'khansi', 'flu', 'weakness', 'kamzori', 'body ache', 'badan dard'],
  'Orthopedics':     ['bone', 'joint', 'knee', 'back', 'spine', 'fracture', 'ghutna', 'kamar', 'haddi'],
  'Dermatology':     ['skin', 'rash', 'itching', 'khujli', 'acne', 'allergy'],
  'ENT':             ['ear', 'nose', 'throat', 'kaan', 'naak', 'gala', 'sore throat'],
  'Ophthalmology':   ['eye', 'aankh', 'vision', 'blurry'],
  'Gastroenterology':['stomach', 'pet', 'abdomen', 'vomit', 'ulti', 'diarrhea', 'loose motion', 'acidity'],
  'Pediatrics':      ['child', 'baby', 'bachcha', 'infant', 'kids'],
  'Psychiatry':      ['anxiety', 'depression', 'stress', 'sleep', 'neend', 'mental'],
  'Dental':          ['tooth', 'teeth', 'daant', 'dental', 'gum'],
  'Gynecology':      ['pregnancy', 'period', 'menstrual', 'mahwari', 'women'],
  'Endocrinology':   ['diabetes', 'thyroid', 'sugar', 'hormone'],
  'Urology':         ['urine', 'kidney', 'peshab', 'bladder'],
  'Pulmonology':     ['breathing', 'asthma', 'lungs', 'saans', 'cough chronic']
};

function detectDepartment(text) {
  const lower = text.toLowerCase();
  for (const [dept, keywords] of Object.entries(DEPT_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return dept;
  }
  return 'General Medicine';
}

function isBookingIntent(text) {
  const lower = text.toLowerCase();
  return BOOKING_TRIGGERS.some(t => lower.includes(t));
}

// ── On page load ──
document.addEventListener('DOMContentLoaded', () => {
  loadChatHistory();
  resetInactivityTimer();
});

// ── Save / Load chat history ──
function saveChatHistory() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const msgs = [];
  container.querySelectorAll('.chat-message').forEach(el => {
    const sender = el.classList.contains('user') ? 'user' : 'bot';
    const bubble = el.querySelector('.chat-bubble');
    if (bubble && !el.querySelector('.typing-indicator') && !el.querySelector('.chat-action-btn')) {
      msgs.push({ sender, html: bubble.innerHTML });
    }
  });
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED_MSGS))); } catch (_) {}
}

function loadChatHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    if (!stored.length) return;
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const divider = document.createElement('div');
    divider.style.cssText = 'text-align:center;margin:0.5rem 0;font-size:0.72rem;color:#94a3b8;display:flex;align-items:center;gap:8px;';
    divider.innerHTML = '<span style="flex:1;height:1px;background:rgba(148,163,184,0.2);"></span><span>Recent Chats</span><span style="flex:1;height:1px;background:rgba(148,163,184,0.2);"></span>';
    container.appendChild(divider);
    stored.forEach(m => {
      const icon = m.sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';
      const msg = document.createElement('div');
      msg.className = `chat-message ${m.sender}`;
      msg.style.opacity = '0.7';
      msg.innerHTML = `<div class="chat-avatar"><i class="${icon}"></i></div><div class="chat-bubble">${m.html}</div>`;
      container.appendChild(msg);
    });
    const newDiv = document.createElement('div');
    newDiv.style.cssText = 'text-align:center;margin:0.5rem 0;font-size:0.72rem;color:#0891b2;display:flex;align-items:center;gap:8px;';
    newDiv.innerHTML = '<span style="flex:1;height:1px;background:rgba(8,145,178,0.3);"></span><span>New Session</span><span style="flex:1;height:1px;background:rgba(8,145,178,0.3);"></span>';
    container.appendChild(newDiv);
    container.scrollTop = container.scrollHeight;
  } catch (_) {}
}

// ── Inactivity timer ──
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  closePromptShown = false;
  inactivityTimer = setTimeout(showClosePrompt, 90000);
}

function showClosePrompt() {
  if (closePromptShown) return;
  closePromptShown = true;
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = 'chat-message bot';
  msg.id = 'closePromptMsg';
  msg.innerHTML = `
    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
    <div class="chat-bubble">
      Lagta hai aap busy ho gaye 😊 Kya main yeh chat band kar dun?
      <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap;">
        <button onclick="keepChatOpen()" style="background:rgba(8,145,178,0.15);border:1px solid rgba(8,145,178,0.3);color:#0891b2;padding:0.4rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:600;font-family:inherit;">Nahi, ruko 😊</button>
        <button onclick="closeChatSession()" style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.25);color:#dc2626;padding:0.4rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:600;font-family:inherit;">Haan, band karo</button>
      </div>
    </div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function keepChatOpen() {
  const p = document.getElementById('closePromptMsg');
  if (p) p.remove();
  closePromptShown = false;
  addMessage('Theek hai! Main yahan hoon 😊 Koi aur help chahiye?', 'bot');
  resetInactivityTimer();
}

function closeChatSession() {
  saveChatHistory();
  addMessage('Theek hai! Chat band kar rahi hoon. Get well soon! ❤️', 'bot');
  setTimeout(() => {
    const input = document.getElementById('chatInput');
    const btn = document.querySelector('.chat-send-btn');
    if (input) { input.disabled = true; input.placeholder = 'Session ended. Refresh to restart.'; }
    if (btn) btn.disabled = true;
  }, 1500);
}

// ── Send message ──
function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message || input.disabled) return;

  input.value = '';
  resetInactivityTimer();

  const prompt = document.getElementById('closePromptMsg');
  if (prompt) prompt.remove();

  chatHistory.push({ role: 'user', text: message });
  addMessage(message, 'user');

  // ── DIRECT BOOKING DETECTION (no AI needed) ──
  if (isBookingIntent(message)) {
    const dept = detectDepartment(message);
    bookingContext.symptoms = message;
    bookingContext.department = dept;

    const typingEl = addTypingIndicator();
    await new Promise(r => setTimeout(r, 800));
    typingEl.remove();

    addMessage(
      `Samajh gaya! Aapke symptoms ke hisaab se <strong>${dept}</strong> department sahi rahega. ` +
      `Main abhi aapka appointment book kar rahi hoon... 🔍`,
      'bot'
    );
    await handleAutoBooking({ department: dept, symptoms: message });
    saveChatHistory();
    return;
  }

  // ── AI response for non-booking messages ──
  const typingEl = addTypingIndicator();
  try {
    const result = await apiCall('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history: chatHistory.slice(-8).map(h => `${h.role}: ${h.text}`).join('\n')
      })
    });
    typingEl.remove();
    chatHistory.push({ role: 'meera', text: result.response });
    addMessage(result.response, 'bot');
    saveChatHistory();

    if (result.bookingAction) {
      await handleAutoBooking(result.bookingAction);
    }
  } catch (err) {
    typingEl.remove();
    addMessage('Oops! Kuch technical issue aa gaya. Thodi der mein try karo 😊', 'bot');
  }
}

// ── Auto Booking ──
async function handleAutoBooking(bookingData) {
  const session = getCurrentUser();
  if (!session || !session.user) {
    setTimeout(() => {
      addMessage('Appointment book karne ke liye pehle login karna hoga! 😊', 'bot');
      addActionButton('Login karein', 'auth.html', '#0891b2');
    }, 600);
    return;
  }

  setTimeout(async () => {
    const typingEl = addTypingIndicator();
    try {
      const doctors = await apiCall(
        `/api/doctors?department=${encodeURIComponent(bookingData.department)}&available=true`
      );
      typingEl.remove();

      if (!doctors || doctors.length === 0) {
        addMessage(`Abhi ${bookingData.department} mein koi doctor available nahi hai 😔 Kya doosra department try karein?`, 'bot');
        addActionButton('Booking Page', 'booking.html', '#0891b2');
        return;
      }

      const doctor = doctors[0];
      const today = new Date().toISOString().split('T')[0];
      const slots = (doctor.availableSlots && doctor.availableSlots.length > 0)
        ? doctor.availableSlots
        : ['10:00', '10:30', '11:00', '14:00', '14:30'];
      const timeSlot = slots[0];

      const booking = await apiCall('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientName: session.user.name || 'Patient',
          age: session.user.age || 25,
          phone: session.user.phone || '',
          symptoms: bookingData.symptoms || 'Consultation',
          department: bookingData.department,
          doctorId: doctor._id,
          doctorName: doctor.name,
          date: today,
          timeSlot
        })
      });

      if (booking && booking.appointment) {
        const apt = booking.appointment;
        addMessage(
          `🎉 Ho gaya! Appointment book ho gaya!\n\n` +
          `🏥 Department: ${apt.department}\n` +
          `👨‍⚕️ Doctor: ${apt.doctorName}\n` +
          `📅 Date: ${apt.date}\n` +
          `⏰ Time: ${apt.timeSlot}\n` +
          `🎫 Token: #${apt.tokenNumber}\n` +
          `⏱️ Est. Wait: ~${apt.estimatedWaitTime} min\n\n` +
          `Samay pe aa jaana! Get well soon ❤️`,
          'bot'
        );
        addActionButton('Meri Appointments Dekho', 'my-records.html', '#059669');
        saveChatHistory();
      }
    } catch (err) {
      typingEl.remove();
      addMessage('Appointment book karne mein thodi problem aayi 😔 Booking page pe jaake manually book karo.', 'bot');
      addActionButton('Appointment Book Karo', 'booking.html', '#0891b2');
    }
  }, 800);
}

function addActionButton(text, url, color = '#0891b2') {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-message bot chat-action-btn';
  div.innerHTML = `
    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
    <div class="chat-bubble" style="padding:0.5rem 0.75rem;">
      <a href="${url}" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,${color},${color}dd);color:white;text-decoration:none;padding:0.55rem 1.1rem;border-radius:10px;font-size:0.84rem;font-weight:700;box-shadow:0 4px 12px ${color}44;transition:all 0.2s;">
        <i class="fas fa-arrow-right"></i> ${text}
      </a>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addMessage(text, sender) {
  const container = document.getElementById('chatMessages');
  const icon = sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';
  const formattedText = text.replace(/\n/g, '<br>');
  const msg = document.createElement('div');
  msg.className = `chat-message ${sender}`;
  msg.innerHTML = `<div class="chat-avatar"><i class="${icon}"></i></div><div class="chat-bubble">${formattedText}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function addTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-message bot';
  typing.id = 'typingIndicator';
  typing.innerHTML = `
    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
    <div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  return typing;
}


// ── On page load: restore recent chats ──
document.addEventListener('DOMContentLoaded', () => {
  loadChatHistory();
  resetInactivityTimer();
});

// ── Save / Load chat history ──
function saveChatHistory() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const msgs = [];
  container.querySelectorAll('.chat-message').forEach(el => {
    const sender = el.classList.contains('user') ? 'user' : 'bot';
    const bubble = el.querySelector('.chat-bubble');
    if (bubble && !el.querySelector('.typing-indicator') && !el.querySelector('.chat-action-btn')) {
      msgs.push({ sender, html: bubble.innerHTML, time: Date.now() });
    }
  });
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED_MSGS)));
  } catch (_) {}
}

function loadChatHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    if (!stored.length) return;

    const container = document.getElementById('chatMessages');
    if (!container) return;

    // Add "Recent chats" divider
    const divider = document.createElement('div');
    divider.style.cssText = 'text-align:center;margin:0.5rem 0;font-size:0.72rem;color:#94a3b8;display:flex;align-items:center;gap:8px;';
    divider.innerHTML = '<span style="flex:1;height:1px;background:rgba(148,163,184,0.2);"></span><span>Recent Chats</span><span style="flex:1;height:1px;background:rgba(148,163,184,0.2);"></span>';
    container.appendChild(divider);

    // Restore messages
    stored.forEach(m => {
      const icon = m.sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';
      const msg = document.createElement('div');
      msg.className = `chat-message ${m.sender}`;
      msg.style.opacity = '0.7';
      msg.innerHTML = `<div class="chat-avatar"><i class="${icon}"></i></div><div class="chat-bubble">${m.html}</div>`;
      container.appendChild(msg);
    });

    // New session divider
    const newDiv = document.createElement('div');
    newDiv.style.cssText = 'text-align:center;margin:0.5rem 0;font-size:0.72rem;color:#0891b2;display:flex;align-items:center;gap:8px;';
    newDiv.innerHTML = '<span style="flex:1;height:1px;background:rgba(8,145,178,0.3);"></span><span>New Session</span><span style="flex:1;height:1px;background:rgba(8,145,178,0.3);"></span>';
    container.appendChild(newDiv);
    container.scrollTop = container.scrollHeight;
  } catch (_) {}
}

// ── Inactivity timer — ask to close after 90s ──
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  closePromptShown = false;
  inactivityTimer = setTimeout(showClosePrompt, 90000); // 90 seconds
}

function showClosePrompt() {
  if (closePromptShown) return;
  closePromptShown = true;

  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'chat-message bot';
  msg.id = 'closePromptMsg';
  msg.innerHTML = `
    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
    <div class="chat-bubble">
      Lagta hai aap busy ho gaye 😊 Kya main yeh chat band kar dun? Ya koi aur help chahiye?
      <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap;">
        <button onclick="keepChatOpen()" style="background:rgba(8,145,178,0.15);border:1px solid rgba(8,145,178,0.3);color:#0891b2;padding:0.4rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:600;font-family:inherit;">
          Nahi, ruko 😊
        </button>
        <button onclick="closeChatSession()" style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.25);color:#dc2626;padding:0.4rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:600;font-family:inherit;">
          Haan, band karo
        </button>
      </div>
    </div>
  `;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function keepChatOpen() {
  const prompt = document.getElementById('closePromptMsg');
  if (prompt) prompt.remove();
  closePromptShown = false;
  addMessage('Theek hai! Main yahan hoon 😊 Koi aur help chahiye?', 'bot');
  resetInactivityTimer();
}

function closeChatSession() {
  saveChatHistory();
  addMessage('Theek hai! Chat band kar rahi hoon. Get well soon! ❤️ Dobara zaroorat ho toh wapas aana 😊', 'bot');
  setTimeout(() => {
    const input = document.getElementById('chatInput');
    const sendBtn = document.querySelector('.chat-send-btn');
    if (input) { input.disabled = true; input.placeholder = 'Chat session ended. Refresh to start again.'; }
    if (sendBtn) sendBtn.disabled = true;
  }, 1500);
}

// ── Send message ──
function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message || input.disabled) return;

  input.value = '';
  resetInactivityTimer();

  // Remove close prompt if visible
  const prompt = document.getElementById('closePromptMsg');
  if (prompt) prompt.remove();

  chatHistory.push({ role: 'user', text: message });
  addMessage(message, 'user');
  const typingEl = addTypingIndicator();

  try {
    const result = await apiCall('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history: chatHistory.slice(-8).map(h => `${h.role}: ${h.text}`).join('\n')
      })
    });

    typingEl.remove();
    chatHistory.push({ role: 'meera', text: result.response });
    addMessage(result.response, 'bot');
    saveChatHistory();

    // Auto-booking trigger
    if (result.bookingAction) {
      await handleAutoBooking(result.bookingAction);
    }

  } catch (err) {
    typingEl.remove();
    addMessage('Oops! Kuch technical issue aa gaya. Thodi der mein try karo 😊', 'bot');
  }
}

// ── Smart Auto Booking ──
async function handleAutoBooking(bookingData) {
  const session = getCurrentUser();
  if (!session || !session.user) {
    setTimeout(() => {
      addMessage('Appointment book karne ke liye pehle login karna hoga! 😊', 'bot');
      addActionButton('Login karein', 'auth.html', '#0891b2');
    }, 600);
    return;
  }

  setTimeout(async () => {
    addMessage('Ek second... aapke liye best doctor dhundh rahi hoon 🔍', 'bot');

    try {
      // Get doctors for the detected department
      const doctors = await apiCall(
        `/api/doctors?department=${encodeURIComponent(bookingData.department)}&available=true`
      );

      if (!doctors || doctors.length === 0) {
        addMessage(`Abhi ${bookingData.department} mein koi doctor available nahi hai. Kya doosra department try karein? 😊`, 'bot');
        addActionButton('Booking Page', 'booking.html', '#0891b2');
        return;
      }

      // Pick best available doctor
      const doctor = doctors[0];
      const today = new Date().toISOString().split('T')[0];
      const date = bookingData.suggestedDate || today;

      // Pick first available slot
      const slots = doctor.availableSlots && doctor.availableSlots.length > 0
        ? doctor.availableSlots
        : ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30'];
      const timeSlot = slots[0];

      // Book appointment via API
      const booking = await apiCall('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientName: session.user.name || 'Patient',
          age: session.user.age || 25,
          phone: session.user.phone || '',
          symptoms: bookingData.symptoms || 'Consultation',
          department: bookingData.department,
          doctorId: doctor._id,
          doctorName: doctor.name,
          date,
          timeSlot
        })
      });

      if (booking && booking.appointment) {
        const apt = booking.appointment;
        const timeFormatted = formatTime(apt.timeSlot);
        addMessage(
          `🎉 Ho gaya! Aapka appointment book ho gaya!\n\n` +
          `🏥 Department: ${apt.department}\n` +
          `👨‍⚕️ Doctor: ${apt.doctorName}\n` +
          `📅 Date: ${apt.date}\n` +
          `⏰ Time: ${timeFormatted}\n` +
          `🎫 Token Number: #${apt.tokenNumber}\n` +
          `⏱️ Est. Wait: ~${apt.estimatedWaitTime} min\n\n` +
          `Samay pe aa jaana! Get well soon ❤️`,
          'bot'
        );
        addActionButton('Meri Appointments Dekho', 'my-records.html', '#059669');
        saveChatHistory();
      }

    } catch (err) {
      addMessage('Appointment book karne mein thodi problem aayi 😔 Booking page pe jaake manually book karo.', 'bot');
      addActionButton('Appointment Book Karo', 'booking.html', '#0891b2');
    }
  }, 1000);
}

// ── Add action button in chat ──
function addActionButton(text, url, color = '#0891b2') {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-message bot chat-action-btn';
  div.innerHTML = `
    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
    <div class="chat-bubble" style="padding:0.5rem 0.75rem;">
      <a href="${url}" style="
        display:inline-flex;align-items:center;gap:8px;
        background:linear-gradient(135deg,${color},${color}dd);
        color:white;text-decoration:none;
        padding:0.55rem 1.1rem;border-radius:10px;
        font-size:0.84rem;font-weight:700;
        box-shadow:0 4px 12px ${color}44;
        transition:all 0.2s;
      ">
        <i class="fas fa-arrow-right"></i> ${text}
      </a>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ── Add message ──
function addMessage(text, sender) {
  const container = document.getElementById('chatMessages');
  const icon = sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';
  const formattedText = text.replace(/\n/g, '<br>');

  const msg = document.createElement('div');
  msg.className = `chat-message ${sender}`;
  msg.innerHTML = `
    <div class="chat-avatar"><i class="${icon}"></i></div>
    <div class="chat-bubble">${formattedText}</div>
  `;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

// ── Typing indicator ──
function addTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-message bot';
  typing.id = 'typingIndicator';
  typing.innerHTML = `
    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
    <div class="chat-bubble">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  return typing;
}
