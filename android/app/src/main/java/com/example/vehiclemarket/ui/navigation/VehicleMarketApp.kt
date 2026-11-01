package com.example.vehiclemarket.ui.navigation

import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.vehiclemarket.ui.screens.HomeScreen
import com.example.vehiclemarket.ui.screens.PlaceholderScreen

private data class AppDestination(val route: String, val label: String)

private val destinations = listOf(
    AppDestination(route = "home", label = "Home"),
    AppDestination(route = "browse", label = "Browse"),
    AppDestination(route = "sell", label = "Sell"),
)

@Composable
fun VehicleMarketApp() {
    val navController = rememberNavController()
    val backStackEntry = navController.currentBackStackEntryAsState()

    Scaffold(
        bottomBar = {
            NavigationBar {
                val currentDestination = backStackEntry.value?.destination
                destinations.forEach { destination ->
                    NavigationBarItem(
                        selected = currentDestination?.hierarchy?.any {
                            it.route == destination.route
                        } == true,
                        onClick = {
                            navController.navigate(destination.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {},
                        label = { Text(destination.label) },
                    )
                }
            }
        },
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
                PlaceholderScreen(
                    title = "Browse vehicles",
                    description = "Approved vehicles will appear here.",
                )
            }
            composable("sell") {
                PlaceholderScreen(
                    title = "Sell your vehicle",
                    description = "Seller registration and listing submission are coming next.",
                )
            }
        }
    }
}
