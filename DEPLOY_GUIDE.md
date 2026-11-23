# Mcart: Push to GitHub and Deploy on Vercel
### Deployment guide, about 40 minutes, 6 short parts

**What you are doing**
- **GitHub:** puts your code online so your professor can open one link to read it.
- **Vercel:** runs your shop on the internet. You make **two** Vercel projects from the same GitHub repository: one for the **backend** (Django API) and one for the **frontend** (the React shop).
- **Aiven:** keeps your data. Both parts already know how to reach it from your settings.

**What does NOT change:** your local setup keeps working. The new settings are used only on Vercel.

> **How to use this guide:** do the parts in order. Each part ends with a ✅ checkpoint. If yours does not match, stop and use the Troubleshooting table at the end.

---

## Part 1: Check the deployment files are in your project (2 min)
Good news: the deployment files are already included in the Mcart zip. You only check they are there.

In your code editor, check that these exist:
- `backend/ecommerce_backend/production.py`: safe settings used only on Vercel.
- `backend/.python-version`: tells Vercel to use Python 3.12.
- `frontend/vercel.json`: makes page refreshes and direct links work in the shop.
- `.gitignore`: keeps secrets and huge folders out of GitHub.
- `backend/requirements.txt` lists `PyMySQL`, not `mysqlclient`.

✅ **Checkpoint:** all five items above are present.

**Next: Part 2.**

---

## Part 2: Make your secrets safe, then push to GitHub (12 min)
**A. Replace the secrets that appeared in screenshots (5 min)**
1. **Google:** open your OAuth client in Google Cloud, click **+ Add secret**, copy it immediately, paste it after `GOOGLE_CLIENT_SECRET=` in `backend/.env`, save, then delete the older secrets.
2. **Aiven:** on the service **Overview**, click the circular-arrow icon on the **Password** row and confirm. Copy the new password into `AIVEN_DB_PASSWORD=` in `backend/.env` and save.
3. Restart the backend and run `python check_setup.py`. It should print `OK` on every line.

**B. Check nothing secret will be uploaded (1 min)**
Open a terminal in the project folder (the one that contains `backend` and `frontend`):
```
git check-ignore -v backend/.env
```
It should print a line mentioning `.gitignore`. If it prints nothing, STOP: your `.env` would be uploaded. Fix `.gitignore` first.

**C. Create the empty GitHub repository (2 min)**
1. Go to **https://github.com** and sign in.
2. Click **+**, then **New repository**.
3. Name: `mcart`. Choose **Public** (anyone with the link can read it) or **Private** (you add your professor by invitation).
4. Leave **Add a README**, **.gitignore** and **license** all **unticked**. Click **Create repository**.

**D. Upload your code (4 min)**
Run these one at a time, replacing `YOUR-USERNAME`:
```
git status
git add .
git status
git commit -m "Mcart: Google login, Aiven MySQL and Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mcart.git
git push -u origin main
```
- The second `git status` is your last look. You must **not** see `.env`, `kk`, `venv` or `node_modules` in the list.
- If Git says it does not know who you are, run `git config --global user.name "Your Name"` and `git config --global user.email "you@gmail.com"`, then repeat the `git commit`.
- If it says `remote origin already exists`, run `git remote set-url origin https://github.com/YOUR-USERNAME/mcart.git` and push again.
- A browser window may ask you to sign in to GitHub. Approve it.

✅ **Checkpoint:** refresh your GitHub repository page. You see the folders `backend` and `frontend`, and **no** `.env` file.

**Next: Part 3.**

---

## Part 3: Deploy the backend on Vercel (12 min)
1. Go to **https://vercel.com** and choose **Sign up, Continue with GitHub**.
2. Click **Add New, then Project**, find **mcart** and click **Import**.
3. **Project Name:** `mcart-api`.
4. **Root Directory:** click **Edit**, choose **`backend`**, and confirm. This is the most important setting.
5. Open **Environment Variables** and add these (name on the left, value on the right):

| Name | Value |
|---|---|
| `DJANGO_SETTINGS_MODULE` | `ecommerce_backend.production` |
| `DJANGO_SECRET_KEY` | a long random text (make one below) |
| `AIVEN_DB_HOST` | `shopsphere-db-midhun-student.f.aivencloud.com` |
| `AIVEN_DB_PORT` | `23963` |
| `AIVEN_DB_USER` | `avnadmin` |
| `AIVEN_DB_PASSWORD` | your **new** Aiven password |
| `AIVEN_DB_NAME` | `mcart_db` (or `defaultdb` if that is what you used) |
| `GOOGLE_CLIENT_ID` | your Client ID |
| `GOOGLE_CLIENT_SECRET` | your **new** Google secret |

Make the secret key in your terminal and copy the result:
```
python -c "import secrets; print(secrets.token_urlsafe(50))"
```
6. Click **Deploy** and wait for the build to finish.
7. Vercel shows your backend address, for example `https://mcart-api.vercel.app`. Write it down.
8. Open this address in your browser (use your own address):
```
https://mcart-api.vercel.app/api/products/products/
```

