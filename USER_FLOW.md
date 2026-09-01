# Quest Overworld — Verified System User Flow

> **Audit Date:** September 1, 2026  
> **Scope:** Ground-truth implementation flow verified directly against backend controllers, middleware, models, and React Native (Expo) screens.

---

## 1. Player Experience Flow

### 1.1 App Startup & Routing
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [app/_layout.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/_layout.jsx) — Font preloading (`useFonts`) and root navigation Stack setup.
- [app/index.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/index.jsx) — `Index` component reading JWT and user profile from SecureStore.
- [lib/secureStore.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/lib/secureStore.js) — `getToken`, `getUserData`.
- [server/middleware/auth.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/middleware/auth.js) — `protect` middleware verifying JWT and evaluating `user.isBanned` / `user.status === 'banned'`.

**Actual Executed Flow:**
1. App mounts `RootLayout` in `app/app/_layout.jsx`, loading custom fonts (`PressStart2P-Regular`, `Nunito-Regular`, `Nunito-SemiBold`, `Nunito-Bold`, `IBMPlexMono-Regular`). If loading, renders gold `ActivityIndicator`.
2. Router enters `app/app/index.jsx`. Reads cached token via `getToken()` and user data via `getUserData()`.
3. If no token found → routes to `/(auth)/login`.
4. If token found:
   - If `user.isAdmin === true` or `user.role === 'admin'` → routes to `/admin/dashboard`.
   - Else → routes to `/(tabs)/home`.
5. On subsequent protected API requests, `server/middleware/auth.js` decodes JWT. If `user.isBanned === true` or `user.status === 'banned'`, returns HTTP `403` with `{ message, isBanned: true }`, blocking all gameplay actions.

---

### 1.2 Registration & Login Authentication
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/authController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/authController.js) — `register`, `login`, `getMe`, `updateProfile`.
- [server/models/User.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/models/User.js) — `hashPassword`, `matchPassword`, default fields (`status: 'active'`, `isAdmin: false`).
- [app/auth/login.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/auth/login.jsx) & [app/auth/register.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/auth/register.jsx) — Client authentication screens.

**Actual Executed Flow:**
1. **Registration (`POST /api/auth/register`):**
   - Server requires `name` (or `username`), `email`, and `password`. Returns HTTP `400` if missing.
   - Normalizes email via `toLowerCase().trim()`. Rejects duplicate emails with HTTP `400`.
   - Uses bcrypt (`bcrypt.hash(password, 10)`) via `User.hashPassword` to create user record with `isAdmin: false` and `status: 'active'`.
   - Issues 30-day JWT payload `{ id, email, isAdmin }` signed with `JWT_SECRET`.
   - Client stores token and user object in Expo SecureStore (`app/lib/secureStore.js`) and routes to `/(tabs)/home`.
2. **Login (`POST /api/auth/login`):**
   - Requires `email` and `password`. Returns HTTP `400` if empty.
   - Looks up user by normalized email. Verifies password via `bcrypt.compare`. Returns HTTP `401` on invalid credentials.
   - Evaluates ban state: if `user.isBanned || user.status === 'banned'`, rejects login with HTTP `403` and displays `banReason`.
   - Returns JWT token and sanitized user profile (`_id, name, email, avatar, isAdmin`).
   - Admin account (`admin@overworld.com` / `isAdmin: true`) routes immediately to `/admin/dashboard`.

---

### 1.3 Team Creation, Joining & Contact Recruitment
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/teamController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/teamController.js) — `createTeam`, `joinTeam`, `getMyTeam`, `leaveTeam`.
- [server/models/Team.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/models/Team.js) — Team schema, auto-generated 6-character uppercase alphanumeric join code (`crypto.randomBytes(3)`).
- [app/(tabs)/team.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/%28tabs%29/team.jsx) — Party management screen with tab switching (`join` / `create`), copy code, and leave modal.
- [components/team/InviteContactsModal.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/team/InviteContactsModal.jsx) — Modal interfacing with device contacts and OS share sheet.

**Actual Executed Flow:**
1. **Team Check:** `GET /api/teams/me` fetches the player's current guild. If `team === null`, renders `TeamAuthCard` with `Create Party` and `Join Party` forms.
2. **Party Creation (`POST /api/teams`):**
   - Requires `name`. Checks if player is already in a team (returns HTTP `400` if already joined).
   - Generates unique 6-character code (e.g., `AB12CD`). Sets creator as `leader` and first member. Initializes `score: 0`.
