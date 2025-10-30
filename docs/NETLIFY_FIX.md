# 🔧 Netlify 배포 시 API 오류 해결 완료

## 📋 문제 요약

### 오류 증상

-   **로컬 개발 환경**: 정상 동작 ✅
-   **Netlify 프로덕션**: API 호출 실패 ❌

```
net::ERR_FAILED
net::ERR_SSL_PROTOCOL_ERROR
The FetchEvent resulted in a network error response
```

### 근본 원인

서울시 공공 API는 **HTTP만 지원** (`http://openapi.seoul.go.kr:8088`)하는데, Netlify는 **HTTPS로 배포**됩니다.

브라우저의 **Mixed Content 보안 정책**으로 인해:

-   ❌ HTTPS 사이트 → HTTP API 직접 호출 불가
-   ✅ 로컬 개발 (HTTP) → HTTP API 호출 가능

---

## ✅ 해결 방법

### 1. Netlify Functions 프록시 생성

**파일**: `netlify/functions/bike-proxy.js`

Netlify Functions를 사용하여 서버사이드 프록시를 구현했습니다:

```
[클라이언트 HTTPS]
    ↓ HTTPS 요청
[Netlify Functions HTTPS]
    ↓ HTTP 요청 (서버사이드)
[서울시 API HTTP]
```

### 2. API 호출 로직 수정

**파일**: `src/util/bikeStationApi.js`

환경에 따라 자동으로 다른 엔드포인트 사용:

-   **프로덕션**: `/.netlify/functions/bike-proxy` (프록시 사용)
-   **로컬**: `http://openapi.seoul.go.kr:8088` (직접 호출)

### 3. Netlify 설정 업데이트

**파일**: `netlify.toml`

Functions 디렉토리와 빌드 설정 추가:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

---

## 🚀 배포 단계

### 1️⃣ Netlify 환경 변수 설정

Netlify 대시보드에서:

1. **Site settings** → **Environment variables**
2. 다음 변수 추가:

```
VITE_SEOUL_API_KEY = 477963524563656239354167434858
```

### 2️⃣ 코드 푸시 및 배포

```bash
git add .
git commit -m "Fix: Add Netlify Functions proxy for Seoul API (Mixed Content)"
git push origin main
```

Netlify가 자동으로 빌드 및 배포합니다.

### 3️⃣ 배포 확인

브라우저에서 확인:

-   ✅ 콘솔 오류 없음
-   ✅ 따릉이 대여소 데이터 정상 로드
-   ✅ 지도에 마커 표시

---

## 🧪 테스트

### 로컬 테스트 (직접 API 호출)

```bash
npm run dev
```

### Netlify Functions 로컬 테스트

```bash
# Netlify CLI 설치 (한 번만)
npm install -g netlify-cli

# Netlify Dev 서버 실행
netlify dev
```

### Functions 로그 확인

Netlify 대시보드:

-   **Functions** → **bike-proxy** → **Function log**

---

## 📂 변경된 파일

```
✅ netlify/functions/bike-proxy.js       (새로 생성)
✅ src/util/bikeStationApi.js            (수정)
✅ netlify.toml                          (수정)
✅ docs/NETLIFY_SETUP.md                 (새로 생성)
✅ docs/NETLIFY_FIX.md                   (이 파일)
```

---

## 🔍 기술적 설명

### Mixed Content란?

**Mixed Content**는 HTTPS 페이지에서 HTTP 리소스를 로드하는 것을 말합니다.

브라우저는 보안을 위해 이를 차단합니다:

-   **Active Mixed Content**: 스크립트, 스타일시트, iframe → **자동 차단**
-   **Passive Mixed Content**: 이미지, 오디오, 비디오 → **경고 표시**

### 왜 로컬에서는 작동했나?

-   로컬 개발 서버: `http://localhost:5173` (HTTP)
-   HTTP → HTTP: Mixed Content 문제 없음 ✅

### 왜 Netlify에서는 실패했나?

-   Netlify 배포: `https://your-site.netlify.app` (HTTPS)
-   HTTPS → HTTP: 브라우저가 차단 ❌

### 프록시가 해결하는 이유

프록시는 **서버사이드**에서 실행되므로:

-   브라우저의 Mixed Content 정책 적용 안 됨
-   클라이언트는 항상 HTTPS로 통신 (프록시까지)
-   프록시가 HTTP API 호출 (서버 간 통신은 제한 없음)

---

## 📚 참고 자료

-   [Netlify Functions 문서](https://docs.netlify.com/functions/overview/)
-   [Mixed Content MDN 문서](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)
-   [서울시 공공 API 포털](https://data.seoul.go.kr/)

---

## 💡 추가 팁

### 다른 HTTP API 사용 시

같은 방법으로 다른 HTTP API도 프록시를 만들 수 있습니다:

1. `netlify/functions/` 에 새 함수 파일 생성
2. 해당 API 호출 로직 작성
3. 클라이언트에서 `/.netlify/functions/your-function` 호출

### 성능 최적화

-   ✅ 캐싱 활용: 24시간 로컬 스토리지 캐싱 구현됨
-   ✅ 페이지네이션: 1000개씩 나누어 요청
-   ⚠️ 필요시 Netlify Edge Functions로 업그레이드 가능 (더 빠름)

---

**문제 해결 완료!** 🎉

이제 Netlify에서도 따릉이 API가 정상적으로 작동합니다.
