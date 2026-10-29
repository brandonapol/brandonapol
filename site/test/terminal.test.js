import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Terminal } from '../src/terminal.js';

let root;
let term;
let onExit;

const output = () => root.querySelector('.output').textContent;
const type = (text, key = 'Enter') => {
  const input = root.querySelector('.input');
  input.value = text;
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
};

beforeEach(() => {
  root = document.createElement('section');
  root.hidden = true;
  document.body.replaceChildren(root);
  onExit = vi.fn();
  term = new Terminal(root, { onExit });
});

describe('Terminal', () => {
  it('opens with whoami already run', () => {
    term.open();
    expect(term.isOpen).toBe(true);
    expect(output()).toContain('Brandon Apol');
  });

  it('prints work history for cat resume', () => {
    type('cat resume');
    expect(output()).toContain('Radiance Technologies');
    expect(root.querySelector('.output a[href="./resume.html"]')).not.toBeNull();
  });

  it('lists projects as links', () => {
    type('ls projects');
    const hrefs = [...root.querySelectorAll('.output a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://autobutler.org');
    expect(hrefs).toContain('https://birchwood.lol');
  });

  it('opens a named link in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    type('open autobutler');
    expect(open).toHaveBeenCalledWith('https://autobutler.org', '_blank', 'noopener');
  });

  it('runs commands from the chips', () => {
    [...root.querySelectorAll('.chips button')].find((b) => b.textContent === 'contact').click();
    expect(output()).toContain('LinkedIn');
  });

  it('tab-completes commands and arguments', () => {
    const input = root.querySelector('.input');
    type('who', 'Tab');
    expect(input.value).toBe('whoami ');
    type('open auto', 'Tab');
    expect(input.value).toBe('open autobutler');
  });

  it('walks back through history', () => {
    type('help');
    type('ls projects');
    const input = root.querySelector('.input');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(input.value).toBe('ls projects');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(input.value).toBe('help');
  });

  it('exits on exit and on Escape', () => {
    type('exit');
    type('', 'Escape');
    expect(onExit).toHaveBeenCalledTimes(2);
  });

  it('clears the screen', () => {
    type('help');
    type('clear');
    expect(output()).toBe('');
  });
});
