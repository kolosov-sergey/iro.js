import marker from "ui/marker";
import iroColor from "modules/color";

// css class prefix for this element
var CLASS_PREFIX = "iro__slider";

/**
  * @constructor slider UI
  * @param {svgRoot} svg - svgRoot object
  * @param {Object} params - options
*/
const slider = function (svg, sliderType, params) {
  var width = params._contentWidth;
  var height = params.sliderHeight;
  var borderWidth = params.borderWidth;
  var radius = height / 2 - borderWidth / 2;
  var marginLeftRight = (params.width - width) / 2;
  var marginTop = params._wheelHeight + params.sliderMargin;
  var cap = (height / 2);

  var baseGroup = svg.g({
    class: CLASS_PREFIX,
  });

  baseGroup.setTransform("translate", [marginLeftRight, marginTop]);

  this._gradient = svg.gradient("linear", {
    0: {color: "#000"},
    100: {color: "#fff"}
  });

  var rect = baseGroup.insert("rect", {
    class: CLASS_PREFIX + "__value",
    fill: this._gradient.url,
    dataurl: "fill:" + this._gradient.id,
    rx: radius,
    ry: radius,
    x: borderWidth / 2,
    y: borderWidth / 2,
    width: width - borderWidth,
    height: height - borderWidth,
    strokeWidth: borderWidth,
    stroke: params.borderColor
  });

  this._sliderType = sliderType;
  this._width = width;
  this._height = height;
  this._cap = cap;
  this._trackRange = width - cap * 2
  this._x = marginLeftRight;
  this._y = marginTop;
  this._params = params;
  this.marker = new marker(baseGroup, params);
};

slider.prototype = {
  constructor: slider,

  /**
    * @desc updates this element to represent a new color value
    * @param {Object} color - an iroColor object with the new color value
    * @param {Object} changes - an object that gives a boolean for each HSV channel, indicating whether ot not that channel has changed
  */
  update: function(color, changes) {
    var hsv = color.hsv;
    if (this._sliderType == "value") {
      if (changes.h || changes.s) {
        var hsl = iroColor.hsv2Hsl({h: hsv.h, s: hsv.s, v: 100});
        this._gradient.stops[1].setAttrs({stopColor: "hsl(" + hsl.h + "," + hsl.s + "%," + hsl.l + "%)"});
      }
      if (changes.v) {
        var percent = (hsv.v / 100);
        this.marker.move(this._cap + (percent * this._trackRange), this._height / 2);
      }
    }
  },

  /**
    * @desc Takes a point at (x, y) and returns HSV values based on this input -- use this to update a color from mouse input
    * @param {Number} x - point x coordinate
    * @param {Number} y - point y coordinate
    * @return {Object} - new HSV color values (some channels may be missing)
  */
  input: function(x, y) {
    var trackStart = this._x + this._cap;
    var trackEnd = this._x + this._width - this._cap;
    var dist = Math.max(Math.min(x, trackEnd), trackStart) - trackStart;
    return {
      v: Math.round((100 / this._trackRange) * dist)
    };
  },

  /**
    * @desc Check if a point at (x, y) is inside this element
    * @param {Number} x - point x coordinate
    * @param {Number} y - point y coordinate
    * @return {Boolean} - true if the point is a "hit", else false
  */
  checkHit: function(x, y) {
    return (x > this._x) && (x < this._x + this._width) && (y > this._y) && (y < this._y + this._height);
  }

};

module.exports = slider;