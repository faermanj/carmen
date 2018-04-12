var os = require("./jxa-os");
var util = require("./jxa-util")
var program = require('commander');

var fmts = {
    "csv": "{{#each events}}\n{{id}},{{subject}},{{startStr}}\n{{/each}}",
    "html": '{{#each events}}\n<p>\n<b><a href="">{{subject}}</a><b>\n<br/>\nDate: {{startStr}}\n<br/>\nLocation: {{location}}\n</p>\n{{/each}}'
}

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
    if (categories.length == 0) return true;
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
    var result = "";
    var categories = event.categories();
    for (var i = 0; i < categories.length; i++) {
        var cat = categories[i].name().toLowerCase();
        result += cat;
        if (i < categories.length - 1) result += ",";
    }
    result += "";
    return result;
}

function categoryOf(event) {
    var categories = event.categories();
    return categories.length && categories[0].name().toLowerCase();
}

function contains(str, match) {
    if ((!str) || (!match)) return false;
    var arr = match;
    if (!Array.isArray(arr))
        arr = [arr];
    for (var i = 0; i < arr.length; i++) {
        var currMatch = arr[i];
        var contains = str.toLowerCase().indexOf(currMatch.toLowerCase()) > -1;
        if (contains) return true;
    }
}

function regionOf(location) {
    if (contains(location, ["usa", "canada"])) return "Americas";
    if (contains(location, "singapore")) return "APAC";
    if (contains(location, ["spain", "portugal", "sweden"])
    ) return "EMEA";
    if (contains(location, "china")) return "China";
    if (contains(location, "japan")) return "Japan";
    return "WW";
}

function isEngagement(event) {
    var categories = categoriesOf(event);
    var isEngagement = contains(categories, "event")
        || contains(categories, "pr")
        || contains(categories, "ar")
        || contains(categories, "webinar")
        || contains(categories, "twitch");
    return isEngagement;
}

function px(event) {
    var subject = event.subject();
    var m = /(\d+)px/.exec(subject);
    return m ? m[1] : 0;
}

function titleOf(str) {
    var newstr = str && str.replace(/\[(.+?)\]/g, "").trim();
    return newstr;
}

function flatten(event, globals) {
    var nowYear = globals.now.getFullYear();
    var startTime = event.startTime();
    var startDate = startTime && startTime.getDate();
    var startMonth = startTime && util.monthName(startTime.getMonth());
    var startYear = startTime && startTime.getFullYear();
    var startStr = startMonth + " " + startDate + " " + startYear;
    var startISO = startTime && startTime.toISOString();
    var startISODate = startISO && startISO.substring(0, 10);
    var isFuture = new Date(event.startTime()) > globals.now;
    var isPast = !isFuture;
    var isCurrentYear = nowYear == startYear;
    var title = titleOf(event.subject());
    return {
        id: event.id(),
        categories: categoriesOf(event),
        category: categoryOf(event),
        isEngagement: isEngagement(event),
        isFuture: isFuture,
        isPast: isPast,
        isCurrentYear: isCurrentYear,
        px: px(event),
        startTime: startTime,
        startDate: startDate,
        startMonth: startMonth,
        startYear: startYear,
        startStr: startStr,
        startISO: startISO,
        startISODate: startISODate,
        subject: event.subject(),
        endTime: event.endTime(),
        title: title,
        tzName: event.timezone().name,
        tzOffset: event.timezone().offset,
        user: globals.user,
        location: event.location(),
        region: regionOf(event.location())
    }
}

function list(val) {
    return val.split(',');
}

function compare(a, b) {
    return a.startTime.getTime() - b.startTime.getTime();
}

function allEvents() {
    var outlook = Application("Microsoft Outlook");
    var events = outlook.calendarEvents();
    return events;
}

function filter(events, now, categories) {
    var eventsOut = [];
    var globals = {
        now: now,
        user: os.getEnv("USER")
    }
    for (var eventId in events) {
        var event = events[eventId];
        var hasCateg = hasCategory(event, categories);
        var isIncluded = hasCateg;
        if (isIncluded) eventsOut.push(flatten(event, globals));
    }
    return eventsOut;
}

function render(eventsOut, fmt) {
    var bars = require('handlebars');
    var context = {
        events: eventsOut
    };
    var source = os.readFile("./" + fmt + ".mustache") || fmts[fmt];
    var template = source && bars.compile(source);
    var result = "";
    if (source && template) {
        var result = template(context);
    } else {
        console.log("Failed to initialize handlebars for [" + fmt + "]");
    };
    return result;
}

function cal2bar() {
    var now = new Date();
    var arguments = os.arguments();
    program
        .option('-f, --format <format>', 'The format or template to use.', 'csv')
        .option('-c, --categories <categories>', 'The comma separated list of categories to include', list, [])
        .parse(arguments);
    var fmt = program.format;
    var categories = program.categories;
    var events = allEvents();
    var eventsOut = filter(events, now, categories).sort(compare);
    var result = render(eventsOut, fmt);
    console.log(result);
    os.exit(0);
}

cal2bar();
