export type CurrencyCode = 'INR' | 'USD';

export type BusinessVertical =
  | 'SS Audios – Event & Entertainment'
  | 'DJ Event Packages'
  | 'Raga Studio'
  | 'Sampoorna Music Academy';

export interface SignatureService {
  id: string;
  title: string;
  startingPrice: number;
  priceLabel: string;
  image: string;
  summary: string;
  description: string;
  highlights: string[];
  idealFor: string;
  hidden?: boolean;
}

export interface DjPackage {
  id: string;
  name: string;
  priceInr: number;
  priceUsd: number;
  unitLabel: string;
  tagline: string;
  powerRating: string;
  durationLabel: string;
  featured?: boolean;
  features: string[];
  hidden?: boolean;
}

export interface PortfolioSlot {
  id: string;
  categoryId: string;
  slotNumber: number;
  title: string;
  archiveTag: string;
  location?: string;
  status: 'awaiting' | 'published';
  videoUrl: string | null;
  posterUrl?: string | null;
  driveFileId?: string | null;
  driveWebViewLink?: string | null;
  mimeType?: string | null;
  fileSizeBytes: number;
  updatedAt: string | null;
  hidden?: boolean;
}

export interface PortfolioCategory {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  slots: PortfolioSlot[];
  hidden?: boolean;
}

export interface RagaStudioService {
  id: string;
  title: string;
  priceLabel: string;
  priceValue: number;
  unit: string;
  description: string;
  features: string[];
  hidden?: boolean;
}

export interface AcademyCourse {
  id: string;
  title: string;
  feeLabel: string;
  feeMonthly: number;
  duration: string;
  description: string;
  curriculum: string[];
  hidden?: boolean;
}

export interface SectionVisibility {
  services: boolean;
  portfolio: boolean;
  djPackages: boolean;
  ragaStudio: boolean;
  sampoornaAcademy: boolean;
}

export interface EnquiryFormData {
  fullName: string;
  mobile: string;
  email: string;
  category: BusinessVertical;
  service: string;
  date: string;
  time: string;
  venue: string;
  audience: string;
  budget: string;
  // Studio-specific
  sessionDuration: string;
  recordingRequirements: string;
  // Academy-specific
  preferredBatch: string;
  learningLevel: string;
  // General notes
  additionalRequirements: string;
}

export interface EnquiryValidationErrors {
  fullName?: string;
  mobile?: string;
  email?: string;
  category?: string;
  service?: string;
}

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  maxFileBytes: number;
  remainingBytes: number;
  usedPercent: number;
  publishedCount: number;
  totalSlots: number;
}

export interface SiteDataPayload {
  currency: CurrencyCode;
  djPackages: DjPackage[];
  signatureServices: SignatureService[];
  ragaStudioServices: RagaStudioService[];
  academyCourses: AcademyCourse[];
  sectionVisibility: SectionVisibility;
  portfolioCategories: PortfolioCategory[];
  storageStats: StorageStats;
  updatedAt: string;
}

export function createDefaultSectionVisibility(): SectionVisibility {
  return {
    services: true,
    portfolio: true,
    djPackages: true,
    ragaStudio: true,
    sampoornaAcademy: true,
  };
}

export const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // 5 GiB
export const MAX_VIDEO_FILE_BYTES = 3 * 1024 * 1024 * 1024; // 3 GiB per video

export const BRAND_ASSETS = {
  logo: '/assets/aistudio/Screenshot_2026-11-23_at_6.51.10_PM_1a874fcd.png',
  heroStage: '/src/assets/images/hero_concert_stage_1795454638506.jpg',
  heroAnimeConcert: '/src/assets/images/hero_anime_concert_1795456246731.jpg',
  heroAnimeWedding: '/src/assets/images/hero_anime_wedding_1795456247033.jpg',
  heroAnimeStudio: '/src/assets/images/hero_anime_studio_1795456247871.jpg',
  weddingOrchestra: '/src/assets/images/service_wedding_orchestra_1795454637774.jpg',
  djLighting: '/src/assets/images/service_dj_lighting_1795454637882.jpg',
  welcomeInstrumental: '/src/assets/images/service_welcome_instrumental_1795454638394.jpg',
  ragaStudio: '/src/assets/images/raga_recording_studio_1795454638358.jpg',
  sampoornaAcademy: '/src/assets/images/sampoorna_music_academy_1795454637861.jpg',
} as const;

