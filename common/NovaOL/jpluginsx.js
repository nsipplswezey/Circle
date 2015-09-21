//     JNovaScript PLugins 0.0.1
//     Plugins For JNovaScript
//     http://novamodeler.com
//     (c) 2014-2015 Richard Salter


//JNovaScript plugins

pl_proto.prototype.colorPick = function(val, colors) {
	if (val in colors) return colors[val];
	var keys = Object.keys(colors);
	if (val <= +keys[0]) return colors[keys[0]];
	if (val >= +keys[keys.length-1]) return colors[keys[keys.length-1]];
	var i = 0;
	while (!(val >= +keys[i] && val < +keys[i+1])) i++;
	var d = (+keys[i+1])-(+keys[i]);
	var l = (val - (+keys[i]))/d;
	clow = d3.rgb(colors[keys[i]]);
	chi = d3.rgb(colors[keys[i+1]]);
	var ans = d3.interpolate(clow, chi)(l)
	return ans;
}

//Cascade

function PL_Cascade(name, properties, pins, gprops) {
	pl_proto.call(this, name, "Cascade", ["Initial", "In", "Converter"], ["Out", "Element"], []);
	if (pins != null) {
		if ("Initial" in pins) this.Initial.exp = pins.Initial;
		if ("In" in pins) this.In.exp = pins.In;
		if ("Converter" in pins) this.Converter.exp = pins.Converter;
	}
	else this.Converter = function(x){return x;}
	this.count = properties.count;
	this.cascadeDat = [];
	this.Out.exp = 0;
	this.Element.exp =
		(function() {
			var Cascade = this.cascadeDat;
			return function(){
				return function(n){
					return Cascade[n];
				}
			};
		}).call(this);
	var vizid =  properties.vizid + ((properties.vizid_subscript) ? "_"+gprops.id : "");
	var caption = (typeof properties.caption == "function") ? properties.caption(gprops.id) : properties.caption;
	if ("vizid" in properties) {
		this.vcascade = cascade("#"+vizid, this.count, properties.columns, properties.dsize, properties.background, caption);
	}
}
PL_Cascade.prototype = Object.create(pl_proto.prototype);
PL_Cascade.prototype.constructor = PL_Cascade;

PL_Cascade.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	this.Initial.reset();
	this.In.reset();
	while (this.cascadeDat.length > 0) this.cascadeDat.shift();
	if ("Initial" in this.scope) {
		for (var i in this.scope.Initial) this.cascadeDat[i] = this.scope.Initial[i];
	}
	while (this.cascadeDat.length > this.count)
		this.cascadeDat.pop(this.cascadeDat.length-1);
	for (var i = this.cascadeDat.length; i < this.count; i++) this.cascadeDat[i] = 0;
	this.Out.exp =
		(function() {
			var Cascade = this.cascadeDat;
			return function(){
				return Cascade;
			}
		}).call(this);
	if (this.vcascade) this.vcascade.reset(this.cascadeDat);
}

PL_Cascade.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	this.ncascade = [];
	for (var i = this.count-1; i >= 0; i--) {
		if (i == 0) this.ncascade[i] = this.scope.In;
		else {
			var next = this.scope.Converter.call(this.cap.scope, this.cascadeDat[i-1], i, this.cascadeDat[i]);
			this.ncascade[i] = next;
		}
	}
}

PL_Cascade.prototype.update = function(t, scope) {
	pl_proto.prototype.update.call(this, t, scope);
	for (var i in this.ncascade) this.cascadeDat[i] = this.ncascade[i];
	if ("vcascade" in this) this.vcascade.update(this.cascadeDat);
}


//Tableau

function PL_Tableau(name, properties, pins, gprops) {
	pl_proto.call(this, name, "Tableau", [], ["m"], []);
	this.properties = properties;
	var vizid =  properties.vizid + ((properties.vizid_subscript) ? "_"+gprops.id : "");
	var caption = (typeof properties.caption == "function") ? properties.caption(gprops.id) : properties.caption;
	if ("vizid" in properties) {
		this.vtableau = tableau("#"+vizid, properties.rows, properties.cols,
				properties.rowHeaders, properties.columnLabels,
				properties.initial, properties.dsize,
				properties.background, caption);
	}
}
PL_Tableau.prototype = Object.create(pl_proto.prototype);
PL_Tableau.prototype.constructor = PL_Tableau;
PL_Tableau.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	var m = [];
	for (var i = 0; i < this.properties.rows; i++) {
		m.push([])
		for (var j = 0; j < this.properties.cols; j++) {
			m[i][j] = ("vtableau" in this) ? this.vtableau.get(i, j) : properties.initial[i][j];
			if (typeof m[i][j] == "string") m[i][j] = +m[i][j];
		}
	}
	this.m.exp = m;
}
PL_Tableau.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
}

