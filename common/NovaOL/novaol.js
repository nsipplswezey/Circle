//NovaOL.js 0.0.1
//Nova Online html builder functions
//http://novamodeler.com
//(c) 2014-2015 Richard Salter

/**
 * Generates dom and novamanager for simulations.
 * @param {Object} PDatas - The model specifications. In an extended .json format
 * @param {Number} index - Index tag for this instantiation of the projectn 
 * @returns {Object} Object wrapping PData with methods for parsing PData, and converting into DOM elements;
 * 	other methods create novaManager instance. Some of these methods seem to used by <model_name>.js files
 */

// globl is a single namespace for all projects and instances

var globl = new Object();

Novaol = function(PDatas, index) {
	this.index = index;
	var mergeAll = function(PDatas) {
		var ans = PDatas[0];
		for (var i = 1; i < PDatas.length-1; i++) ans = merge(ans, PDatas[i])
		return ans;
	}

	var merge = function(PD0, PD1) {
		var ans = {}
		for (var j in PD0) ans[j] = PD0[j];
		for (var j in PD1) {
			if (!(j in PD0)) {
				ans[j] = PD1[j];
				continue;
			}
			var v0 = PD0[j];
			var v1 = PD1[j];
			if (Array.isArray(v0)) {
				var v0x = [];
				for (var i in v0) v0x[i] = v0[i];
				if (Array.isArray(v1))
					ans[j] = arrayMerge(v0, v1);
				else {
					if (v0x.indexOf(v1) < 0) v0x.push(v1);
					ans[j] = v0x;
				}
			} else ans[j] = (v0 == v1) ? v0 : new Array(v0, v1);
		}
		return ans;
	}

	var arrayMerge = function (x, y) {
		var ans = []
		for (var i in x) ans[i] = x[i];
		for (var i in y)
			if (x.indexOf(y[i]) < 0) ans.push(y[i]);
		return ans;
	}
	
	this.data = mergeAll(arguments);
	this.project = this.data.project; 

//nmify (tag) provides properly annotated prefix (suffix) to prepend (append) to references
	this.nmify ="globl['"+this.project+"'].novaManager['"+this.index+"']";
	this.tag = this.project+"_"+this.index;
}
	
Novaol.prototype.git0 = function(x){return (Array.isArray(x)) ? x[0] : x;}
Novaol.prototype.gitn = function(x){return (Array.isArray(x)) ? x[x.length-1] : x;}

//timefield returns data describing the textfield displaying the current time
Novaol.prototype.timefield = function(){return [{type: "field", id: "timeval_"+this.tag, text: "Time", size: 6, value: 0}]},

//simcontrols returns data describing the standard simulation control set
Novaol.prototype.simcontrols = function() {
	return [
	 {type: "slider", id: "simhi", text: "Simulation End", min: this.data.clock.lo, max: this.data.clock.max, value: this.data.clock.hi, size: 6, step: this.data.clock.step},
     {type: "slider", id: "simspeed", text: "Simulation Delay (ms)", min: 0, max: 2000, value: 0, size: 6, step: 10,	chmore: this.nmify+".fixSpeed(this.value); "}
	]
};

//simbuttons returns data describing the standard button set
Novaol.prototype.simbuttons = function(){
	return [
	 {name: "reset", text: "Reset", onClick: this.nmify+".reset()", onDblClick: this.nmify+".dblReset()"},
	 {name: "run", text: "Run", onClick: this.nmify+".run()"},
	 {name: "stop", text: "Stop", onClick: this.nmify+".stop()"},
	 {name: "continue", text: "Continue", onClick: this.nmify+".restart()"},
	 {name: "step", text: "Step", onClick: this.nmify+".step()"}
	];
};

