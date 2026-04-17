export function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.appendChild(document.createTextNode(attrs[k]));
      else node.setAttribute(k, attrs[k]);
    }
  }
  for (const c of children) {
    if (c == null) continue;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  }
  return node;
}

export const br = () => document.createElement('br');
export const strong = (t) => el('strong', null, t);

export function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
