parseDateParts = function(isoString){
    var date = new Date(Date.parse(isoString));
    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    var year = parseInt(isoString.substring(0, 4), 10);
    var month = parseInt(isoString.substring(5, 7), 10);
    var day = parseInt(isoString.substring(8, 10), 10);

    var paddedMonth = (month < 10) ? "0" + month : "" + month;
    var paddedDay = (day < 10) ? "0" + day : "" + day;

    return {
        iso: date,
        time: date.toString().split('T')[1],
        unixMs: date.getTime(),
        weekday: weekdays[date.getDay()-1],
        weekdayId: date.getDay(),
        year: year,
        month: paddedMonth,
        day: paddedDay,
        strings:{
            monthDay: paddedMonth + "-" + paddedDay,
            yearMonthDay: year + "-" + paddedMonth + "-" + paddedDay
        }
    };
}