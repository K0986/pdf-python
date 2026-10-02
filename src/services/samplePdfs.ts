/**
 * PDF Forge - Preset Sample PDFs Generator
 * Generates valid binary PDF documents directly using pdf-lib for instant loading and testing.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function createWelcomeGuidePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // --- PAGE 1: Welcome & Overview ---
  const page1 = pdfDoc.addPage([595.28, 841.89]); // Standard A4
  const { width, height } = page1.getSize();

  // Top header banner
  page1.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(0.09, 0.12, 0.19),
  });

  page1.drawText('PDF FORGE', {
    x: 50,
    y: height - 60,
    size: 26,
    font: fontBold,
    color: rgb(0.95, 0.96, 0.98),
  });

  page1.drawText('Local Full-Featured PDF Editor — Private & Desktop-Grade', {
    x: 50,
    y: height - 85,
    size: 13,
    font: fontRegular,
    color: rgb(0.65, 0.72, 0.82),
  });

  // Section 1: Introduction
  page1.drawText('Welcome to your private PDF workbench', {
    x: 50,
    y: height - 165,
    size: 18,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.23),
  });

  const introText = [
    'PDF Forge runs entirely on your machine. Your documents, annotations, signatures,',
    'and sensitive data never leave your computer or get uploaded to public cloud servers.',
    'Built with a dual engine: client-side high-precision rendering & Python PyMuPDF backend.'
  ];

  let yPos = height - 195;
  for (const line of introText) {
    page1.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: rgb(0.25, 0.30, 0.38),
    });
    yPos -= 18;
  }

  // Feature cards
  const drawCard = (x: number, y: number, w: number, h: number, title: string, desc: string, iconBg: [number, number, number]) => {
    page1.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
    });
    page1.drawRectangle({
      x: x + 15,
      y: y + h - 35,
      width: 24,
      height: 24,
      color: rgb(iconBg[0], iconBg[1], iconBg[2]),
    });
    page1.drawText(title, {
      x: x + 48,
      y: y + h - 28,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.22),
    });
    page1.drawText(desc, {
      x: x + 15,
      y: y + h - 55,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.55),
    });
  };

  drawCard(50, height - 350, 235, 80, 'Multilingual Typography', 'Rich Unicode support for Arabic RTL,\nDevanagari, CJK, and Indic scripts.', [0.3, 0.4, 0.9]);
  drawCard(310, height - 350, 235, 80, 'True Physical Redaction', 'Cryptographically destroys underlying\ntext & vector paths, not just an overlay.', [0.85, 0.2, 0.2]);
  drawCard(50, height - 445, 235, 80, 'Page Management', 'Reorder, rotate, split, merge, and\ninsert blank or extracted pages easily.', [0.1, 0.65, 0.45]);
  drawCard(310, height - 445, 235, 80, 'Annotations & Stamps', 'Sticky notes, freehand drawing, highlighter,\nand customizable official stamps.', [0.85, 0.55, 0.1]);

  // Sample Redaction Area Box for Testing
  page1.drawRectangle({
    x: 50,
    y: height - 570,
    width: 495,
    height: 95,
    color: rgb(0.98, 0.98, 0.96),
    borderColor: rgb(0.9, 0.8, 0.5),
    borderWidth: 1,
  });

  page1.drawText('CONFIDENTIAL TEST ZONE (Try Redaction Tool Here)', {
    x: 65,
    y: height - 500,
    size: 11,
    font: fontBold,
    color: rgb(0.7, 0.35, 0.05),
  });

  page1.drawText('Customer Tax ID: 94-8172901-X   |   Internal Server IP: 192.168.1.144', {
    x: 65,
    y: height - 525,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page1.drawText('Private Encryption Key Hash: 7e9b4d82f0c183aa6391d8e034', {
    x: 65,
    y: height - 548,
    size: 10,
    font: fontOblique,
    color: rgb(0.35, 0.4, 0.5),
  });

  // Footer
  page1.drawText('PDF Forge 1.0 • Page 1 of 2', {
    x: 50,
    y: 35,
    size: 9,
    font: fontRegular,
    color: rgb(0.55, 0.6, 0.7),
  });

  // --- PAGE 2: Signature, Agreement & Form Demo ---
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  
  page2.drawText('Document Review & Signature Section', {
    x: 50,
    y: height - 70,
    size: 18,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.23),
  });

  page2.drawText('This sample section lets you test annotations, freehand pen signatures, stamps, and form fields.', {
    x: 50,
    y: height - 95,
    size: 10.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Terms box
  page2.drawRectangle({
    x: 50,
    y: height - 320,
    width: 495,
    height: 200,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  page2.drawText('1. SCOPE AND JURISDICTION', {
    x: 70,
    y: height - 150,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });

  page2.drawText('The recipient agrees to maintain strict confidentiality regarding all proprietary algorithms,', {
    x: 70,
    y: height - 172,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  page2.drawText('architectural schematics, and source code exposed during the evaluation phase.', {
    x: 70,
    y: height - 188,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  page2.drawText('2. DATA INTEGRITY GUARANTEE', {
    x: 70,
    y: height - 225,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });

  page2.drawText('All editing sessions are isolated within the local device environment. No third-party network', {
    x: 70,
    y: height - 247,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  page2.drawText('transmissions or telemetry packets are dispatched at any juncture.', {
    x: 70,
    y: height - 263,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  // Signature Block
  page2.drawRectangle({
    x: 50,
    y: height - 520,
    width: 230,
    height: 120,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page2.drawText('Authorized Signature (Sign with Pen Tool):', {
    x: 60,
    y: height - 425,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  page2.drawLine({
    start: { x: 60, y: height - 485 },
    end: { x: 260, y: height - 485 },
    thickness: 1,
    color: rgb(0.7, 0.75, 0.8),
  });

  page2.drawText('Signer Name: Alex Mercer, Lead Architect', {
    x: 60,
    y: height - 505,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Stamp Block
  page2.drawRectangle({
    x: 315,
    y: height - 520,
    width: 230,
    height: 120,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page2.drawText('Official Stamp Placement:', {
    x: 325,
    y: height - 425,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  page2.drawRectangle({
    x: 350,
    y: height - 500,
    width: 160,
    height: 60,
    borderColor: rgb(0.85, 0.3, 0.3),
    borderWidth: 1.5,
    color: rgb(0.99, 0.96, 0.96),
  });

  page2.drawText('[ PLACE STAMP HERE ]', {
    x: 375,
    y: height - 470,
    size: 10,
    font: fontBold,
    color: rgb(0.85, 0.3, 0.3),
  });

  // Footer
  page2.drawText('PDF Forge 1.0 • Page 2 of 2', {
    x: 50,
    y: 35,
    size: 9,
    font: fontRegular,
    color: rgb(0.55, 0.6, 0.7),
  });

  return await pdfDoc.save();
}

export async function createBlankDocument(pageCount: number = 1): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawText(`Page ${i + 1}`, {
      x: 50,
      y: 841.89 - 60,
      size: 14,
      font,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  return await pdfDoc.save();
}

export async function createMutualNdaSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // --- PAGE 1: MUTUAL NON-DISCLOSURE AGREEMENT ---
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page1.getSize();

  // Top banner
  page1.drawRectangle({
    x: 40,
    y: height - 80,
    width: width - 80,
    height: 45,
    color: rgb(0.95, 0.97, 1.0),
  });

  page1.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
    x: 100,
    y: height - 67,
    size: 16,
    font: fontBold,
    color: rgb(0.08, 0.22, 0.45),
  });

  page1.drawText('Document Reference: NDA-2026-0941 | Version 3.2', {
    x: 45,
    y: height - 105,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.45, 0.5, 0.58),
  });

  const p1Text = [
    'This Non-Disclosure Agreement ("Agreement") is entered into as of September 30, 2026 by and',
    'between Apex Technologies Inc., a Delaware corporation ("Disclosing Party"), and Nova Systems LLC,',
    'a California limited liability company ("Receiving Party").'
  ];

  let curY = height - 135;
  for (const line of p1Text) {
    page1.drawText(line, {
      x: 45,
      y: curY,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.18, 0.22, 0.28),
    });
    curY -= 15;
  }

  // Section 1
  curY -= 10;
  page1.drawText('1. Confidential Information.', { x: 45, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.15, 0.2) });
  page1.drawText('"Confidential Information" refers to any proprietary information, technical data,', { x: 175, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });
  curY -= 15;
  page1.drawText('trade secrets, know-how, software code, customer lists, business strategies, and product roadmaps disclosed', { x: 45, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });
  curY -= 15;
  page1.drawText('by the Disclosing Party to the Receiving Party in connection with the evaluation of strategic partnership.', { x: 45, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });

  // Section 2
  curY -= 25;
  page1.drawText('2. Obligations of Receiving Party.', { x: 45, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.15, 0.2) });
  page1.drawText('The Receiving Party agrees to protect the Confidential Information using the', { x: 195, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });
  curY -= 15;
  page1.drawText('same degree of care it uses to protect its own confidential materials of like nature, but no less than reasonable care.', { x: 45, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });
  curY -= 15;
  page1.drawText('The Receiving Party shall not distribute, sublicense, or disclose Confidential Information to any third party', { x: 45, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });
  curY -= 15;
  page1.drawText('without prior written consent of the Disclosing Party.', { x: 45, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });

  // Section 3
  curY -= 25;
  page1.drawText('3. Term and Termination.', { x: 45, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.15, 0.2) });
  page1.drawText('This Agreement shall remain in effect for a period of three (3) years from the Effective', { x: 165, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });
  curY -= 15;
  page1.drawText('Date, unless superseded by a definitive commercial agreement signed by authorized representatives of both parties.', { x: 45, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });

  // Section 4
  curY -= 25;
  page1.drawText('4. Governing Law and Jurisdiction.', { x: 45, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.15, 0.2) });
  page1.drawText('This Agreement shall be governed by and construed in accordance with the laws', { x: 205, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });
  curY -= 15;
  page1.drawText('of the State of California, without giving effect to conflicts of law principles.', { x: 45, y: curY, size: 9.5, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });

  // Signatures
  curY -= 35;
  page1.drawText('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.', {
    x: 45,
    y: curY,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  curY -= 30;
  // Box 1
  page1.drawRectangle({
    x: 45,
    y: curY - 70,
    width: 220,
    height: 70,
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 1,
  });
  page1.drawText('DISCLOSING PARTY:', { x: 55, y: curY - 18, size: 9, font: fontBold, color: rgb(0.15, 0.2, 0.25) });
  page1.drawText('Apex Technologies Inc.', { x: 55, y: curY - 34, size: 9, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
  page1.drawText('Signature: _______________________', { x: 55, y: curY - 56, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  // Box 2
  page1.drawRectangle({
    x: 280,
    y: curY - 70,
    width: 220,
    height: 70,
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 1,
  });
  page1.drawText('RECEIVING PARTY:', { x: 290, y: curY - 18, size: 9, font: fontBold, color: rgb(0.15, 0.2, 0.25) });
  page1.drawText('Nova Systems LLC', { x: 290, y: curY - 34, size: 9, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
  page1.drawText('Signature: _______________________', { x: 290, y: curY - 56, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  // Footer
  page1.drawText('Page 1 of 2 - CONFIDENTIAL', { x: 240, y: 35, size: 9, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });

  // --- PAGE 2: EXHIBIT A ---
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  
  page2.drawText('EXHIBIT A: AUTHORIZED REPRESENTATIVES', {
    x: 45,
    y: height - 60,
    size: 14,
    font: fontBold,
    color: rgb(0.08, 0.22, 0.45),
  });

  page2.drawText('The following individuals are designated as primary liaisons for information exchange:', {
    x: 45,
    y: height - 85,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Table
  const tableY = height - 130;
  page2.drawRectangle({
    x: 45,
    y: tableY - 120,
    width: 505,
    height: 140,
    borderColor: rgb(0.75, 0.8, 0.88),
    borderWidth: 1,
  });

  page2.drawRectangle({
    x: 45,
    y: tableY - 10,
    width: 505,
    height: 30,
    color: rgb(0.92, 0.95, 0.98),
  });

  page2.drawText('Party', { x: 55, y: tableY + 7, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
  page2.drawText('Designated Name', { x: 180, y: tableY + 7, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
  page2.drawText('Title & Email', { x: 330, y: tableY + 7, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });

  page2.drawText('Disclosing (Apex)', { x: 55, y: tableY - 35, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
  page2.drawText('Elena Rostova', { x: 180, y: tableY - 35, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
  page2.drawText('VP Engineering (elena@apex.io)', { x: 330, y: tableY - 35, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });

  page2.drawLine({
    start: { x: 45, y: tableY - 55 },
    end: { x: 550, y: tableY - 55 },
    thickness: 0.5,
    color: rgb(0.85, 0.88, 0.92),
  });

  page2.drawText('Receiving (Nova)', { x: 55, y: tableY - 80, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
  page2.drawText('Marcus Chen', { x: 180, y: tableY - 80, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
  page2.drawText('Chief Architect (marcus@nova.dev)', { x: 330, y: tableY - 80, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });

  // Note Box
  const noteBoxY = tableY - 145;
  page2.drawRectangle({
    x: 45,
    y: noteBoxY - 150,
    width: 255,
    height: 150,
    color: rgb(0.99, 0.95, 0.65),
    borderColor: rgb(0.92, 0.85, 0.45),
    borderWidth: 1,
  });

  page2.drawText('Add your note comments here...', {
    x: 55,
    y: noteBoxY - 20,
    size: 9,
    font: fontRegular,
    color: rgb(0.45, 0.4, 0.2),
  });

  // Freehand Red Signature Curve
  const pts = [
    { x: 35, y: 150 },
    { x: 60, y: 175 },
    { x: 100, y: 220 },
    { x: 140, y: 260 },
    { x: 180, y: 290 },
    { x: 210, y: 310 },
    { x: 215, y: 300 },
    { x: 200, y: 250 },
    { x: 150, y: 180 },
    { x: 120, y: 120 },
    { x: 140, y: 80 },
    { x: 190, y: 75 },
    { x: 240, y: 100 },
    { x: 270, y: 150 },
    { x: 305, y: 200 },
    { x: 300, y: 160 }
  ];

  for (let i = 0; i < pts.length - 1; i++) {
    page2.drawLine({
      start: pts[i],
      end: pts[i + 1],
      thickness: 3.5,
      color: rgb(0.92, 0.22, 0.22),
    });
  }

  // Footer
  page2.drawText('Page 2 of 2 - CONFIDENTIAL', { x: 240, y: 35, size: 9, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });

  return await pdfDoc.save();
}
