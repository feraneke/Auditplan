/*
 * Auditplan – Android-Hülle für die Auditplan-Web-App (assets/index.html).
 * Herkunft: erstellt mit Claude (claude.ai), Projekt „400_Auditplan“, 25.11.2026.
 * Aufbau wie die Fahrtenbuch-App: WebView, feste https-Adresse, damit der
 * Browser-Speicher (localStorage) dauerhaft im App-Speicher liegt.
 * Es werden keine Daten ins Internet gesendet.
 *
 * Brücke window.AndroidBridge:
 *   saveFile(name, mime, inhalt)   Datei speichern (Android-Dateiauswahl)
 *   startAudit(planJson)           Audit-Dienst mit Ereignisliste starten
 *   stopAudit()                    Audit-Dienst beenden
 *   auditStatus()                  laufender Plan als JSON oder ""
 *   testTon(art, anteil, vib)      Ton sofort spielen
 *   bildschirmAn(an)               Bildschirm anlassen ja/nein
 *   appVersion()
 */
package de.auditplan.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/index.html";
    private static final int REQ_DATEI_WAEHLEN = 1;
    private static final int REQ_DATEI_SPEICHERN = 2;
    private static final int REQ_BENACHRICHTIGUNG = 3;

    private WebView web;
    private ValueCallback<Uri[]> dateiCallback;
    private String speicherInhalt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);

        web.addJavascriptInterface(new Bruecke(), "AndroidBridge");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String pfad = u.getPath();
                if (pfad == null || !pfad.startsWith("/assets/")) return null;
                try {
                    InputStream in = getAssets().open(pfad.substring("/assets/".length()));
                    return new WebResourceResponse(mimeTyp(pfad), "UTF-8", in);
                } catch (Exception e) {
                    return null;
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (dateiCallback != null) dateiCallback.onReceiveValue(null);
                dateiCallback = callback;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/plain", "application/json", "application/octet-stream"});
                try {
                    startActivityForResult(i, REQ_DATEI_WAEHLEN);
                } catch (Exception e) {
                    dateiCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(START);
        }
    }

    private static String mimeTyp(String pfad) {
        if (pfad.endsWith(".html")) return "text/html";
        if (pfad.endsWith(".js")) return "application/javascript";
        if (pfad.endsWith(".css")) return "text/css";
        if (pfad.endsWith(".json")) return "application/json";
        if (pfad.endsWith(".png")) return "image/png";
        if (pfad.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    private void benachrichtigungErlauben() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_BENACHRICHTIGUNG);
        }
    }

    /** Wird aus JavaScript als window.AndroidBridge aufgerufen. */
    private class Bruecke {
        @JavascriptInterface
        public void saveFile(final String name, final String mime, final String inhalt) {
            runOnUiThread(() -> {
                speicherInhalt = inhalt;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mime == null || mime.isEmpty() ? "text/plain" : mime);
                i.putExtra(Intent.EXTRA_TITLE, name);
                try {
                    startActivityForResult(i, REQ_DATEI_SPEICHERN);
                } catch (Exception e) {
                    meldung("Speichern nicht möglich");
                }
            });
        }

        @JavascriptInterface
        public boolean startAudit(final String planJson) {
            try {
                runOnUiThread(MainActivity.this::benachrichtigungErlauben);
                Intent i = new Intent(MainActivity.this, AuditDienst.class);
                i.setAction(AuditDienst.AKTION_START);
                i.putExtra(AuditDienst.EXTRA_PLAN, planJson);
                startForegroundService(i);
                Log.d(Ton.TAG, "Bruecke.startAudit | " + planJson.length() + " Zeichen");
                return true;
            } catch (Exception e) {
                Log.e(Ton.TAG, "Bruecke.startAudit | Fehler " + e);
                return false;
            }
        }

        @JavascriptInterface
        public void stopAudit() {
            try {
                Intent i = new Intent(MainActivity.this, AuditDienst.class);
                i.setAction(AuditDienst.AKTION_STOP);
                startForegroundService(i);
            } catch (Exception e) {
                Log.e(Ton.TAG, "Bruecke.stopAudit | Fehler " + e);
            }
        }

        @JavascriptInterface
        public String auditStatus() {
            String p = AuditDienst.laufenderPlan(MainActivity.this);
            return p == null ? "" : p;
        }

        @JavascriptInterface
        public void testTon(final String art, final double anteil, final boolean vibration) {
            Ton.spielen(MainActivity.this, art, (float) anteil, vibration);
        }

        @JavascriptInterface
        public void bildschirmAn(final boolean an) {
            runOnUiThread(() -> {
                if (an) {
                    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } else {
                    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            });
        }

        @JavascriptInterface
        public String appVersion() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }
    }

    private void meldung(String text) {
        try {
            web.evaluateJavascript("typeof toast==='function'&&toast(" + JSONObject.quote(text) + ")", null);
        } catch (Exception e) {
            Toast.makeText(this, text, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_DATEI_WAEHLEN) {
            Uri[] ergebnis = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                ergebnis = new Uri[]{data.getData()};
            }
            if (dateiCallback != null) dateiCallback.onReceiveValue(ergebnis);
            dateiCallback = null;
        } else if (requestCode == REQ_DATEI_SPEICHERN) {
            String inhalt = speicherInhalt;
            speicherInhalt = null;
            if (resultCode != RESULT_OK || data == null || data.getData() == null || inhalt == null) {
                meldung("Nicht gespeichert");
                return;
            }
            try (OutputStream out = getContentResolver().openOutputStream(data.getData(), "wt")) {
                if (out == null) throw new IllegalStateException("kein Ausgabestrom");
                // Wie die 400.dotm: ANSI (Windows-1252), damit Word die Datei laden kann
                out.write(inhalt.getBytes("windows-1252"));
                meldung("Datei gespeichert");
            } catch (Exception e) {
                meldung("Speichern fehlgeschlagen");
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.evaluateJavascript("typeof appWiederDa==='function'&&appWiederDa()", null);
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null) {
            web.evaluateJavascript("typeof zurueck==='function'?zurueck():false", wert -> {
                if (!"true".equals(wert)) MainActivity.super.onBackPressed();
            });
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }
}
