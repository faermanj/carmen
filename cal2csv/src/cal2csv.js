var os = require("./jxa-os");

function output(record) {
    console.log(record);
}


function sanitize(field) {
    if (field == null) return '""';
    else if (field.toString().startsWith('"')) return field;
    else return field.toString().replace(",", ".")
};

function hasCategory(event, categories) {
    var evtcategories = event.categories();
    for (var i = 0; i < evtcategories.length; i++) {
        var evtcat = evtcategories[i].name().trim();
        for (var j = 0; j < categories.length; j++) {
            var ctg = categories[j].trim();
            if (ctg == evtcat) return true;
        }
    }
    return false;
}

function categoriesOf(event) {
    var result = "\"";
    var categories = event.categories();
    for (var i = 0; i < categories.length; i++) {
        var cat = categories[i].name();
        result += cat;
        if (i < categories.length - 1) result += ",";
    }
    result += "\"";
    return result;
}


function toRecord(user, event) {
    var record = "";
    function add(field) {
        if (record == "") {
            record += field;
        } else record += "," + sanitize(field);
    }
    add(user);
    add(event.id());
    add(event.subject());
    add(categoriesOf(event));
    add(event.startTime());
    add(event.endTime());
    add(event.timezone().name);
    add(event.timezone().offset);
    add(event.location());
    return record;
}

function cal2csv() {
    var user = os.getEnv("USER");
    var categories = ["Event", "Twitch"]
    var outlook = Application("Microsoft Outlook");
    var events = outlook.calendarEvents();
    for (var eventId in events) {
        var event = events[eventId];
        var record = toRecord(user, event);
        var isIncluded = hasCategory(event, categories);
        if (isIncluded) output(record);
    }
}

cal2csv();