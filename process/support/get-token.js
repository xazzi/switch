getNewToken = function(s, environment){
	function pingAPI(s, environment){
		var theHTTP = new HTTP( HTTP.SSL );
			if(environment == "QA"){
				theHTTP.addParameter( "client_secret", "abc123" );
				theHTTP.url = "https://oauth2.driqa.site/oauth2";
			}else{
				theHTTP.addParameter( "client_secret", "L6Zat4#Iu5VtL#hi" );
				theHTTP.url = "https://oauth2.digitalroom.com/oauth2"
			}
			theHTTP.addParameter( "client_id", "bacon" );
			theHTTP.addParameter( "grant_type", "client_credentials" );
			theHTTP.addHeader( "Content-Type", "application/x-www-form-urlencoded;charset=UTF-8" );
			theHTTP.timeOut = 300;
			theHTTP.post();
		
		while(!theHTTP.waitForFinished(10)){
			s.log(5, "Downloading token data...", theHTTP.progress());
		}
		
		var theFinishedStatus = theHTTP.finishedStatus; // Statuses: Ok, Failed, Interrupted
		var theServerResponse = theHTTP.getServerResponse().toString();
		
		if(theFinishedStatus == HTTP.Ok && !ErrorExists(theServerResponse)){
			var theNewToken = JSON.parse(theServerResponse).access_token;			  
			//s.log(1, "Token GET: Success!");
			return theNewToken;
		}else if(theFinishedStatus == HTTP.Failed || ErrorExists(theServerResponse)){
			s.log(3, "Token GET: Failed: " + theHTTP.lastError);
			return false;
		}else{
			s.log(3, "Token GET: Unknown: " + theServerResponse);
			return false;
		}
		
		function ErrorExists(inMessage){
			var theError = inMessage.find("error");
			return theError >= 0;
		}
	}
	return contents = pingAPI(s, environment)
}