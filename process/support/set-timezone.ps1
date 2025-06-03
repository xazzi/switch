# Get the current date/time
$now = Get-Date

# Get the current timezone object
$tz = Get-TimeZone

# Get current offset including DST
$offset = $tz.GetUtcOffset($now).TotalHours

# Write offset to a file accessible by Switch
$path = "C:\Switch\Support\SwitchTimezoneOffset.txt"
Set-Content -Path $path -Value $offset

# Output current UTC offsets including DST
$timezones = @(
    @{ Name = "UTC"; Offset = 0 },
    @{ Name = "MST"; Offset = ([System.TimeZoneInfo]::FindSystemTimeZoneById("Mountain Standard Time")).GetUtcOffset((Get-Date)).TotalHours },
    @{ Name = "PST"; Offset = ([System.TimeZoneInfo]::FindSystemTimeZoneById("Pacific Standard Time")).GetUtcOffset((Get-Date)).TotalHours },
    @{ Name = "EST"; Offset = ([System.TimeZoneInfo]::FindSystemTimeZoneById("Eastern Standard Time")).GetUtcOffset((Get-Date)).TotalHours }
)

# Save as JSON
$timezones | ConvertTo-Json | Set-Content -Path "C:\Switch\Support\SwitchTimezoneOffset.json"