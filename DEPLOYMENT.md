# Deployment Troubleshooting Guide

## Common 502 Error Causes

### 1. Missing Environment Variables
Ensure all required variables from .production.env.example are set in Dokploy.

### 2. Database Connection Issues
Verify database credentials and network accessibility.

### 3. Serverless vs Container Mode (FIXED)
The app now starts a server by default for Docker deployments.

### 4. Slow Startup
The workflow now waits 30 seconds and retries up to 5 times.

## Deployment Checklist

- Set all environment variables in Dokploy
- Verify NODE_ENV=production
- Ensure PORT=3000
- Do NOT set SERVERLESS variable
- Use production API keys

## Quick Debug

Check container logs in Dokploy for:
- "Server running on port 3000" message
- Database connection errors
- Missing environment variable errors
