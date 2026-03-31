# VAP-1 — Vehicle Authentication Protocol
## Verification API & Protocol Standard — Draft v0.4

**Status:** Draft — for review by ShieldVIN governance consortium and Midnight Network technical team
**Date:** 2026-03
**Scope:** HTTP/JSON interface for all authorised verification queries against a ShieldVIN Vehicle Identity Token

---

## 1. Overview

VAP-1 defines the request/response protocol used by all external parties — law enforcement, insurers, dealers, government agencies, and vehicle owners — to query a vehicle's identity on the Midnight Network.

The API separates four distinct operation types:

| Operation | Description |
|-----------|-------------|
| **Live proof** | Vehicle hardware generates a fresh ZK proof in real time. Highest assurance. Used at points of sale, import/export, and crime scenes. |
| **Cached status** | Signed certificate from last live proof, valid for a defined TTL. Used at routine checkpoints where sub-second response is required. |
| **Lifecycle event** | Write operations — flag stolen, record service, transfer ownership, decommission. Requires appropriate authority credential. |
| **Hardware recovery** | Multi-party key rotation for legitimate node replacement (warranty repair, recall, accidental damage). Requires surviving node co-signature plus institutional authorisation. See Section 4.7. |

All API responses include a block hash and proof hash that can be independently verified on-chain against the Midnight Network state.

---

## 2. Authentication

All requests must carry a **VAP-1 Role Credential** — a signed JWT issued by the VGM-1 governance authority.

```
Authorization: Bearer <vap1_credential_jwt>
```

### Credential Claims

```json
{
  "iss": "vgm1.shieldvin.org",
  "sub": "agency-id-or-entity-id",
  "role": "law_enforcement",
  "jurisdiction": "GB-ENG",
  "iat": 1743120000,
  "exp": 1743206400,
  "sig": "..."
}
```

### Valid Roles

| Role Code | Role Name | Issued By |
|-----------|-----------|-----------|
| `law_enforcement` | Police / border agency | National authority via VGM-1 |
| `insurer` | Insurance company | VGM-1 registry |
| `dealer` | Licensed vehicle dealer | VGM-1 registry |
| `government` | DMV / DVLA / transport authority | National authority via VGM-1 |
| `owner` | Registered vehicle owner | TN-3 credential (device-bound) |
| `manufacturer` | OEM manufacturer | VGM-1 registry (production only) |

---

## 3. Base URL

```
https://api.shieldvin.org/v1/
```

All responses use `Content-Type: application/json`. TLS 1.3 minimum.

---

## 4. Endpoints

### 4.1 Live Vehicle Proof

Triggers the vehicle hardware to generate a fresh 3-of-3 ZK proof. Requires the vehicle to be reachable via its telematics module (TN-3).

**Endpoint**
```
POST /verify/live
```

