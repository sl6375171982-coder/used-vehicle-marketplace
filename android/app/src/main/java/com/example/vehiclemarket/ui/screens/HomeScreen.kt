package com.example.vehiclemarket.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
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
import androidx.compose.material.icons.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

internal data class DemoVehicle(
    val name: String,
    val details: String,
    val price: String,
    val location: String,
    val category: VehicleCategory,
    val featured: Boolean = false,
)

internal enum class VehicleCategory(val label: String) {
    Cars("Cars"),
    Bikes("Bikes"),
    Commercial("Commercial"),
}

internal val demoVehicles = listOf(
    DemoVehicle(
        name = "Hyundai Creta SX",
        details = "2022  ·  28,400 km",
        price = "₹12.8 lakh",
        location = "Pune, Maharashtra",
        category = VehicleCategory.Cars,
        featured = true,
    ),
    DemoVehicle(
        name = "Royal Enfield Classic 350",
        details = "2023  ·  6,200 km",
        price = "₹1.72 lakh",
        location = "Bengaluru, Karnataka",
        category = VehicleCategory.Bikes,
        featured = true,
    ),
    DemoVehicle(
        name = "Maruti Suzuki Baleno",
        details = "2021  ·  34,000 km",
        price = "₹6.45 lakh",
        location = "Mumbai, Maharashtra",
        category = VehicleCategory.Cars,
    ),
    DemoVehicle(
        name = "Tata Ace Gold",
        details = "2020  ·  41,500 km",
        price = "₹4.1 lakh",
        location = "Hyderabad, Telangana",
        category = VehicleCategory.Commercial,
    ),
    DemoVehicle(
        name = "Honda Activa 6G",
        details = "2022  ·  9,100 km",
        price = "₹72,000",
        location = "Jaipur, Rajasthan",
        category = VehicleCategory.Bikes,
    ),
)

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
    val featuredVehicles = matchingVehicles.filter { it.featured }
    val latestVehicles = matchingVehicles.filterNot { it.featured }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        val isTablet = maxWidth >= 700.dp
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.TopCenter,
        ) {
            LazyColumn(
                modifier = Modifier
                    .widthIn(max = 1120.dp)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(
                    horizontal = if (isTablet) 36.dp else 20.dp,
                    vertical = 22.dp,
                ),
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                item {
                    DashboardHeader(onSell = onSell)
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
                    CategorySection(
                        selectedCategory = selectedCategory,
                        onCategorySelected = {
                            selectedCategory = if (selectedCategory == it) null else it
                        },
                    )
                }
                item {
                    VehicleSection(
                        title = "Featured vehicles",
                        subtitle = "A few picks to explore",
                        vehicles = featuredVehicles,
                        isTablet = isTablet,
                        onSeeAll = onBrowse,
                    )
                }
                item {
                    VehicleSection(
                        title = "Latest listings",
                        subtitle = "More from the sample collection",
                        vehicles = latestVehicles,
                        isTablet = isTablet,
                        onSeeAll = onBrowse,
                    )
                }
            }
        }
    }
}

