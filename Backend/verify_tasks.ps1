$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# 1. Login as Core Tester (EMP-2001)
$loginUrl = "http://localhost:3002/auth/login"
$loginBody = @{ employeeId = "EMP-2001"; password = "password123" } | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $loginBody -WebSession $session
    Write-Host "Login Successful. Role: $($loginResponse.user.role)"
} catch {
    Write-Host "Login Failed: $($_.Exception.Message)"
    exit
}

# 2. Fetch Tasks
$tasksUrl = "http://localhost:3002/api/tasks"
try {
    $tasks = Invoke-RestMethod -Uri $tasksUrl -Method Get -WebSession $session
    Write-Host "Tasks Fetched Successfully. Count: $($tasks.Count)"
    if ($tasks.Count -gt 0) {
        Write-Host "First Task Job ID: $($tasks[0].jobId)"
    } else {
        Write-Host "No tasks found for this user."
    }
} catch {
    Write-Host "Fetch Tasks Failed: $($_.Exception.Message)"
}
