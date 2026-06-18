# Exitstorm Plane Reference

## Standing Context

- Workspace: `todovibes`
- Project: `WEBDESIGN`
- Module: `Cloudflare`
- Standing issue: `WEBDESIGN-16`

## Evidence To Record

Every production website update should record:

- PR URL
- Branch
- Commit SHA
- Affected URLs
- Local check result
- Deploy command, or why deploy did not happen
- Live verification result
- Rollback command or prior good SHA

Worker and contact-form changes are higher risk than static page edits. They
need explicit approval before production mutation.
