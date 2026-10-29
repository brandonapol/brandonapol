import { canvasTexture, rng } from './util.js';
import { profile } from './content.js';

export function planks() {
  const r = rng(7);
  return canvasTexture(
    1024,
    1024,
    (g, w, h) => {
      const rows = 14;
      const rowH = h / rows;
      for (let i = 0; i < rows; i++) {
        let x = -r() * 400;
        while (x < w) {
          const len = 260 + r() * 420;
          const shade = 128 + r() * 34;
          g.fillStyle = `rgb(${shade}, ${shade * 0.6}, ${shade * 0.33})`;
          g.fillRect(x, i * rowH, len, rowH);
          // grain
          g.strokeStyle = 'rgba(60,30,10,0.12)';
          for (let k = 0; k < 5; k++) {
            g.beginPath();
            const y = i * rowH + r() * rowH;
            g.moveTo(x, y);
            g.bezierCurveTo(x + len / 3, y + (r() - 0.5) * 8, x + (2 * len) / 3, y + (r() - 0.5) * 8, x + len, y);
            g.stroke();
          }
          g.fillStyle = 'rgba(30,15,5,0.45)';
          g.fillRect(x, i * rowH, 2, rowH);
          x += len;
        }
        g.fillStyle = 'rgba(30,15,5,0.4)';
        g.fillRect(0, i * rowH, w, 2);
      }
    },
    { repeat: [2, 2] },
  );
}

// Red and navy rug after the one in the living room.
export function rug() {
  return canvasTexture(512, 768, (g, w, h) => {
    g.fillStyle = '#5a1418';
    g.fillRect(0, 0, w, h);
    const bands = ['#1f2340', '#8b1e24', '#d9c9a8', '#1f2340'];
    bands.forEach((c, i) => {
      const m = 14 + i * 18;
      g.strokeStyle = c;
      g.lineWidth = 10;
      g.strokeRect(m, m, w - 2 * m, h - 2 * m);
    });
    // central medallion
    const cx = w / 2;
    const cy = h / 2;
    const diamond = (rx, ry, fill) => {
      g.fillStyle = fill;
      g.beginPath();
      g.moveTo(cx, cy - ry);
      g.lineTo(cx + rx, cy);
      g.lineTo(cx, cy + ry);
      g.lineTo(cx - rx, cy);
      g.closePath();
      g.fill();
    };
    diamond(180, 280, '#1f2340');
    diamond(150, 240, '#a3242b');
    diamond(100, 170, '#d9c9a8');
    diamond(70, 120, '#1f2340');
    diamond(30, 50, '#c8a24a');
    // little motifs
    g.fillStyle = '#d9c9a8';
    const r = rng(3);
    for (let i = 0; i < 60; i++) {
      const x = 90 + r() * (w - 180);
      const y = 90 + r() * (h - 180);
      if (Math.abs(x - cx) / 180 + Math.abs(y - cy) / 280 < 1.05) continue;
      g.fillRect(x, y, 6, 6);
    }
    // fringe
    g.fillStyle = '#e8ddc6';
    for (let x = 0; x < w; x += 6) {
      g.fillRect(x, 0, 2, 8);
      g.fillRect(x, h - 8, 2, 8);
    }
  });
}

// The view out the window: sky, trees, and the neighbor's white garage.
export function outdoors() {
  return canvasTexture(1024, 768, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#9cc4ea');
    sky.addColorStop(1, '#dcebf5');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    const r = rng(11);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `hsl(${95 + r() * 30}, ${35 + r() * 20}%, ${22 + r() * 18}%)`;
      g.beginPath();
      g.arc(r() * w, h * 0.15 + r() * h * 0.35, 40 + r() * 70, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#6f9a4a';
    g.fillRect(0, h * 0.62, w, h);
    // garage
    g.fillStyle = '#eef0f0';
    g.fillRect(w * 0.2, h * 0.38, w * 0.32, h * 0.26);
    g.beginPath();
    g.moveTo(w * 0.17, h * 0.4);
    g.lineTo(w * 0.36, h * 0.27);
    g.lineTo(w * 0.55, h * 0.4);
    g.fill();
    g.fillStyle = '#c9cfd2';
    g.fillRect(w * 0.27, h * 0.47, w * 0.18, h * 0.17);
    g.fillStyle = '#f4f4f2';
    g.fillRect(w * 0.68, h * 0.46, w * 0.14, h * 0.17);
  });
}

