import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CloudUpload,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  FolderSync,
  HardDrive,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Table2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  MAX_VIDEO_FILE_BYTES,
  STORAGE_QUOTA_BYTES,
  formatBytes,
  type AcademyCourse,
  type CurrencyCode,
  type DjPackage,
  type PortfolioCategory,
  type PortfolioSlot,
  type RagaStudioService,
  type SectionVisibility,
  type SignatureService,
  type SiteDataPayload,
} from '../lib/domain';
import {
  getCurrentFirebaseUser,
  getWorkspaceAccessToken,
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
} from '../lib/workspaceAuth';
import { AdminCatalogPricingPanel } from './AdminCatalogPricingPanel';
import { AdminVisibilityPanel } from './AdminVisibilityPanel';
import { apiUrl, resolveMediaUrl } from '../lib/api';

export type AdminTab = 'portfolio' | 'pricing' | 'visibility' | 'workspace';

export interface AdminPortalModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  siteData: SiteDataPayload;
  initialTab?: AdminTab;
  initialSlotId?: string | null;
  onTabChange?: (tab: AdminTab) => void;
  onSiteDataUpdated: (next: SiteDataPayload) => void;
  isPage?: boolean;
}

interface AuthStatusResponse {
  needsFirstRunClaim: boolean;
  hasEnvPasscode: boolean;
  ownerEmailHint: string;
}

interface ConfirmDialogState {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
}

interface DriveFileSummary {
  id: string;
  name: string;
  size?: string;
  webViewLink?: string;
  createdTime?: string;
}

function encodeBase64UrlUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function GoogleGsiButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="gsi-material-button"
    >
      <div className="gsi-material-button-state" />
      <div className="gsi-material-button-content-wrapper">
        <div className="gsi-material-button-icon">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block' }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span className="gsi-material-button-contents">{label}</span>
        <span style={{ display: 'none' }}>{label}</span>
      </div>
    </button>
  );
}

