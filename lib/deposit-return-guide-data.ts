export type GuideStep = {
  id: string;
  title: string;
  body: string;
  actions: string[];
  warning?: string;
};

export type GuidePhase = {
  id: string;
  phase: string;
  title: string;
  summary: string;
  steps: GuideStep[];
};

export const DEPOSIT_RETURN_PHASES: GuidePhase[] = [
  {
    id: 'before',
    phase: '1단계',
    title: '퇴실 2개월 전 ~ 통보',
    summary: '나갈 때도 증거가 필요합니다. 말보다 문자·내용증명이 안전합니다.',
    steps: [
      {
        id: 'notice',
        title: '해지·퇴거 의사 통보',
        body: '계약 만기에 맞춰 나가거나, 중도 해지 시 법정 통보 기간(통상 3개월)을 확인한 뒤 집주인에게 의사를 전달합니다.',
        actions: ['문자·카톡·이메일로 날짜·사유 명시', '읽음 확인 또는 발송 증빙 보관'],
        warning: '구두만으로는 분쟁 시 불리할 수 있습니다.',
      },
      {
        id: 'repair',
        title: '원상복구 범위 협의',
        body: '통상적 사용·경과에 따른 손모는 임차인 책임이 아닙니다. 입주 당일 사진과 대조해 과도한 청구를 막으세요.',
        actions: ['입주 시 촬영본과 비교', '수리 견적은 사전 서면 합의'],
      },
    ],
  },
  {
    id: 'moveout',
    phase: '2단계',
    title: '퇴실 당일',
    summary: '열쇠 반납·최종 검침·인수인계를 문서로 남깁니다.',
    steps: [
      {
        id: 'handover',
        title: '인수인계 확인',
        body: '열쇠 반납, 공과금 정산, 시설 상태를 함께 확인하고 가능하면 서명·사진을 남깁니다.',
        actions: ['최종 검침 사진', '열쇠 반납 시간 기록'],
      },
      {
        id: 'settle',
        title: '공과금·관리비 정산',
        body: '전 임차인 체납이 내 명의로 넘어오지 않았는지, 관리비 명세를 확인합니다.',
        actions: ['관리사무소·집주인에게 정산 내역 요청'],
      },
    ],
  },
  {
    id: 'delay',
    phase: '3단계',
    title: '보증금 미반환',
    summary: '만기·퇴실 후에도 돌려받지 못하면 단계적으로 대응합니다.',
    steps: [
      {
        id: 'request',
        title: '반환 요청 (내용증명)',
        body: '반환 기한·계좌·금액을 명확히 적어 내용증명을 발송합니다. 우편·등기 발송 증빙을 보관하세요.',
        actions: ['반환 금액·기한·계좌 명시', '발송 영수증 보관'],
      },
      {
        id: 'mediation',
        title: '주택임대차분쟁조정·상담',
        body: '무료·신속한 조정 절차를 활용할 수 있습니다. 법률구조공단(132) 상담도 병행하세요.',
        actions: ['관할 주택임대차분쟁조정위원회 문의', '법률구조공단 132'],
        warning: '본 가이드는 정보 제공이며 법률 자문이 아닙니다.',
      },
    ],
  },
  {
    id: 'legal',
    phase: '4단계',
    title: '임차권등기·소송 검토',
    summary: '이사 전·전입 유지가 중요합니다. 성급한 퇴거는 순위에 불리할 수 있습니다.',
    steps: [
      {
        id: 'registration',
        title: '임차권등기명령',
        body: '보증금을 돌려받지 못한 채 이사·전입 해제를 하면 우선변제권이 약해질 수 있습니다. 법원 절차를 검토하세요.',
        actions: ['관할 법원 임차권등기명령 신청 검토', '전입·점유 유지 여부 변호사·상담 기관과 확인'],
        warning: '등기 완료 전 이사·전출은 매우 위험합니다.',
      },
      {
        id: 'distribution',
        title: '배당요구·경매 대비',
        body: '집주인 채무로 경매가 진행되면 배당요구 기한을 놓치지 마세요.',
        actions: ['등기부등본·경매 공고 확인', '배당요구 종기 캘린더 등록'],
      },
    ],
  },
];

export const OFFICIAL_LINKS = [
  { label: '정부24 전입신고', href: 'https://www.gov.kr' },
  { label: '주택임대차분쟁조정', href: 'https://www.khug.or.kr' },
  { label: '법률구조공단 132', href: 'https://www.klac.or.kr' },
  { label: '빅루트 AI (조문 안내)', href: '/legal-ai' },
];
