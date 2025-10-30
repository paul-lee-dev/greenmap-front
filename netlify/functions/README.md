# Netlify Functions

## bike-proxy

서울시 따릉이 공공 API를 위한 프록시 함수입니다.

### 왜 필요한가?

-   서울시 공공 API는 **HTTP만 지원** (`http://openapi.seoul.go.kr:8088`)
-   Netlify는 **HTTPS로 배포**
-   브라우저의 **Mixed Content 정책**으로 HTTPS → HTTP 직접 호출 차단
-   서버사이드 프록시로 우회 ✅

### 사용 방법

#### 로컬 테스트

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# Netlify Dev 서버 실행 (Functions 포함)
netlify dev
```

Functions는 `http://localhost:8888/.netlify/functions/bike-proxy`에서 실행됩니다.

#### API 호출 예시

```bash
# 1-1000번 대여소 조회
curl "http://localhost:8888/.netlify/functions/bike-proxy?start=1&end=1000"

# 1001-2000번 대여소 조회
curl "http://localhost:8888/.netlify/functions/bike-proxy?start=1001&end=2000"
```

#### 프로덕션 호출

```bash
curl "https://your-site.netlify.app/.netlify/functions/bike-proxy?start=1&end=1000"
```

### 환경 변수 설정

Netlify 대시보드에서 설정:

```
VITE_SEOUL_API_KEY = 477963524563656239354167434858
```

**중요**: 이 환경 변수가 없으면 Functions가 작동하지 않습니다!

### 응답 형식

#### 성공 (200)

```json
{
  "stationInfo": {
    "list_total_count": 2500,
    "RESULT": {
      "CODE": "INFO-000",
      "MESSAGE": "정상 처리되었습니다"
    },
    "row": [
      {
        "RENT_ID": "ST-4",
        "RENT_NM": "102. 망원역 1번출구 앞",
        "STA_LAT": "37.5556488",
        "STA_LONG": "126.9104095",
        ...
      }
    ]
  }
}
```

#### 에러 (400, 500)

```json
{
    "error": "Failed to fetch bike stations",
    "message": "API responded with status: 500"
}
```

### 로그 확인

Netlify 대시보드:

-   **Functions** → **bike-proxy** → **Function log**

로그 예시:

```
[bike-proxy] Fetching bike stations: 1-1000
[bike-proxy] API URL: http://openapi.seoul.go.kr:8088/...
[bike-proxy] Successfully fetched 2500 stations
```

### 주의사항

1. **타임아웃**: Netlify Functions는 기본 10초 제한 (무료 플랜)
2. **Rate Limit**: 서울시 API 호출 제한 주의 (1000개씩 나눠서 요청)
3. **CORS**: 모든 origin 허용 (`Access-Control-Allow-Origin: *`)

### 트러블슈팅

#### "API key not configured" 에러

→ Netlify 환경 변수에서 `VITE_SEOUL_API_KEY` 설정 확인

#### "net::ERR_FAILED" 여전히 발생

→ 브라우저가 프록시를 사용하는지 확인:

```javascript
// 프로덕션에서는 이 URL을 사용해야 함
/.netlify/functions/bike-proxy?start=1&end=1000
```

#### Functions 로그가 안 보임

→ 배포 후 최소 1회 호출해야 로그 생성

### 개발 팁

Functions 코드 수정 후:

1. 로컬: `netlify dev` 재시작 (또는 자동 리로드)
2. 프로덕션: git push → 자동 배포

함수가 제대로 배포되었는지 확인:

```bash
# Functions 목록 확인
netlify functions:list

# Functions 로그 스트리밍
netlify functions:log bike-proxy
```
