var parent = []
var apply

setPhoenixScripts = function(s, folder, matInfo, data, orderArray, product){
    function readFiles(s, folder, matInfo, data, orderArray, product){

        // Create an array of the json files that need to be searched.
        var markFiles = [
            "sewn-hem.json",
            "pockets.json",
            //"day-labels.json"
        ]

        // Loop through that array to find any applicable marks.
        for(var y in markFiles){

            // Target the specific file, 1 at a time.
            var str = File.read(folder + "/phoenix script/" + markFiles[y], "UTF-8");
            var dump = JSON.parse(str);

            // Loop through the marks in that file.
            for(var j in dump.marks){

                // Check the mark key.
                if(dump.marks[j].key != orderArray.grommet.key){
                    if(dump.marks[j].key != "None"){
                        continue;
                    }
                }

                // Check for approved facilities
                if(!contains(dump.marks[j].facility, data.facility.destination)){
                    if(!contains(dump.marks[j].facility, "All")){
                        continue;
                    }
                }

                // Check for required products
                if(!contains(dump.marks[j].process.requirements, data.prodName)){
                    if(!contains(dump.marks[j].process.requirements, "All")){
                        continue;
                    }
                }

                // Check for rejected products
                if(contains(dump.marks[j].process.rejections, data.prodName)){
                    continue;
                }
                
                // Check for required subprocesses
                if(!contains(dump.marks[j].subprocess.requirements, product.subprocess.name)){
                    if(!contains(dump.marks[j].subprocess.requirements, "All")){
                        continue;
                    }
                }

                // Check for rejected subprocesses
                if(contains(dump.marks[j].subprocess.rejections, product.subprocess.name)){
                    continue;
                }

                // If it's the C500, continue through the array.
                if(matInfo.printer.name == "C500"){
                    continue;
                }

                // Reset apply back to true for the checkObject function
                apply = true;

                // Check the requirements.
                checkParameters(s, "requirements", dump.marks[j].specs.requirements, matInfo, product, data, orderArray);

                // Check for any rejections.
                checkParameters(s, "rejections", dump.marks[j].specs.rejections, matInfo, product, data, orderArray);

                // If any of the above checks failed, continue through the array.
                if(!apply){
                    continue;
                }

                // If all of the above criteria are met, add the associated marks to the array.
                checkObject(s, dump.marks[j].settings, product, orderArray)
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

        // If the parameter is an nested object, dig further.
        if(typeof parameter[l] === 'object'){
            parent.push(l + ".");
            checkObject(s, parameter[l], product, orderArray);

        // Eval the new parameter.
        }else{
            var thing = parent.join('');
            eval(thing + l + " = '" + parameter[l] + "'");
        }
    }
    // Remove the last entry of the array when that level of nest is completed.
    parent = parent.slice(0,-1)
}