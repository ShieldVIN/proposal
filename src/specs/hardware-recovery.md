# ShieldVIN — Hardware Failure & Legitimate Node Recovery
## Specification Draft v0.2

**Status:** Draft — for review
**Date:** 2026-03

---

## 1. Why This Matters

The 3-of-3 co-signature design is the security backbone of ShieldVIN. Any node missing or tampered with causes proof failure by design. This is correct behaviour for a stolen or cloned vehicle. But it creates a genuine problem for legitimate vehicle owners:

- **Electronic component failure** — SE chips fail, ECUs are replaced, telematics modules are swapped
- **Manufacturer recall** — OEM replaces the ECU or telematics module under warranty
- **Accidental damage** — fire or flood damages one node
- **Approved export** — a vehicle is exported; it re-registers in another jurisdiction under a different regulatory system

Without a defined recovery process, a legitimate owner faces a vehicle that fails identity verification after an authorised repair. The recovery procedure must be:

1. **Impossible to abuse** — cannot become a laundering path for cloned VINs
2. **Accessible to legitimate owners** — a genuine repair should not brick a vehicle's identity
3. **Auditable** — every recovery is on-chain, visible to law enforcement

---

## 2. The Trust Hierarchy

Recovery requires a minimum number of surviving nodes plus a threshold of institutional signatures. This is a deliberate multi-party design: no single entity can authorise a key replacement unilaterally.

| Scenario | Surviving Nodes | Required Signatories |
|----------|----------------|----------------------|
| Single node failure (routine) | 2 of 3 | 2 surviving nodes + Manufacturer OEM + Dealer |
| Two node failure (fire/flood) | 1 of 3 | 1 surviving node + Manufacturer OEM + Insurer + Government authority |
| All nodes lost (total destruction) | 0 of 3 | → **Cannot recover** → Decommission only (see Section 5) |

The surviving nodes co-sign the recovery request. Their signatures prove the vehicle is the same physical chassis that was registered — they provide the cryptographic continuity.

---

## 3. Single Node Recovery Procedure

**Typical scenario:** ECU replaced under manufacturer warranty. EN-1 (Engine Node) is the failed chip.

### Step 1 — Initiate Recovery Request

The authorised dealer initiates a recovery request via the VAP-1 API:

```json
POST /recovery/initiate
{
  "vin": "1HGBH41JXMN109186",
  "failed_node": "EN-1",
  "failure_type": "hardware_failure",
  "dealer_credential": "...",
  "oem_work_order": "WO-2026-GB-77412",
  "timestamp": "2026-03-28T10:00:00Z"
}
```

The API creates a **recovery session** with a unique nonce and a 24-hour TTL.

### Step 2 — Surviving Nodes Co-Sign the Session

The two surviving nodes (CN-2 and TN-3) sign the recovery session nonce. This produces a partial proof — not a full identity proof, but a proof that the surviving hardware is present and has not been tampered with. This co-signature is the vehicle vouching for itself.

### Step 3 — OEM Manufacturer Authorisation

The vehicle manufacturer (identified by the `factoryCode` in the original token) must sign the recovery request with their governance credential. This is the manufacturer attesting: "this is a legitimate warranty replacement, not a fraud attempt."

```json
POST /recovery/authorise-oem
{
  "session_id": "REC-2026-0328-77412",
  "oem_credential": "...",
  "replacement_part_serial": "ECU-NXP-SN-GH991122",
  "timestamp": "2026-03-28T11:30:00Z"
}
```

### Step 4 — Dealer Completes Physical Replacement

The dealer installs the new SE chip. The new chip generates a fresh Ed25519 keypair during manufacture (in-situ key generation — the private key never leaves the chip). The new public key is extracted and included in the completion report.

### Step 5 — Key Rotation on Chain

With all three signatures collected (2 surviving nodes + OEM), a `NODE_KEY_ROTATION` transaction is submitted to the Midnight Network. This is a ZK proof that:
- The surviving nodes signed the session nonce (physical continuity)
- The OEM authorised the replacement (institutional continuity)
- The new public key replaces the failed node's key in the VIT token

