<#
    build-css.ps1 — склеивает стили в один файл для публикации.

    В разработке main.css подключает остальные файлы через @import: удобно
    править, но браузер грузит их цепочкой — каждый @import ждёт предыдущий.
    Перед выкладкой имеет смысл склеить всё в один запрос.

    Запуск:  powershell -ExecutionPolicy Bypass -File tools\build-css.ps1

    Результат: assets/css/main.build.css
    Чтобы сайт им пользовался, в index.html замените
        assets/css/main.css   →   assets/css/main.build.css

    Скрипт разворачивает @import рекурсивно и оставляет комментарий-метку
    перед каждым вставленным файлом, чтобы в собранном виде было понятно,
    откуда взялся блок.
#>

$ErrorActionPreference = 'Stop'

$Root  = Split-Path -Parent $PSScriptRoot
$CssIn = Join-Path $Root 'assets\css\main.css'
$Out   = Join-Path $Root 'assets\css\main.build.css'

$seen = New-Object System.Collections.Generic.HashSet[string]

function Expand-Css {
    param([string]$Path)

    $full = [System.IO.Path]::GetFullPath($Path)
    if (-not $seen.Add($full)) {
        return "/* пропущено (уже включено): $([System.IO.Path]::GetFileName($full)) */`n"
    }
    if (-not (Test-Path -LiteralPath $full)) {
        Write-Warning "нет файла: $full"
        return ""
    }

    $text = [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
    $dir  = Split-Path -Parent $full
    $sb   = New-Object System.Text.StringBuilder

    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("/* ===== $([System.IO.Path]::GetFileName($full)) ===== */")

    foreach ($line in $text -split "`r?`n") {
        $m = [regex]::Match($line, '^\s*@import\s+url\(["'']?([^"''\)]+)["'']?\)\s*;')
        if ($m.Success) {
            [void]$sb.Append((Expand-Css (Join-Path $dir $m.Groups[1].Value)))
        } else {
            [void]$sb.AppendLine($line)
        }
    }

    return $sb.ToString()
}

$header = @"
/* Собрано автоматически: tools/build-css.ps1
   Не редактируйте этот файл — правьте исходники в assets/css/ и пересоберите. */
"@

$result = Expand-Css $CssIn

# Комментарии нужны в исходниках, а не в том, что скачивает посетитель.
# Вырезаются только блоки /* ... */ — в этих стилях нет строк и url(),
# внутри которых такая последовательность могла бы встретиться.
$result = [regex]::Replace($result, '/\*.*?\*/', '', 'Singleline')

# После вырезания остаются пустые строки — схлопываем.
$result = [regex]::Replace($result, '(?m)^[ \t]*\r?\n', '')

$result = $header + "`n" + $result

$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($Out, $result, $enc)

$kb = [math]::Round((Get-Item $Out).Length / 1KB, 1)
$parts = $seen.Count
Write-Host "Готово: assets/css/main.build.css — $kb KB, файлов склеено: $parts" -ForegroundColor Green
Write-Host "Чтобы использовать: в index.html замените main.css на main.build.css" -ForegroundColor Cyan
