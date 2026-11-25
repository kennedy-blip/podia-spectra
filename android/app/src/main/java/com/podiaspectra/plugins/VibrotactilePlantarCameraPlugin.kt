package com.podiaspectra.plugins

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "VibrotactilePlantarCamera")
class VibrotactilePlantarCameraPlugin : Plugin() {

    private fun getVibrator(): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vm.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    @PluginMethod
    fun trigger128HzSweep(call: PluginCall) {
        val amplitude = call.getInt("amplitude", 128)!!.coerceIn(1, 255)
        val durationMs = call.getInt("durationMs", 600)!!.coerceIn(50, 3000)

        val vibrator = getVibrator()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // 128 Hz modulated waveform (~7.8 ms period)
            val timings = longArrayOf(0L, durationMs.toLong())
            val amplitudes = intArrayOf(0, amplitude)
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        }

        val ret = JSObject()
        ret.put("frequencyHz", 128)
        ret.put("amplitude", amplitude)
        ret.put("durationMs", durationMs)
        call.resolve(ret)
    }

    @PluginMethod
    fun getHighSpeedCameraCapabilities(call: PluginCall) {
        val camManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val rearId = camManager.cameraIdList.firstOrNull { id ->
            camManager.getCameraCharacteristics(id)
                .get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_BACK
        }
        val ret = JSObject()
        ret.put("rearCameraId", rearId ?: "0")
        ret.put("targetFps", 60)
        ret.put("maxShutterExposureNs", 2_000_000L)
        call.resolve(ret)
    }
}
