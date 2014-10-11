var Package = require('dgeni').Package;
var path = require('canonical-path');

module.exports = new Package('angular-material-demos', [
  require('dgeni-packages/base'),
  require('dgeni-packages/nunjucks')
])

.factory(require('./file-readers/demo'))

.config(function(readFilesProcessor, demoFileReader) {
  readFilesProcessor.fileReaders = [demoFileReader];
  readFilesProcessor.basePath = path.resolve(__dirname,'../../');
  readFilesProcessor.sourceFiles = [
    { include: 'src/**/demo*/*', basePath: 'src' },
  ];
})

.config(function(computeIdsProcessor) {
  computeIdsProcessor.idTemplates.push({
    docTypes: [],
    getId: function(doc) {
      return doc.id;
    },
    getAliases: function(doc) {
      return [doc.id];
    }
  });
})

.config(function(computePathsProcessor) {
});
