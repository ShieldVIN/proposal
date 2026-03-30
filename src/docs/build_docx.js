const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, Header, PageBreak,
  VerticalAlign
} = require('docx');
const fs = require('fs');

const PAGE_WIDTH = 9360;
const PURPLE = '5B21B6';
const CYAN = '0891B2';
const LIGHT_BG = 'F3F0FF';
const CYAN_BG = 'E0F7FA';
const DARK_TEXT = '1E1B4B';
const GRAY = '64748B';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: PURPLE, space: 6 } },
    children: [new TextRun({ text, bold: true, size: 32, color: DARK_TEXT, font: 'Arial' })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: PURPLE, font: 'Arial' })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: '374151', font: 'Arial' })]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, size: 22, color: '374151', font: 'Arial' })]
  });
}

function bold_body(text) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, size: 22, color: DARK_TEXT, font: 'Arial', bold: true })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 21, color: '374151', font: 'Arial' })]
  });
}

function numberedItem(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, color: '374151', font: 'Arial' })]
  });
}

function callout(text, color = LIGHT_BG, borderColor = PURPLE) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 360, right: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: borderColor, space: 12 } },
    shading: { fill: color, type: ShadingType.CLEAR },
    children: [new TextRun({ text, size: 22, color: '374151', font: 'Arial', italics: true })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun('')] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function sectionLabel(num, text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text: `${num} — `, size: 18, color: CYAN, bold: true, font: 'Arial' }),
      new TextRun({ text: text.toUpperCase(), size: 18, color: CYAN, bold: true, font: 'Arial', characterSpacing: 60 })
    ]
  });
}

function twoColTable(leftContent, rightContent) {
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [4560, 4560],
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { ...noBorders, right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
            width: { size: 4560, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 0, right: 200 },
            children: leftContent
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 4560, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 200, right: 0 },
            children: rightContent
          })
        ]
      })
    ]
  });
}

function specTable(rows, title) {
  const tableRows = rows.map(([key, val]) => new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 2400, type: WidthType.DXA },
        shading: { fill: 'F8F7FF', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: key, size: 20, bold: true, color: PURPLE, font: 'Arial' })] })]
      }),
      new TableCell({
        borders,
        width: { size: PAGE_WIDTH - 2400, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: val, size: 20, color: '374151', font: 'Arial' })] })]
      })
    ]
  }));

  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [2400, PAGE_WIDTH - 2400],
    rows: tableRows
  });
}

