//
//	BVTouchable.js
//	ExplorableExplanations
//
//	Created by Bret Victor on 3/10/11.
//	(c) 2011 Bret Victor.  MIT open-source license.
//

(function () {


var gUA = navigator.userAgent.toLowerCase();
var gIsTouch = !!(gUA.match(/ipad/) || gUA.match(/iphone/) || gUA.match(/ipod/));


var BVTouchable = this.BVTouchable = new Class ({

	initialize: function (el, delegate) {
		this.element = el;
		this.delegate = delegate;
		this.setTouchable(true);
	},
	

	//----------------------------------------------------------------------------------
	//
	//	 touches
	//

	setTouchable: function (isTouchable) {
		if (this.touchable === isTouchable) { return; }
		this.touchable = isTouchable;
		this.element.style.pointerEvents = (this.touchable || this.hoverable) ? "auto" : "none";

		if (isTouchable) {
			if (!this._mouseBound) {
				this._mouseBound = {
					mouseDown: this._mouseDown.bind(this),
					mouseMove: this._mouseMove.bind(this),
					mouseUp: this._mouseUp.bind(this),
					touchStart: this._touchStart.bind(this),
					touchMove: this._touchMove.bind(this),
					touchEnd: this._touchEnd.bind(this),
					touchCancel: this._touchCancel.bind(this)
				};
			}
			this.element.addEvent(gIsTouch ? "touchstart" : "mousedown", 
								  this._mouseBound[gIsTouch ? "touchStart" : "mouseDown"]);
		}
		else {
			this.element.removeEvents(gIsTouch ? "touchstart" : "mousedown");
		}
	},
	
	touchDidGoDown: function (touches) {
		if (this.delegate.touchDidGoDown) { this.delegate.touchDidGoDown(touches); }
    },

	touchDidMove: function (touches) {
        if (this.delegate.touchDidMove) { this.delegate.touchDidMove(touches); }
    },

	touchDidGoUp: function (touches) {
        if (this.delegate.touchDidGoUp) { this.delegate.touchDidGoUp(touches); }
    },
	
	_mouseDown: function (event) {
		event.stop();
		this.element.getDocument().addEvents({
			mousemove: this._mouseBound.mouseMove,
			mouseup: this._mouseBound.mouseUp
		});
	
		this.touches = new BVTouches(null, event, this.element);
		this.touchDidGoDown(this.touches);
	},

	_mouseMove: function (event) {
		event.stop();
		this.touches._updateWithEvent(event);
		this.touchDidMove(this.touches);
	},

	_mouseUp: function (event) {
		event.stop();
		this.touches._goUpWithEvent(event);
		this.touchDidGoUp(this.touches);
		
		delete this.touches;
		this.element.getDocument().removeEvents({
			mousemove: this._mouseBound.mouseMove,
			mouseup: this._mouseBound.mouseUp
		});
	},

	_touchStart: function (event) {
		event.stop();
		if (this.touches || event.length > 1) { this._touchCancel(event); return; }  // only-single touch for now
		
		this.element.getDocument().addEvents({
			touchmove: this._mouseBound.touchMove,
			touchend: this._mouseBound.touchEnd,
			touchcancel: this._mouseBound.touchCancel
		});
	
		this.touches = new BVTouches(null, event, this.element);
		this.touchDidGoDown(this.touches);
	},
	
	_touchMove: function (event) {
		event.stop();
		if (!this.touches) { return; }

		this.touches._updateWithEvent(event);
		this.touchDidMove(this.touches);
	},
	
	_touchEnd: function (event) {
		event.stop();
		if (!this.touches) { return; }

		this.touches._goUpWithEvent(event);
		this.touchDidGoUp(this.touches);
		
		delete this.touches;
		this.element.getDocument().removeEvents({
			touchmove: this._mouseBound.touchMove,
			touchend: this._mouseBound.touchEnd,
			touchcancel: this._mouseBound.touchCancel
		});
	},
	
	_touchCancel: function (event) {
		this._touchEnd(event);
	},
	
	
	//----------------------------------------------------------------------------------
	//
	//	 hover
	//

	setHoverable: function (isHoverable) {
		if (this.hoverable === isHoverable) { return; }
		this.hoverable = isHoverable;

		if (gIsTouch) { return; }
		this.element.style.pointerEvents = (this.touchable || this.hoverable) ? "auto" : "none";

		if (isHoverable) {
			if (!this._hoverMouseBound) {
				this._hoverMouseBound = {
					hoverMouseEnter: this.mouseEntered.bind(this),
					hoverMouseLeave: this.mouseExited.bind(this)
				};
			}
			this.element.addEvent("mouseenter", this._hoverMouseBound.hoverMouseEnter);
			this.element.addEvent("mouseleave", this._hoverMouseBound.hoverMouseLeave);
		}
		else {
			this.element.removeEvents("mouseenter");
			this.element.removeEvents("mouseleave");
		}
	},
	
	mouseEntered: function () {
        if (this.delegate.mouseEntered) { this.delegate.mouseEntered(); }
    },

	mouseExited: function () {
        if (this.delegate.mouseExited) { this.delegate.mouseExited(); }
    }

});


//====================================================================================

})();