//Log

function PL_Log(name, properties, pins) {
	pl_proto.call(this, name, "Log", ["inpt"]);
	if (pins != null && "inpt" in pins) this.inpt.exp = pins.inpt;
	this.properties = properties;
	this.preOrPost = ("when" in properties) ? properties.when : "post";
	this.svalue = "";
	this.vis = null;
	if (properties.vizid) {
		this.visual(properties.vizid, properties.rows, properties.cols);
	}
}

PL_Log.prototype = Object.create(pl_proto.prototype);
PL_Log.prototype.constructor = PL_Log;

PL_Log.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	this.inpt.reset();
	if (this.vis) this.vis.value = "";
}

PL_Log.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var val = this.scope.inpt;
	if (val == "") return;
	if (this.vis) this.vis.value = this.vis.value + val + "\n";
}

PL_Log.prototype.visual = function(id, rows, cols) {
	this.visid = id;
	var prelude = d3.select("#"+id);
	var table = null;
	if ("caption" in this.properties) {
		prelude = prelude.append("table").append("tr")
		.append("caption")
		.text(this.properties.caption)
		.append("td");
	}
	prelude.append("textarea")
	.attr("id", id+"_log")
	.attr("readonly", true)
	.attr("rows", (rows == null) ? 5 : rows)
	.attr("cols", (cols == null) ? 20 : cols)
	this.vis = document.getElementById(id+"_log");
}

//Spy

function PL_Spy(name, properties, pins) {
	pl_proto.call(this, name, "Spy", ["inpt"], ["outpt"], ["vinit"]);
	if (pins != null && "inpt" in pins) this.inpt.exp = pins.inpt;
	this.properties = properties;
	this.svalue = 0;
	this.vis = null;
	if (properties.vizid) {
		this.vinit.exp = (properties.init == null) ?
				((pins != null && "inpt" in pins) ? pins.inpt: 0) : properties.init;
		this.visual(properties.vizid, properties.size);
	}
}

PL_Spy.prototype = Object.create(pl_proto.prototype);
PL_Spy.prototype.constructor = PL_Spy;

PL_Spy.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	this.svalue = 0;
	this.inpt.reset();
	if (this.vis) {
		this.vinit.reset();
		this.svalue = this.vis.value = this.scope.vinit;
	}
	this.outpt.exp = function(){
		var SValue = this.svalue;
		return function(){
			return SValue
		}
	}.call(this);
}

PL_Spy.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	this.svalue = this.scope.inpt;
	if (this.vis) this.vis.value = this.svalue;
	this.outpt.exp = function(){
		var SValue = this.svalue;
		return function(){
			return SValue
		}
	}.call(this);
}

PL_Spy.prototype.visual = function(id, size) {
	this.visid = id;
	var prelude = d3.select("#"+id);
	var table = null;
	if ("caption" in this.properties) {
		prelude = prelude.append("table").append("tr")
		.append("caption")
		.text(this.properties.caption)
		.append("td");
	}
	prelude.append("input")
	.attr("id", id+"_spy")
	.attr("readonly", true)
	.attr("size", (size == null) ? 5 : size)
	.attr("value", "")
	this.vis = document.getElementById(id+"_spy");
}

//Barchart

function PL_Barchart(name, props, pins) {
	pl_proto.call(this, name, "Barchart", ["inpt"], [], ["vinit"]);
	if (pins != null && "inpt" in pins) this.inpt.exp = pins.inpt;
	this.props = props;
	if ("init" in props) this.vinit.exp = props.init;
	else delete(this.vinit);
	this.barchart = barchart("#"+props.vizid, props.width, props.height,
			props.XAxis, props.YAxis, props.yLabel, props.margin, props.colors, props.caption);
}

PL_Barchart.prototype = Object.create(pl_proto.prototype);
PL_Barchart.prototype.constructor = PL_Barchart;

PL_Barchart.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	if ("vinit" in this) {
		var myData = new Array();
		for (var i in this.scope.vinit) {
			myData.push({x: this.props.XAxis[i], y: this.scope.vinit[i]});
		}
		this.barchart.reset(myData);
	} else
		this.barchart.reset();
}

PL_Barchart.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var myData = new Array();
	for (var i in this.scope.inpt) {
		myData.push({x: this.props.XAxis[i], y: this.scope.inpt[i]});
	}
	this.barchart.render(myData);
}
//Linechart

