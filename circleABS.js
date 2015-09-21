var unit = 45, rows = 10, cols = 10, susceptible = 0, infected = 1, recovered = 2;
var colors = ["green", "red", "blue"];
var width = unit*cols;
var height = unit*rows;
var Margin = {top: 40, right: 40, bottom: 50, left: 70};

// CircleABSI

var propsSI = {
  centerx : cols/2,
  centery : rows/2,
  rad : 4.5,
  nhoodsize : 4,
  clockHi:30,
  compare: document.getElementById('compareSI').checked,
  seq: 0,
  chartId: 0,
  count: 30
}

function myAgentSI(id) {
  var sistate = new Sequence("Sistate");
  var inpt = new Term("inpt");
  var outpt = new Term("outpt");
  var initx = new Term("init_x");
  var inity = new Term("init_y");
  var nbrTot = new Term("nbrTot");
  nbrTot.exp = "(function() {"+
    "var id = this.agent.id, tot = 0, count = +this.agentvector.count;"+
    "for (i = 1; i <= propsSI.nhoodsize; i++) {"+
    "var j = ((id + i) % count);"+
    "tot += this.agentvector.vector[j].cap.scope.outpt;"+
    "j = ((id - i) + count) % count;"+
    "tot += this.agentvector.vector[j].cap.scope.outpt;"+
    "}"+
    "return tot;}).call(this)";
  sistate.initial = "this.inpt";
  sistate.next = "(this.Sistate == 0 && Math.floor(Math.random() * 6 + 1) <= this.nbrTot) ? 1 : this.Sistate";
  outpt.exp = "this.Sistate";
  inpt.exp = "(this.agent.id == 0) ? 1 : 0";
  initx.exp = "propsSI.centerx + propsSI.rad * Math.cos(2*this.agent.id/this.agentvector.count*Math.PI)";
  inity.exp = "propsSI.centery + propsSI.rad * Math.sin(2*this.agent.id/this.agentvector.count*Math.PI)";
  return new Capsule(sprintf("agent_%d", id), [sistate, inpt, outpt, initx, inity, nbrTot]);
}

var novaManagerSI = (function(clockLo, clockHi, dt, method) {
  var obj =  {
    ran: true,
    clock: new Clock(clockLo, clockHi, dt, method),
    tots: [],
    totlist: [],
    av: agentviewer("#agntvcSI", width, height, unit, rows, cols),
    lchart: null,
    setFill: function(seq) {
      propsSI.seq = seq;
      if (!obj.ran) obj.tots.seq = seq;
    },
    resetCompare: function(compare) {
      propsSI.compare = compare;
      propsSI.chartId = 0;
      obj.lchart.resetCompare();
      obj.totlist = [];
      obj.resetter();
    },
    glean: function(agents) {
      var ans0 = new Array();
      var ctr = 0;
      for (var i = 0; i < agents.vector.length; i++)  {
        var rec = agents.vector[i];
        var sistate = agents.vector[i].cap.scope.outpt;
        if (sistate == 1) ctr++;
        ans0.push({id: rec.id, x: rec.x, y: rec.y, r: 15, col:(sistate==0)?"green":"red"});
      }
      obj.tots.push({x: this.clock.current, y: ctr});
      return ans0;
    },
    updater: function() {
      obj.ran = true;
      var myData = obj.glean(obj.agents)
      obj.av.render(myData);
      obj.lchart.render(obj.totlist);
    },
    resetter: function() {
      if (!obj.ran) return;
      obj.ran = false;
      var count = document.getElementById('countSI').value;
      obj.agents = new AgentVector("agents", myAgentSI, count, rows, cols);
      obj.clock.reset(obj.agents);
      if (!propsSI.compare) {
        obj.totlist = [];
      }
      obj.tots = [];
      obj.totlist.push(obj.tots);
      obj.tots.stroke = ["red", "blue", "green", "orange", "purple", "magenta", "pink", "cyan"];
      obj.tots.seq = propsSI.seq;
      obj.tots.chartId = propsSI.chartId++;
      obj.lchart = linechart("#datchartSI", width+100, height, Margin, obj.clock.lo, obj.clock.hi,
                             null, null, 0, count, propsSI.compare);
      var myData = obj.glean(obj.agents)
      obj.av.reset(myData);
      obj.lchart.render(obj.totlist);
    },
  };
  document.getElementById("countSI").value = propsSI.count;
  document.getElementById("countvalSI").value = propsSI.count;
  document.getElementById("nhoodsizeSI").value = propsSI.nhoodsize;
  document.getElementById("nhoodsizevalSI").value = propsSI.nhoodsize;
  document.getElementById("simspeedSI").value = 0;
  document.getElementById("simspeedvalSI").value = 0;
  document.getElementById("simdurSI").value = propsSI.clockHi;
  document.getElementById("simdurvalSI").value = propsSI.clockHi;
  document.getElementById("colSelSIa").checked = true;
  obj.resetter();
  var ans = NovaManager(obj.updater, obj.resetter, obj.clock, document.getElementById("timevalSI"), 0, 0);
  ans.resetCompare = obj.resetCompare;
  ans.setFill = obj.setFill;
  return ans;
})(0, propsSI.clockHi, 1, "Euler");