//control creates appropriate HTML for each type of control 
Novaol.prototype.control = function(hook, clazz, dat) {
	var tag = this.tag;
	var nmify = this.nmify;
	hook.selectAll("."+clazz).data(dat)
	.enter().append("td")
	.each(function(d) {

		if (d.type == "slider") {

			//append label text
			d3.select(this).append("label")
			.attr("for", d.id+"_slider_"+tag)
			.text(function(d){return d.text+": "});

			//append input slider range
			d3.select(this).append("input")
			.attr("id", d.id+"_slider_"+tag)
			.attr("type", "range")
			.attr("name", d.id+"_name_"+tag)
			.attr("min", d.min)
			.attr("max", d.max)
			.attr("value", d.value)
			.attr("step", d.step)
			.attr("onchange",
					(d.change) ? d.change :
						nmify+".showSliderValue('"+d.id+"_field_"+tag+"', this.value); "
						+ ( (d.chmore) ? d.chmore:"")
						+ ( (d.reset) ? nmify+".reset()":"")
			)

			//append span for text box
			d3.select(this)
			.append("span")
			.style("padding-left", "5px")
			.append("input")
			.style("text-align", "right")
			.attr("id", d.id+"_field_"+tag)
			.attr("type", "text")
			.attr("size", d.size)
			.attr("value", d.value)
			.attr("readonly", true);

		} else if (d.type == "field") {

			//append text label
			d3.select(this).append("label")
			.attr("for", d.id)
			.text(d.text+": ");

			//append text input type
			d3.select(this)
			.append("input")
			.style("text-align", ("readwrite" in d) ? "left" : "right")
			.attr("id", d.id)
			.attr("type", "text")
			.attr("size", d.size)
			.attr("value", d.value)
			.attr("readonly", ("readwrite" in d) ? null : true);

		} else if (d.type == "switch") {
			var swtable = d3.select(this).append("table");
			swtable.append("tr").append("td")
			.attr("colspan", 2)
			.style("text-align", "center")
			.text(d.text);
			var row = swtable.append("tr");
			row.append("td")
			.style("padding-left", "0px")
			.style("padding-right", "5px")
			.style("vertical-align", "middle")
			.style("text-align", "right")
			.append("label")
			.attr("for", d.id+"_switch_"+tag)
			.append("font")
			.attr("color", "red")
			.text(d.left);
			var col = row.append("td")
			.style("padding-left", "5px")
			.style("padding-right", "0px")
			.style("vertical-align", "middle")
			.style("text-align", "left");
			col.append("input")
			.style("visibility", "hidden")
			.attr("type", "checkbox")
			.attr("id", d.id+"_switch_"+tag)
			.attr("name", d.id+"_switch_name_"+tag)
			.attr("checked", d.checked)
			.attr("class", "switch")
			col.append("label")
			.attr("for", d.id+"_switch_"+tag)
			.append("font")
			.attr("color", "green")
			.text(d.right)
		}
	});
};

// buttons creates HTML for the standard button set
Novaol.prototype.buttons = function(hook, clazz, dat) {
	hook.selectAll("."+clazz).data(dat)
	.enter().append("button")
	.attr("name", function(d){return d.name})
	.attr("onClick", function(d){return d.onClick})
	.text(function(d){return d.text})
	.each(function(d) {
		if ("onDblClick" in d)
			d3.select(this).attr("onDblClick", d.onDblClick);
	})
};

