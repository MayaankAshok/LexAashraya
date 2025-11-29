# LexAashraya - Attorney-at-Law Website

A modern blog website built with React, TypeScript, and Vite. Features a dual-build system supporting both static and admin modes, with FTP deployment capabilities.

## Features

- 📝 Blog post management with rich content editor
- 🏷️ Tag-based search and filtering
- 📎 File attachment support (any file type)
- 🔄 Hard refresh with cache clearing (Ctrl+Shift+R)
- 🎨 Dark mode interface
- 📱 Responsive design
- 🚀 Dual build system (static/admin)
- ☁️ FTP deployment automation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- FTP access credentials (for deployment)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MayaankAshok/LexAashraya.git
   cd Website
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install server dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Configure environment variables:**
   Create a `.env` file in the `server` directory:
   ```env
   FTP_HOST=ftp://your-domain.com
   FTP_USER=your-username
   FTP_PASSWORD=your-password
   FTP_PORT=21
   FTP_REMOTE_BASE_PATH=/domains/yourdomain.com/public_html/data
   PORT=3001
   ```

## Development

### Run Development Server (Static Mode)
```bash
npm run dev
```
Starts the development server at `http://localhost:5173` in static mode (read-only).

### Run Development Server (Admin Mode)
```bash
npm run dev:admin
```
Starts the development server with admin UI enabled for managing posts.

### Run Backend Server
```bash
cd server
npm start
```
Starts the Express server at `http://localhost:3001` for API operations.

## Building

### Build Static Version
```bash
npm run build:static
```
Creates a production build in `dist-static/` directory - optimized for static hosting.

### Build Admin Version
```bash
npm run build:admin
```
Creates a production build in `dist-admin/` directory with admin features enabled.

## Deployment

### Option 1: Automated Build and Deploy (Recommended)
```bash
# Double-click or run:
build-and-deploy.bat
```
This will:
1. Build the static version
2. Upload the build to FTP server
3. Display success/error messages

### Option 2: Manual Deployment

1. **Build the project:**
   ```bash
   npm run build:static
   # or
   npm run build:admin
   ```

2. **Upload build files:**
   ```bash
   cd server
   node ftp-upload-build.js
   ```

3. **Upload data files (posts/manifest):**
   ```bash
   cd server
   node ftp-upload-data.js
   ```

### Option 3: Download Data from Server
```bash
cd server
node ftp-download-data.js
```
Downloads posts and uploads from the FTP server to local `public/data/` directory.

## Managing Content

### Creating a New Post
1. Start the server: `cd server && npm start`
2. Start the admin dev server: `npm run dev:admin`
3. Navigate to Admin interface
4. Click "Create New Post"
5. Fill in the form and add attachments (any file type supported)
6. Save the post
7. Deploy changes using `build-and-deploy.bat`

### Editing an Existing Post
1. Navigate to Admin interface
2. Click on the post you want to edit
3. Make changes
4. Save and deploy

### Uploading Attachments
- Any file type is supported
- Maximum file size: 10MB per file
- Files are stored in `public/data/uploads/`
- File icons automatically detected based on type

## Keyboard Shortcuts

- **Ctrl+Shift+R** (Cmd+Shift+R on Mac): Hard refresh with cache clearing
  - Clears all browser caches
  - Loads fresh content from server
  - Ensures new articles appear immediately

## Project Structure

```
Website/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── services/          # API and blog services
│   ├── hooks/             # Custom React hooks
│   ├── styles/            # CSS styles
│   └── types/             # TypeScript types
├── server/                # Backend server
│   ├── server.js          # Express server
│   ├── ftp-*.js           # FTP utility scripts
│   └── package.json       # Server dependencies
├── public/                # Static assets
│   └── data/              # Blog posts and uploads
│       ├── posts/         # Post JSON files
│       ├── uploads/       # Uploaded attachments
│       └── posts-manifest.json
├── dist-static/           # Static build output
├── dist-admin/            # Admin build output
└── build-and-deploy.bat   # Automated deployment script
```

## Troubleshooting

### Build fails
- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run lint`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### FTP upload fails
- Verify `.env` credentials in `server/` directory
- Check FTP server connection and permissions
- Ensure remote path exists on server

### Posts not appearing
- Press **Ctrl+Shift+R** to clear cache and reload
- Check `public/data/posts-manifest.json` exists
- Verify post JSON files are in `public/data/posts/`

### Server won't start
- Check if port 3001 is already in use
- Verify all server dependencies are installed: `cd server && npm install`

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Express.js, Multer (file uploads)
- **Deployment:** FTP (basic-ftp)
- **Styling:** CSS Modules
- **Routing:** React Router v7
- **Markdown:** React Markdown with plugins

## License

Private repository - All rights reserved

## Contact

For questions or support, please contact the repository owner.
