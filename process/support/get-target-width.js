getTargetWidth = function(s, matInfo, orderArray, data){

    function run(s, matInfo, orderArray, data){

        var width = {
            value: matInfo.width,
            target: matInfo.width,
            max: matInfo.maxWidth != null ? Number(matInfo.maxWidth) : matInfo.width,
            usable: matInfo.width - Number(matInfo.printer.margin.left) - Number(matInfo.printer.margin.right)
        };

        // Enable wider roll if product dimensions exceed current roll width
        if (matInfo.maxWidth != null) {
            for (var i = 0; i < orderArray.length; i++) {
                var order = orderArray[i];

                if (order.width > matInfo.width && order.height > matInfo.width) {
                    data.maxWidth = true;
                    width.value = width.max;
                    width.usable = width.max - 0.25 - 0.25; // or adjust based on margin if consistent
                    return width;
                }
            }
        }

        return width;
    }
    
    return run(s, matInfo, orderArray, data);
}