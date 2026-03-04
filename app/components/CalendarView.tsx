'use client'

import { useState } from 'react'
import { CalendarEvent } from './GameCard'
import { parseTeams, getTeamInfo } from '../lib/kboTeams'
import GameCard from './GameCard'

interface Props {
  events: CalendarEvent[]
  currentMonth: Date
  onMonthChange: (d: Date) => void
}

function getKSTDateKey(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarView({ events, currentMonth, onMonthChange }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Build event map: date key → events
  const eventMap = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = ev.allDay ? ev.start.slice(0, 10) : getKSTDateKey(ev.start)
    if (!eventMap.has(key)) eventMap.set(key, [])
    eventMap.get(key)!.push(ev)
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    onMonthChange(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }
  function nextMonth() {
    onMonthChange(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const todayKey = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

  const selectedEvents = selectedDate ? (eventMap.get(selectedDate) ?? []) : []

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '12px 0',
        }}
      >
        <button
          onClick={prevMonth}
          className="month-nav-btn"
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '0 8px' }}
        >
          &#8249;
        </button>
        <span style={{ fontSize: 18, fontWeight: 700 }}>
          {year}년 {month + 1}월
        </span>
        <button
          onClick={nextMonth}
          className="month-nav-btn"
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '0 8px' }}
        >
          &#8250;
        </button>
      </div>

      {/* Day headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: '#888',
          marginBottom: 4,
        }}
      >
        {DAYS.map((d, i) => (
          <div
            key={d}
            style={{ padding: '4px 0', color: i === 0 ? '#e00' : i === 6 ? '#00c' : '#888' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
        }}
      >
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} style={{ minHeight: 64 }} />
          }

          const mm = String(month + 1).padStart(2, '0')
          const dd = String(day).padStart(2, '0')
          const dateKey = `${year}-${mm}-${dd}`
          const dayEvents = eventMap.get(dateKey) ?? []
          const isToday = dateKey === todayKey
          const isSelected = dateKey === selectedDate
          const colIdx = idx % 7

          const cellClass = [
            'calendar-cell',
            dayEvents.length > 0 ? 'has-events' : '',
            isToday ? 'is-today' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div
              key={dateKey}
              className={cellClass}
              onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              style={{
                minHeight: 64,
                padding: '6px 4px',
                borderRadius: 8,
                border: isSelected ? '2px solid #0070f3' : '1px solid #eee',
                background: isSelected ? '#e8f0fe' : isToday ? '#fffbe6' : '#fff',
                cursor: dayEvents.length > 0 ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 400,
                  color: colIdx === 0 ? '#e00' : colIdx === 6 ? '#00c' : '#333',
                  marginBottom: 4,
                }}
              >
                {day}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {dayEvents.slice(0, 4).map((ev) => {
                  const teams = parseTeams(ev.summary)
                  const color = teams ? getTeamInfo(teams[0]).color : '#999'
                  return (
                    <span
                      key={ev.uid}
                      title={ev.summary}
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: color,
                      }}
                    />
                  )
                })}
                {dayEvents.length > 4 && (
                  <span style={{ fontSize: 9, color: '#999' }}>+{dayEvents.length - 4}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected date detail */}
      {selectedDate && selectedEvents.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#333',
              paddingBottom: 8,
              borderBottom: '2px solid #eee',
              marginBottom: 10,
            }}
          >
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })} 경기
          </div>
          {selectedEvents.map((ev) => (
            <GameCard key={ev.uid} event={ev} />
          ))}
        </div>
      )}
    </div>
  )
}
