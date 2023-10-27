establishDatabases = function(s){
    return db = {
        general: connectToDatabase_db(s.getPropertyValue("databases") == "other" ? s.getPropertyValue("databaseGeneral") : s.getPropertyValue("databases")),
        email: connectToDatabase_db(s.getPropertyValue("databases") == "other" ? s.getPropertyValue("databaseEmail") : s.getPropertyValue("databases"))
    }
}