-- Datenbank der Change-IT GmbH (Übungsarbeit SQL)
-- Ausführen z. B. mit: sqlite3 change_it.db < material/datenbank.sql

CREATE TABLE Mitarbeiter (
  MitarbeiterNr INTEGER PRIMARY KEY,
  Name          TEXT NOT NULL,
  Abteilung     TEXT NOT NULL
);

CREATE TABLE Kunde (
  KundenNr INTEGER PRIMARY KEY,
  Firma    TEXT NOT NULL,
  Ort      TEXT NOT NULL
);

CREATE TABLE Auftrag (
  AuftragNr     INTEGER PRIMARY KEY,
  KundenNr      INTEGER NOT NULL REFERENCES Kunde(KundenNr),
  MitarbeiterNr INTEGER NOT NULL REFERENCES Mitarbeiter(MitarbeiterNr),
  Datum         TEXT NOT NULL,   -- Format JJJJ-MM-TT
  Betrag        REAL NOT NULL    -- Netto in Euro
);

INSERT INTO Mitarbeiter VALUES
  (1, 'Anna Becker',  'Vertrieb'),
  (2, 'Malte Schulz', 'Vertrieb'),
  (3, 'Lea Yilmaz',   'Support'),
  (4, 'Tom Richter',  'Entwicklung');

INSERT INTO Kunde VALUES
  (101, 'Bäckerei Hansen KG',     'Hannover'),
  (102, 'Autohaus Kronsberg GmbH','Hannover'),
  (103, 'Praxis Dr. Wolf',        'Hildesheim'),
  (104, 'Stadtwerke Celle',       'Celle'),
  (105, 'Gartenbau Lindner',      'Hildesheim');

INSERT INTO Auftrag VALUES
  (1001, 101, 1, '2025-11-14',  1200.00),
  (1002, 102, 1, '2026-01-20',  8500.00),
  (1003, 102, 2, '2026-02-03',  3400.00),
  (1004, 103, 1, '2026-03-11',   950.00),
  (1005, 104, 3, '2026-03-28', 12000.00),
  (1006, 102, 1, '2026-05-02',  2100.00),
  (1007, 104, 2, '2026-06-17',  4300.00),
  (1008, 101, 3, '2026-09-09',   780.00);
