# NearBand - System Design & Architecture Document

## 1. Vision & Core Principles

NearBand revives the spontaneous, democratic, and tactile experience of citizen band (CB) radio using modern mobile technology. It enforces four non-negotiable principles:

1. **Strict Spatial Locality**: Radios only transmit to listeners within ~5 miles (8 km / 8046 meters). If you leave the radius, you leave the conversation.
2. **Ephemeral Identity**: No registration, passwords, phone numbers, or profiles. On launch, users are assigned a phonetic callsign (e.g., `Rusty Falcon`, `Neon Coyote`) that evaporates when the session terminates.
3. **Realistic Audio Collisions**: Traditional voice chat systems prioritize a single speaker or enforce automatic ducking. NearBand deliberately permits simultaneous overlapping transmissions so voices step on each other like analog radio frequency contention.
4. **Frictionless Push-To-Talk (PTT)**: Hardware button mappings (Volume buttons) and a hard 30-second countdown enforce brevity and eliminate hot mics.

---

## 2. High-Level Architecture

```
                    +-----------------------------+
                    |  Next.js Static Landing Page |
                    |      (GitHub Pages Demo)    |
                    +-----------------------------+
                                   |
                                   v
+-------------------------------+      +-------------------------------+
|     NearBand Mobile App       | ---> |     Node.js Signaling Server  |
|  (React Native Bare Workflow) | <--- | (Socket.io, Velocity Check,   |
|  - react-native-webrtc        |      |  Ephemeral Handle Generation, |
|  - react-native-geo           |      |  Squelch Moderation Ledger)   |
|  - Native Volume HW PTT       |      +-------------------------------+
|  - Client-Side VAD Noise Gate |                      |
+-------------------------------+                      | LiveKit Room Minting
                |                                      v
                | WebRTC RTP Streams   +-------------------------------+
                +--------------------> |      LiveKit SFU Server       |
                                       | - Overlapping Audio Forward   |
                                       | - Unmanaged Mixing            |
                                       +-------------------------------+
                                                       |
                                                       v
                                       +-------------------------------+
                                       |     Redis GEO Spatial Cache   |
                                       | - Spatial Index (GEOADD/SEARCH|
                                       | - Ephemeral User Hash         |
                                       | - 24h Rolling Squelch Ledger  |
                                       +-------------------------------+
```

---

## 3. Spatial Geofencing & Dynamic Room Partitioning

### 3.1 Grid Bucketing

Earth coordinates are mapped into continuous geographic buckets of approximately $0.072^\circ$ latitude and longitude (~8 km diameter cell). Each grid cell has a deterministic identifier:
$$\text{Grid ID} = \text{grid\_}\lfloor \text{lat} / \text{step} \rfloor \times \text{step}\_\lfloor \text{lon} / \text{step} \rfloor \times \text{step}$$

### 3.2 Dynamic LiveKit Room Naming

LiveKit rooms are ephemeral and instantiated on demand by channel number and grid identifier:
$$\text{Room Name} = \text{nearband\_ch}\{\text{channel}\}\_\{\text{gridId}\}$$

When a user switches from Channel 19 to Channel 9, the client leaves the previous LiveKit room and joins the new room matching their current physical grid and selected channel.

---

## 4. WebRTC Audio Engine & LiveKit Unmanaged Forwarding

Standard SFUs (Zoom, Google Meet, Discord) perform aggressive speaker selection, muting or lowering low-volume participants to optimize bandwidth.

In NearBand:

- **Unmanaged Forwarding**: The LiveKit room configuration disables speaker dominance attenuation. All published audio tracks from participants in the room are forwarded concurrently.
- **Client-Side VAD (Voice Activity Detection)**: The mobile client evaluates ambient audio levels. If input drops below the noise floor threshold for more than 2 seconds, the client temporarily halts RTP transmission to conserve bandwidth and battery.
- **PTT Cutoff Timer**: A hard timer on the client and server disconnects audio transmission at exactly 30 seconds to prevent accidental open mics.

---

## 5. Background Execution & Hardware Button Mapping

### 5.1 iOS Configuration

- Enabled `UIBackgroundModes`: `audio`, `voip`, and `location`.
- Audio session category set to `AVAudioSessionCategoryPlayAndRecord` with options `AVAudioSessionCategoryOptionMixWithOthers` and `AVAudioSessionCategoryOptionDefaultToSpeaker`.

### 5.2 Android Configuration

- Continuous foreground service with notification channel displaying active channel and callsign.
- `WAKE_LOCK` and `FOREGROUND_SERVICE_MICROPHONE` permissions.

### 5.3 Hardware Volume Buttons

- Intercept native volume button press events via custom native event emitter.
- Suppresses native volume HUD while PTT is held and routes key-down to `startTransmitting()` and key-up to `stopTransmitting()`.

---

## 6. Moderation & Anti-Spoofing

### 6.1 Hardware Mock Detection

Client checks:

- Android: `Location.isFromMockProvider()`
- iOS: `CLLocation.sourceInformation.isSimulatedBySoftware`

Any mocked location reports terminate the session immediately.

### 6.2 Server-Side Velocity Tracking

For every spatial update:
$$\text{Velocity} = \frac{\text{Haversine}(\text{coord}_{t_1}, \text{coord}_{t_0})}{t_1 - t_0}$$
If calculated velocity exceeds $250 \text{ m/s}$ (~900 km/h, commercial jet travel speed), the server rejects the coordinate jump and resets the session.

### 6.3 Decentralized Vote-to-Squelch

- Any user can flag a disruptive phonetic handle.
- Redis tracks flags in a 24-hour set: `squelch:{gridId}:{targetUserId}`.
- If flags exceed threshold (default: 3 unique nearby reporters), the target user is muted for that spatial grid for 24 hours.

---

## 7. Data Models

```typescript
// Ephemeral User Record (Redis Hash: user:{userId})
interface EphemeralUser {
  userId: string;
  handle: string;
  currentChannel: number;
  lastActive: number;
  squelchCount: number;
}

// Spatial Key: channel:{channelId}:locations (Redis GEO)
// Members: userId -> [longitude, latitude]

// Squelch Ledger: squelch:{gridId}:{targetUserId} (Redis Set)
// Members: reporterUserId (TTL: 86400s)
```
