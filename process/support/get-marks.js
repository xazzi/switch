var parent = []
var apply

setMarks = function(s, folder, matInfo, data, orderArray, product, subprocess, marksArray){
    function readFiles(s, folder, matInfo, data, orderArray, product, subprocess, marksArray){

        // Create an array of the json files that need to be searched.
        var markFiles = [
            "color-id.json",
            "grommets.json",
            "labels.json",
            "misc.json",
            "dashed-lines.json",
            "color-day.json"
        ]

        // Loop through that array to find any applicable marks.
        for(var y in markFiles){

            // Target the specific file, 1 at a time.
            var str = File.read(folder + "/marks/" + markFiles[y], "UTF-8");
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
                if(!contains(dump.marks[j].subprocess.requirements, subprocess.name)){
                    continue;
                }

                // Check for rejected subprocesses
                if(contains(dump.marks[j].subprocess.rejections, subprocess.name)){
                    continue;
                }

                // If it's the C500, continue through the array.
                if(matInfo.printer.name == "C500"){
                    continue;
                }

                // Reset apply back to true for the checkObject function
                apply = true;

                // Check the requirements.
                checkObject(s, "requirements", dump.marks[j].specs.requirements, matInfo, product, data, orderArray);

                // Check for any rejections.
                checkObject(s, "rejections", dump.marks[j].specs.rejections, matInfo, product, data, orderArray);

                // If any of the above checks failed, continue through the array.
                if(!apply){
                    continue;
                }

                // If all of the above criteria are met, add the associated marks to the array.
                for(var k in dump.marks[j].settings){
                    marksArray.push(data.facility.destination + dump.marks[j].settings[k].dir + dump.marks[j].settings[k].name + data.scale);
                }
            }
        }
    }
    readFiles(s, folder, matInfo, data, orderArray, product, subprocess, marksArray);
}

function checkObject(s, type, parameter, matInfo, product, data, orderArray){

    // If it's already false then return out of the function.
    if(!apply){
        return;
    }

    // Loop through the parameters.
    for(var l in parameter){

        // If the parameter is an nested object, dig further.
        if(typeof parameter[l] === 'object'){
            parent.push(l);
            checkObject(s, type, parameter[l], matInfo, product, data, orderArray);

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