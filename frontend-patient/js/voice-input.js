// MediQueue AI — Voice Input (Web Speech API)
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { console.warn('[Voice] Not supported'); return; }

  function injectMicButton(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const btnId = 'mic_' + targetId;
    if (document.getElementById(btnId)) return; // already injected

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = btnId;
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    btn.title = 'Voice Input';
    btn.style.cssText = 'position:absolute;right:10px;bottom:10px;width:38px;height:38px;border-radius:50%;border:none;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(8,145,178,0.4);z-index:20;';

    const parent = target.parentElement;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    parent.appendChild(btn);

    // State
    let active = false;
    let accumulated = '';
    let rec = null;

    function newRec() {
      const r = new SR();
      r.lang = 'en-US';
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      return r;
    }

    function startSession() {
      if (rec) { try { rec.abort(); } catch(_){} rec = null; }
      if (!active) return;

      rec = newRec();

      rec.onresult = function(e) {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) accumulated += t + ' ';
          else interim += t;
        }
        target.value = (accumulated + interim).trim();
        target.dispatchEvent(new Event('input', { bubbles: true }));
      };

      rec.onerror = function(e) {
        if (e.error === 'not-allowed') {
          alert('Mic permission denied! Browser settings mein allow karo.');
          deactivate(); return;
        }
        // network, no-speech etc — onend will restart
      };

      rec.onend = function() {
        if (!active) return;
        // Always restart with fresh object after 200ms
        setTimeout(startSession, 200);
      };

      try { rec.start(); }
      catch(e) { setTimeout(startSession, 300); }
    }

    function activate() {
      active = true;
      accumulated = target.value || '';
      btn.style.background = 'linear-gradient(135deg,#dc2626,#b91c1c)';
      btn.style.boxShadow = '0 0 0 6px rgba(220,38,38,0.2)';
      btn.innerHTML = '<i class="fas fa-stop"></i>';
      btn.title = 'Stop recording';
      startSession();
    }

    function deactivate() {
      active = false;
      if (rec) {
        rec.onend = null; rec.onerror = null;
        try { rec.abort(); } catch(_) {}
        rec = null;
      }
      btn.style.background = 'linear-gradient(135deg,#0891b2,#0e7490)';
      btn.style.boxShadow = '0 4px 12px rgba(8,145,178,0.4)';
      btn.innerHTML = '<i class="fas fa-microphone"></i>';
      btn.title = 'Voice Input';
    }

    btn.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      if (active) deactivate(); else activate();
    });
  }

  function autoInject() {
    if (document.getElementById('symptomInput')) injectMicButton('symptomInput');
    if (document.getElementById('chatInput')) injectMicButton('chatInput');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      autoInject();
      setTimeout(autoInject, 500);
    });
  } else {
    autoInject();
    setTimeout(autoInject, 500);
  }

  window.VoiceInput = { injectMicButton };
})();
