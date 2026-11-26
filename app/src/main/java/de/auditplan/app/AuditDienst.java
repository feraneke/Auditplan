/*
 * Auditplan – Audit-Dienst (Vordergrunddienst mit Benachrichtigung).
 * Version: 2.0.0 (2026-11-26)
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“.
 *
 * Die Web-Oberfläche berechnet die Ereignisliste aus den Signalregeln und übergibt
 * sie als JSON. Der Dienst legt sie im App-Speicher ab und stellt immer nur das
 * nächste Ereignis als Android-Wecker (setAlarmClock). Der Wecker kommt auch bei
 * gesperrtem Bildschirm und im Energiesparmodus pünktlich.
 * Der gespeicherte Plan enthält keine Kunden- oder Kapitelnamen (Stufe A5).
 *
 * Plan-JSON: {"id","aud","art":"audit|tag","titel","ende",
 *             "ereignisse":[{"t","ton","lautst":0..1,"anschlaege","vib","vorrang","text"}]}
 *
 * Versionshistorie:
 *   1.0.0 (2026-11-25) Erste Fassung (Sonar, Gong 75 %, Gong 100 %).
 *   2.0.0 (2026-11-26) Stufen A2/A5/A7: Ereignisse aus Signalregeln mit Ton, Lautstärke,
 *                      Anschlägen, Vibration und Vorrang; neutrale Benachrichtigung;
 *                      Arbeitstag als eigener Plan (art "tag"); Versionsangabe (BP-023).
 */
