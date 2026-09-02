@echo off
echo firebase deploy --only hosting
npm run build
firebase deploy --only hosting
pause