import { profile, links, projects, experience } from './content.js';
import { el } from './ui.js';

const PROMPT = 'brandon@desk:~$';

const linkNode = (href, label = href) => {
  const external = /^https?:/.test(href);
  return el('a', { href, ...(external ? { target: '_blank', rel: 'noopener' } : {}) }, label);
};

// A tiny shell for the desk computer. Commands render DOM, not innerHTML.
export class Terminal {
  constructor(root, { onExit }) {
    this.root = root;
    this.onExit = onExit;
    this.history = [];
    this.historyIndex = 0;

    this.output = el('div', { class: 'output', 'aria-live': 'polite' });
    this.input = el('input', {
      class: 'input',
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      'aria-label': 'Terminal command',
    });
    this.input.addEventListener('keydown', (e) => this.onKey(e));
    const chips = el(
      'div',
      { class: 'chips' },
      ['whoami', 'cat resume', 'ls projects', 'contact', 'help', 'exit'].map((cmd) =>
        el('button', { type: 'button', onclick: () => this.run(cmd) }, cmd),
      ),
    );
    this.root.replaceChildren(
      el(
        'div',
        { class: 'window', role: 'dialog', 'aria-label': 'Terminal' },
        el(
          'header',
          {},
          el('span', { class: 'dots' }, el('i'), el('i'), el('i')),
          el('span', { class: 'title' }, 'brandon@desk: ~'),
          el('button', { type: 'button', onclick: () => this.onExit() }, 'esc'),
        ),
        el('div', { class: 'body', onclick: (e) => { if (e.target.tagName !== 'A') this.input.focus(); } },
          this.output,
          el('label', { class: 'line' }, el('span', { class: 'ps1' }, PROMPT), this.input),
        ),
        chips,
      ),
    );

    this.commands = {
      help: () => [
        this.text('Commands:'),
        this.table([
          ['whoami', 'who I am'],
          ['cat resume', 'work history'],
          ['ls projects', 'side projects'],
          ['open <name>', `open a link (${Object.keys(links).join(', ')})`],
          ['contact', 'how to reach me'],
          ['clear', 'clear the screen'],
          ['exit', 'step away from the desk'],
        ]),
      ],
      whoami: () => [el('h1', {}, profile.name), this.text(profile.role), ...profile.bio.map((p) => this.text(p))],
      cat: (arg) => {
        if (arg !== 'resume' && arg !== 'resume.md') return [this.text(`cat: ${arg || ''}: No such file. Try "cat resume".`)];
        return [
          ...experience.map((x) =>
            el('div', { class: 'job' }, el('strong', {}, `${x.title}, ${x.org}`), el('span', { class: 'dim' }, ` ${x.dates}`), el('div', {}, x.text)),
          ),
          el('p', {}, 'Full résumé: ', linkNode(links.resume.href, 'resume.html')),
        ];
      },
      ls: (arg) => {
        if (arg && arg !== 'projects' && arg !== 'links') return [this.text(`ls: ${arg}: No such directory.`)];
        if (arg === 'links') return [el('p', {}, Object.values(links).flatMap((l) => [linkNode(l.href, l.label), '  ']))];
        return projects.map((p) => el('div', { class: 'job' }, linkNode(p.href, p.name), el('span', {}, ` — ${p.text}`)));
      },
      open: (arg) => {
        const link = links[arg?.toLowerCase()];
        if (!link) return [this.text(`open: unknown target "${arg ?? ''}". Try one of: ${Object.keys(links).join(', ')}`)];
        window.open(link.href, /^https?:/.test(link.href) ? '_blank' : '_self', 'noopener');
        return [this.text(`opening ${link.href}`)];
      },
      contact: () => [
        el('p', {}, linkNode(links.linkedin.href, 'LinkedIn'), ' · ', linkNode(links.github.href, 'GitHub'), ' · ', linkNode('https://github.com/brandonapol/brandonapol/issues/new', 'open an issue')),
      ],
      clear: () => {
        this.output.replaceChildren();
        return [];
      },
      exit: () => {
        this.onExit();
        return [];
      },
      sudo: () => [this.text('Nice try. This incident will be reported to the Code Cop.')],
      vim: () => [this.text('You are already in the best editor: a terminal on a portfolio site. :q to escape (just kidding, type exit).')],
      ':q': () => this.commands.exit(),
    };
  }

  text(t) {
    return el('p', {}, t);
  }

  table(rows) {
    return el('div', { class: 'table' }, rows.map(([a, b]) => el('div', {}, el('code', {}, a), el('span', {}, b))));
  }

  open() {
    this.root.hidden = false;
    if (!this.output.childElementCount) this.run('whoami', { silent: false });
    // Don't pop the on-screen keyboard on phones; they have the chips.
    if (matchMedia('(pointer: fine)').matches) this.input.focus({ preventScroll: true });
  }

  close() {
    this.root.hidden = true;
  }

  get isOpen() {
    return !this.root.hidden;
  }

  run(line) {
    const trimmed = line.trim();
    if (trimmed) this.history.push(trimmed);
    this.historyIndex = this.history.length;
    const [cmd, ...rest] = trimmed.split(/\s+/);
    const echo = el('p', { class: 'echo' }, el('span', { class: 'ps1' }, PROMPT), ` ${trimmed}`);
    if (cmd !== 'clear') this.output.append(echo);
    if (!cmd) return;
    const handler = this.commands[cmd];
    const result = handler ? handler(rest.join(' ') || undefined) : [this.text(`${cmd}: command not found. Type "help".`)];
    this.output.append(...result);
    this.output.parentElement.scrollTop = this.output.parentElement.scrollHeight;
  }

  onKey(e) {
    if (e.key === 'Enter') {
      this.run(this.input.value);
      this.input.value = '';
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.historyIndex = Math.max(0, Math.min(this.history.length, this.historyIndex + (e.key === 'ArrowUp' ? -1 : 1)));
      this.input.value = this.history[this.historyIndex] ?? '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.complete();
    } else if (e.key === 'Escape') {
      this.onExit();
    }
    e.stopPropagation();
  }

  complete() {
    const value = this.input.value;
    const words = value.split(' ');
    let options;
    if (words.length === 1) options = Object.keys(this.commands).filter((c) => c !== ':q');
    else if (words[0] === 'open') options = Object.keys(links);
    else if (words[0] === 'cat') options = ['resume'];
    else if (words[0] === 'ls') options = ['projects', 'links'];
    else return;
    const last = words.at(-1);
    const matches = options.filter((o) => o.startsWith(last));
    if (matches.length === 1) {
      words[words.length - 1] = matches[0];
      this.input.value = words.join(' ') + (words.length === 1 ? ' ' : '');
    } else if (matches.length > 1) {
      this.output.append(this.text(matches.join('  ')));
    }
  }
}
