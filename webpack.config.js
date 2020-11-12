const path              = require('path');
const webpack           = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const VueLoaderPlugin   = require('vue-loader/lib/plugin');

// let packPlugins = {};
// packPlugins['Vue'] = 'vue';
// packPlugins['VueResource'] = 'vue-resource';

// let aliasPlugin = {};
// aliasPlugin['vue'] = 'vue/dist/vue.min.js';
// aliasPlugin['vue-resource'] = 'vue-resource/dist/vue-resource.min.js';

module.exports = {

    entry : {
        index : './src/index'
    },

    output : {

        path : path.join(__dirname, './dist/js'),
        filename : '[name].min.js'

    },

    module: {
        rules: [
            {
                test : [/\.scss$/,/\.sass$/],
                use : [MiniCssExtractPlugin.loader,'css-loader','sass-loader']
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                    presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    
    plugins: [

        new MiniCssExtractPlugin({
            filename: './../css/[name].min.css'
        }),
        // new ExtractTextPlugin('./../css/[name].min.css'),
        // new VueLoaderPlugin(),
        new webpack.ProvidePlugin({
            Vue: ['vue/dist/vue.esm.js', 'default'],
            VueResource : ['vue-resource/dist/vue-resource.esm.js', 'default']
        })
    ],

    resolveLoader : {
        extensions : ['-loader'],
        modules: ['node_modules']
    },

    resolve : {
        modules : [
            path.resolve(__dirname,'node_modules')
        ],
        alias: {
            'vue': 'vue/dist/vue.esm.js',
            'vue-resource' : 'vue-resource/dist/vue-resource.esm.js'
        }

    }
}
