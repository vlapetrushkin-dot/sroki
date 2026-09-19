<#
    build-media.ps1 — готовит исходники работ к вебу.

    Исходники (фото из Studio, записи экрана, mp3) весят десятки мегабайт
    и лежат вне проекта. Скрипт приводит их к единому виду и раскладывает
    в assets/media/works.

    Что делает:
      картинки  → jpg, ширина до 1600 (полный размер) и до 800 (превью)
      видео     → mp4 h264, высота до 720, без звуковой дорожки,
                  с обрезкой интерфейса Studio там, где он попал в кадр,
                  плюс постер-кадр jpg
      аудио     → mp3 128 kbps без обложки

    Манифест ниже — заодно документация: видно, из какого файла выросла
    каждая работа. Добавляете работу — дописываете строку и запускаете:

        powershell -ExecutionPolicy Bypass -File tools\build-media.ps1

    Требуется ffmpeg в PATH.
#>

$ErrorActionPreference = 'Stop'

$Src  = 'C:\Users\Admin\Desktop\Новая папка (6)'
$Root = Split-Path -Parent $PSScriptRoot
$Out  = Join-Path $Root 'assets\media\works'

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw 'ffmpeg не найден в PATH'
}

New-Item -ItemType Directory -Force -Path $Out | Out-Null

# --- Картинки: исходник → имя на выходе -----------------------------------
$images = @(
    @{ src = 'Билдинг\content.png';                      out = 'building-construction' }
    @{ src = 'Билдинг\photo_2026-09-14_23-25-08.jpg';    out = 'building-forest-1' }
    @{ src = 'Билдинг\photo_2026-09-14_23-25-08 (2).jpg'; out = 'building-forest-2' }
    @{ src = 'GUI\con33tent.png';                        out = 'gui-shooter' }
    @{ src = 'GUI\153513.jpg';                           out = 'gui-stylized' }
    @{ src = 'модели\ima111ge.png';                      out = 'model-helmet' }
    @{ src = 'модели\im5age.png';                        out = 'model-grenade' }
    @{ src = 'модели\imag4e.png';                        out = 'model-crate' }
    @{ src = 'модели\imag12e.png';                       out = 'model-planks' }
    @{ src = 'модели\ima4242ge.png';                     out = 'model-bottle' }
    @{ src = 'модели\imag22e.png';                       out = 'model-bar' }
    @{ src = 'модели\imag11e.png';                       out = 'model-locker' }
    @{ src = 'модели\photo_2026-09-20_02-27-42.jpg';     out = 'model-unicorn' }
    @{ src = 'модели\im5353age.png';                     out = 'model-guardian' }
    @{ src = 'VFX\сайты (4).png';                        out = 'vfx-fireslash' }
    @{ src = 'VFX\ima6ge.png';                           out = 'vfx-blood-1' }
    @{ src = 'VFX\photo_2026-51307-03_09-15-52.jpg';     out = 'vfx-blood-2' }
    @{ src = 'Код\photo_2026-09-16_17-05-07.jpg';        out = 'code-rojo' }
)

# --- Видео. crop = "ш:в:x:y" отрезает интерфейс Studio, poster — секунда кадра
$videos = @(
    @{ src = 'VFX\vfx-demo-2 — копия.mp4';                out = 'vfx-fireslash';  crop = $null;              poster = 1 }
    @{ src = 'VFX\Запись 2026-09-18 002918.mp4';          out = 'vfx-magic';      crop = '1204:718:8:203';   poster = 20 }
    @{ src = 'VFX\bandicam 2026-07-08 16-19-19-030.mp4';  out = 'vfx-beam';       crop = '1632:800:0:171';   poster = 2 }
    @{ src = 'Код\Запись 2026-09-16 170411.mp4';          out = 'code-voidfall';  crop = '1544:728:10:208';  poster = 12 }
)

# --- Аудио -----------------------------------------------------------------
$audio = @(
    @{ src = 'Музыка\Still Waters.mp3';            out = 'music-still-waters' }
    @{ src = 'Музыка\Still Waters (1).mp3';        out = 'music-still-waters-alt' }
    @{ src = 'SFX\атака_босса_колья.mp3';          out = 'sfx-boss-spikes' }
    @{ src = 'SFX\ряд_ьыстрых_аттак босса.mp3';    out = 'sfx-boss-combo' }
    @{ src = 'SFX\бас3.mp3';                       out = 'sfx-bass' }
)

function Get-Kb($path) { [math]::Round((Get-Item -LiteralPath $path).Length / 1KB) }

Write-Host "`n=== Картинки ===" -ForegroundColor Cyan
foreach ($i in $images) {
    $in = Join-Path $Src $i.src
    if (-not (Test-Path -LiteralPath $in)) { Write-Host "  пропуск (нет файла): $($i.src)" -ForegroundColor Yellow; continue }

    $full  = Join-Path $Out "$($i.out).jpg"
    $thumb = Join-Path $Out "$($i.out)-thumb.jpg"

    # scale с min(): меньшие картинки не растягиваем, -2 держит чётную сторону
    & ffmpeg -v error -y -i $in -vf "scale='min(1600,iw)':-2:flags=lanczos" -q:v 4 $full
    & ffmpeg -v error -y -i $in -vf "scale='min(800,iw)':-2:flags=lanczos"  -q:v 5 $thumb
    Write-Host ("  {0,-26} {1,5} KB / превью {2,4} KB" -f $i.out, (Get-Kb $full), (Get-Kb $thumb))
}

Write-Host "`n=== Видео ===" -ForegroundColor Cyan
foreach ($v in $videos) {
    $in = Join-Path $Src $v.src
    if (-not (Test-Path -LiteralPath $in)) { Write-Host "  пропуск (нет файла): $($v.src)" -ForegroundColor Yellow; continue }

    $mp4    = Join-Path $Out "$($v.out).mp4"
    $poster = Join-Path $Out "$($v.out)-poster.jpg"

    $chain = @()
    if ($v.crop) { $chain += "crop=$($v.crop)" }
    $chain += "scale='min(1280,iw)':-2:flags=lanczos"
    $vf = $chain -join ','

    # -an: во всех записях экрана звук либо отсутствует, либо не нужен
    & ffmpeg -v error -y -i $in -vf $vf -c:v libx264 -preset medium -crf 27 `
        -pix_fmt yuv420p -movflags +faststart -an $mp4
    & ffmpeg -v error -y -ss $v.poster -i $mp4 -frames:v 1 -q:v 4 $poster

    Write-Host ("  {0,-26} {1,6} KB / постер {2,4} KB" -f $v.out, (Get-Kb $mp4), (Get-Kb $poster))
}

Write-Host "`n=== Аудио ===" -ForegroundColor Cyan
foreach ($a in $audio) {
    $in = Join-Path $Src $a.src
    if (-not (Test-Path -LiteralPath $in)) { Write-Host "  пропуск (нет файла): $($a.src)" -ForegroundColor Yellow; continue }

    $mp3 = Join-Path $Out "$($a.out).mp3"
    # -vn убирает встроенную обложку
    & ffmpeg -v error -y -i $in -vn -c:a libmp3lame -b:a 128k $mp3
    Write-Host ("  {0,-26} {1,6} KB" -f $a.out, (Get-Kb $mp3))
}

$total = (Get-ChildItem $Out -File | Measure-Object Length -Sum).Sum / 1MB
Write-Host ("`nГотово. Всего в assets/media/works: {0:N1} MB" -f $total) -ForegroundColor Green
