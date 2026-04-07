/**
 * @typedef {import('./marketingAggregate.js').MarketingReport} MarketingReport
 * @typedef {import('./marketingAggregate.js').UserCommentProfile} UserCommentProfile
 */

import { escapeHtml } from './htmlEscape.js';

/**
 * @param {MarketingReport} r
 * @returns {string}
 */
export function buildMarketingDashboardHtml(r) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>配信マーケ分析 — ${escapeHtml(r.liveId)}</title>
<style>${CSS_BODY}</style>
</head>
<body>
<header class="mkt-header">
<h1 class="mkt-header__title">📊 配信マーケティング分析</h1>
<p class="mkt-header__sub">${escapeHtml(r.liveId)} — ${new Date().toLocaleString('ja-JP')} 出力</p>
</header>
<main class="mkt-main">
${sectionKpi(r)}
${sectionTimeline(r)}
${sectionSegment(r)}
${sectionTopUsers(r)}
${sectionHourHeatmap(r)}
</main>
<footer class="mkt-footer">nicolivelog marketing analytics — generated at ${new Date().toISOString()}</footer>
</body></html>`;
}

/** @param {MarketingReport} r */
function sectionKpi(r) {
  const cards = [
    { label: '総コメント数', value: r.totalComments.toLocaleString(), icon: '💬' },
    { label: 'ユニークユーザー', value: r.uniqueUsers.toLocaleString(), icon: '👥' },
    { label: 'コメント/分', value: String(r.commentsPerMinute), icon: '⚡' },
    { label: '平均コメント/人', value: String(r.avgCommentsPerUser), icon: '📈' },
    { label: '中央値/人', value: String(r.medianCommentsPerUser), icon: '📊' },
    { label: '配信時間', value: `${r.durationMinutes} 分`, icon: '⏱️' },
    { label: 'ピーク分', value: `${r.peakMinute} 分目（${r.peakMinuteCount} コメ）`, icon: '🔥' }
  ];
  const inner = cards
    .map(
      (c) =>
        `<div class="mkt-kpi"><span class="mkt-kpi__icon">${c.icon}</span><span class="mkt-kpi__val">${escapeHtml(c.value)}</span><span class="mkt-kpi__label">${escapeHtml(c.label)}</span></div>`
    )
    .join('');
  return `<section class="mkt-section"><h2>KPI サマリ</h2><div class="mkt-kpi-grid">${inner}</div></section>`;
}

/** @param {MarketingReport} r */
function sectionTimeline(r) {
  const tl = r.timeline;
  if (tl.length < 2) return '';
  const maxC = Math.max(1, ...tl.map((b) => b.count));
  const maxU = Math.max(1, ...tl.map((b) => b.uniqueUsers));
  const W = 900;
  const H = 220;
  const pad = 40;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const n = tl.length;

  const barW = Math.max(1, Math.min(8, innerW / n - 1));
  const bars = tl
    .map((b, i) => {
      const x = pad + (innerW * i) / n;
      const h = (b.count / maxC) * innerH;
      return `<rect x="${x.toFixed(1)}" y="${(pad + innerH - h).toFixed(1)}" width="${barW}" height="${h.toFixed(1)}" fill="#3b82f6" opacity="0.6"><title>${b.minute}分: ${b.count}コメ / ${b.uniqueUsers}人</title></rect>`;
    })
    .join('');

  const linePts = tl
    .map((b, i) => {
      const x = pad + (innerW * i) / n + barW / 2;
      const y = pad + innerH - (b.uniqueUsers / maxU) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const yLabelsC = Array.from({ length: 5 }, (_, i) => {
    const v = Math.round((maxC * (4 - i)) / 4);
    const y = pad + (innerH * i) / 4;
    return `<text x="${pad - 4}" y="${y + 4}" text-anchor="end" class="mkt-axis">${v}</text>`;
  }).join('');

  const xLabels = tl
    .filter((_, i) => i % Math.max(1, Math.floor(n / 10)) === 0)
    .map((b) => {
      const x = pad + (innerW * b.minute) / n + barW / 2;
      return `<text x="${x.toFixed(1)}" y="${H - 4}" text-anchor="middle" class="mkt-axis">${b.minute}m</text>`;
    })
    .join('');

  return `<section class="mkt-section">
