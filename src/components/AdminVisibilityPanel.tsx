import { Eye, EyeOff, FolderOpen } from 'lucide-react';
import type { PortfolioCategory, SectionVisibility, SiteDataPayload } from '../lib/domain';

interface AdminVisibilityPanelProps {
  siteData: SiteDataPayload;
  busyKey: string | null;
  onToggleSection: (key: keyof SectionVisibility, nextVisible: boolean) => void;
  onTogglePortfolioCategory: (category: PortfolioCategory, nextHidden: boolean) => void;
  onBulkPortfolioCategory: (
    categoryId: string,
    slotAction: 'hide-empty' | 'show-all',
  ) => void;
  onJumpToCategory: (categoryId: string) => void;
}

const SECTION_META: Array<{
  key: keyof SectionVisibility;
  title: string;
  description: string;
}> = [
  {
    key: 'services',
    title: 'Signature Event Services',
    description: '6 core production verticals (Weddings, Goldstar Orchestra, Lighting & Audio, DJ, Welcome Dance, Instrumentals)',
  },
  {
    key: 'portfolio',
    title: '70-Slot Video Portfolio',
    description: 'Horizontally scrollable live event video galleries across 7 categories',
  },
  {
    key: 'djPackages',
    title: 'DJ Event Packages (₹)',
    description: '5 scalable DJ & concert audio tiers from Starter to Elite',
  },
  {
    key: 'ragaStudio',
    title: 'Raga Studio',
    description: '8 recording, vocal mixing, karaoke, podcasting, and chroma-key video suite services',
  },
  {
    key: 'sampoornaAcademy',
    title: 'Sampoorna Music Academy',
    description: '4 structured music education courses (Vocal, Keyboard, Flute, Tabla)',
  },
];

export function AdminVisibilityPanel({
  siteData,
  busyKey,
  onToggleSection,
  onTogglePortfolioCategory,
  onBulkPortfolioCategory,
  onJumpToCategory,
}: AdminVisibilityPanelProps) {
  return (
    <div className="space-y-6">
      {/* Master Website Section Visibility */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h3 className="font-display text-base font-bold text-[#171717]">
            Website Sections — Master Show / Hide Controls
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Temporarily hide or show entire sections on the public SS Audios website without losing
            any prices or uploaded videos.
          </p>
        </div>

        <div className="divide-y divide-neutral-200">
          {SECTION_META.map((sec) => {
            const isVisible = siteData.sectionVisibility[sec.key];
            const isBusy = busyKey === `section-${sec.key}`;
            return (
              <div
                key={sec.key}
                data-testid={`admin-section-vis-${sec.key}`}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#171717]">{sec.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{sec.description}</p>
                </div>

                <button
                  type="button"
                  disabled={isBusy}
                  data-testid={`toggle-section-${sec.key}`}
                  onClick={() => onToggleSection(sec.key, !isVisible)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                    isVisible
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {isVisible ? 'Visible on Site' : 'Hidden from Site'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category-Wise Video Portfolio Visibility Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h3 className="font-display text-base font-bold text-[#171717]">
            Portfolio Categories — Category-Wise View &amp; Hide Controls
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            Control visibility for each of the 7 video galleries, hide empty &ldquo;Awaiting
            footage&rdquo; slots in one click, or jump straight into a category to upload videos.
          </p>
        </div>

        <div className="divide-y divide-neutral-200">
          {siteData.portfolioCategories.map((cat) => {
            const publishedCount = cat.slots.filter(
              (s) => s.status === 'published' && s.videoUrl,
            ).length;
            const visibleCount = cat.slots.filter((s) => !s.hidden).length;
            const hiddenCount = cat.slots.length - visibleCount;
            const isHidden = Boolean(cat.hidden);
            const isBusy = busyKey === `cat-${cat.id}`;

            return (
              <div
                key={cat.id}
                data-testid={`admin-cat-row-${cat.id}`}
                className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#171717]">{cat.name}</p>
                    <span className="text-xs text-neutral-500 font-mono tabular-nums">
                      · {publishedCount} published · {visibleCount} visible · {hiddenCount} hidden
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{cat.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onJumpToCategory(cat.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171717] bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    Manage Videos
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onBulkPortfolioCategory(cat.id, 'hide-empty')}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:border-neutral-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    Hide Empty Slots
                  </button>

                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onBulkPortfolioCategory(cat.id, 'show-all')}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:border-neutral-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      Show All 10
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isBusy}
                    data-testid={`toggle-cat-overview-${cat.id}`}
                    onClick={() => onTogglePortfolioCategory(cat, !isHidden)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 ${
                      isHidden
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {isHidden ? 'Category Hidden' : 'Category Visible'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
