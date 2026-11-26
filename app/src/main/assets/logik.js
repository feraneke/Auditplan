/*
 * Auditplan – Logik (ohne Oberfläche)
 * Version: 2.0.0 (2026-11-26)
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“.
 *
 * Inhalt:
 *  - Kapitel des Formulars P11F040 (ISO 13485) wie frmAuditzeiten 1.32.3 (PosDefIso)
 *  - Vorschlag der Zeiten (ProposeTimes, DistributeRest) für einen Auditor
 *  - Zeitplan mit Tagesrahmen, Mittagspause, Teilung ab 1,5 h, Verlängerung bis 10 h
 *    (UpdateResult, PrepareStart, RunBlock, MidPause)
 *  - Import des Arbeitsstands Auditzeiten.txt (Zeitplan-Teil und [DATEN]-Block)
 *  - Export im Format der 400.dotm (lädt dort über "Load")
 *  - Ereignisliste aus frei einstellbaren Signalregeln (Stufe A2)
 *  - Erwartete Dokumente je Unterpunkt (Stufe A3)
 *  - Abweichung vom Plan: Verlängern, Verschieben, Kürzen, früher beenden (Stufe A4)
 *
 * Versionshistorie:
 *   1.0.0 (2026-11-25) Erste Fassung.
 *   2.0.0 (2026-11-26) Stufen A2-A4: Signalregeln (REGELN_VORGABE, ereignisse mit Regeln,
 *                      marken), Vorgaben je Unterpunkt (VORGABEN, NORM, unterpunkteVon,
 *                      kapitelVon), Abweichungen (ablaufIst, abwPruefen). ereignisse() nimmt
 *                      statt der Optionen die Regelliste; alter Aufruf mit Optionen bleibt möglich.
 */
