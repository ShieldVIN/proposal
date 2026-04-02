# ShieldVIN — Competitor & Alternative Platform Analysis
## Why Midnight Network — Draft v0.2

**Status:** Draft — for review
**Date:** 2026-03

---

## 1. Purpose

This document evaluates the credible alternatives to Midnight Network for implementing ShieldVIN, and explains why each falls short of the requirements. It is intended for technical reviewers who will ask: "why not just use Ethereum?" or "couldn't this run on Cardano natively?"

---

## 2. Requirements That Drive the Choice

ShieldVIN has four non-negotiable technical requirements that eliminate most blockchain platforms:

| Requirement | Why It Matters |
|-------------|----------------|
| **Selective disclosure ZK proofs** | Each stakeholder must see only their authorised data — not the same data as every other caller. A public chain where all state is readable by all parties fails immediately. |
| **No PII on-chain by design** | Structural privacy, not just encryption. Encrypted data is still data. A platform must be designed so that the data that would need to be encrypted is never submitted to begin with. |
| **Enterprise-grade confidentiality** | Insurers, police, and manufacturers will not use a system where their query patterns (let alone the data) are visible on a public ledger. |
| **Regulatory acceptability** | GDPR and CCPA compliance must be achievable by architecture, not by bolt-on measures that a regulator can argue around. |

---

## 3. Alternative Analysis

### 3.1 Ethereum (L1)

**Model:** Public, transparent, EVM-based smart contracts. All contract state is publicly readable.

**What it can do:** Token minting (ERC-721), ownership transfers, event logging. Well-understood, large ecosystem, Solidity tooling is mature.

**Why it fails for ShieldVIN:**

| Problem | Detail |
|---------|--------|
| All state is public | Every VIN, ownership hash, transfer event, and query is visible to any node operator. This is not GDPR-compliant if any of that data becomes linkable. |
| Query patterns are public | The fact that insurer X queried VIN Y at time Z is publicly visible. This is commercially sensitive information that insurers will not accept. |
| No role-based selective disclosure | An EVM contract can restrict who can call a function, but it cannot produce a ZK proof that reveals different fields to different callers from the same data. |
| Gas costs at scale | 80 million mints per year at Ethereum mainnet gas costs would be economically infeasible even at low gas prices. |
| Privacy-by-encryption is fragile | ZK-EVM approaches (StarkWare, zkSync, Polygon zkEVM) add ZK proof generation but the underlying state model is still transparent — they prove computation, not data confidentiality. |

**Verdict:** Eliminated. Public state model is structurally incompatible with the privacy requirement.

---

### 3.2 Cardano (native, without Midnight)

**Model:** eUTXO model, Plutus smart contracts (Haskell-based). Cardano is the settlement layer; Midnight is its partner chain.

**What it can do:** Token minting (CNT/CIP-25), UTXO-based ownership. Mature, well-understood.

**Why it falls short:**

| Problem | Detail |
|---------|--------|
| No native ZK proof system | Cardano does not natively generate or verify ZK proofs. ZK verification can be implemented in Plutus scripts, but it is expensive and not optimised for this. |
| Transparent state | Like Ethereum, Cardano's UTXO state is publicly visible. Datum fields in a UTXO are readable by all nodes. |
| No selective disclosure primitive | There is no native Cardano mechanism for producing a proof that discloses different fields to different callers. |
| Regulatory exposure | The same public-ledger PII concerns apply as with Ethereum. |

**Verdict:** Eliminated for the same public-state reasons. Midnight Network was built specifically to solve these problems as a Cardano partner chain — it is the correct layer for this use case.

---

### 3.3 Hedera Hashgraph

**Model:** Directed Acyclic Graph (DAG) consensus, Hashgraph algorithm. Managed by a governing council of major corporations (Google, IBM, Boeing, etc.). Native smart contracts (EVM-compatible). HCS (Hedera Consensus Service) for ordered event logs.

**What it can do:** Fast throughput, low fixed fees, corporate governance model with recognisable names. HCS is used by vehicle data companies (e.g. Avery Dennison, ServiceNow supply chain applications).

**Why it falls short:**

| Problem | Detail |
|---------|--------|
| No native ZK proof system | Hedera does not have a built-in ZK proof layer. ZK circuits can be implemented but there is no optimised ZK DSL or ZKIR — everything is written from scratch in Solidity or custom circuits. |
| Transparent state | Smart contract state on Hedera is publicly readable (EVM-compatible model). |
| No selective disclosure | Same problem as Ethereum. |
| Centralised governance | The Hedera Governing Council controls the network. For a global vehicle identity standard, dependence on a single US-headquartered corporate consortium creates geopolitical and regulatory risk. |
| Vendor lock-in | Hedera's architecture makes it difficult to migrate. VGM-1 governance requires infrastructure independence. |

**What Hedera does well:** HCS would be a reasonable choice for a simple tamper-proof event log — recording "this VIN had this event at this timestamp." But ShieldVIN requires more than a log; it requires privacy-preserving proofs of identity. HCS cannot provide those.

**Verdict:** Not suitable for the ZK proof and selective disclosure requirements. Could potentially be used as a secondary audit log layer in a hybrid architecture, but not as the primary proof layer.

---

### 3.4 Polygon (zkEVM / ID)

**Model:** Ethereum L2 with ZK proof-based rollup (Polygon zkEVM). Polygon ID adds ZK identity credentials (using iden3 circuits and Circom).

**What it can do:** Polygon ID is specifically designed for ZK identity — it generates credentials, issues proofs, and supports selective disclosure of credential attributes. It is actively used for identity verification use cases.

**Why it falls short:**

