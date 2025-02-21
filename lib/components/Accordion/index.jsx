import PropTypes from 'prop-types';
import { useState, Children, cloneElement } from 'react';
import { AccordionItem } from './AccordionItem';

export const Accordion = props => {
  const {
    children,
    className,
    data,
    multiple = false,
    openFirst,
    openLast,
    openDefault
  } = props;

  const items = data
    ? data.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          subtitle={item.subtitle}
          disabled={item.disabled}
        >
          {item.content}
        </AccordionItem>
      ))
    : children;

  const [activeIndices, setActiveIndices] = useState(
    openDefault && openDefault > 0 && openDefault <= Children.count(items)
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
      {Children.map(items, (child, index) =>
        cloneElement(child, {
          isActive: activeIndices.includes(index),
          onToggle: () => toggleItem(index)
        })
      )}
    </div>
  );
};
Accordion.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      content: PropTypes.node,
      disabled: PropTypes.bool
    })
  ),
  multiple: PropTypes.bool,
  openFirst: PropTypes.number,
  openLast: PropTypes.number,
  openDefault: PropTypes.number
};
