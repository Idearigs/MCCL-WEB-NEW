# PowerShell script to upload 99 matched videos to VPS
# This script will prompt for SSH password

$VPS_HOST = "31.97.116.89"
$VPS_USER = "root"
$CONTAINER_NAME = "xsgkgg808g0g4oso8cwgkkkk-155857619722"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "VIDEO UPLOAD TO VPS - FINAL" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Load upload list
$uploadListPath = Join-Path $PSScriptRoot "upload-list-final.json"

if (-not (Test-Path $uploadListPath)) {
    Write-Host "Error: upload-list-final.json not found!" -ForegroundColor Red
    Write-Host "Please run: node prepare-upload-final.js" -ForegroundColor Yellow
    exit 1
}

$uploadList = Get-Content $uploadListPath | ConvertFrom-Json

Write-Host "Total matched videos: $($uploadList.totalVideos)" -ForegroundColor Green
Write-Host "Match rate: 93.4% (99 out of 106 BJ videos)" -ForegroundColor Cyan
Write-Host ""

# Create staging directory
$stagingDir = Join-Path $PSScriptRoot "temp-video-staging-final"
if (Test-Path $stagingDir) {
    Remove-Item $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir | Out-Null

Write-Host "Preparing videos for upload..." -ForegroundColor Yellow
$copiedCount = 0
$skippedCount = 0
$videoList = @()

foreach ($video in $uploadList.videos) {
    $localPath = $video.localPath
    $fileName = Split-Path $localPath -Leaf
    $fileExt = [System.IO.Path]::GetExtension($fileName)

    # Create safe filename using product SKU
    $safeFileName = "$($video.productSKU -replace '[^a-zA-Z0-9-]', '_')$fileExt"
    $stagingPath = Join-Path $stagingDir $safeFileName

    if (Test-Path $localPath) {
        Copy-Item $localPath $stagingPath
        $copiedCount++

        # Calculate file size
        $fileSizeMB = [math]::Round((Get-Item $localPath).Length / 1MB, 2)

        $videoList += @{
            safeFileName = $safeFileName
            productId = $video.productId
            productSKU = $video.productSKU
            productName = $video.productName
            originalFileName = $fileName
            fileSizeMB = $fileSizeMB
        }

        if ($copiedCount % 10 -eq 0) {
            Write-Host "  Prepared $copiedCount videos..." -ForegroundColor Gray
        }
    } else {
        Write-Host "  Skipped (not found): $fileName" -ForegroundColor Red
        $skippedCount++
    }
}

Write-Host ""
Write-Host "Preparation complete!" -ForegroundColor Green
Write-Host "  Copied: $copiedCount videos" -ForegroundColor Green
if ($skippedCount -gt 0) {
    Write-Host "  Skipped: $skippedCount videos (files not found)" -ForegroundColor Yellow
}

# Calculate total size
$totalSizeMB = ($videoList | Measure-Object -Property fileSizeMB -Sum).Sum
Write-Host "  Total size: $([math]::Round($totalSizeMB, 2)) MB" -ForegroundColor Cyan
Write-Host ""

# Save video list for database update
$videoList | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot "staged-videos-final.json")

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
Write-Host "   mkdir -p /tmp/product-videos" -ForegroundColor Cyan
Write-Host "   docker cp /tmp/product-videos/. ${CONTAINER_NAME}:/app/uploads/products/videos/" -ForegroundColor Cyan
Write-Host "   rm -rf /tmp/product-videos" -ForegroundColor Cyan
Write-Host "   exit" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. After upload, run this to update database:" -ForegroundColor White
Write-Host "   node update-video-urls-final.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SUMMARY OF EXCLUDED VIDEOS:" -ForegroundColor Yellow
Write-Host "  - BJ 054 I.mp4 (no matching product variant)" -ForegroundColor Gray
Write-Host "  - 118cbj.mp4, BJ 118CEJ.mp4, BJ118ccj.mp4," -ForegroundColor Gray
Write-Host "    BJ118cdj.mp4, BJ118cej.mp4, BJ119Cj.mp4" -ForegroundColor Gray
Write-Host "    (non-standard SKU format, no matching products)" -ForegroundColor Gray
Write-Host "  - P12.mp4, P13.mp4, PN 0931.mp4 (non-BJ products)" -ForegroundColor Gray
Write-Host ""
