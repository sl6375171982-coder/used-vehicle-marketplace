# VehicleMarket Android

Native Android app built with Kotlin, Jetpack Compose, and Navigation Compose.
The project is intentionally independent of the existing `website/` application
and does not include Supabase credentials.

The Home and Browse screens use local sample vehicles and illustrative vehicle
artwork, not live listings. Browse search and category filters operate on that
sample collection. The Sell screen follows the website's multipart submission
contract and sends vehicle details, seller contact information, and optional
photos to the configured website API. The website stores submissions as pending
and keeps its service credentials server-side. The Android app never contains a
service-role key.

Set the public website origin in **Profile > Website connection** before
submitting (for example, `https://your-public-domain.example`). This origin is
saved locally on the device. Photo selection accepts JPEG, PNG, or WebP, up to
8 images, 5 MB each, and 20 MB total.

The website's dashboard is an administrator console, not a seller dashboard.
The app opens that existing console in the browser so its existing sign-in and
`admin_users` authorization remain in force. Account creation, seller listing
management, favourites, and live marketplace browsing are not provided by the
current website backend.

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
