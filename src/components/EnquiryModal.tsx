import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  createInitialEnquiryDraft,
  getServiceOptionsForCategory,
  validateEnquiryForm,
  type AcademyCourse,
  type BusinessVertical,
  type CurrencyCode,
  type DjPackage,
  type EnquiryFormData,
  type EnquiryValidationErrors,
  type RagaStudioService,
  type SignatureService,
} from '../lib/domain';
import { apiUrl } from '../lib/api';

const DRAFT_STORAGE_KEY = 'ss_audios_enquiry_draft_v1';

const CATEGORIES: BusinessVertical[] = [
  'SS Audios – Event & Entertainment',
  'DJ Event Packages',
  'Raga Studio',
  'Sampoorna Music Academy',
];

const BATCH_OPTIONS = [
  'Weekday Batch (Mon–Fri)',
  'Weekend Batch (Sat–Sun)',
  'One-to-One Flexible Coaching',
];

const LEARNING_LEVELS = ['Beginner', 'Intermediate', 'Advanced / Stage Performer'];

const STUDIO_DURATIONS = ['1 Hour', '2 Hours', '3 Hours', 'Half Day (4 Hours)', 'Full Day (8 Hours)', 'Full Project'];

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: BusinessVertical;
  initialService?: string;
  djPackages: DjPackage[];
  signatureServices: SignatureService[];
  ragaStudioServices: RagaStudioService[];
  academyCourses: AcademyCourse[];
  currency: CurrencyCode;
}

function loadSavedDraft(): EnquiryFormData {
  const base = createInitialEnquiryDraft();
  if (typeof window === 'undefined') return base;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<EnquiryFormData>;
    return {
      ...base,
      ...parsed,
    };
  } catch {
    return base;
  }
}

