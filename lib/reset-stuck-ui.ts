/** OAuth 뒤로가기(bfcache) 후 body 스크롤 잠금이 남는 경우 해제 */
export function resetStuckBodyScroll() {
  if (typeof document === 'undefined') return;
  const top = document.body.style.top;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.overflow = '';
  document.body.style.pointerEvents = '';
  if (top) {
    const y = Math.abs(parseInt(top, 10)) || 0;
    window.scrollTo(0, y);
  }
}

export const PAGE_RECOVERY_EVENT = 'bigroot:page-recovery';

/**
 * 모달 상태·body 잠금만 React 이벤트로 복구합니다.
 * React가 렌더한 DOM을 직접 remove()하면 removeChild 오류로 앱 전체가 멈춥니다.
 */
export function releasePageInteraction() {
  if (typeof document === 'undefined') return;
  resetStuckBodyScroll();
  window.dispatchEvent(new Event(PAGE_RECOVERY_EVENT));
}
