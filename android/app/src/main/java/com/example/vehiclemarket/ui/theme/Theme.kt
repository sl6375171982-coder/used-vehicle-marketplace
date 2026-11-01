package com.example.vehiclemarket.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape

private val LightColors = lightColorScheme(
    primary = Blue,
    onPrimary = Color.White,
    primaryContainer = PaleBlue,
    onPrimaryContainer = Navy,
    secondary = Navy,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFEAF1F8),
    onSecondaryContainer = Navy,
    tertiary = Orange,
    onTertiary = Color.White,
    background = Canvas,
    onBackground = Ink,
    surface = SurfaceWhite,
    onSurface = Ink,
    surfaceVariant = Color(0xFFE9EDF2),
    onSurfaceVariant = MutedInk,
    outline = Color(0xFFD8DEE7),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF9FC6F0),
    onPrimary = Color(0xFF0C2945),
    primaryContainer = Color(0xFF203A55),
    onPrimaryContainer = Color(0xFFD9E9FA),
    secondary = Color(0xFFB8CBE0),
    onSecondary = Color(0xFF1B2A3B),
    secondaryContainer = Color(0xFF26384B),
    onSecondaryContainer = Color(0xFFD8E5F3),
    tertiary = Color(0xFFFFA56E),
    onTertiary = Color(0xFF3B1A04),
    background = Color(0xFF101722),
    onBackground = Color(0xFFF0F3F8),
    surface = Color(0xFF182231),
    onSurface = Color(0xFFF0F3F8),
    surfaceVariant = Color(0xFF283547),
    onSurfaceVariant = Color(0xFFB1BECE),
    outline = Color(0xFF46566A),
)

private val VehicleMarketShapes = Shapes(
    extraLarge = RoundedCornerShape(28.dp),
    large = RoundedCornerShape(22.dp),
    medium = RoundedCornerShape(18.dp),
    small = RoundedCornerShape(12.dp),
)

@Composable
fun VehicleMarketTheme(
    themeMode: ThemeMode = ThemeMode.System,
    content: @Composable () -> Unit,
) {
    val darkTheme = when (themeMode) {
        ThemeMode.System -> isSystemInDarkTheme()
        ThemeMode.Light -> false
        ThemeMode.Dark -> true
    }

    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = VehicleMarketTypography,
        shapes = VehicleMarketShapes,
        content = content,
    )
}
