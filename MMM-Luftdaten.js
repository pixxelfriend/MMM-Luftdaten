Module.register("MMM-Luftdaten",{
	//default module config
	defaults: {
		sensors: [],
		sensorData: {},
		fetchInterval: 5, // update intervall in minutes
		timeOnly: false,
		withBorder: true,
		borderClass: "border",
		displayTendency: true,
		connected: false,
		error: false
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
		this.defaults = {
			...this.defaults,
			...this.config
		}
		const {sensorHost} = this.defaults
		if(sensorHost){
			const sensorIsHost = sensorHost ? true : false
			this.addSensor(sensorHost,this.defaults.fetchInterval, sensorIsHost)
		} else {
			for(let index of this.defaults.sensors){
				//inital fetch of sensor data
				this.addSensor(index,this.defaults.fetchInterval)
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
		if (notification === "SENSOR_DATA_RECEIVED") {
			if(payload.sensorData){
				this.defaults.error = false
				this.defaults.connected = true
				this.defaults.lastUpdate = payload.sensorData.lastUpdate
				this.defaults.sensorData = this.createSensorTemplateData(payload.sensorData)
			}
		} else if(notification === "SENSOR_DATA_CONNECTION_ERROR"){
			this.defaults.error = true
			if(payload.lastUpdate) {
				this.defaults.lastUpdate = payload.lastUpdate
			}
		} else {
			Log.log("MMM-Luftdatan received an unknown socket notification: " + notification);
		}

		this.updateDom(this.config.animationSpeed);
	},

	createSensorTemplateData: function (data){
		const sensors = {}
		delete data.lastUpdate;
		for(let key in data){
			const sensor = {}
			sensor.value = parseFloat(data[key])
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

			if(this.defaults.displayTendency && this.defaults.sensorData[key]){
				sensor.tendency = this.getTendency(this.defaults.sensorData[key].value, sensor.value)
			}
			sensors[key] = sensor
		}
		return sensors
	},
	getTendency: function(oldValue, newValue){
		if(oldValue === newValue) return false;
		if(oldValue < newValue) return "up"
		return "down"
	},
	getTemplateData: function () {
		const data = {
			...this.defaults.sensorData,
			lastUpdate: this.formatDate(this.defaults.lastUpdate),
			borderClass: this.defaults.withBorder ? this.defaults.borderClass : '',
			connected: this.defaults.connected,
			error: this.defaults.error,
			text: {
				CONNECTING: this.translate("CONNECTING"),
				CONNECTION_ERROR: this.translate("CONNECTION_ERROR")
			}
		}
		return data;
	},
	formatDate: function (dateString){
		const format = this.defaults.timeOnly ? "LT" : "L LT"
		const date = moment.utc(dateString).local()
		return date.format(format)
	}
});