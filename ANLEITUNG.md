# Auditplan als Android-App über GitHub bauen

GitHub baut aus diesem Repository die Android-App (APK). Android Studio brauchst du nicht.

> Ins Repository gehören nur die App und keine Kundendaten. Auditpläne legst du auf dem Handy an oder lädst sie dort als .txt. Sie bleiben auf dem Handy.

## Einmalig: Signaturschlüssel als Secrets hinterlegen

Ohne Schlüssel lässt sich jede neue Version nur nach dem Deinstallieren der alten installieren, und dabei gehen die Audits in der App verloren.

1. Öffne im Repository **Settings**, dann **Secrets and variables** und darin **Actions**.
2. Lege mit **New repository secret** die vier Secrets aus `GitHub-Secrets.txt` an: `KEYSTORE_PASSWORD`, `KEY_PASSWORD`, `KEY_ALIAS` und `KEYSTORE_BASE64` (die lange Zeile komplett).
3. Bewahre `auditplan.jks` und `GitHub-Secrets.txt` sicher auf, zum Beispiel im Passwortmanager.
4. Starte den Bau neu: **Actions**, dann **Android-App bauen**, dann **Run workflow**.

## App installieren

1. Öffne auf dem Handy in Chrome `https://github.com/feraneke/auditplan/releases` und melde dich an.
2. Tippe beim neuesten Eintrag unter **Assets** auf `Auditplan-2.0.x.apk` und öffne die Datei.
3. Falls Android fragt: Installation aus dieser Quelle zulassen. Falls Play Protect warnt: **Weitere Details**, dann **Trotzdem installieren**.

## Beim ersten Start

- **PIN festlegen** (mindestens 6 Ziffern). Die Daten liegen verschlüsselt auf dem Handy. PIN vergessen = Daten verloren; sichern über **Export .apdat**.
- Benachrichtigungen erlauben. Die Benachrichtigung zeigt nur „Audit läuft – nächster Ton hh:mm“, keine Namen.
- **Einstellungen → Probelauf starten**, dann **Audit starten**. Bildschirm sperren und abwarten: Intervall-Signale alle 2 min, Prozent-Signale je Probe-Kapitel.
- Die Gesamtlautstärke regelst du mit der **Wecker-Lautstärke** von Android. Die Töne kommen auch bei Lautlos.

## Bedienung

| Bereich | Funktion |
|---|---|
| Auditliste | **Arbeitstag** (immer oben), **+ Neues Audit**, **Import .txt** (Auditzeiten.txt aus der 400.dotm; ein Kundenname wird durch ein Kürzel ersetzt), ⋮ = Bearbeiten, Export .txt, Löschen; 🔒 = sperren |
| Neu/Bearbeiten | Kopfdaten wie in der 400.dotm, Audit-Kürzel statt Kunde (leer = vorläufiges Kürzel NEU-n). Vorschlag nach den Regeln der 400.dotm. |
| Audit | Uhr mit Segment des laufenden Timeslots, Timer mit Restzeit, Marken der Signalregeln. **Verlängern** (+5/+10/+15 min oder bis Uhrzeit; Nachfolgende verschieben oder nur nächstes kürzen), **Kapitel beenden** (vorziehen oder Zeit dem nächsten geben). Wählrad mit Plan und Ist; rot = über Tagesende. |
| Kapitel-Dokumente | Tipp auf eine Zeile des Wählrads. Erwartete Dokumente je Unterpunkt, grau bis erledigt; Häkchen oder Dokumentname mit Revision und Datum; Auswahl bekannter Namen (dieses Kapitel oder alle, inkl. Voraudits); **+** je Unterpunkt. Tasks anderer Auditoren ausgegraut. |
| Arbeitstag – Monat | Einstieg über **Arbeitstag** (ab 2.0.16): Tabelle je Monat, eine Zeile je Timeslot (Tag · Auftrag/Position · Beginn · Ende · Dauer). Direkt in die Zeile schreiben; graue Werte sind Vorschläge, Antippen übernimmt sie (Ende eines laufenden Timeslots = jetzt). Oberste Zeile + = neuer Timeslot (Ende leer = läuft); Vorschlag Beginn = jetzt (an früheren Tagen: Ende des letzten Timeslots dieses Tages). Graue Vorschläge übernimmt nur ein Tipp aufs Feld, nicht „Weiter“ der Tastatur. ⇄ in der laufenden Zeile = Wechsel: beendet jetzt und trägt das Ende als Beginn oben ein. Tipp auf den Tag = Tagesansicht mit Uhren, › = Seite Timeslot, **Heute ›** = Tagesansicht heute. Suche oben. Gebuchte und ignorierte Timeslots nur am PC änderbar. |
| Arbeitstag – Tag | Ab 2.0.20: Uhren, Tagessumme mit Datumswahl und darunter dieselbe Tabelle wie bei Monat, nur für den gewählten Tag (Eingabe in der Zeile, oberste Zeile +, ⇄ Wechsel). › öffnet die Seite Timeslot: Auftrag, Position, Beginn, Ende, Planzeit (min) für Countdown mit Gong, Teilen, Parken, Löschen, Bemerkung. Audit starten/beenden legt automatisch einen Timeslot auf der Audit-Position an. |
| Einstellungen | Signalregeln (Auslöser, Ton, Lautstärke, Anschläge, Vibration, Vorrang, eigene Audiodatei), Bildschirm an, Sperre nach Minuten, PIN ändern, Audit-Position, Soll-Arbeitszeit, Vorgaben je Unterpunkt, **Export .apdat** (Download/Auditplan), **Teilen**, **Import .apdat**, Probelauf |

## Datenaustausch mit dem PC

1. Handy: **Einstellungen → Export .apdat**. Die Datei liegt in `Download/Auditplan`.
2. Handy per USB an den PC, Datei nach `C:\Arbeitsverzeichnis\Android_Apps\Audit\Austausch\Eingang\` kopieren.
3. Word (Projekt_Konsolidierung.dotm): Makro `ApImportVomHandy`, danach `ApExportFuersHandy`.
4. Die Antwortdatei aus `Austausch\Ausgang\` aufs Handy kopieren und dort **Import .apdat**.

## Updates

Neue Dateien landen im Repository, und GitHub baut die neue APK unter **Releases**. Du installierst sie über die alte, und die Daten bleiben erhalten.

---
Erstellt mit Claude (claude.ai), Projekt „400_Auditplan“, 25.11.2026; Stand App 2.0 (Stufen A1–A7), 26.11.2026; Arbeitstag ohne PC (2.0.6), 27.11.2026; Monatstabelle (2.0.16), 27.11.2026; Uhrzeiten ohne Doppelpunkt eintippbar (1300 = 13:00) und ⚙ Einstellungen auf jeder Seite (2.0.17), 27.11.2026; Vorschläge lückenlos und Knopf ⇄ Wechsel in der Monatstabelle (2.0.18), 27.11.2026; Tagesansicht als Tabelle (2.0.19) und ohne Listenbereich (2.0.20), 27.11.2026.
