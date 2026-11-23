import { useState } from 'react';
import {
  Brain,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { BUSINESS_CONTACT } from '../lib/domain';
import { apiUrl, resolveMediaUrl } from '../lib/api';

type StudioTab = 'quick' | 'blueprint' | 'venues' | 'visuals' | 'animate';

interface GroundedPlace {
  title: string;
  uri: string;
  reviewSnippets: string[];
}

function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIdx = result.indexOf(',');
      if (commaIdx < 0) {
        reject(new Error('Invalid image file.'));
        return;
      }
      resolve({
        base64: result.slice(commaIdx + 1),
        mimeType: file.type || 'image/png',
        preview: result,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function AiEventStudioSection() {
  const [activeTab, setActiveTab] = useState<StudioTab>('quick');

  // Tab 1: Low-latency Quick Advisor (gemini-3.1-flash-lite)
  const [quickPrompt, setQuickPrompt] = useState('Which DJ package and lighting setup fits a 350-guest wedding reception?');
  const [quickAnswer, setQuickAnswer] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');

  // Tab 2: Deep Production Blueprint (gemini-4-carbon, ThinkingLevel.HIGH)
  const [eventBrief, setEventBrief] = useState('South Indian evening wedding reception with Goldstar Orchestra, bride-groom entry welcome dance, and 2-hour DJ after-party.');
  const [guestCount, setGuestCount] = useState('600');
  const [venueType, setVenueType] = useState('Grand Marriage Hall in Erode');
  const [blueprintResult, setBlueprintResult] = useState('');
  const [blueprintLoading, setBlueprintLoading] = useState(false);
  const [blueprintError, setBlueprintError] = useState('');

  // Tab 3: Maps Grounding Venue Explorer (gemini-4-hydrogen + googleMaps)
  const [venueQuery, setVenueQuery] = useState('Top wedding halls and auditoriums in Erode suitable for live orchestra and DJ concerts');
  const [venueText, setVenueText] = useState('');
  const [venuePlaces, setVenuePlaces] = useState<GroundedPlace[]>([]);
  const [venueLoading, setVenueLoading] = useState(false);
  const [venueError, setVenueError] = useState('');

  // Tab 4: Image Studio (gemini-nano-banana-2.1 Create/Edit + gemini-3-pro-image-preview 1K/2K/4K)
  const [imageMode, setImageMode] = useState<'create-edit' | 'hq'>('create-edit');
  const [imagePrompt, setImagePrompt] = useState('Grand South Indian wedding reception stage with warm amber lighting, line-array audio speakers, and floral truss arch');
  const [imageAspect, setImageAspect] = useState<'16:9' | '4:3' | '1:1' | '9:16'>('16:9');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [editUpload, setEditUpload] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const [generatedImgCaption, setGeneratedImgCaption] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  // Tab 5: Photo-to-Video Animator (gemini-omni-1.2-flash via Interactions API, 16:9 or 9:16)
  const [animPhoto, setAnimPhoto] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [animPrompt, setAnimPrompt] = useState('Smooth cinematic camera push-in as warm concert beams sweep across the stage and soft haze drifts through the air');
  const [animAspect, setAnimAspect] = useState<'16:9' | '9:16'>('9:16');
  const [animVideoUrl, setAnimVideoUrl] = useState<string | null>(null);
  const [animLoading, setAnimLoading] = useState(false);
  const [animError, setAnimError] = useState('');

  const runQuickAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickLoading(true);
    setQuickError('');
    try {
      const res = await fetch(apiUrl('/api/ai/quick-advisor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: quickPrompt }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not get response.');
      setQuickAnswer(data.text || '');
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setQuickLoading(false);
    }
  };

  const runBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlueprintLoading(true);
    setBlueprintError('');
    try {
      const res = await fetch(apiUrl('/api/ai/event-blueprint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventBrief, guestCount, venueType }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not build blueprint.');
      setBlueprintResult(data.text || '');
    } catch (err) {
      setBlueprintError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBlueprintLoading(false);
    }
  };

  const runVenueSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setVenueLoading(true);
    setVenueError('');
    try {
      let lat: number = BUSINESS_CONTACT.erodeCenter.lat;
      let lng: number = BUSINESS_CONTACT.erodeCenter.lng;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2500 }),
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // Use Erode default coordinates if geolocation is declined or unavailable
        }
      }
      const res = await fetch(apiUrl('/api/ai/venue-grounding'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: venueQuery, lat, lng }),
      });
      const data = (await res.json()) as { text?: string; places?: GroundedPlace[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Venue search failed.');
      setVenueText(data.text || '');
      setVenuePlaces(data.places || []);
    } catch (err) {
      setVenueError(err instanceof Error ? err.message : 'Venue lookup failed.');
    } finally {
      setVenueLoading(false);
    }
  };

  const runImageStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageLoading(true);
    setImageError('');
    try {
      const endpoint = imageMode === 'create-edit' ? '/api/ai/image-create-edit' : '/api/ai/image-hq';
      const body =
        imageMode === 'create-edit'
          ? {
              prompt: imagePrompt,
              aspectRatio: imageAspect,
              imageBase64: editUpload?.base64 ?? null,
              mimeType: editUpload?.mimeType ?? 'image/png',
            }
          : {
              prompt: imagePrompt,
              aspectRatio: imageAspect,
              imageSize,
            };

      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { imageUrl?: string; caption?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Image generation failed.');
      setGeneratedImgUrl(data.imageUrl || null);
      setGeneratedImgCaption(data.caption || '');
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Image generation failed.');
    } finally {
      setImageLoading(false);
    }
  };

  const runVideoAnimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animPhoto) {
      setAnimError('Please upload a stage or event photo first.');
      return;
    }
    setAnimLoading(true);
    setAnimError('');
    try {
      const res = await fetch(apiUrl('/api/ai/animate-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: animPrompt,
          imageBase64: animPhoto.base64,
          mimeType: animPhoto.mimeType,
          aspectRatio: animAspect,
        }),
      });
      const data = (await res.json()) as { videoUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Video animation failed.');
      setAnimVideoUrl(data.videoUrl || null);
    } catch (err) {
      setAnimError(err instanceof Error ? err.message : 'Video animation failed.');
    } finally {
      setAnimLoading(false);
    }
  };

  return (
    <section id="event-planner" className="bg-[#F3F3F3] border-b border-neutral-200 py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#FF5A1F]">Event Production Lab</p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717]">
              Plan your stage &amp; acoustics
            </h2>
          </div>
          <p className="text-sm text-neutral-600 max-w-sm">
            Instant advice, venue discovery, and stage visual concepts.
          </p>
        </div>

        {/* Segmented Control Tabs */}
        <div
          role="tablist"
          aria-label="Production Planner Tools"
          className="mt-8 flex items-center gap-1.5 overflow-x-auto pb-2"
        >
          {(
            [
              { id: 'quick', label: 'Instant Advisor', icon: Zap },
              { id: 'blueprint', label: 'Deep Blueprint', icon: Brain },
              { id: 'venues', label: 'Venue Finder (Maps)', icon: MapPin },
              { id: 'visuals', label: 'Stage Visuals (1K–4K)', icon: ImageIcon },
              { id: 'animate', label: 'Animate Photo to Video', icon: Film },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#171717] text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#FF5A1F]' : 'text-neutral-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Panel */}
        <div className="mt-4 bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8">
          {/* TAB 1: Low-Latency Instant Advisor */}
          {activeTab === 'quick' && (
            <form onSubmit={runQuickAdvisor} className="space-y-4">
              <div>
                <label htmlFor="quick-advisor-input" className="block text-sm font-semibold text-[#171717]">
                  Ask a quick question about packages, studio slots, or academy classes
                </label>
                <div className="mt-2 flex flex-col sm:flex-row gap-3">
                  <input
                    id="quick-advisor-input"
                    type="text"
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    placeholder="e.g., What is the cost for Raga Studio vocal mixing + live tracks?"
                    className="flex-1 px-4 py-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF5A1F]"
                  />
                  <button
                    type="submit"
                    disabled={quickLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {quickLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Get Fast Answer
                  </button>
                </div>
              </div>
              {quickError && <p className="text-sm text-red-600">{quickError}</p>}
              {quickAnswer && (
                <div className="p-5 rounded-xl bg-[#F3F3F3] text-sm text-[#171717] leading-relaxed whitespace-pre-wrap">
                  {quickAnswer}
                </div>
              )}
            </form>
          )}

          {/* TAB 2: High-Thinking Complex Event Blueprint */}
          {activeTab === 'blueprint' && (
            <form onSubmit={runBlueprint} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bp-guests" className="block text-sm font-semibold text-[#171717]">
                    Expected Audience Size
                  </label>
                  <input
                    id="bp-guests"
                    type="text"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="mt-1.5 w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
                <div>
                  <label htmlFor="bp-venue" className="block text-sm font-semibold text-[#171717]">
                    Venue Type &amp; City
                  </label>
                  <input
                    id="bp-venue"
                    type="text"
                    value={venueType}
                    onChange={(e) => setVenueType(e.target.value)}
                    className="mt-1.5 w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bp-brief" className="block text-sm font-semibold text-[#171717]">
                  Detailed Event Requirements
                </label>
                <textarea
                  id="bp-brief"
                  rows={3}
                  value={eventBrief}
                  onChange={(e) => setEventBrief(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <button
                type="submit"
                disabled={blueprintLoading}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#171717] hover:bg-[#FF5A1F] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {blueprintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                Generate Technical Production Blueprint
              </button>

              {blueprintError && <p className="text-sm text-red-600">{blueprintError}</p>}
              {blueprintResult && (
                <div className="p-5 rounded-xl bg-[#F3F3F3] text-sm text-[#171717] leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-y-auto">
                  {blueprintResult}
                </div>
              )}
            </form>
          )}

          {/* TAB 3: Google Maps Grounding Venue Finder */}
          {activeTab === 'venues' && (
            <form onSubmit={runVenueSearch} className="space-y-4">
              <div>
                <label htmlFor="venue-query-input" className="block text-sm font-semibold text-[#171717]">
                  Search real event halls, auditoriums, or venues using Google Maps data
                </label>
                <div className="mt-2 flex flex-col sm:flex-row gap-3">
                  <input
                    id="venue-query-input"
                    type="text"
                    value={venueQuery}
                    onChange={(e) => setVenueQuery(e.target.value)}
                    className="flex-1 px-4 py-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF5A1F]"
                  />
                  <button
                    type="submit"
                    disabled={venueLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {venueLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Search Venues
                  </button>
                </div>
              </div>

              {venueError && <p className="text-sm text-red-600">{venueError}</p>}
              {venueText && (
                <div className="p-5 rounded-xl bg-[#F3F3F3] text-sm text-[#171717] leading-relaxed whitespace-pre-wrap">
                  {venueText}
                </div>
              )}
              {venuePlaces.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-neutral-500 mb-2">
                    Verified Google Maps Sources
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {venuePlaces.map((place, idx) => (
                      <a
                        key={`${place.uri}-${idx}`}
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start justify-between gap-2 p-3.5 rounded-xl border border-neutral-200 hover:border-[#FF5A1F] transition-colors bg-white"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#171717] truncate">{place.title}</p>
                          {place.reviewSnippets[0] && (
                            <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                              {place.reviewSnippets[0]}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-[#FF5A1F] shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 4: Create/Edit Images & High-Quality 1K/2K/4K Stage Visuals */}
          {activeTab === 'visuals' && (
            <form onSubmit={runImageStudio} className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setImageMode('create-edit')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                    imageMode === 'create-edit'
                      ? 'bg-[#FF5A1F] text-white'
                      : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Create &amp; Edit Image
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('hq')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                    imageMode === 'hq'
                      ? 'bg-[#FF5A1F] text-white'
                      : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  High-Resolution Poster (1K / 2K / 4K)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="img-studio-prompt" className="block text-sm font-semibold text-[#171717]">
                    Describe your stage setup, event poster, or edit instructions
                  </label>
                  <textarea
                    id="img-studio-prompt"
                    rows={3}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="mt-1.5 w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="img-aspect" className="block text-xs font-semibold text-neutral-700">
                      Aspect Ratio
                    </label>
                    <select
                      id="img-aspect"
                      value={imageAspect}
                      onChange={(e) => setImageAspect(e.target.value as '16:9' | '4:3' | '1:1' | '9:16')}
                      className="mt-1 w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white"
                    >
                      <option value="16:9">16:9 (Stage Widescreen)</option>
                      <option value="4:3">4:3 (Showcase)</option>
                      <option value="1:1">1:1 (Square Poster)</option>
                      <option value="9:16">9:16 (Vertical Reel)</option>
                    </select>
                  </div>

                  {imageMode === 'hq' ? (
                    <div>
                      <span className="block text-xs font-semibold text-neutral-700 mb-1">
                        Output Resolution
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['1K', '2K', '4K'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setImageSize(sz)}
                            className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                              imageSize === sz
                                ? 'bg-[#171717] text-white border-[#171717]'
                                : 'bg-white text-neutral-700 border-neutral-300'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="edit-photo-upload" className="block text-xs font-semibold text-neutral-700">
                        Optional Reference Photo to Edit
                      </label>
                      <input
                        id="edit-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return setEditUpload(null);
                          setEditUpload(await readFileAsBase64(f));
                        }}
                        className="mt-1 block w-full text-xs text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-[#F3F3F3] file:text-[#171717] file:font-medium cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={imageLoading}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {imageMode === 'hq' ? `Generate ${imageSize} Image` : editUpload ? 'Edit Uploaded Image' : 'Generate Stage Concept'}
              </button>

              {imageError && <p className="text-sm text-red-600">{imageError}</p>}

              {generatedImgUrl && (
                <div className="pt-2 space-y-2">
                  <img
                    src={generatedImgUrl}
                    alt="Generated SS Audios stage visual concept"
                    className="max-h-[460px] rounded-xl border border-neutral-200 object-contain bg-[#171717]"
                  />
                  {generatedImgCaption && (
                    <p className="text-xs text-neutral-600">{generatedImgCaption}</p>
                  )}
                </div>
              )}
            </form>
          )}

          {/* TAB 5: Animate Photo into Promo Video (gemini-omni-1.2-flash, 16:9 or 9:16) */}
          {activeTab === 'animate' && (
            <form onSubmit={runVideoAnimate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="anim-photo-upload" className="block text-sm font-semibold text-[#171717]">
                    1. Upload Starting Stage or Event Photo
                  </label>
                  <label
                    htmlFor="anim-photo-upload"
                    className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 hover:border-[#FF5A1F] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#F3F3F3]/40"
                  >
                    {animPhoto ? (
                      <img
                        src={animPhoto.preview}
                        alt="Uploaded photo preview"
                        className="max-h-44 rounded-lg object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[#FF5A1F] mb-2" />
                        <span className="text-sm font-medium text-[#171717]">
                          Choose a photo (JPG / PNG / WebP)
                        </span>
                        <span className="text-xs text-neutral-500 mt-1">
                          We&apos;ll animate it into a cinematic promo reel
                        </span>
                      </>
                    )}
                    <input
                      id="anim-photo-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setAnimPhoto(await readFileAsBase64(f));
                        setAnimError('');
                      }}
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="anim-prompt" className="block text-sm font-semibold text-[#171717]">
                      2. Motion &amp; Camera Direction
                    </label>
                    <textarea
                      id="anim-prompt"
                      rows={3}
                      value={animPrompt}
                      onChange={(e) => setAnimPrompt(e.target.value)}
                      className="mt-1.5 w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>

                  <div>
                    <span className="block text-sm font-semibold text-[#171717] mb-1.5">
                      3. Output Video Aspect Ratio
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ['16:9', '16:9 Landscape (YouTube / Stage)'],
                          ['9:16', '9:16 Portrait (Portfolio Reel)'],
                        ] as const
                      ).map(([ratio, label]) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAnimAspect(ratio)}
                          className={`px-3 py-2.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                            animAspect === ratio
                              ? 'bg-[#171717] text-white border-[#171717]'
                              : 'bg-white text-neutral-700 border-neutral-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={animLoading}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {animLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                {animLoading ? 'Animating Video (this may take ~30–60s)...' : 'Animate Photo into Video'}
              </button>

              {animError && <p className="text-sm text-red-600">{animError}</p>}
              {animVideoUrl && (
                <div className="pt-2">
                  <video
                    src={resolveMediaUrl(animVideoUrl) || animVideoUrl}
                    controls
                    playsInline
                    className="max-h-[460px] rounded-xl border border-neutral-200 bg-black"
                  />
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
