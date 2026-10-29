// Everything the room says lives here. Scene code reads from this module, so a
// résumé update never touches 3D code.

export const profile = {
  name: 'Brandon Apol',
  role: 'Fullstack / Site Reliability Engineer',
  location: 'Dayton, OH',
  bio: [
    'I am a self-taught programmer who quit teaching music in 2021 after I started learning JavaScript during lockdowns. Halfway through a bootcamp I was offered a job teaching there, and wound up inventing their self-paced coursework.',
    'In 2023 I joined Radiance Technologies as a fullstack engineer, became tech lead of a project where we removed around 50,000 lines of code and went from about seven microservices to two, and then co-founded the Site Reliability Engineering practice. Along with two friends I mentor a team of about twelve engineers, and I have spent a lot of the last two years piloting and coaching agentic programming.',
  ],
};

export const links = {
  resume: { label: 'résumé', href: './resume.html' },
  autobutler: { label: 'autobutler.org', href: 'https://autobutler.org' },
  quark: { label: 'quark', href: 'https://github.com/autobutler-org/quark' },
  birchwood: { label: 'birchwood.lol', href: 'https://birchwood.lol' },
  vibecheck: { label: 'vibecheck', href: 'https://github.com/brandonapol/vibecheck' },
  github: { label: 'github', href: 'https://github.com/brandonapol' },
  linkedin: { label: 'linkedin', href: 'https://linkedin.com/in/brandonapol' },
};

export const projects = [
  { id: 'autobutler', name: 'AutoButler', text: 'A faster, safer way to do cloud storage. I am the product owner / designer / marketing / second engineer half.', href: links.autobutler.href },
  { id: 'quark', name: 'Quark', text: 'Another AutoButler project.', href: links.quark.href },
  { id: 'vibecheck', name: 'VibeCheck', text: 'A TDD npm package that stops agents from "cheating" on unit tests via CI.', href: links.vibecheck.href },
  { id: 'birchwood', name: 'birchwood.lol', text: 'My recipe site, "underengineered" on purpose to run for free.', href: links.birchwood.href },
];

export const experience = [
  { title: 'Senior Site Reliability Engineer', org: 'Radiance Technologies', dates: '2025 – present', text: 'Co-founded the SRE practice. Ran the first on-call rotation; release cadence went from biannual to weekly.' },
  { title: 'Tech Lead, Workflows', org: 'Radiance Technologies', dates: '2024 – 2025', text: 'Led 6 engineers and a platform serving ~30. Cut several microservices and tens of thousands of lines of code.' },
  { title: 'Fullstack Engineer', org: 'Radiance Technologies', dates: '2023 – present', text: 'Helm, Kubernetes, Jenkins pipelines, auth integrations, Scrum master.' },
  { title: 'Senior Research Lead', org: 'Coding Temple', dates: '2022 – 2023', text: 'Prototyped TypeScript curriculum for the self-paced front-end course.' },
  { title: 'Software Instructor', org: 'Coding Temple', dates: '2021 – 2022', text: 'Invented an asynchronous course that became a $1.1M ARR product.' },
  { title: 'Music teacher', org: 'B.M.E., Cedarville University', dates: '2017 – 2021', text: 'Where the patience for teaching came from.' },
];

