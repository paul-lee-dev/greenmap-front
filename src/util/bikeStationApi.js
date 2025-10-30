/**
 * 따릉이 대여소 API 연동 유틸리티
 */

const BIKE_API_KEY = import.meta.env.VITE_SEOUL_API_KEY || '';

// 프로덕션 환경(Netlify)에서는 Netlify Functions 프록시 사용
// 로컬 환경에서는 직접 API 호출
const IS_PRODUCTION = import.meta.env.PROD;
const BIKE_API_BASE_URL = IS_PRODUCTION
    ? '/.netlify/functions/bike-proxy' // Netlify Functions 프록시
    : 'http://openapi.seoul.go.kr:8088'; // 로컬 개발용

const CACHE_KEY = 'bike_stations';
const CACHE_EXPIRY_KEY = 'bike_stations_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

/**
 * 로컬 스토리지에서 따릉이 데이터 가져오기
 */
export const getBikeStationsFromCache = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

        if (!cached || !expiry) {
            return null;
        }

        const now = Date.now();
        if (now > parseInt(expiry)) {
            // 캐시 만료됨
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_EXPIRY_KEY);
            return null;
        }

        const data = JSON.parse(cached);
        return data;
    } catch (error) {
        console.error('[BikeAPI] Error reading from cache:', error);
        return null;
    }
};

/**
 * 로컬 스토리지에 따릉이 데이터 저장
 */
export const saveBikeStationsToCache = (stations) => {
    try {
        const expiry = Date.now() + CACHE_DURATION;
        localStorage.setItem(CACHE_KEY, JSON.stringify(stations));
        localStorage.setItem(CACHE_EXPIRY_KEY, expiry.toString());
        console.log(`💾 따릉이 ${stations.length}개 대여소 캐시 저장 완료`);
    } catch (error) {
        console.error('[BikeAPI] Error saving to cache:', error);
    }
};

/**
 * 따릉이 API에서 데이터 가져오기 (페이지네이션)
 */
const fetchBikeStationsPage = async (startIndex, endIndex) => {
    if (!BIKE_API_KEY && !IS_PRODUCTION) {
        throw new Error('VITE_SEOUL_API_KEY is not configured');
    }

    let url;
    if (IS_PRODUCTION) {
        // Netlify Functions 프록시 사용
        url = `${BIKE_API_BASE_URL}?start=${startIndex}&end=${endIndex}`;
    } else {
        // 로컬 개발: 직접 API 호출
        url = `${BIKE_API_BASE_URL}/${BIKE_API_KEY}/json/tbCycleStationInfo/${startIndex}/${endIndex}/`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 에러 체크
    if (data.RESULT && data.RESULT.CODE !== 'INFO-000') {
        throw new Error(`API Error: ${data.RESULT.MESSAGE}`);
    }

    // 실제 데이터는 stationInfo 안에 있음
    return data.stationInfo || data;
};

/**
 * 모든 따릉이 대여소 데이터 가져오기
 */
export const fetchAllBikeStations = async () => {
    try {
        console.log('🚲 따릉이 대여소 API 호출 중...');

        // 첫 페이지로 전체 개수 확인
        const firstPage = await fetchBikeStationsPage(1, 1000);

        const totalCount = firstPage.list_total_count;
        const stations = [...(firstPage.row || [])];

        if (!totalCount || totalCount === 0) {
            console.warn('[BikeAPI] No stations found or invalid total count');
            return stations;
        }

        // totalCount가 문자열일 수 있으므로 숫자로 변환
        const total = parseInt(totalCount, 10);

        // 1000개씩 페이지네이션으로 모든 데이터 가져오기
        const pageSize = 1000;
        for (let start = 1001; start <= total; start += pageSize) {
            const end = Math.min(start + pageSize - 1, total);
            const pageData = await fetchBikeStationsPage(start, end);

            if (pageData.row && pageData.row.length > 0) {
                stations.push(...pageData.row);
            }

            // API 요청 간 딜레이 (서버 부하 방지)
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return stations;
    } catch (error) {
        console.error('[BikeAPI] Error fetching bike stations:', error);
        throw error;
    }
};

/**
 * 따릉이 데이터 가져오기 (캐시 우선)
 */
export const getBikeStations = async () => {
    // 1. 캐시에서 먼저 확인
    const cached = getBikeStationsFromCache();
    if (cached) {
        return cached;
    }

    // 2. 캐시에 없으면 API에서 가져오기
    const stations = await fetchAllBikeStations();

    // 3. 캐시에 저장
    saveBikeStationsToCache(stations);

    return stations;
};

/**
 * 따릉이 데이터를 facility 형식으로 변환
 */
export const convertBikeStationToFacility = (station) => {
    return {
        id: `bike-${station.RENT_ID}`,
        name: station.RENT_NM,
        category: 'bike',
        lat: parseFloat(station.STA_LAT),
        lng: parseFloat(station.STA_LONG),
        address: `${station.STA_ADD1} ${station.STA_ADD2}`.trim(),
        extra: {
            rentId: station.RENT_ID,
            rentNo: station.RENT_NO,
            holdNum: station.HOLD_NUM, // 거치대수
            location: station.STA_LOC, // 대여소그룹명
        },
    };
};

/**
 * 캐시 강제 삭제 (디버깅/개발용)
 */
export const clearBikeStationsCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    console.log('[BikeAPI] Cache cleared');
};
