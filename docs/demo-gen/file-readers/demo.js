module.exports = function demoFileReader() {
  return {
    name: 'demoFileReader',
    defaultPattern: /\.(js|css|html)$/,
    getDocs: function(fileInfo) {
      console.log(fileInfo);
    }
  };
};
