# ss-audios-2

Modern web application for **SS Audios** (Erode, Tamil Nadu) — event production, DJ packages, live orchestration, lighting, Raga Studio recording, and Sampoorna Music Academy.

Connected to live backend: `https://ss-audios-backend.onrender.com`

## Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Animations & 3D**: Motion + Three.js
- **Icons**: Lucide React
- **Cloud Backend**: Node.js + Express on Render with AWS S3 & DynamoDB

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create or verify `.env`:
   ```env
   VITE_API_BASE_URL="https://ss-audios-backend.onrender.com"
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```
