import {
  AlgorithmWeights,
  AuditLogEntry,
  CommentItem,
  CommunityNote,
  NewsPost,
  SiteSettings,
  User,
} from './types';

export interface DesignerColorPreset {
  id: string;
  name: string;
  subtitle: string;
  primaryColor: string;
  secondaryAiColor: string;
  breakingAlertColor: string;
  darkBgCanvas: string;
  darkBgCard: string;
  lightBgCanvas: string;
  lightBgCard: string;
}

export const DESIGNER_COLOR_PRESETS: DesignerColorPreset[] = [
  {
    id: 'react_obsidian',
    name: 'React Obsidian & Electric Cyan',
    subtitle: 'Inspired by react.dev v19.3 & Linear — High-contrast editorial authority',
    primaryColor: '#38BDF8',
    secondaryAiColor: '#818CF8',
    breakingAlertColor: '#EF4444',
    darkBgCanvas: '#0B0F17',
    darkBgCard: '#151B26',
    lightBgCanvas: '#F6F5F2',
    lightBgCard: '#FFFFFF',
  },
  {
    id: 'bloomberg_terminal',
    name: 'Terminal Amber & Carbon',
    subtitle: 'Financial & breaking-news wire aesthetic with high-urgency amber accents',
    primaryColor: '#F59E0B',
    secondaryAiColor: '#38BDF8',
    breakingAlertColor: '#F43F5E',
    darkBgCanvas: '#090A0F',
    darkBgCard: '#12151E',
    lightBgCanvas: '#FAF8F5',
    lightBgCard: '#FFFFFF',
  },
  {
    id: 'verified_emerald',
    name: 'Cyber Emerald & Deep Slate',
    subtitle: 'Fact-check & verification-first palette with bio-luminescent mint highlights',
    primaryColor: '#10B981',
    secondaryAiColor: '#06B6D4',
    breakingAlertColor: '#EF4444',
    darkBgCanvas: '#07110E',
    darkBgCard: '#10201B',
    lightBgCanvas: '#F3F7F5',
    lightBgCard: '#FFFFFF',
  },
  {
    id: 'royal_indigo',
    name: 'Quantum Indigo & Violet Glass',
    subtitle: 'Futuristic AI newsroom palette with deep spatial depth',
    primaryColor: '#6366F1',
    secondaryAiColor: '#EC4899',
    breakingAlertColor: '#EF4444',
    darkBgCanvas: '#0B0B16',
    darkBgCard: '#15162B',
    lightBgCanvas: '#F5F5FA',
    lightBgCard: '#FFFFFF',
  },
  {
    id: 'crimson_broadcast',
    name: 'Broadcast Crimson & Titanium',
    subtitle: 'Classic live television newsroom energy with modern glassmorphic surfaces',
    primaryColor: '#F43F5E',
    secondaryAiColor: '#8B5CF6',
    breakingAlertColor: '#FB7185',
    darkBgCanvas: '#110B0E',
    darkBgCard: '#1E1419',
    lightBgCanvas: '#F9F5F6',
    lightBgCard: '#FFFFFF',
  },
];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'PULSE NEWS',
  siteTagline: 'Global Journalism & Real-Time News Network',
  logoEmblem: 'globe',
  breakingBannerText:
    'LIVE COVERAGE: Global Clean-Energy Grid Milestone Reached in Tokyo • 48 Verified Eyewitness Streams Active Worldwide',
  theme: {
    mode: 'dark',
    presetId: 'react_obsidian',
    primaryColor: '#38BDF8',
    secondaryAiColor: '#818CF8',
    breakingAlertColor: '#EF4444',
    darkBgCanvas: '#0B0F17',
    darkBgCard: '#151B26',
    lightBgCanvas: '#F6F5F2',
    lightBgCard: '#FFFFFF',
    glassBlurPx: 16,
    tilt3DIntensity: 12,
    enable3DGlobe: true,
    enable3DTiltCards: true,
    fontStyle: 'editorial',
  },
  algorithm: {
    eyewitnessBoost: 1.5,
    trustMultiplierWeight: 2.0,
    velocityWeight: 1.2,
    timeDecayGravity: 1.8,
  },
  features: {
    maintenanceLockdown: false,
    aiAutoSummary: true,
    aiMediaForensics: true,
    godModeInlineEdit: false,
    autoTranslateForeign: false,
  },
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'commander_chief',
    displayName: 'Elena Vance (Editor-in-Chief)',
    email: 'elena@pulsenews.global',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bio: 'Super-Admin & Founding Executive Editor at Pulse News. Overseeing global fact-verification, AI forensics, and citizen reporter standards.',
    location: 'New York • Global Desk',
    role: 'admin',
    status: 'active',
    verificationTier: 'news_organization',
    trustScore: 0.99,
    joinedAt: '2025-01-10',
    followersCount: 148200,
    reportsCount: 312,
  },
  {
    id: 'user-kenji',
    username: 'kenji_takahashi',
    displayName: 'Kenji Takahashi',
    email: 'kenji@tokyo-press.jp',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Verified Science & Infrastructure Correspondent in Tokyo. Covering high-speed rail, fusion energy, and seismic engineering on the ground.',
    location: 'Tokyo, Japan',
    role: 'user',
    status: 'active',
    verificationTier: 'journalist',
    trustScore: 0.96,
    joinedAt: '2025-03-14',
    followersCount: 64500,
    reportsCount: 142,
  },
  {
    id: 'user-amina',
    username: 'amina_eyewitness',
    displayName: 'Amina Okafor',
    email: 'amina@citizenwatch.ng',
    avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&auto=format&fit=crop&q=80',
    bio: 'Tier-2 Verified Citizen Photojournalist & Urban Tech Reporter. Capturing real-time street-level updates across West Africa & Europe.',
    location: 'Lagos, Nigeria',
    role: 'user',
    status: 'active',
    verificationTier: 'verified_citizen',
    trustScore: 0.92,
    joinedAt: '2025-06-01',
    followersCount: 29400,
    reportsCount: 87,
  },
  {
    id: 'user-marcus',
    username: 'marcus_stormwatch',
    displayName: 'Dr. Marcus Thorne',
    email: 'mthorne@atmos-watch.org',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'Atmospheric Physicist & Severe Weather Field Reporter. Live radar telemetry, coastal surge monitoring, and climate verification.',
    location: 'Miami / Atlantic Basin',
    role: 'moderator',
    status: 'active',
    verificationTier: 'journalist',
    trustScore: 0.95,
    joinedAt: '2025-04-20',
    followersCount: 91300,
    reportsCount: 204,
  },
  {
    id: 'user-claire',
    username: 'claire_dubois',
    displayName: 'Claire Dubois',
    email: 'claire@euro-civic.eu',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    bio: 'European Policy & Transit Correspondent in Paris. On-the-ground coverage of urban mobility, architecture, and civic demonstrations.',
    location: 'Paris, France',
    role: 'user',
    status: 'active',
    verificationTier: 'verified_citizen',
    trustScore: 0.89,
    joinedAt: '2025-08-12',
    followersCount: 19800,
    reportsCount: 64,
  },
  {
    id: 'user-speculator',
    username: 'viral_rumor_hub',
    displayName: 'FastBreaker24',
    email: 'fast@rumor.net',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    bio: 'Aggregating viral clips from around the web.',
    location: 'London, UK',
    role: 'user',
    status: 'warned',
    verificationTier: 'standard',
    trustScore: 0.34,
    joinedAt: '2026-09-01',
    followersCount: 1200,
    reportsCount: 19,
  },
];

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

