# TODO
- [ ] Inspect frontend backend-availability check (where the toast message comes from).
- [ ] Inspect all frontend API URL construction (VITE_API_URL usage, hardcoded localhost, health checks).
- [ ] Inspect backend health routes and endpoint paths.
- [ ] Identify mismatch between frontend health-check URL and backend health route.
- [ ] Fix only the mismatch (and only in the relevant frontend health-check component if applicable).
- [ ] Verify every request uses import.meta.env.VITE_API_URL.
- [ ] Verify backend health endpoint matches frontend expectation.
- [ ] Verify CORS/credentials/origin.
- [ ] Explain which file changed and why the frontend reported backend unavailable.

