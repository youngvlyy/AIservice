<template>
  <div class="page">
    <header class="page-title">
      <h1>AI 서비스</h1>
      <p>업무에 효율적인 AI 활용 분야</p>
    </header>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'tutor'" class="chatbot-wrapper">
      <ChatBot @navigate="activeTab = $event" />
    </div>

    <div v-else-if="activeTab === 'email'" class="page-wrapper">
      <EmailClassifier />
    </div>

    <div v-else-if="activeTab === 'data'" class="page-wrapper">
      <DataCollector />
    </div>

    <div v-else-if="activeTab === 'report'" class="page-wrapper">
      <ReportGenerator />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatBot from './components/ChatBot.vue'
import EmailClassifier from './components/EmailClassifier.vue'
import DataCollector from './components/DataCollector.vue'
import ReportGenerator from './components/ReportGenerator.vue'

const activeTab = ref('tutor')

const tabs = [
  { id: 'tutor',  label: 'AI 튜터' },
  { id: 'email',  label: '이메일 분류' },
  { id: 'data',   label: '데이터 수집·정리' },
  { id: 'report', label: '보고서 자동 생성' },
]
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: #09090b;
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -5%, rgba(99, 102, 241, 0.14), transparent),
    radial-gradient(ellipse 50% 30% at 85% 5%, rgba(168, 85, 247, 0.08), transparent);
  background-attachment: fixed;
  color: #e4e4e7;
  min-height: 100vh;
}
</style>

<style scoped>
.page {
  padding: 64px 24px 80px;
  max-width: 860px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 44px;
}

.page-title h1 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #f4f4f5 20%, #a78bfa 80%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title p {
  color: #52525b;
  font-size: 0.875rem;
}

.tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 11px;
  padding: 4px;
  width: fit-content;
}

.tab-btn {
  background: none;
  border: 1px solid transparent;
  color: #52525b;
  font-size: 0.85rem;
  font-family: inherit;
  font-weight: 500;
  padding: 8px 18px;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.tab-btn:hover {
  color: #a1a1aa;
  background: rgba(255, 255, 255, 0.04);
}

.tab-btn.active {
  color: #c4b5fd;
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.22);
}

@media (max-width: 600px) {
  .page { padding: 40px 16px 48px; }
  .tabs { width: 100%; flex-wrap: wrap; }
  .tab-btn { padding: 7px 12px; font-size: 0.8rem; }
}
</style>
