// HELPERS
function parseData(d) {
  var keys = _.keys(d[0]);
  return _.map(d, function(d) {
    var o = {};
    _.each(keys, function(k) {
      if( k == 'Agency' )
        o[k] = d[k];
      else if( k == 'Category' )
        o[k] = d[k];
      else if( k == 'Detail' )
        o[k] = d[k];
      else if( k == 'Vendor' )
        o[k] = d[k];
      else
        o[k] = parseFloat(d[k]);
    });
    return o;
  });
}

function getBounds(d, paddingFactor) {
  // Find min and maxes (for the scales)
  paddingFactor = typeof paddingFactor !== 'undefined' ? paddingFactor : 1;

  var keys = _.keys(d[0]), b = {};
  _.each(keys, function(k) {
    b[k] = {};
    _.each(d, function(d) {
      if(isNaN(d[k]))
      {
        return;
      }
      if(b[k].min === undefined || d[k] < b[k].min)
        b[k].min = d[k];
      if(b[k].max === undefined || d[k] > b[k].max)
        b[k].max = d[k];
    });
    b[k].max > 0 ? b[k].max *= paddingFactor : b[k].max /= paddingFactor;
    b[k].min > 0 ? b[k].min /= paddingFactor : b[k].min *= paddingFactor;
  });
  return b;
}

function getCorrelation(xArray, yArray) {
  function sum(m, v) {return m + v;}
  function sumSquares(m, v) {return m + v * v;}
  function filterNaN(m, v, i) {isNaN(v) ?  m.push(i) : m.push(i); return m;}

  // clean the data (because we know that some values are missing)
  var xNaN = _.reduce(xArray, filterNaN , []);
  var yNaN = _.reduce(yArray, filterNaN , []);
  var include = _.intersection(xNaN, yNaN);
  var fX = _.map(include, function(d) {return xArray[d];});
  var fY = _.map(include, function(d) {return yArray[d];});

  var sumX = _.reduce(xArray, sum, 0);
  var sumY = _.reduce(yArray, sum, 0);
  var sumX2 = _.reduce(xArray, sumSquares, 0);
  var sumY2 = _.reduce(yArray, sumSquares, 0);
  var sumXY = _.reduce(xArray, function(m, v, i) {return m + v * yArray[i];}, 0);

  var n = xArray.length;
  var ntor = ( ( sumXY ) - ( sumX * sumY / n) );
  var dtorX = sumX2 - ( sumX * sumX / n);
  var dtorY = sumY2 - ( sumY * sumY / n);
 
  var r = ntor / (Math.sqrt( dtorX * dtorY )); // Pearson ( http://www.stat.wmich.edu/s216/book/node122.html )
  var m = ntor / dtorX; // y = mx + b
  var b = ( sumY - m * sumX ) / n;

  // console.log(r, m, b);
  return {r: r, m: m, b: b};
}




  var keys;
  var scatterdata;
  var bounds;
var chartsvg ;
    var sameVender;

var timeoutId;

  var xAxis = 'Agency', yAxis = 'Payments';
  var xAxisOptions = ["Agency", "Category"]
  // var yAxisOptions = ["Well-being"];
  var descriptions = {
    "Agency" : "Agency",
    "Category" : "Category"
  };

    var charttip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) {
    //  console.log(d);
       
    return  "<span style='color:GoldenRod'>Agency</span> : " + d.Agency + "<br>" + 
      "<span style='color:GoldenRod'>Category</span> : " + d.Category+
      "<br><span style='color:GoldenRod'>Detail</span> : "+ d.Detail+
      "<br><span style='color:GoldenRod'>Vendor</span> :"+ d.Vendor+
      "<br><span style='color:GoldenRod'>Times of sale</span> : "+sameVender.length+
      "<br><span style='color:GoldenRod'>Payments</span> : $"+d3.format(",")(d.Payments);
    });



  var xScale, yScale;
var legendSVG = d3.select("#colorLegend").append("svg").attr("id","colorLegendSVG").attr("width", 200).attr("height",400);

 var dropDownVendors;




