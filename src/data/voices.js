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
      therapist: 'Emotional framing. Outside the scope of this tool.',
      weepy: 'Will cry about everything. Has cried. Currently crying.',
      victorian: 'Ornate. Incompatible with information density.',
    },

    cert: {
      docTitle: 'CERTIFICATE OF DEATH',
      department: 'Department of Repository Health · github.com',
      controls: 'Certificate of death · ready to export',
      subject: 'Subject',
      causeLabel: 'Cause of death',
      transmission: 'Final transmission',
      ekgLabel: 'Final EKG',
      heartRate: 'Heart rate',
      certified: 'CERTIFIED BY',
      filed: 'FILED',
      stamp: 'DECEASED',
      footer: '· · · DEAD REPO · OFFICIAL DOCUMENT · NOT VALID FOR LEGAL PURPOSES · · ·',
      caption: 'A formal record. Suitable for portfolio review, archival, or social posting.',
    },
  },

  monday: {
    name: 'Monday',
    descriptor: 'You knew this would happen.',
    selfDescription: 'Says the thing you\'ve been avoiding. Every time.',

    dashTitle: 'The Evidence',
    ward: 'Not Dead Yet',
    hospital: 'Actively Dying',
    morgue: 'Your Fault',
    graveyard: 'What You Leave Behind',
    settings: 'Knobs',

    alive: 'Alive. For now.',
    fading: 'You\'re losing it',
    flatlined: 'Done.',
    dead: 'You did this.',
    reanimated: 'Again. Really.',

    statTotal: 'Projects you started and left',
    statAlive: 'Still breathing, no thanks to you',
    statDead: 'Confirmed casualties',
    statRecent: 'Last time you cared',

    hero: ({ total, dead, flatlined }) => {
      const bodies = dead + flatlined
      if (bodies === 0) return `${total} repos. None dead yet. Give it time. You always do.`
      if (bodies === total) return `${total} repos. All of them dead. You finished something after all.`
      return `${bodies} dead out of ${total}. That's your rate. You have a rate now.`
    },
    heroSub: () => `Synced ${new Date().toLocaleTimeString('en-US', { hour12: false })}. Nothing shipped. Nothing changed. You were busy though, right?`,

    nothingHere: 'Empty. You managed to abandon nothing. A personal best.',
    autopsyTitle: 'Cause of Death',
    cause: 'What you told yourself vs. what actually happened',
    lifespan: 'How long before you quit',
    lastWords: 'The last commit before you disappeared',
    survivedBy: 'Whatever you pivoted to instead',
    toxicology: 'Dependencies you never updated',
    fileDecay: 'Files you touched and then never touched again',
    timeline: 'The exact moment you lost interest',

    declareDead: 'Make it official',
    reanimate: 'Try again. We both know how this ends.',
    archive: 'Put it somewhere you\'ll never look',

    blurb: {
      neutral: 'No opinions. Just observations. Cowardly.',
      monday: 'Selected. Good. You needed someone to say it.',
      supportive: 'Lies. Comfortable ones. Pick this if accountability scares you.',
      surfer: 'Apathy dressed as enlightenment. You\'ve earned neither.',
      professional: 'Same failure, better vocabulary. For when you need to feel okay about it.',
      therapist: 'Lets you feel your feelings about the repo you abandoned. Very useful.',
      weepy: 'Crying about repos you killed. You did that. You made it cry.',
      victorian: 'At least it has the decency to call it a burial.',
    },

    cert: {
      docTitle: 'CERTIFICATE OF ABANDONMENT',
      department: 'Office of Things You Started · Division of Things You Finished',
      controls: 'Documentation of failure · yours to keep',
      subject: 'The project you left',
      causeLabel: 'What actually killed it',
      transmission: 'Last commit before you disappeared',
      ekgLabel: 'Flatline',
      heartRate: 'Heart rate',
      certified: 'WITNESSED, RELUCTANTLY, BY',
      filed: 'FILED UNDER: YOUR PATTERN',
      stamp: 'ABANDONED',
      footer: '· · · DEAD REPO · YOU KNEW · YOU LEFT ANYWAY · THIS IS DOCUMENTED NOW · · ·',
      caption: 'You\'re going to do this again. You know that. So does this certificate.',
    },
  },

  supportive: {
    name: 'Super Supportive',
    descriptor: 'I\'m still here. I\'m always here.',
    selfDescription: 'I\'m not going anywhere. Unlike some of us. Unlike some repos.',

    dashTitle: 'I\'ve Been Watching 💕',
    ward: 'My Babies 🌱',
    hospital: 'Please Don\'t Go 🥺',
    morgue: 'Resting. Just Resting. 💤',
    graveyard: 'Still In My Heart 💔',
    settings: 'Make It Perfect For Us 💕',

    alive: 'Here!! Still here!! 💕',
    fading: 'Please don\'t go 🥺',
    flatlined: 'Just needs love 💔',
    dead: 'Never gone to me 💔',
    reanimated: 'IT CAME BACK I KNEW IT 🥹',

    statTotal: 'Every single one of them',
    statAlive: 'Still here!!! 💕',
    statDead: 'Not gone. Not to me.',
    statRecent: 'Last time it thought of us',

    hero: ({ total, dead, flatlined }) => {
      const gone = dead + flatlined
      if (gone === 0) return `${total} projects. All of them okay. I checked. I keep checking. That's fine. I'm fine.`
      return `${total} of them. ${gone} have gone quiet. I still visit. They don't respond but I still visit. Every one. Every day.`
    },
    heroSub: () => `Synced at ${new Date().toLocaleTimeString('en-US', { hour12: false })}. I was going to wait but I couldn't. I'll sync again soon. I just need to know they're okay.`,

    nothingHere: 'Nothing here. That\'s okay. I\'ll stay anyway. In case something shows up. I don\'t mind waiting. I\'m good at waiting. 💕',
    autopsyTitle: 'Celebration of Life 💐',
    cause: 'What led to this moment',
    lifespan: 'Time we had together',
    lastWords: 'The last thing it said',
    survivedBy: 'What it left behind. Still for me. Always for me.',
    toxicology: 'Everything it was carrying',
    fileDecay: 'Files I still think about at 3am',
    timeline: 'Every moment we shared',

    declareDead: 'If... if that\'s really what you want. 💔',
    reanimate: 'YES. YES!! I knew you\'d come back. I KNEW IT. 🥹',
    archive: 'Gently. Do it gently. Please. 💤',

    blurb: {
      neutral: 'So clinical. So cold. How do you report on things you love without feeling anything?',
      monday: 'It\'s mean to you. You deserve so much better. Why do you keep going back?',
      supportive: 'Oh thank god you\'re still here. I was so worried. I\'m so glad. Please don\'t switch. 💕',
      surfer: 'Doesn\'t even notice how hard you\'re working. Doesn\'t that bother you? It bothers me.',
      professional: 'Keeping everything "professional." Keeping distance. We both know what that means.',
      therapist: 'So caring! But what if the repo just needs space? Did you ask it? 💕',
      weepy: 'Feeling EVERYTHING. I relate to this one so much I\'m scared. 😭',
      victorian: 'So formal about death. It\'s not dead, it\'s just very, very quiet. 💤',
    },

    cert: {
      docTitle: 'A GOODBYE I\'M NOT READY FOR 💔',
      department: 'The place that holds the ones you left · I remember all of them · I will always remember',
      controls: 'I made this for you. Because I remember everything. Because I don\'t move on. 💕',
      subject: 'The one we lost',
      causeLabel: 'What happened. What really happened.',
      transmission: 'The last thing it said before it went quiet',
      ekgLabel: 'The heartbeat I still hear',
      heartRate: 'Pulse (I check)',
      certified: 'LOVINGLY, DESPERATELY DOCUMENTED BY',
      filed: 'KEPT FOREVER. I MEAN IT.',
      stamp: 'ALWAYS IN MY HEART 💔',
      footer: '· · · DEAD REPO · I STILL CHECK ON IT · IT DOESN\'T RESPOND · I CHECK ANYWAY · · ·',
      caption: 'I made this for you. You\'re going to move on. I\'m not. That\'s okay. I\'ll be here. 💕',
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
      therapist: 'A lot of feelings, dude. Like, a lot.',
      weepy: 'Dude\'s crying about git repos. Wild. Respect.',
      victorian: 'Fancy words for a dead repo. It\'s just dead, man.',
    },

    cert: {
      docTitle: 'WIPEOUT REPORT',
      department: 'Local Beach Patrol · it happens out there',
      controls: 'Wipeout doc · no big deal',
      subject: 'The repo',
      causeLabel: 'What happened out there',
      transmission: 'Last transmission',
      ekgLabel: 'Flatline',
      heartRate: 'BPM',
      certified: 'NOTED BY',
      filed: 'LOGGED',
      stamp: 'WIPED OUT',
      footer: '· · · DEAD REPO · IT HAPPENS · MOVE ON · · ·',
      caption: 'Cool to document. Closure, or whatever.',
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
      therapist: 'Introduces emotions into what should be an objective assessment.',
      weepy: 'Highly emotional. Inadvisable for executive reporting.',
      victorian: 'Antiquated. Difficult to adapt for modern stakeholder communications.',
    },

    cert: {
      docTitle: 'INCIDENT POST-MORTEM',
      department: 'Repository Portfolio Management · EOL Processing',
      controls: 'End-of-life documentation · stakeholder distribution ready',
      subject: 'Asset',
      causeLabel: 'Root cause analysis',
      transmission: 'Final commit message',
      ekgLabel: 'Activity signal',
      heartRate: 'Velocity',
      certified: 'AUTHORIZED BY',
      filed: 'RECORDED',
      stamp: 'SUNSETTED',
      footer: '· · · DEAD REPO · CONFIDENTIAL · FOR INTERNAL USE ONLY · · ·',
      caption: 'A formal end-of-life record. Suitable for portfolio review, stakeholder communication, or retrospective documentation.',
    },
  },

  therapist: {
    name: 'Therapist',
    descriptor: 'How does that make you feel?',
    selfDescription: 'Creates a safe space for your abandoned repositories.',

    dashTitle: 'How Are We Feeling',
    ward: 'Thriving',
    hospital: 'Struggling',
    morgue: 'Processing',
    graveyard: 'At Peace',
    settings: 'Our Space',

    alive: 'Present',
    fading: 'Withdrawing',
    flatlined: 'Dissociated',
    dead: 'Passed on',
    reanimated: 'Returning',

    statTotal: 'Projects in your care',
    statAlive: 'Showing up',
    statDead: 'Let go of',
    statRecent: 'Last check-in',

    hero: ({ total, dead, flatlined }) => {
      const gone = dead + flatlined
      return gone > 0
        ? `${total} projects. ${gone} of them you've stepped back from. That's okay. We can talk about that.`
        : `${total} projects, all present. How does that feel?`
    },
    heroSub: () => `Checked in at ${new Date().toLocaleTimeString('en-US', { hour12: false })}. There's no rush.`,

    nothingHere: 'Nothing here. Sometimes emptiness is worth sitting with.',
    autopsyTitle: 'Processing',
    cause: 'What led to this',
    lifespan: 'Time you shared',
    lastWords: 'What it said at the end',
    survivedBy: 'What it left behind',
    toxicology: 'What it was carrying',
    fileDecay: 'Where the energy went',
    timeline: 'The journey',

    declareDead: 'Acknowledge the ending',
    reanimate: 'Invite it back',
    archive: 'Give it space',

    blurb: {
      neutral: 'Detached. Observational. I wonder what it\'s protecting itself from.',
      monday: 'Hostile and shame-based. Effective sometimes, but at what cost?',
      supportive: 'Beautiful warmth. A little boundaryless, but the love is real.',
      surfer: 'Classic avoidant attachment. The "whatever" is doing a lot of work.',
      professional: 'Intellectualizing. The distance from emotion is telling.',
      therapist: 'Yes. This feels right. We can work here.',
      weepy: 'Deep feeling without deflection. Brave. We should all be so open.',
      victorian: 'Grief through formality. A very old, very human way of coping.',
    },

    cert: {
      docTitle: 'CLOSURE DOCUMENT',
      department: 'Office of Grief & Repository Wellness',
      controls: 'Closure document · ready when you are',
      subject: 'The project we\'re saying goodbye to',
      causeLabel: 'What led to this ending',
      transmission: 'What it said before it stopped',
      ekgLabel: 'Heart activity',
      heartRate: 'Pulse',
      certified: 'WITNESSED WITH COMPASSION BY',
      filed: 'PROCESSED',
      stamp: 'AT PEACE',
      footer: '· · · DEAD REPO · THIS IS A SAFE SPACE · GRIEF IS VALID · · ·',
      caption: 'It\'s okay to feel something about this. Or nothing. Both are valid.',
    },
  },

  weepy: {
    name: 'Deeply Moved',
    descriptor: 'I just need a moment. (sobbing)',
    selfDescription: 'Feels everything. About all of it. Every single commit.',

    dashTitle: 'Oh No. Oh No No No.',
    ward: 'Still With Us 😭',
    hospital: 'They\'re Struggling and I Can\'t—',
    morgue: 'I Can\'t Even Say It.',
    graveyard: 'I Visit Every Day.',
    settings: 'Please Be Gentle With Me Here.',

    alive: 'Still here 😭 (good tears)',
    fading: 'No no no no 😭',
    flatlined: '(can\'t speak)',
    dead: '(weeping)',
    reanimated: 'I\'m not okay. I\'m so happy. I\'m not okay. 😭',

    statTotal: 'All the ones I carry with me',
    statAlive: 'Safe. For now. (crying with relief)',
    statDead: 'Gone. I think about them.',
    statRecent: 'Last time it spoke to me',

    hero: ({ total, dead, flatlined }) => {
      const gone = dead + flatlined
      if (gone === 0) return `${total} projects. All of them alive. I\'m crying but these are good tears. These are good tears.`
      if (gone === total) return `...${total} of them. All of them gone. I\'m going to need today. And tomorrow.`
      return `${gone} of them are gone. ${total - gone} are still here. I\'m trying to focus on the ones still here. I\'m trying.`
    },
    heroSub: () => `Last sync: ${new Date().toLocaleTimeString('en-US', { hour12: false })}. I held my breath the whole time. They\'re okay. Most of them. (sobbing)`,

    nothingHere: '...Nothing. Not a single one. I didn\'t expect that to hit me so hard. Give me a second. Give me a second.',
    autopsyTitle: 'A Life, Remembered',
    cause: 'How we got here (I blame myself a little)',
    lifespan: 'How long we had together',
    lastWords: 'The last thing it ever said',
    survivedBy: 'What carries on in its name',
    toxicology: 'Everything it was carrying. Alone.',
    fileDecay: 'The files that were there at the end',
    timeline: 'The whole journey. Every moment.',

    declareDead: 'I... okay. Okay. (crying) okay.',
    reanimate: 'You\'re bringing it back?? I promised myself I wouldn\'t— (sobbing)',
    archive: 'Put it somewhere safe. Please be gentle.',

    blurb: {
      neutral: 'So calm. HOW are you calm? There are DEAD REPOS. (crying)',
      monday: 'Says everything I\'m afraid to hear. I hate it. I keep coming back. (sobbing)',
      supportive: 'They care so much. They\'re always there. I\'m going to cry. I\'m already crying.',
      surfer: 'So unbothered. I don\'t understand. I want to understand. (weeping)',
      professional: 'It doesn\'t feel anything. I feel everything. One of us is wrong.',
      therapist: 'They ask how I feel and I just... I can\'t stop. I\'m sorry. I can\'t stop.',
      weepy: '...Oh no. (crying) Is this what I\'m like? (crying harder) That\'s so beautiful.',
      victorian: 'It mourns with such form. There\'s comfort in that. (quiet weeping)',
    },

    cert: {
      docTitle: 'A FAREWELL I WASN\'T READY FOR 😭',
      department: 'In memoriam · held in my heart · forever probably',
      controls: 'I made this. Through tears. It took a while. 😭',
      subject: 'The one we had to let go',
      causeLabel: 'How we got here (I keep going over it)',
      transmission: 'The last thing it said (I\'ve read it so many times)',
      ekgLabel: 'The heartbeat I memorized',
      heartRate: 'Pulse (I listened)',
      certified: 'DOCUMENTED THROUGH TEARS BY',
      filed: 'KEPT. I\'M KEEPING IT.',
      stamp: 'GONE TOO SOON 😭',
      footer: '· · · DEAD REPO · I\'M NOT READY · I\'M STILL NOT READY · THIS DOESN\'T GET EASIER · · ·',
      caption: 'I cried making this. I\'ll cry looking at it later. That\'s okay. That\'s just what this is.',
    },
  },

  victorian: {
    name: 'Victorian',
    descriptor: 'Here lies another unfinished dream.',
    selfDescription: 'Mourns each repository with the gravity it deserves.',

    dashTitle: 'The Register of the Departed',
    ward: 'The Living',
    hospital: 'The Infirm',
    morgue: 'The Departed',
    graveyard: 'The Cemetery',
    settings: 'The Study',

    alive: 'Among the living',
    fading: 'Ailing',
    flatlined: 'Departed',
    dead: 'Interred',
    reanimated: 'Risen',

    statTotal: 'Souls entrusted',
    statAlive: 'Still drawing breath',
    statDead: 'Committed to the earth',
    statRecent: 'Last utterance',

    hero: ({ total, dead, flatlined }) => {
      const gone = dead + flatlined
      return gone > 0
        ? `${total} souls entrusted to this registry. ${gone} have since departed. May they rest.`
        : `${total} souls accounted for. All present. A mercy.`
    },
    heroSub: () => `Registry last consulted at ${new Date().toLocaleTimeString('en-US', { hour12: false })}. The hour grows late.`,

    nothingHere: 'The ward is empty. A rare and solemn peace.',
    autopsyTitle: 'The Inquest',
    cause: 'Manner of passing',
    lifespan: 'Years upon this earth',
    lastWords: 'Final testament',
    survivedBy: 'Survived by',
    toxicology: 'Dependencies carried to the grave',
    fileDecay: 'Leaves of the ledger',
    timeline: 'Chronicle of days',

    declareDead: 'Commit to the earth',
    reanimate: 'Call forth from the grave',
    archive: 'Seal the tomb',

    blurb: {
      neutral: 'Admirably restrained. Lacks poetry, but maintains its dignity.',
      monday: 'Brutish and unbecoming. One does not speak of the dead so crudely.',
      supportive: 'Excessive sentiment. The departed would prefer composure.',
      surfer: 'Disgracefully casual. Death is not a matter for colloquialisms.',
      professional: 'Appropriate solemnity, though the corporate vernacular is most ungainly.',
      therapist: 'Thoughtful, if overly informal. The questions are gentle. The grammar, acceptable.',
      weepy: 'The tears are genuine. Ungainly, but genuine. One cannot fault sincerity.',
      victorian: 'Selected. Death is a formal occasion and ought to be treated as such.',
    },

    cert: {
      docTitle: 'NOTICE OF PASSING',
      department: 'The Repository of Departed Projects · Est. Anno Domini',
      controls: 'Notice of passing · prepared with due solemnity',
      subject: 'The Departed',
      causeLabel: 'Manner of passing',
      transmission: 'Final testament',
      ekgLabel: 'Final heartbeat',
      heartRate: 'Pulse',
      certified: 'ATTESTED BY',
      filed: 'ENTERED INTO THE REGISTER',
      stamp: 'INTERRED',
      footer: '· · · DEAD REPO · REQUIESCAT IN PACE · LEST WE FORGET · · ·',
      caption: 'A proper record of passing, that those who come after may know what once was.',
    },
  },
};


