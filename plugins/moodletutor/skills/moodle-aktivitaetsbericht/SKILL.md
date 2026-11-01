---
name: moodle-aktivitaetsbericht
description: >
  Erstellt einen detaillierten Aktivitäts- und Lernbericht für einen einzelnen Moodle-Schüler
  als formatiertes Word-Dokument (.docx) und speichert ihn im Unterordner Berichte/ des
  Projektverzeichnisses. Verwende diesen Skill IMMER wenn der Benutzer nach einem Lernbericht,
  Aktivitätsbericht, Fortschrittsbericht oder einer Lernzusammenfassung für einen Schüler fragt –
  auch bei Formulierungen wie "erstelle einen Bericht für [Name]", "Lernstand von [Schüler]",
  "wie kommt [Name] voran", "zeig mir den Bericht zu [Schüler]", "Bericht [Schüler]",
  "Aktivitätsbericht [Name]", "was hat [Name] bisher gemacht". Auch verwenden wenn der Benutzer
  einen Schüler und ein Lernprotokoll in einem Atemzug nennt.
---

# Moodle Aktivitätsbericht

Dieses Skill liest das gespeicherte Lernprotokoll eines Schülers und erstellt daraus ein
professionell formatiertes Word-Dokument (.docx). Die Datei wird **immer** im Unterordner
`Berichte/` des Projektverzeichnisses abgelegt – nie direkt im Wurzelverzeichnis.

Der Bericht enthält immer diese 7 Abschnitte:
1. Übersicht
2. Lernfortschritt nach Lernsituation
3. Nachgewiesene Kompetenzen
4. Lernverlauf
5. Erteiltes Feedback (pro bewerteter Aufgabe)
6. Kommunikationsprotokoll
7. Empfehlungen & Nächste Schritte

---

## Schritt 0 – Konfiguration und Datenschutz (VERBINDLICH)

- `tutor-config.md` im Arbeitsordner lesen → `Prüfende Lehrkraft` für das Feld `pruefenderLehrer`.
- Das Modell sieht **nur Pseudonyme** (`S-0001 …`). Klarnamen, E-Mail und Login werden **nie** in die
  JSON-Datei oder in Dateinamen geschrieben. Der fertige Bericht wird erst ganz am Ende **lokal** durch
  den MCP-Server rehydriert (Schritt 4b) – die Klarnamen verlassen dabei nie den Server.
- `Berichte/` nicht öffnen oder lesen.

---

## Schritt 1 – Schüler auflösen und Lernprotokoll finden

Nennt der Benutzer einen Namen: `moodle_resolve_student(query="<Name>", courseid=<kurs_id>)` → liefert
`userid` + Pseudonym (ohne Klarnamen). Lernprotokolle liegen unter `Lernprotokolle/<userid>.md`.
Lies die Datei vollständig. Fehlt sie, nur mit Live-Daten arbeiten.

---

## Schritt 1b – Live-Daten aus Moodle (Pflicht, Protokoll nur ergänzend)

- `moodle_get_course_grades(courseid, userid)` → Noten **und** Feedback je Aufgabe
- `moodle_get_activity_completion(courseid, userid)` → Abschlüsse + `timecompleted`
- Weichen Protokoll und Live-Daten ab: **Live-Daten gewinnen**.

**Letzter Zugriff im Kurs** – wichtige Regel:
- Nur den jüngsten echten `timecompleted`-Zeitstempel eintragen
- Das Erstellungsdatum des Lernprotokolls ist **kein** Kurszugriff
- Kein echter Zugriff abrufbar: `"letzterZugriff": "–"`

---

## Schritt 2 – Berichte-Ordner sicherstellen

```bash
mkdir -p <projektordner>/Berichte
```

---

## Schritt 3 – Daten aus dem Lernprotokoll extrahieren

Erzeuge `/tmp/bericht_data.json` per Python-Skript (kein direktes Schreiben der JSON-Datei –
das vermeidet Encoding-Probleme mit Sonderzeichen und Emojis):

