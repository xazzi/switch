getTimezoneInfo = function () {
    function timezones() {
        var localTime = new Date();
        var zoneOffsets = readOffsetsFromJson("C:/Switch/Support/SwitchTimezoneOffset.json");

        var times = {};
        for (var i = 0; i < zoneOffsets.length; i++) {
            var zone = zoneOffsets[i];
            var date = getAdjustedTime(localTime, zone.Offset, getLocalUtcOffset());
            times[zone.Name] = date.toString();
        }

        return times;
    }

    return timezones();
};

// Adjusts time from base time using the offset difference
function getAdjustedTime(baseTime, targetOffset, localOffset) {
    var msOffset = (targetOffset - localOffset) * 3600000;
    return new Date(baseTime.getTime() + msOffset);
}

// Reads a single local offset (used for calculating difference)
function getLocalUtcOffset() {
    return readOffsetFromFile("C:/Switch/Support/SwitchTimezoneOffset.txt");
}

// Reads single offset from .txt
function readOffsetFromFile(path) {
    var file = new File(path);
    if (!file.exists) throw "File not found: " + path;

    file.open(File.ReadOnly);
    var content = file.readLine();
    file.close();

    return parseFloat(content);
}

// Reads full list of timezones and offsets from JSON
function readOffsetsFromJson(path) {
    var file = new File(path);
    if (!file.exists) throw "JSON file not found: " + path;

    file.open(File.ReadOnly);
    var content = file.read();
    file.close();

    return JSON.parse(content);
}
