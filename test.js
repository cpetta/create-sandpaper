import path from 'path';
import fs from 'fs';
import tempWrite from 'temp-write';
import dotProp from 'dot-prop';
import test from 'ava';
import createSandpaper from '.';

const originalArgv = process.argv.slice();
const {get} = dotProp;

async function run(pkg) {
	const filepath = tempWrite.sync(JSON.stringify(pkg), 'package.json');

	await createSandpaper({
		cwd: path.dirname(filepath),
		skipInstall: true
	});

	return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

test('empty package.json', async t => {
	const pkg = await run({});
	t.is(get(pkg, 'scripts.test'), 'sandpaper --lint');
	t.is(get(pkg, 'sandpaper'), undefined);
});

test('has scripts', async t => {
	const pkg = await run({
		scripts: {
			start: ''
		}
	});

	t.is(get(pkg, 'scripts.test'), 'sandpaper --lint');
	t.is(get(pkg, 'sandpaper'), undefined);
});

test('has default test', async t => {
	const pkg = await run({
		scripts: {
			test: 'echo "Error: no test specified" && exit 1'
		}
	});

	t.is(get(pkg, 'scripts.test'), 'sandpaper --lint');
	t.is(get(pkg, 'sandpaper'), undefined);
});

test('has only sandpaper', async t => {
	const pkg = await run({
		scripts: {
			test: 'sandpaper --lint'
		}
	});

	t.is(get(pkg, 'scripts.test'), 'sandpaper --lint');
	t.is(get(pkg, 'sandpaper'), undefined);
});

test('has test', async t => {
	const pkg = await run({
		scripts: {
			test: 'ava'
		}
	});

	t.is(get(pkg, 'scripts.test'), 'sandpaper --lint && ava');
	t.is(get(pkg, 'sandpaper'), undefined);
});

test('has existing config without cli args', async t => {
	process.argv = originalArgv;

	const pkg = await run({
		sandpaper: {
			esnext: true
		}
	});

	process.argv = originalArgv;
	t.is(get(pkg, 'scripts.test'), 'sandpaper --lint');
	t.deepEqual(get(pkg, 'sandpaper'), {esnext: true});
});

test('installs the Sandpaper dependency', async t => {
	const filepath = tempWrite.sync(JSON.stringify({}), 'package.json');
	await createSandpaper({cwd: path.dirname(filepath)});
	t.truthy(get(JSON.parse(fs.readFileSync(filepath, 'utf8')), 'devDependencies.sandpaper'));
});

test('installs via yarn if there\'s a lockfile', async t => {
	const yarnLock = tempWrite.sync('', 'yarn.lock');
	await createSandpaper({cwd: path.dirname(yarnLock)});
	t.regex(fs.readFileSync(yarnLock, 'utf8'), /sandpaper/);
});
