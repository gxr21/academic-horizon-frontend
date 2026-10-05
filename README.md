# Academic Horizon — Frontend

واجهة منصة الأفق الأكاديمي (React + Vite).

## التشغيل المحلي

```bash
npm install
cp .env.example .env
npm run dev
```

الافتراضي: `http://localhost:5173`  
الـ API: عيّن `VITE_API_URL` إلى عنوان الباكند (محلياً `http://localhost:3000`).

## البناء

```bash
npm run build
```

## Render (مسارات React Router)

إذا الصفحة تختفي بعد Refresh، القاعدة الحالية غالباً ترجع ملفاً فارغاً.

في الخدمة افتح **Redirects/Rewrites**:

1. احذف أي قاعدة قديمة على `/*`
2. أضف قاعدة جديدة بالضبط:
   - Source Path: `/*`
   - Destination Path: `/index.html` (مع الشرطة في البداية)
   - Action: **Rewrite** وليس Redirect
3. Save ثم انتظر دقيقة وجرب Ctrl+F5

