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
.classifier {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── 폼 카드 ── */
.form-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 32px;
}

.form-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.form-desc {
  color: #94a3b8;
  font-size: 0.93rem;
  margin-bottom: 28px;
  line-height: 1.6;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  color: #94a3b8;
  font-size: 0.87rem;
  font-weight: 600;
  margin-bottom: 6px;
}

.field input,
.field textarea {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.field input:focus,
.field textarea:focus {
  border-color: #60a5fa;
}

.field input:disabled,
.field textarea:disabled {
  opacity: 0.5;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #475569;
}

.classify-btn {
  margin-top: 8px;
  width: 100%;
  padding: 13px;
  background: #2563eb;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s;
}

.classify-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.classify-btn:disabled {
  background: #1e3a5f;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 에러 ── */
.error-banner {
  padding: 12px 16px;
  background: #3b1414;
  border: 1px solid #7f1d1d;
  color: #fca5a5;
  border-radius: 10px;
  font-size: 0.9rem;
}

/* ── 결과 카드 ── */
.result-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.result-icon {
  font-size: 2.4rem;
}

.result-category {
  font-size: 1.3rem;
  font-weight: 700;
  color: #e2e8f0;
}

.result-priority {
  font-size: 0.88rem;
  font-weight: 600;
  margin-top: 4px;
}

.result-priority.높음 { color: #f87171; }
.result-priority.중간 { color: #fbbf24; }
.result-priority.낮음 { color: #4ade80; }

.result-reason,
.result-action {
  background: #0f172a;
  border-radius: 10px;
  padding: 16px;
}

.reason-label,
.action-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
}

.result-reason p,
.result-action p {
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.7;
}

/* ── 히스토리 ── */
.history {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 24px;
}

.history-title {
  font-size: 1rem;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 16px;
}

.history-item {
  padding: 10px 0;
  border-bottom: 1px solid #1e293b;
}

.history-item:last-child {
  border-bottom: none;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.history-icon {
  font-size: 1rem;
}

.history-subject {
  flex: 1;
  color: #e2e8f0;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-priority {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: #0f172a;
}

.history-priority.높음 { color: #f87171; }
.history-priority.중간 { color: #fbbf24; }
.history-priority.낮음 { color: #4ade80; }

.history-category {
  color: #64748b;
  font-size: 0.82rem;
  padding-left: 28px;
}
</style>