function PL_Linechart(name, props, pins) {
	pl_proto.call(this, name, "Linechart", ["inpt"], [], ["vinit"]);
	if (pins != null && "inpt" in pins) this.inpt.exp = pins.inpt;
	this.props = props;
	this.myData = new Array();
	if (props.init == null) {
		if ("streams" in this.props) {
			var tmp = [];
			for (var i = 0; i < this.props.streams; i++) {
				tmp.push(0);
			}
			this.vinit.exp = tmp;
		} else this.vinit.exp = 0;
	} else this.vinit.exp = props.init;
	var hi = (typeof props.hi == "number") ? props.hi : props.hi.value;
	this.linechart = linechart("#"+props.vizid, props.width, props.height, props.margin, props.lo, hi,
			props.valueFunc, props.textFunc, null, null, null, null, props.manualColor,
			props.strokes, props.compareMode, props.initialMode, props.caption, props.legend);
}

PL_Linechart.prototype = Object.create(pl_proto.prototype);
PL_Linechart.prototype.constructor = PL_Linechart;

PL_Linechart.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	this.clock = clock;
	this.displayInterval = this.props.displayInterval || 0;
	if ("postInterval" in clock) this.displayInterval = Math.max(clock.postInterval, this.displayInterval);
	this.myData = new Array();
	if ("streams" in this.props) {
		this.vinit.reset();
		for (var i = 0; i < this.props.streams; i++) {
			this.myData[i] = new Array();
			this.myData[i].stroke = ("strokes" in this.props) ? this.props.strokes[i] : "black";
			this.myData[i].push({time: clock.lo, val: this.scope.vinit[i]});
		}
	} else {
		this.myData = new Array();
		this.vinit.reset();
		this.myData.stroke = ("stroke" in this.props) ? this.props.stroke : "black";
		this.myData.push({time: clock.lo, val: this.scope.vinit});
	}
	var hi = (typeof this.props.hi == "number") ? this.props.hi : this.props.hi.value;
	this.linechart.reset({hi: hi});
}

PL_Linechart.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	if ("streams" in this.props) {
		for (var i = 0; i < this.props.streams; i++) {
			this.myData[i].push({time: this.clock.current, val: this.scope.inpt[i]});
		}
	} else {
		this.myData.push({time: this.clock.current, val: this.scope.inpt});
	}
	if (this.displayInterval > 0) {
		if (this.clock.current % this.displayInterval == 0) this.linechart.render(this.myData); //, "xa");
		else if (this.clock.current >= this.clock.hi-this.clock.dt) this.linechart.render(this.myData); // , "xa");
	} else if (this.props.runAll) {
		if (this.clock.current >= this.clock.hi-this.clock.dt) this.linechart.render(this.myData, "xa");
	} else this.linechart.render(this.myData);

}

//Scatterchart

function PL_Scatterchart(name, props, pins) {
	pl_proto.call(this, name, "Linechart", ["inpt"], [], []);
	if (pins != null && "inpt" in pins) this.inpt.exp = pins.inpt;
	this.props = props;
	this.myData = new Array();
	this.autogen = ("autogen" in props) ? props.autogen : false;
	var transition = ("transition" in props) ? props.transition : false;
	if (!("radius" in props)) props.radius = 2;
	if (!("toolTip" in props)) props.toolTip = false;
	if (!("margin" in props)) props.margin = null;
	this.scatterchart = scatterchart("#"+props.vizid, props.width, props.height,
			props.xLabel, props.yLabel, props.margin, props.radius, props.caption, props.toolTip, transition);

}

PL_Scatterchart.prototype = Object.create(pl_proto.prototype);
PL_Scatterchart.prototype.constructor = PL_Scatterchart;

PL_Scatterchart.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	this.clock = clock;
	this.displayInterval = this.props.displayInterval || 0;
	if ("postInterval" in clock) this.displayInterval = Math.max(clock.postInterval, this.displayInterval);
	if (this.autogen) this.myData = new Array();
	this.scatterchart.reset();
}

PL_Scatterchart.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var inData = this.scope.inpt;
	var myData;
	if (this.autogen) {
		this.myData.push({x: +inData[0], y: +inData[1]});
		myData = this.myData;
	} else {
		myData = [];
		var keys = Object.keys(inData);
		for (var i in keys) {
			myData.push({x: +keys[i], y: inData[keys[i]]});
		}
	}
	if (this.displayInterval > 0) {
		if (this.clock.current % this.displayInterval == 0) this.scatterchart.render(myData);
		else if (this.clock.current >= this.clock.hi-this.clock.dt) this.scatterchart.render(myData);
	} else if (this.props.runAll) {
		if (this.clock.current >= this.clock.hi-this.clock.dt) this.scatterchart.render(myData);
	} else this.scatterchart.render(myData);
}

