export interface TeamInfo {
  color: string
  bg: string
}

export const KBO_TEAMS: Record<string, TeamInfo> = {
  '키움': { color: '#BB0000', bg: '#fff0f0' },
  'SSG': { color: '#CE0E2D', bg: '#fff0f2' },
  'LG':  { color: '#C30452', bg: '#fff0f4' },
  '두산': { color: '#131230', bg: '#f0f0ff' },
  'KT':  { color: '#000000', bg: '#f5f5f5' },
  '삼성': { color: '#074CA1', bg: '#f0f4ff' },
  'NC':  { color: '#315288', bg: '#f0f4ff' },
  '롯데': { color: '#041E42', bg: '#f0f2ff' },
  'KIA': { color: '#EA0029', bg: '#fff0f0' },
  '한화': { color: '#FF6600', bg: '#fff5f0' },
}

export const TEAM_NAMES = Object.keys(KBO_TEAMS)

// "키움 vs SSG" → ['키움', 'SSG']
export function parseTeams(summary: string): [string, string] | null {
  const match = summary.match(/^(.+?)\s+vs\s+(.+)$/i)
  if (!match) return null
  return [match[1].trim(), match[2].trim()]
}

export function getTeamInfo(name: string): TeamInfo {
  return KBO_TEAMS[name] ?? { color: '#666666', bg: '#f5f5f5' }
}

// 2026 KBO 시범경기: 3월 12일 ~ 3월 24일 (데이터 기준)
const PRESEASON_END_KST = '2026-03-24'

export function isPreseason(isoStr: string): boolean {
  const dateKey = new Date(isoStr).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
  return dateKey <= PRESEASON_END_KST
}
