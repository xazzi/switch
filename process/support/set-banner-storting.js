setBannerSorting = function(s, orderArray){
    var size = "Standard"

    var sqInch = orderArray.width * orderArray.height;

    if(sqInch >= 4608){
        size = "Oversize"
    }

    return size
}