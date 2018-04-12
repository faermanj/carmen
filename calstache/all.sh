DATE=$(date "+%Y-%m-%d")
OUTFILE="$USER-$DATE.csv"
echo "Exporting to" $OUTFILE
npm run build ; ./target/calstache.js -f engagement > ./target/$OUTFILE 2<&1 ; cat ./target/$OUTFILE