<h2>コメントタイムライン</h2>
<p class="mkt-note">青バー＝コメント数/分 / オレンジ線＝ユニークユーザー数/分</p>
<div class="mkt-chart-wrap">
<svg viewBox="0 0 ${W} ${H}" class="mkt-svg">
<rect x="${pad}" y="${pad}" width="${innerW}" height="${innerH}" fill="none" stroke="#334155" stroke-width="0.5"/>
${yLabelsC}${xLabels}${bars}
<polyline points="${linePts}" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
</svg>
</div></section>`;
}

/** @param {MarketingReport} r */
function sectionSegment(r) {
  const s = r.segmentCounts;
  const total = Math.max(1, s.heavy + s.mid + s.light + s.once);
  const segs = [
    { label: 'ヘビー（10+）', count: s.heavy, color: '#ef4444' },
    { label: 'ミドル（4-9）', count: s.mid, color: '#f97316' },
    { label: 'ライト（2-3）', count: s.light, color: '#3b82f6' },
    { label: '一見（1）', count: s.once, color: '#94a3b8' }
  ];

  const R = 80;
  const cx = 100;
  const cy = 100;
  let cumAngle = -Math.PI / 2;
  const paths = segs
    .map((sg) => {
      const pct = sg.count / total;
      if (pct <= 0) return '';
      const angle = pct * 2 * Math.PI;
      const x1 = cx + R * Math.cos(cumAngle);
      const y1 = cy + R * Math.sin(cumAngle);
      cumAngle += angle;
      const x2 = cx + R * Math.cos(cumAngle);
      const y2 = cy + R * Math.sin(cumAngle);
      const large = angle > Math.PI ? 1 : 0;
      return `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${sg.color}"><title>${sg.label}: ${sg.count}人 (${(pct * 100).toFixed(1)}%)</title></path>`;
    })
    .join('');

  const legend = segs
    .map(
      (sg) =>
        `<span class="mkt-leg"><span class="mkt-leg__dot" style="background:${sg.color}"></span>${escapeHtml(sg.label)} ${sg.count}人</span>`
    )
    .join('');

  return `<section class="mkt-section">
<h2>ユーザーセグメント</h2>
<p class="mkt-note">コメント回数でユーザーを4層に分類</p>
<div class="mkt-seg-wrap">
<svg viewBox="0 0 200 200" class="mkt-pie">${paths}</svg>
<div class="mkt-seg-legend">${legend}</div>
</div></section>`;
}

/** @param {MarketingReport} r */
function sectionTopUsers(r) {
  if (r.topUsers.length === 0) return '';
  const maxCount = r.topUsers[0].count;
  const rows = r.topUsers.slice(0, 20)
    .map((u, i) => {
      const pct = (u.count / Math.max(1, maxCount)) * 100;
      const avImg = u.avatarUrl
        ? `<img src="${escapeHtml(u.avatarUrl)}" class="mkt-rank-av" alt="" loading="lazy">`
        : '<span class="mkt-rank-av mkt-rank-av--empty"></span>';
      const name = u.nickname || u.userId || '—';
      return `<tr>
<td class="mkt-rank-n">${i + 1}</td>
<td>${avImg}</td>
<td class="mkt-rank-name">${escapeHtml(name)}</td>
<td class="mkt-rank-bar"><div class="mkt-rank-bar__fill" style="width:${pct.toFixed(1)}%"></div><span class="mkt-rank-bar__label">${u.count}</span></td>
</tr>`;
    })
    .join('');

  return `<section class="mkt-section">
<h2>トップコメンター TOP 20</h2>
<table class="mkt-rank-table"><tbody>${rows}</tbody></table>
</section>`;
}

