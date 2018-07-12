var cartoDark = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd'
});

var countyStyle = {
//        fillColor: "#ffffff",
        color: "#333333",
        weight: 1,
        opacity: .2,
        fillOpacity: 0
};

var blockStyle = {
    fillOpacity: 0,
    color: '#FF6801',
    opacity: 1,
    weight: .75
};

var highlight = {
    "fillColor": '#3C2E63',
    "fillOpacity": .1,
    'color': '#3C2E63',
    'weight': 2,
    'opacity': 1
};

var blockHighlight = {
    "fillColor": '#FF6801',
    "fillOpacity": .8,
    'color': '#3C2E63',
    'weight': 2,
    'opacity': 1
}

var counties = L.geoJson(us_counties, {
    style: countyStyle
});

var map = L.map("map", {
    maxZoom: 18,
}).setView([38.70, -95.21], 5);

cartoDark.addTo(map);
counties.addTo(map);

var x;


counties.on("click", function(e){
    map.eachLayer(function(layer){
        if (layer._leaflet_id == x){
            map.removeLayer(layer);
        }
    });
    counties.setStyle(countyStyle);
    $("#charts").empty();
    var state = e.layer.feature.properties.STATEFP;
    var county = e.layer.feature.properties.COUNTYFP;
    var politicalData = getPoliticalData(state, county);
    getCountyName(state, county);
    getPopData(state, county);
    getAgeData(state, county);
    getHouseholdIncomeData(state, county);
    getRentData(state, county);
    getTenureData(state, county);
    setTimeout(function(){
        politicalDataChart(politicalData);
    }, 1500);
    e.layer.setStyle(highlight);
    map.fitBounds(e.layer.getBounds());
    var blocks = new L.esri.FeatureLayer({
        url: "https://tigerweb.geo.census.gov/arcgis/rest/services/Generalized_ACS2015/Tracts_Blocks/MapServer/4",
        where: ("STATE = '" + state + "' AND COUNTY = '" + county + "'"),
        style: blockStyle
        }
    );
    map.addLayer(blocks);
    x = blocks._leaflet_id;
    blocks.on("click", function(e){
        $("#charts").empty();
        blocks.setStyle(blockStyle);
        getCountyName(state, county);
        e.layer.setStyle(blockHighlight);
        map.fitBounds(e.layer.getBounds());
        setTimeout(function(){
            var tract = e.layer.feature.properties.TRACT;
            var blockGrp = e.layer.feature.properties.BLKGRP;
            $("#charts").append("<h5><b><em>Comparison Between County and Selected Block Group</em></b></h5>");
            $("#charts").append('<div class="btn-toolbar" id="buttonToolbar"</div>');
            $("#buttonToolbar").append('<button type="button" id="popCompareButton" class="btn btn-secondary buth">Population</button>');
            $("#buttonToolbar").append('<button type="button" id="ageCompareButton" class="btn btn-secondary buth">Age</button>');
            $("#popCompareButton").on("click", function(){
                setTimeout(function(){
                    var blockPop = blockPopData(state, county, tract, blockGrp);
                    getPopData(state, county);
                    setTimeout(function(){
                        blockPopChart(blockPop);
                    }, 500);

                }, 1000)
            });
            $("#ageCompareButton").on("click", function(){
                setTimeout(function(){
                    var blockAge = blockAgeData(state, county, tract, blockGrp);
                    getAgeData(state, county);
                    setTimeout(function(){
                        blockAgeDataChart(blockAge);
                    }, 500);

                }, 1000)
            });
        }, 250);
    });
});

function getCountyName(s, c){
    var apiKey = "15e010985fea0f60788ce321d080bc83cfcfbf60";
    var popURL = "https://api.census.gov/data/2015/acs5?get=NAME,B01001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    $.getJSON(popURL, function(data){
        $("#charts").append("<h4><b><em>" + data[1][0] + "</em></b></h4><hr>");
    });
}

