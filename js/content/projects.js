// Every resume project gets full-fat detail here. Buildings + dialogues read this.

export const featured = {
  id: 'gravitywrite',
  zoneId: 'citadel',
  name: 'GravityWrite',
  tagline: 'Multi-Provider AI Content SaaS',
  url: 'https://app.gravitywrite.com',
  company: 'Website Learners Pvt Ltd',
  role: 'Lead Full Stack Engineer',
  period: '2024 – Present',
  stack: ['Laravel', 'React.js', 'Node.js', 'OpenAI', 'Claude', 'Gemini', 'n8n', 'MySQL'],
  themeColor: 0x7cc7ff,
  accentColor: 0xb48cff,
  summary:
    'AI content generation platform scaled from zero to 300,000+ active users. ' +
    'Long-form blogs, ad copy, and social variants across OpenAI, Claude, and Gemini ' +
    'with runtime model switching and MCP-powered automation.',
  bullets: [
    'Architected and shipped GravityWrite end-to-end on Laravel + React.',
    'Multi-provider LLM stack (OpenAI · Claude · Gemini) with runtime model switching.',
    'Custom MCP tool embedded into n8n workflows - prompt-to-post pipelines run unattended.',
    'Database design, API architecture, billing, workspaces, model orchestration.'
  ],
  metrics: [
    { num: '300K+',  caption: 'Active users' },
    { num: '3',      caption: 'LLM providers' },
    { num: '0 → 1',  caption: 'Architected from scratch' }
  ]
};

export const otherProjects = [
  {
    id: 'gravitysocial',
    zoneId: 'broadcast',
    name: 'GravitySocial',
    tagline: 'AI Social Media Scheduler',
    url: 'https://social.gravitywrite.com',
    company: 'Website Learners Pvt Ltd',
    period: '2025',
    stack: ['Laravel', 'Vue.js', 'Node.js', 'OpenAI', 'Claude', 'n8n', 'MySQL'],
    themeColor: 0xff8a55,
    accentColor: 0xf4c64e,
    summary:
      'Multi-platform AI scheduler for Facebook, LinkedIn, X, Instagram, and YouTube. ' +
      'Switchable image generation providers and automated content pipelines.',
    bullets: [
      'Five platforms supported end-to-end: FB · LinkedIn · X · Instagram · YouTube.',
      'Image provider switching across OpenAI and Gemini.',
      '50% reduction in media search time vs baseline.'
    ],
    metrics: [
      { num: '5',   caption: 'Platforms' },
      { num: '50%', caption: 'Faster media search' }
    ]
  },
  {
    id: 'gravityauth',
    zoneId: 'gateway',
    name: 'GravityAuth',
    tagline: 'Centralised SSO Gateway',
    url: 'https://auth.gravitywrite.com',
    company: 'Website Learners Pvt Ltd',
    period: '2025',
    stack: ['Laravel', 'MySQL', 'Google OAuth'],
    themeColor: 0x5ee0a0,
    accentColor: 0x7cc7ff,
    summary:
      'Single Sign-On gateway with Google OAuth. Shared identity across GravityWrite ' +
      'and GravitySocial - one session, one account, every product.',
    bullets: [
      'Google OAuth flow with refresh handling and session orchestration.',
      'Shared-session bridge for GravityWrite and GravitySocial.',
      'Hardened token storage and cross-domain cookie handling.'
    ],
    metrics: [
      { num: '1',  caption: 'Identity, many apps' },
      { num: 'OAuth', caption: 'Google SSO' }
    ]
  },
  {
    id: 'transgenie',
    zoneId: 'transport',
    name: 'TransGenie',
    tagline: 'Multi-Service Platform',
    url: 'https://transgenie.io',
    company: 'Sparkout Tech Solutions Pvt Ltd',
    period: '2023 – 2024',
    stack: ['Laravel', 'Node.js', 'PHP', 'PostgreSQL', 'Sockets'],
    themeColor: 0xe55a5a,
    accentColor: 0xf4c64e,
    summary:
      'Food delivery + transport + on-demand service platform. Built full-architecture ' +
      'vendor and admin APIs, and real-time socket infrastructure from scratch.',
    bullets: [
      'Designed architecture for three service verticals in one platform.',
      'Real-time socket events for order/driver/vendor flows.',
      'Vendor dashboards and complete admin API surface.'
    ],
    metrics: [
      { num: '3', caption: 'Service verticals' },
      { num: 'Realtime', caption: 'Sockets end-to-end' }
    ]
  },
  {
    id: 'ai-agent',
    zoneId: 'temple',
    name: 'Laravel AI Agent',
    tagline: 'Open-Source Package',
    url: 'https://github.com/kaviyarasu-dev/agent',
    company: 'Personal · Open Source',
    period: '2025',
    stack: ['Laravel', 'OpenAI', 'Claude', 'Gemini', 'Ideogram', 'Runware'],
    themeColor: 0xb48cff,
    accentColor: 0x7cc7ff,
    summary:
      'Open-source Laravel package that unifies OpenAI, Claude, Gemini, Ideogram, and Runware ' +
      'behind one interface with runtime provider switching and zero-config defaults.',
    bullets: [
      'Sole author and maintainer. SOLID-compliant provider architecture.',
      'Text generation + image generation across five providers.',
      'Extensible provider registration; zero-config bootstrap.'
    ],
    metrics: [
      { num: '5',     caption: 'Providers unified' },
      { num: 'OSS',   caption: 'Maintained publicly' }
    ]
  },
  {
    id: '1clx',
    zoneId: 'workshop',
    name: '1CLX',
    tagline: 'Social Automation + Website Builder',
    url: null,
    company: 'The Infinity Hub',
    period: '2021 – 2023',
    stack: ['Laravel', 'PHP', 'JavaScript', 'jQuery'],
    themeColor: 0xf4c64e,
    accentColor: 0x5ee0a0,
    summary:
      'Social media automation product with a drag-and-drop website builder. ' +
      'Led the architecture, the 5-developer team, and end-to-end delivery.',
    bullets: [
      'Led a 5-developer team through end-to-end delivery.',
      '15+ PRs reviewed per sprint to maintain release stability.',
      'JavaScript drag-and-drop block editor comparable to WordPress page builders.'
    ],
    metrics: [
      { num: '5', caption: 'Dev team size' },
      { num: '15+', caption: 'PRs / sprint' }
    ]
  }
];

// The project list used by the content grid in some dialogues.
export const allProjects = [featured, ...otherProjects];
