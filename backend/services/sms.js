const DEFAULT_COUNTRY_CODE = process.env.SMS_DEFAULT_COUNTRY_CODE || '+91';

function normalizeToE164(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (String(phone).trim().startsWith('+')) return String(phone).trim();
  if (digits.length === 10 && DEFAULT_COUNTRY_CODE.startsWith('+')) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }
  return `+${digits}`;
}

async function sendViaTwilio(phoneE164, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return { delivered: false, provider: 'none', error: 'Twilio credentials missing' };
  }

  try {
    const twilio = require('twilio');
    const client = twilio(sid, token);
    const resp = await client.messages.create({
      body: message,
      from,
      to: phoneE164
    });

    return {
      delivered: true,
      provider: 'twilio',
      messageSid: resp.sid
    };
  } catch (error) {
    console.error('Twilio send error:', error.message);
    return {
      delivered: false,
      provider: 'twilio',
      error: error.message
    };
  }
}

function normalizeForFast2SMS(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

async function sendViaFast2SMS(phone, otp, appName) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    return { delivered: false, provider: 'fast2sms', error: 'Fast2SMS API key missing' };
  }

  const number = normalizeForFast2SMS(phone);
  if (!/^\d{10}$/.test(number)) {
    return { delivered: false, provider: 'fast2sms', error: 'Invalid recipient phone for Fast2SMS' };
  }

  const body = {
    route: 'q',
    message: `${appName}: Your 4-digit OTP is ${otp}. Valid for 5 minutes.`,
    language: 'english',
    flash: 0,
    numbers: number
  };

  try {
    const resp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await resp.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = null;
    }

    if (!resp.ok) {
      return {
        delivered: false,
        provider: 'fast2sms',
        error: (data && (data.message || data.error)) || text || `HTTP ${resp.status}`
      };
    }

    const ok = !!(data && (data.return === true || data.status_code === 200 || data.status === 'OK'));
    return {
      delivered: ok,
      provider: 'fast2sms',
      error: ok ? undefined : ((data && (data.message || data.error)) || 'Fast2SMS delivery failed'),
      raw: data
    };
  } catch (error) {
    return {
      delivered: false,
      provider: 'fast2sms',
      error: error.message
    };
  }
}

async function sendOtpToPhone(phone, otp) {
  const phoneE164 = normalizeToE164(phone);
  const appName = process.env.OTP_BRAND_NAME || 'MediQueue AI';
  const message = `${appName}: Your 4-digit OTP is ${otp}. Valid for 5 minutes.`;

  const provider = String(process.env.SMS_PROVIDER || '').toLowerCase();
  if (provider === 'fast2sms') {
    return sendViaFast2SMS(phone, otp, appName);
  }

  if (provider === 'twilio') {
    return sendViaTwilio(phoneE164, message);
  }

  return { delivered: false, provider: 'none', error: 'SMS provider not configured' };
}

module.exports = {
  sendOtpToPhone,
  normalizeToE164,
  sendAppointmentReminder,
  sendAppointmentConfirmation
};

async function sendAppointmentConfirmation(phone, { patientName, tokenNumber, doctorName, department, timeSlot, date, waitTime }) {
  const phoneE164 = normalizeToE164(phone);
  const appName = process.env.OTP_BRAND_NAME || 'MediQueue AI';
  const time = formatSlot(timeSlot);
  const message = `${appName}: Appointment Confirmed!\nPatient: ${patientName}\nToken: #${tokenNumber}\nDoctor: ${doctorName} (${department})\nDate: ${date} at ${time}\nEst. Wait: ${waitTime} min\nEmergency: 108`;

  return sendSMS(phoneE164, message);
}

async function sendAppointmentReminder(phone, { patientName, tokenNumber, doctorName, timeSlot, tokensAhead }) {
  const phoneE164 = normalizeToE164(phone);
  const appName = process.env.OTP_BRAND_NAME || 'MediQueue AI';
  const time = formatSlot(timeSlot);
  const message = `${appName}: Reminder! Your turn is coming up.\nPatient: ${patientName}\nToken: #${tokenNumber}\nDoctor: ${doctorName}\nTime: ${time}\n${tokensAhead <= 2 ? 'Please be ready NOW!' : `${tokensAhead} patients ahead of you.`}`;

  return sendSMS(phoneE164, message);
}

function formatSlot(slot) {
  if (!slot) return '--';
  const [h, m] = slot.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

async function sendSMS(phoneE164, message) {
  const provider = String(process.env.SMS_PROVIDER || '').toLowerCase();
  if (provider === 'twilio') return sendViaTwilio(phoneE164, message);
  // Dev fallback — log only
  console.log(`[SMS DEV] To: ${phoneE164}\n${message}`);
  return { delivered: false, provider: 'dev', debugMessage: message };
}
