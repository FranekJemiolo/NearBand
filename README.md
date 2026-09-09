# NearBand 📡

> **Modern, Location-Based Mobile CB Radio Application**  
> Voice-only, strictly ephemeral, geofenced to ~5-mile (8 km) proximity across 40 open channels.

[![CI Status](https://github.com/FranekJemiolo/NearBand/actions/workflows/ci.yml/badge.svg)](https://github.com/FranekJemiolo/NearBand/actions/workflows/ci.yml)
[![Pages Deploy](https://github.com/FranekJemiolo/NearBand/actions/workflows/pages.yml/badge.svg)](https://github.com/FranekJemiolo/NearBand/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

NearBand recreates the analog freedom and democratic tactility of citizen band (CB) radio on modern smartphones. There are no accounts, no profiles, no user lists, and no text messages. All audio transmissions are geofenced to users within your immediate 5-mile (8 km) radius.

```
       [40 Channels]                [5-Mile Geofence]             [Overlapping Audio]
  +----------------------+      +----------------------+      +----------------------+
  | CH 01 .. CH 40       | ---> | Redis GEO Partition  | ---> | LiveKit SFU Forward  |
  | Minimalist Tuner     |      | Radius: 8,046 Meters |      | Simultaneous Collide |
  +----------------------+      +----------------------+      +----------------------+
```

## Features

- **Strict Proximity Radius**: Transmit and receive audio only from users within 5 miles of your real-time coordinates.
- **Minimalist 40-Channel Tuner**: High-contrast list tuner (Channels 1–40). Empty channels stay completely silent.
- **Ephemeral Identity**: Random memorable phonetic handle (e.g., `Rusty Falcon`, `Neon Coyote`) auto-generated on session start.
- **Push-To-Talk (PTT)**: Hold-to-Talk or Tap-to-Talk with a hard 30-second countdown timer.
- **Hardware Volume Buttons**: Volume-up/down triggers PTT directly from the pocket.
- **Audio Overlap ("Stepping On")**: LiveKit SFU configured for open radio band dynamics where simultaneous transmissions collide naturally.
- **Voice Activity Detection (VAD)**: Drops transmission during prolonged dead-air silence.
- **Anti-Spoofing & Moderation**: Hardware mock location detection, velocity threshold jump checks, and decentralized Vote-to-Squelch moderation.

---

## Monorepo Architecture

```
NearBand/
├── apps/
│   ├── mobile/         # React Native bare client (WebRTC, Geolocation, HW Buttons)
│   ├── server/         # Node.js TypeScript signaling & spatial engine
│   └── web/            # Next.js static landing page & interactive CB tuner demo
├── packages/
│   └── shared/         # Common domain models, spatial math, handle generators
├── config/
│   └── livekit.yaml    # LiveKit server configuration
├── .github/workflows/  # CI/CD (Lint, Tests, Builds, GitHub Pages deploy)
└── docker-compose.yml  # Redis + LiveKit + Signaling server compose
```

---

## Quickstart (Local Development)

### 1. Prerequisites

- **Node.js**: >= 20.0.0
- **Docker & Docker Compose**

### 2. Start Supporting Services (Redis + LiveKit)

```bash
docker compose up -d redis livekit
```

### 3. Install Dependencies & Build Packages

```bash
npm install
npm run build:shared
```

### 4. Run Development Services

```bash
# Run backend signaling server
npm run dev:server

# Run web landing page & tuner simulator
npm run dev:web
```

---

## Testing & Quality Gates

```bash
# Run all unit test suites
npm test

# Run tests with 80% coverage check
npm run test:coverage

# Run linter and formatting checks
npm run lint
npm run format:check
npm run type-check
```

---

## CI / CD Pipelines

- **`ci.yml` / `pr-checks.yml`**: Validates formatting (Prettier), linting (ESLint), TypeScript compilation, and enforces an 80% Jest test coverage threshold.
- **`build.yml` / `release-build.yml`**: Generates release APK/AAB and iOS IPA artifacts via Fastlane on tagged releases.
- **`pages.yml`**: Compiles the Next.js static landing page and deploys to GitHub Pages (`gh-pages`).

---

## License

MIT © [Franek Jemiolo](https://github.com/FranekJemiolo)