function getPopData(s, c){
    var apiKey = "15e010985fea0f60788ce321d080bc83cfcfbf60";
    var popURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B01001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var popURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B01001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var popURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B01001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var popURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B01001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var popURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B01001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;

    var d = {};
    
    $.when(
        
        $.getJSON(popURL_2011, function(data){
            d["population_2011"] = data[1][1];
        }),
        $.getJSON(popURL_2012, function(data){
            d["population_2012"] = data[1][1];
        }),
        $.getJSON(popURL_2013, function(data){
            d["population_2013"] = data[1][1];
        }),
        $.getJSON(popURL_2014, function(data){
            d["population_2014"] = data[1][1];
        }),
        $.getJSON(popURL_2015, function(data){
            d["population_2015"] = data[1][1];
        })
    ).then(function(){
        popDataChart(d);
    });
}

function popDataChart(d){
    $("#charts").append('<canvas id="popChangeChart" class="newChart" width="400" height="150"></canvas>');
    $("#charts").append('<p style="font-size: 13px">Population Change from 2011 to 2015: <b>' + (d.population_2015 - d.population_2011) + '</b></p><hr>');
    var popData = {
        datasets: [
            {
            label: [],
            backgroundColor: ["#335D7E"],
            borderColor: "#F2C545",
//            borderColor: ["#cccccc","#cccccc"],
            data: [d.population_2011,d.population_2012,d.population_2013,d.population_2014,d.population_2015]
            }
        ],
        labels: ["2011", "2012", "2013", "2014", "2015"]
    };
    
    var popChangeChart = new Chart(document.getElementById("popChangeChart"), {
        type: "line",
        data: popData,
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                fontSize: 16,
                text: "Population Change from 2011 to 2015"
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Population"
                    }
                }]
            }
        }
    });    
}

function blockPopData(s, c, t, b){
    var apiKey = "15e010985fea0f60788ce321d080bc83cfcfbf60";

    var blockPopURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B01001_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    var blockPopURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B01001_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    var blockPopURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B01001_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    var blockPopURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B01001_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    var blockPopURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B01001_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    
    var bpd = {};
    
    $.getJSON(blockPopURL_2011, function(data){
        bpd["blockPop_2011"] = data[1][1];
    });
    $.getJSON(blockPopURL_2012, function(data){
        bpd["blockPop_2012"] = data[1][1];
    });

    $.getJSON(blockPopURL_2013, function(data){
        bpd["blockPop_2013"] = data[1][1];
    });
    $.getJSON(blockPopURL_2014, function(data){
        bpd["blockPop_2014"] = data[1][1];
    });
    $.getJSON(blockPopURL_2015, function(data){
        bpd["blockPop_2015"] = data[1][1];
    });
    
    return bpd;
}

function blockPopChart(bpd){
    $("#charts").append('<canvas id="blockPopChart" class="newChart" width="400" height="150"></canvas>');
    $("#charts").append('<p style="font-size: 13px">Population Change from 2011 to 2015: <b>' + (bpd.blockPop_2015 - bpd.blockPop_2011) + '</b></p><hr>');
    var blockPopData = {
        datasets: [
            {
            label: [],
            backgroundColor: ["#335D7E"],
            borderColor: "#F2C545",
//            borderColor: ["#cccccc","#cccccc"],
            data: [bpd.blockPop_2011,bpd.blockPop_2012,bpd.blockPop_2013,bpd.blockPop_2014,bpd.blockPop_2015]
            }
        ],
        labels: ["2011", "2012", "2013", "2014", "2015"]
    };
    
    var blockPopChart = new Chart(document.getElementById("blockPopChart"), {
        type: "line",
        data: blockPopData,
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                fontSize: 16,
                text: "Population Change from 2011 to 2015"
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Population (Block)"
                    }
                }]
            }
        }
    });    
}