//Table

function PL_Table(name, props, pins) {
	pl_proto.call(this, name, "Table", ["inpt"], ["blob"], ["vinit"]);
	if (pins != null && "inpt" in pins) this.inpt.exp = pins.inpt;
	this.props = props;
	this.blobb = "";
	this.blob.exp = function(){return this.blobb;}
	var keys;
	if ("keys" in props) {
		keys = props.keys;
	} else {
		keys = [];
		for (var i = 0; i < props.columns.length-1; i++) keys.push(i);
		props.keys = keys;
	}
	var valueFuncs;
	if ("valueFuncs" in props) {
		valueFuncs = props.valueFuncs
	} else {
		valueFuncs = [];
		for (var i in props.keys) {
			var key = props.keys[i];
			var f = (function() {var key0 = key; return function(d){return d[key0];}})();
			valueFuncs.push(f);
		}
		this.props.valueFuncs = valueFuncs;
	}
	if (!("textFunc" in props)) props.textFunc = function(data){return data.time};
	this.myData = new Array();
	this.vinit.exp = (props.init == null) ? pins.inpt : props.init;
	this.trender = drawTable("#"+props.vizid, {width: props.width, height: props.height},
			valueFuncs, props.textFunc, props.columns, props.sort, props.sortIdx, props.caption);
}

PL_Table.prototype = Object.create(pl_proto.prototype);
PL_Table.prototype.constructor = PL_Table;

PL_Table.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	this.displayInterval = this.props.displayInterval || 0;
	if ("postInterval" in clock) this.displayInterval = Math.max(clock.postInterval, this.displayInterval);
	if ("csv" in this.props) {
		this.blobb = "";
		var cols = this.props.columns;
		for (var i = 0; i < cols.length; i++) {
			this.blobb += (cols[i] + ((i == cols.length-1) ? "\n" : ","));
		}
	}
	this.myData = new Array();
	var data = {time: this.clock.lo};
	if ("csv" in this.props) this.blobb += (data.time+",");
	this.vinit.reset();
	for (var i in this.props.keys) {
		var val = this.scope.vinit[i];
		data[this.props.keys[i]] = val;
		if ("csv" in this.props) this.blobb += (val+((i == this.props.keys.length-1) ? "\n" : ","));
	}
	this.blob.exp =
		(function() {
			var blobbe = this.blobb;
			return function(){
				return blobbe;
			}
		}).call(this);
	this.myData.push(data)
	this.trender = drawTable("#"+this.props.vizid, {width: this.props.width, height: this.props.height},
			this.props.valueFuncs, this.props.textFunc, this.props.columns, (this.clock.isRunAll) ? "na" : this.props.sort,
					this.props.sortIdx, this.props.caption);
}

PL_Table.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var data = {time: this.clock.current};
	if ("csv" in this.props) this.blobb += (data.time+",");
	for (var i in this.props.keys) {
		var val =  this.scope.inpt[i];
		data[this.props.keys[i]] = val;
		if ("csv" in this.props) this.blobb += (val+((i == this.props.keys.length-1) ? "\n" : ","));
	}
	this.blob.exp =
		(function() {
			var blobbe = this.blobb;
			return function(){
				return blobbe;
			}
		}).call(this);
	this.myData.push(data)
	if (this.displayInterval > 0) {
		if (this.clock.current % this.displayInterval == 0) this.trender(this.myData);
		else if (this.clock.current >= this.clock.hi-this.clock.dt) this.trender(this.myData);
	} else if (this.props.runAll) {
		if (this.clock.current >= this.clock.hi-this.clock.dt) this.trender(this.myData);
	} else this.trender(this.myData);

}

//Netviewer (grid)

function PL_Netviewer(name, props, pins) {
	pl_proto.call(this, name, "Netviewer", [], [], []);
	if (pins != null) {
		this.pins = pins;
		if ("source" in pins) this.sourceName = pins.source;
		if ("nColorOut" in pins) this.nColorOut = pins.nColorOut;
	} else this.pins = {};
	this.props = props;
	this.fstTime = true;
	this.nv = netviewer("#"+props.vizid, props.rows, props.cols, props.unit, props.maxWt, props.linkColor, props.colors, props.fixedMarker, props.background);
}

