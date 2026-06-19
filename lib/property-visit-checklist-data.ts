import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

export type VisitChecklistItem = {
  id: string;
  title: string;
  desc: string;
  tip?: string;
};

export type VisitChecklistPhase = {
  id: string;
  label: string;
  subtitle: string;
  items: VisitChecklistItem[];
};

const HOUSING_CHECKLIST: VisitChecklistPhase[] = [
  {
    id: 'location',
    label: '위치·교통',
    subtitle: '출퇴근·생활권을 직접 걸어보며 확인하세요.',
    items: [
      { id: 'h-subway', title: '지하철·버스 접근성', desc: '역까지 실제 도보 시간, 막차·첫차, 환승 편의를 확인합니다.' },
      { id: 'h-commute', title: '출퇴근 동선', desc: '평소 이동 경로로 한 번 다녀와 보세요.' },
      { id: 'h-neighbor', title: '주변 생활 인프라', desc: '마트, 병원, 약국, 공원, 카페 등 생활 편의 시설을 둘러봅니다.' },
      { id: 'h-noise-out', title: '외부 소음', desc: '대로변, 술집, 공사장, 학교 등 소음원을 낮·밤에 각각 확인합니다.' },
    ],
  },
  {
    id: 'building',
    label: '건물·공용부',
    subtitle: '집 안만큼 건물 전체 상태도 중요합니다.',
    items: [
      { id: 'h-entrance', title: '현관·복도·엘리베이터', desc: '청결, 조명, CCTV, 엘리베이터 유무·상태를 확인합니다.' },
      { id: 'h-parking', title: '주차·이륜차', desc: '주차 가능 여부, 비용, 배정 방식, 이륜차 보관 공간을 확인합니다.' },
      { id: 'h-trash', title: '쓰레기·분리수거', desc: '분리수거 장소, 수거 요일, 악취 여부를 확인합니다.' },
      { id: 'h-illegal', title: '위반건축물·용도', desc: '건축물대장에서 위반건축물 표시, 실제 주거 용도 적합 여부를 확인합니다.' },
      { id: 'h-register', title: '등기·소유자', desc: '등기부등본 소유자와 계약 상대가 일치하는지, 갑구·을구 특이사항을 메모합니다.' },
    ],
  },
  {
    id: 'interior',
    label: '실내·설비',
    subtitle: '사진과 함께 하자·상태를 기록하세요.',
    items: [
      { id: 'h-sun', title: '채광·향', desc: '낮 시간 창문 방향, 그늘, 일조량을 확인합니다.' },
      { id: 'h-vent', title: '환기·결로·곰팡이', desc: '욕실·베란다·창틀 곰팡이, 결로 흔적, 환기 가능 여부를 봅니다.' },
      { id: 'h-water', title: '수압·배수', desc: '싱크대·샤워 수압, 배수 속도, 누수 흔적을 확인합니다.' },
      { id: 'h-boiler', title: '보일러·난방·에어컨', desc: '설치 연식, 작동 여부, 관리비에 포함되는지 확인합니다.' },
      { id: 'h-window', title: '창문·방충망·단열', desc: '창문 개폐, 방충망, 외풍·결로 여부를 확인합니다.' },
      { id: 'h-floor', title: '바닥·벽·천장', desc: '들뜸, 균열, 도배·장판 상태, 타일 깨짐을 확인합니다.' },
      { id: 'h-kitchen', title: '주방·가전', desc: '가스·인덕션, 싱크대, 수납, 포함 가전 목록을 확인합니다.' },
      { id: 'h-bath', title: '욕실·환풍', desc: '타일, 변기·세면대, 환풍기 작동, 곰팡이를 확인합니다.' },
    ],
  },
  {
    id: 'cost',
    label: '비용·계약 조건',
    subtitle: '보증금·월세 외 숨은 비용을 꼭 물어보세요.',
    items: [
      { id: 'h-rent', title: '보증금·월세·관리비', desc: '관리비 포함 항목, 인상 조건, 반환 시기를 메모합니다.' },
      { id: 'h-utility', title: '공과금·인터넷', desc: '전기·가스·수도 요금 수준, 인터넷·TV 설치비를 확인합니다.' },
      { id: 'h-repair', title: '수리·하자 책임', desc: '하자 발생 시 누가 수리하는지, 특약 가능 여부를 묻습니다.' },
      { id: 'h-pet', title: '반려동물·흡연·전대', desc: '반려동물, 흡연, 전대·재임대 금지 여부를 확인합니다.' },
      { id: 'h-insurance', title: '전세보증보험·안전', desc: '공시가 대비 보증금, HUG 가입 가능 여부, 깡통전세 위험을 점검합니다.' },
    ],
  },
  {
    id: 'people',
    label: '임대인·중개',
    subtitle: '계약 후에도 연락할 상대를 확인하세요.',
    items: [
      { id: 'h-landlord', title: '임대인·관리인', desc: '신원, 연락 가능 시간, 응대 태도, 실거주 여부를 메모합니다.' },
      { id: 'h-agent', title: '중개사·수수료', desc: '중개사무소 명칭, 등록번호, 수수료, 제공 서류 목록을 기록합니다.' },
      { id: 'h-tenant', title: '현 임차인·이사', desc: '퇴거 예정일, 잔금일 조율, 현재 세입자와의 이견 여부를 확인합니다.' },
    ],
  },
];

