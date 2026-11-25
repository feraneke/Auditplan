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
2. Tippe beim neuesten Eintrag unter **Assets** auf `Auditplan-1.0.x.apk` und öffne die Datei.
3. Falls Android fragt: Installation aus dieser Quelle zulassen. Falls Play Protect warnt: **Weitere Details**, dann **Trotzdem installieren**.

## Beim ersten Start

- **Probelauf (10 min)** in der Auditliste antippen, dann **Audit starten**.
- Benachrichtigungen erlauben. Die Benachrichtigung zeigt das laufende Audit und den nächsten Ton.
- Bildschirm sperren und abwarten: Sonar alle 2 min, Gong bei 75 % und 100 % jedes Probe-Kapitels.
- Die Lautstärke regelst du mit der **Wecker-Lautstärke** von Android. Die Töne kommen auch bei Lautlos.

## Bedienung

| Bereich | Funktion |
|---|---|
| Auditliste | **+ Neues Audit**, **Import .txt** (Auditzeiten.txt aus der 400.dotm), Öffnen, Bearbeiten, Export .txt, Löschen |
| Neu/Bearbeiten | Kopfdaten wie in der 400.dotm. Der Vorschlag folgt denselben Regeln (Audittyp, 7.3/7.5 je 15 %, EG/AG, Pause, Teilung ab 1,5 h, Verlängerung bis 10 h). Zeiten, Haken und Reihenfolge (▲▼) lassen sich ändern. |
| Audit | Uhr, Restzeit des Kapitels, Fortschritt mit 75-%-Marke, Rest Tag/Audit, nächster Ton. Scrollrad durch den Zeitplan, nach 10 s zurück auf „Jetzt“. Darunter die erwarteten Dokumente zum gewählten Kapitel zum Abhaken. |
| Töne und Anzeige | Sonar aus/15/30/60 min, Gong bezogen auf Kapitel/Audittag/Gesamtaudit, Lautstärken, Vibration, Bildschirm an |
| Dokumente | Erwartete Dokumente je Kapitel ändern (gilt für alle Audits) |

## Updates

Neue Dateien landen im Repository, und GitHub baut die neue APK unter **Releases**. Du installierst sie über die alte, und die Daten bleiben erhalten.

---
Erstellt mit Claude (claude.ai), Projekt „400_Auditplan“, 25.11.2026.
