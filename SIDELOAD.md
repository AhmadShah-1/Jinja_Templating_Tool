# How to Sideload Your Office Add-in

## Quick Start

1. **Start the dev server:**
   ```bash
   npm run start:linux
   ```

2. **Run the sideload helper:**
   ```bash
   npm run sideload
   ```
   This will check prerequisites and provide step-by-step instructions.

3. **In Word:**
   - Go to **Insert → Add-ins → My Add-ins**
   - Click **Upload My Add-in**
   - Select `manifest.xml` from this directory
   - Click **Upload**

4. **Use the add-in:**
   - Look for **"Stanza Assistant"** button in the **Home** tab under **"Stanza"** group
   - Click it to open the task pane

## Manual Steps (if helper script doesn't work)

### For Word Desktop (Windows/Mac):

1. Ensure dev server is running: `npm run start:linux`
2. Open Microsoft Word
3. Go to **Insert** tab → **Add-ins** → **My Add-ins**
4. Click **Upload My Add-in** (or **Manage My Add-ins** → **Upload My Add-in**)
5. Navigate to your project directory and select `manifest.xml`
6. Click **Upload**

### For Word Online:

1. Ensure dev server is running: `npm run start:linux`
2. Go to [Word Online](https://office.com)
3. Open or create a document
4. Go to **Insert** → **Add-ins** → **My Add-ins**
5. Click **Upload My Add-in**
6. Select `manifest.xml`
7. **Note:** Word Online may require a public HTTPS URL. If `localhost:3000` doesn't work, you may need to:
   - Use a tunnel service (like ngrok)
   - Or deploy to a server (like Azure)

## Troubleshooting

### "Please sideload your add-in" message appears
- Make sure you've uploaded the manifest.xml file
- Try reloading the add-in in Word
- Check that the dev server is running

### Dev server not starting
- Check if port 3000 is already in use: `lsof -i :3000`
- Kill the process if needed: `kill <PID>`
- Or use a different port by setting `dev_server_port` in package.json

### Add-in doesn't load
- Verify the dev server is accessible at `https://localhost:3000`
- Check browser console for errors
- Ensure HTTPS certificates are trusted (run `npm run start:linux` to see certificate info)

### Port already in use
```bash
# Find the process using port 3000
lsof -i :3000

# Kill it
kill <PID>
```

## Useful Commands

- `npm run start:linux` - Start the dev server
- `npm run sideload` - Run the sideload helper script
- `npm run validate` - Validate the manifest.xml
- `npm run stop` - Stop the debugging session (if using Windows)

## File Locations

- **Manifest:** `manifest.xml` (in project root)
- **Dev Server:** `https://localhost:3000`
- **Task Pane:** `https://localhost:3000/taskpane.html`

