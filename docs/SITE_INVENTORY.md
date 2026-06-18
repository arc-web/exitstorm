# Exitstorm Site Inventory

## Production URLs

- `https://exitstorm.com/`
- `https://exitstorm.com/finance/`

## Source Areas

- `src/` - registered static Cloudflare R2 source for `/finance/`
- `docs/` - repo documentation and historical/static app files, not the current
  deploy source
- `public/` - app/web source, not the current registered R2 source
- `workers/exitstorm-api/` - Cloudflare Worker source for contact form API

## Ownership

- GitHub repo: `arc-web/exitstorm`
- Cloudflare site key: `exitstorm`
- Bucket: `exitstorm`
- Source of truth: `site.config.json`

The local Cloudflare registry is convenience state only. Do not treat it as the
durable ownership record.