PL_Netviewer.prototype = Object.create(pl_proto.prototype);
PL_Netviewer.prototype.constructor = PL_Netviewer;

PL_Netviewer.prototype.glean = function() {
	var nColorOut = this.nColorOut;
	var changes = this.nnsource.changes[nColorOut];
	var ans = new Array();
	var nnsource = this.nnsource;
	var radius = ("radius" in this.props) ? this.props.radius : null;
	if (changes) {
		changes.forEach(function(id) {
			var rec = nnsource.NODES(id);
			var dat = {id: rec.id, wt: rec[nColorOut]};
			if (radius) dat.r = radius;
			ans[id] = dat;
		});
	}
	return ans;
}
PL_Netviewer.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	if (this.fstTime) {
		this.fstTime = false;
		this.nnsource =
			(typeof this.sourceName == "function") ? this.sourceName.call(this.cap)
					: this.cap[this.sourceName];
	}
	var myData = this.glean();
	this.nv.reset(myData, this.nnsource.connexions);
}
PL_Netviewer.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var myData = this.glean();
	this.nv.render(myData, this.nnsource.connexions);
}

//Agentviewer

function PL_Agentviewer(name, props, pins) {
	pl_proto.call(this, name, "Agentviewer", [], [], []);
	if (pins != null) {
		this.pins = pins;
		if ("source" in pins) this.sourceName = pins.source;
		if ("aColorOut" in pins) this.aColorOut = pins.aColorOut;
		if ("aSize" in pins) this.aSize = pins.aSize;
	} else this.pins = {};
	this.props = props;
	if ("radius" in props) this.radius = props.radius;
	if ("colors" in props) this.colors = props.colors;
	if ("images" in props) this.images = props.images;
	var fill = ("fill" in props) ? props.fill : null;
	this.fstTime = true;
	this.av = agentviewer("#"+props.vizid, props.width, props.height, props.unit, props.rows, props.cols, 20, (this.images)?true:false, fill);
}

PL_Agentviewer.prototype = Object.create(pl_proto.prototype);
PL_Agentviewer.prototype.constructor = PL_Agentviewer;
PL_Agentviewer.prototype.glean = function() {
	var changes = this.avsource.changes.location;
	var ans = new Array();
	var avsource = this.avsource
	var aColorOut = this.aColorOut;
	var aSize = this.aSize;
	var colors = this.colors;
	var images = this.images;
	var colorPick = this.colorPick;
	var radius = this.radius;
	var ans0 = {}
	if (images && changes) {
		changes.forEach(function(id) {
			var rec = avsource.AGENTS(id);
			var image = images[rec[aColorOut]];
			if (rec) {
				if ("left" in image) {
					image = (rec.theta >= nsutil.math.mpio2 && rec.theta <= nsutil.math.pio2) ? image.right : image.left;
				}
				var dat = {id: rec.id, cx: rec.x, cy: rec.y, wrapped: rec.wrapped, image: image};
				if (aColorOut && colors) {
					dat.col = colorPick(rec[aColorOut], colors);
				}
				if (aSize) {
					var m = rec[aSize];
					var image1 = {src: dat.image.src, size: [m*dat.image.size[0], m*dat.image.size[1]]}
					dat.image = image1;
				}
				ans0[id] = dat;
			}
		});
	} else if (changes) {
		changes.forEach(function(id) {
			var rec = avsource.AGENTS(id);
			if (rec) {
				var dat = {id: rec.id, cx: rec.x, cy: rec.y, wrapped: rec.wrapped};
				if (aColorOut && colors) {
					dat.col = colorPick(rec[aColorOut], colors);
				}
				if (aSize) {
					dat.radius = rec[aSize];
				} else if (radius) {
					dat.r = radius;
				}
				ans0[id] = dat;
			}
		});
	}
	if (aColorOut && colors) {
		var changes1 = this.avsource.changes[aColorOut];
		if (changes1) {
			changes1.forEach(function(id) {
				var rec = avsource.AGENTS(id);
				if (!ans0[id]) {
					var dat = {id: rec.id, cx: rec.x, cy: rec.y, wrapped: rec.wrapped, col: colorPick(rec[aColorOut], colors)};
					ans0[id] = dat;
				}
			});
		}
	}
	if (aSize) {
		var changes1 = this.avsource.changes[aSize];
		if (changes1) {
			changes1.forEach(function(id) {
				var rec = avsource.AGENTS(id);
				if (!ans0[id]) {
					var dat;
					if (images) {
						var m = rec[aSize];
						var image1 = {src: dat.image.src, size: [m*dat.image.size[0], m*dat.image.size[1]]}
						dat = {id: rec.id, cx: rec.x, cy: rec.y, wrapped: rec.wrapped, image: image1};
					} else {
						dat = {id: rec.id, cx: rec.x, cy: rec.y, wrapped: rec.wrapped, radius: rec[aSize]};
					}
					ans0[id] = dat;
				}
			});
		}
	}
	for (var i in ans0) ans.push(ans0[i]);
	return ans
}
PL_Agentviewer.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	if (this.fstTime) {
		this.fstTime = false;
		this.avsource =
			(typeof this.sourceName == "function") ? this.sourceName.call(this.cap)
					: this.cap[this.sourceName];
	}
	var myData = this.glean();
	this.av.reset(myData);
}
PL_Agentviewer.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var avsource = this.avsource
	var births = this.avsource.changes["_births_"].map(function(id){
		var rec = avsource.AGENTS(id);
		return {id: rec.id, cx: rec.x, cy: rec.y};
	});
	var deaths = this.avsource.changes["_deaths_"];
	var myData = this.glean();
	this.av.create(births);
	this.av.kill(deaths);
	this.av.render(myData);
}

