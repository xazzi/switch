setHemLabels = function(s, order) {
    function safeGet(obj, key) {
        return obj && obj.side && obj.side[key];
    }

    var labels = {
        top: safeGet(order.hem, "top") || safeGet(order.pocket, "top"),
        bottom: safeGet(order.hem, "bottom") || safeGet(order.pocket, "bottom"),
        left: safeGet(order.hem, "left") || safeGet(order.pocket, "left"),
        right: safeGet(order.hem, "right") || safeGet(order.pocket, "right")
    };

    if (order.width <= 12) {
        labels.top = false;
        labels.bottom = false;
    }

    if (order.height <= 12) {
        labels.left = false;
        labels.right = false;
    }

    return labels;
}