function terminalLines(g, lines, { x = 40, y = 100, size = 28, gap = 52 } = {}) {
  g.font = `${size}px ui-monospace, Menlo, monospace`;
  lines.forEach(([color, text], i) => {
    g.fillStyle = color;
    g.fillText(text, x, y + i * gap);
  });
}

export function mainScreen() {
  return canvasTexture(1024, 576, (g, w, h) => {
    g.fillStyle = '#12101c';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2540';
    g.fillRect(0, 0, w, 40);
    ['#ff6b6b', '#ffd166', '#5bd18b'].forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.arc(24 + i * 26, 20, 8, 0, Math.PI * 2);
      g.fill();
    });
    terminalLines(g, [
      ['#a78bfa', '$ whoami'],
      ['#e9e4f5', profile.name],
      ['#9d93b8', profile.role],
      ['#e9e4f5', ''],
      ['#a78bfa', '$ ls ~/links'],
      ['#e9e4f5', 'resume  autobutler  quark  birchwood'],
      ['#e9e4f5', ''],
      ['#a78bfa', '$ click to log in_'],
    ]);
  });
}

// Portrait monitor full of code, like the left screen in the photos.
export function codeScreen() {
  const r = rng(5);
  return canvasTexture(432, 768, (g, w, h) => {
    g.fillStyle = '#0f1620';
    g.fillRect(0, 0, w, h);
    const palette = ['#7aa2f7', '#9ece6a', '#bb9af7', '#e0af68', '#7dcfff', '#c0caf5'];
    for (let y = 30; y < h - 10; y += 18) {
      let x = 14 + Math.floor(r() * 4) * 16;
      const tokens = 1 + Math.floor(r() * 5);
      for (let t = 0; t < tokens && x < w - 20; t++) {
        const len = 20 + r() * 90;
        g.fillStyle = palette[Math.floor(r() * palette.length)];
        g.fillRect(x, y, len, 7);
        x += len + 10;
      }
    }
  });
}

export function laptopScreen(kind) {
  const r = rng(kind === 'map' ? 13 : 17);
  return canvasTexture(512, 320, (g, w, h) => {
    if (kind === 'map') {
      g.fillStyle = '#cfe0c3';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#7fa36b';
      for (let i = 0; i < 40; i++) {
        g.beginPath();
        g.moveTo(r() * w, r() * h);
        g.bezierCurveTo(r() * w, r() * h, r() * w, r() * h, r() * w, r() * h);
        g.stroke();
      }
      g.fillStyle = '#ffffff';
      g.fillRect(16, 16, 150, 110);
    } else {
      g.fillStyle = '#1b2440';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#8fb4ff';
      for (let y = 14; y < h; y += 14) g.fillRect(12, y, 60 + r() * 380, 5);
    }
  });
}

// Loose, painterly takes on the prints in the room. All public-domain originals.
export function starryNight() {
  const r = rng(21);
  return canvasTexture(512, 400, (g, w, h) => {
    g.fillStyle = '#1b2f6b';
    g.fillRect(0, 0, w, h);
    g.lineWidth = 6;
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = ['#3d5fb0', '#6c8fd6', '#9bb6e8', '#24408a'][i % 4];
      g.beginPath();
      const x = r() * w;
      const y = r() * h * 0.7;
      g.arc(x, y, 20 + r() * 60, r() * 6, r() * 6 + 2.5);
      g.stroke();
    }
    for (let i = 0; i < 11; i++) {
      const x = 40 + r() * (w - 80);
      const y = 30 + r() * h * 0.5;
      const glow = g.createRadialGradient(x, y, 2, x, y, 30);
      glow.addColorStop(0, '#fff7b0');
      glow.addColorStop(0.4, '#f2d14b');
      glow.addColorStop(1, 'rgba(242,209,75,0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x, y, 30, 0, Math.PI * 2);
      g.fill();
    }
    // moon
    g.fillStyle = '#ffd84a';
    g.beginPath();
    g.arc(w - 70, 60, 34, 0, Math.PI * 2);
    g.fill();
    // village and hills
    g.fillStyle = '#16244a';
    g.fillRect(0, h * 0.75, w, h);
    g.fillStyle = '#2d3f5c';
    for (let i = 0; i < 14; i++) g.fillRect(120 + i * 24, h * 0.72 + r() * 20, 18, 30);
    // cypress
    g.fillStyle = '#10180e';
    g.beginPath();
    g.moveTo(60, h);
    g.bezierCurveTo(40, h * 0.6, 90, h * 0.4, 80, h * 0.05);
    g.bezierCurveTo(120, h * 0.4, 130, h * 0.7, 120, h);
    g.fill();
  });
}