export const INITIAL_POSTS: NewsPost[] = [
  {
    id: 'post-1',
    authorId: 'user-kenji',
    headline: 'Tokyo Unveils Autonomous Maglev Express Pod Linking Haneda to Shibuya in 6 Minutes',
    bodyText:
      'Reporting live from Shinagawa Terminal where JR East and Tokyo Metro engineers just completed the first public full-speed commuter run of the superconducting L0-Urban Maglev pod. Peak velocity reached 310 km/h inside the low-noise vacuum corridor with zero vibration recorded in the cabin.',
    aiSummary: [
      'First passenger test completed between Haneda Airport and Shibuya in 6 minutes 12 seconds.',
      'Superconducting magnetic levitation cuts acoustic noise by 68% compared to conventional rail.',
      'Commercial public rollout scheduled for Q2 2027 with 90-second automated headways.',
    ],
    translations: {
      es: {
        headline: 'Tokio inaugura cápsula Maglev autónoma que une Haneda y Shibuya en 6 minutos',
        bodyText:
          'Reportando en vivo desde la Terminal Shinagawa donde ingenieros completaron la primera prueba pública a máxima velocidad del Maglev urbano superconductor.',
      },
      fr: {
        headline: 'Tokyo dévoile une navette Maglev autonome reliant Haneda à Shibuya en 6 minutes',
        bodyText:
          'En direct du terminal de Shinagawa où les ingénieurs viennent d’achever le premier essai public à grande vitesse de la capsule Maglev urbaine.',
      },
      ar: {
        headline: 'طوكيو تكشف عن كبسولة ماغليف ذاتية القيادة تربط هانيدا بشيبويا في 6 دقائق',
        bodyText:
          'تغطية مباشرة من محطة شيناغاوا حيث أكمل المهندسون أول رحلة ركاب تجريبية فائقة السرعة بتقنية الرفع المغناطيسي.',
      },
      zh: {
        headline: '东京发布全自动磁悬浮快线舱：羽田机场至涩谷仅需6分钟',
        bodyText:
          '来自品川航站楼的现场直击：工程师刚刚完成了超导城市磁悬浮舱的首次公开全速载客测试，舱内实现零振动运行。',
      },
      ja: {
        headline: '羽田〜渋谷を6分で結ぶ自動運転リニアエクスプレス、品川ターミナルで公開試運転に成功',
        bodyText:
          '品川ターミナルから現場中継。JR東日本と東京メトロの技術陣が超電導都市型リニアポッドの初の公開高速走行試験を完了しました。',
      },
    },
    category: 'tech',
    status: 'pinned_breaking',
    tags: ['#TokyoMaglev', '#FutureTransit', '#EyewitnessTech', '#Japan'],
    isEyewitness: true,
    isBreakingPinned: true,
    externalSourceUrl: 'https://jreast.co.jp/press/maglev-urban-test',
    locationName: 'Shinagawa, Tokyo, Japan',
    latitude: 35.6284,
    longitude: 139.7387,
    privacyLevel: 'exact',
    media: [
      {
        id: 'm-1a',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-fast-train-passing-by-a-station-42466-large.mp4',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
        caption: '4K 60fps Eyewitness Capture: Maglev pod entering Bay Platform 4',
        durationSeconds: 38,
      },
      {
        id: 'm-1b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1000&auto=format&fit=crop&q=80',
        caption: 'Shibuya aerial corridor telemetry hub',
      },
      {
        id: 'm-1c',
        type: 'panorama_360',
        url: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=1600&auto=format&fit=crop&q=80',
        caption: '360° Interactive Spatial Capture: Shinagawa Maglev Concourse Deck',
      },
    ],
    upvotes: 1840,
    downvotes: 32,
    commentCount: 214,
    viewCount: 48900,
    shareCount: 612,
    velocityPer15m: 4.8,
    createdAt: hoursAgo(1.2),
    forensics: {
      authenticityScore: 99,
      exifVerified: true,
      gpsWeatherMatch: true,
      deepfakeProbability: 1,
      recycledFootageCheck: 'Original Capture',
      deviceSignature: 'Sony FX3 • C2PA Cryptographic Content Credentials Verified',
    },
  },
  {
    id: 'post-2',
    authorId: 'user-marcus',
    headline: 'Emergency Coastal Surge Barriers Deployed in Rotterdam Ahead of North Sea Gale',
    bodyText:
      'Standing at the Maeslantkering sector where automated storm-surge arms have just swung shut for the first time this season. Wind gusts registering 118 km/h at the offshore buoy while maritime traffic holds in the protected inner canal.',
    aiSummary: [
      'Maeslantkering storm-surge barrier closed automatically at 05:40 UTC as water levels rose +3.1m above normal.',
      'All residential polders remain dry and secure; port cargo operations paused for 8 hours.',
      'Meteorological sensors predict peak swell to subside by 19:00 local time.',
    ],
    translations: {
      es: {
        headline: 'Despliegan barreras costeras de emergencia en Róterdam ante temporal del Mar del Norte',
        bodyText:
          'En directo desde el sector Maeslantkering donde las compuertas automáticas acaban de cerrarse ante ráfagas de 118 km/h.',
      },
      fr: {
        headline: 'Déploiement des barrières anti-tempête à Rotterdam face à la tempête en mer du Nord',
        bodyText:
          'En direct du secteur Maeslantkering où les bras automatisés viennent de se fermer face à des rafales de 118 km/h.',
      },
      ar: {
        headline: 'إغلاق حواجز الأمواج العملاقة في روتردام استجابةً لعاصفة بحر الشمال',
        bodyText:
          'من موقع مايسلانتكيرينغ حيث أُغلقت البوابات الهيدروليكية العملاقة تلقائياً مع وصول سرعة الرياح إلى 118 كم/ساعة.',
      },
    },
    category: 'weather_disaster',
    status: 'published',
    tags: ['#Rotterdam', '#StormWatch', '#ClimateEngineering', '#NorthSea'],
    isEyewitness: true,
    isBreakingPinned: false,
    externalSourceUrl: 'https://waterinfo.rws.nl/live-surge',
    locationName: 'Hoek van Holland, Rotterdam',
    latitude: 51.9775,
    longitude: 4.165,
    privacyLevel: 'exact',
    media: [
      {
        id: 'm-2a',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-crashing-on-a-rocky-shore-41612-large.mp4',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1000&auto=format&fit=crop&q=80',
        caption: 'North Sea surge hitting outer breakwater seawall',
        durationSeconds: 29,
      },
      {
        id: 'm-2b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1000&auto=format&fit=crop&q=80',
        caption: 'Offshore anemometer and tide gauge readout',
      },
    ],
    upvotes: 1120,
    downvotes: 19,
    commentCount: 138,
    viewCount: 31200,
    shareCount: 405,
    velocityPer15m: 3.4,
    createdAt: hoursAgo(2.4),
    forensics: {
      authenticityScore: 98,
      exifVerified: true,
      gpsWeatherMatch: true,
      deepfakeProbability: 2,
      recycledFootageCheck: 'Original Capture',
      deviceSignature: 'iPhone 17 Pro • Apple ProRes C2PA Signed',
    },
  },
  {
    id: 'post-3',
    authorId: 'user-amina',
    headline: 'Lagos Solar Micro-Grid Powers 40,000 Homes & Tech Hubs Through 100% Battery Storage',
    bodyText:
      'On the ground in Yaba tech district where the new decentralized 85MW community solar-plus-sodium-ion storage array completed its first 72-hour continuous islanded operation, eliminating diesel backup generators across 14 neighborhoods.',
    aiSummary: [
      'New 85MW decentralized solar & sodium-ion array in Yaba achieves 100% uptime over 72 hours.',
      'Local startups and hospitals report 42% lower energy costs and zero diesel emissions.',
      'Blueprint is now being replicated in Nairobi, Accra, and Johannesburg.',
    ],
    category: 'science',
    status: 'published',
    tags: ['#CleanEnergy', '#LagosTech', '#SolarGrid', '#AfricaRising'],
    isEyewitness: true,
    isBreakingPinned: false,
    locationName: 'Yaba, Lagos, Nigeria',
    latitude: 6.5095,
    longitude: 3.3711,
    privacyLevel: 'city',
    media: [
      {
        id: 'm-3a',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1000&auto=format&fit=crop&q=80',
        caption: 'Rooftop and canopy solar arrays across Yaba innovation corridor',
      },
      {
        id: 'm-3b',
        type: 'panorama_360',
        url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1600&auto=format&fit=crop&q=80',
        caption: '360° Substation & Sodium-Ion Battery Control Room',
      },
    ],
    upvotes: 1490,
    downvotes: 24,
    commentCount: 176,
    viewCount: 36800,
    shareCount: 530,
    velocityPer15m: 3.9,
    createdAt: hoursAgo(3.1),
    forensics: {
      authenticityScore: 97,
      exifVerified: true,
      gpsWeatherMatch: true,
      deepfakeProbability: 1,
      recycledFootageCheck: 'Original Capture',
      deviceSignature: 'Canon EOS R5 II • GPS Telemetry Verified',
    },
  },
  {
    id: 'post-4',
    authorId: 'user-claire',
    headline: 'Paris Seine River Autonomous Electric Ferry Fleet Opens to Commuters This Morning',
    bodyText:
      'Filming from Pont de l’Alma where zero-emission hydrofoil river shuttles are boarding morning commuters every 4 minutes. The vessels lift above the water surface at 18 knots to prevent wake damage to historic riverbanks.',
    aiSummary: [
      'Fleet of 24 hydrofoil electric ferries launched along the central Seine corridor.',
      'Accepts standard Navigo transit passes with zero additional fare surcharge.',
      'AI lidar docking system completes passenger boarding in under 45 seconds.',
    ],
    category: 'local',
    status: 'published',
    tags: ['#ParisMobility', '#Hydrofoil', '#GreenTransit', '#Seine'],
    isEyewitness: true,
    isBreakingPinned: false,
    locationName: 'Pont de l’Alma, Paris, France',
    latitude: 48.8634,
    longitude: 2.3018,
    privacyLevel: 'exact',
    media: [
      {
        id: 'm-4a',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80',
        caption: 'Morning commuters boarding at Pont de l’Alma floating pier',
      },
      {
        id: 'm-4b',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1000&auto=format&fit=crop&q=80',
        caption: 'Seine river corridor view at sunrise',
      },
    ],
    upvotes: 860,
    downvotes: 15,
    commentCount: 94,
    viewCount: 22400,
    shareCount: 280,
    velocityPer15m: 2.3,
    createdAt: hoursAgo(4.5),
    forensics: {
      authenticityScore: 96,
      exifVerified: true,
      gpsWeatherMatch: true,
      deepfakeProbability: 2,
      recycledFootageCheck: 'Original Capture',
      deviceSignature: 'Leica Q3 • Authentic EXIF Timestamp',
    },
  },
  {
    id: 'post-5',
    authorId: 'user-speculator',
    headline: 'UNVERIFIED CLAIM: Massive Blackout Hits All of Manhattan Grid Right Now?!',
    bodyText:
      'Saw this photo circulating online showing total darkness across Lower Manhattan skyscrapers tonight! Can anyone in NYC confirm if the entire grid went down?',
    aiSummary: [
      'Viral post claims a grid-wide blackout across Lower Manhattan.',
      'COMMUNITY FACT-CHECK ALERT: Image dates back to 2019 localized transformer outage; Con Edison live telemetry shows 99.98% normal grid operation today.',
      'Ranked lower automatically by Pulse Truth-Weighted Algorithm.',
    ],
    category: 'breaking',
    status: 'disputed',
    tags: ['#NYC', '#GridCheck', '#FactCheckRequired'],
    isEyewitness: false,
    isBreakingPinned: false,
    locationName: 'Manhattan, New York, USA',
    latitude: 40.758,
    longitude: -73.9855,
    privacyLevel: 'city',
    media: [
      {
        id: 'm-5a',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1000&auto=format&fit=crop&q=80',
        caption: 'Uploaded image flagged by AI Reverse-Image Forensics',
      },
    ],
    upvotes: 145,
    downvotes: 420,
    commentCount: 89,
    viewCount: 15400,
    shareCount: 31,
    velocityPer15m: 0.5,
    createdAt: hoursAgo(2.0),
    forensics: {
      authenticityScore: 22,
      exifVerified: false,
      gpsWeatherMatch: false,
      deepfakeProbability: 12,
      recycledFootageCheck: 'Previously Indexed',
      deviceSignature: 'Stripped EXIF Metadata • Web Re-upload Detected',
    },
  },
  {
    id: 'post-6',
    authorId: 'user-admin',
    headline: 'UN Global AI Governance & Open-Verify Protocol Signed by 64 Nations in Geneva / NYC',
    bodyText:
      'Major milestone for digital journalism: 64 countries and 120 press coalitions have ratified the Open-Verify C2PA standard, mandating cryptographic camera signatures on public broadcast footage to protect citizen reporters and combat synthetic misinformation.',
    aiSummary: [
      '64 nations sign the Open-Verify C2PA cryptographic media standard.',
      'Protects independent citizen journalists with verifiable proof-of-capture badges.',
      'Major camera and smartphone makers will enable hardware-level timestamping by default.',
    ],
    category: 'politics',
    status: 'published',
    tags: ['#MediaIntegrity', '#OpenVerify', '#Journalism', '#GlobalPolicy'],
    isEyewitness: false,
    isBreakingPinned: false,
    externalSourceUrl: 'https://c2pa.org/open-verify-charter',
    locationName: 'United Nations HQ, New York, USA',
    latitude: 40.7489,
    longitude: -73.968,
    privacyLevel: 'exact',
    media: [
      {
        id: 'm-6a',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80',
        caption: 'Plenary assembly ratification vote on digital provenance standards',
      },
    ],
    upvotes: 2150,
    downvotes: 44,
    commentCount: 310,
    viewCount: 62300,
    shareCount: 890,
    velocityPer15m: 4.1,
    createdAt: hoursAgo(5.2),
    forensics: {
      authenticityScore: 100,
      exifVerified: true,
      gpsWeatherMatch: true,
      deepfakeProbability: 0,
      recycledFootageCheck: 'Original Capture',
      deviceSignature: 'Pulse Newsroom Wire • Official Press Pool Feed',
    },
  },
];

