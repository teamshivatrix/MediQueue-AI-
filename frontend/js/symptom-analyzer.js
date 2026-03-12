// MediQueue AI - Symptom Analyzer JavaScript

function addSymptom(symptom) {
  const input = document.getElementById('symptomInput');
  const current = input.value.trim();
  if (current && !current.endsWith(',') && !current.endsWith('.')) {
    input.value = current + ', ' + symptom;
  } else {
    input.value = (current ? current + ' ' : '') + symptom;
  }
  input.focus();
}

async function analyzeSymptoms() {
  const symptoms = document.getElementById('symptomInput').value.trim();
  if (!symptoms) {
    showToast('Missing Info', 'Please describe your symptoms', 'warning');
    return;
  }

  const btn = document.getElementById('analyzeBtn');
  btn.innerHTML = '<div class="spinner"></div> Analyzing with AI...';
  btn.disabled = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const result = await apiCall('/api/ai/analyze-symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    showResult(result);
    showToast('Analysis Complete', `Suggested Department: ${result.department}`, 'success');
  } catch (err) {
    console.error('Symptom analysis error:', err);
    if (err.name === 'AbortError') {
      showToast('Timeout', 'AI is taking too long. Please try again.', 'warning');
    } else {
      showToast('Analysis Failed', 'Could not reach AI. Please try again.', 'error');
    }
  } finally {
    btn.innerHTML = '<i class="fas fa-brain"></i> Analyze Symptoms with AI';
    btn.disabled = false;
  }
}

function showResult(result) {
  const resultCard = document.getElementById('analyzerResult');
  resultCard.classList.add('show');

  // Department name & icon
  document.getElementById('resultDept').textContent = result.department;
  const icon = document.getElementById('resultIcon');
  icon.innerHTML = `<i class="${getDeptIcon(result.department)}"></i>`;
  icon.style.background = `linear-gradient(135deg, ${getDeptColor(result.department)}, ${getDeptColor(result.department)}dd)`;

  // Priority badge
  const priorityEl = document.getElementById('resultPriority');
  priorityEl.textContent = result.priority ? result.priority.toUpperCase() : 'MEDIUM';
  priorityEl.className = `result-priority priority-${result.priority || 'medium'}`;

  // Confidence bar
  const confidence = Math.round((result.confidence || 0.8) * 100);
  document.getElementById('resultConfidence').textContent = confidence + '%';
  setTimeout(() => {
    document.getElementById('confidenceFill').style.width = confidence + '%';
  }, 300);

  // Reasoning
  document.getElementById('resultReasoning').textContent = result.reasoning || 'Based on symptom analysis.';

  // Recommendations
  const recsEl = document.getElementById('resultRecommendations');
  if (result.recommendations && result.recommendations.length) {
    recsEl.innerHTML = result.recommendations.map(r =>
      `<div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:0.5rem;">
        <i class="fas fa-check-circle" style="color:var(--secondary); margin-top:3px; flex-shrink:0;"></i>
        <span style="font-size:0.9rem; color:#475569;">${r}</span>
      </div>`
    ).join('');
  } else {
    recsEl.innerHTML = '<p style="color:#64748b; font-size:0.9rem;">Please visit the recommended department for consultation.</p>';
  }

  // Update booking link with department parameter
  const bookBtn = document.getElementById('bookDeptBtn');
  if (bookBtn) {
    bookBtn.href = `booking.html?dept=${encodeURIComponent(result.department)}`;
  }

  // Scroll to result
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetAnalyzer() {
  document.getElementById('analyzerResult').classList.remove('show');
  document.getElementById('symptomInput').value = '';
  document.getElementById('confidenceFill').style.width = '0%';
  document.getElementById('symptomInput').focus();
}
