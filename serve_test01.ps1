$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = $null
$port = $null

# Buscar un puerto libre sin usar HttpListener/URLACL.
foreach ($candidate in 8765..8799) {
    try {
        $test = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $candidate)
        $test.Start()
        $listener = $test
        $port = $candidate
        break
    } catch {
        if ($test) {
            try { $test.Stop() } catch {}
        }
    }
}

if (-not $listener) {
    Write-Host ""
    Write-Host "No se encontro un puerto libre entre 8765 y 8799."
    Write-Host "Cerra otros servidores locales y volve a intentarlo."
    Read-Host "Enter para salir"
    exit 1
}

function Get-MimeType([string]$path) {
    switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
        ".html" { return "text/html; charset=utf-8" }
        ".htm"  { return "text/html; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".wasm" { return "application/wasm" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif"  { return "image/gif" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }
        ".woff" { return "font/woff" }
        ".woff2"{ return "font/woff2" }
        ".ttf"  { return "font/ttf" }
        ".eot"  { return "application/vnd.ms-fontobject" }
        ".bin"  { return "application/octet-stream" }
        ".prg"  { return "application/octet-stream" }
        ".d64"  { return "application/octet-stream" }
        default { return "application/octet-stream" }
    }
}

function Send-Response($stream, [int]$status, [string]$statusText, [byte[]]$body, [string]$mime, [bool]$headOnly) {
    if ($null -eq $body) { $body = [byte[]]@() }
    $header = "HTTP/1.1 $status $statusText`r`n" +
              "Content-Type: $mime`r`n" +
              "Content-Length: $($body.Length)`r`n" +
              "Connection: close`r`n" +
              "Cache-Control: no-cache`r`n" +
              "`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    if (-not $headOnly -and $body.Length -gt 0) {
        $stream.Write($body, 0, $body.Length)
    }
    $stream.Flush()
}

$url = "http://127.0.0.1:$port/index.html"

Write-Host ""
Write-Host "LVLLVL TEST01"
Write-Host "Servidor local activo en:"
Write-Host $url
Write-Host ""
Write-Host "Deja esta ventana abierta mientras usas LVLLVL."
Write-Host "Para cerrar: Ctrl+C"
Write-Host ""

Start-Process $url

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 5000
            $client.SendTimeout = 10000
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)

            $requestLine = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                $client.Close()
                continue
            }

            # Consumir headers.
            while ($true) {
                $line = $reader.ReadLine()
                if ($null -eq $line -or $line -eq "") { break }
            }

            $parts = $requestLine.Split(" ")
            if ($parts.Length -lt 2) {
                Send-Response $stream 400 "Bad Request" ([Text.Encoding]::UTF8.GetBytes("Bad Request")) "text/plain; charset=utf-8" $false
                continue
            }

            $method = $parts[0].ToUpperInvariant()
            $rawPath = $parts[1].Split("?")[0]
            $headOnly = ($method -eq "HEAD")

            if ($method -ne "GET" -and -not $headOnly) {
                Send-Response $stream 405 "Method Not Allowed" ([Text.Encoding]::UTF8.GetBytes("Method Not Allowed")) "text/plain; charset=utf-8" $false
                continue
            }

            $rel = [System.Uri]::UnescapeDataString($rawPath).TrimStart("/")
            if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }

            # Evitar salir del directorio del paquete.
            $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
            $rootFull = [System.IO.Path]::GetFullPath($root)
            if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
                Send-Response $stream 403 "Forbidden" ([Text.Encoding]::UTF8.GetBytes("Forbidden")) "text/plain; charset=utf-8" $headOnly
                continue
            }

            if ((Test-Path $full) -and -not (Get-Item $full).PSIsContainer) {
                $bytes = [System.IO.File]::ReadAllBytes($full)
                Send-Response $stream 200 "OK" $bytes (Get-MimeType $full) $headOnly
            } else {
                Send-Response $stream 404 "Not Found" ([Text.Encoding]::UTF8.GetBytes("Not Found: $rel")) "text/plain; charset=utf-8" $headOnly
            }
        } catch {
            Write-Host "Request error: $($_.Exception.Message)"
        } finally {
            try { $client.Close() } catch {}
        }
    }
} finally {
    try { $listener.Stop() } catch {}
}