function getAgeData(s, c){
    var apiKey = "15e010985fea0f60788ce321d080bc83cfcfbf60";
    var ageURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B01002_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ageURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B01002_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ageURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B01002_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ageURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B01002_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ageURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B01002_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;

    a = {};
    
    $.when(
    
        $.getJSON(ageURL_2011, function(data){
            a["mAge_2011"] = data[1][1];
        }),
        $.getJSON(ageURL_2012, function(data){
            a["mAge_2012"] = data[1][1];
        }),
        $.getJSON(ageURL_2013, function(data){
            a["mAge_2013"] = data[1][1];
        }),
        $.getJSON(ageURL_2014, function(data){
            a["mAge_2014"] = data[1][1];
        }),
        $.getJSON(ageURL_2015, function(data){
            a["mAge_2015"] = data[1][1];
        })
    ).then(function(){
        ageDataChart(a);
    });
}

function ageDataChart(a){
    $("#charts").append('<canvas id="ageChangeChart" class="newChart" width="375" height="150"></canvas>');
    $("#charts").append('<p style="font-size: 13px">Median Age Change from 2011 to 2015: <b>' + (a.mAge_2015 - a.mAge_2011).toFixed(1) + '</b></p><hr>');
    var ageData = {
        datasets: [
            {
            label: [],
            backgroundColor: ["#3C2E63"],
            borderColor: "#CF6402",
//            borderColor: ["#cccccc","#cccccc"],
            data: [a.mAge_2011,a.mAge_2012,a.mAge_2013,a.mAge_2014,a.mAge_2015]
            }
        ],
        labels: ["2011", "2012", "2013", "2014", "2015"],
    };
    
    var ageChangeChart = new Chart(document.getElementById("ageChangeChart"), {
        type: "line",
        data: ageData,
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                fontSize: 16,
                text: "Median Age Change from 2011 to 2015"
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Median Age"
                    }
                }]
            }
        }
    });
}

function blockAgeData(s, c, t, b) {
    var apiKey = "15e010985fea0f60788ce321d080bc83cfcfbf60";
    var blockAgeURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B01002_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    var blockAgeURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B01002_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    var blockAgeURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B01002_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    var blockAgeURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B01002_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    var blockAgeURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B01002_001E&for=block+group:" + b + "&in=county:" + c + "&in=state:" + s + "&in=tract:" + t + "&key=" + apiKey;
    
    var bage = {};
    
    $.getJSON(blockAgeURL_2011, function(data){
        bage["blockAge_2011"] = data[1][1];
    });
    $.getJSON(blockAgeURL_2012, function(data){
        bage["blockAge_2012"] = data[1][1];
    });

    $.getJSON(blockAgeURL_2013, function(data){
        bage["blockAge_2013"] = data[1][1];
    });
    $.getJSON(blockAgeURL_2014, function(data){
        bage["blockAge_2014"] = data[1][1];
    });
    $.getJSON(blockAgeURL_2015, function(data){
        bage["blockAge_2015"] = data[1][1];
    });
    
    return bage;
}

function blockAgeDataChart(a){
    $("#charts").append('<canvas id="ageBlockChart" class="newChart" width="375" height="150"></canvas>');
    $("#charts").append('<p style="font-size: 13px">Median Age Change from 2011 to 2015: <b>' + (a.blockAge_2015 - a.blockAge_2011).toFixed(1) + '</b></p><hr>');
    var ageBlockData = {
        datasets: [
            {
            label: [],
            backgroundColor: ["#3C2E63"],
            borderColor: "#CF6402",
//            borderColor: ["#cccccc","#cccccc"],
            data: [a.blockAge_2011,a.blockAge_2012,a.blockAge_2013,a.blockAge_2014,a.blockAge_2015]
            }
        ],
        labels: ["2011", "2012", "2013", "2014", "2015"],
    };
    
    var ageChangeChart = new Chart(document.getElementById("ageBlockChart"), {
        type: "line",
        data: ageBlockData,
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                fontSize: 16,
                text: "Median Age Change from 2011 to 2015"
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Median Age (Block)"
                    }
                }]
            }
        }
    });
}

