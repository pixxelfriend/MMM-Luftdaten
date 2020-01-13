var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
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
			//this.createFetcher(payload.url, payload.fetchInterval, payload.excludedEvents, payload.maximumEntries, payload.maximumNumberOfDays, payload.auth, payload.broadcastPastEvents);
		}
	}
});