// populate reads the PData specification and creates appropriate HTML elements
Novaol.prototype.populate = function(callback){
	
	//Additional CSS files
	if ("css" in this.data) {
		d3.select("head").selectAll(".csslinks").data(this.data.css)
		.enter().append("link")
		.attr("rel", "stylesheet")
		.attr("type", "text/css")
		.attr("href", function(d){return "common/"+d+".css"});
	}

	//inline CSS styles
	if ("cssauto" in this.data) {
		d3.select("head").append("style").text(this.data.cssauto);
	}

	//Document title
	d3.select("head").append("title").text(this.gitn(this.data.title));

	if ("wallpaper" in this.data) {
		d3.select("body")
		.attr("background", this.gitn(this.data.wallpaper));
	}
	else if ("background_color" in this.data) {
		d3.select("body")
		.style("background-color", this.gitn(this.data.background_color));
	}

	//Title banner
	d3.select("#simtitle").text(this.gitn(this.data.title));

	//Simulator buttons
	var simbuttons = ("simbuttons" in this.data) ? this.simbuttons.concat(this.data.simbuttons(this.index)) : this.simbuttons();
	var simcontrols = ("simcontrols" in this.data) ? this.data.simcontrols(this.index) : this.simcontrols();

	//Simulator controls
	var tagg = "#SControls_"+this.tag;
	this.control(d3.select(tagg).append("table").append("tr"), "ncsliders", simcontrols);
	this.buttons(d3.select(tagg).select("tr").append("td"), "ncbuttons", simbuttons);
	this.control(d3.select(tagg).select("tr"), "ncsliders", this.timefield());

	//Model controls
	if ("modcontrols" in this.data) {
		var modelControls = d3.select("#MControls_"+this.tag)

		for (var i = 0; i < this.data.modcontrols.length; i++) {
			var rw = this.data.modcontrols[i];
			this.control(modelControls.append("table").append("tr"), "controls", rw);
		}
	}

	//Visual elements
	if ("visuals" in this.data) {
		if (Array.isArray(this.data.visuals)) {
			var vizuals = this.data.visuals.reverse();
			for (var i = 0; i < vizuals.length; i++)
				this.data.visuals[i](d3.select("#visuals_"+this.tag), this.project, this.index);
		} else
			this.data.visuals(d3.select("#visuals_"+this.tag), this.project, this.index);
	}
	
	//Author's signature
	if ("address" in this.data) {
		if (Array.isArray(this.data.address)) {
			d3.select("#address").selectAll(".addresses").data(this.data.address)
			.enter().append("address").text(function(d){return d});
		} else {
			d3.select("#address").append("address").text(this.data.address);
		}
	}
	
	//Modification date
	d3.select("#modified").text("Last Modified "+new Date().toString());

	if (callback) callback();
};


/**
 * Sets initial values of slider dom elements to initial values of sim and mod controls
 * @param None. All side effects
 * @returns {Object} Object containing all dom elements corresponding to slider controls
 * Invoked in final index.html script tag. Controls array added as proprty of globl,
 * which is the object that contains Lotka.js. This object is input into novaManager
 */
Novaol.prototype.control_builder = function(){
	var controls = {};

	var ctls = ("simcontrols" in this.data) ? this.git0(this.data.simcontrols(index)) : this.simcontrols();

	for (var i = 0; i < ctls.length; i++) {
		var ctl = ctls[i];
		controls[ctl.id] = document.getElementById(ctl.id+"_"+ctl.type+"_"+this.tag);
		controls[ctl.id].value = ctl.value;
	}

	if (!("modcontrols" in this.data)) return;

	var flats = this.data.modcontrols.reduce(function(a, b) {return a.concat(b);});

	for (var i = 0; i < flats.length; i++) {
		var ctl = flats[i];
		var id = (ctl.type == "field") ? ctl.id : ctl.id+"_"+ctl.type+"_"+this.tag;
		controls[ctl.id] = document.getElementById(id);
		controls[ctl.id].value = ctl.value;
	}
	//"controls" are an object that contains all the dom elements corresponding to the sliders and other inputs
	return controls;
};

Novaol.prototype.get = function(spath) {
	var iterator = function(path, thing) {
		for (var i = 0; i < path.length; i++) {
			if (Array.isArray(thing)) {
				for (var j = 0; j < thing.length; j++) {
					ans = iterator(path.slice(1), thing[j]);
					if (ans == null) continue;
					return ans;
				}
				return null;
			} else {
				if (typeof thing == "function" && i < path.length-1) thing = thing(this.project, this.index);
				if (thing == null) return null;
				var key = path[i];
				thing = thing[key];
			}
		}
		return thing;
	}.bind(this)
	var path = spath.split(".");
	var thing = iterator(path, this.data);
	return thing;
};