export const BUSINESS_CONTACT = {
  name: 'SS Audios',
  website: 'www.ssaudios.in',
  websiteUrl: 'https://www.ssaudios.in/',
  email: 'ssaudios25@gmail.com',
  phoneDisplay: '+91 99653 68899',
  phoneDigits: '919965368899',
  whatsappBase: 'https://wa.me/919965368899',
  instagramHandle: '@ss_audios_and_dj_events_erode',
  instagramUrl: 'https://www.instagram.com/ss_audios_and_dj_events_erode/',
  cityRegion: 'Erode, Tamil Nadu, India',
  fullAddress: 'Ss audios, Erode, Tamil Nadu, India',
  erodeCenter: { lat: 11.329948, lng: 77.704 },
  googleMapsUrl: 'https://maps.google.com/?cid=11515286596395370596',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3912.0651624457987!2d77.70399957504996!3d11.329947888854438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba96f231618d8d1%3A0x9fcebb7b986a0864!2sSs%20audios!5e0!3m2!1sen!2sin!4v1795460665359!5m2!1sen!2sin',
} as const;

export const SIGNATURE_SERVICES: SignatureService[] = [
  {
    id: 'wedding-events',
    title: 'Wedding Events',
    startingPrice: 25000,
    priceLabel: '₹25,000',
    image: BRAND_ASSETS.weddingOrchestra,
    summary: 'Complete wedding audio engineering, grand bridal entries, and concert-grade reception soundscapes.',
    description:
      'From auspicious muhurtham acoustics to high-energy reception concerts, SS Audios designs seamless wedding audio, pathway lighting, and stage ambiance tailored to every ceremony.',
    highlights: [
      'Crystal-clear speech & mantra amplification',
      'Grand Bride & Groom Wedding Entry choreography cues',
      'Hall & stage acoustic balancing for zero feedback',
      'Dedicated on-site audio engineer throughout the ceremony',
    ],
    idealFor: 'Weddings, Muhurthams, Grand Receptions & Sangeet Nights',
  },
  {
    id: 'goldstar-orchestra',
    title: 'Goldstar Orchestra',
    startingPrice: 25000,
    priceLabel: '₹25,000',
    image: BRAND_ASSETS.weddingOrchestra,
    summary: 'Signature live orchestral band delivering Tamil cinema classics, retro medleys, and contemporary hits.',
    description:
      'Our flagship Goldstar Orchestra brings seasoned vocalists, live rhythmists, keyboardists, and acoustic instrumentalists backed by concert-calibrated SS Audios front-of-house sound.',
    highlights: [
      'Acclaimed male & female lead playback-style vocalists',
      'Live multi-piece orchestra with custom song list planning',
      'Full stage monitoring, wireless mics & live FOH mixing',
      'Trusted across Erode, Mulanur, Modakurichi & Tamil Nadu',
    ],
    idealFor: 'Wedding Receptions, Cultural Galas & Family Celebrations',
  },
  {
    id: 'lighting-audio',
    title: 'Lighting & Audio',
    startingPrice: 40000,
    priceLabel: '₹40,000',
    image: BRAND_ASSETS.heroStage,
    summary: 'Concert line-array audio rigs, architectural stage lighting, pathway beams, and LED visual walls.',
    description:
      'Full-scale technical production engineered for auditoriums, college fests, corporate summits, and grand marriage halls — uniting tour-grade PA arrays with synchronized DMX lighting.',
    highlights: [
      'High-headroom line-array PA & dual-18 subwoofer stacks',
      'DMX moving heads, stage washes, pathway lighting & haze FX',
      'BG visuals, LED backdrop walls & custom stage trusses',
      'Redundant power & audio patching with technical crew',
    ],
    idealFor: 'College Festivals, Corporate Summits, Concerts & Grand Halls',
  },
  {
    id: 'welcome-dance',
    title: 'Welcome Dance',
    startingPrice: 15000,
    priceLabel: '₹15,000',
    image: BRAND_ASSETS.welcomeInstrumental,
    summary: 'Choreographed traditional & contemporary welcome troupes creating unforgettable guest arrivals.',
    description:
      'Set a celebratory tone from the very first step with synchronized welcome dance troupes, Bride & Groom pathway processions, cold pyro sparks, and custom rhythmic soundtracks.',
    highlights: [
      'Bride & Groom royal entrance choreography',
      'Classical, folk & contemporary fusion welcome ensembles',
      'Synchronized pathway lighting & percussive cue tracks',
      'Costume-coordinated performers matched to venue palette',
    ],
    idealFor: 'Bride & Groom Entries, VIP Processions & Inaugurations',
  },
  {
    id: 'dj-events',
    title: 'DJ Events',
    startingPrice: 15000,
    priceLabel: '₹15,000 onwards',
    image: BRAND_ASSETS.djLighting,
    summary: 'High-octane live DJ performances with custom remixes, club-grade sub-bass, and synchronized FX.',
    description:
      'Turn receptions, sangeet nights, college culturals, and after-parties into packed dance floors with live mixing, Tamil/Hindi/EDM mashups, MC hosting, and kinetic lighting.',
    highlights: [
      'Live DJ booth with pro Pioneer CDJ / controller rig',
      'Custom playlist curation & live crowd-reading transitions',
      'Dynamic moving-head beams, fog/haze & visual projection',
      'Wireless MC hosting & interactive floor engagement',
    ],
    idealFor: 'Sangeet Nights, Reception After-Parties, College Fests & Clubs',
  },
  {
    id: 'instrumentals',
    title: 'Instrumentals',
    startingPrice: 10000,
    priceLabel: '₹10,000',
    image: BRAND_ASSETS.welcomeInstrumental,
    summary: 'Soulful live percussion, drums, violin, flute, and classical instrumental ensembles.',
    description:
      'Elevate intimate dinners, traditional ceremonies, and reception arrivals with live acoustic artistry — from high-energy stage drums to serene Carnatic flute, violin, and tabla.',
    highlights: [
      'Live concert drums, percussion jams & classical solos',
      'Bansuri flute, violin, keyboard & tabla ensembles',
      'Studio-grade instrument miking & warm acoustic mix',
      'Flexible solo, duo, or full ensemble lineups',
    ],
    idealFor: 'Ceremonies, Cocktail Dinners, Temple Events & Stage Openers',
  },
];

