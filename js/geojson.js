function getMap(){

    var myMap;
    var geojsonMarkerOptions;
    
    // default values
    var myCenterCoords = [20, 0];
    var defaultZoom = 2
    var tileLayerUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var tileLayerAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

    // create leaflet objects
    myMap = L.map('map-id').setView(myCenterCoords, defaultZoom);
        
	L.tileLayer(tileLayerUrl, {
		attribution: tileLayerAttrib,
		maxZoom: 18,

	}).addTo(myMap);

    getData(myMap);

    function getData(map) {
        $.ajax('data/metroRegionsZHVI2017.geojson', {
            dataType: 'json',
            success: function(response) {
                var geojsonLayer = L.geoJson(response, {
                    filter: filterFeatures,
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, geojsonMarkerOptions);
                    },
                    onEachFeature: onEachFeature
                });

                map.addLayer(geojsonLayer);
    
            }
        });  
    }

    // helper functions, implementation details, and options

    var geojsonMarkerOptions =  {
        radius: 5,
        fillColor: "#8B008B",
        color: "#000",
        weight: 1, 
        opacity: 1, 
        fillOpacity: 0.9
    }

    function filterFeatures(feature, layer) {
        return true;
    }

    function onEachFeature(feature, layer) {
    
        var popupContent = "";

        if (feature.properties) {
            for (var property in feature.properties) {
                popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
            }
            layer.bindPopup(popupContent);
        }
    }
}

$(document).ready(getMap);