export function greatWave() {
  return canvasTexture(512, 360, (g, w, h) => {
    g.fillStyle = '#efe4cc';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d3b6e';
    g.beginPath();
    g.moveTo(0, h);
    g.bezierCurveTo(60, h * 0.5, 150, h * 0.1, 280, h * 0.15);
    g.bezierCurveTo(340, h * 0.18, 330, h * 0.35, 290, h * 0.38);
    g.bezierCurveTo(320, h * 0.55, 380, h * 0.75, w, h * 0.8);
    g.lineTo(w, h);
    g.fill();
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.arc(180 + i * 13, h * 0.13 + Math.sin(i) * 6, 9, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#8ea9c9';
    g.beginPath();
    g.moveTo(330, h * 0.82);
    g.lineTo(370, h * 0.62);
    g.lineTo(410, h * 0.82);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(358, h * 0.68);
    g.lineTo(370, h * 0.62);
    g.lineTo(382, h * 0.68);
    g.fill();
  });
}

export function landscape() {
  return canvasTexture(360, 460, (g, w, h) => {
    g.fillStyle = '#9fc2d8';
    g.fillRect(0, 0, w, h * 0.35);
    const hills = ['#5f8f3a', '#79a845', '#4b7a30', '#a0b94c', '#d38a3a'];
    hills.forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.moveTo(0, h * (0.3 + i * 0.13));
      g.bezierCurveTo(w * 0.3, h * (0.22 + i * 0.13), w * 0.6, h * (0.4 + i * 0.12), w, h * (0.28 + i * 0.13));
      g.lineTo(w, h);
      g.lineTo(0, h);
      g.fill();
    });
    g.fillStyle = '#f1efe6';
    g.fillRect(w * 0.55, h * 0.48, 40, 26);
    g.fillStyle = '#b5482e';
    g.beginPath();
    g.moveTo(w * 0.55 - 6, h * 0.48);
    g.lineTo(w * 0.55 + 20, h * 0.44);
    g.lineTo(w * 0.55 + 46, h * 0.48);
    g.fill();
  });
}

