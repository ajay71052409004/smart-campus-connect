# Smart Campus Connect

College portal with student login, staff login, online leave letters and a MySQL backend.

## What you need
- Node.js 18 or newer
- MySQL 8 running on your computer

## Run it
1. Open this folder in VS Code, then open the terminal.
2. Install packages:
   npm install
3. Copy `.env.example` to `.env` and fill in your MySQL password and a long random JWT_SECRET.
4. Create the database, tables and demo accounts (run once):
   npm run setup
5. Start the server:
   npm start
6. Open http://localhost:3000/login.html

## Demo accounts (created by npm run setup, local only)
- Student: 21CS001 / student123
- Staff:   STAFF001 / staff123
Change or delete these before real use. Remove the demo hint from public/login.html too.

## How leave works
- Student: Leave page > pick type and dates > write the reason > Send to staff. They can cancel while it is pending.
- Staff: Leave page shows requests from students of their own department. Approve, or reject with a reason.
- The student sees the status and the staff remark.

## Accounts
- Students can create their own account on the login page.
- Staff accounts are not self-service. Add one in MySQL with a bcrypt password hash, or add a row to the `demo` list in setup.js and run npm run setup again.

## Files
- server.js    API (login, register, leave requests)
- db.js        MySQL connection
- schema.sql   Tables
- setup.js     Creates DB, tables, demo users
- public/      Website (login.html, index.html, style.css, script.js, login.js)

## Still stored in the browser only
Complaints and Lost & Found use localStorage for now, so they are not shared between users.

## Deploying online
See DEPLOY.md (Render + TiDB Cloud, free).