//AgentviewerX

function PL_AgentviewerX(name, props, pins) {
	pl_proto.call(this, name, "AgentviewerX", [], [], []);
	if (pins != null) {
		this.pins = pins;
		if ("source" in pins) this.sourceName = pins.source;
	} else this.pins = {};
	this.props = props;
	if ("images" in props) this.images = props.images;
	this.rows = this.props.rows;
	this.cols = this.props.cols;
	this.interactive = ("interactive" in props) ? props.interactive : false;
	this.av = agentviewerx("#"+props.vizid, props.unit, props.rows,
			props.cols, props.colors, (props.transition)?props.transition:20,
					(props.toolTip)?true:false, props.images);
	this.cBucket = new Object();
	this.aBucket = new Object();
	this.fstTime = true;
	if (this.interactive) {
		var bucket = this.cBucket;
		for (var i in this.props.cellInit) {
			var maze = this.props.cellInit[i]
			maze.forEach(function(id){bucket[id] = {colorIdx: +i}});
		}

	}
	this.acscale = 1;
	this.ccscale = 1;
	if ("hiAgentColor" in props) {
		if (!("lowAgentColor" in props)) props.lowAgentColor = 0;
		this.acscale = (props.colors.agent.length-1)/(props.hiAgentColor-props.lowAgentColor);
	}
	if ("hiCellColor" in props) {
		if (!("lowCellColor" in props)) props.lowCellColor = 0;
		this.ccscale = (props.colors.cell.length-1)/(props.hiCellColor-props.lowCellColor);
	}
	this.sscale = function(x){return x;}
	if (this.pins.aSizeOut != null) {
		var largeSize = props.largeSize;
		var smallSize = props.smallSize;
		if (largeSize != null && smallSize != null) {
			this.sscale = function(x, y){return Math.max(2, 2*x*(y-smallSize)/(largeSize-smallSize));}
		}
	}

}

PL_AgentviewerX.prototype = Object.create(pl_proto.prototype);
PL_AgentviewerX.prototype.constructor = PL_AgentviewerX;

PL_AgentviewerX.prototype.initA = function() {
	var ans = new Array();
	var outPin = this.pins.aColorOut;
	var sizePin = this.pins.aSizeOut;
	var radius = this.props.radius
	var sscale = this.sscale;
	var acscale = this.acscale;
	var ccscale = this.ccscale;
	for (var i = 0; i < this.source.agentvector.count; i++) {
		var rec = this.source.agentvector.AGENTS(i);
		ans.push({id: rec.id, cx: rec.self.x, cy: rec.self.y, r: sscale(radius, rec[sizePin]), colorIdx: acscale*rec[outPin], wrapped: rec.wrapped});
	}
	return ans;
};

PL_AgentviewerX.prototype.gleanA = function() {
	var av = this.source.agentvector;
	var changes = av.changes.location;
	var ans = new Array();
	var outPin = this.pins.aColorOut;
	var radius = this.props.radius;
	var sizePin = this.pins.aSizeOut;
	var sscale = this.sscale;
	var acscale = this.acscale;
	var ccscale = this.ccscale;
	if (changes) {
		changes.forEach(function(id) {
			var rec = av.AGENTS(id);
			ans.push({id: rec.id, cx: rec.self.x, cy: rec.self.y, r: sscale(radius, rec[sizePin]), colorIdx: acscale*rec[outPin], wrapped: rec.wrapped});
		});
	}
	var changes1 = av.changes[outPin];
	if (changes1) {
		changes1.forEach(function(id) {
			if (!changes[id]) {
				var rec = av.AGENTS(id);
				ans.push({id: rec.id, cx: rec.self.x, cy: rec.self.y, r: sscale(radius, rec[sizePin]), colorIdx: acscale*rec[outPin], wrapped: rec.wrapped});
			}
		});
	}
	return ans;
};

