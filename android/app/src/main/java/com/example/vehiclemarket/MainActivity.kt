package com.example.vehiclemarket

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.vehiclemarket.ui.navigation.VehicleMarketApp
import com.example.vehiclemarket.ui.theme.VehicleMarketTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VehicleMarketTheme {
                VehicleMarketApp()
            }
        }
    }
}
