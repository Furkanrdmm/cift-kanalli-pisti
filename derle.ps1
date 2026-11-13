# Yayın dosyasını derler ve sürüm adıyla kaydeder: cift_kanalli_pistiV<sürüm>.aab
Set-Location $PSScriptRoot
$surum = ((Select-String -Path android\app\build.gradle -Pattern 'versionName\s+"([^"]+)"').Matches[0].Groups[1].Value)
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Push-Location android
.\gradlew.bat bundleRelease "-Pandroid.overridePathCheck=true"
$sonuc = $LASTEXITCODE
Pop-Location
if ($sonuc -ne 0) { exit $sonuc }
$klasor = 'android\app\build\outputs\bundle\release'
Move-Item "$klasor\app-release.aab" "$klasor\cift_kanalli_pistiV$surum.aab" -Force
Write-Host "Hazir: $klasor\cift_kanalli_pistiV$surum.aab"