function getTenureData(s, c){
    var apiKey = "15e010985fea0f60788ce321d080bc83cfcfbf60";
    var housingUnitsURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B25001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var housingUnitsURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B25001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var housingUnitsURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B25001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var housingUnitsURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B25001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var housingUnitsURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B25001_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ownedURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B25003_002E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ownedURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B25003_002E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ownedURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B25003_002E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ownedURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B25003_002E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var ownedURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B25003_002E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B25003_003E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B25003_003E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B25003_003E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B25003_003E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B25003_003E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;

    ten = {};
    
    $.when(
        $.getJSON(ownedURL_2011, function(data){
        ten["owned_2011"] = data[1][1];
        }),
        $.getJSON(ownedURL_2012, function(data){
            ten["owned_2012"] = data[1][1];
        }),
        $.getJSON(ownedURL_2013, function(data){
            ten["owned_2013"] = data[1][1];
        }),
        $.getJSON(ownedURL_2014, function(data){
            ten["owned_2014"] = data[1][1];
        }),
        $.getJSON(ownedURL_2015, function(data){
            ten["owned_2015"] = data[1][1];
        }),
        $.getJSON(rentURL_2011, function(data){
            ten["rent_2011"] = data[1][1];
        }),
        $.getJSON(rentURL_2012, function(data){
            ten["rent_2012"] = data[1][1];
        }),
        $.getJSON(rentURL_2013, function(data){
            ten["rent_2013"] = data[1][1];
        }),
        $.getJSON(rentURL_2014, function(data){
            ten["rent_2014"] = data[1][1];
        }),
        $.getJSON(rentURL_2015, function(data){
            ten["rent_2015"] = data[1][1];
        }),
        $.getJSON(housingUnitsURL_2011, function(data){
            ten["housingUnits_2011"] = data[1][1];
        }),
        $.getJSON(housingUnitsURL_2012, function(data){
            ten["housingUnits_2012"] = data[1][1];
        }),
        $.getJSON(housingUnitsURL_2013, function(data){
            ten["housingUnits_2013"] = data[1][1];
        }),
        $.getJSON(housingUnitsURL_2014, function(data){
            ten["housingUnits_2014"] = data[1][1];
        }),
        $.getJSON(housingUnitsURL_2015, function(data){
            ten["housingUnits_2015"] = data[1][1];
        })
        
    ).then(function(){
        tenureDataChart(ten);
    });
}

function tenureDataChart(ten, e){
    $("#charts").append('<canvas id="tenureChangeChart" class="newChart" width="375" height="150"></canvas>');
    $("#charts").append('<p style="font-size: 13px">Owner Occupied Change from 2011 to 2015: <b>' + ((ten.owned_2015 / ten.housingUnits_2015 * 100) - (ten.owned_2011 / ten.housingUnits_2011 * 100)).toFixed(1) + ' Percent</b></p>');
    $("#charts").append('<p style="font-size: 13px">Renter Occupied Change from 2011 to 2015: <b>' + ((ten.rent_2015 / ten.housingUnits_2015 * 100) - (ten.rent_2011 / ten.housingUnits_2011 * 100)).toFixed(1) + ' Percent</b></p><hr>');
    var tenureData = {
            datasets: [
                {
                label: "Owner Occupied",
                fill: false,
                borderColor: "#FFA3B0",
                data: [(ten.owned_2011 / ten.housingUnits_2011 * 100).toFixed(1),(ten.owned_2012 / ten.housingUnits_2012 * 100).toFixed(1),(ten.owned_2013 / ten.housingUnits_2013 * 100).toFixed(1),(ten.owned_2014 / ten.housingUnits_2014 * 100).toFixed(1),(ten.owned_2015 / ten.housingUnits_2015 * 100).toFixed(1)]
                },
                {
                label: "Renter Occupied",
                fill: false,
                borderColor: "#21aa11",
                data: [(ten.rent_2011 / ten.housingUnits_2011 * 100).toFixed(1),(ten.rent_2012 / ten.housingUnits_2012 * 100).toFixed(1),(ten.rent_2013 / ten.housingUnits_2013 * 100).toFixed(1),(ten.rent_2014 / ten.housingUnits_2014 * 100).toFixed(1),(ten.rent_2015 / ten.housingUnits_2015 * 100).toFixed(1)]
                }
            ],
        labels: ["2011", "2012", "2013", "2014", "2015"]
    };
    
    var ageChangeChart = new Chart(document.getElementById("tenureChangeChart"), {
        type: "line",
        data: tenureData,
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                fontSize: 16,
                text: "Tenure Change from 2011 to 2015"
            },
            scales: {
                yAxes: [{
//                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: "Tenure"
                    }
                }]
            }
        }
    });
}