Novaol.prototype.getAll = function(spath) {
	var iterator = function(path, thing) {
		for (var i = 0; i < path.length; i++) {
			if (Array.isArray(thing)) {
				for (var j = 0; j < thing.length; j++) {
					ans = iterator(path.slice(1), thing[j]);
					if (ans == null) continue;
					return ans;
				}
				return null;
			} else {
				if (typeof thing == "function") thing = thing(this.project, this.index);
				if (thing == null) return null;
				var key = path[i];
				thing = thing[key];
			}
		}
		return thing;
	}.bind(this)
	var path = spath.split(".");
	var thing = iterator(path, this.data);
	var ans = {};
	for (var key in thing) ans[key] = thing[key];
	return ans;
};

//A neat way to pass parameters to a script; used to read in the project name to .json script
Novaol.getSyncScriptParams = function() {
	var scripts = document.getElementsByTagName('script');
	var lastScript = scripts[scripts.length-1];
	var scriptName = lastScript;
	var ans = new Object();
	for (var i = 0; i < arguments.length; i++) {
		var val = scriptName.getAttribute(arguments[i]);
		if (val != null) ans[arguments[i]] = val; 
	};
	return ans;
} 

//Reads in project name and records JSON file
Novaol.recordJSON = function(obj) {
	var project = Novaol.getSyncScriptParams("data-project")["data-project"];
	globl[project] = new Object();
	obj.project = project
	globl[project].PData = obj;
}

//Reads in project name and records Novascript file
Novaol.recordJS = function(obj) {
	var project = Novaol.getSyncScriptParams("data-project")["data-project"];
	globl[project].main = obj;
}

//Attaches appropriate hooks to div sections in the index template
Novaol.prototype.buildHTML = function() {
	var tag = this.tag;
	var loc = d3.select("#"+tag);
// model controls	
	loc.append("table")
	.attr("id", "SControls_"+tag)
	.attr("class", "simControlTable");
	loc.append("hr");
// simulator controls
	loc.append("table")
	.attr("id", "MControls_"+tag)
	.attr("class", "modControlTable");
	loc.append("hr");
// visuals	
	loc.append("div")
	.attr("id", "visuals_"+tag)
	.attr("class", "novaVisuals");
}

// startup instantiates an instance of a project
Novaol.startup = function(project, index) {
	if (!("controls" in globl[project])) globl[project].controls = new Object()
	if (!("novaManager" in globl[project])) globl[project].novaManager = new Object();
	novaol = new Novaol(globl[project].PData, index);
	novaol.buildHTML();
	novaol.populate();
	globl[project].controls[index] = novaol.control_builder();
	globl[project].postInterval = novaol.get("postinterval");
	globl[project].novaManager[index] = novaol.getNovaManager()
} 

// getNovaManager builds a simulation instance and attaches a novaManager
Novaol.prototype.getNovaManager = function() {
	var project = this.project;
	var index = this.index;
	var lo = this.get("clock.lo");
	var hi = globl[project].controls[index].simhi;
	var dt = this.get("clock.dt");
	var method = this.get("clock.method");
	var Main = SimGen(globl[project].main, globl[project].controls[index]);
	var obj = {
		clock: new Clock(lo, hi, dt, method),
		resetter: function(fast) {
			obj.clock.reset(Main);
		},
		updater: function() {
		},
	}
	obj.clock.postInterval = globl[project].postInterval;
	obj.resetter();
	ans = NovaManager(obj.updater, obj.resetter, obj.clock, document.getElementById("timeval_"+project+"_"+index), hi, dt, 0, 0);
	return ans;
};
