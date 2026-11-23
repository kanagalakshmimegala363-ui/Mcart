# Mcart: Run It Locally, Add Google Login, Move to Aiven Cloud
### Setup guide, about 40 minutes, 8 short parts in 2 phases

**The plan**
- **Phase A: run Mcart on your own computer** with MySQL Workbench (Parts 1 to 6). You add Google login and see the whole shop working.
- **Phase B: move the database to Aiven** (Parts 7 and 8). Same shop, now with a cloud database.

**What you get:** the full Mcart shop with all **7 departments and 48 products** (with pictures), cart, checkout, orders, wishlist, admin pages, normal sign-in and **Continue with Google**.

> **How to use this guide:** do the parts in order. Each part ends with a ✅ checkpoint. If yours does not match, stop and use the Troubleshooting table at the end.

---

## Before you start (3 min)
| You need | Check with | You should see |
|---|---|---|
| Python | `python --version` | 3.10 or newer |
| Node.js | `node --version` | 18 or newer |
| MySQL running | open MySQL Workbench | a card named **Local instance MySQL80** (root, localhost:3306) |
| A Google account | n/a | the one that owns your Google Cloud project |

Unzip the project and open the folder that contains `backend` and `frontend` in your terminal (for example `M:\file\mcart`). **Every command below starts from that folder.**

> **Old ShopSphere project still running?** Stop its two terminals first (click each and press **Ctrl+C**). Mcart uses the same ports, 8000 and 3000.

> **Using PowerShell** (the terminal inside VS Code or Antigravity)? If `venv\Scripts\activate` says scripts are disabled, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` once in that terminal, then `venv\Scripts\Activate.ps1`.

---

# PHASE A: Run it locally

## Part 1: Create the Mcart database in MySQL Workbench (3 min)
Your project is already set to connect with **user `root`**, **your Workbench password**, `localhost`, port `3306`. The settings live in `backend/.env`, so the password is never inside the code. You only need an empty database.

1. Open **MySQL Workbench**.
2. Double-click the card **Local instance MySQL80**.
3. Type your Workbench root password and click **OK**. (Tick **Save password in vault** to skip this next time.)
4. A SQL window opens. Paste this, then click the **lightning bolt** button to run it:
   ```sql
   CREATE DATABASE IF NOT EXISTS mcart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

✅ **Checkpoint:** run `SHOW DATABASES;` and you see `mcart_db` in the list.

**Next: Part 2.**

---

## Part 2: Use your Google keys for Mcart (4 min)
You already have a Google OAuth client. **Keep it.** Mcart uses the same client and the same redirect address, so you do not need to create anything new.

1. Open **https://console.cloud.google.com** and select your project.
2. Go to **Google Auth Platform, then Clients**, and open your existing OAuth client.
3. Under **Authorized redirect URIs**, check that this exact address is listed:
   ```
   http://127.0.0.1:8000/api/auth/google/callback/
   ```
   If it is missing, click **+ Add URI**, paste it and click **Save**. Copy it character for character, including the final `/`.
4. Copy your **Client ID**. It is the long text ending in `.apps.googleusercontent.com`.
5. You also need the **Client secret**. Google shows a secret only once, right after you create it. If you do not have it, click **+ Add secret** on this page, copy the new one immediately, and delete any old secret you no longer use.
6. Click **Audience** and, under **Test users**, check that the Gmail you will sign in with is listed. If not, click **+ Add users**.
7. **Optional, so Google shows your new name:** click **Branding** and change the **App name** to `Mcart`, then **Save**.

✅ **Checkpoint:** the redirect address is listed, and you have your Client ID and Client secret.

**Next: Part 3.**

---

## Part 3: Paste your two Google keys into `.env` (2 min)
**Where is `.env`?** It is already in the zip, at `backend/.env`, next to `manage.py`. Some tools hide files that start with a dot, so look inside the `backend` folder in your code editor's file list. It already contains your local database settings. You only add the two Google values.

**Why it exists:** it keeps passwords and secret keys out of the code, so you can share the project without sharing your secrets.

1. Open `backend/.env`.
2. After `GOOGLE_CLIENT_ID=` paste your Client ID. After `GOOGLE_CLIENT_SECRET=` paste your Client secret. No quotes, no spaces.
3. **Leave the Aiven lines alone** (they start with `#`). That is for Phase B.
4. Save the file (**Ctrl+S**).

If `.env` is missing, make it from the template: `copy .env.example .env` (Windows) or `cp .env.example .env` (Mac/Linux), then fill in the values.

⚠️ **Never** email, upload or screenshot `.env`. The included `.gitignore` keeps it out of GitHub.

