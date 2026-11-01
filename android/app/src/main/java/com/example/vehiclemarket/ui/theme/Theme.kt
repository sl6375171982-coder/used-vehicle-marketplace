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
    primary = LuxuryGold,
    onPrimary = Color(0xFF20190D),
    primaryContainer = Color(0xFF342C1D),
    onPrimaryContainer = Color(0xFFE9D8B7),
    secondary = Color(0xFFD9D5CC),
    onSecondary = Color(0xFF24231F),
    secondaryContainer = Color(0xFF24231F),
    onSecondaryContainer = LuxuryWhite,
    tertiary = LuxuryGold,
    onTertiary = Color(0xFF20190D),
    background = LuxuryBlack,
    onBackground = LuxuryWhite,
    surface = LuxurySurface,
    onSurface = LuxuryWhite,
    surfaceVariant = LuxuryRaised,
    onSurfaceVariant = LuxuryMuted,
    outline = LuxuryBorder,
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
