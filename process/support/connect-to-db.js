establishDatabases = function(s, module){
    return db = {
        general: connectToDatabase_db(module.database.general),
        email: connectToDatabase_db(module.database.email)
    }
}