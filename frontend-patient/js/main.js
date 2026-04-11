// MediQueue AI - Main JavaScript (shared utilities)
// API base resolution:
// 1) ?apiBase=https://your-backend-url (saved to localStorage)
// 2) localStorage key `mq_api_base`
// 3) local/dev defaults
function sanitizeApiBase(raw) {
  if (!raw) return '';
  return String(raw).trim().replace(/\/+$/, '');
}

function resolveApiBase() {
  const query = new URLSearchParams(window.location.search);
  const queryBase = sanitizeApiBase(query.get('apiBase'));
  if (queryBase) {
    localStorage.setItem('mq_api_base', queryBase);
    return queryBase;
  }

  const storedBase = sanitizeApiBase(localStorage.getItem('mq_api_base'));
  if (storedBase) {
    // If we're already on localhost:3000, ignore any stored base to avoid stale config
    const currentIsLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '3000';
    if (!currentIsLocal) return storedBase;
  }

  const host = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const isPrivateIpv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
  const isLikelyHosted = host.endsWith('.vercel.app') || host.endsWith('.netlify.app');

  if (protocol === 'file:') return 'http://localhost:3000';

  if (isLocalHost && port === '3000') return '';
  if (isLocalHost) return 'http://localhost:3000';

  // If opened from local LAN or custom local dev server, route API to local backend.
  if (!isLikelyHosted && (isPrivateIpv4 || port)) return 'http://localhost:3000';

  // Netlify/production default expects same-origin reverse proxy if configured.
  return '';
}

const API_BASE = resolveApiBase();
const LANGUAGE_STORAGE_KEY = 'mq_lang';
const EASY_MODE_STORAGE_KEY = 'mq_easy_mode';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
];

