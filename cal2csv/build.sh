#!/bin/bash -e

echo "Reticulating Splines"
rm -rf target
mkdir -p target
echo "#!/usr/bin/env osascript -l JavaScript" > target/cal2csv.js 
echo 'window = this;' >> target/cal2csv.js 
browserify ./src/cal2csv.js >> target/cal2csv.js 
echo ';ObjC.import("stdlib");$.exit(0)' >> target/cal2csv.js 
chmod +x ./target/cal2csv.js
