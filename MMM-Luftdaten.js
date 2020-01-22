Module.register("MMM-Luftdaten",{
	//default module config
	defaults: {
		sensors: [],
		sensorData: {},
		fetchInterval: 5, // update intervall in minutes
		timeOnly: true,
		withBorder: true,
		borderClass: "border",
	},

	// Define required scripts.
	getStyles: function () {
		return ["MMM-Luftdaten.css"];
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required translations.
	getTranslations: function() {
		return {
			en: "translations/en.json",
			de: "translations/de.json",
		};
	},

	getTemplate: function () {
		return "MMM-Luftdaten.njk";
	},

	// Override start method.
	start: function () {
		this.defaults = {
			...this.defaults,
			...this.config
		}
		for(let index of this.defaults.sensors){
			//inital fetch of sensor data
			this.addSensor(index,this.defaults.fetchInterval)
		}
	},
	addSensor: function(sensorId, fetchInterval){
		this.sendSocketNotification("ADD_SENSOR", {
			sensorId, fetchInterval
		});
	},
	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "SENSOR_DATA_RECEIVED") {
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
			lastUpdate: this.formatDate(this.defaults.sensorData.lastUpdate),
			borderClass: this.defaults.withBorder ? this.defaults.borderClass : '',
			/** current workaround, because calling the translation method is not possible in njk */
			pressureLabel: this.translate("PRESSURE"),
			humidityLabel:  this.translate("HUMIDITY"),
		}
	},
	formatDate: function (dateString){
		const format = this.defaults.timeOnly ? "LT" : "L LT"
		const date = moment.utc(dateString).local()
		return date.format(format)
	}
});