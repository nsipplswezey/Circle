//
//  Slider.js
//  LadderOfAbstraction
//
//  Created by Bret Victor on 8/21/11.
//  (c) 2011 Bret Victor.  MIT open-source license.


(function(){


//====================================================================================
//
//  Slider
//
//  lockedVariable is optional.  If not provided, Slider keeps track of the
//  locked value internally.

  //This is the #2 part of the swing model, which is the slider bar.

  //So the slider is an extension of BVScrubbable
  //And it takes arguments of the tangle model
  //And the variable we are simulating
  //And it also takes something called lockedVariable

  //It takes UI/visualization options like the track width, min, max, step, margin, format, extendable
  //Touchable and hoverable are set to true
  //It specifies the actualy size and x, as functions of these options
  //It requires a cap on either side(rounded)
  //A fill, a marker, a knob and a label

  //So at the core of all these animations is a tangle
  //And the tangle has a variable we care about
  //And it has time
  //The slider has it. The SwingAnimator has it.

  //And then a lot of the slider is just how you build the UI

  //And you link the two when you're updating the slider.
  //You need the tangle time and values to move the UI and output data.

Tangle.classes.Slider = new Class({

    Extends: BVScrubbableLayer,

    initialize: function (hostElement, options, tangle, variable, lockedVariable) {
        this.parent(null);
        $(hostElement).grab(this.element);

        this.tangle = tangle;
        this.variable = variable;
        this.lockedVariable = lockedVariable;

        if (!this.tangle.slidersByVariable) { this.tangle.slidersByVariable = {}; }
        this.tangle.slidersByVariable[variable] = this;   // hacky-hack so road can make this slider bounce

        this.trackWidth = parseFloat(options.width) || 200;
        this.min = parseFloat(options.min) || 0;
        this.max = parseFloat(options.max) || 100;
        this.step = parseFloat(options.step) || 1;
        this.xMargin = (options.margin !== undefined) ? parseFloat(options.margin) : 40;
        this.format = options.format;
        this.isExtendable = !!options.extendable && !BVLayer.isTouch;
        this.isTracking = false;

        this.setTouchable(true);
        this.setHoverable(true);

        this.setSize(this.trackWidth + this.xMargin * 2, 28);
        this.setX(-this.xMargin);

        this.leftCap = new BVLayer(this);
        this.leftCap.setContentsURLAndSize("Images/SliderLeft.png", 8,4);
        this.leftCap.setPosition(this.xMargin, -14);

        this.rightCap = new BVLayer(this);
        this.rightCap.setContentsURLAndSize("Images/SliderRight.png", 8,4);
        this.rightCap.setY(this.leftCap.y);

        this.centerFill = new BVLayer(this);
        this.centerFill.setContentsURLAndSize("Images/SliderCenter.png", 4, 4);
        this.centerFill.setPosition(this.xMargin + this.leftCap.width, this.leftCap.y);

        this.lockedMarker = new BVLayer(this);
        this.lockedMarker.setContentsURLAndSize("Images/SliderMarker.png", 8, 4);
        this.lockedMarker.setPosition(this.leftCap.getPosition());

        this.knob = new BVLayer(this);
        this.knob.setContentsURLAndSize("Images/SliderKnob.png", 13, 13);
        this.knob.setY(-10);

        this.label = new BVText(this.knob);
        this.label.setSize(100,10);
        this.label.setPosition(0.5 * (this.knob.width - this.label.width), 13);
        this.label.setTextClass("SliderLabel");
        this.label.setHidden(true);
    },

    update: function (hostElement, value, lockedValue) {
        this.knob.setHidden(value === null);
        if (value !== null) {
            this.updateKnobPositionWithValue(value);
            var labelString = this.format ? sprintf(this.format, value) : ("" + value);
            this.label.setHTML(labelString);
        }

        if (this.lockedVariable) {
            this.updateLockMarkerWithValue(lockedValue);
        }
        else if (!this.didInitialLock) {
            this.didInitialLock = true;
            this.setLockedValue(value);
        }
    },

    updateKnobPositionWithValue: function (value) {
        var knobOffset = Math.round(this.trackWidth * (value - this.min) / (this.max - this.min));
        this.knob.setX(-6 + this.xMargin + knobOffset);

        var sliderWidth = Math.max(this.trackWidth, knobOffset);
        this.centerFill.setWidth(sliderWidth - this.leftCap.width - this.rightCap.width);
        this.rightCap.setX(this.xMargin + sliderWidth - this.rightCap.width);
    },

    //----------------------------------------------------------
    //
    // scrub

    cursorMovedToPoint: function (x,y,isDown) {
        var trackX = x - this.xMargin;
        if (!this.isTracking && (trackX < -6 || trackX > this.trackWidth + 6)) { return; }    // don't respond until we get close

        this.isTracking = true;
        this.element.setStyle("cursor", "pointer");
        this.label.setHidden(false);
        this.knob.setContentsURL("Images/SliderKnobDown.png");

        var maxProgress = this.isExtendable ? 100 : 1;
        var progress = (trackX / this.trackWidth).limit(0,maxProgress);

        var value = this.min + (progress * (this.max - this.min) / this.step).round() * this.step;
        this.tangle.setValue(this.variable, value);

        if (isDown) { this.setLockedValue(value.limit(this.min,this.max)); }

        if (this.isExtendable) {
            this.setWidth(this.xMargin * 2 + Math.max(this.trackWidth, trackX));
        }
    },

    cursorExited: function () {
        var value = this.getLockedValue().limit(this.min,this.max);
        this.setLockedValue(value);
        this.tangle.setValue(this.variable, value);

        this.isTracking = false;
        this.element.setStyle("cursor", "auto");
        this.label.setHidden(true);
        this.knob.setContentsURL("Images/SliderKnob.png");

        this.setWidth(this.xMargin * 2 + this.trackWidth);
    },

    cursorWasTapped: function () {
        this.bounce();
        this.setLockedValue(this.tangle.getValue(this.variable).limit(this.min,this.max));
    },

    //----------------------------------------------------------
    //
    // lock

    getLockedValue: function () {
        return this.lockedVariable ? this.tangle.getValue(this.lockedVariable) : this.lockedValue;
    },

    setLockedValue: function (value) {
        if (this.lockedVariable) {
            this.tangle.setValue(this.lockedVariable, value);
        }
        else {
            this.lockedValue = value;
            this.updateLockMarkerWithValue(value);
        }
    },

    updateLockMarkerWithValue: function (lockedValue) {
        this.lockedMarker.setHidden(lockedValue === null);
        if (lockedValue !== null) {
            var markerOffsetX = Math.round(this.trackWidth * (lockedValue - this.min) / (this.max - this.min));
            this.lockedMarker.setX(-0.5 * this.lockedMarker.width + this.xMargin + markerOffsetX);
        }
    },

    //----------------------------------------------------------
    //
    // bounce

    bounce: function () {
       if (!this.bounceTimer) { this.bounceTimer = this.incrementBounce.bind(this).periodical(20); }
       this.bounceProgress = 0;
    },

    incrementBounce: function () {
       this.bounceProgress = (this.bounceProgress + 0.04).limit(0,1);
       var p = this.bounceProgress;
       var jumpY = (p < 0.5) ? (15 * (1 - Math.pow(4*p - 1, 2))) : (4 * (1 - Math.pow(4*(p - 0.5) - 1, 2)));
       this.knob.setY(-10 + jumpY);
       if (this.bounceProgress === 1) {
           clearInterval(this.bounceTimer);
           delete this.bounceTimer;
       }
    }

});



//====================================================================================
//
//  LadderActionLink
//

var gLadderActionLinkActiveHighlight = null;

var gLadderActionLinkHighlightSizes = [
    [229, 240],
    [256, 240],
    [331, 216],
    [215, 191]
];

Tangle.classes.LadderActionLink = new Class({

    initialize: function (element, options, tangle) {
        this.options = options;
        this.tangle = tangle;

        this.variables = [];
        for (var i = 3; i < arguments.length; i++) { this.variables.push(arguments[i]); }

        element.onclick = this.elementWasClicked.bind(this);

        this.preloadHighlight();
    },

    elementWasClicked: function () {
        if (this.options.value !== undefined) {
            this.updateVariables();
        }
        if (this.options.highlight !== undefined) {
            this.showHighlight();
        }
    },

    updateVariables: function () {
        var value = parseFloat(this.options.value || 0);

        this.variables.each(function (variable) {
            this.tangle.setValue(variable, value);

            var slider = this.tangle.slidersByVariable && this.tangle.slidersByVariable[variable];
            if (slider) { slider.bounce(); }
        }, this);
    },

    preloadHighlight: function () {
        if (this.options.highlight === undefined) { return; }

        var options = this.options.highlight.split(" ");
        var index = parseFloat(options[0]);
        var x = parseFloat(options[1]);
        var y = parseFloat(options[2]);

        var filename = "Images/Highlight" + index + ".png";
        var size = gLadderActionLinkHighlightSizes[index - 1];

        var preload = new Image();
        preload.src = filename;

        this.addHighlight = function () {
            var hostElement = this.tangle.element.getElement(".LadderRoad");
            if (!hostElement) { return; }
            var element = hostElement.getElement("div");
            if (!element) { return; }

            this.highlight = new BVLayer(null);
            this.highlight.element.inject(element);
            this.highlight.setContentsURLAndSize(filename, size[0], size[1]);
            this.highlight.setPosition(x - 0.5 * this.highlight.width, -y + 0.5 * this.highlight.height);
            this.highlight.setHidden(true);
        };
    },

    showHighlight: function () {
        if (!this.highlight) {
            this.addHighlight();
        }

        if (gLadderActionLinkActiveHighlight) { gLadderActionLinkActiveHighlight.setHidden(true); }
        gLadderActionLinkActiveHighlight = this.highlight;

        this.highlight.setHidden(false);
        this.highlight.setOpacity(1);

        if (this.highlightTimer1) { clearTimeout(this.highlightTimer1); }
        this.highlightTimer1 = (function () {
            BVLayer.animate(1000, function () {
                this.highlight.setOpacity(0);
            }, this);
        }).delay(2000,this);

        if (this.highlightTimer2) { clearTimeout(this.highlightTimer2); }
        this.highlightTimer2 = (function () {
            this.highlight.setHidden(true);
        }).delay(3000,this);
    },

    update: function (element, value) {
    }
});


//====================================================================================

})();
