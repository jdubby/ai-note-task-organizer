# Security Guidelines

## Environment Variables

**Never commit `.env` files to the repository.** These files contain sensitive credentials and secrets.

### Setup

1. Copy the example file:
   ```bash
   cp server/.env.example server/.env
   ```

2. Update the values in `server/.env` with your actual credentials.

3. Ensure `.env` is in `.gitignore` (it should be by default).

## Default Passwords in docker-compose.yml

The `docker-compose.yml` file contains default passwords for local development:

- **MongoDB**: `admin` / `password`
- **MinIO**: `minioadmin` / `minioadmin`

⚠️ **These are for LOCAL DEVELOPMENT ONLY.** 

**For production:**
- Use strong, randomly generated passwords
- Store credentials in environment variables or a secrets manager
- Never commit production credentials to version control
- Consider using Docker secrets or environment variable files that are not tracked

## JWT Secret

The JWT secret in `server/src/middleware/auth.ts` has a fallback value of `'your-secret-key'`. This is **NOT SECURE** and should only be used for development.

**For production:**
- Always set `JWT_SECRET` in your `.env` file
- Use a strong, randomly generated secret (at least 32 characters)
- Never use the default fallback value in production

## API Keys and Tokens

- Never commit API keys, tokens, or secrets to the repository
- Use environment variables for all sensitive configuration
- Rotate credentials regularly
- Use different credentials for development, staging, and production

## File Uploads

- Uploaded files are stored in `server/uploads/` (local development)
- This directory is excluded from git via `.gitignore`
- In production, use object storage (S3/MinIO) with proper access controls

## Database

- Use strong passwords for database connections
- Enable authentication in production MongoDB instances
- Use connection strings with credentials stored in environment variables
- Never commit database credentials

## Best Practices

1. **Review commits before pushing**: Use `git diff` to check what you're committing
2. **Use pre-commit hooks**: Consider tools like `husky` to prevent accidental commits of secrets
3. **Scan for secrets**: Use tools like `git-secrets` or GitHub's secret scanning
4. **Rotate compromised credentials**: If credentials are accidentally committed, rotate them immediately
5. **Use secrets management**: For production, use proper secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)

## If You Accidentally Committed Secrets

1. **Immediately rotate the compromised credentials**
2. **Remove from git history** (if the commit hasn't been pushed):
   ```bash
   git rm --cached server/.env
   git commit --amend
   ```
3. **If already pushed**: Rotate credentials and consider the repository compromised
4. **For public repos**: Assume credentials are exposed and rotate immediately

