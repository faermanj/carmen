#!/bin/bash -e

echo "- Clean"
rm -rf target
mkdir -p target
echo "#!/usr/bin/env osascript -l JavaScript" > target/calstache.js 
echo 'window = this;' >> target/calstache.js 
browserify -t browserify-handlebars ./src/calstache.js >> target/calstache.js 
echo ';ObjC.import("stdlib");$.exit(0)' >> target/calstache.js 
chmod +x ./target/calstache.js
