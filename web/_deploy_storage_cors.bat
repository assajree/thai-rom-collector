@echo off
echo gcloud storage buckets update gs://thai-rom-db.firebasestorage.app --cors-file=..\storage.cors.json
gcloud storage buckets update gs://thai-rom-db.firebasestorage.app --cors-file=..\storage.cors.json
pause
