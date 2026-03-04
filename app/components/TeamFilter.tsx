'use client'

import { TEAM_NAMES, KBO_TEAMS } from '../lib/kboTeams'

interface Props {
  selected: string | null
  onSelect: (team: string | null) => void
}

export default function TeamFilter({ selected, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 0' }}>
      <button
        onClick={() => onSelect(null)}
        className="filter-btn"
        style={{
          padding: '5px 14px',
          borderRadius: 20,
          border: '1.5px solid',
          borderColor: selected === null ? '#0070f3' : '#ddd',
          background: selected === null ? '#0070f3' : '#fff',
          color: selected === null ? '#fff' : '#444',
          fontSize: 13,
          cursor: 'pointer',
          fontWeight: selected === null ? 600 : 400,
        }}
      >
        전체
      </button>
      {TEAM_NAMES.map((team) => {
        const info = KBO_TEAMS[team]
        const active = selected === team
        return (
          <button
            key={team}
            onClick={() => onSelect(active ? null : team)}
            className="filter-btn"
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: active ? info.color : '#ddd',
              background: active ? info.color : '#fff',
              color: active ? '#fff' : info.color,
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: active ? 600 : 400,
            }}
          >
            {team}
          </button>
        )
      })}
    </div>
  )
}
