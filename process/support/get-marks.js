setMarks = function(folder, matInfo, data, orderArray, product){
    function readFiles(folder, matInfo, data, orderArray, product){
        var marksArray = []
        var str = File.read(folder + "/marks.json", "UTF-8");
        var dump = JSON.parse(str);
        var apply;

        function contains(a, object) {
            var i = a.length;
            while (i--) {
               if (a[i] === object) {
                   return true;
               }
            }
            return false;
        }

        for(var j in dump.marks){
            if(!contains(dump.marks[j].process, data.prodName)){
                if(!contains(dump.marks[j].process, "All")){
                    continue;
                }
            }
            
            if(!contains(dump.marks[j].subprocess, data.subprocess)){
                continue;
            }

            if(matInfo.printer.name == "C500"){
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

            for(var k in dump.marks[j].settings){
                marksArray.push(data.facility + dump.marks[j].settings[k].dir + dump.marks[j].settings[k].name + (dump.marks[j].settings[k].scale ? data.scale : ""));
            }
        }
        return marksArray
    }
    return contents = readFiles(folder, matInfo, data, orderArray, product);
}