(function (global) {
  'use strict';

  var VERSION = '2.0.0';

  // ---------------------------------------------------------------------------
  // Kapitel P11F040: Kürzel | Art | Gewicht | ÜA mit 7.3 | ÜA ohne 7.3 | Höchstwert
  // Arten: G Gespräch, F fest, E Entwicklung 15 %, P Produktion 15 %, W nach Gewicht
  // ---------------------------------------------------------------------------
  var KAPITEL = [
    { key: 'EG', art: 'G', w: 0.5, uaA: 0, uaB: 0, max: 0, name: 'Einführungsgespräch' },
    { key: '5', art: 'W', w: 2, uaA: 0, uaB: 0, max: 2, name: 'Verantwortung der Leitung' },
    { key: 'Betriebsrundgang', art: 'F', w: 0.5, uaA: 0, uaB: 0, max: 0, name: '' },
    { key: '4.1', art: 'W', w: 1, uaA: 0, uaB: 0, max: 0, name: 'Allgemeine Anforderungen' },
    { key: '4.2', art: 'W', w: 1, uaA: 0, uaB: 0, max: 0, name: 'Dokumentationsanforderungen' },
    { key: '6.1+6.3+6.4', art: 'W', w: 1, uaA: 2, uaB: 1, max: 0, name: 'Ressourcen, Infrastruktur, Arbeitsumgebung' },
    { key: '6.2', art: 'W', w: 1, uaA: 2, uaB: 1, max: 0, name: 'Personelle Ressourcen' },
    { key: '7.1', art: 'W', w: 1, uaA: 1, uaB: 1, max: 0, name: 'Planung der Produktrealisierung' },
    { key: '7.2', art: 'W', w: 1, uaA: 1, uaB: 1, max: 0, name: 'Kundenbezogene Prozesse' },
    { key: '7.3', art: 'E', w: 0, uaA: 1, uaB: 1, max: 0, name: 'Entwicklung' },
    { key: '7.4', art: 'W', w: 2, uaA: 2, uaB: 2, max: 0, name: 'Beschaffung' },
    { key: '7.5', art: 'P', w: 0, uaA: 0, uaB: 0, max: 0, name: 'Produktion und Dienstleistungserbringung' },
    { key: '7.6', art: 'W', w: 1, uaA: 2, uaB: 2, max: 0, name: 'Lenkung von Überwachungs- und Messmitteln' },
    { key: '8.1', art: 'W', w: 0.5, uaA: 2, uaB: 2, max: 0, name: 'Messung, Analyse, Verbesserung' },
    { key: '8.2.1-8.2.3', art: 'W', w: 2, uaA: 0, uaB: 0, max: 0, name: 'Rückmeldungen, Reklamationen, Meldungen' },
    { key: '8.2.4', art: 'W', w: 1, uaA: 0, uaB: 0, max: 0, name: 'Internes Audit' },
    { key: '8.2.5+8.2.6', art: 'W', w: 1, uaA: 2, uaB: 2, max: 0, name: 'Überwachung von Prozessen und Produkt' },
    { key: '8.3', art: 'W', w: 1, uaA: 2, uaB: 2, max: 0, name: 'Lenkung fehlerhafter Produkte' },
    { key: '8.4', art: 'W', w: 1, uaA: 1, uaB: 1, max: 0, name: 'Datenanalyse' },
    { key: '8.5', art: 'W', w: 2, uaA: 0, uaB: 0, max: 0, name: 'Verbesserung' },
    { key: 'AG', art: 'G', w: 1, uaA: 0, uaB: 0, max: 0, name: 'Vorbereitung und Abschlussgespräch' }
  ];

  // Unterpunkte (Aufgaben der 400.dotm) -> Kapitel, für Namen und erwartete Dokumente
  var UNTERPUNKTE = {
    '5': '5.1,5.2,5.3,5.4.1,5.4.2,5.5.1,5.5.2,5.5.3,5.6.1,5.6.2,5.6.3',
    '4.1': '4.1.1,4.1.2,4.1.3,4.1.4,4.1.5,4.1.6',
    '4.2': '4.2.1,4.2.2,4.2.3,4.2.4,4.2.5',
    '6.1+6.3+6.4': '6.1,6.3,6.4.1,6.4.2',
    '7.2': '7.2.1,7.2.2,7.2.3',
    '7.3': '7.3.1,7.3.2,7.3.3,7.3.4,7.3.5,7.3.6,7.3.7,7.3.8,7.3.9,7.3.10',
    '7.4': '7.4.1,7.4.2,7.4.3',
    '7.5': '7.5.1,7.5.2,7.5.3,7.5.4,7.5.5,7.5.6,7.5.7,7.5.8,7.5.9.1,7.5.9.2,7.5.10,7.5.11',
    '8.2.1-8.2.3': '8.2.1,8.2.2,8.2.3',
    '8.2.5+8.2.6': '8.2.5,8.2.6',
    '8.3': '8.3.1,8.3.2,8.3.3,8.3.4',
    '8.5': '8.5.1,8.5.2,8.5.3'
  };
  var ELTERN = {};
  Object.keys(UNTERPUNKTE).forEach(function (k) {
    UNTERPUNKTE[k].split(',').forEach(function (u) { ELTERN[u] = k; });
  });

  // Erwartete Dokumente je Kapitel (Vorbelegung, in der App änderbar)
  var DOKUMENTE = {
    'EG': 'Auditplan\nGeltungsbereich, Zertifikat\nOrganigramm\nÄnderungen seit dem letzten Audit\nStatus der Abweichungen aus dem letzten Audit',
    '5': 'Qualitätspolitik\nQualitätsziele mit Zielerreichung\nManagementbewertung (Eingaben, Ergebnisse)\nOrganigramm, Verantwortung und Befugnis\nErnennung Beauftragter der Leitung\nNachweise interner Kommunikation',
    'Betriebsrundgang': 'Kennzeichnung und Prüfstatus\nArbeitsanweisungen vor Ort\nSauberkeit, Kontaminationslenkung\nSperrlager, fehlerhafte Produkte\nKennzeichnung der Prüfmittel',
    '4.1': 'Prozesslandkarte, Wechselwirkungen\nRolle(n) der Organisation\nRisikobasierter Ansatz\nAusgelagerte Prozesse und ihre Lenkung\nValidierung der QMS-Software',
    '4.2': 'QM-Handbuch\nMedizinprodukteakte(n)\nVerfahren Lenkung von Dokumenten\nDokumentenliste, Revisionsstände\nLenkung von Aufzeichnungen, Aufbewahrungsfristen',
    '6.1+6.3+6.4': 'Ressourcenplanung\nInstandhaltungsplan und -nachweise\nAnforderungen an die Arbeitsumgebung\nÜberwachung der Arbeitsumgebung\nLenkung von Kontamination',
    '6.2': 'Qualifikationsmatrix\nSchulungsplan und Schulungsnachweise\nWirksamkeit der Schulungen\nStellenbeschreibungen',
    '7.1': 'Planung der Produktrealisierung\nRisikomanagementakte (ISO 14971)\nQualitätspläne, Prüfpläne',
    '7.2': 'Bewertung der Anforderungen (Vertragsprüfung)\nKundenanforderungen inkl. regulatorischer\nKennzeichnung, Gebrauchsanweisung\nKommunikation mit Kunden und Behörden',
    '7.3': 'Entwicklungsplan\nEntwicklungseingaben\nEntwicklungsergebnisse\nEntwicklungsbewertungen (Reviews)\nVerifizierung\nValidierung, klinische Bewertung\nEntwicklungsübertragung\nLenkung von Entwicklungsänderungen\nEntwicklungsakte',
    '7.4': 'Beschaffungsverfahren\nLieferantenbewertung, Lieferantenliste\nQualitätssicherungsvereinbarungen\nBeschaffungsangaben\nWareneingangsprüfung',
    '7.5': 'Herstellanweisungen\nChargenprotokolle\nProzessvalidierungen (IQ/OQ/PQ)\nSoftware-Validierung\nKennzeichnung, UDI, Rückverfolgbarkeit\nEigentum des Kunden\nProdukterhaltung (Lagerung, Verpackung, Transport)\nInstallation, Instandhaltung',
    '7.6': 'Prüfmittelliste\nKalibriernachweise\nMaßnahmen bei Abweichung\nValidierung der Prüfsoftware',
    '8.1': 'Planung von Überwachung, Messung, Analyse\nStatistische Methoden',
    '8.2.1-8.2.3': 'Verfahren Rückmeldungen\nReklamationsliste und -bearbeitung\nVigilanz-/Meldeverfahren\nMeldungen an Behörden',
    '8.2.4': 'Auditprogramm\nAuditberichte\nQualifikation der Auditoren\nVerfolgung der Maßnahmen',
    '8.2.5+8.2.6': 'Prozesskennzahlen\nPrüfpläne und Prüfaufzeichnungen\nFreigabenachweise',
    '8.3': 'Verfahren fehlerhafte Produkte\nNC-Berichte, Sonderfreigaben\nRückrufe, Feldmaßnahmen\nNacharbeit',
    '8.4': 'Datenanalyse (Rückmeldungen, Prozesse, Lieferanten, Audits)\nTrends',
    '8.5': 'CAPA-Verfahren\nCAPA-Liste\nUrsachenanalysen\nWirksamkeitsprüfung',
    'AG': 'Abweichungsberichte\nEntwurf Auditbericht\nEmpfehlung\nNächste Termine'
  };

  var AUDITTYPEN = ['1. ÜA', '2. ÜA', 'Rezert'];
  var MIN_PART = 90;          // Mindestteil 1,5 h
  var MAX_DAY_WORK = 600;     // höchstens 10 h am Tag
  var PAUSE_WINDOW_START = 720, PAUSE_WINDOW_END = 810;
  var NO_PAUSE_START_AFTER = 690, PAUSE_EARLIEST = 690, PAUSE_GRID = 15;

  // ---------------------------------------------------------------------------
  // Hilfen
  // ---------------------------------------------------------------------------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function uhr(min) { min = Math.round(min); return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
  function zahl(s) {
    if (s === null || s === undefined) return 0;
    s = String(s).trim().replace(',', '.');
    if (s === '') return 0;
    var v = parseFloat(s);
    return isNaN(v) ? -1 : v;
  }
  function stunden(h) {
    var s = (Math.round(h * 100) / 100).toString().replace('.', ',');
    return s;
  }
  function uhrzeitMin(s) {
    var m = /^\s*(\d{1,2})[:.](\d{2})\s*$/.exec(s || '');
    if (!m) return -1;
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return -1;
    return h * 60 + mi;
  }
  function viertel(h) { return Math.floor(h * 4 + 0.5 + 1e-6) / 4; }
  function normKey(s) { return String(s || '').replace(/\s/g, '').replace(/[–—]/g, '-'); }
  function kapitel(key) {
    for (var i = 0; i < KAPITEL.length; i++) if (KAPITEL[i].key === key) return KAPITEL[i];
    return null;
  }
  /** Anzeige: "7.3 Entwicklung", "EG Einführungsgespräch" */
  function titelVon(key) {
    var k = kapitel(key);
    if (k && k.name) return key + ' ' + k.name;
    return key;
  }
  /** ISO-Datum JJJJ-MM-TT + Tag (1 = erster Audittag) -> Date um 0:00 */
  function tagDatum(startIso, tag) {
    var p = String(startIso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2] + tag - 1);
  }
  function zeitpunkt(startIso, tag, min) {
    var d = tagDatum(startIso, tag);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, min).getTime();
  }
  var WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  function datumText(d) { return WT[d.getDay()] + ' ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function deNachIso(s) {
    var m = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s || '');
    return m ? m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]) : '';
  }
  function isoNachDe(s) {
    var p = String(s || '').split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : '';
  }

  /** Kürzel aus einer Kapitelbeschriftung ("7.3 (Teil 2)", "5.1 Verpflichtung ...", "7.3 (2)") */
  function keyAusTitel(titel) {
    var t = String(titel || '').replace(/\s*\(Teil \d+\)\s*$/, '').replace(/\s*\(\d+\)\s*$/, '').trim();
    if (kapitel(t)) return t;
    var erstes = t.split(/\s+/)[0];
    if (kapitel(erstes) || ELTERN[erstes]) return erstes;
    return t;
  }
  /** Kapitel für die erwarteten Dokumente: Unterpunkt -> Kapitel */
  function dokKey(key) {
    if (DOKUMENTE[key] !== undefined) return key;
    if (ELTERN[key]) return ELTERN[key];
    return key;
  }

  // ---------------------------------------------------------------------------
  // Vorschlag (ProposeTimes für einen Auditor)
  // kopf: {auditzeit, typ, noDev, excl}
  // -> posten: [{key, on, h}] in der Vorgabe-Reihenfolge
  // ---------------------------------------------------------------------------
  function vorschlag(kopf) {
    var ua = kopf.typ === AUDITTYPEN[0] ? 1 : (kopf.typ === AUDITTYPEN[1] ? 2 : 0);
    var ausschluss = {};
    var hinweis = [];
    String(kopf.excl || '').replace(/;/g, ',').split(',').forEach(function (t) {
      t = normKey(t);
      if (!t) return;
      var k = kapitel(t);
      if (k && k.art !== 'G') ausschluss[t] = true; else hinweis.push(t);
    });
    var zeit = zahl(kopf.auditzeit);
    var posten = KAPITEL.map(function (k) {
      var on = true;
      if (k.art !== 'G') {
        if (k.art === 'E' && kopf.noDev) on = false;
        if (ausschluss[k.key]) on = false;
        if (ua > 0) {
          var plan = kopf.noDev ? k.uaB : k.uaA;
          if (plan !== 0 && plan !== ua) on = false;
        }
      }
      return { key: k.key, on: on, h: 0 };
    });
    var fest = 0, sumW = 0;
    posten.forEach(function (p) {
      var k = kapitel(p.key);
      if (!p.on) return;
      if (k.art === 'G' || k.art === 'F') p.h = k.w;
      else if (k.art === 'E') p.h = viertel(0.15 * zeit);
      else if (k.art === 'P') p.h = viertel(0.15 * zeit);
      else if (k.art === 'W') sumW += k.w;
      fest += p.h;
    });
    var rest = zeit - fest;
    var meldung = '';
    if (rest < 0) {
      meldung = 'Auditzeit reicht nicht für Gespräche, 7.3 und 7.5 (' + stunden(fest) + ' h).';
      rest = 0;
    }
    if (sumW > 0) restVerteilen(posten, rest);
    if (hinweis.length) meldung += (meldung ? ' ' : '') + 'Kein eigenes Kapitel, Kapitel bleibt angehakt: ' + hinweis.join(', ');
    return { posten: posten, meldung: meldung };
  }

  // DistributeRest: Viertelstunden nach Gewicht, Höchstwerte, Reste nach größtem Bruchteil
  function restVerteilen(posten, rest) {
    var q = Math.floor(rest * 4 + 0.5 + 1e-6);
    var use = posten.filter(function (p) { return p.on && kapitel(p.key).art === 'W'; });
    var fix = {}, base = {}, frac = {};
    var pool = q, capped;
    do {
      capped = false;
      var poolW = 0;
      use.forEach(function (p) { if (!fix[p.key]) poolW += kapitel(p.key).w; });
      if (poolW <= 0) break;
      use.forEach(function (p) {
        var k = kapitel(p.key);
        if (!fix[p.key] && k.max > 0) {
          var capQ = Math.floor(k.max * 4 + 1e-6);
          if (pool * k.w / poolW > capQ) { fix[p.key] = true; base[p.key] = capQ; pool -= capQ; capped = true; }
        }
      });
    } while (capped);
    var poolW2 = 0;
    use.forEach(function (p) { if (!fix[p.key]) poolW2 += kapitel(p.key).w; });
    var left = pool;
    use.forEach(function (p) {
      if (!fix[p.key] && poolW2 > 0) {
        var raw = pool * kapitel(p.key).w / poolW2;
        base[p.key] = Math.floor(raw + 1e-6);
        frac[p.key] = raw - base[p.key];
        left -= base[p.key];
      }
    });
    while (left > 0) {
      var best = null;
      use.forEach(function (p) {
        if (fix[p.key]) return;
        if (best === null || frac[p.key] > frac[best] + 1e-6) best = p.key;
      });
      if (best === null) break;
      base[best]++; frac[best] = -1; left--;
    }
    use.forEach(function (p) { p.h = (base[p.key] || 0) / 4; });
  }

  // ---------------------------------------------------------------------------
  // Zeitplan für einen Auditor (UpdateResult)
  // kopf: {start (ISO), startzeit, tagBeginn, tagEnde, pause}
  // posten: [{key, on, h}] in Plan-Reihenfolge
  // -> {zeilen, tage, ende:{tag,min}, warnungen, summe}
  // zeilen: {art:'kapitel'|'pause', titel, key, gruppe, teil, h, tag, je:[{von,bis}]}
  // ---------------------------------------------------------------------------
  function zeitplan(kopf, posten) {
    var startMin = uhrzeitMin(kopf.startzeit);
    var beginMin = uhrzeitMin(kopf.tagBeginn);
    var endMin = uhrzeitMin(kopf.tagEnde);
    var pauseMin = Math.round(zahl(kopf.pause) * 60);
    var warn = [];
    if (startMin < 0 || beginMin < 0 || endMin < 0 || endMin <= beginMin || pauseMin < 0) {
      return { zeilen: [], tage: [], ende: null, warnungen: ['Uhrzeiten prüfen (hh:mm).'], summe: 0 };
    }
    var zeilen = [];
    var arbeit = {};     // Minuten je Tag
    var verl = {};       // Tag verlängert
    var day = 1, clock = startMin, bPause = startMin > NO_PAUSE_START_AFTER;
    var rem = 0, summe = 0;
    posten.forEach(function (p) { if (p.on && p.h > 0) rem += Math.round(p.h * 60); });

    function pauseZeile(tag, von, imKapitel) {
      zeilen.push({ art: 'pause', titel: imKapitel ? 'Mittagspause (im Kapitel)' : 'Mittagspause', key: 'Pause',
        gruppe: -1, teil: 0, h: pauseMin / 60, tag: tag, je: [{ von: von, bis: von + pauseMin }] });
    }

    posten.forEach(function (p, gi) {
      if (!p.on || !(p.h > 0)) return;
      var dur = Math.round(p.h * 60);
      summe += p.h;
      // PrepareStart
      if (!bPause && clock >= PAUSE_WINDOW_START && clock + rem > PAUSE_WINDOW_END) {
        pauseZeile(day, clock, false);
        clock += pauseMin; bPause = true;
      }
      if (clock >= endMin) { day++; clock = beginMin; bPause = false; }
      // Teilung ab 1,5 h, sonst Verlängerung oder nächster Tag
      var extra = 0;
      var avail = endMin - clock - (bPause ? 0 : pauseMin);
      if (avail > 0 && dur > avail) {
        var part1 = avail, part2 = dur - avail;
        if (part2 < MIN_PART && (arbeit[day] || 0) + dur <= MAX_DAY_WORK) {
          extra = part2; verl[day] = true;
          warn.push(titelVon(p.key) + ': Audittag ' + day + ' verlängert (+' + stunden(part2 / 60) + ' h).');
        }
        if (extra === 0 && part1 < MIN_PART) {
          warn.push(titelVon(p.key) + ' beginnt an Tag ' + (day + 1) + ' (Teil 1 wäre nur ' + stunden(part1 / 60) + ' h).');
          day++; clock = beginMin; bPause = false;
        }
      }
      // RunBlock
      var restB = dur, first = day, teil = 0, guard = 0;
      while (restB > 0 && guard++ < 1000) {
        var limit = endMin - (bPause ? 0 : pauseMin) + (day === first ? extra : 0);
        var av = limit - clock;
        if (av <= 0) { day++; clock = beginMin; bPause = false; continue; }
        var step = Math.min(restB, av);
        var pauseAt = -1;
        if (!bPause && clock < PAUSE_WINDOW_START && clock + step > PAUSE_WINDOW_END) pauseAt = midPause(clock, step, pauseMin);
        arbeit[day] = (arbeit[day] || 0) + step;
        var titel = titelVon(p.key);
        if (pauseAt > clock) {
          teil++;
          zeilen.push(kZeile(p, gi, titel, teil, day, clock, pauseAt));
          pauseZeile(day, pauseAt, true);
          var after = step - (pauseAt - clock);
          clock = pauseAt + pauseMin; bPause = true;
          teil++;
          zeilen.push(kZeile(p, gi, titel, teil, day, clock, clock + after));
          clock += after;
        } else {
          var segStart = clock;
          if (pauseAt === clock) { pauseZeile(day, clock, true); clock += pauseMin; bPause = true; segStart = clock; }
          teil++;
          zeilen.push(kZeile(p, gi, titel, teil, day, segStart, clock + step));
          clock += step;
        }
        restB -= step;
        if (restB > 0) { day++; clock = beginMin; bPause = false; }
      }
      rem -= dur;
    });
    var tage = [];
    var maxTag = zeilen.length ? zeilen[zeilen.length - 1].tag : 1;
    for (var t = 1; t <= maxTag; t++) {
      tage.push({ tag: t, text: 'Tag ' + t + ' (' + datumText(tagDatum(kopf.start, t)) + '): ' + stunden((arbeit[t] || 0) / 60) + ' h',
        verlaengert: !!verl[t] });
    }
    var letzte = zeilen.length ? zeilen[zeilen.length - 1] : null;
    return { zeilen: zeilen, tage: tage, ende: letzte ? { tag: letzte.tag, min: letzte.je[0].bis } : null,
      warnungen: warn, summe: summe };
  }
  function kZeile(p, gi, titel, teil, tag, von, bis) {
    return { art: 'kapitel', titel: titel, key: p.key, gruppe: gi, teil: teil, h: (bis - von) / 60, tag: tag,
      je: [{ von: von, bis: bis }] };
  }
  function midPause(clock, work, pauseMin) {
    var t = clock + Math.floor(work / 2);
    t = Math.floor(t / PAUSE_GRID) * PAUSE_GRID;
    if (t < PAUSE_EARLIEST) t = PAUSE_EARLIEST;
    if (t + pauseMin > PAUSE_WINDOW_END) t = PAUSE_WINDOW_END - pauseMin;
    if (t < clock) t = clock;
    if (t > clock + work) t = clock + work;
    return t;
  }

  // ---------------------------------------------------------------------------
  // Import Auditzeiten.txt (400.dotm, WriteTimesFile)
  // -> audit {name, quelle:'import', kopf, plan:{auditoren, zeilen, tage}, daten:{posten}|null}
  // ---------------------------------------------------------------------------
  function textAusBytes(buf) {
    var bytes = new Uint8Array(buf);
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
    } catch (e) {
      return new TextDecoder('windows-1252').decode(bytes);
    }
  }

  function slot(s, tagVorgabe) {
    s = String(s || '').trim();
    var m = /^T(\d+)\s+(\d{1,2}:\d{2})$/.exec(s);
    if (m) return { tag: +m[1], min: uhrzeitMin(m[2]) };
    var min = uhrzeitMin(s);
    return min < 0 ? null : { tag: tagVorgabe, min: min };
  }

  function importTxt(text) {
    var lines = String(text).split(/\r?\n/);
    var kopf = { kunde: '', auditzeit: '', typ: '', start: '', startzeit: '09:00', tagBeginn: '09:00', tagEnde: '17:30',
      pause: '0,5', noDev: false, excl: '', auditoren: '1', formular: '' };
    var i, auditoren = null, zeilen = [], tage = [], tag = 1, gruppen = {}, gNr = 0, hinweis = '';
    var inTabelle = false, daten = null;
    for (i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (l === '[DATEN]') { daten = []; inTabelle = false; continue; }
      if (daten) { if (l.indexOf('|') > 0) daten.push(l.split('|')); continue; }
      var c = l.split('\t');
      if (!inTabelle) {
        var k = c[0];
        if (k === 'Kunde / Auftrag:') kopf.kunde = c[1] || '';
        else if (k === 'Anzahl der Auditoren:') kopf.auditoren = c[1] || '1';
        else if (k === 'Auditzeit (h):') kopf.auditzeit = c[1] || '';
        else if (k === 'Formular:') kopf.formular = c[1] || '';
        else if (k === 'Audittyp:') kopf.typ = c[1] || '';
        else if (k === 'Auditstart:') {
          kopf.start = deNachIso(c[1]);
          var mz = /(\d{1,2}:\d{2})/.exec(c[1] || '');
          if (mz) kopf.startzeit = mz[1];
        } else if (k === 'Tagesrahmen:') {
          var mr = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2}).*?Mittagspause\s*([\d,\.]+)/.exec(c[1] || '');
          if (mr) { kopf.tagBeginn = mr[1]; kopf.tagEnde = mr[2]; kopf.pause = mr[3]; }
        } else if (k === '7.3 ausgeschlossen:') kopf.noDev = (c[1] === 'ja');
        else if (k === 'Ausschlüsse / Nichtanwendbarkeiten:') kopf.excl = c[1] || '';
        else if (k === 'Hinweis:') hinweis = c[1] || '';
        else if (k === 'Nr.' && c[1] === 'Kapitel') {
          auditoren = [];
          for (var a = 3; a < c.length; a += 3) auditoren.push(c[a]);
          inTabelle = true;
        }
        continue;
      }
      // Tabelle
      if (l.trim() === '') { inTabelle = false; continue; }
      if (c[0] === '-----') {
        var mt = /Tag\s+(\d+)/.exec(c[1] || '');
        if (mt) { tage.push({ tag: +mt[1], text: (c[1] || '').trim(), verlaengert: false }); tag = +mt[1] + 1; }
        continue;
      }
      var titel = (c[1] || '').trim();
      if (!titel) continue;
      var istPause = /^Mittagspause/.test(titel);
      var je = [], zeileTag = null;
      for (var au = 0; au < auditoren.length; au++) {
        var x = (c[3 + au * 3] || '').trim();
        var von = slot(c[4 + au * 3], tag), bis = slot(c[5 + au * 3], tag);
        if (von && bis && (istPause || x === 'x')) {
          je.push({ von: von.min, bis: bis.min + (bis.tag - von.tag) * 1440 });
          if (zeileTag === null) zeileTag = von.tag;
        } else je.push(null);
      }
      if (zeileTag === null) continue;            // Kapitel ohne Zeit
      var key = istPause ? 'Pause' : keyAusTitel(titel);
      var teilM = /\(Teil (\d+)\)\s*$/.exec(titel);
      var gruppe = -1, teil = 1;
      if (!istPause) {
        var basis = titel.replace(/\s*\(Teil \d+\)\s*$/, '');
        if (teilM && gruppen[basis] !== undefined) { gruppe = gruppen[basis]; teil = +teilM[1]; }
        else { gruppe = gNr++; gruppen[basis] = gruppe; }
      }
      zeilen.push({ art: istPause ? 'pause' : 'kapitel', titel: anzeigeTitel(titel, key), key: key, gruppe: gruppe,
        teil: teil, h: zahl(c[2]) > 0 ? zahl(c[2]) : 0, tag: zeileTag, je: je });
    }
    if (!auditoren) throw new Error('Keine Zeitplan-Tabelle gefunden (Kopfzeile "Nr. / Kapitel / Zeit (h)").');
    if (!kopf.start) throw new Error('Kein Auditstart in der Datei.');
    // [DATEN]: Posten für "Bearbeiten"
    var posten = null;
    if (daten) {
      posten = [];
      var map = {};
      daten.forEach(function (d) {
        if (d[0] === 'POS' && d.length >= 5) {
          var lbl = d[1], pos = +d[2], on = d[3] === '1', h = zahl(d[4]);
          var basisKey = lbl.replace(/\s*\(\d+\)$/, '');
          if (kapitel(basisKey) && pos >= 0) {
            if (map[basisKey]) { map[basisKey].h += (on && h > 0 ? h : 0); }     // Kopie zum Original
            else { map[basisKey] = { key: basisKey, on: on, h: h > 0 ? h : 0, pos: pos }; posten.push(map[basisKey]); }
          } else if (ELTERN[lbl] && on && h > 0) {
            var el = ELTERN[lbl];                                              // Aufgabe zum Kapitel
            if (map[el]) map[el].h += h; else { map[el] = { key: el, on: true, h: h, pos: 999 }; posten.push(map[el]); }
          }
        }
      });
      posten.sort(function (a, b) { return a.pos - b.pos; });
      KAPITEL.forEach(function (k) { if (!map[k.key]) posten.splice(Math.max(0, posten.length - 1), 0, { key: k.key, on: false, h: 0 }); });
      posten.forEach(function (p) { delete p.pos; });
    }
    var name = kopf.kunde || ('Audit ' + isoNachDe(kopf.start));
    return { name: name, quelle: 'import', kopf: kopf, hinweis: hinweis,
      plan: { start: kopf.start, auditoren: auditoren, zeilen: zeilen, tage: tage }, posten: posten };
  }
  function anzeigeTitel(titel, key) {
    var k = kapitel(key);
    if (k && k.name && titel.indexOf(k.name) < 0) {
      return titel.replace(key, key + ' ' + k.name);
    }
    return titel;
  }

  // ---------------------------------------------------------------------------
  // Export im Format der 400.dotm (WriteTimesFile); Kopf + Tabelle + [DATEN]
  // ---------------------------------------------------------------------------
  function exportTxt(audit, appVersion) {
    var k = audit.kopf, out = [];
    var jetzt = new Date();
    var stamp = pad(jetzt.getDate()) + '.' + pad(jetzt.getMonth() + 1) + '.' + jetzt.getFullYear() + ' ' +
      pad(jetzt.getHours()) + ':' + pad(jetzt.getMinutes());
    var ende = audit.plan.zeilen.length ? audit.plan.zeilen[audit.plan.zeilen.length - 1] : null;
    out.push('Auditzeiten\t(Auditplan-App Vers. ' + (appVersion || VERSION) + ')\terzeugt ' + stamp);
    out.push('');
    out.push('Kunde / Auftrag:\t' + (k.kunde || ''));
    out.push('Anzahl der Auditoren:\t1');
    out.push('Auditzeit (h):\t' + (k.auditzeit || ''));
    out.push('Formular:\tP11F040 (ISO 13485)');
    out.push('Audittyp:\t' + (k.typ || ''));
    out.push('Auditstart:\t' + isoNachDe(k.start) + ' ' + k.startzeit);
    out.push('Tagesrahmen:\t' + k.tagBeginn + ' - ' + k.tagEnde + ', Mittagspause ' + k.pause + ' h');
    out.push('7.3 ausgeschlossen:\t' + (k.noDev ? 'ja' : 'nein'));
    out.push('Ausschlüsse / Nichtanwendbarkeiten:\t' + (k.excl || ''));
    out.push('Auditende:\t' + (ende ? isoNachDe(isoTag(k.start, ende.tag)) + ' ' + uhr(ende.je[0].bis) : ''));
    out.push('');
    out.push('Nr.\tKapitel\tZeit (h)\tLA\tvon\tbis');
    var nr = 0, tag = 1;
    audit.plan.zeilen.forEach(function (z) {
      while (z.tag > tag) { out.push('-----\t' + tagText(audit, tag)); tag++; }
      var j = z.je[0];
      if (z.art === 'pause') out.push('\t' + z.titel + '\t\t\t' + uhr(j.von) + '\t' + uhr(j.bis));
      else if (z.teil > 1) out.push('\t' + z.key + ' (Teil ' + z.teil + ')\t' + stunden(z.h) + '\tx\t' + uhr(j.von) + '\t' + uhr(j.bis));
      else { nr += 10; out.push(nr + '\t' + z.key + '\t' + stunden(gruppenStunden(audit, z.gruppe)) + '\tx\t' + uhr(j.von) + '\t' + uhr(j.bis)); }
    });
    out.push('-----\t' + tagText(audit, tag));
    out.push('');
    out.push('[DATEN]');
    out.push('SAVED|' + stamp);
    out.push('FORM|0');
    out.push('AUDITORS|1');
    out.push('AUDITTIME|' + (k.auditzeit || ''));
    out.push('TYPE|' + AUDITTYPEN.indexOf(k.typ));
    out.push('START|' + isoNachDe(k.start));
    out.push('STARTTIME|' + k.startzeit);
    out.push('DAYBEGIN|' + k.tagBeginn);
    out.push('DAYEND|' + k.tagEnde);
    out.push('PAUSE|' + k.pause);
    out.push('NODEV|' + (k.noDev ? '1' : '0'));
    out.push('EXCL|' + (k.excl || ''));
    out.push('KZ|||||');
    out.push('TEMPLATE|');
    out.push('KUNDE|' + (k.kunde || ''));
    (audit.posten || []).forEach(function (p, i) {
      out.push('POS|' + p.key + '|' + i + '|' + (p.on ? '1' : '0') + '|' + (p.h > 0 ? stunden(p.h) : '') + '|' +
        (p.on && p.h > 0 ? '1' : '0') + '|0|0|0|0');
    });
    return out.join('\r\n') + '\r\n';
  }
  function isoTag(startIso, tag) {
    var d = tagDatum(startIso, tag);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function tagText(audit, tag) {
    var t = (audit.plan.tage || []).filter(function (x) { return x.tag === tag; })[0];
    return t ? t.text : 'Tag ' + tag;
  }
  function gruppenStunden(audit, g) {
    var s = 0;
    audit.plan.zeilen.forEach(function (z) { if (z.gruppe === g && z.art === 'kapitel') s += z.h; });
    return s;
  }

  // ---------------------------------------------------------------------------
  // Ablauf für einen Auditor: Einträge mit absoluten Zeiten
  // ---------------------------------------------------------------------------
  function ablauf(plan, aud) {
    var liste = [];
    plan.zeilen.forEach(function (z, i) {
      var j = z.je[aud];
      if (!j) return;
      liste.push({ nr: i, art: z.art, titel: z.titel, key: z.key, gruppe: z.gruppe, tag: z.tag,
        von: zeitpunkt(plan.start, z.tag, j.von), bis: zeitpunkt(plan.start, z.tag, j.bis), vonMin: j.von, bisMin: j.bis });
    });
    liste.sort(function (a, b) { return a.von - b.von || a.nr - b.nr; });
    return liste;
  }

  // ---------------------------------------------------------------------------
  // Signalregeln (Stufe A2)
  // Regel: {id, gilt:'AUDIT'|'ARBEITSTAG', ausl:'PROZENT'|'VOR_ENDE'|'NACH_BEGINN'|'INTERVALL',
  //         wert, ton, lautst (5..100), anschlaege (1..3), vib:'AUS'|'KURZ'|'LANG', vorrang, aktiv,
  //         geaendert, geloescht}
  // ---------------------------------------------------------------------------
  var TOENE = [
    { id: 'sonar', name: 'Sonar' }, { id: 'gong', name: 'Gong' }, { id: 'glocke', name: 'Glocke' },
    { id: 'klangschale', name: 'Klangschale' }, { id: 'holzblock', name: 'Holzblock' }, { id: 'piep', name: 'Kurzer Piep' }
  ];
  var AUSLOESER = { PROZENT: 'Anteil des Timeslots (%)', VOR_ENDE: 'Minuten vor Ende', NACH_BEGINN: 'Minuten nach Beginn',
    INTERVALL: 'Intervall (alle n min zur vollen Uhrzeit)' };
  var REGELN_VORGABE = [
    { id: 'S-001', gilt: 'AUDIT', ausl: 'INTERVALL', wert: 30, ton: 'sonar', lautst: 50, anschlaege: 1, vib: 'KURZ', vorrang: 1, aktiv: true },
    { id: 'S-002', gilt: 'AUDIT', ausl: 'PROZENT', wert: 75, ton: 'gong', lautst: 100, anschlaege: 1, vib: 'LANG', vorrang: 2, aktiv: true },
    { id: 'S-003', gilt: 'AUDIT', ausl: 'PROZENT', wert: 100, ton: 'gong', lautst: 100, anschlaege: 2, vib: 'LANG', vorrang: 3, aktiv: true },
    { id: 'S-004', gilt: 'ARBEITSTAG', ausl: 'INTERVALL', wert: 60, ton: 'sonar', lautst: 40, anschlaege: 1, vib: 'KURZ', vorrang: 1, aktiv: true }
  ];
  function regelText(r) {
    var w = +r.wert;
    var a = r.ausl === 'PROZENT' ? w + ' %' : r.ausl === 'VOR_ENDE' ? w + ' min vor Ende' :
      r.ausl === 'NACH_BEGINN' ? w + ' min nach Beginn' : 'alle ' + w + ' min';
    var t = TOENE.filter(function (x) { return x.id === r.ton; })[0];
    var tn = t ? t.name : (String(r.ton || '').indexOf('datei:') === 0 ? 'eigene Datei' : r.ton);
    return a + ' · ' + tn + (r.anschlaege > 1 ? ' ×' + r.anschlaege : '') + ' · ' + r.lautst + ' %';
  }
  /** Gruppen = Timeslots (Kapitel bzw. Task, über Teile und Pausen hinweg) */
  function timeslots(liste) {
    var g = {}, reihen = [];
    liste.forEach(function (e) {
      if (e.art !== 'kapitel') return;
      var id = e.gruppe >= 0 ? 'g' + e.gruppe : 'n' + e.nr;
      if (!g[id]) { g[id] = { id: id, name: e.titel.replace(/\s*\(Teil \d+\)$/, ''), teile: [] }; reihen.push(g[id]); }
      g[id].teile.push(e);
    });
    return reihen;
  }
  /** Zeitpunkt bei Anteil p (0..1) der Arbeitszeit eines Timeslots (Pausen zwischen Teilen zählen nicht) */
  function zeitBeiAnteil(teile, p) {
    var ges = 0; teile.forEach(function (e) { ges += e.bis - e.von; });
    var ziel = ges * p, summe = 0;
    for (var i = 0; i < teile.length; i++) {
      var d = teile[i].bis - teile[i].von;
      if (summe + d >= ziel - 1) return Math.round(teile[i].von + (ziel - summe));
      summe += d;
    }
    return teile[teile.length - 1].bis;
  }
  function ereignisAus(r, t, text) {
    return { t: t, art: r.ton === 'sonar' ? 'sonar' : 'gong', ton: r.ton, lautst: Math.max(5, Math.min(100, +r.lautst || 100)) / 100,
      anschlaege: Math.max(1, Math.min(3, +r.anschlaege || 1)), vib: r.vib || 'AUS', vorrang: +r.vorrang || 1, regel: r.id, text: text };
  }
  /** Gleichzeitige Signale (Abstand < 2 min): nur das mit dem höchsten Vorrang bleibt */
  function vorrangFiltern(ev) {
    ev.sort(function (a, b) { return a.t - b.t; });
    var raus = {};
    for (var i = 0; i < ev.length; i++) {
      for (var j = i + 1; j < ev.length && ev[j].t - ev[i].t < 120000; j++) {
        if (ev[j].vorrang > ev[i].vorrang) raus[i] = true; else raus[j] = true;
      }
    }
    return ev.filter(function (e, i) { return !raus[i]; });
  }
  /** Altes Optionen-Objekt (v1) in Regeln umsetzen */
  function regelnAusOptionen(opt) {
    var r = JSON.parse(JSON.stringify(REGELN_VORGABE.slice(0, 3)));
    r[0].wert = +opt.intervall || 0; r[0].aktiv = r[0].wert > 0;
    if (opt.anteilSonar) r[0].lautst = Math.round(opt.anteilSonar * 100);
    if (opt.anteilGong) { r[1].lautst = r[2].lautst = Math.round(opt.anteilGong * 100); }
    return r;
  }
  /**
   * Ereignisliste für ein Audit: Prozent-, Minuten- und Intervall-Regeln, bezogen auf den
   * laufenden Timeslot; Intervalle während der Audittage, außer in Pausen.
   * regeln: Regelliste (nur gilt AUDIT, aktiv, nicht gelöscht) oder altes Optionen-Objekt.
   */
  function ereignisse(liste, regeln, ab) {
    if (!Array.isArray(regeln)) regeln = regelnAusOptionen(regeln || {});
    var aktiv = regeln.filter(function (r) { return r.aktiv && !r.geloescht && (r.gilt || 'AUDIT') === 'AUDIT' && +r.wert >= 0; });
    var ev = [];
    timeslots(liste).forEach(function (gr) {
      var von = gr.teile[0].von, bis = gr.teile[gr.teile.length - 1].bis;
      aktiv.forEach(function (r) {
        var w = +r.wert, t = null;
        if (r.ausl === 'PROZENT' && w > 0 && w <= 100) t = zeitBeiAnteil(gr.teile, w / 100);
        else if (r.ausl === 'VOR_ENDE' && w > 0) t = bis - w * 60000;
        else if (r.ausl === 'NACH_BEGINN' && w > 0) t = von + w * 60000;
        if (t !== null && t >= von && t <= bis) ev.push(ereignisAus(r, t, regelText(r) + ' · ' + gr.name));
      });
    });
    var tage = {};
    liste.forEach(function (e) {
      var x = tage[e.tag] || (tage[e.tag] = { von: e.von, bis: e.bis });
      x.von = Math.min(x.von, e.von); x.bis = Math.max(x.bis, e.bis);
    });
    aktiv.filter(function (r) { return r.ausl === 'INTERVALL' && +r.wert > 0; }).forEach(function (r) {
      var schritt = +r.wert * 60000;
      Object.keys(tage).forEach(function (k) {
        var x = tage[k], d0 = new Date(x.von); d0.setHours(0, 0, 0, 0);
        for (var t2 = d0.getTime() + Math.ceil((x.von - d0.getTime() + 1) / schritt) * schritt; t2 < x.bis; t2 += schritt) {
          var inPause = liste.some(function (e) { return e.art === 'pause' && t2 >= e.von && t2 < e.bis; });
          if (!inPause) { var dd = new Date(t2); ev.push(ereignisAus(r, t2, 'Intervall ' + pad(dd.getHours()) + ':' + pad(dd.getMinutes()))); }
        }
      });
    });
    return vorrangFiltern(ev).filter(function (e) { return e.t > (ab || 0); });
  }
  /** Ereignisse Arbeitstag: Intervall- und Nach-Beginn-Regeln ab Slotbeginn bis Tagesende */
  function ereignisseArbeitstag(regeln, slotBeginn, ab) {
    var aktiv = (regeln || []).filter(function (r) { return r.aktiv && !r.geloescht && r.gilt === 'ARBEITSTAG'; });
    var d0 = new Date(slotBeginn); d0.setHours(0, 0, 0, 0);
    var tagEnde = d0.getTime() + 86400000 - 60000, ev = [];
    aktiv.forEach(function (r) {
      var w = +r.wert; if (!(w > 0)) return;
      if (r.ausl === 'INTERVALL') {
        var schritt = w * 60000;
        for (var t = d0.getTime() + Math.ceil((slotBeginn - d0.getTime() + 1) / schritt) * schritt; t < tagEnde; t += schritt) {
          var dd = new Date(t); ev.push(ereignisAus(r, t, 'Erinnerung ' + pad(dd.getHours()) + ':' + pad(dd.getMinutes())));
        }
      } else if (r.ausl === 'NACH_BEGINN') ev.push(ereignisAus(r, slotBeginn + w * 60000, w + ' min im Slot'));
    });
    return vorrangFiltern(ev).filter(function (e) { return e.t > (ab || 0); });
  }
  /** Marken auf Uhr und Timer: Anteile 0..1 der Timeslot-Dauer für Prozent- und Minutenregeln */
  function marken(regeln, dauerMs) {
    var m = [];
    (regeln || []).forEach(function (r) {
      if (!r.aktiv || r.geloescht || (r.gilt || 'AUDIT') !== 'AUDIT') return;
      var w = +r.wert, p = null;
      if (r.ausl === 'PROZENT' && w > 0 && w < 100) p = w / 100;
      else if (r.ausl === 'VOR_ENDE' && dauerMs > 0) p = 1 - w * 60000 / dauerMs;
      else if (r.ausl === 'NACH_BEGINN' && dauerMs > 0) p = w * 60000 / dauerMs;
      if (p !== null && p > 0 && p < 1) m.push(p);
    });
    return m.sort(function (a, b) { return a - b; });
  }

  // ---------------------------------------------------------------------------
  // Erwartete Dokumente je Unterpunkt (Stufe A3)
  // ---------------------------------------------------------------------------
  var UP_NAMEN = {
    '4.1.1': 'Rolle der Organisation', '4.1.2': 'Prozesse, risikobasierter Ansatz', '4.1.3': 'Kriterien, Ressourcen, Überwachung',
    '4.1.4': 'Änderungen an Prozessen', '4.1.5': 'Ausgelagerte Prozesse', '4.1.6': 'Software im QMS',
    '4.2.1': 'Allgemeines', '4.2.2': 'QM-Handbuch', '4.2.3': 'Medizinprodukteakte', '4.2.4': 'Lenkung von Dokumenten',
    '4.2.5': 'Lenkung von Aufzeichnungen',
    '5.1': 'Verpflichtung der Leitung', '5.2': 'Kundenorientierung', '5.3': 'Qualitätspolitik', '5.4.1': 'Qualitätsziele',
    '5.4.2': 'Planung des QMS', '5.5.1': 'Verantwortung und Befugnis', '5.5.2': 'Beauftragter der Leitung',
    '5.5.3': 'Interne Kommunikation', '5.6.1': 'Managementbewertung allgemein', '5.6.2': 'Eingaben', '5.6.3': 'Ergebnisse',
    '6.1': 'Bereitstellung von Ressourcen', '6.3': 'Infrastruktur', '6.4.1': 'Arbeitsumgebung', '6.4.2': 'Kontaminationslenkung',
    '7.2.1': 'Ermittlung der Anforderungen', '7.2.2': 'Bewertung der Anforderungen', '7.2.3': 'Kommunikation',
    '7.3.1': 'Allgemeines', '7.3.2': 'Entwicklungsplanung', '7.3.3': 'Entwicklungseingaben', '7.3.4': 'Entwicklungsergebnisse',
    '7.3.5': 'Entwicklungsbewertung', '7.3.6': 'Entwicklungsverifizierung', '7.3.7': 'Entwicklungsvalidierung',
    '7.3.8': 'Entwicklungsübertragung', '7.3.9': 'Entwicklungsänderungen', '7.3.10': 'Entwicklungsakte',
    '7.4.1': 'Beschaffungsprozess', '7.4.2': 'Beschaffungsangaben', '7.4.3': 'Verifizierung beschaffter Produkte',
    '7.5.1': 'Lenkung der Produktion', '7.5.2': 'Sauberkeit des Produkts', '7.5.3': 'Installation', '7.5.4': 'Instandhaltung',
    '7.5.5': 'Sterile Produkte', '7.5.6': 'Prozessvalidierung', '7.5.7': 'Validierung Sterilisation und Sterilbarriere',
    '7.5.8': 'Identifizierung', '7.5.9.1': 'Rückverfolgbarkeit', '7.5.9.2': 'Rückverfolgbarkeit implantierbarer Produkte',
    '7.5.10': 'Eigentum des Kunden', '7.5.11': 'Produkterhaltung',
    '8.2.1': 'Rückmeldungen', '8.2.2': 'Reklamationsbearbeitung', '8.2.3': 'Berichterstattung an Behörden',
    '8.2.5': 'Überwachung und Messung von Prozessen', '8.2.6': 'Überwachung und Messung des Produkts',
    '8.3.1': 'Allgemeines', '8.3.2': 'Maßnahmen vor Auslieferung', '8.3.3': 'Maßnahmen nach Auslieferung', '8.3.4': 'Nacharbeit',
    '8.5.1': 'Allgemeines', '8.5.2': 'Korrekturmaßnahmen', '8.5.3': 'Vorbeugungsmaßnahmen'
  };
  var VORGABEN = {
    '4.1.1': 'Rolle(n) der Organisation (Hersteller, Händler …)', '4.1.2': 'Prozesslandkarte, Wechselwirkungen\nRisikobasierter Ansatz',
    '4.1.3': 'Prozesskennzahlen, Ressourcen', '4.1.4': 'Bewertung von Prozessänderungen', '4.1.5': 'Ausgelagerte Prozesse und ihre Lenkung',
    '4.1.6': 'Validierung der QMS-Software',
    '4.2.1': 'Übersicht dokumentiertes QMS', '4.2.2': 'QM-Handbuch', '4.2.3': 'Medizinprodukteakte(n)',
    '4.2.4': 'Verfahren Lenkung von Dokumenten\nDokumentenliste, Revisionsstände', '4.2.5': 'Lenkung von Aufzeichnungen, Aufbewahrungsfristen',
    '5.1': 'Nachweise der Verpflichtung der Leitung', '5.2': 'Ermittlung der Kunden- und regulatorischen Anforderungen', '5.3': 'Qualitätspolitik',
    '5.4.1': 'Qualitätsziele mit Zielerreichung', '5.4.2': 'Planung des QMS bei Änderungen', '5.5.1': 'Organigramm, Verantwortung und Befugnis',
    '5.5.2': 'Ernennung Beauftragter der Leitung', '5.5.3': 'Nachweise interner Kommunikation', '5.6.1': 'Verfahren Managementbewertung',
    '5.6.2': 'Managementbewertung – Eingaben', '5.6.3': 'Managementbewertung – Ergebnisse, Maßnahmen',
    '6.1': 'Ressourcenplanung', '6.3': 'Instandhaltungsplan und -nachweise', '6.4.1': 'Anforderungen an die Arbeitsumgebung\nÜberwachung der Arbeitsumgebung',
    '6.4.2': 'Lenkung von Kontamination',
    '7.2.1': 'Kundenanforderungen inkl. regulatorischer\nKennzeichnung, Gebrauchsanweisung', '7.2.2': 'Bewertung der Anforderungen (Vertragsprüfung)',
    '7.2.3': 'Kommunikation mit Kunden und Behörden',
    '7.3.1': 'Verfahren Entwicklung', '7.3.2': 'Entwicklungsplan', '7.3.3': 'Entwicklungseingaben', '7.3.4': 'Entwicklungsergebnisse',
    '7.3.5': 'Entwicklungsbewertungen (Reviews)', '7.3.6': 'Verifizierung', '7.3.7': 'Validierung, klinische Bewertung',
    '7.3.8': 'Entwicklungsübertragung', '7.3.9': 'Lenkung von Entwicklungsänderungen', '7.3.10': 'Entwicklungsakte',
    '7.4.1': 'Beschaffungsverfahren\nLieferantenbewertung, Lieferantenliste\nQualitätssicherungsvereinbarungen', '7.4.2': 'Beschaffungsangaben',
    '7.4.3': 'Wareneingangsprüfung',
    '7.5.1': 'Herstellanweisungen\nChargenprotokolle', '7.5.2': 'Anforderungen an die Sauberkeit', '7.5.3': 'Installationsanforderungen und -nachweise',
    '7.5.4': 'Instandhaltungsnachweise beim Kunden', '7.5.5': 'Sterilisationsaufzeichnungen (falls zutreffend)',
    '7.5.6': 'Prozessvalidierungen (IQ/OQ/PQ)\nSoftware-Validierung', '7.5.7': 'Validierung Sterilisation/Sterilbarriere (falls zutreffend)',
    '7.5.8': 'Kennzeichnung, UDI', '7.5.9.1': 'Rückverfolgbarkeit', '7.5.9.2': 'Rückverfolgbarkeit implantierbarer Produkte (falls zutreffend)',
    '7.5.10': 'Eigentum des Kunden', '7.5.11': 'Produkterhaltung (Lagerung, Verpackung, Transport)',
    '8.2.1': 'Verfahren Rückmeldungen', '8.2.2': 'Reklamationsliste und -bearbeitung', '8.2.3': 'Vigilanz-/Meldeverfahren\nMeldungen an Behörden',
    '8.2.5': 'Prozesskennzahlen', '8.2.6': 'Prüfpläne und Prüfaufzeichnungen\nFreigabenachweise',
    '8.3.1': 'Verfahren fehlerhafte Produkte', '8.3.2': 'NC-Berichte, Sonderfreigaben', '8.3.3': 'Rückrufe, Feldmaßnahmen', '8.3.4': 'Nacharbeit',
    '8.5.1': 'Verbesserungsmaßnahmen', '8.5.2': 'CAPA-Verfahren\nCAPA-Liste\nUrsachenanalysen\nWirksamkeitsprüfung', '8.5.3': 'Vorbeugungsmaßnahmen'
  };
  // Kapitel ohne Unterpunkte behalten ihre Kapitelliste als eigene Vorgabe
  KAPITEL.forEach(function (k) { if (!UNTERPUNKTE[k.key] && VORGABEN[k.key] === undefined) VORGABEN[k.key] = DOKUMENTE[k.key] || ''; });
  /** Alle Unterpunkte in Normreihenfolge (für den Vorgaben-Editor) */
  var NORM = [];
  KAPITEL.forEach(function (k) { if (UNTERPUNKTE[k.key]) NORM = NORM.concat(UNTERPUNKTE[k.key].split(',')); else NORM.push(k.key); });
  function upName(u) { return UP_NAMEN[u] || ((kapitel(u) || {}).name || ''); }
  /** Unterpunkte eines Timeslots: Kapitel -> alle, Unterpunkt -> sich selbst, Task "5.6" -> 5.6.1 … */
  function unterpunkteVon(key) {
    if (UNTERPUNKTE[key]) return UNTERPUNKTE[key].split(',');
    if (ELTERN[key]) return [key];
    var pre = String(key) + '.', alle = NORM.filter(function (u) { return u.indexOf(pre) === 0; });
    return alle.length ? alle : [key];
  }
  /** Kapitel eines Timeslots (für Tasks und Unterpunkte) */
  function kapitelVon(key) {
    if (kapitel(key)) return key;
    var ups = unterpunkteVon(key);
    return ELTERN[ups[0]] || key;
  }

  // ---------------------------------------------------------------------------
  // Abweichung vom Plan (Stufe A4)
  // abw: [{id, aud, slot (Timeslot-ID 'g3'/'n7'), typ:'verlaengern'|'beenden', min, zeit, modus, geaendert}]
  // modus: verlaengern -> 'schieben'|'kuerzen'; beenden -> 'vorziehen'|'naechstem'
  // ---------------------------------------------------------------------------
  function slotId(e) { return e.gruppe >= 0 ? 'g' + e.gruppe : 'n' + e.nr; }
  function kopie(liste) { return liste.map(function (e) { var x = {}; for (var k in e) x[k] = e[k]; return x; }); }
  /** Ablauf eines Auditors mit allen Abweichungen; e.plVon/e.plBis = Planzeiten, e.ueber = über Tagesende */
  function ablaufIst(plan, aud, abw, tagEndeMin) {
    var l = kopie(ablauf(plan, aud));
    l.forEach(function (e) { e.plVon = e.von; e.plBis = e.bis; e.slot = slotId(e); });
    (abw || []).filter(function (x) { return (x.aud || 0) === aud && !x.geloescht; }).forEach(function (x) {
      var teile = l.filter(function (e) { return e.art === 'kapitel' && e.slot === x.slot; });
      if (!teile.length) return;
      var letzt = teile[teile.length - 1], altBis = letzt.bis, tag = letzt.tag;
      var d = x.typ === 'verlaengern' ? (+x.min || 0) * 60000 : altBis - (+x.zeit || altBis);
      if (x.typ === 'beenden') { if (d <= 0) return; letzt.bis = altBis - d; } else letzt.bis = altBis + d;
      var folgende = l.filter(function (e) { return e !== letzt && e.tag === tag && e.von >= altBis - 1; });
      var vz = x.typ === 'verlaengern' ? 1 : -1;
      if (x.modus === 'schieben' || x.modus === 'vorziehen') {
        folgende.forEach(function (e) { e.von += vz * d; e.bis += vz * d; });
      } else {
        for (var i = 0; i < folgende.length; i++) {
          var e = folgende[i];
          if (e.art === 'kapitel') { e.von += vz * d; break; }
          e.von += vz * d; e.bis += vz * d;            // Pause zwischen den Kapiteln rückt mit
        }
      }
    });
    if (tagEndeMin > 0) l.forEach(function (e) { e.ueber = e.bis > zeitpunkt(plan.start, e.tag, tagEndeMin); });
    l.sort(function (a, b) { return a.von - b.von || a.nr - b.nr; });
    return l;
  }
  /** Prüft "Nur nächstes kürzen": null = möglich, sonst Text der Rückfrage */
  function abwPruefen(liste, slot, min) {
    var teile = liste.filter(function (e) { return e.art === 'kapitel' && e.slot === slot; });
    if (!teile.length) return 'Timeslot nicht gefunden.';
    var letzt = teile[teile.length - 1];
    var n = liste.filter(function (e) { return e.art === 'kapitel' && e.tag === letzt.tag && e.von >= letzt.bis - 1 && e.slot !== slot; })[0];
    if (!n) return 'Kein nächstes Kapitel an diesem Tag.';
    if (n.bis - n.von <= min * 60000) return n.titel + ' ist nur ' + Math.round((n.bis - n.von) / 60000) + ' min lang.';
    return null;
  }

  var Logik = {
    VERSION: VERSION, KAPITEL: KAPITEL, UNTERPUNKTE: UNTERPUNKTE, ELTERN: ELTERN, DOKUMENTE: DOKUMENTE,
    AUDITTYPEN: AUDITTYPEN, pad: pad, uhr: uhr, zahl: zahl, stunden: stunden, uhrzeitMin: uhrzeitMin,
    kapitel: kapitel, titelVon: titelVon, tagDatum: tagDatum, datumText: datumText, isoNachDe: isoNachDe,
    deNachIso: deNachIso, keyAusTitel: keyAusTitel, dokKey: dokKey, vorschlag: vorschlag, zeitplan: zeitplan,
    textAusBytes: textAusBytes, importTxt: importTxt, exportTxt: exportTxt, ablauf: ablauf, ereignisse: ereignisse,
    isoTag: isoTag, zeitpunkt: zeitpunkt,
    TOENE: TOENE, AUSLOESER: AUSLOESER, REGELN_VORGABE: REGELN_VORGABE, regelText: regelText, timeslots: timeslots,
    ereignisseArbeitstag: ereignisseArbeitstag, marken: marken,
    UP_NAMEN: UP_NAMEN, VORGABEN: VORGABEN, NORM: NORM, upName: upName, unterpunkteVon: unterpunkteVon, kapitelVon: kapitelVon,
    slotId: slotId, ablaufIst: ablaufIst, abwPruefen: abwPruefen
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Logik;
  else global.Logik = Logik;
})(this);