export function EnquiryModal({
  isOpen,
  onClose,
  initialCategory,
  initialService,
  djPackages,
  signatureServices,
  ragaStudioServices,
  academyCourses,
  currency,
}: EnquiryModalProps) {
  const [form, setForm] = useState<EnquiryFormData>(() => loadSavedDraft());
  const [errors, setErrors] = useState<EnquiryValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync prefilled category & service whenever modal opens from a specific CTA
  useEffect(() => {
    if (!isOpen) return;
    setShowErrors(false);
    setErrors({});
    setCopied(false);

    if (initialCategory || initialService) {
      setForm((prev) => {
        const nextCategory = initialCategory || prev.category;
        const options = getServiceOptionsForCategory(
          nextCategory,
          djPackages,
          currency,
          signatureServices,
          ragaStudioServices,
          academyCourses,
        );
        let nextService = prev.service;

        if (initialService) {
          const exact = options.find((opt) =>
            opt.toLowerCase().includes(initialService.toLowerCase()),
          );
          nextService = exact || initialService;
        } else if (!options.includes(prev.service)) {
          nextService = options[0] || '';
        }

        return {
          ...prev,
          category: nextCategory,
          service: nextService,
        };
      });
    }
  }, [
    isOpen,
    initialCategory,
    initialService,
    djPackages,
    signatureServices,
    ragaStudioServices,
    academyCourses,
    currency,
  ]);

  // Persist visitor enquiry draft to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage quota errors
    }
  }, [form]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const serviceOptions = useMemo(() => {
    const baseOptions = getServiceOptionsForCategory(
      form.category,
      djPackages,
      currency,
      signatureServices,
      ragaStudioServices,
      academyCourses,
    );
    if (form.service && !baseOptions.includes(form.service)) {
      return [form.service, ...baseOptions];
    }
    return baseOptions;
  }, [
    form.category,
    form.service,
    djPackages,
    signatureServices,
    ragaStudioServices,
    academyCourses,
    currency,
  ]);

  const liveValidation = useMemo(() => validateEnquiryForm(form), [form]);
  const isFormValid = Object.keys(liveValidation).length === 0;
  const formattedPreview = useMemo(() => buildWhatsAppMessage(form), [form]);
  const whatsappUrl = useMemo(() => buildWhatsAppUrl(form), [form]);

  if (!isOpen) return null;

  const updateField = <K extends keyof EnquiryFormData>(key: K, value: EnquiryFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'category') {
        const opts = getServiceOptionsForCategory(
          value as BusinessVertical,
          djPackages,
          currency,
          signatureServices,
          ragaStudioServices,
          academyCourses,
        );
        next.service = opts[0] || '';
      }
      if (showErrors) {
        setErrors(validateEnquiryForm(next));
      }
      return next;
    });
  };

  const handleClearDraft = () => {
    const reset = createInitialEnquiryDraft();
    setForm(reset);
    setErrors({});
    setShowErrors(false);
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleValidateAttempt = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    const nextErrors = validateEnquiryForm(form);
    if (Object.keys(nextErrors).length > 0) {
      e.preventDefault();
      setErrors(nextErrors);
      setShowErrors(true);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(formattedPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable in restricted context
    }
  };

  const isStudio = form.category === 'Raga Studio';
  const isAcademy = form.category === 'Sampoorna Music Academy';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-heading"
      data-testid="enquiry-modal"
      className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-5xl w-full my-auto overflow-hidden border border-neutral-200 shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#171717] text-white flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs font-medium text-[#FF5A1F]">
              Direct WhatsApp Booking · +91 99653 68899
            </p>
            <h2 id="enquiry-modal-heading" className="font-display text-xl font-bold mt-0.5">
              Book / Enquire with SS Audios
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearDraft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              title="Reset saved form draft"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Draft
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking enquiry modal"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
          {/* Left: Form Inputs */}
          <div className="lg:col-span-7 p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-neutral-200">
            {showErrors && Object.keys(errors).length > 0 && (
              <div
                role="alert"
                data-testid="enquiry-validation-alert"
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-semibold">Please complete the highlighted fields before opening WhatsApp.</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Your draft is saved automatically on this device.
                  </p>
                </div>
              </div>
            )}

            {/* Category & Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="enquiry-category" className="block text-xs font-semibold text-[#171717] mb-1.5">
                  Business Category *
                </label>
                <select
                  id="enquiry-category"
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value as BusinessVertical)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="enquiry-service" className="block text-xs font-semibold text-[#171717] mb-1.5">
                  {isAcademy ? 'Course *' : isStudio ? 'Studio Service *' : 'Service / Package *'}
                </label>
                <select
                  id="enquiry-service"
                  value={form.service}
                  onChange={(e) => updateField('service', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                >
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="enquiry-fullname" className="block text-xs font-semibold text-[#171717] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="enquiry-fullname"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="e.g., Karthik Subramanian"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-[#171717] focus:outline-none ${
                    showErrors && errors.fullName
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-neutral-300 focus:border-[#FF5A1F]'
                  }`}
                />
                {showErrors && errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="enquiry-mobile" className="block text-xs font-semibold text-[#171717] mb-1.5">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  id="enquiry-mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => updateField('mobile', e.target.value)}
                  placeholder="e.g., +91 98422 00000"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-[#171717] focus:outline-none ${
                    showErrors && errors.mobile
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-neutral-300 focus:border-[#FF5A1F]'
                  }`}
                />
                {showErrors && errors.mobile && (
                  <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="enquiry-email" className="block text-xs font-semibold text-[#171717] mb-1.5">
                  Email (Optional)
                </label>
                <input
                  id="enquiry-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-[#171717] focus:outline-none ${
                    showErrors && errors.email
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-neutral-300 focus:border-[#FF5A1F]'
                  }`}
                />
                {showErrors && errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="enquiry-date" className="block text-xs font-semibold text-[#171717] mb-1.5">
                  {isAcademy ? 'Preferred Start Date' : isStudio ? 'Session Date' : 'Event Date'}
                </label>
                <input
                  id="enquiry-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div>
                <label htmlFor="enquiry-time" className="block text-xs font-semibold text-[#171717] mb-1.5">
                  Preferred Time
                </label>
                <input
                  id="enquiry-time"
                  type="text"
                  value={form.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  placeholder={isAcademy ? 'e.g., 5:00 PM' : 'e.g., 6:30 PM onwards'}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>
            </div>

            {/* Category-Specific Dynamic Fields */}
            {isStudio ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label htmlFor="enquiry-duration" className="block text-xs font-semibold text-[#171717] mb-1.5">
                    Session Duration
                  </label>
                  <select
                    id="enquiry-duration"
                    value={form.sessionDuration}
                    onChange={(e) => updateField('sessionDuration', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  >
                    {STUDIO_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enquiry-studio-budget" className="block text-xs font-semibold text-[#171717] mb-1.5">
                    Estimated Budget (₹)
                  </label>
                  <input
                    id="enquiry-studio-budget"
                    type="text"
                    value={form.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    placeholder="e.g., ₹5,000"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="enquiry-recording-req" className="block text-xs font-semibold text-[#171717] mb-1.5">
                    Recording / Production Requirements
                  </label>
                  <input
                    id="enquiry-recording-req"
                    type="text"
                    value={form.recordingRequirements}
                    onChange={(e) => updateField('recordingRequirements', e.target.value)}
                    placeholder="e.g., 2 vocalists + keyboard track, green screen camera setup"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>
            ) : isAcademy ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label htmlFor="enquiry-batch" className="block text-xs font-semibold text-[#171717] mb-1.5">
                    Preferred Batch
                  </label>
                  <select
                    id="enquiry-batch"
                    value={form.preferredBatch}
                    onChange={(e) => updateField('preferredBatch', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  >
                    {BATCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enquiry-level" className="block text-xs font-semibold text-[#171717] mb-1.5">
                    Current Learning Level
                  </label>
                  <select
                    id="enquiry-level"
                    value={form.learningLevel}
                    onChange={(e) => updateField('learningLevel', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  >
                    {LEARNING_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label htmlFor="enquiry-venue" className="block text-xs font-semibold text-[#171717] mb-1.5">
                    Venue / City
                  </label>
                  <input
                    id="enquiry-venue"
                    type="text"
                    value={form.venue}
                    onChange={(e) => updateField('venue', e.target.value)}
                    placeholder="e.g., Kongu Kalaiarangam, Erode"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-audience" className="block text-xs font-semibold text-[#171717] mb-1.5">
                    Expected Audience
                  </label>
                  <input
                    id="enquiry-audience"
                    type="text"
                    value={form.audience}
                    onChange={(e) => updateField('audience', e.target.value)}
                    placeholder="e.g., 500 guests"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-budget" className="block text-xs font-semibold text-[#171717] mb-1.5">
                    Estimated Budget (₹)
                  </label>
                  <input
                    id="enquiry-budget"
                    type="text"
                    value={form.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    placeholder="e.g., ₹45,000"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>
            )}

            {/* Additional Requirements */}
            <div>
              <label htmlFor="enquiry-notes" className="block text-xs font-semibold text-[#171717] mb-1.5">
                Additional Requirements or Song / Schedule Notes
              </label>
              <textarea
                id="enquiry-notes"
                rows={3}
                value={form.additionalRequirements}
                onChange={(e) => updateField('additionalRequirements', e.target.value)}
                placeholder="Share custom lighting preferences, welcome dance cues, song requests, or batch timing notes..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
              />
            </div>
          </div>

          {/* Right: Live WhatsApp Preview & Launch */}
          <div className="lg:col-span-5 bg-[#F3F3F3] p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Live WhatsApp Message Preview
                </p>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#171717] hover:text-[#FF5A1F] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>

              <pre
                data-testid="whatsapp-preview"
                className="bg-white border border-neutral-200 rounded-xl p-4 text-xs leading-relaxed text-neutral-800 whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto shadow-xs"
              >
                {formattedPreview}
              </pre>
            </div>

            <div className="space-y-3">
              {isFormValid ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="whatsapp-launch-link"
                  onClick={() => {
                    fetch(apiUrl('/api/contact'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(form),
                    }).catch(() => {});
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-xl transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Continue to WhatsApp (+91 99653 68899)
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleValidateAttempt}
                  data-testid="whatsapp-validate-btn"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-xl transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Continue to WhatsApp
                </button>
              )}

              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Drafts are saved automatically in your browser. Clicking Continue opens WhatsApp with
                your structured message prefilled—<strong>your enquiry is only sent when you press Send inside WhatsApp.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
