var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  moduleName: "MMM-Luftdaten",
  state: {
    sensorApi: "https://data.sensor.community/airrohr/v1/sensor/",
    sensorTypeAssignments: {
      P1: "pm10",
      P2: "pm25",
      temperature: "temperature",
      pressure: "pressure",
      humidity: "humidity"
    },
    sensors: {}, // maps sensorId to interval config and metadata
    sensorData: {} // maps sensorId to sensor metrics
  },

  // Override start method.
  start: function () {
    console.log("Starting node helper for: " + this.name);
  },

  // Override socketNotificationReceived method.
  socketNotificationReceived: function (notification, payload) {
    if (notification === "ADD_SENSOR") {
      const { sensorId, fetchInterval, sensorIsHost } = payload;
      if (sensorId && fetchInterval) {
        if (!this.state.sensors[sensorId]) {
          this.state.sensorData[sensorId] = {};
          this.fetchApiData(sensorId, sensorIsHost);
          this.state.sensors[sensorId] = {
            interval: setInterval(() => {
              this.fetchApiData(sensorId, sensorIsHost);
            }, this.getUpdateInterval(fetchInterval)),
            sensorIsHost: sensorIsHost
          };
        } else {
          // when sensor already exists, directly update data on all clients
          this.sendDataToClient(sensorId);
        }
      }
    }
  },

  sendDataToClient: function (sensorId) {
    this.sendSocketNotification("SENSOR_DATA_RECEIVED", {
      sensorId: sensorId,
      sensorData: this.state.sensorData[sensorId]
    });
  },

  sendErrorToClient: function (sensorId) {
    this.sendSocketNotification("SENSOR_DATA_CONNECTION_ERROR", {
      sensorId: sensorId,
      lastUpdate: this.state.sensorData[sensorId] ? this.state.sensorData[sensorId].lastUpdate : null
    });
  },

  // Update Sensor Data.
  updateSensorData: function (sensorId, sensors, timestamp) {
    if (!this.state.sensorData[sensorId]) {
      this.state.sensorData[sensorId] = {};
    }
    for (let index in sensors) {
      const sensor = sensors[index];
      let sensorType = sensor.value_type;
      if (sensorType.includes("_")) {
        sensorType = sensorType.split("_")[1];
      }

      if (sensor && this.isValidSensorType(sensorType)) {
        let type = this.getSensorKeyFromType(sensorType);
        this.state.sensorData[sensorId][type] = sensor.value;
      }
    }
    if (timestamp) {
      this.state.sensorData[sensorId].lastUpdate = timestamp;
    }
    this.sendDataToClient(sensorId);
  },

  getSensorKeyFromType(name) {
    return this.state.sensorTypeAssignments[name];
  },

  isValidSensorType(name) {
    return !!this.state.sensorTypeAssignments[name];
  },

  async fetchApiData(sensorId, sensorIsHost) {
    let url;

    if (sensorIsHost) {
      url = `http://${sensorId}/data.json`;
    } else if (sensorId) {
      url = this.state.sensorApi + sensorId + "/";
    }

    console.log(`${this.moduleName}: fetchData from ${url}`);
    if (!url) {
      console.error(
        `${this.moduleName}: misconfiguration sensorHost or sensorId has to be set!`
      );
      this.sendErrorToClient(sensorId);
      return;
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          if (data.length) {
            const { sensordatavalues, timestamp } = data[0];
            this.updateSensorData(sensorId, sensordatavalues, timestamp);
          } else {
            throw new Error(`Empty response`);
          }
        } else if (data && Array.isArray(data.sensordatavalues)) {
          this.updateSensorData(sensorId, data.sensordatavalues, new Date().toISOString());
        }
      } else {
        const error = await response.text();
        throw new Error(`No positive response: ${error}`);
      }
    } catch (e) {
      console.error(`${this.moduleName} [Sensor ${sensorId}]: ${e.message || e}`);
      this.sendErrorToClient(sensorId);
    }
  },

  getUpdateInterval(minutes) {
    const min = !minutes || minutes < 1 ? 1 : minutes;
    return min * 60 * 1000;
  }
});
