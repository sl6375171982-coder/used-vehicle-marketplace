package com.example.vehiclemarket.ui.navigation

import android.app.Activity
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.Modifier
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.core.view.WindowCompat
import com.example.vehiclemarket.ui.screens.BrowseScreen
import com.example.vehiclemarket.ui.screens.HomeScreen
import com.example.vehiclemarket.ui.screens.PlaceholderScreen
import com.example.vehiclemarket.ui.screens.ProfileScreen
import com.example.vehiclemarket.ui.screens.SellScreen
import com.example.vehiclemarket.ui.theme.ThemeMode
import com.example.vehiclemarket.ui.theme.VehicleMarketTheme
import com.example.vehiclemarket.ui.theme.saveThemeMode
import com.example.vehiclemarket.ui.theme.themeModeFlow
import kotlinx.coroutines.launch
import java.io.IOException

private data class AppDestination(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

private val destinations = listOf(
    AppDestination(route = "home", label = "Home", icon = Icons.Outlined.Home),
    AppDestination(route = "browse", label = "Browse", icon = Icons.Outlined.Search),
    AppDestination(route = "sell", label = "Sell", icon = Icons.Outlined.AddCircle),
    AppDestination(route = "favourites", label = "Favourites", icon = Icons.Outlined.FavoriteBorder),
    AppDestination(route = "profile", label = "Profile", icon = Icons.Outlined.Person),
)

@Composable
fun VehicleMarketApp() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    val themeModeFlow = remember(context) { context.themeModeFlow() }
    val themeMode by themeModeFlow.collectAsState(initial = ThemeMode.System)
    val navController = rememberNavController()
    val backStackEntry = navController.currentBackStackEntryAsState()
    val view = LocalView.current
    val useDarkSystemBars = when (themeMode) {
        ThemeMode.System -> isSystemInDarkTheme()
        ThemeMode.Light -> false
        ThemeMode.Dark -> true
    }

    SideEffect {
        val activity = view.context as? Activity
        if (activity != null) {
            val insetsController = WindowCompat.getInsetsController(activity.window, view)
            insetsController.isAppearanceLightStatusBars = !useDarkSystemBars
            insetsController.isAppearanceLightNavigationBars = !useDarkSystemBars
        }
    }

    VehicleMarketTheme(themeMode = themeMode) {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            bottomBar = {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 0.dp,
                ) {
                    val currentDestination = backStackEntry.value?.destination
                    destinations.forEach { destination ->
                        val selected = currentDestination?.hierarchy?.any {
                            it.route == destination.route
                        } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(destination.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = destination.icon,
                                    contentDescription = destination.label,
                                    modifier = Modifier.size(21.dp),
                                )
                            },
                            label = { Text(destination.label) },
                            alwaysShowLabel = true,
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.tertiary,
                                selectedTextColor = MaterialTheme.colorScheme.tertiary,
                                indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            ),
                        )
                    }
                }
            },
            containerColor = MaterialTheme.colorScheme.background,
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = "home",
                modifier = Modifier.padding(innerPadding),
            ) {
                composable("home") {
                    HomeScreen(
                        onBrowse = { navController.navigate("browse") },
                        onSell = { navController.navigate("sell") },
                    )
                }
                composable("browse") {
                    BrowseScreen()
                }
                composable("sell") {
                    SellScreen()
                }
                composable("favourites") {
                    PlaceholderScreen(
                        title = "Favourites",
                        description = "Saved vehicles will appear here when the app is connected to live marketplace data.",
                        icon = Icons.Outlined.FavoriteBorder,
                    )
                }
                composable("profile") {
                    ProfileScreen(
                        themeMode = themeMode,
                        onThemeModeSelected = { selectedMode ->
                            scope.launch {
                                try {
                                    context.saveThemeMode(selectedMode)
                                } catch (error: IOException) {
                                    snackbarHostState.showSnackbar(
                                        "Theme preference could not be saved. ${error.localizedMessage.orEmpty()}".trim(),
                                    )
                                }
                            }
                        },
                    )
                }
            }
        }
    }
}
