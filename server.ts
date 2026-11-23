import 'dotenv/config';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  ACADEMY_COURSES,
  BUSINESS_CONTACT,
  DEFAULT_DJ_PACKAGES,
  MAX_VIDEO_FILE_BYTES,
  RAGA_STUDIO_SERVICES,
  SIGNATURE_SERVICES,
  STORAGE_QUOTA_BYTES,
  computeStorageStats,
  createDefaultPortfolioCategories,
  createDefaultSectionVisibility,
  formatPrice,
  type AcademyCourse,
  type CurrencyCode,
  type DjPackage,
  type PortfolioCategory,
  type RagaStudioService,
  type SectionVisibility,
  type SignatureService,
} from './src/lib/domain';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.ss_audios_data');
const VIDEOS_DIR = path.resolve(DATA_DIR, 'videos');
const TMP_UPLOADS_DIR = path.resolve(DATA_DIR, 'tmp_uploads');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const OWNER_EMAIL = 'connectjawa@gmail.com';

for (const dir of [DATA_DIR, VIDEOS_DIR, TMP_UPLOADS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

interface AdminCredential {
  salt: string;
  hash: string;
  createdAt: string;
}

interface PersistedStore {
  currency: CurrencyCode;
  djPackages: DjPackage[];
  signatureServices: SignatureService[];
  ragaStudioServices: RagaStudioService[];
  academyCourses: AcademyCourse[];
  sectionVisibility: SectionVisibility;
  portfolioCategories: PortfolioCategory[];
  adminCredential: AdminCredential | null;
  updatedAt: string;
}

interface UploadSession {
  uploadId: string;
  slotId: string;
  fileName: string;
  mimeType: string;
  totalSize: number;
  receivedBytes: number;
  tempPath: string;
  createdAt: number;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const activeUploads = new Map<string, UploadSession>();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function createInitialStore(): PersistedStore {
  return {
    currency: 'INR',
    djPackages: structuredClone(DEFAULT_DJ_PACKAGES),
    signatureServices: structuredClone(SIGNATURE_SERVICES),
    ragaStudioServices: structuredClone(RAGA_STUDIO_SERVICES),
    academyCourses: structuredClone(ACADEMY_COURSES),
    sectionVisibility: createDefaultSectionVisibility(),
    portfolioCategories: createDefaultPortfolioCategories(),
    adminCredential: null,
    updatedAt: new Date().toISOString(),
  };
}

function loadStore(): PersistedStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedStore>;
      if (
        Array.isArray(parsed.djPackages) &&
        parsed.djPackages.length === 5 &&
        Array.isArray(parsed.portfolioCategories) &&
        parsed.portfolioCategories.length === 7
      ) {
        const defaultSections = createDefaultSectionVisibility();
        const incomingVis = parsed.sectionVisibility;
        return {
          currency: parsed.currency === 'USD' ? 'USD' : 'INR',
          djPackages: parsed.djPackages.map((p) => ({ ...p, hidden: Boolean(p.hidden) })),
          signatureServices:
            Array.isArray(parsed.signatureServices) && parsed.signatureServices.length === SIGNATURE_SERVICES.length
              ? parsed.signatureServices.map((s) => ({ ...s, hidden: Boolean(s.hidden) }))
              : structuredClone(SIGNATURE_SERVICES),
          ragaStudioServices:
            Array.isArray(parsed.ragaStudioServices) && parsed.ragaStudioServices.length === RAGA_STUDIO_SERVICES.length
              ? parsed.ragaStudioServices.map((s) => ({ ...s, hidden: Boolean(s.hidden) }))
              : structuredClone(RAGA_STUDIO_SERVICES),
          academyCourses:
            Array.isArray(parsed.academyCourses) && parsed.academyCourses.length === ACADEMY_COURSES.length
              ? parsed.academyCourses.map((c) => ({ ...c, hidden: Boolean(c.hidden) }))
              : structuredClone(ACADEMY_COURSES),
          sectionVisibility: {
            services: typeof incomingVis?.services === 'boolean' ? incomingVis.services : defaultSections.services,
            portfolio: typeof incomingVis?.portfolio === 'boolean' ? incomingVis.portfolio : defaultSections.portfolio,
            djPackages: typeof incomingVis?.djPackages === 'boolean' ? incomingVis.djPackages : defaultSections.djPackages,
            ragaStudio: typeof incomingVis?.ragaStudio === 'boolean' ? incomingVis.ragaStudio : defaultSections.ragaStudio,
            sampoornaAcademy:
              typeof incomingVis?.sampoornaAcademy === 'boolean'
                ? incomingVis.sampoornaAcademy
                : defaultSections.sampoornaAcademy,
          },
          portfolioCategories: parsed.portfolioCategories.map((cat) => ({
            ...cat,
            hidden: Boolean(cat.hidden),
            slots: Array.isArray(cat.slots)
              ? cat.slots.map((slot) => ({ ...slot, hidden: Boolean(slot.hidden) }))
              : [],
          })),
          adminCredential: parsed.adminCredential ?? null,
          updatedAt: parsed.updatedAt ?? new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('Could not load persisted SS Audios store, creating fresh defaults:', err);
  }
  const fresh = createInitialStore();
  saveStore(fresh);
  return fresh;
}

function saveStore(store: PersistedStore): void {
  store.updatedAt = new Date().toISOString();
  const tmpFile = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_PATH);
}

let store: PersistedStore = loadStore();

function hashPasscode(passcode: string, salt?: string): { salt: string; hash: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passcode, finalSalt, 64).toString('hex');
  return { salt: finalSalt, hash: derived };
}

function verifyPasscode(passcode: string, cred: AdminCredential): boolean {
  const { hash } = hashPasscode(passcode, cred.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(cred.hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signAdminToken(subject: string): string {
  const payload = JSON.stringify({
    sub: subject,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyAdminToken(token: string): { sub: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  if (!timingSafeStringEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      sub?: string;
      exp?: number;
    };
    if (!parsed.sub || !parsed.exp || Date.now() > parsed.exp) return null;
    return { sub: parsed.sub };
  } catch {
    return null;
  }
}

function sanitizeSafeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

function resolveConfinedPath(baseDir: string, ...segments: string[]): string | null {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, ...segments);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolvedTarget;
}

function findSlot(slotId: string) {
  for (const category of store.portfolioCategories) {
    const slot = category.slots.find((s) => s.id === slotId);
    if (slot) return { category, slot };
  }
  return null;
}

function removeLocalVideoFile(videoUrl: string | null | undefined) {
  if (!videoUrl || !videoUrl.startsWith('/api/media/')) return;
  const parts = videoUrl.replace('/api/media/', '').split('/');
  if (parts.length !== 2) return;
  const safeSlot = sanitizeSafeSegment(parts[0]);
  const safeFile = sanitizeSafeSegment(parts[1]);
  const target = resolveConfinedPath(VIDEOS_DIR, safeSlot, safeFile);
  if (target && fs.existsSync(target)) {
    try {
      fs.unlinkSync(target);
    } catch {
      // ignore cleanup error
    }
  }
}

const execFileAsync = promisify(execFile);

interface ProbedStream {
  codec_type?: string;
  codec_name?: string;
  pix_fmt?: string;
}

async function probeVideoStreams(filePath: string): Promise<ProbedStream[]> {
  try {
    const { stdout } = await execFileAsync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'stream=codec_type,codec_name,pix_fmt',
        '-of',
        'json',
        filePath,
      ],
      { timeout: 15000, maxBuffer: 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout) as { streams?: ProbedStream[] };
    return Array.isArray(parsed.streams) ? parsed.streams : [];
  } catch {
    return [];
  }
}

function needsWebTranscode(filePath: string, streams: ProbedStream[]): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mov') return true;
  const videoStream = streams.find((s) => s.codec_type === 'video');
  if (!videoStream) return false;
  const codec = (videoStream.codec_name || '').toLowerCase();
  const pixFmt = (videoStream.pix_fmt || '').toLowerCase();
  // HEVC/H.265 (hvc1/hev1) and 10-bit phone recordings fail in standard Chromium/Firefox players
  if (codec !== 'h264' && codec !== 'vp8' && codec !== 'vp9') return true;
  if (codec === 'h264' && pixFmt && pixFmt !== 'yuv420p') return true;
  const audioStream = streams.find((s) => s.codec_type === 'audio');
  if (audioStream) {
    const aCodec = (audioStream.codec_name || '').toLowerCase();
    if (aCodec && !['aac', 'mp3', 'opus', 'vorbis'].includes(aCodec)) return true;
  }
  return false;
}

async function generateVideoPoster(
  slotDir: string,
  safeSlot: string,
  videoFilePath: string,
  baseName: string,
): Promise<string | null> {
  const posterFileName = sanitizeSafeSegment(`${baseName.slice(0, 72)}_poster.jpg`);
  const posterPath = resolveConfinedPath(slotDir, posterFileName);
  if (!posterPath) return null;

  // Try seeking 1.2s in for a meaningful frame; fall back to frame 0 for ultra-short clips
  for (const seekTime of ['00:00:01.2', '00:00:00.1']) {
    try {
      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-ss',
          seekTime,
          '-i',
          videoFilePath,
          '-vframes',
          '1',
          '-vf',
          'scale=720:-2',
          '-q:v',
          '3',
          posterPath,
        ],
        { timeout: 30000, maxBuffer: 4 * 1024 * 1024 },
      );
      if (fs.existsSync(posterPath) && fs.statSync(posterPath).size > 0) {
        return `/api/media/${safeSlot}/${posterFileName}`;
      }
    } catch {
      // try fallback seek time
    }
  }
  return null;
}

async function ensureWebPlayableVideo(
  slotDir: string,
  safeSlot: string,
  currentFileName: string,
): Promise<{
  videoUrl: string;
  posterUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  transcoded: boolean;
}> {
  const inputPath = resolveConfinedPath(slotDir, currentFileName);
  if (!inputPath || !fs.existsSync(inputPath)) {
    throw new Error('Uploaded video file missing on disk.');
  }

  let activeFileName = currentFileName;
  let activePath = inputPath;
  let mimeType = path.extname(activeFileName).toLowerCase() === '.webm' ? 'video/webm' : 'video/mp4';
  let transcoded = false;

  const streams = await probeVideoStreams(inputPath);
  if (needsWebTranscode(inputPath, streams)) {
    const stem = sanitizeSafeSegment(path.parse(currentFileName).name).slice(0, 72);
    const outFileName = sanitizeSafeSegment(`${stem}_h264.mp4`);
    const outPath = resolveConfinedPath(slotDir, outFileName);
    if (outPath) {
      try {
        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-i',
            inputPath,
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '23',
            '-pix_fmt',
            'yuv420p',
            '-vf',
            'scale=min(1080\\,iw):-2',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            '-movflags',
            '+faststart',
            outPath,
          ],
          { timeout: 240000, maxBuffer: 8 * 1024 * 1024 },
        );
        if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
          try {
            if (outPath !== inputPath) fs.unlinkSync(inputPath);
          } catch {
            // ignore old file removal failure
          }
          activeFileName = outFileName;
          activePath = outPath;
          mimeType = 'video/mp4';
          transcoded = true;
        }
      } catch (err) {
        console.warn('Video web transcoding skipped/failed, keeping original file:', err);
      }
    }
  }

  const baseStem = sanitizeSafeSegment(path.parse(activeFileName).name);
  const posterUrl = await generateVideoPoster(slotDir, safeSlot, activePath, baseStem);
  const finalStat = fs.statSync(activePath);

  return {
    videoUrl: `/api/media/${safeSlot}/${activeFileName}`,
    posterUrl,
    mimeType,
    fileSizeBytes: finalStat.size,
    transcoded,
  };
}

