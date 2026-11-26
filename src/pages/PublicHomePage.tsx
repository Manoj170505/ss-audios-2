import { useEffect, useState } from 'react';
import { AlertTriangle, MessageCircle, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { Stage3DExperience } from '../components/Stage3DExperience';
import { SignatureServicesSection } from '../components/SignatureServicesSection';
import { VideoPortfolioSection } from '../components/VideoPortfolioSection';
import { DjPackagesSection } from '../components/DjPackagesSection';
import { RagaStudioSection } from '../components/RagaStudioSection';
import { SampoornaAcademySection } from '../components/SampoornaAcademySection';
import { AiEventStudioSection } from '../components/AiEventStudioSection';
import { ContactLocationSection } from '../components/ContactLocationSection';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import type { AdminTab } from '../components/AdminPortalModal';
import {
  formatPrice,
  getDjPackagePrice,
  type AcademyCourse,
  type BusinessVertical,
  type DjPackage,
  type RagaStudioService,
  type SignatureService,
  type SiteDataPayload,
} from '../lib/domain';

interface PublicHomePageProps {
  siteData: SiteDataPayload;
  onOpenAdmin: (tab?: AdminTab, slotId?: string | null) => void;
}

export function PublicHomePage({ siteData, onOpenAdmin }: PublicHomePageProps) {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  // Shared Enquiry Modal state
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryPrefill, setEnquiryPrefill] = useState<{
    category?: BusinessVertical;
    service?: string;
  }>({});

  // Listen for Google Maps Platform Demo Key quota exceeded events
  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const openEnquiry = (category?: BusinessVertical, service?: string) => {
    setEnquiryPrefill({ category, service });
    setEnquiryOpen(true);
  };

  const handleBookService = (service: SignatureService) => {
    openEnquiry('SS Audios – Event & Entertainment', `${service.title} (${service.priceLabel})`);
  };

  const handleBookDjPackage = (pkg: DjPackage) => {
    const formatted = formatPrice(getDjPackagePrice(pkg, siteData.currency), siteData.currency);
    openEnquiry('DJ Event Packages', `${pkg.name} Package (${formatted} ${pkg.unitLabel})`);
  };

  const handleBookStudioService = (service: RagaStudioService) => {
    openEnquiry('Raga Studio', `${service.title} (${service.priceLabel})`);
  };

  const handleEnquireCourse = (course: AcademyCourse) => {
    openEnquiry('Sampoorna Music Academy', `${course.title} (${course.feeLabel})`);
  };

  const handleBookStageRig = (rigLabel: string) => {
    openEnquiry('SS Audios – Event & Entertainment', rigLabel);
  };

  const handleBookPortfolioCategory = (categoryName: string) => {
    openEnquiry('SS Audios – Event & Entertainment', categoryName);
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] selection:bg-[#FF5A1F] selection:text-white">
      {/* Google Maps Platform Demo Key Quota Banner */}
      {mapsQuotaExceeded && (
        <div
          role="alert"
          className="sticky top-0 z-50 bg-amber-50 border-b border-amber-300 px-4 py-2.5 text-xs sm:text-sm text-amber-950"
        >
          <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <p>
                Google Maps Platform demo quota reached for this session.{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-[#FF5A1F]"
                >
                  Learn how to configure your own Maps API key
                </a>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapsQuotaExceeded(false)}
              aria-label="Dismiss quota notice"
              className="p-1 hover:bg-amber-200/60 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Navbar onBookNow={() => openEnquiry()} />

      <main>
        <HeroSection
          onBookNow={() => openEnquiry()}
          onOpenAdmin={() => onOpenAdmin('portfolio')}
        />

        <Stage3DExperience onBookStage={handleBookStageRig} />

        {siteData.sectionVisibility.services && (
          <SignatureServicesSection
            services={siteData.signatureServices}
            onBookService={handleBookService}
          />
        )}

        {siteData.sectionVisibility.portfolio && (
          <VideoPortfolioSection
            categories={siteData.portfolioCategories}
            onOpenAdminForSlot={(slotId) => onOpenAdmin('portfolio', slotId)}
            onBookCategory={handleBookPortfolioCategory}
          />
        )}

        {siteData.sectionVisibility.djPackages && (
          <DjPackagesSection
            packages={siteData.djPackages}
            currency={siteData.currency}
            onBookPackage={handleBookDjPackage}
            onOpenAdminPricing={() => onOpenAdmin('pricing')}
            onOpenAdminForSlot={(slotId) => onOpenAdmin('portfolio', slotId)}
          />
        )}

        {siteData.sectionVisibility.ragaStudio && (
          <RagaStudioSection
            services={siteData.ragaStudioServices}
            onBookStudioService={handleBookStudioService}
          />
        )}

        {siteData.sectionVisibility.sampoornaAcademy && (
          <SampoornaAcademySection
            courses={siteData.academyCourses}
            onEnquireCourse={handleEnquireCourse}
            onJoinAcademy={() => openEnquiry('Sampoorna Music Academy')}
          />
        )}

        <AiEventStudioSection />

        <ContactLocationSection onOpenEnquiry={() => openEnquiry()} />
      </main>

      <Footer
        onBookNow={() => openEnquiry()}
        onOpenAdmin={() => onOpenAdmin('portfolio')}
      />

      {/* Floating WhatsApp Quick Enquiry Button */}
      <button
        type="button"
        onClick={() => openEnquiry()}
        aria-label="Open WhatsApp Booking Enquiry"
        data-testid="floating-whatsapp-btn"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-xl flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
      >
        <MessageCircle className="w-7 h-7 fill-white text-white" />
      </button>

      {/* Shared Intelligent WhatsApp Enquiry Modal */}
      <EnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        initialCategory={enquiryPrefill.category}
        initialService={enquiryPrefill.service}
        djPackages={siteData.djPackages}
        signatureServices={siteData.signatureServices}
        ragaStudioServices={siteData.ragaStudioServices}
        academyCourses={siteData.academyCourses}
        currency={siteData.currency}
      />
    </div>
  );
}
