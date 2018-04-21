function getMap(){

    var myMap;
    var selectedMarkerClusterGroup;

    /* jquery variables */
    var $neighborhoodSelectBox = $('#neigbhorbood-select-box');

    /* default map values */
    var pdxCenterCoords = [45.5231, -122.6765];
    var defaultZoom = getZoomValue();

     /* pseudo-globals for map*/
    var selectedNeighborhood = '';
    var selectedTreeCondition = '';
    var selectedPresenceOfWires = '';
    var selectedFunctionalType = '';

    var allBounds = {};

    var treeConditionRadioButtons = document.getElementsByName("treeCondition");
    var presenceOfWiresCheckBox = document.getElementById("presence-of-wires-checkbox");
    var functionalTypeRadioButtons = document.getElementsByName("functionalTypeFilter");

    /* tile layers */
    var cartoDB = L.tileLayer.provider('CartoDB.Positron');
    var openStreetMap = L.tileLayer.provider('OpenStreetMap.BlackAndWhite');
    var stamenTonerLite = L.tileLayer.provider('Stamen.TonerLite');
    var baseMaps = {
        '<span class="tileLayer__text">CartoDB Positron</span>': cartoDB,
        '<span class="tileLayer__text">Open Street Map</span>': openStreetMap,
        '<span class="tileLayer__text">Stamen Toner Lite</span>': stamenTonerLite
    };

    /* create Leaflet map object */
    myMap = L.map('map', {layers: [cartoDB]}).setView(pdxCenterCoords, defaultZoom);

    L.tileLayer.provider('CartoDB.Positron').addTo(myMap);
    L.control.layers(baseMaps).addTo(myMap);
    myMap.zoomControl.setPosition('bottomright');

    getData(myMap, selectedNeighborhood);
    
    getNeighborhoodPoly(myMap);

    /* retrieve list of distinct neighborhoods from database and set event listeners on select box */
    getNeighborhoodList();

    /* event listeners for filters */
    for (var i = 0; i  < treeConditionRadioButtons.length; i++) {
        treeConditionRadioButtons[i].addEventListener('click', function() {
            selectedTreeCondition = this.value;
            // only make call if there is a value for the selected neigbhorhood
            if (selectedNeighborhood.length) {
                filterAttributes();
            }
        });
    }
    
    presenceOfWiresCheckBox.addEventListener('click', function() {
        if (presenceOfWiresCheckBox.checked) {
            selectedPresenceOfWires = this.value;
        } else {
            selectedPresenceOfWires = '';
        }
        if (selectedNeighborhood.length) {
            filterAttributes();
        }
    });

    for (var i = 0; i  < functionalTypeRadioButtons.length; i++) {
        functionalTypeRadioButtons[i].addEventListener('click', function() {
            selectedFunctionalType = this.value;
            if (selectedNeighborhood.length) {
                filterAttributes();
            }
        });
    }

    function getData(map, neighborhood) {
        var ajaxCall = createAjaxCall(neighborhood);
        $.ajax(ajaxCall, {
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
    
    //load the neighborhoods geojson data
    function getNeighborhoodPoly(map){
        $.ajax("data/Neighborhood_Boundaries.geojson",{
            dataType:"json",
            success: function(response){
                var neighborOptions = {
                    fillColor:'#ffffff',
                    fillOpacity: 0,
                    color: 'green',
                    opacity:0.4,
                }
                L.geoJson(response,{
                    style: neighborOptions,
                    onEachFeature: onEachFeature
                }).addTo(map);

                function onEachFeature(feature, layer) {
                    // add bounds for each neighorhood to the allBounds object
                    // so that the dropdown can access these values as well
                    allBounds[feature.properties.NAME] = layer.getBounds();
                    
                    layer.on({
                        click: function(e) {
                            // only select and pan/zoom if selecting a different neighborhood
                            if ((feature.properties.TreeTotal > 0) && (selectedNeighborhood !== feature.properties.NAME)) {
                                selectNeighborhood(feature.properties.NAME);
                            } else if (feature.properties.TreeTotal === 0) {
                                // TODO(Tree): handle null values gracefully
                                console.log('Neighborhood with 0 Street Trees: ', feature.properties.NAME);
                            }
                        }
                    });
                }

                function selectNeighborhood(neighborhoodName) {
                    if (selectedMarkerClusterGroup) {
                        myMap.removeLayer(selectedMarkerClusterGroup);
                    }
                    // update pseudo-global 'selectedNeighborhood'
                    selectedNeighborhood = neighborhoodName;
                    $neighborhoodSelectBox.val(neighborhoodName).change();
                }            
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
                if (selectedNeighborhood === 'ALL' || selectedNeighborhood === false) {
                    // disable all filters when no neighhorhood is selected
                    treeConditionRadioButtons[0].checked=true;
                    for (var i = 0; i < treeConditionRadioButtons.length;  i++){
                        treeConditionRadioButtons[i].disabled = true;
                    }
                    functionalTypeRadioButtons[0].checked=true;
                    for (var i = 0; i < functionalTypeRadioButtons.length;  i++){
                        functionalTypeRadioButtons[i].disabled = true;
                    }
                    presenceOfWiresCheckBox.disabled=true;
                } else {
                    //enable radio buttons
                    for (var i = 0; i < treeConditionRadioButtons.length;  i++){
                        treeConditionRadioButtons[i].disabled = false;
                    }
                    for (var i = 0; i < functionalTypeRadioButtons.length;  i++){
                        functionalTypeRadioButtons[i].disabled = false;
                    }
                    // enable checkbox
                    presenceOfWiresCheckBox.disabled = false;
                }

                //if previous marker cluster group exists, remove it
                if (selectedMarkerClusterGroup) {
                    myMap.removeLayer(selectedMarkerClusterGroup);
                } 
                
                if (selectedNeighborhood === 'ALL') {
                    // zoom out to city 
                    myMap.setView(pdxCenterCoords, defaultZoom);
                } else {
                    var selectedNeighborhoodBounds = allBounds[selectedNeighborhood];
                    myMap.fitBounds(selectedNeighborhoodBounds);
                }

                getData(myMap, selectedNeighborhood);
            });
        });
    }

    function filterAttributes() {
        //if previous marker cluster group exists, remove it
        if (selectedMarkerClusterGroup) {
            myMap.removeLayer(selectedMarkerClusterGroup);
        }
        getData(myMap, selectedNeighborhood);
    }

    function pointToLayer(feature, latlng) {
        var geojsonMarkerOptions =  {
            radius: 6,
            fillColor: getFillColor(feature.properties.condition),
            color: '#696969',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
        };

        function getFillColor(conditionProperty) {
            switch (conditionProperty.toLowerCase()) {
                case 'good':
                    return '#ADFF2F';
                case 'fair':
                    return '#93D843';
                case 'poor':
                    return 'brown';
                case 'dead':
                    return 'black';
                default:
                    return 'white';                
            }
        }

        var layer = L.circleMarker(latlng, geojsonMarkerOptions);
        var popupContent = createPopupContent(feature.properties);
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

    function createPopupContent(props) {
        var treeAddress = createString("Address: ", props.address);
        var treeCommonName = createString("Tree Common Name: ", props.common);
        var treeScientificName = createString("Tree Scientific Name: ", props.scientific);
        var treeCondition = createString("Tree Condition: ", props.condition);
        var wiresPresent = createString("Wires Present: ", props.wires);
        var functionalType = createString("Functional Type: ", props.functional);
        var popupContent = treeAddress + treeCommonName + treeScientificName + treeCondition + wiresPresent + functionalType;
        
        function createString(labelName, propValue) {
            return "<div class='popupAttributes'><span class='labelName'>" + labelName + "</span> " + propValue + "</div>";
        }
        return popupContent;
    }
    
    function setChart(){
        var chartWidth = 300,
            chartHeight = 460;
    
    
        //create a second svg element to hold chart
        var chart = d3.select(".infoPanel")
            .append("svg")
            .attr("width", chartWidth)
            .attr("hight", chartHeight)
            .attr("class", chart);
    };
    
    setChart()
    
    //load the data
    //d3.json()
    
    //create coordinated chart
    //function setChart()

    function createAjaxCall(neighborhood) {
        var url = "https://tcasiano.carto.com/api/v2/sql?format=GeoJSON&q=";
        var query = "SELECT * FROM pdx_street_trees WHERE neighborho ILIKE '" + neighborhood + "'";
        
        if (selectedTreeCondition) {
            query += "AND lower(condition) = '" + selectedTreeCondition + "'";
        }

        if (selectedPresenceOfWires) {
            query += "AND lower(wires) = '" + selectedPresenceOfWires + "'";
        }

        if (selectedFunctionalType) {
            query += "AND lower(functional) = '" + selectedFunctionalType + "'";
        }
        var ajaxString = url + query;
        return ajaxString;
    }
}

$(document).ready(getMap);
