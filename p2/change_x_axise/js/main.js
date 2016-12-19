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

d3.tsv('salesNew.tsv', function(data) {
  // console.log(data[0]);

  var xAxis = 'Category', yAxis = 'Payments';
  var xAxisOptions = ["Agency", "Category"]
  // var yAxisOptions = ["Well-being"];
  var descriptions = {
    "Agency" : "Agency",
    "Category" : "Category"
  };
var sameVender;
    var tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) {
      return "Agency : " + d.Agency + "<br>" + "Category : " + d.Category+"<br>Detail : "+d.Detail+"<br>Vendor :"+
             d.Vendor+"<br>Times of sale : "+sameVender.length+"<br>Payments : <span style='color:red'>$"+d3.format(",")(d.Payments)+"</span>";
    });

  var keys = _.keys(data[0]);
  var data = parseData(data);
  var bounds = getBounds(data, 1);

  // SVG AND D3 STUFF
  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", 1000)
    .attr("height", 1000)
    // .call(d3.behavior.zoom().on("zoom", function () {
    // svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    // }))
    // .append("g")
  
  var xScale, yScale;

  svg.append('g')
    .classed('chart', true)
    .call(tip)
    .attr('transform', 'translate(80, -60)');
  // console.log(xAxis);
  // Build menus
  d3.select('#x-axis-menu')
    .text("Please select X axis:").classed('lab',true)
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


  
  // the legend color guide
  var legendSVG = d3.select("#colorLegend").append("svg").attr("id","colorLegendSVG").attr("width", 570).attr("height",1000);
  // legendSVG.selectAll("rect")
  //   .data( function(){ if(xAxis=='Agency'){console.log("rect return cate"); return cate}; if (xAxis=='Category'){console.log("rect return agen"); return  agen;}})
  //   .enter().append("rect")
  //   .attr({
  //     x: 30,
  //     y: function(d, i) { return (400 + i*15); },
  //     width: 16,
  //     height: 12
  //   })
  //   .style("fill", function(d) { 
  //     if(xAxis=='Agency'){
  //       console.log("color return cate"); return CateColor(d)}; 
  //     if (xAxis=='Category'){
  //       console.log("color return agen"); return  AgenColor(d);}});
  // // legend labels  
  // legendSVG.selectAll("text")
    // .data(function(d){ 
    //   if(xAxis=='Agency'){console.log("text return cate"); return cate; }
    //   if (xAxis=='Category'){console.log("text return agen"); return  agen;}})
    // .enter().append("text")
    // .attr({
    // x: 30+16 + 4,
    // y: function(d, i) { return (410 + i*15); },
    // })
    // .text(function(d) { return d; });



  // console.log(xAxis);
  // d3.select('#y-axis-menu')
  //   .selectAll('li')
  //   .data(yAxisOptions)
  //   .enter()
  //   .append('li')
  //   .text(function(d) {return d;})
  //   .classed('selected', function(d) {
  //     return d === yAxis;
  //   })
  //   .on('click', function(d) {
  //     yAxis = d;
  //     updateChart();
  //     updateMenus();
  //   });

  // Country name
  d3.select('svg g.chart')
    .append('text')
    .attr({'id': 'countryLabel', 'x': 0, 'y': 170})
    .style({'font-size': '30px', 'font-weight': 'bold', 'fill': '#ddd'});

  // Best fit line (to appear behind points)
  d3.select('svg g.chart')
    .append('line')
    .attr('id', 'bestfit');

  // Axis labels
  d3.select('svg g.chart')
    .append('text')
    .attr({'id': 'xLabel', 'x': 400, 'y': 670, 'text-anchor': 'middle'})
    .text(descriptions[xAxis]);

  d3.select('svg g.chart')
    .append('text')
    .attr('transform', 'translate(-60, 330)rotate(-90)')
    .attr({'id': 'yLabel', 'text-anchor': 'middle'})
    .text('Payments');

  // Render points
  // var sF = fData.map(function(d){return [d.State,d.total];});


  
  var dropDownVendors = d3.select("#drop1").append("select")
                    .attr("name", "selectVendors")
                    .attr("id", "selectVendors");
  var dropDownDetails = d3.select("#drop2").append("select")
                    .attr("name", "selectDetails")
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

          //   .filter(function (d) {
              
          //     if(d.cou < ui.values[0])
          //     {
          //       array[x] = d.ven;
          //       x++;
          //     }
          //     return (d.cou < ui.values[0]);
          //   });
            

          //   .filter( funtion (d) {return (d.cou < ui.values[0]);});
          //   // {
          //   //   // console.log(count[i].ven.replace(/ /g,'_'))
              // var hideVen = d3.selectAll(document.getElementsByClassName(count[i].ven.replace(/ /g,'_')))
          //   //   // console.log(hideVen);
          //   //   hideVen.attr("display", "none");
          //   // }
          // }


      }
    })
    .slider('pips',{
      first: 'label',
      last: 'label',
      rest: false,
      
    })
    // .slider('float',{
    //   pips: true
    // });  

  //   $("input.sliderValue").change(function() {
  //     var $this = $(this);
  //     // console.log($this.data("index"));
  //     $("#slider2").slider("values", $this.data("index")-2, $this.val());
  //     // console.log($('#slider2').slider("values"))
  //     // var values = $('#slider2').slider("values");
  //     // d3.selectAll(".circles")
  //     // .filter(function(d) {return (values[0] > d.TotalP || values[1] <d.TotalP );})
  //     // .attr("display", "none");
      
  //     // d3.selectAll(".circles")
  //     // .filter(function(d) {return (values[0] <= d.TotalP && values[1] >= d.TotalP );})
  //     // .attr("display", "display");
  // });

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
  // .slider('float',{
  //   pips: true
  // });  

    // console.log($( "#output1" ).value);
  // $( "#output1" ).val(   $( "#slider-range" ).slider( "values", 0 ) +
  //     " - " + $( "#slider-range" ).slider( "values", 1 )  );

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
    .data(data)
    .enter()
    .append('circle')
    .attr("class", function(d,i){return "circles "+data[i].Agency.replace(/ /g,'_')+
                                         " "+data[i].Category.replace(/ /g,'_')+
                                         " "+data[i].Detail.replace(/ /g,'_')+
                                         " "+data[i].Vendor.replace(/ /g,'_')
                                         })
    .attr("count",function(d,i){return data[i].Counts})
    .attr("totalP", function(d,i){return data[i].TotalP})
    .attr("id", function(d,i){return data[i].Vendor.replace(/ /g,'_') })
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
    .style('cursor', 'pointer')
    .on('mouseover', function(d) {
      // display countryLabel
      // d3.select('svg g.chart #countryLabel')
      //   .text( //d.Agency)
      //     function(c){// console.log(xAxis);
      //       // console.log(d.Agency);
      //       // return "mm";})
      //       if(xAxis == 'Agency') return d.Agency;
      //                          else if(xAxis == 'Category') return d.Category;
      //                           return d.Detail;})
      //   .transition()
      //   .style('opacity', 1);

 
       

        var circle = d3.select(this);

      // transition to increase size/opacity of bubble
      circle.transition()
      .duration(800).style("opacity", 0.8)
      .attr("r", 16).ease("elastic");

      var venName = circle.attr("id");
      // console.log("#"+venName);
      // console.log(this);
      sameVender = document.getElementsByClassName(venName);
      // console.log(sameVender); 
      d3.selectAll(sameVender).transition()
      .duration(800).style("opacity", 0.8)
      .attr("r", 16).ease("elastic");   


       tip.show(d); 
      //.attr("display", display)
    //  .duration(800).style("opacity", 1)
      //.attr("r", 10);//.ease("elastic");
      // append lines to bubbles that will be used to show the precise data points.
      // translate their location based on margins
      //console.log(circle.attr("cx"));
      svg.append("g")
        .attr("class", "guide")
      .append("line")
        .attr("x1", circle.attr("cx"))
        .attr("x2", circle.attr("cx"))
        .attr("y1", +circle.attr("cy") + 20)
        .attr("y2", 670-20)
        .attr("transform", "translate(80,-80)")
        .style("stroke", circle.style("fill"))
        // .transition().delay(200).duration(400).styleTween("opacity", 
        //       function() { return d3.interpolate(0, .5); })

      svg.append("g")
        .attr("class", "guide")
      .append("line")
        .attr("x1", +circle.attr("cx") - 14)
        .attr("x2", -25)
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
      //d3.select(this).moveToFront();
      // skip this functionality for IE9, which doesn't like it
      // if (!$.browser.msie) {
      //   circle.moveToFront(); 
      //   }

      
    })
    .on('mouseout', function(d) {
      d3.select('svg g.chart #countryLabel')
        .transition()
        .duration(1500)
        .style('opacity', 0);
      var circle = d3.select(this);


      // go back to original size and opacity
      circle.transition()
      .duration(800).style("opacity", .5)
      .attr("r", 5).ease("elastic");

      var venName = circle.attr("id");
      // console.log("#"+venName);
      // console.log(this);
      var sameVender = document.getElementsByClassName(venName);
      // console.log(sameVender); 
      d3.selectAll(sameVender).transition()
      .duration(800).style("opacity", .5)
      .attr("r", 5).ease("elastic");

      // fade out guide lines, then remove them
      d3.selectAll(".guide").transition().duration(100).styleTween("opacity", 
              function() { return d3.interpolate(.5, 0); })
        .remove()

      tip.hide(d);

    })
    .append("title")
      .text(function(d) { return d.Agency; });

  updateChart(xAxis);
  updateMenus();
  

  // $(".circles").tipsy({ gravity: 's', });

  // Render axes
  d3.select('svg g.chart')
    .append("g")
    .attr('transform', 'translate(-20, 630)')
    .attr('id', 'xAxis')
    .call(makeXAxis)
    .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)" 
                });

  d3.select('svg g.chart')
    .append("g")
    .attr('id', 'yAxis')
    .attr('transform', 'translate(-10, 0)')
    .call(makeYAxis);



  //// RENDERING FUNCTIONS
  function updateChart(init) {
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
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
      //           .select(this.parentNode)
            .attr("transform", 
              function(d) {
                //console.log(d);
                return "rotate(-65)" 
                });
    //   d3.select('svg g.chart')
    // .append("g")
    // .attr('transform', 'translate(0, 630)')
    // .attr('id', 'xAxis')
    // .call(makeXAxis)
    // .selectAll("text")  
    //         .style("text-anchor", "end")
    //         .attr("dx", "-.8em")
    //         .attr("dy", ".15em")
    //         .attr("transform", function(d) {
    //             return "rotate(-65)" 
    //             });


    d3.select('#yAxis')
      .transition()
      .call(makeYAxis);

    // Update axis labels
    d3.select('#xLabel')
      .text(descriptions[xAxis]);

    // Update correlation
    var xArray = _.map(data, function(d) {return xScale(d[xAxis]);});
    var yArray = _.map(data, function(d) {return d[yAxis];});
    // console.log(xArray,yArray);
    var c = getCorrelation(xArray, yArray);
    // console.log(c);
    var x1 = xScale(xScale.domain()[0]), y1 = c.m * x1 + c.b;
    var x2 = xScale(xScale.domain()[1]), y2 = c.m * x2 + c.b;

    // Fade in
    // d3.select('#bestfit')
    //   .style('opacity', 0)
    //   .attr({'x1': x1, 'y1': yScale(y1), 'x2': x2, 'y2': yScale(y2)})
    //   .transition()
    //   .duration(1500)
    //   .style('opacity', 1);

    d3.select("#colorLegendSVG").remove();
    var legendSVG = d3.select("#colorLegend").append("svg").attr("id","colorLegendSVG").attr("width", 570).attr("height",1000);
      legendSVG.selectAll("rect")
      .data( function(){ if(xAxis=='Agency'){return cate}; if (xAxis=='Category'){ return  agen;}})
    .enter().append("rect")
    .attr({
      x: 0,
      y: function(d, i) { return (0 + i*15); },
      width: 16,
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
    x: 0+16 + 4,
    y: function(d, i) { return (10 + i*15); },
    })
    .text(function(d) { return d; });
  }

  function updateScales(ss) {
    // xScale = d3.scale.linear()
    //                 .domain([bounds[xAxis].min, bounds[xAxis].max])
    //                 .range([20, 780]);
    xScale = d3.scale.ordinal()
            .rangeRoundBands([0, 800], 0.1)
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

    yScale = d3.scale.log()
                    .domain([bounds[yAxis].min, bounds[yAxis].max])
                    .range([600, 100]);    
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

  dropDownVendors.on("change", function() {
    document.getElementById("selectDetails").options[0].selected = "selected";
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
      svg.selectAll(".circles")
          .attr("display", display);
    }
    else{
      svg.selectAll(".circles")
          .filter(function(d) {return selected != d.Vendor;})
          .attr("display", displayOthers);
          
      svg.selectAll(".circles")
          .filter(function(d) {return selected == d.Vendor;})
          .attr("display", display);
    }
  });

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
      svg.selectAll(".circles")
          .attr("display", display);
    }
    else{
      svg.selectAll(".circles")
          .filter(function(d) {return selected != d.Detail;})
          .attr("display", displayOthers);
          
      svg.selectAll(".circles")
          .filter(function(d) {return selected == d.Detail;})
          .attr("display", display);
    }
  });

})


