var NodeHelper = require("node_helper");
const fetch = require("node-fetch");
// const AbortController = require("abort-controller");

module.exports = NodeHelper.create({
  moduleName: "MMM-Luftdaten",
  state: {
    sensorApi: "https://data.sensor.community/airrohr/v1/sensor/",
    sensorHost: null,
    sensorData: {},
    lastUpdate: null,
    sensorTypeAssignments: {
      P1: "pm10",
      P2: "pm25",
      temperature: "temperature",
      pressure: "pressure",
      humidity: "humidity"
    },
    sensors: {}
  },
  // Override start method.
  start: function () {
    this.fetchers = [];
    console.log("Starting node helper for: " + this.name);
  },
  // Override socketNotificationReceived method.
  socketNotificationReceived: function (notification, payload) {
    if (notification === "ADD_SENSOR") {
      var { sensorId, fetchInterval, sensorIsHost } = payload;
      var instance = this;
      if (sensorIsHost) this.state.sensorHost = sensorId;
      if (payload && sensorId && fetchInterval) {
        if (!this.state.sensors[sensorId]) {
          instance.fetchApiData(sensorId);
          this.state.sensors[sensorId] = setInterval(function () {
            instance.fetchApiData(sensorId);
          }, this.getUpdateInterval(fetchInterval));
        } else {
          //when sensor already exists, directly update data on all clients
          this.sendDataToClient();
        }
      }
    }
  },
  sendDataToClient: function () {
    this.sendSocketNotification("SENSOR_DATA_RECEIVED", {
      sensorData: this.state.sensorData,
      lastUpdate: this.state.sensorData["lastUpdate"]
    });
  },
  sendErrorToClient: function () {
    this.sendSocketNotification("SENSOR_DATA_CONNECTION_ERROR", {
      lastUpdate: this.state.sensorData["lastUpdate"]
    });
  },
  // Update Sensor Data.
  updateSensorData: function (sensors, timestamp) {
    for (let index in sensors) {
      const sensor = sensors[index];
      let sensorType = sensor.value_type;
      if (sensorType.includes("_")) {
        sensorType = sensorType.split("_")[1];
      }

      if (sensor && this.isValidSensorType(sensorType)) {
        let type = this.getSensorKeyFromType(sensorType);
        this.state.sensorData[type] = sensor.value;
      }
    }
    if (timestamp) {
      this.state.sensorData["lastUpdate"] = timestamp;
    }
    this.sendDataToClient();
    //console.log("SensorDataUpdated:", this.state.sensorData, timestamp);
  },
  getSensorKeyFromType(name) {
    return this.state.sensorTypeAssignments[name];
  },
  isValidSensorType(name) {
    return this.state.sensorTypeAssignments[name] || false;
  },
  async fetchApiData(sensorId) {
    let url;

    if (this.state.sensorHost) {
      url = `http://${this.state.sensorHost}/data.json`;
    } else if (sensorId) {
      url = this.state.sensorApi + sensorId + "/";
    }
    console.log(`${this.moduleName}: fetchData from ${url}`);
    if (!url) {
      console.error(
        `${this.moduleName}:  missconfiguration sensorHost or sensorIds has to be set!`
      );
      this.sendErrorToClient();
      return;
    }

    const instance = this;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          if (data.length) {
            const { sensordatavalues, timestamp } = data[0];
            instance.updateSensorData(sensordatavalues, timestamp);
          } else {
            throw `Empty response`;
          }
        } else if (Array.isArray(data.sensordatavalues)) {
          instance.updateSensorData(data.sensordatavalues, new Date());
        }
      } else {
        const error = response.text();
        throw `No positive response ${error}`;
      }
    } catch (e) {
      console.error(`${this.moduleName}: ${e}`);
      this.sendErrorToClient();
    }
  },
  getUpdateInterval(minutes) {
    const min = !minutes || minutes < 5 ? 5 : minutes;
    return min * 60 * 1000;
  }
});
