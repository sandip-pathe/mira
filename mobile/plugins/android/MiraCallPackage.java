package com.sandi.mira.calls;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.net.Uri;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.telecom.Connection;
import androidx.core.app.NotificationCompat;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.*;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import io.wazo.callkeep.Constants;
import io.wazo.callkeep.VoiceConnectionService;
import java.util.*;

/** Adds actions to CallKeep's foreground notification without a second service. */
public class MiraCallPackage implements ReactPackage {
    private static ToneGenerator ringback;
    private static String ringbackUuid;
    private static AudioManager talkAudioManager;
    private static int previousAudioMode = AudioManager.MODE_NORMAL;
    private static boolean previousSpeakerphone;
    private static android.media.AudioDeviceInfo previousCommunicationDevice;
    private static boolean talkAudioActive;
    private static PowerManager.WakeLock proximityWakeLock;
    private static String proximityUuid;
    private static synchronized void stopRingback() {
        if (ringback != null) {
            ringback.stopTone(); ringback.release(); ringback = null; ringbackUuid = null;
        }
    }
    private static synchronized void stopProximity(String uuid) {
        stopProximity(uuid, true);
    }
    private static synchronized void stopProximity(String uuid, boolean waitForFar) {
        if (proximityWakeLock == null || (uuid != null && !uuid.equals(proximityUuid))) return;
        try {
            if (proximityWakeLock.isHeld()) {
                try {
                    if (waitForFar) proximityWakeLock.release(PowerManager.RELEASE_FLAG_WAIT_FOR_NO_PROXIMITY);
                    else proximityWakeLock.release();
                }
                catch (RuntimeException error) { if (proximityWakeLock.isHeld()) proximityWakeLock.release(); }
            }
        } finally { proximityWakeLock = null; proximityUuid = null; }
    }
    public List<NativeModule> createNativeModules(ReactApplicationContext context) {
        return Collections.singletonList(new CallNotification(context));
    }
    public List<ViewManager> createViewManagers(ReactApplicationContext context) { return Collections.emptyList(); }

    public static class EndCallReceiver extends BroadcastReceiver {
        @Override public void onReceive(Context context, Intent intent) {
            String uuid = intent.getStringExtra("uuid");
            Connection connection = VoiceConnectionService.getConnection(uuid);
            stopProximity(uuid);
            if (connection != null) { stopRingback(); connection.onDisconnect(); }
        }
    }

    static class CallNotification extends ReactContextBaseJavaModule {
        CallNotification(ReactApplicationContext context) { super(context); }
        @Override public String getName() { return "MiraCallNotification"; }

        @Override public void invalidate() { stopRingback(); stopProximity(null); super.invalidate(); }

        @ReactMethod public void startTalkAudio(Promise promise) {
            try {
                AudioManager manager = (AudioManager) getReactApplicationContext().getSystemService(Context.AUDIO_SERVICE);
                synchronized (MiraCallPackage.class) {
                    if (!talkAudioActive) {
                        talkAudioManager = manager;
                        previousAudioMode = manager.getMode();
                        previousSpeakerphone = manager.isSpeakerphoneOn();
                        if (Build.VERSION.SDK_INT >= 31) previousCommunicationDevice = manager.getCommunicationDevice();
                        manager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                        if (Build.VERSION.SDK_INT >= 31) {
                            android.media.AudioDeviceInfo speaker = null;
                            for (android.media.AudioDeviceInfo device : manager.getAvailableCommunicationDevices()) {
                                if (device.getType() == android.media.AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) { speaker = device; break; }
                            }
                            if (speaker == null || !manager.setCommunicationDevice(speaker))
                                throw new IllegalStateException("Speaker audio route is unavailable.");
                        } else {
                            manager.setSpeakerphoneOn(true);
                        }
                        talkAudioActive = true;
                    }
                }
                promise.resolve(null);
            } catch (Exception error) { promise.reject("TALK_AUDIO_ROUTE", error); }
        }

        @ReactMethod public void stopTalkAudio(Promise promise) {
            synchronized (MiraCallPackage.class) {
                if (talkAudioActive && talkAudioManager != null) {
                    try {
                        if (Build.VERSION.SDK_INT >= 31) {
                            talkAudioManager.clearCommunicationDevice();
                            if (previousCommunicationDevice != null) talkAudioManager.setCommunicationDevice(previousCommunicationDevice);
                        } else {
                            talkAudioManager.setSpeakerphoneOn(previousSpeakerphone);
                        }
                        talkAudioManager.setMode(previousAudioMode);
                    } catch (Exception ignored) { }
                    talkAudioManager = null;
                    previousCommunicationDevice = null;
                    talkAudioActive = false;
                }
            }
            promise.resolve(null);
        }

