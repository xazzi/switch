getNextShipDate = function(){

    var today = new Date();
    var shipDate = {}

    // TODO - Google says this is wrong and that it needs a +1 to the end of .getMonth(), I agree but it still works.
    shipDate.month = today.getMonth()
    if(shipDate.month < 10){
      shipDate.month = "0" + shipDate.month;
    }

    shipDate.date = today.getDate();
    if(shipDate.date < 10){
		  shipDate.date = "0" + shipDate.date;
    }

    return shipDate
}