function getHouseholdIncomeData(s, c){
    var apiKey = "15e010985fea0f60788ce321d080bc83cfcfbf60";
    var incURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B19013_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var incURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B19013_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var incURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B19013_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var incURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B19013_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var incURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B19013_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;

    inc = {};
    
    $.when(
        $.getJSON(incURL_2011, function(data){
        inc["income_2011"] = data[1][1];
        }),
        $.getJSON(incURL_2012, function(data){
            inc["income_2012"] = data[1][1];
        }),
        $.getJSON(incURL_2013, function(data){
            inc["income_2013"] = data[1][1];
        }),
        $.getJSON(incURL_2014, function(data){
            inc["income_2014"] = data[1][1];
        }),
        $.getJSON(incURL_2015, function(data){
            inc["income_2015"] = data[1][1];
        })
    ).then(function(){
        incomeDataChart(inc);
    });
}

function incomeDataChart(inc, e){
    $("#charts").append('<canvas id="incomeChangeChart" class="newChart" width="375" height="150"></canvas>');
    $("#charts").append('<p style="font-size: 13px">Median Household Income Change from 2011 to 2015: <b>' + (inc.income_2015 - inc.income_2011) + '</b></p><hr>');
    var ageData = {
        datasets: [
            {
            label: [],
            borderColor: "#b7903c",
            backgroundColor: ["#234d20"],
//            borderColor: ["#cccccc","#cccccc"],
            data: [inc.income_2011,inc.income_2012,inc.income_2013,inc.income_2014,inc.income_2015]
            }
        ],
        labels: ["2011", "2012", "2013", "2014", "2015"],
    };
    
    var ageChangeChart = new Chart(document.getElementById("incomeChangeChart"), {
        type: "line",
        data: ageData,
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                fontSize: 16,
                text: "Median Household Income Change from 2011 to 2015"
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Household Income (yr)"
                    }
                }]
            }
        }
    });
}

function getRentData(s, c){
    var apiKey = "15e010985fea0f60788ce321d080bc83cfcfbf60";
    var rentURL_2011 = "https://api.census.gov/data/2011/acs5?get=NAME,B25064_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2012 = "https://api.census.gov/data/2012/acs5?get=NAME,B25064_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2013 = "https://api.census.gov/data/2013/acs5?get=NAME,B25064_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2014 = "https://api.census.gov/data/2014/acs5?get=NAME,B25064_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;
    var rentURL_2015 = "https://api.census.gov/data/2015/acs5?get=NAME,B25064_001E&for=county:" + c + "&in=state:" + s + "&key=" + apiKey;

    rent = {};
    
    $.when(
        $.getJSON(rentURL_2011, function(data){
        rent["rent_2011"] = data[1][1];
        }),
        $.getJSON(rentURL_2012, function(data){
            rent["rent_2012"] = data[1][1];
        }),
        $.getJSON(rentURL_2013, function(data){
            rent["rent_2013"] = data[1][1];
        }),
        $.getJSON(rentURL_2014, function(data){
            rent["rent_2014"] = data[1][1];
        }),
        $.getJSON(rentURL_2015, function(data){
            rent["rent_2015"] = data[1][1];
        })    
    ).then(function(){
        rentDataChart(rent);
    });
}

