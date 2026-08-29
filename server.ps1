$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:" + $port + "/")
$listener.Prefixes.Add("http://127.0.0.1:" + $port + "/")

try {
    $listener.Start()
} catch {
    Write-Host "Port $port is busy or unavailable."
    exit 1
}

Write-Host "=========================================="
Write-Host "Perxona AI Avatar Studio Server Running!"
Write-Host "URLs:"
Write-Host "  - http://localhost:$port/"
Write-Host "  - http://127.0.0.1:$port/"
Write-Host "=========================================="

$mimeMap = @{
    ".html" = "text/html; charset=utf-8";
    ".htm"  = "text/html; charset=utf-8";
    ".css"  = "text/css; charset=utf-8";
    ".js"   = "application/javascript; charset=utf-8";
    ".mjs"  = "application/javascript; charset=utf-8";
    ".json" = "application/json; charset=utf-8";
    ".png"  = "image/png";
    ".jpg"  = "image/jpeg";
    ".jpeg" = "image/jpeg";
    ".svg"  = "image/svg+xml";
    ".ico"  = "image/x-icon"
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }
        
        $relPath = $path.TrimStart("/").Replace("/", "\")
        $localPath = Join-Path $root $relPath

        if (Test-Path $localPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = $mimeMap[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }

            $response.ContentType = $contentType
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $buffer = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # ignore error during termination
    }
}
