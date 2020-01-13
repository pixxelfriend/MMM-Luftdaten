Module.register("MMM-Luftdaten",{
	//default module config
	defaults: {
		feinstaubSensorId: "37447",
		temperatureSensorId: "37448",
		sensorApi: "http://data.sensor.community/airrohr/v1/sensor/",
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
		console.log("start");
		this.sendSocketNotification("ADD_SENSOR", {
			sensorId: this.config.feinstaubSensorId
		});
	},

	getTemplateData: function () {
		const airData = {
			pm25: "7.0", // P2
			pm10: "6.85", // P1
			temperature: "5.15",
			pressure: Math.round(parseFloat("100313.665")) / 100,
			humidity: "77.84",
			date: "2020-01-13 20:36:38"
		};
		return airData;
	}
});