✅ **Checkpoint:** you see product data in your browser, with `"count": 48`.

**Next: Part 4.**

---

## Part 4: Deploy the shop website on Vercel (8 min)
1. In Vercel click **Add New, then Project** and import **mcart** again. This is a second project.
2. **Project Name:** `mcart` (this becomes the address your professor opens).
3. **Root Directory:** click **Edit** and choose **`frontend`**. Framework should show **Create React App**.
4. Add one Environment Variable:

| Name | Value |
|---|---|
| `REACT_APP_API_URL` | `https://mcart-api.vercel.app/api` (your backend address from Part 3, then `/api`) |

5. Click **Deploy**. Write down the address Vercel shows, for example `https://mcart.vercel.app`.

✅ **Checkpoint:** your shop opens with the 7 departments and product pictures. (Google login will not work until Part 5.)

**Next: Part 5.**

---

## Part 5: Connect the two parts and Google (8 min)
**A. Tell the backend where the shop lives (3 min)**
1. In Vercel open the **mcart-api** project, then **Settings, Environment Variables**.
2. Add these two (use your own addresses, no trailing `/` on the first):

| Name | Value |
|---|---|
| `FRONTEND_URL` | `https://mcart.vercel.app` |
| `GOOGLE_REDIRECT_URI` | `https://mcart-api.vercel.app/api/auth/google/callback/` |

3. Open **Deployments**, click the **⋯** menu on the newest deployment and choose **Redeploy**. Changes apply only after a redeploy.

**B. Tell Google about the new address (3 min)**
1. In Google Cloud open **Google Auth Platform, then Clients, then Mcart Web**.
2. Under **Authorized redirect URIs** click **+ Add URI** and paste your **backend** address:
   ```
   https://mcart-api.vercel.app/api/auth/google/callback/
   ```
   **Keep** the old `127.0.0.1` address so local testing still works. Click **Save**. Google can take a few minutes.
3. Click **Audience** and add your **professor's Gmail** under **Test users**, or publish the app. While the app is in Testing, only listed Gmail addresses can use Google login. Your professor can still create a normal account with a username and password.

✅ **Checkpoint:** after the redeploy, the shop at your Vercel address can sign you in with **Continue with Google**.

**Next: Part 6.**

---

## Part 6: Final test and send the links (2 min)
1. Open your shop address in a private (incognito) window.
2. Browse the departments, sign in with Google, add a product to the cart.
3. Send your professor **two links**: the **shop** address and the **GitHub** repository address.

🎉 **Done.** Next step: before you send the links, open **Billing** in Aiven and check that your database stays active after the free trial ends. If it stops, your shop shows no products.

---

## Troubleshooting
| What you see | Why | Fix |
|---|---|---|
| Backend build fails, mentions `mysqlclient` | Old `requirements.txt` was pushed | Redo Part 1, then `git add .`, `git commit`, `git push`. Vercel redeploys by itself. |
| Backend page shows an error about `DJANGO_SECRET_KEY` | The variable is missing | Add it in Settings, Environment Variables, then **Redeploy**. |
| `DisallowedHost` or `Bad Request (400)` | Your own domain is not allowed | Add the variable `DJANGO_ALLOWED_HOSTS` with your domain. `.vercel.app` addresses work without it. |
| Shop loads but shows no products and the browser console says CORS | `FRONTEND_URL` is wrong or has a trailing `/` | Set it exactly to the shop address, then **Redeploy** the backend. |
| Shop shows no products and the API address is `127.0.0.1` | `REACT_APP_API_URL` was added after the build | Add it in the shop project, then **Redeploy**. |
| Google says `redirect_uri_mismatch` | The address in Google differs | Copy the exact backend address with `/api/auth/google/callback/` at the end. Wait 5 minutes. |
| Google says "Access blocked" | Gmail is not a Test user | Add it in **Audience, then Test users**. |
| Refreshing a shop page shows `404` | `frontend/vercel.json` is missing | Redo Part 1, push again. |
| Backend cannot reach the database | Aiven service is off or restricts IPs | In Aiven check that the service is **Running** and that **Allowed IP addresses** allows all addresses. Vercel uses changing addresses. |
| Admin pages have no styling | Static files were not collected | Redeploy the backend. This affects only the admin look, not the shop. |

## Good to know
- **Every `git push` redeploys** both projects automatically.
- **Two projects, two addresses:** the shop address is for people, the backend address is the API.
- **Secrets** live only in your `.env` file and in Vercel Environment Variables, never in GitHub.
- **Hosting the backend on Vercel is a trade-off.** It runs your Django code per request, so the first visit after a quiet period can be slow. It suits a demo. If you need heavy traffic later, a normal Python host is a better fit.
- **This was prepared and tested with a stand-in database on my side.** The first real deployment is your test of PyMySQL with Aiven, so tell us exactly what Vercel's build log or the browser shows if something fails.
