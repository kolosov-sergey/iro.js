import marker from "ui/marker";

// css class prefix for this element
var CLASS_PREFIX = "iro__wheel";
// Quick references to reused math functions
var PI = Math.PI,
    sqrt = Math.sqrt,
    abs = Math.abs,
    round = Math.round;

/**
  * @constructor hue wheel UI
  * @param {svgRoot} svg - svgRoot object
  * @param {Object} params - options
*/
const wheel = function (svg, params) {
  var borderWidth = params.borderWidth;
  var radius = params._contentWidth / 2 - borderWidth;
  var cx = ((params.width - params._contentWidth) / 2) + radius + borderWidth;
  var cy = radius + borderWidth;
  var markerLimit = radius - (params.markerRadius + params.padding);

  var baseGroup = svg.g({
    class: CLASS_PREFIX,
  });

  baseGroup.circle(cx, cy, radius + borderWidth / 2, {
    class: CLASS_PREFIX + "__border",
    fill: "#fff",
    stroke: params.borderColor,
    strokeWidth: borderWidth
  });

  var ringGroup = baseGroup.g({
    class: CLASS_PREFIX + "__hue",
    strokeWidth: radius,
    fill: "none",
  });

  for (var hue = 0; hue < 360; hue++) {
    ringGroup.arc(cx, cy, radius / 2, hue, hue + 1.5, {
      stroke: "hsl(" + (params.anticlockwise ? 360 - hue : hue) + ",100%,50%)",
    });
  }

  var gradient = svg.gradient("radial", {
    0: {
      color: "#fff"
    },
    100: {
      color:"#fff", 
      opacity: 0
    }
  });

  var saturation = baseGroup.circle(cx, cy, radius, {
    class: CLASS_PREFIX + "__saturation",
    fill: gradient.url,
    dataurl: "fill:" + gradient.id,
  });

  this._lightness = baseGroup.circle(cx, cy, radius, {
    class: CLASS_PREFIX + "__lightness",
    opacity: 0
  });

  this._cx = cx;
  this._cy = cy;
  this._radius = radius;
  this._markerLimit = markerLimit;
  this._params = params;
  this._anticlockwise = params.anticlockwise;
  this.marker = new marker(baseGroup, params);
};

wheel.prototype = {
  constructor: wheel,

  /**
    * @desc updates this element to represent a new color value
    * @param {Object} color - an iroColor object with the new color value
    * @param {Object} changes - an object that gives a boolean for each HSV channel, indicating whether ot not that channel has changed
  */
  update: function(color, changes) {
    var hsv = color.hsv;
    // If the V channel has changed, redraw the wheel UI with the new value
    if (changes.v && this._params.wheelLightness) {
      this._lightness.setAttrs({opacity: (1 - hsv.v / 100).toFixed(2)});
    }
    // If the H or S channel has changed, move the marker to the right position
    if (changes.h || changes.s) {
      // convert the hue value to radians, since we'll use it as an angle
      var hueAngle = (this._anticlockwise ? 360 - hsv.h : hsv.h) * (PI / 180);
      // convert the saturation value to a distance between the center of the ring and the edge
      var dist = (hsv.s / 100) * this._markerLimit;
      // Move the marker based on the angle and distance
      this.marker.move(this._cx + dist * Math.cos(hueAngle), this._cy + dist * Math.sin(hueAngle));
    }
  },

  /**
    * @desc Takes a point at (x, y) and returns HSV values based on this input -- use this to update a color from mouse input
    * @param {Number} x - point x coordinate
    * @param {Number} y - point y coordinate
    * @return {Object} - new HSV color values (some channels may be missing)
  */
  input: function(x, y) {
    var markerLimit = this._markerLimit,
        dx = this._cx - x,
        dy = this._cy - y;

    var angle = Math.atan2(dy, dx),
        // Calculate the hue by converting the angle to radians
        hue = round(angle * (180 / PI)) + 180,
        // Find the point's distance from the center of the wheel
        // This is used to show the saturation level
        dist = Math.min(sqrt(dx * dx + dy * dy), markerLimit);
    
    hue = (this._anticlockwise ? 360 - hue : hue);

    // Return just the H and S channels, the wheel element doesn't do anything with the L channel
    return {
      h: hue,
      s: round((100 / markerLimit) * dist)
    };
  },

  /**
    * @desc Check if a point at (x, y) is inside this element
    * @param {Number} x - point x coordinate
    * @param {Number} y - point y coordinate
    * @return {Boolean} - true if the point is a "hit", else false
  */
  checkHit: function(x, y) {
    // Check if the point is within the hue ring by comparing the point's distance from the centre to the ring's radius
    // If the distance is smaller than the radius, then we have a hit
    var dx = abs(x - this._cx),
        dy = abs(y - this._cy);
    return sqrt(dx * dx + dy * dy) < this._radius;
  }
};

module.exports = wheel;