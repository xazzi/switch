// This is not used currently, we pass in the workstyle directly from the matInfo table instead.
// If needed in the future, this can be used as a situational override.
// It should be called from the processor ideally.

getWorkstyle = function(s, handoffData){
    function runWorkstyle(s, handoffData){

        // If it's doublesided
        if(handoffData.doubleSided){
            return "Sheetwise"
        }
        
        // If it's singlesided LFP
        if(handoffData.type == "sheet" || handoffData.type == "roll"){
            return "Flatwork"
        }

        return "OneSided"
    }
    return runWorkstyle(s, handoffData);
}