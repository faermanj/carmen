Renders your Microsoft Outlook calendar as CSV, HTML or any other handlebars template.

Remote:

curl -sL https://github.com/jfaerman/carmen/releases/download/v0.1/cal2bar-0.1.js |  osascript -l JavaScript

Local:

npm run build && osascript -l JavaScript ./target/cal2bar.js -f html -c "Event,Twitch" > ./target/out.html 2>&1 && open ./target/out.html
