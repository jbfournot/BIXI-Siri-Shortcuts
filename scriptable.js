// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: bicycle;

// Ici, on interroge l'API BIXI pour obtenir le nombre de vélos pour toutes les stations du réseau
const statusRequest = new Request('https://api-core.bixi.com/gbfs/en/station_status.json');
let statusResponse = await statusRequest.loadJSON();
let stations = statusResponse.data.stations;

// Comme la précédente requête ne retourne pas les informations de chaque station, il faut interroger de nouveau l'API.
const informationsRequest = new Request('https://api-core.bixi.com/gbfs/en/station_information.json');
let informationsResponse = await informationsRequest.loadJSON();

// Dans un soucis de performance, j'utilise directement mes coordonnées et non la position GPS. 
// Une récente mise à jour de Scriptable permet désormais de régler l'intensité du GPS et obtenir la position plus rapidement (avec forcément un peu moins de précision mais on est pas aux mètres près)
// let location = await Location.current();
let longitude = -73.60;
let latitude = 45.53;
// let longitude = location.longitude;
// let latitude = location.latitude;

// On parcourt notre tableau de station (avec le nombre de vélos) et pour chacune, on associe les informations obtenues dans la seconde requête. L'idée est d'obtenir un seul gros tableau.
stations.map(station => {
	let station_ID = station.station_id;
	station.informations = informationsResponse.data.stations.find(station => {
		return station.station_id == station_ID;
	});
	// On calcule la distance entre l'utilisateur et chaque station
	station.distance = distance(latitude, longitude, station.informations.lat, station.informations.lon);
	return station;
});

// On trie les stations du plus proche au plus éloigné
stations = stations.sort((a, b) => {
	return a.distance - b.distance;
});

// On utilise les classes UITable, UITableRow pour créer notre interface utilisateur
let table = new UITable();
// Dans l'interface visuelle de SIRI, on affichera la 5 premiers résultats. 
stations.slice(0, 5).map(station => {
	let row = new UITableRow();
	row.addText(`${station.num_bikes_available} 🚲 disponibles à ${station.informations.name}`);
	table.addRow(row);
});

// Lecture audio par SIRI des informations pour la première station
Speech.speak(`${stations[0].num_bikes_available} vélos disponibles à la station ${stations[0].informations.name}`);
QuickLook.present(table);

// Fonction pour calculer la distance entre deux coordonnées GPS
function distance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	if (dist > 1) {
		dist = 1;
	}
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
}
