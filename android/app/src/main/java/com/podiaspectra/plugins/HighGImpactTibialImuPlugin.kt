package com.podiaspectra.plugins

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlin.math.sqrt

@CapacitorPlugin(name = "HighGImpactTibialImu")
class HighGImpactTibialImuPlugin : Plugin(), SensorEventListener {

    private lateinit var sensorManager: SensorManager
    private var linearAccel: Sensor? = null
    private var rawAccel: Sensor? = null
    private var gyro: Sensor? = null
    private var isStreaming = false
    private var lastImpactNs: Long = 0L
    private var inStance = false
    private var stanceStartNs: Long = 0L

    override fun load() {
        sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        linearAccel = sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION)
        rawAccel = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        gyro = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
    }

    @PluginMethod
    fun startTibialStream(call: PluginCall) {
        if (!isStreaming) {
            linearAccel?.let {
                sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_FASTEST)
            }
            rawAccel?.let {
                sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_FASTEST)
            }
            gyro?.let {
                sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_FASTEST)
            }
            isStreaming = true
        }
        val ret = JSObject()
        ret.put("status", "streaming")
        ret.put("maxRangeG", (rawAccel?.maximumRange ?: 156.9f) / 9.80665f)
        call.resolve(ret)
    }

    @PluginMethod
    fun stopTibialStream(call: PluginCall) {
        if (isStreaming) {
            sensorManager.unregisterListener(this)
            isStreaming = false
        }
        call.resolve(JSObject().put("status", "stopped"))
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_LINEAR_ACCELERATION) {
            val ax = event.values[0]
            val ay = event.values[1]
            val az = event.values[2]
            val magG = sqrt(ax * ax + ay * ay + az * az) / 9.80665f

            if (!inStance && magG > 2.2f) {
                inStance = true
                stanceStartNs = event.timestamp
            } else if (inStance && magG < 0.8f && (event.timestamp - stanceStartNs) > 100_000_000L) {
                val gctMs = (event.timestamp - stanceStartNs) / 1_000_000.0
                inStance = false
                lastImpactNs = event.timestamp
                val payload = JSObject()
                payload.put("gctMs", gctMs)
                payload.put("peakG", magG)
                payload.put("timestampNs", event.timestamp)
                notifyListeners("tibialImpactEvent", payload)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
