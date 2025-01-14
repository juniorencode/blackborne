import { useEffect, useRef } from 'react';

export const useClickOutside = callback => {
  const domNode = useRef(null);

  const handler = e => {
    if (domNode.current && !domNode.current.contains(e.target)) callback();
  };

  useEffect(() => {
    document.addEventListener('mousedown', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
    };
    // eslint-disable-next-line
  }, []);

  return domNode;
};
