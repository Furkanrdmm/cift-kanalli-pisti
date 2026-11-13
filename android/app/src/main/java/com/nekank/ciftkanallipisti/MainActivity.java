package com.nekank.ciftkanallipisti;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Oyun yüklenene kadar şeffaf sayfanın arkasında tam ekran giriş görseli görünür
        ((View) getBridge().getWebView().getParent()).setBackgroundResource(R.drawable.splash_screen);
    }
}