d3.tsv('data/salesNew.tsv', function(da) {
  // console.log(data[0]);


  keys = _.keys(da[0]);
  scatterdata = parseData(da);
  bounds = getBounds(da, 1);

    // console.log(keys);
    // console.log(da);
    // console.log(data);
    // console.log(bounds);

  // SVG AND D3 STUFF
  chartsvg = d3.select("#chart")
    .append("svg")
    .attr("width", 850)
    .attr("height", 1000)
    // .call(d3.behavior.zoom().on("zoom", function () {
    // svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    // }))
    // .append("g")
  


  chartsvg.append('g')
    .classed('chart', true)
    .call(charttip)
    .attr('transform', 'translate(80, -60)');
  // console.log(xAxis);
  // Build menus

    d3.select('#x-axis-menu')
    // .text("Please select X axis:").classed('lab',true)
    .selectAll('li')
    .data(xAxisOptions)
    .enter()
    .append('li')
    .text(function(d) {return d;})
    .classed('selected', function(d) {
      return d === xAxis;
    })
    .on('click', function(d) {
      xAxis = d;
      // console.log(xAxis);

      updateChart(xAxis);
      updateMenus();
    });


  // Axis labels
  d3.select('svg g.chart')
    .append('text')
              .style("font-size", "15px")  
          .style("font-family", "sans-serif")
    .style('font-weight','bold')
    .style('fill','red')
    .attr({'id': 'xLabel', 'x': 300, 'y': 770, 'text-anchor': 'middle'})
    .attr('transform','translate(0, 0)')
    .text(descriptions[xAxis]);

  d3.select('svg g.chart')
    .append('text')
          .style("font-size", "15px")  
          .style("font-family", "sans-serif")
          .style('fill','black')
    .style('font-weight','bold')
    .attr('transform', 'translate(-65, 330)rotate(-90)')
    .attr({'id': 'yLabel', 'text-anchor': 'middle'})
    .text('Payments');



  
  dropDownVendors = d3.select("#drop1").append("select")
                    .attr("name", "selectVendors")
                    .attr("style","width: 175px;")
                    .attr("id", "selectVendors");
  var dropDownDetails = d3.select("#drop2").append("select")
                    .attr("name", "selectDetails")
                    .attr("style","width: 175px;")
                    .attr("id", "selectDetails");

  var optionsVendors = dropDownVendors.selectAll("option")
           .data(["All"].concat(ven))
           .enter()
           .append("option");

  var optionsDetails = dropDownDetails.selectAll("option")
           .data(["All"].concat(det))
           .enter()
           .append("option");

  optionsVendors.text(function (d) { return d; })
       .attr("value", function (d) { return d; });
  optionsDetails.text(function (d) { return d; })
       .attr("value", function (d) { return d; });
  var mini = 0;
  var array = [];
  var x = 0;
  $('#slider1')
    .slider({
      range: true,
        max: 401,
        min: 10,
        values: [10,401],
        slide: function( event, ui ) {
          document.getElementById("selectDetails").options[0].selected = "selected";
          document.getElementById("selectVendors").options[0].selected = "selected";
          // console.log(ui.values);
          for (var i = 0; i < ui.values.length; ++i) {
              $("input.sliderValue[data-index=" + i + "]").val(ui.values[i]);
          }
          // array = [];
          // x = 0;
          var vt = $('#slider2').slider("values");
        
            d3.selectAll(".circles")
            .filter(function(d) {return (vt[0] > d.TotalP || vt[1] <d.TotalP ||ui.values[0] > d.Counts || ui.values[1] <d.Counts );})
            .attr("display", "none");
            
            d3.selectAll(".circles")
            .filter(function(d) {return (vt[0] <= d.TotalP && vt[1] >= d.TotalP &&ui.values[0] <= d.Counts && ui.values[1] >= d.Counts );})
            .attr("display", "display");

      }
    })
    .slider('pips',{
      first: 'label',
      last: 'label',
      rest: false,
      
    })

  $('#slider2')
  .slider({
    range: true,
      max: 137991177.24,
      min: 699.79,
      values: [699.79,137991177.24],
      slide: function( event, ui ) {
        document.getElementById("selectDetails").options[0].selected = "selected";
        document.getElementById("selectVendors").options[0].selected = "selected";
        for (var i = 0; i < ui.values.length; ++i) {
            // console.log(ui.values);
            $("input.sliderValue[data-index=" + (i+2) + "]").val(ui.values[i]);
        }

        var vc = $('#slider1').slider("values");
        d3.selectAll(".circles")
        .filter(function(d) {return (ui.values[0] > d.TotalP || ui.values[1] <d.TotalP || vc[0] > d.Counts || vc[1] <d.Counts);})
        .attr("display", "none");
        
        d3.selectAll(".circles")
        .filter(function(d) {return (ui.values[0] <= d.TotalP && ui.values[1] >= d.TotalP && vc[0] <= d.Counts && vc[1] >= d.Counts);})
        .attr("display", "display");
    }
  })
  .slider('pips',{
    first: 'label',
    last: 'label',
    rest: false,
    
  })


  $("input.sliderValue").change(function() {

      document.getElementById("selectDetails").options[0].selected = "selected";
      document.getElementById("selectVendors").options[0].selected = "selected";
      var $this = $(this);
      console.log($this.data("index"));
      if($this.data("index")<2)
      {
        $("#slider1").slider("values", $this.data("index"), $this.val());
        var vc = $('#slider1').slider("values");
        var vt = $('#slider2').slider("values");
        d3.selectAll(".circles")
        .filter(function(d) {return (vt[0] > d.TotalP || vt[1] <d.TotalP ||vc[0] > d.Counts || vc[1] <d.Counts );})
        .attr("display", "none");
        
        d3.selectAll(".circles")
        .filter(function(d) {return (vt[0] <= d.TotalP && vt[1] >= d.TotalP && vc[0] <= d.Counts && vc[1] >= d.Counts );})
        .attr("display", "display");
      }
      if($this.data("index")>1)
      {
        $("#slider2").slider("values", $this.data("index")-2, $this.val());
        var vt = $('#slider2').slider("values");
        var vc = $('#slider1').slider("values");
        d3.selectAll(".circles")
        .filter(function(d) {return (vt[0] > d.TotalP || vt[1] <d.TotalP || vc[0] > d.Counts || vc[1] <d.Counts);})
        .attr("display", "none");
        
        d3.selectAll(".circles")
        .filter(function(d) {return (vt[0] <= d.TotalP && vt[1] >= d.TotalP && vc[0] <= d.Counts && vc[1] >= d.Counts);})
        .attr("display", "display");
        }

      
  });


  updateScales('Agency');
 

  //var pointColour = d3.scale.category20b();
  // console.log(data[0].Vendor);
  d3.select('svg g.chart')
    .selectAll('circle')
    .data(scatterdata)
    .enter()
    .append('circle')
    .attr("class", function(d,i){return "circles "+scatterdata[i].Agency.replace(/ /g,'_')+
                                         " "+scatterdata[i].Category.replace(/ /g,'_')+
                                         " "+scatterdata[i].Detail.replace(/ /g,'_')+
                                         " "+scatterdata[i].Vendor.replace(/ /g,'_')
                                         })
    .attr("count",function(d,i){return scatterdata[i].Counts})
    .attr("totalP", function(d,i){return scatterdata[i].TotalP})
    .style("opacity", 0.8)
    .attr("id", function(d,i){return scatterdata[i].Vendor.replace(/ /g,'_') })
    .attr('cx', function(d) {
      return isNaN(d[xAxis]) ? xScale(d[xAxis]) : xScale(d[xAxis]);
    
    })
    .attr('cy', function(d) {
      return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
    
    })
    .attr('fill', function(d) { 
      if(xAxis=='Agency'){
        return CateColor(d.Category)}; 
      if (xAxis=='Category'){
        return  AgenColor(d.Agency);}})
    // .attr('stroke', function(d) { 
    // if(xAxis=='Agency'){
    //   return CateColor(d.Category)}; 
    // if (xAxis=='Category'){
    //   return  AgenColor(d.Agency);}})
    // .attr('stroke-width',2)
    .style('cursor', 'pointer')
    .on('click', function (d){
      // console.log(d);
      data.children.forEach(toggleAll);
      var i=0;
      for (; i < data.values.length; i++) {
          if(data.values[i].key == d.Agency)
          {
              viz.toggleNode(data.values[i]);
              break;
          }
      }

      var j = 0;
      for (; j < data.values[i].values.length; j++) {
          if(data.values[i].values[j].key == d.Category)
          {
              viz.toggleNode(data.values[i].values[j]);
              break;
          }
      }

      var k = 0;
      for (; k < data.values[i].values[j].values.length; k++) {
          if(data.values[i].values[j].values[k].key == d.Detail)
          {
              viz.toggleNode(data.values[i].values[j].values[k]);
              break;
          }
      }

      var l = 0;
      for (; l < data.values[i].values[j].values[k].values.length; l++) {
          if(data.values[i].values[j].values[k].values[l].key == d.Vendor)
          {
              viz.toggleNode(data.values[i].values[j].values[k].values[l]);
              break;
          }
      }
      // setTimeout(, 500);
      // console.log(data.values[i].values[j].values[k].values[l])
      // console.log('.vz-weighted_tree-node vz-id-'+data.values[i].values[j].values[k].values[l].id)
      // nodeclass='.vz-weighted_tree-node vz-id-'+data.values[i].values[j].values[k].values[l].id
      // console.log(document.getElementsByClassName('vz-weighted_tree-node vz-id-'+data.values[i].values[j].values[k].values[l].id)[0]);
      
      clearTimeout(timeoutId);
      setTimeout(waitover,
                 1200,
                 'vz-weighted_tree-node vz-id-'+data.values[i].values[j].values[k].values[l].id,
                 data.values[i].values[j].values[k].values[l]);
      timeoutId=setTimeout(waitout,
                 10000,
                 data.values[i].values[j].values[k].values[l]);


    })
    .on('mouseover', scattermouseover)
    .on('mouseout', scattermouseout);

  updateChart(xAxis);
  updateMenus();
  

  // $(".circles").tipsy({ gravity: 's', });

  // Render axes
  d3.select('svg g.chart')
    .append("g")
    .attr('transform', 'translate(-14, 780)')
    .attr('id', 'xAxis')
    .call(makeXAxis)
    .selectAll("text")  
              .style("font-size", "12px")  
          .style("font-family", "sans-serif")
          .style("font-weight","normal")
          .style('fill','black')
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)" 
                });

  d3.select('svg g.chart')
    .append("g")
    .attr('id', 'yAxis')
    .attr('transform', 'translate(-28, 0)')
    .call(makeYAxis)
        .selectAll("text")  
              .style("font-size", "12px")  
          .style("font-family", "sans-serif")
          .style("font-weight","normal")
          .style('fill','black');

    dropDownVendors.on("change", dropVendersOn)




    dropDownDetails.on("change", function() {
      document.getElementById("selectVendors").options[0].selected = "selected";
      $("#slider1").slider('values',0,10);
      $("#slider1").slider('values',1,401);
      $("#slider2").slider('values',0,699.79);
      $("#slider2").slider('values',1,137991177.24);
      var selected = this.value;
      console.log(selected);
      displayOthers = this.checked ? "inline" : "none";
      console.log(displayOthers);
      display = this.checked ? "none" : "inline";
      console.log(display);
      if(selected == 'All'){
        chartsvg.selectAll(".circles")
            .attr("display", display);
      }
      else{
        chartsvg.selectAll(".circles")
            .filter(function(d) {return selected != d.Detail;})
            .attr("display", displayOthers);
            
        chartsvg.selectAll(".circles")
            .filter(function(d) {return selected == d.Detail;})
            .attr("display", display);
      }
    });

})

      function dropVendersOn() {
      document.getElementById("selectDetails").options[0].selected = "selected";
      $("#slider1").slider('values',0,10);
      $("#slider1").slider('values',1,401);
      $("#slider2").slider('values',0,699.79);
     
      var selected = document.getElementById('selectVendors').value;
      
      displayOthers = document.getElementById('selectVendors').checked ? "inline" : "none";
      
      display = document.getElementById('selectVendors').checked ? "none" : "inline";
     
      if(selected == 'All'){
        chartsvg.selectAll(".circles")
            .attr("display", display);
      }
      else{
        chartsvg.selectAll(".circles")
            .filter(function(d) {return selected != d.Vendor;})
            .attr("display", displayOthers);
            
        chartsvg.selectAll(".circles")
            .filter(function(d) {return selected == d.Vendor;})
            .attr("display", display);
      }
    };

