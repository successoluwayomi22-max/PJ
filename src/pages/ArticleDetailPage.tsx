import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Compass,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Languages,
  MapPin,
  MessageSquare,
  Radio,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AlgorithmWeights,
  CommentItem,
  CommunityNote,
  LanguageCode,
  NewsPost,
  User,
} from '../types';
import { computePostRankScore } from '../mockData';
import { formatRelativeTime, UI_STRINGS } from '../i18n';
import { Panorama360Viewer } from '../components/Panorama360Viewer';

interface ArticleDetailPageProps {
  posts: NewsPost[];
  users: User[];
  comments: CommentItem[];
  notes: CommunityNote[];
  currentUser: User;
  lang: LanguageCode;
  isDark: boolean;
  primaryColor: string;
  secondaryAiColor: string;
  breakingColor: string;
  cardBgColor: string;
  algorithmWeights: AlgorithmWeights;
  bookmarkedIds: string[];
  userVotes: Record<string, 'up' | 'down'>;
  onVote: (postId: string, dir: 'up' | 'down') => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentId?: string | null) => void;
  onAddCommunityNote: (postId: string, noteText: string, sourceUrl: string) => void;
  onVoteCommunityNote: (noteId: string, helpful: boolean) => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  posts,
  users,
  comments,
  notes,
  lang,
  isDark,
  primaryColor,
  secondaryAiColor,
  breakingColor,
  cardBgColor,
  algorithmWeights,
  bookmarkedIds,
  userVotes,
  onVote,
  onToggleBookmark,
  onAddComment,
  onAddCommunityNote,
  onVoteCommunityNote,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const strings = UI_STRINGS[lang];

  const post = posts.find((p) => p.id === id) || posts[0];
  const author = users.find((u) => u.id === post?.authorId);

  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [isTranslated, setIsTranslated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteSource, setNoteSource] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(Math.min(100, Math.round((window.scrollY / total) * 100)));
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.speechSynthesis?.cancel();
    };
  }, [id]);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <h1 className="font-editorial text-3xl">Dispatch Not Found</h1>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-slate-950"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const rank = computePostRankScore(post, author, algorithmWeights, notes);
  const postNotes = notes.filter((n) => n.postId === post.id);
  const postComments = comments.filter((c) => c.postId === post.id);
  const activeMedia = post.media[activeMediaIdx] || post.media[0];
  const bookmarked = bookmarkedIds.includes(post.id);
  const userVote = userVotes[post.id];

  const targetLang: LanguageCode = lang === 'en' ? 'es' : lang;
  const translated = post.translations?.[targetLang] || {
    headline: `[${targetLang.toUpperCase()}] ${post.headline}`,
    bodyText: post.bodyText,
  };

  const headline = isTranslated ? translated.headline : post.headline;
  const body = isTranslated ? translated.bodyText : post.bodyText;

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `${headline}. Reported from ${post.locationName} by ${
          author?.displayName || 'Correspondent'
        }. ${body}. ${post.aiSummary.join(' ')}`
      );
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="relative pb-24">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none">
        <div
          className="h-full transition-all duration-150"
          style={{ width: `${scrollProgress}%`, backgroundColor: primaryColor }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-500/15">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-medium opacity-70 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Stream
          </button>

          <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider opacity-70">
            <span>{strings.categories[post.category] || post.category}</span>
            <span>•</span>
            <span>C2PA {post.forensics.authenticityScore}%</span>
            <span>•</span>
            <span>INDEX {rank.totalScore}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* MAIN EDITORIAL COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {/* Editorial Header */}
            <header className="space-y-5">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {post.isEyewitness && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <Radio className="w-3 h-3 animate-pulse" /> On-Scene Eyewitness Dispatch
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs opacity-70">
                  <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  {post.locationName} ({post.latitude.toFixed(3)}°N, {post.longitude.toFixed(3)}°E)
                </span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl md:text-[44px] font-semibold leading-[1.15] tracking-tight">
                {headline}
              </h1>

              {/* Author Byline & Utility Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-500/15">
                <Link
                  to={`/profile/${author?.username || 'correspondent'}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={author?.avatarUrl}
                    alt={author?.displayName}
                    className="w-11 h-11 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <div>
                    <div className="font-semibold text-sm group-hover:underline flex items-center gap-1.5">
                      <span>{author?.displayName}</span>
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full"
                        style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    </div>
                    <div className="text-xs opacity-60 font-mono">
                      @{author?.username} • {Math.round((author?.trustScore ?? 0.9) * 100)}% Trust •{' '}
                      {formatRelativeTime(post.createdAt, lang)}
                    </div>
                  </div>
                </Link>

                {/* Reader Controls: Audio TTS, Font Size, Translate, Bookmark */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSpeaking
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'border-slate-500/25 hover:bg-slate-500/10'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Listen
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTranslated((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isTranslated
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50'
                        : 'border-slate-500/25 hover:bg-slate-500/10'
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{isTranslated ? 'Original' : `Translate (${targetLang.toUpperCase()})`}</span>
                  </button>

                  <div className="inline-flex items-center rounded-full border border-slate-500/25 p-0.5 text-[11px] font-mono">
                    {(['sm', 'md', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFontScale(sz)}
                        className={`px-2 py-0.5 rounded-full uppercase ${
                          fontScale === sz ? 'bg-slate-500/25 font-bold' : 'opacity-60'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(post.id)}
                    className={`p-2 rounded-full border transition-colors ${
                      bookmarked
                        ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                        : 'border-slate-500/25 hover:bg-slate-500/10'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }}
                    className="p-2 rounded-full border border-slate-500/25 hover:bg-slate-500/10"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </header>

            {/* Cinema Media Showcase */}
            {post.media.length > 0 && (
              <div className="space-y-3">
                {post.media.length > 1 && (
                  <div className="flex items-center gap-2">
                    {post.media.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveMediaIdx(idx)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          activeMediaIdx === idx
                            ? isDark
                              ? 'bg-white text-slate-950'
                              : 'bg-slate-900 text-white'
                            : 'bg-slate-500/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {item.type === 'video' && <Film className="w-3.5 h-3.5" />}
                        {item.type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                        {item.type === 'panorama_360' && <Compass className="w-3.5 h-3.5" />}
                        <span>
                          {item.type === 'video'
                            ? '4K Field Stream'
                            : item.type === 'panorama_360'
                            ? 'WebGL 360° Sphere'
                            : `Photograph 0${idx + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {activeMedia.type === 'panorama_360' ? (
                  <Panorama360Viewer
                    imageUrl={activeMedia.url}
                    caption={activeMedia.caption}
                    locationName={post.locationName}
                  />
                ) : activeMedia.type === 'video' ? (
                  <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
                    <video
                      src={activeMedia.url}
                      poster={activeMedia.thumbnailUrl}
                      controls
                      playsInline
                      className="w-full max-h-[500px] object-cover"
                    />
                    {activeMedia.caption && (
                      <div className="px-4 py-2.5 bg-black/90 text-xs text-slate-300 font-mono">
                        {activeMedia.caption}
                      </div>
                    )}
                  </div>
                ) : (
                  <figure className="rounded-2xl overflow-hidden border border-slate-500/15">
                    <img
                      src={activeMedia.url}
                      alt={activeMedia.caption || headline}
                      className="w-full max-h-[520px] object-cover"
                    />
                    {activeMedia.caption && (
                      <figcaption className="px-4 py-2.5 text-xs opacity-70 border-t border-slate-500/15">
                        {activeMedia.caption}
                      </figcaption>
                    )}
                  </figure>
                )}
              </div>
            )}

            {/* Executive Summary Box */}
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-5 sm:p-6 rounded-2xl border border-slate-500/15 space-y-3"
            >
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest opacity-65">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: secondaryAiColor }} />
                  Executive Synthesis • Key Findings
                </span>
                <span>Verified Transcript</span>
              </div>
              <ul className="space-y-2 text-sm sm:text-[15px] leading-relaxed">
                {post.aiSummary.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-mono text-xs opacity-50 mt-1">0{i + 1}</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Article Lead & Full Editorial Body */}
            <div
              className={`font-editorial leading-[1.82] space-y-5 ${
                fontScale === 'sm'
                  ? 'text-base'
                  : fontScale === 'lg'
                  ? 'text-xl sm:text-2xl'
                  : 'text-lg sm:text-[19px]'
              }`}
            >
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                {body}
              </p>
              <p className="opacity-85">
                Field telemetry captured from {post.locationName} confirms the timeline submitted by{' '}
                {author?.displayName || 'the reporting correspondent'}. Under the Open-Verify C2PA
                protocol, hardware sensor signatures and atmospheric telemetry are cross-referenced
                automatically against satellite weather and grid logs before elevating a dispatch to
                the global priority stream.
              </p>
            </div>

            {/* Tags & Engagement Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-slate-500/15">
              <div className="flex flex-wrap items-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-mono bg-slate-500/10"
                    style={{ color: primaryColor }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onVote(post.id, 'up')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    userVote === 'up'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'border-slate-500/25 hover:bg-slate-500/10'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Endorse Accuracy ({post.upvotes})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onVote(post.id, 'down')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs border transition-colors ${
                    userVote === 'down'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'border-slate-500/25 opacity-70 hover:opacity-100'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{post.downvotes}</span>
                </button>
              </div>
            </div>

            {/* Threaded Discussion Section */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Public Record & Field Discussion ({postComments.length})
                </h3>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Contribute verified field context or analysis..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!commentText.trim()) return;
                    onAddComment(post.id, commentText.trim(), null);
                    setCommentText('');
                  }}
                  className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-950 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  Publish Comment
                </button>
              </div>

              <div className="space-y-3">
                {postComments.map((c) => {
                  const cAuthor = users.find((u) => u.id === c.authorId);
                  return (
                    <div
                      key={c.id}
                      style={{ backgroundColor: cardBgColor }}
                      className="p-4 rounded-xl border border-slate-500/15 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          to={`/profile/${cAuthor?.username || 'member'}`}
                          className="font-semibold hover:underline flex items-center gap-2"
                        >
                          <img
                            src={cAuthor?.avatarUrl}
                            alt={cAuthor?.displayName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{cAuthor?.displayName || 'Citizen'}</span>
                          <span className="font-mono opacity-50">@{cAuthor?.username}</span>
                        </Link>
                        <span className="font-mono text-[11px] opacity-55">
                          {formatRelativeTime(c.createdAt, lang)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed opacity-90">{c.content}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR: PROVENANCE PASSPORT & COMMUNITY NOTES */}
          <aside className="lg:col-span-4 space-y-6">
            {/* C2PA Cryptographic Provenance Passport */}
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-5 rounded-2xl border border-slate-500/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-500/15">
                <span className="font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Provenance Passport
                </span>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  {post.forensics.authenticityScore}/100
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-500/10">
                  <span className="opacity-60">Hardware Signature</span>
                  <span>{post.forensics.exifVerified ? 'Verified C2PA' : 'Unsigned'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-500/10">
                  <span className="opacity-60">Weather & Satellite</span>
                  <span>{post.forensics.gpsWeatherMatch ? 'Confirmed' : 'Mismatch'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-500/10">
                  <span className="opacity-60">Synthetic Probability</span>
                  <span>{post.forensics.deepfakeProbability}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-500/10">
                  <span className="opacity-60">Archive Index</span>
                  <span>{post.forensics.recycledFootageCheck}</span>
                </div>
                <div className="pt-1 opacity-70 leading-relaxed">
                  {post.forensics.deviceSignature}
                </div>
              </div>

              {post.externalSourceUrl && (
                <a
                  href={post.externalSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 flex items-center justify-between font-medium transition-colors"
                >
                  <span>Primary Wire Reference</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Community Fact-Check Notes Card */}
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-5 rounded-2xl border border-slate-500/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase tracking-wider font-semibold">
                  Community Context Notes
                </span>
                <button
                  type="button"
                  onClick={() => setShowNoteForm((v) => !v)}
                  className="text-sky-400 hover:underline font-medium"
                >
                  + Add Note
                </button>
              </div>

              {showNoteForm && (
                <div className="p-3 rounded-xl bg-slate-500/10 space-y-2.5">
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Provide neutral verification context..."
                    className="w-full p-2.5 rounded-lg bg-black/30 border border-white/15 focus:outline-none"
                  />
                  <input
                    type="url"
                    value={noteSource}
                    onChange={(e) => setNoteSource(e.target.value)}
                    placeholder="Citation URL (https://...)"
                    className="w-full p-2 rounded-lg bg-black/30 border border-white/15 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!noteText.trim()) return;
                      onAddCommunityNote(
                        post.id,
                        noteText.trim(),
                        noteSource.trim() || 'https://c2pa.org'
                      );
                      setNoteText('');
                      setNoteSource('');
                      setShowNoteForm(false);
                    }}
                    className="w-full py-2 rounded-lg font-semibold bg-emerald-500 text-slate-950"
                  >
                    Submit Verification Note
                  </button>
                </div>
              )}

              {postNotes.length === 0 ? (
                <p className="opacity-60 leading-relaxed">
                  No disputes or context notes filed on this dispatch.
                </p>
              ) : (
                postNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl border border-slate-500/20 bg-slate-500/[0.04] space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-emerald-400">
                      {note.status === 'rated_misleading' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{note.status.replace('_', ' ')}</span>
                    </div>
                    <p className="leading-relaxed opacity-90">{note.noteText}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-500/15 text-[11px]">
                      <button
                        type="button"
                        onClick={() => onVoteCommunityNote(note.id, true)}
                        className="hover:text-emerald-400"
                      >
                        Helpful ({note.helpfulVotes})
                      </button>
                      <button
                        type="button"
                        onClick={() => onVoteCommunityNote(note.id, false)}
                        className="opacity-60 hover:opacity-100"
                      >
                        Unhelpful ({note.unhelpfulVotes})
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

