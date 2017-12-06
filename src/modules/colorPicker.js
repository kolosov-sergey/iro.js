import wheel from "ui/wheel";
import slider from "ui/slider";
import svg from "ui/svg";
import iroColor from "modules/color";
import iroStyleSheet from "modules/stylesheet";

const EVENT_MOUSEDOWN = "mousedown",
      EVENT_MOUSEMOVE = "mousemove",
      EVENT_MOUSEUP = "mouseup",
      EVENT_TOUCHSTART = "touchstart",
      EVENT_TOUCHMOVE = "touchmove",
      EVENT_TOUCHEND = "touchend",
      EVENT_READYSTATE_CHANGE = "readystatechange",
      READYSTATE_COMPLETE = "complete";

/**
  * @desc listen to one or more events on an element
  * @param {Element} el target element
  * @param {Array} eventList the events to listen to
  * @param {Function} callback the event callback function
*/
function listen(el, eventList, callback) {
  for (var i = 0; i < eventList.length; i++) {
    el.addEventListener(eventList[i], callback);
  }
};

/**
  * @desc remove an event listener on an element
  * @param {Element} el target element
  * @param {Array} eventList the events to remove
  * @param {Function} callback the event callback function
*/
function unlisten(el, eventList, callback) {
  for (var i = 0; i < eventList.length; i++) {
    el.removeEventListener(eventList[i], callback);
  }
};

/**
  * @desc call fn callback when the page document is ready
  * @param {Function} callback callback function to be called
*/
function whenReady(callback) {
  var _this = this;
  if (document.readyState == READYSTATE_COMPLETE) {
    callback();
  }
  else {
    listen(document, [EVENT_READYSTATE_CHANGE], function stateChange(e) {
      if (document.readyState == READYSTATE_COMPLETE) {
        callback();
        unlisten(document, [EVENT_READYSTATE_CHANGE], stateChange);
      }
    });
  }
};

/**
  * @constructor color wheel object
  * @param {Element | String} el - a DOM element or the CSS selector for a DOM element to use as a container for the UI
  * @param {Object} params - options for this instance
*/
const colorPicker = function(el, params) {
  params = params || {};
  // event storage for `on` and `off`
  this._events = {};
  this._mouseTarget = false;
  this._colorChangeActive = false;
  this._params = params;
  // Wait for the document to be ready, then init the UI
  whenReady(() => {this._init(el, params)});
}

