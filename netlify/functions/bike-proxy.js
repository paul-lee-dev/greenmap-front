/**
 * Netlify Function - 따릉이 API 프록시
 * Mixed Content 문제 해결을 위한 서버사이드 프록시
 *
 * HTTPS 사이트(Netlify)에서 HTTP API(서울시 공공 API)를 호출하기 위한 프록시
 * 브라우저의 Mixed Content 정책 우회
 */

export default async (req, context) => {
    // CORS 헤더 설정
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        return new Response('', {
            status: 200,
            headers,
        });
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers,
        });
    }

    try {
        // URL에서 쿼리 파라미터 추출
        const url = new URL(req.url);
        const start = url.searchParams.get('start') || '1';
        const end = url.searchParams.get('end') || '1000';

        // API 키는 환경 변수에서 가져오기
        const API_KEY = process.env.VITE_SEOUL_API_KEY;

        if (!API_KEY) {
            console.error('VITE_SEOUL_API_KEY is not configured');
            return new Response(
                JSON.stringify({
                    error: 'API key not configured',
                    message:
                        'Please set VITE_SEOUL_API_KEY in Netlify environment variables',
                }),
                {
                    status: 500,
                    headers,
                }
            );
        }

        // 서울시 공공 API 호출 (HTTP)
        const apiUrl = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/tbCycleStationInfo/${start}/${end}/`;

        console.log(`[bike-proxy] Fetching bike stations: ${start}-${end}`);
        console.log(`[bike-proxy] API URL: ${apiUrl}`);

        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(
                `[bike-proxy] API responded with status: ${response.status}`
            );
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // API 에러 체크
        if (data.RESULT && data.RESULT.CODE !== 'INFO-000') {
            console.error('[bike-proxy] Seoul API Error:', data.RESULT);
            return new Response(
                JSON.stringify({
                    error: 'Seoul API Error',
                    message: data.RESULT.MESSAGE,
                    code: data.RESULT.CODE,
                }),
                {
                    status: 400,
                    headers,
                }
            );
        }

        console.log(
            `[bike-proxy] Successfully fetched ${
                data.stationInfo?.list_total_count || 0
            } stations`
        );

        // 성공 응답
        return new Response(JSON.stringify(data), {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('[bike-proxy] Error:', error.message);
        console.error('[bike-proxy] Stack:', error.stack);

        return new Response(
            JSON.stringify({
                error: 'Failed to fetch bike stations',
                message: error.message,
                details:
                    process.env.NODE_ENV === 'development'
                        ? error.stack
                        : undefined,
            }),
            {
                status: 500,
                headers,
            }
        );
    }
};