PL_AgentviewerX.prototype.initC = function() {
	var ans = new Array();
	var outPin = this.pins.cColorOut;
	var acscale = this.acscale;
	var ccscale = this.ccscale;
	for (var i = 0; i < this.rows; i++)
		for (var j = 0; j < this.cols; j++) {
			var rec = this.source.cellmatrix.CELLS(i,j);
			ans.push({id: rec.id, r: rec.row, c: rec.col, colorIdx: ccscale*rec[outPin]});
		}
	return ans;
};

PL_AgentviewerX.prototype.gleanC = function() {
	var ans = new Array();
	var outPin = this.pins.cColorOut;
	var cm = this.source.cellmatrix;
	var changes = cm.changes[outPin];
	var acscale = this.acscale;
	var ccscale = this.ccscale;
	if (!changes) return ans;
	changes.forEach(function(id) {
		var rec = cm.CELLS(id);
		ans.push({id: rec.id, r: rec.row, c: rec.col, colorIdx: ccscale*rec[outPin]});
	});
	return ans;
};

PL_AgentviewerX.prototype.prereset = function(clock) {
	pl_proto.prototype.prereset.call(this, clock);
	if (this.fstTime) {
		this.fstTime = false;
		this.source =
			(typeof this.sourceName == "function") ? this.sourceName.call(this.cap)
					: this.cap[this.sourceName];
		if (this.interactive) {
			var that = this;
			this.aBucket = this.props.agentInit;
			this.source.cellmatrix[this.pins.cColorIn] = function() {
				var ans = 0;
				var rec = that.cBucket[this.id];
				if (rec) ans = rec.colorIdx;
				return ans;
			}
			this.source.agentvector[this.pins.aColorIn] = function () {
				var ans = 0;
				var rec = that.aBucket[this.id];
				if (rec) ans = rec.colorIdx;
				return ans;
			}
		}
	}
	if (this.interactive) {
		var cBucket = this.av.getInitCellBucket();
		for (var id in cBucket) {
			if (cBucket[id].colorIdx) this.cBucket[id] = cBucket[id];
			else (delete this.cBucket[id]);
		}
		var aBucket = this.av.getInitAgentBucket();
		for (var id in aBucket) this.aBucket[id] = aBucket[id];
		this.source.agentvector.regenerate(this.aBucket);
	}
}

PL_AgentviewerX.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock);
	var myDataA = this.initA();
	var myDataC = this.initC();
	this.av.reset(myDataA, myDataC);
}

PL_AgentviewerX.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var births = this.source.agentvector.changes["_births_"].map(function(id){
		var rec = this.source.agentvector.AGENTS(id);
		return {id: rec.id, cx: rec.x, cy: rec.y};
	});
	var deaths = this.source.agentvector.changes["_deaths_"];
	var myDataA = this.gleanA();
	var myDataC = this.gleanC();
	this.av.create(births);
	this.av.kill(deaths);
	this.av.render(myDataA, myDataC);
}

//Raster

function PL_Raster(name, props, pins) {
	pl_proto.call(this, name, "Raster", [], [], []);
	if (pins != null) {
		this.pins = pins;
		if ("source" in pins) this.sourceName = pins.source;
	} else this.pins = {};
	this.props = props;
	if ("images" in props) this.images = props.images;
	this.rows = this.props.rows;
	this.cols = this.props.cols;
	this.interactive = ("interactive" in props) ? props.interactive : false;
	this.rast = raster("#"+props.vizid, props.unit, props.rows, props.cols, props.colors);
	this.bucket = new Object();
	this.fstTime = true;
	if (this.interactive) {
		var bucket = this.bucket;
		for (var i in this.props.init) {
			var maze = this.props.init[i]
			maze.forEach(function(id){bucket[id] = {colorIdx: +i}});
		}

	}
	if ("numColors" in props) {
		props.colors.splice(props.numColors, props.colors.length-props.numColors);
	}
	this.scale = 1;
	if ("hiColor" in props) {
		if (!("loColor" in props)) props.loColor = 0;
		this.scale = (props.colors.length-1)/(props.hiColor-props.loColor);
	}
}

PL_Raster.prototype = Object.create(pl_proto.prototype);
PL_Raster.prototype.constructor = PL_Raster;

