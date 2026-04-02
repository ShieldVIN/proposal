# ShieldVIN — Platform Architecture
## Next Phase: Multi-Portal Web Platform — Draft v0.1

**Status:** Design specification — pre-development
**Date:** 2026-04
**Scope:** Architecture for the full ShieldVIN web platform serving Government, Manufacturer, Dealer, and Private Owner portals

---

## 1. Overview

The ShieldVIN platform is a multi-tenant web application with four distinct portal environments. Each portal is tailored to its user type — different feature sets, information density, UX style, and VAP-1 API access rights. All portals share a single backend API layer and the same Midnight Network integration.

This document defines the portal scope, feature sets, technical stack, and the shared infrastructure they sit on.

---

## 2. Portal Environments

### 2.1 Government / DMV Portal

**Users:** DVLA (UK), DMV (US states), transport ministries, border agencies, law enforcement agencies

**Access level:** `law_enforcement` and `government` VAP-1 roles

**Core features:**

| Feature | Description |
|---------|-------------|
| VIN lookup — live proof | Trigger a live 3-of-3 ZK proof. Returns ACTIVE / STOLEN / FLAGGED status |
| VIN lookup — cached | Sub-second cached status check for routine checkpoints |
| Stolen flag tool | Officer files a stolen report — writes STOLEN status to on-chain VIT |
| Recovered flag tool | Officer clears a stolen flag — writes RECOVERED status |
| Fleet query | Batch status check for a list of VINs (e.g. import inspection) |
| Audit log | Read-only view of all queries made by this agency's credentials |
| Jurisdiction dashboard | Aggregate statistics: total VINs registered in jurisdiction, stolen count, recovered count, flagged count |
| Recall visibility | View all VINs in jurisdiction currently under recall flag |
| Node rotation history | Visibility into any vehicles that have undergone a hardware node rotation |
| Export / evidence pack | Generate a signed evidence pack (PDF + proof hash) for use in a prosecution |

**UX style:** Professional utility — functional, dense information display, optimised for fast single-VIN lookup. Mobile-friendly for roadside use. Dark/light mode toggle.

---

### 2.2 Manufacturer Portal

**Users:** OEM manufacturers (Toyota, BYD, Ford, etc.), their manufacturing plant operators, quality teams, recall coordinators

**Access level:** `manufacturer` VAP-1 role — scoped to their own fleet (factoryCode match enforced)

**Core features:**

| Feature | Description |
|---------|-------------|
| Mint new VIT | End-of-line minting workflow: enter VIN + build data → triggers VIT token creation on Midnight Network |
| Fleet dashboard | Real-time view of all VINs minted by this manufacturer: status breakdown, tamper alert count, recall flag count |
| Recall management | Issue a recall flag to a batch of VINs by date range, model line, or VIN list. Clear flags after service completion |
| Tamper alert monitor | Real-time feed of TN-3 tamper alerts for this manufacturer's fleet |
| Hardware recovery tools | Initiate and authorise node key rotations (OEM authorisation step in VAP-1 recovery procedure) |
| Build record linkage | Upload buildSpecHash for a VIN batch — links the on-chain token to the off-chain build record |
| Production statistics | Minting volume, DUST consumption, monthly cost tracking |
| API credentials | Issue and manage VAP-1 credentials for their dealer network |

**UX style:** Enterprise dashboard — data-heavy, bulk operations, CSV/Excel export, role-based access control within the manufacturer's own team. Integration with existing manufacturing ERP systems via API is expected at Phase 3.

---

### 2.3 Dealer Portal

**Users:** OEM-authorised dealers, used vehicle dealers with VGM-1 registration, service centres

**Access level:** `dealer` VAP-1 role

**Core features:**