function rentDataChart(rent, e){
    $("#charts").append('<canvas id="rentChangeChart" class="newChart" width="375" height="150"></canvas>');
    $("#charts").append('<p style="font-size: 13px">Median Gross Rent Change from 2011 to 2015: <b>' + (rent.rent_2015 - rent.rent_2011) + '</b></p><hr>');
    var rentData = {
        datasets: [
            {
            label: [],
            borderColor: "#234d20",
            backgroundColor: ["#b7903c"],
//            borderColor: ["#cccccc","#cccccc"],
            data: [rent.rent_2011,rent.rent_2012,rent.rent_2013,rent.rent_2014,rent.rent_2015]
            }
        ],
        labels: ["2011", "2012", "2013", "2014", "2015"],
    };
    
    var ageChangeChart = new Chart(document.getElementById("rentChangeChart"), {
        type: "line",
        data: rentData,
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                fontSize: 16,
                text: "Median Gross Rent Change from 2011 to 2015"
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Median Gross Rent (mo)"
                    }
                }]
            }
        }
    });
}

function getPoliticalData(s, c){
    
    var pol = {};
    
    for (var x = 0; x < election2016.length; x++) {
        if (election2016[x].combined_fips == (s.toString() + c.toString())){
            pol["demPercent_2016"] = (election2016[x].votes_dem / election2016[x].total_votes * 100).toFixed(2);
            pol["repPercent_2016"] = (election2016[x].votes_gop / election2016[x].total_votes * 100).toFixed(2);
        }
    };
    for (var x = 0; x < election2012.length; x++) {
        if (election2012[x].FIPS == (s.toString().replace(/^0+/, "") + c.toString())){
            pol["demPercent_2012"] = election2012[x].PCT_OBM.toFixed(2);
            pol["repPercent_2012"] = election2012[x].PCT_ROM.toFixed(2);
        }
    };
    
    for (var x = 0; x < election2008.length; x++) {
        if (election2008[x].FIPS == (s.toString().replace(/^0+/, "") + c.toString())){
            pol["demPercent_2008"] = election2008[x].PERCENT_DE.toFixed(2);
            pol["repPercent_2008"] = election2008[x].PERCENT_RE.toFixed(2);
        }
    };
    
    return pol;
}

function politicalDataChart(pol, e){
    $("#charts").append('<canvas id="politicalChangeChart" class="newChart" width="375" height="150"></canvas>');
    $("#charts").append('<p style="font-size: 13px">Percent Change Voting for Democratic President from 2008 to 2016: <b>' + (pol.demPercent_2016 - pol.demPercent_2008).toFixed(1) + '</b></p>');
    $("#charts").append('<p style="font-size: 13px">Percent Change Voting for Republican President from 2008 to 2016: <b>' + (pol.repPercent_2016 - pol.repPercent_2008).toFixed(1) + '</b></p><hr>');
    var politicalData = {
            datasets: [
                {
                label: "Voted for Democratic Candidate",
                fill: false,
                borderColor: "#0000AA",
                data: [pol.demPercent_2008, pol.demPercent_2012, pol.demPercent_2016]
                },
                {
                label: "Voted for Republican Candidate",
                fill: false,
                borderColor: "#AA0000",
                data: [pol.repPercent_2008, pol.repPercent_2012, pol.repPercent_2016]
                }
            ],
        labels: ["2008", "2012", "2016"]
    };
    
    var polChangeChart = new Chart(document.getElementById("politicalChangeChart"), {
        type: "line",
        data: politicalData,
        options: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                fontSize: 16,
                text: "Political Change from 2008 to 2016"
            },
            scales: {
                yAxes: [{
//                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: "Pecentage of Votes Cast"
                    }
                }]
            }
        }
    });
}
