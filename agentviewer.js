// Novascript d3 agent viewer

function agentviewer(divid, wd, ht, u, rws, cls, dur) {
    var width = wd, height = ht, unit = u, rows = rws, cols = cls;
    var duration = (dur) ? dur : 20;
    var wrows = unit*rows, wcols = unit*cols;
    var Data = [], DataMap = new Object();
    var svg, DefRadius = 15;

    function initSVG() {
	d3.select(divid).select("svg").remove();
	svg = d3.select(divid).append("svg")
     	    .attr("width", width)
    	    .attr("height", height)
    	    .append("g")
    	    .attr("class", "g_main_agent")
	    .attr("transform", "translate(0, 0)");

	var defs = svg.append("svg:defs");

	defs.append("svg:clipPath")
    	    .attr("id", "crect")
  	    .append("svg:rect")
	    .attr('x', 0)
	    .attr('y', 0)
	    .attr("width", width)
	    .attr("height", height);

	svg.append("rect")
	    .attr("class", "click-capture")
	    .attr('x', 0)
	    .attr('y', 0)
	    .attr("width", width)
	    .attr("height", height);
    }

    function pushData(x, y, r, id, color) {
	Data.push({x:x, y:y, r:r, id:id, color:color});
    }

    function clearData() {Data = []; DataMap = new Object();}

    function updateAgent(dat) {
	var dat0 = [];
	var dat1 = [];
	for (var i = 0; i < dat.length; i++) {
	    if (dat[i].wrapped) dat1.push(dat[i]);
	    else dat0.push(dat[i]);
	}
	var select = svg.selectAll("circle").data(dat0, function(d){return d.id;});
	select
	    .enter().append("circle")
	    .attr("clip-path", "url(#crect)")
	    .attr("id", function(d){return "A"+d.id})
	    .attr("cx", function(d){return unit*d.cx})
	    .attr("cy", function(d){return unit*d.cy})
	    .attr("r", function(d){return (d.r) ? d.r : DefRadius})
	    .attr("fill", function(d){return d.color})
	select
	    .attr("r", function(d){return (d.r) ? d.r : DefRadius})
	    .attr("fill", function(d){return d.color})
	select.transition().duration(duration)
	    .attr("cx", function(d){return wrap(unit*d.cx, wcols)})
	    .attr("cy", function(d){return wrap(unit*d.cy, wrows)})

	var select1 = svg.selectAll("circle").data(dat1, function(d){return d.id;});
	select1
	    .attr("cx", function(d){return wrap(unit*d.cx, wcols)})
	    .attr("cy", function(d){return wrap(unit*d.cy, wrows)})
	    .attr("r", function(d){return d.r;})
	    .style("fill", function(d){return d.color})
    }

    function resize(width0, height0) {
	width = width0;
	height = height0;
	initSVG();
	updateAgent(Data);
    }

    function populate(datl) {
	Data = [];
	for (var i = 0; i < datl.length; i++) {
	    var dat = datl[i];
	    var rec = {id: dat.id, cx: dat.x, cy: dat.y, r: (dat.r)?dat.r:5+15*Math.random(),
    		       color: (dat.col)?dat.col:randomColor(), wrapped: false}
    	    Data.push(rec);
	    DataMap[dat.id] = rec
	}
	updateAgent(Data);
    }

    function randomColor() {
	var ans = "#"
	for (var i = 0; i < 3; i++)
	    ans = ans + Math.floor(16*Math.random()).toString(16);
	return ans;
    }

    function wrap(v, b) {
	return (v + b) % b;
    }

    function reset(datl) {
	clearData();
	initSVG();
	if (datl.length > 0) populate(datl);
    }

    function render(xyDat) {
	for (var i = 0; i < xyDat.length; i++) {
	    var rec0 = xyDat[i]
	    var rec = DataMap[rec0.id];
	    if (rec) {
		rec.cx = rec0.x;
		rec.cy = rec0.y;
		if (rec0.col) rec.color = rec0.col;
		if (rec0.r) rec.r = rec0.r;
		rec.wrapped = rec0.wrapped;
	    }
	}
	updateAgent(Data);
    }

    reset([]);

    return {render: render, reset: reset}
}
