const path = require('path');
var glob = require('glob-all');
const webpack = require('webpack');
const HandlebarsPlugin = require('handlebars-webpack-plugin');
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const mergeJSON = require('handlebars-webpack-plugin/utils/mergeJSON');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Añadir esta línea

// Project config data.
const projectData = mergeJSON(path.join(__dirname, '/src/data/**/*.json'));

// PurgeCSS Paths
const purgeCSSPaths = {
    src: path.join(__dirname, 'src/html', 'html'),
    partials: path.join(__dirname, 'src/html', 'partials')
}

// paths used in various placed in webpack config
const paths = {
    src: {
        imgs: './src/assets/images',
        scss: './src/assets/scss',
        fonts: './src/assets/fonts',
        js: './src/assets/js',
        svgs: './src/assets/svgs',
        video: './src/assets/video',
        favicon: './src/assets/favicon',
    },
    dist: {
        imgs: './assets/images',
        css: './assets/css',
        fonts: './assets/fonts',
        js: './assets/js',
        svgs: './assets/svgs',
        video: './assets/video',
        favicon: './assets/favicon',
    }
}

// Main webpack config options.
const wPackConfig = {
    entry: {
        'libs': [paths.src.scss + '/libs.scss'],
        'theme': [paths.src.js + '/theme.js', paths.src.scss + '/theme.scss']
    },
    output: {
        filename: paths.dist.js + '/[name].bundle.js',
        path: path.resolve(__dirname, 'dist'), // Asegúrate de definir el path de salida
    },
    devtool: 'source-map',
    mode: 'development',
    module: {
        rules: [{
            test: /\.(sass|scss|css)$/,
            include: path.resolve(__dirname, paths.src.scss.slice(2)),
            use: [{
                    loader: MiniCssExtractPlugin.loader,
                },
                {
                    loader: 'css-loader',
                    options: {
                        url: false,
                    },
                },
                {
                    loader: 'postcss-loader'
                },
                {
                    loader: 'sass-loader',
                },
            ],
        }, ]
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/](node_modules)[\\/].+\.js$/,
                    name: 'vendor',
                    chunks: 'all'
                }
            }
        },
        minimizer: [
            new OptimizeCssAssetsPlugin({
                cssProcessorOptions: {
                    map: {
                        inline: false,
                    },
                },
                cssProcessorPluginOptions: {
                    preset: [
                        'default',
                        {
                            discardComments: {
                                removeAll: true,
                            },
                        },
                    ],
                },
            }),
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
            }),
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
        open: true, // Esto abrirá el navegador automáticamente
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new CopyPlugin({
            patterns: [{
                    from: paths.src.fonts,
                    to: paths.dist.fonts,
                    noErrorOnMissing: true
                },
                {
                    from: paths.src.imgs,
                    to: paths.dist.imgs,
                    noErrorOnMissing: true
                },
                {
                    from: paths.src.favicon,
                    to: paths.dist.favicon,
                    noErrorOnMissing: true
                },
                {
                    from: paths.src.svgs,
                    to: paths.dist.svgs,
                    noErrorOnMissing: true
                },
                {
                    from: paths.src.video,
                    to: paths.dist.video,
                    noErrorOnMissing: true
                }
            ],
        }),
        new HtmlWebpackPlugin({ // Añadir esta configuración
            template: './src/html/index.html',
            filename: 'index.html',
        }),
        new HandlebarsPlugin({
            entry: path.join(process.cwd(), 'src', 'html', '**', '*.html'),
            output: path.join(process.cwd(), 'dist', '[path]', '[name].html'),
            partials: [path.join(process.cwd(), 'src', 'partials', '**', '*.{html,svg}')],
            data: projectData,
            helpers: {
                webRoot: function() {
                    return '{{webRoot}}';
                },
                config: function(data) {
                    return data;
                },
                ifEquals: function(arg1, arg2, options) {
                    if (arg1 === arg2) {
                        return options.fn(this);
                    }
                    return options.inverse(this);
                },
                log: function(data) {
                    console.log(data);
                },
                limit: function(arr, limit) {
                    if (!Array.isArray(arr)) {
                        return [];
                    }
                    return arr.slice(0, limit);
                }
            },
            onBeforeSave: function(Handlebars, res, file) {
                const elem = file.split('//').pop().split('/').length;
                return res.split('{{webRoot}}').join('.'.repeat(elem));
            },
        }),
        new FixStyleOnlyEntriesPlugin(),
        new MiniCssExtractPlugin({
            filename: paths.dist.css + '/[name].bundle.css',
        }),
    ]
};

module.exports = wPackConfig;
