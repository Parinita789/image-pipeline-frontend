# Image Pipeline Frontend

Frontend for [image-pipeline](https://github.com/yourusername/image-pipeline) — an image processing platform with presigned S3 uploads, real-time compression, pixel-level transforms (grayscale, sepia, blur, sharpen, invert), and per-user storage quotas.

> This frontend was written by Claude (Anthropic) as a companion to the Go backend, purely to provide a visual interface for testing and using the API.

## Features

- **Upload** — Drag-and-drop or file picker, presigned S3 upload with progress bars, batch support (up to 30 files)
- **Grid & List views** — Toggle between card grid and table row layouts, Google Drive-style
- **Image preview** — Full-screen lightbox with arrow key navigation, toggle between edited/original versions
- **Transforms** — Apply grayscale, sepia, blur, sharpen, invert effects to existing images via a selection panel
- **Batch operations** — Multi-select with checkboxes, bulk delete with confirmation
- **Search & filter** — Search by filename, filter by status (processing/ready)
- **Storage quota** — Displays used/total storage in the sidebar
- **Auth** — Login/register with JWT, auto-redirect on 401

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React 19 |
| Language | TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Data fetching | TanStack React Query 5 |
| HTTP | Axios |
| Routing | React Router 7 |
| State (auth) | Zustand |
| File uploads | react-dropzone |

## Project Structure

```
src/
  api/
    axios.ts          # Axios instance with JWT interceptor
    auth.ts           # Login/register API calls
    images.ts         # Image CRUD, upload, transform, storage APIs
  components/
    DeleteConfirmModal.tsx
    ImageCard.tsx      # Grid view card with hover actions
    ImageRow.tsx       # List view row
    ImagePreview.tsx   # Full-screen lightbox
    Navbar.tsx         # Top bar with search
    ProtectedRoute.tsx # Auth guard
    Sidebar.tsx        # Navigation + storage info
    TransformPanel.tsx # Effect selection modal
    UploadModal.tsx    # Drag-and-drop upload dialog
  hooks/
    useImages.ts      # Paginated image query with auto-poll
    useDeleteImage.ts # Delete mutation
    useStorage.ts     # Storage quota query
  pages/
    Dashboard.tsx     # Main page with grid/list, selection, pagination
    Login.tsx
    Register.tsx
  store/
    authStore.ts      # Zustand store for JWT token
  types/
    index.ts          # Image, User, StorageInfo, APIResponse types
```

## Setup

```bash
# Install dependencies
npm install

# Start dev server (proxies /api to localhost:8080)
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies all `/api/*` requests to the Go backend at `http://localhost:8080`.

### Prerequisites

- Node.js 18+
- The [image-pipeline](https://github.com/yourusername/image-pipeline) backend running on port 8080

## API Proxy

All API calls go through `/api` which Vite proxies to the backend:

```
Frontend: POST /api/images/prepare
  -> Backend: POST http://localhost:8080/images/prepare
```

Configured in `vite.config.ts`. For production, set up a reverse proxy (nginx, CloudFront, etc.) to route `/api` to the backend.
