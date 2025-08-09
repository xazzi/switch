setBannerSorting = function(s, order) {
    var size = "Standard";

    var sqInch = order.width * order.height;

    if (sqInch >= 4608) {
        size = "Oversize";
    }

    return size;
}
