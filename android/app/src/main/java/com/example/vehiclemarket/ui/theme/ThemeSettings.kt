package com.example.vehiclemarket.ui.theme

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.map

private val Context.vehicleMarketDataStore by preferencesDataStore(
    name = "vehiclemarket_settings",
)

enum class ThemeMode(val label: String) {
    System("System default"),
    Light("Light"),
    Dark("Dark"),
}

private val themeModeKey = stringPreferencesKey("theme_mode")

fun Context.themeModeFlow() = vehicleMarketDataStore.data.map { preferences ->
    preferences[themeModeKey]
        ?.let { storedValue -> ThemeMode.entries.firstOrNull { it.name == storedValue } }
        ?: ThemeMode.Dark
}

suspend fun Context.saveThemeMode(themeMode: ThemeMode) {
    vehicleMarketDataStore.edit { preferences ->
        preferences[themeModeKey] = themeMode.name
    }
}
