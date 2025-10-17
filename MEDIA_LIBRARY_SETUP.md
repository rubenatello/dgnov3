# Media Library - Complete Setup Guide

## ✅ What's Been Fixed

### 1. **Alt Text Auto-Population**
- The alt field now auto-fills with the description as you type
- You can still customize it if needed
- Saves time and ensures accessibility

### 2. **Styled File Upload Button**
- Big, visible upload area with dashed border
- Shows file name after selection
- Hover effects for better UX

### 3. **Image URL Field**
- Added "OR" option to paste a direct image URL
- You can either upload a file OR paste a URL
- Great for using images from CDNs or external sources

### 4. **TypeScript Fixes**
- Fixed Timestamp type issues
- Added `usageCount` and `lastUpdated` fields to Media model
- All compilation errors resolved

---

## 🚨 **YOU STILL NEED TO FIX CORS** (Required for uploads to work!)

The upload will fail with CORS errors until you do this:

### **Option 1: Firebase Console (Easiest - 2 minutes)**

1. Go to: [Firebase Storage Rules](https://console.firebase.google.com/project/dgno-675a8/storage/dgno-675a8.firebasestorage.app/rules)
2. Click the **Rules** tab
3. Replace the rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Anyone can read/view images
      allow write: if request.auth != null; // Only logged-in users can upload
    }
  }
}
```

4. Click **Publish**

That's it! Your uploads will work after this.

---

### **Option 2: Using Firebase CLI** (If you prefer command line)

1. Check if Firebase CLI is installed:
   ```powershell
   firebase --version
   ```

2. If not installed:
   ```powershell
   npm install -g firebase-tools
   ```

3. Login:
   ```powershell
   firebase login
   ```

4. Update your `storage.rules` file in the project root with the rules above

5. Deploy:
   ```powershell
   firebase deploy --only storage
   ```

---

## 🎯 How to Use Your Media Library

### **Upload a File:**
1. Click "Add Media" button
2. Click the upload area to choose a file
3. Fill in title, description (alt auto-fills)
4. Add source credit (e.g., "Getty Images")
5. Click Upload

### **Use an Image URL:**
1. Click "Add Media" button
2. Skip the file upload
3. Paste an image URL in the "Image URL" field
4. Fill in the rest of the metadata
5. Click Upload

### **Filter & Search:**
- Click "All", "Images", or "Videos" to filter
- Use the search box to find by title

---

## 📊 What Gets Stored

### **In Firebase Storage:**
- The actual image/video files
- Organized in `/images/` and `/videos/` folders

### **In Firestore `media` Collection:**
```javascript
{
  id: "abc123",
  url: "https://firebasestorage.googleapis.com/...",
  title: "Donald Trump UN 2025",
  description: "President Trump speaking at UN",
  alt: "President Trump speaking at UN",
  sourceCredit: "Chip Somodevilla/Getty Images",
  type: "image",
  uploadedAt: Timestamp,
  uploadedBy: "user-uid",
  usageCount: 0,
  lastUpdated: Timestamp
}
```

---

## 🔮 Next Steps

1. **Fix CORS** (Option 1 above - takes 2 minutes!)
2. Test upload with a file
3. Test upload with a URL
4. Try filtering and searching

Once CORS is fixed, everything will work perfectly! 🎉

---

## 🐛 Troubleshooting

**"Upload failed"**
- Check browser console for detailed error
- Make sure CORS rules are deployed
- Verify you're logged in as a staff user

**"Access Denied"**
- Make sure you're logged in
- Check that your user has `isStaff: true` in Firestore

**File upload stuck**
- This is the CORS issue - follow Option 1 above to fix

---

**All code changes are complete!** Just fix the CORS rules and you're good to go! 🚀