async function migrateExistingVideosForWeb() {
  let changed = false;
  for (const cat of store.portfolioCategories) {
    for (const slot of cat.slots) {
      if (slot.status !== 'published' || !slot.videoUrl || !slot.videoUrl.startsWith('/api/media/')) {
        continue;
      }
      const parts = slot.videoUrl.replace('/api/media/', '').split('/');
      if (parts.length !== 2) continue;
      const safeSlot = sanitizeSafeSegment(parts[0]);
      const safeFile = sanitizeSafeSegment(parts[1]);
      const slotDir = resolveConfinedPath(VIDEOS_DIR, safeSlot);
      const filePath = slotDir ? resolveConfinedPath(slotDir, safeFile) : null;
      if (!slotDir || !filePath || !fs.existsSync(filePath)) continue;

      const streams = await probeVideoStreams(filePath);
      const missingPoster = !slot.posterUrl;
      const incompatibleCodec = needsWebTranscode(filePath, streams);
      if (!missingPoster && !incompatibleCodec) continue;

      try {
        console.log(`Optimizing existing video in ${slot.id} for universal browser playback...`);
        const normalized = await ensureWebPlayableVideo(slotDir, safeSlot, safeFile);
        slot.videoUrl = normalized.videoUrl;
        slot.posterUrl = normalized.posterUrl;
        slot.mimeType = normalized.mimeType;
        slot.fileSizeBytes = normalized.fileSizeBytes;
        slot.updatedAt = new Date().toISOString();
        changed = true;
        console.log(`Optimized ${slot.id} -> ${slot.videoUrl} (poster: ${slot.posterUrl})`);
      } catch (err) {
        console.warn(`Could not optimize existing video for ${slot.id}:`, err);
      }
    }
  }
  if (changed) {
    saveStore(store);
  }
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const verified = verifyAdminToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired admin session.' });
    return;
  }
  next();
}