export function AdminPortalModal({
  isOpen = true,
  onClose,
  siteData,
  initialTab = 'portfolio',
  initialSlotId = null,
  onTabChange,
  onSiteDataUpdated,
  isPage = false,
}: AdminPortalModalProps) {
  // Admin auth stored strictly in React memory (never localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminLabel, setAdminLabel] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Navigation & feedback
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialSlotId !== undefined) setHighlightedSlotId(initialSlotId);
  }, [initialSlotId]);

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    siteData.portfolioCategories[0]?.id || 'wedding-events',
  );
  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(initialSlotId);
  const [slotSearch, setSlotSearch] = useState('');
  const [slotStatusFilter, setSlotStatusFilter] = useState<
    'all' | 'visible' | 'hidden' | 'published' | 'awaiting'
  >('all');
  const [visibilityBusyKey, setVisibilityBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmDialogState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Slot metadata inline edit drafts
  const [slotDrafts, setSlotDrafts] = useState<
    Record<string, { title: string; archiveTag: string; location: string }>
  >({});
  const [previewSlotId, setPreviewSlotId] = useState<string | null>(null);

  // Chunked upload state per slot
  const [uploadState, setUploadState] = useState<{
    slotId: string;
    fileName: string;
    percent: number;
    receivedBytes: number;
    totalBytes: number;
    statusText: string;
  } | null>(null);

  // All-Category Live Pricing & Visibility Drafts
  const [currencyDraft, setCurrencyDraft] = useState<CurrencyCode>(siteData.currency);
  const [packagesDraft, setPackagesDraft] = useState<DjPackage[]>(siteData.djPackages);
  const [servicesDraft, setServicesDraft] = useState<SignatureService[]>(siteData.signatureServices);
  const [studioDraft, setStudioDraft] = useState<RagaStudioService[]>(siteData.ragaStudioServices);
  const [academyDraft, setAcademyDraft] = useState<AcademyCourse[]>(siteData.academyCourses);
  const [savingPrices, setSavingPrices] = useState(false);

  // Google Workspace state
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(() => getWorkspaceAccessToken());
  const [workspaceEmail, setWorkspaceEmail] = useState<string | null>(
    () => getCurrentFirebaseUser()?.email ?? null,
  );
  const [driveFiles, setDriveFiles] = useState<DriveFileSummary[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);

  // Calendar form
  const [calTitle, setCalTitle] = useState('SS Audios Wedding Reception — Live Audio & DJ');
  const [calDate, setCalDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
  const [calStartTime, setCalStartTime] = useState('18:00');
  const [calEndTime, setCalEndTime] = useState('22:30');
  const [calLocation, setCalLocation] = useState('Erode, Tamil Nadu');
  const [calNotes, setCalNotes] = useState('Line-array PA, DMX moving heads, and DJ console setup.');
  const [createdEventLink, setCreatedEventLink] = useState<string | null>(null);

  // Gmail confirmation form
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('SS Audios Booking Confirmation — Event Production');
  const [mailBody, setMailBody] = useState(
    'Hello,\n\nThank you for booking with SS Audios (Erode, Tamil Nadu). Your event slot is confirmed. For immediate coordination, reach us on WhatsApp at +91 99653 68899.\n\nWarm regards,\nSS Audios Team\nwww.ssaudios.in',
  );

  // Initialize tab, highlighted slot, and auth status ONLY when modal opens or target props change
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setHighlightedSlotId(initialSlotId || null);
    if (initialSlotId) {
      const cat = siteData.portfolioCategories.find((c) =>
        c.slots.some((s) => s.id === initialSlotId),
      );
      if (cat) setSelectedCategoryId(cat.id);
    }
    setCurrencyDraft(siteData.currency);
    setPackagesDraft(siteData.djPackages);
    setServicesDraft(siteData.signatureServices);
    setStudioDraft(siteData.ragaStudioServices);
    setAcademyDraft(siteData.academyCourses);

    fetch(apiUrl('/api/admin/auth/status'))
      .then((res) => res.json())
      .then((data: AuthStatusResponse) => setAuthStatus(data))
      .catch(() => {
        setAuthStatus({ needsFirstRunClaim: false, hasEnvPasscode: false, ownerEmailHint: 'connectjawa@gmail.com' });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTab, initialSlotId]);

  // Escape key closes modal when no confirm dialog is open (modal mode only)
  useEffect(() => {
    if (!isOpen || isPage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingConfirm) {
          setPendingConfirm(null);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isPage, onClose, pendingConfirm]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  const activeCategory = useMemo(() => {
    return (
      siteData.portfolioCategories.find((c) => c.id === selectedCategoryId) ||
      siteData.portfolioCategories[0]
    );
  }, [siteData.portfolioCategories, selectedCategoryId]);

  const visibleSlots = useMemo(() => {
    if (!activeCategory) return [];
    const q = slotSearch.trim().toLowerCase();
    return activeCategory.slots.filter((s) => {
      const isPub = s.status === 'published' && Boolean(s.videoUrl);
      const isHidden = Boolean(s.hidden);
      if (slotStatusFilter === 'visible' && isHidden) return false;
      if (slotStatusFilter === 'hidden' && !isHidden) return false;
      if (slotStatusFilter === 'published' && !isPub) return false;
      if (slotStatusFilter === 'awaiting' && isPub) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.archiveTag.toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q) ||
        String(s.slotNumber).includes(q)
      );
    });
  }, [activeCategory, slotSearch, slotStatusFilter]);

  if (!isOpen) return null;

  const handlePasscodeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint = authStatus?.needsFirstRunClaim
        ? '/api/admin/auth/claim'
        : '/api/admin/auth/login';
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }
      setAdminToken(data.token);
      setAdminLabel(authStatus?.needsFirstRunClaim ? 'Admin (Passcode Configured)' : 'Admin Passcode Session');
      setPasscodeInput('');
      setAuthStatus((prev) => (prev ? { ...prev, needsFirstRunClaim: false } : prev));
      showToast('success', 'Signed in to SS Audios Admin Portal.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { user, accessToken } = await signInWithGoogleWorkspace();
      setWorkspaceToken(accessToken);
      setWorkspaceEmail(user.email || null);

      const res = await fetch(apiUrl('/api/admin/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google owner verification failed.');
      }
      setAdminToken(data.token);
      setAdminLabel(data.email || user.email || 'Google Owner');
      showToast('success', `Authenticated as ${data.email || user.email} with Google Workspace.`);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConnectWorkspaceOnly = async () => {
    setWorkspaceBusy(true);
    try {
      const { user, accessToken } = await signInWithGoogleWorkspace();
      setWorkspaceToken(accessToken);
      setWorkspaceEmail(user.email || null);
      showToast('success', `Connected Google Workspace for ${user.email}.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Google Workspace connection cancelled.');
    } finally {
      setWorkspaceBusy(false);
    }
  };

  const handleSignOutAll = async () => {
    setAdminToken(null);
    setAdminLabel('');
    setWorkspaceToken(null);
    setWorkspaceEmail(null);
    setDriveFiles([]);
    try {
      await signOutGoogleWorkspace();
    } catch {
      // ignore if firebase wasn't signed in
    }
  };

  // Resumable chunked video upload (supports up to 3 GiB per file / 5 GiB total)
  const handleChunkedVideoUpload = async (slot: PortfolioSlot, file: File) => {
    if (!adminToken) return;
    if (!file.type.startsWith('video/')) {
      showToast('error', 'Please select a valid video file (MP4, WebM, MOV).');
      return;
    }
    if (file.size > MAX_VIDEO_FILE_BYTES) {
      showToast('error', 'This video exceeds the 3 GiB per-video upload limit.');
      return;
    }

    try {
      setUploadState({
        slotId: slot.id,
        fileName: file.name,
        percent: 0,
        receivedBytes: 0,
        totalBytes: file.size,
        statusText: 'Initializing resumable upload session...',
      });

      const initRes = await fetch(apiUrl('/api/admin/uploads/init'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          slotId: slot.id,
          fileName: file.name,
          mimeType: file.type || 'video/mp4',
          totalSize: file.size,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initData.error || 'Could not initialize video upload.');
      }

      const uploadId: string = initData.uploadId;
      const chunkSize: number = initData.chunkSize || 4 * 1024 * 1024;
      let offset = 0;

      while (offset < file.size) {
        const end = Math.min(offset + chunkSize, file.size);
        const slice = file.slice(offset, end);
        const buffer = await slice.arrayBuffer();

        let attempt = 0;
        let uploadedChunk = false;
        while (attempt < 3 && !uploadedChunk) {
          attempt += 1;
          try {
            const chunkRes = await fetch(apiUrl(`/api/admin/uploads/${uploadId}/chunk`), {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/octet-stream',
                'X-Upload-Offset': String(offset),
                Authorization: `Bearer ${adminToken}`,
              },
              body: buffer,
            });
            const chunkJson = await chunkRes.json();
            if (!chunkRes.ok) {
              if (chunkRes.status === 409 && typeof chunkJson.expectedOffset === 'number') {
                offset = chunkJson.expectedOffset;
                uploadedChunk = true;
                break;
              }
              throw new Error(chunkJson.error || 'Chunk upload failed.');
            }
            offset = chunkJson.receivedBytes;
            uploadedChunk = true;
          } catch (chunkErr) {
            if (attempt >= 3) throw chunkErr;
            setUploadState((prev) =>
              prev ? { ...prev, statusText: `Retrying chunk (attempt ${attempt + 1}/3)...` } : prev,
            );
            await new Promise((r) => setTimeout(r, 700 * attempt));
          }
        }

        const pct = Math.min(99, Math.round((offset / file.size) * 100));
        setUploadState({
          slotId: slot.id,
          fileName: file.name,
          percent: pct,
          receivedBytes: offset,
          totalBytes: file.size,
          statusText: `Uploading ${formatBytes(offset)} of ${formatBytes(file.size)}`,
        });
      }

      setUploadState((prev) => (prev ? { ...prev, percent: 100, statusText: 'Publishing live to portfolio...' } : prev));
      const draftTitle = slotDrafts[slot.id]?.title;
      const completeRes = await fetch(apiUrl(`/api/admin/uploads/${uploadId}/complete`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ title: draftTitle || slot.title }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        throw new Error(completeData.error || 'Could not finalize video.');
      }

      onSiteDataUpdated(completeData.siteData);
      showToast('success', `Published "${slot.title}" live (${formatBytes(file.size)}).`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setUploadState(null);
    }
  };

  const handleSaveSlotMetadata = async (slot: PortfolioSlot) => {
    if (!adminToken) return;
    const draft = slotDrafts[slot.id];
    if (!draft) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/portfolio/${slot.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update slot details.');
      onSiteDataUpdated(data);
      setSlotDrafts((prev) => {
        const next = { ...prev };
        delete next[slot.id];
        return next;
      });
      showToast('success', `Updated slot #${slot.slotNumber} metadata live.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save slot.');
    }
  };

  const requestDeleteSlotVideo = (slot: PortfolioSlot) => {
    setPendingConfirm({
      title: `Remove video from Slot #${slot.slotNumber}?`,
      description: `This permanently removes the uploaded video file (${formatBytes(
        slot.fileSizeBytes,
      )}) from "${slot.title}" and resets the slot to "Awaiting footage".`,
      confirmLabel: 'Remove Video',
      destructive: true,
      onConfirm: async () => {
        if (!adminToken) return;
        const res = await fetch(apiUrl(`/api/admin/portfolio/${slot.id}/video`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not remove video.');
        onSiteDataUpdated(data);
        if (previewSlotId === slot.id) setPreviewSlotId(null);
        showToast('success', `Removed video from "${slot.title}".`);
      },
    });
  };

  const requestBackupVideoToDrive = (slot: PortfolioSlot) => {
    if (!workspaceToken) {
      showToast('error', 'Connect Google Workspace first in the Google Workspace tab.');
      return;
    }
    if (!slot.videoUrl) return;
    setPendingConfirm({
      title: 'Backup video to Google Drive?',
      description: `Upload "${slot.title}" (${formatBytes(
        slot.fileSizeBytes,
      )}) to your Google Drive using the app-scoped drive.file permission and store its Drive link on Slot #${slot.slotNumber}.`,
      confirmLabel: 'Upload to Google Drive',
      onConfirm: async () => {
        const mediaRes = await fetch(slot.videoUrl!);
        if (!mediaRes.ok) throw new Error('Could not read local video stream for Drive backup.');
        const blob = await mediaRes.blob();

        const initRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${workspaceToken}`,
              'Content-Type': 'application/json; charset=UTF-8',
              'X-Upload-Content-Type': slot.mimeType || 'video/mp4',
              'X-Upload-Content-Length': String(blob.size),
            },
            body: JSON.stringify({
              name: `SS_Audios_${slot.id}_${slot.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`,
              mimeType: slot.mimeType || 'video/mp4',
              description: `SS Audios Portfolio Backup — ${slot.archiveTag}`,
            }),
          },
        );
        if (!initRes.ok) throw new Error(`Google Drive upload init failed (${initRes.status}).`);
        const uploadLocation = initRes.headers.get('location');
        if (!uploadLocation) throw new Error('Google Drive did not return a resumable upload URI.');

        const putRes = await fetch(uploadLocation, {
          method: 'PUT',
          headers: {
            'Content-Type': slot.mimeType || 'video/mp4',
          },
          body: blob,
        });
        if (!putRes.ok) throw new Error(`Google Drive upload failed (${putRes.status}).`);
        const driveFile = (await putRes.json()) as { id: string; webViewLink?: string };

        if (adminToken) {
          const patchRes = await fetch(apiUrl(`/api/admin/portfolio/${slot.id}`), {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
              driveFileId: driveFile.id,
              driveWebViewLink: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
            }),
          });
          if (patchRes.ok) {
            onSiteDataUpdated(await patchRes.json());
          }
        }
        showToast('success', `Backed up "${slot.title}" to Google Drive.`);
      },
    });
  };

  // Toggle individual portfolio slot hidden/visible on public site
  const handleToggleSlotVisibility = async (slot: PortfolioSlot) => {
    if (!adminToken) return;
    const nextHidden = !Boolean(slot.hidden);
    setVisibilityBusyKey(`slot-${slot.id}`);
    try {
      const res = await fetch(apiUrl(`/api/admin/portfolio/${slot.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ hidden: nextHidden }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update slot visibility.');
      onSiteDataUpdated(data);
      showToast(
        'success',
        nextHidden
          ? `Hidden Slot #${slot.slotNumber} ("${slot.title}") from public website.`
          : `Restored Slot #${slot.slotNumber} ("${slot.title}") to public website.`,
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Visibility update failed.');
    } finally {
      setVisibilityBusyKey(null);
    }
  };

  // Toggle entire portfolio category hidden/visible
  const handleTogglePortfolioCategory = async (category: PortfolioCategory, nextHidden: boolean) => {
    if (!adminToken) return;
    setVisibilityBusyKey(`cat-${category.id}`);
    try {
      const res = await fetch(apiUrl(`/api/admin/portfolio-categories/${category.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ hidden: nextHidden }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update category visibility.');
      onSiteDataUpdated(data);
      showToast(
        'success',
        nextHidden
          ? `Hidden "${category.name}" category from public portfolio.`
          : `Showing "${category.name}" category on public portfolio.`,
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Category visibility update failed.');
    } finally {
      setVisibilityBusyKey(null);
    }
  };

  // Bulk hide empty or show all slots inside a portfolio category
  const handleBulkCategorySlots = async (
    categoryId: string,
    slotAction: 'hide-empty' | 'show-all',
  ) => {
    if (!adminToken) return;
    setVisibilityBusyKey(`cat-${categoryId}`);
    try {
      const res = await fetch(apiUrl(`/api/admin/portfolio-categories/${categoryId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ slotAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not apply bulk visibility update.');
      onSiteDataUpdated(data);
      showToast(
        'success',
        slotAction === 'hide-empty'
          ? 'Hidden all empty "Awaiting footage" slots in this category.'
          : 'Restored visibility for all 10 slots in this category.',
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Bulk update failed.');
    } finally {
      setVisibilityBusyKey(null);
    }
  };

  // Toggle major website section visibility
  const handleToggleSectionVisibility = async (
    key: keyof SectionVisibility,
    nextVisible: boolean,
  ) => {
    if (!adminToken) return;
    setVisibilityBusyKey(`section-${key}`);
    try {
      const res = await fetch(apiUrl('/api/admin/catalog'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          sectionVisibility: {
            ...siteData.sectionVisibility,
            [key]: nextVisible,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update section visibility.');
      onSiteDataUpdated(data);
      showToast(
        'success',
        nextVisible ? 'Section is now visible on the public website.' : 'Section hidden from public website.',
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update section visibility.');
    } finally {
      setVisibilityBusyKey(null);
    }
  };

  // Unified All-Category Catalog Pricing & Item Visibility Save Handler
  const handleSaveAllCatalogPrices = async () => {
    if (!adminToken) return;
    setSavingPrices(true);
    try {
      const res = await fetch(apiUrl('/api/admin/catalog'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          currency: currencyDraft,
          djPackages: packagesDraft,
          signatureServices: servicesDraft,
          ragaStudioServices: studioDraft,
          academyCourses: academyDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not publish catalog prices.');
      onSiteDataUpdated(data);
      setPackagesDraft(data.djPackages);
      setServicesDraft(data.signatureServices);
      setStudioDraft(data.ragaStudioServices);
      setAcademyDraft(data.academyCourses);
      showToast(
        'success',
        `Published all category prices & visibility live in ${
          currencyDraft === 'INR' ? 'Indian Rupees (₹)' : 'US Dollars ($)'
        }.`,
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save prices.');
    } finally {
      setSavingPrices(false);
    }
  };

  // Workspace operations
  const handleListDriveBackups = async () => {
    if (!workspaceToken) return;
    setDriveLoading(true);
    try {
      const q = encodeURIComponent("trashed = false and name contains 'SS_Audios_'");
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,webViewLink,createdTime)&pageSize=25`,
        {
          headers: { Authorization: `Bearer ${workspaceToken}` },
        },
      );
      if (!res.ok) throw new Error(`Drive listing failed (${res.status}).`);
      const json = (await res.json()) as { files?: DriveFileSummary[] };
      setDriveFiles(json.files || []);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Could not fetch Drive files.');
    } finally {
      setDriveLoading(false);
    }
  };

  const requestDeleteDriveFile = (file: DriveFileSummary) => {
    if (!workspaceToken) return;
    setPendingConfirm({
      title: 'Delete Google Drive backup?',
      description: `Permanently delete "${file.name}" from your Google Drive.`,
      confirmLabel: 'Delete from Drive',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${workspaceToken}` },
        });
        if (!res.ok) throw new Error(`Drive delete failed (${res.status}).`);
        setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
        showToast('success', `Deleted "${file.name}" from Google Drive.`);
      },
    });
  };

  const requestCreateRateCardSheet = () => {
    if (!workspaceToken) {
      showToast('error', 'Connect Google Workspace first.');
      return;
    }
    setPendingConfirm({
      title: 'Export Live Rate Card to Google Sheets?',
      description:
        'Creates a new Google Sheet in your Drive populated with SS Audios DJ Package prices (₹ INR & $ USD), storage summary, and portfolio slot inventory.',
      confirmLabel: 'Create Google Sheet',
      onConfirm: async () => {
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${workspaceToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              title: `SS Audios Live Rate Card & Portfolio (${new Date().toISOString().slice(0, 10)})`,
            },
          }),
        });
        if (!createRes.ok) throw new Error(`Google Sheets creation failed (${createRes.status}).`);
        const sheet = (await createRes.json()) as { spreadsheetId: string; spreadsheetUrl: string };

        const rows: string[][] = [
          ['SS Audios Live Rate Card & Portfolio Inventory', `Active Currency: ${siteData.currency}`, `Updated: ${siteData.updatedAt}`],
          [],
          ['DJ Package', 'Price (INR ₹)', 'Price (USD $)', 'Status', 'Power', 'Duration', 'Tagline'],
          ...siteData.djPackages.map((p) => [
            p.name,
            `₹${p.priceInr}`,
            `$${p.priceUsd}`,
            p.hidden ? 'Hidden' : 'Visible',
            p.powerRating,
            p.durationLabel,
            p.tagline,
          ]),
          [],
          ['Signature Event Services', 'Starting Rate (₹)', 'Status'],
          ...siteData.signatureServices.map((s) => [s.title, s.priceLabel, s.hidden ? 'Hidden' : 'Visible']),
          [],
          ['Raga Studio Services', 'Rate (₹)', 'Status'],
          ...siteData.ragaStudioServices.map((s) => [s.title, s.priceLabel, s.hidden ? 'Hidden' : 'Visible']),
          [],
          ['Sampoorna Music Academy', 'Monthly Fee (₹)', 'Duration', 'Status'],
          ...siteData.academyCourses.map((c) => [c.title, c.feeLabel, c.duration, c.hidden ? 'Hidden' : 'Visible']),
          [],
          ['Portfolio Category', 'Category Status', 'Visible Slots', 'Published Videos', 'Storage Used'],
          ...siteData.portfolioCategories.map((cat) => {
            const published = cat.slots.filter((s) => s.status === 'published' && s.videoUrl);
            const visibleCount = cat.slots.filter((s) => !s.hidden).length;
            const bytes = published.reduce((acc, s) => acc + s.fileSizeBytes, 0);
            return [
              cat.name,
              cat.hidden ? 'Hidden' : 'Visible',
              `${visibleCount}/${cat.slots.length}`,
              String(published.length),
              formatBytes(bytes),
            ];
          }),
        ];

        const updateRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${workspaceToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: rows }),
          },
        );
        if (!updateRes.ok) throw new Error(`Failed writing rows to Google Sheet (${updateRes.status}).`);
        setCreatedSheetUrl(sheet.spreadsheetUrl);
        showToast('success', 'Created SS Audios Rate Card in Google Sheets.');
      },
    });
  };

  const requestScheduleCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken) {
      showToast('error', 'Connect Google Workspace first.');
      return;
    }
    setPendingConfirm({
      title: 'Add Booking to Google Calendar?',
      description: `Schedule "${calTitle}" on ${calDate} (${calStartTime}–${calEndTime}) at ${calLocation} in your primary Google Calendar.`,
      confirmLabel: 'Create Calendar Event',
      onConfirm: async () => {
        const startIso = `${calDate}T${calStartTime}:00+05:30`;
        const endIso = `${calDate}T${calEndTime}:00+05:30`;
        const res = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${workspaceToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: calTitle,
              location: calLocation,
              description: calNotes,
              start: { dateTime: startIso, timeZone: 'Asia/Kolkata' },
              end: { dateTime: endIso, timeZone: 'Asia/Kolkata' },
            }),
          },
        );
        if (!res.ok) throw new Error(`Calendar scheduling failed (${res.status}).`);
        const ev = (await res.json()) as { htmlLink?: string };
        setCreatedEventLink(ev.htmlLink || null);
        showToast('success', 'Event scheduled on Google Calendar.');
      },
    });
  };

  const requestSendGmailConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken) {
      showToast('error', 'Connect Google Workspace first.');
      return;
    }
    if (!mailTo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailTo.trim())) {
      showToast('error', 'Please enter a valid recipient email address.');
      return;
    }
    setPendingConfirm({
      title: 'Send Email via Gmail?',
      description: `Send "${mailSubject}" to ${mailTo.trim()} from your connected Google account (${workspaceEmail || 'signed-in account'}).`,
      confirmLabel: 'Send Email',
      onConfirm: async () => {
        const mime = [
          `To: ${mailTo.trim()}`,
          `Subject: ${mailSubject.trim()}`,
          'Content-Type: text/plain; charset="UTF-8"',
          '',
          mailBody,
        ].join('\r\n');
        const raw = encodeBase64UrlUtf8(mime);
        const res = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${workspaceToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw }),
          },
        );
        if (!res.ok) throw new Error(`Gmail send failed (${res.status}).`);
        showToast('success', `Confirmation email sent to ${mailTo.trim()}.`);
      },
    });
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    setConfirmBusy(true);
    try {
      await pendingConfirm.onConfirm();
      setPendingConfirm(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Action failed.');
      setPendingConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  const { storageStats } = siteData;

  if (!isOpen && !isPage) return null;

  const headerContent = (
    <div
      className={`bg-[#171717] text-white ${
        isPage ? 'px-5 sm:px-8 py-4 sticky top-0 z-30 shadow-md' : 'px-5 sm:px-6 py-4'
      } flex flex-wrap items-center justify-between gap-4 shrink-0`}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#FF5A1F] flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 id="admin-portal-heading" className="font-display text-lg sm:text-xl font-bold">
              SS Audios Live Admin Portal
            </h2>
            {isPage && (
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#FF5A1F]/20 text-[#FF5A1F] border border-[#FF5A1F]/30">
                /admin
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400">
            70 Portfolio Video Slots (5 GiB Storage · 3 GiB/Video) · Live Rupee Pricing · Google Workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {adminToken && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-300 bg-white/10 px-3 py-1.5 rounded-lg">
            <span className="max-w-[200px] truncate">{adminLabel}</span>
          </div>
        )}
        {adminToken && (
          <button
            type="button"
            onClick={handleSignOutAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        )}
        {isPage ? (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            View Public Website
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Admin Portal"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  const modalOrPageBody = (
    <div
      className={
        isPage
          ? 'flex-1 flex flex-col w-full'
          : 'bg-[#F3F3F3] rounded-2xl w-full max-w-6xl h-[92vh] overflow-hidden border border-neutral-300 shadow-2xl flex flex-col'
      }
      onClick={isPage ? undefined : (e) => e.stopPropagation()}
    >
      {headerContent}

        {/* Inline Toast Feedback */}
        {toast && (
          <div
            role="status"
            className={`px-6 py-2.5 text-sm font-medium flex items-center justify-between gap-3 shrink-0 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            <span>{toast.text}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss message" className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Auth Gate OR Unlocked Admin Workspace */}
        {!adminToken ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-neutral-200 max-w-lg w-full p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F3F3F3] flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#FF5A1F]" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#171717]">
                    Owner &amp; Admin Verification
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Sign in to upload portfolio videos or update live DJ Rupee pricing
                  </p>
                </div>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {authError}
                </div>
              )}

              {/* Option 1: Official Google Sign-In */}
              <div className="p-4 rounded-xl bg-[#F3F3F3]/80 border border-neutral-200">
                <p className="text-xs font-semibold text-[#171717] mb-1">
                  1. Sign in with Owner Google Account
                </p>
                <p className="text-xs text-neutral-600 mb-3">
                  Verifies owner identity ({authStatus?.ownerEmailHint || 'connectjawa@gmail.com'}) and
                  connects Google Drive, Sheets, Calendar &amp; Gmail in one step.
                </p>
                <GoogleGsiButton
                  label={authLoading ? 'Signing in...' : 'Sign in with Google'}
                  disabled={authLoading}
                  onClick={handleGoogleAdminSignIn}
                />
              </div>

              <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
                <div className="h-px bg-neutral-200 flex-1" />
                <span>OR</span>
                <div className="h-px bg-neutral-200 flex-1" />
              </div>

              {/* Option 2: Admin Passcode (or First-Run Claim) */}
              <form onSubmit={handlePasscodeAuth} className="space-y-3">
                <div>
                  <label htmlFor="admin-passcode-input" className="block text-xs font-semibold text-[#171717] mb-1">
                    {authStatus?.needsFirstRunClaim
                      ? '2. First-Run Setup: Create Admin Passcode (min 6 characters)'
                      : '2. Sign in with Admin Passcode'}
                  </label>
                  <p className="text-xs text-neutral-500 mb-2">
                    {authStatus?.needsFirstRunClaim
                      ? 'No passcode is configured yet. Set your private passcode once to unlock live uploads and pricing controls.'
                      : 'Enter your configured SS Audios admin passcode (or ADMIN_PASSCODE secret).'}
                  </p>
                  <input
                    id="admin-passcode-input"
                    data-testid="admin-passcode-input"
                    type="password"
                    required
                    minLength={authStatus?.needsFirstRunClaim ? 6 : 4}
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder={
                      authStatus?.needsFirstRunClaim
                        ? 'Choose a strong passcode (e.g., 6+ chars)'
                        : 'Enter admin passcode'
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  data-testid="admin-passcode-submit"
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#171717] hover:bg-[#FF5A1F] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {authStatus?.needsFirstRunClaim
                    ? 'Set Admin Passcode & Unlock Portal'
                    : 'Unlock Admin Portal'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs + Storage Summary Bar */}
            <div className="bg-white border-b border-neutral-200 px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => switchTab('portfolio')}
                  data-testid="admin-tab-portfolio"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'portfolio'
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  Portfolio Videos ({storageStats.publishedCount}/{storageStats.totalSlots})
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('pricing')}
                  data-testid="admin-tab-pricing"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'pricing'
                      ? 'bg-[#FF5A1F] text-white'
                      : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Prices &amp; Catalog (₹)
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('visibility')}
                  data-testid="admin-tab-visibility"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'visibility'
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Visibility &amp; Sections
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('workspace')}
                  data-testid="admin-tab-workspace"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'workspace'
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#F3F3F3] text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <FolderSync className="w-4 h-4" />
                  Google Workspace
                </button>
              </div>

              {/* Compact Storage Quota Meter */}
              <div className="flex items-center gap-3 text-xs">
                <HardDrive className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                <div className="min-w-[180px]">
                  <div className="flex justify-between font-medium text-[#171717] tabular-nums">
                    <span>{formatBytes(storageStats.usedBytes)} used</span>
                    <span className="text-neutral-500">5.00 GB quota</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-[#FF5A1F] transition-all duration-300"
                      style={{ width: `${Math.max(storageStats.usedPercent, storageStats.usedBytes > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {/* TAB 1: PORTFOLIO VIDEOS (70 SLOTS) */}
              {activeTab === 'portfolio' && activeCategory && (
                <div className="space-y-5">
                  {/* Quota & Resumable Upload Info Banner */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#171717]">
                        Resumable Chunked Video Hosting — Up to {formatBytes(MAX_VIDEO_FILE_BYTES)} per Video
                      </p>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Total capacity: {formatBytes(STORAGE_QUOTA_BYTES)} across all 70 slots ({formatBytes(storageStats.remainingBytes)} remaining).
                        Upload MP4, WebM, or MOV directly into any slot and it goes live immediately on the public portfolio.
                      </p>
                    </div>
                    <input
                      type="search"
                      value={slotSearch}
                      onChange={(e) => setSlotSearch(e.target.value)}
                      placeholder="Filter slots by title or tag..."
                      className="px-3.5 py-2 text-sm rounded-lg border border-neutral-300 bg-white text-[#171717] focus:outline-none focus:border-[#FF5A1F] md:w-64"
                    />
                  </div>

                  {/* Category-Wise Switcher with Hidden Status Indicator */}
                  <div className="flex flex-wrap items-center gap-2">
                    {siteData.portfolioCategories.map((cat) => {
                      const pubCount = cat.slots.filter((s) => s.status === 'published' && s.videoUrl).length;
                      const isCatHidden = Boolean(cat.hidden);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          data-testid={`admin-cat-tab-${cat.id}`}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedCategoryId === cat.id
                              ? 'bg-[#FF5A1F] text-white'
                              : isCatHidden
                                ? 'bg-neutral-200 text-neutral-600 border border-neutral-300 hover:border-neutral-500'
                                : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          {isCatHidden && <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                          <span>
                            {cat.name} ({pubCount}/10)
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Category Controls Bar: Category Show/Hide, Bulk Empty Hide, & Slot Filter */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-display font-bold text-[#171717]">
                        {activeCategory.name}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono tabular-nums">
                        · {activeCategory.slots.filter((s) => !s.hidden).length} visible ·{' '}
                        {activeCategory.slots.filter((s) => s.hidden).length} hidden
                      </span>

                      <button
                        type="button"
                        disabled={visibilityBusyKey === `cat-${activeCategory.id}`}
                        data-testid={`toggle-category-visibility-${activeCategory.id}`}
                        onClick={() =>
                          void handleTogglePortfolioCategory(activeCategory, !Boolean(activeCategory.hidden))
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 ${
                          activeCategory.hidden
                            ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {activeCategory.hidden ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        {activeCategory.hidden ? 'Category Hidden — Click to Show' : 'Category Visible — Hide'}
                      </button>

                      <button
                        type="button"
                        disabled={visibilityBusyKey === `cat-${activeCategory.id}`}
                        onClick={() => void handleBulkCategorySlots(activeCategory.id, 'hide-empty')}
                        className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                      >
                        Hide Empty Slots
                      </button>

                      {activeCategory.slots.some((s) => s.hidden) && (
                        <button
                          type="button"
                          disabled={visibilityBusyKey === `cat-${activeCategory.id}`}
                          onClick={() => void handleBulkCategorySlots(activeCategory.id, 'show-all')}
                          className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                        >
                          Show All 10
                        </button>
                      )}
                    </div>

                    {/* Slot Status Filter Segmented Controls */}
                    <div className="flex items-center gap-1 bg-[#F3F3F3] p-1 rounded-lg self-start lg:self-auto">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'visible', label: 'Visible' },
                          { id: 'hidden', label: 'Hidden' },
                          { id: 'published', label: 'Published' },
                          { id: 'awaiting', label: 'Awaiting' },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSlotStatusFilter(f.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            slotStatusFilter === f.id
                              ? 'bg-white text-[#171717] shadow-xs'
                              : 'text-neutral-600 hover:text-[#171717]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Upload Progress Banner */}
                  {uploadState && (
                    <div className="bg-[#171717] text-white rounded-xl p-4 border border-[#FF5A1F]/40">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-semibold truncate">
                          Uploading {uploadState.fileName}
                        </span>
                        <span className="font-mono text-[#FF5A1F] font-bold tabular-nums">
                          {uploadState.percent}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full bg-[#FF5A1F] transition-all duration-200"
                          style={{ width: `${uploadState.percent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-300">{uploadState.statusText}</p>
                    </div>
                  )}

                  {/* 10 Slots List for Selected Category */}
                  {visibleSlots.length === 0 ? (
                    <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                      <p className="text-sm font-semibold text-[#171717]">
                        No slots match the current filter in {activeCategory.name}.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSlotStatusFilter('all');
                          setSlotSearch('');
                        }}
                        className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-[#FF5A1F] rounded-lg cursor-pointer"
                      >
                        Reset Slot Filter
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {visibleSlots.map((slot) => {
                        const isPublished = slot.status === 'published' && Boolean(slot.videoUrl);
                        const isSlotHidden = Boolean(slot.hidden);
                        const draft = slotDrafts[slot.id] || {
                          title: slot.title,
                          archiveTag: slot.archiveTag,
                          location: slot.location || '',
                        };
                        const isDirty = Boolean(slotDrafts[slot.id]);
                        const isUploadingThis = uploadState?.slotId === slot.id;
                        const isHighlighted = highlightedSlotId === slot.id;

                        return (
                          <div
                            key={slot.id}
                            data-testid={`admin-slot-${slot.id}`}
                            className={`bg-white rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                              isHighlighted
                                ? 'border-[#FF5A1F] ring-2 ring-[#FF5A1F]/20'
                                : isSlotHidden
                                  ? 'border-neutral-300 opacity-75'
                                  : 'border-neutral-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F3F3F3] text-[#171717] tabular-nums">
                                  #{String(slot.slotNumber).padStart(2, '0')}
                                </span>
                                <span
                                  className={`text-xs font-semibold ${
                                    isPublished ? 'text-emerald-700' : 'text-neutral-500'
                                  }`}
                                >
                                  {isPublished
                                    ? `Published · ${formatBytes(slot.fileSizeBytes)}`
                                    : 'Awaiting footage'}
                                </span>
                                {isSlotHidden && (
                                  <span className="text-xs font-semibold text-neutral-500">
                                    · Hidden from public
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {slot.driveWebViewLink && (
                                  <a
                                    href={slot.driveWebViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:underline"
                                  >
                                    Drive
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  disabled={visibilityBusyKey === `slot-${slot.id}`}
                                  data-testid={`toggle-slot-visibility-${slot.id}`}
                                  onClick={() => void handleToggleSlotVisibility(slot)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 ${
                                    isSlotHidden
                                      ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {isSlotHidden ? (
                                    <EyeOff className="w-3 h-3" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                  {isSlotHidden ? 'Hidden' : 'Visible'}
                                </button>
                              </div>
                            </div>

                            {/* Editable Slot Title / Tag / Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <input
                                type="text"
                                value={draft.title}
                                onChange={(e) =>
                                  setSlotDrafts((prev) => ({
                                    ...prev,
                                    [slot.id]: { ...draft, title: e.target.value },
                                  }))
                                }
                                aria-label={`Slot ${slot.slotNumber} title`}
                                className="sm:col-span-6 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                                placeholder="Video title"
                              />
                              <input
                                type="text"
                                value={draft.archiveTag}
                                onChange={(e) =>
                                  setSlotDrafts((prev) => ({
                                    ...prev,
                                    [slot.id]: { ...draft, archiveTag: e.target.value },
                                  }))
                                }
                                aria-label={`Slot ${slot.slotNumber} archive tag`}
                                className="sm:col-span-3 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                                placeholder="Archive tag"
                              />
                              <input
                                type="text"
                                value={draft.location}
                                onChange={(e) =>
                                  setSlotDrafts((prev) => ({
                                    ...prev,
                                    [slot.id]: { ...draft, location: e.target.value },
                                  }))
                                }
                                aria-label={`Slot ${slot.slotNumber} location`}
                                className="sm:col-span-3 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FF5A1F]"
                                placeholder="Location"
                              />
                            </div>

                            {/* Inline Video Thumbnail / Live Preview Player */}
                            {isPublished && slot.videoUrl && previewSlotId === slot.id ? (
                              <video
                                key={slot.videoUrl}
                                src={resolveMediaUrl(slot.videoUrl) || slot.videoUrl}
                                poster={resolveMediaUrl(slot.posterUrl) || slot.posterUrl || undefined}
                                controls
                                autoPlay
                                playsInline
                                preload="auto"
                                className="w-full max-h-72 rounded-xl bg-black object-contain"
                              />
                            ) : isPublished && slot.posterUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewSlotId(slot.id)}
                                className="group relative w-full h-36 rounded-xl overflow-hidden bg-black border border-neutral-200 flex items-center justify-center cursor-pointer"
                              >
                                <img
                                  src={slot.posterUrl}
                                  alt={`Preview thumbnail for ${slot.title}`}
                                  className="w-full h-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300"
                                />
                                <span className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                                  <span className="w-10 h-10 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center shadow-lg">
                                    <Play className="w-4 h-4 fill-white ml-0.5" />
                                  </span>
                                </span>
                              </button>
                            ) : null}

                            {/* Slot Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <label
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                  isUploadingThis
                                    ? 'bg-neutral-300 text-neutral-600 pointer-events-none'
                                    : 'bg-[#FF5A1F] hover:bg-[#E04810] text-white'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {isPublished ? 'Replace Video' : 'Upload Video'}
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime,video/*"
                                  data-testid={`upload-input-${slot.id}`}
                                  className="hidden"
                                  disabled={Boolean(uploadState)}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    if (file) {
                                      void handleChunkedVideoUpload(slot, file);
                                    }
                                  }}
                                />
                              </label>

                              {isDirty && (
                                <button
                                  type="button"
                                  onClick={() => void handleSaveSlotMetadata(slot)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#171717] hover:bg-neutral-800 text-white rounded-lg cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save Name
                                </button>
                              )}

                              {isPublished && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewSlotId((curr) => (curr === slot.id ? null : slot.id))
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#F3F3F3] hover:bg-neutral-200 text-[#171717] rounded-lg cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    {previewSlotId === slot.id ? 'Hide Player' : 'Preview'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => requestBackupVideoToDrive(slot)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#F3F3F3] hover:bg-neutral-200 text-[#171717] rounded-lg cursor-pointer"
                                  >
                                    <CloudUpload className="w-3.5 h-3.5 text-[#FF5A1F]" />
                                    Backup to Drive
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => requestDeleteSlotVideo(slot)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer ml-auto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CATEGORY-WISE PRICES & CATALOG VISIBILITY */}
              {activeTab === 'pricing' && (
                <AdminCatalogPricingPanel
                  currencyDraft={currencyDraft}
                  onChangeCurrency={setCurrencyDraft}
                  djPackagesDraft={packagesDraft}
                  onChangeDjPackages={setPackagesDraft}
                  servicesDraft={servicesDraft}
                  onChangeServices={setServicesDraft}
                  studioDraft={studioDraft}
                  onChangeStudio={setStudioDraft}
                  academyDraft={academyDraft}
                  onChangeAcademy={setAcademyDraft}
                  saving={savingPrices}
                  onSaveAll={() => void handleSaveAllCatalogPrices()}
                />
              )}

              {/* TAB 3: MASTER CATEGORY & SECTION VISIBILITY */}
              {activeTab === 'visibility' && (
                <AdminVisibilityPanel
                  siteData={siteData}
                  busyKey={visibilityBusyKey}
                  onToggleSection={(key, nextVisible) =>
                    void handleToggleSectionVisibility(key, nextVisible)
                  }
                  onTogglePortfolioCategory={(cat, nextHidden) =>
                    void handleTogglePortfolioCategory(cat, nextHidden)
                  }
                  onBulkPortfolioCategory={(categoryId, slotAction) =>
                    void handleBulkCategorySlots(categoryId, slotAction)
                  }
                  onJumpToCategory={(categoryId) => {
                    setSelectedCategoryId(categoryId);
                    setActiveTab('portfolio');
                  }}
                />
              )}

              {/* TAB 3: GOOGLE WORKSPACE (DRIVE, SHEETS, CALENDAR, GMAIL) */}
              {activeTab === 'workspace' && (
                <div className="space-y-5">
                  <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#171717]">
                        Google Workspace Operations
                      </h3>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        {workspaceToken
                          ? `Connected as ${workspaceEmail || 'Google Account'} (Drive, Sheets, Calendar & Gmail active in session memory).`
                          : 'Sign in with Google to backup videos to Google Drive, export live rate cards to Sheets, schedule bookings in Calendar, or email confirmations via Gmail.'}
                      </p>
                    </div>

                    {!workspaceToken ? (
                      <GoogleGsiButton
                        label={workspaceBusy ? 'Connecting...' : 'Sign in with Google'}
                        disabled={workspaceBusy}
                        onClick={handleConnectWorkspaceOnly}
                      />
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                        <Check className="w-4 h-4" />
                        Workspace Connected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Google Sheets + Drive Backups */}
                    <div className="space-y-5">
                      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Table2 className="w-5 h-5 text-emerald-700" />
                          <h4 className="font-display font-bold text-[#171717]">
                            Google Sheets Rate Card &amp; Inventory Export
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-600">
                          Generate a formatted Google Sheet containing your live DJ Package prices
                          and 70-slot portfolio status.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={!workspaceToken}
                            onClick={requestCreateRateCardSheet}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-[#FF5A1F] rounded-lg transition-colors cursor-pointer disabled:opacity-45"
                          >
                            <Table2 className="w-4 h-4" />
                            Export to Google Sheets
                          </button>
                          {createdSheetUrl && (
                            <a
                              href={createdSheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5A1F] hover:underline"
                            >
                              Open Sheet
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CloudUpload className="w-5 h-5 text-blue-600" />
                            <h4 className="font-display font-bold text-[#171717]">
                              Google Drive Video Backups
                            </h4>
                          </div>
                          <button
                            type="button"
                            disabled={!workspaceToken || driveLoading}
                            onClick={() => void handleListDriveBackups()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F3F3F3] hover:bg-neutral-200 text-[#171717] rounded-lg cursor-pointer disabled:opacity-45"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${driveLoading ? 'animate-spin' : ''}`} />
                            Refresh List
                          </button>
                        </div>

                        {driveFiles.length === 0 ? (
                          <p className="text-xs text-neutral-500">
                            No Drive video backups listed yet. Use &ldquo;Backup to Drive&rdquo; on any
                            published portfolio video in Tab 1 or click Refresh List.
                          </p>
                        ) : (
                          <ul className="divide-y divide-neutral-200 text-xs">
                            {driveFiles.map((file) => (
                              <li key={file.id} className="py-2.5 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-[#171717] truncate">{file.name}</p>
                                  {file.size && (
                                    <p className="text-neutral-500">{formatBytes(Number(file.size))}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {file.webViewLink && (
                                    <a
                                      href={file.webViewLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-700 hover:underline font-medium"
                                    >
                                      View
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => requestDeleteDriveFile(file)}
                                    className="text-red-600 hover:text-red-800 cursor-pointer"
                                    aria-label={`Delete ${file.name} from Drive`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Google Calendar + Gmail */}
                    <div className="space-y-5">
                      <form
                        onSubmit={requestScheduleCalendarEvent}
                        className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#FF5A1F]" />
                          <h4 className="font-display font-bold text-[#171717]">
                            Schedule Event on Google Calendar
                          </h4>
                        </div>
                        <input
                          type="text"
                          value={calTitle}
                          onChange={(e) => setCalTitle(e.target.value)}
                          placeholder="Event title"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="date"
                            value={calDate}
                            onChange={(e) => setCalDate(e.target.value)}
                            className="px-2.5 py-2 text-xs rounded-lg border border-neutral-300"
                          />
                          <input
                            type="time"
                            value={calStartTime}
                            onChange={(e) => setCalStartTime(e.target.value)}
                            className="px-2.5 py-2 text-xs rounded-lg border border-neutral-300"
                          />
                          <input
                            type="time"
                            value={calEndTime}
                            onChange={(e) => setCalEndTime(e.target.value)}
                            className="px-2.5 py-2 text-xs rounded-lg border border-neutral-300"
                          />
                        </div>
                        <input
                          type="text"
                          value={calLocation}
                          onChange={(e) => setCalLocation(e.target.value)}
                          placeholder="Venue address"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300"
                        />
                        <textarea
                          rows={2}
                          value={calNotes}
                          onChange={(e) => setCalNotes(e.target.value)}
                          placeholder="Crew & rig notes"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="submit"
                            disabled={!workspaceToken}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-[#FF5A1F] rounded-lg cursor-pointer disabled:opacity-45"
                          >
                            <Calendar className="w-4 h-4" />
                            Add to Calendar
                          </button>
                          {createdEventLink && (
                            <a
                              href={createdEventLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5A1F] hover:underline"
                            >
                              View Event
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </form>

                      <form
                        onSubmit={requestSendGmailConfirmation}
                        className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-red-600" />
                          <h4 className="font-display font-bold text-[#171717]">
                            Send Booking Confirmation via Gmail
                          </h4>
                        </div>
                        <input
                          type="email"
                          value={mailTo}
                          onChange={(e) => setMailTo(e.target.value)}
                          placeholder="Client email address"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300"
                        />
                        <input
                          type="text"
                          value={mailSubject}
                          onChange={(e) => setMailSubject(e.target.value)}
                          placeholder="Subject"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300"
                        />
                        <textarea
                          rows={3}
                          value={mailBody}
                          onChange={(e) => setMailBody(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300"
                        />
                        <button
                          type="submit"
                          disabled={!workspaceToken}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg cursor-pointer disabled:opacity-45"
                        >
                          <Mail className="w-4 h-4" />
                          Send Confirmation Email
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
  );

  const confirmationDialog = pendingConfirm && (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
      onClick={() => !confirmBusy && setPendingConfirm(null)}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              pendingConfirm.destructive ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#FF5A1F]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[#171717]">
              {pendingConfirm.title}
            </h3>
            <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">
              {pendingConfirm.description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={confirmBusy}
            onClick={() => setPendingConfirm(null)}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirmBusy}
            onClick={() => void executeConfirmedAction()}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer ${
              pendingConfirm.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#FF5A1F] hover:bg-[#E04810]'
            }`}
          >
            {confirmBusy && <Loader2 className="w-4 h-4 animate-spin" />}
            {pendingConfirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div data-testid="admin-page" className="min-h-screen bg-[#F3F3F3] text-[#171717] flex flex-col">
        {modalOrPageBody}
        {confirmationDialog}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-portal-heading"
      data-testid="admin-portal-modal"
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      {modalOrPageBody}
      {confirmationDialog}
    </div>
  );
}
