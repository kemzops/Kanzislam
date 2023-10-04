export default async (param) => {

    const config = param.config;
    let User = param.database.User

    param.app.post('/login', async (request, response) => {

        const { username, password } = request.body;
        const GetUser = await User.findOne({
            where: { name: username}
        });
        console.log(GetUser?.dataValues);

        // تعيين متغير لتتبع عدد مرات إدخال بيانات غير صحيحة
        let loginAttempts = request.session.loginAttempts || 0;

        // تحقق من عدد مرات إدخال بيانات غير صحيحة والوقت الحالي
        if (loginAttempts >= 5) {
            const lockedUntil = request.session.lockedUntil || 0;
            const currentTime = Date.now();

            // تحقق من وقت انتهاء فترة القفل
            if (currentTime < lockedUntil) {
                const remainingTime = Math.ceil((lockedUntil - currentTime) / 1000 / 60);
                response.json({ logged_in: false, locked: true, massage: `لقد تجاوزت الحد المسموح لمحاولات تسجيل الدخول. الرجاء المحاولة مرة أخرى بعد ${remainingTime} دقيقة.` });
                return;
            } else {
                // إعادة ضبط عدد مرات إدخال بيانات غير صحيحة بعد انتهاء فترة القفل
                request.session.loginAttempts = 0;
                request.session.lockedUntil = 0;
            }
        }

        // قم بتنفيذ عملية التحقق من بيانات تسجيل الدخول والتحقق من صحتها
        if (GetUser?.dataValues?.username === username && GetUser?.dataValues?.password === password) {
            // إعادة ضبط عدد مرات إدخال بيانات غير صحيحة في حالة النجاح
            request.session.loginAttempts = 0;
            request.session.lockedUntil = 0;

            // قم بتعيين متغير الجلسة للإشارة إلى أن المستخدم مسجل دخولًا
            request.session.isLoggedIn = true;
            request.session.username = username;
            response.json({ logged_in: true, massage: 'تم تسجيل الدخول بنجاح!' });
        } else {
            // زيادة عدد مرات إدخال بيانات غير صحيحة في حالة الفشل
            request.session.loginAttempts = loginAttempts + 1;
            request.session.isLoggedIn = false;
            // تحديد وقت انتهاء فترة القفل (نصف ساعة)
            const lockDuration = 30 * 60 * 1000; // بالمللي ثانية
            const lockedUntil = Date.now() + lockDuration;
            request.session.lockedUntil = lockedUntil;

            response.json({ logged_in: false, massage: 'فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.' });
        }
    });


    param.app.get('/login', async (request, response) => {

        let options = {
            website_name: config.WEBSITE_NAME,
            title: `عنوان الصفحة - ${config.WEBSITE_NAME}`,
            keywords: ["word1", "word2", "word3"],
            description: "وصف_الصفحة",
            preview: "صورة_المعاينة_للصفحة",
            session: request.session
        };
        let pugPath = param.path.join(param.__dirname, './views/login.pug');
        let render = param.pug.renderFile(pugPath, { options: options, jsStringify: param.jsStringify });
        response.send(render);
    });
}