```python
import json

data = {
  # ── PFLICHT: Stammdaten als eigenes Top-Level-Objekt ──────────────────────────
  # Das Script liest diese Felder aus stammdaten, NICHT aus student!
  "stammdaten": {
    "vollstaendigerName": "S-0004",                # Pseudonym – wird in Schritt 4b lokal rehydriert
    "benutzername":       "–",                     # NIE Login eintragen
    "benutzerId":         786,                     # Pflicht (int)
    "email":              "–",                     # NIE E-Mail eintragen
    "rolle":              "Teilnehmer/in (Student)",
    "letzterZugriff":     "Noch kein Zugriff",   # aus Moodle lesen; nie Protokolldatum verwenden!
    "kurs":               "KI-Test (Kurs 86)",     # Pflicht – vollständiger Kursname
    "pruefenderLehrer":   "<aus tutor-config.md>"
  },

  # ── PFLICHT: kursname als Top-Level-Feld (wird im Kopfbereich angezeigt) ──────
  "kursname": "KI-Test (Kurs 86)",

  # ── student wird nur noch für reportDate-Kontext gebraucht ───────────────────
  "student": {
    "name":   "S-0004",
    "userid": 786
  },

  "reportDate": "2026-06-05",

  "overview": {
    "gesamtfortschritt":    "6%",
    "aktivitaetsabschluesse": "3/24 (12,5 %)",
    "abgaben":              "1/16 (6,25 %)",
    "gesamtnote":           "32,27 / 100",
    "aktiveLernsituation":  "LS 7.1 - Durchfuehren / Abschluss",
    "letzteAktivitaet":     "04.06.2026, 10:38 Uhr",
    "kategorie":            "Kritisch"
  },

  "lernfortschrittNachLS": [
    {
      "ls":          "LS 7.1 - IoT-Einstieg: LED-Steuerung mit dem ESP32",
      "status":      "Begonnen",
      "aktivitaeten": [
        { "name": "ESP32-Grundlagen Infoblatt",            "status": "Abgeschlossen",       "ergebnis": "Manuell markiert" },
        { "name": "Analysebogen: ESP32 und Kundenauftrag", "status": "Abgegeben & bewertet","ergebnis": "35/100 (35%)" },
        { "name": "Frequenzberechnung und Schaltplan",     "status": "Nicht abgegeben",     "ergebnis": "-" },
        { "name": "Arduino-Implementierungsleitfaden",     "status": "Aufgerufen",          "ergebnis": "Gelesen" },
        { "name": "Quellcode main.cpp einreichen",         "status": "Nicht abgegeben",     "ergebnis": "-" },
        { "name": "Messprotokoll und Soll-Ist-Vergleich",  "status": "Nicht abgegeben",     "ergebnis": "-" },
        { "name": "Reflexion und Praesentation",           "status": "Nicht abgegeben",     "ergebnis": "-" },
        { "name": "Abschlusstest 7.1 (Quiz)",              "status": "Versucht (20 Sek.)",  "ergebnis": "0,5/10 (5%)" }
      ],
      "hinweis": "Abschlusstest in ca. 20 Sekunden absolviert - gilt als Diagnose, nicht als Kompetenznachweis."
    },
    {
      "ls":          "LS 7.2 - IoT-Webserver: LED-Frequenzsteuerung mit dem ESP32",
      "status":      "Nicht begonnen",
      "aktivitaeten": [],
      "hinweis":     "Alle 8 Aktivitaeten stehen aus."
    },
    {
      "ls":          "LS 7.3 - Smarte Beleuchtungssteuerung: ESP32 LED-Dimmer",
      "status":      "Nicht begonnen",
      "aktivitaeten": [],
      "hinweis":     "Alle 10 Aktivitaeten stehen aus."
    }
  ],

  "kompetenzen": [
    "Kann ESP32-Grundlagen und PlatformIO benennen. (LS 7.1, Phase Informieren, 04.06.2026)",
    "Kann setup() und loop() korrekt abgrenzen. (LS 7.1, Phase Informieren, 04.06.2026)"
  ],

  "lernverlauf": [
    {
      "datum":                 "04.06.2026",
      "kurs":                  "KI-Test (86)",
      "abgaben":               "1/16",
      "aktivitaetsabschluesse":"3/24",
      "fortschritt":           "6%",
      "ls":                    "LS 7.1 - Informieren/Durchfuehren",
      "kategorie":             "kritisch",
      "kompetenzen":           "Infoblatt gelesen, setup()/loop() abgrenzen, Vorwiderstand, Leitfaden gesichtet."
    }
  ],

  "feedback": [
    {
      "aufgabe":     "Analysebogen: ESP32 und Kundenauftrag",
      "datum":       "2026-06-04",
      "note":        "35/100 (35%)",
      "positiv":     [
        "Den Unterschied zwischen setup() und loop() korrekt beschrieben.",
        "Hinweis zur LED-Schutzschaltung geht in die richtige Richtung."
      ],
      "verbesserung": [
        "Fragen 1 und 5 nicht beantwortet - Materialien erneut durcharbeiten.",
        "Frage 2: Unterschied INPUT- vs. OUTPUT-Modus fehlt.",
        "Frage 4: Technische Begruendung fuer Vorwiderstand fehlt."
      ],
      "empfehlung": "Antworten anhand der bereitgestellten Materialien ueberarbeiten und neu einreichen."
    }
  ],

  "kommunikation": [
    {
      "datum":  "04.06.2026",
      "tenor":  "Klar mahnend",
      "inhalt": "Engagement anerkannt, auf Reihenfolge hingewiesen: erst Analysebogen ueberarbeiten, dann Frequenzberechnung + main.cpp."
    }
  ],

  "chatDialog": [
    {
      "datum":    "04.06.2026 13:30",
      "schueler": "Ich glaube so etwas brauche ich nie wieder im Leben!",
      "tutor":    "Validierung der Frustration; Erinnerung an Kompetenzen; konkreter naechster Schritt.",
      "tenor":    "Emotionale Unterstuetzung - Hilfe zur Selbsthilfe."
    }
  ],

  "empfehlungen": [
    { "prio": "1", "massnahme": "Analysebogen LS 7.1 ueberarbeiten und neu einreichen.",      "ziel": "Note auf >70 % steigern; Analysephase abschliessen." },
    { "prio": "2", "massnahme": "Frequenzberechnung und Schaltplan einreichen.",               "ziel": "Planungsphase vollstaendig abschliessen." },
    { "prio": "3", "massnahme": "Quellcode main.cpp implementieren und einreichen.",           "ziel": "Durchfuehrungsphase abschliessen." },
    { "prio": "4", "massnahme": "Messprotokoll + Reflexion einreichen, Abschlusstest ablegen.","ziel": "LS 7.1 vollstaendig abschliessen." },
    { "prio": "5", "massnahme": "LS 7.2 und LS 7.3 aufnehmen.",                               "ziel": "Kursfortschritt auf Kursniveau bringen." }
  ],

  "outputDir":      "/pfad/zu/Berichte",
  "outputFilename": "Aktivitaetsbericht_<userid>_YYYY-MM-DD.docx"
}

with open('/tmp/bericht_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=True, indent=2)
```

