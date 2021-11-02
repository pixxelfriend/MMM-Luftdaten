# MMM-Luftdaten

This is a [Magic Mirror²](https://magicmirror.builders/) module which displays measured data of your `#airrohr` air quality sensor. It fetches the data regulary from [Luftdaten.info](https://luftdaten.info/) and displays it right on your mirror. The module should support any kind of temperature and particular matter sensor, aso long as they are listed on Luftdaten.info

![MMM-Luftdaten](/screenshots/mmm-luftdaten.png) ![MMM-Luftdaten-Border](/screenshots/mmm-luftdaten-border.png)

### Howto get my sensor id?

Login to [https://meine.luftdaten.info](https://meine.luftdaten.info) go to `"My sensors"`.
Your node will typically have two sensors attached. One particulate matter sensor and one temperature / humidity / pressure sensor. You´ll need to add both Sensor ID's to your config.

Alternativly, you can search for a sensor near your locatopn on the [fine dust map](https://maps.luftdaten.info/). There you´ll have to click on a location and select pm10 and temperature. Copy the sensor ids beginning with an # from the table on the right side of the page.

### Configuration

| Option      | Default         | Description
| ------------|---------------- | -----------
| sensors | `[]` | Comma seperated list of your two sensor id´s. We currently support one Sensor of any kind (PM2.5, PM10, temperature, humidity, pressure)
| sensorHost | `undefined`| Direct connection to your sensor. Then its possible to fetch the data directly via wifi. `sensors` option will be ignored then
| fetchInterval | `5` | Update interval in minutes. Keep in mind, that your should not updaten more often than your sensor measures. Typically their interval is between 3 an 5 minutes. So 5-10 Minutes is a good value, to save date.
| timeOnly | `false` | Display time without date. Setting this to true will hide the date.
| withBorder | `true` | Display a border around the module
| borderClass | `border` | Default CSS class name of the border.
| displayTendency| `true` | Display an arrow, if the measured values are growing or falling, depending on the last value

### Configuration Example
````javascript
config: {
	sensors: [37447,37448],
	fetchInterval: 5,
	timeOnly: true,
}
````
