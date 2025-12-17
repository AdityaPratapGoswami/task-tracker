"use client";

import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

export default function StatusBarManager() {
    useEffect(() => {
        // Only run on native platforms (iOS/Android)
        if (Capacitor.isNativePlatform()) {
            const configureStatusBar = async () => {
                try {
                    // Make the status bar transparent so content goes behind it
                    await StatusBar.setOverlaysWebView({ overlay: true });

                    // Set the style to Light (dark icons) for light backgrounds
                    // or Dark (light icons) for dark backgrounds. 
                    // Since our app seems to be light-themed based on layout.tsx (white bg),
                    // we use Style.Light to get dark text/icons.
                    await StatusBar.setStyle({ style: Style.Light });
                } catch (error) {
                    console.error("Failed to configure status bar", error);
                } finally {
                    // ALWAYS hide the splash screen, even if status bar config fails
                    try {
                        await SplashScreen.hide();
                    } catch (e) {
                        console.error("Failed to hide splash screen", e);
                    }
                }
            };

            configureStatusBar();

            // Safety timeout: Ensure splash screen goes away after max 3 seconds
            // in case the async function hangs or something else goes wrong.
            const timeout = setTimeout(async () => {
                try {
                    await SplashScreen.hide();
                } catch (err) {
                    console.error("Safety timeout: Failed to hide splash screen", err);
                }
            }, 3000);

            return () => clearTimeout(timeout);
        }
    }, []);

    return null; // This component doesn't render anything visible
}
