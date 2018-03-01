var os = require("./jxa-os");


function pad00(x) {
    return x < 10 ? `0${x}` : `${x}`;
}

function dateOf(dt, off) {
    var day = pad00(dt.getDate());
    var month = pad00(dt.getMonth() + 1);
    var year = `${dt.getFullYear()}`;
    var result = `${year}-${month}-${day}`;
    return result;
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



function flatten(event) {
    return {
        id: event.id(),
        subject: event.subject(),
        categories: categoriesOf(event),
        startTime: event.startTime(),
        startDate: dateOf(event.startTime()),
        endTime: event.endTime(),
        tzName: event.timezone().name,
        tzOffset: event.timezone().offset,
        location: event.location()
    }
}

function cal2bar() {
    var eventsOut = [];
    var now = new Date();
    var arguments = os.arguments();
    //console.log(arguments);
    var user = os.getEnv("USER");
    var categories = ["Event", "Twitch"]
    var outlook = Application("Microsoft Outlook");
    var events = outlook.calendarEvents();
    for (var eventId in events) {
        var event = events[eventId];
        var hasCateg = hasCategory(event, categories);
        var isFuture = new Date(event.startTime()) > now;
        var isIncluded = isFuture && hasCateg;
        if (isIncluded) eventsOut.push(flatten(event));
    }
    var context = {
        now: now,
        events: eventsOut
    };
    var output = "html";
    var source = os.readFile("./" + output + ".template");
    var bars = require('handlebars');
    var template = bars.compile(source);
    var html = template(context);
    console.log(html);
    os.exit(0);
}

cal2bar();