# Preparation only: this script never runs a real db push.
$ErrorActionPreference = 'Stop'
$projectRef = 'zcnfssihiqmbrlwvlsme'
$repository = Split-Path -Parent $PSScriptRoot
function Invoke-SupabaseChecked {
    & npx.cmd --no-install supabase @args
    if ($LASTEXITCODE -ne 0) {
        throw 'Supabase CLI failed. Stop here; do not apply or repair migration history.'
    }
}
Push-Location -LiteralPath $repository
try {
    if (-not (Test-Path -LiteralPath 'supabase/config.toml')) {
        throw 'Existing Supabase project configuration not found.'
    }
    & node scripts/check-migration-manifest.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Audited migration manifest does not match.' }
    Invoke-SupabaseChecked --version
    Invoke-SupabaseChecked link --project-ref $projectRef
    Invoke-SupabaseChecked migration list "--remote=$projectRef"
    Invoke-SupabaseChecked db query "--remote=$projectRef" --read-only --file scripts/migrations/preflight.sql
    Invoke-SupabaseChecked db push "--remote=$projectRef" --dry-run --skip-vault
    Write-Host 'Preparation succeeded. Review the history, preflight, backup and dry-run before any application.'
    Write-Host 'No real db push was executed by this script.'
} finally {
    Pop-Location
}