package de.auditplan.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AuditDienst extends Service {

    static final String AKTION_START = "de.auditplan.app.START";
    static final String AKTION_STOP = "de.auditplan.app.STOP";
    static final String AKTION_WECKER = "de.auditplan.app.WECKER";
    static final String EXTRA_PLAN = "plan";

    private static final String PREFS = "audit";
    private static final String KEY_PLAN = "plan";
    private static final String KEY_ZULETZT = "zuletzt";
    private static final String KANAL = "audit";
    private static final int NOTIF_ID = 4001;
    private static final long VERPASST_MS = 120_000L;   // älter als 2 min: nicht mehr spielen

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    static final String VERSION = "2.0.0";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String aktion = intent != null ? intent.getAction() : null;
        Log.d(Ton.TAG, "AuditDienst.onStartCommand | " + aktion);
        // Zuerst immer in den Vordergrund (Pflicht nach startForegroundService)
        vordergrund("Audit wird vorbereitet …");
        try {
            if (AKTION_STOP.equals(aktion)) {
                beenden();
                return START_NOT_STICKY;
            }
            if (AKTION_START.equals(aktion) && intent.hasExtra(EXTRA_PLAN)) {
                String plan = intent.getStringExtra(EXTRA_PLAN);
                prefs(this).edit()
                        .putString(KEY_PLAN, plan)
                        .putLong(KEY_ZULETZT, System.currentTimeMillis() - 1000L)
                        .apply();
            } else if (AKTION_WECKER.equals(aktion)) {
                faelligeAbarbeiten(this);
            }
            if (!naechstesPlanen()) {
                beenden();
            }
        } catch (Exception e) {
            Log.e(Ton.TAG, "AuditDienst.onStartCommand | Fehler " + e);
        }
        return START_STICKY;
    }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Laufender Plan als JSON oder null. */
    static String laufenderPlan(Context ctx) {
        return prefs(ctx).getString(KEY_PLAN, null);
    }

    /** Fällige Ereignisse spielen (das stärkste, falls mehrere zugleich). */
    static void faelligeAbarbeiten(Context ctx) {
        try {
            String s = laufenderPlan(ctx);
            if (s == null) return;
            JSONObject plan = new JSONObject(s);
            JSONArray ev = plan.optJSONArray("ereignisse");
            if (ev == null) return;
            long jetzt = System.currentTimeMillis();
            long zuletzt = prefs(ctx).getLong(KEY_ZULETZT, 0L);
            JSONObject beste = null;
            long neuZuletzt = zuletzt;
            for (int i = 0; i < ev.length(); i++) {
                JSONObject e = ev.getJSONObject(i);
                long t = e.getLong("t");
                if (t <= zuletzt || t > jetzt + 2000L) continue;
                neuZuletzt = Math.max(neuZuletzt, t);
                if (t < jetzt - VERPASST_MS) continue;
                if (beste == null || vorrang(e) > vorrang(beste)) beste = e;
            }
            prefs(ctx).edit().putLong(KEY_ZULETZT, neuZuletzt).apply();
            if (beste != null) {
                Ton.spielen(ctx, beste.optString("ton", tonAusArt(beste.optString("art", "sonar"))),
                        (float) beste.optDouble("lautst", 1.0), beste.optInt("anschlaege", 1),
                        beste.optString("vib", "KURZ"));
            }
            Log.d(Ton.TAG, "AuditDienst.faelligeAbarbeiten | gespielt " + (beste == null ? "-" : beste.optString("ton")));
        } catch (Exception e) {
            Log.e(Ton.TAG, "AuditDienst.faelligeAbarbeiten | Fehler " + e);
        }
    }

    /** Ersatz, falls der Dienst nicht starten durfte. */
    static void faelligeDirektSpielen(Context ctx) {
        faelligeAbarbeiten(ctx);
        try {
            planeWecker(ctx);
        } catch (Exception e) {
            Log.e(Ton.TAG, "AuditDienst.faelligeDirektSpielen | Fehler " + e);
        }
    }

    /** Vorrang eines Ereignisses; alte Pläne (v1) ohne Vorrang: Gong 100 % > Gong 75 % > Sonar. */
    private static int vorrang(JSONObject e) {
        if (e.has("vorrang")) return e.optInt("vorrang", 1);
        String art = e.optString("art", "sonar");
        if ("gong100".equals(art)) return 3;
        if ("gong75".equals(art)) return 2;
        return 1;
    }

    private static String tonAusArt(String art) {
        return art != null && art.startsWith("gong") ? "gong" : "sonar";
    }

    /** Nächstes Ereignis als Wecker stellen; false = nichts mehr zu tun. */
    private boolean naechstesPlanen() throws Exception {
        JSONObject naechstes = planeWecker(this);
        String s = laufenderPlan(this);
        if (s == null) return false;
        JSONObject plan = new JSONObject(s);
        long ende = plan.optLong("ende", 0L);
        if (naechstes == null) {
            if (System.currentTimeMillis() > ende - 5000L) return false;
            vordergrund(plan.optString("titel", "Audit") + " – keine weiteren Töne");
            return true;
        }
        String uhr = new SimpleDateFormat("HH:mm", Locale.GERMANY).format(new Date(naechstes.getLong("t")));
        vordergrund(plan.optString("titel", "Audit läuft") + " – nächster Ton " + uhr);
        return true;
    }

    private static JSONObject planeWecker(Context ctx) throws Exception {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = weckerIntent(ctx);
        if (am != null) am.cancel(pi);
        String s = laufenderPlan(ctx);
        if (s == null || am == null) return null;
        JSONObject plan = new JSONObject(s);
        JSONArray ev = plan.optJSONArray("ereignisse");
        if (ev == null) return null;
        long zuletzt = prefs(ctx).getLong(KEY_ZULETZT, 0L);
        long jetzt = System.currentTimeMillis();
        JSONObject naechstes = null;
        for (int i = 0; i < ev.length(); i++) {
            JSONObject e = ev.getJSONObject(i);
            long t = e.getLong("t");
            if (t > zuletzt && t > jetzt - 1000L && (naechstes == null || t < naechstes.getLong("t"))) {
                naechstes = e;
            }
        }
        if (naechstes == null) return null;
        long t = naechstes.getLong("t");
        boolean genau = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
        if (genau) {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(t, oeffnenIntent(ctx)), pi);
        } else {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, pi);
        }
        Log.d(Ton.TAG, "AuditDienst.planeWecker | " + t + " | genau " + genau);
        return naechstes;
    }

    private static PendingIntent weckerIntent(Context ctx) {
        Intent i = new Intent(ctx, WeckerEmpfaenger.class);
        return PendingIntent.getBroadcast(ctx, 1, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent oeffnenIntent(Context ctx) {
        Intent i = new Intent(ctx, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, 2, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void vordergrund(String text) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null && nm.getNotificationChannel(KANAL) == null) {
            NotificationChannel k = new NotificationChannel(KANAL, "Laufendes Audit", NotificationManager.IMPORTANCE_LOW);
            k.setDescription("Zeigt das laufende Audit und den nächsten Ton");
            k.setSound(null, null);
            nm.createNotificationChannel(k);
        }
        Intent stop = new Intent(this, AuditDienst.class).setAction(AKTION_STOP);
        PendingIntent piStop = PendingIntent.getService(this, 3, stop,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(this, KANAL)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Auditplan")
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(oeffnenIntent(this))
                .addAction(new Notification.Action.Builder(null, "Signale beenden", piStop).build())
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIF_ID, n);
        }
    }

    private void beenden() {
        Log.d(Ton.TAG, "AuditDienst.beenden");
        try {
            AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.cancel(weckerIntent(this));
        } catch (Exception e) {
            Log.e(Ton.TAG, "AuditDienst.beenden | Fehler " + e);
        }
        prefs(this).edit().remove(KEY_PLAN).remove(KEY_ZULETZT).apply();
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }
}
