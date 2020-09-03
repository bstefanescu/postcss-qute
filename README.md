# postcss-qute
PostCss plugin which provides SAAS like markup, color-mod function, custom @import resolvers and theme support

https://travis-ci.com/bstefanescu/postcss-qute.svg?branch=master

# Plugins

This plugin is powered by the following plugins (in this order):

- [postcss-extend-rule](https://github.com/jonathantneal/postcss-extend-rule)
- [postcss-advanced-variables](https://github.com/jonathantneal/postcss-advanced-variables)
- [postcss-atroot](https://github.com/OEvgeny/postcss-atroot)
- [postcss-property-lookup](https://github.com/simonsmith/postcss-property-lookup)
- [postcss-nested](https://github.com/postcss/postcss-nested)
- [postcss-color-mod-function](https://github.com/postcss/postcss-color-mod-function)

# Theme Support

The plugin also provides a way to define themes, by replacing the default `@import` resolver of the `postcss-advanced-variables` plugin with a custom resolver implementation which uses the [npm resolve](https://github.com/browserify/resolve) resolver to resolve imported files.

Theme files should be placed inside a `themes/{themeName}` folder in the root of the project. The default theme name is `default` and will be used if no other theme is explicitly set.

In your CSS files where you want to import the current theme you should write:

```css
@import "%theme"
```

This will import the index.css file located in the current theme directory: `themes/{themeName}/index.css`

To import other files from the theme directory, you should specify the path to the file:

```css
@import "%theme/variables.css"
```

This will import the file `themes/{themeName}/variables.css`

To change the default theme (which name is `default`) you should pass the `theme` option to the postcss-qute plugin:

```javascript
import postcss from `postcss`;
import quteCss from `postcss-qute`;

postcss([
    quteCss({
      theme: 'redish'
    })
])
```
The options object passed to postcss-qute will be passed to each nested plugin.


# License

[MIT](LICENSE)

