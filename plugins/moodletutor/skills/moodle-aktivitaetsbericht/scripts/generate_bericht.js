#!/usr/bin/env node
/**
 * generate_bericht.js  –  Moodle Aktivitätsbericht / Lernfortschrittsprofil Generator
 * Usage: node generate_bericht.js <path-to-data.json>
 *
 * Sections:
 *  Header: LERNFORTSCHRITTSPROFIL + Kursname + Datum
 *  1. Stammdaten
 *  2. Übersicht
 *  3. Lernfortschritt nach Lernsituation
 *  4. Nachgewiesene Kompetenzen
 *  5. Lernverlauf
 *  6. Erteiltes Feedback
 *  7. Kommunikation & Chat-Dialog
 *  8. Empfehlungen & Nächste Schritte
 */

const fs   = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, PageBreak
} = require('docx');

// ── colour palette ────────────────────────────────────────────────────────────
const C = {
  blue:      "2E5FA3",
  blueDark:  "1F4080",
  blueLight: "D6E4F0",
  dark:      "1A1A1A",
  grey:      "666666",
  greyLight: "F2F2F2",
  red:       "C00000",
  green:     "375623",
  amber:     "7F5C00",
  white:     "FFFFFF",
};

// ── border helpers ────────────────────────────────────────────────────────────
const bNone  = { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" };
const bLight = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const bBlue  = { style: BorderStyle.SINGLE, size: 1, color: "4472C4" };
const borders = s => ({ top: s, bottom: s, left: s, right: s });

// ── cell factories ─────────────────────────────────────────────────────────────
function cell(text, width, {
  bold=false, italic=false, bg=null,
  align=AlignmentType.LEFT, color=C.dark, colspan=1
} = {}) {
  return new TableCell({
    borders: borders(bLight),
    width: { size: width, type: WidthType.DXA },
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: colspan,
    children: [new Paragraph({ alignment: align,
      children: [new TextRun({ text: String(text||''), bold, italic, color, font:"Arial", size:20 })]
    })]
  });
}

// Stammdaten label cell: blue-tinted background, bold
function lcell(text, width) {
  return new TableCell({
    borders: borders(bLight),
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "D6E4F0", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text: String(text||''), bold: true, font:"Arial", size:20, color:C.dark })]
    })]
  });
}

function hcell(text, width) {
  return new TableCell({
    borders: borders(bBlue),
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "4472C4", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: String(text||''), bold:true, color:C.white, font:"Arial", size:20 })]
    })]
  });
}

// status cell: colour-coded by emoji prefix
function scell(text, width) {
  const t = String(text||'');
  const color = t.includes('✅') ? C.green
              : t.includes('❌') ? C.red
              : t.includes('⚠️') ? C.amber : C.dark;
  return cell(t, width, { color });
}

// ── paragraph helpers ─────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{ before:320, after:120 },
    children:[new TextRun({ text, bold:true, font:"Arial", size:28, color:C.blue })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{ before:200, after:80 },
    children:[new TextRun({ text, bold:true, font:"Arial", size:24, color:C.blue })] });
}
function para(text, { bold=false, italic=false, color=C.dark,
                       align=AlignmentType.LEFT, spaceBefore=60, spaceAfter=60 } = {}) {
  return new Paragraph({ alignment:align, spacing:{ before:spaceBefore, after:spaceAfter },
    children:[new TextRun({ text:String(text||''), bold, italic, color, font:"Arial", size:20 })] });
}
function bullet(text, color=C.dark) {
  return new Paragraph({ numbering:{ reference:"bullets", level:0 }, spacing:{ before:40, after:40 },
    children:[new TextRun({ text:String(text||''), font:"Arial", size:20, color })] });
}
function divider() {
  return new Paragraph({ spacing:{ before:100, after:100 },
    border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:"4472C4" } } });
}
const empty = () => para("");

// ── colour helpers ────────────────────────────────────────────────────────────
function katColor(k) {
  const s = (k||'').toLowerCase();
  return s.includes('🔴')||s.includes('kritisch') ? C.red
       : s.includes('🟡')||s.includes('rückstand') ? C.amber : C.green;
}
function tenorColor(t) {
  return (t||'').includes('🔴') ? C.red : (t||'').includes('🟡') ? C.amber : C.green;
}

// ── format date as "03. Juni 2026" ────────────────────────────────────────────
const MONATE = ["Januar","Februar","März","April","Mai","Juni",
                "Juli","August","September","Oktober","November","Dezember"];
