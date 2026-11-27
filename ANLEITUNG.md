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
| Start | Nach der PIN öffnet die App den **Arbeitstag** (Tagesansicht von heute); läuft ein Audit, die Audit-Ansicht. Kopf (ab 2.0.28): **Arbeitstag** links, rechts **Audits** · ⚙ · **🔒** (🔒 Sperren auf jeder Seite). Andere Tage und Monate über das Datumsfeld. Zurück-Taste auf dem Arbeitstag beendet die App. |
| Audits | Knopf **Audits** im Kopf des Arbeitstags (ab 2.0.28): Editor, darüber die Liste der Audits mit **+ Neues Audit** (Tippen = laden, ⋮ = Audit-Ansicht, Export .txt, Löschen). **Import .txt** unter ⚙ Einstellungen > Audits. Im Alltag öffnet **▶ Audit** im Timeslot der Position „audit onsite“ die Audit-Ansicht. |
| Neu/Bearbeiten | Kopfdaten wie in der 400.dotm, Feld „Kunde / Auftrag“ im Klartext (ab 2.0.27; leer = vorläufig NEU-n). Für ▶ Audit muss der Auftrag nach „/“ dem Auftrag des Timeslots entsprechen. Vorschlag nach den Regeln der 400.dotm. |
| Audit | Uhr mit Segment des laufenden Timeslots, Timer mit Restzeit, Marken der Signalregeln. **Verlängern** (+5/+10/+15 min oder bis Uhrzeit; Nachfolgende verschieben oder nur nächstes kürzen), **Kapitel beenden** (vorziehen oder Zeit dem nächsten geben). Wählrad mit Plan und Ist; rot = über Tagesende. |
| Kapitel-Dokumente | Tipp auf eine Zeile des Wählrads. Erwartete Dokumente je Unterpunkt, grau bis erledigt; Häkchen oder Dokumentname mit Revision und Datum; Auswahl bekannter Namen (dieses Kapitel oder alle, inkl. Voraudits); **+** je Unterpunkt. Tasks anderer Auditoren ausgegraut. |
| Arbeitstag – Tabelle | Eine Zeile je Timeslot (Auftrag/Position · Beginn · Plan · Ende · Dauer). Direkt in die Zeile schreiben; graue Werte sind Vorschläge, Antippen übernimmt sie (Ende eines laufenden Timeslots = jetzt). **Plan** (orange) = geplantes Ende: setzt die Planzeit, der Timer zählt bis dahin rückwärts mit Gong. Ende nach jetzt wird abgelehnt. Alle Zeilen sehen gleich aus: am Ende steht eine leere Zeile; sie wird zum Timeslot, sobald Auftrag und Beginn eingetragen sind und du die Zeile verlässt (Ende leer = läuft). Läuft schon ein Timeslot, fragt die App: OK = ihn beenden, Abbrechen = beide laufen weiter (Zeit zählt doppelt). ⇄ = Wechsel, › = Seite Timeslot. Gebuchte und ignorierte Timeslots nur am PC änderbar. |
| Arbeitstag – Tag | Uhren, Datumszeile mit ◀ ▶ (ein Tag zurück/vor; Festhalten blättert immer schneller, ab 2.0.29), Tagessumme, darunter die Tabelle des gewählten Tages. › öffnet die Seite Timeslot: Auftrag, Position, Beginn, Ende, Planzeit (min), Teilen, Parken, Löschen, Bemerkung. Audit starten/beenden legt automatisch einen Timeslot auf der Audit-Position an. |
| Einstellungen | Signalregeln (Auslöser, Ton, Lautstärke, Anschläge, Vibration, Vorrang, eigene Audiodatei), Bildschirm an, Sperre nach Minuten, PIN ändern, Audit-Position, Soll-Arbeitszeit, Vorgaben je Unterpunkt, **Export .apdat** (Download/Auditplan), **Teilen**, **Import .apdat**, Probelauf |

## Datenaustausch mit dem PC

1. Handy: **Einstellungen → Export .apdat**. Die Datei liegt in `Download/Auditplan`.
2. Handy per USB an den PC, Datei nach `C:\Arbeitsverzeichnis\Android_Apps\Audit\Austausch\Eingang\` kopieren.
3. Word (Projekt_Konsolidierung.dotm): Makro `ApImportVomHandy`, danach `ApExportFuersHandy`.
4. Die Antwortdatei aus `Austausch\Ausgang\` aufs Handy kopieren und dort **Import .apdat**.

## Updates

Neue Dateien landen im Repository, und GitHub baut die neue APK unter **Releases**. Du installierst sie über die alte, und die Daten bleiben erhalten.

---
Erstellt mit Claude (claude.ai), Projekt „400_Auditplan“, 25.11.2026; Stand App 2.0 (Stufen A1–A7), 26.11.2026; Arbeitstag ohne PC (2.0.6), 27.11.2026; Monatstabelle (2.0.16), 27.11.2026; Uhrzeiten ohne Doppelpunkt eintippbar (1300 = 13:00) und ⚙ Einstellungen auf jeder Seite (2.0.17), 27.11.2026; Vorschläge lückenlos und Knopf ⇄ Wechsel in der Monatstabelle (2.0.18), 27.11.2026; Tagesansicht als Tabelle (2.0.19) und ohne Listenbereich (2.0.20), 27.11.2026; Spalte Plan und Tag als Überschrift (2.0.22), 27.11.2026; Start mit dem Arbeitstag, Audit als Arbeitspunkt (2.0.23), 27.11.2026; alle Zeilen gleich, ohne Knopf + (2.0.24), 27.11.2026; Beenden laufender Timeslots nur nach Rückfrage (2.0.25), 27.11.2026; Audits im Editor und in den Einstellungen, 🔒 überall (2.0.26), 27.11.2026; Kunde und Auftrag im Klartext erlaubt (2.0.27), 27.11.2026; Seite Monat entfällt, Kopf Audits · ⚙ · 🔒 (2.0.28), 27.11.2026; Tag vor/zurück mit Pfeilen (2.0.29), 27.11.2026.
