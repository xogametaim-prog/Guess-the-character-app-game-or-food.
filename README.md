# 👑 TRL TEAM - Guess Party Game 👑
### Lead Developer: TAIM (TRL Team for Development)

<p align="center">
  <img src="./trl_logo.png" alt="TRL Team for Development" width="400" style="border-radius: 20px; box-shadow: 0px 10px 30px rgba(0,0,0,0.5);" />
</p>

---

## 📝 Arabic / بالعربية

### 🎮 عن اللعبة (About the Game)
لعبة **Guess Party** هي لعبة جماعية حماسية ومسلية جداً تعتمد على تخمين الكلمات والصور! تحتوي اللعبة على أكثر من 300 عنصر موزعة على تصنيفات مميزة مثل:
* 👧 **بنات (Girls)** - يحتوي على صور بنات حقيقية وتلميحات مميزة.
* 👦 **أولاد (Boys)** - يحتوي على صور أولاد حقيقية وتلميحات مميزة.
* 🍕 **أطعمة منوعة (Random Food)** - يحتوي على صور أطعمة شهية مثل البيتزا والبرجر والسوشي والدونات.
* 🍎 **الفواكه والخضار**، 🍬 **الحلويات**، 📱 **التطبيقات الشهيرة**، وغيرها الكثير!

#### 🕹️ أنماط اللعب المتوفرة:
1. **وضع الجبهة (Forehead Mode - Solo / Pass Device)**: يضع اللاعب الهاتف على جبهته، ويقوم أصدقاؤه بمساعدته في تخمين الكلمة المعروضة من خلال تقديم التلميحات والأصوات الحماسية!
2. **وضع التحدي المشترك (Online Versus)**: تحدي مباشر وحقيقي أونلاين بين لاعبين اثنين، حيث يرى كل لاعب بطاقة الآخر ويحاولان التخمين في نفس الوقت!

#### ✨ مميزات التطبيق الجديدة:
* **اهتزاز تفاعلي (Haptic Feedback)**: اهتزاز حقيقي في يدك عند الإجابة الصحيحة أو التجاوز أو طلب التلميح (لأجهزة الجوال المدعومة).
* **نظام صوتي تفاعلي**: نغمات رنين موسيقية جديدة ومميزة عند كشف التلميحات (Sparkling audio tones).
* **صور حقيقية**: دعم كامل لعرض الصور للتصنيفات الجديدة (بنات، أولاد، أطعمة منوعة) بدلاً من الإيموجي العادي لتجربة بصرية فريدة وجميلة جداً!
* **صور الحساب (Avatar selection)**: يمكنك الآن اختيار الأفاتار الخاص بك من بين مجموعة رائعة من الرموز لتظهر بها أمام أصدقائك في الغرفة أونلاين.

---

### 🚀 كيف تنشر اللعبة وتلعب مع أصدقائك؟ (How to Share & Play)
لقد رأينا لقطة الشاشة الخاصة بك لصفحة **GitHub Pages**، ونود توضيح نقطة تقنية هامة جداً لك لتلعب أونلاين بدون مشاكل:

#### ⚠️ التنبيه الهام بخصوص GitHub Pages:
* منصة **GitHub Pages** مخصصة فقط لاستضافة الملفات الثابتة (Static Files - HTML/CSS/JS).
* اللعبة تحتوي على **خادم خلفي (Backend Server)** مكتوب بلغة Node.js/Express (في ملف `server.ts`) وهو المسؤول عن إنشاء الغرف ومزامنة نقاط اللاعبين والبطاقات أونلاين بين الهواتف المختلفة.
* **النتيجة**: إذا قمت برفع اللعبة على GitHub Pages مباشرة، سيعمل اللعب الفردي والمحلي بشكل ممتاز، ولكن **وضع اللعب أونلاين مع الأصدقاء (Online Versus) لن يعمل** لأن متصفح صديقك لن يجد الخادم الخلفي ليربط الغرفة به.

#### 🛠️ الحلول البديلة لنشر اللعبة بالكامل (خلفية + أمامية):

