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

الموقع صفحة واحدة: المسارات مثل `/login` و`/home` ليست ملفات على السيرفر.
في الخدمة على Render افتح **Redirects/Rewrites** وأضف:

- Source: `/*`
- Destination: `/index.html`
- Action: **Rewrite**

