/**
 * 追憶の煌めき LP 用 OG 画像（1200×630）を生成する。
 * 実行: node tools/render-og.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'extension', 'images', 'logo', 'kimito-link-ginga-color.png');
const outPath = path.join(root, 'tsuioku-no-kirameki', 'images', 'og-image.png');

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error('Logo not found:', logoPath);
    process.exit(1);
  }

  const logoB64 = fs.readFileSync(logoPath).toString('base64');
  const logoData = 'data:image/png;base64,' + logoB64;

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@500;700;900&family=Noto+Sans+JP:wght@400;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  width: 1200px;
  height: 630px;
  background: radial-gradient(ellipse 120% 100% at 20% 30%, #162848 0%, #0c1528 38%, #060a12 100%);
  font-family: "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif;
  color: #eef4ff;
  position: relative;
  overflow: hidden;
}

/* --- Starfield --- */
body::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1.4px 1.4px at 6% 14%, rgba(255,255,255,.6), transparent),
    radial-gradient(1px 1px at 18% 7%, rgba(255,255,255,.4), transparent),
    radial-gradient(1.6px 1.6px at 32% 22%, rgba(200,220,255,.7), transparent),
    radial-gradient(1px 1px at 48% 5%, rgba(255,255,255,.35), transparent),
    radial-gradient(1.2px 1.2px at 55% 68%, rgba(255,255,255,.5), transparent),
    radial-gradient(1px 1px at 72% 15%, rgba(200,210,255,.45), transparent),
    radial-gradient(1.4px 1.4px at 85% 42%, rgba(255,255,255,.55), transparent),
    radial-gradient(1px 1px at 91% 78%, rgba(255,255,255,.3), transparent),
    radial-gradient(1.2px 1.2px at 15% 82%, rgba(200,220,255,.35), transparent),
    radial-gradient(1px 1px at 65% 88%, rgba(255,255,255,.4), transparent),
    radial-gradient(1.6px 1.6px at 42% 45%, rgba(200,215,255,.5), transparent),
    radial-gradient(1px 1px at 78% 62%, rgba(255,255,255,.35), transparent);
  pointer-events: none;
}

/* --- Shooting star --- */
.shoot {
  position: absolute;
  top: 12%;
  right: 8%;
  width: 320px;
  height: 2.5px;
  background: linear-gradient(90deg, transparent 0%, rgba(200,220,255,.06) 20%, rgba(127,200,255,.85) 70%, rgba(255,255,255,.95) 100%);
  transform: rotate(-28deg);
  border-radius: 2px;
  filter: blur(.3px);
  box-shadow: 0 0 18px rgba(127,200,255,.4), 0 0 60px rgba(127,200,255,.15);
}
.shoot::after {
  content: "";
  position: absolute;
  right: -2px;
  top: -2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.9);
  box-shadow: 0 0 12px rgba(200,230,255,.8);
}

/* --- Constellation lines --- */
.constellation {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.constellation line {
  stroke: rgba(127,180,220,.12);
  stroke-width: 1;
}
.constellation circle {
  fill: rgba(200,220,255,.5);
}

/* --- Subtle glow orb --- */
.glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79,140,200,.12) 0%, transparent 70%);
  top: 50%;
  left: 15%;
  transform: translate(-50%, -50%);
  filter: blur(40px);
}

/* --- Logo --- */
.logo {
  position: absolute;
  top: 38px;
  right: 52px;
  height: 150px;
  width: auto;
  object-fit: contain;
  opacity: .18;
  filter: brightness(2) saturate(.3);
}

/* --- Main content --- */
.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 60px 72px;
  max-width: 860px;
}

.eyebrow {
  font-family: "Noto Sans JP", sans-serif;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: .16em;
  color: rgba(200,180,140,.7);
  margin-bottom: 20px;
  text-transform: uppercase;
}

.title {
  font-size: 72px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: .06em;
  margin-bottom: 28px;
  text-shadow: 0 4px 40px rgba(79,140,200,.3), 0 1px 0 rgba(0,0,0,.4);
}
.title .accent {
  background: linear-gradient(135deg, #f8ddb4 20%, #c98e2b 60%, #e8b86a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-family: "Noto Serif JP", serif;
  font-size: 26px;
  font-weight: 500;
  line-height: 1.65;
  letter-spacing: .04em;
  color: rgba(220,230,245,.82);
  max-width: 680px;
}

.brand {
  position: absolute;
  bottom: 42px;
  left: 72px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: "Noto Sans JP", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: rgba(200,210,230,.5);
  letter-spacing: .08em;
}
.brand .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(200,180,140,.5);
}

/* --- Bottom accent line --- */
.bottom-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(200,180,140,.3) 30%, rgba(79,140,200,.4) 70%, transparent);
}
</style>
</head>
<body>
  <div class="shoot" aria-hidden="true"></div>
  <div class="glow" aria-hidden="true"></div>

  <svg class="constellation" aria-hidden="true" viewBox="0 0 1200 630">
    <line x1="820" y1="180" x2="920" y2="240"/>
    <line x1="920" y1="240" x2="980" y2="190"/>
    <line x1="920" y1="240" x2="950" y2="320"/>
    <line x1="950" y1="320" x2="1040" y2="350"/>
    <line x1="1040" y1="350" x2="1080" y2="300"/>
    <line x1="1040" y1="350" x2="1020" y2="430"/>
    <circle cx="820" cy="180" r="2.2"/>
    <circle cx="920" cy="240" r="2.8"/>
    <circle cx="980" cy="190" r="2"/>
    <circle cx="950" cy="320" r="2.4"/>
    <circle cx="1040" cy="350" r="2.6"/>
    <circle cx="1080" cy="300" r="2"/>
    <circle cx="1020" cy="430" r="2.2"/>

    <line x1="100" y1="520" x2="180" y2="480"/>
    <line x1="180" y1="480" x2="260" y2="510"/>
    <circle cx="100" cy="520" r="1.8"/>
    <circle cx="180" cy="480" r="2.2"/>
    <circle cx="260" cy="510" r="1.8"/>
  </svg>

  <img class="logo" src="${logoData}" alt="" />

  <div class="content">
    <div class="eyebrow">Kimito-Link Project</div>
    <h1 class="title">
      <span class="accent">追憶</span>の<span class="accent">煌めき</span>
    </h1>
    <p class="tagline">
      流れ星みたいに消えていくコメントを、<br>
      星座みたいに、つながりが残る世界へ。
    </p>
  </div>

  <div class="brand">
    tsuioku-no-kirameki.com
    <span class="dot"></span>
    Web・iOS・Android・Chrome 拡張
  </div>
  <div class="bottom-line" aria-hidden="true"></div>
</body>
</html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();
  console.log('Wrote', outPath);
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