export const DEFAULT_DJ_PACKAGES: DjPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceInr: 199,
    priceUsd: 199,
    unitLabel: '/ event',
    tagline: 'Intimate celebrations & private lounges',
    powerRating: '1,000W',
    durationLabel: '3 Hours',
    features: [
      '3 Hours Live DJ Set',
      'Basic Sound System (1,000W)',
      'Standard Playlist Customization',
      'Dynamic Stage Lighting & FX',
      'Dedicated Sound Engineer',
      'Wireless Mic & MC Host',
      'Custom 3D Visual Projection',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    priceInr: 399,
    priceUsd: 399,
    unitLabel: '/ event',
    tagline: 'Private receptions & birthday galas',
    powerRating: '3,000W',
    durationLabel: '5 Hours',
    features: [
      '5 Hours Live DJ Set',
      'Pro Sound System (3,000W)',
      'Standard Playlist Customization',
      'Dynamic Stage Lighting & FX',
      'Dedicated Sound Engineer',
      'Wireless Mic & MC Host',
      'Custom 3D Visual Projection',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    priceInr: 699,
    priceUsd: 699,
    unitLabel: '/ event',
    tagline: 'Grand wedding sangeets & corporate nights',
    powerRating: '5,000W',
    durationLabel: '7 Hours',
    featured: true,
    features: [
      '7 Hours Live DJ Performance',
      'High-Impact Concert Sound (5,000W)',
      'Custom Playlist & Track Edits',
      'Dynamic Stage Lighting & FX',
      'Dedicated Sound Engineer',
      'Wireless Mic & MC Host',
      'Custom 3D Visual Projection',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceInr: 1299,
    priceUsd: 1299,
    unitLabel: '/ event',
    tagline: 'Full-night concert-scale productions',
    powerRating: '10,000W',
    durationLabel: 'Up to 10 Hours',
    features: [
      'Full Night Live DJ Set (Up to 10h)',
      'Tour-Grade Array Sound (10,000W)',
      'Custom Playlist & Track Edits',
      'Full Moving-Head Light Show & Fog',
      '2x Sound & Lighting Engineers',
      'Dual Wireless Mics & Pro MC',
      'Custom 3D Visual Projection',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    priceInr: 2499,
    priceUsd: 2499,
    unitLabel: '/ event',
    tagline: 'Stadium-grade headline shows & mega fests',
    powerRating: '25,000W+',
    durationLabel: 'Unlimited',
    features: [
      'Unlimited Performance Duration',
      'Ultra Concert Sound System (25,000W+)',
      'Exclusive Original Live Remixes & Stems',
      'Full Laser Show, CO2 Jets & Pyros',
      'Full Backstage Audio Crew & Director',
      'Multi-Wireless System & Celebrity MC',
      'Custom 3D Video Mapping & LED Wall',
    ],
  },
];

export const RAGA_STUDIO_SERVICES: RagaStudioService[] = [
  {
    id: 'plug-and-play',
    title: 'Plug & Play',
    priceLabel: '₹1,500/hour',
    priceValue: 1500,
    unit: 'hour',
    description:
      'Step into an acoustically treated rehearsal and jamming space stocked with professional backline amps, drum kit, keyboards, and PA monitoring.',
    features: ['Acoustically calibrated jam room', 'Pro PA monitors & mixer', 'Band & solo practice ready'],
  },
  {
    id: 'live-tracks',
    title: 'Live Tracks',
    priceLabel: '₹3,500/session',
    priceValue: 3500,
    unit: 'session',
    description:
      'Multi-track live instrument and vocal session recording captured through high-headroom preamps and studio condenser microphones.',
    features: ['Isolated multi-track capture', 'Dedicated recording engineer', 'Uncompressed 24-bit WAV stems'],
  },
  {
    id: 'vocal-training',
    title: 'Vocal Training',
    priceLabel: '₹2,000/hour',
    priceValue: 2000,
    unit: 'hour',
    description:
      'Studio mic coaching focused on breath discipline, pitch accuracy, tonal placement, and playback-ready studio vocal delivery.',
    features: ['Condenser mic technique coaching', 'Live pitch & phrasing feedback', 'Take-home reference recording'],
  },
  {
    id: 'karaoke-singing',
    title: 'Karaoke Singing',
    priceLabel: '₹1,200/hour',
    priceValue: 1200,
    unit: 'hour',
    description:
      'Record your favourite cinema or devotional tracks over studio-quality karaoke backing tracks with polished vocal balance.',
    features: ['Curated high-fidelity backing tracks', 'Warm vocal reverb & EQ polish', 'Mastered MP3/WAV export'],
  },
  {
    id: 'music-production',
    title: 'Music Production',
    priceLabel: '₹8,000/project',
    priceValue: 8000,
    unit: 'project',
    description:
      'End-to-end original composition, arrangement, programming, live instrument overdubs, mixing, and streaming-ready mastering.',
    features: ['Original arrangement & sound design', 'Live acoustic & synth layers', 'Streaming & broadcast master'],
  },
  {
    id: 'voice-mixing',
    title: 'Voice Mixing',
    priceLabel: '₹2,500/track',
    priceValue: 2500,
    unit: 'track',
    description:
      'Precision vocal editing, timing alignment, noise cleanup, analog-modeled compression, and stereo mastering for singles and voiceovers.',
    features: ['Breath & noise restoration', 'Harmonic EQ & dynamics polish', 'Radio & YouTube loudness spec'],
  },
  {
    id: 'greenmate-video-suite',
    title: 'Greenmate Video Suite',
    priceLabel: '₹2,500/hour',
    priceValue: 2500,
    unit: 'hour',
    description:
      'Full chroma-key green screen video suite equipped with key/fill softbox lighting and synced studio audio capture.',
    features: ['Evenly lit chroma-key backdrop', 'Synced broadcast-grade audio', 'Ideal for music videos & courses'],
  },
  {
    id: 'youtubers-studio',
    title: 'YouTubers Studio',
    priceLabel: '₹1,800/hour',
    priceValue: 1800,
    unit: 'hour',
    description:
      'Turnkey creator workspace for podcasts, video interviews, acoustic covers, and high-clarity talking-head channels.',
    features: ['Multi-mic podcast desk setup', 'Clean acoustic backdrop & lighting', 'Fast turnaround audio/video capture'],
  },
];

export const ACADEMY_COURSES: AcademyCourse[] = [
  {
    id: 'vocal-mastery',
    title: 'Vocal Mastery & Singing',
    feeLabel: '₹3,500/month',
    feeMonthly: 3500,
    duration: '3–6 months',
    description:
      'Structured vocal artistry spanning Classical, Semi-Classical, Film, and Devotional repertoire with live studio microphone practice.',
    curriculum: [
      'Classical, Semi-Classical, Film & Devotional',
      'Breath control and pitch accuracy',
      'Live mic singing',
      'Stage confidence',
    ],
  },
  {
    id: 'keyboard-synthesizer',
    title: 'Keyboard & Synthesizer',
    feeLabel: '₹3,500/month',
    feeMonthly: 3500,
    duration: '3–6 months',
    description:
      'Master contemporary keyboard accompaniment and lead synthesis combining Western harmonic theory with Indian melodic phrasing.',
    curriculum: [
      'Western chord theory',
      'Indian ragas on keys',
      'Finger dexterity',
      'Synthesizer sound design',
    ],
  },
  {
    id: 'flute-bansuri',
    title: 'Flute & Bansuri',
    feeLabel: '₹3,000/month',
    feeMonthly: 3000,
    duration: '3–6 months',
    description:
      'Develop warm bamboo tone production, breath control, classical ragas, and expressive film melodies under performing maestros.',
    curriculum: [
      'Embouchure techniques',
      'Finger-hole coverage',
      'Classical ragas',
      'Film melodies',
    ],
  },
  {
    id: 'tabla-percussion',
    title: 'Tabla & Indian Percussion',
    feeLabel: '₹3,000/month',
    feeMonthly: 3000,
    duration: '3–6 months',
    description:
      'Build rock-solid rhythmic fluency through traditional taal structures, crisp bol articulation, and real-time stage accompaniment.',
    curriculum: [
      'Rhythm cycles and Taals',
      'Bol recitations',
      'Finger speed',
      'Live stage accompaniment',
    ],
  },
];

export const ACADEMY_HIGHLIGHTS = [
  'One-to-one and small batches',
  'Live studio practice at Raga Studio',
  'Performance certification',
  'Stage showcase opportunities',
  'Weekend and weekday batches',
] as const;

interface CategorySeed {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  slots: Array<{ title: string; archiveTag: string; location?: string }>;
}

const PORTFOLIO_SEEDS: CategorySeed[] = [
  {
    id: 'wedding-events',
    name: 'Wedding Events',
    description: 'Grand wedding entries, Bride & Groom welcomes, hall ambiance, and reception moments.',
    coverImage: BRAND_ASSETS.weddingOrchestra,
    slots: [
      { title: 'Wedding Entry — Royal Reception', archiveTag: 'Wedding Entry', location: 'Erode' },
      { title: 'Bride & Groom Welcome Procession', archiveTag: 'Bride & Groom Welcome', location: 'Erode' },
      { title: 'Mulanur Grand Wedding Production', archiveTag: 'Mulanur', location: 'Mulanur' },
      { title: 'Modakurichi Reception Showcase', archiveTag: 'Modakurichi', location: 'Modakurichi' },
      { title: 'Hall Decoration & Ambient Audio', archiveTag: 'Hall Decoration', location: 'Erode' },
      { title: 'Grand Muhurtham Acoustic Setup', archiveTag: 'Event performances', location: 'Erode' },
      { title: 'Evening Reception Spotlight Entry', archiveTag: 'Wedding Entry', location: 'Perundurai' },
      { title: 'Bride & Groom Stage Reveal', archiveTag: 'Bride & Groom Welcome', location: 'Erode' },
      { title: 'Banquet Hall Sound & Decor Sync', archiveTag: 'Hall Decoration', location: 'Tiruppur' },
      { title: 'Wedding Gala Finale Highlights', archiveTag: 'Event performances', location: 'Erode' },
    ],
  },
  {
    id: 'dj-events',
    name: 'DJ Events',
    description: 'High-energy live DJ sets, crowd drops, club visuals, and wedding after-party highlights.',
    coverImage: BRAND_ASSETS.djLighting,
    slots: [
      { title: 'Live DJ Night — Reception Floor', archiveTag: 'DJ', location: 'Erode' },
      { title: 'Sangeet DJ Mashup & Drop', archiveTag: 'DJ', location: 'Erode' },
      { title: 'Mulanur Outdoor DJ Concert', archiveTag: 'Mulanur', location: 'Mulanur' },
      { title: 'Modakurichi Dance Floor Takeover', archiveTag: 'Modakurichi', location: 'Modakurichi' },
      { title: 'DJ Booth & BG Visuals Sync', archiveTag: 'BG Visuals', location: 'Erode' },
      { title: 'High-Bass Concert Rig Set', archiveTag: 'DJ', location: 'Salem' },
      { title: 'Wedding After-Party Live Mix', archiveTag: 'Event performances', location: 'Erode' },
      { title: 'LED Wall & Live DJ Performance', archiveTag: 'BG Visuals', location: 'Coimbatore' },
      { title: 'Nandha Campus DJ Finale', archiveTag: 'Nandha Colleges', location: 'Erode' },
      { title: 'Midnight Crowd Encore Session', archiveTag: 'DJ', location: 'Erode' },
    ],
  },
  {
    id: 'goldstar-orchestra',
    name: 'Goldstar Orchestra',
    description: 'Live orchestral sets, cinema hits, and crowd-favourite performances by Goldstar Orchestra.',
    coverImage: BRAND_ASSETS.weddingOrchestra,
    slots: [
      { title: 'Goldstar Live Orchestra Opening', archiveTag: 'Goldstar', location: 'Erode' },
      { title: 'Goldstar Retro Melody Medley', archiveTag: 'Goldstar', location: 'Erode' },
      { title: 'Mulanur Goldstar Concert Night', archiveTag: 'Mulanur', location: 'Mulanur' },
      { title: 'Modakurichi Live Orchestra Gala', archiveTag: 'Modakurichi', location: 'Modakurichi' },
      { title: 'Goldstar Duet & Rhythm Showcase', archiveTag: 'Goldstar', location: 'Erode' },
      { title: 'Live Stage Vocals & Full Band', archiveTag: 'Event performances', location: 'Gobichettipalayam' },
      { title: 'Reception Symphony Highlight', archiveTag: 'Goldstar', location: 'Erode' },
      { title: 'Goldstar Folk & Fusion Set', archiveTag: 'Goldstar', location: 'Bhavani' },
      { title: 'Family Celebration Live Concert', archiveTag: 'Event performances', location: 'Erode' },
      { title: 'Goldstar Grand Finale Encore', archiveTag: 'Goldstar', location: 'Erode' },
    ],
  },
  {
    id: 'welcome-dance',
    name: 'Welcome Dance',
    description: 'Choreographed welcome performances, Bride & Groom pathways, and festive processions.',
    coverImage: BRAND_ASSETS.welcomeInstrumental,
    slots: [
      { title: 'Traditional Welcome Performance', archiveTag: 'Welcome performances', location: 'Erode' },
      { title: 'Bride & Groom Grand Welcome', archiveTag: 'Bride & Groom Welcome', location: 'Erode' },
      { title: 'Pathway Lit Couple Entry Dance', archiveTag: 'Wedding Entry', location: 'Erode' },
      { title: 'Classical Fusion Welcome Troupe', archiveTag: 'Welcome performances', location: 'Mulanur' },
      { title: 'Modakurichi Festive Welcome Act', archiveTag: 'Modakurichi', location: 'Modakurichi' },
      { title: 'Royal Reception Procession', archiveTag: 'Bride & Groom Welcome', location: 'Erode' },
      { title: 'VIP Guest Inaugural Welcome', archiveTag: 'Welcome performances', location: 'Erode' },
      { title: 'Candlelight Pathway Choreography', archiveTag: 'Pathway Lighting', location: 'Perundurai' },
      { title: 'Folk Rhythm Welcome Ensemble', archiveTag: 'Welcome performances', location: 'Erode' },
      { title: 'Stage Arrival Celebration Act', archiveTag: 'Wedding Entry', location: 'Erode' },
    ],
  },
  {
    id: 'instrumental-performances',
    name: 'Instrumental Performances',
    description: 'Live concert drums, percussion jams, classical flute, violin, and acoustic stage sets.',
    coverImage: BRAND_ASSETS.welcomeInstrumental,
    slots: [
      { title: 'Live Concert Drums Showcase', archiveTag: 'Drums', location: 'Erode' },
      { title: 'Percussion & Drums Fusion Solo', archiveTag: 'Drums', location: 'Erode' },
      { title: 'Reception Entry Live Drums', archiveTag: 'Drums', location: 'Mulanur' },
      { title: 'Classical Flute & Tabla Acoustic Set', archiveTag: 'Event performances', location: 'Erode' },
      { title: 'Live Violin & Keys Medley', archiveTag: 'Event performances', location: 'Modakurichi' },
      { title: 'High-Energy Stage Drum Battle', archiveTag: 'Drums', location: 'Erode' },
      { title: 'Traditional Instrumental Welcome', archiveTag: 'Welcome performances', location: 'Erode' },
      { title: 'Orchestral Percussion Feature', archiveTag: 'Goldstar', location: 'Erode' },
      { title: 'Campus Stage Live Drums Opener', archiveTag: 'Nandha Colleges', location: 'Erode' },
      { title: 'Acoustic Finale Ensemble', archiveTag: 'Event performances', location: 'Erode' },
    ],
  },
  {
    id: 'corporate-college-events',
    name: 'Corporate & College Events',
    description: 'Nandha Colleges festivals, corporate annual days, auditorium conferences, and campus shows.',
    coverImage: BRAND_ASSETS.heroStage,
    slots: [
      { title: 'Nandha Colleges Annual Cultural Fest', archiveTag: 'Nandha Colleges', location: 'Erode' },
      { title: 'Corporate Events — Annual Gala Night', archiveTag: 'Corporate Events', location: 'Erode' },
      { title: 'Nandha Colleges Auditorium Concert', archiveTag: 'Nandha Colleges', location: 'Erode' },
      { title: 'Corporate Awards & Stage Audio', archiveTag: 'Corporate Events', location: 'Coimbatore' },
      { title: 'College Pro-Show Sound & Stage', archiveTag: 'Nandha Colleges', location: 'Erode' },
      { title: 'Executive Summit Audio Production', archiveTag: 'Corporate Events', location: 'Salem' },
      { title: 'Campus Band & DJ Night', archiveTag: 'Event performances', location: 'Erode' },
      { title: 'Corporate Product Launch Showcase', archiveTag: 'Corporate Events', location: 'Tiruppur' },
      { title: 'Inter-Collegiate Music Competition', archiveTag: 'Nandha Colleges', location: 'Erode' },
      { title: 'Corporate Conference Plenary Audio', archiveTag: 'Corporate Events', location: 'Erode' },
    ],
  },
  {
    id: 'audio-lighting-productions',
    name: 'Audio & Lighting Productions',
    description: 'Stage lighting arrays, pathway lighting, BG visuals, hall & stage decoration productions.',
    coverImage: BRAND_ASSETS.heroStage,
    slots: [
      { title: 'Stage Lighting & Moving-Head Show', archiveTag: 'Stage Lighting', location: 'Erode' },
      { title: 'Pathway Lighting Grand Walkway', archiveTag: 'Pathway Lighting', location: 'Erode' },
      { title: 'BG Visuals & LED Backdrop Mapping', archiveTag: 'BG Visuals', location: 'Erode' },
      { title: 'Stage Decoration & Architectural Wash', archiveTag: 'Stage Decoration', location: 'Erode' },
      { title: 'Hall Decoration Illumination Rig', archiveTag: 'Hall Decoration', location: 'Mulanur' },
      { title: 'Line-Array Concert Sound Check', archiveTag: 'Stage Lighting', location: 'Erode' },
      { title: 'Modakurichi Outdoor Stage Truss', archiveTag: 'Modakurichi', location: 'Modakurichi' },
      { title: 'Synchronized DMX Beam Choreography', archiveTag: 'Stage Lighting', location: 'Erode' },
      { title: 'Reception Hall Pathway Glow', archiveTag: 'Pathway Lighting', location: 'Erode' },
      { title: 'Full Arena Visual & Audio Rig', archiveTag: 'BG Visuals', location: 'Erode' },
    ],
  },
];

export function createDefaultPortfolioCategories(): PortfolioCategory[] {
  return PORTFOLIO_SEEDS.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    coverImage: cat.coverImage,
    hidden: false,
    slots: cat.slots.map((slot, index) => ({
      id: `${cat.id}-slot-${String(index + 1).padStart(2, '0')}`,
      categoryId: cat.id,
      slotNumber: index + 1,
      title: slot.title,
      archiveTag: slot.archiveTag,
      location: slot.location,
      status: 'awaiting' as const,
      videoUrl: null,
      driveFileId: null,
      driveWebViewLink: null,
      mimeType: null,
      fileSizeBytes: 0,
      updatedAt: null,
      hidden: false,
    })),
  }));
}

