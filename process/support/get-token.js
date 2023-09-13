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

getNewToken_phoenixProject = function(s, environment){
	function pingAPI(s, environment){
		var theHTTP = new HTTP(HTTP.SSL);

		var client_secret, client_id, url
		switch(environment){
			case "QA":
				client_secret = "1aenjvp9j89r8hl3hlljm55e9eda559jfij1hui8rq00lkg3ha6n";
				client_id = "5k718o5ifnhsftm96r4btvh2m0";
				url = "https://auth.digitalroomapi-qa.io/token";
			break;
			case "Stage":
				client_secret = "c0tmecsqmjcve53761s6q6h3qidv6ef15u18va9p1ebkffjbnkq";
				client_id = "1ni5pstli4d9jnisc07ee1da0f";
				url = "https://auth.digitalroomapi.io/oauth2/token"
			break;
			case "Production":
				client_secret = "c0tmecsqmjcve53761s6q6h3qidv6ef15u18va9p1ebkffjbnkq";
				client_id = "1ni5pstli4d9jnisc07ee1da0f";
				url = "https://auth.digitalroomapi.io/oauth2/token"
			break;
			default:
				return false
		}

			theHTTP.addParameter("client_secret", client_secret);
			theHTTP.addParameter("client_id", client_id);
			theHTTP.url = url
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