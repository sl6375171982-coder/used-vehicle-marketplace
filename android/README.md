# VehicleMarket Android

Native Android app built with Kotlin, Jetpack Compose, and Navigation Compose.
The project is intentionally independent of the existing `website/` application
and does not include Supabase credentials.

## Requirements

- Android Studio with the Android SDK for API 36
- JDK 17 or JDK 21 (recommended; select it as Android Studio's Gradle JDK)
- An Android emulator or a USB-connected Android device

## Build and run

Open the `android/` directory in Android Studio, allow Gradle sync to finish,
then select the `app` run configuration and an emulator/device.

From a terminal, with an Android SDK installed and configured:

```bash
cd android
./gradlew assembleDebug
./gradlew installDebug
```

The debug APK is written to `app/build/outputs/apk/debug/app-debug.apk`.
`installDebug` requires a running emulator or connected device with USB
debugging enabled.

## Change the placeholder package name

The starter package is `com.example.vehiclemarket`; replace it before
publishing:

1. Change `namespace` and `applicationId` in `app/build.gradle.kts`.
2. Refactor the Kotlin package `com.example.vehiclemarket` in Android Studio,
   including the `package` declarations under `app/src/main/java`.
3. Keep the application ID stable after the first Play Store release.

No Supabase configuration is included. Add only the public project URL and
publishable/anon key to client configuration when backend integration begins;
never include a service-role key in the Android app.
