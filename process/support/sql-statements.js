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
        var setQuery = []

        for(var i in array){
            setArray.push("`" + array[i][0] + "` = '" + array[i][1] + "'")
        }
        setArray = setArray.join(',').toString()

        for(var i in query){
            setQuery.push("`" + query[i][0] + "` = '" + query[i][1] + "'")
        }
        setQuery = setQuery.join(' AND ').toString()

        return "UPDATE " + table + " SET " + setArray + " WHERE " + setQuery + ";";
    }

    return run(s, table, array)
}