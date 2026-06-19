'use client';

import { getVisitChecklistItemIds } from '@/lib/property-visit-checklist-data';
import {
  checklistProgress,
  formatWon,
  type PropertyVisit,
} from '@/lib/property-visit-types';

type Props = {
  visits: PropertyVisit[];
  onClose: () => void;
};

const COMPARE_FIELDS: { key: keyof PropertyVisit; label: string; format?: (v: PropertyVisit) => string }[] = [
  { key: 'propertyType', label: '유형' },
  { key: 'visitedAt', label: '임장일' },
  { key: 'address', label: '주소' },
  { key: 'depositWon', label: '보증금', format: (v) => formatWon(v.depositWon) },
  { key: 'monthlyRentWon', label: '월세', format: (v) => formatWon(v.monthlyRentWon) },
  { key: 'maintenanceWon', label: '관리비', format: (v) => formatWon(v.maintenanceWon) },
  { key: 'keyMoneyWon', label: '권리금', format: (v) => formatWon(v.keyMoneyWon) },
  { key: 'areaM2', label: '면적(㎡)', format: (v) => (v.areaM2 != null ? `${v.areaM2}㎡` : '-') },
  { key: 'floor', label: '층수' },
  { key: 'direction', label: '향' },
  { key: 'buildingYear', label: '준공', format: (v) => (v.buildingYear ? `${v.buildingYear}년` : '-') },
  { key: 'overallScore', label: '별점', format: (v) => (v.overallScore ? `${v.overallScore}점` : '-') },
  { key: 'decision', label: '판단' },
  { key: 'pros', label: '장점' },
  { key: 'cons', label: '단점' },
  { key: 'features', label: '특징' },
  { key: 'transport', label: '교통' },
  { key: 'neighborhood', label: '주변' },
];

function cellValue(visit: PropertyVisit, field: (typeof COMPARE_FIELDS)[number]): string {
  if (field.format) return field.format(visit);
  const raw = visit[field.key];
  if (raw == null || raw === '') return '-';
  return String(raw);
}

export default function VisitComparePanel({ visits, onClose }: Props) {
  if (visits.length < 2) {
    return (
      <div className="ui-card p-8 text-center space-y-4">
        <p className="font-bold text-[var(--text-secondary)]">비교하려면 목록에서 2개 이상 선택해 주세요.</p>
        <button type="button" onClick={onClose} className="ui-btn-primary text-sm px-5 py-2">
          목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">매물 비교</h2>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            {visits.length}개 매물을 나란히 비교합니다.
          </p>
        </div>
        <button type="button" onClick={onClose} className="ui-btn-secondary text-sm px-4 py-2">
          목록
        </button>
      </div>

      <div className="ui-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-3 font-black text-[var(--text-secondary)] w-28">항목</th>
              {visits.map((v) => (
                <th key={v.id} className="text-left p-3 font-black min-w-[180px]">
                  <div>{v.title}</div>
                  <div className="text-xs font-medium text-[var(--text-secondary)] mt-1">
                    {v.propertyType} · {v.visitedAt}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_FIELDS.map((field) => (
              <tr key={field.key} className="border-b border-[var(--border)] align-top">
                <td className="p-3 font-black text-[var(--text-secondary)]">{field.label}</td>
                {visits.map((v) => (
                  <td key={v.id} className="p-3 font-medium whitespace-pre-wrap">
                    {cellValue(v, field)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="align-top">
              <td className="p-3 font-black text-[var(--text-secondary)]">체크리스트</td>
              {visits.map((v) => {
                const ids = getVisitChecklistItemIds(v.propertyType);
                const { done, total, pct } = checklistProgress(v.checklist, ids);
                return (
                  <td key={v.id} className="p-3 font-medium">
                    {done}/{total} ({pct}%)
                  </td>
                );
              })}
            </tr>
            <tr className="align-top">
              <td className="p-3 font-black text-[var(--text-secondary)]">사진</td>
              {visits.map((v) => (
                <td key={v.id} className="p-3 font-medium">
                  {v.photos.length}장
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
