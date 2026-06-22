require('dotenv').config()

const express = require('express')
const cors = require('cors')
const Groq = require('groq-sdk')
const { retrieveDocuments } = require('./documents')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

//한자 제거 함수
function keepKoreanOnly(text) {
  return text
    .replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s\w\d\n\r!?.,;:'"()\-\[\]{}@#$%&*+=<>/\\|~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// 메시지에서 탭 이동 의도 감지
function detectNavigation(message) {
  const m = message
  if (/이메일\s*(분류|페이지|탭|화면)/.test(m)) return { tabId: 'email', label: '이메일 분류' }
  if (/데이터\s*(수집|정리|페이지|탭|화면)/.test(m)) return { tabId: 'data', label: '데이터 수집·정리' }
  if (/보고서/.test(m)) return { tabId: 'report', label: '보고서 자동 생성' }
  if (/서비스\s*소개/.test(m)) return { tabId: 'intro', label: '서비스 소개' }
  return null
}

// POST /api/chat — 메시지를 받아 RAG 기반 AI 튜터 응답 반환
app.post('/api/chat', async (req, res) => {
  const { history = [] } = req.body
  const lastMessage = history[history.length - 1]

  if (!lastMessage || lastMessage.role !== 'user') {
    return res.status(400).json({ error: '메시지가 없습니다.' })
  }

  const message = lastMessage.content

  // 1단계: RAG — 관련 문서 검색
  const relevantDocs = retrieveDocuments(message, 2)

  const contextBlock =
    relevantDocs.length > 0
      ? `\n\n[참고 자료]\n` +
      relevantDocs.map((d) => `## ${d.title}\n${d.content}`).join('\n\n')
      : ''

  // 2단계: 시스템 프롬프트 구성
  const systemPrompt = `당신은 친절하고 유능한 AI 튜터입니다. 학생들이 AI, 프로그래밍, EdTech 관련 개념을 쉽게 이해할 수 있도록 도와줍니다.

답변 원칙:
- 쉬운 비유와 예시를 활용해 설명하세요.
- 핵심 개념은 굵게 강조하세요.
- 너무 길지 않게 핵심만 간결하게 답하세요.
- 학생이 추가로 궁금할 만한 것을 한 가지 제안해도 좋습니다.
- 한국어로 답변하세요. 한자, 중국어, 일본어는 절대 사용하지 마세요.${contextBlock}`

  // 탭 이동 의도 감지
  const nav = detectNavigation(message)

  try {
    // 4단계: Groq API 호출
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
    })

    const answer = keepKoreanOnly(response.choices[0].message.content)

    res.json({
      answer,
      usedDocs: relevantDocs.map((d) => d.title),
      navigateTo: nav ?? undefined,
    })
  } catch (err) {
    console.error('Gemini API 오류:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/organize-data — 원시 데이터 수집·정리
app.post('/api/organize-data', async (req, res) => {
  const { rawData, instruction = '' } = req.body

  if (!rawData) return res.status(400).json({ error: '데이터를 입력해주세요.' })

  const prompt = `다음 원시 데이터를 분석하고 정리하세요.${instruction ? `\n정리 방식: ${instruction}` : ''}

[원시 데이터]
${rawData}

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만:
{
  "summary": "데이터 전체를 1-2문장으로 요약",
  "sections": [
    {
      "title": "섹션 제목",
      "items": ["항목1", "항목2", "항목3"]
    }
  ]
}`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: '당신은 데이터 정리 전문가입니다. 반드시 순수한 JSON만 반환하세요.' },
        { role: 'user', content: prompt },
      ],
    })

    const text = response.choices[0].message.content.trim()
    const rawJson = JSON.parse(text.replace(/```json|```/g, '').trim())
    const json = JSON.parse(
      JSON.stringify(rawJson).replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s\w\d\n\r!?.,;:'"()\-\[\]{}@#$%&*+=<>/\\|~`"]/g, '')
    )
    res.json(json)
  } catch (err) {
    console.error('데이터 정리 오류:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/generate-report — 보고서 자동 생성
app.post('/api/generate-report', async (req, res) => {
  const { topic, keyPoints = '', reportType = '업무보고' } = req.body

  if (!topic) return res.status(400).json({ error: '보고서 주제를 입력해주세요.' })

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const prompt = `다음 조건으로 ${reportType}를 작성하세요.

주제: ${topic}
유형: ${reportType}
${keyPoints ? `핵심 내용/데이터:\n${keyPoints}` : ''}

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만:
{
  "title": "보고서 제목",
  "date": "${today}",
  "type": "${reportType}",
  "summary": "개요 (2-3문장)",
  "sections": [
    {
      "heading": "섹션 제목",
      "paragraphs": ["문단1", "문단2"]
    }
  ],
  "conclusion": "결론 (2-3문장)"
}`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: '당신은 전문 보고서 작성가입니다. 한국어로 작성하고, 반드시 순수한 JSON만 반환하세요.' },
        { role: 'user', content: prompt },
      ],
    })

    const text = response.choices[0].message.content.trim()
    const rawJson = JSON.parse(text.replace(/```json|```/g, '').trim())
    const json = JSON.parse(
      JSON.stringify(rawJson).replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s\w\d\n\r!?.,;:'"()\-\[\]{}@#$%&*+=<>/\\|~`"]/g, '')
    )
    res.json(json)
  } catch (err) {
    console.error('보고서 생성 오류:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/classify-email — 이메일 자동 분류
app.post('/api/classify-email', async (req, res) => {
  const { subject = '', body = '' } = req.body

  if (!subject && !body) {
    return res.status(400).json({ error: '제목 또는 본문을 입력해주세요.' })
  }

  const prompt = `다음 이메일을 분석해서 JSON 형식으로만 답해주세요. 다른 텍스트는 절대 포함하지 마세요.

이메일 제목: ${subject || '(없음)'}
이메일 본문: ${body || '(없음)'}

반환할 JSON 형식:
{
  "category": "업무/중요 | 스팸 | 홍보/마케팅 | 개인 | 알림 | 문의/요청 | 기타 중 하나",
  "priority": "높음 | 중간 | 낮음 중 하나",
  "reason": "분류 이유를 1-2문장으로",
  "action": "권장 조치를 1문장으로"
}`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [
        { role: 'system', content: '당신은 이메일 분류 전문가입니다. 반드시 순수한 JSON만 반환하세요.' },
        { role: 'user', content: prompt },
      ],
    })

    const text = response.choices[0].message.content.trim()
    const rawJson = JSON.parse(text.replace(/```json|```/g, '').trim())
    const json = JSON.parse(
      JSON.stringify(rawJson).replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s\w\d\n\r!?.,;:'"()\-\[\]{}@#$%&*+=<>/\\|~`"]/g, '')
    )
    res.json(json)
  } catch (err) {
    console.error('이메일 분류 오류:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
