$users = @(
    @{ Id = "EMP-1001"; ExpectedRole = "admin" },
    @{ Id = "EMP-1002"; ExpectedRole = "entry-operator" },
    @{ Id = "EMP-2001"; ExpectedRole = "core-tester" },
    @{ Id = "EMP-2002"; ExpectedRole = "secondary-tester" },
    @{ Id = "EMP-2003"; ExpectedRole = "after-primary-tester" },
    @{ Id = "EMP-2004"; ExpectedRole = "final-tester" }
)

foreach ($u in $users) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3002/auth/login" -Method Post -ContentType "application/json" -Body (@{ employeeId = $u.Id; password = "password123" } | ConvertTo-Json)
        
        $role = $response.user.role
        $status = if ($role -eq $u.ExpectedRole) { "PASS" } else { "FAIL" }
        Write-Host "$($u.Id): Expected '$($u.ExpectedRole)', Got '$role' -> $status"
    } catch {
        Write-Host "$($u.Id): LOGIN FAILED - $($_.Exception.Message)"
    }
}
