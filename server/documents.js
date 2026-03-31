// RAG 지식 베이스 — AI 튜터가 참고하는 교육 문서
const documents = [
  {
    id: 1,
    title: 'AI 챗봇이란?',
    tags: ['ai', '챗봇', 'chatbot', 'gpt', '인공지능'],
    content: `
AI 챗봇은 인공지능 기술을 이용해 사람과 자연어로 대화하는 프로그램입니다.
ChatGPT, Claude, Gemini 같은 서비스가 대표적입니다.

핵심 개념:
- LLM(Large Language Model): 대규모 텍스트로 학습된 언어 모델
- 프롬프트(Prompt): AI에게 주는 지시 또는 질문
- 토큰(Token): AI가 텍스트를 처리하는 단위 (단어보다 작을 수 있음)
- 컨텍스트 윈도우: AI가 한 번에 기억할 수 있는 최대 텍스트 양

동작 원리:
1. 사용자가 텍스트(프롬프트)를 입력
2. LLM이 학습된 패턴으로 다음에 올 텍스트를 예측
3. 자연스러운 답변을 생성해 출력
    `.trim(),
  },
  {
    id: 2,
    title: 'RAG (Retrieval-Augmented Generation)',
    tags: ['rag', '검색', 'retrieval', '벡터', 'embedding', '문서'],
    content: `
RAG는 AI가 외부 문서를 검색(Retrieve)해서 그 내용을 바탕으로 답변을 생성(Generate)하는 기술입니다.

왜 RAG가 필요한가?
- 일반 LLM은 학습 시점 이후의 정보를 모름
- 회사 내부 문서, 개인 데이터에 접근 불가
- RAG로 이 한계를 극복

RAG 동작 과정:
1. 문서를 벡터(숫자 배열)로 변환해 저장 (Embedding)
2. 사용자 질문도 벡터로 변환
3. 유사도가 높은 문서를 검색 (Retrieval)
4. 검색된 문서를 LLM 프롬프트에 포함
5. LLM이 문서를 참고해 답변 생성

사용 예시: 사내 FAQ 봇, 법률 문서 검색, 의료 정보 조회
    `.trim(),
  },
  {
    id: 3,
    title: 'EdTech — 교육과 기술의 결합',
    tags: ['edtech', '교육', '학습', 'ai튜터', '학습앱', '온라인강의'],
    content: `
EdTech(에드테크)는 Education + Technology의 합성어로, 기술을 활용한 교육 서비스를 의미합니다.

주요 분야:
- AI 튜터: 학생 수준에 맞게 문제와 설명을 자동 생성
- 적응형 학습(Adaptive Learning): AI가 학습 데이터를 분석해 커리큘럼 자동 조정
- 온라인 LMS: Coursera, Udemy 같은 강의 플랫폼
- 게임화(Gamification): 점수, 뱃지, 레벨로 학습 동기 부여

AI 튜터의 특징:
- 24시간 즉각 피드백 제공
- 개인 학습 속도에 맞춤
- 취약 영역 자동 파악 및 반복 학습 유도
- 대규모 학생에게도 1:1 교육 경험 제공
    `.trim(),
  },
  {
    id: 4,
    title: '업무 프로세스 자동화',
    tags: ['자동화', 'automation', 'rpa', '업무', '워크플로우', '효율'],
    content: `
업무 프로세스 자동화는 반복적인 업무를 AI나 소프트웨어가 대신 처리하게 만드는 것입니다.

주요 기술:
- RPA(Robotic Process Automation): 사람이 하던 클릭, 데이터 입력 등을 로봇이 대신
- API 연동: 서로 다른 시스템을 연결해 데이터 자동 전달
- AI + 자동화: AI가 판단 후 자동으로 처리 (예: 이메일 분류 후 자동 답장)

자동화 가능한 업무 예시:
- 이메일 분류 및 우선순위 지정
- 데이터 수집 → 정리 → 보고서 생성
- 주문 처리 및 재고 관리
- 소셜 미디어 콘텐츠 스케줄링

효과:
- 반복 업무에서 직원 해방 → 창의적 업무 집중
- 오류 감소, 처리 속도 향상
- 24시간 무중단 운영 가능
    `.trim(),
  },
  {
    id: 5,
    title: 'Vue.js 기초',
    tags: ['vue', 'vuejs', '프론트엔드', 'javascript', '컴포넌트', '프레임워크'],
    content: `
Vue.js는 사용자 인터페이스를 만들기 위한 JavaScript 프레임워크입니다.

핵심 개념:
- 컴포넌트(Component): UI를 독립적인 조각으로 나눈 것. 재사용 가능
- 반응성(Reactivity): 데이터가 바뀌면 화면이 자동으로 업데이트
- 디렉티브: v-if, v-for, v-bind, v-on 등 HTML에서 Vue 기능 사용
- Props: 부모 → 자식 컴포넌트로 데이터 전달
- Emit: 자식 → 부모 컴포넌트로 이벤트 전달

Composition API (Vue 3):
- setup() 함수 또는 <script setup> 사용
- ref(): 단일 값 반응형 데이터
- reactive(): 객체형 반응형 데이터
- computed(): 계산된 값
- watch(): 데이터 변화 감지

<script setup> 예시:
const count = ref(0)
const double = computed(() => count.value * 2)
    `.trim(),
  },
  {
    id: 6,
    title: 'JavaScript 기초',
    tags: ['javascript', 'js', '변수', '함수', '배열', '비동기', 'async', 'await', 'promise'],
    content: `
JavaScript는 웹 브라우저에서 실행되는 프로그래밍 언어입니다.

변수 선언:
- const: 재할당 불가 (권장)
- let: 재할당 가능
- var: 구식, 사용 지양

주요 데이터 타입:
- string: "안녕하세요"
- number: 42, 3.14
- boolean: true, false
- array: [1, 2, 3]
- object: { name: "홍길동", age: 20 }

비동기 처리 (async/await):
- fetch, API 호출 등 시간이 걸리는 작업에 사용
- async 함수 안에서 await 키워드로 결과를 기다림
- try/catch로 에러 처리

배열 메서드:
- map(): 각 요소를 변환해 새 배열 반환
- filter(): 조건에 맞는 요소만 추출
- find(): 조건에 맞는 첫 번째 요소 반환
    `.trim(),
  },
  {
    id: 7,
    title: 'API와 REST API',
    tags: ['api', 'rest', 'http', '요청', '응답', 'json', '서버', '백엔드'],
    content: `
API(Application Programming Interface)는 서로 다른 프로그램이 통신하는 방법입니다.

REST API:
- HTTP 프로토콜로 데이터를 주고받는 API 설계 방식
- 주요 메서드: GET(조회), POST(생성), PUT(수정), DELETE(삭제)
- 요청과 응답은 주로 JSON 형식 사용

JSON 예시:
{ "name": "홍길동", "score": 95, "subjects": ["수학", "영어"] }

HTTP 상태 코드:
- 200: 성공
- 201: 생성 성공
- 400: 잘못된 요청
- 401: 인증 필요
- 404: 찾을 수 없음
- 500: 서버 오류

fetch 사용 예시:
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '안녕?' })
})
const data = await res.json()
    `.trim(),
  },
]

/**
 * 쿼리와 관련된 문서를 키워드 기반으로 검색 (간단한 RAG 검색)
 * @param {string} query
 * @param {number} topK 반환할 최대 문서 수
 */
function retrieveDocuments(query, topK = 2) {
  const q = query.toLowerCase()

  const scored = documents.map((doc) => {
    let score = 0
    // 태그 일치 (높은 가중치)
    for (const tag of doc.tags) {
      if (q.includes(tag)) score += 3
    }
    // 제목 키워드 일치
    const titleWords = doc.title.toLowerCase().split(/\s+/)
    for (const word of titleWords) {
      if (q.includes(word) && word.length > 1) score += 2
    }
    // 본문 키워드 일치
    const contentWords = [...new Set(doc.content.toLowerCase().split(/\s+/))]
    for (const word of contentWords) {
      if (word.length > 2 && q.includes(word)) score += 1
    }
    return { doc, score }
  })

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ doc }) => doc)
}

module.exports = { documents, retrieveDocuments }
