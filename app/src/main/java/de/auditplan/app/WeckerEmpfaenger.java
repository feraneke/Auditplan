/*
 * Auditplan – Empfänger für den Android-Wecker (AlarmManager.setAlarmClock).
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“, 25.11.2026.
 *
 * Weckt den Audit-Dienst, der dann den fälligen Ton spielt und den nächsten plant.
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
