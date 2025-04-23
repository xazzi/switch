getTargetHeight = function(s, matInfo, orderArray, data){

    function run(s, matInfo, orderArray, data){

        matInfo.height = 200

        // Set the targets to return out to the main process
        var height = {
            value: matInfo.height,
            target: matInfo.height,
            max: matInfo.maxHeight != null ? Number(matInfo.maxHeight) : 380,
            usable: matInfo.height - Number(matInfo.printer.margin.top) - Number(matInfo.printer.margin.bottom),
            increment:{
                enabled: matInfo.dynamicHeightIncrement != null,
                value: matInfo.dynamicHeightIncrement
            }
        }

        // If files are greater than the maximum size Phoenix will gang, enable the 10th Scale logic in Phoenix and disable dynamic height.
        for(var i=0; i<orderArray.length; i++){
            if(orderArray[i].width > 380 || orderArray[i].height > 380){
                data.scaleGang = true;
                data.scale = "-10pct";
                height.increment.enabled = false;
                return height;
            }
        }

        // Loop through the products to find the length needed.
        for(var i=0; i<orderArray.length; i++){

            // Set a temp value based off of the height.
            var minimumRequired = Number(orderArray[i].height) + 10

            // if we know it's going to be rotated then adjust the temp value to use the width (rotated to height)
            if(round(Number(orderArray[i].width)) > matInfo.width){
                minimumRequired = Number(orderArray[i].width) + 10
            }

            // Increment the target up until we go over the minumum needed.
            if(height.increment.enabled){
                while(height.usable < minimumRequired){
                    height.usable += Number(height.increment.value);
                    height.value += Number(height.increment.value);
                    if(height.value > 380){
                        data.scaleGang = true;
                        data.scale = "-10pct";
                        height.increment.enabled = false;
                        return height;
                    }
                }

            // If there is no incrementing enabled
            }else{
                if(height.usable < minimumRequired){
                    height.usable = height.max;
                    height.value = height.max;
                }
            }
        }

        // Return the value out.
        return height;
    }
    
    return run(s, matInfo, orderArray, data);
}