
import fs from 'fs';
import path from 'path';

import postcss from 'postcss';
import postcssAdvancedVariables from 'postcss-advanced-variables';
import postcssAtroot from 'postcss-atroot';
import postcssExtendRule from 'postcss-extend-rule';
import postcssNested from 'postcss-nested';
import postcssPropertyLookup from 'postcss-property-lookup';
import postcssCcolorMod from 'postcss-color-mod-function';

import nodeResolve from 'resolve';

function ContentCache() {
    this.cache = {};
}
ContentCache.prototype = {
    get(file) {
        let content = this.cache[file];
        if (content == null) {
            content = fs.readFileSync(file);
            this.cache[file] = content;
        }
        return content;
    },
    lookup(file) {
        return this.cache[file];
    },
    put(file) {
        this.cache[file] = fs.readFileSync(res);
    }
}

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
            nodeResolve(id, {basedir: cwd}, (err, res) => {
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
}


function findPackageDir(cwd) {
    if (fs.existsSync(path.join(cwd, 'package.json'))) {
        return cwd;
    } else {
        var parent = path.dirname(cwd);
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
    this.addThemesDir(this.package);
    this.addThemesDir(path.join(this.package, 'node_modules', '@qutejs', 'material'));
    if (!this.themesDirs.length) throw new Error('No themes directories found in the current package context: '+ this.package);
    this.setTheme(theme || 'default');
}
MaterialTheme.prototype = {
    addThemesDir(root) {
        const themesDir = path.join(root, 'themes');
        if (fs.existsSync(themesDir)) {
            this.themesDirs.push(themesDir);
        }
    },
    findThemeDir(theme) {
        var dirs = this.themesDirs;
        for (const dir of dirs) {
            let themeDir = path.join(dir, theme);
            if (fs.existsSync(themeDir)) {
                return themeDir;
            }
        }
        return null;
    },
    setTheme(theme) {
        const themeDir = this.findThemeDir(theme);
        if (!themeDir) throw new Error(`No such theme '${theme}' was found`);
        this.themeDir = path.resolve(themeDir)
    },
    resolve(importId, cwd) {
        if (importId === '%theme') {
            return path.join(this.themeDir, 'index.css');
        } else if (importId.startsWith('%theme/')) {
            return path.join(this.themeDir, importId.substring('%theme'.length));
        } else {
            return null;
        }
    }
}



// plugin chain
const plugins = [
	postcssExtendRule,
	postcssAdvancedVariables,
	postcssAtroot,
	postcssPropertyLookup,
    postcssNested,
    postcssCcolorMod
];

// plugin
export default postcss.plugin('postcss-qute', rawopts => {
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

