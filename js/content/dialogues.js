// Dialogue templates. Each returns an array of DOM nodes built with el().
// No innerHTML / outerHTML anywhere.

import { el, br, strong } from '../util/dom.js';
import { contact } from './contact.js';
import { featured, otherProjects } from './projects.js';
import { experience } from './experience.js';
import { education, certifications } from './education.js';

const SKILLS = [
  { name: 'Laravel / PHP',              pct: 95 },
  { name: 'React.js / Vue.js',          pct: 90 },
  { name: 'Node.js',                    pct: 85 },
  { name: 'MySQL / PostgreSQL',         pct: 90 },
  { name: 'OpenAI · Claude · Gemini',   pct: 92 },
  { name: 'n8n · MCP automation',       pct: 88 },
  { name: 'TailwindCSS',                pct: 85 },
  { name: 'Git · CI/CD',                pct: 82 }
];

function titleBar(pre, accent, post) {
  const h = el('h2', null, pre ? pre + ' ' : '');
  h.appendChild(el('span', { class: 'accent' }, accent));
  if (post) h.appendChild(document.createTextNode(' ' + post));
  return h;
}

function chip(text, pro) {
  return el('span', { class: pro ? 'chip pro' : 'chip' }, text);
}

function chipRow(items, pro) {
  const row = el('p', null);
  for (const t of items) row.appendChild(chip(t, pro));
  return row;
}

function row(label, value) {
  const r = el('div', { class: 'row' });
  r.appendChild(el('span', { class: 'label' }, label));
  if (typeof value === 'string') r.appendChild(document.createTextNode(value));
  else r.appendChild(value);
  return r;
}

function link(href, label, external) {
  const attrs = external
    ? { href, target: '_blank', rel: 'noopener' }
    : { href };
  return el('a', attrs, label);
}

function skillBar(s) {
  const meter = el('span', { class: 'meter', style: '--pct:' + s.pct + '%' });
  return el('div', { class: 'bar' },
    el('span', { class: 'name' }, s.name),
    meter,
    el('span', { class: 'pct' }, s.pct + '%')
  );
}

function metric(num, caption) {
  return el('div', { class: 'metric' },
    el('div', { class: 'num' }, num),
    el('div', { class: 'caption' }, caption)
  );
}

function metricsGrid(items) {
  const g = el('div', { class: 'metrics' });
  for (const m of items) g.appendChild(metric(m.num, m.caption));
  return g;
}

function bulletList(bullets) {
  const ul = el('ul');
  for (const b of bullets) ul.appendChild(el('li', null, b));
  return ul;
}

function projectBlock(p, isFeatured) {
  const block = el('div', { class: isFeatured ? 'entry pro' : 'entry' });
  block.appendChild(el('h3', null, p.name));
  block.appendChild(el('div', { class: 'period' }, (p.period || '') + ' · ' + (p.company || '')));
  block.appendChild(el('p', null, p.summary));
  block.appendChild(chipRow(p.stack, isFeatured));
  if (p.bullets && p.bullets.length) block.appendChild(bulletList(p.bullets));
  if (p.url) block.appendChild(el('p', null, link(p.url, p.url, true)));
  if (p.metrics && p.metrics.length) block.appendChild(metricsGrid(p.metrics));
  return block;
}

function closingHint() {
  return el('div', { class: 'hint-close' }, 'walk away to close');
}

