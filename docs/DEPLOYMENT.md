# Exitstorm Deployment

## Site

- Site key: `exitstorm`
- Domain: `https://exitstorm.com`
- Registered path: `https://exitstorm.com/finance/`
- Cloudflare bucket: `exitstorm`
- Deploy source: `src`
- GitHub repo: `arc-web/exitstorm`
- Production branch: `main`
- Deploy mode: `tracked-immediate`

## Routine Launch Path

Use this for updates to the registered static `/finance/` site path.

1. Create a branch in this repo.
2. Edit files under `src`.
3. Run checks:

```bash
pnpm check:site
cloudflare-r2-website-deploy validate-config exitstorm
cloudflare-r2-website-deploy plan exitstorm --source src
```

4. Commit and push the branch.
5. Open a PR with affected URLs, verification, expected live state, and rollback.
6. After checks pass, deploy the committed source:

```bash
cloudflare-r2-website-deploy update exitstorm --source src
cloudflare-r2-website-deploy verify-runtime exitstorm
```

7. Open or curl the affected live URLs and add the live result to the PR and
   Plane task.

## Approval Gate

Do not use the fast path for DNS, Worker routes, credentials, broad clean
deletes, shared bucket ownership, live form submissions, or unclear rollback.
Use `cloudflare-r2-website-deploy release ... --dry-run` and get explicit
approval before production mutation.

The current contact-form work is tracked by `WEBDESIGN-16` and should not be
deployed until that approval gate is resolved.

## Rollback

```bash
git revert <bad-sha>
pnpm check:site
cloudflare-r2-website-deploy update exitstorm --source src
cloudflare-r2-website-deploy verify-runtime exitstorm
```
