#!/bin/bash

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚲 Bike Proxy Function 테스트"
echo "================================"
echo ""

# 환경 변수 확인
if [ -z "$VITE_SEOUL_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  경고: VITE_SEOUL_API_KEY 환경 변수가 설정되지 않았습니다${NC}"
    echo "   로컬 테스트를 위해 .env 파일을 만들거나 환경 변수를 설정하세요"
    echo ""
fi

# 테스트 URL
LOCAL_URL="http://localhost:8888/.netlify/functions/bike-proxy"
PROD_URL="https://your-site.netlify.app/.netlify/functions/bike-proxy"

# 로컬 테스트 여부 확인
echo "테스트 환경 선택:"
echo "1) 로컬 (http://localhost:8888)"
echo "2) 프로덕션 (Netlify)"
read -p "선택 (1 또는 2): " choice

if [ "$choice" == "1" ]; then
    TEST_URL=$LOCAL_URL
    echo -e "${GREEN}✓ 로컬 테스트 모드${NC}"
    echo ""
    echo "⚠️  먼저 'netlify dev'를 실행해야 합니다!"
    echo ""
elif [ "$choice" == "2" ]; then
    read -p "Netlify 사이트 URL을 입력하세요 (예: my-site.netlify.app): " site_url
    TEST_URL="https://$site_url/.netlify/functions/bike-proxy"
    echo -e "${GREEN}✓ 프로덕션 테스트 모드${NC}"
    echo ""
else
    echo -e "${RED}✗ 잘못된 선택입니다${NC}"
    exit 1
fi

# 테스트 1: 기본 요청 (1-1000)
echo "테스트 1: 기본 요청 (1-1000 대여소)"
echo "-----------------------------------"
response=$(curl -s -w "\n%{http_code}" "$TEST_URL?start=1&end=1000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ 성공 (HTTP $http_code)${NC}"
    total_count=$(echo "$body" | grep -o '"list_total_count":[0-9]*' | grep -o '[0-9]*')
    echo "   총 대여소 수: $total_count"
else
    echo -e "${RED}✗ 실패 (HTTP $http_code)${NC}"
    echo "   응답: $body"
fi
echo ""

# 테스트 2: 다른 범위 (1001-2000)
echo "테스트 2: 다른 범위 (1001-2000 대여소)"
echo "---------------------------------------"
response=$(curl -s -w "\n%{http_code}" "$TEST_URL?start=1001&end=2000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ 성공 (HTTP $http_code)${NC}"
else
    echo -e "${RED}✗ 실패 (HTTP $http_code)${NC}"
    echo "   응답: $body"
fi
echo ""

# 테스트 3: OPTIONS (CORS preflight)
echo "테스트 3: CORS preflight (OPTIONS)"
echo "-----------------------------------"
http_code=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$TEST_URL")

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ 성공 (HTTP $http_code)${NC}"
    echo "   CORS가 올바르게 설정되었습니다"
else
    echo -e "${RED}✗ 실패 (HTTP $http_code)${NC}"
fi
echo ""

# 테스트 4: 잘못된 메서드 (POST)
echo "테스트 4: 잘못된 메서드 (POST)"
echo "------------------------------"
http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$TEST_URL")

if [ "$http_code" == "405" ]; then
    echo -e "${GREEN}✓ 성공 (HTTP $http_code - Method Not Allowed)${NC}"
    echo "   POST 요청이 올바르게 거부되었습니다"
else
    echo -e "${YELLOW}⚠️  예상치 못한 응답 (HTTP $http_code)${NC}"
fi
echo ""

echo "================================"
echo "✅ 테스트 완료!"
echo ""
echo "💡 팁:"
echo "   - Netlify Functions 로그: Site settings → Functions → bike-proxy"
echo "   - 로컬 로그: netlify dev 실행 중인 터미널 확인"
