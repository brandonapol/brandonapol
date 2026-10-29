import { describe, expect, it } from 'vitest';
import { stations, links, projects, experience, finale } from '../src/content.js';

const CARD_STATIONS = ['keyboard', 'cooler', 'guitar', 'records', 'climbs', 'topo', 'poster', 'pad', 'lavalamp', 'doorway'];

describe('content', () => {
  it('names and hints every station', () => {
    for (const [id, s] of Object.entries(stations)) {
      expect(s.name, id).toBeTruthy();
      expect(s.hint, id).toBeTruthy();
    }
  });

  it('gives every card station a title and body', () => {
    for (const id of CARD_STATIONS) {
      expect(stations[id].title, id).toBeTruthy();
      expect(stations[id].body?.length, id).toBeGreaterThan(0);
    }
  });

  it('points the stations at the right places', () => {
    expect(stations.cooler.links[0].href).toBe('https://birchwood.lol');
    expect(stations.keyboard.links[0].href).toBe('https://x.com/ThePrimeagen/status/1952838755288793106');
    expect(stations.guitar.embed.src).toContain('soundcloud.com/noticing-icarus-363880582');
    expect(stations.guitar.body.join(' ')).toMatch(/songwriters/);
    expect(stations.topo.kicker).toMatch(/Chugach/);
  });

  it('only uses https or site-relative links', () => {
    const all = [
      ...Object.values(links).map((l) => l.href),
      ...projects.map((p) => p.href),
      ...Object.values(stations).flatMap((s) => (s.links ?? []).map((l) => l.href)),
      ...finale.links.map((l) => l.href),
    ];
    for (const href of all) expect(href).toMatch(/^(https:\/\/|\.\/)/);
  });

  it('has work history in reverse order', () => {
    expect(experience[0].title).toMatch(/Site Reliability/);
    expect(experience.at(-1).title).toMatch(/Music/);
  });
});
