import { Check, SlidersHorizontal } from 'lucide-react';
import {
  formatPrice,
  getDjPackagePrice,
  getVisibleItems,
  type CurrencyCode,
  type DjPackage,
} from '../lib/domain';

interface DjPackagesSectionProps {
  packages: DjPackage[];
  currency: CurrencyCode;
  onBookPackage: (pkg: DjPackage) => void;
  onOpenAdminPricing: () => void;
}

export function DjPackagesSection({
  packages,
  currency,
  onBookPackage,
  onOpenAdminPricing,
}: DjPackagesSectionProps) {
  const visiblePackages = getVisibleItems(packages);
  if (visiblePackages.length === 0) return null;
  return (
    <section id="dj-packages" className="bg-white border-b border-neutral-200 py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#FF5A1F]">DJ Event Packages</p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717]">
              Sound &amp; lighting tiers
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenAdminPricing}
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-xs sm:text-sm font-medium text-[#171717] bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#FF5A1F]" />
            Edit Prices
          </button>
        </div>

        <div className="mt-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {visiblePackages.map((pkg) => {
            const amount = getDjPackagePrice(pkg, currency);
            const isFeatured = Boolean(pkg.featured);

            return (
              <article
                key={pkg.id}
                data-testid={`dj-package-${pkg.id}`}
                className={`flex flex-col justify-between rounded-2xl p-5 transition-colors ${
                  isFeatured
                    ? 'bg-[#171717] text-white border border-[#171717]'
                    : 'bg-[#F3F3F3]/60 text-[#171717] border border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">{pkg.name}</h3>
                    {isFeatured && (
                      <span className="text-[11px] font-semibold text-[#FF5A1F] whitespace-nowrap">
                        Popular
                      </span>
                    )}
                  </div>

                  <p className={`mt-1 text-xs ${isFeatured ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {pkg.powerRating} · {pkg.durationLabel}
                  </p>

                  <div className="mt-4 pb-4 border-b border-current/10">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-3xl font-bold tracking-tight tabular-nums">
                        {formatPrice(amount, currency)}
                      </span>
                      <span className={`text-xs ${isFeatured ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {pkg.unitLabel}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs leading-snug">
                    {pkg.features.slice(0, 5).map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF5A1F]" />
                        <span className={isFeatured ? 'text-neutral-200' : 'text-neutral-700'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => onBookPackage(pkg)}
                    className={`w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      isFeatured
                        ? 'bg-[#FF5A1F] hover:bg-[#E04810] text-white'
                        : 'bg-[#171717] hover:bg-[#FF5A1F] text-white'
                    }`}
                  >
                    Book Package
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
