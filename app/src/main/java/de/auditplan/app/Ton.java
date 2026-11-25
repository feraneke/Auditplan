/*
 * Auditplan – Abspielen von Sonar und Gong.
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“, 25.11.2026.
 *
 * Die Töne laufen über den Wecker-Kanal (USAGE_ALARM): Sie sind auch zu hören,
 * wenn das Handy auf lautlos steht. Die Lautstärke regelt die Wecker-Lautstärke
 * von Android, dazu der Anteil je Ton aus den Einstellungen der App.
 */
package de.auditplan.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

final class Ton {

    static final String TAG = "Auditplan";

    private Ton() {
    }

    /** art: "sonar", "gong75" oder "gong100"; anteil 0..1; vibration ja/nein. */
    static void spielen(Context ctx, String art, float anteil, boolean vibration) {
        Context app = ctx.getApplicationContext();
        boolean gong = art != null && art.startsWith("gong");
        int res = gong ? R.raw.gong : R.raw.sonar;
        PowerManager.WakeLock wl = null;
        try {
            PowerManager pm = (PowerManager) app.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Auditplan:Ton");
                wl.acquire(10_000L);
            }
            MediaPlayer mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            mp.setDataSource(app, Uri.parse("android.resource://" + app.getPackageName() + "/" + res));
            mp.prepare();
            float v = Math.max(0f, Math.min(1f, anteil));
            mp.setVolume(v, v);
            final PowerManager.WakeLock halten = wl;
            mp.setOnCompletionListener(p -> {
                p.release();
                if (halten != null && halten.isHeld()) halten.release();
            });
            mp.start();
            Log.d(TAG, "Ton.spielen | " + art + " | Anteil " + v);
            // 100 %: Gong zweimal anschlagen lassen
            if ("gong100".equals(art)) {
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(
                        () -> spielenEinfach(app, R.raw.gong, v), 1600);
            }
        } catch (Exception e) {
            Log.e(TAG, "Ton.spielen | Fehler " + e);
            if (wl != null && wl.isHeld()) wl.release();
        }
        if (vibration) {
            try {
                Vibrator vib = (Vibrator) app.getSystemService(Context.VIBRATOR_SERVICE);
                if (vib != null) {
                    long[] muster = gong ? new long[]{0, 600, 250, 600} : new long[]{0, 150};
                    vib.vibrate(VibrationEffect.createWaveform(muster, -1));
                }
            } catch (Exception e) {
                Log.e(TAG, "Ton.spielen | Vibration " + e);
            }
        }
    }

    private static void spielenEinfach(Context app, int res, float v) {
        try {
            MediaPlayer mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            mp.setDataSource(app, Uri.parse("android.resource://" + app.getPackageName() + "/" + res));
            mp.prepare();
            mp.setVolume(v, v);
            mp.setOnCompletionListener(MediaPlayer::release);
            mp.start();
        } catch (Exception e) {
            Log.e(TAG, "Ton.spielenEinfach | Fehler " + e);
        }
    }
}
