# Transkriptionsstatus

Die vollständigen Transkripte werden lokal unter `source-private/transcripts/` gespeichert und nicht öffentlich versioniert.

## Ergebnis vom 21.09.2026

- 24 eindeutige PDF-Dateien heruntergeladen;
- 24/24 Dateien in lokale Textdateien überführt;
- 15 PDFs hatten einen brauchbaren Textlayer und wurden mit Poppler/`pdftotext` extrahiert;
- 9 bildbasierte bzw. gescannte PDFs wurden mit Tesseract (`deu+eng`) OCR-transkribiert;
- 0 Dateien blieben unter der technischen Mindestschwelle von 200 Nicht-Leerraumzeichen.

## Verfahren

1. PDF-Dateien werden anhand der im geöffneten Board vorhandenen Links lokal geladen.
2. Zunächst wird mit Poppler/`pdftotext` Text extrahiert.
3. Bei bildbasierten oder gescannten PDFs mit praktisch leerem Textlayer wird ersatzweise OCR mit Tesseract (`deu+eng`) ausgeführt.
4. Technische Provenienz wird ohne Board-Freigabelink in `quellen/manifest.csv` veröffentlicht.

## Qualitätsgrenze

Eine erfolgreiche OCR bedeutet nicht, dass jeder Buchstabe fehlerfrei erkannt wurde. Bei Scanmaterial können insbesondere Silbentrennungen, Ligaturen, Fußnoten, Spalten und Sonderzeichen fehlerhaft sein. Für wörtliche Zitate ist deshalb die PDF-Seite selbst maßgeblich.

Das öffentliche Manifest enthält für jede der 24 Dateien Dateiname, Dateigröße, SHA-256, Transkriptionsmethode und Umfang der gewonnenen Transkription.
