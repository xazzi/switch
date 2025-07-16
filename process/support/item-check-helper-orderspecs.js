// This check function is for items only, not whole gang checks.
// KEEP all checks with overrides at the bottom.
// Pre CSV file creation. (CSV creation is ~ when things in automation (Not in the API call) are assigned to items)

// Leave out facility, due date and Paper/mapping checks.

itemCheckHelper = function(orderSpecs, node, data, db, s){
    var itemId = orderSpecs.jobItemId || node.getAttributeValue("ID");

        /*
        // Check if the shipping information exists.
        if(!orderSpecs.ship.exists){
            logItemFailure("Shipping data is missing.", itemId, data, db, s);
            return true;
        }

        // Check if the unwind spec is ready to use.
        if(orderSpecs.unwind.active && !orderSpecs.unwind.enable){
            logItemFailure("Unwind rotation issue.", itemId, data, db, s);
            return true;
        }

        // Items larger than 140" in either dim can't go to VN.
        if(data.facility.destination == "Van Nuys"){
            if(orderSpecs.width >= 144 || orderSpecs.height >= 144){
                logItemFailure("Too large for VN.", itemId, data, db, s);
                return true;
            }
        }

        // Check if hardware is enabled for production.
        if(orderSpecs.hardware.active && !orderSpecs.hardware.enabled){
            logItemFailure("Hardware not approved for production.", itemId, data, db, s);
            return true;
        }

        // If something set an item to a different imposition profile within Phoenix, remove it from the gang.
        // We can't mix things that want to call different profiles (gang methods).
        if(data.impositionProfile.name != matInfo.impositionProfile){
            logItemFailure("Different Phoenix profile requirement.", itemId, data, db, s);
            return true;
        }

        //Check for press deviation.
        if(data.phoenixPress != matInfo.phoenixPress){
            if(misc.rejectPress){
                logItemFailure(`Different printer requirement.`, itemId, data, db, s);
                return true;
            }
        }

        // Deviation checks to make sure all of the items in the gang are able to go together.
        if(data.prodName != matInfo.prodName){
            logItemFailure(`Has a different process requirement than other items in the gang.`, itemId, data, db, s);
            return true;
        }

        // Check if print surface is allowed for material.
        if((!matInfo.standardPrint && !orderSpecs.secondSurface) || (!matInfo.reversePrint && orderSpecs.secondSurface)){
            var surfaceType = orderSpecs.secondSurface ? "2nd Surface" : "1st Surface";
            logItemFailure(`Print surface not allowed with material type, ` + surfaceType, itemId, data, db, s);
            return true;
        }
        */

        var surfaceType = orderSpecs.secondSurface ? "2nd Surface" : "1st Surface";    // TODO chelsea, temporary while the above var is commented out for testing. Remove

        //1st test for new function                                               <---Remove too
        // Check for surface deviation.
        if(data.prodName != "CutVinyl" || "CutVinyl-Frosted"){
            if(data.secondSurface != orderSpecs.secondSurface){
                logItemFailure(`Different print surface type, ` + surfaceType, itemId, data, db, s);        
                return true;
            }
        }

        /*
        // Check for double sided in materials. (SLN & VN specific labels/stickers, but left code open for other processes)
        if((data.prodName == "RollLabels" || "RollStickers" || "WPSP" || "ClearBOPP" || "WhiteBOPP") && (data.doubleSided)){
            logItemFailure(`Double sided printing not allowed for this material.`, itemId, data, db,s);
            return true;
        }

        // Check if mount deviation.
        if(data.mount.active != orderSpecs.mount.active){
            var mountType = orderSpecs.mount.active ? "Mounted" : "Not Mounted"
            logItemFailure(`Different process: ` + mountType, itemId, data, db, s);
            return true;
        }

        // Check if front coating deviation.
        if(data.substrate.coating.front.value != orderSpecs.resolved.substrate.coating.front.value){
            logItemFailure(`Different front coating process.`, itemId, data, db, s);        
            return true;
        }        
        
        // Check if back coating deviation.
        if(data.substrate.coating.back.value != orderSpecs.resolved.substrate.coating.back.value){
            logItemFailure(`Different back coating process.`, itemId, data, db, s);        
            return true;
        }      

        // Check if front laminate deviation.
        if(data.substrate.laminate.front.value != orderSpecs.resolved.substrate.laminate.front.value){
            logItemFailure(`Different front laminate process.`, itemId, data, db, s);        
            return true;
        }

        // Check if back laminate deviation.
        if(data.substrate.laminate.back.value != orderSpecs.resolved.substrate.laminate.back.value){
            logItemFailure(`Different back laminate process.`, itemId, data, db, s);        
            return true;
        }


//-----------------------------------------KEEP checks with overrides below this line--------------------------------------------
        
        // Check for side deviation with override handling.
        if (data.doubleSided !== orderSpecs.doubleSided) { 
            if (data.sideMix || submit.override.sideMix) {
                data.doubleSided = true;
            } else {
                var sideLabel = orderSpecs.doubleSided ? "Double Sided" : "Single Sided";
                logItemFailure(`Different process, mixed sides not approved for gang.`, itemId, data, db, s);
                return true;
            }
        }

        // Check for hem type deviation with override handling.
        if(data.facility.destination !== "Arlington" && data.facility.destination !== "Van Nuys"){
            if(!submit.override.mixedHem){
                if(data.finishingType != orderSpecs.finishingType){
                    logItemFailure(`Different hem type, mixed hems not approved for gang.`, itemId, data, db, s);
                    return true;
                }
            }
        }
        */

        return false; // No failure, item not removed from gang.
}