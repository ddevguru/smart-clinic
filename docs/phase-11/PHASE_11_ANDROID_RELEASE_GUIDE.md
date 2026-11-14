# Smart Clinic OS — Flutter Android Release & Play Store Guide

**Document ID:** `SCOS-P11-AND-011`  
**Package Identifier:** `com.smartclinicos.patient_app`  
**Target Platform:** Android 8.0 (API 26) through Android 15 (API 35)  
**Flutter SDK:** 3.24.x | **Gradle:** 8.3 | **Kotlin:** 1.9.0

---

## 1. App Configuration & Permissions

### Permissions Manifest (`android/app/src/main/AndroidManifest.xml`)
- `INTERNET`: Secure TLS communication with API backend and WebRTC media relays.
- `ACCESS_NETWORK_STATE`: Detecting online/offline network transitions.
- `POST_NOTIFICATIONS`: Android 13+ runtime permission for queue delay alerts and reminder notifications.
- `VIBRATE`: Haptic alerts when patient's token is called to consultation room.

---

## 2. Release Signing Configuration

### Step 1: Generate Production Keystore
```bash
keytool -genkey -v -keystore smartclinicos-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias smartclinic-key
```
Store `smartclinicos-release.jks` in a secure vault; never commit to version control.

### Step 2: Configure `android/key.properties`
Create `android/key.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=smartclinic-key
storeFile=/path/to/smartclinicos-release.jks
```

### Step 3: Link Signing to `build.gradle.kts`
```kotlin
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}
```

---

## 3. Production App Bundle Compilation

```bash
cd /opt/smart-clinic-os/patient_app
flutter clean
flutter pub get
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.smartclinicos.in/api/v1
```
The output file is generated at:
`build/app/outputs/bundle/release/app-release.aab`
Upload this `.aab` file directly to the Google Play Console Production Track.