// Fan-art "Code Cop" poster: cop cap, aviators, the mustache. Obviously Prime.
export function codeCop() {
  return canvasTexture(600, 840, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1b1440');
    bg.addColorStop(1, '#3b1f6b');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    // rays
    g.save();
    g.translate(w / 2, h * 0.42);
    for (let i = 0; i < 24; i++) {
      g.rotate((Math.PI * 2) / 24);
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(167,139,250,0.10)';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(-40, -600);
      g.lineTo(40, -600);
      g.fill();
    }
    g.restore();

    const cx = w / 2;
    const cy = h * 0.44;
    // shoulders
    g.fillStyle = '#1c2b5a';
    g.beginPath();
    g.ellipse(cx, cy + 280, 250, 150, 0, Math.PI, 0);
    g.fill();
    // badge
    g.fillStyle = '#f5c542';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 ? 22 : 44;
      g.lineTo(cx + 120 + Math.cos(a) * rad, cy + 220 + Math.sin(a) * rad);
    }
    g.fill();
    g.fillStyle = '#3b2a00';
    g.font = 'bold 18px ui-monospace, monospace';
    g.textAlign = 'center';
    g.fillText(':wq', cx + 120, cy + 226);
    // head
    g.fillStyle = '#f0c3a0';
    g.beginPath();
    g.ellipse(cx, cy, 130, 160, 0, 0, Math.PI * 2);
    g.fill();
    // ears
    g.beginPath();
    g.ellipse(cx - 128, cy + 10, 22, 36, 0, 0, Math.PI * 2);
    g.ellipse(cx + 128, cy + 10, 22, 36, 0, 0, Math.PI * 2);
    g.fill();
    // cap
    g.fillStyle = '#16204a';
    g.beginPath();
    g.moveTo(cx - 150, cy - 80);
    g.quadraticCurveTo(cx, cy - 250, cx + 150, cy - 80);
    g.closePath();
    g.fill();
    g.fillStyle = '#0c1230';
    g.beginPath();
    g.ellipse(cx, cy - 78, 165, 28, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f5c542';
    g.beginPath();
    g.arc(cx, cy - 140, 20, 0, Math.PI * 2);
    g.fill();
    // aviators
    g.fillStyle = '#20232b';
    for (const side of [-1, 1]) {
      g.beginPath();
      g.ellipse(cx + side * 55, cy - 10, 50, 36, side * 0.15, 0, Math.PI * 2);
      g.fill();
    }
    g.fillRect(cx - 12, cy - 22, 24, 6);
    g.fillStyle = 'rgba(167,139,250,0.55)';
    for (const side of [-1, 1]) {
      g.beginPath();
      g.ellipse(cx + side * 62, cy - 22, 16, 8, -0.4, 0, Math.PI * 2);
      g.fill();
    }
    // THE mustache
    g.fillStyle = '#5a3418';
    g.beginPath();
    g.moveTo(cx, cy + 50);
    g.bezierCurveTo(cx - 40, cy + 30, cx - 100, cy + 40, cx - 110, cy + 95);
    g.bezierCurveTo(cx - 70, cy + 75, cx - 30, cy + 80, cx, cy + 72);
    g.bezierCurveTo(cx + 30, cy + 80, cx + 70, cy + 75, cx + 110, cy + 95);
    g.bezierCurveTo(cx + 100, cy + 40, cx + 40, cy + 30, cx, cy + 50);
    g.fill();
    // smirk
    g.strokeStyle = '#7a3b2a';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(cx + 10, cy + 100, 26, 0.2, Math.PI - 0.9);
    g.stroke();

    // title
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.font = '900 104px Impact, "Arial Black", sans-serif';
    g.fillText('CODE COP', cx, 120);
    g.fillStyle = '#f5c542';
    g.font = 'bold 34px ui-monospace, Menlo, monospace';
    g.fillText('SKILL ISSUE DETECTED', cx, h - 54);
  });
}

export function plate() {
  return canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = '#e9c341';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1d2c5e';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#1d2c5e';
    g.font = 'bold 18px sans-serif';
    g.textAlign = 'center';
    g.fillText('NEW YORK', w / 2, 30);
    g.font = 'bold 64px ui-monospace, monospace';
    g.fillText('5261-NY', w / 2, 100);
  });
}

export function photoPlaceholder(i) {
  const hues = [265, 200, 30, 140, 340, 50];
  return canvasTexture(256, 320, (g, w, h) => {
    const hue = hues[i % hues.length];
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `hsl(${hue}, 35%, 55%)`);
    grad.addColorStop(1, `hsl(${hue + 30}, 40%, 30%)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath();
    g.moveTo(0, h * 0.75);
    g.lineTo(w * 0.35, h * 0.45);
    g.lineTo(w * 0.6, h * 0.65);
    g.lineTo(w * 0.8, h * 0.4);
    g.lineTo(w, h * 0.7);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.fill();
    g.beginPath();
    g.arc(w * 0.72, h * 0.22, 18, 0, Math.PI * 2);
    g.fill();
  });
}

export function recordSleeves() {
  const r = rng(31);
  return canvasTexture(512, 128, (g, w, h) => {
    let x = 0;
    while (x < w) {
      const t = 6 + r() * 10;
      g.fillStyle = `hsl(${r() * 360}, ${30 + r() * 40}%, ${25 + r() * 40}%)`;
      g.fillRect(x, 0, t, h);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(x + t - 1, 0, 1, h);
      x += t;
    }
  });
}