        @ReactMethod public void setRinging(String uuid, boolean enabled) {
            synchronized (MiraCallPackage.class) {
                if (!enabled) { if (uuid.equals(ringbackUuid)) stopRingback(); return; }
                if (VoiceConnectionService.getConnection(uuid) == null) return;
                if (Build.VERSION.SDK_INT >= 28 && !VoiceConnectionService.hasConnectionServiceFocus()) return;
                if (ringback != null && uuid.equals(ringbackUuid)) return;
                stopRingback();
                try {
                    ringback = new ToneGenerator(AudioManager.STREAM_VOICE_CALL, 35);
                    ringbackUuid = uuid;
                    ringback.startTone(ToneGenerator.TONE_SUP_RINGTONE);
                } catch (RuntimeException error) { stopRingback(); }
            }
        }

        @ReactMethod public void setProximityScreenOff(String uuid, boolean enabled, boolean waitForFar) {
            synchronized (MiraCallPackage.class) {
                if (!enabled) { stopProximity(uuid, waitForFar); return; }
                if (VoiceConnectionService.getConnection(uuid) == null) return;
                Context context = getReactApplicationContext();
                PowerManager manager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (manager == null || !manager.isWakeLockLevelSupported(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK)) return;
                if (proximityWakeLock != null && uuid.equals(proximityUuid) && proximityWakeLock.isHeld()) return;
                stopProximity(null);
                try {
                    proximityWakeLock = manager.newWakeLock(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK, "Mira:CallProximity");
                    proximityWakeLock.setReferenceCounted(false);
                    proximityUuid = uuid;
                    proximityWakeLock.acquire();
                } catch (RuntimeException error) { stopProximity(uuid); }
            }
        }

        @ReactMethod public void prepare(Promise promise) {
            if (Build.VERSION.SDK_INT >= 26) {
                NotificationManager manager = (NotificationManager) getReactApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
                manager.createNotificationChannel(new NotificationChannel("mira.calls", "Mira calls", NotificationManager.IMPORTANCE_LOW));
            }
            if (Build.VERSION.SDK_INT >= 28) {
                VoiceConnectionService.nativeFocusListener = new VoiceConnectionService.NativeFocusListener() {
                    public void onFocusGained() {
                        if (getReactApplicationContext().hasActiveReactInstance()) {
                            getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("MiraCallFocus", true);
                        }
                    }
                    public void onFocusLost() {
                        stopRingback();
                        stopProximity(null);
                        if (getReactApplicationContext().hasActiveReactInstance()) {
                            getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("MiraCallFocus", false);
                        }
                        // Release Telecom's call before acknowledging lost focus.
                        for (Connection connection : new ArrayList<Connection>(VoiceConnectionService.currentConnections.values())) {
                            connection.onDisconnect();
                        }
                        VoiceConnectionService service = VoiceConnectionService.currentConnectionService;
                        if (service != null) service.connectionServiceFocusReleased();
                    }
                };
            }
            promise.resolve(null);
        }

        @ReactMethod public void show(String uuid, String status, Promise promise) {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                VoiceConnectionService service = VoiceConnectionService.currentConnectionService;
                if (service == null || VoiceConnectionService.getConnection(uuid) == null) { promise.resolve(null); return; }
                Context context = getReactApplicationContext();
                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (Build.VERSION.SDK_INT >= 26) {
                    manager.createNotificationChannel(new NotificationChannel("mira.calls", "Mira calls", NotificationManager.IMPORTANCE_LOW));
                }
                Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
                if (open == null) { promise.reject("CALL_NOTIFICATION", "No return activity"); return; }
                open.setAction(Intent.ACTION_VIEW).setData(Uri.parse("mira://call"));
                open.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent returnToCall = PendingIntent.getActivity(context, 731, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                Intent end = new Intent(context, EndCallReceiver.class).putExtra("uuid", uuid);
                PendingIntent endCall = PendingIntent.getBroadcast(context, 732, end, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                Notification notification = new NotificationCompat.Builder(context, "mira.calls")
                    .setSmallIcon(android.R.drawable.sym_action_call).setContentTitle("Mira")
                    .setContentText(status).setCategory(NotificationCompat.CATEGORY_CALL)
                    .setOngoing(true).setOnlyAlertOnce(true).setContentIntent(returnToCall)
                    .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                    .addAction(android.R.drawable.sym_action_call, "Return", returnToCall)
                    .addAction(android.R.drawable.ic_menu_close_clear_cancel, "End call", endCall).build();
                if (Build.VERSION.SDK_INT >= 29) {
                    service.startForeground(Constants.FOREGROUND_SERVICE_NOTIFICATION_ID, notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL | ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
                } else service.startForeground(Constants.FOREGROUND_SERVICE_NOTIFICATION_ID, notification);
                promise.resolve(null);
                } catch (Exception error) { promise.reject("CALL_NOTIFICATION", error); }
            });
        }
    }
}
