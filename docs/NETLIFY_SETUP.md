# Netlify 배포 가이드

## 문제 상황

서울시 공공 API (`openapi.seoul.go.kr:8088`)는 HTTP만 지원합니다.
Netlify는 HTTPS로 배포되므로 Mixed Content 정책에 의해 HTTP API를 직접 호출할 수 없습니다.

### 오류 메시지

```
net::ERR_FAILED
net::ERR_SSL_PROTOCOL_ERROR
The FetchEvent resulted in a network error response
```

## 해결 방법

Netlify Functions를 사용한 서버사이드 프록시로 해결했습니다.

### 아키텍처

```
[클라이언트 HTTPS]
    ↓
[Netlify Functions 프록시 (HTTPS)]
    ↓
[서울시 API (HTTP)]
```

## Netlify 환경 변수 설정

Netlify 대시보드에서 다음 환경 변수를 설정해야 합니다:

1. Netlify 대시보드 접속
2. **Site settings** → **Environment variables** 이동
3. 다음 변수 추가:

| Key                  | Value                            | 설명          |
| -------------------- | -------------------------------- | ------------- |
| `VITE_SEOUL_API_KEY` | `477963524563656239354167434858` | 서울시 API 키 |

## 파일 구조

```
netlify/
  functions/
    bike-proxy.js     # 따릉이 API 프록시 함수
netlify.toml          # Netlify 설정 파일
```

## 로컬 개발 vs 프로덕션

-   **로컬 개발**: HTTP API를 직접 호출 (Mixed Content 제한 없음)
-   **프로덕션 (Netlify)**: Netlify Functions 프록시를 통해 호출

코드에서 자동으로 환경을 감지하여 적절한 엔드포인트를 사용합니다:

```javascript
const IS_PRODUCTION = import.meta.env.PROD;
const BIKE_API_BASE_URL = IS_PRODUCTION
    ? '/.netlify/functions/bike-proxy' // 프로덕션
    : 'http://openapi.seoul.go.kr:8088'; // 로컬
```

## 배포 확인

1. Netlify에 환경 변수 설정
2. 코드 푸시
3. Netlify 자동 배포 대기
4. Functions 로그 확인:
    - **Site settings** → **Functions** → **bike-proxy** → **Function log**
5. 브라우저 콘솔에서 에러 없이 따릉이 데이터가 로드되는지 확인

## 트러블슈팅

### Functions 로그 확인

```bash
netlify functions:log bike-proxy
```

### 로컬에서 Functions 테스트

```bash
npm install -g netlify-cli
netlify dev
```

### 일반적인 문제

1. **환경 변수 미설정**
    - Netlify 대시보드에서 `VITE_SEOUL_API_KEY` 확인
2. **Functions 빌드 실패**

    - `netlify.toml`에 `[functions]` 섹션 확인
    - Node.js 버전 확인 (20 이상 권장)

3. **CORS 에러**
    - `bike-proxy.js`의 CORS 헤더 확인
    - 모든 origin 허용: `Access-Control-Allow-Origin: *`

## 참고 자료

-   [Netlify Functions 문서](https://docs.netlify.com/functions/overview/)
-   [서울시 공공 API 문서](https://data.seoul.go.kr/)
-   [Mixed Content 정책](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)
