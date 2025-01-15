import PropTypes from 'prop-types';
import { useState, Children, cloneElement } from 'react';

export const Accordion = props => {
  const {
    children,
    className,
    multiple = false,
    openFirst,
    openLast,
    openDefault
  } = props;
  const [activeIndices, setActiveIndices] = useState(
    openDefault && openDefault > 0 && openDefault <= Children.count(children)
      ? [openDefault - 1]
      : openLast
      ? [Children.count(children) - 1]
      : openFirst
      ? [0]
      : []
  );

  const toggleItem = index => {
    setActiveIndices(prev =>
      multiple
        ? prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index]
        : prev.includes(index)
        ? []
        : [index]
    );
  };

  return (
    <div className={className}>
      {Children.map(children, (child, index) =>
        cloneElement(child, {
          isActive: activeIndices.includes(index),
          onToggle: () => toggleItem(index)
        })
      )}
    </div>
  );
};
Accordion.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  multiple: PropTypes.bool,
  openFirst: PropTypes.number,
  openLast: PropTypes.number,
  openDefault: PropTypes.number
};
