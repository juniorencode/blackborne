import { useState } from 'react';
import { useClickOutside } from './useClickOutside.hook';

export const useAlert = () => {
  const [isOpen, setIsOpen] = useState(false);
  const domRef = useClickOutside(() => setIsOpen(false));

  const openAlert = () => setIsOpen(true);
  const closeAlert = () => setIsOpen(false);

  const register = { isOpen, closeAlert, domRef };

  return { register, openAlert, closeAlert };
};
