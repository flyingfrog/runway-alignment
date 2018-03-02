function click_state(state) {
	adjust_state_list(state);
	stateFill ={}
	labelFill = {}
	for (i in states) {
		if (stateList.includes(i)) {
			stateFill[i] = {fill:'#009'};
			labelFill[i] = {fill:'#009'};
		}
		else {
			stateFill[i] = {fill:'#222'};
			labelFill[i] = {fill:'#222'};
		}
	}
	$("#map").usmap('stateSpecificStyles',stateFill);
	$("#map").usmap('stateSpecificLabelBackingStyles',labelFill);
}

function hover_state(state) {
	if(stateList.length != 0 || state == curr_state)
		return;

	curr_state = state;
	runwayValues = states[state];
	update_legend();	
}


function adjust_state_list (state) {
	if (state == 'NONE') {
		stateList = [];
		curr_state = '';
		runwayValues = [];
	}
	else {
		if (state == 'ALL') {
			stateList = Object.keys(states);
		} 
		else	
		{
			if ($.inArray(state,stateList) != -1) {
				stateList.splice(stateList.indexOf(state),1);
				if(stateList.length == 0) {
					hover_state(state);
					return;
				}
			}
			else {
				stateList.push(state);
			}
		}
		stateList.sort();
		runwayValues = stateList.reduce(function(acc, curr) {
				for(var i in states[curr]) {
					acc[i] += states[curr][i]};
				return acc;
		}, new Array(37).fill(0));
	}
	update_legend();
}

function update_legend() {
	if(stateList.length == 0 && curr_state == '') {
		$('#statelist').html("No states selected to view!");
	}
	else if (stateList.length == 0) {
		total_runways = Object.values(runwayValues).reduce(function(acc, curr) {return acc + curr}, 0);
		$('#statelist').html("Currently viewing " + total_runways + " runways in " + curr_state);
	}
	else {
		var all_runways = new Array(37).fill(0);
		total_runways = stateList.reduce(function(accum, currVal) {
				for (var i in states[currVal]) {
					accum[i] += states[currVal][i];
				}
				return accum;
			}, all_runways);
		total_runways = Object.values(all_runways).reduce(function(acc, curr) {return isNaN(curr) ? acc: acc + curr}, 0);
		$('#statelist').html("Currently viewing " + total_runways + " runways in: <br/>" + stateList.join(", "));
	}
	draw_chart();
}



function draw_chart() {
	var max_runways = d3.max(d3.entries(runwayValues), function(d) {return d['value']});
	if(max_runways == undefined) {max_runways = 0;}
	var chart_width = d3.select("#chart").attr("width");
	var dimension = d3.scale.linear().range([0,+chart_width/2]);
	dimension.domain([0,max_runways]);
	
	var g = d3.select("#arc_base");
	var ring_base = d3.select("#ring_base");
	

	var arc = g.selectAll("path").data(d3.entries(runwayValues))
	.attr("d",d3.svg.arc().innerRadius(0).outerRadius(function (d) {return dimension(d['value'])})
		.startAngle(function(d) {return (d['key']*10 - 5) * Math.PI / 180})
		.endAngle(function(d) {return ((parseInt(d['key'])+1)*10-5) * Math.PI / 180})
		.padAngle(1 * Math.PI/180))
		.attr("data",function(d) {return d['key'] + ':' + d['value']});
	var range_circles = ring_base.selectAll("circle").data([Math.trunc(max_runways/2), max_runways])
	.attr("r",function(d) {return dimension(d);});
	var range_labels = ring_base.selectAll("text").data([Math.trunc(max_runways/2), max_runways])
	.attr("x",function(d) {return -1 * Math.sin(3/4 * Math.PI)*dimension(d)})
	.attr("y",function(d) {return -1 * Math.sin(3/4 * Math.PI)*dimension(d)})
	.text(function(d) {return d;});

	
	arc.enter().append("path")
	.attr("d",d3.svg.arc().innerRadius(0).outerRadius(function (d) {return dimension(d['value'])})
		.startAngle(function(d) {return (d['key']*10 - 5) * Math.PI / 180})
		.endAngle(function(d) {return ((parseInt(d['key'])+1)*10-5) * Math.PI / 180})
		.padAngle(1 * Math.PI/180))
		.attr("data",function(d) {return d['key'] + ':' + d['value']});
	arc.exit().remove();
	arc.on("mouseover",function(d,i){d3.select("#chart").append("text")
		.text(function() {return "Runway " + d['key'] + ": " + d['value'];}).attr({id:"mouseover_box"})
		.attr({"alignment-baseline":"text-before-edge"})
		.attr({"fill":"black"})
		.attr({"font-weight":"bold"})});
	arc.on("mouseout", function(d,i){d3.select("#mouseover_box").remove()});

	range_circles.enter().append("circle")
	.attr("cx",0)
	.attr("cy",0)
	.attr("r",function(d) {return dimension(d);})
	.style("fill","none")
	.attr("stroke","black");
	range_circles.exit().remove();
	
	range_labels.enter().append("text")
	.attr("alignment-baseline","text-after-edge",)
	.attr("fill","black")
	.attr("font-weight","bold")
	.attr("text-anchor","end")
	.attr("x",function(d) {return -1 * Math.sin(3/4 * Math.PI)*dimension(d)})
	.attr("y",function(d) {return -1 * Math.sin(3/4 * Math.PI)*dimension(d)})
	.text(function(d) {return d;});
	
	range_circles.exit().remove();
}

runwayValues = [];
stateList = [];
curr_state = '';

$(document).ready(function() {
	$('#map').usmap({
		stateHoverStyles:{fill:'green'},
		mouseover:function(event,data){hover_state(data.name);},
		click:function(event,data){click_state(data.name);}
	});
  
	$("#selectors > div").click(function() {
		click_state(this.id);
	});
	$("#last_updated").html(updated_time);

	
	var svg = d3.select("#chart");
	var width = +svg.attr("width"), height = +svg.attr("height")
	svg.attr("fill","red");
	svg.append("g").attr("transform","translate(" + width / 2 + "," + height / 2 + ")")
		.attr("id","arc_base");
	svg.append("g").attr("transform","translate(" + width / 2 + "," + height / 2 + ")")
		.attr("id","ring_base");
	update_legend();
});


