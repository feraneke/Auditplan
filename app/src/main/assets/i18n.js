/*
 * Auditplan – Sprache DE/EN
 * Version: 2.0.20 (2026-11-27)
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“.
 *
 * Die Oberfläche ist auf Deutsch geschrieben. Bei Sprache EN übersetzt dieses Modul
 * alle sichtbaren Texte beim Anzeigen:
 *  - ganze Texte über die Tabelle GANZ (genauer Vergleich, auch Einzelwörter),
 *  - Textteile über die Tabelle TEILE (längste zuerst, nur Wendungen mit mehreren Zeichen),
 *  - Platzhalter und Tooltips (placeholder, title),
 *  - Meldungen über alert, confirm und prompt.
 * Neue oder geänderte Texte (Listen, Timer, Meldungen) erfasst ein MutationObserver.
 * Eingaben des Nutzers (Feldinhalte) werden nie übersetzt.
 * Die Wahl liegt in localStorage (auditplan.sprache), damit schon die PIN-Seite passt.
 *
 * Versionshistorie:
 *   2.0.9 (2026-11-27) Erste Fassung (Wunsch Frank 2026-11-27, Chat 400_App_003).
 *   2.0.10 (2026-11-27) Englische Begriffe wie im TimeKeeper am PC: Order, Position, remarks, time slot.
 *   2.0.11 (2026-11-27) Seite Timeslot, Darstellung Dunkel/Hell.
 *   2.0.15 (2026-11-27) Arbeitstag mit Listen und Fenstern für Aufträge, Positionen, Timeslots.
 *   2.0.16 (2026-11-27) Seite Monat (Task 400-02): Tabelle, Suche, Meldungen, Monatsnamen.
 *   2.0.17 (2026-11-27) Versionsstand mit index.html 2.0.17 (keine neuen Texte).
 *   2.0.18 (2026-11-27) Monat: Knopf Wechsel, Hinweistext, Meldung nach Wechsel.
 *   2.0.19 (2026-11-27) Tagesansicht als Tabelle: Hinweistext, eingeklappter Bereich.
 *   2.0.20 (2026-11-27) Versionsstand mit index.html 2.0.20 (Bereich entfällt, Texte bleiben unschädlich).
 */
