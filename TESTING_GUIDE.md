# CertiVault Testing Guide

## Manual Testing Checklist

### 1. Backend API Testing

All endpoints can be tested using curl or any HTTP client.

#### Health Check
```bash
curl http://localhost:5000/health/live
# Expected: {"status":"ok","version":"1.0.0","uptimeSeconds":...}
```

#### API Info
```bash
curl http://localhost:5000/api
# Expected: {"service":"CertiVault API","status":"running","links":{"liveness":"/health/live"}}
```

#### List Documents
```bash
curl http://localhost:5000/api/documents
# Expected: {"data":[...],"total":4}
```

#### Search Documents
```bash
curl "http://localhost:5000/api/documents?search=certificate&status=all"
# Expected: Filtered list of documents
```

#### Filter by Status
```bash
curl "http://localhost:5000/api/documents?status=pending"
# Expected: Only pending documents
```

#### Upload Document
```bash
# Create a test file
echo "Test content" > test.txt

# Upload it
curl -X POST http://localhost:5000/api/documents \
  -F "file=@test.txt" \
  -F "type=Certificate"

# Expected: {"data":{"id":"...","name":"test.txt","type":"Certificate",...}}

# Clean up
del test.txt
```

#### Verify Document
```bash
# Get a document ID from the list
curl -X PATCH http://localhost:5000/api/documents/demo-contract/verify
# Expected: {"data":{"id":"demo-contract","status":"verified","verifiedAt":"..."}}
```

#### Dashboard Summary
```bash
curl http://localhost:5000/api/dashboard/summary
# Expected: {"data":{"total":4,"verified":3,"pending":1,"storageBytes":...}}
```

#### Delete Document
```bash
curl -X DELETE http://localhost:5000/api/documents/8283cdde-fcd9-4c7a-941a-44acbae2ac21
# Expected: 204 No Content
```

### 2. Frontend Testing

#### Access Dashboard
1. Open http://localhost:5173 in your browser
2. You should see the CertiVault dashboard
3. Sample documents should be displayed in the table
4. Statistics cards should show total, verified, pending, and storage

#### Test Search
1. Type "certificate" in the search bar
2. The table should filter to show only certificate documents
3. Clear the search to see all documents

#### Test Status Filter
1. Click on "Pending" in the sidebar or filter dropdown
2. Only pending documents should be displayed
3. Click "All" to see all documents

#### Test Upload
1. Click the "Upload document" button
2. A modal should appear
3. Click the dropzone to select a file
4. Choose a document type from the dropdown
5. Click "Upload securely"
6. The modal should close and a success toast should appear
7. The document list should refresh and show the new document

#### Test Verification
1. Find a pending document in the list
2. Click the verify/check icon
3. The document status should change to "verified"
4. A success toast should appear
5. The dashboard statistics should update

#### Test Delete
1. Find a document in the list
2. Click the delete/trash icon
3. The document should be removed from the list
4. A success toast should appear
5. The dashboard statistics should update

### 3. End-to-End Flow Test

Complete workflow test:

1. **Start with fresh state**
   - Ensure both servers are running
   - Open browser to http://localhost:5173

2. **Upload a document**
   - Click "Upload document"
   - Select a file (e.g., test.pdf)
   - Choose type "Contract"
   - Upload
   - Verify it appears in the list as "pending"

3. **Search for the document**
   - Type the filename in search
   - Verify it filters correctly

4. **Verify the document**
   - Click the verify button
   - Check that status changes to "verified"

5. **Check dashboard**
   - Verify statistics updated correctly
   - Total documents increased by 1
   - Verified count increased by 1

6. **Delete the document**
   - Click delete button
   - Verify it's removed from the list
   - Check dashboard statistics updated

### 4. Error Handling Tests

#### Invalid File Upload
- Try uploading without selecting a file
- Should show error: "Choose a document first."

#### Network Error
- Stop the backend server
- Try to upload or refresh documents
- Should show error toast: "Backend is unavailable. Start the API on port 5000."

### 5. Performance Tests

#### Page Load Time
- Measure time from navigation to full page render
- Should be under 1 second on local development

#### API Response Times
- Health check: < 10ms
- List documents: < 100ms
- Upload document: < 200ms
- Verify document: < 100ms

### 6. Browser Compatibility

Test in multiple browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

All should work identically.

### 7. Responsive Design

Test on different screen sizes:
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

The layout should adapt appropriately.

## Automated Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Build

```bash
cd frontend
npm run build
```

### Type Checking

```bash
cd backend
npm run typecheck

cd frontend
npm run typecheck
```

### Linting

```bash
cd backend
npm run lint

cd frontend
npm run lint
```

## Common Issues and Solutions

### "Failed to fetch" error
**Cause:** Backend server not running or CORS issue  
**Solution:** 
- Ensure backend is running on port 5000
- Check Vite proxy configuration in vite.config.js
- Verify CORS settings in backend

### Documents not loading
**Cause:** MongoDB connection issue  
**Solution:**
- Check MongoDB connection string in backend/.env
- Verify MongoDB Atlas cluster is accessible
- Check network connectivity

### Upload fails silently
**Cause:** Multer configuration or file size limit  
**Solution:**
- Check file size is under 10MB
- Verify file type is allowed
- Check backend logs for errors

### Search not working
**Cause:** Query parameter issue  
**Solution:**
- Check search query is properly encoded
- Verify backend filtering logic
- Check for console errors

## Test Results Template

Use this template to document test results:

```markdown
## Test Run: [Date]

### Environment
- Node.js: v20.x.x
- MongoDB: Atlas cluster
- Browser: Chrome 120

### Backend Tests
- [ ] Health check
- [ ] List documents
- [ ] Search documents
- [ ] Upload document
- [ ] Verify document
- [ ] Delete document
- [ ] Dashboard summary

### Frontend Tests
- [ ] Dashboard loads
- [ ] Documents display
- [ ] Search works
- [ ] Filter works
- [ ] Upload works
- [ ] Verify works
- [ ] Delete works
- [ ] Statistics update

### Issues Found
1. [Description]
2. [Description]

### Status: PASS/FAIL
```

## Continuous Testing

For ongoing testing, consider:
- Adding unit tests for critical functions
- Adding integration tests for API endpoints
- Adding end-to-end tests with Playwright or Cypress
- Setting up automated test runs in CI/CD

---

**Happy Testing! 🧪**