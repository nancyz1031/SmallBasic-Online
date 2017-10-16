import * as path from "path";
import * as webpack from "webpack";
import * as helpers from "./gulp-helpers";
import * as ExtractTextPlugin from "extract-text-webpack-plugin";

export interface IExternalParams {
    release: boolean;
}

export interface IFactoryParams {
    env: any;
    entryPath: string;
    outputFile: string;
    outputRelativePath: string;
    target: "web" | "node" | "electron-main";
}

export function parseEnvArguments(env: any): IExternalParams {
    return {
        release: !!env && (env.release === true || env.release === "true")
    };
}

export function factory(params: IFactoryParams): webpack.Configuration {
    const release = parseEnvArguments(params.env).release;
    const outputFolder = path.resolve("out", params.outputRelativePath);

    console.log(`Building ${release ? "release" : "debug"} configuration to folder: ${outputFolder}`);

    const extractSCSS = new ExtractTextPlugin("styles.css");

    const config: webpack.Configuration = {
        entry: params.entryPath,
        output: {
            path: outputFolder,
            filename: params.outputFile
        },
        target: params.target,
        devtool: "source-map",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "tslint-loader",
                    enforce: "pre",
                    options: {
                        emitErrors: true
                    }
                },
                {
                    test: /\.tsx?$/,
                    loader: "awesome-typescript-loader"
                },
                {
                    test: /\.jsx?$/,
                    loader: "source-map-loader",
                    enforce: "pre"
                },
                {
                    test: /\.scss$/,
                    use: extractSCSS.extract({
                        fallback: "style-loader",
                        use: ["css-loader?sourceMap", "sass-loader?sourceMap"]
                    })
                },
                {
                    test: /\.(png|jpg|jpeg|gif|ico)$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                name: "./images/[name].[hash].[ext]"
                            }
                        }
                    ]
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    loader: "file-loader",
                    options: {
                        name: "./fonts/[name].[hash].[ext]"
                    }
                }
            ]
        },
        resolve: {
            extensions: [".tsx", ".ts", ".jsx", ".js", ".scss"]
        },
        devServer: {
            contentBase: outputFolder
        },
        plugins: [
            new webpack.DefinePlugin({
                "process.env": {
                    "NODE_ENV": JSON.stringify(release ? "production" : "dev")
                }
            }),
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
            extractSCSS
        ]
    };

    if (params.target === "electron-main") {
        config.node = {
            __dirname: false,
            __filename: false
        };
    }

    if (params.target !== "web") {
        config.externals = helpers.getNodeModules();
    }

    if (release) {
        config.plugins!.push(new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            comments: false
        }));
    }

    return config;
}