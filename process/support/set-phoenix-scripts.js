var parent = [];
var apply;

setPhoenixScripts = function(s, folder, matInfo, data, orderArray, product){
    function readFiles(s, folder, matInfo, data, orderArray, product){

        var files = folder.entryList("*.json", Dir.Files, Dir.Name);

        for(var i=0; i<files.length; i++){
            var str = File.read(folder.path + "/" + files[i], "UTF-8");
            var dump = JSON.parse(str)

            // Loop through the marks in that file.
            for(var j in dump.parameters){

                // Check the mark key.
                if(dump.key != orderArray.grommet.key){
                    if(dump.key != "None"){
                        continue;
                    }
                }

                // The facility has to have a subprocess assigned to it to advance.
                if(dump.parameters[j].facility.id != orderArray.facilityId){
                    continue
                }

                // If the facility is enabled, advance.
                if(!dump.parameters[j].facility.enabled){
                    continue
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

                // Reset apply back to true for the checkObject function
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
                checkObject(s, dump.parameters[j].settings, product, orderArray)
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

function checkObject(s, parameter, product, orderArray){
    for(var l in parameter){
        // If the parameter is an array, setup the eval and assign the object.
        if(parameter[l] instanceof Array){
            var thing = parent.join('');
            var tempArray = []
            for(var j in parameter[l]){
                var prop = parameter[l][j].split(':')[0]
                var value = parameter[l][j].split(':')[1]
                var temp
                try{
                    temp = eval(value)
                }catch(e){
                    temp = value
                }
                tempArray.push(prop + ":" + temp)
            }
            eval(thing + l + " = '" + tempArray.join(',') + "'")

        // If the parameter is an nested object, dig further.
        }else if(typeof parameter[l] === 'object'){
            parent.push(l + ".");
            checkObject(s, parameter[l], product, orderArray);

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