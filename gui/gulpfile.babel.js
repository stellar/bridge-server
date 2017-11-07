'use strict';

var _       = require('lodash');
var bs      = require('browser-sync').create();
var gulp    = require('gulp');
var path    = require('path');
var webpack = require("webpack");

gulp.task('default', ['develop']);

var webpackOptions = {
  entry: {
    app: "./src/app.js",
    vendor: ["react", "react-dom", "muicss", "stellar-sdk", "axios", "d3", "fbemitter"]
  },
  devtool: "source-map",
  resolve: {
    root: [
      path.resolve('src'),
      path.resolve('common')
    ],
    modulesDirectories: ["node_modules"]
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader', query: {presets: ['es2015', 'react']}},
      {test: /\.json$/, loader: 'json'},
      {test: /\.html$/, loader: 'file?name=[name].html'},
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/ed25519/)
  ]
};

gulp.task('develop', function(done) {
  var options = merge(webpackOptions, {
    output: {
      filename: "[name].js",
      path: './.tmp/admin'
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.js")
    ]
  });

  var watchOptions = {
    aggregateTimeout: 300
  };

  var bsInitialized = false;

  var compiler = webpack(options);
  compiler.purgeInputFileSystem();
  compiler.watch(watchOptions, function(error, stats) {
    if (!bsInitialized) {
      gulp.watch(".tmp/**/*").on("change", bs.reload);
      bs.init({
        port: 3000,
        online: false,
        notify: false,
        server: "./.tmp",
        startPath: '/admin/index.html',
        socket: {
          // Golang httputil.ReverseProxy removes trailing slash from request before passing
          // it to destination folder. This made the socket.io used by browser-sync fail.
          // Make sure socket.io client connects to the destination server (not use proxy).
          domain: 'localhost:3000'
        }
      });
      bsInitialized = true;
    }
    console.log(stats.toString({
      hash: false,
      version: false,
      timings: true,
      chunks: false,
      colors: true
    }));
  });
});

gulp.task('build', function(done) {
  var options = merge(webpackOptions, {
    bail: true,
    output: {
      // TODO chunkhash
      filename: "[name].js",//"[name]-[chunkhash].js",
      path: './dist'
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.js"),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
        }
      }),
      new webpack.optimize.UglifyJsPlugin()
    ]
  });

  var compiler = webpack(options);
  compiler.purgeInputFileSystem();
  compiler.run(done);
});


function merge(object1, object2) {
  return _.mergeWith(object1, object2, function(a, b) {
    if (_.isArray(a)) {
      return a.concat(b);
    }
  });
}