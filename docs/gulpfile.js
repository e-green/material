var gulp = require('gulp');
var through = require('through');
var path = require('path');
var _ = require('lodash');
var sass = require('node-sass');
var fs = require('fs');
var concat = require('gulp-concat');

var demos = {};
var jsFiles = [];
var projectPath = __dirname + '/..';

gulp.task('default', ['demos']);

gulp.task('demos', ['process-demos'], function() {
  //write all of the demo javascript to dist, leave the rest for json and lazy loading
  return gulp.src(jsFiles)
    .pipe(concat('demo-javascripts.js'))
    .pipe(gulp.dest(projectPath + '/dist/docs/js'))
    .on('end', function() {
      fs.writeFileSync(projectPath + '/dist/docs/js/demo-data.js', JSON.stringify(demos));
    });
});

gulp.task('process-demos', function() {
  return gulp.src(projectPath + '/src/**/demo*/**')
    .pipe(through(function(file) {
      if (!file.stat.isFile()) return;

      var module = getModule(file);
      var moduleLastName = module.split('.').pop();
      var demoId = getDemoId(file);
      var fileType = path.extname(file.path).substring(1);

      if (fileType === 'js') {
        jsFiles.push(file.path);
        return;
      }

      demos[module] = demos[module] || [];
      var demo = _.find(demos[module], { name: demoId });
      if (!demo) {
        demos[module].push(demo = {
          name: demoId,
          css: [],
          html: []
        });
      }

      demo[fileType].push(renderedContents(file.contents.toString()));

      function renderedContents(contents) {
        if (fileType !== 'css') {
          return contents;
        } else {
          try {
            // Namespace the css to the demo only
            return sass.renderSync('.' + moduleLastName + '-' + demoId + '{\n' + contents + '}');
          } catch(e) {
            console.log('Error rendering sass for ' + file.path);
            console.log(e);
            process.exit(0);
          }
        }
      }

    }));
});

function getModule(file) {
  var srcPath = file.path.replace(file.base, '');
  var split = srcPath.split('/');
  return 'material.' + split[0] + '.' + split[1];
}

function getDemoId(file) {
  var match = file.path.match(/\/demo.*?\//);
  if (!match) return;
  return match[0].replace(/\//g, '');
}
