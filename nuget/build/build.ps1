Param($version)

# Check version number set
if ($version -Eq $null) {
    $version = Read-Host "Enter Version Number"
}

$currentPath = (Get-Location).Path
$libPath = "$currentPath\lib"
$sourcePath = "$currentPath\..\..\source"
$destinationPath = "$currentPath\..\Packages\$version"

# Create Package Structure
New-Item -Path "$destinationPath" -Type directory
Copy-Item -Path "$currentPath\..\jQuery.filedrop.nuspec" -Destination "$destinationPath\jQuery.filedrop.nuspec"

# Compress JS
[System.Reflection.Assembly]::LoadFrom("$libPath\YuiCompressor\Yahoo.Yui.Compressor.dll")
$compressor = New-Object -TypeName Yahoo.Yui.Compressor.JavaScriptCompressor

$sources = Get-ChildItem -Path $sourcePath -Include "*.js" -Recurse

$destinationScriptsPath="$destinationPath\Content\Scripts"
New-Item -Path $destinationScriptsPath -Type directory

foreach($source in $sources) {
    # Copy source
    $sourceName = $source.Name
    $destination = "$destinationScriptsPath\$sourceName"
    Copy-Item -Path $source -Destination $destination

    # Create minified version
    $destinationMin = $destination.Replace(".js", ".min.js")
    $destinationContent = [System.IO.File]::ReadAllText($destination)

    $destinationMinContent = $compressor.Compress($destinationContent)

    [System.IO.File]::WriteAllText($destinationMin, $destinationMinContent)
}

set-alias nuget $libPath\NuGet.exe
nuget pack "$destinationPath\jQuery.filedrop.nuspec" -Properties version=$version -OutputDirectory "$destinationPath"

#read-host "Press enter to close..."