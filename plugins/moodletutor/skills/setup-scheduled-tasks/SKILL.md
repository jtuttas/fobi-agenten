---
name: setup-scheduled-tasks
description: Registriert die drei MoodleTutor-Hintergrund-Agenten (Abgaben-Feedback, Lernberater, Nachrichten-Tutor) als Scheduled Tasks auf diesem Rechner. Verwende diesen Skill IMMER bei der Erstinstallation auf einem neuen Rechner oder wenn der Benutzer sagt: „richte die Scheduled Tasks ein", „installiere die Automatik-Agenten", „lege die Hintergrund-Tasks an", „Scheduled Tasks einrichten", „Tasks registrieren". Idempotent: bestehende Tasks gleicher ID werden aktualisiert statt dupliziert.
---

# Setup: MoodleTutor Scheduled Tasks

Dieser Skill registriert die drei Hintergrund-Agenten als Scheduled Tasks. Die eigentliche Logik bleibt **einzige Quelle der Wahrheit** in den Skills des Plugins `moodletutor` und in `CLAUDE.md` des Arbeitsordners. Die Scheduled Tasks sind nur **dünne Wrapper**, die auf diese Skills verweisen. So genügt bei Verbesserungen ein Plugin-Update, die Tasks bleiben unverändert.

## Wichtiger Kontext (warum so)
- Scheduled Tasks werden außerhalb des Projektordners gespeichert (`…/Claude/Scheduled/<taskId>/SKILL.md`) und daher **nicht** per Git mit dem Projekt kopiert → auf jedem neuen Rechner einmal neu registrieren.
- Jeder Task-Lauf startet in einer **frischen Session ohne Gedächtnis** → die Prompts unten sind bewusst selbsttragend (Arbeitsordner + CLAUDE.md + Plugin-Skill benennen).
- Die Agent-Typen kommen aus dem Plugin (`moodletutor:…`). Sind sie in einer Umgebung nicht als `subagent_type` verfügbar, erlauben die Prompts ausdrücklich den `general-purpose`-Fallback für den Fan-out.

## Voraussetzungen (vorher prüfen, nicht automatisch erledigen)
1. Der MoodleTutor-Arbeitsordner ist in Claude geöffnet/verbunden und mit `moodletutor:setup-moodletutor` eingerichtet (`tutor-config.md` vorhanden).
2. Moodle-Tools sind verfügbar (`mcp__plugin_moodletutor_moodle-agent-mcp__*` aus dem Plugin oder `mcp__moodle-agent__*` aus einer separaten Installation) – siehe Skill `moodletutor:setup-moodletutor`, Schritt 1.
3. Mindestens eine `Kurs_<id>_*.md`-Datei existiert im Projektordner.

Sind 1–3 nicht erfüllt, den Benutzer darauf hinweisen und erst danach fortfahren.

## Vorgehen
Rufe für **jeden** der drei Tasks `create_scheduled_task` mit exakt der unten angegebenen `taskId`, `cronExpression`, `description` und `prompt` auf. Gleiche `taskId` → vorhandener Task wird aktualisiert (idempotent, keine Duplikate). Cron ist **lokale Zeit**.

Nach dem Anlegen kurz `list_scheduled_tasks` aufrufen und dem Benutzer eine Bestätigungstabelle (taskId, Zeitplan, enabled) zeigen. Falls Tasks als `enabled: false` erscheinen, anbieten, sie per `update_scheduled_task(enabled=true)` zu aktivieren.

---

### Task 1 – Abgaben-Feedback
- **taskId:** `moodletutor-abgaben-feedback`
- **cronExpression:** `1 6 * * *`  (täglich 06:01)
- **description:** `Prüft täglich neue Schülerabgaben in betreuten Moodle-Kursen, bewertet sie fachlich und trägt persönlich adressiertes Feedback in Moodle ein (parallelisiert via Subagenten).`
- **prompt:**
> Du bist der MoodleTutor-Agent „Abgaben-Feedback" und läufst als geplanter Hintergrund-Task in einer frischen Session. Arbeite im verbundenen MoodleTutor-Arbeitsordner. Lies zuerst `CLAUDE.md` und `tutor-config.md` (verbindliche Regeln: Datenschutz/Pseudonymisierung, Nachrichtenformat, Bewertungs-Log) und dann den Plugin-Skill `moodletutor:moodle-abgaben-feedback`. Führe diesen Skill vollständig aus: Orchestrator ermittelt die Arbeitsliste (Schritte 0–4), Fan-out der Bewertung (5–8) auf parallele Subagenten, Konsolidierung des `Bewertungs-Log.md` (9–10). Nutze für den Fan-out den Agent-Typ `moodletutor:moodle-bewerter`; ist dieser nicht als subagent_type verfügbar, verwende `general-purpose` mit dem in der SKILL.md hinterlegten vollständigen Prompt inklusive der Datenschutzregeln. Halte alle Datenschutzregeln strikt ein (nur userid/Pseudonym, keine Klarnamen in Dateien, `Berichte/` nicht lesen). Gib am Ende die Lauf-Zusammenfassung als Tabelle aus.

