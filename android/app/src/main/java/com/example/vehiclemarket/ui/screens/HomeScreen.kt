package com.example.vehiclemarket.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

@Composable
fun HomeScreen(
    onBrowse: () -> Unit,
    onSell: () -> Unit,
) {
    var search by rememberSaveable { mutableStateOf("") }
    var selectedCategory by rememberSaveable { mutableStateOf<VehicleCategory?>(null) }
    val matchingVehicles = remember(search, selectedCategory) {
        demoVehicles.filter { vehicle ->
            val matchesCategory = selectedCategory == null || vehicle.category == selectedCategory
            val query = search.trim()
            val matchesSearch = query.isEmpty() ||
                vehicle.name.contains(query, ignoreCase = true) ||
                vehicle.location.contains(query, ignoreCase = true) ||
                vehicle.category.label.contains(query, ignoreCase = true)
            matchesCategory && matchesSearch
        }
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        val isTablet = maxWidth >= 700.dp
        LazyColumn(
            modifier = Modifier
                .widthIn(max = 1120.dp)
                .fillMaxWidth()
                .align(Alignment.TopCenter),
            contentPadding = PaddingValues(
                horizontal = if (isTablet) 36.dp else 20.dp,
                vertical = 22.dp,
            ),
            verticalArrangement = Arrangement.spacedBy(25.dp),
        ) {
            item {
                HomeHeader(onSell = onSell)
            }
            item {
                SearchField(
                    value = search,
                    onValueChange = { search = it },
                )
            }
            item {
                SampleDataNotice()
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(13.dp)) {
                    SectionHeading(
                        title = "Explore",
                        subtitle = "Find a vehicle that fits your life",
                    )
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        VehicleCategory.entries.forEach { category ->
                            CategoryTile(
                                category = category,
                                selected = selectedCategory == category,
                                onClick = {
                                    selectedCategory =
                                        if (selectedCategory == category) null else category
                                },
                            )
                        }
                    }
                }
            }
            item {
                VehicleSection(
                    title = "Featured selection",
                    subtitle = "A considered collection to explore",
                    vehicles = matchingVehicles.filter { it.featured },
                    isTablet = isTablet,
                    onSeeAll = onBrowse,
                )
            }
            item {
                VehicleSection(
                    title = "Recently added",
                    subtitle = "More from the sample collection",
                    vehicles = matchingVehicles.filterNot { it.featured },
                    isTablet = isTablet,
                    onSeeAll = onBrowse,
                )
            }
            item {
                SellInvitation(onSell = onSell)
            }
        }
    }
}

@Composable
private fun HomeHeader(onSell: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(21.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(13.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = "V",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.tertiary,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Spacer(Modifier.width(11.dp))
                Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                    Text(
                        text = "VEHICLEMARKET",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.15.sp,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        text = "THE ART OF THE RIGHT DRIVE",
                        style = MaterialTheme.typography.labelSmall,
                        letterSpacing = 0.9.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Surface(
                onClick = onSell,
                shape = RoundedCornerShape(50),
                color = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.tertiary,
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    MaterialTheme.colorScheme.outline,
                ),
            ) {
                Text(
                    text = "Sell",
                    modifier = Modifier.padding(horizontal = 17.dp, vertical = 10.dp),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text(
                text = "A better way\nto find your next.",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                text = "Discover considered vehicles, selected for the road ahead.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.widthIn(max = 450.dp),
            )
        }
    }
}

@Composable
private fun SearchField(
    value: String,
    onValueChange: (String) -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(58.dp),
        shape = RoundedCornerShape(17.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline,
        ),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Outlined.Search,
                contentDescription = "Search sample vehicles",
                tint = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.size(21.dp),
            )
            Spacer(Modifier.width(12.dp))
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier
                    .weight(1f)
                    .semantics {
                        contentDescription = "Search sample vehicles by make, model or city"
                    },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                textStyle = MaterialTheme.typography.bodyLarge.copy(
                    color = MaterialTheme.colorScheme.onSurface,
                ),
                decorationBox = { innerTextField ->
                    Box {
                        if (value.isEmpty()) {
                            Text(
                                text = "Make, model or city",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        innerTextField()
                    }
                },
            )
        }
    }
}

@Composable
private fun VehicleSection(
    title: String,
    subtitle: String,
    vehicles: List<DemoVehicle>,
    isTablet: Boolean,
    onSeeAll: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeading(
            title = title,
            subtitle = subtitle,
            trailing = "View all",
            onTrailingClick = onSeeAll,
        )
        if (vehicles.isEmpty()) {
            Text(
                text = "No sample vehicles match this search.",
                modifier = Modifier.padding(vertical = 12.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else if (isTablet) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                vehicles.chunked(2).forEach { rowVehicles ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        rowVehicles.forEach { vehicle ->
                            VehicleCard(
                                vehicle = vehicle,
                                modifier = Modifier.weight(1f),
                            )
                        }
                        if (rowVehicles.size == 1) Spacer(Modifier.weight(1f))
                    }
                }
            }
        } else {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(13.dp),
                contentPadding = PaddingValues(end = 4.dp),
            ) {
                items(vehicles, key = { it.name }) { vehicle ->
                    VehicleCard(
                        vehicle = vehicle,
                        modifier = Modifier.width(286.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun SellInvitation(onSell: () -> Unit) {
    Surface(
        onClick = onSell,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline,
        ),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 18.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "Thinking of selling?",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = "Prepare your vehicle details in the local preview form.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                text = "OPEN",
                modifier = Modifier.padding(start = 16.dp),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.tertiary,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.8.sp,
            )
        }
    }
}
