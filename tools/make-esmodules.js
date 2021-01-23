// copy the src folder to dist and write transformations to disk
const fs = require('fs');

// constructs paths pointing to src and dist
const path = require('path');

// performs transformations against the source to render es5 modules
const babel = require('@babel/core');

// distribution folder (where to construct the modules from root)
const dist = "dist"

// recursively copy and optionally transform the copied content
const copyRecursiveSync = function (src, dest, transform) {
    // check src exists then type check - recursively settle dirs copying all files...
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        // recursively constructing ensures the dest folder exists
        fs.mkdirSync(dest, { recursive: true });
        // recursively sync all files contained in the directory to the dest
        fs.readdirSync(src).forEach((childItemName) => {
            // calling through copyRecursiveSync recursively with same transform method
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName), transform);
        });
    } else if (src.indexOf(".DS_Store") == -1) {
        // copy the file then perform any transformations if required
        fs.copyFile(src, dest, (transform ? transform(src, dest) : () => {}));
    }
};

// decorate the log to look like rollup
const logMovement = function (src, dest, start) {
    // whats being moved...
    console.log('\033[1m\x1b[36m%s\x1b[0m', "." + path.sep + src + " → ." + path.sep + dest);
    // style the dest and time to be green and bold
    const logDest = '\033[1m\x1b[32m' + "." + path.sep + dest + '\x1b[0m';
    const logTime = '\033[1m\x1b[32m' + parseFloat((new Date() - start)/1000) + 's\x1b[0m';
    // how long did it take...
    console.log('\x1b[32mcreated \x1b[0m', logDest, '\x1b[32min\x1b[0m', logTime, "\n");
};

// es2015 module should be a direct copy of the source
copyRecursiveSync("." + path.sep + "src", "." + path.sep + dist + path.sep + "es2015", (src, dest) => {
    // time the execution
    const start = new Date();

    // after copying the file - log how long the operation took
    return (err) => (!err ? logMovement(src, dest, start) : console.warn(err));
});

// es5 should be a transpiled copy of the source (all modules included)
copyRecursiveSync("." + path.sep + "src", "." + path.sep + dist + path.sep + "es5", (src, dest) => {
    
    // after copying the file - transform the content and log how long the operation took
    return () => {
        // time the execution
        const start = new Date();
        // read the file as text
        babel.transformFile(dest, {
            babelrc: true
        }, (err, file) => {
            if (!err) {
                // write the file back to disk
                fs.writeFile(dest, file.code.toString(), () => logMovement(src, dest, start));
            } else {
                // print error
                console.warn(err);
            }
        });
    }
});


// root should be a transpiled copy of the source (all modules included) in commonjs format
copyRecursiveSync("." + path.sep + "src", "." + path.sep + dist, (src, dest) => {
    
    // after copying the file - transform the content and log how long the operation took
    return () => {
        // time the transform
        const start = new Date();
        // read the file as text
        babel.transformFile(dest, {
            plugins: ["@babel/plugin-transform-modules-commonjs"],
            presets:[
                [
                    "@babel/preset-env",
                    {
                      "useBuiltIns": "entry",
                      "corejs": { "version": 3, "proposals": true }
                    }
                ]
            ]
        }, (err, file) => {
            if (!err) {
                // write the file back to disk
                fs.writeFile(dest, file.code.toString(), () => logMovement(src, dest, start));
            } else {
                // print error
                console.warn(err);
            }
        });
    }
});
