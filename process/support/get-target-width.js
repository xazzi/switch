getTargetWidth = function(s, matInfo, orderArray, data){

    function run(s, matInfo, orderArray, data){

        // Set the targets to return out to the main process
        var width = {
            value: matInfo.width,
            target: matInfo.width,
            max: matInfo.maxWidth != null ? Number(matInfo.maxWidth) : matInfo.width,
            usable: matInfo.width - Number(matInfo.printer.margin.left) - Number(matInfo.printer.margin.right)
        }

        // Check if it should enable maxWidth rolls
        if(matInfo.maxWidth != null){
            for(var i=0; i<orderArray.length; i++){
                if(orderArray[i].width > matInfo.width && orderArray[i].height > matInfo.width){ 
                    data.maxWidth = true;
                    width.value = width.max;
                    width.usable = width.max - Number(0.25) - Number(0.25);
                    return width;
                }
            }
        }

        return width;
    }
    
    return run(s, matInfo, orderArray, data);
}