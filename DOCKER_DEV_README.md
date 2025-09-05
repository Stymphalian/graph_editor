# Docker Development Environment

This setup allows you to develop inside a Docker container without installing dependencies on your host machine.

## Prerequisites

- Docker Desktop installed and running
- Git (for version control)

## Quick Start

1. **Build and start the development container:**
   ```bash
   docker-compose up --build
   ```

2. **Access your application:**
   - Open http://localhost:5173 in your browser
   - The Vite dev server will be running with hot reload

## Development Workflow

### Start Development Server
```bash
# Start the main development service
docker-compose up dev

# Or start in background
docker-compose up -d dev
```

### Run Commands in Container
```bash
# Run tests
docker-compose exec dev sh -c "cd graph_editor && npm test"

# Run linting
docker-compose exec dev sh -c "cd graph_editor && npm run lint"

# Run build
docker-compose exec dev sh -c "cd graph_editor && npm run build"

# Install new dependencies
docker-compose exec dev sh -c "cd graph_editor && npm install package-name"
```

### Interactive Shell
```bash
# Get an interactive shell in the container
docker-compose run --rm shell

# Or use the shell service
docker-compose --profile shell up -d shell
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## File Structure in Container

- Your entire workspace is mounted at `/workspace`
- The React app is at `/workspace/graph_editor`
- Dependencies are installed in the container (not on host)
- Changes to files are immediately reflected due to volume mounting

## Ports

- **5173**: Vite development server (main)
- **3000**: Alternative port (if needed)

## Environment Variables

- `NODE_ENV=development`
- `CHOKIDAR_USEPOLLING=true` - Better file watching on Windows
- `WATCHPACK_POLLING=true` - Better file watching on Windows

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, modify the port mapping in `docker-compose.yaml`:
```yaml
ports:
  - "5174:5173"  # Use port 5174 on host
```

### File Watching Issues
The container is configured with polling-based file watching for better Windows compatibility. If you experience issues:

1. Ensure Docker Desktop has access to your workspace directory
2. Check that the volume mounts are working correctly
3. Restart the container: `docker-compose restart dev`

### Dependencies Issues
If you need to reinstall dependencies:
```bash
docker-compose exec dev sh -c "cd graph_editor && rm -rf node_modules package-lock.json && npm install"
```

## Benefits

- **No host dependencies**: Everything runs in the container
- **Consistent environment**: Same setup across different machines
- **Isolation**: Development environment doesn't affect your system
- **Easy cleanup**: Remove container to clean up completely
- **Team consistency**: Everyone uses the same development environment
