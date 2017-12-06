// css class prefix for this element
var CLASS_PREFIX = "iro__marker";

 /**
  * @constructor marker UI
  * @param {svgRoot} svg - svgRoot object
  * @param {Object} params - options
*/
const marker = function (svg, params) {
  var radius = params.markerRadius;
  var baseGroup = svg.g({
    class: CLASS_PREFIX
  });
  baseGroup.circle(0, 0, radius, {
    class: CLASS_PREFIX + "__outer",
    fill: "none",
    strokeWidth: 5,
    stroke: "#000",
  });
  baseGroup.circle(0, 0, radius, {
    class: CLASS_PREFIX + "__inner",
    fill: "none",
    strokeWidth: 2,
    stroke: "#fff",
  });
  this.g = baseGroup;
};

marker.prototype = {
  constructor: marker,

  /**
    * @desc move marker to centerpoint (x, y) and redraw
    * @param {Number} x - point x coordinate
    * @param {Number} y - point y coordinate
  */
  move: function(x, y) {
    this.g.setTransform("translate", [x, y]);
  }
};

module.exports = marker;