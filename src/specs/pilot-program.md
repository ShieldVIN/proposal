# ShieldVIN — Pilot Program Design
## Phase 2 Deployment Specification — Draft v0.2

**Status:** Draft — for review
**Date:** 2026-03
**Scope:** Design parameters for the first real-world deployment of ShieldVIN on a limited vehicle production run

---

## 1. Objectives

The pilot program has three purposes:

1. **Technical validation** — prove the ZK proof circuit works correctly on real SE hardware in real vehicles at automotive temperatures, vibration, and connectivity environments
2. **Stakeholder validation** — demonstrate that the VAP-1 API meets the operational needs of at least one law enforcement agency and one major insurer
3. **Standard refinement** — identify where VSE-1, VIT-1, and VAP-1 need adjustment before broad rollout

Success is not volume. Success is zero false positives, working recovery procedures, and at least one active verification use case running in production.

---

## 2. Target Geography

**Recommended first jurisdiction: United Kingdom**

| Factor | Detail |
|--------|--------|
| Vehicle theft rate | ~130,000 vehicles stolen per year (DVLA/police data). High enough to generate real stolen vehicle test cases. |
| Regulatory environment | DVLA is a single national registry — one integration point. UK data protection (UK GDPR post-Brexit) is aligned with EU GDPR but is a single regulator. |
| Insurance industry | UK insurance market is concentrated (top 10 insurers cover ~80% of market). Fewer integration points for pilot. |
| Law enforcement | Single national police API framework (Police National Computer). Defined point of contact. |
| Manufacturer presence | Toyota Manufacturing UK (Burnaston, Derby) produces the Corolla and RAV4 for European markets — existing SE chip supply chain in automotive Tier 1 suppliers already present in the UK supply chain. |

Alternative: **South Africa** — highest vehicle theft rate globally, strong insurer industry motivation, single regulatory entry point. Higher operational complexity than UK but higher impact signal.

---

## 3. Vehicle Selection

**Target: 10,000–20,000 vehicles on a single model line**

Criteria:
- Single model, single factory — minimises the number of production line integrations
- High-volume model with existing insurer and fleet operator relationships
- Model already in production (no new vehicle design required — SE chip integration is a manufacturing addition)

The SE chips integrate at the body-in-white stage (CN-2, chassis node) and during ECU build (EN-1, engine node) and telematics module assembly (TN-3). These are existing assembly steps — the addition is the chip installation and the key generation ceremony.

---

## 4. Manufacturing Integration

### 4.1 SE Chip Installation

Three chips are installed at three separate stages of the production line:

| Stage | Node | Assembly Point | Integration Type |
|-------|------|---------------|-----------------|
| Body-in-white | CN-2 | A-pillar weld zone, firewall | Chip bonded to structural chassis, encased in tamper-evident epoxy before body painting |
| Powertrain assembly | EN-1 | ECU housing, engine bay | Chip installed inside sealed ECU enclosure |
| Final trim | TN-3 | Telematics module, behind dashboard | Chip integrated into existing telematics module assembly |

### 4.2 Key Generation Ceremony

After all three chips are installed and the vehicle is at end-of-line:

1. A dedicated end-of-line station sends a **key generation challenge** to all three nodes simultaneously
2. Each node generates its Ed25519 keypair internally — the private key never leaves the chip
3. Each node returns its public key and a self-attestation signature
4. The station verifies all three self-attestation signatures
5. The station assembles the mint payload: VIN + hashes of all three public keys + build spec
6. The mint transaction is submitted to the Midnight Network testnet (Phase 1) or mainnet (Phase 2+)
7. The minted VIT token ID is recorded in the vehicle's build record

This process adds approximately 45–90 seconds to end-of-line cycle time — within acceptable automotive production tolerances.

### 4.3 Build Record Integration

The mint transaction links to the manufacturer's existing build record system via the `buildSpecHash` field (SHA-256 hash of the full build specification document). This provides a tamper-evident anchor between the on-chain token and the off-chain build record — without putting the build record content on-chain.

---

## 5. Stakeholder Integrations for Pilot

### 5.1 Law Enforcement — UK Police

