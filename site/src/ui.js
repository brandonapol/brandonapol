// HTML overlays on top of the canvas: tooltip, station cards, quest log.

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) node.append(c);
  return node;
}
export { el };

export class Tooltip {
  constructor(root) {
    this.root = root;
  }

  show(name, hint, point) {
    this.root.replaceChildren(el('strong', {}, name), ...(hint ? [el('span', {}, hint)] : []));
    this.root.hidden = false;
    if (point?.pointerType === 'mouse') {
      this.root.classList.remove('docked');
      this.root.style.left = `${point.clientX + 16}px`;
      this.root.style.top = `${point.clientY + 16}px`;
    } else {
      // Touch: dock it at the bottom with a reminder to tap again.
      this.root.classList.add('docked');
      this.root.style.left = this.root.style.top = '';
      this.root.append(el('em', {}, 'tap again to open'));
    }
  }

  hide() {
    this.root.hidden = true;
  }
}

export class Card {
  constructor(root, { onBack }) {
    this.root = root;
    this.onBack = onBack;
  }

  // `data`: { kicker, title, body[], list[{title,text}], embed{src,height,title}, links[{label,href}], note }
  // `extra`: an optional node appended after the body.
  open(data, extra) {
    const links = (data.links ?? []).map((l) => {
      const external = /^https?:/.test(l.href);
      return el('a', { class: 'button', href: l.href, ...(external ? { target: '_blank', rel: 'noopener' } : {}) }, l.label);
    });
    this.root.replaceChildren(
      el(
        'div',
        { class: 'card', role: 'dialog', 'aria-label': data.title },
        el('button', { class: 'back', type: 'button', onclick: () => this.onBack() }, '← back'),
        data.kicker ? el('p', { class: 'kicker' }, data.kicker) : null,
        el('h2', {}, data.title),
        (data.body ?? []).map((p) => el('p', {}, p)),
        extra ?? null,
        data.list?.length
          ? el(
              'ul',
              { class: 'entries' },
              data.list.map((i) =>
                el(
                  'li',
                  {},
                  el('strong', {}, i.href ? el('a', { href: i.href, target: '_blank', rel: 'noopener' }, i.title) : i.title),
                  el('span', {}, i.text),
                ),
              ),
            )
          : null,
        data.embed
          ? el('iframe', {
              src: data.embed.src,
              title: data.embed.title ?? data.title,
              height: String(data.embed.height ?? 152),
              loading: 'lazy',
              allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
            })
          : null,
        data.note ? el('p', { class: 'note' }, data.note) : null,
        links.length ? el('div', { class: 'links' }, links) : null,
      ),
    );
    this.root.hidden = false;
    this.root.querySelector('.back').focus({ preventScroll: true });
  }

  close() {
    this.root.hidden = true;
    // Drop iframes so embedded audio stops.
    this.root.replaceChildren();
  }

  get isOpen() {
    return !this.root.hidden;
  }
}

const QUEST_KEY = 'office-quest-v1';

export class Quest {
  constructor(root, { stations, onComplete }) {
    this.root = root;
    this.stations = stations; // [{ id, name }]
    this.onComplete = onComplete;
    this.found = new Set();
    this.expanded = false;
    try {
      const saved = JSON.parse(localStorage.getItem(QUEST_KEY) ?? '[]');
      for (const id of saved) if (stations.some((s) => s.id === id)) this.found.add(id);
    } catch {
      // Storage can be blocked; progress just won't persist.
    }
    this.render();
  }

  mark(id) {
    if (this.found.has(id) || !this.stations.some((s) => s.id === id)) return;
    this.found.add(id);
    try {
      localStorage.setItem(QUEST_KEY, JSON.stringify([...this.found]));
    } catch {
      // ignore
    }
    this.render(id);
    if (this.found.size === this.stations.length) this.onComplete();
  }

  render(justFound) {
    const total = this.stations.length;
    const toggle = el(
      'button',
      { type: 'button', class: 'quest-toggle', 'aria-expanded': String(this.expanded), onclick: () => { this.expanded = !this.expanded; this.render(); } },
      el('span', {}, 'Explore the office'),
      el('b', {}, `${this.found.size}/${total}`),
    );
    const list = this.expanded
      ? el('ul', {}, this.stations.map((s) => el('li', { class: this.found.has(s.id) ? 'found' : '' }, this.found.has(s.id) ? s.name : '???')))
      : null;
    this.root.replaceChildren(...[toggle, list].filter(Boolean));
    if (justFound) {
      this.root.classList.remove('pulse');
      void this.root.offsetWidth;
      this.root.classList.add('pulse');
    }
  }
}
