package com.schmitt.detailer;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** Agenda (e cancela) os alarmes dos lembretes. */
final class ReminderScheduler {
    private static final String PREFS = "reminders";
    static final String KEY_ITEMS = "items";
    static final String KEY_DAILY = "daily";
    private static final String ACTION = "com.schmitt.detailer.REMIND";

    private ReminderScheduler() {}

    /** Substitui todos os lembretes anteriores pela lista recebida. */
    static void scheduleAll(Context ctx, JSONArray items) {
        scheduleAll(ctx, items, KEY_ITEMS);
    }

    static void scheduleAll(Context ctx, JSONArray items, String key) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        // cancela os anteriores
        try {
            JSONArray prev = new JSONArray(sp.getString(key, "[]"));
            for (int i = 0; i < prev.length(); i++) {
                cancel(ctx, am, prev.getJSONObject(i).getString("id"));
            }
        } catch (Exception ignored) {
        }

        long now = System.currentTimeMillis();
        JSONArray kept = new JSONArray();
        for (int i = 0; i < items.length(); i++) {
            try {
                JSONObject it = items.getJSONObject(i);
                long at = it.getLong("at");
                if (at <= now) continue;
                schedule(ctx, am, it, at);
                kept.put(it);
            } catch (Exception ignored) {
            }
        }
        sp.edit().putString(key, kept.toString()).apply();
    }

    /** Reagenda o que estava salvo (depois de reiniciar o celular ou atualizar o app). */
    static void restore(Context ctx) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            scheduleAll(ctx, new JSONArray(sp.getString(KEY_ITEMS, "[]")), KEY_ITEMS);
            scheduleAll(ctx, new JSONArray(sp.getString(KEY_DAILY, "[]")), KEY_DAILY);
        } catch (Exception ignored) {
        }
    }

    private static Intent baseIntent(Context ctx) {
        Intent i = new Intent(ctx, ReminderReceiver.class);
        i.setAction(ACTION);
        return i;
    }

    private static void schedule(Context ctx, AlarmManager am, JSONObject it, long at) throws Exception {
        String id = it.getString("id");
        Intent i = baseIntent(ctx);
        i.putExtra("id", id);
        i.putExtra("title", it.optString("title"));
        i.putExtra("text", it.optString("text"));
        i.putExtra("big", it.optString("big"));
        i.putExtra("channel", it.optString("channel"));
        PendingIntent pi = PendingIntent.getBroadcast(
                ctx, id.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    private static void cancel(Context ctx, AlarmManager am, String id) {
        PendingIntent pi = PendingIntent.getBroadcast(
                ctx, id.hashCode(), baseIntent(ctx), PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) {
            am.cancel(pi);
            pi.cancel();
        }
    }
}
