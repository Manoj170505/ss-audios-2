import { useSearchParams } from 'react-router-dom';
import { AdminPortalModal, type AdminTab } from '../components/AdminPortalModal';
import type { SiteDataPayload } from '../lib/domain';

interface AdminPageProps {
  siteData: SiteDataPayload;
  onSiteDataUpdated: (next: SiteDataPayload) => void;
}

export function AdminPage({ siteData, onSiteDataUpdated }: AdminPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const validTabs: AdminTab[] = ['portfolio', 'pricing', 'visibility', 'workspace'];
  const activeTab: AdminTab = validTabs.includes(rawTab as AdminTab) ? (rawTab as AdminTab) : 'portfolio';
  const slotId = searchParams.get('slot');

  const handleTabChange = (nextTab: AdminTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === 'portfolio') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', nextTab);
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <AdminPortalModal
      isPage
      isOpen
      siteData={siteData}
      initialTab={activeTab}
      initialSlotId={slotId}
      onTabChange={handleTabChange}
      onSiteDataUpdated={onSiteDataUpdated}
    />
  );
}
