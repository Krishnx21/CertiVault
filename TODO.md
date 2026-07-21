# CI/CD Pipeline Fix Plan

## Phase 1: Fix Backend package.json
- [x] 1. Add missing production dependencies (helmet, compression, cookie-parser, hpp, express-rate-limit, winston, passport, passport-google-oauth20, ioredis, zod, prom-client, @bull-board/api, @bull-board/express)
- [x] 2. Add missing dev dependencies (typescript, @types/express, @types/cors, @types/node, @types/jsonwebtoken, @types/cookie-parser, @types/hpp, @types/passport, @types/passport-google-oauth20, @types/ioredis, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint, mongodb-memory-server)
- [x] 3. Add missing npm scripts (build, typecheck, lint, test:coverage)

## Phase 2: Fix Frontend package.json
- [ ] 4. Fix TypeScript version typo in frontend/package.json (^7.0.2 → ^5.8.3)

## Phase 3: Fix CI Test Execution
- [ ] 5. Fix documents.test.js and share.test.js - ESM dynamic import patterns
- [ ] 6. Update test script to support both .js and .ts test files

## Phase 3: Fix CI/CD Workflows
- [ ] 7. Fix quality.yml issue-templates job (remove Ruby dependency)
- [ ] 8. Add test:coverage support in CI

## Phase 4: Fix Source Code Issues
- [ ] 9. Ensure app.ts and related TypeScript files compile cleanly
- [ ] 10. Fix any import path mismatches
- [ ] 11. Final verification - run npm test, npm run build, npm run typecheck

