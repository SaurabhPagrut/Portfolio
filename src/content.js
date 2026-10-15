// Everything the site says lives in this file. Edit it, then run `npm run build`
// (Netlify also runs the build on every deploy). Both the normal view and the
// JSON view of each section are generated from the same data below.
//
// Dates are "YYYY" or "YYYY-MM". An `end` of null means "Present".

export const site = {
  url: 'https://saurabhpagrut.in/',
  title: 'Saurabh Pagrut · Senior Software Engineer',
  description: 'Saurabh Pagrut, Senior Software Engineer at Pine Labs in Bengaluru. Go microservices, Vue.js, AWS and Redis.',
  shareDescription: 'Senior Software Engineer at Pine Labs. Go microservices, Vue.js, AWS and Redis.',
  image: '/assets/portrait-960.webp',
};

export const profile = {
  firstName: 'Saurabh',
  lastName: 'Pagrut',
  initials: 'SP',
  title: 'Senior Software Engineer',
  company: 'Pine Labs',
  city: 'Bengaluru',
  country: 'India',
  countryCode: 'IN',
  portrait: {
    small: '/assets/portrait-480.webp',
    large: '/assets/portrait-960.webp',
    alt: 'Saurabh Pagrut, in profile, against a blue sky above the clouds',
  },
  // Chips under the job title in the hero
  heroStack: ['Go', 'Microservices', 'AWS', 'Vue.js'],
  // "stack" in the hero's JSON response
  stack: ['Go', 'Vue.js', 'AWS', 'MySQL', 'Redis'],
  summary:
    'I build and scale Go microservices and Vue.js frontends in fintech at Pine Labs. I own the Currency service and the Woohoo Golang MySQL boilerplate end to end, across backend, admin UI and caching, and I mentor engineers through code reviews focused on performance, reliability and clean code.',
};

export const contact = {
  email: 'getsaurabhpagrut@gmail.com',
  phone: { display: '+91 84596 31665', tel: '+918459631665' },
  linkedin: { url: 'https://www.linkedin.com/in/saurabhpagrut/', label: 'in/saurabhpagrut' },
  github: { url: 'https://github.com/SaurabhPagrut', label: 'SaurabhPagrut' },
  lede: 'Have a role, a project or a question? Send a message with the form, or reach me directly.',
  formNote: 'Goes straight to my inbox. I usually reply within a few days.',
};

export const experience = {
  company: 'Pine Labs Pvt. Ltd.',
  companyShort: 'Pine Labs',
  location: 'Bengaluru, India',
  // Newest first
  roles: [
    {
      title: 'Senior Software Engineer',
      start: '2025-04',
      end: null,
      points: [
        'Lead architecture and development of the Currency microservice.',
        'Mentor engineers and set code-review and engineering standards for the team.',
        'Own end-to-end feature delivery and guide frontend and backend technical decisions.',
        'Deploy and operate containerised services on AWS ECS, with configuration and credentials in AWS Secrets Manager.',
        'Streamlined CI/CD with Bamboo build checks and Octopus Deploy.',
        'Currently building features for the Woohoo Card activation service.',
      ],
      stack: ['Go', 'AWS ECS', 'Secrets Manager', 'Bamboo', 'Octopus Deploy'],
    },
    {
      title: 'Software Engineer',
      start: '2022-11',
      end: '2025-03',
      points: [
        'Designed and built the Currency microservice, and owned it end to end: design, development, testing and production releases.',
        'Delivered full-stack features with Go, MySQL, MongoDB and Redis on the backend and Vue.js, Vite, Vuex and Pinia on the frontend.',
        'Diagnosed and resolved production issues, and reviewed code to keep the codebase scalable and maintainable.',
      ],
      stack: ['Go', 'MySQL', 'MongoDB', 'Redis', 'Vue.js', 'Pinia'],
    },
  ],
  highlight: {
    tag: 'Vue 2 → Vue 3',
    text: 'Migrated the admin UI of Currency, the Boilerplate, Woohoo Card and Woohoo Router from Vue 2 to Vue 3.',
  },
  // role: "owner" or "contributor"
  services: [
    {
      id: 'currency',
      name: 'Currency',
      role: 'owner',
      kind: 'Microservice',
      note: 'I handle all of it: backend, admin UI and caching, from architecture to production releases.',
      work: ['Designed and built the service', 'Own it end to end'],
    },
    {
      id: 'woohoo-golang-mysql',
      name: 'Woohoo Golang MySQL (Boilerplate)',
      role: 'owner',
      kind: 'Reference architecture',
      note: 'The common architecture every Woohoo microservice follows: login, sign-up, identity providers, roles and permissions, distribution providers, configs, clients, and admin users with their roles and clients. I handle frontend, backend and caching.',
      work: [
        'Introduced Redis caching here, which every other microservice then referenced',
        'Built the new Vue.js admin UI here, which other services copy and extend with their own components',
      ],
    },
    {
      id: 'woohoo-card',
      name: 'Woohoo Card',
      role: 'contributor',
      kind: 'Microservice',
      note: 'Admin UI plus backend work on card activation.',
      work: [
        'Built the whole admin UI',
        'Fixed most of the existing bugs',
        'Set up the base caching logic',
        'Implemented the new resources required for card activation',
        'Worked on parts of the activation service, and currently building its feature tickets',
      ],
    },
    {
      id: 'woohoo-router',
      name: 'Woohoo Router',
      role: 'contributor',
      kind: 'Microservice',
      note: 'Admin UI plus backend fixes and caching.',
      work: ['Built the whole admin UI', 'Fixed existing backend bugs', 'Implemented caching for all backend APIs'],
    },
  ],
};

