setHemLabels = function(s, orderArray){
    var labels = {
        top: orderArray.hem.side.top || orderArray.pocket.side.top,
        bottom: orderArray.hem.side.bottom || orderArray.pocket.side.bottom,
        left: orderArray.hem.side.left || orderArray.pocket.side.left,
        right: orderArray.hem.side.right || orderArray.pocket.side.right
    }

    if(orderArray.width <= 12){
        labels.top = false;
        labels.bottom = false;
    }

    if(orderArray.height <= 12){
        labels.left = false;
        labels.right = false;
    }

    return labels
}