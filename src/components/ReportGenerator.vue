<template>
  <div class="generator">
    <div class="form-card">
      <h2 class="form-title">보고서 자동 생성</h2>
      <p class="form-desc">주제와 핵심 내용을 입력하면 AI가 체계적인 보고서를 자동으로 작성합니다.</p>

      <div class="field">
        <label>보고서 주제</label>
        <input
          v-model="topic"
          type="text"
          placeholder="예: 2분기 마케팅 성과 분석, AI 도입 제안서 등"
          :disabled="loading"
        />
      </div>

      <div class="field">
        <label>포함할 내용 / 핵심 데이터 (선택)</label>
        <textarea
          v-model="keyPoints"
          placeholder="보고서에 꼭 포함되어야 할 내용이나 수치를 입력하세요.&#10;예: 매출 20% 증가, 신규 고객 300명, 주요 캠페인 3건"
          rows="5"
          :disabled="loading"
        ></textarea>
      </div>

      <div class="field">
        <label>보고서 유형</label>
        <div class="type-group">
          <button
            v-for="t in reportTypes"
            :key="t.id"
            class="type-btn"
            :class="{ active: reportType === t.id }"
            @click="reportType = t.id"
            :disabled="loading"
          >{{ t.label }}</button>
        </div>
      </div>

      <button class="action-btn" @click="generate" :disabled="loading || !topic.trim()">
        <span v-if="loading" class="spinner"></span>
        <span>{{ loading ? '생성 중...' : '보고서 생성' }}</span>
      </button>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-if="result" class="result-card">
      <div class="result-top">
        <span class="result-label">생성된 보고서</span>
        <button class="copy-btn" @click="copy">{{ copied ? '복사됨' : '복사' }}</button>
      </div>
      <div class="report-title">{{ result.title }}</div>
      <div class="report-meta">{{ result.date }} · {{ result.type }}</div>

      <div v-if="result.summary" class="report-summary">
        <div class="section-label">개요</div>
        <p>{{ result.summary }}</p>
      </div>

      <div v-for="(section, i) in result.sections" :key="i" class="report-section">
        <div class="section-label">{{ section.heading }}</div>
        <p v-for="(para, j) in section.paragraphs" :key="j">{{ para }}</p>
      </div>

      <div v-if="result.conclusion" class="report-conclusion">
        <div class="section-label">결론</div>
        <p>{{ result.conclusion }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const topic = ref('')
const keyPoints = ref('')
const reportType = ref('업무보고')
const loading = ref(false)
const error = ref('')
const result = ref(null)
const copied = ref(false)

const reportTypes = [
  { id: '업무보고', label: '업무 보고' },
  { id: '분석보고', label: '분석 보고' },
  { id: '제안서', label: '제안서' },
  { id: '회의록', label: '회의록' },
]

async function generate() {
  if (!topic.value.trim() || loading.value) return

  error.value = ''
  result.value = null
  loading.value = true

  try {
    const res = await fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic.value,
        keyPoints: keyPoints.value,
        reportType: reportType.value,
      }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      throw new Error(msg || '서버 오류')
    }

    result.value = await res.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function copy() {
  if (!result.value) return
  const r = result.value
  const text = [
    r.title,
    r.date + ' · ' + r.type,
    '',
    '개요',
    r.summary,
    '',
    ...r.sections.flatMap((s) => [s.heading, ...s.paragraphs, '']),
    '결론',
    r.conclusion,
  ].join('\n')
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.generator {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

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
.field textarea:focus { border-color: #a78bfa; }
.field input:disabled,
.field textarea:disabled { opacity: 0.5; }
.field input::placeholder,
.field textarea::placeholder { color: #475569; }

.type-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-btn {
  background: #0f172a;
  border: 1px solid #334155;
  color: #64748b;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.type-btn:hover:not(:disabled) {
  border-color: #a78bfa;
  color: #a78bfa;
}

.type-btn.active {
  background: #2e1065;
  border-color: #a78bfa;
  color: #a78bfa;
  font-weight: 600;
}

.type-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.action-btn {
  margin-top: 8px;
  width: 100%;
  padding: 13px;
  background: #7c3aed;
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

.action-btn:hover:not(:disabled) { background: #6d28d9; }
.action-btn:disabled { background: #2e1065; cursor: not-allowed; }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  padding: 12px 16px;
  background: #3b1414;
  border: 1px solid #7f1d1d;
  color: #fca5a5;
  border-radius: 10px;
  font-size: 0.9rem;
}

.result-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.copy-btn {
  background: #2e1065;
  border: 1px solid #6d28d9;
  color: #a78bfa;
  padding: 5px 14px;
  border-radius: 8px;
  font-size: 0.83rem;
  cursor: pointer;
  transition: background 0.15s;
}

.copy-btn:hover { background: #7c3aed; color: white; }

.report-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #e2e8f0;
  line-height: 1.4;
}

.report-meta {
  font-size: 0.85rem;
  color: #64748b;
}

.report-summary,
.report-section,
.report-conclusion {
  background: #0f172a;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.report-summary p,
.report-section p,
.report-conclusion p {
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.8;
}
</style>
