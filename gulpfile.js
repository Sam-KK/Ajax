var gulp            = require('gulp'),
    autoprefixer    = require('gulp-autoprefixer'),
    cleanCSS        = require('gulp-clean-css'),               // 压缩CSS为一行；
    minifycss       = require('gulp-minify-css'),              // 压缩css
    merge           = require('gulp-merge'),
    jshint          = require('gulp-jshint'),                  // 检查js代码
    prettify        = require('gulp-jsbeautifier'),            //格式化代码
    ejs             = require("gulp-ejs"),
    plumber         = require('gulp-plumber'),                 // 捕获处理任务中的错误
    rename          = require('gulp-rename'),
    ugLify          = require('gulp-uglify'),                  // 压缩js
    imageMin        = require('gulp-imagemin'),                // 压缩图片
    changed         = require('gulp-changed'),                 // 检查改变状态
    less            = require('gulp-less'),                    // 压缩合并less
    notify          = require('gulp-notify'),                  // 相当于 console.log()
    del             = require('del'),                          // 文件删除
    watch           = require('gulp-watch'),
    spritesmith     = require('gulp.spritesmith'),            //
    browserSync     = require("browser-sync").create(),        // 浏览器实时刷新
    reload          = browserSync.reload;


// 删除 dist下的所有文件
gulp.task('delete',function(){
    return del(['dist/*']);
});

// 生成多个精灵图
gulp.task('sprite', function () {
    var spriteData = gulp.src('src/sprite/icon/*.png')                        //需要合并的图片地址
        .pipe(spritesmith({
            imgName: 'icon.png',                                                //保存合并后图片的地址
            retinaImgName: 'icon@2x.png',
            retinaSrcFilter: ['src/sprite/icon/*@2x.png'],
            cssName: 'sprites.less',                                            //保存合并后对于css样式的地址
            padding: 5,                                                         //合并时两个图片的间距
            cssFormat: 'less',
            algorithm: 'binary-tree',                                           //注释1
            cssTemplate: "src/sprite/template/sprites.less.template"          //注释2
        }));
    var imgStream = spriteData.img
        .pipe(plumber({
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(gulp.dest('src/images/'))
        .pipe(notify());
    var cssStream = spriteData.css
        .pipe(plumber({
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(gulp.dest('src/sprite/styles/'))
        .pipe(notify());
    return merge(imgStream, cssStream);
});


// 编译html
gulp.task('html', function () {
    gulp.src('src/**/*.html')
        .pipe(plumber({
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(changed('dist/', {hasChanged: changed.compareSha1Digest}))
        .pipe(ejs())
        .pipe(prettify())
        .pipe(gulp.dest("dist/"))
        .pipe(reload({
            stream:true
        }));
});

// 定义Libs任务
gulp.task('Libs', function () {
    gulp.src('src/libs/**/*')
        .pipe(plumber({
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(changed('dist/libs', {hasChanged: changed.compareSha1Digest}))
        .pipe(gulp.dest('dist/libs'));
});

// 定义 fonts 任务
gulp.task('Fonts', function () {
    gulp.src('src/fonts/**/*')
        .pipe(plumber({
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(gulp.dest('dist/fonts'));
});

// 实时编译less
gulp.task('less', function () {
    gulp.src('src/less/**/*.less')                         // 多个文件以数组形式传入
        .pipe(plumber({
            errorHandler: notify.onError('Less 编译失败! Error: <%= error.message %>')
        }))
        .pipe(less())                                     // 编译less文件
        .pipe(autoprefixer(
            {
                browsers: ['last 10 version', 'last 6 Explorer versions', 'safari 4', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4', 'Firefox >= 20'],
                cascade: true, //是否美化属性值 默认：true 像这样：
                remove: true //是否去掉不必要的前缀 默认：true
            }
        ))
        .pipe(gulp.dest('src/css'))
        .pipe(minifycss())
        .pipe(cleanCSS())                                 // 压缩新生成的css
        .pipe(rename({
            suffix:'.min'
        }))                                               // 给文件添加.min后缀
        .pipe(gulp.dest('dist/css'))                      // 输出压缩文件到指定目录
        .pipe(reload({
            stream:true
        }));
});

//压缩js
gulp.task("script",function(){
    gulp.src('src/js/**/*.js')
        .pipe(plumber({
            errorHandler: notify.onError('JavaScript 编译错误! Error: <%= error.message %>')
        }))
        .pipe(changed('dist/js', {hasChanged: changed.compareSha1Digest}))
        .pipe(gulp.dest('dist/js'))
        .pipe(reload({
            stream:true
        }));
});

// 压缩图片
gulp.task('images', function () {
    gulp.src('src/images/**/*')
        .pipe(plumber({
            errorHandler: notify.onError('Error: <%= error.message %>')
        }))
        .pipe(changed('dist/images'))
        .pipe(gulp.dest('dist/images'))
        .pipe(reload({
            stream:true
        }));
});



//启动热更新
gulp.task('serve', ['delete'], function() {
    gulp.start('script', 'less', 'images', 'html', 'Libs', 'Fonts', 'sprite', 'delete');
    browserSync.init({
        server: {
            baseDir: [
                'dist',
                'src'
            ]
        },
        open: false
    });

    // 监控文件变化，自动更新
    gulp.watch('src/images/sprite/icon/*.png', ['sprite']);
    gulp.watch('src/sprite/styles/sprites.less', ['images', 'less']).on('change', reload);
    gulp.watch('src/js/**/*.js', ['script']).on('change', reload);
    gulp.watch('src/less/**/*.less', ['less']);
    gulp.watch('src/**/*.html', ['html']).on('change', reload);
    gulp.watch('src/libs/**/*', ['Libs']);
    gulp.watch('src/images/**/*', ['images']).on('change', reload);
    gulp.watch('src/fonts/**/*', ['Fonts']);
});

gulp.task('default',['serve']);

gulp.task('build', function () {
    browserSync.init({
        server: {
            baseDir: [
                'dist'
            ]
        },
        open: true
    });
});
