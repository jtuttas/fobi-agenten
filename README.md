# fobi-agenten – Multi-Agenten-Beispiele

Plugin-Marketplace für die Lehrerfortbildung **MoodleAgentFoBi** (MMBbS Hannover).

| Plugin | Muster | Aufruf |
|---|---|---|
| `redaktion` | Orchestrator, Fan-out, Prüfer, Pipeline | `/redaktion:ausgabe <Thema>` |
| `klassenarbeit` | Generator–Kritiker mit Überarbeitungsschleife | `/klassenarbeit:klassenarbeit <Thema>` |
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

Für `moodletutor` fragt die Shell-Installation Moodle-URL und Token **nicht** ab. Danach in einer
Sitzung `/plugin` → Installed → `moodletutor` → **Configure** aufrufen – oder gleich in der Sitzung
installieren: `/plugin install moodletutor@fobi-agenten` (öffnet den Dialog).

**Claude-Desktop-App, Tab Code** (lokale Sitzung): einmal
`/plugin marketplace add jtuttas/fobi-agenten` eingeben, dann **+** neben dem Eingabefeld →
**Plugins** → **Add plugin** → Plugin wählen.

**Claude-App (Cowork)**: Die Dateien `redaktion.plugin`, `klassenarbeit.plugin` und
`moodletutor.plugin` aus dem Moodle-Kurs im Chat öffnen und übernehmen. Für `moodletutor` den
MCP-Server zusätzlich separat installieren (siehe unten).

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

Ein Autor erstellt, ein unabhängiger Prüfer löst selbst und vergleicht:

```
/klassenarbeit:klassenarbeit <Thema>
   │
   ├─► aufgaben-autor      → datenbank.sql, aufgaben.md, loesung.md
   │
   ├─► loesungs-pruefer    → löst zuerst OHNE loesung.md, führt SQL aus,
   │                         vergleicht danach → pruefbericht.md
   │
   └─► bei Befunden: Autor überarbeitet, neuer Prüfer (max. 2 Runden)
```

| Rolle | Darf | Darf nicht |
|---|---|---|
| aufgaben-autor | lesen, schreiben | Code ausführen |
| loesungs-pruefer | lesen, SQL ausführen, Bericht schreiben | Aufgaben ändern |

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
   `loesung.md` und `datenbank.sql` löschen (`.claude` behalten) und eingeben:
   `/klassenarbeit SQL Joins und Gruppierung, 45 Min., 1. Ausbildungsjahr`
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

**MCP-Server inklusive:** Das Plugin bringt den Server
[moodle-agent-mcp](https://github.com/jtuttas/moodle-agent-mcp) (v1.0.2) als MCPB-Paket mit. Er
pseudonymisiert alle Schülerdaten, **bevor** sie das Modell erreichen (`S-0001 …`), und setzt die
Vornamen erst beim Versand lokal wieder ein.

**Einrichtung (Claude Code – Terminal oder Code-Tab der Desktop-App):**
1. Plugin installieren und **Moodle-URL** und **API-Token** eintragen: Der Dialog erscheint bei
   Installation über `/plugin`, sonst `/plugin` → Installed → `moodletutor` → Configure.
   Der Token wird im sicheren Speicher abgelegt, nicht in einer Datei. Danach `/reload-plugins`.
2. Einen leeren Arbeitsordner öffnen und `/moodletutor:setup-moodletutor` ausführen – legt
   `tutor-config.md` (Signatur, Lehrer-userid), `CLAUDE.md` und die erste `Kurs_<id>_*.md` an
3. Erst von Hand testen, dann optional `/moodletutor:setup-scheduled-tasks`

**Andere Umgebungen (z. B. Cowork):** Den Server dort separat als
[Erweiterung](https://github.com/jtuttas/moodle-agent-mcp#ein-klick-installation-per-mcpb-empfohlen)
installieren. Die Agenten erkennen beide Varianten. Nicht beide gleichzeitig aktiv lassen.

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
