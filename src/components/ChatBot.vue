<template>
  <div class="chatbot">
    <!-- 메시지 영역 -->
    <div class="messages" ref="messagesEl">
      <!-- 웰컴 메시지 -->
      <div v-if="history.length === 0" class="welcome">
        <h3>챗봇에게 무엇이든 물어보세요</h3>
        <p>다양한 주제를 설명해드립니다.</p>
        <div class="suggestions">
          <button
            v-for="q in suggestedQuestions"
            :key="q"
            class="suggestion-btn"
            @click="sendSuggestion(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <!-- 대화 메시지 -->
      <template v-else>
        <div
          v-for="(msg, i) in history"
          :key="i"
          class="message-row"
          :class="msg.role"
        >
          <div class="avatar">{{ msg.role === 'assistant' ? 'AI' : '나' }}</div>
          <div class="bubble">
            <div class="bubble-content" v-html="formatMessage(msg.content)"></div>
            <div v-if="msg.usedDocs?.length" class="used-docs">
              <span class="docs-label">참고:</span>
              <span v-for="doc in msg.usedDocs" :key="doc" class="doc-tag">{{ doc }}</span>
            </div>
            <button
              v-if="msg.navigateTo"
              class="nav-btn"
              @click="$emit('navigate', msg.navigateTo.tabId)"
            >{{ msg.navigateTo.label }} 페이지로 이동</button>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="message-row assistant">
          <div class="avatar">AI</div>
          <div class="bubble">
            <div class="typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- 입력 영역 -->
    <div class="input-area">
      <textarea
        v-model="inputText"
        placeholder="질문을 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
        rows="1"
        @keydown.enter.exact.prevent="sendMessage"
        @input="autoResize"
        ref="textareaEl"
        :disabled="loading"
      ></textarea>
      <button class="send-btn" @click="sendMessage" :disabled="loading || !inputText.trim()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

defineEmits(['navigate'])

const history = ref([])
const inputText = ref('')
const loading = ref(false)
const error = ref('')
const messagesEl = ref(null)
const textareaEl = ref(null)

const suggestedQuestions = [
  '챗봇은 어떻게 동작하나요?',
  'vue.js에 대해 설명해주세요',
  '이메일 분류 페이지로 가주세요',
]

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  error.value = ''
  inputText.value = ''
  resetTextarea()

  // 사용자 메시지를 즉시 표시
  history.value.push({ role: 'user', content: text })
  await scrollToBottom()

  loading.value = true

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: history.value.map(({ role, content }) => ({ role, content })),
      }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      throw new Error(msg || '서버 오류')
    }

    const { answer, usedDocs, navigateTo } = await res.json()
    history.value.push({ role: 'assistant', content: answer, usedDocs, navigateTo })
  } catch (e) {
    error.value = e.message
    // 실패한 사용자 메시지 제거
    history.value.pop()
    inputText.value = text
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function sendSuggestion(q) {
  inputText.value = q
  sendMessage()
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

function autoResize() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function resetTextarea() {
  if (textareaEl.value) textareaEl.value.style.height = 'auto'
}

// **표시 → <strong>, 줄바꿈 → <br> 변환
function formatMessage(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />')
}
</script>

<style scoped>
.chatbot {
  display: flex;
  flex-direction: column;
  height: 700px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.06);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.2) transparent;
}

.messages::-webkit-scrollbar { width: 4px; }
.messages::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 4px; }

.welcome {
  margin: auto;
  text-align: center;
  max-width: 380px;
  padding: 16px 0;
}

.welcome h3 {
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #f4f4f5, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.welcome p {
  color: #52525b;
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 28px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.suggestion-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #a1a1aa;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.suggestion-btn:hover {
  border-color: rgba(99, 102, 241, 0.4);
  color: #c4b5fd;
  background: rgba(99, 102, 241, 0.08);
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 600;
  color: #71717a;
  margin-top: 2px;
}

.message-row.user .avatar {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.25);
  color: #818cf8;
}

.bubble {
  max-width: 74%;
}

.message-row.user .bubble {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
}

.bubble-content {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.91rem;
  line-height: 1.75;
  word-break: break-word;
}

.message-row.user .bubble-content {
  background: rgba(99, 102, 241, 0.14);
  color: #c4b5fd;
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-bottom-right-radius: 4px;
}

.message-row.assistant .bubble-content {
  background: rgba(255, 255, 255, 0.04);
  color: #d4d4d8;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-bottom-left-radius: 4px;
}

.bubble-content :deep(strong) {
  color: #f4f4f5;
  font-weight: 600;
}

.bubble-content :deep(code) {
  background: rgba(99, 102, 241, 0.1);
  color: #a78bfa;
  padding: 2px 7px;
  border-radius: 5px;
  font-family: 'Consolas', 'JetBrains Mono', monospace;
  font-size: 0.87em;
  border: 1px solid rgba(99, 102, 241, 0.18);
}

.nav-btn {
  margin-top: 10px;
  display: inline-block;
  padding: 6px 14px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.22);
  color: #818cf8;
  border-radius: 20px;
  font-size: 0.81rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.nav-btn:hover {
  background: rgba(99, 102, 241, 0.16);
  border-color: rgba(99, 102, 241, 0.4);
  color: #c4b5fd;
}

.used-docs {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.docs-label {
  color: #52525b;
  font-size: 0.73rem;
}

.doc-tag {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #71717a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
}

.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  width: fit-content;
  border-bottom-left-radius: 4px;
}

.typing span {
  width: 6px;
  height: 6px;
  background: rgba(99, 102, 241, 0.4);
  border-radius: 50%;
  animation: bounce 1.3s ease-in-out infinite;
}

.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-6px); opacity: 1; background: rgba(168, 85, 247, 0.7); }
}

.error-banner {
  margin: 0 16px 12px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.07);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-radius: 8px;
  font-size: 0.84rem;
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

textarea {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #e4e4e7;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.91rem;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.6;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow-y: hidden;
}

textarea:focus {
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
textarea:disabled { opacity: 0.35; cursor: not-allowed; }
textarea::placeholder { color: #3f3f46; }

.send-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 4px 28px rgba(99, 102, 241, 0.5);
}
.send-btn:active:not(:disabled) { transform: scale(0.94); }
.send-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: none;
  cursor: not-allowed;
}

.send-btn svg {
  width: 15px;
  height: 15px;
}
</style>
