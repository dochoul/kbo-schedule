# ⚾ KBO 일정 뷰어

KBO 리그 경기 일정을 한눈에 볼 수 있는 웹 앱입니다.
Google Calendar에서 ICS 파일을 가져와 목록 뷰와 캘린더 뷰로 보여줍니다.

---

## 주요 기능

- **목록 뷰** — 월 단위로 경기 일정을 날짜별로 나열 (`‹ 2026년 3월 ›` 네비게이션)
- **캘린더 뷰** — 월간 그리드 캘린더, 날짜 클릭 시 해당 날 경기 상세 표시
- **팀 필터** — 10개 KBO 구단 중 원하는 팀만 필터링
- **CORS 우회 프록시** — 브라우저에서 직접 접근 불가한 ICS URL을 서버에서 대신 가져옴
- **6시간 캐싱** — 동일 URL 반복 요청 시 서버 메모리에서 즉시 응답

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| ICS 파싱 | ical.js |
| 스타일 | 인라인 스타일 + CSS 애니메이션 |
| 런타임 | Node.js 20 |

---

## 프로젝트 구조

```
app/
├── api/
│   └── calendar/
│       └── route.ts       # ICS 프록시 API (캐싱 포함)
├── components/
│   ├── GameCard.tsx        # 경기 카드 컴포넌트
│   ├── TeamFilter.tsx      # 팀 필터 버튼
│   ├── ListView.tsx        # 월별 목록 뷰
│   └── CalendarView.tsx    # 월간 캘린더 뷰
├── lib/
│   └── kboTeams.ts         # KBO 10개 구단 정보 및 유틸 함수
├── globals.css             # 전역 스타일 및 애니메이션
├── layout.tsx              # 루트 레이아웃
└── page.tsx                # 메인 페이지
```

---

## API

### `GET /api/calendar`

외부 ICS URL을 서버에서 가져와 파싱된 이벤트 목록을 반환합니다.

**쿼리 파라미터**

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `url` | ✅ | 가져올 ICS 파일의 URL (URL 인코딩 필요) |

**요청 예시**

```
GET /api/calendar?url=https%3A%2F%2Fexample.com%2Fcalendar.ics
```

**응답 예시**

```json
{
  "events": [
    {
      "uid": "abc123",
      "summary": "KIA vs LG",
      "start": "2026-03-04T09:00:00.000Z",
      "end": "2026-03-04T12:00:00.000Z",
      "location": "광주-기아 챔피언스 필드",
      "description": null,
      "allDay": false
    }
  ],
  "count": 1,
  "cached": false,
  "fetchedAt": "2026-03-04T10:00:00.000Z"
}
```

캐시된 응답일 경우 `cacheExpiresIn`(초) 필드가 추가됩니다.

**HTTP 상태 코드**

| 코드 | 의미 |
|------|------|
| `200` | 성공 |
| `400` | `url` 파라미터 누락 또는 잘못된 URL 형식 |
| `502` | 외부 ICS 파일 가져오기 실패 |

---

## 캐싱 동작

- 동일 URL의 첫 요청 시 외부 서버에서 ICS 파일을 가져와 서버 메모리에 저장
- 이후 **6시간** 동안 같은 URL 요청은 저장된 데이터를 즉시 반환
- 서버가 재시작되면 캐시는 초기화됨

---

## 로컬 실행 방법

**사전 요구사항**: Node.js 20

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

```bash
# 프로덕션 빌드
npm run build
npm start
```

---

## KBO 구단 정보

`app/lib/kboTeams.ts`에 10개 구단의 팀 색상이 정의되어 있습니다.

| 구단 | 대표 색상 |
|------|-----------|
| KIA  | `#EA0029` |
| 삼성 | `#074CA1` |
| LG   | `#C30452` |
| 두산 | `#131230` |
| KT   | `#000000` |
| SSG  | `#CE0E2D` |
| 롯데 | `#041E42` |
| 한화 | `#FF6600` |
| NC   | `#315288` |
| 키움 | `#BB0000` |
