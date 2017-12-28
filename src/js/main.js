var objStockPrice = {};
// Template String for new Stock Entry
var newStockTemplate = `
<div class="row stock-row" data-id="||name||">
<div class="col-sm-1 stock-name" data-name="||name||">
    ||name||
</div>
<div class="col-sm-1 stock-price" data-price="||price||">
    ||price||
</div>
<div class="col-sm-1 stock-change">
    ||change||
</div>
<div class="col-sm-1 stock-min" data-min="||price||">
    ||price||
</div>
<div class="col-sm-1 stock-max" data-max="||price||">
    ||price||
</div>
<div class="col-sm-4 stock-chart">
    <div data-chart=||chart|| class="inline-chart"></div>
</div>
<div class="col-sm-3 stock-update" data-update="||update||">
    ||updated||
</div>
</div>
`;
var isChartReady = false;

/*
* Function : init Function
* Create hook up events for WebSocket
*/
$(document).ready(function(){
    var ws = new WebSocket("ws://stocks.mnet.website");

    ws.onopen = function()
    {
       ws.send("Hello Media.net!");
       $('.glyphicon-flash').addClass('online').removeClass('offline');
    };
     
    ws.onmessage = function (evt) 
    { 
        var received_msg = JSON.parse(evt.data);
        received_msg.forEach(
            ([name, price]) => {
                updateStock(name, price);
            }    
        );
    };
     
    ws.onclose = function()
    { 
       $('.glyphicon-flash').addClass('offline').removeClass('online');
    };
         
    window.onbeforeunload = function(event) {
       socket.close();
    };

    google.charts.load('current', {packages: ['corechart', 'line']});
    google.charts.setOnLoadCallback(chartReady);

});

/*
* Function : updateStock
* Param : name, price 
* Update individual stock, Add stock if it's not there, update if it's there
*/
function updateStock(name, price) {
    var ele = document.querySelector('[data-id="'+name+'"]');

    // Add New Stock using Template String
    if(ele === null) {
        var newStock = newStockTemplate.replace(
            /\|\|name\|\|/g,name
        ).replace(
            /\|\|price\|\|/g,formatPrice(price)
        ).replace(
            /\|\|change\|\|/g, '0%'
        ).replace(
            /\|\|update\|\|/g,Date.now()
        ).replace(
            /\|\|updated\|\|/g,'few seconds ago'
        ).replace(
            /\|\|chart\|\|/g,name
        );

        $('#stock-table').append(newStock);

        objStockPrice[name] = {};
        objStockPrice[name].price = [[new Date(),price]];
    }else {
        var priceEle = $(ele).find('.stock-price');
        var minPrice = $(ele).find('.stock-min').data("min");
        var maxPrice = $(ele).find('.stock-max').data("max")
        var oldPrice = priceEle.data('price');
        var changePer = Math.round(price / oldPrice * 100);

        maxPrice = (price > maxPrice) ? price : maxPrice;
        minPrice = (price < minPrice) ? price : minPrice;

        if(price > oldPrice){
            priceEle.addClass('up').removeClass('down');
            changePer = '+(' + changePer + ')';
        }else{
            priceEle.addClass('down').removeClass('up');
            changePer = '-(' + changePer + ')';
        }

        objStockPrice[name].price.push([new Date(),price]);

        priceEle.data('price',price).text(formatPrice(price));
        $(ele).find('.stock-update').data("update",Date.now()).text('few seconds ago');
        $(ele).find('.stock-change').text(changePer + "%");
        $(ele).find('.stock-max').data("max",maxPrice).text(formatPrice(maxPrice));
        $(ele).find('.stock-min').data("min",minPrice).text(formatPrice(minPrice));
    }

    generateChart(name);
    updateTime();
}

/*
* Function : formatPrice
* Param : num 
* Format number in ###.## format 
*/
function formatPrice(num) {
    var num = Math.round(num * 100) / 100;
    return num;
}

/*
* Function : generateChart
* Param : stock 
* Generate Chart for given Stock 
*/
function generateChart(stock) {

    if(!isChartReady){
        return;
    }

    var data = new google.visualization.DataTable();
    data.addColumn('datetime', 'Time');
    data.addColumn('number', 'Price');
    data.addRows(objStockPrice[stock].price);
    var options = {
        curveType: 'function',
        backgroundColor: { 
            fill:'rgba(255,255,255,0.2)' 
        },
        legend: 'none',
        tooltip : {
            isHtml: true
        },
        vAxis: {
            minValue: 0,
            gridlines: {
                count: 4,
                color: 'transparent'
            }
        },
        hAxis: {
            textPosition: 'none',
            gridlines: {
                color: 'transparent'
            }
        }
        
      };
    var chart = new google.visualization.LineChart(document.querySelector('div[data-chart="'+stock+'"]'));

    chart.draw(data, options);
}

/*
* Function : updateTime 
* Updating time updated value after each message from WebSocket
* This function can also run independantly to update timestamp manually
*/
function updateTime() {
    var currentTime = Date.now();
    $('.stock-update').each(function(index){
        var diff = Math.round((currentTime - $(this).data("update")) / 1000);
        
        if(diff <= 5 ){
            $(this).text("few seconds ago");
        }else if(diff > 5 ){
            $(this).text("5 seconds ago");
        }else if(diff > 10 ){
            $(this).text("10 seconds ago");
        }else if(diff > 20 ){
            $(this).text("20 seconds ago");
        }else if(diff > 30 ){
            $(this).text("30 seconds ago");
        }else if(diff > 45 ){
            $(this).text("45 seconds ago");
        }else if(diff > 60 && diff < 120){
            $(this).text("1 minute ago");
        }else {
            $(this).text("long ago");
        }
    });
}

/*
* Function : chartReady 
* Setting Global Var isChartReady true once Google Chart lib is ready
*/
function chartReady() {
    isChartReady = true;
}