3. **Party Joining (`POST /api/teams/join`):**
   - Requires 6-character code. Normalizes to uppercase.
   - Checks if player is already in a team (returns HTTP `400`).
   - Pushes player ID to `team.members` array and returns populated team.
4. **Invite Wiring Verification:**
   - **Tap-to-Copy:** `handleCopyCode` calls `expo-clipboard` (`Clipboard.setStringAsync(team.code)`), triggers haptic, and shows temporary "COPIED" badge. (Verified real).
   - **OS Share Sheet:** `handleShareCode` calls React Native `Share.share({ message })` to broadcast the party invite code across any messenger/social app. (Verified real).
   - **Contacts Integration:** `InviteContactsModal` requests device permission via `expo-contacts` (`Contacts.requestPermissionsAsync()`), loads local contact records (`Contacts.getContactsAsync()`), filters contacts with names, and triggers targeted SMS/Share via `Share.share` with pre-filled party code. (Verified real).
5. **Leaving Party (`POST /api/teams/:id/leave`):**
   - Removes member. If player was leader, reassigns `leader` to `team.members[0]`.
   - If last member leaves, deletes the team record (`Team.findByIdAndDelete`).

---

### 1.4 Quest & Waypoint Clue Viewing (Server-Authoritative)
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/questController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/questController.js) — `getActiveQuest`.
- [server/models/Progress.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/models/Progress.js) — Checkpoint clearance tracking by team.
- [app/(tabs)/home.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/%28tabs%29/home.jsx) — Player dashboard with active quest banner, waypoint trail, and station progress.
- [app/(tabs)/quest.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/%28tabs%29/quest.jsx) — Quest overview and rules display.

**Actual Executed Flow:**
1. Client requests `GET /api/quests/active`.
2. Controller identifies user's team via `Team.findOne({ members: req.user._id })`. If player has no team, returns `quest: null` with prompt to join party.
3. Automatically binds team to the active quest if `team.questId` was null.
4. Queries `Progress.find({ teamId, questId })` to determine exactly which checkpoints have been completed.
5. Evaluates sequence progression (`currentOrder`):
   - Iterates through checkpoints in order (`1, 2, 3...`).
   - Determines the active station the team is currently on.
6. **Server-Authoritative Anti-Spoil Clue Delivery:**
   - `currentClue` object is populated **only** for the active checkpoint (`_id, order, title, clue, points, radius`).
   - Future stations in the `checkpoints` array are returned with `_id, order, title, points, latitude, longitude`, but **without** `clue` text.
   - Cleared stations are listed in `completedCheckpoints` with `completed: true`.

---

### 1.5 Map & Radar Screen
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [app/(tabs)/map.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/%28tabs%29/map.jsx) — Map container, reverse geocoding, live GPS subscription.
- [components/OverworldMap.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/OverworldMap.jsx) — Interactive campus map with radar sweep, pulse beacon, distance meter, and compass bearing.
- [lib/location.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/lib/location.js) — `getDistanceInMeters`, `getBearingAndDirection`, `startLocationWatcher`.

**Actual Executed Flow:**
1. Screen mounts, starts background GPS stream via `expo-location` (`startLocationWatcher`), updating player coordinates.
2. In parallel, fetches active quest from `GET /api/quests/active`.
3. Displays campus landmark nodes (`ZONE_ANCHORS`) combined with live checkpoint sequence coordinates.
4. Computes real-time target distance (`getDistanceInMeters`) and directional heading (`getBearingAndDirection`, e.g., "NE · 45°") between user GPS and active checkpoint coordinates.
5. **Advisory-Only Distance Enforcement:**
   - The map distance and radar are **advisory aids**.
   - The client map screen does **not** perform scan-gating or block the camera; the user can freely open the QR scanner at any time.
   - Geofence enforcement happens server-authoritatively at scan verification time.

---

### 1.6 QR Scanner & Checkpoint Discovery Verification
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/checkpointController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/checkpointController.js) — `verifyCheckpoint`.
- [app/camera/scanner.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/camera/scanner.jsx) — Full-screen camera scanner with torch toggle, reticle, and manual fallback submission.
- [server/utils/geo.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/utils/geo.js) — Haversine distance computation.

