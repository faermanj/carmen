#!/usr/bin/env osascript -l JavaScript

var replacements = {
  9200: "&#x23F0;",
  8217: "&#x27;",
  13: "\n",
  8211: "-",
  8220: '"',
  8221: '"',
  8234: " ",
  8230: "...",
  243: "&oacute;",
  237: "&iacute;",
  233: "&eacute;",
  225: "&aacute;",
  241: "&ntilde;",
  250: "&uacute;",
  227: "&atilde;",
  234: "&ecirc;",
  231: "&ccedil;",
  245: "&otilde;",
  224: "&agrave;", //TODO
  191: "¿",
  170: "a",
  183: ".",
  180: "'",
  8364: "EUR"
};

String.prototype.sanitizeEncoding = function () {
  var str = this;
  var result = "";
  for (j = 0; j < str.length; j++) {
    var char = str[j];
    var code = char.charCodeAt(0);
    var replacement = replacements[code];
    //console.log(`${char} = ${code}`);
    if (replacement) {
      result += replacement;
    } else {
      if (code < 32 || code > 128)
        console.log(`Missed encoding ${char} = ${code}`);
      result += char;
    }
  }
  return result;
};

String.prototype.sanitizeKeyValue = function () {
  var result = "";
  var lines = this.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var pos = line.indexOf(":");
    if (pos > 0) {
      var key = line.substr(0, pos).trim();
      var value = line.substr(pos + 1, line.length).trim();
      if (key.indexOf(" ") > 0 || value.startsWith("/")) {
        result += `${line}`;
      } else {
        validate(key, value);
        result += `${key}: "${value}"`;
      }
    } else {
      result += `${line}`;
    }
    if (i + 1 < lines.length) {
      result += `\n`;
    }
  }
  return result;
};

String.prototype.sanitize = function sanitize() {
  return `${this}`.sanitizeEncoding().sanitizeKeyValue();
};

function toPacificTime(dt) {
  //TODO: Convert timezones properly
  var pt = new Date(dt.getTime());
  pt.setHours(pt.getHours() - 9);
  return pt;
}

var MAX_SOCIAL = 116;
function validate(key, value) {
  if (key.endsWith("social") && value.length > MAX_SOCIAL) {
    console.log(`WARNING: ${key} is too long (${value.length})`);
  }
}

function pad00(x) {
  return x < 10 ? `0${x}` : `${x}`;
}

function writeFile(event, outDir, app) {
  var fileExt = "markdown";

  var eventId = event.id();
  var eventYAML = toYAML(event);

  var startTime = event.startTime();
  var day = pad00(startTime.getDate());
  var month = pad00(startTime.getMonth() + 1);
  var year = `${startTime.getFullYear()}`;
  var yamlLen = `${eventYAML}`.length + 1000000;
  var filleName = `${year}-${month}-${day}-${eventId}-${yamlLen}.${fileExt}`;
  var outFile = `${outDir}/${filleName}`;
  try {
    var openedFile = app.openForAccess(Path(outFile), {
      writePermission: true
    });
    app.setEof(openedFile, { to: 0 });
    app.write(eventYAML, {
      to: openedFile,
      startingAt: app.getEof(openedFile)
    });
    app.closeAccess(openedFile);
    console.log(outFile);
    return true;
  } catch (error) {
    try {
      console.log(outfile);
      console.log(error);
      app.closeAccess(outFile);
    } catch (error) {
      console.log(`Couldn't close file: ${error}`);
    }
    return false;
  }
}

function jkDate(dt, off) {
  var day = pad00(dt.getDate());
  var month = pad00(dt.getMonth() + 1);
  var year = `${dt.getFullYear()}`;
  var hour = pad00(dt.getHours());
  var min = pad00(dt.getMinutes());
  var result = `${year}-${month}-${day}`;
  return result;
}

function toYAML(event) {
  var emmitEvent = false;
  var eventOut = "";
  eventOut += "---\n";
  eventOut += "layout: carmen_post\n";
  eventOut += `event_id: ${event.id()}\n`;
  eventOut += `title:  "${event.subject().sanitize()}"\n`;
  eventOut += `date:   ${jkDate(event.startTime(), event.timezone().offset)}\n`;
  eventOut += `start_date: ${jkDate(event.startTime())}\n`;
  eventOut += `end_date: ${jkDate(event.endTime())}\n`;
  eventOut += `start_time: ${event.startTime()}\n`;
  eventOut += `start_time_seattle: ${toPacificTime(event.startTime())}\n`;
  eventOut += `end_time: ${event.endTime()}\n`;
  eventOut += `timezone_name: ${event.timezone().name}\n`;
  eventOut += `timezone_offset: ${event.timezone().offset}\n`;
  if (event.location())
    eventOut += `location: ${event.location().sanitize()}\n`;
  eventOut += `categories: `;
  var categories = event.categories();
  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i].name().toLowerCase();
    eventOut += `${cat}`;
    if (i < categories.length - 1) eventOut += ", ";
  }
  eventOut += "\n";

  const eventText = `${event.plainTextContent().sanitize()}`;
  if (!eventText.match("---")) eventOut += "---";

  eventOut += eventText;
  if (event.id() == "3861") {
    console.log();
    console.log(eventOut);
    //throw new Error("Something went badly wrong!");
  }
  return eventOut;
}



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

function cal2yaml() {
  ObjC.import("stdlib");
  var outDir = getEnv("CARMEN_OUT", "/Users/faermanj/.carmen/outlook/");
  var categories = getEnv("CARMEN_CATEGORIES", "Twitch,Event").split(",");
  var now = new Date();
  var from = now; //new Date(Date.UTC(now.getFullYear(), 9, 1, 0, 0, 0, 0));
  var outlook = Application("Microsoft Outlook");
  var events = outlook.calendarEvents();
  var app = Application.currentApplication();
  app.includeStandardAdditions = true;
  for (var eventId in events) {
    var event = events[eventId];
    var eventStart = new Date(event.startTime());
    if (eventStart > from && hasCategory(event, categories))
      writeFile(event, outDir, app);
  }
}

cal2yaml();