colorPicker.prototype = {
  constructor: colorPicker,

  /**
    * @desc init the color picker UI
    * @param {Element | String} el - a DOM element or the CSS selector for a DOM element to use as a container for the UI
    * @param {Object} params - options for this instance
    * @access protected
  */
  _init: function(el, params) {
    // If `el` is a string, use it to select an Element, else assume it's an element
    el = ("string" == typeof el) ? document.querySelector(el) : el;

    var defaults = {
      width: parseInt(el.width) || 320,
      height: parseInt(el.height) || 320,
      color: "#fff",
      padding: 6,
      borderWidth: 0,
      borderColor: "#fff",
      markerRadius: 8,
      sliderMargin: 24,
      wheelLightness: true,
      anticlockwise: false,
      css: false
    };
    // merge provided params with defaults
    for (var prop in defaultParams) {
      params[prop] = params.hasOwnProperty(prop) ? params[prop] : defaultParams[prop];
    }

    var width = params.width;
    var height = params.height;
    params.sliderHeight = params.sliderHeight || (params.markerRadius * 2 + params.padding * 2 + params.borderWidth * 2);
    params._contentWidth = Math.min(height - params.sliderHeight - params.sliderMargin, width);
    params._wheelHeight = params._contentWidth;

    // Create UI elements
    this.el = el;
    this.svg = new svg(el, width, height);
    this.ui = [
      new slider(this.svg, "value", params),
      new wheel(this.svg, params)
    ];
    // Create an iroStyleSheet for this colorWheel's CSS overrides
    this._css = params.css;
    this.stylesheet = new iroStyleSheet();
    // Create an iroColor to store this colorWheel's selected color
    this.color = new iroColor();
    // Whenever the selected color changes, trigger a colorWheel update too
    this.color._onChange = this._update.bind(this);
    this.color.set(params.color);
    // Hacky workaround for a couple of Safari SVG url bugs
    // See https://github.com/jaames/iro.js/issues/18
    // TODO: perhaps make this a seperate plugin, it's hacky and takes up more space than I'm happy with
    this.on("history:stateChange", () => {this.svg.updateUrls()});
    // Listen to events
    listen(this.svg.el, [EVENT_MOUSEDOWN, EVENT_TOUCHSTART], this);
  },

  /**
    * @desc update the selected color
    * @param {Object} newValue - the new HSV values
    * @param {Object} oldValue - the old HSV values
    * @param {Object} changes - booleans for each HSV channel: true if the new value is different to the old value, else false
    * @access protected
  */
  _update: function(color, changes) {
    // Loop through each UI element and update it
    for (var i = 0; i < this.ui.length; i++) {
      this.ui[i].update(color, changes); 
    }
    if (this._css) {
      var rgb = color.rgbString;
      var css = this._css;
       // Update the stylesheet too
      for (var selector in css) {
        var properties = css[selector];
        for (var prop in properties) {
          this.stylesheet.setRule(selector, prop, rgb);
        }
      } 
    }
    // Prevent infinite loops if the color is set inside a `color:change` callback
    if (!this._colorChangeActive) {
      // While _colorChangeActive = true, this event cannot be fired
      this._colorChangeActive = true;
      this.emit("color:change", color, changes);
      this._colorChangeActive = false;
    }
  },

    /**
    * @desc Set a callback function for an event
    * @param {String} eventType The name of the event to listen to, pass "*" to listen to all events
    * @param {Function} callback The watch callback
  */
  on: function(eventType, callback) {
    var events = this._events;
    (events[eventType] || (events[eventType] = [])).push(callback);
  },

  /**
    * @desc Remove a callback function for an event added with on()
    * @param {String} eventType The name of the event
    * @param {Function} callback The watch callback to remove from the event
  */
  off: function(eventType, callback) {
    var eventList = this._events[eventType];
    if (eventList) evenList.splice(eventList.indexOf(callback), 1);
  },

  /**
    * @desc Emit an event
    * @param {String} eventType The name of the event to emit
    * @param {Array} args array of args to pass to callbacks
  */
  emit: function(eventType, ...args) {
    var events = this._events,
        callbackList = (events[eventType] || []).concat((events["*"] || []));
    for (var i = 0; i < callbackList.length; i++) {
      callbackList[i].apply(null, args); 
    }
  },

  /**
    * @desc DOM event handler
    * @param {Event} e DOM event (currently either mouse or touch events)
  */
  handleEvent: function(e) {
    // Detect if the event is a touch event by checking if it has the `touches` property
    // If it is a touch event, use the first touch input
    var point = e.touches ? e.changedTouches[0] : e,
        // Get the screen position of the UI
        rect = this.svg.el.getBoundingClientRect(),
        // Convert the screen-space pointer position to local-space
        x = point.clientX - rect.left,
        y = point.clientY - rect.top;
        
    switch (e.type) {
      case EVENT_MOUSEDOWN:
      case EVENT_TOUCHSTART:
        // Loop through each UI element and check if the point "hits" it
        for (var i = 0; i < this.ui.length; i++) {
          var uiElement = this.ui[i];
          // If the element is hit, this means the user has clicked the element and is trying to interact with it
          if (uiElement.checkHit(x, y)) {
            // Set an internal reference to the uiElement being interacted with, for other internal event handlers
            this._mouseTarget = uiElement;
            // Attach event listeners
            listen(document, [EVENT_MOUSEMOVE, EVENT_TOUCHMOVE, EVENT_MOUSEUP, EVENT_TOUCHEND], this);
            // Emit input start event
            this.emit("input:start");
            // Finally, use the position to update the picked color
            this.color.hsv = this._mouseTarget.input(x, y);
          }
        }
        break;
      case EVENT_MOUSEMOVE:
      case EVENT_TOUCHMOVE:
        // Use the position to update the picker color
        this.color.hsv = this._mouseTarget.input(x, y);
        break;
      case EVENT_MOUSEUP:
      case EVENT_TOUCHEND:
        this._mouseTarget = false;
        this.emit("input:end");
        unlisten(document, [EVENT_MOUSEMOVE, EVENT_TOUCHMOVE, EVENT_MOUSEUP, EVENT_TOUCHEND], this);
        break;
    }
    if (this._mouseTarget) {
      e.preventDefault();
    }
  }
}

module.exports = colorPicker;