import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Sliders } from 'lucide-react';
import { BRAND_ASSETS } from '../lib/domain';

interface HeroSectionProps {
  onBookNow: () => void;
  onOpenAdmin: () => void;
}

interface BannerScene {
  id: string;
  indexLabel: string;
  tabLabel: string;
  shortLabel: string;
  captionTitle: string;
  image: string;
  alt: string;
  motionFrom: { scale: number; x: string; y: string };
  motionTo: { scale: number; x: string; y: string };
}

const BANNER_SCENES: BannerScene[] = [
  {
    id: 'concert',
    indexLabel: '01',
    tabLabel: 'Concert Stage',
    shortLabel: 'Stage',
    captionTitle: 'Concert Line-Array & Live DJ Arenas',
    image: BRAND_ASSETS.heroAnimeConcert,
    alt: 'Illustrated anime-style grand concert arena with line-array speakers and fiery orange volumetric spotlights',
    motionFrom: { scale: 1.11, x: '-1.5%', y: '1%' },
    motionTo: { scale: 1.03, x: '1.2%', y: '-0.8%' },
  },
  {
    id: 'wedding',
    indexLabel: '02',
    tabLabel: 'Wedding Orchestra',
    shortLabel: 'Orchestra',
    captionTitle: 'Goldstar Orchestra & Royal Weddings',
    image: BRAND_ASSETS.heroAnimeWedding,
    alt: 'Illustrated anime-style South Indian wedding hall with live orchestra musicians and golden chandelier light',
    motionFrom: { scale: 1.09, x: '1.6%', y: '-0.8%' },
    motionTo: { scale: 1.03, x: '-1.2%', y: '0.8%' },
  },
  {
    id: 'studio',
    indexLabel: '03',
    tabLabel: 'Raga Studio',
    shortLabel: 'Studio',
    captionTitle: 'Raga Studio & Sampoorna Academy',
    image: BRAND_ASSETS.heroAnimeStudio,
    alt: 'Illustrated anime-style acoustic recording studio with mixing console and sunlit glass vocal booth',
    motionFrom: { scale: 1.1, x: '-1%', y: '-1.2%' },
    motionTo: { scale: 1.03, x: '1%', y: '0.8%' },
  },
];

const PROOF_METRICS = [
  { value: '25+', label: 'Years of Excellence' },
  { value: '500+', label: 'Events Played' },
  { value: '100%', label: 'Client Satisfaction' },
] as const;

const EQUALIZER_BARS = [
  { id: 'b1', heights: [0.3, 0.95, 0.45, 0.85, 0.3], duration: 1.15 },
  { id: 'b2', heights: [0.65, 0.35, 1.0, 0.4, 0.65], duration: 0.92 },
  { id: 'b3', heights: [0.4, 0.88, 0.3, 0.95, 0.4], duration: 1.28 },
  { id: 'b4', heights: [0.9, 0.45, 0.82, 0.35, 0.9], duration: 1.02 },
  { id: 'b5', heights: [0.35, 0.78, 0.55, 1.0, 0.35], duration: 1.2 },
  { id: 'b6', heights: [0.75, 0.3, 0.92, 0.48, 0.75], duration: 0.98 },
  { id: 'b7', heights: [0.42, 0.9, 0.38, 0.72, 0.42], duration: 1.1 },
] as const;

const AUTO_ADVANCE_MS = 7500;

