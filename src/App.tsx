/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PublicHomePage } from './pages/PublicHomePage';
import { AdminPage } from './pages/AdminPage';
import { apiUrl } from './lib/api';
import type { AdminTab } from './components/AdminPortalModal';
import {
  ACADEMY_COURSES,
  DEFAULT_DJ_PACKAGES,
  MAX_VIDEO_FILE_BYTES,
  RAGA_STUDIO_SERVICES,
  SIGNATURE_SERVICES,
  STORAGE_QUOTA_BYTES,
  computeStorageStats,
  createDefaultPortfolioCategories,
  createDefaultSectionVisibility,
  type SiteDataPayload,
} from './lib/domain';

function createFallbackSiteData(): SiteDataPayload {
  const categories = createDefaultPortfolioCategories();
  return {
    currency: 'INR',
    djPackages: DEFAULT_DJ_PACKAGES,
    signatureServices: SIGNATURE_SERVICES,
    ragaStudioServices: RAGA_STUDIO_SERVICES,
    academyCourses: ACADEMY_COURSES,
    sectionVisibility: createDefaultSectionVisibility(),
    portfolioCategories: categories,
    storageStats: computeStorageStats(categories, STORAGE_QUOTA_BYTES, MAX_VIDEO_FILE_BYTES),
    updatedAt: new Date().toISOString(),
  };
}

function AppRoutes() {
  const [siteData, setSiteData] = useState<SiteDataPayload>(() => createFallbackSiteData());
  const navigate = useNavigate();

  // Hydrate live portfolio videos and DJ Rupee pricing from backend
  useEffect(() => {
    let active = true;
    fetch(apiUrl('/api/site-data'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SiteDataPayload | null) => {
        if (active && data && Array.isArray(data.djPackages) && Array.isArray(data.portfolioCategories)) {
          setSiteData(data);
        }
      })
      .catch(() => {
        // Fallback defaults already rendered cleanly
      });
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAdmin = (tab: AdminTab = 'portfolio', slotId: string | null = null) => {
    const params = new URLSearchParams();
    if (tab && tab !== 'portfolio') {
      params.set('tab', tab);
    }
    if (slotId) {
      params.set('slot', slotId);
    }
    const query = params.toString();
    navigate(`/admin${query ? `?${query}` : ''}`);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicHomePage
            siteData={siteData}
            onOpenAdmin={handleOpenAdmin}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <AdminPage
            siteData={siteData}
            onSiteDataUpdated={(next) => setSiteData(next)}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
