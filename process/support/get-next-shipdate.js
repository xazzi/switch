// For use in Switch.

getNextShipDate = function(){

    var today = new Date();
    var shipDate = {}

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

/*
getNextShipDate = function(){

  var today = new Date();
  var daysTillNextShip
  var shipDate = {}

  var dayOfWeek = today.getDay();
  if(dayOfWeek == 0){daysTillNextShip = 1} // Sunday
  if(dayOfWeek == 1){daysTillNextShip = 1} // Monday
  if(dayOfWeek == 2){daysTillNextShip = 1} // Tuesday
  if(dayOfWeek == 3){daysTillNextShip = 1} // Wednesday
  if(dayOfWeek == 4){daysTillNextShip = 1} // Thursday
  if(dayOfWeek == 5){daysTillNextShip = 3} // Friday
  if(dayOfWeek == 6){daysTillNextShip = 2} // Saturday

  // Holiday overrides.
  //if(dayOfWeek == 5){daysTillNextShip = 4} // If we have a holiday on Monday.

  //shipDate.entireDate = new Date(today) //Today

  s.log(2, today.getMonth())

  if(shipDate.entireDate.getHours() >= 04){
    shipDate.entireDate.setDate(shipDate.entireDate.getDate() + daysTillNextShip) //Tomrrow, or next shipdate if weekend.
  }

  shipDate.month = shipDate.entireDate.getMonth();
  s.log(2, shipDate.month)
  if(shipDate.month < 10){
    shipDate.month = "0" + shipDate.month;
  }

  shipDate.date = shipDate.entireDate.getDate();
  if(shipDate.date < 10){
    shipDate.date = "0" + shipDate.date;
  }

  return shipDate
}
*/