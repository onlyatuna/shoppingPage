# Tasks

- [x] Analyze `CategoryService.delete` for the "exists product" error. <!-- id: 0 -->
- [x] Review `errorHandler.ts` to ensure business errors map to 400 status codes. <!-- id: 1 -->
- [x] Implement/Refactor `errorHandler.ts` with custom `AppError` and centralized mapping. <!-- id: 2 -->
- [x] Verify image upload optimization with `upload_stream` and `Readable.from`. <!-- id: 3 -->
- [x] Implement financial precision using `Prisma.Decimal` and global JSON polyfills. <!-- id: 4 -->
- [x] Implement "Uncategorized" auto-migration and self-healing logic for categories. <!-- id: 5 -->
- [x] Document all design patterns in `tasks/lessons.md`. <!-- id: 6 -->

## Final Summary
- **Backend Core**: Modernized error handling system with `AppError` and specialized mapping.
- **Operations**: Optimized Cloudinary file uploading for memory and naming clarity.
- **Integrity**: Ensured financial calculations are precise and transaction-safe via `$transaction` rollbacks.
- **Resilience**: Added auto-restoration and smart fallback for essential database entities.
