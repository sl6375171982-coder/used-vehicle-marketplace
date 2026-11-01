package com.example.vehiclemarket.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.animation.animateColorAsState
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

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
    Commercial("Other vehicles"),
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
internal fun SampleDataNotice(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline,
        ),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.tertiary),
            )
            Text(
                text = "Curated preview · sample vehicles, not live listings",
                style = MaterialTheme.typography.labelMedium,
            )
        }
    }
}

@Composable
internal fun SectionHeading(
    title: String,
    subtitle: String? = null,
    trailing: String? = null,
    onTrailingClick: (() -> Unit)? = null,
) {
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
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (trailing != null && onTrailingClick != null) {
            Surface(
                onClick = onTrailingClick,
                shape = RoundedCornerShape(50),
                color = Color.Transparent,
                contentColor = MaterialTheme.colorScheme.tertiary,
            ) {
                Text(
                    text = trailing,
                    modifier = Modifier.padding(start = 10.dp, top = 8.dp, bottom = 8.dp),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
internal fun CategoryTile(
    category: VehicleCategory,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val containerColor by animateColorAsState(
        targetValue = if (selected) {
            MaterialTheme.colorScheme.primaryContainer
        } else {
            MaterialTheme.colorScheme.surface
        },
        label = "category-container",
    )
    val contentColor by animateColorAsState(
        targetValue = if (selected) {
            MaterialTheme.colorScheme.onPrimaryContainer
        } else {
            MaterialTheme.colorScheme.onSurface
        },
        label = "category-content",
    )
    Surface(
        modifier = modifier,
        onClick = onClick,
        shape = RoundedCornerShape(18.dp),
        color = containerColor,
        contentColor = contentColor,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (selected) MaterialTheme.colorScheme.tertiary.copy(alpha = 0.6f)
            else MaterialTheme.colorScheme.outline,
        ),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 15.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(11.dp),
        ) {
            VehicleGlyph(
                category = category,
                modifier = Modifier.size(27.dp),
                tint = MaterialTheme.colorScheme.tertiary,
            )
            Text(
                text = category.label,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
            )
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
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.86f),
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column {
            VehicleArtwork(vehicle)
            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 15.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Text(
                    text = vehicle.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
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
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.tertiary,
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                ) {
                    Icon(
                        imageVector = Icons.Outlined.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(15.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
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
            .height(176.dp)
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.surfaceVariant,
                        MaterialTheme.colorScheme.surface,
                    ),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size(148.dp)
                .align(Alignment.CenterEnd)
                .background(
                    MaterialTheme.colorScheme.tertiary.copy(alpha = 0.045f),
                    CircleShape,
                ),
        )
        VehicleGlyph(
            category = vehicle.category,
            modifier = Modifier.size(width = 116.dp, height = 86.dp),
            tint = MaterialTheme.colorScheme.tertiary,
        )
        Surface(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(12.dp),
            shape = RoundedCornerShape(50),
            color = MaterialTheme.colorScheme.background.copy(alpha = 0.88f),
            contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
        ) {
            Text(
                text = "ILLUSTRATION",
                modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.8.sp,
            )
        }
    }
}

@Composable
private fun VehicleGlyph(
    category: VehicleCategory,
    modifier: Modifier = Modifier,
    tint: Color,
) {
    Canvas(modifier = modifier) {
        val factor = minOf(size.width / 64f, size.height / 64f)
        val left = (size.width - 64f * factor) / 2f
        val top = (size.height - 64f * factor) / 2f
        val outline = Stroke(width = 3.2f, cap = StrokeCap.Round)
        translate(left, top) {
            scale(factor, factor, pivot = Offset.Zero) {
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
                        drawPath(body, tint.copy(alpha = 0.14f))
                        drawPath(body, tint, style = outline)
                        drawLine(tint, Offset(21f, 25f), Offset(47f, 25f), 2.8f, StrokeCap.Round)
                        drawLine(tint, Offset(35f, 15f), Offset(35f, 25f), 2.8f, StrokeCap.Round)
                        drawCircle(tint, 5f, Offset(18f, 43f), style = outline)
                        drawCircle(tint, 5f, Offset(47f, 43f), style = outline)
                    }

                    VehicleCategory.Bikes -> {
                        drawCircle(tint, 9f, Offset(14f, 43f), style = outline)
                        drawCircle(tint, 9f, Offset(50f, 43f), style = outline)
                        drawLine(tint, Offset(14f, 43f), Offset(27f, 28f), 3.2f, StrokeCap.Round)
                        drawLine(tint, Offset(27f, 28f), Offset(37f, 43f), 3.2f, StrokeCap.Round)
                        drawLine(tint, Offset(37f, 43f), Offset(50f, 43f), 3.2f, StrokeCap.Round)
                        drawLine(tint, Offset(27f, 28f), Offset(43f, 28f), 3.2f, StrokeCap.Round)
                        drawLine(tint, Offset(43f, 28f), Offset(50f, 43f), 3.2f, StrokeCap.Round)
                        drawLine(tint, Offset(25f, 25f), Offset(31f, 25f), 3.2f, StrokeCap.Round)
                        drawLine(tint, Offset(43f, 28f), Offset(48f, 21f), 3.2f, StrokeCap.Round)
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
                        drawPath(truck, tint.copy(alpha = 0.14f))
                        drawPath(truck, tint, style = outline)
                        drawLine(tint, Offset(39f, 28f), Offset(39f, 43f), 2.8f, StrokeCap.Round)
                        drawCircle(tint, 5f, Offset(19f, 44f), style = outline)
                        drawCircle(tint, 5f, Offset(48f, 44f), style = outline)
                    }
                }
            }
        }
    }
}
