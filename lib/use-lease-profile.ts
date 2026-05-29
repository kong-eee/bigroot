'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getMoveInDate, setMoveInDate } from '@/lib/tenant-lease-storage';
import type { PropertyType } from '@/lib/lease-timeline';

export function useLeaseProfile() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState<PropertyType>('주택');
  const [contractEndDate, setContractEndDate] = useState('');
  const [moveInDate, setMoveInDateState] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    setUser(authUser ? { id: authUser.id, email: authUser.email } : null);

    if (authUser) {
      const { data: pf } = await supabase
        .from('profiles')
        .select('contract_end_date, property_type')
        .eq('id', authUser.id)
        .single();
      if (pf?.contract_end_date) setContractEndDate(pf.contract_end_date);
      if (pf?.property_type === '상가' || pf?.property_type === '주택') {
        setPropertyType(pf.property_type);
      }
      setMoveInDateState(getMoveInDate(authUser.id));
    } else {
      setMoveInDateState(getMoveInDate());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveProfile = async (payload: {
    contractEndDate: string;
    propertyType: PropertyType;
    moveInDate: string;
  }) => {
    setMoveInDate(payload.moveInDate, user?.id);
    setMoveInDateState(payload.moveInDate);
    setContractEndDate(payload.contractEndDate);
    setPropertyType(payload.propertyType);

    if (!user) {
      alert('입주일은 저장되었습니다. 만기일·유형은 로그인 후 마이페이지와 동기화됩니다.');
      return true;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      contract_end_date: payload.contractEndDate || null,
      property_type: payload.propertyType,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      alert('저장에 실패했습니다. 다시 시도해 주세요.');
      return false;
    }
    alert('임대차 일정이 저장되었습니다.');
    return true;
  };

  return {
    user,
    loading,
    propertyType,
    contractEndDate,
    moveInDate,
    setPropertyType,
    setContractEndDate,
    setMoveInDateState,
    saveProfile,
    reload,
  };
}
