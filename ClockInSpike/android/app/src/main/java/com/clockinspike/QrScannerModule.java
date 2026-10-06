package com.clockinspike;

import android.app.Activity;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions;
import com.google.mlkit.vision.barcode.common.Barcode;

public class QrScannerModule extends ReactContextBaseJavaModule implements ActivityEventListener {
  private static final int REQUEST_CODE = 8417;
  private Promise pendingPromise;

  QrScannerModule(ReactApplicationContext context) {
    super(context);
    context.addActivityEventListener(this);
  }

  @NonNull
  @Override
  public String getName() { return "OpenMicQrScanner"; }

  @ReactMethod
  public void scan(Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "OpenMic is not active.");
      return;
    }
    if (pendingPromise != null) {
      promise.reject("SCAN_IN_PROGRESS", "A QR scan is already open.");
      return;
    }
    pendingPromise = promise;
    GmsBarcodeScannerOptions options = new GmsBarcodeScannerOptions.Builder()
        .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
        .build();
    GmsBarcodeScanning.getClient(activity, options).startScan()
        .addOnSuccessListener(barcode -> {
          Promise result = pendingPromise;
          pendingPromise = null;
          if (result != null) result.resolve(barcode.getRawValue());
        })
        .addOnCanceledListener(() -> {
          Promise result = pendingPromise;
          pendingPromise = null;
          if (result != null) result.resolve(null);
        })
        .addOnFailureListener(error -> {
          Promise result = pendingPromise;
          pendingPromise = null;
          if (result != null) result.reject("SCANNER_FAILED", error);
        });
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, android.content.Intent data) {}

  @Override
  public void onNewIntent(android.content.Intent intent) {}
}
