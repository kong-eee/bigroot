'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getVisitChecklist, getVisitChecklistItemIds } from '@/lib/property-visit-checklist-data';
import {
  DIRECTION_OPTIONS,
  PHOTO_BUCKET,
  VISIT_DECISIONS,
  checklistProgress,
  emptyVisitDraft,
  formatWon,
  parseWonInput,
  type PropertyVisit,
  type PropertyVisitDraft,
  type VisitPhoto,
} from '@/lib/property-visit-types';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

type Props = {
  visit: PropertyVisit | null;
  userId: string;
  onSaved: (visit: PropertyVisit) => void;
  onCancel: () => void;
  onDeleted: () => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-black text-[var(--text-secondary)]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-page)] px-3 py-2.5 text-sm font-medium outline-none focus:border-[var(--brand)]';

export default function VisitEditorPanel({ visit, userId, onSaved, onCancel, onDeleted }: Props) {
  const [draft, setDraft] = useState<PropertyVisitDraft>(() =>
    visit ? { ...visit } : emptyVisitDraft('주택')
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const phases = useMemo(() => getVisitChecklist(draft.propertyType), [draft.propertyType]);
  const itemIds = useMemo(() => getVisitChecklistItemIds(draft.propertyType), [draft.propertyType]);
  const progress = useMemo(() => checklistProgress(draft.checklist, itemIds), [draft.checklist, itemIds]);

  const loadPhotoUrls = useCallback(async (photos: VisitPhoto[]) => {
    const entries = await Promise.all(
      photos.map(async (photo) => {
        const { data } = await supabase.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(photo.path, 3600);
        return [photo.id, data?.signedUrl ?? ''] as const;
      })
    );
    setPhotoUrls(Object.fromEntries(entries.filter(([, url]) => url)));
  }, []);

  useEffect(() => {
    if (visit) setDraft({ ...visit });
    else setDraft(emptyVisitDraft('주택'));
  }, [visit]);

  useEffect(() => {
    if (draft.photos.length > 0) void loadPhotoUrls(draft.photos);
    else setPhotoUrls({});
  }, [draft.photos, loadPhotoUrls]);

  const patch = <K extends keyof PropertyVisitDraft>(key: K, value: PropertyVisitDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCheck = (id: string) => {
    setDraft((prev) => {
      const current = prev.checklist[id];
      return {
        ...prev,
        checklist: {
          ...prev.checklist,
          [id]: { ...current, checked: !current?.checked, note: current?.note },
        },
      };
    });
  };

  const setCheckNote = (id: string, note: string) => {
    setDraft((prev) => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [id]: { checked: prev.checklist[id]?.checked ?? false, note },
      },
    }));
  };

  const ensureVisitId = async (): Promise<string> => {
    if (visit?.id) return visit.id;
    const title = draft.title.trim() || draft.address?.trim();
    if (!title) throw new Error('제목 또는 주소를 먼저 입력해 주세요.');

    const res = await fetch('/api/property-visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, title }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '저장 실패');
    onSaved(data.visit as PropertyVisit);
    return data.visit.id as string;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const title = draft.title.trim() || draft.address?.trim();
      if (!title) throw new Error('제목 또는 주소를 입력해 주세요.');

      const payload = { ...draft, title };
      const url = visit ? `/api/property-visits/${visit.id}` : '/api/property-visits';
      const method = visit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '저장 실패');
      onSaved(data.visit as PropertyVisit);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!visit) return;
    if (!confirm('이 임장 기록을 삭제할까요? 사진도 함께 삭제됩니다.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/property-visits/${visit.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '삭제 실패');
      onDeleted();
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const visitId = await ensureVisitId();
      const newPhotos: VisitPhoto[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${userId}/${visitId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, file, { contentType: file.type || 'image/jpeg' });
        if (uploadError) throw uploadError;

        newPhotos.push({
          id: crypto.randomUUID(),
          path,
          createdAt: new Date().toISOString(),
        });
      }

      const nextPhotos = [...draft.photos, ...newPhotos];
      patch('photos', nextPhotos);

      if (visit?.id) {
        const res = await fetch(`/api/property-visits/${visit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos: nextPhotos }),
        });
        const data = await res.json();
        if (data.success) onSaved(data.visit as PropertyVisit);
      }

      await loadPhotoUrls(nextPhotos);
    } catch (e) {
      setError(e instanceof Error ? e.message : '사진 업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photo: VisitPhoto) => {
    if (!confirm('이 사진을 삭제할까요?')) return;
    const nextPhotos = draft.photos.filter((p) => p.id !== photo.id);
    patch('photos', nextPhotos);
    await supabase.storage.from(PHOTO_BUCKET).remove([photo.path]);

    if (visit?.id) {
      const res = await fetch(`/api/property-visits/${visit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: nextPhotos }),
      });
      const data = await res.json();
      if (data.success) onSaved(data.visit as PropertyVisit);
    }
  };

  const onTypeChange = (propertyType: GoldenPropertyType) => {
    if (draft.propertyType === propertyType) return;
    if (Object.values(draft.checklist).some((c) => c.checked)) {
      if (!confirm('유형을 바꾸면 체크리스트 항목이 달라집니다. 계속할까요?')) return;
    }
    patch('propertyType', propertyType);
    patch('checklist', {});
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">{visit ? '임장 기록 수정' : '새 임장 기록'}</h2>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            현장에서 본 내용을 바로 적어 두면 나중에 비교하기 쉽습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="ui-btn-secondary text-sm px-4 py-2">
            목록
          </button>
          {visit && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="text-sm font-bold px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
            >
              {deleting ? '삭제 중…' : '삭제'}
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="ui-btn-primary text-sm px-5 py-2"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="ui-card p-6 space-y-5">
        <div className="ui-tab-bar">
          {(['주택', '상가'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={draft.propertyType === type ? 'ui-tab ui-tab-active' : 'ui-tab'}
            >
              {type === '주택' ? '🏠 주택' : '🏪 상가'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="제목 (별칭)">
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) => patch('title', e.target.value)}
              placeholder="예: 강남역 원룸 A"
            />
          </Field>
          <Field label="임장 날짜">
            <input
              type="date"
              className={inputClass}
              value={draft.visitedAt}
              onChange={(e) => patch('visitedAt', e.target.value)}
            />
          </Field>
          <Field label="주소">
            <input
              className={inputClass}
              value={draft.address ?? ''}
              onChange={(e) => patch('address', e.target.value || null)}
              placeholder="도로명 또는 지번 주소"
            />
          </Field>
          <Field label="층수">
            <input
              className={inputClass}
              value={draft.floor ?? ''}
              onChange={(e) => patch('floor', e.target.value || null)}
              placeholder="예: 3층 / 반지하"
            />
          </Field>
          <Field label="보증금">
            <input
              className={inputClass}
              value={draft.depositWon != null ? draft.depositWon.toLocaleString('ko-KR') : ''}
              onChange={(e) => patch('depositWon', parseWonInput(e.target.value))}
              placeholder="원"
            />
          </Field>
          <Field label="월세">
            <input
              className={inputClass}
              value={draft.monthlyRentWon != null ? draft.monthlyRentWon.toLocaleString('ko-KR') : ''}
              onChange={(e) => patch('monthlyRentWon', parseWonInput(e.target.value))}
              placeholder="원 (전세면 비워두세요)"
            />
          </Field>
          <Field label="관리비">
            <input
              className={inputClass}
              value={draft.maintenanceWon != null ? draft.maintenanceWon.toLocaleString('ko-KR') : ''}
              onChange={(e) => patch('maintenanceWon', parseWonInput(e.target.value))}
              placeholder="원"
            />
          </Field>
          {draft.propertyType === '상가' && (
            <Field label="권리금">
              <input
                className={inputClass}
                value={draft.keyMoneyWon != null ? draft.keyMoneyWon.toLocaleString('ko-KR') : ''}
                onChange={(e) => patch('keyMoneyWon', parseWonInput(e.target.value))}
                placeholder="원"
              />
            </Field>
          )}
          <Field label="면적 (㎡)">
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={draft.areaM2 ?? ''}
              onChange={(e) => patch('areaM2', e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="향">
            <select
              className={inputClass}
              value={draft.direction ?? ''}
              onChange={(e) => patch('direction', e.target.value || null)}
            >
              <option value="">선택</option>
              {DIRECTION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="준공 연도">
            <input
              type="number"
              className={inputClass}
              value={draft.buildingYear ?? ''}
              onChange={(e) => patch('buildingYear', e.target.value ? Number(e.target.value) : null)}
              placeholder="예: 2018"
            />
          </Field>
        </div>
      </div>

      <div className="ui-card p-6 space-y-4">
        <h3 className="font-black">현장 메모</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="교통·접근">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.transport ?? ''} onChange={(e) => patch('transport', e.target.value || null)} />
          </Field>
          <Field label={draft.propertyType === '상가' ? '상권·주변' : '주변 환경'}>
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.neighborhood ?? ''} onChange={(e) => patch('neighborhood', e.target.value || null)} />
          </Field>
          <Field label="채광·일조">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.sunlight ?? ''} onChange={(e) => patch('sunlight', e.target.value || null)} />
          </Field>
          <Field label="소음">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.noise ?? ''} onChange={(e) => patch('noise', e.target.value || null)} />
          </Field>
          <Field label="결로·곰팡이">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.humidity ?? ''} onChange={(e) => patch('humidity', e.target.value || null)} />
          </Field>
          <Field label="주차">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.parking ?? ''} onChange={(e) => patch('parking', e.target.value || null)} />
          </Field>
          <Field label="시설·설비">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.facilities ?? ''} onChange={(e) => patch('facilities', e.target.value || null)} />
          </Field>
          <Field label="특징·기타">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.features ?? ''} onChange={(e) => patch('features', e.target.value || null)} />
          </Field>
          <Field label="장점">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.pros ?? ''} onChange={(e) => patch('pros', e.target.value || null)} />
          </Field>
          <Field label="단점·우려">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.cons ?? ''} onChange={(e) => patch('cons', e.target.value || null)} />
          </Field>
          <Field label="임대인·관리인">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.landlordImpression ?? ''} onChange={(e) => patch('landlordImpression', e.target.value || null)} />
          </Field>
          <Field label="중개사 정보">
            <textarea className={`${inputClass} min-h-[80px]`} value={draft.agentInfo ?? ''} onChange={(e) => patch('agentInfo', e.target.value || null)} />
          </Field>
        </div>
        <Field label="계약 조건 메모">
          <textarea className={`${inputClass} min-h-[100px]`} value={draft.contractNotes ?? ''} onChange={(e) => patch('contractNotes', e.target.value || null)} />
        </Field>
      </div>

      <div className="ui-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-black">종합 평가</h3>
          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isFavorite}
              onChange={(e) => patch('isFavorite', e.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            즐겨찾기
          </label>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patch('overallScore', draft.overallScore === n ? null : n)}
                className={`text-2xl ${draft.overallScore && draft.overallScore >= n ? 'opacity-100' : 'opacity-30'}`}
              >
                ★
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {VISIT_DECISIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => patch('decision', draft.decision === d ? null : d)}
                className={`px-3 py-1.5 rounded-full text-xs font-black border ${
                  draft.decision === d
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ui-card p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black">사진</h3>
          <label className="ui-btn-secondary text-sm px-4 py-2 cursor-pointer">
            {uploading ? '업로드 중…' : '+ 사진 추가'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => void handlePhotoUpload(e.target.files)}
            />
          </label>
        </div>
        {draft.photos.length === 0 ? (
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            외관·실내·주변 상권 등을 촬영해 두세요.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {draft.photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-[var(--border)]">
                {photoUrls[photo.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrls[photo.id]} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-[var(--bg-muted)]" />
                )}
                <button
                  type="button"
                  onClick={() => void removePhoto(photo)}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ui-card p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-black">
            <span>임장 체크리스트</span>
            <span className="text-[var(--brand)]">
              {progress.done}/{progress.total} ({progress.pct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
            <div className="h-full bg-[var(--brand)] transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>

        {phases.map((phase) => (
          <section key={phase.id} className="space-y-3">
            <div>
              <h4 className="font-black">{phase.label}</h4>
              <p className="text-xs font-medium text-[var(--text-secondary)]">{phase.subtitle}</p>
            </div>
            <ul className="space-y-2">
              {phase.items.map((item) => {
                const entry = draft.checklist[item.id];
                return (
                  <li key={item.id} className="rounded-xl border border-[var(--border)] p-3 space-y-2">
                    <label className="flex gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!entry?.checked}
                        onChange={() => toggleCheck(item.id)}
                        className="mt-1 h-4 w-4 accent-[var(--brand)]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black">{item.title}</p>
                        <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                    <input
                      className={`${inputClass} text-xs`}
                      value={entry?.note ?? ''}
                      onChange={(e) => setCheckNote(item.id, e.target.value)}
                      placeholder="메모 (선택)"
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
