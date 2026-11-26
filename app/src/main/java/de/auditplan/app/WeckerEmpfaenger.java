/*
 * Auditplan – Empfänger für den Android-Wecker (AlarmManager.setAlarmClock).
 * Version: 1.0.1 (2026-11-26)
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“.
 *
 * Weckt den Audit-Dienst, der dann den fälligen Ton spielt und den nächsten plant.
 *
 * Versionshistorie:
 *   1.0.0 (2026-11-25) Erste Fassung.
 *   1.0.1 (2026-11-26) Nur Versionsangabe ergänzt (BP-023), Code unverändert.
 */
package de.auditplan.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class WeckerEmpfaenger extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(Ton.TAG, "WeckerEmpfaenger.onReceive");
        try {
            Intent i = new Intent(context, AuditDienst.class);
            i.setAction(AuditDienst.AKTION_WECKER);
            context.startForegroundService(i);
        } catch (Exception e) {
            // Dienst nicht startbar: Ton wenigstens direkt spielen
            Log.e(Ton.TAG, "WeckerEmpfaenger | Dienststart fehlgeschlagen " + e);
            AuditDienst.faelligeDirektSpielen(context);
        }
    }
}
