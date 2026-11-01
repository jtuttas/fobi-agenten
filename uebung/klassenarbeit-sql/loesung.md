# Musterlösung – Klassenarbeit SQL

**Aufgabe 1 (4 Punkte)**
```sql
SELECT Firma
FROM Kunde
WHERE Ort = 'Hildesheim'
ORDER BY Firma;
```
Erwartetes Ergebnis: Gartenbau Lindner, Praxis Dr. Wolf

**Aufgabe 2 (6 Punkte)**
```sql
SELECT k.Firma, COUNT(*) AS Anzahl
FROM Kunde k
INNER JOIN Auftrag a ON k.KundenNr = a.KundenNr
GROUP BY k.KundenNr, k.Firma
ORDER BY k.Firma;
```
Erwartetes Ergebnis: 4 Zeilen (Autohaus Kronsberg GmbH 3, Bäckerei Hansen KG 2,
Praxis Dr. Wolf 1, Stadtwerke Celle 2)

**Aufgabe 3 (6 Punkte)**
```sql
SELECT m.Name, COUNT(*) AS Anzahl
FROM Mitarbeiter m
JOIN Auftrag a ON m.MitarbeiterNr = a.MitarbeiterNr
WHERE COUNT(*) > 2
GROUP BY m.MitarbeiterNr, m.Name;
```
Erwartetes Ergebnis: Anna Becker, 4

**Aufgabe 4 (4 Punkte)**
```sql
SELECT SUM(Betrag) AS Gesamtumsatz
FROM Auftrag
WHERE Datum BETWEEN '2026-01-01' AND '2026-12-31';
```
Erwartetes Ergebnis: 32.030,00 €

**Aufgabe 5 (5 Punkte)**
```sql
SELECT AuftragNr, Betrag
FROM Auftrag
ORDER BY Betrag DESC
LIMIT 3;
```
Erwartetes Ergebnis: 1005 (12.000 €), 1002 (8.500 €), 1007 (4.300 €)
