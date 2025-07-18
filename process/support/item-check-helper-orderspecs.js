// This check function is for items only, not whole gang checks.
// KEEP all checks with overrides at the bottom.
// Pre CSV file creation. (CSV creation is ~ when things in automation (Not in the API call) are assigned to items)

// Leave out facility, due date and Paper/mapping checks.

itemCheckHelper_OrderSpecs = function(s, db, orderSpecs, node, data, matInfo, misc, submit){
    function run(s, db, orderSpecs, node, data){
        var itemId = orderSpecs.jobItemId || node.getAttributeValue("ID");

            /*
            // Check if the shipping information exists.
            if(!orderSpecs.ship.exists){
                logItemFailure(s, db, "Shipping data is missing.", itemId, data);
                return true;
            }

            // Check if the unwind spec is ready to use.
            if(orderSpecs.unwind.active && !orderSpecs.unwind.enable){
                logItemFailure(s, db, "Unwind rotation issue.", itemId, data);
                return true;
            }

            // Items larger than 140" in either dim can't go to VN.
            if(data.facility.destination == "Van Nuys"){
                if(orderSpecs.width >= 144 || orderSpecs.height >= 144){
                    logItemFailure(s, db, "Too large for VN.", itemId, data);
                    return true;
                }
            }

            // Check if hardware is enabled for production.
            if(orderSpecs.hardware.active && !orderSpecs.hardware.enabled){
                logItemFailure(s, db, "Hardware not approved for production.", itemId, data);
                return true;
            }

            // If something set an item to a different imposition profile within Phoenix, remove it from the gang.
            // We can't mix things that want to call different profiles (gang methods).
            if(data.impositionProfile.name != matInfo.impositionProfile){
                logItemFailure(s, db, "Different Phoenix profile requirement.", itemId, data);
                return true;
            }

            //Check for press deviation.
            if(data.phoenixPress != matInfo.phoenixPress){
                if(misc.rejectPress){
                    logItemFailure(s, db, "Different printer requirement.", itemId, data);
                    return true;
                }
            }

            // Deviation checks to make sure all of the items in the gang are able to go together.
            if(data.prodName != matInfo.prodName){
                logItemFailure(s, db, "Has a different process requirement than other items in the gang.", itemId, data);
                return true;
            }

            // Check if print surface is allowed for material.
            if((!matInfo.standardPrint && !orderSpecs.secondSurface) || (!matInfo.reversePrint && orderSpecs.secondSurface)){
                var surfaceType = orderSpecs.secondSurface ? "2nd Surface" : "1st Surface";
                logItemFailure(s, db, "Print surface not allowed with material type, " + surfaceType, itemId, data);
                return true;
            }
            */
           
            var surfaceType = orderSpecs.secondSurface ? "2nd Surface" : "1st Surface";    // TODO chelsea, temporary while the above var is commented out for testing. Remove

            //1st test for new function                                               <---Remove too
            // Check for surface deviation.
            if(data.prodName != "CutVinyl" || "CutVinyl-Frosted"){
                if(data.secondSurface != orderSpecs.secondSurface){
                    logItemFailure(s, db, "Different print surface type, " + surfaceType, itemId, data);        
                    return true;
                }
            }

            /*
            // Check for double sided in materials. (SLN & VN specific labels/stickers, but left code open for other processes)
            if((data.prodName == "RollLabels" || "RollStickers" || "WPSP" || "ClearBOPP" || "WhiteBOPP") && (data.doubleSided)){
                logItemFailure(s, db, "Double sided printing not allowed for this material.", itemId, data);
                return true;
            }

            // Check if mount deviation.
            if(data.mount.active != orderSpecs.mount.active){
                var mountType = orderSpecs.mount.active ? "Mounted" : "Not Mounted"
                logItemFailure(s, db, "Different process: " + mountType, itemId, data);
                return true;
            }

            // Check if front coating deviation.
            if(data.substrate.coating.front.value != orderSpecs.resolved.substrate.coating.front.value){
                logItemFailure(s, db, "Different front coating process."", itemId, data);        
                return true;
            }        
            
            // Check if back coating deviation.
            if(data.substrate.coating.back.value != orderSpecs.resolved.substrate.coating.back.value){
                logItemFailure(s, db, "Different back coating process.", itemId, data);        
                return true;
            }      

            // Check if front laminate deviation.
            if(data.substrate.laminate.front.value != orderSpecs.resolved.substrate.laminate.front.value){
                logItemFailure(s, db, "Different front laminate process.", itemId, data);        
                return true;
            }

            // Check if back laminate deviation.
            if(data.substrate.laminate.back.value != orderSpecs.resolved.substrate.laminate.back.value){
                logItemFailure(s, db, "Different back laminate process.", itemId, data);        
                return true;
            }


    //-----------------------------------------KEEP checks with overrides below this line--------------------------------------------
            
            // Check for side deviation with override handling.
            if (data.doubleSided !== orderSpecs.doubleSided) { 
                if (data.sideMix || submit.override.sideMix) {
                    data.doubleSided = true;
                } else {
                    var sideLabel = orderSpecs.doubleSided ? "Double Sided" : "Single Sided";
                    logItemFailure(s, db, "Different process, mixed sides not approved for gang. " + sideLabel, itemId, data);
                    return true;
                }
            }

            // Check for hem type deviation with override handling.
            if(data.facility.destination !== "Arlington" && data.facility.destination !== "Van Nuys"){
                if(!submit.override.mixedHem){
                    if(data.finishingType != orderSpecs.finishingType){
                        logItemFailure(s, db, "Different hem type, mixed hems not approved for gang.", itemId, data);
                        return true;
                    }
                }
            }
            */

            return false; // No failure, item not removed from gang.
    }
    return run(s, db, orderSpecs, node, data, matInfo, misc, submit)
}