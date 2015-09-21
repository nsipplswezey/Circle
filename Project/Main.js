//
//  LadderMain.js
//  LadderOfAbstraction
//
//  Created by Bret Victor on 8/21/11.
//  (c) 2011 Bret Victor.  MIT open-source license.
//


(function(){


  //====================================================================================
  //
  //  domready
  //

  window.addEvent('domready', function () {
    initializeTouchSpans();
    initializeTangleElements();
  });


  //====================================================================================
  //
  //  mouse vs touch
  //

  function initializeTouchSpans () {
    var isTouch = BVLayer.isTouch;

    $$(".ifMouse").each(function (element) {
      element.setStyle("display", isTouch ? "none" : "inline");
    });

    $$(".ifTouch").each(function (element) {
      element.setStyle("display", isTouch ? "inline" : "none");
    });
  }


  //====================================================================================
  //
  //  tangle
  //

  function initializeTangleElements () {
    if (Browser.ie6 || Browser.ie7 || Browser.ie8) { return; }  // no canvas support

    var elements = $$(".tangle");
    loadNextElement.delay(100);

    function loadNextElement () {
      if (elements.length === 0) { return; }
      var element = elements.shift();
      initializeTangleElement(element);
      loadNextElement.delay(10);
    }
  }

  function initializeTangleElement (element) {
    var modelName = element.getAttribute("data-model") || "";
    var model = gModels[modelName] || gModels["default"];

    element.setStyle("position", "relative");
    var tangle = new Tangle(element, model);
  }


  //====================================================================================
  //
  //  models
  //

  var gModels = {

    "default": {
      initialize: function () {
        this.timeIndex = this.lockedTimeIndex = 0;
      },

      update: function () {
      }
    },

    "game" : {
      initialize: function() {
        //this.sickNeighbors = 1
        //this.myDice = Math.floor(Math.random() * 6)

        this.time = 0;
        this.lockedTime = 0;

        this.p1 = [{roll:3,state:0,sickNeighbors:1},{roll:4,state:0,sickNeighbors:1},{roll:1,state:0,sickNeighbors:1},{roll:0,state:1,sickNeighbors:1}];
        this.p2 = [{roll:2,state:0,sickNeighbors:1},{roll:2,state:0,sickNeighbors:1},{roll:3,state:0,sickNeighbors:2},{roll:0,state:0,sickNeighbors:3}];
        this.p3 = [{roll:0,state:1,sickNeighbors:1},{roll:0,state:1,sickNeighbors:1},{roll:0,state:1,sickNeighbors:2},{roll:0,state:1,sickNeighbors:3}];
        this.p4 = [{roll:5,state:0,sickNeighbors:1},{roll:2,state:0,sickNeighbors:2},{roll:0,state:1,sickNeighbors:2},{roll:0,state:1,sickNeighbors:3}];
        this.p5 = [{roll:1,state:0,sickNeighbors:1},{roll:0,state:1,sickNeighbors:1},{roll:0,state:1,sickNeighbors:2},{roll:0,state:1,sickNeighbors:2}];


      },

      update: function(){
        this.p1State = this.p1[this.time].state;
        this.p1Roll = this.p1[this.time].roll;
        this.p1SickNeighbors = this.p1[this.time].sickNeighbors;

        this.p2State = this.p2[this.time].state;
        this.p2Roll = this.p2[this.time].roll;
        this.p2SickNeighbors = this.p2[this.time].sickNeighbors;

        this.p3State = this.p3[this.time].state;
        this.p3Roll = this.p3[this.time].roll;
        this.p3SickNeighbors = this.p3[this.time].sickNeighbors;

        this.p4State = this.p4[this.time].state;
        this.p4Roll = this.p4[this.time].roll;
        this.p4SickNeighbors = this.p4[this.time].sickNeighbors;

        this.p5State = this.p5[this.time].state;
        this.p5Roll = this.p5[this.time].roll;
        this.p5SickNeighbors = this.p5[this.time].sickNeighbors;


      }
    }





  };



  //====================================================================================

})();

