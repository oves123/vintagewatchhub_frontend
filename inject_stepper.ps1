$profilePath = "d:\cashmitra\vintage-watch\vintagewatchhub_frontend\app\profile\page.js"
$snippetPath = "d:\cashmitra\vintage-watch\vintagewatchhub_frontend\stepper_snippet.txt"

$profileLines = [System.IO.File]::ReadAllLines($profilePath, [System.Text.Encoding]::UTF8)
$snippetLines = [System.IO.File]::ReadAllLines($snippetPath, [System.Text.Encoding]::UTF8)

# Insert AFTER line 970 (0-indexed = 969)
$insertAfter = 969

$before = $profileLines[0..$insertAfter]
$after  = $profileLines[($insertAfter + 1)..($profileLines.Length - 1)]

$newLines = $before + $snippetLines + $after

[System.IO.File]::WriteAllLines($profilePath, $newLines, [System.Text.Encoding]::UTF8)
Write-Host "Done. Total lines: $($newLines.Length)"
