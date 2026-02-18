// Intercepts console warnings/errors and uncaught runtime failures, logs them normally in the browser,
// and sends structured client-side error data to OpenObserve for centralized tracking.
(function () {
	const clientLogEndpoint = 'http://localhost:7500/v2/client-logs';

	// Preserve original console methods so normal logging still works
	const originalWarn = console.warn.bind(console);
	const originalError = console.error.bind(console);

	// Converts console arguments into a readable string message
	function normalizeMessage(args) {
		return args
			.map(function (arg) {
				if (arg instanceof Error) return arg.message;
				if (typeof arg === 'object') {
					try {
						return JSON.stringify(arg);
					} catch (e) {
						return '[unserializable object]';
					}
				}
				return String(arg);
			})
			.join(' ');
	}

	// Extracts stack trace from console arguments if present
	function extractStack(args) {
		for (var i = 0; i < args.length; i++) {
			var arg = args[i];
			if (arg instanceof Error && arg.stack) {
				return arg.stack;
			}
		}
		return undefined;
	}

	// Sends a log payload to the backend using sendBeacon or fetch fallback
	function sendLog(payload) {
		try {
			var body = JSON.stringify(payload);

			if (navigator.sendBeacon) {
				navigator.sendBeacon(clientLogEndpoint, body);
			} else {
				fetch(clientLogEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: body,
					keepalive: true
				}).catch(function () {});
			}
		} catch (e) {
			// Never allow logging failures to break the app
		}
	}

	// Builds and sends a normalized client log entry
	function log(level, args) {
		var message = normalizeMessage(args);
		var stack = extractStack(args);

		sendLog({
			level: level,
			message: message,
			stack: stack,
			url: location.href,
			timestamp: Date.now()
		});
	}

	// Override console.warn to log warnings remotely
	console.warn = function () {
		originalWarn.apply(console, arguments);
		log('warn', Array.prototype.slice.call(arguments));
	};

	// Override console.error to log errors remotely
	console.error = function () {
		originalError.apply(console, arguments);
		log('error', Array.prototype.slice.call(arguments));
	};

	// Capture uncaught runtime errors
	window.addEventListener('error', function (event) {
		log('error', [event.error || event.message || 'Unhandled error']);
	});

	// Capture unhandled promise rejections
	window.addEventListener('unhandledrejection', function (event) {
		log('error', [event.reason || 'Unhandled promise rejection']);
	});
})();