// console.log(scatterdata);

function waitover(a,b){
  onMouseOver(document.getElementsByClassName(a)[0],
              b);
}

function waitout(a){
  onMouseOut(a);
}

function scattermouseover(d,i){
      var circle = d3.select(this);

      // console.log(d)
      // console.log(i)

      // console.log(c,d,i)
      // console.log(c,d,i)
      // transition to increase size/opacity of bubble
      // circle.transition()
      // .duration(800).style("opacity", 0.8)
      // .attr("r", 15).ease("elastic");

      var venName = circle.attr("id");
      // console.log("#"+venName);
      // console.log(this);
      sameVender = document.getElementsByClassName(venName);
      // console.log(sameVender); 
      d3.selectAll(sameVender).transition()
      // .duration(800)
      .style("opacity", 0.8)
      .attr("r", 10)
      // .attr('stroke-width',15);   


       charttip.show(d); 
      //.attr("display", display)
    //  .duration(800).style("opacity", 1)
      //.attr("r", 10);//.ease("elastic");

      // append lines to bubbles that will be used to show the precise data points.
      // translate their location based on margins
      //console.log(circle.attr("cx"));
      chartsvg.append("g")
        .attr("class", "guide")
      .append("line")
        .attr("x1", circle.attr("cx"))
        .attr("x2", circle.attr("cx"))
        .attr("y1", +circle.attr("cy") + 20)
        .attr("y2", 821-20)
        .attr("transform", "translate(80,-80)")
        .style("stroke", circle.style("fill"))
        // .transition().delay(200).duration(400).styleTween("opacity", 
        //       function() { return d3.interpolate(0, .5); })

      chartsvg.append("g")
        .attr("class", "guide")
      .append("line")
        .attr("x1", +circle.attr("cx") - 14)
        .attr("x2", -44)
        .attr("y1", circle.attr("cy"))
        .attr("y2", circle.attr("cy"))
        .attr("transform", "translate(95,-61)")
        .style("stroke", circle.style("fill"))
        // .transition().delay(200).duration(400).styleTween("opacity", 
        //       function() { return d3.interpolate(0, .5); });

      // function to move mouseover item to front of SVG stage, in case
      // another bubble overlaps it
       d3.selection.prototype.moveToFront = function() { 
        return this.each(function() { 
        this.parentNode.appendChild(this); 
        }); 
      };
      d3.select(this).moveToFront();

}

