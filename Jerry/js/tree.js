//Once the document is ready we set javascript and page settings
var screenWidth;
var screenHeight;

$(document).ready(function () {

    var rect;
    if (self==top) {
        rect = document.body.getBoundingClientRect();
    }
    else {
        rect = document.body.getBoundingClientRect();
    }

    //Set display size based on window size.
    screenWidth = (rect.width < 960) ? Math.round(rect.width*.95) : Math.round((rect.width - 210) *.95);

    screenHeight = 1000;

    d3.select("#currentDisplay")
            .attr("item_value", screenWidth + "," + screenHeight)
            .attr("class", "selected");


    // Set the size of our container element.
    viz_container = d3.selectAll("#viz_container")
            .style("width", screenWidth + "px")
            .style("height", screenHeight + "px");


    loadData();


});