// Each station's card. `embed` and `links` are optional.
export const stations = {
  computer: { name: 'The computer', hint: 'résumé, projects, contact' },

  keyboard: {
    name: 'Split keyboard',
    hint: 'a hot take',
    kicker: 'Desk',
    title: 'The split keyboard',
    body: ['Yes, it is a split keyboard. No, I will not be taking questions. Prime explains it better than I can.'],
    links: [{ label: 'Read the post ↗', href: 'https://x.com/ThePrimeagen/status/1952838755288793106' }],
  },

  cooler: {
    name: 'The cooler',
    hint: 'recipes',
    kicker: 'Kitchen, sort of',
    title: 'birchwood.lol',
    body: [
      'My recipe site. It is deliberately "underengineered": static, automated with CI, and free to run, as a counterweight to the overengineered Kubernetes blog I built before it.',
    ],
    links: [{ label: 'Get cooking ↗', href: links.birchwood.href }],
  },

  guitar: {
    name: 'Epiphone Casino',
    hint: 'my college band',
    kicker: 'Music',
    title: 'Noticing Icarus',
    body: [
      'A blonde Epiphone Casino, the model John Lennon played. This is the band I played in during college. I was one of the songwriters.',
    ],
    embed: {
      src: 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/noticing-icarus-363880582&color=%23a78bfa&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false',
      height: 300,
      title: 'Noticing Icarus on SoundCloud',
    },
    links: [{ label: 'Open on SoundCloud ↗', href: 'https://soundcloud.com/noticing-icarus-363880582' }],
  },

  records: {
    name: 'Record player',
    hint: 'what I’m listening to',
    kicker: 'Music',
    title: 'On the turntable',
    // Set to an open.spotify.com/embed/playlist/... URL once the playlist is picked.
    spotifyEmbed: null,
    body: ['The playlist is still being picked. Check back soon.'],
    note: 'If you’re not logged in to Spotify, you’ll only hear 30-second previews.',
  },

  climbs: {
    name: 'Gear wall',
    hint: 'biggest climbs at work',
    kicker: 'Gear wall',
    title: 'Biggest climbs at work',
    body: ['Ice axes are for the hard pitches. These are mine.'],
    list: [
      { title: 'Seven services down to two', text: 'As tech lead on Workflows, simplified the platform by removing several microservices and around 50,000 lines of code, cutting operational burden for the whole team.' },
      { title: 'Founding the SRE practice', text: 'Co-founded SRE at Radiance, ran the first on-call rotation, and helped compress releases from biannual to weekly.' },
      { title: 'Shipping where nobody can help', text: 'Deployed and validated software in air-gapped environments and trained operators on networks with zero remote support.' },
      { title: 'Mentoring a dozen engineers', text: 'With two friends, mentor a team of about twelve engineers.' },
      { title: 'Piloting agentic programming', text: 'Helped pilot and coach agentic programming across the company for two years.' },
      { title: 'A $1.1M asynchronous course', text: 'Invented the self-paced format at Coding Temple, a hybrid of recorded lessons, office hours and a community Slack.' },
    ],
  },

  topo: {
    name: 'Chugach Mountains',
    hint: 'how I got here',
    kicker: 'Topo map · Chugach Mountains, Alaska',
    title: 'The route so far',
    body: ['Every route has a few switchbacks. The pins on the map follow this one.'],
    list: [
      { title: '1 · Music teacher', text: 'Bachelor of Music Education from Cedarville University, then teaching music.' },
      { title: '2 · Lockdown JavaScript', text: 'Started learning JavaScript during lockdowns, then enrolled in a bootcamp.' },
      { title: '3 · Bootcamp instructor', text: 'Hired to teach halfway through the bootcamp, then wrote the self-paced curriculum.' },
      { title: '4 · Fullstack engineer', text: 'Joined Radiance Technologies in 2023, working in Angular and NodeJS.' },
      { title: '5 · Tech lead', text: 'Led the Workflows team through a big simplification.' },
      { title: '6 · SRE', text: 'Co-founded the Site Reliability Engineering practice.' },
    ],
  },

  poster: {
    name: 'Code Cop poster',
    hint: 'skill issue',
    kicker: 'Photo wall',
    title: 'Code Cop',
    body: ['Fan art of the one and only Code Cop. Every office needs someone keeping it honest.'],
    links: [{ label: 'ThePrimeagen on YouTube ↗', href: 'https://www.youtube.com/@ThePrimeTimeagen' }],
  },

  pad: {
    name: 'Practice pad',
    hint: 'press play',
    kicker: 'Music',
    title: 'Paradiddle',
    body: [
      'Before code I taught music. A practice pad is the most honest feedback loop I know: you either kept time or you didn’t. That is basically on-call.',
    ],
  },

  lavalamp: {
    name: 'Lava lamp',
    hint: 'entropy',
    kicker: 'Bookshelf',
    title: 'A wall of entropy',
    body: [
      'Cloudflare keeps a wall of about a hundred lava lamps in its San Francisco lobby. A camera films them, and the unpredictable blobs feed the randomness behind encryption keys. That system is called LavaRand.',
      'This one only feeds a hash. Below is SHA-256 of this lamp’s blob positions at the moment you clicked:',
    ],
    links: [{ label: 'How LavaRand works ↗', href: 'https://www.cloudflare.com/learning/ssl/lava-lamp-encryption/' }],
  },

  doorway: {
    name: 'Doorway',
    hint: 'coming soon',
    kicker: 'Out the door',
    title: 'Bikepacking (coming soon)',
    body: [
      'Through this door is a bikepacking game. Ride the route, and eat enough to keep going, or you bonk. It is still being built.',
    ],
  },

  lights: { name: 'Light switch', hint: 'day / night' },
};

export const finale = {
  kicker: 'Quest complete',
  title: 'You found everything',
  body: ['Thanks for poking around my office. Want to talk SRE, agentic programming, or anything in this room? Let’s hang.'],
  links: [
    { label: 'Connect on LinkedIn ↗', href: links.linkedin.href },
    { label: 'Open an issue ↗', href: 'https://github.com/brandonapol/brandonapol/issues/new' },
    { label: 'Read the résumé', href: links.resume.href },
  ],
};
