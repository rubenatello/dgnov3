# 🚀 Quick Deployment Guide - SEO Fixes

## Deploy in 3 Steps

### 1️⃣ Deploy Cloud Functions (Sitemap)
```powershell
firebase deploy --only functions
```
⏱️ Takes ~2-3 minutes

---

### 2️⃣ Deploy Frontend (Fixed URLs + robots.txt)
```powershell
cd app
npm run build
cd ..
firebase deploy --only hosting
```
⏱️ Takes ~3-5 minutes

---

### 3️⃣ Migrate Old Article Slugs

**Option A: Using Cloud Function (Easiest)**
```powershell
# After deploying functions, call the migration endpoint
Invoke-WebRequest -Method POST -Uri "https://us-central1-dgno-675a8.cloudfunctions.net/migrateArticleSlugs"
```

**Option B: Using Firebase CLI**
```powershell
cd functions
$env:GCLOUD_PROJECT="dgno-675a8"
npm run build
node lib/migrate-slugs.js
cd ..
```

⏱️ Takes ~10-30 seconds

---

## ✅ Verify Everything Works

1. **Check robots.txt:**
   ```
   https://dgno.us/robots.txt
   ```
   Should show crawler instructions

2. **Check sitemap:**
   ```
   https://dgno.us/sitemap.xml
   ```
   Should show XML with all articles

3. **Test your article:**
   ```
   https://dgno.us/article/2025/11/24/judge-tosses-indictments-of-letitia-james-and-james-comey-says-trump-picked-prosecutor-was-illegally-appointed
   ```
   Should load correctly with proper meta tags

4. **View page source** and look for:
   ```html
   <link rel="canonical" href="https://dgno.us/article/2025/11/24/..." />
   <meta property="og:url" content="https://dgno.us/article/2025/11/24/..." />
   ```
   URLs should be correct (no double `article/articles/`)

---

## 📋 Submit to Google

1. Go to: https://search.google.com/search-console
2. Add property: `dgno.us`
3. Verify ownership (DNS or HTML file)
4. Submit sitemap: `https://dgno.us/sitemap.xml`
5. Request indexing for your article

---

## 🎯 Expected Timeline

- **Today:** Deploy fixes, submit sitemap
- **2-7 days:** Google crawls and indexes pages
- **2-4 weeks:** Articles start showing in search
- **1-3 months:** Organic traffic grows
- **3-6 months:** Rank for competitive terms

---

## ❓ Quick FAQ

**Q: Will old article links break?**
A: No, the migration script updates the database. URLs remain the same.

**Q: When will I see my article in Google?**
A: 2-7 days to index, but ranking takes longer due to competition.

**Q: Do I need to update the sitemap manually?**
A: No, it updates automatically every hour.

**Q: What if something breaks?**
A: The changes are backwards compatible. Test one article before/after migration.

---

## 📞 Need Help?

- Full guide: `SEO_GUIDE.md`
- Technical details: `SEO_FIXES_SUMMARY.md`
- Migration script: `functions/src/migrate-slugs.ts`

---

## 🎉 You're Done!

After deployment:
1. ✅ URLs work correctly
2. ✅ Search engines can find your articles
3. ✅ Meta tags are properly set
4. ✅ Sitemap updates automatically

Now focus on creating great content! 🚀
