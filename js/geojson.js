function getMap(){

    var myMap;
    var selectedMarkerClusterGroup;

    /* jquery variables */
    var $neighborhoodSelectBox = $('#neigbhorbood-select-box');
    var $filterFeedback = $('#filter-feedback');

    /* default map values */
    var pdxCenterCoords = [45.5410, -122.6769];
    var defaultZoom = getZoomValue();
    var maxZoom = 13;
    
    /*limits to panning*/
    var southWest = L.latLng(45.411, -122.922),
    northEast = L.latLng(45.67, -122.452);
    var bounds = L.latLngBounds(southWest, northEast);

     /* pseudo-globals for map */
    var selectedNeighborhood = '';
    var selectedTreeCondition = '';
    var selectedPresenceOfWires = '';
    var selectedFunctionalType = '';

    var allNbhdData = [{
        condition: 'Good',
        value: 50
    },{
        condition: 'Fair',
        value: 25
    },{
        condition: 'Poor',
        value: 12.5
    },{
        condition: 'Dead',
        value: 12.5
    }];

    /* variables to populate with values from the geojson so they can be easily consumed 
    in other functions */
    var allBounds = {};
    var allConditions = {};

    var treeConditionRadioButtons = document.getElementsByName("treeCondition");
    var presenceOfWiresCheckBox = document.getElementById("presence-of-wires-checkbox");
    var functionalTypeRadioButtons = document.getElementsByName("functionalTypeFilter");

    /* tile layers */
    var cartoDB = L.tileLayer.provider('CartoDB.Positron');
    var EsriImgagery = L.tileLayer.provider('Esri.WorldImagery');
    var stamenTonerLite = L.tileLayer.provider('Stamen.TonerLabels');
    var baseMaps = {
        '<span class="tileLayer__text">CartoDB Positron</span>': cartoDB,
        '<span class="tileLayer__text">Imagery</span>': EsriImgagery,
        //'<span class="tileLayer__text">Stamen Toner Lite</span>': stamenTonerLite
    };
    
    var overylayMaps={
        '<span class ="overLay__text">Labels</span>':stamenTonerLite
    }

    /* create Leaflet map object */
    myMap = L.map('map', {layers: [cartoDB]}).setView(pdxCenterCoords, defaultZoom);
    
    
    
    //set bounds and animate the edge of panning area
    myMap.setMaxBounds(bounds);
    myMap.on('drag', function() {
        myMap.panInsideBounds(bounds, { animate: true });
    });

    L.tileLayer.provider('CartoDB.Positron').addTo(myMap);
    L.control.layers(baseMaps,overylayMaps).addTo(myMap);
    myMap.zoomControl.setPosition('bottomright');

    getData(myMap, selectedNeighborhood);
    
    getNeighborhoodPoly(myMap);

    /* retrieve list of distinct neighborhoods from database and set event listeners on select box */
    getNeighborhoodList();

    setChart(allNbhdData);
    updateLegend(allNbhdData);

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
                if (!response.features.length) {
                    if (!neighborhood || neighborhood === 'ALL') {
                        // we return early because we only want to trigger the display
                        // of the feedback if a single neighborhood is selected
                        return;
                    }
                    $filterFeedback.hide();
                    $filterFeedback.text('');
                    $filterFeedback.fadeIn('slow').text('0 results for selected filter(s)');
                }

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
        $.ajax("data/Neighborhood_Boundaries.geojson", {
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
                    var neighborhoodName = feature.properties.NAME;

                    // populate the pseudo-global objects declared at the top of this file
                    // on order to hold values so that the dropdown can access them
                    allBounds[neighborhoodName] = layer.getBounds();
                    allConditions[neighborhoodName] = [{
                        condition: 'Good',
                        value: feature.properties.pct_Good.toFixed(2)
                    },{
                        condition: 'Fair',
                        value: feature.properties.pct_Fair.toFixed(2)
                    },{
                        condition: 'Poor',
                        value: feature.properties.pct_Poor.toFixed(2)
                    },{
                        condition: 'Dead',
                        value: feature.properties.pct_Dead.toFixed(2)
                    }];

                    layer.on({
                        click: function(e) {
                            // only select and pan/zoom if selecting a different neighborhood
                            if ((feature.properties.TreeTotal > 0) && (selectedNeighborhood !== neighborhoodName)) {
                                // update pseudo-global 'selectedNeighborhood'
                                selectedNeighborhood = neighborhoodName;
                                // trigger change event on the neighborhood dropdown
                                // so that it always is in sync with the selected neighborhood
                                $neighborhoodSelectBox.val(neighborhoodName).change();
                            } else if (feature.properties.TreeTotal === 0) {
                                // TODO(Tree): handle null values gracefully and give feedback to user
                                $filterFeedback.hide();
                                $filterFeedback.text('');
                                $filterFeedback.fadeIn('slow').text("No street trees have been inventoried for " + neighborhoodName + '.');
                                console.log("No street trees have been inventoried for " + neighborhoodName + '.');
                            }
                        }
                    });
                } 
            }
        });
    }

    function getNeighborhoodList() {
        $.getJSON('https://tcasiano.carto.com/api/v2/sql/?q=SELECT DISTINCT neighborho FROM pdx_street_trees ORDER BY neighborho ASC', function(data) {
            $.each(data.rows, function(key, val) {
                if (val.neighborho !== 'PDX') {
                    $neighborhoodSelectBox.append($('<option/>', {
                        value: val.neighborho,
                        text : val.neighborho
                    }));
                }
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
                    updateChart(allNbhdData);
                    updateLegend(allNbhdData);
                } else {
                    var selectedNeighborhoodBounds = allBounds[selectedNeighborhood];
                    var selectedNeighborhoodTreeCondition = allConditions[selectedNeighborhood];
                    myMap.fitBounds(selectedNeighborhoodBounds);
                    updateChart(selectedNeighborhoodTreeCondition);
                    updateLegend(selectedNeighborhoodTreeCondition);
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

    function createAjaxCall(neighborhood) {
        if (neighborhood === "SULLIVAN'S GULCH") {
            // the correct way to escape a SQL apostrophe or single quote 
            // is with two single quotes
            neighborhood = "SULLIVAN''S GULCH";
        }
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

    function getFillColor(conditionProperty) {
        switch (conditionProperty.toLowerCase()) {
            case 'good':
                return 'greenyellow';
            case 'fair':
                return 'yellowgreen';
            case 'poor':
                return '#82551B';
            case 'dead':
                return '#34220B';
            default:
                return 'white';                
        }
    }

    function updateLegend(neighborhoodValues) {
        $('#percent-good').html(neighborhoodValues[0].value);
        $('#percent-fair').html(neighborhoodValues[1].value);
        $('#percent-poor').html(neighborhoodValues[2].value);
        $('#percent-dead').html(neighborhoodValues[3].value);
    }

    function setChart(data) {
        var chartWidth = 280,
        chartHeight = 240,
        radius = Math.min(chartWidth, chartHeight)/2;
    
        var arc = d3.arc()
            .outerRadius(radius -10)
            .innerRadius(radius -70);
    
        var labelArc = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);
    
        var pie = d3.pie()
            .sort(null)
            .value(function(d){
                return d.value;
            });
        
        var chart = d3.select(".chart-container")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart")
            .append("g")
            .attr("class", "chart-center")
            .attr("transform", "translate(" + chartWidth / 2 + "," + chartHeight / 2 + ")");
    
        var g = chart.selectAll(".arc")
            .data(pie(data))
            .enter().append("g")
            .attr("class", "arc");
    
        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { 
            return getFillColor(d.data.condition); 
        });   
    }

    function updateChart(data) {
       // TODO(): refactor this so there is less duplicative code between this function and the setChart function
        var chartWidth = 280,
        chartHeight = 240,
        radius = Math.min(chartWidth, chartHeight)/2;
    
        var arc = d3.arc()
            .outerRadius(radius -10)
            .innerRadius(radius -70);
    
        var labelArc = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);
    
        var pie = d3.pie()
            .sort(null)
            .value(function(d){
                return d.value;
            });

        var arcs = d3.selectAll(".arc")
            .remove()
            .exit();

        var chartCenter = d3.selectAll(".chart-center");    
        
        var g = chartCenter.selectAll(".arc")
            .data(pie(data))
            .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { 
            return getFillColor(d.data.condition); 
        });        
    }
}

$(document).ready(getMap);
