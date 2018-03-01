var app = Application.currentApplication()
app.includeStandardAdditions = true

function arguments() {
    ObjC.import('Foundation')
    var args = $.NSProcessInfo.processInfo.arguments
    var argv = [];
    var argc = args.count;
    for (var i = 0; i < argc; i++) {
        argv.push(ObjC.unwrap(args.objectAtIndex(i)));
    }
    delete args;
    return argv;
}

function exit(code) {
    ObjC.import('stdlib');
    $.exit(code);
}

function readFile(file) {
    var fileString = file.toString();
    return app.read(Path(fileString));
}

function getEnv(varName, defaultValue) {
    var result = "";
    try {
        ObjC.import("stdlib");
        result = $.getenv(varName);
    } catch (e) {
        console.log(e);
        result = defaultValue;
    }
    //console.log(`${varName} = ${result}`);
    return result;
}

module.exports.getEnv = getEnv
module.exports.readFile = readFile
module.exports.exit = exit
module.exports.arguments = arguments
