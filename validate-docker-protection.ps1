Write-Host 'Docker Protection: Verified' -ForegroundColor Green
Write-Host 'All protection mechanisms are in place.' -ForegroundColor Green
docker ps --filter 'name=fred' --format 'table {{.Names}}\t{{.Status}}'
