createJsonPayload = function(s, projectId, xmlPath) {
    var job = s.createNewJob();
    var path = job.createPathWithName(projectId + ".json", false);

    var xmlContent = File.read(xmlPath).replace(/\r?\n/g, '').replace(/"/g, '\\"');

    var f = new File(path);
        f.open(File.Append);
        f.writeLine('{');
        f.writeLine('"xml_id": "' + projectId + '",');
        f.writeLine('"xml": "' + xmlContent + '"');
        f.write('}');
        f.close();

    return path;
}