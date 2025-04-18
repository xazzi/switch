var parent = [];
var apply, facilityCheck;

setPhoenixScripts = function(s, folder, matInfo, data, orderArray, product){
    function readFiles(s, folder, matInfo, data, orderArray, product){

        var files = folder.entryList("*.json", Dir.Files, Dir.Name);

        for(var i=0; i<files.length; i++){
            var str = File.read(folder.path + "/" + files[i], "UTF-8");
            var dump = JSON.parse(str)

            // Loop through the marks in that file.
            for(var j in dump.parameters){

                // Check if the facility is enabled.
                facilityCheck = false;
                for(var w in dump.parameters[j].facility){
                    if(dump.parameters[j].facility[w].id == orderArray.facilityId){
                        if(dump.parameters[j].facility[w].enabled){
                            facilityCheck = true;
                            break;
                        }
                    }
                }

                // If the facility is not enabled, continue through the parent loop.
                if(!facilityCheck){
                    continue;
                }

                // Check for required products
                if(!contains(dump.parameters[j].process.requirements, data.prodName)){
                    if(!contains(dump.parameters[j].process.requirements, "All")){
                        continue;
                    }
                }

                // Check for rejected products
                if(contains(dump.parameters[j].process.rejections, data.prodName)){
                    continue;
                }
                
                // Check for required subprocesses
                if(!contains(dump.parameters[j].subprocess.requirements, product.subprocess.name)){
                    if(!contains(dump.parameters[j].subprocess.requirements, "All")){
                        continue;
                    }
                }

                // Check for rejected subprocesses
                if(contains(dump.parameters[j].subprocess.rejections, product.subprocess.name)){
                    continue;
                }

                // Reset apply back to true for the checkParameters function
                apply = true;

                // Check the requirements.
                checkParameters(s, "requirements", dump.parameters[j].specs.requirements, matInfo, product, data, orderArray);

                // Check for any rejections.
                checkParameters(s, "rejections", dump.parameters[j].specs.rejections, matInfo, product, data, orderArray);

                // If any of the above checks failed, continue through the array.
                if(!apply){
                    continue;
                }

                // If all of the above criteria are met, add the associated marks to the array.
                checkObject(s, dump.parameters[j].settings, product, orderArray, matInfo)
            }
        }
    }
    return contents = readFiles(s, folder, matInfo, data, orderArray, product);
}

function checkParameters(s, type, parameter, matInfo, product, data, orderArray){

    // If it's already false then return out of the function.
    if(!apply){
        return;
    }

    // Loop through the parameters.
    for(var l in parameter){

        // If the parameter is an nested object, dig further.
        if(typeof parameter[l] === 'object'){
            parent.push(l);
            checkParameters(s, type, parameter[l], matInfo, product, data, orderArray);

        // If the parameter is an array
        }else if(parameter instanceof Array){
            if(type == "requirements"){
                var thing = parent.join('.');
                if(!contains(parameter, eval(thing))){
                    apply = false;
                    break;
                }
            }
            if(type == "rejections"){
                var thing = parent.join('.');
                if(contains(parameter, eval(thing))){
                    apply = false;
                    break;
                }
            }

        // If the parameter is not in an array.
        }else{
            if(type == "requirements"){
                var thing = parent.join('.');
                if(parameter[l] != eval(thing + "." + l)){
                    apply = false;
                    break;
                }
            }
            if(type == "rejections"){
                var thing = parent.join('.');
                if(parameter[l] == eval(thing + "." + l)){
                    apply = false;
                    break;
                }
            }
        }
    }
    
    // Remove the last entry of the array when that level of nest is completed.
    parent = parent.slice(0,-1);
}

function checkObject(s, parameter, product, orderArray, matInfo){
    for(var l in parameter){
        // If the parameter is an array, setup the eval and assign the object.
        if(parameter[l] instanceof Array){
            var thing = parent.join('');
            var tempArray = []
            for(var j in parameter[l]){
                var parameters = parameter[l][j].split(':');
                var tempVar
                var tempSubArray = []

                for(var k in parameters){
                    try{
                        tempVar = eval(parameters[k])
                    }catch(e){
                        tempVar = parameters[k]
                    }
                    tempSubArray.push(tempVar)
                }
                tempSubArray = tempSubArray.join(':')
                tempArray.push(tempSubArray)
            }

            eval(thing + l + " = '" + tempArray.join(',') + "'")

        // If the parameter is an nested object, dig further.
        }else if(typeof parameter[l] === 'object'){
            parent.push(l + ".");
            checkObject(s, parameter[l], product, orderArray, matInfo);

        // Eval the new parameter.
        }else{
            var thing = parent.join('');
            var temp
            try{
                temp = eval(parameter[l])
            }catch(e){
                temp = parameter[l]
            }
            product.script[l].push(temp)
        }
    }

    // Remove the last entry of the array when that level of nest is completed.
    parent = parent.slice(0,-1)
}