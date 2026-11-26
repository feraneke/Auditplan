/*
 * Auditplan – Abspielen der Signaltöne.
 * Version: 2.0.0 (2026-11-26)
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“.
 *
 * Die Töne laufen über den Wecker-Kanal (USAGE_ALARM): Sie sind auch zu hören,
 * wenn das Handy auf lautlos steht. Die Gesamtlautstärke regelt die Wecker-Lautstärke
 * von Android, die Lautstärke der Signalregel ist ein Anteil davon.
 *
 * Töne: sonar, gong, glocke, klangschale, holzblock, piep (res/raw) oder
 * "datei:<name>" = eigene Audiodatei, beim Auswählen nach files/toene/ kopiert.
 *
 * Versionshistorie:
 *   1.0.0 (2026-11-25) Sonar und Gong; Gong 100 % zweimal.
 *   2.0.0 (2026-11-26) Stufe A2: sechs Töne und eigene Dateien, Anschläge 1-3,
 *                      Vibration AUS/KURZ/LANG je Signalregel; Versionsangabe (BP-023).
 */
package de.auditplan.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import java.io.File;

final class Ton {

    static final String TAG = "Auditplan";
    static final String VERSION = "2.0.0";
    static final String ORDNER = "toene";

    private Ton() {
    }

    /** Ressource zum Tonnamen; unbekannt = Gong. */
    private static int ressource(String ton) {
        if ("sonar".equals(ton)) return R.raw.sonar;
        if ("glocke".equals(ton)) return R.raw.glocke;
        if ("klangschale".equals(ton)) return R.raw.klangschale;
        if ("holzblock".equals(ton)) return R.raw.holzblock;
        if ("piep".equals(ton)) return R.raw.piep;
        return R.raw.gong;
    }

    /** Abstand zwischen zwei Anschlägen in Millisekunden. */
    private static long abstand(String ton) {
        if ("piep".equals(ton)) return 400L;
        if ("holzblock".equals(ton)) return 900L;
        if ("sonar".equals(ton)) return 1300L;
        return 1600L;
    }

    private static Uri quelle(Context app, String ton) {
        if (ton != null && ton.startsWith("datei:")) {
            File f = new File(new File(app.getFilesDir(), ORDNER), ton.substring(6));
            if (f.exists()) return Uri.fromFile(f);
            Log.w(TAG, "Ton.quelle | Datei fehlt " + f + ", spiele Gong");
            ton = "gong";
        }
        return Uri.parse("android.resource://" + app.getPackageName() + "/" + ressource(ton));
    }

    /**
     * ton: Tonname oder "datei:<name>"; lautst 0..1; anschlaege 1..3; vib "AUS"|"KURZ"|"LANG".
     */
    static void spielen(Context ctx, String ton, float lautst, int anschlaege, String vib) {
        Context app = ctx.getApplicationContext();
        Log.d(TAG, "Ton.spielen | START | " + ton + " | " + lautst + " | x" + anschlaege + " | " + vib);
        PowerManager.WakeLock wl = null;
        try {
            PowerManager pm = (PowerManager) app.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Auditplan:Ton");
                wl.acquire(15_000L);
            }
            final float v = Math.max(0.05f, Math.min(1f, lautst));
            final Uri uri = quelle(app, ton);
            int n = Math.max(1, Math.min(3, anschlaege));
            Handler h = new Handler(Looper.getMainLooper());
            for (int i = 0; i < n; i++) {
                if (i == 0) einmal(app, uri, v);
                else h.postDelayed(() -> einmal(app, uri, v), i * abstand(ton));
            }
        } catch (Exception e) {
            Log.e(TAG, "Ton.spielen | Fehler " + e);
        }
        vibrieren(app, vib);
        // Wakelock läuft nach 15 s von selbst ab; vorher freigeben ist nicht nötig
        if (wl != null) Log.d(TAG, "Ton.spielen | Wakelock 15 s");
    }

    private static void einmal(Context app, Uri uri, float v) {
        try {
            MediaPlayer mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            mp.setDataSource(app, uri);
            mp.prepare();
            mp.setVolume(v, v);
            mp.setOnCompletionListener(MediaPlayer::release);
            mp.setOnErrorListener((p, what, extra) -> {
                Log.e(TAG, "Ton.einmal | Abspielfehler " + what + "/" + extra);
                p.release();
                return true;
            });
            mp.start();
        } catch (Exception e) {
            Log.e(TAG, "Ton.einmal | Fehler " + e);
        }
    }

    private static void vibrieren(Context app, String vib) {
        if (vib == null || "AUS".equals(vib)) return;
        try {
            Vibrator v = (Vibrator) app.getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return;
            long[] muster = "LANG".equals(vib) ? new long[]{0, 600, 250, 600} : new long[]{0, 150};
            v.vibrate(VibrationEffect.createWaveform(muster, -1));
        } catch (Exception e) {
            Log.e(TAG, "Ton.vibrieren | Fehler " + e);
        }
    }
}
