function getMap(){

    var myMap;

    // default values
    var myCenterCoords = [39.8097, -98.5556];
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
        $.ajax('data/metroRegionsZHVI2017.geojson', {
            dataType: 'json',
            success: function(response) {

                var geojsonLayer = L.geoJson(response, {
                    pointToLayer: pointToLayer
                });

                map.addLayer(geojsonLayer);

            }
        });
    }

    function pointToLayer(feature, latlng) {
        var attribute  = "2017-01";
        var attributeValue = Number(feature.properties[attribute]);
        var geojsonMarkerOptions =  {
            radius: 5,
            fillColor: "#8B008B",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
        }

        geojsonMarkerOptions.radius = calculateSymbolRadius(attributeValue);

        var layer = L.circleMarker(latlng, geojsonMarkerOptions);

        var cityDisplayName = "<p><strong>City:</strong> " + feature.properties.regionName + "</p>";
        var attributeDisplayText = "<p><strong>Attribute:</strong> " + feature.properties[attribute] + "</p>";
        var popupContent = cityDisplayName + attributeDisplayText;
        layer.bindPopup(popupContent);
        return layer;
    }

    function calculateSymbolRadius(attrValue) {
        var scaleFactor = .0006;
        var area = attrValue * scaleFactor;
        return Math.sqrt(area/Math.PI);;
    }

    function getZoomValue() {
        var clientWidth = document.documentElement.clientWidth;

        if (clientWidth < 500) {
            return 3;
        } else if (clientWidth < 1000) {
            return 4;
        } else  {
            return 5;
        }
    }

}

$(document).ready(getMap);
