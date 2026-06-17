# helix-mixer documentation impact rules

Update public docs when changes affect:

- AEM Network routing behavior, route matching, glob patterns, backend selection, or fallback behavior.
- Configuration syntax, required fields, examples, validation, or deployment/update workflow visible to implementers.
- Cache, header, redirect, proxy, or error behavior that affects site integration.

Do not update public docs for internal proxy refactors, infrastructure changes, logging, or non-user-visible performance tuning.