// CircleABSIS

var propsSIS = {
  centerx : cols/2,
  centery : rows/2,
  rad : 4.5,
  recoverylevel : 1,
  nhoodsize : 4,
  clockHi: 30,
  compare: document.getElementById('compareSIS').checked,
  seq: 0,
  chartId: 0,
  count: 30
}

function myAgentSIS(id) {
  var sisstate = new Sequence("Sisstate");
  var inpt = new Term("inpt");
  var outpt = new Term("outpt");
  var initx = new Term("init_x");
  var inity = new Term("init_y");
  var nbrTot = new Term("nbrTot");
  nbrTot.exp = "(function() {"+
    "var id = this.agent.id, tot = 0, count = +this.agentvector.count;"+
    "for (i = 1; i <= propsSIS.nhoodsize; i++) {"+
    "var j = ((id + i) % count);"+
    "tot += (this.agentvector.vector[j].cap.scope.outpt == 1);"+
    "j = ((id - i) + count) % count;"+
    "tot += (this.agentvector.vector[j].cap.scope.outpt == 1);"+
    "}"+
    "return tot;}).call(this)";
  sisstate.initial = "this.inpt";
  sisstate.next = "(function (){"+
    "var thrw = Math.floor(Math.random() * 6 + 1);"+
    "var nbrTot = this.nbrTot;"+
    "if (this.Sisstate == susceptible && thrw <= nbrTot) return infected;"+
    "if (this.Sisstate == infected && thrw <= propsSIS.recoverylevel) return susceptible;"+
    "return this.Sisstate"+
    "}.call(this))";
  outpt.exp = "this.Sisstate";
  inpt.exp = "(this.agent.id == 0) ? 1 : 0";
  initx.exp = "propsSIS.centerx + propsSIS.rad * Math.cos(2*this.agent.id/this.agentvector.count*Math.PI)";
  inity.exp = "propsSIS.centery + propsSIS.rad * Math.sin(2*this.agent.id/this.agentvector.count*Math.PI)";
  return new Capsule(sprintf("agent_%d", id), [sisstate, inpt, outpt, initx, inity, nbrTot]);
}

