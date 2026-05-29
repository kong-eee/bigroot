export type ChecklistItem = {
  id: string;
  title: string;
  desc: string;
  tip?: string;
};

export type ChecklistPhase = {
  id: string;
  label: string;
  subtitle: string;
  items: ChecklistItem[];
};

export const MOVE_IN_CHECKLIST: ChecklistPhase[] = [
  {
    id: 'day0',
    label: '입주 당일',
    subtitle: '권리의 뿌리를 세우는 날',
    items: [
      {
        id: 'photos',
        title: '입주 상태 사진·영상 촬영',
        desc: '벽·바닥·창문·설비·계량기 수치를 날짜와 함께 기록하세요.',
        tip: '퇴실 시 원상복구 분쟁의 핵심 증거입니다.',
      },
      {
        id: 'move-report',
        title: '전입신고',
        desc: '주민센터 또는 정부24에서 신고합니다. 다음 날 0시부터 대항력이 생깁니다.',
      },
      {
        id: 'meter',
        title: '계량기·공과금 확인',
        desc: '전기·가스·수도 검침값을 사진으로 남기고, 전 임차인 체납 여부를 중개사·집주인에게 확인하세요.',
      },
      {
        id: 'account',
        title: '임대인 계좌·신원 재확인',
        desc: '등기부등본 소유자 명의 계좌로만 송금했는지, 계약서와 일치하는지 확인합니다.',
      },
    ],
  },
  {
    id: 'week1',
    label: '입주 1주일 이내',
    subtitle: '하자·생활 안전',
    items: [
      {
        id: 'defect',
        title: '하자 통보 (문자·카톡)',
        desc: '누수·곰팡이·보일러 고장 등은 발견 즉시 집주인에게 서면으로 알리세요.',
        tip: '말로만 알리면 나중에 “원래 그랬다”고 부인당할 수 있습니다.',
      },
      {
        id: 'fire',
        title: '소방·안전 점검',
        desc: '소화기, 화재감지기, 비상구·차단기 위치를 확인합니다.',
      },
      {
        id: 'insurance',
        title: '화재보험·가전 등록 (선택)',
        desc: '전세보증보험 가입 여부, 화재보험 필요 시 가입을 검토합니다.',
      },
    ],
  },
  {
    id: 'day30',
    label: '입주 30일 이내',
    subtitle: '법적 절차 (길)',
    items: [
      {
        id: 'lease-report',
        title: '주택 임대차 신고',
        desc: '보증금 6천만 원 또는 월세 30만 원 초과 시 30일 이내 신고·확정일자를 완료합니다.',
      },
      {
        id: 'contract-copy',
        title: '계약서·특약 사본 보관',
        desc: '날인본, 특약, 중개대상물 확인설명서를 클라우드·사진으로 백업합니다.',
      },
      {
        id: 'timeline',
        title: '개인 임대차 타임라인 등록',
        desc: '마이페이지·내 타임라인에 입주일·만기일을 입력해 갱신·퇴실 알림을 맞춥니다.',
      },
    ],
  },
];
