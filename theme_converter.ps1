$searchPaths = @("app", "components")

$replacements = @(
    @{ Old = "bg-[#f7f7f7]"; New = "bg-background" },
    @{ Old = "text-[#191919]"; New = "text-foreground" },
    @{ Old = "min-h-screen pb-20 font-sans text-foreground"; New = "min-h-screen pb-20 font-sans text-foreground transition-colors duration-500" },
    @{ Old = "bg-[#f4f4f4]"; New = "bg-background" },
    @{ Old = "border-[#e5e7eb]"; New = "border-border" }
)

foreach ($path in $searchPaths) {
    $files = Get-ChildItem -Path $path -Recurse -Include *.js,*.jsx | Where-Object { $_.Name -ne "layout.js" -and $_.Name -ne "globals.css" }
    
    foreach ($file in $files) {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $originalContent = $content
        
        foreach ($r in $replacements) {
            $content = $content.Replace($r.Old, $r.New)
        }
        
        if ($content -ne $originalContent) {
            Write-Host "Updating $($file.FullName)"
            [IO.File]::WriteAllText($file.FullName, $content)
        }
    }
}
Write-Host "Additional theme updates complete."
