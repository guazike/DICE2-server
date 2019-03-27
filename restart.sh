ps aux | grep "BetGamesApp.js" | grep -v grep | awk '{print $2}' | xargs kill
sleep 1
nohup node BetGamesApp.js > output.log 2>&1 &
