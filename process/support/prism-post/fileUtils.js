// JSON payload file creator
createJsonPayload = function(s, xmlString, projectId) {
    var job = s.createNewJob();
    var path = job.createPathWithName(projectId + ".json", false);
    var f = new File(path);
        f.open(File.Append);
        f.writeLine('{');
        f.writeLine('"xml_id": "' + projectId + '",');
        f.writeLine('"xml": "' + xmlString.replace(/"/g, '\"') + '"');
        f.write('}');
        f.close();
    return path;
}