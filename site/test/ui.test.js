import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Card, Quest } from '../src/ui.js';

beforeEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
});

describe('Card', () => {
  it('renders a station card with external links in new tabs', () => {
    const root = document.createElement('aside');
    const onBack = vi.fn();
    const card = new Card(root, { onBack });
    card.open({
      kicker: 'Music',
      title: 'Noticing Icarus',
      body: ['One', 'Two'],
      list: [{ title: 'A', text: 'B' }],
      embed: { src: 'https://w.soundcloud.com/player/?url=x', height: 300 },
      links: [{ label: 'Go', href: 'https://example.com' }, { label: 'Résumé', href: './resume.html' }],
    });
    expect(card.isOpen).toBe(true);
    expect(root.querySelector('h2').textContent).toBe('Noticing Icarus');
    expect(root.querySelectorAll('.card > p')).toHaveLength(3); // kicker + 2 body
    expect(root.querySelector('iframe').getAttribute('src')).toContain('soundcloud');
    const [ext, local] = root.querySelectorAll('.links a');
    expect(ext.getAttribute('target')).toBe('_blank');
    expect(local.hasAttribute('target')).toBe(false);
    root.querySelector('.back').click();
    expect(onBack).toHaveBeenCalled();
  });

  it('drops the embed on close so audio stops', () => {
    const root = document.createElement('aside');
    const card = new Card(root, { onBack() {} });
    card.open({ title: 't', embed: { src: 'https://example.com' } });
    card.close();
    expect(card.isOpen).toBe(false);
    expect(root.querySelector('iframe')).toBeNull();
  });
});

describe('Quest', () => {
  const stations = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Bravo' },
  ];

  it('counts found stations and completes once', () => {
    const root = document.createElement('div');
    const onComplete = vi.fn();
    const quest = new Quest(root, { stations, onComplete });
    expect(root.textContent).toContain('0/2');
    quest.mark('a');
    quest.mark('a');
    quest.mark('nope');
    expect(root.textContent).toContain('1/2');
    quest.mark('b');
    expect(root.textContent).toContain('2/2');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('remembers progress across visits', () => {
    new Quest(document.createElement('div'), { stations, onComplete() {} }).mark('b');
    const root = document.createElement('div');
    new Quest(root, { stations, onComplete() {} });
    expect(root.textContent).toContain('1/2');
  });

  it('hides undiscovered names until found', () => {
    const root = document.createElement('div');
    const quest = new Quest(root, { stations, onComplete() {} });
    quest.mark('a');
    root.querySelector('.quest-toggle').click();
    const items = [...root.querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toEqual(['Alpha', '???']);
  });
});