export const INITIAL_COMMUNITY_NOTES: CommunityNote[] = [
  {
    id: 'note-1',
    postId: 'post-5',
    authorId: 'user-admin',
    noteText:
      'This photo is from July 2019, not tonight. Con Edison live outage maps and verified eyewitnesses in Midtown Manhattan confirm the NYC electrical grid is operating normally at 99.98% capacity.',
    sourcesCited: [
      'https://outagemap.coned.com',
      'https://ny1.com/nyc/all-boroughs/grid-status-live',
    ],
    status: 'rated_misleading',
    helpfulVotes: 618,
    unhelpfulVotes: 11,
    createdAt: hoursAgo(1.7),
  },
  {
    id: 'note-2',
    postId: 'post-1',
    authorId: 'user-marcus',
    noteText:
      'Additional Technical Context: The 6-minute travel time applies to the express non-stop pod between Haneda Terminal 3 and Shibuya South Station. Commuter trains making intermediate stops take 9 minutes.',
    sourcesCited: ['https://jreast.co.jp/press/maglev-timetable.pdf'],
    status: 'rated_helpful',
    helpfulVotes: 342,
    unhelpfulVotes: 4,
    createdAt: hoursAgo(0.9),
  },
];

export const INITIAL_COMMENTS: CommentItem[] = [
  // Post 1: Tokyo Maglev
  {
    id: 'c-1',
    postId: 'post-1',
    authorId: 'user-amina',
    parentCommentId: null,
    content:
      'The acoustic reduction on this pod is incredible! You can barely hear it glide into the platform even at high speed.',
    upvotes: 84,
    createdAt: hoursAgo(1.0),
  },
  {
    id: 'c-2',
    postId: 'post-1',
    authorId: 'user-kenji',
    parentCommentId: 'c-1',
    content:
      'Confirmed from the platform! It measured under 58 decibels on my meter from 5 meters away.',
    upvotes: 52,
    createdAt: hoursAgo(0.8),
  },
  {
    id: 'c-1b',
    postId: 'post-1',
    authorId: 'user-marcus',
    parentCommentId: null,
    content:
      'Having a 6-minute connection between Haneda Airport and Shibuya will completely transform international commuter logistics in Tokyo.',
    upvotes: 39,
    createdAt: hoursAgo(0.6),
  },
  {
    id: 'c-1c',
    postId: 'post-1',
    authorId: 'user-claire',
    parentCommentId: 'c-1b',
    content:
      'Agreed—we are studying this exact superconducting corridor model for the Grand Paris Express airport link.',
    upvotes: 27,
    createdAt: hoursAgo(0.4),
  },
  // Post 2: Rotterdam Surge Barriers
  {
    id: 'c-3',
    postId: 'post-2',
    authorId: 'user-claire',
    parentCommentId: null,
    content:
      'Dutch engineering never ceases to amaze. Stay safe out there on the observation pier, Dr. Thorne!',
    upvotes: 64,
    createdAt: hoursAgo(2.1),
  },
  {
    id: 'c-3b',
    postId: 'post-2',
    authorId: 'user-marcus',
    parentCommentId: 'c-3',
    content:
      'Thank you Claire! The inner canal water level is completely calm behind the Maeslantkering sector arms.',
    upvotes: 41,
    createdAt: hoursAgo(1.9),
  },
  {
    id: 'c-3c',
    postId: 'post-2',
    authorId: 'user-admin',
    parentCommentId: null,
    content:
      'We have cross-referenced the RWS offshore buoy telemetry—peak gust hit 118.4 km/h at 06:12 UTC.',
    upvotes: 29,
    createdAt: hoursAgo(1.5),
  },
  // Post 3: Lagos Solar Micro-Grid
  {
    id: 'c-4',
    postId: 'post-3',
    authorId: 'user-kenji',
    parentCommentId: null,
    content:
      'Sodium-ion battery storage paired with rooftop solar is a total game-changer for dense urban tech corridors. Zero cobalt needed and zero fire risk.',
    upvotes: 93,
    createdAt: hoursAgo(2.8),
  },
  {
    id: 'c-4b',
    postId: 'post-3',
    authorId: 'user-amina',
    parentCommentId: 'c-4',
    content:
      'Exactly! Plus the ambient noise level in Yaba has dropped dramatically now that hundreds of diesel generators are switched off.',
    upvotes: 68,
    createdAt: hoursAgo(2.4),
  },
  {
    id: 'c-4c',
    postId: 'post-3',
    authorId: 'user-admin',
    parentCommentId: null,
    content:
      'Hospital administrators in Surulere and Yaba confirmed 100% uninterrupted power across intensive care units for 72 straight hours.',
    upvotes: 54,
    createdAt: hoursAgo(1.8),
  },
  // Post 4: Paris Seine Hydrofoil Ferry
  {
    id: 'c-5',
    postId: 'post-4',
    authorId: 'user-marcus',
    parentCommentId: null,
    content:
      'Using computer-controlled hydrofoils to eliminate wake erosion on historic stone riverbanks is brilliant urban design.',
    upvotes: 47,
    createdAt: hoursAgo(4.0),
  },
  {
    id: 'c-5b',
    postId: 'post-4',
    authorId: 'user-claire',
    parentCommentId: 'c-5',
    content:
      'And because it accepts the standard Navigo monthly pass, morning commuters are already packing every departure!',
    upvotes: 33,
    createdAt: hoursAgo(3.5),
  },
  // Post 5: Disputed NYC Blackout Claim
  {
    id: 'c-6',
    postId: 'post-5',
    authorId: 'user-admin',
    parentCommentId: null,
    content:
      'Fact-Check Notice: I am looking out at Midtown and Lower Manhattan right now—lights are 100% on and Con Edison reports normal grid load.',
    upvotes: 142,
    createdAt: hoursAgo(1.8),
  },
  {
    id: 'c-6b',
    postId: 'post-5',
    authorId: 'user-kenji',
    parentCommentId: 'c-6',
    content:
      'Reverse-image hash confirms this photo is from the July 13, 2019 West Side transformer outage.',
    upvotes: 88,
    createdAt: hoursAgo(1.6),
  },
  // Post 6: UN Open-Verify Charter
  {
    id: 'c-7',
    postId: 'post-6',
    authorId: 'user-amina',
    parentCommentId: null,
    content:
      'As a field photojournalist, hardware-signed C2PA provenance protects our real on-the-ground reporting from being dismissed as AI-generated.',
    upvotes: 115,
    createdAt: hoursAgo(4.8),
  },
  {
    id: 'c-7b',
    postId: 'post-6',
    authorId: 'user-claire',
    parentCommentId: 'c-7',
    content:
      '100% agreed. Open-source verification is the strongest defense for independent journalism.',
    upvotes: 61,
    createdAt: hoursAgo(4.1),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-1',
    adminId: 'user-admin',
    actionType: 'MODERATION_ACTION',
    description:
      'Attached Community Fact-Check Note #note-1 to disputed NYC blackout post (#post-5) & demoted hot score',
    timestamp: hoursAgo(1.6),
  },
  {
    id: 'audit-2',
    adminId: 'user-admin',
    actionType: 'ALGORITHM_TUNE',
    description:
      'Set Eyewitness Boost to 1.5x and Trust Multiplier Weight to 2.0x for verified field correspondents',
    timestamp: hoursAgo(3.0),
  },
];