/** @param {MarketingReport} r */
function sectionHourHeatmap(r) {
  const max = Math.max(1, ...r.hourDistribution);
  const cells = r.hourDistribution
    .map((v, h) => {
      const intensity = v / max;
      const alpha = Math.max(0.08, intensity);
      return `<div class="mkt-hour" style="background:rgba(59,130,246,${alpha.toFixed(2)})" title="${h}時: ${v}件"><span class="mkt-hour__label">${h}</span><span class="mkt-hour__val">${v}</span></div>`;
    })
    .join('');
  return `<section class="mkt-section">
<h2>時間帯ヒートマップ</h2>
<p class="mkt-note">コメントが多い時間帯ほど濃い青</p>
<div class="mkt-hour-grid">${cells}</div>
</section>`;
}

const CSS_BODY = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:'Segoe UI','Hiragino Sans',sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.6}
.mkt-header{padding:2rem 1.5rem 1rem;background:linear-gradient(135deg,#1e293b,#0f172a);border-bottom:1px solid #334155}
.mkt-header__title{margin:0;font-size:1.6rem;font-weight:700}
.mkt-header__sub{margin:.3rem 0 0;font-size:.85rem;color:#94a3b8}
.mkt-main{max-width:960px;margin:0 auto;padding:1.5rem 1rem}
.mkt-section{background:#1e293b;border-radius:12px;padding:1.2rem 1.4rem;margin-bottom:1.2rem;border:1px solid #334155}
.mkt-section h2{margin:0 0 .8rem;font-size:1.1rem;color:#f8fafc;border-left:4px solid #3b82f6;padding-left:.6rem}
.mkt-note{font-size:.78rem;color:#94a3b8;margin:0 0 .6rem}
.mkt-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.8rem}
.mkt-kpi{background:#0f172a;border-radius:10px;padding:.8rem;text-align:center;border:1px solid #334155}
.mkt-kpi__icon{font-size:1.4rem;display:block}
.mkt-kpi__val{font-size:1.3rem;font-weight:700;display:block;color:#f8fafc}
.mkt-kpi__label{font-size:.72rem;color:#94a3b8}
.mkt-chart-wrap{overflow-x:auto}
.mkt-svg{width:100%;height:auto;max-height:260px}
.mkt-axis{font-size:10px;fill:#94a3b8}
.mkt-seg-wrap{display:flex;align-items:center;gap:2rem;flex-wrap:wrap}
.mkt-pie{width:180px;height:180px;flex-shrink:0}
.mkt-seg-legend{display:flex;flex-direction:column;gap:.5rem}
.mkt-leg{display:flex;align-items:center;gap:.4rem;font-size:.85rem}
.mkt-leg__dot{width:12px;height:12px;border-radius:3px;flex-shrink:0}
.mkt-rank-table{width:100%;border-collapse:collapse}
.mkt-rank-table td{padding:.35rem .4rem;border-bottom:1px solid #1e293b}
.mkt-rank-n{width:2rem;color:#64748b;text-align:right;font-size:.8rem}
.mkt-rank-av{width:28px;height:28px;border-radius:50%;object-fit:cover;display:block}
.mkt-rank-av--empty{background:#334155}
.mkt-rank-name{font-size:.85rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mkt-rank-bar{position:relative;height:22px;background:#0f172a;border-radius:4px;overflow:hidden}
.mkt-rank-bar__fill{height:100%;background:linear-gradient(90deg,#3b82f6,#6366f1);border-radius:4px}
.mkt-rank-bar__label{position:absolute;right:6px;top:2px;font-size:.75rem;color:#f8fafc;font-weight:600}
.mkt-hour-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:4px}
.mkt-hour{border-radius:6px;text-align:center;padding:.5rem .2rem;min-height:52px;display:flex;flex-direction:column;justify-content:center;border:1px solid #334155}
.mkt-hour__label{font-size:.7rem;color:#94a3b8}
.mkt-hour__val{font-size:.9rem;font-weight:600}
.mkt-footer{text-align:center;padding:1.5rem;font-size:.72rem;color:#475569}
@media(max-width:640px){
  .mkt-kpi-grid{grid-template-columns:repeat(2,1fr)}
  .mkt-hour-grid{grid-template-columns:repeat(6,1fr)}
  .mkt-seg-wrap{flex-direction:column;align-items:flex-start}
}
`;
