var map = L.map('map').setView([39.862564285, -104.917523860], 15);

// Set basemap
// http://switch2osm.org/using-tiles/getting-started-with-leaflet/
var osmUrl    = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
var osm       = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 20, attribution: osmAttrib})

map.addLayer(osm);

var WaterTap = L.Class.extend({
  statics: {
    GALLONS_PER_SECOND: 1
  },

  initialize: function (layer) {
    this.layer = layer;
    this.lastTimeCollected = Date.now();
    this.centroid = this.layer.getBounds().getCenter();
    this.icon = L.icon({iconUrl: 'images/tap_water.png', iconSize: [32, 32]});
    this.marker = L.marker(this.centroid, {icon: this.icon});
  },

  addTo: function(map) {
    this.map = map;
    this.marker.addTo(map);

    // This is equivalent to the => (fat arrow) in Coffeescript.
    this.marker.on({click: (function(_this) {
      return function(event) {
        amountCollected = _this.collect();
        var gallonElement = document.querySelectorAll('.gallon-amount')[0];
        var gallonString = gallonElement.innerHTML;
        var gallonInt = parseInt(gallonString, 10);
        gallonInt += amountCollected;
        gallonElement.innerHTML = gallonInt.toString();
      }
    })(this)});
  },

  collect: function() {
    var currentTime = Date.now();
    var millisecondsElapsed = currentTime - this.lastTimeCollected;
    var secondsElapsed = Math.floor(millisecondsElapsed/1000);

    this.lastTimeCollected = currentTime;

    return secondsElapsed * WaterTap.GALLONS_PER_SECOND;
  }
});

// Get GeoJSON file with feature
// Thanks http://youmightnotneedjquery.com for the no-jquery way!
var request = new XMLHttpRequest();
request.open('GET', 'js/water_sources.geojson', true);

request.onload = function() {
  if (request.status >= 200 && request.status < 400) {
    // Success!
    var geojson      = JSON.parse(request.responseText);
    var style = {
                  color: '#f00',
                  opacity: 0.8,
                  fillColor: '#f00',
                  fillOpacity: 0.6
                };

    var onEachFeature = function (feature, layer) {
      layer.on({click: function(event) {
        var waterTap = new WaterTap(layer)
        waterTap.addTo(map);
      }});
    }

    var waterSource  = new L.geoJson(geojson, {style: style, onEachFeature: onEachFeature});
    map.addLayer(waterSource);
  } else {
    // We reached our target server, but it returned an error
  }
};

request.onerror = function() {
  console.log("there was a connection error and we couldn't fetch the geojson");
};

request.send();