@Composable
private fun DashboardHeader(onSell: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(MaterialTheme.colorScheme.primary),
                    contentAlignment = Alignment.Center,
                ) {
                    VehicleGlyph(
                        category = VehicleCategory.Cars,
                        modifier = Modifier.size(width = 30.dp, height = 22.dp),
                        tint = MaterialTheme.colorScheme.onPrimary,
                    )
                }
                Spacer(Modifier.width(11.dp))
                Column {
                    Text(
                        text = "VEHICLEMARKET",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        text = "Your next ride, made simple",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Surface(
                onClick = onSell,
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.tertiary,
                contentColor = MaterialTheme.colorScheme.onTertiary,
            ) {
                Text(
                    text = "Sell a vehicle",
                    modifier = Modifier.padding(horizontal = 15.dp, vertical = 11.dp),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text(
                text = "Find your next\nfavorite drive.",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                text = "Explore a handpicked preview of the marketplace.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
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
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 2.dp,
        border = CardDefaults.outlinedCardBorder(),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Outlined.Search,
                contentDescription = "Search sample vehicles",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(22.dp),
            )
            Spacer(Modifier.width(12.dp))
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                textStyle = MaterialTheme.typography.bodyLarge.copy(
                    color = MaterialTheme.colorScheme.onSurface,
                ),
                decorationBox = { innerTextField ->
                    Box {
                        if (value.isEmpty()) {
                            Text(
                                text = "Search make, model or city",
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
private fun SampleDataNotice() {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.secondaryContainer,
        contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(
                imageVector = Icons.Outlined.Info,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
            )
            Text(
                text = "Sample vehicles for preview only — these are not live listings.",
                style = MaterialTheme.typography.labelMedium,
            )
        }
    }
}

@Composable
private fun CategorySection(
    selectedCategory: VehicleCategory?,
    onCategorySelected: (VehicleCategory) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(13.dp)) {
        Text(
            text = "Browse by category",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            VehicleCategory.entries.forEach { category ->
                val selected = selectedCategory == category
                Surface(
                    onClick = { onCategorySelected(category) },
                    shape = RoundedCornerShape(18.dp),
                    color = if (selected) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.surface
                    },
                    contentColor = if (selected) {
                        MaterialTheme.colorScheme.onPrimary
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    },
                    shadowElevation = if (selected) 1.dp else 0.dp,
                    border = if (selected) null else CardDefaults.outlinedCardBorder(),
                ) {
                    Column(
                        modifier = Modifier
                            .width(112.dp)
                            .padding(horizontal = 12.dp, vertical = 15.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        VehicleGlyph(
                            category = category,
                            modifier = Modifier.size(24.dp),
                            tint = MaterialTheme.colorScheme.tertiary,
                        )
                        Text(
                            text = when (category) {
                                VehicleCategory.Commercial -> "Commercial\nvehicles"
                                else -> category.label
                            },
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
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
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Surface(
                onClick = onSeeAll,
                color = Color.Transparent,
                contentColor = MaterialTheme.colorScheme.primary,
                shape = CircleShape,
            ) {
                Row(
                    modifier = Modifier.padding(start = 8.dp, top = 7.dp, bottom = 7.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    Text(
                        text = "See all",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                    )
                    Icon(
                        imageVector = Icons.Outlined.ArrowForward,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                    )
                }
            }
        }

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
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = PaddingValues(end = 4.dp),
            ) {
                items(vehicles, key = { it.name }) { vehicle ->
                    VehicleCard(
                        vehicle = vehicle,
                        modifier = Modifier.width(278.dp),
                    )
                }
            }
        }
    }
}

@Composable
internal fun VehicleCard(
    vehicle: DemoVehicle,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column {
            VehicleArtwork(vehicle = vehicle)
            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Text(
                    text = vehicle.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = vehicle.details,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = vehicle.price,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary,
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(
                        imageVector = Icons.Outlined.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(15.dp),
                        tint = MaterialTheme.colorScheme.tertiary,
                    )
                    Text(
                        text = vehicle.location,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

@Composable
private fun VehicleArtwork(vehicle: DemoVehicle) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(158.dp)
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primaryContainer,
                        MaterialTheme.colorScheme.surfaceVariant,
                    ),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size(122.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.48f))
                .align(Alignment.CenterEnd),
        )
        VehicleGlyph(
            category = vehicle.category,
            modifier = Modifier.size(width = 92.dp, height = 72.dp),
            tint = MaterialTheme.colorScheme.primary,
        )
        Surface(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(12.dp),
            shape = RoundedCornerShape(50),
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
            contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
        ) {
            Text(
                text = "SAMPLE PHOTO",
                modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
            )
        }
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(12.dp)
                .size(8.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.tertiary),
        )
    }
}

@Composable
private fun VehicleGlyph(
    category: VehicleCategory,
    modifier: Modifier = Modifier,
    tint: Color,
) {
    Canvas(modifier = modifier) {
        val scaleFactor = minOf(size.width / 64f, size.height / 64f)
        val left = (size.width - 64f * scaleFactor) / 2f
        val top = (size.height - 64f * scaleFactor) / 2f
        val outline = Stroke(width = 3.5f, cap = StrokeCap.Round)

        translate(left, top) {
            scale(scaleFactor, scaleFactor, pivot = Offset.Zero) {
                when (category) {
                    VehicleCategory.Cars -> {
                        val body = Path().apply {
                            moveTo(7f, 39f)
                            lineTo(11f, 29f)
                            quadraticTo(12f, 26f, 16f, 25f)
                            lineTo(23f, 15f)
                            quadraticTo(24f, 13f, 28f, 13f)
                            lineTo(43f, 13f)
                            quadraticTo(47f, 13f, 49f, 17f)
                            lineTo(54f, 28f)
                            quadraticTo(58f, 30f, 58f, 35f)
                            lineTo(58f, 43f)
                            lineTo(7f, 43f)
                            close()
                        }
                        drawPath(body, tint, style = outline)
                        drawLine(tint, Offset(21f, 25f), Offset(47f, 25f), 3f, StrokeCap.Round)
                        drawLine(tint, Offset(35f, 15f), Offset(35f, 25f), 3f, StrokeCap.Round)
                        drawCircle(tint, 5f, Offset(18f, 43f), style = outline)
                        drawCircle(tint, 5f, Offset(47f, 43f), style = outline)
                    }

                    VehicleCategory.Bikes -> {
                        drawCircle(tint, 9f, Offset(14f, 43f), style = outline)
                        drawCircle(tint, 9f, Offset(50f, 43f), style = outline)
                        drawLine(tint, Offset(14f, 43f), Offset(27f, 28f), 3.5f, StrokeCap.Round)
                        drawLine(tint, Offset(27f, 28f), Offset(37f, 43f), 3.5f, StrokeCap.Round)
                        drawLine(tint, Offset(37f, 43f), Offset(50f, 43f), 3.5f, StrokeCap.Round)
                        drawLine(tint, Offset(27f, 28f), Offset(43f, 28f), 3.5f, StrokeCap.Round)
                        drawLine(tint, Offset(43f, 28f), Offset(50f, 43f), 3.5f, StrokeCap.Round)
                        drawLine(tint, Offset(25f, 25f), Offset(31f, 25f), 3.5f, StrokeCap.Round)
                        drawLine(tint, Offset(43f, 28f), Offset(48f, 21f), 3.5f, StrokeCap.Round)
                        drawLine(tint, Offset(46f, 21f), Offset(53f, 21f), 3.5f, StrokeCap.Round)
                    }

                    VehicleCategory.Commercial -> {
                        val truck = Path().apply {
                            moveTo(6f, 18f)
                            lineTo(39f, 18f)
                            lineTo(39f, 28f)
                            lineTo(50f, 28f)
                            lineTo(58f, 37f)
                            lineTo(58f, 44f)
                            lineTo(6f, 44f)
                            close()
                        }
                        drawPath(truck, tint, style = outline)
                        drawLine(tint, Offset(39f, 28f), Offset(39f, 43f), 3f, StrokeCap.Round)
                        drawLine(tint, Offset(45f, 31f), Offset(50f, 31f), 3f, StrokeCap.Round)
                        drawCircle(tint, 5f, Offset(19f, 44f), style = outline)
                        drawCircle(tint, 5f, Offset(48f, 44f), style = outline)
                    }
                }
            }
        }
    }
}
