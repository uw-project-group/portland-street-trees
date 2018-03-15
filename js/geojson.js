function getMap(){

    var myMap;

    // default values
    var myCenterCoords = [45.5231, -122.6765];
    var defaultZoom = getZoomValue();

    /*tile layers*/
    var cartoDB = L.tileLayer.provider('CartoDB.Positron');
    var openStreetMap = L.tileLayer.provider('OpenStreetMap.BlackAndWhite');
    var stamenTonerLite = L.tileLayer.provider('Stamen.TonerLite');
    var baseMaps = {
        '<span class="tileLayer__text">CartoDB Positron</span>': cartoDB,
        '<span class="tileLayer__text">Open Street Map</span>': openStreetMap,
        '<span class="tileLayer__text">Stamen Toner Lite</span>': stamenTonerLite
    };

    // create leaflet objects
    myMap = L.map('map', {layers: [cartoDB]}).setView(myCenterCoords, defaultZoom);

    L.tileLayer.provider('CartoDB.Positron').addTo(myMap);
    L.control.layers(baseMaps).addTo(myMap);
    myMap.zoomControl.setPosition('bottomright');

    getData(myMap);

    function getData(map) {
        $.ajax("https://tcasiano.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM pdx_street_trees WHERE neighborho ILIKE 'ALAMEDA'", {
            dataType: 'json',
            success: function(response) {
                console.log('we have data!', response);
                var geojsonLayer = L.geoJson(response, {
                    pointToLayer: pointToLayer

                });
                var markers = L.markerClusterGroup();
                markers.addLayer(geojsonLayer);
                map.addLayer(markers);
            }
        });
    }

    function pointToLayer(feature, latlng) {

        var geojsonMarkerOptions =  {
            radius: 5,
            fillColor: "#0e8b2e",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
        };

        var layer = L.circleMarker(latlng, geojsonMarkerOptions);
        var popupContent = "<p><strong>Properties: </strong> " + JSON.stringify(feature.properties) + "</p>";;
        layer.bindPopup(popupContent);
        return layer;
    }

    function getZoomValue() {
        var clientWidth = document.documentElement.clientWidth;

        if (clientWidth < 500) {
            return 8;
        } else if (clientWidth < 1000) {
            return 10;
        } else  {
            return 12;
        }
    }

}

$(document).ready(getMap);