// Each skill shows either a logo from public/assets/icons/ (`logo`) or one of
// the line icons in src/icons.js (`glyph`). `primary: true` marks the primary stack.
export const skills = [
  {
    id: 'languages',
    label: 'Languages',
    items: [
      { name: 'Go', logo: 'go-original.svg', primary: true },
      { name: 'Java', logo: 'java-original.svg' },
      { name: 'JavaScript', logo: 'javascript-original.svg' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    items: [
      { name: 'Microservices', glyph: 'nodes', primary: true },
      { name: 'REST APIs', glyph: 'braces' },
      { name: 'Spring Boot', logo: 'spring-original.svg' },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    items: [
      { name: 'Vue.js', logo: 'vuejs-original.svg', primary: true },
      { name: 'Vuex', glyph: 'store' },
      { name: 'Pinia', glyph: 'store' },
      { name: 'Vite', logo: 'vitejs-original.svg' },
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    items: [
      { name: 'MySQL', logo: 'mysql-original.svg' },
      { name: 'MongoDB', logo: 'mongodb-original.svg' },
      { name: 'Redis', logo: 'redis-original.svg' },
    ],
  },
  {
    id: 'cloud-and-devops',
    label: 'Cloud & DevOps',
    items: [
      { name: 'AWS ECS', logo: 'amazonwebservices-original-wordmark.svg', primary: true },
      { name: 'AWS Secrets Manager', logo: 'amazonwebservices-original-wordmark.svg', primary: true },
      { name: 'Docker', logo: 'docker-original.svg' },
      { name: 'CI/CD', glyph: 'pipeline' },
      { name: 'Bamboo', logo: 'bamboo-original.svg' },
      { name: 'Octopus Deploy', glyph: 'deploy' },
    ],
  },
  {
    id: 'tools-and-practices',
    label: 'Tools & practices',
    items: [
      { name: 'Git', logo: 'git-original.svg' },
      { name: 'Bitbucket', logo: 'bitbucket-original.svg' },
      { name: 'JIRA', logo: 'jira-original.svg' },
      { name: 'Data structures & algorithms', glyph: 'tree' },
      { name: 'Code review', glyph: 'review' },
      { name: 'Mentoring', glyph: 'people' },
    ],
  },
];

// Project cards, used by both the Projects and Archive sections.
// tag: the small label on the card ("WEB", "API"). links.demoLabel defaults to "Live".
// modules + mine: optional list of modules, with the ones you built marked.

export const projects = {
  intro: 'Recent work. All three run in your own browser rather than on a server.',
  items: [
    {
      name: 'PinScout',
      year: 2026,
      kind: 'Chrome extension',
      tag: 'EXT',
      description:
        'Chrome extension that finds where an out-of-stock product can be delivered. It checks your pincode first, then nearby pincodes, the rest of your state and the rest of India, and stops at the first place the product is available, using India Post data for about 19,500 pincodes. Works with Flipkart and Croma, with experimental support for Amazon, Myntra and Blinkit.',
      stack: ['JavaScript', 'Chrome Extensions (MV3)', 'Python'],
      links: {
        code: 'https://github.com/SaurabhPagrut/PinScout',
        demo: 'https://chromewebstore.google.com/detail/pinscout-pincode-delivery/oicfbaoamapgdhailjaaokgkdolalbco',
        demoLabel: 'Chrome Web Store',
      },
    },
    {
      name: 'Bracely',
      year: 2026,
      kind: 'Web app',
      tag: 'WEB',
      description:
        'Every JSON tool in one place, running entirely in the browser: format and repair, tree, table and graph views, diff and JSON Patch, jq, JMESPath, JSONPath and SQL queries, schema generation and validation, conversion to and from YAML, CSV, Excel, XML and TOML, typed models in 16 languages, mock data and JWT decoding. Nothing is uploaded, and it also ships as Chrome and Firefox extensions.',
      stack: ['JavaScript', 'CodeMirror', 'Web Workers', 'Python', 'jsdom'],
      links: { code: 'https://github.com/SaurabhPagrut/Bracely', demo: 'https://bracely.saurabhpagrut.in' },
    },
    {
      name: 'AbogadaFlow',
      year: 2026,
      kind: 'Web app',
      tag: 'WEB',
      description:
        'Privacy-first eFiling tool for Indian litigation advocates. It compiles petitions, applications, lists of documents and exhibits into one court-ready PDF bundle in the browser, with an auto-generated index in English and Devanagari, running page numbers, PDF bookmarks, court presets and an eFiling 3.0 filename check. Case files never leave the browser.',
      stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'pdf-lib'],
      links: { code: 'https://github.com/SaurabhPagrut/AbogadaFlow', demo: 'https://abogadaflow.saurabhpagrut.in' },
    },
  ],
};

export const archive = {
  intro: 'Early projects from the Masai School program in 2022, before Pine Labs. Kept here for the record.',
  items: [
    {
      name: 'Trip Management System',
      year: 2022,
      kind: 'REST API',
      tag: 'API',
      featured: true,
      description:
        'REST API for an online trip management system: sign-in for users and admins, routes, tickets, packages, hotels, bookings, feedback and reports.',
      team: 5,
      role: 'Built the Reports and Feedback controllers and services, and worked on the frontend.',
      modules: ['Users & admins', 'Routes', 'Tickets', 'Packages', 'Hotels', 'Bookings', 'Feedback', 'Reports'],
      mine: ['Feedback', 'Reports'],
      stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'MySQL', 'Lombok', 'Swagger'],
      links: {
        code: 'https://github.com/mrFarooque/Trip-Management-System',
        demo: 'https://drive.google.com/file/d/1KB3J7FqawAWYqBruGV_1c_hid-LyQDIn/view?usp=sharing',
        demoLabel: 'Video',
      },
    },
    {
      name: 'SSENSE clone',
      year: 2022,
      kind: 'Web',
      tag: 'WEB',
      description: 'Clone of the SSENSE fashion e-commerce site, with login and ordering from the cart.',
      team: 5,
      role: 'Built the login, sign-up and post-login account pages.',
      stack: ['HTML', 'CSS', 'JavaScript'],
      links: { code: 'https://github.com/SaurabhPagrut/Ssense-Clone', demo: 'https://ssense-clone-masai.netlify.app/' },
    },
    {
      name: 'Expedia clone',
      year: 2022,
      kind: 'Web',
      tag: 'WEB',
      description: 'Clone of the Expedia travel booking site.',
      stack: ['HTML', 'CSS', 'JavaScript'],
      links: { code: 'https://github.com/SaurabhPagrut/Expedia_clone', demo: 'https://warm-gecko-dde4da.netlify.app/index.html' },
    },
    {
      name: 'YouTube clone',
      year: 2022,
      kind: 'Web',
      tag: 'WEB',
      description: 'Clone of the YouTube video site.',
      stack: ['HTML', 'CSS', 'JavaScript'],
      links: { code: 'https://github.com/SaurabhPagrut/Youtube-Clone', demo: 'https://youtube-clone-by-sp.netlify.app/' },
    },
    {
      name: 'Search Pictures',
      year: 2022,
      kind: 'Web',
      tag: 'WEB',
      description: 'Image search app built on the Unsplash API.',
      stack: ['HTML', 'CSS', 'JavaScript'],
      links: { code: 'https://github.com/SaurabhPagrut/Search-Pictures', demo: 'https://image-search-by-sp.netlify.app/' },
    },
    {
      name: 'Star Wars character search',
      year: 2022,
      kind: 'Web',
      tag: 'WEB',
      description: 'Character search app using the Fetch API.',
      stack: ['HTML', 'CSS', 'JavaScript'],
      links: {
        code: 'https://github.com/SaurabhPagrut/Star-Wars-Characters',
        demo: 'https://star-wars-characters-search.netlify.app/',
      },
    },
  ],
};

export const education = {
  education: [
    { title: 'B.Sc. Computer Science', place: 'Shri R. L. T. College of Science, Akola', start: '2017', end: '2020' },
  ],
  certifications: [
    { title: 'Full Stack Web Development', place: 'Masai School, Bengaluru', start: '2022-02', end: '2022-10' },
  ],
};