const TRANSLATIONS = {
  en: {
    'lang.choose': 'Choose your language',
    'lang.subtitle': 'Select your preferred language for better hospital access.',
    'lang.quick': 'Quick select',
    'lang.more': 'More languages',
    'lang.detected': 'Recommended by your browser',
    'lang.continue': 'Continue',
    'lang.voice': 'Hear language prompt',
    'lang.easy': 'Easy mode (simple words + larger text)',
    'lang.change': 'Language',
    'home.heroKicker': 'Next-Gen OPD Experience',
    'home.heroTitle1': 'Smart OPD Flow,',
    'home.heroTitle2': 'Zero Queue Chaos',
    'home.heroTitle3': 'Powered by AI Precision',
    'home.emergency': 'Emergency Appointment',
    'home.login': 'Login',
    'home.create': 'Create Account',
    'home.welcome': 'Welcome to MediQueue AI',
    'auth.title': 'Patient Access',
    'auth.loginTab': 'Login',
    'auth.signupTab': 'Create Account',
    'auth.loginEmailPhone': 'Email or Phone',
    'auth.loginPassword': 'Password',
    'auth.forgot': 'Forgot Password?',
    'auth.sendOtp': 'Send 4-Digit OTP',
    'auth.verifyOtp': 'Verify OTP',
    'auth.resetPassword': 'Reset Password',
    'auth.back': 'Back to Dashboard',
    'patientHome.title': 'Patient Home',
    'patientHome.subtitle': 'Choose what you want to do next',
    'patientHome.navHome': 'Home',
    'patientHome.navBook': 'Book',
    'patientHome.navAnalyzer': 'AI Analyzer',
    'patientHome.navChatbot': 'Chatbot',
    'patientHome.navQueue': 'Queue',
    'patientHome.quick.book.title': 'Book Appointment',
    'patientHome.quick.book.desc': 'Create appointment and get token instantly',
    'patientHome.quick.analyzer.title': 'AI Symptom Analyzer',
    'patientHome.quick.analyzer.desc': 'Check symptoms and get department suggestion',
    'patientHome.quick.chatbot.title': 'AI Chatbot',
    'patientHome.quick.chatbot.desc': 'Ask questions about doctors and processes',
    'patientHome.quick.queue.title': 'Queue Board',
    'patientHome.quick.queue.desc': 'Track live queue updates in real-time',
    'patientHome.quick.nextVisit.title': 'My Next Visit',
    'patientHome.quick.nextVisit.desc': 'Continue your booking and check wait status',
    'patientHome.quick.support.title': 'Support',
    'patientHome.quick.support.desc': 'Get instant help from virtual assistant',
    'auth.continue': 'Continue',
    'auth.useAnother': 'Use Another Account',
    'auth.already': 'You are already logged in as',
    'auth.logout': 'Logout',
    'emergency.title': 'Emergency Appointment',
    'emergency.subtitle': 'Quick booking for urgent and critical cases (no login required)',
    'emergency.nav': 'Emergency',
    'emergency.book': 'Book Emergency Appointment',
    'nav.home': 'Home',
    'nav.book': 'Book',
    'nav.analyzer': 'AI Analyzer',
    'nav.chatbot': 'Chatbot',
    'nav.queue': 'Queue',
    'nav.profile': 'My Profile',
    'nav.emergency': 'Emergency',
    'nav.logout': 'Logout',
    'booking.title': 'Book Appointment',
    'booking.subtitle': 'Fill in your details and book your hospital visit in minutes',
    'booking.patientInfo': 'Patient Information',
    'booking.allRequired': 'All fields are required for booking',
    'booking.name': 'Patient Name',
    'booking.age': 'Age',
    'booking.phone': 'Phone Number',
    'booking.date': 'Appointment Date',
    'booking.symptoms': 'Symptoms',
    'booking.department': 'Department',
    'booking.doctor': 'Select Doctor',
    'booking.timeSlot': 'Time Slot',
    'booking.reset': 'Reset',
    'booking.submit': 'Book Appointment',
    'booking.success': 'Appointment Booked!',
    'booking.viewQueue': 'View Queue',
    'booking.bookAnother': 'Book Another',
    'booking.aiSuggest': 'AI: Suggest Department',
    'queue.nowServing': 'Now Serving',
    'queue.nextInQueue': 'Next in Queue',
    'queue.waiting': 'Waiting',
    'queue.completed': 'Completed',
    'queue.totalToday': 'Total Today',
    'queue.waitingQueue': 'Waiting Queue',
    'queue.backHome': 'Back to Home',
    'analyzer.title': 'AI Symptom Analyzer',
    'analyzer.subtitle': 'Describe your symptoms and our AI will recommend the right department',
    'analyzer.describe': 'Describe Your Symptoms',
    'analyzer.placeholder': 'Example: I have been experiencing chest pain...',
    'analyzer.quickSelect': 'Quick Select:',
    'analyzer.analyzeBtn': 'Analyze Symptoms with AI',
    'analyzer.confidence': 'AI Confidence',
    'analyzer.analysis': 'AI Analysis',
    'analyzer.recommendations': 'Recommendations',
    'analyzer.bookBtn': 'Book Appointment',
    'analyzer.analyzeAgain': 'Analyze Again',
    'chatbot.title': 'AI Hospital Assistant',
    'chatbot.subtitle': 'Ask anything about our hospital services, appointments, and more',
    'chatbot.placeholder': 'Type your message...',
    'chatbot.online': 'Online',
    'profile.title': 'My Profile',
    'profile.basicInfo': 'Basic Information',
    'profile.address': 'Address',
    'profile.emergencyContact': 'Emergency Contact',
    'profile.medicalInfo': 'Medical Information',
    'profile.changePassword': 'Change Password',
    'profile.save': 'Save',
    'profile.incomplete': 'Profile Incomplete',
    'profile.complete': 'Profile Complete'
  },
  hi: {
    'lang.choose': 'अपनी भाषा चुनें',
    'lang.subtitle': 'अस्पताल सेवाओं के लिए अपनी पसंदीदा भाषा चुनें।',
    'lang.quick': 'त्वरित चयन',
    'lang.more': 'अन्य भाषाएं',
    'lang.detected': 'ब्राउज़र से सुझाई गई भाषा',
    'lang.continue': 'आगे बढ़ें',
    'lang.voice': 'भाषा निर्देश सुनें',
    'lang.easy': 'ईज़ी मोड (सरल शब्द + बड़ा टेक्स्ट)',
    'lang.change': 'भाषा',
    'home.heroKicker': 'नेक्स्ट-जेन ओपीडी अनुभव',
    'home.heroTitle1': 'स्मार्ट ओपीडी फ्लो,',
    'home.heroTitle2': 'जीरो कतार अव्यवस्था',
    'home.heroTitle3': 'एआई से बेहतर सेवा',
    'home.emergency': 'आपातकालीन अपॉइंटमेंट',
    'home.login': 'लॉगिन',
    'home.create': 'खाता बनाएं',
    'home.welcome': 'MediQueue AI में आपका स्वागत है',
    'auth.title': 'रोगी प्रवेश',
    'auth.loginTab': 'लॉगिन',
    'auth.signupTab': 'खाता बनाएं',
    'auth.loginEmailPhone': 'ईमेल या फोन',
    'auth.loginPassword': 'पासवर्ड',
    'auth.forgot': 'पासवर्ड भूल गए?',
    'auth.sendOtp': '4-अंकों का OTP भेजें',
    'auth.verifyOtp': 'OTP सत्यापित करें',
    'auth.resetPassword': 'पासवर्ड रीसेट करें',
    'auth.back': 'डैशबोर्ड पर वापस',
    'patientHome.title': 'रोगी होम',
    'patientHome.subtitle': 'अगला कदम चुनें',
    'patientHome.navHome': 'होम',
    'patientHome.navBook': 'बुक',
    'patientHome.navAnalyzer': 'एआई विश्लेषक',
    'patientHome.navChatbot': 'चैटबॉट',
    'patientHome.navQueue': 'क्यू',
    'patientHome.quick.book.title': 'अपॉइंटमेंट बुक करें',
    'patientHome.quick.book.desc': 'अपॉइंटमेंट बनाएं और तुरंत टोकन पाएं',
    'patientHome.quick.analyzer.title': 'एआई लक्षण विश्लेषक',
    'patientHome.quick.analyzer.desc': 'लक्षण जांचें और विभाग की सलाह पाएं',
    'patientHome.quick.chatbot.title': 'एआई चैटबॉट',
    'patientHome.quick.chatbot.desc': 'डॉक्टर और प्रक्रिया से जुड़े सवाल पूछें',
    'patientHome.quick.queue.title': 'क्यू बोर्ड',
    'patientHome.quick.queue.desc': 'लाइव क्यू अपडेट रियल-टाइम में देखें',
    'patientHome.quick.nextVisit.title': 'मेरी अगली विज़िट',
    'patientHome.quick.nextVisit.desc': 'बुकिंग जारी रखें और वेट स्टेटस देखें',
    'patientHome.quick.support.title': 'सहायता',
    'patientHome.quick.support.desc': 'वर्चुअल असिस्टेंट से तुरंत मदद पाएं',
    'auth.continue': 'जारी रखें',
    'auth.useAnother': 'दूसरा अकाउंट उपयोग करें',
    'auth.already': 'आप पहले से लॉगिन हैं',
    'auth.logout': 'लॉगआउट',
    'emergency.title': 'आपातकालीन अपॉइंटमेंट',
    'emergency.subtitle': 'तत्काल और गंभीर मामलों के लिए जल्दी बुकिंग',
    'emergency.nav': 'आपातकाल',
    'emergency.book': 'आपातकालीन अपॉइंटमेंट बुक करें',
    'nav.home': 'होम',
    'nav.book': 'बुक',
    'nav.analyzer': 'एआई विश्लेषक',
    'nav.chatbot': 'चैटबॉट',
    'nav.queue': 'क्यू',
    'nav.profile': 'मेरी प्रोफ़ाइल',
    'nav.emergency': 'आपातकाल',
    'nav.logout': 'लॉगआउट',
    'booking.title': 'अपॉइंटमेंट बुक करें',
    'booking.subtitle': 'अपनी जानकारी भरें और मिनटों में अस्पताल विज़िट बुक करें',
    'booking.patientInfo': 'रोगी की जानकारी',
    'booking.allRequired': 'बुकिंग के लिए सभी फ़ील्ड आवश्यक हैं',
    'booking.name': 'रोगी का नाम',
    'booking.age': 'आयु',
    'booking.phone': 'फ़ोन नंबर',
    'booking.date': 'अपॉइंटमेंट तिथि',
    'booking.symptoms': 'लक्षण',
    'booking.department': 'विभाग',
    'booking.doctor': 'डॉक्टर चुनें',
    'booking.timeSlot': 'समय स्लॉट',
    'booking.reset': 'रीसेट',
    'booking.submit': 'अपॉइंटमेंट बुक करें',
    'booking.success': 'अपॉइंटमेंट बुक हो गई!',
    'booking.viewQueue': 'क्यू देखें',
    'booking.bookAnother': 'और बुक करें',
    'booking.aiSuggest': 'एआई: विभाग सुझाएं',
    'queue.nowServing': 'अभी सेवा में',
    'queue.nextInQueue': 'अगला क्यू में',
    'queue.waiting': 'प्रतीक्षारत',
    'queue.completed': 'पूर्ण',
    'queue.totalToday': 'आज कुल',
    'queue.waitingQueue': 'प्रतीक्षा सूची',
    'queue.backHome': 'होम पर वापस',
    'analyzer.title': 'एआई लक्षण विश्लेषक',
    'analyzer.subtitle': 'अपने लक्षण बताएं और एआई सही विभाग सुझाएगा',
    'analyzer.describe': 'अपने लक्षण बताएं',
    'analyzer.placeholder': 'उदाहरण: मुझे 2 दिनों से सीने में दर्द है...',
    'analyzer.quickSelect': 'त्वरित चयन:',
    'analyzer.analyzeBtn': 'एआई से लक्षण विश्लेषण करें',
    'analyzer.confidence': 'एआई विश्वास',
    'analyzer.analysis': 'एआई विश्लेषण',
    'analyzer.recommendations': 'सिफारिशें',
    'analyzer.bookBtn': 'अपॉइंटमेंट बुक करें',
    'analyzer.analyzeAgain': 'फिर से विश्लेषण करें',
    'chatbot.title': 'एआई हॉस्पिटल असिस्टेंट',
    'chatbot.subtitle': 'हमारी अस्पताल सेवाओं के बारे में कुछ भी पूछें',
    'chatbot.placeholder': 'अपना संदेश टाइप करें...',
    'chatbot.online': 'ऑनलाइन',
    'profile.title': 'मेरी प्रोफ़ाइल',
    'profile.basicInfo': 'बुनियादी जानकारी',
    'profile.address': 'पता',
    'profile.emergencyContact': 'आपातकालीन संपर्क',
    'profile.medicalInfo': 'चिकित्सा जानकारी',
    'profile.changePassword': 'पासवर्ड बदलें',
    'profile.save': 'सहेजें',
    'profile.incomplete': 'प्रोफ़ाइल अधूरी',
    'profile.complete': 'प्रोफ़ाइल पूर्ण'
  },
  ta: {
    'lang.choose': 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    'lang.subtitle': 'மருத்துவ சேவைக்கு விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்.',
    'lang.quick': 'விரைவு தேர்வு',
    'lang.more': 'மேலும் மொழிகள்',
    'lang.detected': 'உலாவி பரிந்துரைத்த மொழி',
    'lang.continue': 'தொடரவும்',
    'lang.voice': 'மொழி அறிவிப்பு கேள்',
    'lang.easy': 'எளிய முறை (பெரிய எழுத்து + எளிய சொற்கள்)',
    'lang.change': 'மொழி',
    'home.heroKicker': 'அடுத்த தலைமுறை OPD அனுபவம்',
    'home.heroTitle1': 'ச்மார்ட் OPD ஓட்டம்,',
    'home.heroTitle2': 'பூஜ்ய வரிசை குழப்பம்',
    'home.heroTitle3': 'AI துல்லிய சேவை',
    'home.emergency': 'அவசர நேர முன்பதிவு',
    'home.login': 'உள்நுழை',
    'home.create': 'கணக்கு உருவாக்கு',
    'home.welcome': 'MediQueue AI வரவேற்கிறது',
    'auth.title': 'நோயாளர் அணுகல்',
    'auth.loginTab': 'உள்நுழை',
    'auth.signupTab': 'கணக்கு உருவாக்கு',
    'auth.loginEmailPhone': 'மின்னஞ்சல் அல்லது தொலைபேசி',
    'auth.loginPassword': 'கடவுச்சொல்',
    'auth.forgot': 'கடவுச்சொல் மறந்துவிட்டதா?',
    'auth.sendOtp': '4 இலக்க OTP அனுப்பு',
    'auth.verifyOtp': 'OTP சரிபார்',
    'auth.resetPassword': 'கடவுச்சொல் மாற்று',
    'auth.back': 'முகப்புக்கு திரும்பு',
    'patientHome.title': 'நோயாளர் முகப்பு',
    'patientHome.subtitle': 'அடுத்த செயல்பாட்டை தேர்வு செய்யவும்',
    'patientHome.navHome': 'முகப்பு',
    'patientHome.navBook': 'முன்பதிவு',
    'patientHome.navAnalyzer': 'AI பகுப்பாய்வு',
    'patientHome.navChatbot': 'சாட்பாட்',
    'patientHome.navQueue': 'வரிசை',
    'patientHome.quick.book.title': 'நியமனம் பதிவு',
    'patientHome.quick.book.desc': 'நியமனம் செய்து உடனே டோக்கன் பெறவும்',
    'patientHome.quick.analyzer.title': 'AI அறிகுறி பகுப்பாய்வு',
    'patientHome.quick.analyzer.desc': 'அறிகுறிகளை பார்த்து துறை பரிந்துரை பெறவும்',
    'patientHome.quick.chatbot.title': 'AI சாட்பாட்',
    'patientHome.quick.chatbot.desc': 'மருத்துவர் மற்றும் செயல்முறை பற்றி கேளுங்கள்',
    'patientHome.quick.queue.title': 'வரிசை பலகை',
    'patientHome.quick.queue.desc': 'நேரடி வரிசை மாற்றங்களை உடனுக்குடன் பாருங்கள்',
    'patientHome.quick.nextVisit.title': 'என் அடுத்த வருகை',
    'patientHome.quick.nextVisit.desc': 'பதிவை தொடரவும், காத்திருப்பு நிலையை பார்க்கவும்',
    'patientHome.quick.support.title': 'உதவி',
    'patientHome.quick.support.desc': 'மெய்நிகர் உதவியாளரிடம் உடனடி உதவி பெறுங்கள்',
    'auth.continue': 'தொடரவும்',
    'auth.useAnother': 'வேறு கணக்கு பயன்படுத்தவும்',
    'auth.already': 'நீங்கள் ஏற்கனவே உள்நுழைந்துள்ளீர்கள்',
    'auth.logout': 'வெளியேறு',
    'emergency.title': 'அவசர முன்பதிவு',
    'emergency.subtitle': 'அவசர நிலைக்கு உடனடி முன்பதிவு',
    'emergency.nav': 'அவசரம்',
    'emergency.book': 'அவசர முன்பதிவை பதிவு செய்',
    'nav.home': 'முகப்பு',
    'nav.book': 'முன்பதிவு',
    'nav.analyzer': 'AI பகுப்பாய்வு',
    'nav.chatbot': 'சாட்பாட்',
    'nav.queue': 'வரிசை',
    'nav.profile': 'என் சுயவிவரம்',
    'nav.emergency': 'அவசரம்',
    'nav.logout': 'வெளியேறு',
    'booking.title': 'நியமனம் பதிவு',
    'booking.subtitle': 'விவரங்களை நிரப்பி நிமிடங்களில் மருத்துவமனை வருகையை பதிவு செய்யுங்கள்',
    'booking.patientInfo': 'நோயாளர் தகவல்',
    'booking.allRequired': 'பதிவுக்கு அனைத்து புலங்களும் தேவை',
    'booking.name': 'நோயாளர் பெயர்',
    'booking.age': 'வயது',
    'booking.phone': 'தொலைபேசி எண்',
    'booking.date': 'நியமன தேதி',
    'booking.symptoms': 'அறிகுறிகள்',
    'booking.department': 'துறை',
    'booking.doctor': 'மருத்துவர் தேர்வு',
    'booking.timeSlot': 'நேர இடம்',
    'booking.reset': 'மீட்டமை',
    'booking.submit': 'நியமனம் பதிவு',
    'booking.success': 'நியமனம் பதிவாகிவிட்டது!',
    'booking.viewQueue': 'வரிசை பார்',
    'booking.bookAnother': 'மேலும் பதிவு',
    'booking.aiSuggest': 'AI: துறை பரிந்துரை',
    'queue.nowServing': 'இப்போது சேவையில்',
    'queue.nextInQueue': 'வரிசையில் அடுத்தது',
    'queue.waiting': 'காத்திருக்கிறது',
    'queue.completed': 'முடிந்தது',
    'queue.totalToday': 'இன்று மொத்தம்',
    'queue.waitingQueue': 'காத்திருப்பு வரிசை',
    'queue.backHome': 'முகப்புக்கு திரும்பு',
    'analyzer.title': 'AI அறிகுறி பகுப்பாய்வு',
    'analyzer.subtitle': 'உங்கள் அறிகுறிகளை விவரிக்கவும், AI சரியான துறையை பரிந்துரைக்கும்',
    'analyzer.describe': 'உங்கள் அறிகுறிகளை விவரிக்கவும்',
    'analyzer.placeholder': 'உதாரணம்: எனக்கு 2 நாட்களாக மார்பு வலி உள்ளது...',
    'analyzer.quickSelect': 'விரைவு தேர்வு:',
    'analyzer.analyzeBtn': 'AI மூலம் அறிகுறிகளை பகுப்பாய்வு செய்',
    'analyzer.confidence': 'AI நம்பிக்கை',
    'analyzer.analysis': 'AI பகுப்பாய்வு',
    'analyzer.recommendations': 'பரிந்துரைகள்',
    'analyzer.bookBtn': 'நியமனம் பதிவு',
    'analyzer.analyzeAgain': 'மீண்டும் பகுப்பாய்வு',
    'chatbot.title': 'AI மருத்துவமனை உதவியாளர்',
    'chatbot.subtitle': 'எங்கள் மருத்துவமனை சேவைகளைப் பற்றி எதையும் கேளுங்கள்',
    'chatbot.placeholder': 'உங்கள் செய்தியை தட்டச்சு செய்யுங்கள்...',
    'chatbot.online': 'ஆன்லைன்',
    'profile.title': 'என் சுயவிவரம்',
    'profile.basicInfo': 'அடிப்படை தகவல்',
    'profile.address': 'முகவரி',
    'profile.emergencyContact': 'அவசர தொடர்பு',
    'profile.medicalInfo': 'மருத்துவ தகவல்',
    'profile.changePassword': 'கடவுச்சொல் மாற்று',
    'profile.save': 'சேமி',
    'profile.incomplete': 'சுயவிவரம் முழுமையடையவில்லை',
    'profile.complete': 'சுயவிவரம் முழுமையானது'
  },
  te: {
    'lang.choose': 'మీ భాషను ఎంచుకోండి',
    'lang.subtitle': 'ఆసుపత్రి సేవల కోసం మీకు ఇష్టమైన భాషను ఎంచుకోండి.',
    'lang.quick': 'త్వరిత ఎంపిక',
    'lang.more': 'ఇంకా భాషలు',
    'lang.detected': 'బ్రౌజర్ సూచించిన భాష',
    'lang.continue': 'కొనసాగించు',
    'lang.voice': 'భాష సూచన వినండి',
    'lang.easy': 'ఈజీ మోడ్ (సాధారణ పదాలు + పెద్ద అక్షరాలు)',
    'lang.change': 'భాష',
    'home.heroKicker': 'నెక్స్ట్-జెన్ OPD అనుభవం',
    'home.heroTitle1': 'స్మార్ట్ OPD ఫ్లో,',
    'home.heroTitle2': 'జీరో క్యూల గందరగోళం',
    'home.heroTitle3': 'AI తో మెరుగైన సేవ',
    'home.emergency': 'అత్యవసర అపాయింట్మెంట్',
    'home.login': 'లాగిన్',
    'home.create': 'ఖాతా సృష్టించు',
    'home.welcome': 'MediQueue AI కి స్వాగతం',
    'auth.title': 'రోగి ప్రవేశం',
    'auth.loginTab': 'లాగిన్',
    'auth.signupTab': 'ఖాతా సృష్టించు',
    'auth.loginEmailPhone': 'ఈమెయిల్ లేదా ఫోన్',
    'auth.loginPassword': 'పాస్‌వర్డ్',
    'auth.forgot': 'పాస్‌వర్డ్ మర్చిపోయారా?',
    'auth.sendOtp': '4 అంకెల OTP పంపు',
    'auth.verifyOtp': 'OTP నిర్ధారించు',
    'auth.resetPassword': 'పాస్‌వర్డ్ రీసెట్',
    'auth.back': 'డాష్‌బోర్డ్‌కు వెనక్కి',
    'patientHome.title': 'రోగి హోమ్',
    'patientHome.subtitle': 'తర్వాత ఏమి చేయాలో ఎంచుకోండి',
    'patientHome.navHome': 'హోమ్',
    'patientHome.navBook': 'బుక్',
    'patientHome.navAnalyzer': 'AI విశ్లేషణ',
    'patientHome.navChatbot': 'చాట్‌బాట్',
    'patientHome.navQueue': 'క్యూ',
    'patientHome.quick.book.title': 'అపాయింట్మెంట్ బుక్ చేయండి',
    'patientHome.quick.book.desc': 'అపాయింట్మెంట్ సృష్టించి వెంటనే టోకెన్ పొందండి',
    'patientHome.quick.analyzer.title': 'AI లక్షణ విశ్లేషకుడు',
    'patientHome.quick.analyzer.desc': 'లక్షణాలు చెక్ చేసి విభాగ సూచన పొందండి',
    'patientHome.quick.chatbot.title': 'AI చాట్‌బాట్',
    'patientHome.quick.chatbot.desc': 'డాక్టర్లు మరియు ప్రక్రియల గురించి అడగండి',
    'patientHome.quick.queue.title': 'క్యూ బోర్డ్',
    'patientHome.quick.queue.desc': 'ప్రత్యక్ష క్యూ అప్‌డేట్స్‌ను రియల్-టైమ్‌లో చూడండి',
    'patientHome.quick.nextVisit.title': 'నా తదుపరి సందర్శనం',
    'patientHome.quick.nextVisit.desc': 'మీ బుకింగ్ కొనసాగించి వేచి స్థితి చూడండి',
    'patientHome.quick.support.title': 'సహాయం',
    'patientHome.quick.support.desc': 'వర్చువల్ అసిస్టెంట్ నుండి వెంటనే సహాయం పొందండి',
    'auth.continue': 'కొనసాగించు',
    'auth.useAnother': 'ఇంకో అకౌంట్ వాడండి',
    'auth.already': 'మీరు ఇప్పటికే లాగిన్ అయ్యారు',
    'auth.logout': 'లాగౌట్',
    'emergency.title': 'అత్యవసర అపాయింట్మెంట్',
    'emergency.subtitle': 'తక్షణ & అత్యవసర పరిస్థితుల కోసం త్వరిత బుకింగ్',
    'emergency.nav': 'అత్యవసరం',
    'emergency.book': 'అత్యవసర అపాయింట్మెంట్ బుక్ చేయండి'
  }
};

