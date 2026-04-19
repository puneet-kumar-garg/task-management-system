import { useEffect, useRef, useCallback } from 'react';

export const useInfiniteScroll = (onLoadMore, hasMore) => {
  const sentinelRef = useRef(null);

  const observe = useCallback(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  useEffect(observe, [observe]);

  return sentinelRef;
};