export interface RankScoreBreakdown {
  totalScore: number;
  netVotes: number;
  logVoteTerm: number;
  trustMultiplier: number;
  eyewitnessBonus: number;
  velocityTerm: number;
  ageHours: number;
  decayDenominator: number;
  isDemotedByNote: boolean;
}

/**
 * Computes the News Feed Ranking Score using our Truth-Weighted Formula:
 * Score = (log10(max(|U - D|, 1)) * sign(U - D) * C_author + B_eyewitness + V_velocity) / (T_hours + 2)^gamma
 */
export function computePostRankScore(
  post: NewsPost,
  author: User | undefined,
  weights: AlgorithmWeights,
  notes: CommunityNote[]
): RankScoreBreakdown {
  const netVotes = post.upvotes - post.downvotes;
  const sign = netVotes > 0 ? 1 : netVotes < 0 ? -1 : 0;
  const logVoteTerm = Math.log10(Math.max(Math.abs(netVotes), 1)) * sign;

  const hasMisleadingNote = notes.some(
    (n) => n.postId === post.id && n.status === 'rated_misleading'
  );
  const baseTrust = author?.trustScore ?? 0.5;
  const trustMultiplier = hasMisleadingNote
    ? 0.12
    : Number((baseTrust * weights.trustMultiplierWeight).toFixed(2));

  const ageHours = Math.max(
    0.1,
    (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 3600)
  );

  // Eyewitness boost active especially in first 6 hours
  const eyewitnessBonus =
    post.isEyewitness && !hasMisleadingNote
      ? Number((weights.eyewitnessBoost * (ageHours <= 6 ? 1.25 : 0.7)).toFixed(2))
      : 0;

  const velocityTerm = Number((post.velocityPer15m * weights.velocityWeight).toFixed(2));
  const decayDenominator = Math.pow(ageHours + 2, weights.timeDecayGravity);

  const rawNumerator = logVoteTerm * trustMultiplier + eyewitnessBonus + velocityTerm;
  const totalScore = Number(((rawNumerator / decayDenominator) * 100).toFixed(2));

  return {
    totalScore,
    netVotes,
    logVoteTerm: Number(logVoteTerm.toFixed(2)),
    trustMultiplier,
    eyewitnessBonus,
    velocityTerm,
    ageHours: Number(ageHours.toFixed(1)),
    decayDenominator: Number(decayDenominator.toFixed(2)),
    isDemotedByNote: hasMisleadingNote,
  };
}

