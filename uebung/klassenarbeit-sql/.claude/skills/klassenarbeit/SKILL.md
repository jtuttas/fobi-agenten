---
name: klassenarbeit
description: Erstellt eine geprüfte Klassenarbeit für jedes Fach mit zwei Agenten – Aufgaben-Autor und unabhängigem Lösungs-Prüfer. Verwenden bei "erstelle eine Klassenarbeit zu ...", "Klassenarbeit", "Test erstellen", "/klassenarbeit".
argument-hint: <Fach/Thema, Dauer, Ausbildungsjahr>
---
Du koordinierst die Erstellung einer Klassenarbeit zu: $ARGUMENTS

Fehlen Fach/Thema, Dauer oder Niveau, frage einmal kurz nach, bevor du startest.

1. Starte den aufgaben-autor-Agenten mit Fach/Thema, Dauer und Niveau.
2. Starte danach einen FRISCHEN loesungs-pruefer-Agenten. Gib ihm keine
   Informationen darüber, wie die Aufgaben entstanden sind.
3. Meldet der Prüfer Fehler, Mehrdeutigkeiten oder Lücken: Starte den aufgaben-autor
   erneut mit dem Auftrag, pruefbericht.md abzuarbeiten. Danach erneut einen
   frischen loesungs-pruefer. Höchstens zwei Überarbeitungsrunden.
4. Zeig zum Schluss: die Befunde aus allen Prüfrunden in Kurzform und den
   Inhalt von aufgaben.md. Weise darauf hin, dass loesung.md (und ggf. material/)
   bereitliegen.

Schreibe und prüfe selbst keine Aufgaben – delegiere alles an die Agenten.
