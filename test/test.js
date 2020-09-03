import assert from 'assert';
import path from 'path';
import postcss from 'postcss';
import postcssQute from '../src/index.js';

const css = `
@import "%theme";
body { color: $main-color; }
`;

const cwd = path.dirname(import.meta.url.substring('file://'.length))

describe('Theme resolver', () => {
    it('should resolve the default theme', async () => {
        const out = await testThemeImport();
        assert.strictEqual(out, 'body { color: blue; }');
    })
    it('should resolve the user specified theme', async () => {
        let out = await testThemeImport('red');
        assert.strictEqual(out, 'body { color: red; }');
        out = await testThemeImport('default');
        assert.strictEqual(out, 'body { color: blue; }');
    })
    it('should throw an error when theme is not found', async () => {
        try {
            let out = await testThemeImport('bla');
            assert.fail("Failed ");
        } catch(e) {
            // success
        }
    })
})
async function testThemeImport(theme) {
    return postcss([
        postcssQute({
            theme: theme,
            cwd: cwd
        })
    ]).process(css, {
        from: undefined
    }).then(r => {
        return r.css.trim();
    })
}