function riskTable(rows) {
  const header = new TableRow({
    tableHeader: true,
    children: ['Risk', 'Likelihood', 'Impact', 'Mitigation'].map((h, i) => new TableCell({
      borders,
      width: { size: [2800, 1100, 1100, 4360][i], type: WidthType.DXA },
      shading: { fill: PURPLE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, size: 20, bold: true, color: 'FFFFFF', font: 'Arial' })] })]
    }))
  });

  const dataRows = rows.map(([risk, likelihood, impact, mitigation], idx) => {
    const colors = { 'High': 'EF4444', 'Medium': 'F59E0B', 'Low': '22C55E' };
    const rowBg = idx % 2 === 0 ? 'F8F7FF' : 'FFFFFF';
    return new TableRow({
      children: [
        new TableCell({ borders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: rowBg, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: risk, size: 19, color: '374151', font: 'Arial' })] })] }),
        new TableCell({ borders, width: { size: 1100, type: WidthType.DXA }, shading: { fill: rowBg, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: likelihood, size: 19, bold: true, color: colors[likelihood] || GRAY, font: 'Arial' })] })] }),
        new TableCell({ borders, width: { size: 1100, type: WidthType.DXA }, shading: { fill: rowBg, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: impact, size: 19, bold: true, color: colors[impact] || GRAY, font: 'Arial' })] })] }),
        new TableCell({ borders, width: { size: 4360, type: WidthType.DXA }, shading: { fill: rowBg, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: mitigation, size: 19, color: '374151', font: 'Arial' })] })] }),
      ]
    });
  });

  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [2800, 1100, 1100, 4360],
    rows: [header, ...dataRows]
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }, { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: DARK_TEXT },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: PURPLE },
        paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: '374151' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      titlePage: true,
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        pageNumbers: { start: 1 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE, space: 6 } },
            children: [
              new TextRun({ text: 'ShieldVIN', bold: true, size: 18, color: PURPLE, font: 'Arial' }),
              new TextRun({ text: ' \u00D7 Midnight Network  |  Vehicle Identity Whitepaper  |  2026', size: 18, color: GRAY, font: 'Arial' })
            ]
          })
        ]
      }),
      first: new Header({ children: [new Paragraph({ children: [] })] })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB', space: 6 } },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'Confidential Concept Proposal  |  Page ', size: 18, color: GRAY, font: 'Arial' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY, font: 'Arial' })
            ]
          })
        ]
      }),
      first: new Footer({ children: [new Paragraph({ children: [] })] })
    },
    children: [

      // ── COVER PAGE ──
      new Paragraph({ spacing: { before: 1440 }, children: [new TextRun('')] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'CONCEPT PROPOSAL', size: 20, color: CYAN, bold: true, font: 'Arial', characterSpacing: 120 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: 'ShieldVIN', size: 64, bold: true, color: DARK_TEXT, font: 'Arial' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: 'Cryptographic Vehicle Identity on Midnight Network', size: 32, color: PURPLE, font: 'Arial' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE, space: 12 } },
        spacing: { before: 120, after: 240 },
        children: [new TextRun({ text: 'Making VIN Fraud and Chassis Number Cloning Permanently Impossible on New Vehicles', size: 22, color: GRAY, font: 'Arial', italics: true })]
      }),
      new Paragraph({ spacing: { before: 120, after: 60 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Prepared for: Midnight Network Team', size: 22, color: '374151', font: 'Arial' })] }),
      new Paragraph({ spacing: { before: 0, after: 60 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Document Version: 1.0  |  March 2026', size: 22, color: GRAY, font: 'Arial' })] }),
      new Paragraph({ spacing: { before: 0, after: 60 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Status: Open Concept Proposal', size: 22, color: GRAY, font: 'Arial' })] }),

      pageBreak(),

      // ── TABLE OF CONTENTS ──
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 400 },
        children: [new TextRun({ text: 'TABLE OF CONTENTS', size: 32, bold: true, color: DARK_TEXT, font: 'Arial', characterSpacing: 80 })]
      }),
      ...[
        ['00', 'Executive Summary'],
        ['01', 'The Problem'],
        ['02', 'The Solution'],
        ['03', 'How It Works'],
        ['04', 'The Three Hardware Safes'],
        ['05', 'Stakeholder Systems'],
        ['06', 'Industry Framework'],
        ['07', 'Industries Affected'],
        ['08', 'Why Midnight Network'],
        ['09', 'Business Model'],
        ['10', 'Rollout Roadmap'],
        ['11', 'Risk Analysis'],
        ['12', 'Financial Overview'],
        ['13', 'Team & Advisory'],
        ['14', 'Proposal to Midnight Network'],
        ['15', 'Glossary'],
      ].map(([num, title]) => new Paragraph({
        spacing: { before: 80, after: 80 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 2, color: 'D1D5DB', space: 4 } },
        children: [
          new TextRun({ text: num + '  ', size: 20, bold: true, color: PURPLE, font: 'Arial Narrow' }),
          new TextRun({ text: title, size: 20, color: DARK_TEXT, font: 'Arial' }),
        ]
      })),

      pageBreak(),

      // ── EXECUTIVE SUMMARY ──
      sectionLabel('00', 'Executive Summary'),
      heading1('Executive Summary'),
      body('This document proposes the development of a vehicle identity system built on Midnight Network\'s zero-knowledge proof blockchain infrastructure. The core purpose is to make Vehicle Identification Number (VIN) fraud and chassis number cloning permanently impossible for new vehicles, by anchoring a vehicle\'s identity to three tamper-resistant hardware chips embedded at separate locations within the vehicle itself.'),
      body('The problem is significant: global losses from vehicle theft and associated identity fraud exceed $20 billion annually. Current protections — metal VIN plates, centralised databases, paper title documents — are all vulnerable to relatively simple criminal techniques. A stolen vehicle can be re-plated and re-sold within days.'),
      body('The solution replaces the VIN plate as the sole source of truth with a cryptographic identity record. Three Secure Element chips — one in the engine control unit, one in the structural chassis, one in the telematics module — hold shards of a private key. All three must cooperate to produce a zero-knowledge proof that validates the vehicle\'s identity against a token minted on Midnight Network at the point of manufacture. Remove any one node and the proof fails. No clone of the plate, no forged document, and no database manipulation can substitute for the physical hardware.'),
      callout('Midnight Network\'s selective disclosure architecture is the essential technology choice here: different stakeholders (police, insurers, dealers, governments, owners) each see exactly the data relevant to their role — nothing more. Personal owner data never touches the blockchain.', LIGHT_BG, PURPLE),
      body('This document covers the problem in detail, the full system architecture, the three hardware nodes, how each stakeholder type interacts with the system, the industry framework manufacturers would need to adopt, the business model, rollout roadmap, risk analysis, financial overview, and a formal proposal for Midnight Network\'s involvement.'),

      pageBreak(),

      // ── SECTION 1: THE PROBLEM ──
      sectionLabel('01', 'The Problem'),
      heading1('The Problem'),
      heading2('Vehicle Identity Fraud Is a Serious and Growing Problem'),
      body('Every vehicle has a Vehicle Identification Number — a 17-character code that serves as its permanent identity. It is the reference point for registration, insurance, finance, recalls, and ownership history. VIN cloning is the criminal practice of copying this number from a legitimately owned vehicle and applying it to a stolen one, giving the stolen car a false but convincing identity.'),
      body('The fundamental weakness in the current system is that a VIN is just a number stamped on a metal plate or sticker. It carries no cryptographic proof that it belongs to the specific vehicle it is attached to. This has remained true for decades, and criminals have exploited it at scale.'),

      heading3('How VIN Cloning Works'),
      numberedItem('A criminal steals a target vehicle — typically a popular, high-value model such as a truck, SUV, or luxury car.'),
      numberedItem('They locate a similar make and model that has been written off as salvage or scrap, and purchase it cheaply.'),
      numberedItem('The VIN plate from the scrapped vehicle is removed and applied to the stolen car, along with convincing but forged ownership documents.'),
      numberedItem('The newly re-plated stolen car is registered in a different state or jurisdiction — exploiting gaps in cross-border database sharing — and sold to an unsuspecting buyer, or shipped overseas.'),
      spacer(),
      body('When authorities eventually discover the clone, the vehicle is seized immediately. The buyer loses their full purchase price, may still owe a car loan, and must spend time and money proving their own innocence. The legitimate owner of the donor VIN may face traffic violations, criminal queries, and registration complications that take months to resolve.'),

      heading3('The Scale of the Problem'),
      specTable([
        ['United States', 'Over 1 million vehicles stolen per year. Annual losses exceed $7.4 billion.'],
        ['Europe (EU)', 'Approximately 580,000 vehicles stolen annually. Cross-border fraud rings operate across multiple jurisdictions.'],
        ['South Africa', 'One of the highest vehicle theft rates in the world. Losses estimated at $2.8 billion annually.'],
        ['United Kingdom', 'Vehicle theft rising year-on-year. HPI and DVLA records regularly exploited.'],
        ['Global Total', 'Estimated $20+ billion in annual losses including theft, fraud, and downstream costs.'],
      ], ''),

      spacer(),
      heading3('Why Existing Solutions Fall Short'),
      bullet('NMVTIS (US) and similar national databases are reactive — they depend on timely, accurate reporting that is often delayed or incomplete.'),
      bullet('Physical VIN plates can be replicated with embossing equipment that is commercially available. 3D printers now produce factory-accurate facsimiles.'),
      bullet('Paper title washing — moving a vehicle through multiple states or countries to clean its history — exploits inconsistencies in cross-border database coordination.'),
      bullet('GPS trackers and LoJack systems can be removed, jammed, or disabled. They do not prevent re-plating.'),
      bullet('Existing blockchain proposals (public ledgers) solve the immutability problem but introduce a new one: full vehicle history is publicly queryable, creating privacy concerns that prevent adoption.'),
      spacer(),
      callout('Midnight Network solves both the immutability problem AND the privacy problem simultaneously — which is why it is the right foundation for this system.', CYAN_BG, CYAN),

      pageBreak(),

      // ── SECTION 2: THE SOLUTION ──
      sectionLabel('02', 'The Solution'),
      heading1('The Solution'),
      heading2('Cryptographic Vehicle Identity on Midnight Network'),
      body('The proposed system replaces the VIN plate as the primary identity anchor with a cryptographic Vehicle Identity Token, minted on the Midnight Network at the point of manufacture and verified by three hardware Secure Element chips embedded permanently in the vehicle.'),

      heading3('Why Midnight Network?'),
      body('Midnight Network uses zero-knowledge proofs (ZKPs) to enable selective disclosure: the system can prove a statement is true — "this vehicle is authentic," "this car is not stolen," "this owner has valid title" — without revealing the underlying data that supports that claim.'),
      body('This is fundamentally different from any existing blockchain solution. On a public blockchain, all data is visible to anyone. Midnight\'s private state layer keeps sensitive data encrypted and off the public ledger, accessible only via ZK proofs to authorised parties. Personal data never touches the chain. The system is GDPR-compliant by design.'),

      heading3('The Core Components'),
      bullet('Three Secure Element chips per vehicle — one in the engine bay (EN-1), one in the structural chassis (CN-2), one in the telematics module (TN-3).'),
      bullet('A Vehicle Identity Token minted on Midnight Network at manufacture, encoding VIN, chassis number, engine serial, build spec, and factory data.'),
      bullet('A threshold signature scheme requiring all three chips to cooperate for any valid identity proof.'),
      bullet('A selective disclosure system allowing different stakeholders (police, insurance, dealers, government, owners) to access only the data relevant to their role.'),
      bullet('An industry-wide standards framework (VSE-1, VIT-1, VAP-1) that ensures all manufacturers implement compatible systems.'),

      spacer(),
      callout('The key security insight: a thief would need to simultaneously replace the engine (with its ECU), cut and rebuild the structural chassis frame, AND replace the telematics system — without triggering any network alert — and still could not reproduce the cryptographic keys, because they were generated once and immediately split across the three chips, with the master key destroyed.', LIGHT_BG, PURPLE),

      pageBreak(),

      // ── SECTION 3: HOW IT WORKS ──
      sectionLabel('03', 'How It Works'),
      heading1('System Architecture — How It Works'),

      heading2('Stage 1: Manufacturing'),
      body('At the factory, after the vehicle is assembled, three Secure Element chips are installed in their designated locations. The key generation ceremony is then run: a master private key is generated, split into three shards using a threshold key agreement scheme, and each shard is burned into one chip. The master key is immediately and permanently destroyed — it exists in full form for only milliseconds.'),
      body('The Vehicle Identity Token is then minted on the Midnight Network. This token contains the VIN, chassis number, engine serial, build spec hash, factory code, and production date. The public portion of the token is visible on-chain. The private portion is encrypted and accessible only via ZK proof.'),
      body('The physical VIN plate is still affixed to the vehicle as before, but it is now a secondary reference — not the authoritative identity record. The blockchain token is the ground truth.'),

      heading2('Stage 2: Verification at a Checkpoint'),
      body('When an authorised party (police officer, insurer, dealer, border control) wants to verify a vehicle\'s identity, they send a signed verification request — via a certified app or terminal — to the vehicle\'s telematics module (TN-3).'),
      body('TN-3 sends a challenge to EN-1 and CN-2. All three chips sign the challenge using their respective key shards. TN-3 assembles the combined proof and generates a zero-knowledge proof of the combined signature. This proof is submitted to the Midnight Network validators.'),
      body('Validators verify the proof against the minted Vehicle Identity Token. The result — along with whatever data the requesting party is authorised to see — is returned to the requester. For live ZK proofs, the total process takes under 30 seconds on optimised SE hardware; cached status responses return in under 1 second.'),
      body('If any node is tampered with, missing, or replaced, the combined signature is invalid, the ZK proof fails, and the system returns: identity verification failed.'),

      heading2('Stage 3: Lifecycle Events'),
      body('Every significant event in the vehicle\'s life is recorded on the Midnight Network as an immutable entry: ownership transfers, service events, insurance claims, theft reports, recall flags, and end-of-life deregistration. Each event is authorised by a ZK proof from the entity making the record. No event can be retroactively altered or deleted.'),
      body('This creates a tamper-proof history of the vehicle that all authorised parties can query — according to their access level — at any point in the vehicle\'s life.'),

      pageBreak(),

      // ── SECTION 4: THREE HARDWARE NODES ──
      sectionLabel('04', 'The Three Hardware Safes'),
      heading1('The Three Hardware Nodes'),
      body('Each vehicle carries three Secure Element chips — sometimes referred to as "hardware safes" because of their tamper-resistant properties. A Secure Element is a chip that stores cryptographic keys and performs cryptographic operations inside a physically protected environment. The keys inside cannot be read out, even with direct physical access to the chip. This technology is already proven in bank cards, biometric passports, SIM cards, and mobile payment systems like Apple Pay and Google Pay.'),
      body('What makes this system different is the deployment of three separate chips in three separate physical locations, with a threshold signature scheme requiring all three.'),

      heading2('Node 1 — Engine Node (EN-1): ECU Secure Element'),
      specTable([
        ['Location', 'Engine bay, embedded within the sealed Engine Control Unit (ECU) housing. Physically bonded to the ECU\'s internal circuit board.'],
        ['Bonded to', 'Engine serial number and fuel injection system parameters at manufacture time.'],
        ['Key shard', 'K1 — first third of the vehicle\'s master identity key.'],
        ['Tamper response', 'Key wipe on physical breach of ECU housing or detected ECU swap attempt.'],
        ['Attack complexity', 'Requires complete engine replacement — an immediate red flag requiring authorised documentation.'],
      ], ''),

      spacer(),
      heading2('Node 2 — Chassis Node (CN-2): Structural Secure Element'),
      specTable([
        ['Location', 'Embedded within the A-pillar or firewall, installed during the body-in-white manufacturing stage, before painting and trimming. Inaccessible without cutting the structural frame.'],
        ['Bonded to', 'Chassis stamp number and structural weld point measurements recorded at manufacture.'],
        ['Key shard', 'K2 — second third of the vehicle\'s master identity key.'],
        ['Tamper response', 'Network alert broadcast via TN-3 on detection of chassis cut or penetration. Key wipe on breach.'],
        ['Attack complexity', 'Requires destroying and rebuilding the vehicle\'s structural frame — not possible without specialist equipment and a facility.'],
      ], ''),

      spacer(),
      heading2('Node 3 — Telematics Node (TN-3): Connectivity Secure Element'),
      specTable([
        ['Location', 'Behind the dashboard, within the sealed telematics and over-the-air update module.'],
        ['Role', 'Acts as the proof orchestrator: collects partial signatures from EN-1 and CN-2, assembles the combined proof, generates and submits the ZK proof to Midnight Network.'],
        ['Key shard', 'K3 — final third of the vehicle\'s master identity key.'],
        ['Tamper response', 'Manufacturer notification alert on replacement. Key wipe on housing breach.'],
        ['Attack complexity', 'Requires full instrument cluster and connectivity module replacement, triggering immediate manufacturer-level alert.'],
      ], ''),

      spacer(),
      callout('Security principle: removing or replacing any single node breaks the signature. The cost and technical complexity of simultaneously compromising all three nodes embedded in physically separate, structurally different locations far exceeds the value of any single vehicle.', LIGHT_BG, PURPLE),

      pageBreak(),

      // ── SECTION 5: STAKEHOLDER SYSTEMS ──
      sectionLabel('05', 'Stakeholder Systems'),
      heading1('Stakeholder Systems — Who Sees What'),
      body('A core design principle is that each stakeholder type sees exactly the information they need — and nothing more. This is not a policy decision; it is enforced cryptographically at the protocol level.'),

      heading2('Manufacturers'),
      body('The manufacturer is the root of trust. They install the chips, run the key generation ceremony, and mint the Vehicle Identity Token at the point of production. After manufacture, they retain a supervisory role but cannot alter the identity record.'),
      bullet('Can see: Full build data for their own fleet. Tamper alerts. Recall management tools.'),
      bullet('Cannot see: Individual owner details. Another manufacturer\'s vehicle data.'),
      bullet('Cannot do: Alter an identity token after minting. Access user personal data.'),

      spacer(),
      heading2('Law Enforcement'),
      body('Officers receive a clear, binary response on vehicle status. Using a certified app or patrol terminal, they trigger a ZK verification request. The vehicle generates and submits the proof. For a live proof on optimised hardware, the officer receives the result within 30 seconds — well within a routine traffic stop. Cached status responses return in under 1 second.'),
      bullet('Can see: Authentic / Stolen / Flagged status. Any outstanding recall or safety flags.'),
      bullet('Can do: Flag a vehicle as stolen via a secured, authorised portal.'),
      bullet('Cannot see: Owner name or address. Purchase history. Service records.'),
      callout('Officers get exactly what they need to do their job — no more. Privacy is maintained for law-abiding citizens while criminals cannot hide behind a cloned VIN.', CYAN_BG, CYAN),

      spacer(),
      heading2('Insurance Companies'),
      body('Insurers can run a ZK verification at policy inception, renewal, and claim time. They receive confirmation of vehicle identity authenticity, ownership chain validity, and prior claim history for their own policies.'),
      bullet('Can see: Identity valid (yes/no). Owner count. Prior claims against this insurer\'s policies. Service event count.'),
      bullet('Cannot see: Previous owner identities. Claim details from other insurers.'),
      bullet('Business case: Direct reduction in VIN fraud-related claims. Premium discount incentive to drive consumer uptake.'),

      spacer(),
      heading2('Dealerships'),
      body('For new vehicle sales, the manufacturer transfers the token to the dealer at delivery; the dealer transfers to the buyer at the point of sale. This becomes part of the standard handover. For used vehicle trade-ins, the dealer runs a full identity check before accepting the vehicle.'),
      bullet('Can see: Identity valid. Owner count. Service event count. Any flags.'),
      bullet('Cannot see: Previous owner personal details. Claim amounts or specifics.'),

      spacer(),
      heading2('Government and Registration Authorities (DMV / DVLA)'),
      body('Registration authorities receive cryptographically verified notifications of ownership changes from the Midnight Network. Their databases sync from the blockchain record rather than relying solely on paper documentation.'),
      bullet('Can see: Ownership transfers. Identity flags. Recall status. Cross-border transfer records.'),
      bullet('Cannot see: Owner personal data stored on-chain (it is not stored on-chain).'),
      bullet('Can do: Add tax and registration records linked to the vehicle token. Flag stolen status.'),

      spacer(),
      heading2('Vehicle Owners and Buyers'),
      body('For owners, the system should be invisible in daily use. At purchase, they receive a digital ownership credential in a wallet app. This credential proves title without revealing personal identity to the system. At resale, they transfer the credential to the buyer.'),
      bullet('At purchase: Receive digital ownership credential.'),
      bullet('Day-to-day: No interaction required — system runs in background.'),
      bullet('If stolen: Report via authorised channel — token flagged globally within minutes.'),
      bullet('At resale: Transfer ownership credential to buyer through the app.'),

      pageBreak(),

      // ── SECTION 6: FRAMEWORK ──
      sectionLabel('06', 'Industry Framework'),
      heading1('Industry Framework — Manufacturer Standards'),
      body('For the system to work globally, manufacturers must agree on a common set of standards. The following framework defines four standards areas. This is a starting point for industry discussion, not a final specification.'),

      heading2('VSE-1: Vehicle Secure Element Standard (Hardware)'),
      body('Defines the physical and cryptographic requirements for all Secure Element chips used in the system.'),
      specTable([
        ['VSE-1.1 Physical', 'Automotive-grade (AEC-Q100 Grade 1). Operating temperature -40°C to +125°C. IP67 minimum. Designed for 15+ year vehicle lifespan.'],
        ['VSE-1.2 Cryptographic', 'Threshold key generation (3-of-3). Ed25519 or stronger elliptic curve. Hardware random number generator. Secure boot. Physical Unclonable Function (PUF). Anti-rollback firmware.'],
        ['VSE-1.3 Communication', 'CAN bus or automotive Ethernet (AUTOSAR-compatible). Standardised command set for proof requests. Challenge-response to prevent replay attacks.'],
        ['VSE-1.4 Tamper Response', 'Mandatory key wipe on housing penetration. Network alert on tamper detection. Tamper event logged immutably on Midnight Network.'],
      ], ''),

      spacer(),
      heading2('VIT-1: Vehicle Identity Token Standard (Blockchain Data)'),
      body('Defines the data structure of the Vehicle Identity Token on Midnight Network.'),
      specTable([
        ['VIT-1.1 Public Fields', 'Token ID (UUID), manufacturer code, VIN hash (not plain VIN), creation timestamp, current status, standard version.'],
        ['VIT-1.2 Private Fields', 'Plain VIN, chassis number, engine serial, build spec hash, factory location code, production date. ZK-accessible by role.'],
        ['VIT-1.3 Ownership Record', 'Encrypted ownership history. Each transfer appends an immutable entry. Readable by owner and government; earlier entries require owner consent for third-party access.'],
        ['VIT-1.4 Event Log', 'Standard event types: MANUFACTURE, SALE, SERVICE, CLAIM, FLAG_STOLEN, FLAG_RECOVERED, FLAG_RECALL, END_OF_LIFE. Each is a timestamped, immutable record.'],
      ], ''),

      spacer(),
      heading2('VAP-1: Verification API and Protocol Standard'),
      specTable([
        ['VAP-1.1 Query Protocol', 'REST/GraphQL API. OAuth2 + role-based access tokens. Rate limiting per role. All queries logged for audit.'],
        ['VAP-1.2 Response Format', 'Standardised JSON schema. Status always present. Data fields by role. Timestamp and proof hash included. Maximum response time: 30 seconds for live ZK proof; under 1 second for cached status.'],
        ['VAP-1.3 Offline Mode', 'Cached status certificates valid up to 24 hours for standard checks, 1 hour for stolen flag updates.'],
      ], ''),

      spacer(),
      heading2('VGM-1: Governance Model'),
      body('A standards consortium similar to the W3C model, with seats for manufacturers (weighted by production volume), government representatives, insurers, and consumer advocacy groups. Midnight Network holds a technical seat.'),
      bullet('Standard changes require a two-thirds supermajority.'),
      bullet('Emergency security patches can be fast-tracked by a smaller executive committee.'),
      bullet('Dispute resolution process defined in protocol. On-chain audit trail provides evidence. Outcomes implemented via authorised smart contract calls.'),

      pageBreak(),

      // ── SECTION 7: INDUSTRIES AFFECTED ──
      sectionLabel('07', 'Industries Affected'),
      heading1('Industries Affected'),
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        columnWidths: [2400, 1200, 5760],
        rows: [
          new TableRow({
            tableHeader: true,
            children: ['Industry', 'Role', 'Impact'].map((h, i) => new TableCell({
              borders,
              width: { size: [2400, 1200, 5760][i], type: WidthType.DXA },
              shading: { fill: DARK_TEXT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: h, size: 20, bold: true, color: 'FFFFFF', font: 'Arial' })] })]
            }))
          }),
          ...([
            ['Automotive Manufacturing', 'Primary', 'Requires factory line chip provisioning. Becomes a differentiated product feature. Shared standard framework reduces fragmentation risk.'],
            ['Insurance', 'Primary', 'Largest financial beneficiary. Direct reduction in VIN fraud claims. Premium discounts drive consumer adoption. Verified claims processing.'],
            ['Law Enforcement', 'Primary', 'Real-time cryptographic identity checks. Cross-border vehicle status synchronised immediately. Theft ring disruption at fundamental level.'],
            ['Vehicle Finance & Lending', 'Secondary', 'Reliable collateral verification. Fraudulent finance applications blocked at identity check. Simplified repossession process.'],
            ['Government / Tax / DMV', 'Secondary', 'Registration database integrity improved. Import/export fraud disrupted. Cross-border coordination standardised.'],
            ['Parts & Aftermarket', 'Secondary', 'Major component replacements logged on vehicle\'s identity record. Counterfeit parts disruption. Verified service history increases resale value.'],
            ['Shipping & Logistics', 'Secondary', 'Port authority identity verification at export. Stolen vehicle export prevention. Cross-border law enforcement data sharing.'],
            ['Used Vehicle Marketplace', 'Secondary', 'Listing platforms integrate verification API. Authenticated identity badge on listings. Consumer confidence. Fraud listings caught pre-sale.'],
          ].map(([industry, role, impact]) => new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: industry, size: 20, bold: true, color: DARK_TEXT, font: 'Arial' })] })] }),
              new TableCell({ borders, width: { size: 1200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: role === 'Primary' ? 'EDE9FE' : 'F1F5F9', type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: role, size: 19, bold: role === 'Primary', color: role === 'Primary' ? PURPLE : GRAY, font: 'Arial' })] })] }),
              new TableCell({ borders, width: { size: 5760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: impact, size: 20, color: '374151', font: 'Arial' })] })] }),
            ]
          })))
        ]
      }),

      pageBreak(),

      // ── SECTION 8: WHY MIDNIGHT NETWORK ──
      sectionLabel('08', 'Why Midnight Network'),
      heading1('Why Not Another Blockchain?'),
      body('Midnight Network is not the only blockchain. The choice is deliberate, and the alternatives were all considered. This section explains why each credible alternative fails on the specific requirements of this system — and why those failures are structural, not fixable by configuration or additional tooling.'),

      spacer(),
      heading2('The Four Requirements That Drive the Choice'),
      specTable([
        ['Selective disclosure ZK proofs', 'Police see stolen/not-stolen. Insurers see ownership count. Owners see full record. The same on-chain data produces different outputs depending on who is asking — and the caller cannot see what they were not shown.'],
        ['No PII on-chain by design', 'Structural privacy, not encryption. Encrypted data is still data. The architecture must make it impossible to submit personal data to the chain in the first place.'],
        ['Enterprise-grade query confidentiality', 'Insurers and police will not use a system where their query patterns are visible on a public ledger — even if the response data is private.'],
        ['Regulatory acceptability', 'GDPR and CCPA compliance must be achievable by architecture, not by bolt-on arguments that a regulator can challenge.'],
      ], ''),

      spacer(),
      heading2('Ethereum (L1 and L2 Rollups) — Eliminated'),
      body('All contract state on Ethereum is publicly readable. Every VIN, ownership hash, transfer event, and verification query is visible to any node operator. ZK-EVM rollups (StarkWare, zkSync, Polygon zkEVM) add proof-based computation but the underlying state model remains transparent — they prove correctness of computation, not confidentiality of data. No role-based selective disclosure primitive exists. Query patterns are visible. GDPR compliance arguments are fragile.'),

      spacer(),
      heading2('Cardano Native (Without Midnight) — Eliminated'),
      body('Cardano\'s eUTXO model is well-understood and secure. Datum fields in a UTXO are readable by all nodes. There is no native ZK proof system and no selective disclosure primitive. Midnight Network was built specifically as the Cardano partner chain to solve these problems — it is the correct layer for this use case.'),

      spacer(),
      heading2('Hedera Hashgraph — Insufficient'),
      body('Fast throughput, low fixed fees, and a governing council of recognisable corporate names (Google, IBM, Boeing). The Hedera Consensus Service (HCS) would make a capable tamper-evident event ledger for vehicle history. But it has no native ZK proof layer and no selective disclosure primitive. The EVM-compatible smart contract layer has the same public state problem as Ethereum. The centralised Governing Council also creates geopolitical dependency risk for a global vehicle identity standard.'),

      spacer(),
      heading2('Polygon ID — Wrong Design Space'),
      body('Polygon ID uses ZK proofs for identity credentials and supports selective disclosure of credential attributes. It is the most technically relevant alternative. However, it is designed for human identity credentials, not physical hardware-backed assets. There is no concept of a proof that must be co-signed by three hardware security modules embedded in a physical object. The 3-of-3 SE chip co-signature — the core security mechanism — has no equivalent primitive in Polygon ID. Circom and Groth16 also require a trusted setup ceremony per circuit, a governance complication for an evolving standard.'),

      spacer(),
      heading2('Existing Vehicle History Blockchains — Different Category'),
      body('Blockchain-anchored vehicle history projects (VINchain, MOBI) record service events, ownership transfers, and odometer readings. They solve provenance transparency. They cannot prove that the physical vehicle present at a roadside check is the vehicle in the record — they rely on honest reporting. A criminal can simply not report a theft, or clone a VIN from a legitimately maintained vehicle. These projects are complementary to ShieldVIN, not competing with it.'),

      spacer(),
      heading2('Why Midnight Network Satisfies All Four Requirements'),
      specTable([
        ['Selective disclosure', 'Native — the disclose() primitive in Compact controls exactly which fields leave the private witness. Role-based outputs are enforced in-circuit, not by application logic.'],
        ['No PII on-chain', 'The architecture separates public ledger state from private witness state. Private state is never submitted to the network — it stays with the prover.'],
        ['Query confidentiality', 'Query patterns are private. The fact that Insurer X queried VIN Y at time Z is not visible on-chain — unlike any public ledger alternative.'],
        ['Regulatory design', 'Privacy-by-default architecture supports GDPR Article 25 compliance by construction.'],
        ['No trusted setup', 'Midnight uses Halo 2 over BLS12-381. Unlike Groth16, there is no per-circuit trusted setup ceremony. Standard updates do not require new ceremonies.'],
        ['Compact DSL', 'TypeScript-familiar syntax for ZK circuit development. Lower barrier than writing raw Circom or Rust circuits. Designed for application developers.'],
        ['Cardano settlement', 'Inherits Cardano\'s Ouroboros finality and established security properties. Not a new unproven network.'],
      ], ''),

      pageBreak(),

      // ── SECTION 9: BUSINESS MODEL ──
      sectionLabel('09', 'Business Model'),
      heading1('Business Model'),
      heading2('Revenue Streams'),
      specTable([
        ['Manufacturer Licensing', 'A per-vehicle fee at the point of manufacture for each Vehicle Identity Token minted. Estimated: $8–$25 per vehicle, with volume-based tiers. At 10% of global new vehicle production (8M units), this represents $64–$200M annually at full scale.'],
        ['Verification API Access', 'Insurance companies, dealers, fleet operators, and others pay for API verification queries. Tiered pricing based on query volume and data access level. Estimated: $0.10–$2.50 per query. Law enforcement and government access provided at subsidised or government contract rates.'],
        ['Midnight Network DUST', 'All transactions on Midnight Network require DUST for fees. A healthy vehicle identity ecosystem drives consistent, high-volume DUST consumption — supporting the Midnight Network economy and making this project a major institutional DUST consumer.'],
        ['Enterprise Partnerships', 'Shared savings arrangements with insurance companies (proportion of claim reduction), premium data products for vehicle marketplace platforms, and fleet management integrations.'],
      ], ''),

      spacer(),
      heading2('Cost Structure'),
      specTable([
        ['Hardware R&D', 'Partnership with existing Secure Element manufacturers — NXP, Infineon, STMicroelectronics. These chips are established technology; the work is integration and standard certification.'],
        ['Midnight Network Integration', 'Smart contract development in Compact (Midnight\'s TypeScript-based language). SDK for manufacturer and API for verification parties. Proof circuit optimisation targeting sub-30 second live verification on SE hardware.'],
        ['Standards Body', 'Legal establishment of the VGM-1 governance consortium. Standards publication and maintenance. Regulatory engagement across key jurisdictions.'],
        ['Go-to-Market', 'Manufacturer partnership development, regulatory engagement, pilot programme costs, insurance industry co-marketing.'],
        ['Ongoing Operations', 'API infrastructure, validator operations, customer support, security monitoring, and standard updates.'],
      ], ''),

      pageBreak(),

      // ── SECTION 10: ROADMAP ──
      sectionLabel('10', 'Rollout Roadmap'),
      heading1('Rollout Roadmap'),

      heading2('Phase 1 — Months 0 to 12: Proof of Concept'),
      body('Build the core smart contract on Midnight Network testnet. Develop the key generation ceremony proof of concept with real Secure Element hardware. Engage 2–3 founding manufacturer partners and a major insurer. Establish the governance consortium legal entity. Publish the VSE-1 draft standard for industry feedback.'),
      callout('Success metric: Working ZK vehicle identity proof on testnet. Signed MoU with at least one Tier 1 manufacturer.', LIGHT_BG, PURPLE),

      spacer(),
      heading2('Phase 2 — Months 12 to 30: Pilot Programme'),
      body('Deploy on a limited model line with a founding manufacturer partner — a production run of 5,000 to 20,000 vehicles. Integrate with one or two national law enforcement agencies and two major insurers. Run live checkpoint verification in a defined geography. Collect performance data, refine the standard, and build the evidence base for wider adoption.'),
      callout('Success metric: Live vehicles on public roads with working ZK identity. Zero false positives. Full live proof under 30 seconds; cached status under 1 second. Demonstrable insurance claim impact.', LIGHT_BG, PURPLE),

      spacer(),
      heading2('Phase 3 — Months 30 to 54: Multi-Manufacturer Rollout'),
      body('Expand to all vehicle lines of founding partners. Onboard additional manufacturers. Government integration in at least three jurisdictions. Insurance verification API live with commercial pricing. Full API access open to dealerships and fleet operators.'),
      callout('Success metric: 500,000+ vehicles enrolled. Active in 3+ countries. Commercially self-sustaining on verification fees.', LIGHT_BG, PURPLE),

      spacer(),
      heading2('Phase 4 — Months 54+: Global Standard Adoption'),
      body('Lobby for regulatory mandate in high-theft markets, similar to the EU\'s 1998 mandate for vehicle immobilisers. Expand to global new vehicle production. Open verification API to consumer-facing apps. Extend to component-level authentication. Explore the long-term roadmap for high-value legacy vehicles.'),
      callout('Success metric: Recognised in ISO or UNECE vehicle safety regulation. Five million or more vehicles enrolled globally.', LIGHT_BG, PURPLE),

      pageBreak(),

      // ── SECTION 11: RISKS ──
      sectionLabel('11', 'Risk Analysis'),
      heading1('Risk Analysis'),

      heading2('Technical Risks'),
      riskTable([
        ['Secure Element physically attacked, key extracted', 'Low', 'High', '3-node requirement means one chip is insufficient. Regular chip security certification. Side-channel resistance built into VSE-1 spec.'],
        ['Man-in-the-middle attack on CAN bus inter-node communication', 'Medium', 'Medium', 'All inter-node communication encrypted with challenge-response nonces. Replay attacks blocked by design — challenge unique per session.'],
        ['Midnight Network outage', 'Low', 'Medium', 'Offline status certificates allow 24-hour offline verification. Decentralised validator set — no single point of failure.'],
        ['Quantum computing attack on ECC cryptography', 'Low (10+ yrs)', 'High', 'VSE-1 includes crypto-agility requirement. Chips support firmware updates to post-quantum algorithms. Governance body monitors and mandates migration.'],
      ]),

      spacer(),
      heading2('Commercial and Adoption Risks'),
      riskTable([
        ['Manufacturers refuse to agree on a common standard', 'Medium', 'High', 'Engage ISO/SAE as formal standard custodians. Start with willing early adopters. Insurance and government pressure accelerates the rest.'],
        ['Consumer resistance to perceived tracking technology', 'Medium', 'Medium', 'Clear privacy messaging — system does not track location. Owner controls data. ZK proofs mean verification reveals nothing about owner.'],
        ['Chip integration adds unacceptable cost per vehicle', 'Medium', 'Low', 'Three SE chips add approximately $15-$40 per vehicle at scale. Insurance discounts of $50-$200/year offset this easily for consumers.'],
        ['Competing solution on a rival blockchain', 'Low', 'Medium', 'First-mover advantage is decisive for standards. VSE-1 and VIT-1 adoption by manufacturers creates massive switching costs for alternatives.'],
      ]),

      spacer(),
      heading2('Regulatory Risks'),
      riskTable([
        ['Regulators refuse to accept blockchain-based identity records', 'Medium', 'High', 'Engage regulators in pilot phase. Build API outputs compatible with existing government database formats. Position as a supplement to, not replacement of, existing systems initially.'],
        ['GDPR or privacy regulation creates compliance issues', 'Low', 'Medium', 'Midnight\'s ZK architecture means personal data is never on-chain by design. System is GDPR-compliant from the ground up. Legal validation before launch.'],
        ['Jurisdictional fragmentation — different countries require different implementations', 'High', 'Medium', 'API with jurisdiction-specific response profiles. Start in aligned markets (e.g., UK, Germany, South Africa). Governance body includes multi-jurisdiction government representatives.'],
      ]),

      pageBreak(),

      // ── SECTION 12: FINANCIAL ──
      sectionLabel('12', 'Financial Overview'),
      heading1('Financial Overview'),

      heading2('Market Size'),
      specTable([
        ['Total Addressable Market', 'Global new vehicle production: 80+ million units per year. At $8–$25 per vehicle minted plus lifecycle verification revenue, the long-term TAM exceeds $84 billion annually.'],
        ['Serviceable Market (Year 5)', 'Assuming 12% of new vehicles enrolled by Year 5, with blended revenue of ~$25 per vehicle including minting and lifecycle queries: approximately $2.4 billion annually.'],
        ['Insurance Savings (Year 5)', 'Estimated $1.2 billion in annual insurance claim savings in enrolled markets — a portion of which would be shared as revenue with the system operator under partnership agreements.'],
      ], ''),

      spacer(),
      heading2('Revenue Projections (USD Millions)'),
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        columnWidths: [2400, 1392, 1392, 1392, 1392, 1392],
        rows: [
          new TableRow({
            tableHeader: true,
            children: ['Revenue Stream', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'].map((h, i) => new TableCell({
              borders,
              width: { size: [2400, 1392, 1392, 1392, 1392, 1392][i], type: WidthType.DXA },
              shading: { fill: DARK_TEXT, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ alignment: i > 0 ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: h, size: 19, bold: true, color: 'FFFFFF', font: 'Arial' })] })]
            }))
          }),
          ...([
            ['Vehicle Minting Fees', '$0.1M', '$0.8M', '$4.2M', '$18.5M', '$58M'],
            ['Verification API', '$0.05M', '$0.3M', '$1.8M', '$9.2M', '$31M'],
            ['Insurance & Enterprise', '$0M', '$0.1M', '$0.9M', '$5.4M', '$19M'],
            ['Total Revenue', '$0.15M', '$1.2M', '$6.9M', '$33.1M', '$108M'],
          ].map(([stream, ...years]) => new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: stream === 'Total Revenue' ? DARK_TEXT : 'FFFFFF', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: stream, size: 20, bold: stream === 'Total Revenue', color: stream === 'Total Revenue' ? 'FFFFFF' : DARK_TEXT, font: 'Arial' })] })] }),
              ...years.map((val, i) => new TableCell({ borders, width: { size: 1392, type: WidthType.DXA }, shading: { fill: stream === 'Total Revenue' ? DARK_TEXT : (i % 2 === 0 ? 'F8F7FF' : 'FFFFFF'), type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: val, size: 20, bold: stream === 'Total Revenue', color: stream === 'Total Revenue' ? 'FFFFFF' : PURPLE, font: 'Arial' })] })] }))
            ]
          })))
        ]
      }),

      spacer(),
      heading2('Investment Required — Phases 1 and 2'),
      specTable([
        ['Phase 1 (0–12 months)', '$3M–$5M for technical PoC, standards body formation, regulatory scoping, initial manufacturer engagement.'],
        ['Phase 2 (12–30 months)', '$9M–$13M for pilot deployment, live vehicle programme, law enforcement integration, API commercial launch.'],
        ['Total Phase 1+2', '$12M–$18M. Fundable through Midnight Network ecosystem grant combined with strategic investment from 1–2 founding manufacturer partners and an insurance co-investor.'],
        ['Payback horizon', 'Commercial self-sufficiency projected in Year 3 based on conservative enrollment assumptions. Year 5 revenue of $108M+ provides strong return on Phase 1+2 investment.'],
      ], ''),

      pageBreak(),

      // ── SECTION 13: TEAM & ADVISORY ──
      sectionLabel('13', 'Team & Advisory'),
      heading1('Building the Right Team'),
      body('ShieldVIN requires expertise at the intersection of automotive hardware engineering, zero-knowledge cryptography, standards governance, and enterprise sales. The founding team is being assembled around this proposal.'),

      spacer(),
      heading2('Core Roles — Open Positions'),

      heading3('Technical Lead'),
      callout('Role open — seeking candidate', LIGHT_BG, PURPLE),
      body('ZK circuit design experience on the Midnight/Cardano stack. Background in automotive embedded systems or Secure Element firmware. Ideally with experience at a Tier 1 automotive supplier (Bosch, Continental, Aptiv) or cryptographic hardware vendor.'),

      heading3('Standards & Policy Lead'),
      callout('Role open — seeking candidate', LIGHT_BG, PURPLE),
      body('Experience navigating ISO, SAE, or UNECE standards processes. Automotive regulatory background. Network into DVLA, NHTSA, or equivalent government agencies in target pilot markets.'),

      heading3('Automotive Industry Lead'),
      callout('Role open — seeking candidate', LIGHT_BG, PURPLE),
      body('Senior relationships with OEM procurement or technology strategy teams. Understands the production line integration process. Has navigated a new hardware mandate into a vehicle production programme before.'),

      spacer(),
      heading2('Advisory Roles Sought'),
      specTable([
        ['Cryptography & ZK Research', 'Academic or applied researcher with ZK proof system expertise. Validates the technical approach, reviews the Compact circuit design, and advises on the post-quantum migration strategy required by VSE-1.'],
        ['Insurance Industry', 'Senior figure from a major insurance group (Lloyd\'s of London tier). Validates the claims data thesis, opens introductions to actuarial teams, and advises on API pricing and data sharing protocols for insurers.'],
        ['Law Enforcement / Government', 'Retired senior officer from a national police vehicle crime unit or equivalent government body. Validates the law enforcement use case and assists with government pilot negotiations and type approval pathways.'],
        ['Midnight Network / Cardano Ecosystem', 'Technical representative from Midnight Network or IOG. Ensures ShieldVIN is built on the right abstractions and positioned correctly within the Midnight ecosystem and developer roadmap.'],
      ], ''),

      spacer(),
      callout('If you are Midnight Network: We are actively looking for a co-development partnership as the primary next step. The right first move is a technical meeting to assess fit, validate the Compact circuit design approach, and agree on the scope of Midnight\'s involvement in Phase 1. That conversation shapes who the right technical lead is for this project.', CYAN_BG, CYAN),

      pageBreak(),

      // ── SECTION 14: PROPOSAL ──
      sectionLabel('14', 'Proposal to Midnight Network'),
      heading1('Proposal to Midnight Network'),
      body('This document is an opening proposal to begin formal discussions with the Midnight Network team about co-developing and co-sponsoring this vehicle identity system as a flagship enterprise use case for the Midnight Network ecosystem.'),

      heading2('What We Are Asking from Midnight'),
      bullet('Dedicated technical partnership for vehicle identity smart contract development using Compact, Midnight\'s smart contract language.'),
      bullet('Co-development of the ZK proof circuit optimised for SE hardware — target under 30 seconds for a full three-node live proof at Phase 2, with a roadmap to sub-10 seconds as the Midnight proof system matures.'),
      bullet('Participation in the governance consortium (VGM-1) as a founding technical member.'),
      bullet('Joint go-to-market engagement with Midnight\'s enterprise and government relations teams.'),
      bullet('Consideration of an ecosystem development grant to fund Phase 1 and part of Phase 2.'),

      spacer(),
      heading2('What Midnight Gets in Return'),
      bullet('A live, regulated, globally visible enterprise use case that proves the "rational privacy" positioning at scale — touching one of the world\'s most widely-owned physical assets.'),
      bullet('Tens of millions of DUST transactions per year at full deployment across global vehicle production.'),
      bullet('Direct relationships with major automotive manufacturers — one of the world\'s largest industries.'),
      bullet('A reference implementation that other industries (healthcare records, supply chain provenance, financial identity) will study and replicate on Midnight.'),
      bullet('Proof that ZK proofs work at real-world speed and scale, with a consumer product that hundreds of millions of people interact with.'),

      spacer(),
      callout('The core alignment: Midnight Network was built to solve exactly the problems this use case presents — proving truth without revealing private data, managing multi-party access to a shared record, and making retroactive fraud impossible. Vehicle identity is the right first major enterprise use case because it is globally relevant, financially significant, and technically tractable with Midnight\'s existing capabilities.', CYAN_BG, CYAN),

      spacer(),
      heading2('Suggested Next Steps'),
      numberedItem('Technical discovery meeting between the project team and Midnight\'s core engineering team to assess ZK circuit feasibility and performance targets.'),
      numberedItem('Legal and governance review of the VGM-1 consortium model with Midnight\'s legal team and prospective manufacturer partners.'),
      numberedItem('Identification of a founding manufacturer partner for the Phase 1 pilot — targeting a manufacturer with existing telematics infrastructure and a history of technology leadership (e.g., a European premium OEM or US pick-up segment leader).'),
      numberedItem('Application for Midnight Network ecosystem development grant to fund Phase 1 technical development.'),
      numberedItem('Joint press strategy for public announcement of the concept — positioning Midnight Network as the infrastructure layer for the first cryptographically-secured vehicle identity system in the world.'),

      spacer(),
      new Paragraph({
        spacing: { before: 240, after: 120 },
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: PURPLE, space: 12 }, bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE, space: 12 } },
        children: [new TextRun({ text: 'This document represents the beginning of a conversation, not the end of one. All technical specifications, financial projections, and framework proposals are starting points for collaborative refinement. We look forward to Midnight Network\'s input on architecture, positioning, and partnership structure.', size: 21, color: GRAY, font: 'Arial', italics: true })]
      }),

      pageBreak(),

      // ── SECTION 15: GLOSSARY ──
      sectionLabel('15', 'Glossary'),
      heading1('Technical Terms'),
      body('Plain-English definitions for technical terminology used throughout this document.'),

      spacer(),
      specTable([
        ['Secure Element (SE)', 'A tamper-resistant microprocessor chip that stores cryptographic keys and performs security operations in hardware isolation. Keys inside an SE cannot be extracted even if the surrounding device is physically disassembled. Used in SIM cards, passports, payment chips, and — in ShieldVIN — vehicle identity nodes.'],
        ['Zero-Knowledge Proof (ZK)', 'A cryptographic technique that lets one party prove a statement is true to another party without revealing any information beyond the truth of the statement itself. Example: proving a vehicle is not stolen without revealing who owns it, where it has been, or any other private data.'],
        ['Compact', 'The smart contract programming language developed by Midnight Network. Compact is designed specifically for writing ZK-native contracts — programs where privacy guarantees are enforced at the language level, not added as an afterthought. ShieldVIN\'s identity contract is written in Compact.'],
        ['DUST', 'The transaction fee token on Midnight Network. Every on-chain operation — including ShieldVIN identity proof submissions — consumes a small amount of DUST. DUST is an operational cost for ShieldVIN, not a revenue stream. Revenue comes from manufacturer minting fees and API access.'],
        ['VIN', 'Vehicle Identification Number. A 17-character code assigned to every motor vehicle at manufacture, used globally by insurers, law enforcement, and registries. Currently just a stamped metal plate — physically easy to replicate, which is the core vulnerability ShieldVIN addresses.'],
        ['VIT (Vehicle Identity Token)', 'The on-chain token minted at manufacture that represents a vehicle\'s cryptographic identity on Midnight Network. Contains no personal data — only a binding commitment to the three hardware node keys, the VIN, and the minting event. Defined by the VIT-1 standard.'],
        ['VSE-1', 'Vehicle Secure Element Standard. The proposed hardware specification for the three SE chips embedded in ShieldVIN-enrolled vehicles. Defines tamper response behaviour, key management, inter-node communication encryption, and firmware update protocols including post-quantum crypto-agility.'],
        ['VIT-1', 'Vehicle Identity Token Standard. Defines the data structure, minting procedure, and lifecycle events (transfer, recall, flag, expire) for the on-chain VIT token. Ensures any system reading a ShieldVIN token knows exactly what fields to expect regardless of which manufacturer minted it.'],
        ['VAP-1', 'Verification API and Protocol Standard. Defines the HTTP API that police, insurers, dealers, and other authorised parties use to query vehicle identity. Specifies authentication, role-based access control, rate limiting, offline certificate caching, and the JSON request/response formats.'],
        ['VGM-1', 'Vehicle Governance Model. A W3C-style multi-stakeholder consortium that owns and evolves the ShieldVIN standards. Founding members include Midnight Network, participating manufacturers, a major insurer, and a government representative. No single party controls the standard.'],
        ['CAN Bus', 'Controller Area Network. The internal communication protocol used by most modern vehicles to allow electronic components to communicate without a central host. ShieldVIN\'s three hardware nodes communicate over an encrypted and authenticated CAN bus channel.'],
        ['ECU', 'Engine Control Unit. The embedded computer that manages the engine\'s operation. In ShieldVIN, the EN-1 Secure Element node is embedded into the ECU housing in the engine bay — one of the three hardware positions that must co-sign every identity proof.'],
        ['OEM', 'Original Equipment Manufacturer. In the automotive context, the vehicle manufacturer — Toyota, BYD, Ford, etc. ShieldVIN targets OEMs as the primary integration point because SE chip installation must happen at the point of manufacture, not after the vehicle leaves the factory.'],
        ['ECC', 'Elliptic Curve Cryptography. The public-key cryptography system used by ShieldVIN\'s SE nodes to generate and hold their independent keypairs. Provides strong security with small key sizes — important for resource-constrained chip hardware. VSE-1 requires crypto-agility to migrate to post-quantum algorithms when standardised.'],
        ['NMVTIS', 'National Motor Vehicle Title Information System. The US federal database used by states, insurers, and dealers to track vehicle title histories, salvage records, and theft reports. Represents current best-in-class for vehicle identity — but reactive (relies on timely reporting) and cannot detect VIN cloning.'],
        ['VIN Cloning', 'The primary fraud technique ShieldVIN is designed to prevent. A criminal steals a vehicle, finds a legitimate vehicle of the same make, model, and colour, copies its VIN plate, stamps the stolen vehicle with the copied VIN, and forges matching documents. The stolen vehicle then passes most checks as legitimate.'],
      ], ''),

      pageBreak(),

      // ── APPENDIX A: VSE-1 HARDWARE STANDARD ──
      sectionLabel('A', 'Appendix — Industry Framework Standards'),
      heading1('Appendix A — Industry Framework Standards'),
      body('The following tables provide the full proposed specification for each of the four ShieldVIN industry standards. These are proposed starting points for VGM-1 governance review, not final specifications.'),

      spacer(),
      heading2('VSE-1 — Vehicle Secure Element Standard'),
      specTable([
        ['VSE-1.1  Hardware Spec', 'AEC-Q100 Grade 1 automotive-rated Secure Element. Minimum CC EAL5+ certification. Operating range: -40°C to +125°C. Minimum 100,000 write cycles. Rated service life: 25 years.'],
        ['VSE-1.2  Cryptographic Spec', 'Ed25519 primary signing algorithm. X25519 key exchange. SHA-256 and SHA-3 hashing. Physical Unclonable Function (PUF) for device-bound key derivation. Supports post-quantum algorithm migration path (CRYSTALS-Dilithium).'],
        ['VSE-1.3  Communication Spec', 'CAN bus or automotive Ethernet (AUTOSAR-compatible) inter-node interface. Standardised command set for proof generation requests. Challenge-response protocol to prevent replay attacks. ISO 15765-2 transport layer framing.'],
        ['VSE-1.4  Tamper Response', 'EN-1: immediate key wipe on ECU housing breach. CN-2: alert to manufacturer + key wipe on frame deformation or chassis cut. TN-3: alert to manufacturer + key wipe on telematics module removal. Tamper events logged in a one-way counter register on the chip.'],
        ['VSE-1.5  Key Generation', 'All private keys generated in-situ on the chip using hardware RNG seeded by PUF. Private keys never leave the chip. Factory-auditable key generation ceremony required. Public keys exported during manufacture for token minting.'],
        ['VSE-1.6  Firmware Updates', 'Signed firmware updates permitted over authenticated OTA channel. Cryptographic algorithm updates (post-quantum migration) permitted without key wipe. All updates logged on-chain via TN-3.'],
      ], ''),

      spacer(),
      heading2('VIT-1 — Vehicle Identity Token Standard'),
      specTable([
        ['VIT-1.1  On-Chain Fields', 'VIN (17-char ISO 3779), chassis hash (SHA-256), engine hash (SHA-256), build spec hash (SHA-256), factory code (8-char), mint timestamp (Unix epoch), ownership commitment (hash), transfer count, service count, status enum, EN-1/CN-2/TN-3 public keys.'],
        ['VIT-1.2  Status Values', 'ACTIVE — registered, no flags. STOLEN — law enforcement flag. RECOVERED — previously stolen, now recovered. FLAGGED — manufacturer recall or administrative hold. DECOMMISSIONED — end-of-life, write-off, or salvage.'],
        ['VIT-1.3  Event Log Types', 'MANUFACTURE (initial mint), SALE (ownership transfer), SERVICE (maintenance event), CLAIM (insurance event), FLAG_STOLEN (law enforcement only), FLAG_RECOVERED (law enforcement or government), FLAG_RECALL (manufacturer only), NODE_ROTATION (hardware replacement), END_OF_LIFE (deregistration).'],
        ['VIT-1.4  Privacy Design', 'No PII fields in any VIT-1 structure. Ownership expressed as a cryptographic commitment H(owner_secret ∥ salt). Owner identity resolved off-chain by relevant party. Compliant by construction with GDPR Article 25 (data protection by design).'],
        ['VIT-1.5  Token Governance', 'Tokens are non-transferable NFTs on Midnight Network. Transfer count is incremented on each ownership change — the token is not moved, the ownership commitment is updated. DECOMMISSIONED tokens are frozen — no further state changes permitted.'],
      ], ''),

      spacer(),
      heading2('VAP-1 — Verification API and Protocol Standard'),
      specTable([
        ['VAP-1.1  Query Protocol', 'REST/GraphQL API. OAuth 2.0 with VGM-1-issued role credentials. Rate limiting per role. All queries logged for audit. TLS 1.3 minimum.'],
        ['VAP-1.2  Response Format', 'Standardised JSON schema. Status field always present. Data fields vary strictly by authenticated role. Response includes timestamp, proof hash, block height. Signed by Midnight Network validator set. Max response time: 30s live ZK proof; < 1s cached status.'],
        ['VAP-1.3  Offline Mode', 'Cached status certificates valid up to 24 hours for standard checks; 1 hour following a stolen flag update. Certificates cryptographically signed by validators. Offline certificates displayed as such in all certified apps.'],
        ['VAP-1.4  Role Disclosure Rules', 'Police: status only (VIN additionally disclosed if STOLEN). Insurer: status + transfer count + service count. Dealer: status + transfer count + service count. Government/DMV: status + transfer count + VIN. Owner: full record including mint timestamp and build spec hash.'],
      ], ''),

      spacer(),
      heading2('VGM-1 — Governance Model'),
      specTable([
        ['VGM-1.1  Consortium Structure', 'Standards body with seats for: manufacturers (weighted by annual production volume), government representatives (minimum 3 jurisdictions), insurance industry, consumer advocacy groups, and Midnight Network as technical infrastructure seat. Total founding seats: 15–20.'],
        ['VGM-1.2  Standard Changes', 'Proposed changes published for 90-day public comment. Technical review by engineering committee. Two-thirds supermajority vote required for adoption. Emergency security patches fast-tracked via 7-member executive committee with full ratification within 30 days.'],
        ['VGM-1.3  Dispute Resolution', 'Disputes between participants resolved first by mediation panel (3 neutral VGM-1 members). On-chain audit trail provides evidence. Binding arbitration as final recourse under ICC rules. Outcomes implemented via authorised smart contract calls.'],
        ['VGM-1.4  Credential Issuance', 'VGM-1 issues VAP-1 role credentials to authorised parties. Credentials are JWTs signed by the VGM-1 governance key. Credentials have defined TTLs: 1 year for commercial parties, 2 years for government, 90 days for trial/pilot participants.'],
        ['VGM-1.5  Midnight Network Role', 'Midnight Network holds one technical seat on the VGM-1 board. Not a commercial seat — no revenue share. Responsible for maintaining the Compact smart contract reference implementation, SDK compatibility, and proof circuit upgrade pathway.'],
      ], ''),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(path.join(__dirname, '../../dist/ShieldVIN_BusinessPlan.docx'), buffer);
  console.log('DOCX created successfully');
});