##### 1️⃣ الخيار الأسهل والسريع: استخدام رابط AI Studio المباشر!
يمكنك ببساطة نسخ الرابط المشترك الخاص بك من لوحة التحكم وإرساله لأصدقائك مباشرة:
* **Shared App URL**: `https://ais-pre-5z2n3mjqkvflfanylkocb5-82096754225.europe-west2.run.app`
* هذا الرابط مدعوم بخادم كامل يعمل على مدار الساعة ويمكنك اللعب فيه مباشرة ومشاركة الأكواد مع أصدقائك!

##### 2️⃣ رفع السيرفر على منصة مجانية مثل Render أو Railway:
إذا كنت ترغب في تشغيل موقعك الخاص على GitHub والربط بسيرفر حقيقي:
1. قم بإنشاء حساب مجاني على موقع **[Render](https://render.com)** أو **[Railway](https://railway.app)**.
2. اربطه بمستودع الـ GitHub الخاص بك.
3. اختر نوع الخدمة **Web Service** وتأكد من تحديد:
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
4. ستقوم المنصة بإعطائك رابطاً للسيرفر الخلفي (مثلاً: `https://my-game-server.onrender.com`).
5. قم بتعديل رابط الـ API في الكود الأمامي ليشير إلى السيرفر الخاص بك، ومن ثم يمكنك استخدام GitHub Pages للواجهة الأمامية والربط بالسيرفر بنجاح!

---

## 📝 English

### 🎮 About the Game
**Guess Party** is an exciting, fast-paced multiplayer and party game built by **TRL Team** under the leadership of **Taim**! It features over 300 highly curated cards across diverse and interactive categories:
* 👧 **Girls** - High-quality photos of girls with clever and descriptive hints.
* 👦 **Boys** - High-quality photos of boys with fun hints.
* 🍕 **Random Food** - Delicious close-ups of pizzas, burgers, sushi, donuts, and more.
* 🍎 **Fruits & Veggies**, 🍬 **Sweets & Candies**, 📱 **Famous Apps**, and more!

#### 🕹️ Dual Gameplay Modes:
1. **Forehead Mode (Local Party)**: Place the phone on your forehead. Friends shout hints and make sounds to help you guess the card!
2. **Online Versus Mode**: Dynamic, real-time online lobby. You hold your phone, see your friend's card, and they see yours as you race against the clock.

#### ⚡ Crafted Features:
* **Haptic Vibration Feedback**: Subtle physical device vibration on Correct (double pulse), Pass (medium pulse), and Hint (short pulse).
* **Acoustic Harmony**: Implemented sparkling synthesizer tones when hints are revealed in both game modes.
* **Visual Cards**: Added full support for fetching and rendering real images instead of static emojis, creating a modern, premium look.
* **Avatars**: Customize your profile using the newly implemented interactive avatar slider before creating or joining rooms.

---

### 🌐 Deploying & Playing with Friends
As seen in your screenshot, you have configured **GitHub Pages**. Here is a technical breakdown of how to make online multiplayer work seamlessly:

#### ⚠️ The GitHub Pages Constraint
* **GitHub Pages** is a static file host. It cannot execute active backend Node.js servers (`server.ts`).
* The multiplayer engine requires a running Express backend to orchestrate room creation, player scores, and real-time game states.
* **Status**: Running the app directly on GitHub Pages will allow single-device offline play, but **creating or joining online lobbies will fail**.

#### 💡 Recommended Solutions for Multiplayer Deployment:

##### 1️⃣ Use your Cloud Run deployment directly!
Your workspace is already hosted on Google Cloud Run with a fully operational production server. Simply share this secure URL with your friends to start playing immediately:
👉 **[Play Guess Party Now!](https://ais-pre-5z2n3mjqkvflfanylkocb5-82096754225.europe-west2.run.app)**

##### 2️⃣ Deploy the Full-Stack app on Render / Railway
If you want to host it yourself:
1. Register on **[Render](https://render.com/)** or **[Railway.app](https://railway.app/)**.
2. Connect your GitHub repository.
3. Configure the environment variables (e.g. `NODE_ENV=production`).
4. Set the build script to: `npm install && npm run build` and the start script to: `npm start`.
5. Your app will automatically boot and expose a secure port 3000 to coordinate game lobbies across any device!

---

## 🎨 How to apply your TRL Logo
1. Save the golden logo image you provided as **`trl_logo.png`** in the root directory of your project folder.
2. Push the file to GitHub.
3. The image will load automatically inside this `README.md` and display your team's beautiful gold and crown emblem!
