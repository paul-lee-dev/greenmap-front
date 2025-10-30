# 🚀 Netlify 배포 체크리스트

## ✅ 배포 전 확인사항

### 1. 파일 확인

-   [ ] `netlify/functions/bike-proxy.js` 존재
-   [ ] `netlify.toml`에 Functions 설정 있음
-   [ ] `src/util/bikeStationApi.js` 환경별 분기 처리 완료

### 2. 환경 변수 설정

Netlify 대시보드에서 확인:

-   [ ] `VITE_SEOUL_API_KEY` = `477963524563656239354167434858`

**설정 경로**: Site settings → Environment variables → Add a variable

### 3. 로컬 테스트 (선택사항)

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로컬에서 Functions 테스트
netlify dev

# 브라우저에서 열기
http://localhost:8888
```

테스트 URL:

```
http://localhost:8888/.netlify/functions/bike-proxy?start=1&end=1000
```

### 4. Git 푸시

```bash
git add .
git commit -m "Fix: Add Netlify Functions proxy for Seoul API (Mixed Content)"
git push origin main
```

### 5. Netlify 배포 확인

1. **Netlify 대시보드** 접속
2. **Deploys** 탭에서 진행 상황 확인
3. 빌드 로그에서 에러 없는지 확인:
    ```
    ✔ Netlify Functions directory: netlify/functions
    ✔ Functions built
    ```

### 6. Functions 확인

1. **Functions** 탭 클릭
2. `bike-proxy` 함수가 목록에 있는지 확인
3. Status: **Active** 인지 확인

### 7. 프로덕션 테스트

브라우저 개발자 도구 (F12) → Console:

```javascript
// 프록시 테스트
fetch('/.netlify/functions/bike-proxy?start=1&end=10')
    .then((r) => r.json())
    .then(console.log);
```

기대 결과:

```json
{
  "stationInfo": {
    "list_total_count": 2500,
    "RESULT": { "CODE": "INFO-000", ... },
    "row": [...]
  }
}
```

### 8. 실제 앱 동작 확인

-   [ ] 지도 화면 열림
-   [ ] 따릉이 마커 표시됨
-   [ ] 콘솔에 `net::ERR_FAILED` 또는 `ERR_SSL_PROTOCOL_ERROR` 없음
-   [ ] 콘솔에 `🚲 따릉이 대여소 API 호출 중...` 로그 보임

---

## 🔧 문제 해결

### ❌ "API key not configured"

**원인**: Netlify 환경 변수 미설정

**해결**:

1. Netlify 대시보드 → Site settings → Environment variables
2. `VITE_SEOUL_API_KEY` 추가
3. 다시 배포 (Deploys → Trigger deploy → Clear cache and deploy)

### ❌ "Failed to fetch bike stations"

**원인**: 서울시 API 응답 오류

**해결**:

1. Functions 로그 확인 (Functions → bike-proxy → Function log)
2. 서울시 API 상태 확인
3. API 키 유효성 확인

### ❌ Functions 탭에 bike-proxy가 없음

**원인**: Functions 빌드 실패

**해결**:

1. Deploys → 최신 배포 클릭 → Function logs 확인
2. `netlify.toml`의 `[functions]` 섹션 확인
3. `netlify/functions/bike-proxy.js` 문법 오류 확인

### ❌ 로컬에서 "ECONNREFUSED localhost:8888"

**원인**: `netlify dev` 실행 안 됨

**해결**:

```bash
# Netlify CLI 설치 확인
netlify --version

# Netlify Dev 실행
netlify dev
```

### ❌ 여전히 Mixed Content 에러

**원인**: 클라이언트 코드가 직접 HTTP API 호출

**해결**:

1. `bikeStationApi.js`에서 `IS_PRODUCTION` 체크 확인
2. 프로덕션에서는 `/.netlify/functions/bike-proxy` 사용하는지 확인
3. 브라우저 캐시 삭제 후 재시도

---

## 📊 성공 지표

모든 항목이 ✅이면 성공:

-   ✅ Netlify 빌드 성공 (녹색 체크)
-   ✅ Functions 탭에 `bike-proxy` 표시
-   ✅ 프로덕션에서 앱 로딩 성공
-   ✅ 따릉이 마커 지도에 표시
-   ✅ 콘솔 에러 없음

---

## 🆘 여전히 안 되면?

1. **Netlify Functions 로그 확인**

    ```
    netlify functions:log bike-proxy
    ```

2. **환경 변수 다시 확인**

    - Netlify 대시보드에서 실제 값 확인
    - 오타 없는지 확인

3. **캐시 삭제 후 재배포**

    - Netlify: Deploys → Trigger deploy → **Clear cache and deploy**
    - 브라우저: 개발자 도구 → Application → Clear storage

4. **이슈 리포트**
    - Netlify Functions 로그 복사
    - 브라우저 콘솔 에러 복사
    - GitHub Issue 생성
