<template>
  <div class="classifier">
    <!-- 입력 폼 -->
    <div class="form-card">
      <h2 class="form-title">이메일 자동 분류</h2>
      <p class="form-desc">이메일 내용을 입력하면 AI가 카테고리와 우선순위를 자동으로 분류합니다.</p>

      <div class="field">
        <label>제목</label>
        <input
          v-model="subject"
          type="text"
          placeholder="이메일 제목을 입력하세요"
          :disabled="loading"
        />
      </div>

      <div class="field">
        <label>본문</label>
        <textarea
          v-model="body"
          placeholder="이메일 본문을 입력하세요"
          rows="6"
          :disabled="loading"
        ></textarea>
      </div>

      <button class="classify-btn" @click="classify" :disabled="loading || !canSubmit">
        <span v-if="loading" class="spinner"></span>
        <span>{{ loading ? '분류 중...' : 'AI 분류 시작' }}</span>
      </button>
    </div>

    <!-- 에러 -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- 결과 -->
    <div v-if="result" class="result-card">
      <div class="result-header">
        <div class="result-category">{{ result.category }}</div>
        <div class="result-priority" :class="result.priority">우선순위: {{ result.priority }}</div>
      </div>

      <div class="result-reason">
        <div class="reason-label">분류 이유</div>
        <p>{{ result.reason }}</p>
      </div>

      <div v-if="result.action" class="result-action">
        <div class="action-label">권장 조치</div>
        <p>{{ result.action }}</p>
      </div>
    </div>

    <!-- 히스토리 -->
    <div v-if="history.length > 0" class="history">
      <h3 class="history-title">최근 분류 내역</h3>
      <div
        v-for="(item, i) in history"
        :key="i"
        class="history-item"
      >
        <div class="history-meta">
          <span class="history-subject">{{ item.subject }}</span>
          <span class="history-priority" :class="item.priority">{{ item.priority }}</span>
        </div>
        <div class="history-category">{{ item.category }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const subject = ref('')
const body = ref('')
const loading = ref(false)
const error = ref('')
const result = ref(null)
const history = ref([])

const canSubmit = computed(() => subject.value.trim() || body.value.trim())


async function classify() {
  if (!canSubmit.value || loading.value) return

  error.value = ''
  result.value = null
  loading.value = true

  try {
    const res = await fetch('/api/classify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject.value, body: body.value }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      throw new Error(msg || '서버 오류')
    }

    result.value = await res.json()

    // 히스토리 앞에 추가 (최대 5개)
    history.value.unshift({
      subject: subject.value || '(제목 없음)',
      category: result.value.category,
      priority: result.value.priority,
    })
    if (history.value.length > 5) history.value.pop()

  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.classifier { display: flex; flex-direction: column; gap: 20px; }

.form-card, .result-card, .history {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 28px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
}

.form-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f4f4f5;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.form-desc {
  color: #52525b;
  font-size: 0.85rem;
  margin-bottom: 24px;
  line-height: 1.65;
}

.field { margin-bottom: 14px; }

.field label {
  display: block;
  color: #71717a;
  font-size: 0.78rem;
  font-weight: 500;
  margin-bottom: 6px;
  letter-spacing: 0.01em;
}

.field input, .field textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e4e4e7;
  border-radius: 8px;
  padding: 10px 13px;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.field input:focus, .field textarea:focus {
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.field input:disabled, .field textarea:disabled { opacity: 0.35; }
.field input::placeholder, .field textarea::placeholder { color: #3f3f46; }

.classify-btn {
  margin-top: 8px;
  width: 100%;
  padding: 11px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.classify-btn:hover:not(:disabled) {
  opacity: 0.88;
  box-shadow: 0 4px 28px rgba(99, 102, 241, 0.45);
}
.classify-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: #3f3f46;
  box-shadow: none;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.07);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-radius: 8px;
  font-size: 0.84rem;
}

.result-card { display: flex; flex-direction: column; gap: 16px; }

.result-header { display: flex; align-items: center; gap: 12px; }

.result-category {
  font-size: 1.05rem;
  font-weight: 600;
  color: #f4f4f5;
  letter-spacing: -0.02em;
}

.result-priority {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.01em;
}

.result-priority.높음 {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.22);
}
.result-priority.중간 {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.22);
}
.result-priority.낮음 {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.22);
}

.result-reason, .result-action {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 14px 16px;
}

.reason-label, .action-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 7px;
}

.result-reason p, .result-action p {
  color: #a1a1aa;
  font-size: 0.88rem;
  line-height: 1.75;
}

.history { padding: 24px; }

.history-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}

.history-item {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.history-item:last-child { border-bottom: none; }

.history-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.history-subject {
  flex: 1;
  color: #a1a1aa;
  font-size: 0.87rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-priority {
  font-size: 0.71rem;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
}

.history-priority.높음 {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.18);
}
.history-priority.중간 {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.18);
}
.history-priority.낮음 {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.18);
}

.history-category { color: #3f3f46; font-size: 0.77rem; margin-top: 1px; }
</style>