var novaManagerSIS = (function(clockLo, clockHi, dt, method) {
  var obj =  {
    clock: new Clock(clockLo, clockHi, dt, method),
    ran: true,
    tots1: [],
    totlist: [],
    av: agentviewer("#agntvcSIS", width, height, unit, rows, cols),
    lchart: null,
    setFill: function(seq) {
      propsSIS.seq = seq;
      if (!obj.ran) obj.tots1.seq = seq;
    },
    resetCompare: function(compare) {
      propsSIS.compare = compare;
      propsSIS.chartId = 0;
      obj.lchart.resetCompare();
      obj.totlist = [];
      obj.resetter();
    },
    glean: function(agents) {
      var ans0 = new Array();
      var ctr1 = 0;
      for (var i = 0; i < agents.vector.length; i++)  {
        var rec = agents.vector[i];
        var sisstate = agents.vector[i].cap.scope.outpt;
        if (sisstate == infected) ctr1++;
        ans0.push({id: rec.id, x: rec.x, y: rec.y, r: 15,
                   col:colors[sisstate]});
      }
      obj.tots1.push({x: this.clock.current, y: ctr1});
      return ans0;
    },
    updater: function() {
      obj.ran = true;
      var myData = obj.glean(obj.agents)
      obj.av.render(myData);
      obj.lchart.render(obj.totlist);
    },
    resetter: function() {
      if (!obj.ran) return;
      obj.ran = false;
      var count = document.getElementById('countSIS').value;
      obj.agents = new AgentVector("agents", myAgentSIS, count, rows, cols);
      obj.clock.reset(obj.agents);
      if (!propsSIS.compare) {
        obj.totlist = [];
      }
      obj.tots1 = [];
      obj.totlist.push(obj.tots1);
      obj.tots1.stroke = ["red", "blue", "green", "orange", "purple", "magenta", "pink", "cyan"];
      obj.tots1.seq = propsSIS.seq;
      obj.tots1.chartId = propsSIS.chartId++;
      obj.lchart = linechart("#datchartSIS", width+100, height, Margin, obj.clock.lo, obj.clock.hi,
                             null, null, 0, count, propsSIS.compare);
      var myData = obj.glean(obj.agents)
      obj.av.reset(myData);
      obj.lchart.render(obj.totlist);
    },
  };
  document.getElementById("countSIS").value = propsSIS.count;
  document.getElementById("countvalSIS").value = propsSIS.count;
  document.getElementById("nhoodsizeSIS").value = propsSIS.nhoodsize;
  document.getElementById("nhoodsizevalSIS").value = propsSIS.nhoodsize;
  document.getElementById("recoverylevelSIS").value = propsSIS.recoverylevel;
  document.getElementById("recoverylevelvalSIS").value = propsSIS.recoverylevel;
  document.getElementById("simspeedSIS").value = 0;
  document.getElementById("simspeedvalSIS").value = 0;
  document.getElementById("simdurSIS").value = propsSIS.clockHi;
  document.getElementById("simdurvalSIS").value = propsSIS.clockHi;
  document.getElementById("colSelSISa").checked = true;
  obj.resetter();
  var ans = NovaManager(obj.updater, obj.resetter, obj.clock, document.getElementById("timevalSIS"), 0, 0);
  ans.resetCompare = obj.resetCompare;
  ans.setFill = obj.setFill;
  return ans;
})(0, propsSIS.clockHi, 1, "Euler");

// circleABSIR

var propsSIR = {
  centerx : cols/2,
  centery : rows/2,
  rad : 4.5,
  recoverylevel : 1,
  nhoodsize : 4,
  clockHi: 30,
  count: 30
}