**Actual Response States Returned by Backend:**
1. **Missing Party:** Returns `400` → `"You must belong to an active party to verify checkpoints."`
2. **Banned Party:** Returns `403` → `"Guild <name> has been banned by the Guild Master Admin."` with `isBanned: true`.
3. **Invalid / Unrecognized QR Token:** Returns `400` → `"Invalid or unrecognized QR code for this quest."` (Scanned token does not match any checkpoint belonging to `team.questId`).
4. **Already Cleared (Idempotency):** Returns `400` → `"This checkpoint has already been cleared by your party."`
5. **Sequence-Locked (Anti-Skip):** Returns `400` → `"Sequence locked! You must discover Checkpoint #<n-1> (<Title>) first."`
6. **Missing GPS Rejected:** Unless `BYPASS_GEOFENCE=true`, returns `400` → `"GPS location coordinates (latitude & longitude) are required for checkpoint verification. Please enable device location services."`
7. **Too Far from Landmark:** Returns `400` → `"Too far from discovery site! You are <distance>m away (must be within <radius>m of <Title>). Move closer to landmark and re-scan."` (Calculates Haversine distance with a 25m buffer).
8. **Teammate Race Condition:** Returns `400` with MongoDB code `11000` duplicate key → `"Checkpoint was just verified by a teammate!"`
9. **Success Clearance:** Returns `200` with:
   - Points awarded and updated `totalScore`.
   - `clearedCheckpoint` object.
   - `nextClue` object containing the next station's clue text.
   - `isQuestCompleted` flag (`true` when final station cleared).

---

### 1.7 Special Bounties & Challenges (Two Explicit Paths)
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/challengeController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/challengeController.js) — `getAllChallenges`, `submitChallenge`, `solveChallenge`, `getChallengeAttemptStatus`.
- [server/models/Challenge.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/models/Challenge.js), [server/models/Submission.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/models/Submission.js), [server/models/ChallengeAttempt.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/models/ChallengeAttempt.js).
- [app/(tabs)/bounties.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/%28tabs%29/bounties.jsx) & [app/challenge/[challengeId].jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/challenge/%5BchallengeId%5D.jsx) — Bounty list and detail screens.
- [server/utils/cloudinary.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/utils/cloudinary.js) — Remote image asset hosting for photo proof submissions.

**Path A: Photo Proof (Manual Review Flow)**
1. Player captures/selects image proof from camera/gallery (`expo-image-picker`).
2. Dispatches `POST /api/challenges/:id/submit` with `photoUrl` (base64 data URI).
3. Server uploads image to Cloudinary folder `quest_overworld_proofs` via `uploadImage()` in `cloudinary.js`.
4. Creates/updates `Submission` record with `status: 'pending'`, `photoUrl: hostedCloudinaryUrl`, and submitter ID.
5. Returns `{ status: 'pending', approved: false, message: 'Submission received! Sent to Guild Admin for review.' }`. No points awarded until admin manual approval.

**Path B: Automated Trivia / Riddle (Rate-Limited & Decay Flow)**
1. `GET /api/challenges/:id/attempt-status` fetches the team's live attempt record.
2. Player submits answer string via `POST /api/challenges/:id/solve`.
3. **Attempt & Cooldown Model:**
   - **Try 1 Fail:** 10s party cooldown lock. Next attempt awards **80% XP**.
   - **Try 2 Fail:** 30s party cooldown lock. Next attempt awards **50% XP**.
   - **Try 3 Fail:** 180s (3-minute) party cooldown lock. Unlocks Final Second Chance (awards **50% XP**).
   - **Try 4 Fail (Bonus fail):** Status marked permanently `locked`. Bounty sealed forever for this party.
4. **429 Team Cooldown:** If any party member submits while `lockedUntil` timestamp is active, server returns HTTP `429` with `secondsRemaining`.
5. **Correct Answer:** Case-insensitive string match against `challenge.answerKey`. Immediately awards decayed points to `team.score`, marks `attemptRecord.status = 'solved'`, and creates pre-approved `Submission` record.

---

### 1.8 Leaderboard & Rankings
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/leaderboardController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/leaderboardController.js) — `getLeaderboard`.
- [app/(tabs)/leaderboard.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/%28tabs%29/leaderboard.jsx) — Real-time rankings table with sticky party rank banner.

**Actual Executed Flow:**
1. `GET /api/leaderboard` returns all teams sorted descending by `score`, with populated member counts and leader info, plus the current user's team standing.
2. `app/app/(tabs)/leaderboard.jsx` executes `fetchLeaderboard()` immediately on tab focus via `useFocusEffect`.
3. **Focus-Gated Polling Behavior:** A 15-second timer (`setInterval(..., 15000)`) is managed inside `useFocusEffect`. Polling starts when the Leaderboard tab is active and immediately tears down (`clearInterval`) when switching to any other tab, preventing background battery/network drain.

