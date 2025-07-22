// Prism POST utility
postToPrismApi = function(s, config, jsonPath) {
    var token = getNewToken(s, config.prismEndpoint); // Assumes getNewToken is globally available
    var url = config.prismEndpoint === "qa"
        ? "https://qa-create-gang-api.digitalroom.com/xml-receiver"
        : "https://create-gang-api.digitalroom.com/xml-receiver";

    var http = new HTTP(HTTP.SSL);
        http.url = url;
        http.authScheme = HTTP.OauthAuth;
        http.addHeader("Authorization", "Bearer " + token);
        http.addHeader("Content-Type", "application/json");
        http.setAttachedFile(jsonPath);
        http.timeOut = 300;
        http.post();

    while (!http.waitForFinished(10)) {
        s.log(5, "Posting to Prism...", http.progress());
    }

    File.remove(jsonPath);

    if (http.finishedStatus === HTTP.Failed || http.statusCode !== 200) {
        s.log(3, "POST Failed: " + http.lastError);
        return "Fail";
    } else {
        return "Success";
    }
}
