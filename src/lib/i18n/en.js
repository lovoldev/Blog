// English dictionary
export const en = {
  language: '中文',
  hero: {
    title: 'zevarc',
    phonetic: '/ˈziː.vɑːrk/',
    etymology: {
      zero: 'Zero',
      evolution: 'Evolution',
      arc: 'Arc'
    },
    slogan: 'Start from zero, evolve through twists and turns, and grow with joy',
    description: 'zevarc explores problem decomposition and iterative evolution, sharing practical insights on Android, C++, Python, and modern frontend development.',
    topics: ['Android', 'C++', 'Python', 'Frontend', 'Browser Extensions'],
    cta: 'Explore'
  },
  posts: {
    station: 'First Station',
    title: 'Harbor of Knowledge',
    subtitle: 'Where ideas anchor and thoughts settle',
    blogTitle: 'Posts',
    blogSubtitle: 'A complete record of a topic—from its essence, through its analysis, to its resolution',
    noteTitle: 'Notes',
    noteSubtitle: 'Fragments of what I see, think, and reflect on',
    readMore: 'Read More →',
    readTime: 'min read',
    toc: 'Contents',
    related: 'Related Posts',
    latest: 'Latest Writing',
    next: 'Head to the Dock',
  },
  nav: {
    home: 'Home',
    posts: 'Posts',
    projects: 'Projects',
  },
  search: {
    title: 'Search',
    placeholder: 'Search posts & notes…',
    empty: 'No results found',
    hint: 'Search is available after build (pnpm build)',
  },
  projects: {
    station: 'Second Station',
    title: 'Dock of Creations',
    subtitle: 'Load up here, then set sail for the horizon',
    next: 'Go home',
    projects: [
      {
        id: 1,
        title: 'FastAir',
        year: '2017',
        description: 'An Android app for fast file transfer without an internet connection',
        image: '/projects/fastair.webp',
        tags: [
          'Android',
          'WiFi P2P'
        ],
        github: 'https://github.com/zevarc/fastair'
      },
      {
        id: 2,
        title: 'GitHit',
        year: '2026',
        description: 'Discover Random GitHub Repositories & Developers',
        image: '/projects/githit.svg',
        tags: [
          'GitHub',
          'GitHit'
        ],
        website: 'https://githit.zevarc.com'
      },
      {
        id: 3,
        title: 'EqBeat',
        year: '2026',
        description: 'Turn Math Equations Into Sound, Feel the Beat',
        image: '/projects/eqbeat.svg',
        tags: [
          'Math',
          'equations',
          'Audio',
          'eqbeat'
        ],
        website: 'https://eqbeat.com'
      },
      {
        id: 4,
        title: 'BoredIsland',
        year: '2026',
        description: 'Escape the noise.webp Drag to explore a quiet, endless ocean, skip stones, watch the fish, and discover hidden islands.',
        image: '/projects/boredisland.svg',
        tags: [
          'Bored Island',
          'Bored',
          'Island'
        ],
        website: 'https://boredisland.com'
      },
      {
        id: 5,
        title: 'Loglet',
        year: '2026',
        description: 'Loglet make Android logcat readable',
        image: '/projects/loglet.svg',
        tags: [
          'Logcat',
          'Loglet',
        ],
        website: 'https://loglet.zevarc.com',
        github: 'https://github.com/zevarc/loglet'
      }
    ]
  },
  footer: {
    title: 'Progress Brings Me Joy',
    subtitle: 'If you’re interested in methodologies for breaking down problems, feel free to reach out.',
    contact: 'Contact Me'
  },
  seo: {
    home: {
      title: 'zevarc - A Journey of Evolution from Zero',
      description: 'zevarc is a personal brand centered on problem decomposition and iterative evolution, sharing insights on Android, C++, Python, frontend development, and browser extensions.'
    },
    posts: {
      title: 'Posts - zevarc',
      description: 'Technical articles and insights on Android, C++, Python, and frontend development.'
    },
    projects: {
      title: 'Projects - zevarc',
      description: 'A collection of projects'
    }
  }
};

export default en;