**Integration target:** Police National Computer (PNC) via the National Police Chiefs' Council (NPCC) technology directorate.

**Use case:** Roadside check. Officer queries VIN via certified app → receives ACTIVE / STOLEN / FLAGGED within cached status SLA. For live proof: officer requests full ZK proof from vehicle hardware.

**Pilot metric:** 500 roadside queries in 90 days. Zero false positives. Comparison of detection rate against current PNC-only checks for the same vehicles.

### 5.2 Insurance — Primary Insurer Partner

**Integration target:** One UK Tier 1 insurer (Admiral, Aviva, or Direct Line preferred — combined they cover ~35% of UK private motor policies).

**Use cases:**
- Policy inception: identity check when a new policy is issued
- Claim intake: identity verification at first notification of loss
- Total loss: decommission workflow

**Pilot metric:** All new policies for the pilot model line verified via ShieldVIN API at inception. Claim comparison data at 12-month review.

### 5.3 Dealer Network

**Integration target:** OEM-authorised dealer network for the pilot manufacturer.

**Use cases:**
- Used vehicle sale: ownership transfer via VAP-1
- Service record: service event appended to lifecycle log

---

## 6. Technical Infrastructure for Pilot

### 6.1 Network

Pilot runs on **Midnight Network mainnet** (not testnet — testnet data is ephemeral and cannot serve as legal evidence in a stolen vehicle prosecution).

### 6.2 API Infrastructure

VAP-1 API hosted in UK data centres (AWS eu-west-2 / Azure UK South). Single-region for pilot — multi-region at Phase 3.

### 6.3 TN-3 Connectivity

Telematics modules require network connectivity to respond to live proof requests. Pilot vehicles must have active telematics subscriptions. Coverage gaps are handled by the VAP-1 cached status fallback (Section 4.2 of VAP-1 spec).

### 6.4 Certification App

A certified law enforcement verification app (iOS and Android) is required for the pilot. This is a thin API client — it authenticates with a device-bound law enforcement credential and displays the VAP-1 response in a clear ACTIVE / STOLEN / FLAGGED format. It does not store verification results locally beyond the session.

---

## 7. Data Collection and Evaluation

### 7.1 Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| False positive rate | 0% | Any ACTIVE vehicle returned as STOLEN or FAILED |
| False negative rate | < 1% | Known stolen vehicles that returned ACTIVE |
| Live proof latency | ≤ 30s (p95) | VAP-1 API response time logs |
| Cached status latency | ≤ 1s (p99) | VAP-1 API response time logs |
| Recovery success rate | 100% | All legitimate node replacements completing within 72h |
| Uptime | ≥ 99.5% | VAP-1 API availability |

### 7.2 Privacy Audit

At 6 months, an independent privacy audit reviews whether any personal data has been inadvertently captured in API logs, monitoring systems, or operational records. The audit is required before Phase 3 expansion.

### 7.3 Stakeholder Review

At 12 months, a formal review with law enforcement, insurer, and dealer representatives assesses:
- Operational fit (does the workflow integrate naturally with existing processes?)
- Data adequacy (does the disclosed data meet the use case, or do stakeholders need more or less?)
- Standard gaps (what in VSE-1, VIT-1, VAP-1 needs revision?)

---

## 8. Go/No-Go Criteria for Phase 3

Phase 3 (multi-manufacturer rollout) proceeds when:

| Criterion | Threshold |
|-----------|-----------|
| False positive rate | 0% over the pilot period |
| Stolen vehicle identification | At least 1 confirmed stolen vehicle detected that would have passed conventional PNC checks |
| Insurer adoption | At least 1 insurer integrating ShieldVIN into their standard policy workflow (not just pilot) |
| Recovery procedure | At least 1 legitimate node replacement completed successfully |
| Privacy audit | Clean — no personal data captured in infrastructure |
| Stakeholder sign-off | Law enforcement, insurer, and OEM partners all confirm readiness to scale |

---

*This document is a proposed pilot design. Final parameters are subject to agreement with the participating manufacturer, law enforcement agency, insurer, and Midnight Network. Regulatory approval in the target jurisdiction is required before deployment.*
