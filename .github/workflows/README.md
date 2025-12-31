# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation of the AI-Suggest Forge app.

## Workflows

### 1. CI (`ci.yml`)
**Triggers:** Push and pull requests to main/master branches

**What it does:**
- Runs on Node.js 18.x and 20.x (matrix strategy)
- Installs dependencies
- Runs ESLint
- Builds the project
- Verifies build output
- Uploads build artifacts

### 2. Build Verification (`build.yml`)
**Triggers:** Push, pull requests, and manual dispatch

**What it does:**
- Verifies the project builds successfully
- Checks dist directory structure
- Lists build artifacts
- Useful for debugging build issues

### 3. Validate Manifest (`validate-manifest.yml`)
**Triggers:** Changes to `manifest.yml`, push, pull requests, and manual dispatch

**What it does:**
- Validates YAML syntax
- Checks required manifest structure
- Verifies app configuration
- Displays manifest summary

### 4. Deploy to Forge (`deploy.yml`)
**Triggers:** Version tags (v*.*.*) and manual dispatch

**What it does:**
- Builds the project
- Installs Forge CLI
- Lints the Forge app
- Deploys to specified environment (development/staging/production)

## Setup Instructions

### Required GitHub Secrets

For the deployment workflow to work, you need to set up a GitHub secret:

1. **FORGE_API_TOKEN**
   - Create a Forge API token at: https://developer.atlassian.com/console/myapps/
   - Go to your repository Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `FORGE_API_TOKEN`
   - Value: Your Forge API token

### How to Deploy

#### Automatic Deployment (via Tags)
```bash
git tag v1.0.0
git push origin v1.0.0
```
This will automatically trigger deployment to the development environment.

#### Manual Deployment
1. Go to the Actions tab in your GitHub repository
2. Select "Deploy to Forge" workflow
3. Click "Run workflow"
4. Choose the environment (development/staging/production)
5. Click "Run workflow"

### Environment Selection

The deployment workflow supports three environments:
- **development** - For testing and development
- **staging** - For pre-production testing
- **production** - For production deployments

### Notes

- The deployment workflow will skip if `FORGE_API_TOKEN` is not configured
- All workflows use Node.js 20.x by default (CI also tests on 18.x)
- Build artifacts are stored for 7 days
- The manifest validation workflow helps catch configuration errors early