function buildPublicPayload() {
  return {
    currency: store.currency,
    djPackages: store.djPackages,
    signatureServices: store.signatureServices,
    ragaStudioServices: store.ragaStudioServices,
    academyCourses: store.academyCourses,
    sectionVisibility: store.sectionVisibility,
    portfolioCategories: store.portfolioCategories,
    storageStats: computeStorageStats(store.portfolioCategories, STORAGE_QUOTA_BYTES, MAX_VIDEO_FILE_BYTES),
    updatedAt: store.updatedAt,
  };
}

function parseGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return {
      status: 403,
      message: 'Please check your GEMINI_API_KEY in AI Studio Settings > Secrets.',
    };
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return {
      status: 429,
      message: 'API quota reached. Please verify your billing-enabled API key in Settings > Secrets.',
    };
  }
  return { status: 500, message: msg || 'AI service encountered an error.' };
}

async function startServer() {
  const app = express();

  // Raw binary body parser exclusively for chunked video uploads (up to 16 MB per chunk)
  app.use('/api/admin/uploads/:uploadId/chunk', express.raw({ type: 'application/octet-stream', limit: '16mb' }));
  app.use(express.json({ limit: '25mb' }));

  // Public site data
  app.get('/api/site-data', (_req, res) => {
    res.json(buildPublicPayload());
  });

  // Video streaming with HTTP Range support (206 Partial Content)
  app.get('/api/media/:slotId/:filename', (req, res) => {
    const safeSlot = sanitizeSafeSegment(req.params.slotId);
    const safeFile = sanitizeSafeSegment(req.params.filename);
    const filePath = resolveConfinedPath(VIDEOS_DIR, safeSlot, safeFile);

    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Media file not found.' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : ext === '.webm'
              ? 'video/webm'
              : ext === '.mov'
                ? 'video/quicktime'
                : ext === '.ogg'
                  ? 'video/ogg'
                  : 'video/mp4';

    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }
      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const end = match[2] ? Math.min(Number.parseInt(match[2], 10), fileSize - 1) : fileSize - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Admin auth status
  app.get('/api/admin/auth/status', (_req, res) => {
    const hasEnvPasscode = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length >= 4);
    const needsFirstRunClaim = !hasEnvPasscode && !store.adminCredential;
    res.json({
      needsFirstRunClaim,
      hasEnvPasscode,
      ownerEmailHint: OWNER_EMAIL,
    });
  });

  // Atomic one-time first-run admin setup claim (only works when ADMIN_PASSCODE env is unset and no credential exists)
  app.post('/api/admin/auth/claim', (req, res) => {
    const hasEnvPasscode = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length >= 4);
    if (hasEnvPasscode || store.adminCredential) {
      res.status(409).json({ error: 'Admin passcode is already configured.' });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 6) {
      res.status(400).json({ error: 'Choose an admin passcode of at least 6 characters.' });
      return;
    }
    const { salt, hash } = hashPasscode(passcode);
    store.adminCredential = { salt, hash, createdAt: new Date().toISOString() };
    saveStore(store);
    res.json({ token: signAdminToken('admin-passcode'), role: 'admin' });
  });

  // Admin passcode login
  app.post('/api/admin/auth/login', (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode) {
      res.status(400).json({ error: 'Passcode is required.' });
      return;
    }
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode && envPasscode.length >= 4) {
      if (!timingSafeStringEqual(passcode, envPasscode)) {
        res.status(401).json({ error: 'Incorrect admin passcode.' });
        return;
      }
      res.json({ token: signAdminToken('admin-env'), role: 'admin' });
      return;
    }
    if (!store.adminCredential) {
      res.status(400).json({ error: 'Please complete first-run admin setup first.' });
      return;
    }
    if (!verifyPasscode(passcode, store.adminCredential)) {
      res.status(401).json({ error: 'Incorrect admin passcode.' });
      return;
    }
    res.json({ token: signAdminToken('admin-passcode'), role: 'admin' });
  });

  // Admin Google OAuth verification (verifies Google access token via Google userinfo endpoint)
  app.post('/api/admin/auth/google', async (req, res) => {
    const accessToken = typeof req.body?.accessToken === 'string' ? req.body.accessToken.trim() : '';
    if (!accessToken) {
      res.status(400).json({ error: 'Google access token is required.' });
      return;
    }
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!infoRes.ok) {
        res.status(401).json({ error: 'Could not verify Google account session.' });
        return;
      }
      const profile = (await infoRes.json()) as { email?: string; email_verified?: boolean; name?: string };
      if (!profile.email || !profile.email_verified) {
        res.status(403).json({ error: 'Verified Google email required.' });
        return;
      }
      if (profile.email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
        res.status(403).json({
          error: `Signed in as ${profile.email}. Only the site owner (${OWNER_EMAIL}) or passcode holder can administer SS Audios.`,
        });
        return;
      }
      res.json({
        token: signAdminToken(profile.email),
        role: 'owner',
        email: profile.email,
        name: profile.name || 'SS Audios Admin',
      });
    } catch {
      res.status(502).json({ error: 'Unable to reach Google identity service.' });
    }
  });

  // Update DJ Packages & Currency
  app.put('/api/admin/dj-packages', requireAdminAuth, (req, res) => {
    const currency: CurrencyCode = req.body?.currency === 'USD' ? 'USD' : 'INR';
    const incoming = req.body?.djPackages;
    if (!Array.isArray(incoming) || incoming.length !== 5) {
      res.status(400).json({ error: 'Exactly 5 DJ packages are required.' });
      return;
    }

    const sanitized: DjPackage[] = [];
    for (let i = 0; i < 5; i += 1) {
      const item = incoming[i];
      const base = store.djPackages[i] || DEFAULT_DJ_PACKAGES[i];
      const priceInr = Number(item?.priceInr);
      const priceUsd = Number(item?.priceUsd);
      if (!Number.isFinite(priceInr) || priceInr < 0 || !Number.isFinite(priceUsd) || priceUsd < 0) {
        res.status(400).json({ error: `Invalid price for package "${base.name}".` });
        return;
      }
      const features = Array.isArray(item?.features)
        ? item.features.map((f: unknown) => String(f).trim()).filter(Boolean).slice(0, 12)
        : base.features;

      sanitized.push({
        ...base,
        name: typeof item?.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 48) : base.name,
        priceInr: Math.round(priceInr),
        priceUsd: Math.round(priceUsd),
        tagline: typeof item?.tagline === 'string' && item.tagline.trim() ? item.tagline.trim().slice(0, 120) : base.tagline,
        unitLabel: typeof item?.unitLabel === 'string' && item.unitLabel.trim() ? item.unitLabel.trim().slice(0, 24) : base.unitLabel,
        features: features.length > 0 ? features : base.features,
        hidden: typeof item?.hidden === 'boolean' ? item.hidden : Boolean(base.hidden),
      });
    }

    store.currency = currency;
    store.djPackages = sanitized;
    saveStore(store);
    res.json(buildPublicPayload());
  });

  // Unified Catalog Pricing & Section Visibility Update (DJ Packages, Event Services, Raga Studio, Academy, Sections)
  app.put('/api/admin/catalog', requireAdminAuth, (req, res) => {
    const body = req.body ?? {};

    if (body.currency === 'INR' || body.currency === 'USD') {
      store.currency = body.currency;
    }

    if (Array.isArray(body.djPackages) && body.djPackages.length === 5) {
      const nextDj: DjPackage[] = [];
      for (let i = 0; i < 5; i += 1) {
        const item = body.djPackages[i];
        const base = store.djPackages[i] || DEFAULT_DJ_PACKAGES[i];
        const priceInr = Number(item?.priceInr);
        const priceUsd = Number(item?.priceUsd);
        if (!Number.isFinite(priceInr) || priceInr < 0 || !Number.isFinite(priceUsd) || priceUsd < 0) {
          res.status(400).json({ error: `Invalid price for DJ package "${base.name}".` });
          return;
        }
        const features = Array.isArray(item?.features)
          ? item.features.map((f: unknown) => String(f).trim()).filter(Boolean).slice(0, 12)
          : base.features;
        nextDj.push({
          ...base,
          name: typeof item?.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 48) : base.name,
          priceInr: Math.round(priceInr),
          priceUsd: Math.round(priceUsd),
          tagline: typeof item?.tagline === 'string' && item.tagline.trim() ? item.tagline.trim().slice(0, 120) : base.tagline,
          unitLabel: typeof item?.unitLabel === 'string' && item.unitLabel.trim() ? item.unitLabel.trim().slice(0, 24) : base.unitLabel,
          features: features.length > 0 ? features : base.features,
          hidden: typeof item?.hidden === 'boolean' ? item.hidden : Boolean(base.hidden),
        });
      }
      store.djPackages = nextDj;
    }

    if (Array.isArray(body.signatureServices) && body.signatureServices.length === SIGNATURE_SERVICES.length) {
      const nextServices: SignatureService[] = [];
      for (let i = 0; i < SIGNATURE_SERVICES.length; i += 1) {
        const item = body.signatureServices[i];
        const base = store.signatureServices[i] || SIGNATURE_SERVICES[i];
        const startingPrice = Number(item?.startingPrice);
        if (!Number.isFinite(startingPrice) || startingPrice < 0) {
          res.status(400).json({ error: `Invalid price for service "${base.title}".` });
          return;
        }
        const rounded = Math.round(startingPrice);
        const rawLabel = typeof item?.priceLabel === 'string' ? item.priceLabel.trim().slice(0, 36) : '';
        nextServices.push({
          ...base,
          title: typeof item?.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 64) : base.title,
          startingPrice: rounded,
          priceLabel: rawLabel || formatPrice(rounded, 'INR'),
          summary: typeof item?.summary === 'string' && item.summary.trim() ? item.summary.trim().slice(0, 220) : base.summary,
          hidden: typeof item?.hidden === 'boolean' ? item.hidden : Boolean(base.hidden),
        });
      }
      store.signatureServices = nextServices;
    }

    if (Array.isArray(body.ragaStudioServices) && body.ragaStudioServices.length === RAGA_STUDIO_SERVICES.length) {
      const nextStudio: RagaStudioService[] = [];
      for (let i = 0; i < RAGA_STUDIO_SERVICES.length; i += 1) {
        const item = body.ragaStudioServices[i];
        const base = store.ragaStudioServices[i] || RAGA_STUDIO_SERVICES[i];
        const priceValue = Number(item?.priceValue);
        if (!Number.isFinite(priceValue) || priceValue < 0) {
          res.status(400).json({ error: `Invalid price for studio service "${base.title}".` });
          return;
        }
        const rounded = Math.round(priceValue);
        const unit = typeof item?.unit === 'string' && item.unit.trim() ? item.unit.trim().slice(0, 24) : base.unit;
        const rawLabel = typeof item?.priceLabel === 'string' ? item.priceLabel.trim().slice(0, 36) : '';
        nextStudio.push({
          ...base,
          title: typeof item?.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 64) : base.title,
          priceValue: rounded,
          unit,
          priceLabel: rawLabel || `${formatPrice(rounded, 'INR')}/${unit}`,
          description:
            typeof item?.description === 'string' && item.description.trim()
              ? item.description.trim().slice(0, 260)
              : base.description,
          hidden: typeof item?.hidden === 'boolean' ? item.hidden : Boolean(base.hidden),
        });
      }
      store.ragaStudioServices = nextStudio;
    }

    if (Array.isArray(body.academyCourses) && body.academyCourses.length === ACADEMY_COURSES.length) {
      const nextCourses: AcademyCourse[] = [];
      for (let i = 0; i < ACADEMY_COURSES.length; i += 1) {
        const item = body.academyCourses[i];
        const base = store.academyCourses[i] || ACADEMY_COURSES[i];
        const feeMonthly = Number(item?.feeMonthly);
        if (!Number.isFinite(feeMonthly) || feeMonthly < 0) {
          res.status(400).json({ error: `Invalid fee for course "${base.title}".` });
          return;
        }
        const rounded = Math.round(feeMonthly);
        const rawLabel = typeof item?.feeLabel === 'string' ? item.feeLabel.trim().slice(0, 36) : '';
        nextCourses.push({
          ...base,
          title: typeof item?.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 64) : base.title,
          feeMonthly: rounded,
          feeLabel: rawLabel || `${formatPrice(rounded, 'INR')}/month`,
          duration:
            typeof item?.duration === 'string' && item.duration.trim()
              ? item.duration.trim().slice(0, 40)
              : base.duration,
          description:
            typeof item?.description === 'string' && item.description.trim()
              ? item.description.trim().slice(0, 260)
              : base.description,
          hidden: typeof item?.hidden === 'boolean' ? item.hidden : Boolean(base.hidden),
        });
      }
      store.academyCourses = nextCourses;
    }

    if (body.sectionVisibility && typeof body.sectionVisibility === 'object') {
      const v = body.sectionVisibility as Partial<SectionVisibility>;
      store.sectionVisibility = {
        services: typeof v.services === 'boolean' ? v.services : store.sectionVisibility.services,
        portfolio: typeof v.portfolio === 'boolean' ? v.portfolio : store.sectionVisibility.portfolio,
        djPackages: typeof v.djPackages === 'boolean' ? v.djPackages : store.sectionVisibility.djPackages,
        ragaStudio: typeof v.ragaStudio === 'boolean' ? v.ragaStudio : store.sectionVisibility.ragaStudio,
        sampoornaAcademy:
          typeof v.sampoornaAcademy === 'boolean' ? v.sampoornaAcademy : store.sectionVisibility.sampoornaAcademy,
      };
    }

    saveStore(store);
    res.json(buildPublicPayload());
  });

  // Show/hide an entire portfolio category or apply bulk slot visibility within that category
  app.patch('/api/admin/portfolio-categories/:categoryId', requireAdminAuth, (req, res) => {
    const category = store.portfolioCategories.find((c) => c.id === req.params.categoryId);
    if (!category) {
      res.status(404).json({ error: 'Portfolio category not found.' });
      return;
    }

    if (typeof req.body?.hidden === 'boolean') {
      category.hidden = req.body.hidden;
    }

    const slotAction = req.body?.slotAction;
    if (slotAction === 'hide-empty') {
      for (const slot of category.slots) {
        if (slot.status !== 'published' || !slot.videoUrl) {
          slot.hidden = true;
        }
      }
    } else if (slotAction === 'show-all') {
      category.hidden = false;
      for (const slot of category.slots) {
        slot.hidden = false;
      }
    } else if (slotAction === 'hide-all') {
      for (const slot of category.slots) {
        slot.hidden = true;
      }
    }

    saveStore(store);
    res.json(buildPublicPayload());
  });

  // Rename / update portfolio slot metadata, visibility (hidden), or link Google Drive URL
  app.patch('/api/admin/portfolio/:slotId', requireAdminAuth, (req, res) => {
    const found = findSlot(req.params.slotId);
    if (!found) {
      res.status(404).json({ error: 'Portfolio slot not found.' });
      return;
    }
    const { slot } = found;
    if (typeof req.body?.title === 'string' && req.body.title.trim()) {
      slot.title = req.body.title.trim().slice(0, 120);
    }
    if (typeof req.body?.archiveTag === 'string' && req.body.archiveTag.trim()) {
      slot.archiveTag = req.body.archiveTag.trim().slice(0, 60);
    }
    if (typeof req.body?.location === 'string') {
      slot.location = req.body.location.trim().slice(0, 60);
    }
    if (typeof req.body?.hidden === 'boolean') {
      slot.hidden = req.body.hidden;
    }
    if (typeof req.body?.driveFileId === 'string') {
      slot.driveFileId = req.body.driveFileId.trim() || null;
    }
    if (typeof req.body?.driveWebViewLink === 'string') {
      const link = req.body.driveWebViewLink.trim();
      if (!link || /^https:\/\/drive\.google\.com\//i.test(link)) {
        slot.driveWebViewLink = link || null;
      }
    }
    slot.updatedAt = new Date().toISOString();
    saveStore(store);
    res.json(buildPublicPayload());
  });

  // Remove uploaded video from slot
  app.delete('/api/admin/portfolio/:slotId/video', requireAdminAuth, (req, res) => {
    const found = findSlot(req.params.slotId);
    if (!found) {
      res.status(404).json({ error: 'Portfolio slot not found.' });
      return;
    }
    const { slot } = found;
    removeLocalVideoFile(slot.videoUrl);
    removeLocalVideoFile(slot.posterUrl);
    slot.videoUrl = null;
    slot.posterUrl = null;
    slot.status = 'awaiting';
    slot.mimeType = null;
    slot.fileSizeBytes = 0;
    slot.updatedAt = new Date().toISOString();
    saveStore(store);
    res.json(buildPublicPayload());
  });

  // Resumable chunked video upload: INIT
  app.post('/api/admin/uploads/init', requireAdminAuth, (req, res) => {
    const slotId = typeof req.body?.slotId === 'string' ? req.body.slotId : '';
    const fileName = typeof req.body?.fileName === 'string' ? req.body.fileName : 'video.mp4';
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'video/mp4';
    const totalSize = Number(req.body?.totalSize);

    const found = findSlot(slotId);
    if (!found) {
      res.status(404).json({ error: 'Portfolio slot not found.' });
      return;
    }
    if (!mimeType.startsWith('video/')) {
      res.status(400).json({ error: 'Only video files (MP4, WebM, MOV) are supported.' });
      return;
    }
    if (!Number.isFinite(totalSize) || totalSize <= 0) {
      res.status(400).json({ error: 'Invalid file size.' });
      return;
    }
    if (totalSize > MAX_VIDEO_FILE_BYTES) {
      res.status(413).json({ error: 'Single video exceeds the 3 GiB per-video limit.' });
      return;
    }

    const stats = computeStorageStats(store.portfolioCategories, STORAGE_QUOTA_BYTES, MAX_VIDEO_FILE_BYTES);
    const availableWithReplace = stats.remainingBytes + (found.slot.fileSizeBytes || 0);
    if (totalSize > availableWithReplace) {
      res.status(413).json({
        error: 'Upload exceeds the 5 GiB total video storage quota. Remove or replace an older video first.',
      });
      return;
    }

    const uploadId = crypto.randomUUID();
    const ext = sanitizeSafeSegment(path.extname(fileName).toLowerCase() || '.mp4').slice(0, 10);
    const stem = sanitizeSafeSegment(path.basename(fileName, ext)).slice(0, 64) || 'video';
    const safeFileName = `${Date.now()}_${stem}${ext}`;
    const tempPath = resolveConfinedPath(TMP_UPLOADS_DIR, `${uploadId}.part`);
    if (!tempPath) {
      res.status(400).json({ error: 'Invalid upload path.' });
      return;
    }

    fs.writeFileSync(tempPath, Buffer.alloc(0));
    activeUploads.set(uploadId, {
      uploadId,
      slotId,
      fileName: safeFileName,
      mimeType,
      totalSize,
      receivedBytes: 0,
      tempPath,
      createdAt: Date.now(),
    });

    res.json({ uploadId, chunkSize: 4 * 1024 * 1024 });
  });

  // Resumable chunked video upload: CHUNK
  app.put('/api/admin/uploads/:uploadId/chunk', requireAdminAuth, (req, res) => {
    const session = activeUploads.get(req.params.uploadId);
    if (!session) {
      res.status(404).json({ error: 'Upload session not found or expired.' });
      return;
    }
    const offset = Number(req.headers['x-upload-offset']);
    const chunk = req.body;
    if (!Buffer.isBuffer(chunk) || chunk.length === 0) {
      res.status(400).json({ error: 'Empty chunk payload.' });
      return;
    }
    if (!Number.isFinite(offset) || offset < 0 || offset > session.receivedBytes) {
      res.status(409).json({
        error: 'Chunk offset mismatch.',
        expectedOffset: session.receivedBytes,
      });
      return;
    }

    // Idempotent retry support: if client retries an already-written offset, write at that offset cleanly
    const fd = fs.openSync(session.tempPath, 'r+');
    try {
      fs.writeSync(fd, chunk, 0, chunk.length, offset);
    } finally {
      fs.closeSync(fd);
    }

    session.receivedBytes = Math.max(session.receivedBytes, offset + chunk.length);
    if (session.receivedBytes > MAX_VIDEO_FILE_BYTES) {
      activeUploads.delete(session.uploadId);
      try {
        fs.unlinkSync(session.tempPath);
      } catch {
        // ignore
      }
      res.status(413).json({ error: 'Upload exceeded 3 GiB limit.' });
      return;
    }

    res.json({ receivedBytes: session.receivedBytes, totalSize: session.totalSize });
  });

  // Resumable chunked video upload: COMPLETE (with automatic H.264 browser transcode + poster frame)
  app.post('/api/admin/uploads/:uploadId/complete', requireAdminAuth, async (req, res) => {
    const session = activeUploads.get(req.params.uploadId);
    if (!session) {
      res.status(404).json({ error: 'Upload session not found.' });
      return;
    }
    const found = findSlot(session.slotId);
    if (!found) {
      activeUploads.delete(session.uploadId);
      res.status(404).json({ error: 'Portfolio slot not found.' });
      return;
    }

    const safeSlot = sanitizeSafeSegment(session.slotId);
    const slotDir = resolveConfinedPath(VIDEOS_DIR, safeSlot);
    if (!slotDir) {
      res.status(400).json({ error: 'Invalid slot path.' });
      return;
    }
    fs.mkdirSync(slotDir, { recursive: true });
    const finalPath = resolveConfinedPath(slotDir, session.fileName);
    if (!finalPath) {
      res.status(400).json({ error: 'Invalid destination filename.' });
      return;
    }

    // Remove previous video & poster in this slot before placing the new one
    removeLocalVideoFile(found.slot.videoUrl);
    removeLocalVideoFile(found.slot.posterUrl);
    fs.renameSync(session.tempPath, finalPath);
    activeUploads.delete(session.uploadId);

    try {
      const normalized = await ensureWebPlayableVideo(slotDir, safeSlot, session.fileName);
      found.slot.videoUrl = normalized.videoUrl;
      found.slot.posterUrl = normalized.posterUrl;
      found.slot.status = 'published';
      found.slot.mimeType = normalized.mimeType;
      found.slot.fileSizeBytes = normalized.fileSizeBytes;
      if (typeof req.body?.title === 'string' && req.body.title.trim()) {
        found.slot.title = req.body.title.trim().slice(0, 120);
      }
      found.slot.updatedAt = new Date().toISOString();
      saveStore(store);

      res.json({
        slot: found.slot,
        siteData: buildPublicPayload(),
      });
    } catch (err) {
      const finalStat = fs.existsSync(finalPath) ? fs.statSync(finalPath) : { size: 0 };
      found.slot.videoUrl = `/api/media/${safeSlot}/${session.fileName}`;
      found.slot.posterUrl = null;
      found.slot.status = 'published';
      found.slot.mimeType = session.mimeType;
      found.slot.fileSizeBytes = finalStat.size;
      found.slot.updatedAt = new Date().toISOString();
      saveStore(store);
      console.warn('Upload post-processing fallback:', err);
      res.json({
        slot: found.slot,
        siteData: buildPublicPayload(),
      });
    }
  });

  // =========================================================================
  // SERVER-SIDE GEMINI API ROUTES
  // =========================================================================

  // 1. Low-latency instant advisor (gemini-3.1-flash-lite)
  app.post('/api/ai/quick-advisor', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) {
      res.status(400).json({ error: 'Please enter a question.' });
      return;
    }
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: `You are the fast booking & audio concierge for SS Audios (www.ssaudios.in, Erode, Tamil Nadu, WhatsApp +91 99653 68899).
Offer concise, accurate answers in under 120 words using Indian Rupees (₹):
- Signature Services: ${store.signatureServices.filter((s) => !s.hidden).map((s) => `${s.title} ${s.priceLabel}`).join(', ')}.
- DJ Packages (live configured): ${store.djPackages.filter((p) => !p.hidden).map((p) => `${p.name} ₹${p.priceInr} (${p.durationLabel}, ${p.powerRating})`).join(', ')}.
- Raga Studio: ${store.ragaStudioServices.filter((s) => !s.hidden).map((s) => `${s.title} ${s.priceLabel}`).join(', ')}.
- Sampoorna Music Academy: ${store.academyCourses.filter((c) => !c.hidden).map((c) => `${c.title} ${c.feeLabel}`).join(', ')}.`,
        },
      });
      res.json({ text: response.text || 'No response generated.' });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 2. High-thinking complex event production blueprint (gemini-4-carbon + ThinkingLevel.HIGH, NO maxOutputTokens)
  app.post('/api/ai/event-blueprint', async (req, res) => {
    const eventBrief = typeof req.body?.eventBrief === 'string' ? req.body.eventBrief.trim() : '';
    const guestCount = typeof req.body?.guestCount === 'string' ? req.body.guestCount.trim() : '300';
    const venueType = typeof req.body?.venueType === 'string' ? req.body.venueType.trim() : 'Indoor Marriage Hall';
    if (!eventBrief) {
      res.status(400).json({ error: 'Please describe your event requirements.' });
      return;
    }
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-carbon',
        contents: `Design a detailed, realistic technical audio, lighting, orchestra/DJ cue sheet, and budget breakdown in Indian Rupees (₹) for this SS Audios event brief:
Event Brief: ${eventBrief}
Expected Guests: ${guestCount}
Venue Type: ${venueType}

Include:
1. Recommended SS Audios Services & DJ Package tier (with realistic wattage & speaker placement).
2. Lighting & Visual Rig Blueprint (moving heads, pathway lighting, LED visuals).
3. Hour-by-hour run-of-show audio cue timeline.
4. Estimated investment breakdown in ₹ (INR) referencing SS Audios rates.`,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          systemInstruction:
            'You are the Chief Acoustic & Stage Production Director at SS Audios in Erode, Tamil Nadu. Deliver clear, actionable production plans in clean Markdown.',
        },
      });
      res.json({ text: response.text || 'No blueprint generated.' });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 3. Google Maps Grounding venue & acoustic search (gemini-4-hydrogen + googleMaps tool)
  app.post('/api/ai/venue-grounding', async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    if (!query) {
      res.status(400).json({ error: 'Please enter a venue or location query.' });
      return;
    }
    const latitude = Number.isFinite(lat) ? lat : BUSINESS_CONTACT.erodeCenter.lat;
    const longitude = Number.isFinite(lng) ? lng : BUSINESS_CONTACT.erodeCenter.lng;

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `${query}. Focus on event venues, marriage halls, auditoriums, or SS Audios location details around Erode, Tamil Nadu unless another city is explicitly named. Note acoustic/event suitability where helpful.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude, longitude },
            },
          },
        },
      });

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const places: Array<{ title: string; uri: string; reviewSnippets: string[] }> = [];
      for (const chunk of rawChunks as Array<{
        maps?: {
          title?: string;
          uri?: string;
          placeAnswerSources?: { reviewSnippets?: Array<{ content?: string }> };
        };
      }>) {
        if (chunk.maps?.uri) {
          places.push({
            title: chunk.maps.title || 'View on Google Maps',
            uri: chunk.maps.uri,
            reviewSnippets:
              chunk.maps.placeAnswerSources?.reviewSnippets
                ?.map((r) => r.content)
                .filter((s): s is string => Boolean(s)) ?? [],
          });
        }
      }

      res.json({
        text: response.text || 'No venue details found.',
        places,
      });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 4. Create & edit images (gemini-nano-banana-2.1)
  app.post('/api/ai/image-create-edit', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    const aspectRatio = typeof req.body?.aspectRatio === 'string' ? req.body.aspectRatio : '16:9';
    const imageBase64 = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : null;
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'image/png';

    if (!prompt) {
      res.status(400).json({ error: 'Please provide an image prompt.' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
      if (imageBase64) {
        parts.push({ inlineData: { data: imageBase64, mimeType } });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize: '1K',
          },
        },
      });

      let imageUrl: string | null = null;
      let caption = '';
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${outMime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          caption += part.text;
        }
      }

      if (!imageUrl) {
        res.status(500).json({ error: 'Model did not return an image. Try refining your prompt.' });
        return;
      }
      res.json({ imageUrl, caption });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 5. Generate high-quality images 1K / 2K / 4K (gemini-3-pro-image-preview)
  app.post('/api/ai/image-hq', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    const imageSize = req.body?.imageSize === '2K' || req.body?.imageSize === '4K' ? req.body.imageSize : '1K';
    const aspectRatio = typeof req.body?.aspectRatio === 'string' ? req.body.aspectRatio : '16:9';

    if (!prompt) {
      res.status(400).json({ error: 'Please provide a visual prompt.' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      let imageUrl: string | null = null;
      let caption = '';
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${outMime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          caption += part.text;
        }
      }

      if (!imageUrl) {
        res.status(500).json({ error: 'High-resolution image was not returned.' });
        return;
      }
      res.json({ imageUrl, caption, imageSize });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 6. Animate uploaded photo into video (gemini-omni-1.2-flash via Interactions API)
  app.post('/api/ai/animate-video', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    const imageBase64 = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : 'image/png';
    const aspectRatio: '16:9' | '9:16' = req.body?.aspectRatio === '9:16' ? '9:16' : '16:9';

    if (!imageBase64) {
      res.status(400).json({ error: 'Please upload a photo to animate.' });
      return;
    }
    if (!prompt) {
      res.status(400).json({ error: 'Please enter a motion prompt.' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          input: [
            {
              type: 'image',
              mime_type: mimeType,
              data: imageBase64,
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: aspectRatio,
          },
        } as Parameters<typeof ai.interactions.create>[0],
        { timeout: 300000 },
      );

      const videoPart = (interaction as unknown as { output_video?: { data?: string; mime_type?: string } }).output_video;
      if (!videoPart?.data) {
        res.status(500).json({ error: 'Video animation completed without video bytes.' });
        return;
      }

      const aiDir = resolveConfinedPath(VIDEOS_DIR, 'ai_generated');
      if (!aiDir) {
        res.status(500).json({ error: 'Storage path error.' });
        return;
      }
      fs.mkdirSync(aiDir, { recursive: true });
      const fileName = `promo_${Date.now()}.mp4`;
      const outPath = resolveConfinedPath(aiDir, fileName);
      if (!outPath) {
        res.status(500).json({ error: 'Storage path error.' });
        return;
      }

      const buffer = Buffer.from(videoPart.data, 'base64');
      fs.writeFileSync(outPath, buffer);

      res.json({
        videoUrl: `/api/media/ai_generated/${fileName}`,
        fileSizeBytes: buffer.length,
        aspectRatio,
        mimeType: videoPart.mime_type || 'video/mp4',
      });
    } catch (err) {
      const parsed = parseGeminiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // Assign an AI-generated video directly into a portfolio slot (Admin protected)
  app.post('/api/admin/portfolio/:slotId/assign-ai-video', requireAdminAuth, (req, res) => {
    const found = findSlot(req.params.slotId);
    if (!found) {
      res.status(404).json({ error: 'Portfolio slot not found.' });
      return;
    }
    const sourceUrl = typeof req.body?.videoUrl === 'string' ? req.body.videoUrl : '';
    if (!sourceUrl.startsWith('/api/media/ai_generated/')) {
      res.status(400).json({ error: 'Invalid AI video reference.' });
      return;
    }
    const fileName = sanitizeSafeSegment(sourceUrl.replace('/api/media/ai_generated/', ''));
    const srcPath = resolveConfinedPath(VIDEOS_DIR, 'ai_generated', fileName);
    if (!srcPath || !fs.existsSync(srcPath)) {
      res.status(404).json({ error: 'Generated video file not found.' });
      return;
    }
    const safeSlot = sanitizeSafeSegment(req.params.slotId);
    const destDir = resolveConfinedPath(VIDEOS_DIR, safeSlot);
    if (!destDir) {
      res.status(400).json({ error: 'Invalid destination.' });
      return;
    }
    fs.mkdirSync(destDir, { recursive: true });
    const destPath = resolveConfinedPath(destDir, fileName);
    if (!destPath) {
      res.status(400).json({ error: 'Invalid destination filename.' });
      return;
    }
    removeLocalVideoFile(found.slot.videoUrl);
    fs.copyFileSync(srcPath, destPath);
    const stat = fs.statSync(destPath);
    found.slot.videoUrl = `/api/media/${safeSlot}/${fileName}`;
    found.slot.status = 'published';
    found.slot.mimeType = 'video/mp4';
    found.slot.fileSizeBytes = stat.size;
    found.slot.updatedAt = new Date().toISOString();
    saveStore(store);
    res.json(buildPublicPayload());
  });

  // Mount Vite middleware in dev or serve static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SS Audios full-stack server running on http://localhost:${PORT}`);
    void migrateExistingVideosForWeb();
  });
}

startServer().catch((err) => {
  console.error('Failed to start SS Audios server:', err);
  process.exit(1);
});
