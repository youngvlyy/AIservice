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
.generator { display: flex; flex-direction: column; gap: 20px; }

.form-card, .result-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 28px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
}

.form-title { font-size: 1rem; font-weight: 600; color: #f4f4f5; letter-spacing: -0.02em; margin-bottom: 4px; }
.form-desc { color: #52525b; font-size: 0.85rem; margin-bottom: 24px; line-height: 1.65; }
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

.type-group { display: flex; gap: 6px; flex-wrap: wrap; }

.type-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #71717a;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.type-btn:hover:not(:disabled) {
  border-color: rgba(99, 102, 241, 0.3);
  color: #a1a1aa;
  background: rgba(99, 102, 241, 0.06);
}
.type-btn.active {
  border-color: rgba(99, 102, 241, 0.35);
  color: #c4b5fd;
  background: rgba(99, 102, 241, 0.12);
}
.type-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.action-btn {
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

.action-btn:hover:not(:disabled) {
  opacity: 0.88;
  box-shadow: 0 4px 28px rgba(99, 102, 241, 0.45);
}
.action-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: #3f3f46;
  box-shadow: none;
  cursor: not-allowed;
}

.spinner {
  width: 14px; height: 14px;
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

.result-card { display: flex; flex-direction: column; gap: 18px; }

.result-top { display: flex; align-items: center; justify-content: space-between; }

.result-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.copy-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #71717a;
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 0.77rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.copy-btn:hover {
  border-color: rgba(99, 102, 241, 0.35);
  color: #a78bfa;
  background: rgba(99, 102, 241, 0.07);
}

.report-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f4f4f5;
  line-height: 1.4;
  letter-spacing: -0.025em;
}

.report-meta { font-size: 0.78rem; color: #52525b; }

.report-summary, .report-section, .report-conclusion {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.report-summary p, .report-section p, .report-conclusion p {
  color: #a1a1aa;
  font-size: 0.88rem;
  line-height: 1.8;
}
</style>