const COMMERCIAL_CHECKLIST: VisitChecklistPhase[] = [
  {
    id: 'trade',
    label: '상권·유동',
    subtitle: '매출의 핵심은 지나가는 사람입니다.',
    items: [
      { id: 'c-foot', title: '유동인구·시간대', desc: '평일·주말, 점심·저녁 시간대별 유동인구를 직접 셉니다.' },
      { id: 'c-demo', title: '주 고객층', desc: '직장인, 학생, 주민, 관광객 등 타깃과 맞는지 판단합니다.' },
      { id: 'c-compete', title: '경쟁·공실', desc: '인근 동종 업체, 공실 매장, 임대 현황판을 확인합니다.' },
      { id: 'c-sign', title: '간판·시야', desc: '간판 노출, 시인성, 건물 외관 규정을 확인합니다.' },
    ],
  },
  {
    id: 'space',
    label: '공간·시설',
    subtitle: '업종에 맞는 구조인지 봅니다.',
    items: [
      { id: 'c-floor', title: '층수·면적·구조', desc: '실사용 면적, 기둥 위치, 홀·주방·창고 분리, 층고를 확인합니다.' },
      { id: 'c-elec', title: '전기·가스·배수', desc: '용량, 증설 가능 여부, 배수·환기, 후드·덕트를 확인합니다.' },
      { id: 'c-water', title: '상하수도·화장실', desc: '화장실 위치·수, 장애인 화장실, 배수 문제를 확인합니다.' },
      { id: 'c-park', title: '주차·하역', desc: '배송·하역 동선, 주차 가능 대수, 시간 제한을 확인합니다.' },
      { id: 'c-ac', title: '냉난방·환기', desc: '에어컨·환기 설비, 관리비 포함 여부, 소음을 확인합니다.' },
    ],
  },
  {
    id: 'lease',
    label: '임대·권리금',
    subtitle: '상가는 권리금·갱신 조건이 핵심입니다.',
    items: [
      { id: 'c-key', title: '권리금', desc: '요구 권리금, 협상 여지, 시설·영업권 포함 범위를 메모합니다.' },
      { id: 'c-rent', title: '보증금·월세·관리비', desc: '관리비 항목, 인상 주기, 권리금 외 초기 비용을 정리합니다.' },
      { id: 'c-renew', title: '갱신·해지 조건', desc: '계약 기간, 갱신 요구권, 해지 통보 기한, 원상복구 범위를 확인합니다.' },
      { id: 'c-transfer', title: '양도·전대·업종', desc: '양도·전대 가능 여부, 허용 업종, 영업신고 가능성을 확인합니다.' },
      { id: 'c-register', title: '등기·근저당', desc: '등기부등본, 선순위 채권, 임대인 변경 이력을 확인합니다.' },
    ],
  },
  {
    id: 'legal',
    label: '법률·행정',
    subtitle: '영업 전 필요한 허가를 미리 짚어보세요.',
    items: [
      { id: 'c-use', title: '용도·건축물대장', desc: '건축물대장 용도, 위반건축물, 영업 가능 용도인지 확인합니다.' },
      { id: 'c-permit', title: '인허가·위생', desc: '영업신고, 위생·소방·주류 등 업종별 허가 요건을 확인합니다.' },
      { id: 'c-tax', title: '세금·4대보험', desc: '부가세, 종합소득세, 4대보험 부담 구조를 메모합니다.' },
      { id: 'c-landlord', title: '임대인·관리실', desc: '소유자·관리인 연락처, 수리 대응, 공용부 관리 주체를 기록합니다.' },
    ],
  },
  {
    id: 'risk',
    label: '리스크·메모',
    subtitle: '나중에 비교할 때 도움이 되는 항목입니다.',
    items: [
      { id: 'c-pros', title: '장점 정리', desc: '입지, 구조, 임대 조건 등 긍정 요소를 적습니다.' },
      { id: 'c-cons', title: '단점·우려', desc: '소음, 공사, 경쟁, 권리금 부담 등 우려 사항을 적습니다.' },
      { id: 'c-photo', title: '사진·영상 촬영', desc: '외관, 간판 시야, 실내 전경, 설비, 주변 상권을 촬영합니다.' },
    ],
  },
];

export function getVisitChecklist(propertyType: GoldenPropertyType): VisitChecklistPhase[] {
  return propertyType === '상가' ? COMMERCIAL_CHECKLIST : HOUSING_CHECKLIST;
}

export function getVisitChecklistItemIds(propertyType: GoldenPropertyType): string[] {
  return getVisitChecklist(propertyType).flatMap((phase) => phase.items.map((item) => item.id));
}
