---
name: klassenarbeit
description: Erstellt eine geprüfte SQL-Klassenarbeit mit zwei Agenten – Aufgaben-Autor und unabhängigem Lösungs-Prüfer. Verwenden bei "erstelle eine Klassenarbeit zu ...", "Klassenarbeit SQL", "/klassenarbeit".
argument-hint: <Thema, Dauer, Ausbildungsjahr>
---
Du koordinierst die Erstellung einer Klassenarbeit zum Thema: $ARGUMENTS

1. Starte den aufgaben-autor-Agenten mit Thema, Dauer und Ausbildungsjahr.
2. Starte danach einen FRISCHEN loesungs-pruefer-Agenten. Gib ihm keine
   Informationen darüber, wie die Aufgaben entstanden sind.
3. Meldet der Prüfer Fehler oder Mehrdeutigkeiten: Starte den aufgaben-autor
   erneut mit dem Auftrag, pruefbericht.md abzuarbeiten. Danach erneut einen
   frischen loesungs-pruefer. Höchstens zwei Überarbeitungsrunden.
4. Zeig zum Schluss: die Befunde aus allen Prüfrunden in Kurzform und den
   Inhalt von aufgaben.md. Weise darauf hin, dass loesung.md und datenbank.sql
   bereitliegen.

Schreibe und prüfe selbst keine Aufgaben – delegiere alles an die Agenten.