| Feature | Description |
|---------|-------------|
| VIN identity check | Verify a vehicle before purchase or sale — returns status, ownership count, service count |
| Ownership transfer | Execute a VAP-1 ownership transfer at point of sale — current owner proof + new owner commitment |
| Service record | Record a service event for a vehicle — increments serviceCount on-chain |
| Hardware recovery | Initiate and complete node key rotation for warranty/recall repairs (dealer side of the recovery procedure) |
| Used vehicle history | Display the on-chain event log (transfers, service count, node rotation history, status history) to a customer |
| Finance verification | Provide lender with a proof of identity and ownership chain for a vehicle finance application |
| QR code generator | Generate a VAP-1 verification QR code for display on a vehicle for sale — links to the live status page |
| Credential management | Manage staff credentials and query audit log |

**UX style:** Clean, transactional. Optimised for a single-VIN workflow — enter VIN, see result, take action. Printable verification certificate for customer handover documentation.

---

### 2.4 Private Owner App / Portal

**Users:** Registered vehicle owners

**Access level:** `owner` VAP-1 role — scoped to their own vehicles (ownership proof required)

**Core features:**

| Feature | Description |
|---------|-------------|
| My vehicles | List of all vehicles linked to their ownership commitment |
| Vehicle identity card | Display their vehicle's full on-chain record: status, transfer history, service count, mint date |
| Ownership proof | Generate a ZK ownership proof (for use at point of sale to a dealer) |
| Report stolen | Owner-initiated stolen report — writes STOLEN status via VAP-1 |
| Share verification QR | Generate a time-limited QR code for a buyer to verify the vehicle identity |
| Transfer vehicle | Initiate ownership transfer — generates a proof for the dealer portal to complete |
| Notifications | Alerts for: recall flag set on their vehicle, tamper alert, status change |
| Document pack | Download a signed PDF evidence pack: vehicle identity certificate + ownership proof |

**UX style:** Consumer-grade. Clean, simple, friendly. Minimal jargon. Mobile-first. Should work on any smartphone without a wallet extension — device-bound credential via TN-3 or an app-stored key.

---

## 3. Shared Infrastructure

### 3.1 Authentication & Credentialing

All portals authenticate using **VAP-1 Role Credentials** (signed JWTs issued by the VGM-1 governance authority). Each portal issues credentials appropriate to its user type.

**Session flow:**
1. User registers with portal (identity verified by the portal — off-chain KYC appropriate to role)
2. Portal issues a device-bound VAP-1 credential JWT
3. Credential is stored in the user's device credential store (not in the portal's database)
4. API calls carry the credential in the Authorization header

---

### 3.2 Backend API Layer

All portals call a single backend API gateway that:
- Validates VAP-1 credentials
- Enforces role-based access control (a dealer credential cannot call government endpoints)
- Routes requests to the Midnight Network integration layer
- Maintains the per-role audit log
- Provides rate limiting per the VAP-1 spec (Section 6)

**Technology stack (recommended):**

| Layer | Technology |
|-------|-----------|
| API gateway | Node.js + Express or Fastify |
| Midnight integration | Midnight.js SDK 4.x (TypeScript) |
| Proof server | midnightntwrk/proof-server 8.0.3 Docker container (sidecar) |
| Private state | PrivateStateProvider — AES-256-GCM encrypted LevelDB |
| Public state / indexer | PublicDataProvider — GraphQL indexer (Indexer 4.0.1) |
| Credential issuance | JWT (HS256 or RS256) — VGM-1 governance key |
| Database (off-chain) | PostgreSQL — audit logs, user accounts, cached status certificates |
| Cache | Redis — cached status certificates, proof result TTL management |
| Hosting | AWS eu-west-2 (UK region) + multi-region at Phase 3 |

---

### 3.3 Frontend Technology

All four portals are separate Next.js applications (TypeScript) that share a component library.

| Portal | Route | Auth |
|--------|-------|------|
| Government | gov.shieldvin.org | Role credential: law_enforcement / government |
| Manufacturer | manufacturer.shieldvin.org | Role credential: manufacturer |
| Dealer | dealer.shieldvin.org | Role credential: dealer |
| Owner | my.shieldvin.org | Role credential: owner |
| Public landing | shieldvin.org | No auth — public information only |