// Helper to update backend URL at runtime from browser console:
// setMediQueueApiBase('https://your-backend-domain.com')
window.setMediQueueApiBase = function setMediQueueApiBase(url) {
  const clean = sanitizeApiBase(url);
  if (!clean) {
    localStorage.removeItem('mq_api_base');
  } else {
    localStorage.setItem('mq_api_base', clean);
  }
  window.location.reload();
};

const USER_SESSION_KEY = 'mq_patient_session';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function isUserLoggedIn() {
  const session = getCurrentUser();
  return !!(session && session.token && session.user);
}

function setCurrentUser(sessionData) {
  if (!sessionData || !sessionData.token || !sessionData.user) return;
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
}

function clearCurrentUser() {
  localStorage.removeItem(USER_SESSION_KEY);
}

function getAvailableLanguage(code) {
  return LANGUAGE_OPTIONS.find((l) => l.code === code) || LANGUAGE_OPTIONS[0];
}

function getCurrentLanguage() {
  const saved = sanitizeApiBase(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toLowerCase();
  return getAvailableLanguage(saved).code;
}

function detectBrowserLanguage() {
  const langs = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language || 'en'];
  for (const item of langs) {
    const normalized = String(item || '').toLowerCase();
    const short = normalized.split('-')[0];
    if (LANGUAGE_OPTIONS.some((l) => l.code === short)) return short;
  }
  return 'en';
}

