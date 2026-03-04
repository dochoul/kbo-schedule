'use client'

import { parseTeams, getTeamInfo } from '../lib/kboTeams'

export interface CalendarEvent {
  uid: string
  summary: string
  start: string
  end: string
  location?: string
  description?: string
  allDay: boolean
}

interface Props {
  event: CalendarEvent
}

function toKST(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function GameCard({ event }: Props) {
  const teams = parseTeams(event.summary)
  const [homeTeam, awayTeam] = teams ?? ['', '']
  const homeInfo = getTeamInfo(homeTeam)
  const awayInfo = getTeamInfo(awayTeam)
  const timeStr = event.allDay ? '시간 미정' : toKST(event.start)

  return (
    <div
      className="game-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #e5e5e5',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* 왼쪽 팀 색상 바 */}
      <div style={{ width: 5, alignSelf: 'stretch', background: homeInfo.color }} />

      {/* 메인 내용 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '12px 14px',
          gap: 12,
        }}
      >
        {/* 홈팀 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 50 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: homeInfo.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, color: homeInfo.color, fontSize: 15 }}>
            {homeTeam || event.summary}
          </span>
        </div>

        {teams && (
          <>
            <span style={{ color: '#999', fontSize: 13, fontWeight: 500 }}>vs</span>

            {/* 원정팀 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 50 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: awayInfo.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 700, color: awayInfo.color, fontSize: 15 }}>
                {awayTeam}
              </span>
            </div>
          </>
        )}

        {/* 시간 + 장소 (오른쪽 정렬) */}
        <div
          style={{
            marginLeft: 'auto',
            textAlign: 'right',
            fontSize: 13,
            color: '#555',
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 600 }}>{timeStr}</div>
          {event.location && (
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{event.location}</div>
          )}
        </div>
      </div>

      {/* 오른쪽 팀 색상 바 */}
      {teams && <div style={{ width: 5, alignSelf: 'stretch', background: awayInfo.color }} />}
    </div>
  )
}
