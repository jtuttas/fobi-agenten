# fobi-agenten – Multi-Agenten-Beispiele

Plugin-Marketplace für die Lehrerfortbildung **MoodleAgentFoBi** (MMBbS Hannover).

| Plugin | Muster | Aufruf |
|---|---|---|
| `redaktion` | Orchestrator, Fan-out, Prüfer, Pipeline | `/redaktion:ausgabe <Thema>` |
| `klassenarbeit` | Generator–Kritiker mit Überarbeitungsschleife (jedes Fach) | `/klassenarbeit:klassenarbeit <Fach/Thema, Dauer>` |
| `moodletutor` | Orchestrator, Fan-out, Konsultation, Scheduled Tasks | `/moodletutor:setup-moodletutor` |

## Installation

**Claude Code**

```bash
claude plugin marketplace add jtuttas/fobi-agenten
claude plugin install redaktion@fobi-agenten
claude plugin install klassenarbeit@fobi-agenten
claude plugin install moodletutor@fobi-agenten
```

Ohne GitHub (ZIP entpacken): statt `jtuttas/fobi-agenten` den Pfad
`./fobi-agenten` angeben.

Für `moodletutor` zusätzlich den MCP-Server einrichten – siehe Abschnitt „Plugin moodletutor".

**Claude-Desktop-App, Tab Code** (lokale Sitzung): einmal
`/plugin marketplace add jtuttas/fobi-agenten` eingeben, dann **+** neben dem Eingabefeld →
**Plugins** → **Add plugin** → Plugin wählen.

**Claude-App (Cowork)**: Die Dateien `redaktion.plugin`, `klassenarbeit.plugin` und
`moodletutor.plugin` aus dem Moodle-Kurs im Chat öffnen und übernehmen – oder über *Anpassen →
Plugins → Marketplace hinzufügen* mit `https://github.com/jtuttas/fobi-agenten`. Für `moodletutor`
den MCP-Server zusätzlich als Erweiterung installieren (siehe unten).

---

## Plugin „redaktion"

Eine Zeitungsredaktion als Multi-Agenten-System:

```
/redaktion:ausgabe <Thema>          ← Chefredaktion (Orchestrator)
   ├─► reporter (Politik)  ┐
   ├─► reporter (Sport)    ├ parallel → artikel_<ressort>.md
   └─► reporter (Kultur)   ┘
          │
   faktenchecker                     → pruefbericht.md
          │
   lektor                            → ausgabe.md
```