function scattermouseout(d){
      d3.select('svg g.chart #countryLabel')
        .transition()
        .duration(1500)
        .style('opacity', 0);
      var circle = d3.select(this);


      // go back to original size and opacity
      // circle.transition()
      // .duration(800).style("opacity", .5)
      // .attr("r", 8).ease("elastic");

      var venName = circle.attr("id");
      // console.log("#"+venName);
      // console.log(this);
      var sameVender = document.getElementsByClassName(venName);
      // console.log(sameVender); 
      d3.selectAll(sameVender).transition()
      // .duration(800)
      .style("opacity", .5)
      .attr("r", 5)
      // .attr('stroke-width',2);

      // fade out guide lines, then remove them
      d3.selectAll(".guide").transition().duration(100).styleTween("opacity", 
              function() { return d3.interpolate(.5, 0); })
        .remove()

      charttip.hide(d);


}


  //// RENDERING FUNCTIONS
function updateChart(init) {
  // console.log(init)
  updateScales(init);

  d3.select('svg g.chart')
    .selectAll('circle')
    .transition()
    .duration(500)
    .ease('quad-out')
    .attr('fill', function(d) { 
    if(xAxis=='Agency'){
      return CateColor(d.Category)}; 
    if (xAxis=='Category'){
      return  AgenColor(d.Agency);}})
    // .attr('stroke', function(d) { 
    // if(xAxis=='Agency'){
    //   return CateColor(d.Category)}; 
    // if (xAxis=='Category'){
    //   return  AgenColor(d.Agency);}})
    // .attr('stroke-width',2)
    .attr('cx', function(d) {
      return isNaN(d[xAxis]) ? xScale(d[xAxis]) : xScale(d[xAxis]);
    })
    .attr('cy', function(d) {
      return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
    })
    .attr('r', function(d) {
      // return isNaN(d[xAxis]) || isNaN(d[yAxis]) ? 0 : 12;
      return 5;
    });

  // Also update the axes

  //??????????
  d3.select('#xAxis')
   // .transition()
    .call(makeXAxis)
    .selectAll("text")  
          .style("text-anchor", "end")
          .style("font-size", "12px")  
          .style("font-family", "sans-serif")
          .style("font-weight","normal")
          .style('fill','black')
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
    //           .select(this.parentNode)
          .attr("transform", 
            function(d) {
              //console.log(d);
              return "rotate(-65)" 
              });


  d3.select('#yAxis')
    .transition()
    .call(makeYAxis)
        .selectAll("text")  
              .style("font-size", "12px")  
          .style("font-family", "sans-serif")
          .style("font-weight","normal")
          .style('fill','black');

  // Update axis labels
  d3.select('#xLabel')
    .text(descriptions[xAxis]);
  // console.log("in updateChart");
  // Update correlation
  // console.log(scatterdata)
  var xArray = _.map(scatterdata, function(d) {return xScale(d[xAxis]);});
  var yArray = _.map(scatterdata, function(d) {return d[yAxis];});
  // console.log(xArray,yArray);
  var c = getCorrelation(xArray, yArray);
  // console.log(c);
  var x1 = xScale(xScale.domain()[0]), y1 = c.m * x1 + c.b;
  var x2 = xScale(xScale.domain()[1]), y2 = c.m * x2 + c.b;


  d3.select("#colorLegendSVG").remove();
  // console.log("in updateChart");
  var legendSVG = d3.select("#colorLegend").append("svg").attr("id","colorLegendSVG").attr("width", 250).attr("height",400);
    legendSVG.selectAll("rect")
    .data( function(){ if(xAxis=='Agency'){return cate}; if (xAxis=='Category'){ return  agen;}})
  .enter().append("rect")
  .attr({
    x: 0,
    y: function(d, i) { return (0 + i*16); },
    width: 12,
    height: 12
  })
  .style("fill", function(d) { 
    if(xAxis=='Agency'){
      return CateColor(d)}; 
    if (xAxis=='Category'){
      return  AgenColor(d);}});
  // legend labels  
  legendSVG.selectAll("text")
    .data(function(d){ 
      if(xAxis=='Agency'){ return cate; }
      if (xAxis=='Category'){ return  agen;}})
  .enter().append("text")
  .attr({
  x: 0+16,
  y: function(d, i) { return (10 + i*16); },
  })
  .style("font-size","9px")
  .style("fill", 'black')
        .style("font-family", "sans-serif")
        .style("font-weight","normal")

  .text(function(d) { return d; });

  updateMenus()
}


  function makeXAxis(s) {
    s.call(d3.svg.axis()
      .scale(xScale)
      .orient("bottom"));
  }

  function makeYAxis(s) {
    s.call(d3.svg.axis()
      .scale(yScale)
      .orient("left"));
  }

  function updateMenus() {
    d3.select('#x-axis-menu')
      .selectAll('li')
      .classed('selected', function(d) {
        return d === xAxis;
      });
    d3.select('#y-axis-menu')
      .selectAll('li')
      .classed('selected', function(d) {
        return d === yAxis;
    });
  }

    function updateScales(ss) {
    // xScale = d3.scale.linear()
    //                 .domain([bounds[xAxis].min, bounds[xAxis].max])
    //                 .range([20, 780]);
    xScale = d3.scale.ordinal()
                    .rangeRoundBands([0, 750], 0.1)
          if(ss==='Agency'){
              
                    xScale.domain(agen.map(function(d) {return d; })); 
      }else if(ss==='Category'){

                    xScale.domain(cate.map(function(d) {return d; })); 
      }else if(ss==='Detail'){

                    xScale.domain(det.map(function(d) {return d; })); 
      }
    // xScale = d3.scale.ordinal()
    //                 .rangeRoundBands([0, 700], 0.1)
    //                 .domain(agen.map(function(d) {return d; }));             
    // console.log("updateScales:"+ss);
    yScale = d3.scale.log()
                    .domain([0.01, 134707718.54])
                    .range([750, 100]);    
  }
