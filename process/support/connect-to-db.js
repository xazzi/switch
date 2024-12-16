connectToDatabase_db = function(database){
	var dbConn = new DataSource();
		dbConn.connect(database,"bret.c","e4gPM^VJ(3t/K?D/");
	
	if(dbConn.isConnected()){
		return dbConn;
	}else{
		s.log(2, "Connection to " + database + " failed!");
		return;
	}
}

establishDatabases = function(s, module){
	return db = {
        settings: connectToDatabase_db(module.database.imposition + "_settings"),
        history: connectToDatabase_db(module.database.imposition + "_history"),
        email: connectToDatabase_db(module.database.imposition + "_emails")
    }
}