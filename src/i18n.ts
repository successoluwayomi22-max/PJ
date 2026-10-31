import { LanguageCode, PostCategory } from './types';

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr' },
];

export const UI_STRINGS: Record<
  LanguageCode,
  {
    navFeed: string;
    navGallery: string;
    navGlobe: string;
    navUserDash: string;
    navAdminDash: string;
    navLogin: string;
    postNewsBtn: string;
    searchPlaceholder: string;
    breakingLabel: string;
    eyewitnessBadge: string;
    verifiedBadge: string;
    trustScoreLabel: string;
    translatePostBtn: string;
    showOriginalBtn: string;
    aiSummaryBtn: string;
    aiForensicsBtn: string;
    algorithmScoreBtn: string;
    communityNoteTitle: string;
    addCommunityNote: string;
    sortHot: string;
    sortLatest: string;
    sortTrusted: string;
    sortEyewitness: string;
    godModeActive: string;
    themeDark: string;
    themeLight: string;
    categories: Record<'all' | PostCategory, string>;
  }
> = {
  en: {
    navFeed: 'News Feed',
    navGallery: '3D Media Gallery',
    navGlobe: '3D Live Globe',
    navUserDash: 'Reporter Studio',
    navAdminDash: 'Super-Admin',
    navLogin: 'Sign In / Switch Role',
    postNewsBtn: 'Post Breaking News',
    searchPlaceholder: 'Search headlines, #tags, or cities (⌘K)...',
    breakingLabel: 'BREAKING PULSE',
    eyewitnessBadge: 'EYEWITNESS ON-SCENE',
    verifiedBadge: 'VERIFIED REPORTER',
    trustScoreLabel: 'Trust Score',
    translatePostBtn: 'AI Translate',
    showOriginalBtn: 'Show Original',
    aiSummaryBtn: 'AI 3-Bullet TL;DR',
    aiForensicsBtn: 'Media Forensics',
    algorithmScoreBtn: 'Rank Math',
    communityNoteTitle: 'Readers Added Context (Community Note)',
    addCommunityNote: 'Add Fact-Check Note',
    sortHot: 'Algorithmic Top',
    sortLatest: 'Latest Breaking',
    sortTrusted: 'Highest Trust',
    sortEyewitness: 'Eyewitness Only',
    godModeActive: 'GOD-MODE INLINE EDIT ON',
    themeDark: 'Obsidian Dark',
    themeLight: 'Editorial Paper',
    categories: {
      all: 'All News',
      breaking: 'Breaking',
      local: 'Local / Near Me',
      politics: 'Politics & Policy',
      tech: 'Tech & AI',
      science: 'Science & Space',
      business: 'Markets & Economy',
      weather_disaster: 'Weather & Crisis',
      culture: 'World Culture',
    },
  },
  es: {
    navFeed: 'Noticias en Vivo',
    navGallery: 'Galería 3D',
    navGlobe: 'Globo 3D en Vivo',
    navUserDash: 'Estudio de Reportero',
    navAdminDash: 'Super-Admin',
    navLogin: 'Acceso / Cambiar Rol',
    postNewsBtn: 'Publicar Noticia',
    searchPlaceholder: 'Buscar titulares, #etiquetas o ciudades (⌘K)...',
    breakingLabel: 'ÚLTIMA HORA',
    eyewitnessBadge: 'TESTIGO EN ESCENA',
    verifiedBadge: 'REPORTERO VERIFICADO',
    trustScoreLabel: 'Nivel de Confianza',
    translatePostBtn: 'Traducir con IA',
    showOriginalBtn: 'Ver Original',
    aiSummaryBtn: 'Resumen IA',
    aiForensicsBtn: 'Forense Multimedia',
    algorithmScoreBtn: 'Fórmula Rango',
    communityNoteTitle: 'Contexto de la Comunidad (Verificación)',
    addCommunityNote: 'Añadir Nota de Verificación',
    sortHot: 'Top Algoritmo',
    sortLatest: 'Más Recientes',
    sortTrusted: 'Mayor Confianza',
    sortEyewitness: 'Solo Testigos',
    godModeActive: 'EDICIÓN DIRECTA ADMIN ACTIVA',
    themeDark: 'Obsidiana Oscuro',
    themeLight: 'Papel Editorial',
    categories: {
      all: 'Todas',
      breaking: 'Última Hora',
      local: 'Local',
      politics: 'Política',
      tech: 'Tecnología e IA',
      science: 'Ciencia',
      business: 'Economía',
      weather_disaster: 'Clima y Crisis',
      culture: 'Cultura',
    },
  },
  fr: {
    navFeed: 'Fil d’Actualités',
    navGallery: 'Galerie Média 3D',
    navGlobe: 'Globe 3D Direct',
    navUserDash: 'Studio Reporter',
    navAdminDash: 'Super-Admin',
    navLogin: 'Connexion / Rôle',
    postNewsBtn: 'Publier une Info',
    searchPlaceholder: 'Rechercher titres, #tags ou villes (⌘K)...',
    breakingLabel: 'ALERTE INFO',
    eyewitnessBadge: 'TÉMOIN SUR PLACE',
    verifiedBadge: 'REPORTER VÉRIFIÉ',
    trustScoreLabel: 'Score de Confiance',
    translatePostBtn: 'Traduire via IA',
    showOriginalBtn: 'Voir l’Original',
    aiSummaryBtn: 'Résumé IA',
    aiForensicsBtn: 'Analyse Forensique',
    algorithmScoreBtn: 'Score Algo',
    communityNoteTitle: 'Note de Contexte Communautaire',
    addCommunityNote: 'Ajouter une Note',
    sortHot: 'Top Algorithme',
    sortLatest: 'En Direct',
    sortTrusted: 'Haute Fiabilité',
    sortEyewitness: 'Témoins Uniquement',
    godModeActive: 'MODE ÉDITION DIRECTE ACTIF',
    themeDark: 'Nuit Obsidienne',
    themeLight: 'Papier Éditorial',
    categories: {
      all: 'Tout',
      breaking: 'Urgent',
      local: 'Local',
      politics: 'Politique',
      tech: 'Tech & IA',
      science: 'Science',
      business: 'Économie',
      weather_disaster: 'Météo & Crise',
      culture: 'Culture',
    },
  },
  ar: {
    navFeed: 'موجز الأخبار',
    navGallery: 'معرض الوسائط 3D',
    navGlobe: 'الكرة الأرضية 3D',
    navUserDash: 'استوديو المراسل',
    navAdminDash: 'لوحة التحكم الشاملة',
    navLogin: 'تسجيل الدخول / تبديل الدور',
    postNewsBtn: 'نشر خبر عاجل',
    searchPlaceholder: 'ابحث في العناوين أو المدن أو الوسوم (⌘K)...',
    breakingLabel: 'عاجل الآن',
    eyewitnessBadge: 'شاهد عيان من الموقع',
    verifiedBadge: 'مراسل موثق',
    trustScoreLabel: 'مؤشر المصداقية',
    translatePostBtn: 'ترجمة بالذكاء الاصطناعي',
    showOriginalBtn: 'عرض النص الأصلي',
    aiSummaryBtn: 'ملخص الذكاء الاصطناعي',
    aiForensicsBtn: 'فحص مصداقية الوسائط',
    algorithmScoreBtn: 'معادلة الترتيب',
    communityNoteTitle: 'سياق إضافي من المجتمع (تحقق من الحقائق)',
    addCommunityNote: 'إضافة ملاحظة تحقق',
    sortHot: 'الأعلى تقييماً',
    sortLatest: 'الأحدث لحظياً',
    sortTrusted: 'الأعلى موثوقية',
    sortEyewitness: 'شهود العيان فقط',
    godModeActive: 'وضع التعديل المباشر للمدير مفعل',
    themeDark: 'الوضع الداكن',
    themeLight: 'الورق التحريري الفاتح',
    categories: {
      all: 'جميع الأخبار',
      breaking: 'عاجل',
      local: 'محلي',
      politics: 'سياسة',
      tech: 'تكنولوجيا وذكاء اصطناعي',
      science: 'علوم وفضاء',
      business: 'اقتصاد وأسواق',
      weather_disaster: 'طقسوطوارئ',
      culture: 'ثقافة',
    },
  },
  zh: {
    navFeed: '实时新闻流',
    navGallery: '3D 媒体画廊',
    navGlobe: '3D 全球动态',
    navUserDash: '记者工作台',
    navAdminDash: '超级管理中心',
    navLogin: '登录 / 切换角色',
    postNewsBtn: '发布突发新闻',
    searchPlaceholder: '搜索标题、#标签或城市 (⌘K)...',
    breakingLabel: '突发快讯',
    eyewitnessBadge: '现场目击直击',
    verifiedBadge: '认证记者',
    trustScoreLabel: '可信度评分',
    translatePostBtn: 'AI 智能翻译',
    showOriginalBtn: '查看原文',
    aiSummaryBtn: 'AI 三点摘要',
    aiForensicsBtn: 'AI 媒体鉴真',
    algorithmScoreBtn: '算法权重',
    communityNoteTitle: '社区背景核查笔记 (Fact-Check)',
    addCommunityNote: '添加核查笔记',
    sortHot: '算法热度优先',
    sortLatest: '最新突发',
    sortTrusted: '最高可信度',
    sortEyewitness: '仅看现场目击',
    godModeActive: '超级管理员实时内联编辑已开启',
    themeDark: '黑曜石深色',
    themeLight: '暖色报刊浅色',
    categories: {
      all: '全部新闻',
      breaking: '突发',
      local: '本地附近',
      politics: '时政',
      tech: '科技与 AI',
      science: '科学与太空',
      business: '财经市场',
      weather_disaster: '气象与灾害',
      culture: '文化',
    },
  },
  ja: {
    navFeed: 'ニュースフィード',
    navGallery: '3D メディアギャラリー',
    navGlobe: '3D ライブ地球儀',
    navUserDash: 'レポータースタジオ',
    navAdminDash: 'スーパー管理画面',
    navLogin: 'ログイン / 役割切替',
    postNewsBtn: '速報を投稿する',
    searchPlaceholder: '見出し、#タグ、都市名を検索 (⌘K)...',
    breakingLabel: '緊急速報',
    eyewitnessBadge: '現場目撃レポート',
    verifiedBadge: '認証済み記者',
    trustScoreLabel: '信頼スコア',
    translatePostBtn: 'AI 翻訳',
    showOriginalBtn: '原文を表示',
    aiSummaryBtn: 'AI 3行要約',
    aiForensicsBtn: 'メディア真贋鑑定',
    algorithmScoreBtn: 'ランク計算式',
    communityNoteTitle: 'コミュニティノート（ファクトチェック）',
    addCommunityNote: '検証ノートを追加',
    sortHot: '注目アルゴリズム順',
    sortLatest: '新着速報順',
    sortTrusted: '信頼度順',
    sortEyewitness: '現場目撃のみ',
    godModeActive: '管理者インライン編集モード ON',
    themeDark: 'オブシディアン・ダーク',
    themeLight: 'エディトリアル・ペーパー',
    categories: {
      all: 'すべて',
      breaking: '速報',
      local: 'ローカル',
      politics: '政治',
      tech: 'テクノロジー',
      science: '科学・宇宙',
      business: '経済・ビジネス',
      weather_disaster: '気象・災害',
      culture: 'カルチャー',
    },
  },
};

export function formatRelativeTime(isoDate: string, lang: LanguageCode): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) {
    if (lang === 'es') return `hace ${diffMinutes}m`;
    if (lang === 'fr') return `il y a ${diffMinutes}m`;
    if (lang === 'ar') return `منذ ${diffMinutes} د`;
    if (lang === 'zh') return `${diffMinutes}分钟前`;
    if (lang === 'ja') return `${diffMinutes}分前`;
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    if (lang === 'es') return `hace ${diffHours}h`;
    if (lang === 'fr') return `il y a ${diffHours}h`;
    if (lang === 'ar') return `منذ ${diffHours} س`;
    if (lang === 'zh') return `${diffHours}小时前`;
    if (lang === 'ja') return `${diffHours}時間前`;
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatCompactNumber(num: number, lang: LanguageCode): string {
  try {
    return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(num);
  } catch {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : String(num);
  }
}

