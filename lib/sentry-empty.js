// Leerer Sentry‑Stub für Builds ohne Sentry
// Deckt nur minimal verwendete APIs ab.
exports.diagnoseSdkConnectivity = async () => 'disabled';
exports.startSpan = async (_opts, fn) => (typeof fn === 'function' ? await fn() : undefined);
exports.captureException = () => {};
exports.captureMessage = () => {};
exports.withScope = (cb) => { if (typeof cb === 'function') cb(exports.getCurrentScope()); };
exports.getCurrentScope = () => ({
  setTag: () => {},
  setContext: () => {},
  setLevel: () => {},
  setUser: () => {},
});
exports.init = () => {};
exports.replayIntegration = () => ({ name: 'replay-disabled', setupOnce: () => {} });
exports.captureRouterTransitionStart = () => {};
