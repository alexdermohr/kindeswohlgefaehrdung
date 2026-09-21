# kindeswohlgefährdung

Strukturierte Lern- und Quellenbasis für die **Prüfung 2027 Sommer FS** mit Schwerpunkt auf der Lernfeldprüfung PT2: Kindeswohlgefährdung, Beziehungsgestaltung und Konzeptentwicklung in der Offenen Kinder- und Jugendarbeit.

## Fallwerkstatt-Webseite

Die Repository-Wurzel enthält eine statische Prüfungsübungs-Webseite für die exemplarische Fallbearbeitung:

- Einstieg über einen ausdrücklich fiktiven Fall aus der Offenen Kinder- und Jugendarbeit;
- acht aufeinander aufbauende Arbeitsschritte vom Lagebild bis zum Prüfungstransfer als mögliches Klausurvorgehen;
- am selben fiktiven Fall werden Beobachtung, fachliche Einordnung, Abwägung und begründete Handlung geübt;
- fachliche Kontrollpunkte und Quellenbezüge;
- vereinfachte §-8a-Verfahrenslogik mit Links auf die amtlichen Gesetzestexte;
- lokale Notizen und Fortschrittsanzeige ohne Konto oder Server-Datenspeicherung;
- Druckansicht für Arbeitsblätter bzw. PDF-Ausgabe.

Die Seite bleibt ohne Frontend-Build nutzbar. `index.html`, `styles.css` und `app.js` bilden die Oberfläche; `data/sources.json` ist der einzige gepflegte Quellenkatalog, aus dem Schrittquellen und Gesamtbibliothek im Browser gerendert werden.

## Stand

Erfasst am 21.09.2026 aus dem bereitgestellten Edupool-Board.

**Oberquelle:** Edupool-Board „Prüfung 2027 Sommer FS“. URL und Provenienz werden ausschließlich im kanonischen Quellenkatalog `data/sources.json` gepflegt und daraus in Webseite und generierte Quellenverzeichnisse übernommen.

- 35 von 35 Board-Karten strukturell erfasst;
- 24 eindeutige PDF-Dateien lokal gesichert (39.168.539 Byte);
- alle PDFs lokal in Text überführt;
- textbasierte PDFs mit `pdftotext`, Scan-PDFs ergänzend mit deutscher/englischer OCR;
- Quelldateien und Volltranskripte liegen ausschließlich im lokalen, von Git ausgeschlossenen Verzeichnis `source-private/`.

## Öffentliche Grenze

Das Board enthält Auszüge verschiedener Urheber und Herausgeber. Der vom Nutzer zur Veröffentlichung bestimmte Board-Link wird als Oberquelle öffentlich genannt. Das begründet keine Erlaubnis zur Weiterveröffentlichung der dort enthaltenen oder verlinkten Fremdmaterialien. Öffentlich versioniert werden daher ansonsten nur eigene Strukturierungen, bibliografische Angaben, Seitenbereiche, technische Prüfsummen, die Unterrichtswebseite und die Erfassungsskripte. PDFs und Volltranskripte bleiben lokal.

Siehe [RECHTE.md](RECHTE.md).

## Quellenwahrheit

`data/sources.json` ist die kanonische Quelle für:

- alle im technischen Manifest erfassten Board-PDF-Dateien;
- bibliografische Angaben und prüfungsrelevante Seitenbereiche;
- den Status öffentlicher PDF-Fassungen;
- die unterschiedlichen öffentlichen Direkt-PDF-URLs;
- die Zuordnung der Quellen zu den acht Lernschritten;
- die Oberquelle des Boards.

`quellen/pdf-quellen.md` und `quellen/quellenverzeichnis.md` werden daraus erzeugt und tragen deshalb einen GENERATED-Hinweis. Nach Änderungen am Katalog:

```bash
node scripts/render-source-docs.mjs
```

Der Generator prüft dabei auch die vollständige Übereinstimmung mit `quellen/manifest.csv`, eindeutige Quellen-IDs, eindeutige öffentliche PDF-URLs und die acht Schrittzuordnungen.

## Inhalt

- [Webseite](index.html)
- [Prüfungsstruktur und Board-Inventar](docs/pruefungsstruktur.md)
- [Themen- und Quellenmatrix](docs/themenmatrix.md)
- [Quellenverzeichnis](quellen/quellenverzeichnis.md) — generiert aus dem Quellenkatalog
- [Öffentliche PDF-Links und Status](quellen/pdf-quellen.md) — generiert aus dem Quellenkatalog
- [Transkriptionsstatus](docs/transkriptionsstatus.md)
- `data/sources.json`: kanonischer Quellenkatalog
- `quellen/manifest.csv`: technische Provenienz der 24 lokal gesicherten PDFs
- `scripts/`: Erfassung, Download, Textgewinnung, OCR und Quellen-Dokumentgenerierung

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

Danach `http://127.0.0.1:8000/` im Browser öffnen. Für die Nutzung auf mehreren Geräten ist die veröffentlichte GitHub-Pages-Fassung vorgesehen.

## Lokale Reproduktion der Quellen

Voraussetzungen: Node.js, Poppler (`pdftotext`, `pdftoppm`) und für Scan-PDFs Tesseract mit `deu` und `eng`. Die Skripte schreiben Rohdaten ausschließlich nach `source-private/`; dieses Verzeichnis ist per `.gitignore` ausgeschlossen.
