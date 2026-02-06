# ⚠️ DOCKER ONLY - DO NOT RUN LOCALLY

This application is configured to **ONLY RUN FROM DOCKER**.

## Quick Commands

Start:
```
npm run docker:start
```

Stop:
```
npm run docker:stop
```

Logs:
```
npm run docker:logs
```

## Why Blocked?

- Database hostname is set to `postgres` (Docker service name)
- Running locally will fail to connect to database
- Prevents configuration drift

## If Docker is Down

1. Start Docker Desktop
2. Wait 30 seconds
3. Run `npm run docker:start` again

Do **NOT** attempt to modify configuration files to run locally.

See [DOCKER_ONLY_EXECUTION.md](DOCKER_ONLY_EXECUTION.md) for full details.
