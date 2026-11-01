package com.example.vehiclemarket.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import kotlinx.coroutines.launch
import java.io.IOException
import java.util.Calendar

@Composable
fun SellScreen(
    websiteOrigin: String,
    onOpenSettings: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var vehicleType by rememberSaveable { mutableStateOf("") }
    var brand by rememberSaveable { mutableStateOf("") }
    var model by rememberSaveable { mutableStateOf("") }
    var manufacturingYear by rememberSaveable { mutableStateOf("") }
    var kilometersDriven by rememberSaveable { mutableStateOf("") }
    var fuelType by rememberSaveable { mutableStateOf("") }
    var expectedPrice by rememberSaveable { mutableStateOf("") }
    var city by rememberSaveable { mutableStateOf("") }
    var state by rememberSaveable { mutableStateOf("") }
    var sellerName by rememberSaveable { mutableStateOf("") }
    var mobileNumber by rememberSaveable { mutableStateOf("") }
    var photos by remember { mutableStateOf<List<VehiclePhotoUpload>>(emptyList()) }
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var messageIsError by remember { mutableStateOf(false) }

    val photoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickMultipleVisualMedia(MAX_VEHICLE_PHOTOS),
    ) { selectedUris ->
        if (selectedUris.isEmpty()) return@rememberLauncherForActivityResult
        if (photos.size + selectedUris.size > MAX_VEHICLE_PHOTOS) {
            message = "Error: Choose no more than $MAX_VEHICLE_PHOTOS photos."
            messageIsError = true
            return@rememberLauncherForActivityResult
        }

        busy = true
        message = null
        scope.launch {
            try {
                val addedPhotos = selectedUris.mapIndexed { index, uri ->
                    readVehiclePhoto(
                        contentResolver = context.contentResolver,
                        uri = uri,
                        sequence = photos.size + index + 1,
                    )
                }
                val combinedSize = (photos + addedPhotos).sumOf { it.bytes.size.toLong() }
                if (combinedSize > MAX_TOTAL_VEHICLE_PHOTO_BYTES) {
                    throw VehicleSubmissionException(
                        "Error: The combined photo size must not exceed 20 MB.",
                    )
                }
                photos = photos + addedPhotos
            } catch (error: VehicleSubmissionException) {
                message = error.message
                messageIsError = true
            } catch (error: IOException) {
                message = "Error: A selected photo could not be read. ${error.localizedMessage.orEmpty()}".trim()
                messageIsError = true
            } finally {
                busy = false
            }
        }
    }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .widthIn(max = 760.dp)
                .fillMaxWidth()
                .padding(horizontal = if (maxWidth >= 760.dp) 28.dp else 20.dp)
                .align(androidx.compose.ui.Alignment.TopCenter),
            contentPadding = PaddingValues(top = 25.dp, bottom = 34.dp),
            verticalArrangement = Arrangement.spacedBy(19.dp),
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Sell your vehicle",
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        text = "Share your vehicle details with the VehicleMarket team.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            item {
                WebsiteConnectionNotice(
                    websiteOrigin = websiteOrigin,
                    onOpenSettings = onOpenSettings,
                )
            }
            item {
                FormSection(
                    number = "01",
                    title = "Vehicle Details",
                    subtitle = "गाड़ी की जानकारी और तस्वीरें साझा करें।",
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(15.dp)) {
                        PhotoPickerSection(
                            photos = photos,
                            enabled = !busy,
                            onChoose = {
                                photoPicker.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                                )
                            },
                            onRemove = { photo ->
                                photos = photos.filterNot { it == photo }
                                message = null
                            },
                        )
                        DropdownField(
                            label = "Vehicle Type",
                            value = vehicleType,
                            options = vehicleTypes,
                            placeholder = "Select Vehicle",
                            enabled = !busy,
                            onValueChange = { vehicleType = it },
                        )
                        TextFormField(
                            label = "Brand",
                            value = brand,
                            placeholder = "e.g. Maruti",
                            enabled = !busy,
                            onValueChange = { brand = it.take(100) },
                        )
                        TextFormField(
                            label = "Model",
                            value = model,
                            placeholder = "e.g. Swift",
                            enabled = !busy,
                            onValueChange = { model = it.take(100) },
                        )
                        TextFormField(
                            label = "Manufacturing Year",
                            value = manufacturingYear,
                            placeholder = "e.g. 2022",
                            enabled = !busy,
                            keyboardType = KeyboardType.Number,
                            onValueChange = { manufacturingYear = it.filter(Char::isDigit).take(4) },
                        )
                        TextFormField(
                            label = "Kilometers Driven",
                            value = kilometersDriven,
                            placeholder = "e.g. 28000",
                            enabled = !busy,
                            keyboardType = KeyboardType.Number,
                            onValueChange = { kilometersDriven = it.filter(Char::isDigit).take(8) },
                        )
                        DropdownField(
                            label = "Fuel Type",
                            value = fuelType,
                            options = fuelTypes,
                            placeholder = "Select Fuel",
                            enabled = !busy,
                            onValueChange = { fuelType = it },
                        )
                        TextFormField(
                            label = "Expected Price (₹)",
                            value = expectedPrice,
                            placeholder = "e.g. 850000",
                            enabled = !busy,
                            keyboardType = KeyboardType.Decimal,
                            onValueChange = {
                                expectedPrice = it.filter { character ->
                                    character.isDigit() || character == '.'
                                }.take(14)
                            },
                        )
                    }
                }
            }
            item {
                FormSection(
                    number = "02",
                    title = "Seller Details",
                    subtitle = "खरीदारों के संपर्क के लिए अपनी जानकारी दें।",
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(15.dp)) {
                        TextFormField(
                            label = "City",
                            value = city,
                            placeholder = "e.g. Jodhpur",
                            enabled = !busy,
                            onValueChange = { city = it.take(100) },
                        )
                        TextFormField(
                            label = "State",
                            value = state,
                            placeholder = "e.g. Rajasthan",
                            enabled = !busy,
                            onValueChange = { state = it.take(100) },
                        )
                        TextFormField(
                            label = "Seller Name",
                            value = sellerName,
                            enabled = !busy,
                            onValueChange = { sellerName = it.take(100) },
                        )
                        TextFormField(
                            label = "Mobile Number",
                            value = mobileNumber,
                            placeholder = "10 digit mobile number",
                            enabled = !busy,
                            keyboardType = KeyboardType.Number,
                            onValueChange = { mobileNumber = it.filter(Char::isDigit).take(10) },
                        )
                        Text(
                            text = "Your mobile number is shared with authorized marketplace administrators and is not shown on public listings.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = {
                            val validationError = validateSubmission(
                                vehicleType = vehicleType,
                                brand = brand,
                                model = model,
                                manufacturingYear = manufacturingYear,
                                kilometersDriven = kilometersDriven,
                                fuelType = fuelType,
                                expectedPrice = expectedPrice,
                                city = city,
                                state = state,
                                sellerName = sellerName,
                                mobileNumber = mobileNumber,
                                photoCount = photos.size,
                                photoBytes = photos.sumOf { it.bytes.size.toLong() },
                            )
                            if (validationError != null) {
                                message = "Error: $validationError"
                                messageIsError = true
                                return@Button
                            }
                            busy = true
                            message = null
                            scope.launch {
                                try {
                                    submitVehicle(
                                        websiteOrigin = websiteOrigin,
                                        submission = VehicleSubmission(
                                            vehicleType = vehicleType,
                                            brand = brand.trim(),
                                            model = model.trim(),
                                            manufacturingYear = manufacturingYear,
                                            kilometersDriven = kilometersDriven,
                                            fuelType = fuelType,
                                            expectedPrice = expectedPrice,
                                            city = city.trim(),
                                            state = state.trim(),
                                            sellerName = sellerName.trim(),
                                            mobileNumber = mobileNumber,
                                        ),
                                        photos = photos,
                                    )
                                    message = "Your vehicle was submitted for review. Its status is pending approval."
                                    messageIsError = false
                                    vehicleType = ""
                                    brand = ""
                                    model = ""
                                    manufacturingYear = ""
                                    kilometersDriven = ""
                                    fuelType = ""
                                    expectedPrice = ""
                                    city = ""
                                    state = ""
                                    sellerName = ""
                                    mobileNumber = ""
                                    photos = emptyList()
                                } catch (error: VehicleSubmissionException) {
                                    message = "Error: ${error.message ?: "Vehicle submission failed."}"
                                    messageIsError = true
                                } finally {
                                    busy = false
                                }
                            }
                        },
                        enabled = !busy && validateWebsiteOrigin(websiteOrigin) != null,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(15.dp),
                        contentPadding = PaddingValues(vertical = 16.dp),
                    ) {
                        Text(
                            text = when {
                                busy -> "Preparing or submitting..."
                                else -> "Submit Vehicle"
                            },
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                    if (message != null) {
                        Text(
                            text = message.orEmpty(),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(13.dp))
                                .padding(horizontal = 4.dp, vertical = 5.dp),
                            color = if (messageIsError) {
                                MaterialTheme.colorScheme.error
                            } else {
                                MaterialTheme.colorScheme.tertiary
                            },
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                    if (validateWebsiteOrigin(websiteOrigin) == null) {
                        Text(
                            text = "Add your public HTTPS website address in Profile settings to enable secure submission.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun WebsiteConnectionNotice(
    websiteOrigin: String,
    onOpenSettings: () -> Unit,
) {
    if (validateWebsiteOrigin(websiteOrigin) != null) return
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(17.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Row(
            modifier = Modifier.padding(15.dp),
            horizontalArrangement = Arrangement.spacedBy(11.dp),
        ) {
            Icon(
                imageVector = Icons.Outlined.Info,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.tertiary,
            )
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "Connect to VehicleMarket",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = "Set the public website URL in Profile settings before submitting.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                androidx.compose.material3.TextButton(
                    onClick = onOpenSettings,
                    contentPadding = PaddingValues(0.dp),
                ) {
                    Text("Open Profile settings")
                }
            }
        }
    }
}

@Composable
private fun FormSection(
    number: String,
    title: String,
    subtitle: String,
    content: @Composable () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(17.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(13.dp),
            ) {
                Text(
                    text = number,
                    modifier = Modifier.padding(top = 2.dp),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.tertiary,
                    fontWeight = FontWeight.Bold,
                )
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            content()
        }
    }
}

@Composable
private fun PhotoPickerSection(
    photos: List<VehiclePhotoUpload>,
    enabled: Boolean,
    onChoose: () -> Unit,
    onRemove: (VehiclePhotoUpload) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        OutlinedButton(
            onClick = onChoose,
            enabled = enabled && photos.size < MAX_VEHICLE_PHOTOS,
            modifier = Modifier
                .fillMaxWidth()
                .height(112.dp),
            shape = RoundedCornerShape(16.dp),
            contentPadding = PaddingValues(12.dp),
        ) {
            Column(
                horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.AddCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.tertiary,
                )
                Text(
                    text = if (photos.isEmpty()) "Choose vehicle photos" else "Add more photos",
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = "JPEG, PNG or WebP · up to 8 · 5 MB each",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Text(
            text = "Photos are optional. Combined size limit: 20 MB.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        if (photos.isNotEmpty()) {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(photos.size) { index ->
                    val photo = photos[index]
                    Card(
                        shape = RoundedCornerShape(13.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                        ),
                    ) {
                        Column(modifier = Modifier.size(width = 140.dp, height = 145.dp)) {
                            androidx.compose.foundation.layout.Box {
                                AsyncImage(
                                    model = photo.uri,
                                    contentDescription = photo.name,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(106.dp)
                                        .clip(RoundedCornerShape(topStart = 13.dp, topEnd = 13.dp)),
                                    contentScale = ContentScale.Crop,
                                )
                                IconButton(
                                    onClick = { onRemove(photo) },
                                    enabled = enabled,
                                    modifier = Modifier
                                        .padding(5.dp)
                                        .size(32.dp)
                                        .clip(RoundedCornerShape(10.dp)),
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.Close,
                                        contentDescription = "Remove ${photo.name}",
                                        tint = MaterialTheme.colorScheme.onSurface,
                                    )
                                }
                            }
                            Text(
                                text = photo.name,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 7.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DropdownField(
    label: String,
    value: String,
    options: List<String>,
    placeholder: String,
    enabled: Boolean,
    onValueChange: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = it && enabled },
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth(),
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            readOnly = true,
            enabled = enabled,
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            trailingIcon = {
                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
            },
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        onValueChange(option)
                        expanded = false
                    },
                )
            }
        }
    }
}

@Composable
private fun TextFormField(
    label: String,
    value: String,
    placeholder: String = "",
    enabled: Boolean,
    keyboardType: KeyboardType = KeyboardType.Text,
    onValueChange: (String) -> Unit,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.fillMaxWidth(),
        label = { Text(label) },
        placeholder = { if (placeholder.isNotEmpty()) Text(placeholder) },
        enabled = enabled,
        singleLine = true,
        shape = RoundedCornerShape(14.dp),
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
    )
}

private fun validateSubmission(
    vehicleType: String,
    brand: String,
    model: String,
    manufacturingYear: String,
    kilometersDriven: String,
    fuelType: String,
    expectedPrice: String,
    city: String,
    state: String,
    sellerName: String,
    mobileNumber: String,
    photoCount: Int,
    photoBytes: Long,
): String? {
    if (vehicleType !in vehicleTypes) return "Select a valid vehicle type."
    if (brand.isBlank() || brand.length > 100) return "Brand is required and must be at most 100 characters."
    if (model.isBlank() || model.length > 100) return "Model is required and must be at most 100 characters."
    val currentYear = Calendar.getInstance().get(Calendar.YEAR)
    if (!manufacturingYear.matches(Regex("\\d+"))) {
        return "Manufacturing year must be a whole number."
    }
    val year = manufacturingYear.toIntOrNull()
        ?: return "Manufacturing year must be between 1900 and $currentYear."
    if (year !in 1900..currentYear) return "Manufacturing year must be between 1900 and $currentYear."
    if (!kilometersDriven.matches(Regex("\\d+"))) {
        return "Kilometers driven must be a whole number."
    }
    val kilometers = kilometersDriven.toLongOrNull()
        ?: return "Kilometers driven must be between 0 and 10000000."
    if (kilometers !in 0..10_000_000) {
        return "Kilometers driven must be between 0 and 10000000."
    }
    if (fuelType !in fuelTypes) return "Select a valid fuel type."
    if (!expectedPrice.matches(Regex("\\d+(?:\\.\\d{1,2})?"))) {
        return "Expected price must be a positive amount with at most two decimal places."
    }
    val price = expectedPrice.toBigDecimalOrNull()
        ?: return "Expected price is outside the permitted range."
    if (price <= java.math.BigDecimal.ZERO || price > java.math.BigDecimal("99999999999")) {
        return "Expected price is outside the permitted range."
    }
    if (city.isBlank() || city.length > 100) return "City is required and must be at most 100 characters."
    if (state.isBlank() || state.length > 100) return "State is required and must be at most 100 characters."
    if (sellerName.isBlank() || sellerName.length > 100) {
        return "Seller name is required and must be at most 100 characters."
    }
    if (!mobileNumber.matches(Regex("\\d{10}"))) {
        return "Seller phone must contain exactly 10 digits."
    }
    if (photoCount > MAX_VEHICLE_PHOTOS) {
        return "Upload no more than $MAX_VEHICLE_PHOTOS photos at once."
    }
    if (photoBytes > MAX_TOTAL_VEHICLE_PHOTO_BYTES) {
        return "The combined photo size must not exceed 20 MB."
    }
    return null
}
