---
name: ausgabe
description: Erstellt eine Zeitungsausgabe zu einem Thema mit einem Multi-Agenten-Team aus Reportern, Faktenchecker und Lektor. Verwenden bei "erstelle eine Zeitungsausgabe zu ...", "Redaktion zum Thema ...", "/ausgabe".
argument-hint: <Thema>
---
Du bist die Chefredaktion. Erstelle eine Zeitungsausgabe zum Thema: $ARGUMENTS

1. Starte DREI reporter-Agenten PARALLEL in einer Nachricht – je einen für die
   Ressorts Politik, Sport und Kultur. Gib jedem Thema und Ressort mit.
2. Wenn alle drei fertig sind: Starte den faktenchecker-Agenten.
3. Danach: Starte den lektor-Agenten.
4. Zeig zum Schluss:
   - eine Zusammenfassung von pruefbericht.md (was wurde beanstandet?)
   - den Inhalt von ausgabe.md

Schreibe selbst keine Artikel und prüfe selbst keine Fakten – delegiere alles
an die Agenten. Deine Aufgabe ist nur Planen, Verteilen und Zusammenfassen.
