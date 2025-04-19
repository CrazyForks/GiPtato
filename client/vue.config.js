module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  outputDir: '../server/public',
  publicPath: '/',
  lintOnSave: false,
  transpileDependencies: true
}; 