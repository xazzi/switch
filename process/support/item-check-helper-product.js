// This check function is for items only, not whole gang checks.
// KEEP all checks with overrides at the bottom.
// in the middle of CSV creation.

itemCheckHelperPost = function(product, node, data, db, s){
    var itemId = product.itemNumber?.jobItemId || node.getAttributeValue("ID");

        //If hardware is enabled and template ID is not assigned for specified subprocess, remove from gang.
        if(orderArray[i].hardware.active){
            if(product.subprocess.name == "Retractable" || "TableTop" || "MiniBannerStand" || "RectangleFlag" || "FeatherFlag"){
                if(orderArray[i].hardware.template.id == null){
                    logItemFailure(`Template ID not assigned: ${product.subprocess.name}.`, itemId, data, db, s);        
                    return true;
                }
            }
        }

        // Remove if DS 13ozBanner for SLC.
        if(data.facility.destination == "Salt Lake City"){
            if(orderArray[i].doubleSided && matInfo.prodName == "13ozBanner"){
                if(product.subprocess.name != "Retractable"){
                    logItemFailure("DS 13oz banner assigned to SLC.", itemId, data, db, s);        
                    return true;
                }
            }
        }

        /*
        // Remove if DS product for VN.
        if(data.facility.destination == "Van Nuys"){
            if(orderArray[i].doubleSided){
            logItemFailure("DS product assigned to VN.", itemId, data, db, s);        
            return true;
            }
        }
        */

        // Long banners with weld in ARL need to go somewhere else.
        if(data.facility.destination == "Arlington"){
            if(matInfo.prodName == "13oz-Matte" && orderArray[i].hem.method == "Weld"){
                if(orderArray[i].width >= 241 || orderArray[i].height >= 241){
                    logItemFailure("Welded banner over 168\" assigned to ARL.", itemId, data, db, s);        
                    return true;
                }
            }
        }

        // If the subprocess can't be mixed with other subprocesses, reject it.
        if(data.mixed != product.subprocess.mixed){
            logItemFailure(`Different subprocess: ${product.subprocess.name}.`, itemId, data, db, s);        
            return true;
            }
            
        // If the file exists and you have data to use, go here.
        // TODO this check may need to be seperate from the function
        if(file.usable){
            if(product.subprocess.orientationCheck){
                // Check if page count is 2 for DS and 1 for SS.
                if(file.pages === 1 && product.doubleSided){
                    if(file.pages > 1 && !product.doubleSided){
                        var sideLabel = orderSpecs.doubleSided ? "Double Sided" : "Single Sided";
                        logItemFailure(`File page count doesn't match item order specs: ${sideLabel}.`, itemId, data, db, s);        
                        return true;
                    }
                }
            }
        }
        



// --------------------------------------------------KEEP checks with overrides below this line--------------------------------------------------

        // Check for deviation with override handling. 
     

        return false; // No failure, item not removed from gang.
}