---

### 1.9 Profile & Team Hub Settings
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [app/(tabs)/profile.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/%28tabs%29/profile.jsx) — Hero profile, avatar picker modal, local preference toggles, and secure sign-out.
- [server/controllers/authController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/authController.js) — `getMe`, `updateProfile`.
- [lib/secureStore.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/lib/secureStore.js) — `getSetting`, `setSetting`, `clearAuth`.

**Actual Executed Flow:**
1. Displays player name, email, avatar icon, and joined guild name.
2. **Profile Edit Modal:** `PUT /api/auth/me` updates `name` and selects avatar from `AVATAR_ICONS` (`shield-crown`, `sword`, `compass`, `fire`, etc.).
3. **Preferences Toggles:** Stored locally in encrypted storage via `setSetting()`:
   - `high_accuracy_gps` (High Accuracy GPS Provider)
   - `auto_torch` (Automatic Flashlight on Scanner Mount)
   - `live_polling` (15s Real-Time Server Standings Polling)
   - `haptic_feedback` (Device Vibration Feedback on Action)
4. **Sign Out:** Prompts confirmation dialog via `ConfirmModal`, clears secure store tokens via `clearAuth()`, and redirects to `/(auth)/login`.

---

## 2. Admin Operations Console Flow

### 2.1 Login & Access Control Routing
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/middleware/admin.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/middleware/admin.js) — `requireAdmin` middleware checking `req.user.isAdmin === true`.
- [server/routes/admin.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/routes/admin.js) — Central router protected by `protect` and `requireAdmin`.
- [app/admin/dashboard.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/app/admin/dashboard.jsx) — Master event operations console.

**Actual Executed Flow:**
1. User logs in with `admin@overworld.com`.
2. Auth response returns `user.isAdmin: true`.
3. `Index` router or login screen pushes navigation directly to `/admin/dashboard`.
4. All `/api/admin/*` endpoints strictly reject non-admin users with HTTP `403` (`"Access denied. Administrator privileges required."`).

---

### 2.2 Quest Management (Draft-by-Default & Single-Active Rule)
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/adminController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/adminController.js) — `createQuest`, `updateQuest`, `getAllAdminQuests`, `deleteQuest`.
- [server/models/Quest.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/models/Quest.js) — Schema with fields `name, description, campus, totalPoints, status, checkpoints`.
- [components/admin/AdminQuestsTab.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminQuestsTab.jsx) — Quest list, status badges, activation toggle, station count.
- [components/admin/AdminModals.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminModals.jsx) — `CreateQuestModal`.

**Actual Executed Flow:**
1. **Creation Form (`POST /api/admin/quests`):**
   - Modal takes `name`, `description`, `campus` (text label), and `totalPoints` (XP budget).
   - Contains **no coordinate or map inputs** (quest territories have no physical coordinates; only stations have GPS pins).
   - Defaults new quests to `status: 'draft'`.
2. **Single-Active Database Guard (Model & Controller Level):**
   - Schema default status is `'draft'`.
   - Mongoose `pre('save')` hook on `Quest.js` enforces the single-active constraint globally: any direct model write (`Quest.create` or `quest.save()`) with `status: 'active'` when another active quest exists throws a conflict error.
   - Admin controller (`adminController.js`) also intercepts double-activation before write and returns HTTP **`409 Conflict`**:
     > `"<Conflicting Quest Name>" is currently active. Set it to Draft or Ended before activating another quest.`
   - Deleting a quest via `DELETE /api/admin/quests/:id` cascades and deletes all associated checkpoints.

---

### 2.3 Checkpoint Station Management & QR Generation
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/adminController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/adminController.js) — `createCheckpoint`, `updateCheckpoint`, `getCheckpointQr`, `deleteCheckpoint`.
- [components/admin/AdminModals.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminModals.jsx) — `CreateCheckpointModal`, `CheckpointQrPreviewModal`.
- [components/admin/AdminLocationPickerMap.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminLocationPickerMap.jsx) — Visual GPS pin drop on campus map with geofence radius selector.