function t(key) {
  const lang = getCurrentLanguage();
  const dict = TRANSLATIONS[lang] || {};
  const en = TRANSLATIONS.en || {};
  return dict[key] || en[key] || key;
}

function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key));
  });

  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key));
  });

  const modalTitle = document.getElementById('languageModalTitle');
  if (modalTitle) modalTitle.textContent = t('lang.choose');
  const modalSub = document.getElementById('languageModalSub');
  if (modalSub) modalSub.textContent = t('lang.subtitle');
  const continueBtn = document.getElementById('langContinueBtn');
  if (continueBtn) continueBtn.textContent = t('lang.continue');
  const voiceBtn = document.getElementById('langVoiceBtn');
  if (voiceBtn) voiceBtn.textContent = t('lang.voice');
  const easyText = document.getElementById('easyModeLabelText');
  if (easyText) easyText.textContent = t('lang.easy');
  const langBtnLabel = document.getElementById('langFloatingLabel');
  if (langBtnLabel) langBtnLabel.textContent = t('lang.change');
}

function applyEasyMode(flag) {
  const isEasy = !!flag;
  localStorage.setItem(EASY_MODE_STORAGE_KEY, isEasy ? '1' : '0');
  document.body.classList.toggle('easy-mode', isEasy);
}

function injectEasyModeStyles() {
  if (document.getElementById('mqEasyModeStyle')) return;
  const style = document.createElement('style');
  style.id = 'mqEasyModeStyle';
  style.textContent = `
    body.easy-mode { font-size: 1.06rem; line-height: 1.65; }
    body.easy-mode .btn, body.easy-mode .btn-primary, body.easy-mode .btn-secondary, body.easy-mode .btn-outline, body.easy-mode .nav-emergency-btn {
      font-size: 1rem !important;
      padding: 0.75rem 1rem !important;
    }
    body.easy-mode h1, body.easy-mode h2, body.easy-mode h3 { letter-spacing: 0.01em; }
    body.easy-mode .form-control { font-size: 1rem !important; min-height: 46px; }
  `;
  document.head.appendChild(style);
}