export function HeroSection({ onBookNow, onOpenAdmin }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Subtle hardware-accelerated cursor parallax on desktop
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 65, damping: 24, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 65, damping: 24, mass: 0.8 });

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % BANNER_SCENES.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  const activeScene = BANNER_SCENES[activeIndex] ?? BANNER_SCENES[0];
  const isAnimating = !isPaused && !prefersReducedMotion;

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + BANNER_SCENES.length) % BANNER_SCENES.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % BANNER_SCENES.length);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(normX * -14);
    pointerY.set(normY * -9);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section id="home" className="bg-white border-b border-neutral-200 overflow-hidden">
      {/* Full-Bleed Animated Cinema Anime Stage Banner */}
      <div
        data-testid="hero-full-banner"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative w-full min-h-[540px] sm:min-h-[600px] lg:min-h-[650px] bg-[#171717] flex items-center overflow-hidden"
      >
        {/* Parallax & Crossfading Full-Bleed Artwork Layer with Choreographed Cinema Pan */}
        <motion.div
          style={prefersReducedMotion ? undefined : { x: smoothX, y: smoothY }}
          className="absolute -inset-4 will-change-transform"
        >
          <AnimatePresence mode="sync">
            <motion.div
              key={activeScene.id}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      scale: activeScene.motionFrom.scale,
                      x: activeScene.motionFrom.x,
                      y: activeScene.motionFrom.y,
                    }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      scale: activeScene.motionTo.scale,
                      x: activeScene.motionTo.x,
                      y: activeScene.motionTo.y,
                    }
              }
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: AUTO_ADVANCE_MS / 1000, ease: 'easeOut' },
                x: { duration: AUTO_ADVANCE_MS / 1000, ease: 'easeOut' },
                y: { duration: AUTO_ADVANCE_MS / 1000, ease: 'easeOut' },
              }}
              className="absolute inset-0 will-change-transform"
            >
              {!failedImages[activeScene.id] ? (
                <img
                  src={activeScene.image}
                  alt={activeScene.alt}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedImages((prev) => ({
                      ...prev,
                      [activeScene.id]: true,
                    }))
                  }
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#171717] via-[#242424] to-[#FF5A1F]/40" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Sweeping Volumetric Stage Light Beams */}
        {!prefersReducedMotion && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              animate={
                isAnimating
                  ? { rotate: [-14, 6, -14], opacity: [0.14, 0.24, 0.14] }
                  : { rotate: -6, opacity: 0.14 }
              }
              transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-24 right-[14%] w-[420px] h-[145%] origin-top bg-gradient-to-b from-[#FF5A1F]/40 via-[#FF8C42]/12 to-transparent blur-3xl will-change-transform"
            />
            <motion.div
              animate={
                isAnimating
                  ? { rotate: [12, -8, 12], opacity: [0.1, 0.2, 0.1] }
                  : { rotate: 4, opacity: 0.1 }
              }
              transition={{ duration: 11.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-24 right-[32%] w-[340px] h-[140%] origin-top bg-gradient-to-b from-amber-300/25 via-[#FF5A1F]/10 to-transparent blur-3xl will-change-transform"
            />
          </div>
        )}

        {/* Measured Directional Contrast Scrims */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#171717]/92 via-[#171717]/62 to-[#171717]/10"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#171717]/88 via-transparent to-[#171717]/28"
        />

        {/* Minimal Editorial Foreground Container */}
        <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-11 flex flex-col justify-between min-h-[540px] sm:min-h-[600px] lg:min-h-[650px]">
          <div className="max-w-xl my-auto">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm font-medium text-neutral-300 tracking-wide mb-4"
            >
              <span className="text-[#FF5A1F] font-semibold">SS Audios</span> · Erode, Tamil Nadu
            </motion.p>

            {/* Masked Line-by-Line Theatrical Headline Reveal */}
            <h1 className="font-display font-bold tracking-tight text-white text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.01] [text-wrap:balance]">
              <span className="block overflow-hidden pb-1">
                <motion.span
                  className="block"
                  initial={prefersReducedMotion ? false : { y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  WE DON&apos;T JUST CREATE SOUND.
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="block text-[#FF5A1F]"
                  initial={prefersReducedMotion ? false : { y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  WE CREATE EXPERIENCES.
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-base sm:text-lg text-neutral-200 max-w-[38ch]"
            >
              Live audio, orchestras, studio recording &amp; music academy.
            </motion.p>

            {/* Focused Two-Action CTA Row */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3.5"
            >
              <motion.button
                type="button"
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                onClick={onBookNow}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-[#FF5A1F]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Book Now
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <a
                href="#portfolio"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Play className="w-4 h-4 text-[#FF5A1F]" />
                Watch Portfolio
              </a>
            </motion.div>
          </div>

          {/* Minimal Bottom Cinema Director Bar */}
          <div className="mt-8 pt-4 border-t border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Live Acoustic Equalizer Visualizer Bars */}
              <div aria-hidden="true" className="flex items-end gap-[3px] h-4 w-7 shrink-0">
                {EQUALIZER_BARS.map((bar) => (
                  <motion.span
                    key={bar.id}
                    animate={isAnimating ? { scaleY: [...bar.heights] } : { scaleY: 0.38 }}
                    transition={
                      isAnimating
                        ? { duration: bar.duration, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.25 }
                    }
                    className="w-[2.5px] h-full origin-bottom rounded-xs bg-[#FF5A1F] will-change-transform"
                  />
                ))}
              </div>

              <motion.p
                key={activeScene.id}
                data-testid="hero-scene-title"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-sm sm:text-base font-medium text-white truncate"
              >
                <span className="font-mono text-xs text-[#FF5A1F] mr-2 tabular-nums">
                  {activeScene.indexLabel}/03
                </span>
                {activeScene.captionTitle}
              </motion.p>
            </div>

            <div className="flex flex-wrap items-center gap-2 max-w-full">
              {/* Scene Switcher Tabs with Live Auto-Advance Progress Line */}
              <div
                role="tablist"
                aria-label="Hero Banner Showcase Scenes"
                className="flex flex-wrap sm:inline-flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/15 max-w-full"
              >
                {BANNER_SCENES.map((scene, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      data-testid={`hero-scene-tab-${scene.id}`}
                      onClick={() => setActiveIndex(idx)}
                      className={`relative overflow-hidden px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#FF5A1F] text-white'
                          : 'text-neutral-200 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="relative z-10">
                        {scene.indexLabel}.{' '}
                        <span className="sm:hidden">{scene.shortLabel}</span>
                        <span className="hidden sm:inline">{scene.tabLabel}</span>
                      </span>
                      {isActive && isAnimating && (
                        <motion.span
                          key={`progress-${scene.id}-${activeIndex}`}
                          aria-hidden="true"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
                          className="absolute inset-x-0 bottom-0 h-[2px] bg-white/80 origin-left"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Transport Controls + Discreet Admin Portal Access */}
              <div className="inline-flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  data-testid="hero-prev-scene"
                  onClick={goPrev}
                  aria-label="Previous banner scene"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  data-testid="hero-next-scene"
                  onClick={goNext}
                  aria-label="Next banner scene"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  data-testid="hero-toggle-autoplay"
                  onClick={() => setIsPaused((prev) => !prev)}
                  aria-label={isPaused ? 'Resume banner animation' : 'Pause banner animation'}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white transition-colors cursor-pointer"
                  title={isPaused ? 'Resume slideshow' : 'Pause slideshow'}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  aria-label="Open Admin Portal"
                  className="ml-1 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-xs font-semibold text-neutral-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#FF5A1F]" />
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra-Clean Quantitative Proof Bar */}
      <div className="bg-white">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-3 gap-4 sm:gap-8 divide-x divide-neutral-200">
          {PROOF_METRICS.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row sm:items-baseline justify-center gap-1 sm:gap-3 pl-4 first:pl-0 text-center sm:text-left"
            >
              <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717] tabular-nums">
                {metric.value}
              </span>
              <span className="text-xs sm:text-sm font-medium text-neutral-600">
                {metric.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
