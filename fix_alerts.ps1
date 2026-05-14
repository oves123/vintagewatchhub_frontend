$path = "d:\cashmitra\vintage-watch\vintagewatchhub_frontend\app\sell\page.js"
$content = Get-Content $path -Raw

$content = $content -replace 'alert\("You can choose a maximum of 2 listing options \(e\.g\., Buy It Now \+ Best Offer\)\."\)', "showToast(`"Max 2 listing options allowed (e.g., Buy Now + Best Offer).`", 'error')"

$content = $content -replace 'alert\("Indian Law requires a valid GST Number to ship goods across state borders\. Please update your profile or select ''Local State Only''\.\"\)', "showToast(`"GST Number required for Pan-India shipping. Please update your profile.`", 'error')"

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Done"
