'use strict';

var fs = require('fs');
var path = require('path');
var postcss = require('postcss');
var postcssAdvancedVariables = require('postcss-advanced-variables');
var postcssAtroot = require('postcss-atroot');
var postcssExtendRule = require('postcss-extend-rule');
var postcssNested = require('postcss-nested');
var postcssPropertyLookup = require('postcss-property-lookup');
var postcssCcolorMod = require('postcss-color-mod-function');
var nodeResolve = require('resolve');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var postcss__default = /*#__PURE__*/_interopDefaultLegacy(postcss);
var postcssAdvancedVariables__default = /*#__PURE__*/_interopDefaultLegacy(postcssAdvancedVariables);
var postcssAtroot__default = /*#__PURE__*/_interopDefaultLegacy(postcssAtroot);
var postcssExtendRule__default = /*#__PURE__*/_interopDefaultLegacy(postcssExtendRule);
var postcssNested__default = /*#__PURE__*/_interopDefaultLegacy(postcssNested);
var postcssPropertyLookup__default = /*#__PURE__*/_interopDefaultLegacy(postcssPropertyLookup);
var postcssCcolorMod__default = /*#__PURE__*/_interopDefaultLegacy(postcssCcolorMod);
var nodeResolve__default = /*#__PURE__*/_interopDefaultLegacy(nodeResolve);

function ContentCache() {
    this.cache = {};
}
ContentCache.prototype = {
    get(file) {
        let content = this.cache[file];
        if (content == null) {
            content = fs__default['default'].readFileSync(file);
            this.cache[file] = content;
        }
        return content;
    },
    lookup(file) {
        return this.cache[file];
    },
    put(file) {
        this.cache[file] = fs__default['default'].readFileSync(res);
    }
};

function ImportResolver() {
    this.cache = new ContentCache();
    this.resolvers = [];
}
ImportResolver.prototype = {
    resolve(id, cwd, opts) {
        for (const r of this.resolvers) {
            const res = r.resolve(id, cwd, opts);
            if (res) {
                return {
                    file: res,
                    contents: this.cache.get(res)
                };
            }
        }
        return this.defaultResolve(id, cwd, opts);
    },
    defaultResolve(id, cwd, opts) {
        return new Promise((resolve, reject) => {
            nodeResolve__default['default'](id, {basedir: cwd}, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        file: res,
                        contents: this.cache.get(res)
                    });
                }
            });
        });
    },
    push(resolver) {
        this.resolvers.push(resolver);
    }
};


function findPackageDir(cwd) {
    if (fs__default['default'].existsSync(path__default['default'].join(cwd, 'package.json'))) {
        return cwd;
    } else {
        var parent = path__default['default'].dirname(cwd);
        if (parent && parent !== cwd) {
            return findPackageDir(parent);
        } else {
            return null;
        }
    }
}

function MaterialTheme(theme, cwd) {
    this.cwd = cwd || process.cwd();
    this.package = findPackageDir(this.cwd);
    if (!this.package) throw new Error('No package.json was found from '+ this.cwd);
    this.themesDirs = [];
    this.themeDir = null;
    this.addThemesDir(this.package);
    this.addThemesDir(path__default['default'].join(this.package, 'node_modules', '@qutejs', 'material'));
    this.setTheme(theme || 'default');
}
MaterialTheme.prototype = {
    addThemesDir(root) {
        const themesDir = path__default['default'].join(root, 'themes');
        if (fs__default['default'].existsSync(themesDir)) {
            this.themesDirs.push(themesDir);
        }
    },
    findThemeDir(theme) {
        var dirs = this.themesDirs;
        for (const dir of dirs) {
            let themeDir = path__default['default'].join(dir, theme);
            if (fs__default['default'].existsSync(themeDir)) {
                return themeDir;
            }
        }
        return null;
    },
    setTheme(theme) {
        const themeDir = this.findThemeDir(theme);
        if (!themeDir) throw new Error(`No such theme '${theme}' was found`);
        this.themeDir = path__default['default'].resolve(themeDir);
    },
    resolve(importId, cwd) {
        if (importId === '%theme') {
            if (!this.themeDir) {
                throw new Error('Could not import theme: No themes directory was found in the project context');
            }
            return path__default['default'].join(this.themeDir, 'index.css');
        } else if (importId.startsWith('%theme/')) {
            if (!this.themeDir) {
                throw new Error('Could not import theme: No themes directory was found in the project context');
            }
            return path__default['default'].join(this.themeDir, importId.substring('%theme'.length));
        } else {
            return null;
        }
    }
};



// plugin chain
const plugins = [
	postcssExtendRule__default['default'],
	postcssAdvancedVariables__default['default'],
	postcssAtroot__default['default'],
	postcssPropertyLookup__default['default'],
    postcssNested__default['default'],
    postcssCcolorMod__default['default']
];

// plugin
var index = postcss__default['default'].plugin('postcss-qute', rawopts => {
    if (!rawopts) rawopts = {};
    const resolver = new ImportResolver();
    if (rawopts.importResolvers) {
        for (const r of rawopts.importResolvers) {
            resolver.push(r);
        }
    }
    resolver.push(new MaterialTheme(rawopts.theme, rawopts.cwd));
    const opts = Object.assign({
            importResolve: function(id, cwd, opts) {
                return resolver.resolve(id, cwd, opts);
            }
        }, rawopts);

    // initialize all plugins
	const initializedPlugins = plugins.map(
		plugin => plugin(opts)
	);
	// process css with all plugins
	return (root, result) => initializedPlugins.reduce(
		(promise, plugin) => promise.then(
			() => plugin(result.root, result)
		),
		Promise.resolve()
	);
});

module.exports = index;
