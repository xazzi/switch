setDashes = function(folder, matInfo, data, orderArray, product){
    function readFiles(folder, matInfo, data, orderArray, product){
        var dashInfo = {}
        var str = File.read(folder + "/dashes.json", "UTF-8");
        var dump = JSON.parse(str);
        var apply;

        for(var j in dump.marks){
            if(!contains(dump.marks[j].process, data.prodName)){
                continue;
            }
            
            if(!contains(dump.marks[j].subprocess.approve, data.subprocess)){
                continue;
            }

            if(contains(dump.marks[j].subprocess.ignore, data.subprocess)){
                continue;
            }

            if(!contains(dump.marks[j].facility, data.facility.destination)){
                continue;
            }
                    
            apply = true;
            for(var i in dump.marks[j].restrictions){
                if(contains(dump.marks[j].restrictions, "None")){
                    break;
                }
                if(!apply){
                    break;
                }
                apply = false;
                for(var m in dump.marks[j].restrictions[i].parameter){
                    for(var l in dump.marks[j].restrictions[i].value){
                        if(dump.marks[j].restrictions[i].value[l] == eval(dump.marks[j].restrictions[i].parameter[m])) {
                            apply = true;
                            break;
                        }
                    }
                }
            }

            if(!apply){
                continue;
            }

            for(var key in dump.marks[j].settings){
                dashInfo[key] = dump.marks[j].settings[key];
            }
        }
        return dashInfo
    }
    return contents = readFiles(folder, matInfo, data, orderArray, product);
}