✅ **Checkpoint:** both Google values are filled in, and the file is saved.

**Next: Part 4.**

---

## Part 4: Start the backend (5 min)
Open a terminal in the project folder and run these **one at a time**.

**Windows (Command Prompt or PowerShell):**
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python check_setup.py
python manage.py migrate
python manage.py seed
python manage.py createsuperuser
python manage.py runserver
```
**Mac / Linux:**
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python check_setup.py
python manage.py migrate
python manage.py seed
python manage.py createsuperuser
python manage.py runserver
```
- `pip install -r requirements.txt` installs everything the backend needs.
- `python check_setup.py` is a health check. It prints `OK` or `FIX` lines for your `.env`, the database and the Google keys. Fix every `FIX` line before you continue.
- `migrate` creates the tables in `mcart_db`.
- `seed` fills the shop: **7 departments and 48 products**, with product images.
- `createsuperuser` makes your admin login (optional, recommended).
- `runserver` starts the backend. **Leave this window open.**

✅ **Checkpoint:** `check_setup.py` ends with `All good`, `seed` prints `Done. Categories: 7 added. Products: 48 created`, and this page shows product data: http://127.0.0.1:8000/api/products/products/
In Workbench run `USE mcart_db; SHOW TABLES;` and you see tables such as `products_product` and `accounts_user`.

**Next: Part 5.**

---

## Part 5: Start the Mcart website (4 min)
Open a **second** terminal in the same project folder (keep the first one running):
```
cd frontend
npm install
npm start
```
The first `npm install` takes a few minutes. Your browser opens **http://localhost:3000**. Use `localhost:3000` for the shop and `127.0.0.1:8000` for the backend, exactly as shown.

✅ **Checkpoint:** you see **Mcart** in the top bar, all 7 departments and the product pictures.

**Next: Part 6.**

---

## Part 6: Try Google login (2 min)
1. Click **Sign in**. Under the form you see an **or** line and a **Continue with Google** button.
2. Click it, choose your Google account, and approve.
3. You land back in Mcart, signed in. Add something to the cart to confirm it works.

✅ **Checkpoint:** you are signed in. In Workbench run `SELECT id, username, email FROM mcart_db.accounts_user;` and your Google email is in the list.

🎉 **Phase A is done.** Mcart works fully on your computer. **Next: Phase B, Part 7.**

---

# PHASE B: Move the database to Aiven (cloud)

## Part 7: Prepare your Aiven database (8 min)
You already have an Aiven MySQL service. Mcart gets its own database inside it, so it never mixes with your old project.

1. Go to **https://console.aiven.io** and open your MySQL service.
2. **Reset the password.** On the **Overview** page, click the circular-arrow icon on the **Password** row and confirm. Click the **copy icon** on that row so the new password is copied. Never screenshot it.
3. **Create the database.** In the left menu click **Connect, then Databases**, click **Create database**, and name it `mcart_db`.
   If you cannot find that button, skip this step and use `defaultdb` as the database name in Part 8.
4. **Get the certificate.** On the Overview page, click the download icon on the **CA certificate** row and save it as **`ca.pem`** inside the project's `backend/certs/` folder. You can also copy `ca.pem` from your old project's `backend/certs/` folder, because it is the same service.
5. Check the file starts with `-----BEGIN CERTIFICATE-----` and ends with `-----END CERTIFICATE-----`.

✅ **Checkpoint:** `backend/certs/ca.pem` exists, the database `mcart_db` is created, and your new password is copied.

**Next: Part 8.**

---

## Part 8: Switch Mcart to Aiven (4 min)
1. Open `backend/.env`.
2. In the **STEP 3** section, delete the `# ` at the start of the 6 `AIVEN_DB_` lines. The host and port are already filled in. Paste your new password after `AIVEN_DB_PASSWORD=`. Leave `AIVEN_DB_NAME=mcart_db` (or change it to `defaultdb` if you skipped the database in Part 7). Save.
3. In the backend terminal press **Ctrl+C**, then run:
   ```
   python check_setup.py
   python manage.py migrate
   python manage.py seed
   python manage.py createsuperuser
   python manage.py runserver
   ```
   `check_setup.py` should now say **Using: AIVEN cloud** and **connected to the database**.
   The Aiven database starts **empty**, so `migrate` and `seed` run again. Your local users and orders are not copied.
4. Refresh **http://localhost:3000** and sign in with Google again.

✅ **Final checkpoint:** the shop looks identical, and `accounts_user` in Aiven shows your email.

**To go back to local at any time:** put `# ` back in front of the Aiven lines in `.env` and restart the backend.

🎉 **Done.** Next step: open `DEPLOY_GUIDE.md` to put Mcart on GitHub and Vercel.