PL_Raster.prototype.init = function() {
	var ans = new Array();
	var outPin = this.pins.colorOut;
	var scale = this.scale;
	for (var i = 0; i < this.rows; i++)
		for (var j = 0; j < this.cols; j++) {
			var rec = this.source.CELLS(i,j);
			ans.push({id: rec.id, r: rec.row, c: rec.col, colorIdx: scale*rec[outPin]});
		}
	return ans;
};

PL_Raster.prototype.glean = function() {
	var ans = new Array();
	var outPin = this.pins.colorOut;
	var cm = this.source;
	var changes = cm.changes[outPin];
	var scale = this.scale;
	if (!changes) return ans;
	changes.forEach(function(id) {
		var rec = cm.CELLS(id);
		ans.push({id: rec.id, r: rec.row, c: rec.col, colorIdx: scale*rec[outPin]});
	});
	return ans;
};

PL_Raster.prototype.prereset = function(clock) {
	pl_proto.prototype.prereset.call(this, clock);
	if (this.fstTime) {
		this.fstTime = false;
		this.source =
			(typeof this.sourceName == "function") ? this.sourceName.call(this.cap)
					: this.cap[this.sourceName];
		if (this.interactive) {
			var that = this;
			this.source[this.pins.colorIn] = function() {
				var ans = 0;
				var rec = that.bucket[this.id];
				if (rec) ans = rec.colorIdx;
				return ans;
			}
		}
	}
	if (this.interactive) {
		var bucket = this.rast.getInitBucket();
		for (var id in bucket) {
			if (bucket[id].colorIdx) this.bucket[id] = bucket[id];
			else (delete this.bucket[id]);
		}
	}
}

PL_Raster.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock);
	var myData = this.init();
	this.rast.reset(myData);
}

PL_Raster.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var myData = this.glean();
	this.rast.render(myData);
}

function PL_Tabulator(name, properties, pins) {
	this.properties = properties
	this.size = properties.size;
	this.start = properties.start;
	var outs = new Array();
	for (var i = 0; i < this.size; i++) {
		outs.push("Out_"+((i < 10)?"0"+i:i));
	}
	pl_proto.call(this, name, "Tabulator", [], outs, []);
	if (pins != null) {
		if ("source" in pins) this.sourceName = pins.source;		
		if ("In" in pins) this.In = pins.In;
	}
	this.buckets = new Array();
	for (var i = 0; i < this.size; i++) {
		this.buckets[i] = 0;
		this[outs[i]].exp = (function(){
			var j = i; 
			return function(){return this.buckets[j];}.bind(this);
		}).call(this);
	}
}

PL_Tabulator.prototype = Object.create(pl_proto.prototype);
PL_Tabulator.prototype.constructor = PL_Tabulator;

PL_Tabulator.prototype.reset = function(clock, scope) {
	pl_proto.prototype.reset.call(this, clock, scope);
	this.source =
		(typeof this.sourceName == "function") ? this.sourceName.call(this.cap)
				: this.cap[this.sourceName];
	this.kind = this.source.kind;
	var pin = this.In;		
	var buckets = this.buckets;
	var start = this.start;
	for (var i = 0; i < buckets.length; i++) buckets[i] = 0;
	switch (this.kind) {
	case "CellMatrix":
		cm = this.source;
		this.State = new Object();
		for (var i = 0; i < this.source.rows; i++) {
			for (var j = 0; j < this.source.cols; j++) {
				var rec = cm.CELLS(i, j);
				var n = rec[pin];			
				this.State["C"+i+":"+j] = n;
				var m = n - start;
				if (m >= 0 && m < buckets.length) buckets[m]++;
			}
		};
		break;
	default:
		break;
	}
}

PL_Tabulator.prototype.strobe = function(t, scope) {
	pl_proto.prototype.strobe.call(this, t, scope);
	var pin = this.In;
	var changes = this.source.changes[pin];
	if (!changes) return;
	var start = this.start;
	var buckets = this.buckets;
	var State = this.State;
	switch (this.kind) {
	case "CellMatrix":
		cm = this.source;
		changes.forEach(function(id) {
			var rec = cm.CELLS(id);
			var n = rec[pin];			
			var m = n - start;
			var old = State[id];
			var old1 = (old == null) ? null : old - start;
			if (m >= 0 && m < buckets.length) buckets[m]++;
			if (old1 != null && old1 >= 0 && old1 < buckets.length) buckets[old1]--;
			State[id] = n;
		});
		break;
	default:
		break;
	}
}


