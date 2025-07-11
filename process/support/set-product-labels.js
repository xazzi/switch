setProductLabel = function(s, order){
    var shape = order.shape || {};
    var diecut = order.diecut || {};

    if (shape.applyProductLabel === true) {
        return true;
    }

    if (shape.applyProductLabel == null && diecut.applyProductLabel === true) {
        return true;
    }

    if (shape.applyProductLabel == null && diecut.applyProductLabel == null) {
        return true;
    }

    return false;
}

/*
setProductLabel = function(s, orderArray){

    // If it's an approved shape, return true before checking die.
    if(orderArray.shape.applyProductLabel){
        return true
    }

    // If shape is null, check if it's an approved die.
    if(orderArray.shape.applyProductLabel == null){
        if(orderArray.diecut.applyProductLabel){
            return true
        }
    }

    // If no shape is detected, return true.
    if(orderArray.shape.applyProductLabel == null && orderArray.diecut.applyProductLabel == null){
        return true
    }

    return false
}
    */