function getEasyMode() {
  return localStorage.getItem(EASY_MODE_STORAGE_KEY) === '1';
}

async function syncLanguagePreference(lang) {
  const session = getCurrentUser();
  if (!session || !session.token) return;
  try {
    await apiCall('/api/patients/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ token: session.token, preferredLanguage: lang, easyMode: getEasyMode() })
    });
  } catch (_err) {
    // Keep local preference even if remote sync fails.
  }
}

// ---- Google Translate Integration ----
// Uses cookie-based approach — no widget injected, no layout breaking.
// Sets googtrans cookie and reloads; Google's CDN handles the translation.

function applyGoogleTranslate(langCode) {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const value = langCode === 'en' ? '/en/en' : `/en/${langCode}`;

  // Must set cookie on both domain variants for Google Translate to pick it up
  if (!isLocalhost) {
    document.cookie = `googtrans=${value};path=/;domain=.${hostname}`;
  }
  document.cookie = `googtrans=${value};path=/;domain=${hostname}`;
  document.cookie = `googtrans=${value};path=/`;

  localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
  window.location.reload();
}

function getCurrentGoogleLang() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved) return saved;
  const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
  return match ? match[1] : 'en';
}

// ---- Language Translation (MyMemory API — no widget, no layout break) ----

function getCurrentGoogleLang() {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
}

