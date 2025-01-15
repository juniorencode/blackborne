import { useState } from 'react';
import { useClickOutside } from './useClickOutside.hook';

const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const domRef = useClickOutside(() => setIsOpen(false));

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const register = { isOpen, closeModal, domRef };

  return { register, openModal, closeModal };
};

export { useModal };
