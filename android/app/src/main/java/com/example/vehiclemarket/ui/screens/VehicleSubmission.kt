package com.example.vehiclemarket.ui.screens

import android.content.ContentResolver
import android.net.Uri
import android.provider.OpenableColumns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.net.URISyntaxException
import java.net.URL
import java.util.UUID

internal const val MAX_VEHICLE_PHOTOS = 8
internal const val MAX_VEHICLE_PHOTO_BYTES = 5 * 1024 * 1024
internal const val MAX_TOTAL_VEHICLE_PHOTO_BYTES = 20 * 1024 * 1024

internal val vehicleTypes = listOf(
    "Car",
    "Bike",
    "Scooter",
    "Truck",
    "Bus",
    "Pickup",
    "Commercial",
    "Other",
)

internal val fuelTypes = listOf("Petrol", "Diesel", "CNG", "Electric", "Hybrid", "Other")

internal data class VehiclePhotoUpload(
    val uri: Uri,
    val name: String,
    val contentType: String,
    val bytes: ByteArray,
)

internal data class VehicleSubmission(
    val vehicleType: String,
    val brand: String,
    val model: String,
    val manufacturingYear: String,
    val kilometersDriven: String,
    val fuelType: String,
    val expectedPrice: String,
    val city: String,
    val state: String,
    val sellerName: String,
    val mobileNumber: String,
)

internal data class VehicleSubmissionReceipt(
    val vehicleId: String,
    val photoCount: Int,
)

internal class VehicleSubmissionException(message: String) : Exception(message)

internal fun validateWebsiteOrigin(value: String): String? {
    val parsed = try {
        URI(value.trim())
    } catch (_: IllegalArgumentException) {
        return null
    } catch (_: URISyntaxException) {
        return null
    }

    if (
        parsed.scheme != "https" ||
        parsed.host.isNullOrBlank() ||
        parsed.userInfo != null ||
        (parsed.path.orEmpty().isNotEmpty() && parsed.path != "/") ||
        parsed.query != null ||
        parsed.fragment != null
    ) {
        return null
    }
    return parsed.toString().trimEnd('/')
}

internal suspend fun readVehiclePhoto(
    contentResolver: ContentResolver,
    uri: Uri,
    sequence: Int,
): VehiclePhotoUpload = withContext(Dispatchers.IO) {
    val contentType = contentResolver.getType(uri)?.lowercase()
    if (contentType == null || contentType !in setOf("image/jpeg", "image/png", "image/webp")) {
        throw VehicleSubmissionException("Error: Photos must be JPEG, PNG, or WebP images.")
    }

    val bytes = contentResolver.openInputStream(uri)?.use { input ->
        val output = ByteArrayOutputStream()
        val buffer = ByteArray(8192)
        var total = 0
        while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            total += read
            if (total > MAX_VEHICLE_PHOTO_BYTES) {
                throw VehicleSubmissionException("Error: Each photo must be between 1 byte and 5 MB.")
            }
            output.write(buffer, 0, read)
        }
        output.toByteArray()
    } ?: throw IOException("The selected photo could not be opened.")

    if (bytes.isEmpty()) {
        throw VehicleSubmissionException("Error: Each photo must be between 1 byte and 5 MB.")
    }
    val displayName = contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
        ?.use { cursor ->
            if (cursor.moveToFirst()) {
                cursor.getString(cursor.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME))
            } else {
                null
            }
        }
        .orEmpty()
        .ifBlank { "vehicle-photo-$sequence" }
        .replace(Regex("[^A-Za-z0-9._-]"), "_")

    VehiclePhotoUpload(
        uri = uri,
        name = displayName,
        contentType = contentType,
        bytes = bytes,
    )
}

