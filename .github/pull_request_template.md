## What Changed

-

## Affected URLs

-

## Deploy Mode

- `tracked-immediate`

## Verification

- [ ] `pnpm check:site`
- [ ] `cloudflare-r2-website-deploy validate-config exitstorm`
- [ ] `cloudflare-r2-website-deploy plan exitstorm --source src`
- [ ] Live check after deploy:

## Expected Production State

-

## Rollback

```bash
git revert <sha>
cloudflare-r2-website-deploy update exitstorm --source src
```

## Deploy Evidence

- Branch:
- Commit SHA:
- Deploy command:
- Live result:
