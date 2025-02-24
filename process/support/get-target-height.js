getTargetHeight = function(s, matInfo, orderArray, data){

    function run(s, matInfo, orderArray, data){

        // Set the targets to return out to the main process
        var dynamic = {
            height:{
                value: matInfo.height,
                enabled: matInfo.dynamicHeightIncrement == null ? 'n' : 'y'
            }
        }

        // If the value in the table is null, check some other data and return it out immediately.
        for(var i=0; i<orderArray.length; i++){

            // Enable the 10th Scale logic in Phoenix and disable dynamic height.
            if(orderArray[i].width >= 380 || orderArray[i].height >= 380){
                data.scaled = true;
                data.scale = "-10pct";
                dynamic.height.enabled = 'n'
                return dynamic;
            }

            // Check if it should enable long oversize rolls (251gsm) and disable dynamic height
            if(matInfo.type == "roll" && !data.scaled){
                if((orderArray[i].width > matInfo.width && orderArray[i].width > matInfo.height) || 
                    (orderArray[i].height > matInfo.width && orderArray[i].height > matInfo.height)){ 
                    data.oversize = true;
                    dynamic.height.enabled = 'n'
                    return dynamic;
                }
            }
        }

        // If dynamic height is disabled in general, return the default height.
        if(dynamic.height.enabled == 'n'){
            return dynamic;
        }

        // Set the increment used for deciding the roll length.
        var increment = Number(matInfo.dynamicHeightIncrement);

        // Loop through the products to find the length needed.
        for(var i=0; i<orderArray.length; i++){
            
            // Set the minimum height based on the height of the product.
            minimum = Number(orderArray[i].height)

            // If the product will be rotated, set the minimum based on the width.
            if(round(Number(orderArray[i].width)) > matInfo.width){
                minimum = Number(orderArray[i].width)
            }

            // Account for the top and bottom material margins in the minimum
            minimum += Number(matInfo.printer.margin.top) + Number(matInfo.printer.margin.bottom)

            // Increment the target up until we go over the minumum needed.
            while(dynamic.height.value < (minimum)){
                dynamic.height.value += increment
            }
        }

        // Set the max length for Wixom at 130.
        if(data.facility.destination == "Wixom"){
            if(matInfo.prodName == "Magnet"){
                if(minimum > 130){
                    minimum = 130;
                }
            }
        }

        // Return the value out.
        return dynamic;
    }
    
    return run(s, matInfo, orderArray, data);
}