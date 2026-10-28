import { useEffect, useState } from 'react';

export function useCurrentTime(interval = 1000) {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return currentTime;
}
