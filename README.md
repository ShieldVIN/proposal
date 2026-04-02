# ShieldVIN

**Cryptographic vehicle identity on Midnight Network — concept proposal**

ShieldVIN embeds three tamper-resistant Secure Element chips into new vehicles at manufacture. All three must cryptographically co-sign every identity proof. VIN cloning and chassis number fraud become permanently impossible on new vehicles.

> This is an active concept proposal directed at Midnight Network. It is not a deployed product.

**[View the live site →](https://mrjustjinx.github.io/shieldvin_midnight/)**

---

## Live Documents

| Document | Description |
|----------|-------------|
| [Landing Page](https://mrjustjinx.github.io/shieldvin_midnight/) | Project overview and navigation hub |
| [One-Page Summary](https://mrjustjinx.github.io/shieldvin_midnight/shieldvin-summary.html) | Cold introduction — chips, proof flow, stakeholder access, revenue |
| [Interactive Demo](https://mrjustjinx.github.io/shieldvin_midnight/shieldvin-demo.html) | Run a live verification for each stakeholder role and vehicle scenario |
| [Full Whitepaper](https://mrjustjinx.github.io/shieldvin_midnight/whitepaper.html) | 15-section business plan and technical proposal |
| [Market Opportunity](https://mrjustjinx.github.io/shieldvin_midnight/market-opportunity.html) | Toyota · BYD · Ford US adoption scenarios with live revenue modelling |

---

## The Problem

Over $20 billion is lost globally each year to vehicle theft and VIN fraud. A VIN is just a number stamped on a metal plate — anyone with basic equipment can copy it. Current systems (NMVTIS, HPI, Carfax) are reactive databases. They record fraud after it has happened. There is no cryptographic link between a physical vehicle and its identity record.

## The Solution

Three Secure Element chips, embedded in physically separate locations at manufacture:

| Node | Location | Keypair | Tamper Response |
|------|----------|---------|-----------------|
| **EN-1** Engine Node | ECU housing, engine bay | Independent Ed25519 — generated in-chip | Key wipe on ECU breach |
| **CN-2** Chassis Node | A-pillar / structural firewall | Independent Ed25519 — generated in-chip | Alert + key wipe on frame cut |
| **TN-3** Telematics Node | Behind dashboard | Independent Ed25519 — generated in-chip | Manufacturer alert + key wipe |

All three must co-sign every identity proof. Remove any one chip and the proof fails. There is no master key — each chip independently generates and holds its own keypair. Defeating the system requires simultaneously compromising three chips embedded in structurally different parts of the vehicle.

The vehicle's identity is minted as a token on **Midnight Network** using zero-knowledge proofs. Each stakeholder (police, insurer, dealer, government, owner) receives a proof disclosing only their authorised fields. No personal data is stored on-chain.

---

## Repository Structure

```
shieldvin/
├── src/
│   ├── html/
│   │   ├── index.html                   ← GitHub Pages landing page
│   │   ├── shieldvin-summary.html       ← One-page visual summary
│   │   ├── shieldvin-demo.html          ← Interactive verification demo
│   │   └── whitepaper.html              ← Full 15-section whitepaper
│   ├── charts/
│   │   └── market-opportunity.html      ← Toyota/BYD/Ford market analysis
│   ├── docs/
│   │   └── build_docx.js               ← Word document builder (Node.js)
│   ├── excel/
│   │   └── build_excel.py              ← Excel financial model builder (Python)
│   ├── contracts/
│   │   └── vehicle_identity.compact    ← Compact ZK contract stub (design intent)
│   └── specs/
│       ├── VAP-1.md                    ← Verification API & Protocol draft spec
│       ├── hardware-recovery.md        ← Hardware failure & node recovery
│       ├── privacy-architecture.md     ← Off-chain PII architecture, GDPR/CCPA
│       ├── competitor-analysis.md      ← Platform comparison (Ethereum, Cardano, Hedera, Polygon)
│       └── pilot-program.md            ← Phase 2 pilot design (UK, 10–20k vehicles)
├── scripts/
│   └── build.sh                        ← Builds Word and Excel outputs
├── dist/                               ← Generated outputs (gitignored — run build to populate)
├── .github/
│   ├── workflows/
│   │   └── deploy.yml                  ← GitHub Pages auto-deploy on push to main
│   └── ISSUE_TEMPLATE/
│       ├── content-update.md           ← Template for content correction requests
│       └── technical-bug.md            ← Template for code/build issues
├── package.json
└── requirements.txt
```

---

## Industry Framework Standards

ShieldVIN proposes four standards as part of a W3C-style industry consortium (VGM-1):

| Standard | Name | Scope |
|----------|------|-------|
| **VSE-1** | Vehicle Secure Element Standard | Hardware specification for SE chips |
| **VIT-1** | Vehicle Identity Token Standard | On-chain data structure |
| **VAP-1** | Verification API & Protocol | Query/response format across stakeholders |
| **VGM-1** | Governance Model | Industry consortium rules and decision process |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Midnight Network (PLONK/KZG ZK proofs, Cardano partner chain) |
| Smart contracts | Compact DSL (`src/contracts/vehicle_identity.compact`) |
| ZK proof system | PLONK + KZG polynomial commitments, BLS12-381 + JubJub curves |
| Hardware | Secure Element chips — independent Ed25519 keypairs generated in-chip |
| Document generation | `docx` (Node.js), `openpyxl` (Python) |

---

## Building the Documents

### Prerequisites

```bash
node --version    # v18 or higher
python3 --version # v3.8 or higher
npm install
pip install openpyxl
```

### Build all outputs

```bash
bash scripts/build.sh
```

### Build individually

```bash
node src/docs/build_docx.js      # → dist/ShieldVIN_BusinessPlan.docx
python src/excel/build_excel.py  # → dist/ShieldVIN_Financial_Model.xlsx
```

The HTML files in `src/html/` are self-contained — open them directly in any browser. No build step required.

---

## GitHub Pages

The three HTML documents are automatically deployed to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`. The live site serves from `src/html/`.

---

## Author

**MJ Krugell** — concept originator and proposal author.

---

## Status

Concept proposal — draft/review stage. Targeting Midnight Network as primary audience.

---

## License

© 2026 MJ Krugell. All rights reserved. Concept proposal — not licensed for commercial use without permission.
