export function highlightText(text, query) {
  if (!query) return text;
  const words = query.split(' ').filter(Boolean);
  let highlighted = text;
  words.forEach((word) => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlighted = highlighted.replace(regex, '<span class="bg-yellow-200">$1</span>');
  });
  return highlighted;
}