---

## Make a Google user an admin (optional)
New users are normal customers. To let someone manage products, run this in the `backend` folder, replacing the email:
```
python manage.py shell -c "from django.contrib.auth import get_user_model as g; u=g().objects.get(email='you@gmail.com'); u.is_staff=True; u.save()"
```
Sign out and back in. A **Manage** link appears in the menu.

---

## Troubleshooting
| What you see | Why | Fix |
|---|---|---|
| Workbench: "Can't connect to MySQL server on localhost:3306" | MySQL is not running | Start the MySQL80 service (Windows **Services**, find **MySQL80**, Start), then retry. |
| `check_setup.py` or `migrate`: "Access denied for user 'root'" | `DB_PASSWORD` in `.env` differs from your Workbench password | Put your real Workbench root password after `DB_PASSWORD=` and save. |
| `migrate` says `Unknown database 'mcart_db'` | Part 1 was skipped | Run the `CREATE DATABASE` line from Part 1 in Workbench. |
| Port already in use (8000 or 3000) | The old ShopSphere servers are still running | Click their terminals and press **Ctrl+C**. |
| Google page says `redirect_uri_mismatch` | Address differs from the app | Re-copy it from Part 2 step 3 (final `/`, and `127.0.0.1`, not `localhost`). Wait 5 minutes. |
| Google says "Access blocked" or "app not verified" | Consent screen is in Testing mode | Add your Gmail under **Audience, then Test users**. |
| Google says `invalid_client` | The secret in `.env` is not an enabled secret | Add a new secret in Google (Part 2 step 5), paste it into `.env`, restart the backend. |
| Button says "Google sign-in is not set up yet" | `.env` missing or Google keys empty | Redo Part 3, then restart the backend. |
| `pip install` fails | Wrong Python or no internet | Check `python --version` (3.10 or newer) and your connection, then retry. |
| Aiven: `migrate` hangs or cannot connect | Wrong host or port, service powered off, or IP filter | Re-check them. In Aiven make sure the service is **Running** and **Allowed IP addresses** includes yours. |
| SSL or certificate error on Aiven | `ca.pem` missing or misplaced | Put it at `backend/certs/ca.pem` (Part 7 step 4). |
| `ModuleNotFoundError` | Virtual environment not active | Run `venv\Scripts\activate` (Windows) or `source venv/bin/activate`, then retry. |
| `venv\Scripts\activate` says scripts are disabled | PowerShell security setting | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, then `venv\Scripts\Activate.ps1`. |
| `check_setup.py` shows `FIX` | Something in `.env`, the database or Google is not ready | Read the FIX line; it names the problem. Fix it and run the check again. |
| Product pictures are blank | Pictures load from the internet (Unsplash) | Check your connection or ad-blocker. |

## Good to know
- **Product pictures** are web links saved in the database by `seed`. They are not files in the zip, so the shop needs an internet connection to show them.
- **Same email, same account.** A shopper who first signed up with a password and later uses Google with the same email keeps the same account, orders and cart.
- **Aiven billing:** the free MySQL plan is closed for new accounts. Your service runs on trial credits, so check **Billing** in Aiven before you show Mcart to anyone.
- **Secrets that appeared in screenshots or chats:** treat them as exposed. Replace the Google secret and the Aiven password, and never share `.env`.
- **Before going live,** the development `SECRET_KEY` and `DEBUG = True` in `settings.py` are for local use only. Vercel uses safe production settings (see `DEPLOY_GUIDE.md`).
- **A stale build folder was removed.** `frontend/build` held the old ShopSphere name. `npm start` does not need it, and `npm run build` makes a fresh one.

## What was added to your finished project
**Renamed:** the title and wordmark are now **Mcart** in the top bar, footer, page title, messages and package name. Everything else looks and works as before.
**New files:** `backend/accounts/google_oauth.py`, `backend/accounts/google_urls.py`, `backend/.env`, `backend/.env.example`, `backend/check_setup.py`, `backend/certs/README.txt`, `backend/ecommerce_backend/production.py`, `backend/.python-version`, `frontend/src/components/GoogleButton.js`, `frontend/src/pages/GoogleCallback.js`, `frontend/src/styles/google.css`, `frontend/vercel.json`, `.gitignore`, `SETUP_GUIDE.md`, `DEPLOY_GUIDE.md`.
**Small changes:** `settings.py` (reads `.env`, Google, Aiven switch), `ecommerce_backend/urls.py` (1 line), `requirements.txt` (PyMySQL replaces the compiled driver, plus `python-dotenv`), `App.js` (1 import, 1 route), `SignIn.js` and `SignUp.js` (the Google button).
