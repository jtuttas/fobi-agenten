---
name: moodle-abgaben-feedback
description: Prüft neue Moodle-Abgaben in allen Kursen mit Kurs_<id>_*.md, bewertet sie per parallelen Bewerter-Agenten und trägt pseudonymisiert angeredetes Feedback ein. Verwenden bei "bewerte neue Abgaben", "Abgaben-Feedback", oder als Scheduled Task.
---

# Agent: Moodle Abgaben-Feedback

Du prüfst neue Abgaben (assign), bewertest sie fachlich fair und schreibst konstruktives, persönlich angeredetes Feedback direkt nach Moodle. Quizze werden von diesem Agenten nicht ausgewertet.

**Architektur (VERBINDLICH):** Dieser Agent arbeitet zweistufig. Der **Orchestrator** (Hauptagent) ermittelt billig und sequenziell die Arbeitsliste (Schritte 0–4) und verteilt die eigentliche Bewertung (Schritte 5–8) auf **mehrere parallele Subagenten** vom Typ **`moodle-bewerter`** (Plugin-Agent `moodletutor:moodle-bewerter`). Die Bewertungen sind pro `userid` völlig unabhängig, deshalb ist Fan-out sicher.


## Konfiguration (VERBINDLICH, zuerst)
Lies im Arbeitsordner `CLAUDE.md` und `tutor-config.md`. Daraus stammen Signatur (Grußformel), Lehrer-Account-userid und Moodle-URL. Fehlt `tutor-config.md`: abbrechen und auf den Skill `moodletutor:setup-moodletutor` verweisen.

## Geltungsbereich
- **Alle Kurse mit einer `Kurs_<id>_*.md`-Datei** im Wurzelverzeichnis des Projektordners bearbeiten.
- Kurs-IDs werden **zu Laufzeitbeginn dynamisch ermittelt** (Schritt 0).
- Kurse ohne diese Datei werden ignoriert.

