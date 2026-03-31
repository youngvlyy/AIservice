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
        message: text,
        // 최근 10개만 전달 (컨텍스트 절약)
        history: history.value.slice(-10).map(({ role, content }) => ({ role, content })),
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
  height: 680px;
  background: #1e293b;
  border-radius: 20px;
  border: 1px solid #334155;
  overflow: hidden;
}

/* ── 메시지 영역 ── */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}

/* ── 웰컴 ── */
.welcome {
  margin: auto;
  text-align: center;
  max-width: 480px;
}


.welcome h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.welcome p {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 24px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.suggestion-btn {
  background: #0f172a;
  border: 1px solid #334155;
  color: #93c5fd;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.suggestion-btn:hover {
  background: #1d3a6e;
  border-color: #60a5fa;
}

/* ── 메시지 행 ── */
.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 36px;
  text-align: center;
}

/* ── 말풍선 ── */
.bubble {
  max-width: 72%;
}

.message-row.user .bubble {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
}

.bubble-content {
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 0.97rem;
  line-height: 1.75;
  word-break: break-word;
}

.message-row.user .bubble-content {
  background: #1d4ed8;
  color: #e2e8f0;
  border-bottom-right-radius: 4px;
}

.message-row.assistant .bubble-content {
  background: #0f172a;
  color: #cbd5e1;
  border-bottom-left-radius: 4px;
  border: 1px solid #1e293b;
}

.bubble-content :deep(strong) {
  color: #93c5fd;
  font-weight: 700;
}

.bubble-content :deep(code) {
  background: #1e293b;
  color: #f472b6;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 0.9em;
}

/* ── 탭 이동 버튼 ── */
.nav-btn {
  margin-top: 10px;
  display: inline-block;
  padding: 7px 16px;
  background: #1e3a5f;
  border: 1px solid #2d5296;
  color: #93c5fd;
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.nav-btn:hover {
  background: #2563eb;
  color: white;
}

/* ── 참고 문서 ── */
.used-docs {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.docs-label {
  color: #64748b;
  font-size: 0.78rem;
}

.doc-tag {
  background: #1e293b;
  border: 1px solid #334155;
  color: #64748b;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
}

/* ── 타이핑 인디케이터 ── */
.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px;
  background: #0f172a;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  border: 1px solid #1e293b;
  width: fit-content;
}

.typing span {
  width: 8px;
  height: 8px;
  background: #475569;
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}

.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); background: #60a5fa; }
}

/* ── 에러 ── */
.error-banner {
  margin: 0 16px 12px;
  padding: 10px 16px;
  background: #3b1414;
  border: 1px solid #7f1d1d;
  color: #fca5a5;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* ── 입력 영역 ── */
.input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid #334155;
  background: #1e293b;
}

textarea {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 0.97rem;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.6;
  transition: border-color 0.15s;
  overflow-y: hidden;
}

textarea:focus {
  border-color: #60a5fa;
}

textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

textarea::placeholder {
  color: #475569;
}

.send-btn {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: #2563eb;
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s;
}

.send-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  background: #1e3a5f;
  cursor: not-allowed;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}
</style>
