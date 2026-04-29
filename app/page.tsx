'use client'

import { useState, useEffect } from 'react'
import ICAL from 'ical.js'
import TeamFilter from './components/TeamFilter'
import CalendarView from './components/CalendarView'
import ListView from './components/ListView'
import { CalendarEvent } from './components/GameCard'
import { parseTeams } from './lib/kboTeams'

const KBO_ICS_URL =
  'https://calendar.google.com/calendar/ical/6vsu6cm3kuamp3in12lqpt8at4jre0lb%40import.calendar.google.com/public/basic.ics'

type Tab = 'calendar' | 'list'

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    fetch(KBO_ICS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`ICS fetch 실패: HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        const comp = new ICAL.Component(ICAL.parse(text))
        const events: CalendarEvent[] = comp
          .getAllSubcomponents('vevent')
          .map((vevent: ICAL.Component) => {
            const ev = new ICAL.Event(vevent)
            const dtstart = ev.startDate
            const dtend = ev.endDate
            return {
              uid: ev.uid ?? '',
              summary: ev.summary ?? '',
              start: dtstart.toJSDate().toISOString(),
              end: (dtend ?? dtstart).toJSDate().toISOString(),
              location: ev.location || undefined,
              description: ev.description || undefined,
              allDay: dtstart.isDate,
            }
          })
        setEvents(events)
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const filteredEvents = selectedTeam
    ? events.filter((ev) => {
        const teams = parseTeams(ev.summary)
        return teams && (teams[0] === selectedTeam || teams[1] === selectedTeam)
      })
    : events

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          padding: '80px 0',
        }}
      >
        <div className="spinner" />
        <span style={{ color: '#999', fontSize: 14 }}>일정을 불러오는 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 16 }}>
        <div
          style={{
            background: '#fff0f0',
            border: '1px solid #ffcccc',
            color: '#cc0000',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px 60px' }}>
      <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        ⚾ KBO 일정
      </h1>

      <TeamFilter selected={selectedTeam} onSelect={setSelectedTeam} />

      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '2px solid #eee',
          marginTop: 12,
          marginBottom: 16,
        }}
      >
        {(['list', 'calendar'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="tab-btn"
            style={{
              padding: '8px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #0070f3' : '2px solid transparent',
              marginBottom: -2,
              fontSize: 14,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? '#0070f3' : '#666',
              cursor: 'pointer',
            }}
          >
            {tab === 'list' ? '목록' : '캘린더'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#aaa', alignSelf: 'center' }}>
          {filteredEvents.length}경기
        </span>
      </div>

      {activeTab === 'list' ? (
        <ListView
          events={filteredEvents}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      ) : (
        <CalendarView
          events={filteredEvents}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}
    </div>
  )
}
