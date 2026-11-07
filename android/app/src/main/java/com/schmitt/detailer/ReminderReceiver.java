package com.schmitt.detailer;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Recebe o alarme e mostra a notificação do agendamento. */
public class ReminderReceiver extends BroadcastReceiver {
    static final String CHANNEL_ID = "agendamentos";
    static final String CHANNEL_SUMMARY = "resumo";

    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("id");
        String title = intent.getStringExtra("title");
        String text = intent.getStringExtra("text");
        String big = intent.getStringExtra("big");
        String channel = intent.getStringExtra("channel");
        show(context, id == null ? "x" : id, title, text, big, channel);
    }

    static void show(Context context, String id, String title, String text, String big, String channelKey) {
        final String channelId = CHANNEL_SUMMARY.equals(channelKey) ? CHANNEL_SUMMARY : CHANNEL_ID;
        NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel;
            if (CHANNEL_SUMMARY.equals(channelId)) {
                channel = new NotificationChannel(
                        CHANNEL_SUMMARY, "Resumo do dia", NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("Resumo dos atendimentos do dia, de manhã");
            } else {
                channel = new NotificationChannel(
                        CHANNEL_ID, "Agendamentos", NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("Avisos antes de cada atendimento");
            }
            nm.createNotificationChannel(channel);
        }

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent content = PendingIntent.getActivity(
                context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            b = new Notification.Builder(context, channelId);
        } else {
            b = new Notification.Builder(context);
            b.setPriority(Notification.PRIORITY_HIGH);
        }

        b.setSmallIcon(R.drawable.ic_stat_notify)
                .setContentTitle(title == null ? "Atendimento" : title)
                .setContentText(text == null ? "" : text)
                .setStyle(new Notification.BigTextStyle().bigText(big == null ? (text == null ? "" : text) : big))
                .setContentIntent(content)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setWhen(System.currentTimeMillis());

        nm.notify(id.hashCode(), b.build());
    }
}