internal suspend fun submitVehicle(
    websiteOrigin: String,
    submission: VehicleSubmission,
    photos: List<VehiclePhotoUpload>,
): VehicleSubmissionReceipt = withContext(Dispatchers.IO) {
    val origin = validateWebsiteOrigin(websiteOrigin)
        ?: throw VehicleSubmissionException("Set a valid HTTPS website address in Profile settings.")
    val boundary = "VehicleMarket-${UUID.randomUUID()}"
    val connection = URL("$origin/api/vehicles").openConnection() as HttpURLConnection
    connection.requestMethod = "POST"
    connection.connectTimeout = 20_000
    connection.readTimeout = 60_000
    connection.doOutput = true
    connection.setRequestProperty("Accept", "application/json")
    connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
    connection.setChunkedStreamingMode(16 * 1024)

    try {
        connection.outputStream.buffered().use { output ->
            val fields = linkedMapOf(
                "vehicle_type" to submission.vehicleType,
                "brand" to submission.brand,
                "model" to submission.model,
                "manufacturing_year" to submission.manufacturingYear,
                "km_driven" to submission.kilometersDriven,
                "fuel_type" to submission.fuelType,
                "expected_price" to submission.expectedPrice,
                "city" to submission.city,
                "state" to submission.state,
                "seller_name" to submission.sellerName,
                "seller_phone" to submission.mobileNumber,
            )
            fields.forEach { (name, value) ->
                writeTextPart(output, boundary, name, value)
            }
            photos.forEach { photo ->
                writePhotoPart(output, boundary, photo)
            }
            output.write("--$boundary--\r\n".toByteArray(Charsets.UTF_8))
            output.flush()
        }

        val statusCode = connection.responseCode
        val responseStream = if (statusCode in 200..299) {
            connection.inputStream
        } else {
            connection.errorStream
        }
        val responseBody = responseStream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
        val response = try {
            JSONObject(responseBody)
        } catch (_: JSONException) {
            throw VehicleSubmissionException(
                if (statusCode in 200..299) {
                    "The server returned an invalid response. Submission could not be confirmed."
                } else {
                    "Vehicle submission failed with HTTP $statusCode."
                },
            )
        }

        if (statusCode !in 200..299) {
            throw VehicleSubmissionException(serverErrorMessage(response, statusCode))
        }

        val vehicleId = response.optString("vehicleId")
        val photoCount = response.optInt("photoCount", -1)
        if (vehicleId.isBlank() || photoCount != photos.size) {
            throw VehicleSubmissionException(
                "The server response did not confirm the vehicle and all selected photos.",
            )
        }
        VehicleSubmissionReceipt(vehicleId = vehicleId, photoCount = photoCount)
    } catch (error: IOException) {
        throw VehicleSubmissionException(
            "Submission could not be confirmed. ${error.localizedMessage ?: "Network error."}",
        )
    } finally {
        connection.disconnect()
    }
}

private fun writeTextPart(
    output: java.io.OutputStream,
    boundary: String,
    name: String,
    value: String,
) {
    output.write("--$boundary\r\n".toByteArray(Charsets.UTF_8))
    output.write("Content-Disposition: form-data; name=\"$name\"\r\n\r\n".toByteArray(Charsets.UTF_8))
    output.write(value.toByteArray(Charsets.UTF_8))
    output.write("\r\n".toByteArray(Charsets.UTF_8))
}

private fun writePhotoPart(
    output: java.io.OutputStream,
    boundary: String,
    photo: VehiclePhotoUpload,
) {
    val extension = when (photo.contentType) {
        "image/jpeg" -> "jpg"
        "image/png" -> "png"
        else -> "webp"
    }
    val safeName = photo.name.substringBeforeLast('.', photo.name)
    output.write("--$boundary\r\n".toByteArray(Charsets.UTF_8))
    output.write(
        "Content-Disposition: form-data; name=\"photos\"; filename=\"$safeName.$extension\"\r\n".toByteArray(
            Charsets.UTF_8,
        ),
    )
    output.write("Content-Type: ${photo.contentType}\r\n\r\n".toByteArray(Charsets.UTF_8))
    output.write(photo.bytes)
    output.write("\r\n".toByteArray(Charsets.UTF_8))
}

private fun serverErrorMessage(response: JSONObject, statusCode: Int): String {
    val error = response.optString("error").ifBlank { "Vehicle submission failed." }
    val detail = response.optJSONObject("details")?.optString("message").orEmpty()
    val cleanupFailures = response.optJSONObject("details")
        ?.optJSONArray("cleanupFailures")
    val cleanup = if (cleanupFailures == null || cleanupFailures.length() == 0) {
        ""
    } else {
        buildString {
            append(" Cleanup issues: ")
            for (index in 0 until cleanupFailures.length()) {
                val failure = cleanupFailures.optJSONObject(index) ?: continue
                if (index > 0) append("; ")
                append(failure.optString("step", "cleanup"))
                append(": ")
                append(failure.optString("message", "unknown error"))
            }
        }
    }
    return if (detail.isBlank()) {
        "$error (HTTP $statusCode)$cleanup"
    } else {
        "$error $detail$cleanup"
    }
}
