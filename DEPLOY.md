# Deploy Smart Campus Connect (free): GitHub + TiDB Cloud + Render

Total time: about 15 minutes. You need a GitHub, a TiDB Cloud and a Render account.

## 1. Push to GitHub
1. Create a new empty repo on github.com (for example `smart-campus-connect`).
2. In the VS Code terminal, inside this folder:
   ```
   git init
   git add .
   git commit -m "Smart Campus Connect"
   git branch -M main
   git remote add origin https://github.com/<your-username>/smart-campus-connect.git
   git push -u origin main
   ```
   `.env` and `node_modules` are in `.gitignore`, so they are not uploaded. Check this on GitHub.

## 2. Create the database on TiDB Cloud
1. Sign up at tidbcloud.com and create a free **Starter** cluster.
2. Click **Connect**, choose "General", and note: **Host, Port (4000), User, Password**.
3. Leave the database name as `smart_campus` (setup creates it).

## 3. Create the tables (run once, from your laptop)
Create a file named `.env` (copy `.env.example`) with the TiDB details:
```
DB_HOST=<tidb host>
DB_PORT=4000
DB_USER=<tidb user>
DB_PASSWORD=<tidb password>
DB_NAME=smart_campus
DB_SSL=true
JWT_SECRET=<any long random text, 32+ characters>
SEED_DEMO=false
STAFF_ID=STAFF100
STAFF_NAME=Your Staff Name
STAFF_DEPT=CSE
STAFF_PASSWORD=<choose a strong password>
```
Then run:
```
npm install
npm run setup
```
You should see `Database "smart_campus" is ready.` This creates the tables and one staff account.
Students create their own accounts from the login page.

Afterwards, put your local `.env` back to the WAMP settings (DB_HOST=localhost, DB_PORT=3306, DB_SSL=false) so local testing keeps working.

## 4. Deploy on Render
1. render.com > **New** > **Web Service** > connect GitHub > select the repo.
2. Settings:
   - Runtime: **Node**
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: **Free**
3. Add these **Environment Variables**:

| Key | Value |
|---|---|
| NODE_ENV | production |
| DB_HOST | (TiDB host) |
| DB_PORT | 4000 |
| DB_USER | (TiDB user) |
| DB_PASSWORD | (TiDB password) |
| DB_NAME | smart_campus |
| DB_SSL | true |
| JWT_SECRET | (long random text) |

4. Click **Create Web Service**. After the build, Render shows your link, like
   `https://smart-campus-connect.onrender.com`. Open `/login.html` on it.

## 5. Test
- Log in as staff with your `STAFF_ID` / `STAFF_PASSWORD`.
- Register a student (same department as the staff), send a leave request.
- Log in as staff and approve it. Check the student sees the new status.

## Notes
- Free Render apps sleep after about 15 minutes idle. The first load after that takes 30 to 50 seconds. Open the link a few minutes before your review.
- Cookies are `secure` in production, so the site must be opened over `https://` (Render does this).
- If login fails with a 500 error, open Render > Logs. "Cannot connect to MySQL" means a wrong DB_* value or DB_SSL is not `true`.
- Never commit your `.env` file or share the TiDB password.
