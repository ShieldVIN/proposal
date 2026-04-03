# ⚠️ MIDNIGHT NETWORK — TECHNICAL REVIEW QUESTIONS
## Questions Requiring Midnight Team Input Before Production Build

**Status:** OPEN — awaiting Midnight Network engineering team  
**Date raised:** 2026-04-03  
**Priority:** Must resolve before platform build begins  

These three questions cannot be answered from public documentation or the GitHub source alone. They require direct input from the Midnight Network engineering team at the first technical meeting.

---

## QUESTION 1 — Ed25519 In-Circuit Chip Signature Verification

### What is the question?
The three SE chips (EN-1, CN-2, TN-3) sign using **Ed25519** — the industry-standard algorithm for hardware security modules. The Compact Standard Library does **not** have a built-in `verifyEd25519()` function.

This means the ZK proof can confirm that the chip *public keys* match the ones registered on-chain, but cannot currently verify that the chips actually *signed the session nonce* inside the circuit. Full cryptographic proof of chip liveness requires in-circuit signature verification.

### Current interim approach (PATH B)
The contract uses a hash-commitment workaround: chips produce `persistentHash(pubkey ∥ nonce)` instead of a raw signature. The circuit verifies the commitment. This is buildable today and provides a useful level of assurance, but is weaker than a full Ed25519 verification.

### Three resolution paths — need Midnight team to confirm which to pursue

| Path | Description | Status |
|------|-------------|--------|
| **PATH A** | Wait for `verifyEd25519()` to be added to CompactStandardLibrary as a built-in | Depends on Midnight roadmap |
| **PATH B** | Hash-commitment interim (current contract design) — chips produce `persistentHash(pubkey∥nonce)` | Buildable today — already in contract |
| **PATH C** | Switch SE chip firmware to use JubJub (Midnight's native Edwards curve) instead of Ed25519, enabling native in-circuit verification | Requires SE chip firmware change + manufacturer cooperation |

### Questions for Midnight team
1. Is `verifyEd25519()` on the Compact Standard Library roadmap? If so, what is the target release timeframe?
2. Is PATH B (hash commitment) considered cryptographically acceptable as an interim for a production deployment?
3. Is PATH C (JubJub-native SE chips) technically viable with current SE chip manufacturers (NXP, Infineon, STMicroelectronics)?
4. Are there other approaches the Midnight team would recommend?

---

## QUESTION 2 — Per-Role Circuit Design Pattern at Production Scale

### What is the question?
The ShieldVIN contract uses **5 separate circuits** — one per stakeholder role — each disclosing a different set of fields:

| Circuit | Role | Disclosed Fields |
|---------|------|-----------------|
| `verifyPolice()` | Law Enforcement | status; VIN only if STOLEN |
| `verifyInsurer()` | Insurance / Finance | status, transferCount, serviceCount, lastRecordedMileage, lastMilestoneTimestamp |
| `verifyDealer()` | Dealer / Service Centre | status, transferCount, serviceCount, lastRecordedMileage, lastMilestoneTimestamp |
| `verifyGovernment()` | Government / DMV | status, VIN, transferCount, lastRecordedMileage, lastMilestoneTimestamp |
| `verifyOwner()` | Registered Owner | full record |

This is the confirmed Compact pattern — a single circuit **cannot** conditionally disclose different fields to different roles at runtime. Separate circuits per role is the architecture we have implemented.

### Why this needs confirmation
At production scale, the number of roles could grow (e.g. border agency, fleet operator, finance lender as a distinct role, recall authority). Each new role requires a new circuit. The question is whether this is the correct and recommended pattern, or whether there is a more efficient architecture the Midnight team would suggest for a multi-role enterprise deployment.

### Questions for Midnight team
1. Is the separate-circuit-per-role pattern confirmed as the correct production approach in Compact?
2. Is there a more efficient alternative — e.g. a parameterised circuit that takes a role credential as a private witness and dispatches disclosure accordingly?
3. Are there any circuit count limits or deployment constraints we should be aware of for a contract with 10+ circuits?
4. What is the recommended pattern for adding roles over time without breaking existing deployed contracts?

---

## QUESTION 3 — One Contract Per Vehicle vs. Registry Contract Architecture

### What is the question?
There are two viable architectures for how ShieldVIN data is stored on Midnight Network:

### Option A — One Contract Per Vehicle (current stub approach)
Each vehicle gets its own deployed contract instance. The constructor = the minting event.

```compact
// Each vehicle = one deployed contract
export ledger vin: Bytes<17>;
export ledger status: VehicleStatus;
export ledger ownershipHash: Bytes<32>;
// etc.
```

**Pros:** Clean isolation per vehicle. Simple per-vehicle access control. Bug in one contract doesn't affect others.  
**Cons:** 80M+ contract deployments per year at global scale. Higher deployment overhead. More complex fleet querying.

### Option B — Registry Contract (recommended for scale)
One contract holds all vehicles in Maps keyed by VIN hash.

```compact
// One contract, all vehicles
export ledger vinRegistry:    Map<Bytes<32>, Boolean>;
export ledger vehicleStatus:  Map<Bytes<32>, VehicleStatus>;
export ledger ownershipStore: Map<Bytes<32>, Bytes<32>>;
export ledger mileageStore:   Map<Bytes<32>, Uint<32>>;
// etc.
```

**Pros:** Single deployment. Efficient at scale. Simpler fleet-wide queries.  
**Cons:** Concentrated state — higher stakes if there's a bug. Per-VIN access control inside a shared contract is more complex to design correctly.

### Questions for Midnight team
1. For an enterprise deployment of 10M–80M vehicles, which architecture does the Midnight team recommend?
2. Are there known limits on `Map<K,V>` state size in a single Compact contract?
3. In a registry contract, can per-VIN access control (ensuring only the registered owner can call `transferOwnership` for their VIN) be implemented correctly with the current `ownPublicKey()` primitive?
4. Is there a hybrid approach the team recommends — e.g. per-manufacturer registry contracts rather than one global registry?
5. Can circuits in a registry contract be called with a VIN-scoped context, or does the circuit always operate on the full contract state?

---

## Summary — Actions Required

| # | Question | Who answers | When needed |
|---|----------|-------------|-------------|
| 1 | Ed25519 `verifyEd25519()` roadmap + PATH A/B/C recommendation | Midnight Network engineering | Before production contract finalisation |
| 2 | Per-role circuit pattern confirmation + scalability guidance | Midnight Network engineering | Before platform build begins |
| 3 | One-contract vs registry architecture decision | Midnight Network engineering | Before platform build begins (architecture-defining) |

**Recommended agenda item:** Add these three questions as a standing item for the first ShieldVIN × Midnight Network technical meeting. The current contract stub (`src/contracts/vehicle_identity.compact`) implements working interim answers for all three — the goal is to confirm or replace those interim answers with production-ready decisions.

---

*Raised by ShieldVIN proposal team · 2026-04-03*  
*Contract reference: `src/contracts/vehicle_identity.compact`*