**Actual Executed Flow:**
1. **Creation Modal (`CreateCheckpointModal`):**
   - **Step 1 (Map Pin):** Admin taps campus map or drags pin to set exact `latitude` and `longitude`. Adjusts geofence radius pill (`25m`, `50m`, `100m`, `150m`).
   - **Step 2 (Clues & QR):** Top field requires selecting a parent Quest from a horizontal chip picker. Takes station title, discovery clue text, XP points reward, and station order.
2. **Auto-Generated Cryptographic QR:**
   - Admin **does not** type QR strings. Backend auto-generates a secure 16-character hex token via `crypto.randomBytes(8).toString('hex')`.
   - Generates scannable QR Data URI image via `QRCode.toDataURL(token)` and returns it in the `POST /api/admin/checkpoints` response.
3. **QR Preview, Gallery Save & Share (`CheckpointQrPreviewModal`):**
   - Renders QR code image and token string with tap-to-copy.
   - Tapping `Save / Share QR` writes PNG to cache (`expo-file-system/legacy`), requests media library permissions via `expo-media-library`, and saves directly to the device **Photos / Gallery**, with an option to open the OS Share sheet.

---

### 2.4 Bounty & Challenge Management
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/adminController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/adminController.js) — `getAllAdminChallenges`, `createChallenge`, `updateChallenge`, `deleteChallenge`.
- [server/models/Challenge.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/models/Challenge.js) — Schema with `title, description, category (photo|riddle|trivia|creative), points, verificationType (manual_review|auto_answer), answerKey, status`.
- [components/admin/AdminBountiesTab.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminBountiesTab.jsx) & `CreateChallengeModal` in [components/admin/AdminModals.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminModals.jsx).

**Actual Executed Flow:**
1. Admin creates challenges specifying title, briefing description, category, and XP points.
2. For automated trivia, specifies `verificationType: 'auto_answer'` and the expected `answerKey`.
3. For photo bounties, specifies `verificationType: 'manual_review'`.
4. Admin can edit or delete challenges at any time.

---

### 2.5 Submission Review Queue
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/adminController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/adminController.js) — `getPendingSubmissions`, `approveSubmission`, `rejectSubmission`.
- [components/admin/AdminReviewsTab.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminReviewsTab.jsx) — Review queue interface.
- [components/admin/AdminModals.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminModals.jsx) — `RejectSubmissionModal`.

**Actual Executed Flow:**
1. `GET /api/admin/submissions/pending` loads all pending photo and manual review submissions sorted oldest first (`createdAt: 1`).
2. Renders review card for each submission showing:
   - Challenge title and XP value
   - Submitting party name and current team score
   - Submitter player name
   - High-resolution Cloudinary photo proof (`sub.photoUrl`)
   - Submitter text notes
3. **Approval (`POST /api/admin/submissions/:id/approve`):**
   - Marks submission as `approved`.
   - Sets `reviewedBy: adminId` and `reviewedAt: now`.
   - Automatically credits challenge XP points to `team.score`.
4. **Rejection (`POST /api/admin/submissions/:id/reject`):**
   - Admin enters rejection feedback reason in `RejectSubmissionModal`.
   - Marks submission as `rejected` and stores feedback for party resubmission.

---

### 2.6 Player & Guild Management
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/adminController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/adminController.js) — `getAllPlayers`, `updatePlayerStatus`, `updatePlayerRole`, `kickPlayerFromTeam`, `deletePlayer`, `getAllTeams`, `updateTeamStatus`, `deleteTeam`.
- [components/admin/AdminPlayersTab.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminPlayersTab.jsx) — Guild & Roster Controller UI.
- [components/admin/AdminModals.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminModals.jsx) — `BanPlayerModal`, `DeletePlayerModal`, `BanTeamModal`.

**Actual Executed Flow:**
1. **Roster Filtering:** Filter chips for `ALL`, `PLAYERS`, `BANNED`, and `ADMIN`. Search by name, email, or party.
2. **Role Promotion/Demotion (`PATCH /api/admin/players/:userId/role`):** Toggles `isAdmin` privilege on any user account (self-demotion blocked).
3. **Kick Member (`POST /api/admin/players/:userId/kick`):** Removes player from their team without deleting their account. If leader is kicked, reassigns leadership to next remaining member.
4. **Ban / Suspend Player (`PATCH /api/admin/players/:userId/status`):**
   - Opens `BanPlayerModal` for penalty reason input.
   - Sets `user.status = 'banned'` and `user.isBanned = true`.
   - Ban is enforced across all endpoints via `protect` middleware.
