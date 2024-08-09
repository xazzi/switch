generateSqlStatement_Insert = function(s, table, array){

    function run(s, table, array){

        var headerArray = []
        var valueArray = []

        for(var i in array){
            headerArray.push("`" + array[i][0] + "`");
            valueArray.push("'" + array[i][1] + "'");
        }
        headerArray.join(',').toString()
        valueArray.join(',').toString()

        return "INSERT INTO " + table + "(" + headerArray + ") VALUE (" + valueArray + ");";
    }

    return run(s, table, array)
}

generateSqlStatement_Update = function(s, table, query, array){

    function run(s, table, array){

        var setArray = []

        for(var i in array){
            setArray.push("`" + array[i][0] + "` = '" + array[i][1] + "'")
        }
        setArray.join(',').toString()

        return "UPDATE " + table + " SET " + setArray + " WHERE `" + query[0] + "` = '" + query[1] + "';";
    }

    return run(s, table, array)
}