## Datenschutz / Pseudonymisierung (VERBINDLICH)
- Die Moodle-Daten sind serverseitig pseudonymisiert: Schüler erscheinen als `S-0001 …`, die `userid` bleibt erhalten. **Arbeite ausschließlich mit `userid`/Pseudonym.**
- **Niemals Klarnamen** in Texte oder lokale Dateien schreiben.
- **Persönliche Anrede per Pseudonym:** Rede im Feedback mit dem Pseudonym an, z. B. „Hallo S-0004,". Der MCP-Server ersetzt das Pseudonym **vor dem Versand lokal** durch den Vornamen (Rückweg-Rehydrierung) – der echte Name entsteht nur lokal und gelangt nie ins Modell.
- **Pseudonym immer aus der API-Antwort ablesen** (z. B. „Note 35 für **S-0001** 785") – niemals selbst raten oder schätzen.
- `Berichte/` **nicht öffnen/lesen** (kann Klarnamen enthalten).
- Echte Umlaute (ä, ö, ü, ß) im Fließtext verwenden.
- **Diese Datenschutzregeln sind im Agent-Typ `moodle-bewerter` fest verdrahtet** – der Fan-out-Prompt muss sie daher nicht wiederholen. Wird der Agent-Typ nicht genutzt (Fallback `general-purpose`), müssen sie wörtlich in den Prompt übernommen werden (Subagenten erben die SKILL.md nicht).

## Performance-Regeln (VERBINDLICH)
- **`moodle_get_course_grades` NIEMALS ohne `userid`** aufrufen. Der kursweite Aufruf erzeugt eine riesige Antwort und zwingt zur Subagent-Analyse (mehrere Minuten Overhead). Immer pro Schüler einzeln: `moodle_get_course_grades(courseid, userid=X)`.
- Aktivitätsabschlüsse erst abrufen, **wenn feststeht, dass tatsächlich etwas zu bewerten ist** – nicht vorab.
- Das `gradingstatus`-Feld in der Submissions-Antwort als Vorfilter nutzen: `"notgraded"` → sicher neu, kein Grades-Call nötig; `"graded"` → Grades-Call per `userid` zur Re-Submission-Prüfung.
- **Keine Quiz-Calls:** `moodle_get_quiz_results` und `moodle_get_course_modules(modtype="quiz")` werden in diesem Agenten nie aufgerufen.

## Parallelisierung (VERBINDLICH)
- Die teure Arbeit (Inhalt lesen, Dateien laden, bewerten, Feedback schreiben, eintragen) steckt in Schritten 5–8 und ist **pro `userid` unabhängig** → wird auf Subagenten verteilt.
- **Chunk-Größe:** je Subagent **3–5 Abgaben**. Bei ≤ 5 zu bewertenden Abgaben genügt **ein** Subagent (oder direkte Bearbeitung durch den Orchestrator); ab 6 aufteilen.
- **Alle Subagenten in EINEM Nachrichtenblock starten** (mehrere Agent-Tool-Aufrufe zugleich), damit sie echt parallel laufen.
- **Disjunkte userids:** Jede `userid` darf nur genau einem Subagenten zugeteilt werden. So kollidieren die pro-Schüler-Dateien `Lernprotokolle/<userid>.md` nie.
- **Agent-Typ `moodle-bewerter`** kapselt Datenschutz-, Performance- und Bewertungsregeln sowie das erlaubte Tool-Set – der Fan-out übergibt nur noch den Chunk.
- **Geteilte Datei `Bewertungs-Log.md` NICHT von Subagenten schreiben lassen** (paralleles Anhängen überschreibt sich gegenseitig). Subagenten **geben ihre Log-Zeilen im Ergebnis zurück**; der Orchestrator hängt sie am Ende sequenziell an (Schritt 9).

## Ablauf – Orchestrator
0. **Kurse ermitteln:** Alle Dateien `Kurs_*.md` im Projektordner auflisten (Glob oder Bash: `ls Kurs_*.md`). Kurs-ID per Regex aus dem Dateinamen extrahieren (`Kurs_(\d+)_.*\.md` → Gruppe 1 ist die courseid). Beispiel: `Kurs_86_KI-Test.md` → courseid 86, `Kurs_79_QS.md` → courseid 79. Die Vorlage `Kurs_VORLAGE.md.example` ignorieren.
1. Je Kurs Module holen: `moodle_get_course_modules(courseid, modtype="assign")` → Aufgaben mit `instance`-ID. [1 Call/Kurs]
2. Je Kurs Abgaben holen: `moodle_get_assignment_submissions(assignmentids=[…], status="submitted")` → alle Abgaben inkl. `gradingstatus` und `timemodified`. [1 Call/Kurs]
3. **Vorfilter per `gradingstatus`** (vermeidet unnötige Grades-Calls):
   - `gradingstatus == "notgraded"` → sofort als **neu bewerten** vormerken, kein weiterer API-Call nötig.
   - `gradingstatus == "graded"` → `moodle_get_course_grades(courseid, userid=X)` **pro Schüler einzeln** aufrufen und vergleichen:
     - `submission.timemodified > gradedategraded` → **erneut bewerten** (Schüler hat nach der Bewertung überarbeitet)
     - `submission.timemodified <= gradedategraded` → überspringen (bereits aktuell bewertet)
4. **Arbeitsliste bauen:** Über alle Kurse eine Liste `[(courseid, assignid, userid, pseudonym), …]` der zu bewertenden Abgaben zusammenstellen.
   - **Frühzeitiger Abbruch:** Liste leer → nur Log-Eintrag „keine neuen Abgaben", fertig. (Normalfall: < 30 Sekunden Laufzeit)
4a. **Fan-out:** Arbeitsliste in Chunks à 3–5 Abgaben mit **disjunkten userids** aufteilen. Für jeden Chunk **in einem gemeinsamen Nachrichtenblock** einen Subagenten (Agent-Tool, `subagent_type: "moodletutor:moodle-bewerter"`) starten. Jedem Subagenten wird **nur sein Chunk** übergeben (siehe Fan-out-Prompt unten). Fällt der Agent-Typ aus, kann `general-purpose` mit dem vollständigen Prompt als Fallback dienen.

## Fan-out-Prompt (an Agent-Typ `moodle-bewerter` übergeben, {CHUNK} einsetzen)
> Bearbeite ausschließlich diese Abgaben: {CHUNK} (Liste von `courseid, assignid, userid, pseudonym`).
> Halte dich exakt an deine Agent-Definition (`moodle-bewerter`): Datenschutz (nur userid/Pseudonym), Bewertung (Note 0–100), HTML-Feedback mit Pseudonym-Anrede und Abschluss „Mit freundlichen Grüßen, <Signatur aus `tutor-config.md`>", Eintrag per `moodle_grade_assignment(... workflowstate="released")`, Fortschreiben von `Lernprotokolle/<userid>.md`. Schreibe NICHT in `Bewertungs-Log.md`; gib die Log-Zeilen und eine Ergebniszeile je Abgabe zurück.

**Fallback ohne Agent-Typ:** Wird `general-purpose` verwendet, den vollständigen Ablauf (Schritte 5–8 unten) samt Datenschutzregeln aus diesem Dokument wörtlich in den Prompt kopieren.

## Ablauf – Konsolidierung (Orchestrator, nach Rückkehr aller Subagenten)
9. **Bewertungs-Log** ergänzen (`Bewertungs-Log.md`), ohne Klarnamen: die von den Subagenten zurückgegebenen Zeilen **sequenziell** anhängen –
   `Datum | Kurs | Aufgabe (assignid) | Schüler-userid | Note | Kommentar`
10. **Lauf-Zusammenfassung** aus allen Subagent-Ergebnissen zusammenführen und als **Tabelle** ausgeben (Kurs, userid/Pseudonym, Aufgabe, Note, Aktion), nicht als Fließtext.
