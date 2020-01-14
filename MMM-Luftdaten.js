Module.register("MMM-Luftdaten",{
	//default module config
	defaults: {
		sensors: [37447,37448],
		sensorData: {},
	},

	// Define required scripts.
	getStyles: function () {
		return ["MMM-Luftdaten.css"];
	},

	getTemplate: function () {
		return "MMM-Luftdaten.njk";
	},

	// Override start method.
	start: function () {
		console.log("start", this.defaults.sensors);
		for(let index of this.defaults.sensors){
			this.sendSocketNotification("ADD_SENSOR", {
				sensorId: index
			});
		}
	},
	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "SENSOR_DATA_RECEIVED") {
			//console.log("SENSOR_DATA_RECEIVED",payload);
			if(payload.sensorData){
				this.defaults.sensorData = payload.sensorData;
			}
		} else {
			Log.log("MMM-Luftdatan received an unknown socket notification: " + notification);
		}

		this.updateDom(this.config.animationSpeed);
	},

	getTemplateData: function () {
		return {
			...this.defaults.sensorData,
			pressure: Math.round(parseFloat(this.defaults.sensorData.pressure)) / 100,
			lastUpdate: new Date(this.defaults.sensorData.lastUpdate).toLocaleString()
		}
	}
});