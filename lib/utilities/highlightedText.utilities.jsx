export const getHighlightedText = (text, highlightedText) => {
  if (!text) return;
  if (!highlightedText) {
    return [<span key="full-text">{text}</span>];
  }

  const parts = text
    ? text.toString().split(new RegExp(`(${highlightedText})`, 'gi'))
    : [];
  return parts?.map((part, index) =>
    part.toLowerCase() === highlightedText.toLowerCase() ? (
      <span key={index} style={{ backgroundColor: '#2652c0' }}>
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
};
