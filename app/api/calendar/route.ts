import ICAL from 'ical.js'
import { NextRequest, NextResponse } from 'next/server'

// 캐시 유효 시간: 6시간 (초 단위)
const CACHE_TTL_SEC = 6 * 60 * 60

interface CalendarEvent {
  uid: string         // 이벤트 고유 ID
  summary: string     // 일정 제목
  start: string       // 시작 일시 (ISO 8601)
  end: string         // 종료 일시
  location?: string   // 장소
  description?: string
  allDay: boolean     // 하루 종일 여부
}

async function fetchAndParseICS(icsUrl: string): Promise<CalendarEvent[]> {
  // next: { revalidate }를 쓰면 Next.js가 응답을 디스크에 캐시합니다.
  // 인메모리 Map과 달리 서버리스 인스턴스가 여러 개여도 같은 캐시를 공유합니다.
  const response = await fetch(icsUrl, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`ICS fetch 실패: HTTP ${response.status}`)
  }

  const text = await response.text()
  const parsed = ICAL.parse(text)
  const comp = new ICAL.Component(parsed)
  const vevents = comp.getAllSubcomponents('vevent')

  return vevents.map((vevent: ICAL.Component) => {
    const event = new ICAL.Event(vevent)
    const dtstart = event.startDate
    const dtend = event.endDate

    return {
      uid: event.uid ?? '',
      summary: event.summary ?? '',
      start: dtstart.toJSDate().toISOString(),
      end: (dtend ?? dtstart).toJSDate().toISOString(),
      location: event.location || undefined,
      description: event.description || undefined,
      allDay: dtstart.isDate,
    }
  })
}

export async function GET(req: NextRequest) {
  const icsUrl = req.nextUrl.searchParams.get('url')

  if (!icsUrl) {
    return NextResponse.json(
      { error: 'url 파라미터가 필요합니다. 예: /api/calendar?url=https://...' },
      { status: 400 }
    )
  }

  try {
    new URL(icsUrl)
  } catch {
    return NextResponse.json({ error: '유효하지 않은 URL입니다.' }, { status: 400 })
  }

  try {
    const events = await fetchAndParseICS(icsUrl)

    return NextResponse.json(
      { events, count: events.length, fetchedAt: new Date().toISOString() },
      {
        headers: {
          // s-maxage: Vercel CDN 엣지에서 6시간 캐싱 → X-Vercel-Cache: HIT으로 바뀜
          // stale-while-revalidate: 만료 후 24시간은 기존 캐시를 즉시 반환하면서 백그라운드에서 갱신
          'Cache-Control': `public, s-maxage=${CACHE_TTL_SEC}, stale-while-revalidate=86400`,
        },
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