```json
POST /recovery/complete
{
  "session_id": "REC-2026-0328-77412",
  "surviving_node_proofs": "...",
  "oem_authorisation": "...",
  "new_en1_public_key": "3f7a...",
  "timestamp": "2026-03-28T13:00:00Z"
}
```

The token is updated on-chain. A `NODE_ROTATION` event is appended to the vehicle's event log, visible to law enforcement and government.

### Step 6 — Verification Resumes

The vehicle can now pass full 3-of-3 verification with the new chip. The event log shows the rotation — it is not hidden. A police officer or insurer querying the vehicle will see that a node rotation occurred.

---

## 4. Two-Node Recovery (Major Damage)

**Typical scenario:** Vehicle fire damages the engine bay. Both EN-1 and the ECU housing CN-2's chassis node are destroyed. TN-3 in the dashboard survives.

This scenario requires a higher institutional threshold:

| Required | Party |
|----------|-------|
| Surviving node proof | TN-3 |
| OEM authorisation | Original manufacturer |
| Insurance claim confirmation | Insurer holding the policy |
| Government authority | DVLA/DMV/transport authority |

All four signatures must be collected within a 72-hour recovery window. The on-chain event is marked `TWO_NODE_ROTATION` and is permanently visible in the vehicle history. Any future verification query will surface this event.

**Risk note:** Two-node recovery is the highest-risk legitimate scenario. It is also the scenario a fraudster might attempt to exploit (e.g. by deliberately damaging two nodes of a stolen vehicle). The addition of insurer confirmation and government authority sign-off is specifically designed to close this attack surface — a stolen vehicle will not have a valid active insurance policy that the insurer can confirm.

---

## 5. Total Loss — No Recovery Path

If all three nodes are destroyed or completely unresponsive (0 of 3 surviving), there is **no recovery path**. The vehicle cannot prove its own physical identity. The correct outcome is decommissioning, not recovery.

This is not a flaw — it is the security property working correctly. A total loss is handled by:

1. Insurer adjudicates the claim against the cached on-chain record
2. A `DECOMMISSION` transaction is written by the insurer + government authority
3. The VIT token status is set to `DECOMMISSIONED`
4. Ownership, title records, and insurance claims are resolved off-chain using the on-chain record as the canonical evidence

This mirrors how a total-loss vehicle is handled today — the vehicle is written off and title is retired. The difference is that the blockchain record provides the adjudication audit trail.

---

## 6. Recall Replacement (OEM-Initiated)

When a manufacturer issues a recall that involves replacing an SE chip:

1. The manufacturer broadcasts a `RECALL_FLAG` via the VAP-1 lifecycle API to all affected VINs
2. At point of recall service, the dealer follows the standard single-node recovery procedure (Section 3)
3. The on-chain event is marked `RECALL_ROTATION` rather than `NODE_ROTATION` — distinct event type, same proof structure

---

## 7. Anti-Abuse Controls

The recovery process includes several controls to prevent it from becoming a fraud vector:

| Control | Description |
|---------|-------------|
| Surviving node requirement | Recovery requires at least one original chip to be present and functional. This proves physical continuity with the registered vehicle. |
| OEM-only authorisation | Only the original manufacturer can sign a key rotation. A third-party mechanic cannot. |
| Recovery TTL | Recovery sessions expire in 24 hours (single node) or 72 hours (two node). Expired sessions are rejected. |
| Event log visibility | Every NODE_ROTATION is permanently visible to law enforcement and government. A pattern of multiple rotations on the same VIN is a red flag. |
| Rate limit | Maximum two node rotations per vehicle per 12-month period. A third rotation in 12 months requires government authority sign-off. |
| Cross-reference check | The VGM-1 governance system cross-references recovery events against insurance claims, police reports, and border crossing records for the same VIN. Anomalies are flagged for human review. |

---

*This document is a proposed specification subject to review by the VGM-1 governance consortium, participating OEM manufacturers, and the Midnight Network technical team.*
