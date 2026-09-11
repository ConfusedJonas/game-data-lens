@echo off
cd /d "%~dp0"
echo Game Data Lens is available at http://127.0.0.1:4173
echo Close this window to stop the site.
python -m http.server 4173 --bind 127.0.0.1 --directory dist
