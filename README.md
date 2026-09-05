<div align="center">

<img src="./client/assets/icon.png" alt="Quest OverWorld App Icon" width="128" height="128" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);" />

# 🗺️ Quest-OverWorld

[![Download APK](https://img.shields.io/badge/⚡_Download_APK-v1.0.0_Release-F2C84B?style=for-the-badge&logo=android&logoColor=0F0C1C)](https://github.com/rishab11250/Quest-OverWorld/releases/tag/v1.0.0)
[![Postman API Docs](https://img.shields.io/badge/Postman_API_Docs-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://documenter.getpostman.com/view/50839472/2sBYAvwWXz)
[![GitHub Release](https://img.shields.io/github/v/release/rishab11250/Quest-OverWorld?style=for-the-badge&color=3ECF8E&label=Release)](https://github.com/rishab11250/Quest-OverWorld/releases)
<br />
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v24-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

**An immersive, location-based campus exploration and live RPG scavenger quest platform.**  
_Transforming physical environments into dynamic, multiplayer waypoint expeditions._

[Features](#-key-features) • [Architecture](#-system-architecture) • [Database ERD](#-database-entity-relationship-diagram) • [RBAC Matrix](#-role-based-access-control-rbac-matrix) • [Tech Stack](#-technology-stack) • [Env Variables](#-environment-variables) • [Testing](#-development--testing-guide) • [Postman Docs](https://documenter.getpostman.com/view/50839472/2sBYAvwWXz) • [Getting Started](#-getting-started) • [API Reference](#-api-endpoints)

---

</div>

## 🌟 Overview

**Quest-OverWorld** blends real-world GPS navigation, camera-based QR radar scanning, team collaboration, and RPG progression. Adventurers form Guild Parties, track compass bearings to hidden checkpoints, solve multi-disciplinary bounty challenges, and level up their guild perks in real time.

---

## ⚡ Key Features

### 📍 1. Interactive Overworld Atlas & GPS Radar

- **Live Topographical Canvas**: Real-time projection of player position against campus checkpoint waypoints.
- **Dynamic Sonar & Compass Bearing**: Calculates distance (in meters) and cardinal direction arrow using the **Haversine formula**.
- **Prerequisite Graph & Branching Paths**: Stations declare explicit prerequisite checkpoints; a waypoint unlocks once all its prerequisites are cleared, enabling multi-path branching or auto-chained sequential progression.
- **Offline-Tolerant Checkpoint Scanning**: Checkpoint scans made while offline are queued on-device and synced automatically once connectivity returns, replayed in order so team-progression rules are respected; stale/cached GPS is supported with a wider verification radius (+50m buffer) when a fresh fix isn't available.
- **Bounty & Waypoint Hints**: Optional hints available per checkpoint and challenge at a configurable point cost, deducted from team score (never below zero); revealing a hint is a one-time charge per team, and the app warns if spending drops the team below a guild perk threshold.
- **Atmospheric Day/Night Engine**: Tint shifts based on real-time solar hours (Dawn, Day, Dusk, Midnight).
- **Sub-meter High Precision GPS**: Configurable GPS accuracy modes (`Highest` vs `Balanced` battery saver).

### 🛡️ 2. Party & Guild Hierarchy System

- **6-Character Unique Join Code**: Fast invite distribution.
- **Gatekeeper Admission Queue**: Recruits submit entry petitions; Captains and Vice-Captains review, admit (✅), or decline (❌).
- **Configurable Party Size Limits**: Admins set a maximum party size (default 6) via game configuration; enforced at both the join-request and approval stages.
- **Three-Tier Command Hierarchy**:
  - 👑 **Captain**: Rename guild, appoint Vice-Captains, transfer leadership, remove members, and gatekeep admissions.
  - 🛡️ **Vice-Captain**: Gatekeeper recruitment approvals and regular member moderation.
  - ⚔️ **Adventurer**: Standard squad member with shared radar telemetry and chat access.
- **Party Activity Feed**: An in-app, auto-generated log of team events — checkpoints cleared, bounties solved, members joining/leaving, leadership changes — visible only to that team's members and admins.
- **Achievement Badges**: A small set of auto-awarded badges (e.g. first team to clear a checkpoint, a no-fail bounty solve, clearing something in the dead of night, filling out a full roster) recognizing accomplishments beyond just leaderboard score.
- **Historical Quest Standings**: When a quest completes (scheduled or manual), final team standings — score, rank, checkpoints cleared — are snapshotted permanently, so teams can review past quest results after their live score has moved on to a new quest.
- **Leadership Succession on Leave**: Captains must transfer leadership before stepping down if active teammates remain.
- **Level-Gated Guild Perks (1-5)**: Unlocks telemetry sync, +10% XP multipliers, proximity sonars, and golden crests.
- **Direct SMS Invite**: Pre-addressed native Messages application integration via `expo-linking`.

### ⚔️ 3. Bounty Board & Challenge Engine

- **Multi-Category Quests**: `PHOTO`, `RIDDLE`, `TRIVIA`, and `CREATIVE` challenges.
- **Cloud Proof Verification**: Photo bounty submissions with Cloudinary storage and Admin Review queue.
- **Interactive QR Scanner**: Camera radar featuring laser animation, auto-flashlight activation, and manual passkey fallback.
- **Timed Attempt Scoring & Penalty Decay**: Trivia/riddle score decays across subsequent incorrect attempts, with temporary cooldown locks on repeated failures.

### 👑 4. Guild Master Console (Admin Dashboard)

- **Live Event Overview**: Real-time player counts, guild rankings, and server health.
- **Scheduled Quest Windows**: Admins can set a quest's start/end time in advance; a background scheduler auto-activates and auto-completes quests at the configured times without manual intervention, while still respecting the single-active-quest rule.
- **Admin Broadcast Announcements**: Admins can push time-scoped announcements (global or quest-specific, with optional expiry) that surface to players in-app.
- **Post-Event Analytics (Admin)**: Aggregate reporting on checkpoint clear rates/times and bounty difficulty (attempts-to-solve, drop-off rate) for organizers reviewing how an event actually played out.
- **Game Configuration Controls**: Runtime admin controls for maximum party sizes and global gameplay parameters.
- **Player & Guild Governance**: Search, promote/demote admins, ban/unban users, and disqualify guilds.
- **Quest & Checkpoint Studio**: Create quests, place stations with an interactive coordinate map picker, and generate exportable QR codes.
- **Submission Review Queue**: Review player bounty photos, approve rewards, or reject with custom feedback.

### ⚙️ 5. Hero Codex & Preferences

- **Hardware-Wired Preferences**:
  - High-Precision Radar toggle (`expo-location`).
  - Auto-Flashlight trigger (`expo-camera`).
  - Live Guild Polling (15s real-time timer or on-demand fetch).
  - Tactile Haptic Engine mute/unmute (`expo-haptics`).
  - Local GPS cache flusher.
- **Punch-Hole & Notch Safe Area**: Dynamic insets for edge-to-edge Android displays.

---

## 🏗 System Architecture

```mermaid
graph TB
    subgraph Client ["📱 Client Application (React Native / Expo)"]
        UI["RPG Design System & Screens"]
        ROUTER["Expo Router (File-Based)"]
        STORE["SecureStore (Encrypted Auth/Settings)"]
        SENSORS["Hardware APIs (GPS, Camera, Haptics)"]
        API_CLIENT["Axios API Client + JWT Interceptors"]
    end

    subgraph Gateway ["🌐 API & Security Layer (Express.js)"]
        AUTH_MW["JWT Protection Middleware"]
        ROLE_MW["Captain / Vice-Captain / Admin RBAC"]
        CORS_HELMET["Security Headers & Rate Limiter"]
    end

    subgraph Services ["⚙️ Core Backend Micro-Controllers"]
        AUTH_SVC["Auth Controller (bcryptjs)"]
        TEAM_SVC["Team & Hierarchy Controller"]
        QUEST_SVC["Quest & Checkpoint Radar Controller"]
        CHALLENGE_SVC["Challenge & Review Controller"]
        ADMIN_SVC["Admin Governance Engine"]
    end

    subgraph Database ["🗄️ Persistence Layer"]
        MONGO[("MongoDB Database")]
        CLOUDINARY[("Cloudinary Media CDN")]
    end

    UI --> ROUTER
    ROUTER --> API_CLIENT
    API_CLIENT --> SENSORS
    API_CLIENT --> STORE
    API_CLIENT -- "HTTPS / JSON" --> CORS_HELMET
    CORS_HELMET --> AUTH_MW
    AUTH_MW --> ROLE_MW
    ROLE_MW --> AUTH_SVC
    ROLE_MW --> TEAM_SVC
    ROLE_MW --> QUEST_SVC
    ROLE_MW --> CHALLENGE_SVC
    ROLE_MW --> ADMIN_SVC

    AUTH_SVC --> MONGO
    TEAM_SVC --> MONGO
    QUEST_SVC --> MONGO
    CHALLENGE_SVC --> MONGO
    CHALLENGE_SVC --> CLOUDINARY
    ADMIN_SVC --> MONGO
```

---

## 🗄️ Database Entity-Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ TEAM : "member_of"
    USER ||--o{ PROGRESS : "completes"
    USER ||--o{ SUBMISSION : "submits"
    USER ||--o{ ANNOUNCEMENT : "creates"
    USER ||--o{ TEAM_ACTIVITY : "triggers"
    TEAM ||--o{ USER : "has_leader"
    TEAM ||--o{ USER : "has_vice_captains"
    TEAM ||--o{ USER : "pending_requests"
    TEAM }o--|| QUEST : "assigned_to"
    TEAM ||--o{ TEAM_ACTIVITY : "records"
    TEAM ||--o{ TEAM_ACHIEVEMENT : "earns"
    TEAM ||--o{ QUEST_RESULT : "awarded"
    TEAM ||--o{ HINT_REVEAL : "unlocks"
    QUEST ||--|{ CHECKPOINT : "contains"
    QUEST ||--o{ ANNOUNCEMENT : "scopes"
    QUEST ||--o{ QUEST_RESULT : "snapshots"
    CHECKPOINT ||--o{ CHECKPOINT : "prerequisite_of"
    PROGRESS }o--|| TEAM : "tracks_team"
    PROGRESS }o--|| CHECKPOINT : "unlocked_checkpoint"
    CHALLENGE ||--o{ SUBMISSION : "receives"
    SUBMISSION }o--|| USER : "uploaded_by"
    SUBMISSION }o--|| TEAM : "credited_to"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string avatar
        boolean isAdmin
        boolean isBanned
        string status
        date createdAt
    }

    TEAM {
        ObjectId _id PK
        string name
        string code UK
        ObjectId leader FK
        ObjectId[] viceCaptains FK
        ObjectId[] members FK
        Object[] pendingRequests
        ObjectId questId FK
        number score
        string status
        date createdAt
    }

    QUEST {
        ObjectId _id PK
        string name
        string description
        string campus
        number totalPoints
        ObjectId[] checkpoints
        string status
        date startAt
        date endAt
        date createdAt
    }

    CHECKPOINT {
        ObjectId _id PK
        ObjectId questId FK
        number order
        string title
        string clue
        number points
        number latitude
        number longitude
        number radius
        string qrCode
        ObjectId[] prerequisites
        Object[] hints
    }

    PROGRESS {
        ObjectId _id PK
        ObjectId teamId FK
        ObjectId questId FK
        ObjectId checkpointId FK
        date completedAt
        number pointsAwarded
    }

    CHALLENGE {
        ObjectId _id PK
        string title
        string description
        string category
        number points
        string answer
        string hint
        Object[] hints
        string status
    }

    SUBMISSION {
        ObjectId _id PK
        ObjectId challengeId FK
        ObjectId userId FK
        ObjectId teamId FK
        string photoUrl
        string textAnswer
        string status
        string reviewFeedback
        date submittedAt
    }

    ANNOUNCEMENT {
        ObjectId _id PK
        string message
        ObjectId questId FK
        ObjectId createdBy FK
        date expiresAt
        date createdAt
    }

    TEAM_ACTIVITY {
        ObjectId _id PK
        ObjectId teamId FK
        ObjectId actorId FK
        string type
        string message
        date createdAt
    }

    TEAM_ACHIEVEMENT {
        ObjectId _id PK
        ObjectId teamId FK
        string achievementId
        date earnedAt
    }

    QUEST_RESULT {
        ObjectId _id PK
        ObjectId questId FK
        ObjectId teamId FK
        string teamName
        number finalScore
        number finalRank
        number checkpointsCleared
        number challengesCleared
        date completedAt
    }

    HINT_REVEAL {
        ObjectId _id PK
        ObjectId teamId FK
        string targetType
        ObjectId targetId FK
        number hintIndex
        date revealedAt
    }

    GAME_CONFIG {
        string _id PK
        number maxTeamSize
        date updatedAt
    }
```

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Capability / Action              | 👑 Admin | 🎖️ Party Captain | 🛡️ Vice-Captain | ⚔️ Party Member | 👤 Guest / Solo |
| :------------------------------- | :------: | :--------------: | :-------------: | :-------------: | :-------------: |
| **View Radar & Active Clues**    |    ✅    |        ✅        |       ✅        |       ✅        |       ❌        |
| **Scan Waypoint QR Codes**       |    ✅    |        ✅        |       ✅        |       ✅        |       ❌        |
| **Submit Bounty Challenges**     |    ✅    |        ✅        |       ✅        |       ✅        |       ❌        |
| **Reveal Waypoint/Bounty Hints** |    ✅    |        ✅        |       ✅        |       ✅        |       ❌        |
| **Share SMS Invite Code**        |    ✅    |        ✅        |       ✅        |       ✅        |       ❌        |
| **View Party Activity Feed**     |    ✅    |        ✅        |       ✅        |       ✅        |       ❌        |
| **View Past Quest Standings**    |    ✅    |        ✅        |       ✅        |       ✅        |       ❌        |
| **Admit / Decline Recruits**     |    ✅    |        ✅        |       ✅        |       ❌        |       ❌        |
| **Remove Regular Member**        |    ✅    |        ✅        |       ✅        |       ❌        |       ❌        |
| **Remove Vice-Captain**          |    ✅    |        ✅        |       ❌        |       ❌        |       ❌        |
| **Promote/Demote Vice-Captain**  |    ✅    |        ✅        |       ❌        |       ❌        |       ❌        |
| **Rename Guild Party**           |    ✅    |        ✅        |       ❌        |       ❌        |       ❌        |
| **Appoint Successor Captain**    |    ✅    |        ✅        |       ❌        |       ❌        |       ❌        |
| **Broadcast Announcements**      |    ✅    |        ❌        |       ❌        |       ❌        |       ❌        |
| **Adjust Game Configuration**    |    ✅    |        ❌        |       ❌        |       ❌        |       ❌        |
| **View Post-Event Analytics**    |    ✅    |        ❌        |       ❌        |       ❌        |       ❌        |
| **Disqualify / Ban Guild**       |    ✅    |        ❌        |       ❌        |       ❌        |       ❌        |
| **Ban / Unban Player**           |    ✅    |        ❌        |       ❌        |       ❌        |       ❌        |
| **Create & Edit Quests**         |    ✅    |        ❌        |       ❌        |       ❌        |       ❌        |
| **Review Photo Proofs**          |    ✅    |        ❌        |       ❌        |       ❌        |       ❌        |

---

## 🔄 Data Flow & State Lifecycle

### 1. Party Gatekeeper & Hierarchy Flow

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Applicant
    actor Captain as Captain / Vice-Captain
    participant Server as Node.js / MongoDB

    Recruiter->>Server: POST /api/teams/join (Code: "X9K2L1")
    Server-->>Recruiter: 200 OK (Status: "Pending Approval")
    Note over Recruiter: Displays PendingAdmissionCard

    Captain->>Server: GET /api/teams/me
    Server-->>Captain: Returns Team (with pendingRequests array)
    Note over Captain: Gold Alert Banner Displays in Party Hub

    Captain->>Server: POST /api/teams/:id/requests/:userId/approve
    Server->>Server: Move user from pendingRequests -> members
    Server-->>Captain: 200 OK (Updated Roster)

    Recruiter->>Server: GET /api/teams/me
    Server-->>Recruiter: 200 OK (Active Member Roster & Radar Unlocked)
```

### 2. Waypoint Radar & Checkpoint Discovery Flow

```mermaid
sequenceDiagram
    autonumber
    actor Hero as Adventurer
    participant GPS as Device GPS Hardware
    participant Client as Overworld Atlas
    participant Server as Quest Engine

    Hero->>GPS: Stream Lat / Lng telemetry
    GPS-->>Client: Updated coordinates
    Client->>Client: Calculate Distance & Compass Bearing (Haversine)
    Client->>Client: Project Beacon Ring & Radar Grid
    Hero->>Client: Scan Checkpoint QR Code
    Client->>Server: POST /api/checkpoints/verify (QR Data + User GPS + Timestamp)
    Server->>Server: Verify Proximity Radius (<= 50m) & Prerequisite Graph Unlocks
    Server->>Server: Award Points & Log Progress
    Server-->>Client: 200 OK (Waypoint Cleared + Newly Unlocked Branches)
    Client->>Hero: Trigger Haptic Pulse & Level Up Dialog
```

---

## 💻 Technology Stack

### Mobile Client (`/client`)

| Technology                         | Description                                               |
| :--------------------------------- | :-------------------------------------------------------- |
| **React Native (v0.81)**           | Cross-platform native mobile foundation with React 19.    |
| **Expo SDK 54**                    | Managed native tooling, camera, location, secure storage. |
| **Expo Router v4**                 | File-based routing with tab and nested stack navigators.  |
| **expo-camera**                    | Real-time QR code scanning with auto-torch flashlight.    |
| **expo-location**                  | Hardware GPS watcher and reverse geocoding.               |
| **expo-haptics**                   | Tactile vibration engine for button clicks and unlocks.   |
| **expo-secure-store**              | Encrypted keychain/keystore JWT session storage.          |
| **react-native-safe-area-context** | Dynamic insets for punch-hole and camera notch devices.   |

### Backend Engine (`/server`)

| Technology               | Description                                         |
| :----------------------- | :-------------------------------------------------- |
| **Node.js & Express.js** | Modular RESTful API engine.                         |
| **MongoDB & Mongoose 8** | NoSQL database with nested populate & schema hooks. |
| **JWT & bcryptjs**       | Stateless authentication and password hashing.      |
| **Cloudinary & Multer**  | Media CDN storage for photo proof submissions.      |
| **Helmet & CORS**        | HTTP security headers and cross-origin protection.  |

---

## 📁 Project Structure

```
Quest-OverWorld/
├── .github/
│   └── workflows/
│       └── build-apk.yml               # Automated Android APK CI/CD release workflow
├── client/                             # React Native / Expo Frontend
│   ├── app/                            # Expo Router Screen Directory
│   │   ├── (auth)/                     # Login & Registration Screens
│   │   │   ├── login.jsx
│   │   │   └── register.jsx
│   │   ├── (tabs)/                     # Main Navigation Tabs
│   │   │   ├── _layout.jsx             # RPG Tab Bar Configuration
│   │   │   ├── home.jsx                # Quest Overview & Active Clues
│   │   │   ├── map.jsx                 # Overworld Atlas & Waypoint Radar
│   │   │   ├── team.jsx                # Party Hub, Roster, Activity & Badges
│   │   │   ├── challenges.jsx          # Bounty Board (Photo, Riddle, Trivia)
│   │   │   ├── leaderboard.jsx         # Realm Hall of Fame Rankings
│   │   │   └── profile.jsx             # Hero Codex & Functional Preferences
│   │   ├── admin/                      # Guild Master Console (Admin Dashboard)
│   │   │   └── dashboard.jsx
│   │   ├── camera/
│   │   │   └── scanner.jsx             # QR Radar & Scanner Screen
│   │   ├── team/[teamId].jsx           # Party Inspector & Details
│   │   └── _layout.jsx                 # Root Safe Area & Font Loader Layout
│   ├── components/                     # Modular Reusable UI Components
│   │   ├── admin/                      # Admin Tabs, Modals & Map Pickers
│   │   │   ├── modals/                 # Decomposed Admin Dialog Modules
│   │   │   └── map/                    # Location Picker & Radius Projections
│   │   ├── profile/                    # Profile Subcomponents (Hero, Settings, Realm)
│   │   ├── team/                       # Squad Modals (Manage, Gatekeeper, Rename)
│   │   ├── OverworldMap.jsx            # Dynamic Coordinate Canvas & Compass
│   │   ├── RpgTabBar.jsx               # Pixel Gold Trimmed Hotbar
│   │   └── PixelCard.jsx               # Retro Styled Containers
│   ├── lib/                            # Helpers (api, haptics, location, offlineQueue, secureStore)
│   └── theme/                          # Colors, Atmosphere, Spacing, Typography
└── server/                             # Node.js / Express Backend
    ├── config/                         # MongoDB & Cloudinary Connection Setup
    ├── controllers/                    # Business Logic Controllers
    │   ├── admin/                      # Player, Guild, Quest, Review & Analytics Governance
    │   ├── authController.js           # JWT Authentication
    │   ├── teamController.js           # Party Hierarchy, Gatekeeper, History & Activity
    │   ├── questController.js          # Checkpoint Verification & Clue Engine
    │   └── challengeController.js      # Bounty Submissions, Attempts & Hint Engine
    ├── jobs/                           # Background Tasks & Schedulers
    │   └── questScheduler.js           # Automated Quest Start/End Cron Engine
    ├── middleware/                     # JWT Auth & Role Authorization
    ├── models/                         # Mongoose Models (User, Team, Quest, Checkpoint, Progress, Challenge, etc.)
    ├── routes/                         # Express Route Definitions
    ├── services/                       # Domain Services (Achievement & Completion Engines)
    └── server.js                       # Server Entry Point
```

---

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js**: `v20.x` or `v24.x`
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Expo Go App** or **Android Studio / Device** (with USB Debugging / ADB)
- **MongoDB Instance** (Local or MongoDB Atlas)

---

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
pnpm install

# Create environment configuration
cp .env.example .env
```

Configure your `server/.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/quest_overworld
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend server:

```bash
# Development mode with hot-reload
pnpm run dev
```

---

### 2. Mobile App Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
pnpm install
```

Configure `client/lib/api.js` with your backend server URL:

```javascript
const BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
```

Start the Expo Development Server:

```bash
# Start Expo bundler
pnpm start

# Run directly on connected Android device
pnpm android
```

---

<a id="-development--testing-guide"></a><a id="development--testing-guide"></a>

### 3. Syntax & Style Checks

```bash
# Check backend server syntax
node --check server.js

# Verify codebase Prettier formatting
pnpm prettier --check .
```

---

<a id="-environment-variables"></a><a id="environment-variables"></a>

### 4. Environment Variables Reference

#### Backend Server (`server/.env`)

| Variable                | Required | Default | Description                                                                              |
| :---------------------- | :------: | :-----: | :--------------------------------------------------------------------------------------- |
| `PORT`                  |    ❌    | `5000`  | Port for the Express.js HTTP API server.                                                 |
| `MONGO_URI`             |    ✅    |    —    | MongoDB connection URI (Local or MongoDB Atlas cluster).                                 |
| `JWT_SECRET`            |    ✅    |    —    | Secret key used for signing and verifying JSON Web Tokens.                               |
| `JWT_EXPIRE`            |    ❌    |  `30d`  | Expiration duration for user session tokens.                                             |
| `CLOUDINARY_CLOUD_NAME` |    ❌    |    —    | Cloudinary cloud identifier for photo bounty uploads.                                    |
| `CLOUDINARY_API_KEY`    |    ❌    |    —    | Cloudinary API access key.                                                               |
| `CLOUDINARY_API_SECRET` |    ❌    |    —    | Cloudinary API secret key.                                                               |
| `BYPASS_GEOFENCE`       |    ❌    | `false` | When set to `true`, bypasses GPS proximity checks during QR scans for local dev testing. |
| `CORS_ORIGIN`           |    ❌    |   `*`   | Allowed CORS origins (comma-separated for production).                                   |

#### Mobile Client (`client/lib/api.js`)

| Setting    | Required |            Example             | Description                                                                  |
| :--------- | :------: | :----------------------------: | :--------------------------------------------------------------------------- |
| `BASE_URL` |    ✅    | `http://192.168.1.15:5000/api` | Target backend REST API endpoint reachable from your physical mobile device. |

---

<a id="-api-endpoints"></a><a id="api-endpoints"></a>

## 📡 API Endpoints & Payload Specifications

> 🚀 **Interactive Live Documentation:** View, fork, and test all runnable endpoints directly on the [Quest-OverWorld Postman Documenter](https://documenter.getpostman.com/view/50839472/2sBYAvwWXz).

<details>
<summary><b>🔐 1. Authentication Endpoints (Click to expand)</b></summary>

#### `POST /api/auth/register`

- **Request Body:**

```json
{
  "name": "Alex Hunter",
  "email": "alex@overworld.realm",
  "password": "SecurePassword123",
  "avatar": "shield-crown"
}
```

- **Response (201 Created):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "66d3a8e2b1...",
    "name": "Alex Hunter",
    "email": "alex@overworld.realm",
    "avatar": "shield-crown",
    "isAdmin": false
  }
}
```

#### `POST /api/auth/login`

- **Request Body:**

```json
{
  "email": "alex@overworld.realm",
  "password": "SecurePassword123"
}
```

- **Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "66d3a8e2b1...",
    "name": "Alex Hunter",
    "email": "alex@overworld.realm",
    "avatar": "shield-crown",
    "isAdmin": false
  }
}
```

</details>

<details>
<summary><b>🛡️ 2. Party & Gatekeeper Hierarchy Endpoints (Click to expand)</b></summary>

#### `POST /api/teams/join`

- **Request Body:**

```json
{
  "code": "X9K2L1"
}
```

- **Response (200 OK - Queued for Approval):**

```json
{
  "success": true,
  "pending": true,
  "message": "Admission request sent to \"Shadow Vanguard\". Waiting for Captain or Vice-Captain approval.",
  "pendingTeam": {
    "_id": "66d3b1f0c2...",
    "name": "Shadow Vanguard",
    "code": "X9K2L1"
  }
}
```

#### `POST /api/teams/:id/requests/:userId/approve`

- **Response (200 OK):**

```json
{
  "success": true,
  "message": "Adventurer admitted into the party!",
  "team": {
    "_id": "66d3b1f0c2...",
    "name": "Shadow Vanguard",
    "code": "X9K2L1",
    "score": 450,
    "members": [{ "_id": "66d3a8e2b1...", "name": "Alex Hunter", "email": "alex@overworld.realm" }],
    "viceCaptains": []
  }
}
```

#### `POST /api/teams/:id/transfer-leadership`

- **Request Body:**

```json
{
  "newLeaderId": "66d3a8e2b1..."
}
```

- **Response (200 OK):**

```json
{
  "success": true,
  "message": "Party leadership transferred. You are now Vice-Captain.",
  "team": { ... }
}
```

#### `GET /api/teams/me/history`

- **Response (200 OK):**

```json
{
  "history": [
    {
      "_id": "66d4a100b1...",
      "questId": {
        "_id": "66d3c004e5...",
        "name": "Campus Genesis Odyssey",
        "description": "Initial campus exploration expedition",
        "campus": "North Quad Grounds",
        "totalPoints": 700
      },
      "teamId": "66d3b1f0c2...",
      "teamName": "Shadow Vanguard",
      "finalScore": 620,
      "finalRank": 1,
      "checkpointsCleared": 4,
      "challengesCleared": 2,
      "completedAt": "2026-09-04T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### `GET /api/teams/:id/activity`

- **Query Parameters:** `limit` (default 20, max 50), `before` (ISO date cursor)
- **Response (200 OK):**

```json
{
  "success": true,
  "activities": [
    {
      "_id": "66d4b200c3...",
      "teamId": "66d3b1f0c2...",
      "actorId": { "_id": "66d3a8e2b1...", "name": "Alex Hunter" },
      "type": "checkpoint_cleared",
      "message": "Alex Hunter verified Checkpoint #2 (Clocktower Plaza)",
      "createdAt": "2026-09-04T11:45:00.000Z"
    }
  ],
  "nextCursor": "2026-09-04T11:45:00.000Z"
}
```

#### `GET /api/teams/:id/achievements`

- **Response (200 OK):**

```json
{
  "success": true,
  "achievements": [
    {
      "_id": "66d4c300d4...",
      "achievementId": "first_blood",
      "title": "Trailblazer (First Blood)",
      "description": "First guild in the realm to verify a checkpoint.",
      "earnedAt": "2026-09-04T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

</details>

<details>
<summary><b>🗺️ 3. Quests & Checkpoint Verification Endpoints (Click to expand)</b></summary>

#### `GET /api/quests/active`

- **Response (200 OK):**

```json
{
  "quest": {
    "_id": "66d3c004e5...",
    "name": "Campus Genesis Odyssey",
    "campus": "North Quad Grounds",
    "totalCheckpoints": 4,
    "currentOrder": 2,
    "isCompleted": false,
    "currentClue": {
      "_id": "66d3c110f6...",
      "order": 2,
      "title": "Clocktower Plaza",
      "clue": "Under the ancient bell that tolls the ninth hour, find the stone monolith.",
      "points": 150,
      "radius": 50
    },
    "completedCheckpoints": [
      { "_id": "66d3c050a1...", "order": 1, "title": "North Quad Fountain", "completed": true }
    ],
    "checkpoints": [ ... ]
  },
  "team": {
    "_id": "66d3b1f0c2...",
    "name": "Shadow Vanguard",
    "score": 450
  }
}
```

#### `POST /api/checkpoints/verify`

- **Request Body:**

```json
{
  "qrCode": "CHECKPOINT_GENESIS_2_CLK",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "scannedAt": "2026-09-05T10:00:00.000Z",
  "locationStale": false
}
```

- **Response (200 OK):**

```json
{
  "success": true,
  "message": "🎉 Checkpoint #2 (Clocktower Plaza) successfully cleared!",
  "pointsAwarded": 165,
  "bonusXp": 15,
  "appliedMultiplier": 1.1,
  "guildLevel": 2,
  "totalScore": 465,
  "clearedCheckpoint": {
    "_id": "66d3c110f6...",
    "title": "Clocktower Plaza",
    "order": 2
  },
  "nextClue": {
    "_id": "66d3c220a3...",
    "order": 3,
    "title": "Observatory Hill",
    "clue": "Where astronomers track distant constellations.",
    "points": 200,
    "radius": 50
  },
  "isQuestCompleted": false
}
```

#### `GET /api/checkpoints/:id/hints`

- **Response (200 OK):**

```json
{
  "success": true,
  "hints": [
    {
      "index": 0,
      "cost": 25,
      "text": "Look beneath the archway facing north.",
      "isRevealed": true
    },
    {
      "index": 1,
      "cost": 50,
      "text": null,
      "isRevealed": false
    }
  ],
  "teamScore": 450
}
```

#### `POST /api/checkpoints/:id/hint`

- **Request Body:**

```json
{
  "hintIndex": 1
}
```

- **Response (200 OK):**

```json
{
  "success": true,
  "hint": "Check behind the stone ivy planter.",
  "cost": 50,
  "newScore": 400,
  "warning": null
}
```

</details>

<details>
<summary><b>⚔️ 4. Bounties & Submission Endpoints (Click to expand)</b></summary>

#### `POST /api/challenges/:id/submit`

- **Request Body (Multipart Form-Data or JSON):**

```json
{
  "textAnswer": "The bronze sundial near the library.",
  "photoUrl": "https://res.cloudinary.com/quest/image/upload/v12345/proof.jpg"
}
```

- **Response (200 OK):**

```json
{
  "success": true,
  "message": "Bounty proof submitted for Guild Master review!"
}
```

#### `POST /api/challenges/:id/solve`

- **Request Body:**

```json
{
  "answer": "Observatory"
}
```

- **Response (200 OK):**

```json
{
  "success": true,
  "message": "Correct! Bounty solved on attempt #1.",
  "awardedPoints": 150,
  "teamScore": 550
}
```

#### `GET /api/challenges/:id/attempt-status`

- **Response (200 OK):**

```json
{
  "isCapped": true,
  "attempts": 1,
  "maxStandardAttempts": 3,
  "hasBonusRetry": true,
  "usedBonusRetry": false,
  "status": "in_progress",
  "isLocked": false,
  "secondsRemaining": 0,
  "currentPointsPreview": 120,
  "nextPointsPreview": 75,
  "hints": [
    { "index": 0, "cost": 20, "text": "Think about astronomical instruments.", "isRevealed": true }
  ],
  "teamScore": 400
}
```

#### `POST /api/challenges/:id/hint`

- **Request Body:**

```json
{
  "hintIndex": 0
}
```

- **Response (200 OK):**

```json
{
  "success": true,
  "hint": "Think about astronomical instruments.",
  "cost": 20,
  "newScore": 380,
  "warning": null
}
```

</details>

<details>
<summary><b>🏆 5. Realm Leaderboard Endpoints (Click to expand)</b></summary>

#### `GET /api/leaderboard`

- **Response (200 OK):**

```json
{
  "rankings": [
    {
      "rank": 1,
      "_id": "66d3b1f0c2...",
      "name": "Shadow Vanguard",
      "code": "X9K2L1",
      "score": 620,
      "level": 3,
      "membersCount": 4,
      "leaderName": "Alex Hunter",
      "checkpointsCount": 4,
      "challengesCount": 2,
      "isCurrentTeam": true
    }
  ],
  "myTeam": {
    "rank": 1,
    "_id": "66d3b1f0c2...",
    "name": "Shadow Vanguard",
    "score": 620
  },
  "totalTeams": 8
}
```

</details>

<details>
<summary><b>📢 6. Announcements Endpoints (Click to expand)</b></summary>

#### `GET /api/announcements`

- **Response (200 OK):**

```json
{
  "success": true,
  "announcements": [
    {
      "_id": "66d4e100f5...",
      "message": "⚠️ High storm alert near the Science Quad. Waypoint beacon moved indoors.",
      "questId": null,
      "createdBy": {
        "_id": "66d3a8e2b1...",
        "name": "Admin Master"
      },
      "expiresAt": "2026-09-05T18:00:00.000Z",
      "createdAt": "2026-09-05T09:00:00.000Z"
    }
  ],
  "count": 1
}
```

</details>

<details>
<summary><b>👑 7. Guild Master & System Admin Endpoints (Click to expand)</b></summary>

#### `GET /api/admin/config` & `PUT /api/admin/config`

- **Update Request Body (`PUT`):**

```json
{
  "maxTeamSize": 8
}
```

- **Response (200 OK):**

```json
{
  "success": true,
  "message": "Party size limit updated to 8 players.",
  "config": {
    "_id": "game_config_singleton",
    "maxTeamSize": 8
  }
}
```

#### `POST /api/admin/announcements`

- **Request Body:**

```json
{
  "message": "Expedition ends in 30 minutes! Return proofs to the beacon.",
  "questId": "66d3c004e5...",
  "expiresAt": "2026-09-05T18:00:00.000Z"
}
```

- **Response (201 Created):**

```json
{
  "success": true,
  "message": "Announcement broadcast created successfully.",
  "announcement": {
    "_id": "66d4e100f5...",
    "message": "Expedition ends in 30 minutes! Return proofs to the beacon.",
    "questId": { "_id": "66d3c004e5...", "name": "Campus Genesis Odyssey" },
    "createdBy": { "_id": "66d3a8e2b1...", "name": "Admin Master" },
    "expiresAt": "2026-09-05T18:00:00.000Z"
  }
}
```

#### `GET /api/admin/quests/:id/results`

- **Response (200 OK):**

```json
{
  "success": true,
  "results": [
    {
      "_id": "66d4a100b1...",
      "questId": "66d3c004e5...",
      "teamId": "66d3b1f0c2...",
      "teamName": "Shadow Vanguard",
      "finalScore": 620,
      "finalRank": 1,
      "checkpointsCleared": 4,
      "challengesCleared": 2,
      "completedAt": "2026-09-04T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### `GET /api/admin/analytics/checkpoints`

- **Query Parameters:** `questId` (optional, defaults to active or latest quest)
- **Response (200 OK):**

```json
{
  "success": true,
  "quest": {
    "_id": "66d3c004e5...",
    "name": "Campus Genesis Odyssey",
    "status": "completed"
  },
  "checkpoints": [
    {
      "_id": "66d3c050a1...",
      "title": "Clocktower Plaza",
      "order": 1,
      "clearedCount": 12,
      "dropoffRate": 0,
      "avgClearTimeMinutes": 8.4
    }
  ],
  "summary": {
    "totalTeams": 12,
    "completedTeams": 9,
    "completionRate": 75,
    "longestBottleneckCheckpoint": "Clocktower Plaza"
  }
}
```

#### `GET /api/admin/analytics/challenges`

- **Query Parameters:** `questId` (optional)
- **Response (200 OK):**

```json
{
  "success": true,
  "challenges": [
    {
      "_id": "66d3d001a1...",
      "title": "Ancient Sundial Cipher",
      "category": "riddle",
      "totalSubmissions": 14,
      "approvedCount": 10,
      "solveRate": 71.4,
      "avgAttemptsToSolve": 1.6
    }
  ]
}
```

</details>

---

## 📦 Building Android Release APK

Quest-OverWorld includes an automated GitHub Actions pipeline.

To build a new production APK:

```bash
# Tag a release commit
git tag -a v1.0.0 -m "Release v1.0.0"

# Push tag to GitHub
git push origin v1.0.0
```

_The `.github/workflows/build-apk.yml` workflow automatically compiles the standalone Android APK and attaches the asset directly to your [GitHub Releases](https://github.com/rishab11250/Quest-OverWorld/releases) page._

---

## 👨‍💻 Created By

<div align="center">

Crafted with passion, precision, and ⚔️ by **[Rishab](https://github.com/rishab11250)**.

[![GitHub Profile](https://img.shields.io/badge/GitHub-rishab11250-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rishab11250)

</div>

---

<div align="center">

### ✨ Thank You! ✨

_Thank you for exploring and supporting **Quest-OverWorld**! If you enjoyed this project or found it helpful, consider leaving a ⭐ on [GitHub](https://github.com/rishab11250/Quest-OverWorld)._

<sub>Happy Adventuring & Scavenger Questing across the Overworld! 🗺️⚔️🛡️</sub>

</div>
