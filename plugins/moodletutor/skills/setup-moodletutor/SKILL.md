---
name: setup-moodletutor
description: Richtet einen MoodleTutor-Arbeitsordner ein (tutor-config.md, CLAUDE.md, Kursvorlage, Ordner für Lernprotokolle und Berichte) und prüft den MCP-Server moodle-agent. Verwenden bei "MoodleTutor einrichten", "setup moodletutor", "Tutor-Arbeitsordner anlegen" oder wenn tutor-config.md fehlt.
---

# Setup: MoodleTutor-Arbeitsordner

Richte den aktuell geöffneten Ordner als MoodleTutor-Arbeitsordner ein. Überschreibe keine bestehenden
Dateien; frage nach, falls `tutor-config.md` oder `CLAUDE.md` schon existieren.

## Schritt 1 – Voraussetzung prüfen: MCP-Server

Das Plugin bringt den MCP-Server `moodle-agent-mcp` als MCPB-Paket mit. Prüfe, ob Moodle-Tools
verfügbar sind – in einer dieser Namensformen (die Agenten erben die Tools ihrer Umgebung und kommen mit allen zurecht):
- `mcp__plugin_moodletutor_moodle-agent-mcp__…` → Server aus diesem Plugin
- `mcp__moodle-agent__…` → separat installierter Server (z. B. Claude-Desktop-Erweiterung)
- `mcp__remote-devices__moodle-agent__…` → lokaler Server, durchgereicht in eine Cloud-Sitzung, die mit dem Rechner verbunden ist

Sind **beide** aktiv, darauf hinweisen und empfehlen, einen davon zu deaktivieren (beide nutzen
standardmäßig dieselbe Zuordnungsdatei `~/MoodleAgent/pseudonym-map.json`).

Fehlen sie ganz:
- **Claude-Desktop-App (Cowork oder Tab „Code") – Standardweg:** Server als Erweiterung installieren:
  <https://github.com/jtuttas/moodle-agent-mcp/releases/latest/download/moodle-agent-mcp.mcpb>
  doppelklicken bzw. unter Einstellungen → Erweiterungen hineinziehen, Moodle-URL und API-Token
  eintragen. Der im Plugin eingebettete Server startet in der Desktop-App nicht.
- **Claude Code im Terminal:** `/plugin` → Installed → `moodletutor` → **Configure** → Moodle-URL und
  API-Token eintragen, danach `/reload-plugins`.

Ohne Moodle-Tools arbeitet keiner der Agenten – dann hier abbrechen.

## Schritt 2 – Angaben der Lehrkraft erfragen

Frage in einer Rückfrage ab:
1. **Signatur** für Nachrichten und Feedback, z. B. „Erika Muster"
2. **Prüfende Lehrkraft** für Berichte, z. B. „Erika Muster (MU), BBS Musterstadt"
3. **Moodle-Basis-URL**, z. B. `https://moodle.example.de/`
4. **Lehrer-Account-userid** in Moodle – falls unbekannt: über `moodle_get_conversations` bzw. eigene
   Profildaten ermitteln oder die Lehrkraft im Moodle-Profil nachsehen lassen (Zahl in der Profil-URL `id=`)

## Schritt 3 – Dateien anlegen

1. `tutor-config.md` aus `references/tutor-config.template.md` mit den Angaben aus Schritt 2
2. `CLAUDE.md` aus `references/CLAUDE.template.md` (unverändert übernehmen)
3. `Kurs_VORLAGE.md.example` aus `references/Kurs_VORLAGE.md.example`, Moodle-URL einsetzen
4. Leere Dateien/Ordner: `Lernprotokolle/`, `Berichte/`, `Bewertungs-Log.md` mit Kopfzeile
   `Datum | Kurs | Aufgabe (assignid) | Schüler-userid | Note | Kommentar`
5. `.gitignore` mit: `Lernprotokolle/`, `Berichte/`, `Bewertungs-Log.md`, `Lernfortschritt_Kurs_*.md`,
   `Kurs_*.md`, `!Kurs_VORLAGE.md.example`

## Schritt 4 – Ersten Kurs aktivieren

Frage nach der Moodle-Kurs-ID. Rufe `moodle_get_course_info(courseid)` und
`moodle_get_course_modules(courseid)` auf und erzeuge daraus `Kurs_<id>_<Kurzname>.md` nach der Vorlage
(Lernsituationen, Phasen, cmids). Nur Kurse mit einer solchen Datei werden von den Agenten bearbeitet.

## Schritt 5 – Abschluss

Zeige eine kurze Übersicht der angelegten Dateien und nenne die nächsten Schritte:
- Testlauf von Hand: „Bewerte neue Abgaben" (Skill `moodle-abgaben-feedback`)
- Automatik einrichten: Skill `moodletutor:setup-scheduled-tasks`
