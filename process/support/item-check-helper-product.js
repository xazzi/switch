// This check function is for items only, not whole gang checks.
// KEEP all checks with overrides at the bottom.
// in the middle of CSV creation.

// Not included: undersizing and breakaway checks, also items not in the hardware_template database table.

itemCheckHelper_Product = function(s, db, product, node, data, matInfo, file){
    function run(s, db, product, node, data, matInfo, file){
        var itemId = product.itemNumber.jobItemId || node.getAttributeValue("ID");

            //If hardware is enabled and template ID is not assigned for specified subprocess, remove from gang.
            if(orderArray[i].hardware.active){
                if(product.subprocess.name == "Retractable" || "TableTop" || "MiniBannerStand" || "RectangleFlag" || "FeatherFlag"){
                    if(orderArray[i].hardware.template.id == null){
                        logItemFailure(s, db, "Template ID not assigned, " + product.subprocess.name, itemId, data);        
                        return true;
                    }
                }
            }

            /*
            // Remove if DS 13ozBanner for SLC.
            if(data.facility.destination == "Salt Lake City"){
                if(orderArray[i].doubleSided && matInfo.prodName == "13ozBanner"){
                    if(product.subprocess.name != "Retractable"){
                        logItemFailure(s, db, "Double sided 13oz banner assigned to SLC.", itemId, data);        
                        return true;
                    }
                }
            }

            /*
            // Remove if DS product for VN.
            if(data.facility.destination == "Van Nuys"){
                if(orderArray[i].doubleSided){
                logItemFailure(s, db, "Double sided product assigned to VN.", itemId, data);        
                return true;
                }
            }
            */

            /*
            // Long banners with weld in ARL need to go somewhere else.
            if(data.facility.destination == "Arlington"){
                if(matInfo.prodName == "13oz-Matte" && orderArray[i].hem.method == "Weld"){
                    if(orderArray[i].width >= 241 || orderArray[i].height >= 241){
                        logItemFailure(s, db, "Welded banner over 168\" assigned to ARL.", itemId, data);        
                        return true;
                    }
                }
            }

            // If the subprocess can't be mixed with other subprocesses, reject it.
            if(data.mixed != product.subprocess.mixed){
                logItemFailure(s, db, "Different subprocess, " + product.subprocess.name, itemId, data);        
                return true;
            }
                
            // TODO this check may need to be seperate from the function, due to location in the parser.
            if(file.usable){
                if(product.subprocess.orientationCheck){
                    // Check if page count is 2 for DS and 1 for SS.
                    if(file.pages === 1 && product.doubleSided){
                        if(file.pages > 1 && !product.doubleSided){
                            var sideLabel = orderSpecs.doubleSided ? "Double Sided" : "Single Sided";
                            logItemFailure(s, db, "File page count doesn't match item order specs, " + sideLabel, itemId, data);        
                            return true;
                        }
                    }
                }
            }
            */
            



    // --------------------------------------------------KEEP checks with overrides below this line--------------------------------------------------

            // Check for deviation with override handling. 
        

            return false; // No failure, item not removed from gang.
    }
    return run(s, db, product, node, data, matInfo, file)
}