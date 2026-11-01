# Klassenarbeit SQL – FIAE, 1. Ausbildungsjahr

**Bearbeitungszeit:** 45 Minuten · **Hilfsmittel:** keine · **Gesamtpunktzahl:** 25

## Situation

Sie sind Auszubildende/r bei der **Change-IT GmbH** in Hannover. Die Vertriebsabteilung
verwaltet ihre Kunden und Aufträge in einer relationalen Datenbank. Sie sollen
mehrere Auswertungen per SQL erstellen.

## Datenbankschema

```
Mitarbeiter (MitarbeiterNr PK, Name, Abteilung)
Kunde       (KundenNr PK, Firma, Ort)
Auftrag     (AuftragNr PK, KundenNr FK → Kunde, MitarbeiterNr FK → Mitarbeiter,
             Datum [JJJJ-MM-TT], Betrag [Euro, netto])
```

Die Beispieldaten finden Sie in `material/datenbank.sql`.

## Aufgaben

**Aufgabe 1 (4 Punkte)**
Geben Sie die Firmennamen aller Kunden aus Hildesheim alphabetisch sortiert aus.

**Aufgabe 2 (6 Punkte)**
Die Vertriebsleitung möchte für jeden Kunden wissen, wie viele Aufträge er erteilt hat.
Auch Kunden, die noch keinen Auftrag erteilt haben, sollen mit der Anzahl 0
erscheinen. Geben Sie Firma und Anzahl aus, sortiert nach Firma.

**Aufgabe 3 (6 Punkte)**
Ermitteln Sie alle Mitarbeiter, die mehr als zwei Aufträge betreut haben.
Geben Sie Name und Anzahl der Aufträge aus.

**Aufgabe 4 (4 Punkte)**
Ermitteln Sie den Gesamtumsatz (Summe der Beträge) aller Aufträge aus dem Jahr 2026.

**Aufgabe 5 (5 Punkte)**
Geben Sie die teuersten Aufträge aus.
