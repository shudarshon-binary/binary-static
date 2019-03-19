const path   = require('path');
const fs     = require('fs');
const util   = require('util');
const expect = require('chai').expect;
const exec   = util.promisify(require('child_process').exec);
const common = require('../common');

const ignored_files = [
    'src/images/pages/regulation/map.svg',
];

let changed_files = [];
let is_branch_outdated_message = true;

describe('check svg file format', () => {
    const fetchFiles = async (command) => {
        const { stdout, stderr } = await exec(command);
        if (stderr) {
            throw new Error(stderr);
        }

        return stdout.split('\n').filter(dir => dir.length);
    };

    it('should be valid svgs', async () => {
        try {
            changed_files = [
                ...await fetchFiles('git diff --name-only -- *.svg'),
                ...await fetchFiles('git diff HEAD origin/master --name-only -- *.svg'),
            ];
        } catch (err) {
            console.error(err);
        }

        changed_files.filter(item => !ignored_files.some(ignored => path.resolve(common.root_path, ignored) === item))
            .forEach(item => {
                try {
                    const stats = fs.statSync(path.resolve(item));
                    if (stats.isSymbolicLink()) return;
                    const file = fs.readFileSync(path.resolve(item), 'utf-8');
                    expect(file).to.be.a('string');
                    expect(file)
                        .to
                        .match(/(?!\n)(<svg)(.*)(>).*(<\/\s?svg)>/i,
                            `unoptimized svg at ${item}\n Please run the following command on your terminal and commit the result: \n svgo ${item} \n`);
                } catch (e) {
                    if (is_branch_outdated_message) {
                        console.warn('Your branch is outdated with the origin/master, consider syncing before pushing your branch.');
                        is_branch_outdated_message = false;
                    }
                }
            });
    });
});