console.log(document.getElementById('charttitle'))
    var scatterdescript = d3.select('#charttitle').append("text")
        .attr("x", 0)             
        .attr("y", 0)
        .attr("text-anchor", "start")  
        .style("font-size", "00px")  
        .style("font-family", "sans-serif")
        .style("font-weight","normal")
        .style('fill','black') 
        .append("tspan")
        .attr('fill','black')
        .attr('x',0)
        .attr('y','1em')
        .text("All Sales ploted by default. Mouseover circle, will show all sales for the same vendor in big circles. Click on circle,")
        .style("font-size", "20px")  
        .style("font-family", "sans-serif")
        .style("font-weight","normal");


    scatterdescript.append("tspan")
        .attr('fill','black')
        .attr('x',0)
        .attr('y','2.2em')
        .text("will open data hierarchy for this sale on the left.")
        .style("font-size", "20px")  
        .style("font-family", "sans-serif")
        .style("font-weight","normal")

      d3.select('#menusvg').append("text")
        .attr("x", 0)             
        .attr("y", 13)
        .attr("text-anchor", "start")  
        .style("font-size", "15px")  
        .style("font-family", "sans-serif")
        .style("font-weight","bold")
        .style('fill','black') 
        .text("Please select X axis:");

      d3.select('#drop1svg').append("text")
        .attr("x", 0)             
        .attr("y", 13)
        .attr("text-anchor", "start")  
        .style("font-size", "15px")  
        .style("font-family", "sans-serif")
        .style("font-weight","bold")
        .style('fill','black') 
        .text("Select Vendor:");

      d3.select('#drop2svg').append("text")
        .attr("x", 0)             
        .attr("y", 13)
        .attr("text-anchor", "start")  
        .style("font-size", "15px")  
        .style("font-family", "sans-serif")
        .style("font-weight","bold")
        .style('fill','black') 
        .text("Select Detail:");

        d3.select('#sli1svg').append("text")
        .attr("x", 0)             
        .attr("y", 13)
        .attr("text-anchor", "start")  
        .style("font-size", "15px")  
        .style("font-family", "sans-serif")
        .style("font-weight","bold")
        .style('fill','black') 
        .text("Service times of Vendor:");
        d3.select('#sli2svg').append("text")
        .attr("x", 0)             
        .attr("y", 13)
        .attr("text-anchor", "start")  
        .style("font-size", "15px")  
        .style("font-family", "sans-serif")
        .style("font-weight","bold")
        .style('fill','black') 
        .text("Total payments for Vendor($):");