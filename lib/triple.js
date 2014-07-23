var _ = require('lodash'),
	acorn = require('acorn'),
	async = require('async'),
	chalk = require('chalk'),
	constants = require('./constants'),
	fs = require('fs'),
	path = require('path'),
	readline = require('readline'),
	server = require('./server'),
	spinner = require('char-spinner'),
	titanium = require('./titanium');

var DEFAULTS = {
	PROJECT: '_tmp',
	ID: 'triple.tmpapp'
};

module.exports = function(opts, callback) {
	var buffer = [],
		history = [];

	callback = arguments[arguments.length-1];
	if (!opts || _.isFunction(opts)) {
		opts = {};
	}

	if (opts.verbose) {
		titanium.verbose = true;
	}

	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	async.series([

		// make sure we're logged in
		function(cb) {
			titanium.loggedIn(function(err, loggedIn) {
				if (err) {
					return cb('error checking status: ' + err);
				} else if (!loggedIn) {
					return cb('You must be logged in to use triple. Use `titanium login`.');
				}
				return cb();
			});
		},

		// create the repl project
		function(cb) {
			if (!fs.existsSync(DEFAULTS.PROJECT)) {
				console.log('[creating app]');
				var interval = spinner();
				var createOpts = _.defaults(opts.create || {}, {
					name: DEFAULTS.PROJECT,
					id: DEFAULTS.ID
				});
				titanium.create(createOpts, function(err, results) {
					clearInterval(interval);
					cb(err, results);
				});
			} else {
				cb();
			}
		},

		// prep app
		function(cb) {
			var resources = path.join(DEFAULTS.PROJECT, 'Resources'),
				app = path.join(__dirname, '..', 'app');

			fs.readdirSync(app).forEach(function(file) {
				copy(path.join(app, file), path.join(resources, file));
			});
			copy(path.join(__dirname, 'constants.js'), path.join(resources, 'constants.js'));

			cb();
		},

		// // start up repl server
		function(cb) {
			server.on('end', function(data) {
				console.error(chalk.bold.red('error: ' + data));
				process.exit(1);
			});
			server.listen(constants.PORT, cb);
		},

		// build the repl project
		function(cb) {
			console.log('[launching app]');
			var interval = spinner();
			var buildOpts = _.defaults(opts.build || {}, {
				projectDir: DEFAULTS.PROJECT,
				platform: 'ios',
				iosVersion: '7.1',
				server: server
			});
			titanium.build(buildOpts);
			server.on('ready', function() {
				clearInterval(interval);
				cb();
			});
		},

		// prompt
		function(cb) {

			// clear spinner and prompt
			process.stdout.write('\r \r');
			rl.setPrompt(constants.PROMPT);
			rl.prompt();

			rl.on('line', function(line) {
				var match;

				// skip empty lines
				if (!line) {
					rl.prompt();
					return;

				// handle triple commands
				} else if(line.match(/^\s*(\.)/)) {
					var l = line.replace(/^\s*(\.)/, '').split(' ');
					switch(l[0]) {
						case 'break':
							buffer = [];
							rl.setPrompt(constants.PROMPT);
							break;
						case 'save':
							// saves only to the local dir using the supplied name or default
							var target = l[1] || 'triple.log';
							fs.writeFileSync(path.join(path.resolve('.'), path.basename(target)), history.join('\n'));
							break;
						case 'exit':
							cb();
							break;
						default:
							console.error(chalk.bold.red('invalid command "' + l[0] + '"'));
							break;
					}
					rl.prompt();

				// process code
				} else {
					try {

						// assemble code from buffer
						buffer.push(line);
						history.push(line);
						var code = buffer.join('\n');

						// validate the buffered code
						acorn.parse(code);

						// send code to server
						server.emit('message', code);

						// reset buffer and prompt
						buffer = [];
						rl.setPrompt(constants.PROMPT);
					} catch (e) {

						// prompt for multi-line statement
						rl.setPrompt(constants.CONTINUE_PROMPT);
						rl.prompt();
					}
				}

			});
			rl.on('SIGINT', function() {
				if (buffer.length) {
					buffer = [];
					console.log('\n(^C again to quit)');
					rl.setPrompt(constants.PROMPT);
					rl.prompt();
				} else {
					cb();
				}
			});
		}

	], callback);
};

function copy(src, dst) {
	fs.writeFileSync(dst, fs.readFileSync(src));
}

function getUserHome() {
	// get the user's home directory
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}