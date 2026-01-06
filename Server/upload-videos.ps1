# PowerShell script to upload videos to VPS
# This script will prompt for SSH password

$VPS_HOST = "31.97.116.89"
$VPS_USER = "root"
$CONTAINER_NAME = "xsgkgg808g0g4oso8cwgkkkk-155857619722"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "VIDEO UPLOAD TO VPS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Load match report
$reportPath = Join-Path $PSScriptRoot "video-match-report.json"

if (-not (Test-Path $reportPath)) {
    Write-Host "Error: video-match-report.json not found!" -ForegroundColor Red
    Write-Host "Please run: node match-videos-final.js" -ForegroundColor Yellow
    exit 1
}

$matchReport = Get-Content $reportPath | ConvertFrom-Json

Write-Host "Total matched videos: $($matchReport.matched.Count)" -ForegroundColor Green
Write-Host "Match rate: $($matchReport.matchRate)" -ForegroundColor Cyan
Write-Host ""

# Create staging directory
$stagingDir = Join-Path $PSScriptRoot "temp-video-staging"
if (Test-Path $stagingDir) {
    Remove-Item $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir | Out-Null

Write-Host "Preparing videos for upload..." -ForegroundColor Yellow
$copiedCount = 0
$videoList = @()

foreach ($video in $matchReport.matched) {
    $localPath = $video.localPath
    $fileName = Split-Path $localPath -Leaf
    $fileExt = [System.IO.Path]::GetExtension($fileName)

    # Create safe filename
    $safeFileName = "$($video.sku -replace '[^a-zA-Z0-9-]', '_')$fileExt"
    $stagingPath = Join-Path $stagingDir $safeFileName

    if (Test-Path $localPath) {
        Copy-Item $localPath $stagingPath
        $copiedCount++
        $videoList += @{
            safeFileName = $safeFileName
            productId = $video.productId
            sku = $video.sku
            productName = $video.productName
        }
    } else {
        Write-Host "  Skipped (not found): $fileName" -ForegroundColor Red
    }
}

Write-Host "Prepared $copiedCount videos" -ForegroundColor Green
Write-Host ""

# Save video list for database update
$videoList | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot "staged-videos.json")

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "MANUAL UPLOAD INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Videos are prepared in: $stagingDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "To upload, run these commands:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Upload videos to VPS (you'll be prompted for password):" -ForegroundColor White
Write-Host "   scp -r `"$stagingDir\*`" ${VPS_USER}@${VPS_HOST}:/tmp/product-videos/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. SSH into VPS (you'll be prompted for password):" -ForegroundColor White
Write-Host "   ssh ${VPS_USER}@${VPS_HOST}" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Once connected to VPS, run:" -ForegroundColor White
Write-Host "   docker cp /tmp/product-videos/. ${CONTAINER_NAME}:/app/uploads/products/videos/" -ForegroundColor Cyan
Write-Host "   rm -rf /tmp/product-videos" -ForegroundColor Cyan
Write-Host "   exit" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. After upload, run this to update database:" -ForegroundColor White
Write-Host "   node update-video-urls.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