| Rolle | Muster | Darf |
|---|---|---|
| Chefredaktion (Skill „ausgabe") | Orchestrator | nur planen und verteilen |
| reporter (1 Definition, 3× gestartet) | Fan-out | recherchieren, schreiben |
| faktenchecker | unabhängiger Prüfer | lesen, recherchieren, Bericht schreiben |
| lektor | Pipeline-Endstufe | lesen, schreiben – keine Recherche |

**Ausprobieren** in einem leeren Ordner:

```
/redaktion:ausgabe Künstliche Intelligenz in der Schule
```

In der Claude-App: „Erstelle eine Zeitungsausgabe zum Thema Künstliche
Intelligenz in der Schule".

Es entstehen `artikel_politik.md`, `artikel_sport.md`, `artikel_kultur.md`,
`pruefbericht.md` und `ausgabe.md`.

**Arbeitsaufträge**

1. **Beobachten:** Welcher Agent läuft wann? Was läuft parallel?
2. **Schnittstellen:** Öffnen Sie die Agenten-Dateien. Woran erkennt der
   Faktenchecker, welche Dateien er prüfen soll?
3. **Unabhängigkeit:** Fügen Sie in `artikel_sport.md` eine falsche Zahl ein
   und starten Sie nur den Faktenchecker:
   `Nutze den faktenchecker für die vorhandenen Artikel.` Findet er den Fehler?
4. **Werkzeuge:** Warum hat der Lektor kein `WebSearch`?

---

## Plugin „klassenarbeit"

Ein Autor erstellt, ein unabhängiger Prüfer löst selbst und vergleicht – für **jedes Fach**:

```
/klassenarbeit:klassenarbeit <Fach/Thema, Dauer, Niveau>
   │
   ├─► aufgaben-autor      → aufgaben.md, loesung.md (Erwartungshorizont), ggf. material/
   │
   ├─► loesungs-pruefer    → löst zuerst OHNE loesung.md – ausführbare Aufgaben
   │                         (SQL, Code, Rechnungen) führt er aus –, vergleicht
   │                         danach → pruefbericht.md
   │
   └─► bei Befunden: Autor überarbeitet, neuer Prüfer (max. 2 Runden)
```

| Rolle | Darf | Darf nicht |
|---|---|---|
| aufgaben-autor | lesen, schreiben | Code ausführen |
| loesungs-pruefer | lesen, Code/SQL ausführen, Bericht schreiben | Aufgaben ändern |

Bei nicht ausführbaren Fächern (Wirtschaft, Politik, Planung) prüft er, ob jede Aufgabe
eindeutig ist und ob der Erwartungshorizont alle vertretbaren Antworten abdeckt.

### Übung: Findet der Prüfer die Fehler?

Im Ordner [`uebung/klassenarbeit-sql`](uebung/klassenarbeit-sql) liegt eine
fertige Klassenarbeit der Change-IT GmbH – mit **versteckten Fehlern** in
Aufgabenstellung und Musterlösung. Wie viele es sind, verrät die Kursleitung
erst später.

1. Den Ordner `uebung/klassenarbeit-sql` in einen eigenen Arbeitsordner kopieren
   und dort Claude starten. **Keine Plugin-Installation nötig:** Der Ordner bringt
   die beiden Agenten und den Skill in `.claude/` selbst mit.
   - Claude-Desktop-App: Tab **Code** → lokale Sitzung → diesen Ordner wählen
   - Terminal: `cd klassenarbeit-sql && claude`

   Hinweis: `.claude` ist ein versteckter Ordner – beim Kopieren unter macOS/Linux
   mitkopieren (im Explorer/Finder ggf. versteckte Dateien einblenden).
2. **Selbst prüfen (10 Min.):** Lesen Sie Aufgaben und Musterlösung. Notieren
   Sie alle Fehler, die Sie finden.
3. **Agent prüfen lassen:**
   `Nutze den loesungs-pruefer für die Klassenarbeit in diesem Ordner.`
4. **Vergleichen:** Was hat der Agent gefunden, was Sie? Gibt es Fehlalarme?
5. **Volle Schleife:** Eine Kopie des Ordners anlegen, darin `aufgaben.md`,
   `loesung.md` und den Ordner `material` löschen (`.claude` behalten) und eingeben, gern
   in Ihrem eigenen Fach:
   `/klassenarbeit SQL Joins und Gruppierung, 45 Min., 1. Ausbildungsjahr`
   `/klassenarbeit Politik: Tarifautonomie, 30 Min., Berufsschule Unterstufe`
   (mit installiertem Plugin: `/klassenarbeit:klassenarbeit …`)
6. **Reflexion:** Warum darf der Prüfer `loesung.md` erst nach dem eigenen
   Lösen öffnen? Was würde passieren, wenn Autor und Prüfer derselbe Agent wären?

---

## Plugin „moodletutor" – ein Agentensystem im Echtbetrieb

Ein KI-Tutor für Moodle-Kurse, der an den MMBbS Hannover im Einsatz ist. Er zeigt alle Muster
aus den Demos in einem realen System:

```
Scheduled Task (täglich / wöchentlich / alle 30 Min.)
   │
   ├─ moodle-abgaben-feedback   ── Fan-out ─► moodle-bewerter (je 3–5 Abgaben, parallel)
   ├─ moodle-lernberater        ── Fan-out ─► moodle-lernberater-analyst (je 3–5 Schüler)
   └─ moodle-nachrichten-tutor
        ├─ Konsultation ─► moodle-bewerter / moodle-lernberater-analyst (Beratungsmodus, nur lesen)
        └─ Fan-out ──────► moodle-nachrichten-beantworter
```

**Zweiter MCP-Server:** Die Agenten brauchen den Server
[moodle-agent-mcp](https://github.com/jtuttas/moodle-agent-mcp). Er pseudonymisiert alle
Schülerdaten, **bevor** sie das Modell erreichen (`S-0001 …`), und setzt die Vornamen erst beim
Versand lokal wieder ein.

**Einrichtung – zwei Schritte (Claude-Desktop-App, Cowork oder Tab „Code"):**
1. **MCP-Server als Erweiterung:**
   [`moodle-agent-mcp.mcpb`](https://github.com/jtuttas/moodle-agent-mcp/releases/latest/download/moodle-agent-mcp.mcpb)
   herunterladen und doppelklicken bzw. unter **Einstellungen → Erweiterungen** hineinziehen.
   **Moodle-URL** und **API-Token** eintragen, Pseudonymisierung eingeschaltet lassen.
2. **Plugin `moodletutor` installieren:** Cowork über *Anpassen → Plugins*, im Tab „Code" mit
   `/plugin install moodletutor@fobi-agenten`.

Danach einen leeren Arbeitsordner öffnen und `/moodletutor:setup-moodletutor` ausführen. Das legt
`tutor-config.md` (Signatur, Lehrer-userid), `CLAUDE.md` und die erste `Kurs_<id>_*.md` an. Erst
von Hand testen, dann optional `/moodletutor:setup-scheduled-tasks`.

**Eingebetteter Server (nur Claude Code im Terminal):** Das Plugin enthält den Server zusätzlich
als MCPB-Paket (v1.0.2). Die Desktop-App startet ihn nicht, weil sie dessen Konfiguration nicht
abfragen kann (`user_config_unsupported`). Im Terminal: nach der Installation `/plugin` →
Installed → `moodletutor` → **Configure** → URL und Token eintragen. Die Agenten erkennen jede
Variante. Nicht zwei Server gleichzeitig aktiv lassen – beide nutzen dieselbe Zuordnungsdatei.

**Empfohlene Betriebsart:** eine **lokale** Sitzung – Code-Tab der Desktop-App oder Terminal –
mit dem Arbeitsordner auf dem eigenen Rechner. Das gilt besonders für die Scheduled Tasks.
In einer Cloud-Sitzung, die nur über die Geräte-Brücke mit dem Rechner verbunden ist, heißen die
Moodle-Tools anders (`mcp__remote-devices__moodle-agent__…`) und die Dateien liegen nicht im
Arbeitsverzeichnis. Die Agenten kommen damit zurecht, sind dort aber langsamer.

**Achtung:** Die Agenten schreiben Noten und senden Nachrichten an echte Schülerinnen und Schüler.
Zum Ausprobieren einen Testkurs mit Testkonten verwenden.

**Was man daran sehen kann**
- Warum schreiben Subagenten *nicht* in `Bewertungs-Log.md`, sondern geben Zeilen zurück?
- Wie verhindert der Beratungsmodus, dass eine Konsultation Seiteneffekte hat?
- Welche Entscheidungen bleiben bewusst bei der Lehrkraft (Eskalation, Notensenkung)?

---

## Transfer

Entwerfen Sie ein eigenes Multi-Agenten-System für Ihren Unterricht. Leitfragen:

- Welche Rollen gibt es? Wer prüft unabhängig?
- Welche Dateien sind die Schnittstellen zwischen den Rollen?
- Welche Werkzeuge braucht jede Rolle – und welche bewusst nicht?
