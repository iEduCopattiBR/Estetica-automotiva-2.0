package com.schmitt.detailer;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.app.PendingIntent;
import android.content.Intent;
import android.app.NotificationManager;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.os.Build;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Collections;
import java.util.List;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int REQ_AUTH = 4001;
    private static final List<Scope> SCOPES =
            Collections.singletonList(new Scope("https://www.googleapis.com/auth/calendar"));

    private WebView webView;
    private String pendingReqId;

    /** Ponte JS -> Android: o app web pede um token do Google Agenda. */
    public class GoogleBridge {
        @JavascriptInterface
        public void requestToken(final String reqId) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    authorize(reqId);
                }
            });
        }
    }

    /** Ponte JS -> Android para os lembretes de agendamento. */
    public class NotifyBridge {
        @JavascriptInterface
        public void schedule(final String json) {
            try {
                ReminderScheduler.scheduleAll(getApplicationContext(), new JSONArray(json));
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public void scheduleDaily(final String json) {
            try {
                ReminderScheduler.scheduleAll(getApplicationContext(), new JSONArray(json), ReminderScheduler.KEY_DAILY);
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public void showNow(String id, String title, String text, String big, String channel) {
            ReminderReceiver.show(getApplicationContext(), id, title, text, big, channel);
        }

        @JavascriptInterface
        public void test() {
            ReminderReceiver.show(getApplicationContext(), "teste",
                    "Atendimento às 14:00 – Higienização",
                    "João Silva • Rua das Flores, 123",
                    "Cliente: João Silva\nEndereço: Rua das Flores, 123\nServiço: Higienização\nHorário: 14:00\n\n(Isto é um teste das notificações)",
                    "agendamentos");
        }

        @JavascriptInterface
        public boolean enabled() {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            return nm != null && nm.areNotificationsEnabled();
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 13+ pede permissão para mostrar notificações
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7001);
        }

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#070709"));

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        webView.addJavascriptInterface(new GoogleBridge(), "AndroidGoogle");
        webView.addJavascriptInterface(new NotifyBridge(), "AndroidNotify");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (HOST.equals(uri.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                }
                return true;
            }
        });

        // Sem isto, window.confirm()/alert() não funcionam no WebView (o confirm sempre "responde não",
        // e por isso o botão de excluir não fazia nada).
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm();
                            }
                        })
                        .setOnCancelListener(new DialogInterface.OnCancelListener() {
                            @Override
                            public void onCancel(DialogInterface dialog) {
                                result.cancel();
                            }
                        })
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton("Confirmar", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.confirm();
                            }
                        })
                        .setNegativeButton("Cancelar", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                result.cancel();
                            }
                        })
                        .setOnCancelListener(new DialogInterface.OnCancelListener() {
                            @Override
                            public void onCancel(DialogInterface dialog) {
                                result.cancel();
                            }
                        })
                        .show();
                return true;
            }
        });

        setContentView(webView);

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("https://" + HOST + "/index.html");
        }
    }

    private void authorize(final String reqId) {
        AuthorizationRequest request = AuthorizationRequest.builder()
                .setRequestedScopes(SCOPES)
                .build();

        Identity.getAuthorizationClient(this)
                .authorize(request)
                .addOnSuccessListener(new com.google.android.gms.tasks.OnSuccessListener<AuthorizationResult>() {
                    @Override
                    public void onSuccess(AuthorizationResult result) {
                        if (result.hasResolution()) {
                            try {
                                pendingReqId = reqId;
                                PendingIntent pi = result.getPendingIntent();
                                startIntentSenderForResult(pi.getIntentSender(), REQ_AUTH, null, 0, 0, 0);
                            } catch (IntentSender.SendIntentException e) {
                                pendingReqId = null;
                                reply(reqId, false, "Não foi possível abrir o login do Google: " + e.getMessage());
                            }
                        } else {
                            reply(reqId, true, result.getAccessToken());
                        }
                    }
                })
                .addOnFailureListener(new com.google.android.gms.tasks.OnFailureListener() {
                    @Override
                    public void onFailure(Exception e) {
                        reply(reqId, false, "Falha no login Google: " + e.getMessage());
                    }
                });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_AUTH || pendingReqId == null) return;

        String reqId = pendingReqId;
        pendingReqId = null;

        if (resultCode != RESULT_OK) {
            reply(reqId, false, "Login cancelado.");
            return;
        }
        try {
            AuthorizationResult result =
                    Identity.getAuthorizationClient(this).getAuthorizationResultFromIntent(data);
            reply(reqId, true, result.getAccessToken());
        } catch (ApiException e) {
            reply(reqId, false, "Erro no login Google: " + e.getMessage());
        }
    }

    /** Devolve o resultado para o JavaScript do app (window.__gcb). */
    private void reply(String reqId, boolean ok, String payload) {
        final String js = "window.__gcb && window.__gcb("
                + JSONObject.quote(reqId) + "," + ok + ","
                + JSONObject.quote(payload == null ? "" : payload) + ")";
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null) webView.evaluateJavascript(js, null);
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