5. **Delete Player (`DELETE /api/admin/players/:userId`):**
   - Server-enforced security guard: **Only banned players can be permanently deleted** from the database. Attempting to delete an active player returns HTTP `400`.
   - Unlinks user from team and purges user record.
6. **Guild / Party Actions:**
   - Ban Guild (`PATCH /api/admin/teams/:id/status` with `banned`): Blocks all members from verifying checkpoints and submitting bounties.
   - Disband Guild (`DELETE /api/admin/teams/:id` with `purge=false`): Unlinks members and marks team `disbanded`.
   - Purge Guild (`DELETE /api/admin/teams/:id` with `purge=true`): Permanently removes team from database records.

---

### 2.7 System Operations & Maintenance Tab
**Status:** ✅ Fully implemented and verified working  
**Source Files:**
- [server/controllers/adminController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/adminController.js) — `reseedDemoData`.
- [server/controllers/systemController.js](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/server/controllers/systemController.js) — `getSystemHealth`.
- [components/admin/AdminSystemTab.jsx](file:///D:/College/SEM-3/react-native/Assignment-1/Quest-OverWorld/app/components/admin/AdminSystemTab.jsx) — Operator identity card, health ping, demo reseed, and logout.

**Actual Executed Flow:**
1. **Operator Codex:** Displays logged-in admin identity (`name`, `email`, `role`, access level).
2. **API Health Ping (`GET /api/system/health`):** Pings server and displays latency and operational status.
3. **Demo Data Reset (`POST /api/admin/system/reseed`):**
   - Clears existing quest data.
   - Reseeds 1 official campus quest (*"The Legend of Old Campus"*).
   - Generates 4 sequential checkpoint stations with GPS coordinates and unique QR codes.
   - Reseeds 4 bounty challenges (2 photo bounties, 1 riddle, 1 campus trivia).
4. **Admin Sign Out:** Clears authentication tokens and routes to login.

---

## 3. Implementation Status Summary Matrix

| Module / Feature | Component / Endpoint | Status | Verified Notes |
| :--- | :--- | :---: | :--- |
| **App Startup & Routing** | `_layout.jsx`, `index.jsx` | ✅ | Checks SecureStore token, role routes to admin/player. |
| **Registration & Login** | `authController.js` | ✅ | Bcrypt password hash, normalized emails, 403 on ban. |
| **Party Management** | `teamController.js`, `team.jsx` | ✅ | 6-char codes, auto-leader transfer, disband on empty. |
| **Contact Recruitment** | `InviteContactsModal.jsx` | ✅ | Real `expo-contacts` & `Share.share` implementation. |
| **Waypoint Clue Delivery** | `questController.js` | ✅ | Server-authoritative: only current station clue exposed. |
| **Map & Waypoint Radar** | `OverworldMap.jsx`, `map.jsx` | ✅ | Real-time distance/bearing; advisory only (no scan gating). |
| **QR Verification** | `checkpointController.js` | ✅ | Enforces party check, sequence order, and GPS proximity. |
| **Photo Bounties** | `challengeController.js` | ✅ | Cloudinary upload, `pending` state, admin manual review. |
| **Trivia / Riddles** | `challengeController.js` | ✅ | Attempt cap (3+1 bonus), decay schedule (100%→80%→50%), 429 cooldown. |
| **Leaderboard** | `leaderboard.jsx` | ✅ | Fetches on focus + 15s interval timer while mounted. |
| **Profile & Preferences** | `profile.jsx` | ✅ | Avatar picker modal, local preference toggles, logout. |
| **Admin Access Routing** | `requireAdmin.js`, `admin/dashboard` | ✅ | Strict 403 enforcement for non-admins. |
| **Quest Management** | `adminController.js` | ✅ | Draft-by-default, 409 Conflict on double-activation. |
| **Checkpoint CRUD** | `adminController.js`, `AdminModals` | ✅ | Mandatory quest picker, auto crypto QR, gallery save/share. |
| **Bounty CRUD** | `adminController.js` | ✅ | Full CRUD for photo, creative, riddle, and trivia bounties. |
| **Review Queue** | `AdminReviewsTab.jsx` | ✅ | Full-size photo proof cards, approve (+XP) & reject with feedback. |
| **Player / Guild Ops** | `AdminPlayersTab.jsx` | ✅ | Promote/demote, kick, ban with reason, delete (banned-only guard). |
| **System Reseed & Health** | `AdminSystemTab.jsx` | ✅ | Live latency ping, 1-click 4-station demo database reset. |