export function getVisiblePortfolioCategories(
  categories: PortfolioCategory[],
): PortfolioCategory[] {
  return categories
    .filter((cat) => !cat.hidden)
    .map((cat) => ({
      ...cat,
      slots: cat.slots.filter((slot) => !slot.hidden),
    }))
    .filter((cat) => cat.slots.length > 0);
}

export function getVisibleItems<T extends { hidden?: boolean }>(items: T[]): T[] {
  return items.filter((item) => !item.hidden);
}

export function formatRupeeUnitLabel(amount: number, unit?: string, suffix?: string): string {
  const base = formatPrice(amount, 'INR');
  if (unit) return `${base}/${unit}`;
  if (suffix) return `${base} ${suffix}`;
  return base;
}

export function formatPrice(amount: number, currency: CurrencyCode): string {
  if (currency === 'INR') {
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
  }
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

export function getDjPackagePrice(pkg: DjPackage, currency: CurrencyCode): number {
  return currency === 'INR' ? pkg.priceInr : pkg.priceUsd;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(2)} ${units[idx]}`;
}

export function computeStorageStats(
  categories: PortfolioCategory[],
  quotaBytes: number = STORAGE_QUOTA_BYTES,
  maxFileBytes: number = MAX_VIDEO_FILE_BYTES,
): StorageStats {
  let usedBytes = 0;
  let publishedCount = 0;
  let totalSlots = 0;

  for (const cat of categories) {
    for (const slot of cat.slots) {
      totalSlots += 1;
      if (slot.status === 'published' && slot.videoUrl) {
        publishedCount += 1;
        usedBytes += Math.max(0, slot.fileSizeBytes || 0);
      }
    }
  }

  const remainingBytes = Math.max(0, quotaBytes - usedBytes);
  const usedPercent = quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;

  return {
    usedBytes,
    quotaBytes,
    maxFileBytes,
    remainingBytes,
    usedPercent,
    publishedCount,
    totalSlots,
  };
}

export function getServiceOptionsForCategory(
  category: BusinessVertical,
  djPackages: DjPackage[],
  currency: CurrencyCode,
  signatureServices: SignatureService[] = SIGNATURE_SERVICES,
  ragaStudioServices: RagaStudioService[] = RAGA_STUDIO_SERVICES,
  academyCourses: AcademyCourse[] = ACADEMY_COURSES,
): string[] {
  switch (category) {
    case 'SS Audios – Event & Entertainment':
      return getVisibleItems(signatureServices).map((s) => `${s.title} (${s.priceLabel})`);
    case 'DJ Event Packages':
      return getVisibleItems(djPackages).map(
        (p) => `${p.name} Package (${formatPrice(getDjPackagePrice(p, currency), currency)} ${p.unitLabel})`,
      );
    case 'Raga Studio':
      return getVisibleItems(ragaStudioServices).map((s) => `${s.title} (${s.priceLabel})`);
    case 'Sampoorna Music Academy':
      return getVisibleItems(academyCourses).map((c) => `${c.title} (${c.feeLabel})`);
  }
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function validateEnquiryForm(data: EnquiryFormData): EnquiryValidationErrors {
  const errors: EnquiryValidationErrors = {};

  if (!data.fullName.trim() || data.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name.';
  }

  const digits = normalizePhoneDigits(data.mobile);
  if (!digits) {
    errors.mobile = 'Please enter your mobile number.';
  } else if (digits.length < 10 || digits.length > 15) {
    errors.mobile = 'Please enter a valid 10-digit mobile number.';
  }

  if (data.email.trim()) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
    if (!emailOk) {
      errors.email = 'Please enter a valid email address.';
    }
  }

  if (!data.category) {
    errors.category = 'Please select a business category.';
  }

  if (!data.service.trim()) {
    errors.service = 'Please select a service, package, or course.';
  }

  return errors;
}

export function buildWhatsAppMessage(data: EnquiryFormData): string {
  const lines: string[] = [
    'Hello SS Audios!',
    '',
    'I would like to enquire about your services.',
    '',
    'Customer Details:',
    `Name: ${data.fullName.trim() || 'Not provided'}`,
    `Mobile: ${data.mobile.trim() || 'Not provided'}`,
    `Email: ${data.email.trim() || 'Not provided'}`,
    '',
    'Enquiry Details:',
    `Business Category: ${data.category}`,
    `Service: ${data.service.trim() || 'Not selected'}`,
    `Date: ${data.date.trim() || 'Flexible / To be decided'}`,
    `Time: ${data.time.trim() || 'Flexible'}`,
  ];

  if (data.category === 'Raga Studio') {
    if (data.sessionDuration.trim()) {
      lines.push(`Session Duration: ${data.sessionDuration.trim()}`);
    }
    if (data.recordingRequirements.trim()) {
      lines.push(`Recording Requirements: ${data.recordingRequirements.trim()}`);
    }
    if (data.budget.trim()) {
      lines.push(`Budget: ${data.budget.trim()}`);
    }
  } else if (data.category === 'Sampoorna Music Academy') {
    if (data.preferredBatch.trim()) {
      lines.push(`Preferred Batch: ${data.preferredBatch.trim()}`);
    }
    if (data.learningLevel.trim()) {
      lines.push(`Learning Level: ${data.learningLevel.trim()}`);
    }
  } else {
    lines.push(`Venue: ${data.venue.trim() || 'To be confirmed'}`);
    lines.push(`Expected Audience: ${data.audience.trim() || 'Not specified'}`);
    lines.push(`Budget: ${data.budget.trim() || 'Flexible'}`);
  }

  lines.push('');
  lines.push('Additional Requirements:');
  lines.push(data.additionalRequirements.trim() || 'Please share availability and pricing details.');
  lines.push('');
  lines.push('Please contact me with further details.');
  lines.push('');
  lines.push('Thank you!');

  return lines.join('\n');
}

export function buildWhatsAppUrl(data: EnquiryFormData): string {
  const message = buildWhatsAppMessage(data);
  return `${BUSINESS_CONTACT.whatsappBase}?text=${encodeURIComponent(message)}`;
}

export function createInitialEnquiryDraft(): EnquiryFormData {
  return {
    fullName: '',
    mobile: '',
    email: '',
    category: 'SS Audios – Event & Entertainment',
    service: `${SIGNATURE_SERVICES[0].title} (${SIGNATURE_SERVICES[0].priceLabel})`,
    date: '',
    time: '',
    venue: '',
    audience: '',
    budget: '',
    sessionDuration: '2 Hours',
    recordingRequirements: '',
    preferredBatch: 'Weekend Batch',
    learningLevel: 'Beginner',
    additionalRequirements: '',
  };
}