**Request**
```json
{
  "vin": "1HGBH41JXMN109186",
  "nonce": "a3f7c92b8d1e4056af23bc9d",
  "requester_role": "law_enforcement",
  "jurisdiction": "GB-ENG",
  "timestamp": "2026-03-28T09:15:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `vin` | string(17) | ISO 3779 VIN |
| `nonce` | hex string(24) | Requester-generated nonce. Prevents replay attacks. |
| `requester_role` | string | One of the valid role codes |
| `jurisdiction` | string | ISO 3166-2 jurisdiction code |
| `timestamp` | ISO 8601 | Request timestamp |

**Response — Success (200)**
```json
{
  "result": "success",
  "proof_type": "live",
  "vin": "1HGBH41JXMN109186",
  "status": "ACTIVE",
  "disclosed": {
    "status": "ACTIVE"
  },
  "proof_hash": "b7e2a4f1d8c93a56...",
  "block_height": 4821093,
  "validator_sig": "9c3e...",
  "generated_at": "2026-03-28T09:15:22Z",
  "proof_latency_ms": 23400,
  "nonce_echo": "a3f7c92b8d1e4056af23bc9d"
}
```

**Response — Vehicle Stolen (200)**

When the vehicle status is `STOLEN` and the requester role is `law_enforcement`, the VIN is additionally disclosed per the selective disclosure rule:

```json
{
  "result": "success",
  "proof_type": "live",
  "status": "STOLEN",
  "disclosed": {
    "status": "STOLEN",
    "vin": "1HGBH41JXMN109186"
  },
  "proof_hash": "d2a91f...",
  "block_height": 4821093,
  "validator_sig": "8f2c...",
  "generated_at": "2026-03-28T09:15:24Z",
  "proof_latency_ms": 24100,
  "nonce_echo": "a3f7c92b8d1e4056af23bc9d"
}
```

**Response — Proof Failure (200)**

A proof failure is not an HTTP error — it is a valid, signed result. The vehicle exists but cannot produce a valid 3-of-3 proof (node missing, tampered, or replaced).

```json
{
  "result": "proof_failed",
  "proof_type": "live",
  "vin": "1HGBH41JXMN109186",
  "failure_reason": "node_signature_invalid",
  "failure_detail": "CN-2 signature did not verify against committed public key",
  "proof_hash": "f91c3a...",
  "block_height": 4821094,
  "validator_sig": "7a44...",
  "generated_at": "2026-03-28T09:15:26Z"
}
```

**Response — Vehicle Unreachable (202)**

TN-3 is offline or out of connectivity range. Returns a cached status certificate (see Section 4.2) with a `LIVE_UNAVAILABLE` flag.

```json
{
  "result": "cached_fallback",
  "live_unavailable": true,
  "cached_status": "ACTIVE",
  "cache_generated_at": "2026-03-27T14:30:00Z",
  "cache_expires_at": "2026-03-28T14:30:00Z",
  "proof_hash": "c44b12...",
  "validator_sig": "3d91...",
  "note": "Live proof unavailable. Cached status certificate returned. TTL 24h standard; 1h if stolen flag recently updated."
}
```

---

### 4.2 Cached Status Query

Returns the most recent signed status certificate without triggering vehicle hardware. Sub-second response.

**Endpoint**
```
GET /verify/status/{vin}
```

**Response — Success (200)**
```json
{
  "result": "success",
  "proof_type": "cached",
  "vin": "1HGBH41JXMN109186",
  "status": "ACTIVE",
  "cache_generated_at": "2026-03-28T06:00:00Z",
  "cache_expires_at": "2026-03-29T06:00:00Z",
  "block_height": 4820011,
  "validator_sig": "2f9a...",
  "response_time_ms": 48
}
```

---

### 4.3 Insurer Verification Query

Extended response for the `insurer` role. Includes ownership chain depth and service count.

**Endpoint**
```
POST /verify/insurer
```

**Request**
```json
{
  "vin": "1HGBH41JXMN109186",
  "nonce": "d91a3f7c2b8e4056",
  "policy_ref": "POL-2026-GB-9912341",
  "timestamp": "2026-03-28T11:00:00Z"
}
```

**Response — Success (200)**
```json
{
  "result": "success",
  "proof_type": "live",
  "status": "ACTIVE",
  "disclosed": {
    "status": "ACTIVE",
    "transfer_count": 1,
    "service_count": 3
  },
  "proof_hash": "a3c7...",
  "block_height": 4821200,
  "validator_sig": "6b1e...",
  "generated_at": "2026-03-28T11:00:24Z",
  "proof_latency_ms": 22800
}
```

---

### 4.4 Ownership Transfer

Records a change of ownership. Requires an ownership proof from the current owner (generated by the TN-3 module) and a commitment to the new owner.

**Endpoint**
```
POST /lifecycle/transfer
```

**Request**
```json
{
  "vin": "1HGBH41JXMN109186",
  "current_owner_proof": "eyJhb...",
  "new_owner_commitment": "7f3b9a...",
  "dealer_ref": "DLR-GB-4421-TX9901",
  "timestamp": "2026-03-28T14:00:00Z"
}
```

| Field | Description |
|-------|-------------|
| `current_owner_proof` | ZK proof from TN-3 proving current ownership without revealing identity |
| `new_owner_commitment` | H(new_owner_secret ∥ salt) — no PII transmitted |
| `dealer_ref` | Licensed dealer reference, matched against VGM-1 registry |

**Response — Success (200)**
```json
{
  "result": "success",
  "event": "OWNERSHIP_TRANSFER",
  "vin": "1HGBH41JXMN109186",
  "new_transfer_count": 2,
  "tx_hash": "0xb2f4a...",
  "block_height": 4821500,
  "timestamp": "2026-03-28T14:00:31Z"
}
```

---

### 4.5 Flag Stolen

Law enforcement writes a `STOLEN` flag to the on-chain record.

**Endpoint**
```
POST /lifecycle/flag-stolen
```

**Request**
```json
{
  "vin": "1HGBH41JXMN109186",
  "reporting_agency": "MPS-LDN-CR7",
  "incident_ref": "CR/2026/07/19291",
  "jurisdiction": "GB-ENG",
  "officer_credential": "eyJhb...",
  "timestamp": "2026-03-28T16:45:00Z"
}
```

**Response — Success (200)**
```json
{
  "result": "success",
  "event": "FLAG_STOLEN",
  "vin": "1HGBH41JXMN109186",
  "status": "STOLEN",
  "tx_hash": "0xa91c...",
  "block_height": 4821700,
  "timestamp": "2026-03-28T16:45:08Z",
  "note": "Cached status certificates for this VIN are now invalidated. TTL for stolen updates: 1 hour."
}
```

---

### 4.6 Decommission

Marks a vehicle as end-of-life, total loss, or salvage. Can be called by an authorised manufacturer, insurer (total loss), or government authority.

**Endpoint**
```
POST /lifecycle/decommission
```

**Request**
```json
{
  "vin": "1HGBH41JXMN109186",
  "reason": "total_loss",
  "authority_credential": "eyJhb...",
  "insurer_claim_ref": "CLM-2026-UK-442291",
  "timestamp": "2026-03-28T17:30:00Z"
}
```

| `reason` | Meaning |
|----------|---------|
| `end_of_life` | Vehicle scrapped at certified end-of-life facility |
| `total_loss` | Insurance write-off — vehicle beyond economic repair |
| `salvage` | Parts-only salvage, identity record closes |
| `export_deregister` | Vehicle permanently exported, identity record closed in source jurisdiction |

**Response — Success (200)**
```json
{
  "result": "success",
  "event": "DECOMMISSION",
  "vin": "1HGBH41JXMN109186",
  "status": "DECOMMISSIONED",
  "reason": "total_loss",
  "tx_hash": "0xf32b...",
  "block_height": 4821850,
  "timestamp": "2026-03-28T17:30:12Z"
}
```

---

### 4.7 Hardware Recovery Endpoints

Node replacement for legitimate hardware failure, manufacturer recall, or accidental damage. The full procedure is defined in `hardware-recovery.md`. These three endpoints map to the steps of that procedure.

Recovery requires a minimum number of surviving nodes plus institutional co-signatures. No single party can authorise a key rotation unilaterally.

| Scenario | Surviving Nodes | Required Authorisations |
|----------|----------------|------------------------|
| Single node failure | 2 of 3 | 2 surviving nodes + OEM + Dealer |
| Two node failure | 1 of 3 | 1 surviving node + OEM + Insurer + Government |
| All nodes lost | 0 of 3 | No recovery — Decommission only |

---

#### 4.7.1 Initiate Recovery Session

Called by an authorised dealer to open a recovery session. Returns a session nonce that the surviving nodes must sign in Step 2.

**Endpoint**
```
POST /recovery/initiate
```

**Request**
```json
{
  "vin": "1HGBH41JXMN109186",
  "failed_node": "EN-1",
  "failure_type": "hardware_failure",
  "dealer_credential": "eyJhb...",
  "oem_work_order": "WO-2026-GB-77412",
  "timestamp": "2026-03-28T10:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `vin` | string(17) | ISO 3779 VIN of the vehicle being recovered |
| `failed_node` | string | One of: `EN-1`, `CN-2`, `TN-3`. For two-node failure, use comma-separated: `"EN-1,CN-2"` |
| `failure_type` | string | One of: `hardware_failure`, `recall_replacement`, `accidental_damage` |
| `dealer_credential` | JWT | Authorised dealer VAP-1 credential |
| `oem_work_order` | string | Manufacturer-issued work order reference |
| `timestamp` | ISO 8601 | Request timestamp |

**Response — Success (200)**
```json
{
  "result": "success",
  "session_id": "REC-2026-0328-77412",
  "recovery_nonce": "f4c91a3b2e870d56c1984f2a",
  "session_type": "single_node",
  "failed_node": "EN-1",
  "surviving_nodes": ["CN-2", "TN-3"],
  "required_authorisations": ["oem", "dealer"],
  "session_ttl_hours": 24,
  "expires_at": "2026-03-29T10:00:00Z"
}
```

The `recovery_nonce` must be signed by all surviving nodes. The signed proofs are submitted in Step 3 (`/recovery/complete`). The session expires at `expires_at` — an expired session returns `RECOVERY_SESSION_EXPIRED` and the procedure must restart.

---

#### 4.7.2 OEM Authorisation

The original vehicle manufacturer authorises the key rotation. This attests the replacement is a legitimate warranty or recall action. Required for all recovery scenarios.

For two-node recovery, additional authorisations from the insurer and government authority must also be collected before calling `/recovery/complete`. These are submitted as additional signed JWT tokens in the completion request.

**Endpoint**
```
POST /recovery/authorise-oem
```

**Request**
```json
{
  "session_id": "REC-2026-0328-77412",
  "oem_credential": "eyJhb...",
  "replacement_part_serial": "ECU-NXP-SN-GH991122",
  "timestamp": "2026-03-28T11:30:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | Session ID from `/recovery/initiate` |
| `oem_credential` | JWT | Manufacturer VAP-1 credential (`manufacturer` role) |
| `replacement_part_serial` | string | Serial number of the new SE chip being installed |
| `timestamp` | ISO 8601 | Authorisation timestamp |

**Response — Success (200)**
```json
{
  "result": "success",
  "session_id": "REC-2026-0328-77412",
  "oem_authorisation_recorded": true,
  "pending_authorisations": [],
  "ready_to_complete": true,
  "note": "OEM authorisation recorded. Session ready for /recovery/complete."
}
```

For two-node recovery sessions, `pending_authorisations` will list the additional parties still required (e.g., `["insurer", "government"]`) and `ready_to_complete` will be `false` until all are collected.

---

#### 4.7.3 Complete Key Rotation

Submits the surviving node proofs, all collected authorisations, and the new chip's public key. Triggers the `NODE_KEY_ROTATION` on-chain transaction.

**Endpoint**
```
POST /recovery/complete
```

**Request — Single Node Recovery**
```json
{
  "session_id": "REC-2026-0328-77412",
  "surviving_node_proofs": "eyJhb...",
  "oem_authorisation": "eyJhb...",
  "new_node_public_key": "3f7a9c2b8e1d4056af91bc4d",
  "timestamp": "2026-03-28T13:00:00Z"
}
```

**Request — Two-Node Recovery (additional fields)**
```json
{
  "session_id": "REC-2026-0328-88821",
  "surviving_node_proofs": "eyJhb...",
  "oem_authorisation": "eyJhb...",
  "insurer_authorisation": "eyJhb...",
  "government_authorisation": "eyJhb...",
  "new_node_public_keys": {
    "EN-1": "3f7a9c2b8e1d4056af91bc4d",
    "CN-2": "a12f8b3c9d2e7041bc56fe83"
  },
  "timestamp": "2026-03-29T09:00:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | Session ID from `/recovery/initiate` |
| `surviving_node_proofs` | JWT | ZK proof that surviving nodes signed the recovery nonce |
| `oem_authorisation` | JWT | OEM authorisation from `/recovery/authorise-oem` |
| `insurer_authorisation` | JWT | Required for two-node recovery only |
| `government_authorisation` | JWT | Required for two-node recovery only |
| `new_node_public_key` / `new_node_public_keys` | hex / object | New Ed25519 public key(s) for the replacement chip(s) |

**Response — Success (200)**
```json
{
  "result": "success",
  "event": "NODE_KEY_ROTATION",
  "session_id": "REC-2026-0328-77412",
  "vin": "1HGBH41JXMN109186",
  "rotation_type": "single_node",
  "rotated_node": "EN-1",
  "tx_hash": "0xe4a72c...",
  "block_height": 4822100,
  "timestamp": "2026-03-28T13:00:18Z",
  "note": "NODE_ROTATION event is permanently recorded in the vehicle history and visible to law enforcement and government queries."
}
```

---

## 5. Error Responses

All errors use standard HTTP status codes with a consistent body:

```json
{
  "error": "UNAUTHORISED_ROLE",
  "message": "Insurer queries require role credential: insurer",
  "code": 403,
  "timestamp": "2026-03-28T09:00:00Z"
}
```

| Code | Error | Description |
|------|-------|-------------|
| 400 | `INVALID_VIN` | VIN does not match ISO 3779 format |
| 400 | `MISSING_NONCE` | Live proof requests require a unique nonce |
| 401 | `INVALID_CREDENTIAL` | Role credential is missing, expired, or invalid signature |
| 403 | `UNAUTHORISED_ROLE` | Requester role does not have access to this endpoint or data field |
| 404 | `VIN_NOT_FOUND` | VIN is not registered in the ShieldVIN system |
| 409 | `STATUS_CONFLICT` | Lifecycle operation conflicts with current vehicle status |
| 429 | `RATE_LIMIT` | Query rate limit exceeded for this credential |
| 502 | `NETWORK_UNAVAILABLE` | Midnight Network validator set temporarily unreachable |
| 504 | `PROOF_TIMEOUT` | Vehicle TN-3 did not respond within the proof window (60s) |
| 400 | `RECOVERY_SESSION_EXPIRED` | Recovery session TTL has elapsed (24h single node, 72h two node). Restart the procedure. |
| 400 | `RECOVERY_INSUFFICIENT_SIGNATURES` | `/recovery/complete` submitted before all required authorisations were collected |
| 403 | `RECOVERY_RATE_LIMIT` | Maximum node rotations for this VIN reached (2 per 12 months). Government authority sign-off required for a third rotation. |
| 409 | `RECOVERY_NODE_MISMATCH` | Surviving node proofs do not match nodes recorded as surviving at session initiation |

---

## 6. Rate Limits

| Role | Cached queries/min | Live proof/hr | Lifecycle writes/hr |
|------|--------------------|---------------|---------------------|
| `law_enforcement` | 600 | 120 | 20 |
| `insurer` | 300 | 60 | — |
| `dealer` | 120 | 30 | 10 |
| `government` | 1200 | 240 | 50 |
| `owner` | 30 | 5 | 3 |
| `manufacturer` | 3000 | 1000 | 500 |

Rate limits are per-credential, not per-IP. Exceeded limits return HTTP 429 with a `Retry-After` header.

---

## 7. Proof Latency SLA

| Proof type | SLA | Notes |
|------------|-----|-------|
| Live ZK proof | ≤ 30 seconds | Requires active TN-3 connectivity and all 3 nodes responding. Target ≤ 10s on future Midnight proof system upgrades. |
| Cached status | ≤ 1 second | Signed certificate from last live proof. TTL: 24h standard, 1h after stolen flag update. |
| Lifecycle write | ≤ 60 seconds | On-chain transaction confirmation time. |

---

## 8. Privacy Architecture Note

No personally identifiable information is transmitted through this API. Ownership is represented as a cryptographic commitment (hash). Owner identity is resolved off-chain by the relevant authority using their own verified records. The API never returns an owner's name, address, or document number. This design is compliant by construction with GDPR Article 25 (data protection by design).

---

## 9. Versioning

This is **VAP-1 Draft v0.4**. Breaking changes increment the major version (VAP-2). The API path includes the version prefix (`/v1/`). Non-breaking additions are backwards compatible within the same major version.

---

*VAP-1 is a proposed standard subject to review by the VGM-1 governance consortium and the Midnight Network technical team. All field names, endpoint paths, and data structures are subject to change during the technical review process.*
