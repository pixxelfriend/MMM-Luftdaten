var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
	state: {
		sensorApi: "https://data.sensor.community/airrohr/v1/sensor/",
		sensorData: {},
		lastUpdate: null,
		sensorTypeAssignments: {
			P1: "pm10",
			P2: "pm25",
			temperature: "temperature",
			pressure: "pressure",
			humidity: "humidity",
		}
	},
	// Override start method.
	start: function() {
		var events = [];
		this.fetchers = [];
		console.log("Starting node helper for: " + this.name);
	},
	// Override socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "ADD_SENSOR") {
			console.log("ADD_SENSOR:",payload);
			if(payload && payload.sensorId){
				this.fetchData(payload.sensorId);
			}
		}
	},
	// Update Sensor Data.
	updateSensorData: function(sensors,timestamp) {
		for(let index in sensors){
			const sensor = sensors[index];
			if(sensor && this.isValidSensorType(sensor.value_type)){
				let type = this.getSensorKeyFromType(sensor.value_type);
				this.state.sensorData[type] = sensor.value;
			}
		}
		if(timestamp) {
			this.state.sensorData["lastUpdate"] = timestamp;
		}
		this.sendSocketNotification("SENSOR_DATA_RECEIVED", {
			sensorData: this.state.sensorData,
			lastUpdate: timestamp
		});
		console.log("SensorDataUpdated:", this.state.sensorData, timestamp);
	},
	getSensorKeyFromType(name){
		return this.state.sensorTypeAssignments[name];
	},
	isValidSensorType(name){
		return this.state.sensorTypeAssignments[name] || false
	},
	fetchData(sensorId){
		if(sensorId){
			var url  = this.state.sensorApi + sensorId + "/";
			//console.log("fetchData from",url);
			const instance = this;
			request(url, function (error, response, body) {
				//console.log("RESPONSE statusCode:", response && response.statusCode); // Print the response status code if a response was received
				if(error){
					console.log("RESPONSE error:", error); // Print the error if one occurred
					return;
				} else {
					//try to parse response
					let res;
					try {
						res = JSON.parse(body);
					}
					catch(err) {
						console.log("RESPONSE no valid json", err.message);
					}
					if(Array.isArray(res)){
						const {sensordatavalues, timestamp} = res[0];
						instance.updateSensorData(sensordatavalues,timestamp);
					}
				}
			});
		}
	},
});
