
# Melodii Desktop

Melodii is a production-ready desktop app for music genre classification. It packages the existing Next.js 14 frontend and Django DRF backend into a single native installer using Tauri v2 and a PyInstaller sidecar. No manual ffmpeg installation is required.

## Overview

- Upload audio files and receive top-5 genre predictions.
- Hugging Face model `dima806/music_genres_classification` is active in V1.
- Desktop-friendly UI with native window controls and a startup splash state.

## Architecture (Sidecar Pattern)

- **Frontend**: Next.js 14 (App Router) built to static assets.
- **Backend**: Django DRF, bundled with PyInstaller as a sidecar binary.
- **Desktop Shell**: Tauri v2 (Rust core).
- **Bundling**: ffmpeg + model files are bundled into the installer.

## Project Structure

```
melodii/
├── backend/
│   ├── launcher/
│   │   └── run_backend.py
│   ├── melodii_backend.spec
│   ├── ffmpeg/                # bundled ffmpeg binaries
│   ├── models/                # bundled HF/model cache
│   └── src/                   # Django project
├── frontend/
│   ├── app/
│   ├── lib/
│   └── public/
├── src-tauri/
│   ├── src/main.rs
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
└── README.MD
```

## API

All DRF endpoints remain unchanged. The classifier lives at:

```
POST /api/v1/genre-ai/classify/
```

## Local Development

### Backend (Django)

```
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

### Frontend (Next.js)

```
cd frontend
npm install
npm run dev
```

## Desktop Setup (Tauri v2)

1. Install Rust + Tauri prerequisites.
2. From the repo root, run:

```
cargo install tauri-cli@2
```

3. Build frontend assets:

```
npm --prefix frontend install
npm --prefix frontend run build
```

4. Build the backend sidecar:

```
cd backend
uv run pyinstaller melodii_backend.spec
```

5. Copy the sidecar into Tauri bin:

```
mkdir -p ../src-tauri/bin
cp dist/melodii-backend* ../src-tauri/bin/
```

6. Run the desktop app in dev mode:

```
cd ../src-tauri
tauri dev
```

## Production Build

```
cd frontend
npm run build
cd ../backend
uv run pyinstaller melodii_backend.spec
cd ../src-tauri
tauri build
```

The resulting installers are placed under `src-tauri/target/release/bundle/`.

## ffmpeg and Model Bundling

- Place platform-specific ffmpeg binaries in [backend/ffmpeg](backend/ffmpeg).
- Place Hugging Face model cache files in [backend/models](backend/models).
- Both folders are bundled into the app via `src-tauri/tauri.conf.json`.

## Notes

- Windows is the primary target, but the bundle config supports macOS/Linux as well.
- The backend sidecar automatically selects an available port and prints it for Tauri.
- On app close, the sidecar process is terminated gracefully.
