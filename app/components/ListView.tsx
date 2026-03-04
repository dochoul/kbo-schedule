'use client'

import GameCard, { CalendarEvent } from './GameCard'

interface Props {
  events: CalendarEvent[]
  currentMonth: Date
  onMonthChange: (d: Date) => void
}

function toKSTDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function getKSTDateKey(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
}

export default function ListView({ events, currentMonth, onMonthChange }: Props) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // 현재 월에 해당하는 이벤트만 필터링
  const monthEvents = events.filter((ev) => {
    const key = ev.allDay ? ev.start.slice(0, 10) : getKSTDateKey(ev.start)
    const [y, m] = key.split('-').map(Number)
    return y === year && m === month + 1
  })

  function prevMonth() {
    onMonthChange(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    onMonthChange(new Date(year, month + 1, 1))
  }

  // 날짜별 그룹화
  const groups = new Map<string, CalendarEvent[]>()
  for (const ev of monthEvents) {
    const key = ev.allDay ? ev.start.slice(0, 10) : getKSTDateKey(ev.start)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(ev)
  }
  const sortedKeys = Array.from(groups.keys()).sort()

  return (
    <div>
      {/* 월 네비게이터 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '4px 0 20px',
        }}
      >
        <button
          onClick={prevMonth}
          className="month-nav-btn"
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: '0 8px', color: '#333' }}
        >
          &#8249;
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, minWidth: 120, textAlign: 'center' }}>
          {year}년 {month + 1}월
        </span>
        <button
          onClick={nextMonth}
          className="month-nav-btn"
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: '0 8px', color: '#333' }}
        >
          &#8250;
        </button>
        <span style={{ fontSize: 13, color: '#aaa', marginLeft: 4 }}>
          {monthEvents.length}경기
        </span>
      </div>

      {/* 경기 목록 */}
      {sortedKeys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 15 }}>
          이 달에 경기가 없습니다.
        </div>
      ) : (
        sortedKeys.map((key, i) => {
          const dayEvents = groups.get(key)!
          const label = toKSTDate(key + 'T12:00:00')
          return (
            <div
              key={key}
              className="fade-in-up"
              style={{ marginBottom: 24, animationDelay: `${i * 40}ms` }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#333',
                  padding: '6px 0',
                  marginBottom: 8,
                  borderBottom: '2px solid #eee',
                }}
              >
                {label}
              </div>
              {dayEvents.map((ev) => (
                <GameCard key={ev.uid} event={ev} />
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
