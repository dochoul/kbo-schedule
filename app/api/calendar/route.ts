// ical.js: .ics 형식의 캘린더 파일을 읽고 해석해주는 라이브러리
import ICAL from 'ical.js'
// Next.js에서 제공하는 요청(Request)과 응답(Response) 도구
import { NextRequest, NextResponse } from 'next/server'

// 캐시 유효 시간: 6시간 (단위: 밀리초)
// 같은 URL을 6시간 안에 다시 요청하면 저장해둔 결과를 바로 돌려줍니다.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6시간

// 캘린더 이벤트 하나의 구조를 정의합니다.
// (TypeScript에서 데이터의 모양을 미리 약속해두는 것)
interface CalendarEvent {
  uid: string         // 이벤트 고유 ID (중복 방지용)
  summary: string     // 일정 제목
  start: string       // 시작 일시 (ISO 8601 형식, 예: "2026-03-04T09:00:00.000Z")
  end: string         // 종료 일시
  location?: string   // 장소 (없을 수도 있음)
  description?: string // 상세 설명 (없을 수도 있음)
  allDay: boolean     // 하루 종일 일정 여부
}

// 캐시에 저장할 데이터의 구조를 정의합니다.
interface CacheEntry {
  events: CalendarEvent[] // 파싱된 이벤트 목록
  fetchedAt: number       // 데이터를 가져온 시각 (Unix 타임스탬프, 밀리초)
}

// 서버 메모리에 데이터를 임시 저장해두는 공간입니다.
// URL을 key로, 파싱 결과를 value로 저장합니다.
// (서버가 재시작되면 초기화됩니다)
const cache = new Map<string, CacheEntry>()

// ICS 파일을 원격 URL에서 내려받아 이벤트 목록으로 변환하는 함수
async function fetchAndParseICS(icsUrl: string): Promise<CalendarEvent[]> {
  // 외부 URL에서 .ics 파일을 가져옵니다. cache: 'no-store'는 브라우저/네트워크 캐시를 무시하고 항상 최신 파일을 받겠다는 의미입니다.
  const response = await fetch(icsUrl, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`ICS fetch 실패: HTTP ${response.status}`)
  }

  // 응답 본문을 텍스트(문자열)로 읽습니다.
  const text = await response.text()

  // ical.js로 텍스트를 파싱(구조화된 데이터로 변환)합니다.
  const parsed = ICAL.parse(text)
  // 전체 캘린더 객체로 감쌉니다.
  const comp = new ICAL.Component(parsed)
  // 캘린더 안의 모든 이벤트(VEVENT) 항목을 추출합니다.
  const vevents = comp.getAllSubcomponents('vevent')

  // 각 이벤트를 우리가 원하는 형태(CalendarEvent)로 변환합니다.
  return vevents.map((vevent: ICAL.Component) => {
    const event = new ICAL.Event(vevent)
    const dtstart = event.startDate
    const dtend = event.endDate

    return {
      uid: event.uid ?? '',
      summary: event.summary ?? '',
      // toJSDate()로 JavaScript Date 객체로 변환 후, ISO 문자열로 직렬화합니다.
      start: dtstart.toJSDate().toISOString(),
      // 종료 일시가 없는 경우 시작 일시로 대체합니다.
      end: (dtend ?? dtstart).toJSDate().toISOString(),
      location: event.location || undefined,
      description: event.description || undefined,
      // isDate가 true이면 시간 없이 날짜만 있는 하루 종일 일정입니다.
      allDay: dtstart.isDate,
    }
  })
}

// GET 요청 핸들러: /api/calendar?url=... 로 들어오는 요청을 처리합니다.
export async function GET(req: NextRequest) {
  // 쿼리 파라미터에서 'url' 값을 꺼냅니다. (예: ?url=https://example.com/cal.ics)
  const icsUrl = req.nextUrl.searchParams.get('url')

  // url 파라미터가 없으면 오류를 반환합니다.
  if (!icsUrl) {
    return NextResponse.json(
      { error: 'url 파라미터가 필요합니다. 예: /api/calendar?url=https://...' },
      { status: 400 }
    )
  }

  // URL 형식이 올바른지 검사합니다. (new URL()이 실패하면 잘못된 형식)
  try {
    new URL(icsUrl)
  } catch {
    return NextResponse.json({ error: '유효하지 않은 URL입니다.' }, { status: 400 })
  }

  // 캐시에 이미 저장된 데이터가 있는지 확인합니다.
  const cached = cache.get(icsUrl)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    // 캐시가 유효하면(6시간 이내) 저장된 데이터를 바로 돌려줍니다.
    const remainingMs = CACHE_TTL_MS - (Date.now() - cached.fetchedAt)
    return NextResponse.json({
      events: cached.events,
      count: cached.events.length,
      cached: true,                               // 캐시에서 가져온 데이터임을 표시
      cacheExpiresIn: Math.floor(remainingMs / 1000), // 캐시 남은 유효 시간 (초 단위)
      fetchedAt: new Date(cached.fetchedAt).toISOString(), // 원본 데이터를 가져온 시각
    })
  }

  // 캐시가 없거나 만료됐을 때: 외부에서 직접 ICS 파일을 가져와 파싱합니다.
  try {
    const events = await fetchAndParseICS(icsUrl)
    // 파싱 결과를 캐시에 저장합니다. (다음 6시간 동안 재사용)
    cache.set(icsUrl, { events, fetchedAt: Date.now() })

    return NextResponse.json({
      events,
      count: events.length,
      cached: false,                        // 직접 가져온 데이터임을 표시
      fetchedAt: new Date().toISOString(),  // 현재 시각
    })
  } catch (err) {
    // ICS 파일을 가져오거나 파싱하는 중 오류가 발생하면 502 에러를 반환합니다.
    // 502는 "서버가 외부 서버로부터 응답을 제대로 받지 못했을 때" 사용하는 HTTP 상태 코드입니다.
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
