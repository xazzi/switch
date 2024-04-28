establishDatabases = function(s, module){
    return db = {
        general: connectToDatabase_db(module.database.general),
        history: connectToDatabase_db(module.database.history),
        email: connectToDatabase_db(module.database.email)
    }
}