(function (global) {
  'use strict';

  var VERSION = '2.0.20';
  var SCHLUESSEL = 'auditplan.sprache';

  // Ganze Texte (nach Trim verglichen)
  var GANZ = {
    // 2.0.16: Seite Monat
    'Heute ›': 'Today ›', 'Tag': 'Day', 'Auftrag / Position': 'Order / position', 'Dauer': 'Duration', 'ohne Countdown': 'no countdown',
    'Suchen: Auftrag, Position, Bemerkung': 'Search: order, position, remarks', 'Keine Timeslots.': 'No time slots.', 'Keine Treffer.': 'No matches.',
    'Graue Werte sind Vorschläge – Antippen übernimmt sie. Oberste Zeile: + legt den Timeslot an, Ende leer = läuft. ⇄ beendet den laufenden Timeslot jetzt und beginnt einen neuen. Tipp auf den Tag öffnet die Tagesansicht mit den Uhren, › den Timeslot.':
      'Grey values are suggestions – tap to take them. Top row: + creates the time slot, empty end = running. ⇄ ends the running time slot now and starts a new one. Tap the day to open the day view with the clocks, › opens the time slot.',
    'Timeslot beendet – neuen Auftrag eintragen, dann +': 'Time slot ended – enter the new order, then +',
    'Timeslot angelegt': 'Time slot created', 'Timeslot nicht gefunden': 'Time slot not found', 'Es läuft schon ein Timeslot': 'A time slot is already running',
    'Ende fehlt – laufen darf nur ein Timeslot von heute': 'End missing – only a time slot of today may be running',
    'Beginn liegt in der Zukunft': 'Start lies in the future', 'Timeslot gibt es schon': 'Time slot already exists',
    'Beginn vor dem laufenden Timeslot': 'Start before the running time slot', 'Beginn fehlt': 'Start missing', 'Tag als TT.MM.': 'Day as DD.MM.',
    'Timeslot anlegen': 'Create time slot',
    'Graue Werte sind Vorschläge – Antippen übernimmt sie. + legt die oberste Zeile an, ⇄ wechselt, › öffnet den Timeslot. Buchen und Ignorieren nur am PC.':
      'Grey values are suggestions – tap to take them. + creates the top row, ⇄ switches, › opens the time slot. Booking and ignoring only on the PC.',
    'Aufträge, Positionen, Start mit Planzeit': 'Orders, positions, start with planned time',
    'Auditplan': 'Audit plan', 'Auditplan entsperren': 'Unlock audit plan', 'Entsperren': 'Unlock', 'Festlegen': 'Set', 'Darstellung': 'Appearance', 'Kopfdaten': 'Header data', 'Aufträge': 'Orders', 'Positionen': 'Positions', 'Timeslots': 'Time slots',
    'ohne Position': 'no position', 'Neuer Auftrag': 'New order', 'Neue Position': 'New position', '+ Neuer Auftrag': '+ New order',
    '+ Neue Position': '+ New position', 'Anzeige Handy': 'Display on phone', 'Vorgabe (min)': 'Target (min)', 'leer = ohne Countdown': 'empty = no countdown',
    'Auftrag fehlt': 'Order missing', 'Position fehlt': 'Position missing', 'Auftrag gibt es schon': 'Order already exists',
    'Position gibt es schon': 'Position already exists', 'Vorgabe in Minuten': 'Target in minutes', 'Folge': 'Order', 'h': 'h', '✓': '✓', 'Dunkel': 'Dark', 'Hell': 'Light', 'Timeslot': 'Time slot',
    'Planzeit (min)': 'Planned time (min)', 'Gespeichert': 'Saved', 'hh:mm': 'hh:mm',
    'PIN eingeben': 'Enter PIN', 'PIN wiederholen': 'Repeat PIN', 'PIN ändern': 'Change PIN', 'PIN festlegen': 'Set PIN',
    'Neue PIN': 'New PIN', 'Sperren': 'Lock', 'Einstellungen': 'Settings', '+ Neues Audit': '+ New audit',
    'Neues Audit': 'New audit', 'Import .txt': 'Import .txt', 'Arbeitstag': 'Work day', 'Abbrechen': 'Cancel',
    'Speichern': 'Save', 'Übernehmen': 'Apply', 'Löschen': 'Delete', 'Teilen': 'Share', 'Reset': 'Reset',
    'Start': 'Start', 'Stopp': 'Stop', 'Wechsel': 'Switch', 'Heute': 'Today', 'Jetzt': 'Now', 'Kapitel': 'Chapter',
    'Auftrag': 'Order', 'Position': 'Position', 'Bemerkung': 'remarks', 'Beginn': 'Start', 'Ende': 'End',
    'Zeitplan': 'Schedule', 'Kein Zeitplan': 'No schedule', 'Startzeit': 'Start time', 'Auditstart': 'Audit start',
    'Audittyp': 'Audit type', 'Auditzeit (h)': 'Audit time (h)', 'Tagesbeginn': 'Day start', 'Tagesende': 'Day end',
    'Mittagspause (h)': 'Lunch break (h)', '7.3 ausgeschlossen': '7.3 excluded',
    'Ausschlüsse / Nichtanwendbarkeiten (Komma)': 'Exclusions / non-applicability (comma)',
    'Audit-Kürzel (kein Kundenname; leer = vorläufiges Kürzel NEU-n)': 'Audit code (no customer name; empty = temporary code NEU-n)',
    '1. ÜA': '1st surveillance', '2. ÜA': '2nd surveillance', 'Rezert': 'Recertification',
    'Vorbelegung': 'Defaults', 'Vorbelegung wiederherstellen': 'Restore defaults', 'Audit starten': 'Start audit',
    'Audit beenden': 'End audit', 'Audit beendet': 'Audit ended', 'Audit läuft': 'Audit running',
    'Arbeitstag läuft': 'Work day running', 'Verlängern': 'Extend', 'Kapitel beenden': 'End chapter',
    'Rest Tag': 'Left today', 'Rest Audit': 'Left in audit', 'Nächster Ton': 'Next signal', 'Als Nächstes': 'Up next',
    'Signale': 'Signals', 'Ton an': 'Sound on', 'Ton aus': 'Sound off', 'Vibration an': 'Vibration on',
    'Vibration aus': 'Vibration off', 'Sprache': 'Language', 'Töne – Signalregeln': 'Sounds – signal rules', '+ Regel': '+ Rule',
    'Anzeige und Sicherheit': 'Display and security', 'Bildschirm während des Audits anlassen': 'Keep screen on during the audit',
    'Sperre nach (min im Hintergrund)': 'Lock after (min in background)', 'Wählrad zurück nach (s)': 'Dial returns after (s)',
    'Audit-Position': 'Audit position', 'Soll-Arbeitszeit (h)': 'Target working time (h)',
    'Erwartete Dokumente': 'Expected documents', 'Vorgaben je Unterpunkt bearbeiten': 'Edit defaults per sub-clause',
    'Datenaustausch mit dem PC': 'Data exchange with the PC', 'Export .apdat': 'Export .apdat', 'Import .apdat': 'Import .apdat',
    'Probelauf': 'Trial run', 'Probelauf starten': 'Start trial run', 'Probe A': 'Trial A', 'Probe B': 'Trial B', 'Probe C': 'Trial C',
    'Auswahl: dieses Kapitel': 'Selection: this chapter', 'alle Kapitel': 'all chapters', 'kein Timeslot': 'no time slot',
    'tippen oder wählen': 'type or choose', 'z. B. 90': 'e.g. 90', 'Planzeit (min, leer = ohne Countdown)': 'Planned time (min, empty = no countdown)',
    'läuft': 'running', 'offen': 'open', 'erledigt': 'done', 'früher': 'earlier', 'verlängert': 'extended',
    'nächstes gekürzt': 'next shortened', 'ohne Auftrag': 'no order', 'in Arbeit': 'in progress',
    'bis Beginn': 'until start', 'bis Uhrzeit': 'until time', 'zur Planzeit': 'at planned time',
    'Gilt für': 'Applies to', 'Auslöser': 'Trigger', 'Wert': 'Value', 'Ton': 'Sound', 'Lautstärke': 'Volume',
    'Anschläge': 'Strikes', 'Vibration': 'Vibration', 'Vorrang (höher gewinnt)': 'Priority (higher wins)', 'Aktiv': 'Active',
    '▶ Anhören': '▶ Listen', 'Eigene Audiodatei wählen …': 'Choose own audio file …', 'Neue Signalregel': 'New signal rule',
    'Audit': 'Audit', 'AUS': 'OFF', 'KURZ': 'SHORT', 'LANG': 'LONG', 'Menü': 'Menu',
    'Sonar': 'Sonar', 'Gong': 'Gong', 'Glocke': 'Bell', 'Klangschale': 'Singing bowl', 'Holzblock': 'Wood block',
    'Kurzer Piep': 'Short beep', 'eigene Datei': 'own file',
    'Anteil des Timeslots (%)': 'Share of the timeslot (%)', 'Minuten vor Ende': 'Minutes before end',
    'Minuten nach Beginn': 'Minutes after start', 'Intervall (alle n min zur vollen Uhrzeit)': 'Interval (every n min on the clock)',
    'Nachfolgende verschieben': 'Shift following', 'Nur nächstes kürzen': 'Shorten next only',
    'Nachfolgende vorziehen': 'Bring following forward', 'Zeit dem nächsten geben': 'Give time to the next',
    'Parken': 'Park', 'Parken aufheben': 'Unpark', 'Teilen um (hh:mm)': 'Split at (hh:mm)', 'leer = nicht teilen': 'empty = do not split',
    'Pause – keine Dokumente': 'Break – no documents', 'Mittagspause': 'Lunch break',
    'Einführungsgespräch': 'Opening meeting', 'Verantwortung der Leitung': 'Management responsibility',
    'Betriebsrundgang': 'Site tour', 'Allgemeine Anforderungen': 'General requirements',
    'Dokumentationsanforderungen': 'Documentation requirements', 'Ressourcen, Infrastruktur, Arbeitsumgebung': 'Resources, infrastructure, work environment',
    'Personelle Ressourcen': 'Human resources', 'Planung der Produktrealisierung': 'Planning of product realization',
    'Kundenbezogene Prozesse': 'Customer-related processes', 'Entwicklung': 'Design and development', 'Beschaffung': 'Purchasing',
    'Produktion und Dienstleistungserbringung': 'Production and service provision',
    'Lenkung von Überwachungs- und Messmitteln': 'Control of monitoring and measuring equipment',
    'Messung, Analyse, Verbesserung': 'Measurement, analysis and improvement', 'Rückmeldungen, Reklamationen, Meldungen': 'Feedback, complaints, reporting',
    'Internes Audit': 'Internal audit', 'Überwachung von Prozessen und Produkt': 'Monitoring of processes and product',
    'Lenkung fehlerhafter Produkte': 'Control of nonconforming product', 'Datenanalyse': 'Analysis of data', 'Verbesserung': 'Improvement',
    'Vorbereitung und Abschlussgespräch': 'Preparation and closing meeting',
    'Rolle der Organisation': 'Role of the organization', 'Prozesse, risikobasierter Ansatz': 'Processes, risk-based approach',
    'Kriterien, Ressourcen, Überwachung': 'Criteria, resources, monitoring', 'Änderungen an Prozessen': 'Changes to processes',
    'Ausgelagerte Prozesse': 'Outsourced processes', 'Software im QMS': 'Software in the QMS', 'Allgemeines': 'General',
    'QM-Handbuch': 'Quality manual', 'Medizinprodukteakte': 'Medical device file', 'Lenkung von Dokumenten': 'Control of documents',
    'Lenkung von Aufzeichnungen': 'Control of records', 'Verpflichtung der Leitung': 'Management commitment',
    'Kundenorientierung': 'Customer focus', 'Qualitätspolitik': 'Quality policy', 'Qualitätsziele': 'Quality objectives',
    'Planung des QMS': 'QMS planning', 'Verantwortung und Befugnis': 'Responsibility and authority',
    'Beauftragter der Leitung': 'Management representative', 'Interne Kommunikation': 'Internal communication',
    'Managementbewertung allgemein': 'Management review – general', 'Eingaben': 'Review input', 'Ergebnisse': 'Review output',
    'Bereitstellung von Ressourcen': 'Provision of resources', 'Infrastruktur': 'Infrastructure', 'Arbeitsumgebung': 'Work environment',
    'Kontaminationslenkung': 'Contamination control', 'Ermittlung der Anforderungen': 'Determination of requirements',
    'Bewertung der Anforderungen': 'Review of requirements', 'Kommunikation': 'Communication', 'Entwicklungsplanung': 'Design and development planning',
    'Entwicklungseingaben': 'Design and development inputs', 'Entwicklungsergebnisse': 'Design and development outputs',
    'Entwicklungsbewertung': 'Design and development review', 'Entwicklungsverifizierung': 'Design and development verification',
    'Entwicklungsvalidierung': 'Design and development validation', 'Entwicklungsübertragung': 'Design and development transfer',
    'Entwicklungsänderungen': 'Control of design and development changes', 'Entwicklungsakte': 'Design and development files',
    'Beschaffungsprozess': 'Purchasing process', 'Beschaffungsangaben': 'Purchasing information',
    'Verifizierung beschaffter Produkte': 'Verification of purchased product', 'Lenkung der Produktion': 'Control of production',
    'Sauberkeit des Produkts': 'Cleanliness of product', 'Installation': 'Installation activities', 'Instandhaltung': 'Servicing activities',
    'Sterile Produkte': 'Sterile medical devices', 'Prozessvalidierung': 'Validation of processes',
    'Validierung Sterilisation und Sterilbarriere': 'Validation of sterilization and sterile barrier', 'Identifizierung': 'Identification',
    'Rückverfolgbarkeit': 'Traceability', 'Rückverfolgbarkeit implantierbarer Produkte': 'Traceability of implantable devices',
    'Eigentum des Kunden': 'Customer property', 'Produkterhaltung': 'Preservation of product', 'Rückmeldungen': 'Feedback',
    'Reklamationsbearbeitung': 'Complaint handling', 'Berichterstattung an Behörden': 'Reporting to regulatory authorities',
    'Überwachung und Messung von Prozessen': 'Monitoring and measurement of processes',
    'Überwachung und Messung des Produkts': 'Monitoring and measurement of product',
    'Maßnahmen vor Auslieferung': 'Actions before delivery', 'Maßnahmen nach Auslieferung': 'Actions after delivery', 'Nacharbeit': 'Rework',
    'Korrekturmaßnahmen': 'Corrective action', 'Vorbeugungsmaßnahmen': 'Preventive action'
  };

  // Textteile (in längeren oder zusammengesetzten Texten); längste zuerst
  var TEILE = [
    ['10 Minuten mit drei Probe-Kapiteln; Intervalle alle 2 min, sonst die eingestellten Regeln.', '10 minutes with three trial chapters; intervals every 2 min, otherwise the configured rules.'],
    ['Die Datei ist mit der App-PIN verschlüsselt. Export legt sie in Download\\Auditplan ab; dort holt sie der PC per USB.', 'The file is encrypted with the app PIN. Export saves it in Download\\Auditplan; the PC fetches it there via USB.'],
    ['Die Gesamtlautstärke ist die Wecker-Lautstärke von Android; die Regel-Lautstärke ist ein Anteil davon. Töne kommen auch bei Lautlos. Bei gleichzeitigen Signalen spielt nur das mit dem höchsten Vorrang.', 'The overall volume is the Android alarm volume; the rule volume is a share of it. Sounds play even in silent mode. For simultaneous signals only the one with the highest priority plays.'],
    ['Eine Zeile je Dokument, je Unterpunkt in Normreihenfolge. Gilt für alle Audits.', 'One line per document, per sub-clause in standard order. Applies to all audits.'],
    ['Gesperrt – nur die Audit-Seite ist sichtbar. Zurück verlangt die PIN.', 'Locked – only the audit page is visible. Back requires the PIN.'],
    ['Grau = erwartet. Erledigt durch Häkchen oder durch Eintrag des Dokumentnamens mit Revision und Datum, z. B. „QM-Handbuch Rev. 7 vom 03.2026“. Keine Firmennamen.', 'Grey = expected. Done by tick or by entering the document name with revision and date, e.g. “Quality manual Rev. 7 of 03.2026”. No company names.'],
    ['Hauptschalter für alle Signalregeln; gilt sofort, auch während eines Audits oder Arbeitstags.', 'Master switch for all signal rules; applies immediately, also during an audit or work day.'],
    ['Import: Arbeitsstand der 400.dotm (Auditzeiten.txt). Tippen = öffnen, ⋮ = bearbeiten, exportieren, löschen.', 'Import: working state of the 400.dotm (Auditzeiten.txt). Tap = open, ⋮ = edit, export, delete.'],
    ['Tipp auf eine Zeile öffnet die erwarteten Dokumente. Rot = über das Tagesende hinaus.', 'Tap a row to open the expected documents. Red = beyond the end of the day.'],
    ['Tipp auf einen Timeslot: ändern, teilen, parken, löschen. Buchen und Ignorieren nur am PC.', 'Tap a time slot: change, split, park, delete. Booking and ignoring only on the PC.'],
    ['Mindestens 6 Ziffern. PIN vergessen = Daten verloren; sichern über Export .apdat.', 'At least 6 digits. Forgotten PIN = data lost; back up via Export .apdat.'],
    ['Probelauf: Intervalle alle 2 min, Prozent-Signale je Kapitel. Mit „Audit starten“ beginnen.', 'Trial run: intervals every 2 min, percentage signals per chapter. Begin with “Start audit”.'],
    ['Für dieses Audit sind Abweichungen vom Plan erfasst. Sie gelten nach dem Bearbeiten weiter für die Timeslots mit gleicher Nummer. Fortfahren?', 'Deviations from the plan are recorded for this audit. After editing they keep applying to the timeslots with the same number. Continue?'],
    ['Die importierte Datei hat keinen [DATEN]-Block. Bitte in der 400.dotm ändern und neu importieren.', 'The imported file has no [DATEN] block. Please change it in the 400.dotm and import again.'],
    ['Vorschlag aus den Kopfdaten neu berechnen? Handänderungen gehen verloren.', 'Recalculate the proposal from the header data? Manual changes will be lost.'],
    ['Ein anderes Audit läuft noch. Beenden und dieses Audit starten?', 'Another audit is still running. End it and start this audit?'],
    ['Noch kein Audit. Lege eins an oder importiere Auditzeiten.txt.', 'No audit yet. Create one or import Auditzeiten.txt.'],
    ['Keine Vorgabe – unter Einstellungen eintragen oder „+“.', 'No default – enter under Settings or “+”.'],
    ['Auf dem Handy sind keine Kundendaten erlaubt. Bitte das Audit-Kürzel eingeben (leer = vorläufiges Kürzel):', 'No customer data is allowed on the phone. Please enter the audit code (empty = temporary code):'],
    ['ist kein Audit-Kürzel (K-xxxxxx/A-xxxx oder NEU-n). Auf dem Handy sind keine Kundennamen erlaubt. Trotzdem speichern?', 'is not an audit code (K-xxxxxx/A-xxxx or NEU-n). No customer names are allowed on the phone. Save anyway?'],
    ['Auditoren. Die App plant nur für einen Auditor: alle Kapitel laufen nacheinander. Trotzdem bearbeiten?', 'auditors. The app plans for one auditor only: all chapters run one after another. Edit anyway?'],
    ['erstellt (Abweichung zur Uhr dieses Handys über 10 min). Trotzdem einlesen?', 'created (differs from this phone’s clock by more than 10 min). Read it anyway?'],
    ['Die Datei enthält unter „Kunde / Auftrag“ einen Klartext:', 'The file contains plain text under “Kunde / Auftrag”:'],
    ['Alle Signalregeln auf die Vorbelegung zurücksetzen?', 'Reset all signal rules to the defaults?'],
    ['Alle Vorgaben auf die Vorbelegung zurücksetzen?', 'Reset all defaults?'],
    ['Audit beenden? Die Signale werden abgeschaltet.', 'End audit? The signals will be switched off.'],
    ['Mit der App-PIN nicht lesbar. Passwort der Datei:', 'Not readable with the app PIN. Password of the file:'],
    ['Stattdessen die Nachfolgenden verschieben?', 'Shift the following ones instead?'],
    ['übernehmen, Abbrechen = Handy behalten', 'apply, Cancel = keep phone'],
    ['Gebucht bzw. ignoriert – nur am PC änderbar', 'Booked or ignored – can only be changed on the PC'],
    ['Plan angepasst; Töne neu berechnet', 'Plan adjusted; signals recalculated'],
    ['PIN festgelegt, Daten verschlüsselt', 'PIN set, data encrypted'],
    ['Die PIN braucht 6 bis 12 Ziffern.', 'The PIN needs 6 to 12 digits.'],
    ['Die beiden Eingaben sind verschieden.', 'The two entries differ.'],
    ['Die Uhrzeit liegt vor dem Planende.', 'The time is before the planned end.'],
    ['Der Probelauf lässt sich nicht bearbeiten.', 'The trial run cannot be edited.'],
    ['Audit-Dienst ließ sich nicht starten', 'Audit service could not be started'],
    ['Keine Töne mehr in diesem Audit.', 'No more signals in this audit.'],
    ['Teilungszeit liegt nicht im Timeslot', 'Split time is not within the time slot'],
    ['Die Datei stammt von diesem Handy.', 'The file comes from this phone.'],
    ['Bitte den Auditstart eintragen.', 'Please enter the audit start.'],
    ['Planzeit in Minuten, z. B. 90', 'Planned time in minutes, e.g. 90'],
    ['Keine Timeslots an diesem Tag.', 'No time slots on this day.'],
    ['Keine Datei übernommen', 'No file applied'], ['Kein laufendes Kapitel', 'No running chapter'],
    ['Kein Kapitel mit Zeit.', 'No chapter with time.'], ['Speichern fehlgeschlagen', 'Saving failed'],
    ['Export fehlgeschlagen: ', 'Export failed: '], ['Teilen fehlgeschlagen: ', 'Sharing failed: '],
    ['Import nicht möglich:', 'Import not possible:'], ['Vorschlag neu berechnet', 'Proposal recalculated'],
    ['Nachfolgende verschoben', 'Following shifted'], ['Nachfolgende vorgezogen', 'Following brought forward'],
    ['Zeit dem nächsten gegeben', 'Time given to the next'], ['Ist-Ende festgehalten', 'Actual end recorded'],
    ['Wert muss größer 0 sein', 'Value must be greater than 0'], ['Prozent höchstens 100', 'Percent at most 100'],
    ['Zu viele Fehlversuche. Weiter um ', 'Too many failed attempts. Continue at '], ['. Wartezeit 5 min.', '. Waiting time 5 min.'],
    ['Auf beiden Seiten geändert (', 'Changed on both sides ('], ['Gespeichert: Download/Auditplan/', 'Saved: Download/Auditplan/'],
    ['Ein Timeslot', 'A timeslot'], ['Tipp auf einen Eintrag: bearbeiten, löschen, hinzufügen. Buchen und Ignorieren nur am PC.', 'Tap an entry: edit, delete, add. Booking and ignoring only on the PC.'],
    ['“ löschen? Seine Timeslots bleiben erhalten.', '”? Its time slots are kept.'], ['“ löschen? Ihre Timeslots bleiben erhalten.', '”? Its time slots are kept.'],
    ['Auftrag „', 'Delete order “'], ['Position „', 'Delete position “'], ['Auftrag ', 'Order '], ['Abhaken und Dokumentnamen im Audit: Tipp auf die Zeile im Wählrad.', 'Tick off and document names in the audit: tap the row in the dial.'], ['Status ', 'Status '], [' · Dauer ', ' · duration '], ['Arbeitstag · ', 'Work day · '],
    ['–läuft', '–running'], ['Vibration kurz', 'vibration short'], ['Vibration lang', 'vibration long'], ['Vibration aus', 'vibration off'],
    ['Arbeitstag · ', 'Work day · '], ['Probelauf · ', 'Trial run · '], ['Dieses Audit hat ', 'This audit has '], ['Die Datei wurde ', 'The file was '],
    ['Audit läuft – ', 'Audit running – '], [' Töne geplant', ' signals planned'], ['Ton übernommen: ', 'Sound applied: '],
    ['Ungültige Zeit: ', 'Invalid time: '], ['Uhrzeit hh:mm', 'Time hh:mm'], ['Ende vor Beginn', 'End before start'],
    ['Timeslot gestartet', 'Time slot started'], ['Timeslot beendet', 'Time slot ended'], ['Timeslot löschen?', 'Delete time slot?'],
    ['Regel löschen?', 'Delete rule?'], ['“ löschen?', '”?'], ['PIN geändert', 'PIN changed'], ['PIN falsch (', 'Wrong PIN ('],
    [' Fehlversuche)', ' failed attempts)'], ['Entschlüssele …', 'Decrypting …'], ['Verschlüssele …', 'Encrypting …'], ['Prüfe …', 'Checking …'],
    ['Importiert: ', 'Imported: '], ['Kapitel beenden: ', 'End chapter: '], ['Verlängern: ', 'Extend: '],
    ['zusätzliches Dokument, z. B. QM-Handbuch Rev. 7 vom 03.2026', 'additional document, e.g. Quality manual Rev. 7 of 03.2026'],
    [' Unterpunkte gespeichert', ' sub-clauses saved'], [' Sätze im Archiv', ' records in the archive'],
    ['+ Dokument', '+ Document'], ['Export .txt', 'Export .txt'], ['erwartet: ', 'expected: '],
    ['% der Planzeit', '% of planned time'], ['min vor Planende', 'min before planned end'], ['min vor Ende', 'min before end'],
    ['min nach Beginn', 'min after start'], ['min im Slot', 'min in time slot'], ['Erinnerung ', 'Reminder '],
    [' – über Tagesende', ' – beyond end of day'], [' · noch kein Abgleich', ' · not synchronized yet'], [' · letzter Abgleich ', ' · last sync '],
    [' · läuft seit ', ' · running since '], [' · Oberfläche ', ' · UI '], [' · Logik ', ' · Logic '], [' · Austausch ', ' · Exchange '],
    [' · Vibration ', ' · vibration '], [' · Vorrang ', ' · priority '], [' · Plan ', ' · plan '], ['Planende ', 'Planned end '],
    [', Planende ', ', planned end '], [' h · erfasst ', ' h · recorded '], [' h · Rest ', ' h · left '], [' h · Ist ', ' h · actual '],
    [' h heute', ' h today'], ['Auditende ', 'audit end '], [' – bei ', ' – at '], ['(Plan ', '(plan '], [' min früher', ' min earlier'],
    [' (Teil ', ' (part '], [' (Audit)', ' (audit)'], ['Tag ', 'Day '], ['Heute ', 'Today '], ['Jetzt ', 'Now '], ['Vorgabe ', 'Target '],
    ['Erfasst ', 'Recorded '], ['Soll ', 'Target '], ['Auditor ', 'Auditor '], ['Timeslot ', 'Time slot '],
    ['Abgleich mit ', 'Sync with '], ['Gerät ', 'Device '], ['Datei: ', 'File: '], ['Handy: ', 'Phone: '], ['OK = Stand von ', 'OK = state of '],
    [' geändert, ', ' changed, '], [' gelöscht, ', ' deleted, '], [' neu, ', ' new, '], [' Rückfragen, ', ' queries, '], [' gleich.', ' equal.'],
    ['Fehler: ', 'Error: '], ['noch ', 'left '], ['alle ', 'every '], ['bis ', 'until '], [' von ', ' of '], [' fremd', ' other auditor']
  ];
  // 2.0.16: Monatsnamen der Seite Monat (nur mit folgendem Leerzeichen vor der Jahreszahl)
  ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'].forEach(function (m, i) {
    TEILE.push([m + ' 20', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i] + ' 20']);
  });
  TEILE.push([' Treffer', ' matches'], [' T · ', ' d · ']);
  TEILE.sort(function (a, b) { return b[0].length - a[0].length; });
  var GANZ_KEYS = {};
  Object.keys(GANZ).forEach(function (k) { GANZ_KEYS[k] = true; });

  var sprache = 'de';
  try { sprache = global.localStorage.getItem(SCHLUESSEL) === 'en' ? 'en' : 'de'; } catch (e) { sprache = 'de'; }

  /** Text übersetzen (bei DE unverändert) */
  function t(s) {
    if (sprache !== 'en' || s === null || s === undefined) return s;
    var x = String(s), k = x.trim();
    if (!k) return x;
    if (GANZ_KEYS[k]) return x.replace(k, GANZ[k]);
    var r = x;
    for (var i = 0; i < TEILE.length; i++) if (r.indexOf(TEILE[i][0]) >= 0) r = r.split(TEILE[i][0]).join(TEILE[i][1]);
    // ganze Zeilen eines mehrzeiligen Textes
    if (r.indexOf('\n') >= 0) r = r.split('\n').map(function (z) { var kz = z.trim(); return GANZ_KEYS[kz] ? z.replace(kz, GANZ[kz]) : z; }).join('\n');
    return r;
  }

  // --- DOM: Textknoten und Attribute, Original merken -------------------------
  var ATTR = ['placeholder', 'title'];
  var eigen = false;                                   // eigene Änderungen nicht erneut verarbeiten
  function ausgenommen(n) {
    var p = n.parentNode;
    while (p && p.nodeType === 1) {
      var tag = p.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return true;
      if (p.hasAttribute && p.hasAttribute('data-kein-i18n')) return true;
      p = p.parentNode;
    }
    return false;
  }
  function textKnoten(n) {
    if (ausgenommen(n)) return;
    if (n.__en === undefined || n.nodeValue !== n.__en) n.__de = n.nodeValue;   // neuer Originaltext
    var ziel = sprache === 'en' ? t(n.__de) : n.__de;
    n.__en = ziel;
    if (n.nodeValue !== ziel) n.nodeValue = ziel;
  }
  function attribute(el) {
    ATTR.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var k = '__de_' + a, v = el.getAttribute(a);
      if (el['__en_' + a] === undefined || v !== el['__en_' + a]) el[k] = v;
      var ziel = sprache === 'en' ? t(el[k]) : el[k];
      el['__en_' + a] = ziel;
      if (v !== ziel) el.setAttribute(a, ziel);
    });
  }
  function baum(root) {
    if (!root) return;
    if (root.nodeType === 3) { textKnoten(root); return; }
    if (root.nodeType !== 1) return;
    attribute(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) textKnoten(n); else attribute(n); }
  }
  function anwenden() {
    eigen = true;
    try { baum(document.body); document.documentElement.lang = sprache; } finally { eigen = false; }
  }
  var beobachter = null;
  function beobachten() {
    if (beobachter || !global.MutationObserver) return;
    beobachter = new MutationObserver(function (liste) {
      if (eigen) return;
      eigen = true;
      try {
        liste.forEach(function (m) {
          if (m.type === 'characterData') textKnoten(m.target);
          else if (m.type === 'attributes') attribute(m.target);
          else m.addedNodes.forEach(function (n) { baum(n); });
        });
      } finally { eigen = false; }
    });
    beobachter.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTR });
  }

  // --- Meldungen ---------------------------------------------------------------
  var oAlert = global.alert, oConfirm = global.confirm, oPrompt = global.prompt;
  global.alert = function (m) { return oAlert.call(global, t(m)); };
  global.confirm = function (m) { return oConfirm.call(global, t(m)); };
  global.prompt = function (m, d) { return oPrompt.call(global, t(m), d); };

  function setzen(l) {
    sprache = l === 'en' ? 'en' : 'de';
    try { global.localStorage.setItem(SCHLUESSEL, sprache); } catch (e) { }
    anwenden();
  }
  function start() { anwenden(); beobachten(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  global.I18N = { VERSION: VERSION, t: t, setzen: setzen, sprache: function () { return sprache; }, anwenden: anwenden };
})(this);
