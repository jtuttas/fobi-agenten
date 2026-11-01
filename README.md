# fobi-agenten – Multi-Agenten-Beispiele

Plugin-Marketplace für die Lehrerfortbildung **MoodleAgentFoBi** (MMBbS Hannover).

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

## Installation (Claude Code)

```bash
claude plugin marketplace add jtuttas/fobi-agenten
claude plugin install redaktion@fobi-agenten
```

Ohne GitHub (ZIP entpacken):

```bash
claude plugin marketplace add ./fobi-agenten
claude plugin install redaktion@fobi-agenten
```

## Ausprobieren

In einem **leeren** Ordner:

```bash
mkdir redaktion-test && cd redaktion-test
claude
```

Dann:

```
/redaktion:ausgabe Künstliche Intelligenz in der Schule
```

Es entstehen `artikel_politik.md`, `artikel_sport.md`, `artikel_kultur.md`,
`pruefbericht.md` und `ausgabe.md`.

## Arbeitsaufträge für die Fortbildung

1. **Beobachten:** Welcher Agent läuft wann? Was läuft parallel?
2. **Schnittstellen:** Öffnen Sie die Agenten-Dateien. Woran erkennt der
   Faktenchecker, welche Dateien er prüfen soll?
3. **Unabhängigkeit:** Fügen Sie in `artikel_sport.md` eine falsche Zahl ein
   und starten Sie nur den Faktenchecker:
   `Nutze den faktenchecker für die vorhandenen Artikel.` Findet er den Fehler?
4. **Werkzeuge:** Warum hat der Lektor kein `WebSearch`?
5. **Transfer:** Entwerfen Sie ein eigenes Multi-Agenten-System für Ihren
   Unterricht (z. B. Aufgaben-Autor + Lösungs-Prüfer).

## Nutzung in der Claude-App (Cowork)

Die Datei `redaktion.plugin` im Chat öffnen bzw. in der Claude-Desktop-App
installieren. Danach im Chat:

```
Erstelle eine Zeitungsausgabe zum Thema Künstliche Intelligenz in der Schule
```
