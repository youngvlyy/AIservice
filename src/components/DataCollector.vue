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
.collector { display: flex; flex-direction: column; gap: 20px; }

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

.result-card { display: flex; flex-direction: column; gap: 16px; }

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

.result-summary {
  color: #71717a;
  font-size: 0.87rem;
  line-height: 1.65;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.result-body {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 14px 16px;
}

.section-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.section-items { list-style: none; display: flex; flex-direction: column; gap: 7px; }

.section-items li {
  color: #a1a1aa;
  font-size: 0.88rem;
  line-height: 1.65;
  padding-left: 16px;
  position: relative;
}

.section-items li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a855f7);
}
</style>
