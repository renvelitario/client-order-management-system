import { useEffect, useRef, useState } from 'react';

const MAX_PULL_DISTANCE = 96;
const RELOAD_THRESHOLD = 72;

function hasTouchSupport() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function findScrollableAncestor(element) {
  let current = element;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const canScroll = /(auto|scroll)/.test(style.overflowY);

    if (canScroll && current.scrollHeight > current.clientHeight) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

export function usePullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const pullDistanceRef = useRef(0);
  const trackingRef = useRef(false);
  const startYRef = useRef(0);

  useEffect(() => {
    if (!hasTouchSupport()) {
      return undefined;
    }

    const onTouchStart = (event) => {
      if (event.touches.length !== 1 || window.scrollY > 0) {
        trackingRef.current = false;
        return;
      }

      const target = event.target;
      const scrollableAncestor = findScrollableAncestor(target);

      if (scrollableAncestor && scrollableAncestor.scrollTop > 0) {
        trackingRef.current = false;
        return;
      }

      trackingRef.current = true;
      startYRef.current = event.touches[0].clientY;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      setIsPulling(false);
    };

    const onTouchMove = (event) => {
      if (!trackingRef.current) {
        return;
      }

      const deltaY = event.touches[0].clientY - startYRef.current;

      if (deltaY <= 0 || window.scrollY > 0) {
        setPullDistance(0);
        setIsPulling(false);
        pullDistanceRef.current = 0;
        return;
      }

      const adjustedDistance = Math.min(deltaY * 0.55, MAX_PULL_DISTANCE);

      pullDistanceRef.current = adjustedDistance;
      setPullDistance(adjustedDistance);
      setIsPulling(true);

      // Prevent browser bounce while custom pull-to-refresh is active.
      event.preventDefault();
    };

    const onTouchEnd = () => {
      if (!trackingRef.current) {
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= RELOAD_THRESHOLD;

      trackingRef.current = false;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      setIsPulling(false);

      if (shouldRefresh) {
        window.location.reload();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return {
    pullDistance,
    isPulling,
    isReadyToRefresh: pullDistance >= RELOAD_THRESHOLD,
  };
}
