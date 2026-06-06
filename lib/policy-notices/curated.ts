import type { PolicyNoticeItem } from './types';

const TODAY = new Date().toISOString().slice(0, 10);

export function getCuratedNotices(): PolicyNoticeItem[] {
  return [
    {
      id: 'curated-conforming-pause',
      category: 'official',
      title: 'HF 적격대출 취급 잠정 중단 안내',
      summary:
        '한국주택금융공사는 적격대출(기본형) 취급이 잠정 중단된 상태임을 안내합니다. 신규·변동 금리는 취급 은행에 직접 확인하세요.',
      publishedAt: TODAY,
      publishedLabel: '상시',
      source: '한국주택금융공사',
      url: 'https://www.hf.go.kr/ko/sub01/sub01_03_01.do',
      severity: 'warn',
    },
    {
      id: 'curated-hf-rent-rate',
      category: 'rate',
      title: '전세자금대출 시중금리 — HF 공공데이터',
      summary:
        '② 기금·대출 금리 탭에서 금융기관별 전세자금 금리·보증비율을 확인할 수 있습니다. 적용 기간·은행별 차이가 있습니다.',
      publishedAt: TODAY,
      publishedLabel: '수시 갱신',
      source: '한국주택금융공사',
      url: 'https://www.data.go.kr/data/15082033/openapi.do',
      severity: 'info',
    },
    {
      id: 'curated-bok-base',
      category: 'rate',
      title: '한국은행 기준금리 참고',
      summary:
        '기준금리 변동은 주택담보대출·전세대출 변동금리에 영향을 줄 수 있습니다. ② 탭 상단에서 ECOS 기준금리를 함께 확인하세요.',
      publishedAt: TODAY,
      publishedLabel: '수시 갱신',
      source: '한국은행 ECOS',
      url: 'https://ecos.bok.or.kr/',
      severity: 'info',
    },
    {
      id: 'curated-edundeun',
      category: 'guide',
      title: '기금e든든 상품·우대금리 확인',
      summary:
        '주택도시기금(디딤돌·버팀목 등) 실제 우대·상환 조건은 기금e든든에서 확인하는 것이 가장 정확합니다.',
      publishedAt: TODAY,
      publishedLabel: '안내',
      source: '주택도시보증공사',
      url: 'https://www.khug.or.kr/',
      severity: 'info',
    },
    {
      id: 'curated-youth-housing',
      category: 'recruitment',
      title: '내 지역 청년 주거 정책 모집 확인',
      summary:
        '① 지역 청년정책 탭에서 전국·내 지역 주거 지원 사업을 조회하세요. 모집·접수 기간은 사업별로 다릅니다.',
      publishedAt: TODAY,
      publishedLabel: '수시 갱신',
      source: '온통청년',
      url: 'https://www.youthcenter.go.kr/',
      severity: 'info',
    },
    {
      id: 'curated-data-go-conforming',
      category: 'official',
      title: '적격대출 금리 공공 API 상태',
      summary:
        '공공데이터 HF 적격대출 API(15082047)가 간헐적 서버 오류를 반환할 수 있습니다. 복구 시 ② 탭 적격대출 필터에 자동 반영됩니다.',
      publishedAt: TODAY,
      publishedLabel: '안내',
      source: '공공데이터포털',
      url: 'https://www.data.go.kr/data/15082047/openapi.do',
      severity: 'warn',
    },
  ];
}