function formatDate(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${parseInt(d)}. ${MONATE[parseInt(m)-1]} ${y}`;
}

// ── main ──────────────────────────────────────────────────────────────────────
const dataPath = process.argv[2];
if (!dataPath) { console.error('Usage: node generate_bericht.js <data.json>'); process.exit(1); }

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const {
  student            = {},
  kursname           = '',
  reportDate         = '',
  pruefenderLehrer   = '–',
  stammdaten         = {},
  overview           = {},
  lernfortschrittNachLS = [],
  kompetenzen        = [],
  lernverlauf        = [],
  feedback           = [],
  kommunikation      = [],
  chatDialog         = [],
  empfehlungen       = [],
  outputDir,
  outputFilename,
} = data;

fs.mkdirSync(outputDir, { recursive: true });

// Merge student data with stammdaten for the table
const sd = {
  vollstaendigerName: student.name || stammdaten.vollstaendigerName || '–',
  benutzername:       stammdaten.benutzername || student.username || '–',
  benutzerId:         stammdaten.benutzerId || student.userid || '–',
  email:              stammdaten.email || student.email || '–',
  rolle:              stammdaten.rolle || 'Teilnehmer/in (Student)',
  letzterZugriff:     stammdaten.letzterZugriff || '–',
  kurs:               kursname || stammdaten.kurs || '–',
  pruefenderLehrer:   stammdaten.pruefenderLehrer || pruefenderLehrer,
};

// ── stammdaten 2-column table (label | value) ─────────────────────────────────
function sdRow(label, value) {
  return new TableRow({ children: [ lcell(label, 3000), cell(String(value||'–'), 6638) ] });
}

// ── document ──────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: { config: [{ reference:"bullets",
    levels:[{ level:0, format:LevelFormat.BULLET, text:"•", alignment:AlignmentType.LEFT,
      style:{ paragraph:{ indent:{ left:720, hanging:360 } } } }] }] },
  styles: {
    default: { document:{ run:{ font:"Arial", size:20 } } },
    paragraphStyles: [
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:28, bold:true, font:"Arial", color:C.blue },
        paragraph:{ spacing:{ before:320, after:120 }, outlineLevel:0 } },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:24, bold:true, font:"Arial", color:C.blue },
        paragraph:{ spacing:{ before:200, after:80 }, outlineLevel:1 } },
    ]
  },
  sections:[{
    properties:{
      page:{ size:{ width:11906, height:16838 }, margin:{ top:1134, right:1134, bottom:1134, left:1134 } }
    },
    headers:{ default: new Header({ children:[new Paragraph({
      spacing:{ after:0 },
      border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:"4472C4", space:4 } },
      children:[new TextRun({ text:`Lernfortschrittsprofil | ${sd.vollstaendigerName} | ${kursname||sd.kurs}`,
        bold:true, font:"Arial", size:18, color:C.blue })]
    })] }) },
    footers:{ default: new Footer({ children:[new Paragraph({
      alignment:AlignmentType.CENTER, spacing:{ before:0 },
      border:{ top:{ style:BorderStyle.SINGLE, size:6, color:"4472C4", space:4 } },
      children:[
        new TextRun({ text:"Seite ", font:"Arial", size:16, color:C.grey }),
        new TextRun({ children:[PageNumber.CURRENT], font:"Arial", size:16, color:C.grey }),
        new TextRun({ text:"  |  Vertraulich – nur für Lehrkräfte", font:"Arial", size:16, color:C.grey }),
      ]
    })] }) },

    children:[

      // ════════════════════════════════════════════════════
      // TITELBLOCK  (wie im Screenshot)
      // ════════════════════════════════════════════════════
      new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:160, after:40 },
        children:[new TextRun({
          text:"LERNFORTSCHRITTSPROFIL",
          bold:true, font:"Arial", size:44, color:C.blue,
          allCaps:true,
        })] }),
      new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:0, after:20 },
        children:[new TextRun({ text: kursname || sd.kurs, font:"Arial", size:24, color:C.dark })] }),
      new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:0, after:40 },
        children:[new TextRun({ text:`Berichtsdatum: ${formatDate(reportDate)}`, font:"Arial", size:20, color:C.grey })] }),
      divider(),
      empty(),

      // ════════════════════════════════════════════════════
      // 1. STAMMDATEN
      // ════════════════════════════════════════════════════
      h1("1. Stammdaten"),
      new Table({ width:{ size:9638, type:WidthType.DXA }, columnWidths:[3000, 6638], rows:[
        sdRow("Vollstaendiger Name",    sd.vollstaendigerName),
        sdRow("Benutzername (Moodle)",  sd.benutzername),
        sdRow("Benutzer-ID",            sd.benutzerId),
        sdRow("E-Mail-Adresse",         sd.email),
        sdRow("Rolle im Kurs",          sd.rolle),
        sdRow("Letzter Zugriff im Kurs",sd.letzterZugriff),
        sdRow("Kurs",                   sd.kurs),
        sdRow("Pruefender Lehrer",      sd.pruefenderLehrer),
      ]}),
      empty(),

      // ════════════════════════════════════════════════════
      // 2. ÜBERSICHT
      // ════════════════════════════════════════════════════
      h1("2. Übersicht"),
      new Table({ width:{ size:9638, type:WidthType.DXA }, columnWidths:[3212,3213,3213], rows:[
        new TableRow({ children:[ hcell("Gesamtfortschritt",3212), hcell("Aktivitätsabschlüsse",3213), hcell("Gesamtnote",3213) ] }),
        new TableRow({ children:[
          cell(overview.gesamtfortschritt||'–', 3212, { bold:true, color:katColor(overview.kategorie) }),
          cell(overview.aktivitaetsabschluesse||'–', 3213),
          cell(overview.gesamtnote||'–', 3213),
        ]}),
        new TableRow({ children:[ hcell("Abgaben",3212), hcell("Aktive Lernsituation",3213), hcell("Letzte Aktivität",3213) ] }),
        new TableRow({ children:[
          cell(overview.abgaben||'–', 3212),
          cell(overview.aktiveLernsituation||'–', 3213),
          cell(overview.letzteAktivitaet||'–', 3213),
        ]}),
        new TableRow({ children:[
          new TableCell({ borders:borders(bLight), columnSpan:3, width:{ size:9638, type:WidthType.DXA },
            margins:{ top:80, bottom:80, left:120, right:120 },
            children:[new Paragraph({ children:[
              new TextRun({ text:"Kategorie: ", bold:true, font:"Arial", size:20 }),
              new TextRun({ text:overview.kategorie||'–', font:"Arial", size:20, color:katColor(overview.kategorie) }),
            ]})]
          })
        ]}),
      ]}),
      empty(),

      // ════════════════════════════════════════════════════
      // 3. LERNFORTSCHRITT NACH LERNSITUATION
      // ════════════════════════════════════════════════════
      ...(lernfortschrittNachLS.length > 0 ? [
        h1("3. Lernfortschritt nach Lernsituation"),
        ...lernfortschrittNachLS.flatMap(ls => {
          const lsColor = (ls.status||'').includes('✅') ? C.green
                        : (ls.status||'').includes('❌') ? C.red : C.amber;
          const rows = [
            new TableRow({ children:[ hcell("Aktivität",4800), hcell("Status",2638), hcell("Ergebnis",2200) ] }),
            ...(ls.aktivitaeten||[]).map(a =>
              new TableRow({ children:[ cell(a.name,4800), scell(a.status,2638), cell(a.ergebnis||'–',2200) ] })
            ),
          ];
          if ((ls.aktivitaeten||[]).length === 0) {
            rows.push(new TableRow({ children:[
              new TableCell({ borders:borders(bLight), columnSpan:3, width:{ size:9638, type:WidthType.DXA },
                margins:{ top:80, bottom:80, left:120, right:120 },
                children:[new Paragraph({ children:[
                  new TextRun({ text:"Noch keine Aktivitäten begonnen.", italic:true, font:"Arial", size:20, color:C.grey })
                ]})]
              })
            ]}));
          }
          return [
            h2(ls.ls),
            para(`Status: ${ls.status}`, { bold:true, color:lsColor }),
            new Table({ width:{ size:9638, type:WidthType.DXA }, columnWidths:[4800,2638,2200], rows }),
            ...(ls.hinweis ? [para(ls.hinweis, { italic:true, color:C.grey, spaceBefore:40, spaceAfter:40 })] : []),
            empty(),
          ];
        }),
      ] : []),

      // ════════════════════════════════════════════════════
      // 4. NACHGEWIESENE KOMPETENZEN
      // ════════════════════════════════════════════════════
      ...(kompetenzen.length > 0 ? [
        h1("4. Nachgewiesene Kompetenzen"),
        para(`Auf Basis aller bisherigen Aktivitäten (Stand: ${formatDate(reportDate)}):`),
        ...kompetenzen.map(k => bullet(k)),
        empty(),
      ] : []),

      // ════════════════════════════════════════════════════
      // 5. LERNVERLAUF
      // ════════════════════════════════════════════════════
      ...(lernverlauf.length > 0 ? [
        h1("5. Lernverlauf"),
        new Table({ width:{ size:9638, type:WidthType.DXA }, columnWidths:[1300,1400,1000,1200,1000,3738], rows:[
          new TableRow({ children:[
            hcell("Datum",1300), hcell("Kurs",1400), hcell("Abgaben",1000),
            hcell("Fortschritt",1200), hcell("Kategorie",1000), hcell("Neue Kompetenzen",3738)
          ]}),
          ...lernverlauf.map(row => new TableRow({ children:[
            cell(row.datum||'', 1300),
            cell(row.kurs||'', 1400),
            cell(row.abgaben||'', 1000),
            cell(row.fortschritt||'', 1200),
            cell(row.kategorie||'', 1000, { color:katColor(row.kategorie) }),
            cell(row.kompetenzen||'', 3738),
          ]})),
        ]}),
        empty(),
      ] : []),

      // ════════════════════════════════════════════════════
      // 6. ERTEILTES FEEDBACK
      // ════════════════════════════════════════════════════
      ...(feedback.length > 0 ? [
        new Paragraph({ children:[new PageBreak()] }),
        h1("6. Erteiltes Feedback"),
        ...feedback.flatMap(fb => [
          h2(`${fb.aufgabe||'Aufgabe'}  |  Note: ${fb.note||'–'}  |  ${fb.datum||''}`),
          ...(fb.positiv&&fb.positiv.length>0 ? [
            para("Was gut gelungen ist:", { bold:true }),
            ...fb.positiv.map(p => bullet(p, C.green)),
          ] : []),
          ...(fb.verbesserung&&fb.verbesserung.length>0 ? [
            para("Was noch verbessert werden sollte:", { bold:true }),
            ...fb.verbesserung.map(v => bullet(v, C.red)),
          ] : []),
          ...(fb.empfehlung ? [para(fb.empfehlung, { italic:true, color:C.grey })] : []),
          empty(),
        ]),
      ] : []),

      // ════════════════════════════════════════════════════
      // 7. KOMMUNIKATION & CHAT-DIALOG
      // ════════════════════════════════════════════════════
      ...(kommunikation.length > 0 || chatDialog.length > 0 ? [
        h1("7. Kommunikation"),
        ...(kommunikation.length > 0 ? [
          h2("7.1 Nachrichten"),
          new Table({ width:{ size:9638, type:WidthType.DXA }, columnWidths:[1500,1300,6838], rows:[
            new TableRow({ children:[ hcell("Datum",1500), hcell("Tenor",1300), hcell("Inhalt",6838) ] }),
            ...kommunikation.map(m => new TableRow({ children:[
              cell(m.datum||'', 1500),
              cell(m.tenor||'', 1300, { color:tenorColor(m.tenor) }),
              cell(m.inhalt||'', 6838),
            ]})),
          ]}),
          empty(),
        ] : []),
        ...(chatDialog.length > 0 ? [
          h2("7.2 Chat-Dialog"),
          ...chatDialog.flatMap(d => [
            para(d.datum||'', { bold:true }),
            new Table({ width:{ size:9638, type:WidthType.DXA }, columnWidths:[1300,8338], rows:[
              ...(d.schueler ? [new TableRow({ children:[
                cell("Schüler",1300,{ bold:true, bg:"FFF2CC" }),
                cell(d.schueler,8338,{ bg:"FFF2CC" }),
              ]})] : []),
              ...(d.tutor ? [new TableRow({ children:[
                cell("Tutor",1300,{ bold:true, bg:"E2EFDA" }),
                cell(d.tutor,8338,{ bg:"E2EFDA" }),
              ]})] : []),
              ...(d.tenor ? [new TableRow({ children:[
                cell("Tenor",1300,{ bold:true }),
                cell(d.tenor,8338,{ italic:true }),
              ]})] : []),
            ]}),
            empty(),
          ]),
        ] : []),
      ] : []),

      // ════════════════════════════════════════════════════
      // 8. EMPFEHLUNGEN & NÄCHSTE SCHRITTE
      // ════════════════════════════════════════════════════
      ...(empfehlungen.length > 0 ? [
        h1("8. Empfehlungen & Nächste Schritte"),
        new Table({ width:{ size:9638, type:WidthType.DXA }, columnWidths:[500,5638,3500], rows:[
          new TableRow({ children:[ hcell("Prio",500), hcell("Maßnahme",5638), hcell("Ziel",3500) ] }),
          ...empfehlungen.map(e => {
            const pNum = parseInt(e.prio||'9');
            const pColor = pNum<=2 ? C.red : pNum<=4 ? C.amber : C.dark;
            return new TableRow({ children:[
              cell(e.prio||'', 500, { bold:true, color:pColor, align:AlignmentType.CENTER }),
              cell(e.massnahme||'', 5638),
              cell(e.ziel||'', 3500),
            ]});
          }),
        ]}),
        empty(),
      ] : []),

      // ── Abschluss ──
      divider(),
      new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ before:80, after:60 },
        children:[new TextRun({ text:`Erstellt automatisch durch Moodle-Tutor-System | ${formatDate(reportDate)}`,
          font:"Arial", size:16, color:C.grey, italic:true })] }),
    ]
  }]
});

const outPath = path.join(outputDir, outputFilename);
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log(outPath);
});
