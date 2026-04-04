// MediQueue AI - Chatbot JavaScript

function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';

  // Add user message
  addMessage(message, 'user');

  // Show typing indicator
  const typingEl = addTypingIndicator();

  try {
    const result = await apiCall('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });

    // Remove typing indicator
    typingEl.remove();

    // Add bot response
    addMessage(result.response, 'bot');

  } catch (err) {
    typingEl.remove();
    addMessage('Sorry, I encountered an error. Please try again.', 'bot');
  }
}

function addMessage(text, sender) {
  const container = document.getElementById('chatMessages');
  const icon = sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';

  // Convert newlines to <br> for display
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

function addTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-message bot';
  typing.id = 'typingIndicator';
  typing.innerHTML = `
    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
    <div class="chat-bubble">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  return typing;
}