export const DIALOGUES = {
  plaza: () => [
    titleBar('', contact.name, '— Senior Full Stack Engineer'),
    el('p', null, '5+ years building and scaling ', strong('AI-integrated SaaS platforms'),
      '. Architected ', strong('GravityWrite'), ' from zero to ',
      strong('300,000+ active users'),
      ' on Laravel + React + a multi-provider LLM stack (OpenAI · Claude · Gemini).'),
    el('p', null,
      'Full-stack ownership across database design, API architecture, and shipped features. ',
      'Track record of cutting backend response times, leading engineering teams, and shipping open-source tooling.'),
    row('Based in', contact.location),
    row('Reach', link('mailto:' + contact.email, contact.email, false)),
    el('p', null,
      chip('Laravel'), chip('React.js'), chip('Node.js'), chip('OpenAI'),
      chip('Claude'), chip('Gemini'), chip('n8n'), chip('MCP')
    ),
    closingHint()
  ],

  notice: () => [
    titleBar('The Notice Board —', 'Resume'),
    el('p', null,
      'A weathered scroll is pinned to the board. It contains the full resume: ',
      strong('skills'), ', ', strong('experience'), ', ', strong('projects'),
      ', and ', strong('education'), '.'),
    el('p', null, 'Press ', strong('[E]'), ' or tap ', strong('ACT'),
      ' to download the resume as a PDF.'),
    closingHint()
  ],

  forge: () => {
    const out = [ titleBar('The Skill Forge —', 'Tech Stack') ];
    for (const s of SKILLS) out.push(skillBar(s));
    out.push(el('p', { style: 'margin-top:14px' },
      chip('SOLID'), chip('REST API'), chip('MCP'), chip('Prompt Engineering'),
      chip('Agent Building'), chip('CI/CD')));
    out.push(closingHint());
    return out;
  },

  citadel: () => [
    titleBar('GravityWrite Citadel —', 'Featured'),
    el('p', null, strong(featured.name), ' — ', featured.tagline),
    el('p', null, featured.summary),
    row('Role', featured.role),
    row('Company', featured.company),
    row('Period', featured.period),
    chipRow(featured.stack, true),
    bulletList(featured.bullets),
    metricsGrid(featured.metrics),
    el('p', { style: 'margin-top:12px' }, link(featured.url, featured.url, true)),
    closingHint()
  ],

  broadcast:  () => projectDialogue('broadcast',  'Broadcast Tower —', 'GravitySocial'),
  gateway:    () => projectDialogue('gateway',    'The Gateway —',     'GravityAuth'),
  transport:  () => projectDialogue('transport',  'Transport Hub —',   'TransGenie'),
  temple:     () => projectDialogue('temple',     'Open-Source Temple —', 'Laravel AI Agent'),
  workshop:   () => projectDialogue('workshop',   'Builder\u2019s Workshop —', '1CLX'),

  freshnote: () => {
    const job = experience.find(j => j.id === 'freshnote');
    return [
      titleBar('Freshnote Studio —', 'Early Career'),
      el('div', { class: 'period' }, job.period + ' · ' + job.company),
      row('Role', job.title),
      row('Where', job.location),
      el('p', null, 'First full-stack chapter. Sole developer across ',
        strong('5+ client projects'),
        ' from requirements gathering to production deployment — no oversight, no safety net.'),
      chipRow(job.stack),
      bulletList(job.bullets),
      closingHint()
    ];
  },

  library: () => {
    const out = [ titleBar('The Library —', 'Experience') ];
    for (const job of experience) {
      const e = el('div', { class: 'entry' });
      e.appendChild(el('h3', null, job.title));
      e.appendChild(el('div', { class: 'period' }, job.period + ' · ' + job.company + ' · ' + job.location));
      e.appendChild(chipRow(job.stack));
      e.appendChild(bulletList(job.bullets));
      out.push(e);
    }
    out.push(closingHint());
    return out;
  },

  academy: () => {
    const out = [ titleBar('The Academy —', 'Education') ];
    for (const ed of education) {
      out.push(el('div', { class: 'entry' },
        el('h3', null, ed.degree),
        el('div', { class: 'period' }, ed.period + ' · ' + ed.institution)
      ));
    }
    out.push(el('h2', { style: 'margin-top:18px' }, 'Certifications'));
    for (const cert of certifications) {
      out.push(el('div', { class: 'entry' },
        el('h3', null, cert.name),
        el('div', { class: 'period' }, cert.period + ' · ' + cert.institution)
      ));
    }
    out.push(closingHint());
    return out;
  },

  lighthouse: () => [
    titleBar('The Lighthouse —', 'Contact'),
    el('p', null, 'Always up for ', strong('senior full-stack'),
      ' or ', strong('AI-integrated product'), ' work. Reach any channel below — all active.'),
    row('Email',    link('mailto:' + contact.email, contact.email, false)),
    row('Phone',    link('tel:' + contact.phone.replace(/\s/g, ''), contact.phone, false)),
    row('LinkedIn', link(contact.linkedin.url, contact.linkedin.label, true)),
    row('GitHub',   link(contact.github.url,   contact.github.label,   true)),
    row('Location', contact.location),
    closingHint()
  ],

  milestones: () => [
    titleBar('Milestones —', 'Numbers'),
    el('p', null, 'Five years of measurable outcomes — not output-of-effort bullet points, ',
      'but real, verifiable delivery metrics.'),
    metricsGrid([
      { num: '300K+',  caption: 'GravityWrite active users' },
      { num: '5+',     caption: 'Years full-stack' },
      { num: '5',      caption: 'Dev squad led (Sparkout + 1CLX)' },
      { num: '15+',    caption: 'PRs reviewed per sprint' },
      { num: '50%',    caption: 'Media search time cut (GravitySocial)' },
      { num: '3',      caption: 'LLM providers unified' },
      { num: 'OSS',    caption: 'Laravel AI Agent — public + maintained' },
      { num: 'MCP',    caption: 'Custom n8n tool — automated pipelines' }
    ]),
    closingHint()
  ]
};

function projectDialogue(zoneId, titlePre, titleAccent) {
  const p = otherProjects.find(x => x.zoneId === zoneId) || featured;
  return [
    titleBar(titlePre, titleAccent),
    el('p', null, strong(p.name), ' — ', p.tagline),
    el('p', null, p.summary),
    row('Role', p.company === 'Personal · Open Source' ? 'Sole author' : 'Engineer'),
    row('Company', p.company),
    row('Period', p.period),
    chipRow(p.stack),
    bulletList(p.bullets),
    p.metrics && p.metrics.length ? metricsGrid(p.metrics) : el('p', null),
    p.url ? el('p', { style: 'margin-top:12px' }, link(p.url, p.url, true)) : el('p', null),
    closingHint()
  ];
}
