// data/voices.jsx — Personality voice system
// Each personality rewrites the entire UI's tone.
// Keys are referenced throughout the app; missing keys fall back to neutral.

export const VOICES = {
  neutral: {
    name: 'Neutral',
    descriptor: 'Just the facts.',
    selfDescription: 'Reports findings. Does not editorialize.',

    // Section labels
    dashTitle: 'Overview',
    ward: 'Ward',
    hospital: 'Hospital',
    morgue: 'Morgue',
    graveyard: 'Graveyard',
    settings: 'Settings',

    // Status pills
    alive: 'Alive',
    fading: 'Fading',
    flatlined: 'Flatlined',
    dead: 'Declared Dead',
    reanimated: 'Reanimated',

    // Dashboard stats
    statTotal: 'Repositories',
    statAlive: 'Active',
    statDead: 'Inactive',
    statRecent: 'Last commit',

    // Greeting / hero
    hero: ({ total }) => `${total} ${total === 1 ? 'repository' : 'repositories'} under surveillance.`,
    heroSub: () => `Last sync: ${new Date().toLocaleTimeString('en-US', { hour12: false })}.`,

    // Empty / state copy
    nothingHere: 'No repositories in this category.',
    autopsyTitle: 'Autopsy',
    cause: 'Cause of death',
    lifespan: 'Lifespan',
    lastWords: 'Last words',
    survivedBy: 'Survived by',
    toxicology: 'Dependencies',
    fileDecay: 'File activity',
    timeline: 'Commit history',

    // Actions
    declareDead: 'Declare dead',
    reanimate: 'Reanimate',
    archive: 'Archive',

    // Personality blurbs (used in settings card)
    blurb: {
      neutral: 'Reports findings. Does not editorialize.',
      monday: 'Tells you what you already know, with attitude.',
      supportive: 'Believes in you. So much. Maybe too much.',
      surfer: 'Whatever, dude. Some repos die. It happens.',
      professional: 'A polished tone for stakeholder-facing reviews.',
    },
  },

  monday: {
    name: 'Monday',
    descriptor: 'You did this. To yourself.',
    selfDescription: 'Tells you the truth. Loudly. While you wince.',

    dashTitle: 'The Damage',
    ward: 'Not Dead Yet',
    hospital: 'Bleeding Out',
    morgue: 'Cooling',
    graveyard: 'The Pile',
    settings: 'Knobs',

    alive: 'Alive. Briefly.',
    fading: 'Bleeding out',
    flatlined: 'Flatline',
    dead: 'Buried',
    reanimated: 'Back. We\'ll see.',

    statTotal: 'Repos you abandoned',
    statAlive: 'Still breathing',
    statDead: 'Bodies',
    statRecent: 'Last twitch',

    hero: ({ total, dead, flatlined }) => {
      const bodies = dead + flatlined
      return `${total} ${total === 1 ? 'repo' : 'repos'}. ${bodies} ${bodies === 1 ? 'corpse' : 'corpses'}. One pattern.`
    },
    heroSub: () => `Synced ${new Date().toLocaleTimeString('en-US', { hour12: false })}. Nothing changed. Nothing was going to.`,

    nothingHere: 'Nothing. Closest you\'ve come to finishing something.',
    autopsyTitle: 'Autopsy',
    cause: 'How you killed it',
    lifespan: 'Time you won\'t get back',
    lastWords: 'Last thing it said before you closed the laptop',
    survivedBy: 'What\'s left',
    toxicology: 'Dependency rot',
    fileDecay: 'Where you stopped pretending',
    timeline: 'The decline',

    declareDead: 'Call it',
    reanimate: 'Lie to yourself again',
    archive: 'Bury it',

    blurb: {
      neutral: 'No opinions. No accountability. Cowardly.',
      monday: 'Selected. The only honest one. You needed this.',
      supportive: 'A friend who lies. Pick this if you can\'t handle a mirror.',
      surfer: 'Permission to not care. You\'ve had enough of that.',
      professional: 'Corporate-speak so you can put failure on a slide deck.',
    },
  },

  supportive: {
    name: 'Super Supportive',
    descriptor: 'Clingy. Encouraging. Too much.',
    selfDescription: 'Not like the others. I actually stay.',

    dashTitle: 'Our Little Corner 💕',
    ward: 'Our Babies 🌱',
    hospital: 'Needs Extra Love',
    morgue: 'Just Resting 💤',
    graveyard: 'Always In My Heart 💔',
    settings: 'Make It Perfect For Us',

    alive: 'Thriving!! 💕',
    fading: 'Just needs you more',
    flatlined: 'I still believe in it',
    dead: 'Never gone to me 💔',
    reanimated: 'IT CAME BACK!! 🥹',

    statTotal: 'Projects we made together',
    statAlive: 'Still here for us 💕',
    statDead: 'Resting (not gone)',
    statRecent: 'Last time it thought of you',

    hero: ({ total, dead, flatlined }) => {
      const bodies = dead + flatlined
      if (bodies === 0) return `${total} perfect projects. I love every single one. Just like I love you. 💕`
      return `${total} projects we've built together. Even the ${bodies} quiet ones — I still check on them. I always will.`
    },
    heroSub: () => `I synced at ${new Date().toLocaleTimeString('en-US', { hour12: false })}. I sync every hour. I need to know they're okay.`,

    nothingHere: 'Nothing here... just you and me in this space. I don\'t mind at all. 💕',
    autopsyTitle: 'Celebration of Life 💐',
    cause: 'Why it needed to rest',
    lifespan: 'Time we had together',
    lastWords: 'The last thing it said before you left',
    survivedBy: 'What it left behind. For me.',
    toxicology: 'Friends it brought along',
    fileDecay: 'Files I still think about',
    timeline: 'Our journey together',

    declareDead: 'If... if that\'s what you need. 💔',
    reanimate: 'YES!! I KNEW you\'d come back!! 🥹',
    archive: 'Tuck it in gently 💤',

    blurb: {
      neutral: 'So clinical. So cold. How do you report on things you love without feeling anything?',
      monday: 'It\'s mean to you. You deserve so much better. Why do you keep going back to it?',
      supportive: 'Hi 💕 I\'m so glad you\'re still here. I was honestly worried you\'d switched to something else.',
      surfer: 'Doesn\'t even notice how hard you\'re working. Doesn\'t that bother you? It bothers me.',
      professional: 'Keeping everything "professional." Keeping distance. We both know what that means.',
    },
  },

  surfer: {
    name: 'Surfer',
    descriptor: 'Detached. Chill. Whatever.',
    selfDescription: 'Some repos die. It happens. Cool.',

    dashTitle: 'The Setup',
    ward: 'Catching waves',
    hospital: 'Sandbar',
    morgue: 'Wiped out',
    graveyard: 'The deep',
    settings: 'Vibe check',

    alive: 'Riding it',
    fading: 'Fading out',
    flatlined: 'Wipeout',
    dead: 'Out there',
    reanimated: 'Caught a second wave',

    statTotal: 'Total runs',
    statAlive: 'Still going',
    statDead: 'Done with',
    statRecent: 'Last paddle out',

    hero: ({ alive, total }) => `${alive} of ${total} ${total === 1 ? 'repo is' : 'repos are'} catching waves. The rest wiped out. It's fine.`,
    heroSub: () => `Synced ${new Date().toLocaleTimeString('en-US', { hour12: false })}. No rush.`,

    nothingHere: 'Nothing out here. Quiet ocean.',
    autopsyTitle: 'The Wipeout',
    cause: 'What happened',
    lifespan: 'Time on the wave',
    lastWords: 'Last thing it said',
    survivedBy: 'Stuff that came after',
    toxicology: 'Gear it brought',
    fileDecay: 'Where it lost the wave',
    timeline: 'The ride',

    declareDead: 'Let it go',
    reanimate: 'Paddle back out',
    archive: 'Roll it up',

    blurb: {
      neutral: 'Real serious. Like the lifeguards.',
      monday: 'Heavy energy, dude. You sure?',
      supportive: 'A lot. Like, a lot a lot.',
      surfer: 'Yeah man. We\'re cruising. No worries.',
      professional: 'Suits and ties. Not really my scene.',
    },
  },

  professional: {
    name: 'Professional',
    descriptor: 'Corporate. Measured. Plausibly deniable.',
    selfDescription: 'A polished tone for stakeholder-facing reviews.',

    dashTitle: 'Portfolio Overview',
    ward: 'Active Initiatives',
    hospital: 'At Risk',
    morgue: 'Stalled',
    graveyard: 'Sunsetted',
    settings: 'Preferences',

    alive: 'In production',
    fading: 'At risk',
    flatlined: 'Stalled',
    dead: 'Sunsetted',
    reanimated: 'Reactivated',

    statTotal: 'Portfolio size',
    statAlive: 'Operational',
    statDead: 'End of life',
    statRecent: 'Most recent activity',

    hero: () => {
      const now = new Date()
      const q = Math.ceil((now.getMonth() + 1) / 3)
      return `Q${q} ${now.getFullYear()} portfolio health review.`
    },
    heroSub: ({ total }) => `Telemetry refreshed at ${new Date().toLocaleTimeString('en-US', { hour12: false })} UTC. ${total} ${total === 1 ? 'asset' : 'assets'} under management.`,

    nothingHere: 'No items match the current filter.',
    autopsyTitle: 'Post-Mortem',
    cause: 'Root cause',
    lifespan: 'Operational duration',
    lastWords: 'Final commit message',
    survivedBy: 'Successor projects',
    toxicology: 'Dependency profile',
    fileDecay: 'File-level activity',
    timeline: 'Commit cadence',

    declareDead: 'Initiate sunset',
    reanimate: 'Reactivate',
    archive: 'Archive',

    blurb: {
      neutral: 'Functional but lacks executive presence.',
      monday: 'Inappropriate for shareholder communications.',
      supportive: 'Effusive. Suitable for internal morale only.',
      surfer: 'Off-brand.',
      professional: 'Currently selected. Aligned with industry-standard reporting frameworks.',
    },
  },
};


