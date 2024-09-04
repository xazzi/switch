setBannerSorting = function(s, orderArray){

    var size = {
        standard: false,
        oversize: false
    }

    var sqInch = orderArray.width * orderArray.height;

    if(sqInch >= 4608){
        size.oversize = true
    }else{
        size.standard = true
    }

    return size
}