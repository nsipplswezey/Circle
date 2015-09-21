//
//  BVScrubbableLayer.js
//  LayerScript
//
//  Created by Bret Victor on 9/15/11.
//  (c) 2011 Bret Victor.  MIT open-source license.
//


(function(){


//====================================================================================
//
//  BVScrubbableLayer


var BVScrubbableLayer = this.BVScrubbableLayer = new Class({

    Extends: BVLayer,

    //----------------------------------------------------------
    //
    // override
    
    cursorMovedToPoint: function (x,y,isDown) {
    },
    
    cursorExited: function () {
    },
    
    cursorWasTapped: function () {
    },

    //----------------------------------------------------------
    //
    // hover
    
    mouseEntered: function () {
    },
    
    mouseMovedToPoint: function (x,y) {
        if (this.touches) { return; }
        this.cursorMovedToPoint(x, -y, false);
    },

    mouseExited: function () {
        if (this.touches) { return; }
        this.cursorExited();
    },

    //----------------------------------------------------------
    //
    // touch
    
    touchDidGoDown: function (touches) {
        this.touchDidMove(touches);
    },

    touchDidMove: function (touches) {
        this.cursorMovedToPoint(touches.localPoint.x, -touches.localPoint.y, true);
    },
    
    touchDidGoUp: function (touches) {
        if (touches.wasTap) {
            this.cursorWasTapped();
        }
        if (BVLayer.isTouch || !this.containsLocalPoint(touches.localPoint)) {
            this.cursorExited();
        }
    }

});



//====================================================================================

})();