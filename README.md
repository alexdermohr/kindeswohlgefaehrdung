# kindeswohlgefährdung

Strukturierte Lern- und Quellenbasis für die **Prüfung 2027 Sommer FS** mit Schwerpunkt auf der Lernfeldprüfung PT2: Kindeswohlgefährdung, Beziehungsgestaltung und Konzeptentwicklung in der Offenen Kinder- und Jugendarbeit.

## Fallwerkstatt-Webseite

Die Repository-Wurzel enthält eine statische Unterrichtswebseite für die gemeinsame Fallarbeit:

- Einstieg über einen ausdrücklich fiktiven Fall aus der Offenen Kinder- und Jugendarbeit;
- acht aufeinander aufbauende Arbeitsschritte vom Lagebild bis zum Prüfungstransfer;
- Aufgaben für Einzelarbeit, Kleingruppen und Klassenabgleich;
- fachliche Kontrollpunkte und Quellenbezüge;
- vereinfachte §-8a-Verfahrenslogik mit Links auf die amtlichen Gesetzestexte;
- lokale Notizen und Fortschrittsanzeige ohne Konto oder Server-Datenspeicherung;
- Druckansicht für Arbeitsblätter bzw. PDF-Ausgabe.

Technisch besteht die Seite nur aus `index.html`, `styles.css` und `app.js`. Es gibt keinen externen Frontend-Build und keine Laufzeitabhängigkeiten.

## Stand

Erfasst am 21.09.2026 aus dem bereitgestellten Edupool-Board:

- 35 von 35 Board-Karten strukturell erfasst;
- 24 eindeutige PDF-Dateien lokal gesichert (39.168.539 Byte);
- alle PDFs lokal in Text überführt;
- textbasierte PDFs mit `pdftotext`, Scan-PDFs ergänzend mit deutscher/englischer OCR;
- Quelldateien und Volltranskripte liegen ausschließlich im lokalen, von Git ausgeschlossenen Verzeichnis `source-private/`.

## Öffentliche Grenze

Das Board enthält Auszüge verschiedener Urheber und Herausgeber. Ein Freigabelink ist keine Erlaubnis zur öffentlichen Weiterverbreitung. Öffentlich versioniert werden daher nur eigene Strukturierungen, bibliografische Angaben, Seitenbereiche, technische Prüfsummen, die Unterrichtswebseite und die Erfassungsskripte. PDFs, Volltranskripte und der nicht öffentliche Board-Freigabelink bleiben lokal.

Siehe [RECHTE.md](RECHTE.md).

## Inhalt

- [Webseite](index.html)
- [Prüfungsstruktur und Board-Inventar](docs/pruefungsstruktur.md)
- [Themen- und Quellenmatrix](docs/themenmatrix.md)
- [Quellenverzeichnis](quellen/quellenverzeichnis.md)
- [Transkriptionsstatus](docs/transkriptionsstatus.md)
- `quellen/manifest.csv`: technische Provenienz ohne Freigabelink
- `scripts/`: lokale Erfassung, Download, Textgewinnung und OCR

## Prüfungskern PT2

Die Abschlussprüfung verbindet drei fachliche Linien:

1. **Beziehungsgestaltung:** tragfähige Beziehungen und Kommunikation mit Jugendlichen auch in Konflikten und bei Verdacht auf Kindeswohlgefährdung.
2. **Konzeptentwicklung und Prävention:** qualitative Weiterentwicklung eines OKJA-Konzepts unter Einbezug von Sucht, Gewalt, Schutz und alltagsintegrierter Prävention.
3. **Kinderschutz/Krisenintervention:** rechtliche Grundlagen, gewichtige Anhaltspunkte, Verfahrensschritte und kindeswohlorientierte Unterstützung einer Familie in einer Krisensituation.

Die übergeordnete komplexe Handlung verbindet bei Verdacht auf Kindeswohlgefährdung in der OKJA gezielte Beziehungsgestaltung mit konzeptioneller Prävention und Unterstützung.

## Lokale Nutzung der Webseite

Im Repository-Verzeichnis genügt zum Beispiel:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Danach `http://127.0.0.1:8000/` im Browser öffnen. Für die Unterrichtsnutzung auf mehreren Geräten ist die veröffentlichte GitHub-Pages-Fassung vorgesehen.

## Lokale Reproduktion der Quellen

Voraussetzungen: Node.js, Poppler (`pdftotext`, `pdftoppm`) und für Scan-PDFs Tesseract mit `deu` und `eng`. Die Skripte schreiben Rohdaten ausschließlich nach `source-private/`; dieses Verzeichnis ist per `.gitignore` ausgeschlossen.
