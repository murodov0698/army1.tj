import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val webRoot = rootProject.projectDir.parentFile

val syncWebAssets = tasks.register<Copy>("syncWebAssets") {
    into(layout.buildDirectory.dir("generated/webassets/www"))
    from(webRoot) {
        include("index.html", "script.js", "style.css")
        include("images/**")
        include("lessons/**")
        include("practices/**")
        exclude("**/desktop.ini")
        exclude("**/.DS_Store")
        exclude("**/*.bat")
    }
    duplicatesStrategy = DuplicatesStrategy.INCLUDE
}

android {
    namespace = "com.alifbo.tajik"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.alifbo.tajik"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    val keystorePropsFile = rootProject.file("keystore.properties")
    if (keystorePropsFile.exists()) {
        val keystoreProps = Properties().apply {
            keystorePropsFile.inputStream().use { load(it) }
        }
        signingConfigs {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (keystorePropsFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }

    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }

    androidResources {
        noCompress += listOf("mp3", "jpg", "jpeg", "png", "webp", "gif", "wav", "ogg")
    }

    sourceSets.getByName("main") {
        assets.srcDir(layout.buildDirectory.dir("generated/webassets"))
    }
}

tasks.configureEach {
    if (name == "syncWebAssets") return@configureEach
    if (name.endsWith("Assets") || name.contains("Lint", ignoreCase = true)) {
        dependsOn(syncWebAssets)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}
