// linechart.js
//  c. 2014 rms
//  chartid = div id
//  wd, ht = dimension
//  m = margin {left, right, top, bottom}
//  lo, hi = x axis range
//  [xF], [yF] = x/y selectors (default to "x" and "y")

function linechart(chartid, wd, ht, m, lo, hi, yF, xF, ylo, yhi, sp, comp) {
    var path, x, y, xAxis, line, svg, svgdat, width = wd, height = ht, margin = m;
    var xLo = lo, xHi = hi;
    var yLo = (ylo)?ylo:0, yHi = (yhi)?yhi:0;
    var sep = (sp)?sp:100;
    var compare = (comp)?comp:false;
    var Data = [], FlashOffset = 40;
    var yFunc = (yF) ? yF : function(d){return d.y;}
    var xFunc = (xF) ? xF : function(d){return d.x;}
    var fixedAxes = (ylo || yhi) ? true : false;
    

    function setup(width0, height0) {
	width = width0 - margin.left - margin.right - 20;
	height = height0 - margin.top - margin.bottom - 20;
	x = d3.scale.linear()
    	    .range([0, width]);
	y = d3.scale.linear()
    	    .range([height, 0]);
	xAxis = d3.svg.axis()
  	    .scale(x)
  	    .orient("bottom");
	yAxis = d3.svg.axis()
  	    .scale(y)
  	    .orient("left");
	line = d3.svg.line()
  	    .x(function(d) { return x(xFunc(d)); })
  	    .y(function(d) { return y(yFunc(d)); });
    }

    function initSVG() {
	d3.select(chartid).select("svg").remove();
	svg = d3.select(chartid).append("svg")
     	    .attr("width", width + margin.left + margin.right)
    	    .attr("height", height + margin.top + margin.bottom)
    	    .append("g")
    	    .attr("class", "g_main_linechart")
   	    .attr("transform", "translate(" + margin.left + "," + margin.top +  ")");
	svgdat = svg.append("g")
	    .attr("class", "datapaths");

	svg
	    .on("mousemove", function () {
		cx = d3.mouse(this)[0];
		cy = d3.mouse(this)[1];
		redrawline(cx, cy);
		flash(cx, cy, this);
            })
	    .on("mouseover", function () {
		d3.selectAll('.line_over').style("display", "block");
		cx = d3.mouse(this)[0];
		cy = d3.mouse(this)[1];
		redrawline(cx, cy);
    		flash(cx, cy, this);
            })
	    .on("mouseout", function () {
		d3.selectAll('.line_over').style("display", "none");
		d3.selectAll(".ttip").remove();
		d3.selectAll(".flash_rect").remove();            
            })
	    .append('rect')
	    .attr('class', 'click-capture')
	    .style('visibility', 'hidden')
	    .attr('x', 0)
	    .attr('y', 0)
	    .attr("width", width)
	    .attr("height", height);

	svg.append("line")
	    .attr("class", 'line_over')
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height)
  	    .attr("stroke-dasharray", (5,5))
	    .attr("display", "none");

	drawAxes();  	
    }

    function drawAxes() {    
	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);

	svg.append("g")
	    .attr("class", function(d,i){return "y axis"})
	    .call(yAxis);
    }

    function clearData() {Data = [[]];}

    function initAxes() {
	x.domain([xLo, xHi]);
 	y.domain([yLo, yHi]);
	initSVG();
    }

    function calibrateY() {
	if (fixedAxes) return;
	yExtent = d3.extent(Data[0], yFunc);
 	y.domain(yExtent);
	d3.select(".y.axis").transition().ease("linear").duration(10).call(yAxis);
    }

    function showPath() {
	if (!compare) {
	     path = svg.select(".datapaths").selectAll("path");
	     path.remove();
	}
	path = svg.select(".datapaths").selectAll("path").data(Data, function(d, i){return (d.chartId)?d.chartId:i;})
	    .attr("class", "line")
	    .attr("stroke", function(d){return (!d.stroke)?"steelblue":(d.stroke instanceof Array)?d.stroke[d.seq]:d.stroke;})
	    .attr("d", line)
	    .enter().append("path")
	    .attr("class", "line")
	    .attr("stroke", function(d){return (!d.stroke)?"steelblue":(d.stroke instanceof Array)?d.stroke[d.seq]:d.stroke;})
	    .attr("d", line);
    }

    function redrawline(cx, cy) {
	if (cx < xLo) d3.selectAll('.line_over').style("display", "none");
	else d3.selectAll('.line_over')
            .attr("x1", cx)
            .attr("y1", 0)
            .attr("x2", cx)
            .attr("y2", height)
            .style("display", "block");
    }

    function flash(cx, cy, that) {
	var x0 = x.invert(cx);
	d3.selectAll(".ttip").remove();
	d3.selectAll(".flash_rect").remove();
	if (x0 < xLo || x0 > xHi) return;
	d3.select(that).selectAll(".ttip").data(Data)
	    .enter().append("text")
	    .attr("class", "ttip")
	    .attr("transform", function(d,i){return "translate("+i*sep+", "+(height+FlashOffset)+")"})
	    .style("fill", function(d){return (!d.stroke)?"steelblue":(d.stroke instanceof Array)?d.stroke[d.seq]:d.stroke;})
	    .style("fill", function(d){return (d.stroke)?d.stroke:"steelblue";})
	    .text(function(d){
		var y0 = datComp(x.invert(cx), d);
		if (typeof y0 == "number") return sprintf("%10.5f, %10.5f", x0, y0);
		return sprintf("%10.5f, ------", x0);
	    });
    }

    function datComp(x, dat) {
	var ans = null;
	for (var j in dat) {
	    if (xFunc(dat[j]) == x) return yFunc(dat[j]);
	    if (xFunc(dat[j]) > x && j > 0) {
		var x0 = xFunc(dat[j-1]);
		var y0 = yFunc(dat[j-1]);
		var x1 = xFunc(dat[j]);
		var y1 = yFunc(dat[j]);
		return y0 + (y1 - y0)*(x - x0)/(x1 - x0)
	    }
	}
	return null
    }

    function resize(w, h) {
	setup(w, h);
	initAxes();
	calibrateY()
	showPath();
    }

    function render(xyDat) {
	Data = (xyDat[0] instanceof Array) ? xyDat : [xyDat];
	calibrateY();
	showPath();
    }
    
    function resetCompare() {
	path = svg.select(".datapaths").selectAll("path");
	path.remove();
    }

    function reset() {
	setup(wd, ht)
	clearData();
	initAxes();
	calibrateY();
    }
    reset();
    return {render: render, reset: reset, resetCompare: resetCompare};
}