**Shared component library:**
- VIN search bar
- Status badge (ACTIVE / STOLEN / FLAGGED / RECOVERED / DECOMMISSIONED)
- Proof result card
- Vehicle history timeline
- QR code generator
- Proof certificate PDF renderer

---

### 3.4 Midnight Network Integration

The backend integrates with Midnight Network using the Midnight.js 4.x SDK:

```
[Portal UI]
    ↓ HTTPS
[API Gateway + VAP-1 role validation]
    ↓
[Midnight.js integration layer]
    ├── PrivateStateProvider (AES-256-GCM LevelDB — private witness data)
    ├── PublicDataProvider (GraphQL indexer — public ledger reads)
    ├── ProofProvider (HTTP client → Proof Server Docker)
    ├── WalletProvider (DUST management)
    └── MidnightProvider (transaction submission)
         ↓
    [Midnight Network — Ledger 8.0.3]
    [vehicle_identity.compact — deployed VIT contracts]
```

**REVIEW with Midnight team:** Confirm that Midnight.js 4.x provider API names and interfaces are unchanged from 3.x. The major version bump (3→4) may have restructured these interfaces.

---

### 3.5 Notification System

Owner and manufacturer portals require real-time notifications (tamper alerts, recall flags, status changes). These are triggered by:
1. Monitoring the GraphQL indexer for state changes on enrolled VINs
2. Webhook delivery to portal backends
3. Push notification to mobile devices (Firebase Cloud Messaging or APNs)

---

## 4. Development Phases

### Phase 1 — Foundation (pre-pilot)
- [ ] Midnight Network testnet integration (Midnight.js 4.x SDK)
- [ ] Deployed `vehicle_identity.compact` on testnet
- [ ] VAP-1 API backend: live proof, cached status, lifecycle write endpoints
- [ ] Government portal MVP: VIN lookup + stolen flag
- [ ] Manufacturer portal MVP: minting workflow + fleet dashboard

### Phase 2 — Pilot (10k–20k vehicles, UK)
- [ ] Dealer portal: ownership transfer + service record
- [ ] Owner portal: mobile-first, QR share, ownership proof
- [ ] Law enforcement mobile app (iOS + Android) — thin VAP-1 client
- [ ] Hardware recovery workflow in Dealer + Manufacturer portals
- [ ] Mainnet deployment

### Phase 3 — Scale (multi-manufacturer, multi-jurisdiction)
- [ ] Multi-region API infrastructure (AWS + Azure failover)
- [ ] Manufacturer portal: ERP integration API
- [ ] Government portal: batch/fleet query + border agency tools
- [ ] VGM-1 governance console: credential issuance, rate limit management, consortium member administration
- [ ] Multi-language support (minimum: EN, FR, DE, ZH, JA)

---

## 5. Open Design Decisions

| Decision | Options | Recommendation |
|----------|---------|---------------|
| One contract per vehicle vs registry contract | Per-vehicle (current stub) OR Map-based registry | Review with Midnight team — registry is more efficient at scale |
| Owner wallet | TN-3 device-bound credential OR separate wallet app | TN-3 binding is stronger security; app-based is more accessible for consumer market. Support both. |
| Proof server deployment | Cloud-hosted vs per-vehicle local | Cloud-hosted for portal-initiated proofs; TN-3 local for vehicle-initiated proofs |
| eIDAS 2.0 integration | VAP-1 as eIDAS verifiable attestation | Pursue — significant EU distribution advantage |
| Mobile law enforcement app | iOS/Android vs Progressive Web App | PWA first for deployment speed; native app for biometric auth at Phase 2 |

---

*This document is a pre-development architecture specification. Technical choices are subject to validation during Phase 1 development, particularly the Midnight.js 4.x SDK integration.*
