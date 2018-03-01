#!/bin/bash -e

echo "Reticulating Splines"
rm -rf target
mkdir -p target
echo "#!/usr/bin/env osascript -l JavaScript" > target/cal2bar.js 
echo 'window = this;' >> target/cal2bar.js 
browserify -t browserify-handlebars ./src/cal2bar.js >> target/cal2bar.js 
echo ';ObjC.import("stdlib");$.exit(0)' >> target/cal2bar.js 
chmod +x ./target/cal2bar.js
