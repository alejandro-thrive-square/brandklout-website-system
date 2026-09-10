@echo off
rem Pull the domain-locked Vimeo clips. Vimeo refuses VPN and datacenter IPs,
rem so run this with NordVPN disconnected, then reconnect. Clips already on disk
rem are skipped; the rest land in ..\media-library\vimeo\ and vimeo.json is rewritten.
cd /d "%~dp0"
echo.
echo Public network (must NOT be NordVPN / Clouvider / a datacenter):
curl -s https://ipinfo.io/org
echo.
echo.
node vimeo.mjs
node inventory.mjs
echo.
echo Done. Reconnect the VPN and tell Claude.
pause