| Problem | Detail |
|---------|--------|
| Identity model, not physical asset model | Polygon ID is built for human identity credentials (like a digital passport). It is not designed to represent a physical hardware-backed asset where the proof generation happens *on the physical device*. |
| No hardware binding primitive | The 3-of-3 SE chip co-signature is the core innovation. Polygon ID has no concept of a proof that must be co-signed by multiple hardware security modules — it assumes a single credential holder. |
| Ethereum dependency | Polygon ID ultimately settles on Ethereum or an EVM chain. The state visibility concerns from Section 3.1 are not fully resolved. |
| Circom/Groth16 stack | Polygon ID uses Circom + Groth16 proofs. Midnight uses a PLONK proof system with KZG polynomial commitments over BLS12-381 (pairing) and JubJub (Edwards) curves — a universal trusted setup that does not require a new ceremony per circuit. Groth16 requires a per-circuit ceremony — a governance complication for a standard that will evolve. |

**What Polygon ID does well:** The credential issuance model is mature and the developer tooling is good. For a simpler use case (digital driving licence, vehicle insurance certificate), Polygon ID would be a strong option.

**Verdict:** Not suited to hardware-backed multi-party co-signature proofs. The credential model and physical asset model are fundamentally different design spaces.

---

### 3.5 VINchain / Carfax-Adjacent Blockchain Projects

Several blockchain-based vehicle history projects exist: **VINchain** (ERC-20 token, centralised data), **AutoBlock**, **MOBI** (Mobility Open Blockchain Initiative standards body).

**What they do:** Blockchain-anchored vehicle history records — recording service events, ownership transfers, and odometer readings with a tamper-evident ledger.

**Why they are a different category:**

| Problem | Detail |
|---------|--------|
| No hardware binding | These systems record *reported* events — they rely on honest reporting by service centres, dealers, and owners. There is no cryptographic link between the physical vehicle and the record. A bad actor can simply not report a theft or frame a cloned VIN. |
| Reactive, not proactive | Like NMVTIS and Carfax, these systems accumulate history. They cannot prove at the point of a roadside check that *this physical vehicle* is *this registered vehicle*. |
| Public or semi-public state | Most use Ethereum or similar public chains. Privacy limitations apply. |
| Token economics, not identity | Most of these projects are structured around a utility token economy rather than a rigorous identity standard. |

**What they do well:** Fraud-resistant service history and odometer records. They are useful additions to a vehicle's provenance. ShieldVIN's lifecycle event log covers this same ground as a by-product of the identity system.

**Verdict:** Different category. They solve provenance transparency; ShieldVIN solves physical identity. These are complementary, not competing.

---

## 3.6 eIDAS 2.0 — Regulatory Alignment, Not Competition

**eIDAS 2.0** (EU Regulation 2024/1183) is the EU's revised electronic identity framework. It is not a competing technical platform — it is a regulatory and standards framework for digital identity. It is relevant here because ShieldVIN's architecture is explicitly aligned with it.

| eIDAS 2.0 Concept | ShieldVIN Equivalent |
|-------------------|---------------------|
| European Digital Identity Wallet (EUDI Wallet) | TN-3 module / owner wallet credential — device-bound identity |
| Selective disclosure of credential attributes | `disclose()` in Compact — per-role field disclosure enforced in-circuit |
| Verifiable Attestations | Vehicle Identity Token on Midnight Network |
| No unnecessary data to relying parties | Role-based ZK proof — each party receives only their authorised fields |

**Scale context:** eIDAS 2.0 targets 450 million EU users across 4 Large Scale Pilots. Its selective disclosure model validates that ShieldVIN's core design principle — reveal only what is necessary to each party — is the correct regulatory direction for EU deployment.

**Action for Phase 2:** Engage the eIDAS 2.0 working groups (specifically the mdoc/ISO 18013-5 and sd-jwt tracks) to position ShieldVIN's VAP-1 protocol as an automotive-specific attestation scheme within the eIDAS 2.0 framework. This would make ShieldVIN verifiable via any eIDAS 2.0 compliant wallet in the EU — a significant distribution advantage.

---

## 4. Why Midnight Network

Midnight Network is the only production-track platform that provides all four requirements simultaneously:

| Requirement | Midnight Approach |
|-------------|------------------|
| Selective disclosure ZK proofs | Native — the `disclose()` primitive in Compact controls exactly which fields leave the private witness |
| No PII on-chain by design | The architecture separates public state (ledger) from private state (witness). Private witness data never appears in plaintext on the network — only the ZK proof is submitted. |
| Enterprise confidentiality | Query patterns are private. The fact that insurer X queried VIN Y is not visible on-chain. |
| Regulatory acceptability | Privacy-by-design architecture supports GDPR Article 25 compliance by construction. |

Additional factors:

- **Compact DSL** — purpose-built language for ZK circuit development. Lower barrier than writing raw Circom or Rust circuits. TypeScript-familiar syntax for smart contract developers.
- **PLONK proof system** — Midnight uses PLONK with KZG polynomial commitments over BLS12-381 and JubJub curves. KZG's universal trusted setup does not require a new ceremony per circuit — unlike Groth16. This is critical for a standard that will evolve its circuits over time.
- **Cardano partner chain** — inherits Cardano's settlement security and the Ouroboros finality properties. Established ecosystem.
- **Positioning alignment** — Midnight Network is actively seeking enterprise use cases that validate "rational privacy" at real-world scale. ShieldVIN is that use case.

---

*This analysis is a working document for the ShieldVIN proposal. It is intended to demonstrate that alternative platforms were considered and rejected on technical grounds, not by default.*
