# Debugging Your Office Add-in

## Common Issues and Solutions

### 1. Add-in Doesn't Load When Clicked in Word

**Symptoms:**
- Clicking the add-in button in Word does nothing
- Task pane shows "Loading..." or "Please sideload your add-in"
- Blank task pane

**Debugging Steps:**

1. **Check Browser Console (F12)**
   - In Word, when the task pane opens, press **F12** to open Developer Tools
   - Look for errors in the Console tab
   - Common errors:
     - `Office.js not loaded` - Certificate or network issue
     - `CORS error` - Server configuration issue
     - `Failed to load resource` - File not found or server not running

2. **Verify Dev Server is Running**
   ```bash
   # Check if port 3000 is in use
   lsof -i :3000
   
   # Or check if webpack is running
   ps aux | grep webpack
   ```

3. **Check Certificate Trust**
   - When you run `npm run start:linux`, it should show certificate paths
   - On Windows/WSL, you may need to trust the certificate:
     ```bash
     # The certificate is usually at:
     # ~/.office-addin-dev-certs/localhost.crt
     
     # On Windows, you can import it:
     # 1. Open Certificate Manager (certmgr.msc)
     # 2. Import the .crt file to Trusted Root Certification Authorities
     ```

4. **Test Direct Access**
   - Open `https://localhost:3000/taskpane.html` directly in a browser
   - If it works in browser but not in Word, it's likely a certificate trust issue
   - If it doesn't work in browser, check the dev server logs

5. **Check Network Tab**
   - In Developer Tools (F12), go to Network tab
   - Reload the task pane
   - Look for failed requests (red entries)
   - Check if `office.js` is loading from `https://appsforoffice.microsoft.com/lib/1/hosted/office.js`

### 2. "Please sideload your add-in" Message Appears

**Possible Causes:**
- Office.js didn't load
- Office.onReady didn't fire
- Wrong host type (not Word)

**Solutions:**
- Check browser console for errors
- Verify the add-in is properly sideloaded (re-upload manifest.xml)
- Make sure you're using Word, not Excel/PowerPoint

### 3. Certificate/SSL Errors

**Symptoms:**
- Browser shows "Not Secure" warning
- Certificate errors in console
- Add-in fails to load

**Solutions:**

**For Windows/WSL:**
```bash
# Trust the certificate (run in Windows PowerShell, not WSL)
# Navigate to certificate location
cd $env:USERPROFILE\.office-addin-dev-certs

# Import certificate (run as Administrator)
certutil -addstore -user "Root" localhost.crt
```

**For Linux:**
```bash
# Trust the certificate
sudo cp ~/.office-addin-dev-certs/localhost.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

### 4. CORS Errors

**Symptoms:**
- Console shows CORS policy errors
- Requests blocked by browser

**Solution:**
- The webpack config already includes CORS headers
- If still having issues, check that `Access-Control-Allow-Origin: *` is set
- Verify dev server is running with HTTPS

### 5. JavaScript Errors

**Symptoms:**
- Add-in loads but doesn't function
- Console shows JavaScript errors
- Elements not found errors

**Debugging:**
- Check the console output in the add-in (bottom panel)
- Look for specific error messages
- Verify all required elements exist in the HTML

## Debugging Tools

### Browser Developer Tools
- **F12** - Open Developer Tools in Word
- **Console Tab** - See JavaScript errors and logs
- **Network Tab** - Check if resources are loading
- **Application Tab** - Check localStorage, sessionStorage, etc.

### Add-in Console
- The add-in has a built-in console at the bottom
- Shows errors and info messages
- Automatically scrolls to latest messages

### Logging
- The add-in now includes enhanced logging
- Check both browser console (F12) and add-in console
- Logs are prefixed with `[Stanza Add-in]`

## Quick Debug Checklist

- [ ] Dev server is running (`npm run start:linux`)
- [ ] Port 3000 is accessible (`https://localhost:3000/taskpane.html` works in browser)
- [ ] Certificate is trusted (no SSL warnings)
- [ ] Manifest.xml is properly uploaded in Word
- [ ] Using Word (not Excel/PowerPoint)
- [ ] Browser console (F12) shows no errors
- [ ] Office.js is loading (check Network tab)
- [ ] All required files exist (taskpane.html, taskpane.js, etc.)

## Getting Help

If you're still having issues:

1. **Collect Information:**
   - Screenshot of browser console (F12)
   - Screenshot of add-in console
   - Error messages from terminal (dev server logs)
   - Word version and platform (Windows/Mac/Online)

2. **Check Logs:**
   ```bash
   # Dev server logs
   npm run start:linux
   
   # Check for webpack errors
   npm run build:dev
   ```

3. **Verify Setup:**
   ```bash
   # Validate manifest
   npm run validate
   
   # Check for linting errors
   npm run lint
   ```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Office is not defined` | Office.js didn't load | Check network, certificate trust |
| `Failed to fetch` | Server not running | Start dev server |
| `CORS policy` | CORS headers missing | Check webpack config |
| `Certificate error` | Untrusted certificate | Trust the dev certificate |
| `Element not found` | HTML structure issue | Check taskpane.html |
| `Module not found` | Import/export issue | Check webpack build |

