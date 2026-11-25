plugins {
    id("com.android.application")
}

// Signaturschlüssel kommt aus den GitHub-Secrets (siehe ANLEITUNG.md).
// Ohne Secrets wird mit einem wechselnden Testschlüssel signiert: dann lassen sich Updates nicht über die alte Version installieren.
val keystorePath: String = System.getenv("KEYSTORE_FILE") ?: ""
val hatSchluessel: Boolean = keystorePath.isNotBlank() && file(keystorePath).exists()

android {
    namespace = "de.auditplan.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "de.auditplan.app"
        minSdk = 26
        targetSdk = 34
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "1.0." + (System.getenv("GITHUB_RUN_NUMBER") ?: "0")
    }

    signingConfigs {
        if (hatSchluessel) {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS") ?: "auditplan"
                keyPassword = System.getenv("KEY_PASSWORD") ?: System.getenv("KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (hatSchluessel) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
