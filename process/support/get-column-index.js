getColumnIndex = function(s, inputCSV){

    function run(s, inputCSV){

        var index = {}

        var line = inputCSV.readLine();
            line = line.replace(/\"/g,' ');
            line = line.split(';');
        
        for(var i=0; i<line.length; i++){

            // Override stupid entries to be less stupid.
            if(line[i] == "METRIX_NAME"){
                index.metrixName = i;
                index[result] = i;
                continue;
            }

            // Run through normal names and standardize them.
            var result = line[i].replace(/\b\w/, line[i].charAt(0).toLowerCase())
                result = result.replace(/[\ -]/g,'')

            // Add their index number to the object for them to be referenced later.
            index[result] = i;
        }
        return index
    }

    return run(s, inputCSV)
}