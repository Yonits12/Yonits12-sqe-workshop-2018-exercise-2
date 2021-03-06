const path = require('path');

module.exports = {
    entry: './src/js/app.js',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src/js'),
                exclude: path.resolve(__dirname, 'node_modules'),
            },
        ]
    },
};