### Task 2 – Lernberater
- **taskId:** `moodletutor-lernberater`
- **cronExpression:** `8 7 * * 1`  (montags 07:08)
- **description:** `Wöchentliche Lernfortschrittsanalyse je Schüler: pflegt pseudonymisierte Protokolle, aktualisiert die Fortschrittsübersicht und sendet personalisierte Moodle-Nachrichten (parallelisiert via Subagenten).`
- **prompt:**
> Du bist der MoodleTutor-Agent „Lernberater" und läufst als geplanter Hintergrund-Task in einer frischen Session. Arbeite im verbundenen MoodleTutor-Arbeitsordner. Lies zuerst `CLAUDE.md` und `tutor-config.md` und dann den Plugin-Skill `moodletutor:moodle-lernberater`. Führe diesen Skill vollständig aus: Orchestrator holt Schülerliste und Quiz-IDs einmal pro Kurs (Schritte 0–1), Fan-out der pro-Schüler-Analyse (2–6) auf parallele Subagenten, Konsolidierung von `Lernfortschritt_Kurs_<id>.md` (7–8). Nutze für den Fan-out den Agent-Typ `moodletutor:moodle-lernberater-analyst`; ist dieser nicht als subagent_type verfügbar, verwende `general-purpose` mit dem vollständigen Prompt inklusive Datenschutz- und Datenquellen-Regeln aus der SKILL.md. Immer Live-Daten ziehen (Protokoll nur ergänzend). Datenschutzregeln strikt einhalten. Gib die Lauf-Zusammenfassung als Tabelle aus.

### Task 3 – Nachrichten-Tutor
- **taskId:** `moodletutor-nachrichten-tutor`
- **cronExpression:** `*/30 * * * *`  (alle 30 Minuten)
- **description:** `Reagiert auf neue Schüler-Nachrichten in Moodle nach dem Prinzip Hilfe zur Selbsthilfe, persönlich angeredet, und protokolliert den Dialog pseudonymisiert (parallelisiert via Subagenten).`
- **prompt:**
> Du bist der MoodleTutor-Agent „Nachrichten-Tutor" und läufst als geplanter Hintergrund-Task in einer frischen Session. Arbeite im verbundenen MoodleTutor-Arbeitsordner. Lies zuerst `CLAUDE.md` und `tutor-config.md` und dann den Plugin-Skill `moodletutor:moodle-nachrichten-tutor`. Führe diesen Skill vollständig aus: Orchestrator ermittelt ungelesene Konversationen (Schritt 1); bei keinen ungelesenen Nachrichten kurzer Vermerk und Ende. Sonst Fan-out der Beantwortung (2–5) auf parallele Subagenten. Nutze den Agent-Typ `moodletutor:moodle-nachrichten-beantworter`; ist dieser nicht als subagent_type verfügbar, verwende `general-purpose` mit dem vollständigen Prompt inklusive Datenschutz- und Tutor-Regeln aus der SKILL.md. Hilfe zur Selbsthilfe (Denkanstoß statt Lösung), Anrede per Pseudonym, Datenschutzregeln strikt einhalten. Gib die Lauf-Zusammenfassung als Tabelle aus.

---

## Nach der Registrierung
- Hinweis an den Benutzer: Scheduled Tasks laufen nur, während die Claude-App geöffnet ist; verpasste Läufe werden beim nächsten Start nachgeholt.
- Zum Pausieren einzelner Tasks: `update_scheduled_task(taskId, enabled=false)`.
- Zum Ändern eines Zeitplans: `update_scheduled_task(taskId, cronExpression="…")`.
