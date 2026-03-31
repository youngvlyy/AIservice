<template>
  <div class="collector">
    <div class="form-card">
      <h2 class="form-title">데이터 수집·정리</h2>
      <p class="form-desc">정리되지 않은 원시 데이터를 붙여넣으면 AI가 구조화된 형태로 분류·정리합니다.</p>

      <div class="field">
        <label>원시 데이터</label>
        <textarea
          v-model="rawData"
          placeholder="정리가 필요한 데이터를 입력하세요.&#10;예) 회의 메모, 목록, 표, 로그 등 어떤 형태든 가능합니다."
          rows="8"
          :disabled="loading"
        ></textarea>
      </div>

      <div class="field">
        <label>정리 방식 (선택)</label>
        <input
          v-model="instruction"
          type="text"
          placeholder="예: 날짜순 정렬, 카테고리별 그룹화, 중복 제거 등"
          :disabled="loading"
        />
      </div>

      <button class="action-btn" @click="organize" :disabled="loading || !rawData.trim()">
        <span v-if="loading" class="spinner"></span>
        <span>{{ loading ? '정리 중...' : 'AI 데이터 정리' }}</span>
      </button>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-if="result" class="result-card">
      <div class="result-top">
        <span class="result-label">정리 결과</span>
        <button class="copy-btn" @click="copy">{{ copied ? '복사됨' : '복사' }}</button>
      </div>
      <div class="result-summary" v-if="result.summary">{{ result.summary }}</div>
      <div class="result-body" v-for="(section, i) in result.sections" :key="i">
        <div class="section-title">{{ section.title }}</div>
        <ul class="section-items">
          <li v-for="(item, j) in section.items" :key="j">{{ item }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const rawData = ref('')
const instruction = ref('')
const loading = ref(false)
const error = ref('')
const result = ref(null)
const copied = ref(false)

async function organize() {
  if (!rawData.value.trim() || loading.value) return

  error.value = ''
  result.value = null
  loading.value = true

  try {
    const res = await fetch('/api/organize-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawData: rawData.value, instruction: instruction.value }),
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
  const text = result.value.sections
    .map((s) => `[${s.title}]\n` + s.items.map((i) => `- ${i}`).join('\n'))
    .join('\n\n')
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.collector {
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
.field textarea:focus { border-color: #60a5fa; }
.field input:disabled,
.field textarea:disabled { opacity: 0.5; }
.field input::placeholder,
.field textarea::placeholder { color: #475569; }

.action-btn {
  margin-top: 8px;
  width: 100%;
  padding: 13px;
  background: #0d9488;
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

.action-btn:hover:not(:disabled) { background: #0f766e; }
.action-btn:disabled { background: #134e4a; cursor: not-allowed; }

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
  padding: 28px;
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
  background: #1e3a5f;
  border: 1px solid #2d5296;
  color: #93c5fd;
  padding: 5px 14px;
  border-radius: 8px;
  font-size: 0.83rem;
  cursor: pointer;
  transition: background 0.15s;
}

.copy-btn:hover { background: #1d4ed8; }

.result-summary {
  color: #94a3b8;
  font-size: 0.93rem;
  line-height: 1.6;
  padding: 12px 16px;
  background: #0f172a;
  border-radius: 8px;
}

.result-body {
  background: #0f172a;
  border-radius: 10px;
  padding: 16px 20px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #2dd4bf;
  margin-bottom: 10px;
}

.section-items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-items li {
  color: #cbd5e1;
  font-size: 0.93rem;
  line-height: 1.6;
  padding-left: 14px;
  position: relative;
}

.section-items li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2dd4bf;
}
</style>
