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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
}
</style>

<style scoped>
.page {
  padding: 60px 20px 40px;
  max-width: 860px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  margin-bottom: 40px;
}

.page-title h1 {
  font-size: 2.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
}

.page-title p {
  color: #94a3b8;
  font-size: 1.05rem;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 36px;
  border-bottom: 1px solid #334155;
}

.tab-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 600;
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  color: #94a3b8;
}

.tab-btn.active {
  color: #60a5fa;
  border-bottom-color: #60a5fa;
}

@media (max-width: 600px) {
  .page-title h1 { font-size: 1.7rem; }
  .page { padding: 40px 16px 24px; }
  .tab-btn { padding: 10px 12px; font-size: 0.88rem; }
}
</style>
