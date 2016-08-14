import webpack from 'webpack'
import path from 'path'

export default {
  entry: {
    main: './src/index.js',
  },

  devtool: '#cheap-module-inline-source-map',

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'public'),
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
      },
      {
        // for markdown-it entities module
        test: /\.json$/,
        loader: 'json',
      },
      {
        test: /\.less$/,
        loader: 'style!css!autoprefixer!less',
      },
      {
        test: /\.woff$/,
        loader: 'url',
      },
      {
        test: /\.gif|\.png|\.jpg|\.svg$/,
        loader: 'file',
        include: [
          path.resolve(__dirname, 'src/static'),
          path.resolve(__dirname, 'art'),
        ],
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
}
