#!/usr/bin/env node
'use strict';
const createSandpaper = require('.');

createSandpaper({
	args: process.argv.slice(2)
});
