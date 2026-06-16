# helix-product-shared documentation impact rules

Update public docs when changes affect:

- Product Bus schema fields, types, enum values, defaults, validation, normalization, or slug/path behavior.
- Shared cache, routing, feed, indexing, or rendering utilities whose behavior is visible to implementers.
- Error formats, constants, or helper behavior that appear in API responses, generated outputs, or examples.

Do not update public docs for private helper refactors, package build changes, or internal type-only changes with no runtime or schema effect.