function applyGoogleTranslate(langCode) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
  if (langCode === 'en') {
    // Restore original — reload without translation
    sessionStorage.removeItem('mq_translated_lang');
    window.location.reload();
    return;
  }
  sessionStorage.setItem('mq_translated_lang', langCode);
  translatePageContent(langCode);
}

async function translatePageContent(targetLang) {
  if (targetLang === 'en') return;

  // Collect all text nodes in body (skip script/style/noscript)
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const tag = node.parentElement && node.parentElement.tagName;
        if (['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  // Batch translate in chunks of 10
  const chunkSize = 10;
  for (let i = 0; i < nodes.length; i += chunkSize) {
    const chunk = nodes.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (node) => {
      const original = node.nodeValue.trim();
      if (!original || original.length < 2) return;
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(original)}&langpair=en|${targetLang}`
        );
        const data = await res.json();
        if (data.responseStatus === 200 && data.responseData.translatedText) {
          node.nodeValue = data.nodeValue = data.responseData.translatedText;
        }
      } catch (_) {}
    }));
  }
}

function buildLanguageModal() {
  // Remove old modal so it rebuilds fresh with correct active state each time
  const existing = document.getElementById('languageModalOverlay');
  if (existing) existing.remove();

  const currentLang = getCurrentGoogleLang();

  const overlay = document.createElement('div');
  overlay.id = 'languageModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.75);backdrop-filter:blur(6px);z-index:5000;display:none;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="width:100%;max-width:560px;background:white;border-radius:20px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,0.35);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#0891b2,#0e7490);display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;flex-shrink:0;">
          <i class="fas fa-language"></i>
        </div>
        <div>
          <h2 style="font-size:1.2rem;font-weight:800;margin:0;">Choose Language / भाषा चुनें</h2>
          <p style="font-size:0.8rem;color:#64748b;margin:0;">Select your preferred language</p>
        </div>
        <button onclick="document.getElementById('languageModalOverlay').style.display='none'" style="margin-left:auto;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748b;padding:4px;line-height:1;">✕</button>
      </div>
      <div id="langGrid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:360px;overflow-y:auto;"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const grid = document.getElementById('langGrid');
  LANGUAGE_OPTIONS.forEach((lang) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = lang.code === currentLang;
    btn.style.cssText = `display:flex;align-items:center;gap:10px;padding:0.7rem 1rem;border-radius:12px;border:2px solid ${isActive ? '#0891b2' : '#e2e8f0'};background:${isActive ? '#ecfeff' : 'white'};cursor:pointer;font-family:inherit;transition:all 0.2s;text-align:left;width:100%;`;
    btn.innerHTML = `
      <span style="font-size:1.05rem;font-weight:700;color:#0f172a;">${lang.native}</span>
      <span style="font-size:0.72rem;color:#64748b;">${lang.label}</span>
      ${isActive ? '<i class="fas fa-check-circle" style="margin-left:auto;color:#0891b2;font-size:1rem;"></i>' : ''}
    `;
    btn.onmouseover = () => { if (!isActive) btn.style.borderColor = '#94a3b8'; };
    btn.onmouseout  = () => { if (!isActive) btn.style.borderColor = '#e2e8f0'; };
    btn.onclick = () => {
      overlay.style.display = 'none';
      applyGoogleTranslate(lang.code);
    };
    grid.appendChild(btn);
  });
}

function renderLanguageControl() {
  if (document.getElementById('langControlBtn')) return;

  const currentLang = getCurrentGoogleLang();
  const langObj = LANGUAGE_OPTIONS.find(l => l.code === currentLang) || LANGUAGE_OPTIONS[0];

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;align-items:center;';
  wrapper.innerHTML = `
    <button id="langControlBtn" class="btn-outline btn-sm" type="button" style="padding:0.45rem 0.8rem;display:flex;align-items:center;gap:6px;">
      <i class="fas fa-language"></i>
      <span id="langFloatingLabel">${langObj.native}</span>
    </button>
  `;

  const slot = document.getElementById('langControlSlot');
  if (slot) {
    slot.appendChild(wrapper);
  } else {
    const navContainer = document.querySelector('.nav-container');
    if (navContainer) {
      const mobileToggle = navContainer.querySelector('.mobile-toggle');
      if (mobileToggle) navContainer.insertBefore(wrapper, mobileToggle);
      else navContainer.appendChild(wrapper);
    } else {
      wrapper.style.cssText += 'position:fixed;top:14px;right:14px;z-index:5600;';
      document.body.appendChild(wrapper);
    }
  }

  wrapper.querySelector('#langControlBtn').onclick = () => {
    buildLanguageModal();
    document.getElementById('languageModalOverlay').style.display = 'flex';
  };
}

function setLanguage(lang, syncRemote = false) {
  const finalLang = getAvailableLanguage(lang).code;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, finalLang);
  document.documentElement.lang = finalLang;
  applyTranslations(document);
  if (syncRemote) syncLanguagePreference(finalLang);
}

function speakLanguagePrompt() {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance('Choose your language');
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function initLanguageExperience() {
  injectEasyModeStyles();
  renderLanguageControl();
  applyEasyMode(getEasyMode());

  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved) {
    document.documentElement.lang = saved;
    applyTranslations(document);
  }

  // Re-apply translation if user had selected a non-English language
  const translatedLang = sessionStorage.getItem('mq_translated_lang');
  if (translatedLang && translatedLang !== 'en') {
    translatePageContent(translatedLang);
  }
}

function redirectToAuth(targetPath) {
  const redirect = encodeURIComponent(targetPath || window.location.pathname.split('/').pop() || 'patient-home.html');
  window.location.href = `auth.html?redirect=${redirect}`;
}

function enforceProtectedPatientPages() {
  const protectedPages = ['patient-home.html', 'booking.html', 'symptom-analyzer.html', 'chatbot.html', 'queue-display.html'];
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // Admin can open queue board directly from admin portal.
  if (page === 'queue-display.html' && sessionStorage.getItem('adminToken')) {
    return;
  }

  if (protectedPages.includes(page) && !isUserLoggedIn()) {
    redirectToAuth(page);
  }
}

function setupAuthRequiredLinks() {
  document.querySelectorAll('[data-requires-auth="true"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (isUserLoggedIn()) return;
      e.preventDefault();
      const href = el.getAttribute('href') || 'index.html';
      redirectToAuth(href);
    });
  });
}

function logoutPatientUser() {
  const session = getCurrentUser();
  if (session && session.token) {
    fetch(API_BASE + '/api/patients/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: session.token })
    }).catch(() => {});
  }
  clearCurrentUser();
  window.location.href = 'index.html';
}

function renderAuthActions() {
  const container = document.getElementById('navAuthActions');
  if (!container) return;

  const session = getCurrentUser();
  const user = session ? session.user : null;
  if (user) {
    container.innerHTML = `
      <span class="user-chip"><i class="fas fa-user"></i> ${user.name || 'User'}</span>
      <button class="auth-btn auth-btn-secondary" onclick="logoutPatientUser()"><i class="fas fa-sign-out-alt"></i> ${t('auth.logout')}</button>
    `;
  } else {
    container.innerHTML = `
      <a href="auth.html" class="auth-btn auth-btn-secondary"><i class="fas fa-sign-in-alt"></i> ${t('auth.loginTab')}</a>
      <a href="auth.html?mode=signup" class="auth-btn auth-btn-primary"><i class="fas fa-user-plus"></i> ${t('auth.signupTab')}</a>
    `;
  }
}

async function validateCurrentUserSession() {
  const session = getCurrentUser();
  if (!session || !session.token) return;

  try {
    const res = await fetch(API_BASE + '/api/patients/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: session.token })
    });

    if (!res.ok) {
      clearCurrentUser();
      const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
      const protectedPages = ['patient-home.html', 'booking.html', 'symptom-analyzer.html', 'chatbot.html', 'queue-display.html'];
      if (protectedPages.includes(page)) redirectToAuth(page);
      return;
    }

    const data = await res.json();
    if (data && data.valid && data.user) {
      setCurrentUser({ token: session.token, user: data.user });
      if (data.user.preferredLanguage) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, data.user.preferredLanguage);
        setLanguage(data.user.preferredLanguage, false);
      }
      if (typeof data.user.easyMode === 'boolean') {
        applyEasyMode(data.user.easyMode);
      }
      renderAuthActions();
    }
  } catch (_err) {
    // Ignore transient network errors; local session check still applies.
  }
}

// ---- Toast Notifications ----
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
    <div class="toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlide 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// ---- Browser Notifications ----
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🏥</text></svg>'
    });
  }
}

// Request on page load
requestNotificationPermission();

// ---- Scroll Animations ----
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  initLanguageExperience();
  enforceProtectedPatientPages();
  setupAuthRequiredLinks();
  renderAuthActions();
  validateCurrentUserSession();
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  applyTranslations(document);
});

// ---- Navbar Scroll Effect ----
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// ---- API Helper ----
async function apiCall(endpoint, options = {}) {
  const bases = Array.from(new Set([
    sanitizeApiBase(API_BASE),
    '',
    'http://localhost:3000'
  ]));

  let lastError = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
        err.status = res.status;

        // 404/405 often means wrong API origin in local preview; try next base.
        if (res.status === 404 || res.status === 405) {
          lastError = err;
          continue;
        }

        throw err;
      }

      return await res.json();
    } catch (err) {
      lastError = err;
      // Network-level failure, keep trying other candidate bases.
      if (err && err.name === 'TypeError') {
        continue;
      }
    }
  }

  console.error(`API Error (${endpoint}):`, lastError);
  throw lastError || new Error('API request failed');
}

// ---- Format Helpers ----
function formatTime(slot) {
  if (!slot) return '--';
  const [h, m] = slot.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Department colors mapping
const deptColors = {
  'Cardiology': '#ef4444',
  'General Medicine': '#3b82f6',
  'Orthopedics': '#f97316',
  'Neurology': '#8b5cf6',
  'Pediatrics': '#10b981',
  'Dermatology': '#ec4899',
  'ENT': '#14b8a6',
  'Ophthalmology': '#6366f1',
  'Gastroenterology': '#eab308',
  'Psychiatry': '#7c3aed',
  'Gynecology': '#f43f5e',
  'Dental': '#06b6d4',
  'Pulmonology': '#0891b2',
  'Urology': '#0ea5e9',
  'Endocrinology': '#84cc16'
};

function getDeptColor(dept) {
  return deptColors[dept] || '#64748b';
}

// Department icons
const deptIcons = {
  'Cardiology': 'fas fa-heartbeat',
  'General Medicine': 'fas fa-stethoscope',
  'Orthopedics': 'fas fa-bone',
  'Neurology': 'fas fa-brain',
  'Pediatrics': 'fas fa-baby',
  'Dermatology': 'fas fa-hand-sparkles',
  'ENT': 'fas fa-head-side-cough',
  'Ophthalmology': 'fas fa-eye',
  'Gastroenterology': 'fas fa-stomach',
  'Psychiatry': 'fas fa-comments',
  'Gynecology': 'fas fa-venus',
  'Dental': 'fas fa-tooth',
  'Pulmonology': 'fas fa-lungs',
  'Urology': 'fas fa-kidneys',
  'Endocrinology': 'fas fa-vial'
};

function getDeptIcon(dept) {
  return deptIcons[dept] || 'fas fa-hospital';
}