### Wichtige Regeln für die JSON-Erzeugung

**Stammdaten (Pflichtfelder – alle müssen befüllt sein):**
- `stammdaten` ist ein **eigenes Top-Level-Objekt** – nicht innerhalb von `student` verschachteln
- `kursname` ist ein **eigenes Top-Level-Feld** (String) – zusätzlich zu `stammdaten.kurs`
- `vollstaendigerName` und `student.name`: **immer das Pseudonym** – der Klarname wird erst in Schritt 4b lokal eingesetzt
- `email`, `benutzername`: immer `"–"` (das Modell kennt diese Daten nicht und soll sie nicht kennen)
- Kein Feld darf leer bleiben – notfalls `"–"` als Platzhalter

**Encoding:**
- Umlaute in `outputFilename` ersetzen: ä→ae, ö→oe, ü→ue, ß→ss
- JSON immer per Python mit `ensure_ascii=True` schreiben (vermeidet Encoding-Fehler)
- In allen anderen Feldern (Freitext) dürfen Umlaute/Emojis stehen

**`outputFilename`**: `Aktivitaetsbericht_{userid}_{YYYY-MM-DD}.docx` (keine Namen im Dateinamen)

**`lernfortschrittNachLS`** (Pflicht):
- Aktivitätsnamen aus dem Protokoll übernehmen; sonst generische Namen
- `status` der LS: „Nicht begonnen" / „Begonnen" / „Abgeschlossen"
- `hinweis` für besondere Beobachtungen

**`feedback`**: Leeres Array `[]` wenn keine Noten/Rückmeldungen im Protokoll.

**`empfehlungen`**: Mindestens 2–5 Einträge, aus dem Gesamtbild abgeleitet.

---

## Schritt 4 – Word-Dokument erzeugen

Das Script liegt im Skill-Verzeichnis unter `scripts/generate_bericht.js`.
Da das Skill-Verzeichnis read-only ist, in `/tmp` arbeiten:

```bash
# Skill-Scripts in beschreibbares Verzeichnis kopieren (falls noch nicht vorhanden)
[ -d /tmp/bericht_work ] || cp -r <skill-verzeichnis>/scripts /tmp/bericht_work

# Abhängigkeiten installieren (falls noch nicht vorhanden)
[ -d /tmp/bericht_work/node_modules ] || (cd /tmp/bericht_work && npm install docx)

# Bericht generieren – gibt Ausgabepfad auf stdout aus
cd /tmp/bericht_work && node scripts/generate_bericht.js /tmp/bericht_data.json
```

Wenn das Script die Ausgabedatei direkt nach `outputDir` schreiben kann (Schreibrechte vorhanden),
ist alles fertig. Andernfalls Datei manuell kopieren:

```bash
cp /tmp/<outputFilename> <projektordner>/Berichte/
```

Das Script gibt den vollständigen Ausgabepfad auf stdout aus.

---

## Schritt 4b – Lokal rehydrieren

```
moodle_rehydrate_report(infile="<Pfad zur erzeugten .docx>", field="fullname")
```

Der MCP-Server ersetzt das Pseudonym in der Datei lokal durch den Klarnamen. Die Rückgabe enthält nur
Metadaten (Anzahl Ersetzungen). Die rehydrierte Datei danach **nicht** mehr öffnen oder lesen.

---

## Schritt 5 – Ergebnis melden

Nenne kurz Speicherort (`Berichte/…`), Kategorie und die wichtigste Empfehlung – mit Pseudonym bzw.
dem vom Benutzer genannten Namen, nie mit Daten aus dem rehydrierten Bericht.
