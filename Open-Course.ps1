param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$courseRoot = $PSScriptRoot
$courseUrl = 'http://127.0.0.1:50101/course/'
$healthUrl = 'http://127.0.0.1:50101/course-health'
function Test-CourseServer {
    try {
        $courseHealth = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
        return $courseHealth.app -eq 'cv-maths-course' -and $courseHealth.root -eq $courseRoot
    } catch { return $false }
}
if (-not (Test-CourseServer)) {
    $coursePython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
    if (-not (Test-Path -LiteralPath $coursePython)) {
        $coursePython = (Get-Command python -ErrorAction SilentlyContinue).Source
    }
    if (-not $coursePython) { throw 'Python was not found. Open course\index.html directly instead.' }
    $courseServer = Join-Path $courseRoot 'course\serve_course.py'
    Start-Process -FilePath $coursePython -ArgumentList @('"' + $courseServer + '"') -WorkingDirectory $courseRoot -WindowStyle Hidden
    $courseReady = $false
    for ($courseAttempt=0;$courseAttempt -lt 20;$courseAttempt++) {
        if (Test-CourseServer) { $courseReady=$true;break }
        Start-Sleep -Milliseconds 250
    }
    if (-not $courseReady) { throw 'The course could not start on port 50101. Open course\index.html directly instead.' }
}
if (-not $NoBrowser) { Start-Process $courseUrl }
Write-Output $courseUrl
