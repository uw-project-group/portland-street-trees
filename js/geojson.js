function getMap(){

    var myMap;
    var selectedMarkerClusterGroup;

    // jquery variables
    var $neighborhoodSelectBox = $('#neigbhorbood-select-box');

    // default values
    var pdxCenterCoords = [45.5231, -122.6765];
    var defaultZoom = getZoomValue();

    var selectedNeighborhood = '';

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
    myMap = L.map('map', {layers: [cartoDB]}).setView(pdxCenterCoords, defaultZoom);

    L.tileLayer.provider('CartoDB.Positron').addTo(myMap);
    L.control.layers(baseMaps).addTo(myMap);
    myMap.zoomControl.setPosition('bottomright');

    getData(myMap, selectedNeighborhood);

    // retrieve list of distinct neighborhoods from database and set event listener on select box
    getNeighborhoodList();

    function getData(map, neighborhood) {
        $.ajax("https://tcasiano.carto.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM pdx_street_trees WHERE neighborho ILIKE '" + neighborhood + "'", {
            dataType: 'json',
            success: function(response) {
                var geojsonLayer = L.geoJson(response, {
                    pointToLayer: pointToLayer
                });


                // add new markers
                var markers = L.markerClusterGroup({
                    disableClusteringAtZoom: 18,
                    showCoverageOnHover: true,
                    zoomToBoundsOnClick: true,
                    spiderfyOnMaxZoom: false,
                    polygonOptions: {
                        color: 'yellowgreen',
                        weight: 2,
                        opacity: 0.9 
                    }
                });
                selectedMarkerClusterGroup = markers;
                markers.addLayer(geojsonLayer);
                map.addLayer(markers);
            }
        });
    }

    function getNeighborhoodList() {
        $.getJSON('https://tcasiano.carto.com/api/v2/sql/?q=SELECT DISTINCT neighborho FROM pdx_street_trees ORDER BY neighborho ASC', function(data) {
            $.each(data.rows, function(key, val) {
                $neighborhoodSelectBox.append($('<option/>', {
                    value: val.neighborho,
                    text : val.neighborho
                }));
            });

            // set event listener on neighborhood select box
            $neighborhoodSelectBox.on('change', function() {
                selectedNeighborhood = this.value;
                //if previous marker cluster group exists, remove it
                if (selectedMarkerClusterGroup) {
                    myMap.removeLayer(selectedMarkerClusterGroup);
                }
                myMap.setView(pdxCenterCoords, defaultZoom);
                getData(myMap, selectedNeighborhood);
            });
        });
    }

    function pointToLayer(feature, latlng) {
        var geojsonMarkerOptions =  {
            radius: 5,
            fillColor: "yellowgreen",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
        };

        var layer = L.circleMarker(latlng, geojsonMarkerOptions);
        var popupContent = "<p><strong>Properties: </strong> " + JSON.stringify(feature.properties) + "</p>";
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