function myAgentSIR(id) {
  var sirstate = new Sequence("Sirstate");
  var inpt = new Term("inpt");
  var outpt = new Term("outpt");
  var initx = new Term("init_x");
  var inity = new Term("init_y");
  var nbrTot = new Term("nbrTot");
  nbrTot.exp = "(function() {"+
    "var id = this.agent.id, tot = 0, count = +this.agentvector.count;"+
    "for (i = 1; i <= propsSIR.nhoodsize; i++) {"+
    "var j = ((id + i) % count);"+
    "tot += (this.agentvector.vector[j].cap.scope.outpt == 1);"+
    "j = ((id - i) + count) % count;"+
    "tot += (this.agentvector.vector[j].cap.scope.outpt == 1);"+
    "}"+
    "return tot;}).call(this)";
  sirstate.initial = "this.inpt";
  sirstate.next = "(function (){"+
    "var thrw = Math.floor(Math.random() * 6 + 1);"+
    "var nbrTot = this.nbrTot;"+
    "if (this.Sirstate == susceptible && thrw <= nbrTot) return infected;"+
    "if (this.Sirstate == infected && thrw <= propsSIR.recoverylevel) return recovered;"+
    "return this.Sirstate"+
    "}.call(this))";
  outpt.exp = "this.Sirstate";
  inpt.exp = "(this.agent.id == 0) ? 1 : 0";
  initx.exp = "propsSIR.centerx + propsSIR.rad * Math.cos(2*this.agent.id/this.agentvector.count*Math.PI)";
  inity.exp = "propsSIR.centery + propsSIR.rad * Math.sin(2*this.agent.id/this.agentvector.count*Math.PI)";
  return new Capsule(sprintf("agent_%d", id), [sirstate, inpt, outpt, initx, inity, nbrTot]);
}

var novaManagerSIR = (function(clockLo, clockHi, clockDt, clockMethod) {
  var obj =  {
    clock: new Clock(clockLo, clockHi, clockDt, clockMethod),
    tots0: [],
    tots1: [],
    tots2: [],
    av: agentviewer("#agntvcSIR", width, height, unit, rows, cols),
    lchart: null,
    glean: function(agents) {
      var ans0 = new Array();
      var ctr0 = 0, ctr1 = 0, ctr2 = 0;
      for (var i = 0; i < agents.vector.length; i++)  {
        var rec = agents.vector[i];
        var sirstate = agents.vector[i].cap.scope.outpt;
        if (sirstate == susceptible) ctr0++;
        else if (sirstate == infected) ctr1++;
        else if (sirstate == recovered) ctr2++;
        ans0.push({id: rec.id, x: rec.x, y: rec.y, r: 15,
                   col:colors[sirstate]});
      }
      obj.tots0.push({x: this.clock.current, y: ctr0});
      obj.tots1.push({x: this.clock.current, y: ctr1});
      obj.tots2.push({x: this.clock.current, y: ctr2});
      return ans0;
    },
    updater: function() {
      var myData = obj.glean(obj.agents)
      obj.av.render(myData);
      obj.lchart.render([obj.tots0, obj.tots1, obj.tots2]);
    },
    resetter: function() {
      var count = document.getElementById('countSIR').value;
      obj.agents = new AgentVector("agents", myAgentSIR, count, rows, cols);
      obj.clock.reset(obj.agents);
      obj.tots0 = [];
      obj.tots0.stroke = colors[0];
      obj.tots1 = [];
      obj.tots1.stroke = colors[1]
      obj.tots2 = [];
      obj.tots2.stroke = colors[2]
      obj.lchart = linechart("#datchartSIR", width+100, height, Margin, obj.clock.lo, obj.clock.hi,
                             null, null, 0, count);
      var myData = obj.glean(obj.agents)
      obj.av.reset(myData);
      obj.lchart.render([obj.tots0, obj.tots1, obj.tots2]);
    },
  };
  document.getElementById("countSIR").value = propsSIR.count;
  document.getElementById("countvalSIR").value = propsSIR.count;
  document.getElementById("nhoodsizeSIR").value = propsSIR.nhoodsize;
  document.getElementById("nhoodsizevalSIR").value = propsSIR.nhoodsize;
  document.getElementById("recoverylevelSIR").value = propsSIR.recoverylevel;
  document.getElementById("recoverylevelvalSIR").value = propsSIR.recoverylevel;
  document.getElementById("simspeedSIR").value = 0;
  document.getElementById("simspeedvalSIR").value = 0;
  document.getElementById("simdurSIR").value = propsSIR.clockHi;
  document.getElementById("simdurvalSIR").value = propsSIR.clockHi;
  obj.resetter();
  return NovaManager(obj.updater, obj.resetter, obj.clock, document.getElementById("timevalSIR"), 0, 0);
})(0, propsSIR.clockHi, 1, "Euler");
