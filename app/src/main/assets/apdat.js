/*
 * Auditplan – Verschlüsselung und Austauschformat .apdat (Stufen A5/A6)
 * Version: 1.0.0 (2026-11-26)
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“.
 * Ordnungsinstanz: Doc „Auditplan – Austauschformat .apdat (Stufe F0)“.
 *
 * Inhalt:
 *  - Schlüssel: PBKDF2-SHA256 (600.000 Runden) aus PIN und Salz -> 64 Byte (32 AES, 32 HMAC)
 *  - Datei: APDAT / KDF / ENC / MAC / DATA, AES-256-CBC (PKCS#7) + HMAC-SHA256 über Zeile 1-3 (je + CRLF) + Chiffretext
 *  - Klartext: Zeilenformat mit Trenner |~|, Escaping wie TsEncode (|~| -> |-|, Zeilenumbruch -> ¶)
 *  - Abgleich je Datensatz über Änderungsstempel und letzten Abgleich je Gegenstelle
 * Läuft im Handy (WebCrypto) und in Node (für Tests).
 *
 * Versionshistorie:
 *   1.0.0 (2026-11-26) Erste Fassung.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var RUNDEN = 600000;
  var T = '|~|';
  var KOPF = '# Auditplan Austausch | Format v1 | Trenner |~|';
  var FEHLER = 'Passwort falsch oder Datei beschädigt';
  var subtle = (global.crypto && global.crypto.subtle) || (typeof require === 'function' ? require('crypto').webcrypto.subtle : null);
  var zufall = function (n) {
    var b = new Uint8Array(n);
    (global.crypto || require('crypto').webcrypto).getRandomValues(b);
    return b;
  };

  // ------------------------------------------------------------------ Bytes
  function utf8(s) { return new TextEncoder().encode(s); }
  function vonUtf8(b) { return new TextDecoder('utf-8').decode(b); }
  function b64(bytes) {
    var s = '', b = new Uint8Array(bytes);
    for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function vonB64(s) {
    var x = atob(String(s).trim()), b = new Uint8Array(x.length);
    for (var i = 0; i < x.length; i++) b[i] = x.charCodeAt(i);
    return b;
  }
  function verbinde(a, b) { var c = new Uint8Array(a.length + b.length); c.set(a, 0); c.set(b, a.length); return c; }
  function gleich(a, b) {
    if (a.length !== b.length) return false;
    var d = 0; for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i];
    return d === 0;
  }

  // ------------------------------------------------------------------ Schlüssel
  /** -> Promise {aes: CryptoKey, mac: CryptoKey, salz: Uint8Array} */
  function schluessel(pin, salz) {
    salz = salz || zufall(16);
    return subtle.importKey('raw', utf8(String(pin)), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salz, iterations: RUNDEN }, k, 512);
    }).then(function (bits) {
      var b = new Uint8Array(bits);
      return Promise.all([
        subtle.importKey('raw', b.slice(0, 32), { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']),
        subtle.importKey('raw', b.slice(32, 64), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      ]).then(function (k2) { return { aes: k2[0], mac: k2[1], salz: salz }; });
    });
  }

  // ------------------------------------------------------------------ Datei
  /** Klartext -> Dateitext (5 Zeilen, CRLF). schl aus schluessel(). */
  function verschluesseln(klartext, schl) {
    var iv = zufall(16);
    return subtle.encrypt({ name: 'AES-CBC', iv: iv }, schl.aes, utf8(klartext)).then(function (ct) {
      ct = new Uint8Array(ct);
      var z1 = 'APDAT' + T + '1', z2 = 'KDF' + T + 'PBKDF2-SHA256' + T + RUNDEN + T + b64(schl.salz),
        z3 = 'ENC' + T + 'AES-256-CBC' + T + b64(iv);
      var macDaten = verbinde(utf8(z1 + '\r\n' + z2 + '\r\n' + z3 + '\r\n'), ct);
      return subtle.sign('HMAC', schl.mac, macDaten).then(function (mac) {
        return [z1, z2, z3, 'MAC' + T + 'HMAC-SHA256' + T + b64(new Uint8Array(mac)), 'DATA' + T + b64(ct)].join('\r\n') + '\r\n';
      });
    });
  }
  /** Kopf lesen: -> {salz, runden, iv, mac, ct, zeilen} oder Fehler */
  function kopfLesen(text) {
    var z = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(function (x) { return x !== ''; });
    if (z.length < 5 || z[0] !== 'APDAT' + T + '1') throw new Error('Keine Auditplan-Austauschdatei (.apdat).');
    var kdf = z[1].split(T), enc = z[2].split(T), mac = z[3].split(T), dat = z[4].split(T);
    if (kdf[0] !== 'KDF' || kdf[1] !== 'PBKDF2-SHA256' || enc[0] !== 'ENC' || enc[1] !== 'AES-256-CBC' ||
        mac[0] !== 'MAC' || mac[1] !== 'HMAC-SHA256' || dat[0] !== 'DATA') throw new Error('Unbekanntes Verfahren in der Austauschdatei.');
    return { salz: vonB64(kdf[3]), runden: +kdf[2], iv: vonB64(enc[2]), mac: vonB64(mac[2]), ct: vonB64(dat[1]), zeilen: z };
  }
  /** Dateitext -> Klartext; prüft zuerst den Prüfwert. schl optional (sonst aus pin). */
  function entschluesseln(text, pin, schl) {
    var k;
    try { k = kopfLesen(text); } catch (e) { return Promise.reject(e); }
    if (k.runden !== RUNDEN) return Promise.reject(new Error('Unbekannte Rundenzahl ' + k.runden + '.'));
    var p = schl && gleich(schl.salz, k.salz) ? Promise.resolve(schl) : schluessel(pin, k.salz);
    return p.then(function (s) {
      var macDaten = verbinde(utf8(k.zeilen[0] + '\r\n' + k.zeilen[1] + '\r\n' + k.zeilen[2] + '\r\n'), k.ct);
      return subtle.sign('HMAC', s.mac, macDaten).then(function (m) {
        if (!gleich(new Uint8Array(m), k.mac)) throw new Error(FEHLER);
        return subtle.decrypt({ name: 'AES-CBC', iv: k.iv }, s.aes, k.ct);
      }).then(function (pt) { return { text: vonUtf8(new Uint8Array(pt)), schl: s }; });
    }).catch(function (e) { throw new Error(e && e.message === FEHLER ? FEHLER : (e && /Rundenzahl|Verfahren|Austauschdatei/.test(e.message) ? e.message : FEHLER)); });
  }

  // ------------------------------------------------------------------ Zeilenformat
  function enc(s) { return String(s == null ? '' : s).split(T).join('|-|').replace(/\r\n|\r|\n/g, '¶'); }
  function dec(s) { return String(s == null ? '' : s).replace(/¶/g, '\r\n'); }
  function zeile(felder) { return felder.map(enc).join(T); }
  function felderVon(z) { return z.split(T).map(dec); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function stempel(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function minuten(ms) { if (!ms) return ''; var d = new Date(ms); return stempel(d).slice(0, 16); }
  function msVon(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(s || '').trim());
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime() : 0;
  }
  function kennung(praefix) {
    var z = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = zufall(4), s = '';
    for (var i = 0; i < 4; i++) s += z[r[i] % z.length];
    return praefix + '-' + stempel().replace(/\D/g, '') + '-' + s;
  }

  // Schlüssel je Zeilentyp (natürlicher oder ID-Schlüssel) und Index des Feldes „geändert“
  var TYPEN = {
    AUDIT: { key: [0], geaendert: 5 }, PLAN: { key: [0], geaendert: 2 }, IST: { key: [0, 1], geaendert: 6 },
    DOK: { key: [0], geaendert: 6 }, VORGABE: { key: [0, 1], geaendert: 3 }, SIGNAL: { key: [0], geaendert: 10 },
    EINST: { key: [0], geaendert: 2 }, ORDER: { key: [0], geaendert: -1 }, POS: { key: [0, 1], geaendert: -1 },
    SLOT: { key: [0, 1, 2], geaendert: 6 }
  };
  function schl(typ, f) { return typ + '|' + TYPEN[typ].key.map(function (i) { return f[i]; }).join('|'); }

  /** Klartext -> {meta:{quelle,geraet,erstellt,abgleich}, saetze:[{typ, f:[...] }]} */
  function lesen(klartext) {
    var z = String(klartext || '').split(/\r?\n/), meta = null, saetze = [];
    if (z[0] !== KOPF) throw new Error('Unbekannter Inhalt (Kopfzeile fehlt).');
    for (var i = 1; i < z.length; i++) {
      if (!z[i]) continue;
      var f = felderVon(z[i]), typ = f.shift();
      if (typ === 'META') meta = { quelle: f[0], geraet: f[1], erstellt: f[2], abgleich: f[3] };
      else if (TYPEN[typ]) saetze.push({ typ: typ, f: f });
    }
    if (!meta) throw new Error('Zeile META fehlt.');
    return { meta: meta, saetze: saetze };
  }
  /** {meta, saetze} -> Klartext */
  function schreiben(meta, saetze) {
    var out = [KOPF, zeile(['META', meta.quelle, meta.geraet, meta.erstellt, meta.abgleich || ''])];
    saetze.forEach(function (s) { out.push(zeile([s.typ].concat(s.f))); });
    return out.join('\r\n') + '\r\n';
  }

  /**
   * Abgleich: lokale und fremde Sätze -> {ergebnis: [Satz], konflikte: [{lokal, fremd}], archiv: [Satz], zahlen}
   * letzter: Stempel des letzten erfolgreichen Abgleichs mit der Gegenstelle ('' = noch nie).
   * entscheide(lokal, fremd) -> true = fremden Stand übernehmen (Rückfrage); fehlt sie, bleibt der lokale Stand.
   */
  function abgleichen(lokal, fremd, letzter, entscheide) {
    letzter = letzter || '';
    var L = {}, F = {}, reihen = [], zahlen = { neu: 0, geaendert: 0, geloescht: 0, konflikt: 0, gleich: 0 }, archiv = [];
    lokal.forEach(function (s) { var k = schl(s.typ, s.f); if (!L[k]) reihen.push(k); L[k] = s; });
    fremd.forEach(function (s) { var k = schl(s.typ, s.f); if (!L[k] && !F[k]) reihen.push(k); F[k] = s; });
    var ergebnis = [];
    reihen.forEach(function (k) {
      var l = L[k], f = F[k];
      if (!f) { ergebnis.push(l); return; }
      var gi = TYPEN[f.typ].geaendert;
      if (gi < 0) { ergebnis.push(f); return; }                         // ORDER/POS: Stand des PC gilt
      if (!l) { ergebnis.push(f); zahlen.neu++; return; }
      var gl = l.f[gi] || '', gf = f.f[gi] || '';
      var lGe = gl > letzter, fGe = gf > letzter;
      var ohne = function (s) { return s.f.filter(function (x, i) { return i !== gi; }).join(T); };
      if (ohne(l) === ohne(f)) { ergebnis.push(gl >= gf ? l : f); zahlen.gleich++; return; }
      if (!fGe) { ergebnis.push(l); return; }
      if (!lGe) { ergebnis.push(f); zahlen[istGeloescht(f) ? 'geloescht' : 'geaendert']++; return; }
      zahlen.konflikt++;
      if (entscheide && entscheide(l, f)) { ergebnis.push(f); archiv.push(l); } else { ergebnis.push(l); archiv.push(f); }
    });
    return { ergebnis: ergebnis, archiv: archiv, zahlen: zahlen };
  }
  function istGeloescht(s) {
    var i = { AUDIT: 6, IST: 7, DOK: 7, VORGABE: 4, SIGNAL: 11, SLOT: 7 }[s.typ];
    return i !== undefined && s.f[i] === '1';
  }

  var Apdat = {
    VERSION: VERSION, RUNDEN: RUNDEN, KOPF: KOPF, FEHLER: FEHLER, TYPEN: TYPEN,
    schluessel: schluessel, verschluesseln: verschluesseln, entschluesseln: entschluesseln, kopfLesen: kopfLesen,
    enc: enc, dec: dec, lesen: lesen, schreiben: schreiben, abgleichen: abgleichen, istGeloescht: istGeloescht,
    stempel: stempel, minuten: minuten, msVon: msVon, kennung: kennung, b64: b64, vonB64: vonB64, zufall: zufall
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Apdat;
  else global.Apdat = Apdat;
})(typeof window !== 'undefined' ? window : globalThis);
