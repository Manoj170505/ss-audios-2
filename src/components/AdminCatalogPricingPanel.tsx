import { useState } from 'react';
import { Check, Eye, EyeOff, Film, Loader2 } from 'lucide-react';
import {
  formatPrice,
  getDjPackagePrice,
  type AcademyCourse,
  type CurrencyCode,
  type DjPackage,
  type RagaStudioService,
  type SignatureService,
} from '../lib/domain';

type PricingCategoryKey = 'dj' | 'services' | 'studio' | 'academy';

interface AdminCatalogPricingPanelProps {
  currencyDraft: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  djPackagesDraft: DjPackage[];
  onChangeDjPackages: (next: DjPackage[]) => void;
  servicesDraft: SignatureService[];
  onChangeServices: (next: SignatureService[]) => void;
  studioDraft: RagaStudioService[];
  onChangeStudio: (next: RagaStudioService[]) => void;
  academyDraft: AcademyCourse[];
  onChangeAcademy: (next: AcademyCourse[]) => void;
  saving: boolean;
  onSaveAll: () => void;
  onManagePackageVideos?: (packageId: string) => void;
}

export function AdminCatalogPricingPanel({
  currencyDraft,
  onChangeCurrency,
  djPackagesDraft,
  onChangeDjPackages,
  servicesDraft,
  onChangeServices,
  studioDraft,
  onChangeStudio,
  academyDraft,
  onChangeAcademy,
  saving,
  onSaveAll,
  onManagePackageVideos,
}: AdminCatalogPricingPanelProps) {
  const [categoryKey, setCategoryKey] = useState<PricingCategoryKey>('dj');

  const tabs: Array<{ key: PricingCategoryKey; label: string; count: string }> = [
    {
      key: 'dj',
      label: 'DJ Packages',
      count: `${djPackagesDraft.filter((p) => !p.hidden).length}/${djPackagesDraft.length}`,
    },
    {
      key: 'services',
      label: 'Event Services',
      count: `${servicesDraft.filter((s) => !s.hidden).length}/${servicesDraft.length}`,
    },
    {
      key: 'studio',
      label: 'Raga Studio',
      count: `${studioDraft.filter((s) => !s.hidden).length}/${studioDraft.length}`,
    },
    {
      key: 'academy',
      label: 'Music Academy',
      count: `${academyDraft.filter((c) => !c.hidden).length}/${academyDraft.length}`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header + Category-Wise Switcher + Currency Selector */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#171717]">
              Category-Wise Prices &amp; Item Visibility (₹)
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Edit Rupee prices, descriptions, or hide/show any package, event service, studio rate,
              or academy course. Click Save &amp; Publish to update the live site immediately.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onChangeCurrency('INR')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                currencyDraft === 'INR'
                  ? 'bg-[#FF5A1F] text-white'
                  : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Indian Rupees (₹ INR)
            </button>
            <button
              type="button"
              onClick={() => onChangeCurrency('USD')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                currencyDraft === 'USD'
                  ? 'bg-[#171717] text-white'
                  : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              US Dollars ($ USD)
            </button>
          </div>
        </div>

        {/* Category-Wise Sub-Tabs */}
        <div
          role="tablist"
          aria-label="Pricing Categories"
          className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-neutral-100"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={categoryKey === tab.key}
              data-testid={`pricing-subtab-${tab.key}`}
              onClick={() => setCategoryKey(tab.key)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                categoryKey === tab.key
                  ? 'bg-[#171717] text-white'
                  : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {tab.label} ({tab.count} visible)
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY 1: DJ PACKAGES */}
      {categoryKey === 'dj' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {djPackagesDraft.map((pkg, idx) => {
            const isHidden = Boolean(pkg.hidden);
            return (
              <div
                key={pkg.id}
                data-testid={`admin-dj-card-${pkg.id}`}
                className={`bg-white rounded-xl border p-5 space-y-3 transition-opacity ${
                  isHidden ? 'border-neutral-300 opacity-75' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display text-lg font-bold text-[#171717]">{pkg.name}</h4>
                    <span className="font-mono text-xs font-bold text-[#FF5A1F] tabular-nums">
                      Live: {formatPrice(getDjPackagePrice(pkg, currencyDraft), currencyDraft)}
                    </span>
                  </div>

                  <button
                    type="button"
                    data-testid={`toggle-dj-hide-${pkg.id}`}
                    onClick={() =>
                      onChangeDjPackages(
                        djPackagesDraft.map((item, i) =>
                          i === idx ? { ...item, hidden: !item.hidden } : item,
                        ),
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      isHidden
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {isHidden ? 'Hidden' : 'Visible'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Price in Rupees (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      data-testid={`price-inr-${pkg.id}`}
                      value={pkg.priceInr}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        onChangeDjPackages(
                          djPackagesDraft.map((item, i) =>
                            i === idx ? { ...item, priceInr: val } : item,
                          ),
                        );
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Price in USD ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={pkg.priceUsd}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        onChangeDjPackages(
                          djPackagesDraft.map((item, i) =>
                            i === idx ? { ...item, priceUsd: val } : item,
                          ),
                        );
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={pkg.tagline}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChangeDjPackages(
                        djPackagesDraft.map((item, i) =>
                          i === idx ? { ...item, tagline: val } : item,
                        ),
                      );
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Included Features (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={pkg.features.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      onChangeDjPackages(
                        djPackagesDraft.map((item, i) =>
                          i === idx ? { ...item, features: lines } : item,
                        ),
                      );
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                {onManagePackageVideos && (
                  <button
                    type="button"
                    onClick={() => onManagePackageVideos(pkg.id)}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-[#171717] hover:bg-[#FF5A1F] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    Manage 10 Videos
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CATEGORY 2: SIGNATURE EVENT SERVICES */}
      {categoryKey === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servicesDraft.map((service, idx) => {
            const isHidden = Boolean(service.hidden);
            return (
              <div
                key={service.id}
                data-testid={`admin-service-card-${service.id}`}
                className={`bg-white rounded-xl border p-5 space-y-3 transition-opacity ${
                  isHidden ? 'border-neutral-300 opacity-75' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display text-base font-bold text-[#171717] truncate">
                      {service.title}
                    </h4>
                    <span className="font-mono text-xs font-bold text-[#FF5A1F] tabular-nums">
                      Display: {service.priceLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    data-testid={`toggle-service-hide-${service.id}`}
                    onClick={() =>
                      onChangeServices(
                        servicesDraft.map((item, i) =>
                          i === idx ? { ...item, hidden: !item.hidden } : item,
                        ),
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      isHidden
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {isHidden ? 'Hidden' : 'Visible'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Starting Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      data-testid={`service-price-${service.id}`}
                      value={service.startingPrice}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        const suffix = service.priceLabel.toLowerCase().includes('onwards')
                          ? ' onwards'
                          : '';
                        onChangeServices(
                          servicesDraft.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  startingPrice: val,
                                  priceLabel: `${formatPrice(val, 'INR')}${suffix}`,
                                }
                              : item,
                          ),
                        );
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Display Price Label
                    </label>
                    <input
                      type="text"
                      value={service.priceLabel}
                      onChange={(e) =>
                        onChangeServices(
                          servicesDraft.map((item, i) =>
                            i === idx ? { ...item, priceLabel: e.target.value } : item,
                          ),
                        )
                      }
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Short Summary
                  </label>
                  <textarea
                    rows={2}
                    value={service.summary}
                    onChange={(e) =>
                      onChangeServices(
                        servicesDraft.map((item, i) =>
                          i === idx ? { ...item, summary: e.target.value } : item,
                        ),
                      )
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CATEGORY 3: RAGA STUDIO SERVICES */}
      {categoryKey === 'studio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {studioDraft.map((service, idx) => {
            const isHidden = Boolean(service.hidden);
            return (
              <div
                key={service.id}
                data-testid={`admin-studio-card-${service.id}`}
                className={`bg-white rounded-xl border p-4 space-y-3 transition-opacity ${
                  isHidden ? 'border-neutral-300 opacity-75' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display text-sm font-bold text-[#171717] truncate">
                      {service.title}
                    </h4>
                    <span className="font-mono text-xs font-bold text-[#FF5A1F] tabular-nums">
                      {service.priceLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    data-testid={`toggle-studio-hide-${service.id}`}
                    onClick={() =>
                      onChangeStudio(
                        studioDraft.map((item, i) =>
                          i === idx ? { ...item, hidden: !item.hidden } : item,
                        ),
                      )
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                      isHidden
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {isHidden ? 'Hidden' : 'Visible'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      data-testid={`studio-price-${service.id}`}
                      value={service.priceValue}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        onChangeStudio(
                          studioDraft.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  priceValue: val,
                                  priceLabel: `${formatPrice(val, 'INR')}/${item.unit}`,
                                }
                              : item,
                          ),
                        );
                      }}
                      className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Billing Unit
                    </label>
                    <input
                      type="text"
                      value={service.unit}
                      onChange={(e) => {
                        const unit = e.target.value;
                        onChangeStudio(
                          studioDraft.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  unit,
                                  priceLabel: `${formatPrice(item.priceValue, 'INR')}/${unit || 'session'}`,
                                }
                              : item,
                          ),
                        );
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={service.description}
                    onChange={(e) =>
                      onChangeStudio(
                        studioDraft.map((item, i) =>
                          i === idx ? { ...item, description: e.target.value } : item,
                        ),
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CATEGORY 4: SAMPOORNA MUSIC ACADEMY COURSES */}
      {categoryKey === 'academy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {academyDraft.map((course, idx) => {
            const isHidden = Boolean(course.hidden);
            return (
              <div
                key={course.id}
                data-testid={`admin-course-card-${course.id}`}
                className={`bg-white rounded-xl border p-5 space-y-3 transition-opacity ${
                  isHidden ? 'border-neutral-300 opacity-75' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display text-base font-bold text-[#171717]">
                      {course.title}
                    </h4>
                    <span className="font-mono text-xs font-bold text-[#FF5A1F] tabular-nums">
                      {course.feeLabel} · {course.duration}
                    </span>
                  </div>

                  <button
                    type="button"
                    data-testid={`toggle-course-hide-${course.id}`}
                    onClick={() =>
                      onChangeAcademy(
                        academyDraft.map((item, i) =>
                          i === idx ? { ...item, hidden: !item.hidden } : item,
                        ),
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                      isHidden
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {isHidden ? 'Hidden' : 'Visible'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Monthly Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      data-testid={`course-fee-${course.id}`}
                      value={course.feeMonthly}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        onChangeAcademy(
                          academyDraft.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  feeMonthly: val,
                                  feeLabel: `${formatPrice(val, 'INR')}/month`,
                                }
                              : item,
                          ),
                        );
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={course.duration}
                      onChange={(e) =>
                        onChangeAcademy(
                          academyDraft.map((item, i) =>
                            i === idx ? { ...item, duration: e.target.value } : item,
                          ),
                        )
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Course Description
                  </label>
                  <textarea
                    rows={2}
                    value={course.description}
                    onChange={(e) =>
                      onChangeAcademy(
                        academyDraft.map((item, i) =>
                          i === idx ? { ...item, description: e.target.value } : item,
                        ),
                      )
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Save & Publish Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200">
        <p className="text-xs text-neutral-600">
          Updates publish immediately across all public sections, the WhatsApp Enquiry form, and the
          Production Advisor.
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={onSaveAll}
          data-testid="save-dj-prices-btn"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-xl transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save &amp; Publish All Prices Live
        </button>
      </div>
    </div>
  );
}
