import { useState, useEffect } from 'react';

const getParentsElement = elementRef => {
  const getParents = element => {
    const parentsArray = [];
    let currentElement = element;

    while (currentElement && currentElement !== document.body) {
      currentElement = currentElement.parentElement;
      if (currentElement) {
        parentsArray.push(currentElement);
      }
    }

    return parentsArray;
  };

  if (elementRef.current) return getParents(elementRef.current);

  return [];
};

const getScrollParent = element => {
  while (element && element !== document.body) {
    if (element.scrollHeight > element.clientHeight) {
      return element;
    }
    element = element.parentElement;
  }
  return window;
};

const usePopper = (
  referenceElement,
  popperElement,
  initialPlacement = 'bottom'
) => {
  const [placement, setPlacement] = useState(initialPlacement);
  const [styles, setStyles] = useState({});

  useEffect(() => {
    const updatePosition = scrollParent => {
      if (!referenceElement.current || !popperElement.current) return;

      const referenceRect = referenceElement.current.getBoundingClientRect();
      const popperRect = popperElement.current.getBoundingClientRect();

      let containerRect = {
        top: 0,
        left: 0,
        bottom: window.innerHeight,
        right: window.innerWidth
      };

      if (scrollParent) {
        containerRect = scrollParent.getBoundingClientRect();
      }

      let newStyles = {};
      let newPlacement = placement;

      switch (initialPlacement) {
        case 'bottom':
          if (referenceRect.bottom + popperRect.height > containerRect.bottom) {
            newPlacement = 'top';
          } else {
            newPlacement = 'bottom';
          }
          break;
        case 'top':
          if (referenceRect.top - popperRect.height < containerRect.top) {
            newPlacement = 'bottom';
          } else {
            newPlacement = 'top';
          }
          break;
        default:
          break;
      }

      if (newPlacement === 'bottom') {
        newStyles = {
          bottom: '16px'
        };
      } else if (newPlacement === 'top') {
        newStyles = {
          top: '-' + (popperRect.height + 16) + 'px'
        };
      }

      setStyles(newStyles);
      setPlacement(newPlacement);
    };

    const scrollParents = getParentsElement(referenceElement);

    const handleScroll = e => {
      const scrollParent = getScrollParent(e.target);
      updatePosition(scrollParent);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    scrollParents.forEach(scrollParent => {
      scrollParent.addEventListener('scroll', handleScroll);
    });

    return () => {
      window.removeEventListener('resize', updatePosition);
      scrollParents.forEach(scrollParent => {
        scrollParent.removeEventListener('scroll', handleScroll);
      });
    };
  }, [referenceElement, popperElement, initialPlacement, placement]);

  return { styles, placement };
};

export { usePopper };
