Module.register("MMM-Luftdaten",{
	//default module config
	defaults: {
		sensors: [],
		sensorHost: null,
		fetchInterval: 5, // update interval in minutes
		timeOnly: false,
		withBorder: true,
		borderClass: "border",
		displayTendency: true
	},

	// Define required scripts.
	getStyles: function () {
		return ["MMM-Luftdaten.css","font-awesome.css"];
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
		this.sensorData = {};
		this.connected = false;
		this.error = false;
		this.lastUpdate = null;

		const { sensorHost, sensors, fetchInterval } = this.config;
		if (sensorHost) {
			this.addSensor(sensorHost, fetchInterval, true);
		} else if (sensors && sensors.length > 0) {
			for (let id of sensors) {
				// initial fetch of sensor data
				this.addSensor(id, fetchInterval, false);
			}
		}
	},

	addSensor: function(sensorId, fetchInterval, sensorIsHost){
		this.sendSocketNotification("ADD_SENSOR", {
			sensorId, fetchInterval, sensorIsHost
		});
	},

	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		const { sensorId, sensorData, lastUpdate } = payload;
		
		// Check if this notification is for a sensor configured in this instance
		const isRelevant = this.config.sensorHost === sensorId ||
			(this.config.sensors && this.config.sensors.includes(sensorId));

		if (!isRelevant) return;

		if (notification === "SENSOR_DATA_RECEIVED") {
			if (sensorData) {
				this.error = false;
				this.connected = true;
				this.lastUpdate = sensorData.lastUpdate;
				this.sensorData = {
					...this.sensorData,
					...this.createSensorTemplateData(sensorData)
				};
			}
		} else if (notification === "SENSOR_DATA_CONNECTION_ERROR") {
			this.error = true;
			if (lastUpdate) {
				this.lastUpdate = lastUpdate;
			}
		} else {
			Log.log("MMM-Luftdaten received an unknown socket notification: " + notification);
		}

		this.updateDom(this.config.animationSpeed);
	},

	createSensorTemplateData: function (data){
		const sensors = {};
		for (let key in data) {
			if (key === "lastUpdate") continue;
			const sensor = {};
			sensor.value = parseFloat(data[key]);
			switch(key){
				case "pressure":
					sensor.label = this.translate("PRESSURE");
					sensor.value = Math.round(parseFloat(sensor.value)) / 100;
					break;
				case "humidity":
					sensor.label = this.translate("HUMIDITY");
					break;
				default:
					break;
			}

			if (this.config.displayTendency && this.sensorData[key]) {
				sensor.tendency = this.getTendency(this.sensorData[key].value, sensor.value);
			}
			sensors[key] = sensor;
		}
		return sensors;
	},

	getTendency: function(oldValue, newValue){
		if(oldValue === newValue) return false;
		if(oldValue < newValue) return "up";
		return "down";
	},

	getTemplateData: function () {
		const data = {
			...this.sensorData,
			lastUpdate: this.formatDate(this.lastUpdate),
			borderClass: this.config.withBorder ? this.config.borderClass : '',
			connected: this.connected,
			error: this.error,
			text: {
				CONNECTING: this.translate("CONNECTING"),
				CONNECTION_ERROR: this.translate("CONNECTION_ERROR")
			}
		};
		return data;
	},

	formatDate: function (dateString){
		if (!dateString) return "";
		const format = this.config.timeOnly ? "LT" : "L LT";
		const date = moment.utc(dateString).local();
		return date.format(format);
	}
});