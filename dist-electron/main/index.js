import ju, { app as Re, BrowserWindow as Tt, globalShortcut as ra, ipcMain as $e, screen as Sn, Tray as ku, Menu as Cu, shell as na } from "electron";
import he, { dirname as Au } from "path";
import iu from "util";
import Ce from "fs";
import qu from "crypto";
import Du from "assert";
import Mu from "events";
import vn from "os";
import { spawn as Lu } from "child_process";
import Ot from "ws";
import { fileURLToPath as Fu } from "url";
function Vu(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Nt = { exports: {} }, Fn, ya;
function Uu() {
  return ya || (ya = 1, Fn = (e) => {
    const t = typeof e;
    return e !== null && (t === "object" || t === "function");
  }), Fn;
}
var Vn, ga;
function zu() {
  if (ga) return Vn;
  ga = 1;
  const e = Uu(), t = /* @__PURE__ */ new Set([
    "__proto__",
    "prototype",
    "constructor"
  ]), a = (l) => !l.some((n) => t.has(n));
  function r(l) {
    const n = l.split("."), u = [];
    for (let o = 0; o < n.length; o++) {
      let c = n[o];
      for (; c[c.length - 1] === "\\" && n[o + 1] !== void 0; )
        c = c.slice(0, -1) + ".", c += n[++o];
      u.push(c);
    }
    return a(u) ? u : [];
  }
  return Vn = {
    get(l, n, u) {
      if (!e(l) || typeof n != "string")
        return u === void 0 ? l : u;
      const o = r(n);
      if (o.length !== 0) {
        for (let c = 0; c < o.length; c++)
          if (l = l[o[c]], l == null) {
            if (c !== o.length - 1)
              return u;
            break;
          }
        return l === void 0 ? u : l;
      }
    },
    set(l, n, u) {
      if (!e(l) || typeof n != "string")
        return l;
      const o = l, c = r(n);
      for (let d = 0; d < c.length; d++) {
        const s = c[d];
        e(l[s]) || (l[s] = {}), d === c.length - 1 && (l[s] = u), l = l[s];
      }
      return o;
    },
    delete(l, n) {
      if (!e(l) || typeof n != "string")
        return !1;
      const u = r(n);
      for (let o = 0; o < u.length; o++) {
        const c = u[o];
        if (o === u.length - 1)
          return delete l[c], !0;
        if (l = l[c], !e(l))
          return !1;
      }
    },
    has(l, n) {
      if (!e(l) || typeof n != "string")
        return !1;
      const u = r(n);
      if (u.length === 0)
        return !1;
      for (let o = 0; o < u.length; o++)
        if (e(l)) {
          if (!(u[o] in l))
            return !1;
          l = l[u[o]];
        } else
          return !1;
      return !0;
    }
  }, Vn;
}
var kt = { exports: {} }, Ct = { exports: {} }, At = { exports: {} }, qt = { exports: {} }, va;
function Ku() {
  if (va) return qt.exports;
  va = 1;
  const e = Ce;
  return qt.exports = (t) => new Promise((a) => {
    e.access(t, (r) => {
      a(!r);
    });
  }), qt.exports.sync = (t) => {
    try {
      return e.accessSync(t), !0;
    } catch {
      return !1;
    }
  }, qt.exports;
}
var Dt = { exports: {} }, Mt = { exports: {} }, $a;
function Gu() {
  if ($a) return Mt.exports;
  $a = 1;
  const e = (t, ...a) => new Promise((r) => {
    r(t(...a));
  });
  return Mt.exports = e, Mt.exports.default = e, Mt.exports;
}
var _a;
function Hu() {
  if (_a) return Dt.exports;
  _a = 1;
  const e = Gu(), t = (a) => {
    if (!((Number.isInteger(a) || a === 1 / 0) && a > 0))
      return Promise.reject(new TypeError("Expected `concurrency` to be a number from 1 and up"));
    const r = [];
    let l = 0;
    const n = () => {
      l--, r.length > 0 && r.shift()();
    }, u = (d, s, ..._) => {
      l++;
      const $ = e(d, ..._);
      s($), $.then(n, n);
    }, o = (d, s, ..._) => {
      l < a ? u(d, s, ..._) : r.push(u.bind(null, d, s, ..._));
    }, c = (d, ...s) => new Promise((_) => o(d, _, ...s));
    return Object.defineProperties(c, {
      activeCount: {
        get: () => l
      },
      pendingCount: {
        get: () => r.length
      },
      clearQueue: {
        value: () => {
          r.length = 0;
        }
      }
    }), c;
  };
  return Dt.exports = t, Dt.exports.default = t, Dt.exports;
}
var Un, wa;
function Wu() {
  if (wa) return Un;
  wa = 1;
  const e = Hu();
  class t extends Error {
    constructor(n) {
      super(), this.value = n;
    }
  }
  const a = (l, n) => Promise.resolve(l).then(n), r = (l) => Promise.all(l).then((n) => n[1] === !0 && Promise.reject(new t(n[0])));
  return Un = (l, n, u) => {
    u = Object.assign({
      concurrency: 1 / 0,
      preserveOrder: !0
    }, u);
    const o = e(u.concurrency), c = [...l].map((s) => [s, o(a, s, n)]), d = e(u.preserveOrder ? 1 : 1 / 0);
    return Promise.all(c.map((s) => d(r, s))).then(() => {
    }).catch((s) => s instanceof t ? s.value : Promise.reject(s));
  }, Un;
}
var Ea;
function Bu() {
  if (Ea) return At.exports;
  Ea = 1;
  const e = he, t = Ku(), a = Wu();
  return At.exports = (r, l) => (l = Object.assign({
    cwd: process.cwd()
  }, l), a(r, (n) => t(e.resolve(l.cwd, n)), l)), At.exports.sync = (r, l) => {
    l = Object.assign({
      cwd: process.cwd()
    }, l);
    for (const n of r)
      if (t.sync(e.resolve(l.cwd, n)))
        return n;
  }, At.exports;
}
var Sa;
function Ju() {
  if (Sa) return Ct.exports;
  Sa = 1;
  const e = he, t = Bu();
  return Ct.exports = (a, r = {}) => {
    const l = e.resolve(r.cwd || ""), { root: n } = e.parse(l), u = [].concat(a);
    return new Promise((o) => {
      (function c(d) {
        t(u, { cwd: d }).then((s) => {
          s ? o(e.join(d, s)) : d === n ? o(null) : c(e.dirname(d));
        });
      })(l);
    });
  }, Ct.exports.sync = (a, r = {}) => {
    let l = e.resolve(r.cwd || "");
    const { root: n } = e.parse(l), u = [].concat(a);
    for (; ; ) {
      const o = t.sync(u, { cwd: l });
      if (o)
        return e.join(l, o);
      if (l === n)
        return null;
      l = e.dirname(l);
    }
  }, Ct.exports;
}
var ba;
function Xu() {
  if (ba) return kt.exports;
  ba = 1;
  const e = Ju();
  return kt.exports = async ({ cwd: t } = {}) => e("package.json", { cwd: t }), kt.exports.sync = ({ cwd: t } = {}) => e.sync("package.json", { cwd: t }), kt.exports;
}
var Lt = { exports: {} }, Pa;
function Yu() {
  if (Pa) return Lt.exports;
  Pa = 1;
  const e = he, t = vn, a = t.homedir(), r = t.tmpdir(), { env: l } = process, n = (d) => {
    const s = e.join(a, "Library");
    return {
      data: e.join(s, "Application Support", d),
      config: e.join(s, "Preferences", d),
      cache: e.join(s, "Caches", d),
      log: e.join(s, "Logs", d),
      temp: e.join(r, d)
    };
  }, u = (d) => {
    const s = l.APPDATA || e.join(a, "AppData", "Roaming"), _ = l.LOCALAPPDATA || e.join(a, "AppData", "Local");
    return {
      // Data/config/cache/log are invented by me as Windows isn't opinionated about this
      data: e.join(_, d, "Data"),
      config: e.join(s, d, "Config"),
      cache: e.join(_, d, "Cache"),
      log: e.join(_, d, "Log"),
      temp: e.join(r, d)
    };
  }, o = (d) => {
    const s = e.basename(a);
    return {
      data: e.join(l.XDG_DATA_HOME || e.join(a, ".local", "share"), d),
      config: e.join(l.XDG_CONFIG_HOME || e.join(a, ".config"), d),
      cache: e.join(l.XDG_CACHE_HOME || e.join(a, ".cache"), d),
      // https://wiki.debian.org/XDGBaseDirectorySpecification#state
      log: e.join(l.XDG_STATE_HOME || e.join(a, ".local", "state"), d),
      temp: e.join(r, s, d)
    };
  }, c = (d, s) => {
    if (typeof d != "string")
      throw new TypeError(`Expected string, got ${typeof d}`);
    return s = Object.assign({ suffix: "nodejs" }, s), s.suffix && (d += `-${s.suffix}`), process.platform === "darwin" ? n(d) : process.platform === "win32" ? u(d) : o(d);
  };
  return Lt.exports = c, Lt.exports.default = c, Lt.exports;
}
var qe = {}, pe = {}, Ra;
function It() {
  if (Ra) return pe;
  Ra = 1, Object.defineProperty(pe, "__esModule", { value: !0 }), pe.NOOP = pe.LIMIT_FILES_DESCRIPTORS = pe.LIMIT_BASENAME_LENGTH = pe.IS_USER_ROOT = pe.IS_POSIX = pe.DEFAULT_TIMEOUT_SYNC = pe.DEFAULT_TIMEOUT_ASYNC = pe.DEFAULT_WRITE_OPTIONS = pe.DEFAULT_READ_OPTIONS = pe.DEFAULT_FOLDER_MODE = pe.DEFAULT_FILE_MODE = pe.DEFAULT_ENCODING = void 0;
  const e = "utf8";
  pe.DEFAULT_ENCODING = e;
  const t = 438;
  pe.DEFAULT_FILE_MODE = t;
  const a = 511;
  pe.DEFAULT_FOLDER_MODE = a;
  const r = {};
  pe.DEFAULT_READ_OPTIONS = r;
  const l = {};
  pe.DEFAULT_WRITE_OPTIONS = l;
  const n = 5e3;
  pe.DEFAULT_TIMEOUT_ASYNC = n;
  const u = 100;
  pe.DEFAULT_TIMEOUT_SYNC = u;
  const o = !!process.getuid;
  pe.IS_POSIX = o;
  const c = process.getuid ? !process.getuid() : !1;
  pe.IS_USER_ROOT = c;
  const d = 128;
  pe.LIMIT_BASENAME_LENGTH = d;
  const s = 1e4;
  pe.LIMIT_FILES_DESCRIPTORS = s;
  const _ = () => {
  };
  return pe.NOOP = _, pe;
}
var Ft = {}, at = {}, Na;
function xu() {
  if (Na) return at;
  Na = 1, Object.defineProperty(at, "__esModule", { value: !0 }), at.attemptifySync = at.attemptifyAsync = void 0;
  const e = It(), t = (r, l = e.NOOP) => function() {
    return r.apply(void 0, arguments).catch(l);
  };
  at.attemptifyAsync = t;
  const a = (r, l = e.NOOP) => function() {
    try {
      return r.apply(void 0, arguments);
    } catch (n) {
      return l(n);
    }
  };
  return at.attemptifySync = a, at;
}
var Vt = {}, Oa;
function Qu() {
  if (Oa) return Vt;
  Oa = 1, Object.defineProperty(Vt, "__esModule", { value: !0 });
  const e = It(), t = {
    isChangeErrorOk: (a) => {
      const { code: r } = a;
      return r === "ENOSYS" || !e.IS_USER_ROOT && (r === "EINVAL" || r === "EPERM");
    },
    isRetriableError: (a) => {
      const { code: r } = a;
      return r === "EMFILE" || r === "ENFILE" || r === "EAGAIN" || r === "EBUSY" || r === "EACCESS" || r === "EACCS" || r === "EPERM";
    },
    onChangeError: (a) => {
      if (!t.isChangeErrorOk(a))
        throw a;
    }
  };
  return Vt.default = t, Vt;
}
var ot = {}, Ut = {}, Ta;
function Zu() {
  if (Ta) return Ut;
  Ta = 1, Object.defineProperty(Ut, "__esModule", { value: !0 });
  const t = {
    interval: 25,
    intervalId: void 0,
    limit: It().LIMIT_FILES_DESCRIPTORS,
    queueActive: /* @__PURE__ */ new Set(),
    queueWaiting: /* @__PURE__ */ new Set(),
    init: () => {
      t.intervalId || (t.intervalId = setInterval(t.tick, t.interval));
    },
    reset: () => {
      t.intervalId && (clearInterval(t.intervalId), delete t.intervalId);
    },
    add: (a) => {
      t.queueWaiting.add(a), t.queueActive.size < t.limit / 2 ? t.tick() : t.init();
    },
    remove: (a) => {
      t.queueWaiting.delete(a), t.queueActive.delete(a);
    },
    schedule: () => new Promise((a) => {
      const r = () => t.remove(l), l = () => a(r);
      t.add(l);
    }),
    tick: () => {
      if (!(t.queueActive.size >= t.limit)) {
        if (!t.queueWaiting.size)
          return t.reset();
        for (const a of t.queueWaiting) {
          if (t.queueActive.size >= t.limit)
            break;
          t.queueWaiting.delete(a), t.queueActive.add(a), a();
        }
      }
    }
  };
  return Ut.default = t, Ut;
}
var Ia;
function el() {
  if (Ia) return ot;
  Ia = 1, Object.defineProperty(ot, "__esModule", { value: !0 }), ot.retryifySync = ot.retryifyAsync = void 0;
  const e = Zu(), t = (r, l) => function(n) {
    return function u() {
      return e.default.schedule().then((o) => r.apply(void 0, arguments).then((c) => (o(), c), (c) => {
        if (o(), Date.now() >= n)
          throw c;
        if (l(c)) {
          const d = Math.round(100 + 400 * Math.random());
          return new Promise((_) => setTimeout(_, d)).then(() => u.apply(void 0, arguments));
        }
        throw c;
      }));
    };
  };
  ot.retryifyAsync = t;
  const a = (r, l) => function(n) {
    return function u() {
      try {
        return r.apply(void 0, arguments);
      } catch (o) {
        if (Date.now() > n)
          throw o;
        if (l(o))
          return u.apply(void 0, arguments);
        throw o;
      }
    };
  };
  return ot.retryifySync = a, ot;
}
var ja;
function cu() {
  if (ja) return Ft;
  ja = 1, Object.defineProperty(Ft, "__esModule", { value: !0 });
  const e = Ce, t = iu, a = xu(), r = Qu(), l = el(), n = {
    chmodAttempt: a.attemptifyAsync(t.promisify(e.chmod), r.default.onChangeError),
    chownAttempt: a.attemptifyAsync(t.promisify(e.chown), r.default.onChangeError),
    closeAttempt: a.attemptifyAsync(t.promisify(e.close)),
    fsyncAttempt: a.attemptifyAsync(t.promisify(e.fsync)),
    mkdirAttempt: a.attemptifyAsync(t.promisify(e.mkdir)),
    realpathAttempt: a.attemptifyAsync(t.promisify(e.realpath)),
    statAttempt: a.attemptifyAsync(t.promisify(e.stat)),
    unlinkAttempt: a.attemptifyAsync(t.promisify(e.unlink)),
    closeRetry: l.retryifyAsync(t.promisify(e.close), r.default.isRetriableError),
    fsyncRetry: l.retryifyAsync(t.promisify(e.fsync), r.default.isRetriableError),
    openRetry: l.retryifyAsync(t.promisify(e.open), r.default.isRetriableError),
    readFileRetry: l.retryifyAsync(t.promisify(e.readFile), r.default.isRetriableError),
    renameRetry: l.retryifyAsync(t.promisify(e.rename), r.default.isRetriableError),
    statRetry: l.retryifyAsync(t.promisify(e.stat), r.default.isRetriableError),
    writeRetry: l.retryifyAsync(t.promisify(e.write), r.default.isRetriableError),
    chmodSyncAttempt: a.attemptifySync(e.chmodSync, r.default.onChangeError),
    chownSyncAttempt: a.attemptifySync(e.chownSync, r.default.onChangeError),
    closeSyncAttempt: a.attemptifySync(e.closeSync),
    mkdirSyncAttempt: a.attemptifySync(e.mkdirSync),
    realpathSyncAttempt: a.attemptifySync(e.realpathSync),
    statSyncAttempt: a.attemptifySync(e.statSync),
    unlinkSyncAttempt: a.attemptifySync(e.unlinkSync),
    closeSyncRetry: l.retryifySync(e.closeSync, r.default.isRetriableError),
    fsyncSyncRetry: l.retryifySync(e.fsyncSync, r.default.isRetriableError),
    openSyncRetry: l.retryifySync(e.openSync, r.default.isRetriableError),
    readFileSyncRetry: l.retryifySync(e.readFileSync, r.default.isRetriableError),
    renameSyncRetry: l.retryifySync(e.renameSync, r.default.isRetriableError),
    statSyncRetry: l.retryifySync(e.statSync, r.default.isRetriableError),
    writeSyncRetry: l.retryifySync(e.writeSync, r.default.isRetriableError)
  };
  return Ft.default = n, Ft;
}
var zt = {}, ka;
function tl() {
  if (ka) return zt;
  ka = 1, Object.defineProperty(zt, "__esModule", { value: !0 });
  const e = {
    isFunction: (t) => typeof t == "function",
    isString: (t) => typeof t == "string",
    isUndefined: (t) => typeof t > "u"
  };
  return zt.default = e, zt;
}
var Kt = {}, Ca;
function rl() {
  if (Ca) return Kt;
  Ca = 1, Object.defineProperty(Kt, "__esModule", { value: !0 });
  const e = {}, t = {
    next: (a) => {
      const r = e[a];
      if (!r)
        return;
      r.shift();
      const l = r[0];
      l ? l(() => t.next(a)) : delete e[a];
    },
    schedule: (a) => new Promise((r) => {
      let l = e[a];
      l || (l = e[a] = []), l.push(r), !(l.length > 1) && r(() => t.next(a));
    })
  };
  return Kt.default = t, Kt;
}
var Gt = {}, Aa;
function nl() {
  if (Aa) return Gt;
  Aa = 1, Object.defineProperty(Gt, "__esModule", { value: !0 });
  const e = he, t = It(), a = cu(), r = {
    store: {},
    create: (l) => {
      const n = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6), u = Date.now().toString().slice(-10), o = "tmp-", c = `.${o}${u}${n}`;
      return `${l}${c}`;
    },
    get: (l, n, u = !0) => {
      const o = r.truncate(n(l));
      return o in r.store ? r.get(l, n, u) : (r.store[o] = u, [o, () => delete r.store[o]]);
    },
    purge: (l) => {
      r.store[l] && (delete r.store[l], a.default.unlinkAttempt(l));
    },
    purgeSync: (l) => {
      r.store[l] && (delete r.store[l], a.default.unlinkSyncAttempt(l));
    },
    purgeSyncAll: () => {
      for (const l in r.store)
        r.purgeSync(l);
    },
    truncate: (l) => {
      const n = e.basename(l);
      if (n.length <= t.LIMIT_BASENAME_LENGTH)
        return l;
      const u = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(n);
      if (!u)
        return l;
      const o = n.length - t.LIMIT_BASENAME_LENGTH;
      return `${l.slice(0, -n.length)}${u[1]}${u[2].slice(0, -o)}${u[3]}`;
    }
  };
  return process.on("exit", r.purgeSyncAll), Gt.default = r, Gt;
}
var qa;
function sl() {
  if (qa) return qe;
  qa = 1, Object.defineProperty(qe, "__esModule", { value: !0 }), qe.writeFileSync = qe.writeFile = qe.readFileSync = qe.readFile = void 0;
  const e = he, t = It(), a = cu(), r = tl(), l = rl(), n = nl();
  function u(_, $ = t.DEFAULT_READ_OPTIONS) {
    var v;
    if (r.default.isString($))
      return u(_, { encoding: $ });
    const S = Date.now() + ((v = $.timeout) !== null && v !== void 0 ? v : t.DEFAULT_TIMEOUT_ASYNC);
    return a.default.readFileRetry(S)(_, $);
  }
  qe.readFile = u;
  function o(_, $ = t.DEFAULT_READ_OPTIONS) {
    var v;
    if (r.default.isString($))
      return o(_, { encoding: $ });
    const S = Date.now() + ((v = $.timeout) !== null && v !== void 0 ? v : t.DEFAULT_TIMEOUT_SYNC);
    return a.default.readFileSyncRetry(S)(_, $);
  }
  qe.readFileSync = o;
  const c = (_, $, v, S) => {
    if (r.default.isFunction(v))
      return c(_, $, t.DEFAULT_WRITE_OPTIONS, v);
    const E = d(_, $, v);
    return S && E.then(S, S), E;
  };
  qe.writeFile = c;
  const d = async (_, $, v = t.DEFAULT_WRITE_OPTIONS) => {
    var S;
    if (r.default.isString(v))
      return d(_, $, { encoding: v });
    const E = Date.now() + ((S = v.timeout) !== null && S !== void 0 ? S : t.DEFAULT_TIMEOUT_ASYNC);
    let h = null, y = null, i = null, p = null, w = null;
    try {
      v.schedule && (h = await v.schedule(_)), y = await l.default.schedule(_), _ = await a.default.realpathAttempt(_) || _, [p, i] = n.default.get(_, v.tmpCreate || n.default.create, v.tmpPurge !== !1);
      const m = t.IS_POSIX && r.default.isUndefined(v.chown), g = r.default.isUndefined(v.mode);
      if (m || g) {
        const I = await a.default.statAttempt(_);
        I && (v = { ...v }, m && (v.chown = { uid: I.uid, gid: I.gid }), g && (v.mode = I.mode));
      }
      const P = e.dirname(_);
      await a.default.mkdirAttempt(P, {
        mode: t.DEFAULT_FOLDER_MODE,
        recursive: !0
      }), w = await a.default.openRetry(E)(p, "w", v.mode || t.DEFAULT_FILE_MODE), v.tmpCreated && v.tmpCreated(p), r.default.isString($) ? await a.default.writeRetry(E)(w, $, 0, v.encoding || t.DEFAULT_ENCODING) : r.default.isUndefined($) || await a.default.writeRetry(E)(w, $, 0, $.length, 0), v.fsync !== !1 && (v.fsyncWait !== !1 ? await a.default.fsyncRetry(E)(w) : a.default.fsyncAttempt(w)), await a.default.closeRetry(E)(w), w = null, v.chown && await a.default.chownAttempt(p, v.chown.uid, v.chown.gid), v.mode && await a.default.chmodAttempt(p, v.mode);
      try {
        await a.default.renameRetry(E)(p, _);
      } catch (I) {
        if (I.code !== "ENAMETOOLONG")
          throw I;
        await a.default.renameRetry(E)(p, n.default.truncate(_));
      }
      i(), p = null;
    } finally {
      w && await a.default.closeAttempt(w), p && n.default.purge(p), h && h(), y && y();
    }
  }, s = (_, $, v = t.DEFAULT_WRITE_OPTIONS) => {
    var S;
    if (r.default.isString(v))
      return s(_, $, { encoding: v });
    const E = Date.now() + ((S = v.timeout) !== null && S !== void 0 ? S : t.DEFAULT_TIMEOUT_SYNC);
    let h = null, y = null, i = null;
    try {
      _ = a.default.realpathSyncAttempt(_) || _, [y, h] = n.default.get(_, v.tmpCreate || n.default.create, v.tmpPurge !== !1);
      const p = t.IS_POSIX && r.default.isUndefined(v.chown), w = r.default.isUndefined(v.mode);
      if (p || w) {
        const g = a.default.statSyncAttempt(_);
        g && (v = { ...v }, p && (v.chown = { uid: g.uid, gid: g.gid }), w && (v.mode = g.mode));
      }
      const m = e.dirname(_);
      a.default.mkdirSyncAttempt(m, {
        mode: t.DEFAULT_FOLDER_MODE,
        recursive: !0
      }), i = a.default.openSyncRetry(E)(y, "w", v.mode || t.DEFAULT_FILE_MODE), v.tmpCreated && v.tmpCreated(y), r.default.isString($) ? a.default.writeSyncRetry(E)(i, $, 0, v.encoding || t.DEFAULT_ENCODING) : r.default.isUndefined($) || a.default.writeSyncRetry(E)(i, $, 0, $.length, 0), v.fsync !== !1 && (v.fsyncWait !== !1 ? a.default.fsyncSyncRetry(E)(i) : a.default.fsyncAttempt(i)), a.default.closeSyncRetry(E)(i), i = null, v.chown && a.default.chownSyncAttempt(y, v.chown.uid, v.chown.gid), v.mode && a.default.chmodSyncAttempt(y, v.mode);
      try {
        a.default.renameSyncRetry(E)(y, _);
      } catch (g) {
        if (g.code !== "ENAMETOOLONG")
          throw g;
        a.default.renameSyncRetry(E)(y, n.default.truncate(_));
      }
      h(), y = null;
    } finally {
      i && a.default.closeSyncAttempt(i), y && n.default.purge(y);
    }
  };
  return qe.writeFileSync = s, qe;
}
var Ht = { exports: {} }, zn = {}, Ke = {}, it = {}, Kn = {}, Gn = {}, Hn = {}, Da;
function $n() {
  return Da || (Da = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
    class t {
    }
    e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    class a extends t {
      constructor(i) {
        if (super(), !e.IDENTIFIER.test(i))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = i;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return !1;
      }
      get names() {
        return { [this.str]: 1 };
      }
    }
    e.Name = a;
    class r extends t {
      constructor(i) {
        super(), this._items = typeof i == "string" ? [i] : i;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return !1;
        const i = this._items[0];
        return i === "" || i === '""';
      }
      get str() {
        var i;
        return (i = this._str) !== null && i !== void 0 ? i : this._str = this._items.reduce((p, w) => `${p}${w}`, "");
      }
      get names() {
        var i;
        return (i = this._names) !== null && i !== void 0 ? i : this._names = this._items.reduce((p, w) => (w instanceof a && (p[w.str] = (p[w.str] || 0) + 1), p), {});
      }
    }
    e._Code = r, e.nil = new r("");
    function l(y, ...i) {
      const p = [y[0]];
      let w = 0;
      for (; w < i.length; )
        o(p, i[w]), p.push(y[++w]);
      return new r(p);
    }
    e._ = l;
    const n = new r("+");
    function u(y, ...i) {
      const p = [v(y[0])];
      let w = 0;
      for (; w < i.length; )
        p.push(n), o(p, i[w]), p.push(n, v(y[++w]));
      return c(p), new r(p);
    }
    e.str = u;
    function o(y, i) {
      i instanceof r ? y.push(...i._items) : i instanceof a ? y.push(i) : y.push(_(i));
    }
    e.addCodeArg = o;
    function c(y) {
      let i = 1;
      for (; i < y.length - 1; ) {
        if (y[i] === n) {
          const p = d(y[i - 1], y[i + 1]);
          if (p !== void 0) {
            y.splice(i - 1, 3, p);
            continue;
          }
          y[i++] = "+";
        }
        i++;
      }
    }
    function d(y, i) {
      if (i === '""')
        return y;
      if (y === '""')
        return i;
      if (typeof y == "string")
        return i instanceof a || y[y.length - 1] !== '"' ? void 0 : typeof i != "string" ? `${y.slice(0, -1)}${i}"` : i[0] === '"' ? y.slice(0, -1) + i.slice(1) : void 0;
      if (typeof i == "string" && i[0] === '"' && !(y instanceof a))
        return `"${y}${i.slice(1)}`;
    }
    function s(y, i) {
      return i.emptyStr() ? y : y.emptyStr() ? i : u`${y}${i}`;
    }
    e.strConcat = s;
    function _(y) {
      return typeof y == "number" || typeof y == "boolean" || y === null ? y : v(Array.isArray(y) ? y.join(",") : y);
    }
    function $(y) {
      return new r(v(y));
    }
    e.stringify = $;
    function v(y) {
      return JSON.stringify(y).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    e.safeStringify = v;
    function S(y) {
      return typeof y == "string" && e.IDENTIFIER.test(y) ? new r(`.${y}`) : l`[${y}]`;
    }
    e.getProperty = S;
    function E(y) {
      if (typeof y == "string" && e.IDENTIFIER.test(y))
        return new r(`${y}`);
      throw new Error(`CodeGen: invalid export name: ${y}, use explicit $id name mapping`);
    }
    e.getEsmExportName = E;
    function h(y) {
      return new r(y.toString());
    }
    e.regexpCode = h;
  })(Hn)), Hn;
}
var Wn = {}, Ma;
function La() {
  return Ma || (Ma = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
    const t = $n();
    class a extends Error {
      constructor(d) {
        super(`CodeGen: "code" for ${d} not defined`), this.value = d.value;
      }
    }
    var r;
    (function(c) {
      c[c.Started = 0] = "Started", c[c.Completed = 1] = "Completed";
    })(r || (e.UsedValueState = r = {})), e.varKinds = {
      const: new t.Name("const"),
      let: new t.Name("let"),
      var: new t.Name("var")
    };
    class l {
      constructor({ prefixes: d, parent: s } = {}) {
        this._names = {}, this._prefixes = d, this._parent = s;
      }
      toName(d) {
        return d instanceof t.Name ? d : this.name(d);
      }
      name(d) {
        return new t.Name(this._newName(d));
      }
      _newName(d) {
        const s = this._names[d] || this._nameGroup(d);
        return `${d}${s.index++}`;
      }
      _nameGroup(d) {
        var s, _;
        if (!((_ = (s = this._parent) === null || s === void 0 ? void 0 : s._prefixes) === null || _ === void 0) && _.has(d) || this._prefixes && !this._prefixes.has(d))
          throw new Error(`CodeGen: prefix "${d}" is not allowed in this scope`);
        return this._names[d] = { prefix: d, index: 0 };
      }
    }
    e.Scope = l;
    class n extends t.Name {
      constructor(d, s) {
        super(s), this.prefix = d;
      }
      setValue(d, { property: s, itemIndex: _ }) {
        this.value = d, this.scopePath = (0, t._)`.${new t.Name(s)}[${_}]`;
      }
    }
    e.ValueScopeName = n;
    const u = (0, t._)`\n`;
    class o extends l {
      constructor(d) {
        super(d), this._values = {}, this._scope = d.scope, this.opts = { ...d, _n: d.lines ? u : t.nil };
      }
      get() {
        return this._scope;
      }
      name(d) {
        return new n(d, this._newName(d));
      }
      value(d, s) {
        var _;
        if (s.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const $ = this.toName(d), { prefix: v } = $, S = (_ = s.key) !== null && _ !== void 0 ? _ : s.ref;
        let E = this._values[v];
        if (E) {
          const i = E.get(S);
          if (i)
            return i;
        } else
          E = this._values[v] = /* @__PURE__ */ new Map();
        E.set(S, $);
        const h = this._scope[v] || (this._scope[v] = []), y = h.length;
        return h[y] = s.ref, $.setValue(s, { property: v, itemIndex: y }), $;
      }
      getValue(d, s) {
        const _ = this._values[d];
        if (_)
          return _.get(s);
      }
      scopeRefs(d, s = this._values) {
        return this._reduceValues(s, (_) => {
          if (_.scopePath === void 0)
            throw new Error(`CodeGen: name "${_}" has no value`);
          return (0, t._)`${d}${_.scopePath}`;
        });
      }
      scopeCode(d = this._values, s, _) {
        return this._reduceValues(d, ($) => {
          if ($.value === void 0)
            throw new Error(`CodeGen: name "${$}" has no value`);
          return $.value.code;
        }, s, _);
      }
      _reduceValues(d, s, _ = {}, $) {
        let v = t.nil;
        for (const S in d) {
          const E = d[S];
          if (!E)
            continue;
          const h = _[S] = _[S] || /* @__PURE__ */ new Map();
          E.forEach((y) => {
            if (h.has(y))
              return;
            h.set(y, r.Started);
            let i = s(y);
            if (i) {
              const p = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
              v = (0, t._)`${v}${p} ${y} = ${i};${this.opts._n}`;
            } else if (i = $ == null ? void 0 : $(y))
              v = (0, t._)`${v}${i}${this.opts._n}`;
            else
              throw new a(y);
            h.set(y, r.Completed);
          });
        }
        return v;
      }
    }
    e.ValueScope = o;
  })(Wn)), Wn;
}
var Fa;
function ne() {
  return Fa || (Fa = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
    const t = $n(), a = La();
    var r = $n();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return r._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return r.str;
    } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
      return r.strConcat;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return r.nil;
    } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
      return r.getProperty;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return r.stringify;
    } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
      return r.regexpCode;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return r.Name;
    } });
    var l = La();
    Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
      return l.Scope;
    } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
      return l.ValueScope;
    } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
      return l.ValueScopeName;
    } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
      return l.varKinds;
    } }), e.operators = {
      GT: new t._Code(">"),
      GTE: new t._Code(">="),
      LT: new t._Code("<"),
      LTE: new t._Code("<="),
      EQ: new t._Code("==="),
      NEQ: new t._Code("!=="),
      NOT: new t._Code("!"),
      OR: new t._Code("||"),
      AND: new t._Code("&&"),
      ADD: new t._Code("+")
    };
    class n {
      optimizeNodes() {
        return this;
      }
      optimizeNames(f, b) {
        return this;
      }
    }
    class u extends n {
      constructor(f, b, C) {
        super(), this.varKind = f, this.name = b, this.rhs = C;
      }
      render({ es5: f, _n: b }) {
        const C = f ? a.varKinds.var : this.varKind, K = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${C} ${this.name}${K};` + b;
      }
      optimizeNames(f, b) {
        if (f[this.name.str])
          return this.rhs && (this.rhs = V(this.rhs, f, b)), this;
      }
      get names() {
        return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
      }
    }
    class o extends n {
      constructor(f, b, C) {
        super(), this.lhs = f, this.rhs = b, this.sideEffects = C;
      }
      render({ _n: f }) {
        return `${this.lhs} = ${this.rhs};` + f;
      }
      optimizeNames(f, b) {
        if (!(this.lhs instanceof t.Name && !f[this.lhs.str] && !this.sideEffects))
          return this.rhs = V(this.rhs, f, b), this;
      }
      get names() {
        const f = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
        return B(f, this.rhs);
      }
    }
    class c extends o {
      constructor(f, b, C, K) {
        super(f, C, K), this.op = b;
      }
      render({ _n: f }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + f;
      }
    }
    class d extends n {
      constructor(f) {
        super(), this.label = f, this.names = {};
      }
      render({ _n: f }) {
        return `${this.label}:` + f;
      }
    }
    class s extends n {
      constructor(f) {
        super(), this.label = f, this.names = {};
      }
      render({ _n: f }) {
        return `break${this.label ? ` ${this.label}` : ""};` + f;
      }
    }
    class _ extends n {
      constructor(f) {
        super(), this.error = f;
      }
      render({ _n: f }) {
        return `throw ${this.error};` + f;
      }
      get names() {
        return this.error.names;
      }
    }
    class $ extends n {
      constructor(f) {
        super(), this.code = f;
      }
      render({ _n: f }) {
        return `${this.code};` + f;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(f, b) {
        return this.code = V(this.code, f, b), this;
      }
      get names() {
        return this.code instanceof t._CodeOrName ? this.code.names : {};
      }
    }
    class v extends n {
      constructor(f = []) {
        super(), this.nodes = f;
      }
      render(f) {
        return this.nodes.reduce((b, C) => b + C.render(f), "");
      }
      optimizeNodes() {
        const { nodes: f } = this;
        let b = f.length;
        for (; b--; ) {
          const C = f[b].optimizeNodes();
          Array.isArray(C) ? f.splice(b, 1, ...C) : C ? f[b] = C : f.splice(b, 1);
        }
        return f.length > 0 ? this : void 0;
      }
      optimizeNames(f, b) {
        const { nodes: C } = this;
        let K = C.length;
        for (; K--; ) {
          const G = C[K];
          G.optimizeNames(f, b) || (z(f, G.names), C.splice(K, 1));
        }
        return C.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((f, b) => W(f, b.names), {});
      }
    }
    class S extends v {
      render(f) {
        return "{" + f._n + super.render(f) + "}" + f._n;
      }
    }
    class E extends v {
    }
    class h extends S {
    }
    h.kind = "else";
    class y extends S {
      constructor(f, b) {
        super(b), this.condition = f;
      }
      render(f) {
        let b = `if(${this.condition})` + super.render(f);
        return this.else && (b += "else " + this.else.render(f)), b;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const f = this.condition;
        if (f === !0)
          return this.nodes;
        let b = this.else;
        if (b) {
          const C = b.optimizeNodes();
          b = this.else = Array.isArray(C) ? new h(C) : C;
        }
        if (b)
          return f === !1 ? b instanceof y ? b : b.nodes : this.nodes.length ? this : new y(Y(f), b instanceof y ? [b] : b.nodes);
        if (!(f === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(f, b) {
        var C;
        if (this.else = (C = this.else) === null || C === void 0 ? void 0 : C.optimizeNames(f, b), !!(super.optimizeNames(f, b) || this.else))
          return this.condition = V(this.condition, f, b), this;
      }
      get names() {
        const f = super.names;
        return B(f, this.condition), this.else && W(f, this.else.names), f;
      }
    }
    y.kind = "if";
    class i extends S {
    }
    i.kind = "for";
    class p extends i {
      constructor(f) {
        super(), this.iteration = f;
      }
      render(f) {
        return `for(${this.iteration})` + super.render(f);
      }
      optimizeNames(f, b) {
        if (super.optimizeNames(f, b))
          return this.iteration = V(this.iteration, f, b), this;
      }
      get names() {
        return W(super.names, this.iteration.names);
      }
    }
    class w extends i {
      constructor(f, b, C, K) {
        super(), this.varKind = f, this.name = b, this.from = C, this.to = K;
      }
      render(f) {
        const b = f.es5 ? a.varKinds.var : this.varKind, { name: C, from: K, to: G } = this;
        return `for(${b} ${C}=${K}; ${C}<${G}; ${C}++)` + super.render(f);
      }
      get names() {
        const f = B(super.names, this.from);
        return B(f, this.to);
      }
    }
    class m extends i {
      constructor(f, b, C, K) {
        super(), this.loop = f, this.varKind = b, this.name = C, this.iterable = K;
      }
      render(f) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(f);
      }
      optimizeNames(f, b) {
        if (super.optimizeNames(f, b))
          return this.iterable = V(this.iterable, f, b), this;
      }
      get names() {
        return W(super.names, this.iterable.names);
      }
    }
    class g extends S {
      constructor(f, b, C) {
        super(), this.name = f, this.args = b, this.async = C;
      }
      render(f) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(f);
      }
    }
    g.kind = "func";
    class P extends v {
      render(f) {
        return "return " + super.render(f);
      }
    }
    P.kind = "return";
    class I extends S {
      render(f) {
        let b = "try" + super.render(f);
        return this.catch && (b += this.catch.render(f)), this.finally && (b += this.finally.render(f)), b;
      }
      optimizeNodes() {
        var f, b;
        return super.optimizeNodes(), (f = this.catch) === null || f === void 0 || f.optimizeNodes(), (b = this.finally) === null || b === void 0 || b.optimizeNodes(), this;
      }
      optimizeNames(f, b) {
        var C, K;
        return super.optimizeNames(f, b), (C = this.catch) === null || C === void 0 || C.optimizeNames(f, b), (K = this.finally) === null || K === void 0 || K.optimizeNames(f, b), this;
      }
      get names() {
        const f = super.names;
        return this.catch && W(f, this.catch.names), this.finally && W(f, this.finally.names), f;
      }
    }
    class A extends S {
      constructor(f) {
        super(), this.error = f;
      }
      render(f) {
        return `catch(${this.error})` + super.render(f);
      }
    }
    A.kind = "catch";
    class M extends S {
      render(f) {
        return "finally" + super.render(f);
      }
    }
    M.kind = "finally";
    class F {
      constructor(f, b = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...b, _n: b.lines ? `
` : "" }, this._extScope = f, this._scope = new a.Scope({ parent: f }), this._nodes = [new E()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(f) {
        return this._scope.name(f);
      }
      // reserves unique name in the external scope
      scopeName(f) {
        return this._extScope.name(f);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(f, b) {
        const C = this._extScope.value(f, b);
        return (this._values[C.prefix] || (this._values[C.prefix] = /* @__PURE__ */ new Set())).add(C), C;
      }
      getScopeValue(f, b) {
        return this._extScope.getValue(f, b);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(f) {
        return this._extScope.scopeRefs(f, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(f, b, C, K) {
        const G = this._scope.toName(b);
        return C !== void 0 && K && (this._constants[G.str] = C), this._leafNode(new u(f, G, C)), G;
      }
      // `const` declaration (`var` in es5 mode)
      const(f, b, C) {
        return this._def(a.varKinds.const, f, b, C);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(f, b, C) {
        return this._def(a.varKinds.let, f, b, C);
      }
      // `var` declaration with optional assignment
      var(f, b, C) {
        return this._def(a.varKinds.var, f, b, C);
      }
      // assignment code
      assign(f, b, C) {
        return this._leafNode(new o(f, b, C));
      }
      // `+=` code
      add(f, b) {
        return this._leafNode(new c(f, e.operators.ADD, b));
      }
      // appends passed SafeExpr to code or executes Block
      code(f) {
        return typeof f == "function" ? f() : f !== t.nil && this._leafNode(new $(f)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...f) {
        const b = ["{"];
        for (const [C, K] of f)
          b.length > 1 && b.push(","), b.push(C), (C !== K || this.opts.es5) && (b.push(":"), (0, t.addCodeArg)(b, K));
        return b.push("}"), new t._Code(b);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(f, b, C) {
        if (this._blockNode(new y(f)), b && C)
          this.code(b).else().code(C).endIf();
        else if (b)
          this.code(b).endIf();
        else if (C)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(f) {
        return this._elseNode(new y(f));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new h());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(y, h);
      }
      _for(f, b) {
        return this._blockNode(f), b && this.code(b).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(f, b) {
        return this._for(new p(f), b);
      }
      // `for` statement for a range of values
      forRange(f, b, C, K, G = this.opts.es5 ? a.varKinds.var : a.varKinds.let) {
        const Q = this._scope.toName(f);
        return this._for(new w(G, Q, b, C), () => K(Q));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(f, b, C, K = a.varKinds.const) {
        const G = this._scope.toName(f);
        if (this.opts.es5) {
          const Q = b instanceof t.Name ? b : this.var("_arr", b);
          return this.forRange("_i", 0, (0, t._)`${Q}.length`, (x) => {
            this.var(G, (0, t._)`${Q}[${x}]`), C(G);
          });
        }
        return this._for(new m("of", K, G, b), () => C(G));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(f, b, C, K = this.opts.es5 ? a.varKinds.var : a.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(f, (0, t._)`Object.keys(${b})`, C);
        const G = this._scope.toName(f);
        return this._for(new m("in", K, G, b), () => C(G));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(i);
      }
      // `label` statement
      label(f) {
        return this._leafNode(new d(f));
      }
      // `break` statement
      break(f) {
        return this._leafNode(new s(f));
      }
      // `return` statement
      return(f) {
        const b = new P();
        if (this._blockNode(b), this.code(f), b.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(P);
      }
      // `try` statement
      try(f, b, C) {
        if (!b && !C)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const K = new I();
        if (this._blockNode(K), this.code(f), b) {
          const G = this.name("e");
          this._currNode = K.catch = new A(G), b(G);
        }
        return C && (this._currNode = K.finally = new M(), this.code(C)), this._endBlockNode(A, M);
      }
      // `throw` statement
      throw(f) {
        return this._leafNode(new _(f));
      }
      // start self-balancing block
      block(f, b) {
        return this._blockStarts.push(this._nodes.length), f && this.code(f).endBlock(b), this;
      }
      // end the current self-balancing block
      endBlock(f) {
        const b = this._blockStarts.pop();
        if (b === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const C = this._nodes.length - b;
        if (C < 0 || f !== void 0 && C !== f)
          throw new Error(`CodeGen: wrong number of nodes: ${C} vs ${f} expected`);
        return this._nodes.length = b, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(f, b = t.nil, C, K) {
        return this._blockNode(new g(f, b, C)), K && this.code(K).endFunc(), this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(g);
      }
      optimize(f = 1) {
        for (; f-- > 0; )
          this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(f) {
        return this._currNode.nodes.push(f), this;
      }
      _blockNode(f) {
        this._currNode.nodes.push(f), this._nodes.push(f);
      }
      _endBlockNode(f, b) {
        const C = this._currNode;
        if (C instanceof f || b && C instanceof b)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${b ? `${f.kind}/${b.kind}` : f.kind}"`);
      }
      _elseNode(f) {
        const b = this._currNode;
        if (!(b instanceof y))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = b.else = f, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const f = this._nodes;
        return f[f.length - 1];
      }
      set _currNode(f) {
        const b = this._nodes;
        b[b.length - 1] = f;
      }
    }
    e.CodeGen = F;
    function W(O, f) {
      for (const b in f)
        O[b] = (O[b] || 0) + (f[b] || 0);
      return O;
    }
    function B(O, f) {
      return f instanceof t._CodeOrName ? W(O, f.names) : O;
    }
    function V(O, f, b) {
      if (O instanceof t.Name)
        return C(O);
      if (!K(O))
        return O;
      return new t._Code(O._items.reduce((G, Q) => (Q instanceof t.Name && (Q = C(Q)), Q instanceof t._Code ? G.push(...Q._items) : G.push(Q), G), []));
      function C(G) {
        const Q = b[G.str];
        return Q === void 0 || f[G.str] !== 1 ? G : (delete f[G.str], Q);
      }
      function K(G) {
        return G instanceof t._Code && G._items.some((Q) => Q instanceof t.Name && f[Q.str] === 1 && b[Q.str] !== void 0);
      }
    }
    function z(O, f) {
      for (const b in f)
        O[b] = (O[b] || 0) - (f[b] || 0);
    }
    function Y(O) {
      return typeof O == "boolean" || typeof O == "number" || O === null ? !O : (0, t._)`!${k(O)}`;
    }
    e.not = Y;
    const J = R(e.operators.AND);
    function D(...O) {
      return O.reduce(J);
    }
    e.and = D;
    const U = R(e.operators.OR);
    function j(...O) {
      return O.reduce(U);
    }
    e.or = j;
    function R(O) {
      return (f, b) => f === t.nil ? b : b === t.nil ? f : (0, t._)`${k(f)} ${O} ${k(b)}`;
    }
    function k(O) {
      return O instanceof t.Name ? O : (0, t._)`(${O})`;
    }
  })(Gn)), Gn;
}
var ee = {}, Va;
function oe() {
  if (Va) return ee;
  Va = 1, Object.defineProperty(ee, "__esModule", { value: !0 }), ee.checkStrictMode = ee.getErrorPath = ee.Type = ee.useFunc = ee.setEvaluated = ee.evaluatedPropsToName = ee.mergeEvaluated = ee.eachItem = ee.unescapeJsonPointer = ee.escapeJsonPointer = ee.escapeFragment = ee.unescapeFragment = ee.schemaRefOrVal = ee.schemaHasRulesButRef = ee.schemaHasRules = ee.checkUnknownRules = ee.alwaysValidSchema = ee.toHash = void 0;
  const e = ne(), t = $n();
  function a(m) {
    const g = {};
    for (const P of m)
      g[P] = !0;
    return g;
  }
  ee.toHash = a;
  function r(m, g) {
    return typeof g == "boolean" ? g : Object.keys(g).length === 0 ? !0 : (l(m, g), !n(g, m.self.RULES.all));
  }
  ee.alwaysValidSchema = r;
  function l(m, g = m.schema) {
    const { opts: P, self: I } = m;
    if (!P.strictSchema || typeof g == "boolean")
      return;
    const A = I.RULES.keywords;
    for (const M in g)
      A[M] || w(m, `unknown keyword: "${M}"`);
  }
  ee.checkUnknownRules = l;
  function n(m, g) {
    if (typeof m == "boolean")
      return !m;
    for (const P in m)
      if (g[P])
        return !0;
    return !1;
  }
  ee.schemaHasRules = n;
  function u(m, g) {
    if (typeof m == "boolean")
      return !m;
    for (const P in m)
      if (P !== "$ref" && g.all[P])
        return !0;
    return !1;
  }
  ee.schemaHasRulesButRef = u;
  function o({ topSchemaRef: m, schemaPath: g }, P, I, A) {
    if (!A) {
      if (typeof P == "number" || typeof P == "boolean")
        return P;
      if (typeof P == "string")
        return (0, e._)`${P}`;
    }
    return (0, e._)`${m}${g}${(0, e.getProperty)(I)}`;
  }
  ee.schemaRefOrVal = o;
  function c(m) {
    return _(decodeURIComponent(m));
  }
  ee.unescapeFragment = c;
  function d(m) {
    return encodeURIComponent(s(m));
  }
  ee.escapeFragment = d;
  function s(m) {
    return typeof m == "number" ? `${m}` : m.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  ee.escapeJsonPointer = s;
  function _(m) {
    return m.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  ee.unescapeJsonPointer = _;
  function $(m, g) {
    if (Array.isArray(m))
      for (const P of m)
        g(P);
    else
      g(m);
  }
  ee.eachItem = $;
  function v({ mergeNames: m, mergeToName: g, mergeValues: P, resultToName: I }) {
    return (A, M, F, W) => {
      const B = F === void 0 ? M : F instanceof e.Name ? (M instanceof e.Name ? m(A, M, F) : g(A, M, F), F) : M instanceof e.Name ? (g(A, F, M), M) : P(M, F);
      return W === e.Name && !(B instanceof e.Name) ? I(A, B) : B;
    };
  }
  ee.mergeEvaluated = {
    props: v({
      mergeNames: (m, g, P) => m.if((0, e._)`${P} !== true && ${g} !== undefined`, () => {
        m.if((0, e._)`${g} === true`, () => m.assign(P, !0), () => m.assign(P, (0, e._)`${P} || {}`).code((0, e._)`Object.assign(${P}, ${g})`));
      }),
      mergeToName: (m, g, P) => m.if((0, e._)`${P} !== true`, () => {
        g === !0 ? m.assign(P, !0) : (m.assign(P, (0, e._)`${P} || {}`), E(m, P, g));
      }),
      mergeValues: (m, g) => m === !0 ? !0 : { ...m, ...g },
      resultToName: S
    }),
    items: v({
      mergeNames: (m, g, P) => m.if((0, e._)`${P} !== true && ${g} !== undefined`, () => m.assign(P, (0, e._)`${g} === true ? true : ${P} > ${g} ? ${P} : ${g}`)),
      mergeToName: (m, g, P) => m.if((0, e._)`${P} !== true`, () => m.assign(P, g === !0 ? !0 : (0, e._)`${P} > ${g} ? ${P} : ${g}`)),
      mergeValues: (m, g) => m === !0 ? !0 : Math.max(m, g),
      resultToName: (m, g) => m.var("items", g)
    })
  };
  function S(m, g) {
    if (g === !0)
      return m.var("props", !0);
    const P = m.var("props", (0, e._)`{}`);
    return g !== void 0 && E(m, P, g), P;
  }
  ee.evaluatedPropsToName = S;
  function E(m, g, P) {
    Object.keys(P).forEach((I) => m.assign((0, e._)`${g}${(0, e.getProperty)(I)}`, !0));
  }
  ee.setEvaluated = E;
  const h = {};
  function y(m, g) {
    return m.scopeValue("func", {
      ref: g,
      code: h[g.code] || (h[g.code] = new t._Code(g.code))
    });
  }
  ee.useFunc = y;
  var i;
  (function(m) {
    m[m.Num = 0] = "Num", m[m.Str = 1] = "Str";
  })(i || (ee.Type = i = {}));
  function p(m, g, P) {
    if (m instanceof e.Name) {
      const I = g === i.Num;
      return P ? I ? (0, e._)`"[" + ${m} + "]"` : (0, e._)`"['" + ${m} + "']"` : I ? (0, e._)`"/" + ${m}` : (0, e._)`"/" + ${m}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return P ? (0, e.getProperty)(m).toString() : "/" + s(m);
  }
  ee.getErrorPath = p;
  function w(m, g, P = m.opts.strictSchema) {
    if (P) {
      if (g = `strict mode: ${g}`, P === !0)
        throw new Error(g);
      m.self.logger.warn(g);
    }
  }
  return ee.checkStrictMode = w, ee;
}
var Wt = {}, Ua;
function Ze() {
  if (Ua) return Wt;
  Ua = 1, Object.defineProperty(Wt, "__esModule", { value: !0 });
  const e = ne(), t = {
    // validation function arguments
    data: new e.Name("data"),
    // data passed to validation function
    // args passed from referencing schema
    valCxt: new e.Name("valCxt"),
    // validation/data context - should not be used directly, it is destructured to the names below
    instancePath: new e.Name("instancePath"),
    parentData: new e.Name("parentData"),
    parentDataProperty: new e.Name("parentDataProperty"),
    rootData: new e.Name("rootData"),
    // root data - same as the data passed to the first/top validation function
    dynamicAnchors: new e.Name("dynamicAnchors"),
    // used to support recursiveRef and dynamicRef
    // function scoped variables
    vErrors: new e.Name("vErrors"),
    // null or array of validation errors
    errors: new e.Name("errors"),
    // counter of validation errors
    this: new e.Name("this"),
    // "globals"
    self: new e.Name("self"),
    scope: new e.Name("scope"),
    // JTD serialize/parse name for JSON string and position
    json: new e.Name("json"),
    jsonPos: new e.Name("jsonPos"),
    jsonLen: new e.Name("jsonLen"),
    jsonPart: new e.Name("jsonPart")
  };
  return Wt.default = t, Wt;
}
var za;
function bn() {
  return za || (za = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
    const t = ne(), a = oe(), r = Ze();
    e.keywordError = {
      message: ({ keyword: h }) => (0, t.str)`must pass "${h}" keyword validation`
    }, e.keyword$DataError = {
      message: ({ keyword: h, schemaType: y }) => y ? (0, t.str)`"${h}" keyword must be ${y} ($data)` : (0, t.str)`"${h}" keyword is invalid ($data)`
    };
    function l(h, y = e.keywordError, i, p) {
      const { it: w } = h, { gen: m, compositeRule: g, allErrors: P } = w, I = _(h, y, i);
      p ?? (g || P) ? c(m, I) : d(w, (0, t._)`[${I}]`);
    }
    e.reportError = l;
    function n(h, y = e.keywordError, i) {
      const { it: p } = h, { gen: w, compositeRule: m, allErrors: g } = p, P = _(h, y, i);
      c(w, P), m || g || d(p, r.default.vErrors);
    }
    e.reportExtraError = n;
    function u(h, y) {
      h.assign(r.default.errors, y), h.if((0, t._)`${r.default.vErrors} !== null`, () => h.if(y, () => h.assign((0, t._)`${r.default.vErrors}.length`, y), () => h.assign(r.default.vErrors, null)));
    }
    e.resetErrorsCount = u;
    function o({ gen: h, keyword: y, schemaValue: i, data: p, errsCount: w, it: m }) {
      if (w === void 0)
        throw new Error("ajv implementation error");
      const g = h.name("err");
      h.forRange("i", w, r.default.errors, (P) => {
        h.const(g, (0, t._)`${r.default.vErrors}[${P}]`), h.if((0, t._)`${g}.instancePath === undefined`, () => h.assign((0, t._)`${g}.instancePath`, (0, t.strConcat)(r.default.instancePath, m.errorPath))), h.assign((0, t._)`${g}.schemaPath`, (0, t.str)`${m.errSchemaPath}/${y}`), m.opts.verbose && (h.assign((0, t._)`${g}.schema`, i), h.assign((0, t._)`${g}.data`, p));
      });
    }
    e.extendErrors = o;
    function c(h, y) {
      const i = h.const("err", y);
      h.if((0, t._)`${r.default.vErrors} === null`, () => h.assign(r.default.vErrors, (0, t._)`[${i}]`), (0, t._)`${r.default.vErrors}.push(${i})`), h.code((0, t._)`${r.default.errors}++`);
    }
    function d(h, y) {
      const { gen: i, validateName: p, schemaEnv: w } = h;
      w.$async ? i.throw((0, t._)`new ${h.ValidationError}(${y})`) : (i.assign((0, t._)`${p}.errors`, y), i.return(!1));
    }
    const s = {
      keyword: new t.Name("keyword"),
      schemaPath: new t.Name("schemaPath"),
      // also used in JTD errors
      params: new t.Name("params"),
      propertyName: new t.Name("propertyName"),
      message: new t.Name("message"),
      schema: new t.Name("schema"),
      parentSchema: new t.Name("parentSchema")
    };
    function _(h, y, i) {
      const { createErrors: p } = h.it;
      return p === !1 ? (0, t._)`{}` : $(h, y, i);
    }
    function $(h, y, i = {}) {
      const { gen: p, it: w } = h, m = [
        v(w, i),
        S(h, i)
      ];
      return E(h, y, m), p.object(...m);
    }
    function v({ errorPath: h }, { instancePath: y }) {
      const i = y ? (0, t.str)`${h}${(0, a.getErrorPath)(y, a.Type.Str)}` : h;
      return [r.default.instancePath, (0, t.strConcat)(r.default.instancePath, i)];
    }
    function S({ keyword: h, it: { errSchemaPath: y } }, { schemaPath: i, parentSchema: p }) {
      let w = p ? y : (0, t.str)`${y}/${h}`;
      return i && (w = (0, t.str)`${w}${(0, a.getErrorPath)(i, a.Type.Str)}`), [s.schemaPath, w];
    }
    function E(h, { params: y, message: i }, p) {
      const { keyword: w, data: m, schemaValue: g, it: P } = h, { opts: I, propertyName: A, topSchemaRef: M, schemaPath: F } = P;
      p.push([s.keyword, w], [s.params, typeof y == "function" ? y(h) : y || (0, t._)`{}`]), I.messages && p.push([s.message, typeof i == "function" ? i(h) : i]), I.verbose && p.push([s.schema, g], [s.parentSchema, (0, t._)`${M}${F}`], [r.default.data, m]), A && p.push([s.propertyName, A]);
    }
  })(Kn)), Kn;
}
var Ka;
function al() {
  if (Ka) return it;
  Ka = 1, Object.defineProperty(it, "__esModule", { value: !0 }), it.boolOrEmptySchema = it.topBoolOrEmptySchema = void 0;
  const e = bn(), t = ne(), a = Ze(), r = {
    message: "boolean schema is false"
  };
  function l(o) {
    const { gen: c, schema: d, validateName: s } = o;
    d === !1 ? u(o, !1) : typeof d == "object" && d.$async === !0 ? c.return(a.default.data) : (c.assign((0, t._)`${s}.errors`, null), c.return(!0));
  }
  it.topBoolOrEmptySchema = l;
  function n(o, c) {
    const { gen: d, schema: s } = o;
    s === !1 ? (d.var(c, !1), u(o)) : d.var(c, !0);
  }
  it.boolOrEmptySchema = n;
  function u(o, c) {
    const { gen: d, data: s } = o, _ = {
      gen: d,
      keyword: "false schema",
      data: s,
      schema: !1,
      schemaCode: !1,
      schemaValue: !1,
      params: {},
      it: o
    };
    (0, e.reportError)(_, r, void 0, c);
  }
  return it;
}
var _e = {}, ct = {}, Ga;
function uu() {
  if (Ga) return ct;
  Ga = 1, Object.defineProperty(ct, "__esModule", { value: !0 }), ct.getRules = ct.isJSONType = void 0;
  const e = ["string", "number", "integer", "boolean", "null", "object", "array"], t = new Set(e);
  function a(l) {
    return typeof l == "string" && t.has(l);
  }
  ct.isJSONType = a;
  function r() {
    const l = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...l, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, l.number, l.string, l.array, l.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  return ct.getRules = r, ct;
}
var Ge = {}, Ha;
function lu() {
  if (Ha) return Ge;
  Ha = 1, Object.defineProperty(Ge, "__esModule", { value: !0 }), Ge.shouldUseRule = Ge.shouldUseGroup = Ge.schemaHasRulesForType = void 0;
  function e({ schema: r, self: l }, n) {
    const u = l.RULES.types[n];
    return u && u !== !0 && t(r, u);
  }
  Ge.schemaHasRulesForType = e;
  function t(r, l) {
    return l.rules.some((n) => a(r, n));
  }
  Ge.shouldUseGroup = t;
  function a(r, l) {
    var n;
    return r[l.keyword] !== void 0 || ((n = l.definition.implements) === null || n === void 0 ? void 0 : n.some((u) => r[u] !== void 0));
  }
  return Ge.shouldUseRule = a, Ge;
}
var Wa;
function _n() {
  if (Wa) return _e;
  Wa = 1, Object.defineProperty(_e, "__esModule", { value: !0 }), _e.reportTypeError = _e.checkDataTypes = _e.checkDataType = _e.coerceAndCheckDataType = _e.getJSONTypes = _e.getSchemaTypes = _e.DataType = void 0;
  const e = uu(), t = lu(), a = bn(), r = ne(), l = oe();
  var n;
  (function(i) {
    i[i.Correct = 0] = "Correct", i[i.Wrong = 1] = "Wrong";
  })(n || (_e.DataType = n = {}));
  function u(i) {
    const p = o(i.type);
    if (p.includes("null")) {
      if (i.nullable === !1)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!p.length && i.nullable !== void 0)
        throw new Error('"nullable" cannot be used without "type"');
      i.nullable === !0 && p.push("null");
    }
    return p;
  }
  _e.getSchemaTypes = u;
  function o(i) {
    const p = Array.isArray(i) ? i : i ? [i] : [];
    if (p.every(e.isJSONType))
      return p;
    throw new Error("type must be JSONType or JSONType[]: " + p.join(","));
  }
  _e.getJSONTypes = o;
  function c(i, p) {
    const { gen: w, data: m, opts: g } = i, P = s(p, g.coerceTypes), I = p.length > 0 && !(P.length === 0 && p.length === 1 && (0, t.schemaHasRulesForType)(i, p[0]));
    if (I) {
      const A = S(p, m, g.strictNumbers, n.Wrong);
      w.if(A, () => {
        P.length ? _(i, p, P) : h(i);
      });
    }
    return I;
  }
  _e.coerceAndCheckDataType = c;
  const d = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function s(i, p) {
    return p ? i.filter((w) => d.has(w) || p === "array" && w === "array") : [];
  }
  function _(i, p, w) {
    const { gen: m, data: g, opts: P } = i, I = m.let("dataType", (0, r._)`typeof ${g}`), A = m.let("coerced", (0, r._)`undefined`);
    P.coerceTypes === "array" && m.if((0, r._)`${I} == 'object' && Array.isArray(${g}) && ${g}.length == 1`, () => m.assign(g, (0, r._)`${g}[0]`).assign(I, (0, r._)`typeof ${g}`).if(S(p, g, P.strictNumbers), () => m.assign(A, g))), m.if((0, r._)`${A} !== undefined`);
    for (const F of w)
      (d.has(F) || F === "array" && P.coerceTypes === "array") && M(F);
    m.else(), h(i), m.endIf(), m.if((0, r._)`${A} !== undefined`, () => {
      m.assign(g, A), $(i, A);
    });
    function M(F) {
      switch (F) {
        case "string":
          m.elseIf((0, r._)`${I} == "number" || ${I} == "boolean"`).assign(A, (0, r._)`"" + ${g}`).elseIf((0, r._)`${g} === null`).assign(A, (0, r._)`""`);
          return;
        case "number":
          m.elseIf((0, r._)`${I} == "boolean" || ${g} === null
              || (${I} == "string" && ${g} && ${g} == +${g})`).assign(A, (0, r._)`+${g}`);
          return;
        case "integer":
          m.elseIf((0, r._)`${I} === "boolean" || ${g} === null
              || (${I} === "string" && ${g} && ${g} == +${g} && !(${g} % 1))`).assign(A, (0, r._)`+${g}`);
          return;
        case "boolean":
          m.elseIf((0, r._)`${g} === "false" || ${g} === 0 || ${g} === null`).assign(A, !1).elseIf((0, r._)`${g} === "true" || ${g} === 1`).assign(A, !0);
          return;
        case "null":
          m.elseIf((0, r._)`${g} === "" || ${g} === 0 || ${g} === false`), m.assign(A, null);
          return;
        case "array":
          m.elseIf((0, r._)`${I} === "string" || ${I} === "number"
              || ${I} === "boolean" || ${g} === null`).assign(A, (0, r._)`[${g}]`);
      }
    }
  }
  function $({ gen: i, parentData: p, parentDataProperty: w }, m) {
    i.if((0, r._)`${p} !== undefined`, () => i.assign((0, r._)`${p}[${w}]`, m));
  }
  function v(i, p, w, m = n.Correct) {
    const g = m === n.Correct ? r.operators.EQ : r.operators.NEQ;
    let P;
    switch (i) {
      case "null":
        return (0, r._)`${p} ${g} null`;
      case "array":
        P = (0, r._)`Array.isArray(${p})`;
        break;
      case "object":
        P = (0, r._)`${p} && typeof ${p} == "object" && !Array.isArray(${p})`;
        break;
      case "integer":
        P = I((0, r._)`!(${p} % 1) && !isNaN(${p})`);
        break;
      case "number":
        P = I();
        break;
      default:
        return (0, r._)`typeof ${p} ${g} ${i}`;
    }
    return m === n.Correct ? P : (0, r.not)(P);
    function I(A = r.nil) {
      return (0, r.and)((0, r._)`typeof ${p} == "number"`, A, w ? (0, r._)`isFinite(${p})` : r.nil);
    }
  }
  _e.checkDataType = v;
  function S(i, p, w, m) {
    if (i.length === 1)
      return v(i[0], p, w, m);
    let g;
    const P = (0, l.toHash)(i);
    if (P.array && P.object) {
      const I = (0, r._)`typeof ${p} != "object"`;
      g = P.null ? I : (0, r._)`!${p} || ${I}`, delete P.null, delete P.array, delete P.object;
    } else
      g = r.nil;
    P.number && delete P.integer;
    for (const I in P)
      g = (0, r.and)(g, v(I, p, w, m));
    return g;
  }
  _e.checkDataTypes = S;
  const E = {
    message: ({ schema: i }) => `must be ${i}`,
    params: ({ schema: i, schemaValue: p }) => typeof i == "string" ? (0, r._)`{type: ${i}}` : (0, r._)`{type: ${p}}`
  };
  function h(i) {
    const p = y(i);
    (0, a.reportError)(p, E);
  }
  _e.reportTypeError = h;
  function y(i) {
    const { gen: p, data: w, schema: m } = i, g = (0, l.schemaRefOrVal)(i, m, "type");
    return {
      gen: p,
      keyword: "type",
      data: w,
      schema: m.type,
      schemaCode: g,
      schemaValue: g,
      parentSchema: m,
      params: {},
      it: i
    };
  }
  return _e;
}
var wt = {}, Ba;
function ol() {
  if (Ba) return wt;
  Ba = 1, Object.defineProperty(wt, "__esModule", { value: !0 }), wt.assignDefaults = void 0;
  const e = ne(), t = oe();
  function a(l, n) {
    const { properties: u, items: o } = l.schema;
    if (n === "object" && u)
      for (const c in u)
        r(l, c, u[c].default);
    else n === "array" && Array.isArray(o) && o.forEach((c, d) => r(l, d, c.default));
  }
  wt.assignDefaults = a;
  function r(l, n, u) {
    const { gen: o, compositeRule: c, data: d, opts: s } = l;
    if (u === void 0)
      return;
    const _ = (0, e._)`${d}${(0, e.getProperty)(n)}`;
    if (c) {
      (0, t.checkStrictMode)(l, `default is ignored for: ${_}`);
      return;
    }
    let $ = (0, e._)`${_} === undefined`;
    s.useDefaults === "empty" && ($ = (0, e._)`${$} || ${_} === null || ${_} === ""`), o.if($, (0, e._)`${_} = ${(0, e.stringify)(u)}`);
  }
  return wt;
}
var De = {}, de = {}, Ja;
function Fe() {
  if (Ja) return de;
  Ja = 1, Object.defineProperty(de, "__esModule", { value: !0 }), de.validateUnion = de.validateArray = de.usePattern = de.callValidateCode = de.schemaProperties = de.allSchemaProperties = de.noPropertyInData = de.propertyInData = de.isOwnProperty = de.hasPropFunc = de.reportMissingProp = de.checkMissingProp = de.checkReportMissingProp = void 0;
  const e = ne(), t = oe(), a = Ze(), r = oe();
  function l(i, p) {
    const { gen: w, data: m, it: g } = i;
    w.if(s(w, m, p, g.opts.ownProperties), () => {
      i.setParams({ missingProperty: (0, e._)`${p}` }, !0), i.error();
    });
  }
  de.checkReportMissingProp = l;
  function n({ gen: i, data: p, it: { opts: w } }, m, g) {
    return (0, e.or)(...m.map((P) => (0, e.and)(s(i, p, P, w.ownProperties), (0, e._)`${g} = ${P}`)));
  }
  de.checkMissingProp = n;
  function u(i, p) {
    i.setParams({ missingProperty: p }, !0), i.error();
  }
  de.reportMissingProp = u;
  function o(i) {
    return i.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, e._)`Object.prototype.hasOwnProperty`
    });
  }
  de.hasPropFunc = o;
  function c(i, p, w) {
    return (0, e._)`${o(i)}.call(${p}, ${w})`;
  }
  de.isOwnProperty = c;
  function d(i, p, w, m) {
    const g = (0, e._)`${p}${(0, e.getProperty)(w)} !== undefined`;
    return m ? (0, e._)`${g} && ${c(i, p, w)}` : g;
  }
  de.propertyInData = d;
  function s(i, p, w, m) {
    const g = (0, e._)`${p}${(0, e.getProperty)(w)} === undefined`;
    return m ? (0, e.or)(g, (0, e.not)(c(i, p, w))) : g;
  }
  de.noPropertyInData = s;
  function _(i) {
    return i ? Object.keys(i).filter((p) => p !== "__proto__") : [];
  }
  de.allSchemaProperties = _;
  function $(i, p) {
    return _(p).filter((w) => !(0, t.alwaysValidSchema)(i, p[w]));
  }
  de.schemaProperties = $;
  function v({ schemaCode: i, data: p, it: { gen: w, topSchemaRef: m, schemaPath: g, errorPath: P }, it: I }, A, M, F) {
    const W = F ? (0, e._)`${i}, ${p}, ${m}${g}` : p, B = [
      [a.default.instancePath, (0, e.strConcat)(a.default.instancePath, P)],
      [a.default.parentData, I.parentData],
      [a.default.parentDataProperty, I.parentDataProperty],
      [a.default.rootData, a.default.rootData]
    ];
    I.opts.dynamicRef && B.push([a.default.dynamicAnchors, a.default.dynamicAnchors]);
    const V = (0, e._)`${W}, ${w.object(...B)}`;
    return M !== e.nil ? (0, e._)`${A}.call(${M}, ${V})` : (0, e._)`${A}(${V})`;
  }
  de.callValidateCode = v;
  const S = (0, e._)`new RegExp`;
  function E({ gen: i, it: { opts: p } }, w) {
    const m = p.unicodeRegExp ? "u" : "", { regExp: g } = p.code, P = g(w, m);
    return i.scopeValue("pattern", {
      key: P.toString(),
      ref: P,
      code: (0, e._)`${g.code === "new RegExp" ? S : (0, r.useFunc)(i, g)}(${w}, ${m})`
    });
  }
  de.usePattern = E;
  function h(i) {
    const { gen: p, data: w, keyword: m, it: g } = i, P = p.name("valid");
    if (g.allErrors) {
      const A = p.let("valid", !0);
      return I(() => p.assign(A, !1)), A;
    }
    return p.var(P, !0), I(() => p.break()), P;
    function I(A) {
      const M = p.const("len", (0, e._)`${w}.length`);
      p.forRange("i", 0, M, (F) => {
        i.subschema({
          keyword: m,
          dataProp: F,
          dataPropType: t.Type.Num
        }, P), p.if((0, e.not)(P), A);
      });
    }
  }
  de.validateArray = h;
  function y(i) {
    const { gen: p, schema: w, keyword: m, it: g } = i;
    if (!Array.isArray(w))
      throw new Error("ajv implementation error");
    if (w.some((M) => (0, t.alwaysValidSchema)(g, M)) && !g.opts.unevaluated)
      return;
    const I = p.let("valid", !1), A = p.name("_valid");
    p.block(() => w.forEach((M, F) => {
      const W = i.subschema({
        keyword: m,
        schemaProp: F,
        compositeRule: !0
      }, A);
      p.assign(I, (0, e._)`${I} || ${A}`), i.mergeValidEvaluated(W, A) || p.if((0, e.not)(I));
    })), i.result(I, () => i.reset(), () => i.error(!0));
  }
  return de.validateUnion = y, de;
}
var Xa;
function il() {
  if (Xa) return De;
  Xa = 1, Object.defineProperty(De, "__esModule", { value: !0 }), De.validateKeywordUsage = De.validSchemaType = De.funcKeywordCode = De.macroKeywordCode = void 0;
  const e = ne(), t = Ze(), a = Fe(), r = bn();
  function l($, v) {
    const { gen: S, keyword: E, schema: h, parentSchema: y, it: i } = $, p = v.macro.call(i.self, h, y, i), w = d(S, E, p);
    i.opts.validateSchema !== !1 && i.self.validateSchema(p, !0);
    const m = S.name("valid");
    $.subschema({
      schema: p,
      schemaPath: e.nil,
      errSchemaPath: `${i.errSchemaPath}/${E}`,
      topSchemaRef: w,
      compositeRule: !0
    }, m), $.pass(m, () => $.error(!0));
  }
  De.macroKeywordCode = l;
  function n($, v) {
    var S;
    const { gen: E, keyword: h, schema: y, parentSchema: i, $data: p, it: w } = $;
    c(w, v);
    const m = !p && v.compile ? v.compile.call(w.self, y, i, w) : v.validate, g = d(E, h, m), P = E.let("valid");
    $.block$data(P, I), $.ok((S = v.valid) !== null && S !== void 0 ? S : P);
    function I() {
      if (v.errors === !1)
        F(), v.modifying && u($), W(() => $.error());
      else {
        const B = v.async ? A() : M();
        v.modifying && u($), W(() => o($, B));
      }
    }
    function A() {
      const B = E.let("ruleErrs", null);
      return E.try(() => F((0, e._)`await `), (V) => E.assign(P, !1).if((0, e._)`${V} instanceof ${w.ValidationError}`, () => E.assign(B, (0, e._)`${V}.errors`), () => E.throw(V))), B;
    }
    function M() {
      const B = (0, e._)`${g}.errors`;
      return E.assign(B, null), F(e.nil), B;
    }
    function F(B = v.async ? (0, e._)`await ` : e.nil) {
      const V = w.opts.passContext ? t.default.this : t.default.self, z = !("compile" in v && !p || v.schema === !1);
      E.assign(P, (0, e._)`${B}${(0, a.callValidateCode)($, g, V, z)}`, v.modifying);
    }
    function W(B) {
      var V;
      E.if((0, e.not)((V = v.valid) !== null && V !== void 0 ? V : P), B);
    }
  }
  De.funcKeywordCode = n;
  function u($) {
    const { gen: v, data: S, it: E } = $;
    v.if(E.parentData, () => v.assign(S, (0, e._)`${E.parentData}[${E.parentDataProperty}]`));
  }
  function o($, v) {
    const { gen: S } = $;
    S.if((0, e._)`Array.isArray(${v})`, () => {
      S.assign(t.default.vErrors, (0, e._)`${t.default.vErrors} === null ? ${v} : ${t.default.vErrors}.concat(${v})`).assign(t.default.errors, (0, e._)`${t.default.vErrors}.length`), (0, r.extendErrors)($);
    }, () => $.error());
  }
  function c({ schemaEnv: $ }, v) {
    if (v.async && !$.$async)
      throw new Error("async keyword in sync schema");
  }
  function d($, v, S) {
    if (S === void 0)
      throw new Error(`keyword "${v}" failed to compile`);
    return $.scopeValue("keyword", typeof S == "function" ? { ref: S } : { ref: S, code: (0, e.stringify)(S) });
  }
  function s($, v, S = !1) {
    return !v.length || v.some((E) => E === "array" ? Array.isArray($) : E === "object" ? $ && typeof $ == "object" && !Array.isArray($) : typeof $ == E || S && typeof $ > "u");
  }
  De.validSchemaType = s;
  function _({ schema: $, opts: v, self: S, errSchemaPath: E }, h, y) {
    if (Array.isArray(h.keyword) ? !h.keyword.includes(y) : h.keyword !== y)
      throw new Error("ajv implementation error");
    const i = h.dependencies;
    if (i != null && i.some((p) => !Object.prototype.hasOwnProperty.call($, p)))
      throw new Error(`parent schema must have dependencies of ${y}: ${i.join(",")}`);
    if (h.validateSchema && !h.validateSchema($[y])) {
      const w = `keyword "${y}" value is invalid at path "${E}": ` + S.errorsText(h.validateSchema.errors);
      if (v.validateSchema === "log")
        S.logger.error(w);
      else
        throw new Error(w);
    }
  }
  return De.validateKeywordUsage = _, De;
}
var He = {}, Ya;
function cl() {
  if (Ya) return He;
  Ya = 1, Object.defineProperty(He, "__esModule", { value: !0 }), He.extendSubschemaMode = He.extendSubschemaData = He.getSubschema = void 0;
  const e = ne(), t = oe();
  function a(n, { keyword: u, schemaProp: o, schema: c, schemaPath: d, errSchemaPath: s, topSchemaRef: _ }) {
    if (u !== void 0 && c !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (u !== void 0) {
      const $ = n.schema[u];
      return o === void 0 ? {
        schema: $,
        schemaPath: (0, e._)`${n.schemaPath}${(0, e.getProperty)(u)}`,
        errSchemaPath: `${n.errSchemaPath}/${u}`
      } : {
        schema: $[o],
        schemaPath: (0, e._)`${n.schemaPath}${(0, e.getProperty)(u)}${(0, e.getProperty)(o)}`,
        errSchemaPath: `${n.errSchemaPath}/${u}/${(0, t.escapeFragment)(o)}`
      };
    }
    if (c !== void 0) {
      if (d === void 0 || s === void 0 || _ === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: c,
        schemaPath: d,
        topSchemaRef: _,
        errSchemaPath: s
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  He.getSubschema = a;
  function r(n, u, { dataProp: o, dataPropType: c, data: d, dataTypes: s, propertyName: _ }) {
    if (d !== void 0 && o !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: $ } = u;
    if (o !== void 0) {
      const { errorPath: S, dataPathArr: E, opts: h } = u, y = $.let("data", (0, e._)`${u.data}${(0, e.getProperty)(o)}`, !0);
      v(y), n.errorPath = (0, e.str)`${S}${(0, t.getErrorPath)(o, c, h.jsPropertySyntax)}`, n.parentDataProperty = (0, e._)`${o}`, n.dataPathArr = [...E, n.parentDataProperty];
    }
    if (d !== void 0) {
      const S = d instanceof e.Name ? d : $.let("data", d, !0);
      v(S), _ !== void 0 && (n.propertyName = _);
    }
    s && (n.dataTypes = s);
    function v(S) {
      n.data = S, n.dataLevel = u.dataLevel + 1, n.dataTypes = [], u.definedProperties = /* @__PURE__ */ new Set(), n.parentData = u.data, n.dataNames = [...u.dataNames, S];
    }
  }
  He.extendSubschemaData = r;
  function l(n, { jtdDiscriminator: u, jtdMetadata: o, compositeRule: c, createErrors: d, allErrors: s }) {
    c !== void 0 && (n.compositeRule = c), d !== void 0 && (n.createErrors = d), s !== void 0 && (n.allErrors = s), n.jtdDiscriminator = u, n.jtdMetadata = o;
  }
  return He.extendSubschemaMode = l, He;
}
var Se = {}, Bn, xa;
function Pn() {
  return xa || (xa = 1, Bn = function e(t, a) {
    if (t === a) return !0;
    if (t && a && typeof t == "object" && typeof a == "object") {
      if (t.constructor !== a.constructor) return !1;
      var r, l, n;
      if (Array.isArray(t)) {
        if (r = t.length, r != a.length) return !1;
        for (l = r; l-- !== 0; )
          if (!e(t[l], a[l])) return !1;
        return !0;
      }
      if (t.constructor === RegExp) return t.source === a.source && t.flags === a.flags;
      if (t.valueOf !== Object.prototype.valueOf) return t.valueOf() === a.valueOf();
      if (t.toString !== Object.prototype.toString) return t.toString() === a.toString();
      if (n = Object.keys(t), r = n.length, r !== Object.keys(a).length) return !1;
      for (l = r; l-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(a, n[l])) return !1;
      for (l = r; l-- !== 0; ) {
        var u = n[l];
        if (!e(t[u], a[u])) return !1;
      }
      return !0;
    }
    return t !== t && a !== a;
  }), Bn;
}
var Jn = { exports: {} }, Qa;
function ul() {
  if (Qa) return Jn.exports;
  Qa = 1;
  var e = Jn.exports = function(r, l, n) {
    typeof l == "function" && (n = l, l = {}), n = l.cb || n;
    var u = typeof n == "function" ? n : n.pre || function() {
    }, o = n.post || function() {
    };
    t(l, u, o, r, "", r);
  };
  e.keywords = {
    additionalItems: !0,
    items: !0,
    contains: !0,
    additionalProperties: !0,
    propertyNames: !0,
    not: !0,
    if: !0,
    then: !0,
    else: !0
  }, e.arrayKeywords = {
    items: !0,
    allOf: !0,
    anyOf: !0,
    oneOf: !0
  }, e.propsKeywords = {
    $defs: !0,
    definitions: !0,
    properties: !0,
    patternProperties: !0,
    dependencies: !0
  }, e.skipKeywords = {
    default: !0,
    enum: !0,
    const: !0,
    required: !0,
    maximum: !0,
    minimum: !0,
    exclusiveMaximum: !0,
    exclusiveMinimum: !0,
    multipleOf: !0,
    maxLength: !0,
    minLength: !0,
    pattern: !0,
    format: !0,
    maxItems: !0,
    minItems: !0,
    uniqueItems: !0,
    maxProperties: !0,
    minProperties: !0
  };
  function t(r, l, n, u, o, c, d, s, _, $) {
    if (u && typeof u == "object" && !Array.isArray(u)) {
      l(u, o, c, d, s, _, $);
      for (var v in u) {
        var S = u[v];
        if (Array.isArray(S)) {
          if (v in e.arrayKeywords)
            for (var E = 0; E < S.length; E++)
              t(r, l, n, S[E], o + "/" + v + "/" + E, c, o, v, u, E);
        } else if (v in e.propsKeywords) {
          if (S && typeof S == "object")
            for (var h in S)
              t(r, l, n, S[h], o + "/" + v + "/" + a(h), c, o, v, u, h);
        } else (v in e.keywords || r.allKeys && !(v in e.skipKeywords)) && t(r, l, n, S, o + "/" + v, c, o, v, u);
      }
      n(u, o, c, d, s, _, $);
    }
  }
  function a(r) {
    return r.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  return Jn.exports;
}
var Za;
function Rn() {
  if (Za) return Se;
  Za = 1, Object.defineProperty(Se, "__esModule", { value: !0 }), Se.getSchemaRefs = Se.resolveUrl = Se.normalizeId = Se._getFullPath = Se.getFullPath = Se.inlineRef = void 0;
  const e = oe(), t = Pn(), a = ul(), r = /* @__PURE__ */ new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function l(E, h = !0) {
    return typeof E == "boolean" ? !0 : h === !0 ? !u(E) : h ? o(E) <= h : !1;
  }
  Se.inlineRef = l;
  const n = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function u(E) {
    for (const h in E) {
      if (n.has(h))
        return !0;
      const y = E[h];
      if (Array.isArray(y) && y.some(u) || typeof y == "object" && u(y))
        return !0;
    }
    return !1;
  }
  function o(E) {
    let h = 0;
    for (const y in E) {
      if (y === "$ref")
        return 1 / 0;
      if (h++, !r.has(y) && (typeof E[y] == "object" && (0, e.eachItem)(E[y], (i) => h += o(i)), h === 1 / 0))
        return 1 / 0;
    }
    return h;
  }
  function c(E, h = "", y) {
    y !== !1 && (h = _(h));
    const i = E.parse(h);
    return d(E, i);
  }
  Se.getFullPath = c;
  function d(E, h) {
    return E.serialize(h).split("#")[0] + "#";
  }
  Se._getFullPath = d;
  const s = /#\/?$/;
  function _(E) {
    return E ? E.replace(s, "") : "";
  }
  Se.normalizeId = _;
  function $(E, h, y) {
    return y = _(y), E.resolve(h, y);
  }
  Se.resolveUrl = $;
  const v = /^[a-z_][-a-z0-9._]*$/i;
  function S(E, h) {
    if (typeof E == "boolean")
      return {};
    const { schemaId: y, uriResolver: i } = this.opts, p = _(E[y] || h), w = { "": p }, m = c(i, p, !1), g = {}, P = /* @__PURE__ */ new Set();
    return a(E, { allKeys: !0 }, (M, F, W, B) => {
      if (B === void 0)
        return;
      const V = m + F;
      let z = w[B];
      typeof M[y] == "string" && (z = Y.call(this, M[y])), J.call(this, M.$anchor), J.call(this, M.$dynamicAnchor), w[F] = z;
      function Y(D) {
        const U = this.opts.uriResolver.resolve;
        if (D = _(z ? U(z, D) : D), P.has(D))
          throw A(D);
        P.add(D);
        let j = this.refs[D];
        return typeof j == "string" && (j = this.refs[j]), typeof j == "object" ? I(M, j.schema, D) : D !== _(V) && (D[0] === "#" ? (I(M, g[D], D), g[D] = M) : this.refs[D] = V), D;
      }
      function J(D) {
        if (typeof D == "string") {
          if (!v.test(D))
            throw new Error(`invalid anchor "${D}"`);
          Y.call(this, `#${D}`);
        }
      }
    }), g;
    function I(M, F, W) {
      if (F !== void 0 && !t(M, F))
        throw A(W);
    }
    function A(M) {
      return new Error(`reference "${M}" resolves to more than one schema`);
    }
  }
  return Se.getSchemaRefs = S, Se;
}
var eo;
function Nn() {
  if (eo) return Ke;
  eo = 1, Object.defineProperty(Ke, "__esModule", { value: !0 }), Ke.getData = Ke.KeywordCxt = Ke.validateFunctionCode = void 0;
  const e = al(), t = _n(), a = lu(), r = _n(), l = ol(), n = il(), u = cl(), o = ne(), c = Ze(), d = Rn(), s = oe(), _ = bn();
  function $(N) {
    if (m(N) && (P(N), w(N))) {
      h(N);
      return;
    }
    v(N, () => (0, e.topBoolOrEmptySchema)(N));
  }
  Ke.validateFunctionCode = $;
  function v({ gen: N, validateName: T, schema: q, schemaEnv: L, opts: H }, X) {
    H.code.es5 ? N.func(T, (0, o._)`${c.default.data}, ${c.default.valCxt}`, L.$async, () => {
      N.code((0, o._)`"use strict"; ${i(q, H)}`), E(N, H), N.code(X);
    }) : N.func(T, (0, o._)`${c.default.data}, ${S(H)}`, L.$async, () => N.code(i(q, H)).code(X));
  }
  function S(N) {
    return (0, o._)`{${c.default.instancePath}="", ${c.default.parentData}, ${c.default.parentDataProperty}, ${c.default.rootData}=${c.default.data}${N.dynamicRef ? (0, o._)`, ${c.default.dynamicAnchors}={}` : o.nil}}={}`;
  }
  function E(N, T) {
    N.if(c.default.valCxt, () => {
      N.var(c.default.instancePath, (0, o._)`${c.default.valCxt}.${c.default.instancePath}`), N.var(c.default.parentData, (0, o._)`${c.default.valCxt}.${c.default.parentData}`), N.var(c.default.parentDataProperty, (0, o._)`${c.default.valCxt}.${c.default.parentDataProperty}`), N.var(c.default.rootData, (0, o._)`${c.default.valCxt}.${c.default.rootData}`), T.dynamicRef && N.var(c.default.dynamicAnchors, (0, o._)`${c.default.valCxt}.${c.default.dynamicAnchors}`);
    }, () => {
      N.var(c.default.instancePath, (0, o._)`""`), N.var(c.default.parentData, (0, o._)`undefined`), N.var(c.default.parentDataProperty, (0, o._)`undefined`), N.var(c.default.rootData, c.default.data), T.dynamicRef && N.var(c.default.dynamicAnchors, (0, o._)`{}`);
    });
  }
  function h(N) {
    const { schema: T, opts: q, gen: L } = N;
    v(N, () => {
      q.$comment && T.$comment && B(N), M(N), L.let(c.default.vErrors, null), L.let(c.default.errors, 0), q.unevaluated && y(N), I(N), V(N);
    });
  }
  function y(N) {
    const { gen: T, validateName: q } = N;
    N.evaluated = T.const("evaluated", (0, o._)`${q}.evaluated`), T.if((0, o._)`${N.evaluated}.dynamicProps`, () => T.assign((0, o._)`${N.evaluated}.props`, (0, o._)`undefined`)), T.if((0, o._)`${N.evaluated}.dynamicItems`, () => T.assign((0, o._)`${N.evaluated}.items`, (0, o._)`undefined`));
  }
  function i(N, T) {
    const q = typeof N == "object" && N[T.schemaId];
    return q && (T.code.source || T.code.process) ? (0, o._)`/*# sourceURL=${q} */` : o.nil;
  }
  function p(N, T) {
    if (m(N) && (P(N), w(N))) {
      g(N, T);
      return;
    }
    (0, e.boolOrEmptySchema)(N, T);
  }
  function w({ schema: N, self: T }) {
    if (typeof N == "boolean")
      return !N;
    for (const q in N)
      if (T.RULES.all[q])
        return !0;
    return !1;
  }
  function m(N) {
    return typeof N.schema != "boolean";
  }
  function g(N, T) {
    const { schema: q, gen: L, opts: H } = N;
    H.$comment && q.$comment && B(N), F(N), W(N);
    const X = L.const("_errs", c.default.errors);
    I(N, X), L.var(T, (0, o._)`${X} === ${c.default.errors}`);
  }
  function P(N) {
    (0, s.checkUnknownRules)(N), A(N);
  }
  function I(N, T) {
    if (N.opts.jtd)
      return Y(N, [], !1, T);
    const q = (0, t.getSchemaTypes)(N.schema), L = (0, t.coerceAndCheckDataType)(N, q);
    Y(N, q, !L, T);
  }
  function A(N) {
    const { schema: T, errSchemaPath: q, opts: L, self: H } = N;
    T.$ref && L.ignoreKeywordsWithRef && (0, s.schemaHasRulesButRef)(T, H.RULES) && H.logger.warn(`$ref: keywords ignored in schema at path "${q}"`);
  }
  function M(N) {
    const { schema: T, opts: q } = N;
    T.default !== void 0 && q.useDefaults && q.strictSchema && (0, s.checkStrictMode)(N, "default is ignored in the schema root");
  }
  function F(N) {
    const T = N.schema[N.opts.schemaId];
    T && (N.baseId = (0, d.resolveUrl)(N.opts.uriResolver, N.baseId, T));
  }
  function W(N) {
    if (N.schema.$async && !N.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function B({ gen: N, schemaEnv: T, schema: q, errSchemaPath: L, opts: H }) {
    const X = q.$comment;
    if (H.$comment === !0)
      N.code((0, o._)`${c.default.self}.logger.log(${X})`);
    else if (typeof H.$comment == "function") {
      const se = (0, o.str)`${L}/$comment`, ge = N.scopeValue("root", { ref: T.root });
      N.code((0, o._)`${c.default.self}.opts.$comment(${X}, ${se}, ${ge}.schema)`);
    }
  }
  function V(N) {
    const { gen: T, schemaEnv: q, validateName: L, ValidationError: H, opts: X } = N;
    q.$async ? T.if((0, o._)`${c.default.errors} === 0`, () => T.return(c.default.data), () => T.throw((0, o._)`new ${H}(${c.default.vErrors})`)) : (T.assign((0, o._)`${L}.errors`, c.default.vErrors), X.unevaluated && z(N), T.return((0, o._)`${c.default.errors} === 0`));
  }
  function z({ gen: N, evaluated: T, props: q, items: L }) {
    q instanceof o.Name && N.assign((0, o._)`${T}.props`, q), L instanceof o.Name && N.assign((0, o._)`${T}.items`, L);
  }
  function Y(N, T, q, L) {
    const { gen: H, schema: X, data: se, allErrors: ge, opts: ue, self: le } = N, { RULES: ae } = le;
    if (X.$ref && (ue.ignoreKeywordsWithRef || !(0, s.schemaHasRulesButRef)(X, ae))) {
      H.block(() => K(N, "$ref", ae.all.$ref.definition));
      return;
    }
    ue.jtd || D(N, T), H.block(() => {
      for (const me of ae.rules)
        Ie(me);
      Ie(ae.post);
    });
    function Ie(me) {
      (0, a.shouldUseGroup)(X, me) && (me.type ? (H.if((0, r.checkDataType)(me.type, se, ue.strictNumbers)), J(N, me), T.length === 1 && T[0] === me.type && q && (H.else(), (0, r.reportTypeError)(N)), H.endIf()) : J(N, me), ge || H.if((0, o._)`${c.default.errors} === ${L || 0}`));
    }
  }
  function J(N, T) {
    const { gen: q, schema: L, opts: { useDefaults: H } } = N;
    H && (0, l.assignDefaults)(N, T.type), q.block(() => {
      for (const X of T.rules)
        (0, a.shouldUseRule)(L, X) && K(N, X.keyword, X.definition, T.type);
    });
  }
  function D(N, T) {
    N.schemaEnv.meta || !N.opts.strictTypes || (U(N, T), N.opts.allowUnionTypes || j(N, T), R(N, N.dataTypes));
  }
  function U(N, T) {
    if (T.length) {
      if (!N.dataTypes.length) {
        N.dataTypes = T;
        return;
      }
      T.forEach((q) => {
        O(N.dataTypes, q) || b(N, `type "${q}" not allowed by context "${N.dataTypes.join(",")}"`);
      }), f(N, T);
    }
  }
  function j(N, T) {
    T.length > 1 && !(T.length === 2 && T.includes("null")) && b(N, "use allowUnionTypes to allow union type keyword");
  }
  function R(N, T) {
    const q = N.self.RULES.all;
    for (const L in q) {
      const H = q[L];
      if (typeof H == "object" && (0, a.shouldUseRule)(N.schema, H)) {
        const { type: X } = H.definition;
        X.length && !X.some((se) => k(T, se)) && b(N, `missing type "${X.join(",")}" for keyword "${L}"`);
      }
    }
  }
  function k(N, T) {
    return N.includes(T) || T === "number" && N.includes("integer");
  }
  function O(N, T) {
    return N.includes(T) || T === "integer" && N.includes("number");
  }
  function f(N, T) {
    const q = [];
    for (const L of N.dataTypes)
      O(T, L) ? q.push(L) : T.includes("integer") && L === "number" && q.push("integer");
    N.dataTypes = q;
  }
  function b(N, T) {
    const q = N.schemaEnv.baseId + N.errSchemaPath;
    T += ` at "${q}" (strictTypes)`, (0, s.checkStrictMode)(N, T, N.opts.strictTypes);
  }
  class C {
    constructor(T, q, L) {
      if ((0, n.validateKeywordUsage)(T, q, L), this.gen = T.gen, this.allErrors = T.allErrors, this.keyword = L, this.data = T.data, this.schema = T.schema[L], this.$data = q.$data && T.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, s.schemaRefOrVal)(T, this.schema, L, this.$data), this.schemaType = q.schemaType, this.parentSchema = T.schema, this.params = {}, this.it = T, this.def = q, this.$data)
        this.schemaCode = T.gen.const("vSchema", x(this.$data, T));
      else if (this.schemaCode = this.schemaValue, !(0, n.validSchemaType)(this.schema, q.schemaType, q.allowUndefined))
        throw new Error(`${L} value must be ${JSON.stringify(q.schemaType)}`);
      ("code" in q ? q.trackErrors : q.errors !== !1) && (this.errsCount = T.gen.const("_errs", c.default.errors));
    }
    result(T, q, L) {
      this.failResult((0, o.not)(T), q, L);
    }
    failResult(T, q, L) {
      this.gen.if(T), L ? L() : this.error(), q ? (this.gen.else(), q(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(T, q) {
      this.failResult((0, o.not)(T), void 0, q);
    }
    fail(T) {
      if (T === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(T), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(T) {
      if (!this.$data)
        return this.fail(T);
      const { schemaCode: q } = this;
      this.fail((0, o._)`${q} !== undefined && (${(0, o.or)(this.invalid$data(), T)})`);
    }
    error(T, q, L) {
      if (q) {
        this.setParams(q), this._error(T, L), this.setParams({});
        return;
      }
      this._error(T, L);
    }
    _error(T, q) {
      (T ? _.reportExtraError : _.reportError)(this, this.def.error, q);
    }
    $dataError() {
      (0, _.reportError)(this, this.def.$dataError || _.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, _.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(T) {
      this.allErrors || this.gen.if(T);
    }
    setParams(T, q) {
      q ? Object.assign(this.params, T) : this.params = T;
    }
    block$data(T, q, L = o.nil) {
      this.gen.block(() => {
        this.check$data(T, L), q();
      });
    }
    check$data(T = o.nil, q = o.nil) {
      if (!this.$data)
        return;
      const { gen: L, schemaCode: H, schemaType: X, def: se } = this;
      L.if((0, o.or)((0, o._)`${H} === undefined`, q)), T !== o.nil && L.assign(T, !0), (X.length || se.validateSchema) && (L.elseIf(this.invalid$data()), this.$dataError(), T !== o.nil && L.assign(T, !1)), L.else();
    }
    invalid$data() {
      const { gen: T, schemaCode: q, schemaType: L, def: H, it: X } = this;
      return (0, o.or)(se(), ge());
      function se() {
        if (L.length) {
          if (!(q instanceof o.Name))
            throw new Error("ajv implementation error");
          const ue = Array.isArray(L) ? L : [L];
          return (0, o._)`${(0, r.checkDataTypes)(ue, q, X.opts.strictNumbers, r.DataType.Wrong)}`;
        }
        return o.nil;
      }
      function ge() {
        if (H.validateSchema) {
          const ue = T.scopeValue("validate$data", { ref: H.validateSchema });
          return (0, o._)`!${ue}(${q})`;
        }
        return o.nil;
      }
    }
    subschema(T, q) {
      const L = (0, u.getSubschema)(this.it, T);
      (0, u.extendSubschemaData)(L, this.it, T), (0, u.extendSubschemaMode)(L, T);
      const H = { ...this.it, ...L, items: void 0, props: void 0 };
      return p(H, q), H;
    }
    mergeEvaluated(T, q) {
      const { it: L, gen: H } = this;
      L.opts.unevaluated && (L.props !== !0 && T.props !== void 0 && (L.props = s.mergeEvaluated.props(H, T.props, L.props, q)), L.items !== !0 && T.items !== void 0 && (L.items = s.mergeEvaluated.items(H, T.items, L.items, q)));
    }
    mergeValidEvaluated(T, q) {
      const { it: L, gen: H } = this;
      if (L.opts.unevaluated && (L.props !== !0 || L.items !== !0))
        return H.if(q, () => this.mergeEvaluated(T, o.Name)), !0;
    }
  }
  Ke.KeywordCxt = C;
  function K(N, T, q, L) {
    const H = new C(N, q, T);
    "code" in q ? q.code(H, L) : H.$data && q.validate ? (0, n.funcKeywordCode)(H, q) : "macro" in q ? (0, n.macroKeywordCode)(H, q) : (q.compile || q.validate) && (0, n.funcKeywordCode)(H, q);
  }
  const G = /^\/(?:[^~]|~0|~1)*$/, Q = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function x(N, { dataLevel: T, dataNames: q, dataPathArr: L }) {
    let H, X;
    if (N === "")
      return c.default.rootData;
    if (N[0] === "/") {
      if (!G.test(N))
        throw new Error(`Invalid JSON-pointer: ${N}`);
      H = N, X = c.default.rootData;
    } else {
      const le = Q.exec(N);
      if (!le)
        throw new Error(`Invalid JSON-pointer: ${N}`);
      const ae = +le[1];
      if (H = le[2], H === "#") {
        if (ae >= T)
          throw new Error(ue("property/index", ae));
        return L[T - ae];
      }
      if (ae > T)
        throw new Error(ue("data", ae));
      if (X = q[T - ae], !H)
        return X;
    }
    let se = X;
    const ge = H.split("/");
    for (const le of ge)
      le && (X = (0, o._)`${X}${(0, o.getProperty)((0, s.unescapeJsonPointer)(le))}`, se = (0, o._)`${se} && ${X}`);
    return se;
    function ue(le, ae) {
      return `Cannot access ${le} ${ae} levels up, current level is ${T}`;
    }
  }
  return Ke.getData = x, Ke;
}
var Bt = {}, to;
function sa() {
  if (to) return Bt;
  to = 1, Object.defineProperty(Bt, "__esModule", { value: !0 });
  class e extends Error {
    constructor(a) {
      super("validation failed"), this.errors = a, this.ajv = this.validation = !0;
    }
  }
  return Bt.default = e, Bt;
}
var Jt = {}, ro;
function On() {
  if (ro) return Jt;
  ro = 1, Object.defineProperty(Jt, "__esModule", { value: !0 });
  const e = Rn();
  class t extends Error {
    constructor(r, l, n, u) {
      super(u || `can't resolve reference ${n} from id ${l}`), this.missingRef = (0, e.resolveUrl)(r, l, n), this.missingSchema = (0, e.normalizeId)((0, e.getFullPath)(r, this.missingRef));
    }
  }
  return Jt.default = t, Jt;
}
var je = {}, no;
function aa() {
  if (no) return je;
  no = 1, Object.defineProperty(je, "__esModule", { value: !0 }), je.resolveSchema = je.getCompilingSchema = je.resolveRef = je.compileSchema = je.SchemaEnv = void 0;
  const e = ne(), t = sa(), a = Ze(), r = Rn(), l = oe(), n = Nn();
  class u {
    constructor(y) {
      var i;
      this.refs = {}, this.dynamicAnchors = {};
      let p;
      typeof y.schema == "object" && (p = y.schema), this.schema = y.schema, this.schemaId = y.schemaId, this.root = y.root || this, this.baseId = (i = y.baseId) !== null && i !== void 0 ? i : (0, r.normalizeId)(p == null ? void 0 : p[y.schemaId || "$id"]), this.schemaPath = y.schemaPath, this.localRefs = y.localRefs, this.meta = y.meta, this.$async = p == null ? void 0 : p.$async, this.refs = {};
    }
  }
  je.SchemaEnv = u;
  function o(h) {
    const y = s.call(this, h);
    if (y)
      return y;
    const i = (0, r.getFullPath)(this.opts.uriResolver, h.root.baseId), { es5: p, lines: w } = this.opts.code, { ownProperties: m } = this.opts, g = new e.CodeGen(this.scope, { es5: p, lines: w, ownProperties: m });
    let P;
    h.$async && (P = g.scopeValue("Error", {
      ref: t.default,
      code: (0, e._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const I = g.scopeName("validate");
    h.validateName = I;
    const A = {
      gen: g,
      allErrors: this.opts.allErrors,
      data: a.default.data,
      parentData: a.default.parentData,
      parentDataProperty: a.default.parentDataProperty,
      dataNames: [a.default.data],
      dataPathArr: [e.nil],
      // TODO can its length be used as dataLevel if nil is removed?
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: g.scopeValue("schema", this.opts.code.source === !0 ? { ref: h.schema, code: (0, e.stringify)(h.schema) } : { ref: h.schema }),
      validateName: I,
      ValidationError: P,
      schema: h.schema,
      schemaEnv: h,
      rootId: i,
      baseId: h.baseId || i,
      schemaPath: e.nil,
      errSchemaPath: h.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, e._)`""`,
      opts: this.opts,
      self: this
    };
    let M;
    try {
      this._compilations.add(h), (0, n.validateFunctionCode)(A), g.optimize(this.opts.code.optimize);
      const F = g.toString();
      M = `${g.scopeRefs(a.default.scope)}return ${F}`, this.opts.code.process && (M = this.opts.code.process(M, h));
      const B = new Function(`${a.default.self}`, `${a.default.scope}`, M)(this, this.scope.get());
      if (this.scope.value(I, { ref: B }), B.errors = null, B.schema = h.schema, B.schemaEnv = h, h.$async && (B.$async = !0), this.opts.code.source === !0 && (B.source = { validateName: I, validateCode: F, scopeValues: g._values }), this.opts.unevaluated) {
        const { props: V, items: z } = A;
        B.evaluated = {
          props: V instanceof e.Name ? void 0 : V,
          items: z instanceof e.Name ? void 0 : z,
          dynamicProps: V instanceof e.Name,
          dynamicItems: z instanceof e.Name
        }, B.source && (B.source.evaluated = (0, e.stringify)(B.evaluated));
      }
      return h.validate = B, h;
    } catch (F) {
      throw delete h.validate, delete h.validateName, M && this.logger.error("Error compiling schema, function code:", M), F;
    } finally {
      this._compilations.delete(h);
    }
  }
  je.compileSchema = o;
  function c(h, y, i) {
    var p;
    i = (0, r.resolveUrl)(this.opts.uriResolver, y, i);
    const w = h.refs[i];
    if (w)
      return w;
    let m = $.call(this, h, i);
    if (m === void 0) {
      const g = (p = h.localRefs) === null || p === void 0 ? void 0 : p[i], { schemaId: P } = this.opts;
      g && (m = new u({ schema: g, schemaId: P, root: h, baseId: y }));
    }
    if (m !== void 0)
      return h.refs[i] = d.call(this, m);
  }
  je.resolveRef = c;
  function d(h) {
    return (0, r.inlineRef)(h.schema, this.opts.inlineRefs) ? h.schema : h.validate ? h : o.call(this, h);
  }
  function s(h) {
    for (const y of this._compilations)
      if (_(y, h))
        return y;
  }
  je.getCompilingSchema = s;
  function _(h, y) {
    return h.schema === y.schema && h.root === y.root && h.baseId === y.baseId;
  }
  function $(h, y) {
    let i;
    for (; typeof (i = this.refs[y]) == "string"; )
      y = i;
    return i || this.schemas[y] || v.call(this, h, y);
  }
  function v(h, y) {
    const i = this.opts.uriResolver.parse(y), p = (0, r._getFullPath)(this.opts.uriResolver, i);
    let w = (0, r.getFullPath)(this.opts.uriResolver, h.baseId, void 0);
    if (Object.keys(h.schema).length > 0 && p === w)
      return E.call(this, i, h);
    const m = (0, r.normalizeId)(p), g = this.refs[m] || this.schemas[m];
    if (typeof g == "string") {
      const P = v.call(this, h, g);
      return typeof (P == null ? void 0 : P.schema) != "object" ? void 0 : E.call(this, i, P);
    }
    if (typeof (g == null ? void 0 : g.schema) == "object") {
      if (g.validate || o.call(this, g), m === (0, r.normalizeId)(y)) {
        const { schema: P } = g, { schemaId: I } = this.opts, A = P[I];
        return A && (w = (0, r.resolveUrl)(this.opts.uriResolver, w, A)), new u({ schema: P, schemaId: I, root: h, baseId: w });
      }
      return E.call(this, i, g);
    }
  }
  je.resolveSchema = v;
  const S = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function E(h, { baseId: y, schema: i, root: p }) {
    var w;
    if (((w = h.fragment) === null || w === void 0 ? void 0 : w[0]) !== "/")
      return;
    for (const P of h.fragment.slice(1).split("/")) {
      if (typeof i == "boolean")
        return;
      const I = i[(0, l.unescapeFragment)(P)];
      if (I === void 0)
        return;
      i = I;
      const A = typeof i == "object" && i[this.opts.schemaId];
      !S.has(P) && A && (y = (0, r.resolveUrl)(this.opts.uriResolver, y, A));
    }
    let m;
    if (typeof i != "boolean" && i.$ref && !(0, l.schemaHasRulesButRef)(i, this.RULES)) {
      const P = (0, r.resolveUrl)(this.opts.uriResolver, y, i.$ref);
      m = v.call(this, p, P);
    }
    const { schemaId: g } = this.opts;
    if (m = m || new u({ schema: i, schemaId: g, root: p, baseId: y }), m.schema !== m.root.schema)
      return m;
  }
  return je;
}
const ll = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", dl = "Meta-schema for $data reference (JSON AnySchema extension proposal)", fl = "object", hl = ["$data"], pl = { $data: { type: "string", anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }] } }, ml = !1, yl = {
  $id: ll,
  description: dl,
  type: fl,
  required: hl,
  properties: pl,
  additionalProperties: ml
};
var Xt = {}, Et = { exports: {} }, Xn, so;
function du() {
  if (so) return Xn;
  so = 1;
  const e = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu), t = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  function a($) {
    let v = "", S = 0, E = 0;
    for (E = 0; E < $.length; E++)
      if (S = $[E].charCodeAt(0), S !== 48) {
        if (!(S >= 48 && S <= 57 || S >= 65 && S <= 70 || S >= 97 && S <= 102))
          return "";
        v += $[E];
        break;
      }
    for (E += 1; E < $.length; E++) {
      if (S = $[E].charCodeAt(0), !(S >= 48 && S <= 57 || S >= 65 && S <= 70 || S >= 97 && S <= 102))
        return "";
      v += $[E];
    }
    return v;
  }
  const r = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  function l($) {
    return $.length = 0, !0;
  }
  function n($, v, S) {
    if ($.length) {
      const E = a($);
      if (E !== "")
        v.push(E);
      else
        return S.error = !0, !1;
      $.length = 0;
    }
    return !0;
  }
  function u($) {
    let v = 0;
    const S = { error: !1, address: "", zone: "" }, E = [], h = [];
    let y = !1, i = !1, p = n;
    for (let w = 0; w < $.length; w++) {
      const m = $[w];
      if (!(m === "[" || m === "]"))
        if (m === ":") {
          if (y === !0 && (i = !0), !p(h, E, S))
            break;
          if (++v > 7) {
            S.error = !0;
            break;
          }
          w > 0 && $[w - 1] === ":" && (y = !0), E.push(":");
          continue;
        } else if (m === "%") {
          if (!p(h, E, S))
            break;
          p = l;
        } else {
          h.push(m);
          continue;
        }
    }
    return h.length && (p === l ? S.zone = h.join("") : i ? E.push(h.join("")) : E.push(a(h))), S.address = E.join(""), S;
  }
  function o($) {
    if (c($, ":") < 2)
      return { host: $, isIPV6: !1 };
    const v = u($);
    if (v.error)
      return { host: $, isIPV6: !1 };
    {
      let S = v.address, E = v.address;
      return v.zone && (S += "%" + v.zone, E += "%25" + v.zone), { host: S, isIPV6: !0, escapedHost: E };
    }
  }
  function c($, v) {
    let S = 0;
    for (let E = 0; E < $.length; E++)
      $[E] === v && S++;
    return S;
  }
  function d($) {
    let v = $;
    const S = [];
    let E = -1, h = 0;
    for (; h = v.length; ) {
      if (h === 1) {
        if (v === ".")
          break;
        if (v === "/") {
          S.push("/");
          break;
        } else {
          S.push(v);
          break;
        }
      } else if (h === 2) {
        if (v[0] === ".") {
          if (v[1] === ".")
            break;
          if (v[1] === "/") {
            v = v.slice(2);
            continue;
          }
        } else if (v[0] === "/" && (v[1] === "." || v[1] === "/")) {
          S.push("/");
          break;
        }
      } else if (h === 3 && v === "/..") {
        S.length !== 0 && S.pop(), S.push("/");
        break;
      }
      if (v[0] === ".") {
        if (v[1] === ".") {
          if (v[2] === "/") {
            v = v.slice(3);
            continue;
          }
        } else if (v[1] === "/") {
          v = v.slice(2);
          continue;
        }
      } else if (v[0] === "/" && v[1] === ".") {
        if (v[2] === "/") {
          v = v.slice(2);
          continue;
        } else if (v[2] === "." && v[3] === "/") {
          v = v.slice(3), S.length !== 0 && S.pop();
          continue;
        }
      }
      if ((E = v.indexOf("/", 1)) === -1) {
        S.push(v);
        break;
      } else
        S.push(v.slice(0, E)), v = v.slice(E);
    }
    return S.join("");
  }
  function s($, v) {
    const S = v !== !0 ? escape : unescape;
    return $.scheme !== void 0 && ($.scheme = S($.scheme)), $.userinfo !== void 0 && ($.userinfo = S($.userinfo)), $.host !== void 0 && ($.host = S($.host)), $.path !== void 0 && ($.path = S($.path)), $.query !== void 0 && ($.query = S($.query)), $.fragment !== void 0 && ($.fragment = S($.fragment)), $;
  }
  function _($) {
    const v = [];
    if ($.userinfo !== void 0 && (v.push($.userinfo), v.push("@")), $.host !== void 0) {
      let S = unescape($.host);
      if (!t(S)) {
        const E = o(S);
        E.isIPV6 === !0 ? S = `[${E.escapedHost}]` : S = $.host;
      }
      v.push(S);
    }
    return (typeof $.port == "number" || typeof $.port == "string") && (v.push(":"), v.push(String($.port))), v.length ? v.join("") : void 0;
  }
  return Xn = {
    nonSimpleDomain: r,
    recomposeAuthority: _,
    normalizeComponentEncoding: s,
    removeDotSegments: d,
    isIPv4: t,
    isUUID: e,
    normalizeIPv6: o,
    stringArrayToHexStripped: a
  }, Xn;
}
var Yn, ao;
function gl() {
  if (ao) return Yn;
  ao = 1;
  const { isUUID: e } = du(), t = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu, a = (
    /** @type {const} */
    [
      "http",
      "https",
      "ws",
      "wss",
      "urn",
      "urn:uuid"
    ]
  );
  function r(m) {
    return a.indexOf(
      /** @type {*} */
      m
    ) !== -1;
  }
  function l(m) {
    return m.secure === !0 ? !0 : m.secure === !1 ? !1 : m.scheme ? m.scheme.length === 3 && (m.scheme[0] === "w" || m.scheme[0] === "W") && (m.scheme[1] === "s" || m.scheme[1] === "S") && (m.scheme[2] === "s" || m.scheme[2] === "S") : !1;
  }
  function n(m) {
    return m.host || (m.error = m.error || "HTTP URIs must have a host."), m;
  }
  function u(m) {
    const g = String(m.scheme).toLowerCase() === "https";
    return (m.port === (g ? 443 : 80) || m.port === "") && (m.port = void 0), m.path || (m.path = "/"), m;
  }
  function o(m) {
    return m.secure = l(m), m.resourceName = (m.path || "/") + (m.query ? "?" + m.query : ""), m.path = void 0, m.query = void 0, m;
  }
  function c(m) {
    if ((m.port === (l(m) ? 443 : 80) || m.port === "") && (m.port = void 0), typeof m.secure == "boolean" && (m.scheme = m.secure ? "wss" : "ws", m.secure = void 0), m.resourceName) {
      const [g, P] = m.resourceName.split("?");
      m.path = g && g !== "/" ? g : void 0, m.query = P, m.resourceName = void 0;
    }
    return m.fragment = void 0, m;
  }
  function d(m, g) {
    if (!m.path)
      return m.error = "URN can not be parsed", m;
    const P = m.path.match(t);
    if (P) {
      const I = g.scheme || m.scheme || "urn";
      m.nid = P[1].toLowerCase(), m.nss = P[2];
      const A = `${I}:${g.nid || m.nid}`, M = w(A);
      m.path = void 0, M && (m = M.parse(m, g));
    } else
      m.error = m.error || "URN can not be parsed.";
    return m;
  }
  function s(m, g) {
    if (m.nid === void 0)
      throw new Error("URN without nid cannot be serialized");
    const P = g.scheme || m.scheme || "urn", I = m.nid.toLowerCase(), A = `${P}:${g.nid || I}`, M = w(A);
    M && (m = M.serialize(m, g));
    const F = m, W = m.nss;
    return F.path = `${I || g.nid}:${W}`, g.skipEscape = !0, F;
  }
  function _(m, g) {
    const P = m;
    return P.uuid = P.nss, P.nss = void 0, !g.tolerant && (!P.uuid || !e(P.uuid)) && (P.error = P.error || "UUID is not valid."), P;
  }
  function $(m) {
    const g = m;
    return g.nss = (m.uuid || "").toLowerCase(), g;
  }
  const v = (
    /** @type {SchemeHandler} */
    {
      scheme: "http",
      domainHost: !0,
      parse: n,
      serialize: u
    }
  ), S = (
    /** @type {SchemeHandler} */
    {
      scheme: "https",
      domainHost: v.domainHost,
      parse: n,
      serialize: u
    }
  ), E = (
    /** @type {SchemeHandler} */
    {
      scheme: "ws",
      domainHost: !0,
      parse: o,
      serialize: c
    }
  ), h = (
    /** @type {SchemeHandler} */
    {
      scheme: "wss",
      domainHost: E.domainHost,
      parse: E.parse,
      serialize: E.serialize
    }
  ), p = (
    /** @type {Record<SchemeName, SchemeHandler>} */
    {
      http: v,
      https: S,
      ws: E,
      wss: h,
      urn: (
        /** @type {SchemeHandler} */
        {
          scheme: "urn",
          parse: d,
          serialize: s,
          skipNormalize: !0
        }
      ),
      "urn:uuid": (
        /** @type {SchemeHandler} */
        {
          scheme: "urn:uuid",
          parse: _,
          serialize: $,
          skipNormalize: !0
        }
      )
    }
  );
  Object.setPrototypeOf(p, null);
  function w(m) {
    return m && (p[
      /** @type {SchemeName} */
      m
    ] || p[
      /** @type {SchemeName} */
      m.toLowerCase()
    ]) || void 0;
  }
  return Yn = {
    wsIsSecure: l,
    SCHEMES: p,
    isValidSchemeName: r,
    getSchemeHandler: w
  }, Yn;
}
var oo;
function fu() {
  if (oo) return Et.exports;
  oo = 1;
  const { normalizeIPv6: e, removeDotSegments: t, recomposeAuthority: a, normalizeComponentEncoding: r, isIPv4: l, nonSimpleDomain: n } = du(), { SCHEMES: u, getSchemeHandler: o } = gl();
  function c(h, y) {
    return typeof h == "string" ? h = /** @type {T} */
    $(S(h, y), y) : typeof h == "object" && (h = /** @type {T} */
    S($(h, y), y)), h;
  }
  function d(h, y, i) {
    const p = i ? Object.assign({ scheme: "null" }, i) : { scheme: "null" }, w = s(S(h, p), S(y, p), p, !0);
    return p.skipEscape = !0, $(w, p);
  }
  function s(h, y, i, p) {
    const w = {};
    return p || (h = S($(h, i), i), y = S($(y, i), i)), i = i || {}, !i.tolerant && y.scheme ? (w.scheme = y.scheme, w.userinfo = y.userinfo, w.host = y.host, w.port = y.port, w.path = t(y.path || ""), w.query = y.query) : (y.userinfo !== void 0 || y.host !== void 0 || y.port !== void 0 ? (w.userinfo = y.userinfo, w.host = y.host, w.port = y.port, w.path = t(y.path || ""), w.query = y.query) : (y.path ? (y.path[0] === "/" ? w.path = t(y.path) : ((h.userinfo !== void 0 || h.host !== void 0 || h.port !== void 0) && !h.path ? w.path = "/" + y.path : h.path ? w.path = h.path.slice(0, h.path.lastIndexOf("/") + 1) + y.path : w.path = y.path, w.path = t(w.path)), w.query = y.query) : (w.path = h.path, y.query !== void 0 ? w.query = y.query : w.query = h.query), w.userinfo = h.userinfo, w.host = h.host, w.port = h.port), w.scheme = h.scheme), w.fragment = y.fragment, w;
  }
  function _(h, y, i) {
    return typeof h == "string" ? (h = unescape(h), h = $(r(S(h, i), !0), { ...i, skipEscape: !0 })) : typeof h == "object" && (h = $(r(h, !0), { ...i, skipEscape: !0 })), typeof y == "string" ? (y = unescape(y), y = $(r(S(y, i), !0), { ...i, skipEscape: !0 })) : typeof y == "object" && (y = $(r(y, !0), { ...i, skipEscape: !0 })), h.toLowerCase() === y.toLowerCase();
  }
  function $(h, y) {
    const i = {
      host: h.host,
      scheme: h.scheme,
      userinfo: h.userinfo,
      port: h.port,
      path: h.path,
      query: h.query,
      nid: h.nid,
      nss: h.nss,
      uuid: h.uuid,
      fragment: h.fragment,
      reference: h.reference,
      resourceName: h.resourceName,
      secure: h.secure,
      error: ""
    }, p = Object.assign({}, y), w = [], m = o(p.scheme || i.scheme);
    m && m.serialize && m.serialize(i, p), i.path !== void 0 && (p.skipEscape ? i.path = unescape(i.path) : (i.path = escape(i.path), i.scheme !== void 0 && (i.path = i.path.split("%3A").join(":")))), p.reference !== "suffix" && i.scheme && w.push(i.scheme, ":");
    const g = a(i);
    if (g !== void 0 && (p.reference !== "suffix" && w.push("//"), w.push(g), i.path && i.path[0] !== "/" && w.push("/")), i.path !== void 0) {
      let P = i.path;
      !p.absolutePath && (!m || !m.absolutePath) && (P = t(P)), g === void 0 && P[0] === "/" && P[1] === "/" && (P = "/%2F" + P.slice(2)), w.push(P);
    }
    return i.query !== void 0 && w.push("?", i.query), i.fragment !== void 0 && w.push("#", i.fragment), w.join("");
  }
  const v = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function S(h, y) {
    const i = Object.assign({}, y), p = {
      scheme: void 0,
      userinfo: void 0,
      host: "",
      port: void 0,
      path: "",
      query: void 0,
      fragment: void 0
    };
    let w = !1;
    i.reference === "suffix" && (i.scheme ? h = i.scheme + ":" + h : h = "//" + h);
    const m = h.match(v);
    if (m) {
      if (p.scheme = m[1], p.userinfo = m[3], p.host = m[4], p.port = parseInt(m[5], 10), p.path = m[6] || "", p.query = m[7], p.fragment = m[8], isNaN(p.port) && (p.port = m[5]), p.host)
        if (l(p.host) === !1) {
          const I = e(p.host);
          p.host = I.host.toLowerCase(), w = I.isIPV6;
        } else
          w = !0;
      p.scheme === void 0 && p.userinfo === void 0 && p.host === void 0 && p.port === void 0 && p.query === void 0 && !p.path ? p.reference = "same-document" : p.scheme === void 0 ? p.reference = "relative" : p.fragment === void 0 ? p.reference = "absolute" : p.reference = "uri", i.reference && i.reference !== "suffix" && i.reference !== p.reference && (p.error = p.error || "URI is not a " + i.reference + " reference.");
      const g = o(i.scheme || p.scheme);
      if (!i.unicodeSupport && (!g || !g.unicodeSupport) && p.host && (i.domainHost || g && g.domainHost) && w === !1 && n(p.host))
        try {
          p.host = URL.domainToASCII(p.host.toLowerCase());
        } catch (P) {
          p.error = p.error || "Host's domain name can not be converted to ASCII: " + P;
        }
      (!g || g && !g.skipNormalize) && (h.indexOf("%") !== -1 && (p.scheme !== void 0 && (p.scheme = unescape(p.scheme)), p.host !== void 0 && (p.host = unescape(p.host))), p.path && (p.path = escape(unescape(p.path))), p.fragment && (p.fragment = encodeURI(decodeURIComponent(p.fragment)))), g && g.parse && g.parse(p, i);
    } else
      p.error = p.error || "URI can not be parsed.";
    return p;
  }
  const E = {
    SCHEMES: u,
    normalize: c,
    resolve: d,
    resolveComponent: s,
    equal: _,
    serialize: $,
    parse: S
  };
  return Et.exports = E, Et.exports.default = E, Et.exports.fastUri = E, Et.exports;
}
var io;
function vl() {
  if (io) return Xt;
  io = 1, Object.defineProperty(Xt, "__esModule", { value: !0 });
  const e = fu();
  return e.code = 'require("ajv/dist/runtime/uri").default', Xt.default = e, Xt;
}
var co;
function $l() {
  return co || (co = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
    var t = Nn();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return t.KeywordCxt;
    } });
    var a = ne();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return a._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return a.str;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return a.stringify;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return a.nil;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return a.Name;
    } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
      return a.CodeGen;
    } });
    const r = sa(), l = On(), n = uu(), u = aa(), o = ne(), c = Rn(), d = _n(), s = oe(), _ = yl, $ = vl(), v = (j, R) => new RegExp(j, R);
    v.code = "new RegExp";
    const S = ["removeAdditional", "useDefaults", "coerceTypes"], E = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]), h = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    }, y = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, i = 200;
    function p(j) {
      var R, k, O, f, b, C, K, G, Q, x, N, T, q, L, H, X, se, ge, ue, le, ae, Ie, me, rt, nt;
      const Ae = j.strict, st = (R = j.code) === null || R === void 0 ? void 0 : R.optimize, $t = st === !0 || st === void 0 ? 1 : st || 0, _t = (O = (k = j.code) === null || k === void 0 ? void 0 : k.regExp) !== null && O !== void 0 ? O : v, Ln = (f = j.uriResolver) !== null && f !== void 0 ? f : $.default;
      return {
        strictSchema: (C = (b = j.strictSchema) !== null && b !== void 0 ? b : Ae) !== null && C !== void 0 ? C : !0,
        strictNumbers: (G = (K = j.strictNumbers) !== null && K !== void 0 ? K : Ae) !== null && G !== void 0 ? G : !0,
        strictTypes: (x = (Q = j.strictTypes) !== null && Q !== void 0 ? Q : Ae) !== null && x !== void 0 ? x : "log",
        strictTuples: (T = (N = j.strictTuples) !== null && N !== void 0 ? N : Ae) !== null && T !== void 0 ? T : "log",
        strictRequired: (L = (q = j.strictRequired) !== null && q !== void 0 ? q : Ae) !== null && L !== void 0 ? L : !1,
        code: j.code ? { ...j.code, optimize: $t, regExp: _t } : { optimize: $t, regExp: _t },
        loopRequired: (H = j.loopRequired) !== null && H !== void 0 ? H : i,
        loopEnum: (X = j.loopEnum) !== null && X !== void 0 ? X : i,
        meta: (se = j.meta) !== null && se !== void 0 ? se : !0,
        messages: (ge = j.messages) !== null && ge !== void 0 ? ge : !0,
        inlineRefs: (ue = j.inlineRefs) !== null && ue !== void 0 ? ue : !0,
        schemaId: (le = j.schemaId) !== null && le !== void 0 ? le : "$id",
        addUsedSchema: (ae = j.addUsedSchema) !== null && ae !== void 0 ? ae : !0,
        validateSchema: (Ie = j.validateSchema) !== null && Ie !== void 0 ? Ie : !0,
        validateFormats: (me = j.validateFormats) !== null && me !== void 0 ? me : !0,
        unicodeRegExp: (rt = j.unicodeRegExp) !== null && rt !== void 0 ? rt : !0,
        int32range: (nt = j.int32range) !== null && nt !== void 0 ? nt : !0,
        uriResolver: Ln
      };
    }
    class w {
      constructor(R = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), R = this.opts = { ...R, ...p(R) };
        const { es5: k, lines: O } = this.opts.code;
        this.scope = new o.ValueScope({ scope: {}, prefixes: E, es5: k, lines: O }), this.logger = W(R.logger);
        const f = R.validateFormats;
        R.validateFormats = !1, this.RULES = (0, n.getRules)(), m.call(this, h, R, "NOT SUPPORTED"), m.call(this, y, R, "DEPRECATED", "warn"), this._metaOpts = M.call(this), R.formats && I.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), R.keywords && A.call(this, R.keywords), typeof R.meta == "object" && this.addMetaSchema(R.meta), P.call(this), R.validateFormats = f;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: R, meta: k, schemaId: O } = this.opts;
        let f = _;
        O === "id" && (f = { ..._ }, f.id = f.$id, delete f.$id), k && R && this.addMetaSchema(f, f[O], !1);
      }
      defaultMeta() {
        const { meta: R, schemaId: k } = this.opts;
        return this.opts.defaultMeta = typeof R == "object" ? R[k] || R : void 0;
      }
      validate(R, k) {
        let O;
        if (typeof R == "string") {
          if (O = this.getSchema(R), !O)
            throw new Error(`no schema with key or ref "${R}"`);
        } else
          O = this.compile(R);
        const f = O(k);
        return "$async" in O || (this.errors = O.errors), f;
      }
      compile(R, k) {
        const O = this._addSchema(R, k);
        return O.validate || this._compileSchemaEnv(O);
      }
      compileAsync(R, k) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: O } = this.opts;
        return f.call(this, R, k);
        async function f(x, N) {
          await b.call(this, x.$schema);
          const T = this._addSchema(x, N);
          return T.validate || C.call(this, T);
        }
        async function b(x) {
          x && !this.getSchema(x) && await f.call(this, { $ref: x }, !0);
        }
        async function C(x) {
          try {
            return this._compileSchemaEnv(x);
          } catch (N) {
            if (!(N instanceof l.default))
              throw N;
            return K.call(this, N), await G.call(this, N.missingSchema), C.call(this, x);
          }
        }
        function K({ missingSchema: x, missingRef: N }) {
          if (this.refs[x])
            throw new Error(`AnySchema ${x} is loaded but ${N} cannot be resolved`);
        }
        async function G(x) {
          const N = await Q.call(this, x);
          this.refs[x] || await b.call(this, N.$schema), this.refs[x] || this.addSchema(N, x, k);
        }
        async function Q(x) {
          const N = this._loading[x];
          if (N)
            return N;
          try {
            return await (this._loading[x] = O(x));
          } finally {
            delete this._loading[x];
          }
        }
      }
      // Adds schema to the instance
      addSchema(R, k, O, f = this.opts.validateSchema) {
        if (Array.isArray(R)) {
          for (const C of R)
            this.addSchema(C, void 0, O, f);
          return this;
        }
        let b;
        if (typeof R == "object") {
          const { schemaId: C } = this.opts;
          if (b = R[C], b !== void 0 && typeof b != "string")
            throw new Error(`schema ${C} must be string`);
        }
        return k = (0, c.normalizeId)(k || b), this._checkUnique(k), this.schemas[k] = this._addSchema(R, O, k, f, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(R, k, O = this.opts.validateSchema) {
        return this.addSchema(R, k, !0, O), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(R, k) {
        if (typeof R == "boolean")
          return !0;
        let O;
        if (O = R.$schema, O !== void 0 && typeof O != "string")
          throw new Error("$schema must be a string");
        if (O = O || this.opts.defaultMeta || this.defaultMeta(), !O)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const f = this.validate(O, R);
        if (!f && k) {
          const b = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(b);
          else
            throw new Error(b);
        }
        return f;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(R) {
        let k;
        for (; typeof (k = g.call(this, R)) == "string"; )
          R = k;
        if (k === void 0) {
          const { schemaId: O } = this.opts, f = new u.SchemaEnv({ schema: {}, schemaId: O });
          if (k = u.resolveSchema.call(this, f, R), !k)
            return;
          this.refs[R] = k;
        }
        return k.validate || this._compileSchemaEnv(k);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(R) {
        if (R instanceof RegExp)
          return this._removeAllSchemas(this.schemas, R), this._removeAllSchemas(this.refs, R), this;
        switch (typeof R) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            const k = g.call(this, R);
            return typeof k == "object" && this._cache.delete(k.schema), delete this.schemas[R], delete this.refs[R], this;
          }
          case "object": {
            const k = R;
            this._cache.delete(k);
            let O = R[this.opts.schemaId];
            return O && (O = (0, c.normalizeId)(O), delete this.schemas[O], delete this.refs[O]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(R) {
        for (const k of R)
          this.addKeyword(k);
        return this;
      }
      addKeyword(R, k) {
        let O;
        if (typeof R == "string")
          O = R, typeof k == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), k.keyword = O);
        else if (typeof R == "object" && k === void 0) {
          if (k = R, O = k.keyword, Array.isArray(O) && !O.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (V.call(this, O, k), !k)
          return (0, s.eachItem)(O, (b) => z.call(this, b)), this;
        J.call(this, k);
        const f = {
          ...k,
          type: (0, d.getJSONTypes)(k.type),
          schemaType: (0, d.getJSONTypes)(k.schemaType)
        };
        return (0, s.eachItem)(O, f.type.length === 0 ? (b) => z.call(this, b, f) : (b) => f.type.forEach((C) => z.call(this, b, f, C))), this;
      }
      getKeyword(R) {
        const k = this.RULES.all[R];
        return typeof k == "object" ? k.definition : !!k;
      }
      // Remove keyword
      removeKeyword(R) {
        const { RULES: k } = this;
        delete k.keywords[R], delete k.all[R];
        for (const O of k.rules) {
          const f = O.rules.findIndex((b) => b.keyword === R);
          f >= 0 && O.rules.splice(f, 1);
        }
        return this;
      }
      // Add format
      addFormat(R, k) {
        return typeof k == "string" && (k = new RegExp(k)), this.formats[R] = k, this;
      }
      errorsText(R = this.errors, { separator: k = ", ", dataVar: O = "data" } = {}) {
        return !R || R.length === 0 ? "No errors" : R.map((f) => `${O}${f.instancePath} ${f.message}`).reduce((f, b) => f + k + b);
      }
      $dataMetaSchema(R, k) {
        const O = this.RULES.all;
        R = JSON.parse(JSON.stringify(R));
        for (const f of k) {
          const b = f.split("/").slice(1);
          let C = R;
          for (const K of b)
            C = C[K];
          for (const K in O) {
            const G = O[K];
            if (typeof G != "object")
              continue;
            const { $data: Q } = G.definition, x = C[K];
            Q && x && (C[K] = U(x));
          }
        }
        return R;
      }
      _removeAllSchemas(R, k) {
        for (const O in R) {
          const f = R[O];
          (!k || k.test(O)) && (typeof f == "string" ? delete R[O] : f && !f.meta && (this._cache.delete(f.schema), delete R[O]));
        }
      }
      _addSchema(R, k, O, f = this.opts.validateSchema, b = this.opts.addUsedSchema) {
        let C;
        const { schemaId: K } = this.opts;
        if (typeof R == "object")
          C = R[K];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof R != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let G = this._cache.get(R);
        if (G !== void 0)
          return G;
        O = (0, c.normalizeId)(C || O);
        const Q = c.getSchemaRefs.call(this, R, O);
        return G = new u.SchemaEnv({ schema: R, schemaId: K, meta: k, baseId: O, localRefs: Q }), this._cache.set(G.schema, G), b && !O.startsWith("#") && (O && this._checkUnique(O), this.refs[O] = G), f && this.validateSchema(R, !0), G;
      }
      _checkUnique(R) {
        if (this.schemas[R] || this.refs[R])
          throw new Error(`schema with key or id "${R}" already exists`);
      }
      _compileSchemaEnv(R) {
        if (R.meta ? this._compileMetaSchema(R) : u.compileSchema.call(this, R), !R.validate)
          throw new Error("ajv implementation error");
        return R.validate;
      }
      _compileMetaSchema(R) {
        const k = this.opts;
        this.opts = this._metaOpts;
        try {
          u.compileSchema.call(this, R);
        } finally {
          this.opts = k;
        }
      }
    }
    w.ValidationError = r.default, w.MissingRefError = l.default, e.default = w;
    function m(j, R, k, O = "error") {
      for (const f in j) {
        const b = f;
        b in R && this.logger[O](`${k}: option ${f}. ${j[b]}`);
      }
    }
    function g(j) {
      return j = (0, c.normalizeId)(j), this.schemas[j] || this.refs[j];
    }
    function P() {
      const j = this.opts.schemas;
      if (j)
        if (Array.isArray(j))
          this.addSchema(j);
        else
          for (const R in j)
            this.addSchema(j[R], R);
    }
    function I() {
      for (const j in this.opts.formats) {
        const R = this.opts.formats[j];
        R && this.addFormat(j, R);
      }
    }
    function A(j) {
      if (Array.isArray(j)) {
        this.addVocabulary(j);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const R in j) {
        const k = j[R];
        k.keyword || (k.keyword = R), this.addKeyword(k);
      }
    }
    function M() {
      const j = { ...this.opts };
      for (const R of S)
        delete j[R];
      return j;
    }
    const F = { log() {
    }, warn() {
    }, error() {
    } };
    function W(j) {
      if (j === !1)
        return F;
      if (j === void 0)
        return console;
      if (j.log && j.warn && j.error)
        return j;
      throw new Error("logger must implement log, warn and error methods");
    }
    const B = /^[a-z_$][a-z0-9_$:-]*$/i;
    function V(j, R) {
      const { RULES: k } = this;
      if ((0, s.eachItem)(j, (O) => {
        if (k.keywords[O])
          throw new Error(`Keyword ${O} is already defined`);
        if (!B.test(O))
          throw new Error(`Keyword ${O} has invalid name`);
      }), !!R && R.$data && !("code" in R || "validate" in R))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function z(j, R, k) {
      var O;
      const f = R == null ? void 0 : R.post;
      if (k && f)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: b } = this;
      let C = f ? b.post : b.rules.find(({ type: G }) => G === k);
      if (C || (C = { type: k, rules: [] }, b.rules.push(C)), b.keywords[j] = !0, !R)
        return;
      const K = {
        keyword: j,
        definition: {
          ...R,
          type: (0, d.getJSONTypes)(R.type),
          schemaType: (0, d.getJSONTypes)(R.schemaType)
        }
      };
      R.before ? Y.call(this, C, K, R.before) : C.rules.push(K), b.all[j] = K, (O = R.implements) === null || O === void 0 || O.forEach((G) => this.addKeyword(G));
    }
    function Y(j, R, k) {
      const O = j.rules.findIndex((f) => f.keyword === k);
      O >= 0 ? j.rules.splice(O, 0, R) : (j.rules.push(R), this.logger.warn(`rule ${k} is not defined`));
    }
    function J(j) {
      let { metaSchema: R } = j;
      R !== void 0 && (j.$data && this.opts.$data && (R = U(R)), j.validateSchema = this.compile(R, !0));
    }
    const D = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function U(j) {
      return { anyOf: [j, D] };
    }
  })(zn)), zn;
}
var Yt = {}, xt = {}, Qt = {}, uo;
function _l() {
  if (uo) return Qt;
  uo = 1, Object.defineProperty(Qt, "__esModule", { value: !0 });
  const e = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  return Qt.default = e, Qt;
}
var Xe = {}, lo;
function wl() {
  if (lo) return Xe;
  lo = 1, Object.defineProperty(Xe, "__esModule", { value: !0 }), Xe.callRef = Xe.getValidate = void 0;
  const e = On(), t = Fe(), a = ne(), r = Ze(), l = aa(), n = oe(), u = {
    keyword: "$ref",
    schemaType: "string",
    code(d) {
      const { gen: s, schema: _, it: $ } = d, { baseId: v, schemaEnv: S, validateName: E, opts: h, self: y } = $, { root: i } = S;
      if ((_ === "#" || _ === "#/") && v === i.baseId)
        return w();
      const p = l.resolveRef.call(y, i, v, _);
      if (p === void 0)
        throw new e.default($.opts.uriResolver, v, _);
      if (p instanceof l.SchemaEnv)
        return m(p);
      return g(p);
      function w() {
        if (S === i)
          return c(d, E, S, S.$async);
        const P = s.scopeValue("root", { ref: i });
        return c(d, (0, a._)`${P}.validate`, i, i.$async);
      }
      function m(P) {
        const I = o(d, P);
        c(d, I, P, P.$async);
      }
      function g(P) {
        const I = s.scopeValue("schema", h.code.source === !0 ? { ref: P, code: (0, a.stringify)(P) } : { ref: P }), A = s.name("valid"), M = d.subschema({
          schema: P,
          dataTypes: [],
          schemaPath: a.nil,
          topSchemaRef: I,
          errSchemaPath: _
        }, A);
        d.mergeEvaluated(M), d.ok(A);
      }
    }
  };
  function o(d, s) {
    const { gen: _ } = d;
    return s.validate ? _.scopeValue("validate", { ref: s.validate }) : (0, a._)`${_.scopeValue("wrapper", { ref: s })}.validate`;
  }
  Xe.getValidate = o;
  function c(d, s, _, $) {
    const { gen: v, it: S } = d, { allErrors: E, schemaEnv: h, opts: y } = S, i = y.passContext ? r.default.this : a.nil;
    $ ? p() : w();
    function p() {
      if (!h.$async)
        throw new Error("async schema referenced by sync schema");
      const P = v.let("valid");
      v.try(() => {
        v.code((0, a._)`await ${(0, t.callValidateCode)(d, s, i)}`), g(s), E || v.assign(P, !0);
      }, (I) => {
        v.if((0, a._)`!(${I} instanceof ${S.ValidationError})`, () => v.throw(I)), m(I), E || v.assign(P, !1);
      }), d.ok(P);
    }
    function w() {
      d.result((0, t.callValidateCode)(d, s, i), () => g(s), () => m(s));
    }
    function m(P) {
      const I = (0, a._)`${P}.errors`;
      v.assign(r.default.vErrors, (0, a._)`${r.default.vErrors} === null ? ${I} : ${r.default.vErrors}.concat(${I})`), v.assign(r.default.errors, (0, a._)`${r.default.vErrors}.length`);
    }
    function g(P) {
      var I;
      if (!S.opts.unevaluated)
        return;
      const A = (I = _ == null ? void 0 : _.validate) === null || I === void 0 ? void 0 : I.evaluated;
      if (S.props !== !0)
        if (A && !A.dynamicProps)
          A.props !== void 0 && (S.props = n.mergeEvaluated.props(v, A.props, S.props));
        else {
          const M = v.var("props", (0, a._)`${P}.evaluated.props`);
          S.props = n.mergeEvaluated.props(v, M, S.props, a.Name);
        }
      if (S.items !== !0)
        if (A && !A.dynamicItems)
          A.items !== void 0 && (S.items = n.mergeEvaluated.items(v, A.items, S.items));
        else {
          const M = v.var("items", (0, a._)`${P}.evaluated.items`);
          S.items = n.mergeEvaluated.items(v, M, S.items, a.Name);
        }
    }
  }
  return Xe.callRef = c, Xe.default = u, Xe;
}
var fo;
function El() {
  if (fo) return xt;
  fo = 1, Object.defineProperty(xt, "__esModule", { value: !0 });
  const e = _l(), t = wl(), a = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    e.default,
    t.default
  ];
  return xt.default = a, xt;
}
var Zt = {}, er = {}, ho;
function Sl() {
  if (ho) return er;
  ho = 1, Object.defineProperty(er, "__esModule", { value: !0 });
  const e = ne(), t = e.operators, a = {
    maximum: { okStr: "<=", ok: t.LTE, fail: t.GT },
    minimum: { okStr: ">=", ok: t.GTE, fail: t.LT },
    exclusiveMaximum: { okStr: "<", ok: t.LT, fail: t.GTE },
    exclusiveMinimum: { okStr: ">", ok: t.GT, fail: t.LTE }
  }, r = {
    message: ({ keyword: n, schemaCode: u }) => (0, e.str)`must be ${a[n].okStr} ${u}`,
    params: ({ keyword: n, schemaCode: u }) => (0, e._)`{comparison: ${a[n].okStr}, limit: ${u}}`
  }, l = {
    keyword: Object.keys(a),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: r,
    code(n) {
      const { keyword: u, data: o, schemaCode: c } = n;
      n.fail$data((0, e._)`${o} ${a[u].fail} ${c} || isNaN(${o})`);
    }
  };
  return er.default = l, er;
}
var tr = {}, po;
function bl() {
  if (po) return tr;
  po = 1, Object.defineProperty(tr, "__esModule", { value: !0 });
  const e = ne(), a = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: !0,
    error: {
      message: ({ schemaCode: r }) => (0, e.str)`must be multiple of ${r}`,
      params: ({ schemaCode: r }) => (0, e._)`{multipleOf: ${r}}`
    },
    code(r) {
      const { gen: l, data: n, schemaCode: u, it: o } = r, c = o.opts.multipleOfPrecision, d = l.let("res"), s = c ? (0, e._)`Math.abs(Math.round(${d}) - ${d}) > 1e-${c}` : (0, e._)`${d} !== parseInt(${d})`;
      r.fail$data((0, e._)`(${u} === 0 || (${d} = ${n}/${u}, ${s}))`);
    }
  };
  return tr.default = a, tr;
}
var rr = {}, nr = {}, mo;
function Pl() {
  if (mo) return nr;
  mo = 1, Object.defineProperty(nr, "__esModule", { value: !0 });
  function e(t) {
    const a = t.length;
    let r = 0, l = 0, n;
    for (; l < a; )
      r++, n = t.charCodeAt(l++), n >= 55296 && n <= 56319 && l < a && (n = t.charCodeAt(l), (n & 64512) === 56320 && l++);
    return r;
  }
  return nr.default = e, e.code = 'require("ajv/dist/runtime/ucs2length").default', nr;
}
var yo;
function Rl() {
  if (yo) return rr;
  yo = 1, Object.defineProperty(rr, "__esModule", { value: !0 });
  const e = ne(), t = oe(), a = Pl(), l = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: n, schemaCode: u }) {
        const o = n === "maxLength" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${o} than ${u} characters`;
      },
      params: ({ schemaCode: n }) => (0, e._)`{limit: ${n}}`
    },
    code(n) {
      const { keyword: u, data: o, schemaCode: c, it: d } = n, s = u === "maxLength" ? e.operators.GT : e.operators.LT, _ = d.opts.unicode === !1 ? (0, e._)`${o}.length` : (0, e._)`${(0, t.useFunc)(n.gen, a.default)}(${o})`;
      n.fail$data((0, e._)`${_} ${s} ${c}`);
    }
  };
  return rr.default = l, rr;
}
var sr = {}, go;
function Nl() {
  if (go) return sr;
  go = 1, Object.defineProperty(sr, "__esModule", { value: !0 });
  const e = Fe(), t = ne(), r = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: l }) => (0, t.str)`must match pattern "${l}"`,
      params: ({ schemaCode: l }) => (0, t._)`{pattern: ${l}}`
    },
    code(l) {
      const { data: n, $data: u, schema: o, schemaCode: c, it: d } = l, s = d.opts.unicodeRegExp ? "u" : "", _ = u ? (0, t._)`(new RegExp(${c}, ${s}))` : (0, e.usePattern)(l, o);
      l.fail$data((0, t._)`!${_}.test(${n})`);
    }
  };
  return sr.default = r, sr;
}
var ar = {}, vo;
function Ol() {
  if (vo) return ar;
  vo = 1, Object.defineProperty(ar, "__esModule", { value: !0 });
  const e = ne(), a = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: r, schemaCode: l }) {
        const n = r === "maxProperties" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${n} than ${l} properties`;
      },
      params: ({ schemaCode: r }) => (0, e._)`{limit: ${r}}`
    },
    code(r) {
      const { keyword: l, data: n, schemaCode: u } = r, o = l === "maxProperties" ? e.operators.GT : e.operators.LT;
      r.fail$data((0, e._)`Object.keys(${n}).length ${o} ${u}`);
    }
  };
  return ar.default = a, ar;
}
var or = {}, $o;
function Tl() {
  if ($o) return or;
  $o = 1, Object.defineProperty(or, "__esModule", { value: !0 });
  const e = Fe(), t = ne(), a = oe(), l = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: !0,
    error: {
      message: ({ params: { missingProperty: n } }) => (0, t.str)`must have required property '${n}'`,
      params: ({ params: { missingProperty: n } }) => (0, t._)`{missingProperty: ${n}}`
    },
    code(n) {
      const { gen: u, schema: o, schemaCode: c, data: d, $data: s, it: _ } = n, { opts: $ } = _;
      if (!s && o.length === 0)
        return;
      const v = o.length >= $.loopRequired;
      if (_.allErrors ? S() : E(), $.strictRequired) {
        const i = n.parentSchema.properties, { definedProperties: p } = n.it;
        for (const w of o)
          if ((i == null ? void 0 : i[w]) === void 0 && !p.has(w)) {
            const m = _.schemaEnv.baseId + _.errSchemaPath, g = `required property "${w}" is not defined at "${m}" (strictRequired)`;
            (0, a.checkStrictMode)(_, g, _.opts.strictRequired);
          }
      }
      function S() {
        if (v || s)
          n.block$data(t.nil, h);
        else
          for (const i of o)
            (0, e.checkReportMissingProp)(n, i);
      }
      function E() {
        const i = u.let("missing");
        if (v || s) {
          const p = u.let("valid", !0);
          n.block$data(p, () => y(i, p)), n.ok(p);
        } else
          u.if((0, e.checkMissingProp)(n, o, i)), (0, e.reportMissingProp)(n, i), u.else();
      }
      function h() {
        u.forOf("prop", c, (i) => {
          n.setParams({ missingProperty: i }), u.if((0, e.noPropertyInData)(u, d, i, $.ownProperties), () => n.error());
        });
      }
      function y(i, p) {
        n.setParams({ missingProperty: i }), u.forOf(i, c, () => {
          u.assign(p, (0, e.propertyInData)(u, d, i, $.ownProperties)), u.if((0, t.not)(p), () => {
            n.error(), u.break();
          });
        }, t.nil);
      }
    }
  };
  return or.default = l, or;
}
var ir = {}, _o;
function Il() {
  if (_o) return ir;
  _o = 1, Object.defineProperty(ir, "__esModule", { value: !0 });
  const e = ne(), a = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: r, schemaCode: l }) {
        const n = r === "maxItems" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${n} than ${l} items`;
      },
      params: ({ schemaCode: r }) => (0, e._)`{limit: ${r}}`
    },
    code(r) {
      const { keyword: l, data: n, schemaCode: u } = r, o = l === "maxItems" ? e.operators.GT : e.operators.LT;
      r.fail$data((0, e._)`${n}.length ${o} ${u}`);
    }
  };
  return ir.default = a, ir;
}
var cr = {}, ur = {}, wo;
function oa() {
  if (wo) return ur;
  wo = 1, Object.defineProperty(ur, "__esModule", { value: !0 });
  const e = Pn();
  return e.code = 'require("ajv/dist/runtime/equal").default', ur.default = e, ur;
}
var Eo;
function jl() {
  if (Eo) return cr;
  Eo = 1, Object.defineProperty(cr, "__esModule", { value: !0 });
  const e = _n(), t = ne(), a = oe(), r = oa(), n = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: !0,
    error: {
      message: ({ params: { i: u, j: o } }) => (0, t.str)`must NOT have duplicate items (items ## ${o} and ${u} are identical)`,
      params: ({ params: { i: u, j: o } }) => (0, t._)`{i: ${u}, j: ${o}}`
    },
    code(u) {
      const { gen: o, data: c, $data: d, schema: s, parentSchema: _, schemaCode: $, it: v } = u;
      if (!d && !s)
        return;
      const S = o.let("valid"), E = _.items ? (0, e.getSchemaTypes)(_.items) : [];
      u.block$data(S, h, (0, t._)`${$} === false`), u.ok(S);
      function h() {
        const w = o.let("i", (0, t._)`${c}.length`), m = o.let("j");
        u.setParams({ i: w, j: m }), o.assign(S, !0), o.if((0, t._)`${w} > 1`, () => (y() ? i : p)(w, m));
      }
      function y() {
        return E.length > 0 && !E.some((w) => w === "object" || w === "array");
      }
      function i(w, m) {
        const g = o.name("item"), P = (0, e.checkDataTypes)(E, g, v.opts.strictNumbers, e.DataType.Wrong), I = o.const("indices", (0, t._)`{}`);
        o.for((0, t._)`;${w}--;`, () => {
          o.let(g, (0, t._)`${c}[${w}]`), o.if(P, (0, t._)`continue`), E.length > 1 && o.if((0, t._)`typeof ${g} == "string"`, (0, t._)`${g} += "_"`), o.if((0, t._)`typeof ${I}[${g}] == "number"`, () => {
            o.assign(m, (0, t._)`${I}[${g}]`), u.error(), o.assign(S, !1).break();
          }).code((0, t._)`${I}[${g}] = ${w}`);
        });
      }
      function p(w, m) {
        const g = (0, a.useFunc)(o, r.default), P = o.name("outer");
        o.label(P).for((0, t._)`;${w}--;`, () => o.for((0, t._)`${m} = ${w}; ${m}--;`, () => o.if((0, t._)`${g}(${c}[${w}], ${c}[${m}])`, () => {
          u.error(), o.assign(S, !1).break(P);
        })));
      }
    }
  };
  return cr.default = n, cr;
}
var lr = {}, So;
function kl() {
  if (So) return lr;
  So = 1, Object.defineProperty(lr, "__esModule", { value: !0 });
  const e = ne(), t = oe(), a = oa(), l = {
    keyword: "const",
    $data: !0,
    error: {
      message: "must be equal to constant",
      params: ({ schemaCode: n }) => (0, e._)`{allowedValue: ${n}}`
    },
    code(n) {
      const { gen: u, data: o, $data: c, schemaCode: d, schema: s } = n;
      c || s && typeof s == "object" ? n.fail$data((0, e._)`!${(0, t.useFunc)(u, a.default)}(${o}, ${d})`) : n.fail((0, e._)`${s} !== ${o}`);
    }
  };
  return lr.default = l, lr;
}
var dr = {}, bo;
function Cl() {
  if (bo) return dr;
  bo = 1, Object.defineProperty(dr, "__esModule", { value: !0 });
  const e = ne(), t = oe(), a = oa(), l = {
    keyword: "enum",
    schemaType: "array",
    $data: !0,
    error: {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: n }) => (0, e._)`{allowedValues: ${n}}`
    },
    code(n) {
      const { gen: u, data: o, $data: c, schema: d, schemaCode: s, it: _ } = n;
      if (!c && d.length === 0)
        throw new Error("enum must have non-empty array");
      const $ = d.length >= _.opts.loopEnum;
      let v;
      const S = () => v ?? (v = (0, t.useFunc)(u, a.default));
      let E;
      if ($ || c)
        E = u.let("valid"), n.block$data(E, h);
      else {
        if (!Array.isArray(d))
          throw new Error("ajv implementation error");
        const i = u.const("vSchema", s);
        E = (0, e.or)(...d.map((p, w) => y(i, w)));
      }
      n.pass(E);
      function h() {
        u.assign(E, !1), u.forOf("v", s, (i) => u.if((0, e._)`${S()}(${o}, ${i})`, () => u.assign(E, !0).break()));
      }
      function y(i, p) {
        const w = d[p];
        return typeof w == "object" && w !== null ? (0, e._)`${S()}(${o}, ${i}[${p}])` : (0, e._)`${o} === ${w}`;
      }
    }
  };
  return dr.default = l, dr;
}
var Po;
function Al() {
  if (Po) return Zt;
  Po = 1, Object.defineProperty(Zt, "__esModule", { value: !0 });
  const e = Sl(), t = bl(), a = Rl(), r = Nl(), l = Ol(), n = Tl(), u = Il(), o = jl(), c = kl(), d = Cl(), s = [
    // number
    e.default,
    t.default,
    // string
    a.default,
    r.default,
    // object
    l.default,
    n.default,
    // array
    u.default,
    o.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    c.default,
    d.default
  ];
  return Zt.default = s, Zt;
}
var fr = {}, ht = {}, Ro;
function hu() {
  if (Ro) return ht;
  Ro = 1, Object.defineProperty(ht, "__esModule", { value: !0 }), ht.validateAdditionalItems = void 0;
  const e = ne(), t = oe(), r = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: n } }) => (0, e.str)`must NOT have more than ${n} items`,
      params: ({ params: { len: n } }) => (0, e._)`{limit: ${n}}`
    },
    code(n) {
      const { parentSchema: u, it: o } = n, { items: c } = u;
      if (!Array.isArray(c)) {
        (0, t.checkStrictMode)(o, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      l(n, c);
    }
  };
  function l(n, u) {
    const { gen: o, schema: c, data: d, keyword: s, it: _ } = n;
    _.items = !0;
    const $ = o.const("len", (0, e._)`${d}.length`);
    if (c === !1)
      n.setParams({ len: u.length }), n.pass((0, e._)`${$} <= ${u.length}`);
    else if (typeof c == "object" && !(0, t.alwaysValidSchema)(_, c)) {
      const S = o.var("valid", (0, e._)`${$} <= ${u.length}`);
      o.if((0, e.not)(S), () => v(S)), n.ok(S);
    }
    function v(S) {
      o.forRange("i", u.length, $, (E) => {
        n.subschema({ keyword: s, dataProp: E, dataPropType: t.Type.Num }, S), _.allErrors || o.if((0, e.not)(S), () => o.break());
      });
    }
  }
  return ht.validateAdditionalItems = l, ht.default = r, ht;
}
var hr = {}, pt = {}, No;
function pu() {
  if (No) return pt;
  No = 1, Object.defineProperty(pt, "__esModule", { value: !0 }), pt.validateTuple = void 0;
  const e = ne(), t = oe(), a = Fe(), r = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(n) {
      const { schema: u, it: o } = n;
      if (Array.isArray(u))
        return l(n, "additionalItems", u);
      o.items = !0, !(0, t.alwaysValidSchema)(o, u) && n.ok((0, a.validateArray)(n));
    }
  };
  function l(n, u, o = n.schema) {
    const { gen: c, parentSchema: d, data: s, keyword: _, it: $ } = n;
    E(d), $.opts.unevaluated && o.length && $.items !== !0 && ($.items = t.mergeEvaluated.items(c, o.length, $.items));
    const v = c.name("valid"), S = c.const("len", (0, e._)`${s}.length`);
    o.forEach((h, y) => {
      (0, t.alwaysValidSchema)($, h) || (c.if((0, e._)`${S} > ${y}`, () => n.subschema({
        keyword: _,
        schemaProp: y,
        dataProp: y
      }, v)), n.ok(v));
    });
    function E(h) {
      const { opts: y, errSchemaPath: i } = $, p = o.length, w = p === h.minItems && (p === h.maxItems || h[u] === !1);
      if (y.strictTuples && !w) {
        const m = `"${_}" is ${p}-tuple, but minItems or maxItems/${u} are not specified or different at path "${i}"`;
        (0, t.checkStrictMode)($, m, y.strictTuples);
      }
    }
  }
  return pt.validateTuple = l, pt.default = r, pt;
}
var Oo;
function ql() {
  if (Oo) return hr;
  Oo = 1, Object.defineProperty(hr, "__esModule", { value: !0 });
  const e = pu(), t = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (a) => (0, e.validateTuple)(a, "items")
  };
  return hr.default = t, hr;
}
var pr = {}, To;
function Dl() {
  if (To) return pr;
  To = 1, Object.defineProperty(pr, "__esModule", { value: !0 });
  const e = ne(), t = oe(), a = Fe(), r = hu(), n = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: u } }) => (0, e.str)`must NOT have more than ${u} items`,
      params: ({ params: { len: u } }) => (0, e._)`{limit: ${u}}`
    },
    code(u) {
      const { schema: o, parentSchema: c, it: d } = u, { prefixItems: s } = c;
      d.items = !0, !(0, t.alwaysValidSchema)(d, o) && (s ? (0, r.validateAdditionalItems)(u, s) : u.ok((0, a.validateArray)(u)));
    }
  };
  return pr.default = n, pr;
}
var mr = {}, Io;
function Ml() {
  if (Io) return mr;
  Io = 1, Object.defineProperty(mr, "__esModule", { value: !0 });
  const e = ne(), t = oe(), r = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: !0,
    error: {
      message: ({ params: { min: l, max: n } }) => n === void 0 ? (0, e.str)`must contain at least ${l} valid item(s)` : (0, e.str)`must contain at least ${l} and no more than ${n} valid item(s)`,
      params: ({ params: { min: l, max: n } }) => n === void 0 ? (0, e._)`{minContains: ${l}}` : (0, e._)`{minContains: ${l}, maxContains: ${n}}`
    },
    code(l) {
      const { gen: n, schema: u, parentSchema: o, data: c, it: d } = l;
      let s, _;
      const { minContains: $, maxContains: v } = o;
      d.opts.next ? (s = $ === void 0 ? 1 : $, _ = v) : s = 1;
      const S = n.const("len", (0, e._)`${c}.length`);
      if (l.setParams({ min: s, max: _ }), _ === void 0 && s === 0) {
        (0, t.checkStrictMode)(d, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (_ !== void 0 && s > _) {
        (0, t.checkStrictMode)(d, '"minContains" > "maxContains" is always invalid'), l.fail();
        return;
      }
      if ((0, t.alwaysValidSchema)(d, u)) {
        let p = (0, e._)`${S} >= ${s}`;
        _ !== void 0 && (p = (0, e._)`${p} && ${S} <= ${_}`), l.pass(p);
        return;
      }
      d.items = !0;
      const E = n.name("valid");
      _ === void 0 && s === 1 ? y(E, () => n.if(E, () => n.break())) : s === 0 ? (n.let(E, !0), _ !== void 0 && n.if((0, e._)`${c}.length > 0`, h)) : (n.let(E, !1), h()), l.result(E, () => l.reset());
      function h() {
        const p = n.name("_valid"), w = n.let("count", 0);
        y(p, () => n.if(p, () => i(w)));
      }
      function y(p, w) {
        n.forRange("i", 0, S, (m) => {
          l.subschema({
            keyword: "contains",
            dataProp: m,
            dataPropType: t.Type.Num,
            compositeRule: !0
          }, p), w();
        });
      }
      function i(p) {
        n.code((0, e._)`${p}++`), _ === void 0 ? n.if((0, e._)`${p} >= ${s}`, () => n.assign(E, !0).break()) : (n.if((0, e._)`${p} > ${_}`, () => n.assign(E, !1).break()), s === 1 ? n.assign(E, !0) : n.if((0, e._)`${p} >= ${s}`, () => n.assign(E, !0)));
      }
    }
  };
  return mr.default = r, mr;
}
var xn = {}, jo;
function Ll() {
  return jo || (jo = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
    const t = ne(), a = oe(), r = Fe();
    e.error = {
      message: ({ params: { property: c, depsCount: d, deps: s } }) => {
        const _ = d === 1 ? "property" : "properties";
        return (0, t.str)`must have ${_} ${s} when property ${c} is present`;
      },
      params: ({ params: { property: c, depsCount: d, deps: s, missingProperty: _ } }) => (0, t._)`{property: ${c},
    missingProperty: ${_},
    depsCount: ${d},
    deps: ${s}}`
      // TODO change to reference
    };
    const l = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: e.error,
      code(c) {
        const [d, s] = n(c);
        u(c, d), o(c, s);
      }
    };
    function n({ schema: c }) {
      const d = {}, s = {};
      for (const _ in c) {
        if (_ === "__proto__")
          continue;
        const $ = Array.isArray(c[_]) ? d : s;
        $[_] = c[_];
      }
      return [d, s];
    }
    function u(c, d = c.schema) {
      const { gen: s, data: _, it: $ } = c;
      if (Object.keys(d).length === 0)
        return;
      const v = s.let("missing");
      for (const S in d) {
        const E = d[S];
        if (E.length === 0)
          continue;
        const h = (0, r.propertyInData)(s, _, S, $.opts.ownProperties);
        c.setParams({
          property: S,
          depsCount: E.length,
          deps: E.join(", ")
        }), $.allErrors ? s.if(h, () => {
          for (const y of E)
            (0, r.checkReportMissingProp)(c, y);
        }) : (s.if((0, t._)`${h} && (${(0, r.checkMissingProp)(c, E, v)})`), (0, r.reportMissingProp)(c, v), s.else());
      }
    }
    e.validatePropertyDeps = u;
    function o(c, d = c.schema) {
      const { gen: s, data: _, keyword: $, it: v } = c, S = s.name("valid");
      for (const E in d)
        (0, a.alwaysValidSchema)(v, d[E]) || (s.if(
          (0, r.propertyInData)(s, _, E, v.opts.ownProperties),
          () => {
            const h = c.subschema({ keyword: $, schemaProp: E }, S);
            c.mergeValidEvaluated(h, S);
          },
          () => s.var(S, !0)
          // TODO var
        ), c.ok(S));
    }
    e.validateSchemaDeps = o, e.default = l;
  })(xn)), xn;
}
var yr = {}, ko;
function Fl() {
  if (ko) return yr;
  ko = 1, Object.defineProperty(yr, "__esModule", { value: !0 });
  const e = ne(), t = oe(), r = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: {
      message: "property name must be valid",
      params: ({ params: l }) => (0, e._)`{propertyName: ${l.propertyName}}`
    },
    code(l) {
      const { gen: n, schema: u, data: o, it: c } = l;
      if ((0, t.alwaysValidSchema)(c, u))
        return;
      const d = n.name("valid");
      n.forIn("key", o, (s) => {
        l.setParams({ propertyName: s }), l.subschema({
          keyword: "propertyNames",
          data: s,
          dataTypes: ["string"],
          propertyName: s,
          compositeRule: !0
        }, d), n.if((0, e.not)(d), () => {
          l.error(!0), c.allErrors || n.break();
        });
      }), l.ok(d);
    }
  };
  return yr.default = r, yr;
}
var gr = {}, Co;
function mu() {
  if (Co) return gr;
  Co = 1, Object.defineProperty(gr, "__esModule", { value: !0 });
  const e = Fe(), t = ne(), a = Ze(), r = oe(), n = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: !0,
    trackErrors: !0,
    error: {
      message: "must NOT have additional properties",
      params: ({ params: u }) => (0, t._)`{additionalProperty: ${u.additionalProperty}}`
    },
    code(u) {
      const { gen: o, schema: c, parentSchema: d, data: s, errsCount: _, it: $ } = u;
      if (!_)
        throw new Error("ajv implementation error");
      const { allErrors: v, opts: S } = $;
      if ($.props = !0, S.removeAdditional !== "all" && (0, r.alwaysValidSchema)($, c))
        return;
      const E = (0, e.allSchemaProperties)(d.properties), h = (0, e.allSchemaProperties)(d.patternProperties);
      y(), u.ok((0, t._)`${_} === ${a.default.errors}`);
      function y() {
        o.forIn("key", s, (g) => {
          !E.length && !h.length ? w(g) : o.if(i(g), () => w(g));
        });
      }
      function i(g) {
        let P;
        if (E.length > 8) {
          const I = (0, r.schemaRefOrVal)($, d.properties, "properties");
          P = (0, e.isOwnProperty)(o, I, g);
        } else E.length ? P = (0, t.or)(...E.map((I) => (0, t._)`${g} === ${I}`)) : P = t.nil;
        return h.length && (P = (0, t.or)(P, ...h.map((I) => (0, t._)`${(0, e.usePattern)(u, I)}.test(${g})`))), (0, t.not)(P);
      }
      function p(g) {
        o.code((0, t._)`delete ${s}[${g}]`);
      }
      function w(g) {
        if (S.removeAdditional === "all" || S.removeAdditional && c === !1) {
          p(g);
          return;
        }
        if (c === !1) {
          u.setParams({ additionalProperty: g }), u.error(), v || o.break();
          return;
        }
        if (typeof c == "object" && !(0, r.alwaysValidSchema)($, c)) {
          const P = o.name("valid");
          S.removeAdditional === "failing" ? (m(g, P, !1), o.if((0, t.not)(P), () => {
            u.reset(), p(g);
          })) : (m(g, P), v || o.if((0, t.not)(P), () => o.break()));
        }
      }
      function m(g, P, I) {
        const A = {
          keyword: "additionalProperties",
          dataProp: g,
          dataPropType: r.Type.Str
        };
        I === !1 && Object.assign(A, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), u.subschema(A, P);
      }
    }
  };
  return gr.default = n, gr;
}
var vr = {}, Ao;
function Vl() {
  if (Ao) return vr;
  Ao = 1, Object.defineProperty(vr, "__esModule", { value: !0 });
  const e = Nn(), t = Fe(), a = oe(), r = mu(), l = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(n) {
      const { gen: u, schema: o, parentSchema: c, data: d, it: s } = n;
      s.opts.removeAdditional === "all" && c.additionalProperties === void 0 && r.default.code(new e.KeywordCxt(s, r.default, "additionalProperties"));
      const _ = (0, t.allSchemaProperties)(o);
      for (const h of _)
        s.definedProperties.add(h);
      s.opts.unevaluated && _.length && s.props !== !0 && (s.props = a.mergeEvaluated.props(u, (0, a.toHash)(_), s.props));
      const $ = _.filter((h) => !(0, a.alwaysValidSchema)(s, o[h]));
      if ($.length === 0)
        return;
      const v = u.name("valid");
      for (const h of $)
        S(h) ? E(h) : (u.if((0, t.propertyInData)(u, d, h, s.opts.ownProperties)), E(h), s.allErrors || u.else().var(v, !0), u.endIf()), n.it.definedProperties.add(h), n.ok(v);
      function S(h) {
        return s.opts.useDefaults && !s.compositeRule && o[h].default !== void 0;
      }
      function E(h) {
        n.subschema({
          keyword: "properties",
          schemaProp: h,
          dataProp: h
        }, v);
      }
    }
  };
  return vr.default = l, vr;
}
var $r = {}, qo;
function Ul() {
  if (qo) return $r;
  qo = 1, Object.defineProperty($r, "__esModule", { value: !0 });
  const e = Fe(), t = ne(), a = oe(), r = oe(), l = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(n) {
      const { gen: u, schema: o, data: c, parentSchema: d, it: s } = n, { opts: _ } = s, $ = (0, e.allSchemaProperties)(o), v = $.filter((w) => (0, a.alwaysValidSchema)(s, o[w]));
      if ($.length === 0 || v.length === $.length && (!s.opts.unevaluated || s.props === !0))
        return;
      const S = _.strictSchema && !_.allowMatchingProperties && d.properties, E = u.name("valid");
      s.props !== !0 && !(s.props instanceof t.Name) && (s.props = (0, r.evaluatedPropsToName)(u, s.props));
      const { props: h } = s;
      y();
      function y() {
        for (const w of $)
          S && i(w), s.allErrors ? p(w) : (u.var(E, !0), p(w), u.if(E));
      }
      function i(w) {
        for (const m in S)
          new RegExp(w).test(m) && (0, a.checkStrictMode)(s, `property ${m} matches pattern ${w} (use allowMatchingProperties)`);
      }
      function p(w) {
        u.forIn("key", c, (m) => {
          u.if((0, t._)`${(0, e.usePattern)(n, w)}.test(${m})`, () => {
            const g = v.includes(w);
            g || n.subschema({
              keyword: "patternProperties",
              schemaProp: w,
              dataProp: m,
              dataPropType: r.Type.Str
            }, E), s.opts.unevaluated && h !== !0 ? u.assign((0, t._)`${h}[${m}]`, !0) : !g && !s.allErrors && u.if((0, t.not)(E), () => u.break());
          });
        });
      }
    }
  };
  return $r.default = l, $r;
}
var _r = {}, Do;
function zl() {
  if (Do) return _r;
  Do = 1, Object.defineProperty(_r, "__esModule", { value: !0 });
  const e = oe(), t = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    code(a) {
      const { gen: r, schema: l, it: n } = a;
      if ((0, e.alwaysValidSchema)(n, l)) {
        a.fail();
        return;
      }
      const u = r.name("valid");
      a.subschema({
        keyword: "not",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, u), a.failResult(u, () => a.reset(), () => a.error());
    },
    error: { message: "must NOT be valid" }
  };
  return _r.default = t, _r;
}
var wr = {}, Mo;
function Kl() {
  if (Mo) return wr;
  Mo = 1, Object.defineProperty(wr, "__esModule", { value: !0 });
  const t = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: !0,
    code: Fe().validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  return wr.default = t, wr;
}
var Er = {}, Lo;
function Gl() {
  if (Lo) return Er;
  Lo = 1, Object.defineProperty(Er, "__esModule", { value: !0 });
  const e = ne(), t = oe(), r = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: !0,
    error: {
      message: "must match exactly one schema in oneOf",
      params: ({ params: l }) => (0, e._)`{passingSchemas: ${l.passing}}`
    },
    code(l) {
      const { gen: n, schema: u, parentSchema: o, it: c } = l;
      if (!Array.isArray(u))
        throw new Error("ajv implementation error");
      if (c.opts.discriminator && o.discriminator)
        return;
      const d = u, s = n.let("valid", !1), _ = n.let("passing", null), $ = n.name("_valid");
      l.setParams({ passing: _ }), n.block(v), l.result(s, () => l.reset(), () => l.error(!0));
      function v() {
        d.forEach((S, E) => {
          let h;
          (0, t.alwaysValidSchema)(c, S) ? n.var($, !0) : h = l.subschema({
            keyword: "oneOf",
            schemaProp: E,
            compositeRule: !0
          }, $), E > 0 && n.if((0, e._)`${$} && ${s}`).assign(s, !1).assign(_, (0, e._)`[${_}, ${E}]`).else(), n.if($, () => {
            n.assign(s, !0), n.assign(_, E), h && l.mergeEvaluated(h, e.Name);
          });
        });
      }
    }
  };
  return Er.default = r, Er;
}
var Sr = {}, Fo;
function Hl() {
  if (Fo) return Sr;
  Fo = 1, Object.defineProperty(Sr, "__esModule", { value: !0 });
  const e = oe(), t = {
    keyword: "allOf",
    schemaType: "array",
    code(a) {
      const { gen: r, schema: l, it: n } = a;
      if (!Array.isArray(l))
        throw new Error("ajv implementation error");
      const u = r.name("valid");
      l.forEach((o, c) => {
        if ((0, e.alwaysValidSchema)(n, o))
          return;
        const d = a.subschema({ keyword: "allOf", schemaProp: c }, u);
        a.ok(u), a.mergeEvaluated(d);
      });
    }
  };
  return Sr.default = t, Sr;
}
var br = {}, Vo;
function Wl() {
  if (Vo) return br;
  Vo = 1, Object.defineProperty(br, "__esModule", { value: !0 });
  const e = ne(), t = oe(), r = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    error: {
      message: ({ params: n }) => (0, e.str)`must match "${n.ifClause}" schema`,
      params: ({ params: n }) => (0, e._)`{failingKeyword: ${n.ifClause}}`
    },
    code(n) {
      const { gen: u, parentSchema: o, it: c } = n;
      o.then === void 0 && o.else === void 0 && (0, t.checkStrictMode)(c, '"if" without "then" and "else" is ignored');
      const d = l(c, "then"), s = l(c, "else");
      if (!d && !s)
        return;
      const _ = u.let("valid", !0), $ = u.name("_valid");
      if (v(), n.reset(), d && s) {
        const E = u.let("ifClause");
        n.setParams({ ifClause: E }), u.if($, S("then", E), S("else", E));
      } else d ? u.if($, S("then")) : u.if((0, e.not)($), S("else"));
      n.pass(_, () => n.error(!0));
      function v() {
        const E = n.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, $);
        n.mergeEvaluated(E);
      }
      function S(E, h) {
        return () => {
          const y = n.subschema({ keyword: E }, $);
          u.assign(_, $), n.mergeValidEvaluated(y, _), h ? u.assign(h, (0, e._)`${E}`) : n.setParams({ ifClause: E });
        };
      }
    }
  };
  function l(n, u) {
    const o = n.schema[u];
    return o !== void 0 && !(0, t.alwaysValidSchema)(n, o);
  }
  return br.default = r, br;
}
var Pr = {}, Uo;
function Bl() {
  if (Uo) return Pr;
  Uo = 1, Object.defineProperty(Pr, "__esModule", { value: !0 });
  const e = oe(), t = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword: a, parentSchema: r, it: l }) {
      r.if === void 0 && (0, e.checkStrictMode)(l, `"${a}" without "if" is ignored`);
    }
  };
  return Pr.default = t, Pr;
}
var zo;
function Jl() {
  if (zo) return fr;
  zo = 1, Object.defineProperty(fr, "__esModule", { value: !0 });
  const e = hu(), t = ql(), a = pu(), r = Dl(), l = Ml(), n = Ll(), u = Fl(), o = mu(), c = Vl(), d = Ul(), s = zl(), _ = Kl(), $ = Gl(), v = Hl(), S = Wl(), E = Bl();
  function h(y = !1) {
    const i = [
      // any
      s.default,
      _.default,
      $.default,
      v.default,
      S.default,
      E.default,
      // object
      u.default,
      o.default,
      n.default,
      c.default,
      d.default
    ];
    return y ? i.push(t.default, r.default) : i.push(e.default, a.default), i.push(l.default), i;
  }
  return fr.default = h, fr;
}
var Rr = {}, Nr = {}, Ko;
function Xl() {
  if (Ko) return Nr;
  Ko = 1, Object.defineProperty(Nr, "__esModule", { value: !0 });
  const e = ne(), a = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: r }) => (0, e.str)`must match format "${r}"`,
      params: ({ schemaCode: r }) => (0, e._)`{format: ${r}}`
    },
    code(r, l) {
      const { gen: n, data: u, $data: o, schema: c, schemaCode: d, it: s } = r, { opts: _, errSchemaPath: $, schemaEnv: v, self: S } = s;
      if (!_.validateFormats)
        return;
      o ? E() : h();
      function E() {
        const y = n.scopeValue("formats", {
          ref: S.formats,
          code: _.code.formats
        }), i = n.const("fDef", (0, e._)`${y}[${d}]`), p = n.let("fType"), w = n.let("format");
        n.if((0, e._)`typeof ${i} == "object" && !(${i} instanceof RegExp)`, () => n.assign(p, (0, e._)`${i}.type || "string"`).assign(w, (0, e._)`${i}.validate`), () => n.assign(p, (0, e._)`"string"`).assign(w, i)), r.fail$data((0, e.or)(m(), g()));
        function m() {
          return _.strictSchema === !1 ? e.nil : (0, e._)`${d} && !${w}`;
        }
        function g() {
          const P = v.$async ? (0, e._)`(${i}.async ? await ${w}(${u}) : ${w}(${u}))` : (0, e._)`${w}(${u})`, I = (0, e._)`(typeof ${w} == "function" ? ${P} : ${w}.test(${u}))`;
          return (0, e._)`${w} && ${w} !== true && ${p} === ${l} && !${I}`;
        }
      }
      function h() {
        const y = S.formats[c];
        if (!y) {
          m();
          return;
        }
        if (y === !0)
          return;
        const [i, p, w] = g(y);
        i === l && r.pass(P());
        function m() {
          if (_.strictSchema === !1) {
            S.logger.warn(I());
            return;
          }
          throw new Error(I());
          function I() {
            return `unknown format "${c}" ignored in schema at path "${$}"`;
          }
        }
        function g(I) {
          const A = I instanceof RegExp ? (0, e.regexpCode)(I) : _.code.formats ? (0, e._)`${_.code.formats}${(0, e.getProperty)(c)}` : void 0, M = n.scopeValue("formats", { key: c, ref: I, code: A });
          return typeof I == "object" && !(I instanceof RegExp) ? [I.type || "string", I.validate, (0, e._)`${M}.validate`] : ["string", I, M];
        }
        function P() {
          if (typeof y == "object" && !(y instanceof RegExp) && y.async) {
            if (!v.$async)
              throw new Error("async format in sync schema");
            return (0, e._)`await ${w}(${u})`;
          }
          return typeof p == "function" ? (0, e._)`${w}(${u})` : (0, e._)`${w}.test(${u})`;
        }
      }
    }
  };
  return Nr.default = a, Nr;
}
var Go;
function Yl() {
  if (Go) return Rr;
  Go = 1, Object.defineProperty(Rr, "__esModule", { value: !0 });
  const t = [Xl().default];
  return Rr.default = t, Rr;
}
var ut = {}, Ho;
function xl() {
  return Ho || (Ho = 1, Object.defineProperty(ut, "__esModule", { value: !0 }), ut.contentVocabulary = ut.metadataVocabulary = void 0, ut.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ], ut.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ]), ut;
}
var Wo;
function Ql() {
  if (Wo) return Yt;
  Wo = 1, Object.defineProperty(Yt, "__esModule", { value: !0 });
  const e = El(), t = Al(), a = Jl(), r = Yl(), l = xl(), n = [
    e.default,
    t.default,
    (0, a.default)(),
    r.default,
    l.metadataVocabulary,
    l.contentVocabulary
  ];
  return Yt.default = n, Yt;
}
var Or = {}, St = {}, Bo;
function Zl() {
  if (Bo) return St;
  Bo = 1, Object.defineProperty(St, "__esModule", { value: !0 }), St.DiscrError = void 0;
  var e;
  return (function(t) {
    t.Tag = "tag", t.Mapping = "mapping";
  })(e || (St.DiscrError = e = {})), St;
}
var Jo;
function ed() {
  if (Jo) return Or;
  Jo = 1, Object.defineProperty(Or, "__esModule", { value: !0 });
  const e = ne(), t = Zl(), a = aa(), r = On(), l = oe(), u = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error: {
      message: ({ params: { discrError: o, tagName: c } }) => o === t.DiscrError.Tag ? `tag "${c}" must be string` : `value of tag "${c}" must be in oneOf`,
      params: ({ params: { discrError: o, tag: c, tagName: d } }) => (0, e._)`{error: ${o}, tag: ${d}, tagValue: ${c}}`
    },
    code(o) {
      const { gen: c, data: d, schema: s, parentSchema: _, it: $ } = o, { oneOf: v } = _;
      if (!$.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const S = s.propertyName;
      if (typeof S != "string")
        throw new Error("discriminator: requires propertyName");
      if (s.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!v)
        throw new Error("discriminator: requires oneOf keyword");
      const E = c.let("valid", !1), h = c.const("tag", (0, e._)`${d}${(0, e.getProperty)(S)}`);
      c.if((0, e._)`typeof ${h} == "string"`, () => y(), () => o.error(!1, { discrError: t.DiscrError.Tag, tag: h, tagName: S })), o.ok(E);
      function y() {
        const w = p();
        c.if(!1);
        for (const m in w)
          c.elseIf((0, e._)`${h} === ${m}`), c.assign(E, i(w[m]));
        c.else(), o.error(!1, { discrError: t.DiscrError.Mapping, tag: h, tagName: S }), c.endIf();
      }
      function i(w) {
        const m = c.name("valid"), g = o.subschema({ keyword: "oneOf", schemaProp: w }, m);
        return o.mergeEvaluated(g, e.Name), m;
      }
      function p() {
        var w;
        const m = {}, g = I(_);
        let P = !0;
        for (let F = 0; F < v.length; F++) {
          let W = v[F];
          if (W != null && W.$ref && !(0, l.schemaHasRulesButRef)(W, $.self.RULES)) {
            const V = W.$ref;
            if (W = a.resolveRef.call($.self, $.schemaEnv.root, $.baseId, V), W instanceof a.SchemaEnv && (W = W.schema), W === void 0)
              throw new r.default($.opts.uriResolver, $.baseId, V);
          }
          const B = (w = W == null ? void 0 : W.properties) === null || w === void 0 ? void 0 : w[S];
          if (typeof B != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${S}"`);
          P = P && (g || I(W)), A(B, F);
        }
        if (!P)
          throw new Error(`discriminator: "${S}" must be required`);
        return m;
        function I({ required: F }) {
          return Array.isArray(F) && F.includes(S);
        }
        function A(F, W) {
          if (F.const)
            M(F.const, W);
          else if (F.enum)
            for (const B of F.enum)
              M(B, W);
          else
            throw new Error(`discriminator: "properties/${S}" must have "const" or "enum"`);
        }
        function M(F, W) {
          if (typeof F != "string" || F in m)
            throw new Error(`discriminator: "${S}" values must be unique strings`);
          m[F] = W;
        }
      }
    }
  };
  return Or.default = u, Or;
}
const td = "http://json-schema.org/draft-07/schema#", rd = "http://json-schema.org/draft-07/schema#", nd = "Core schema meta-schema", sd = { schemaArray: { type: "array", minItems: 1, items: { $ref: "#" } }, nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, ad = ["object", "boolean"], od = { $id: { type: "string", format: "uri-reference" }, $schema: { type: "string", format: "uri" }, $ref: { type: "string", format: "uri-reference" }, $comment: { type: "string" }, title: { type: "string" }, description: { type: "string" }, default: !0, readOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/definitions/nonNegativeInteger" }, minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, additionalItems: { $ref: "#" }, items: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }], default: !0 }, maxItems: { $ref: "#/definitions/nonNegativeInteger" }, minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, contains: { $ref: "#" }, maxProperties: { $ref: "#/definitions/nonNegativeInteger" }, minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, required: { $ref: "#/definitions/stringArray" }, additionalProperties: { $ref: "#" }, definitions: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, properties: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $ref: "#" }, propertyNames: { format: "regex" }, default: {} }, dependencies: { type: "object", additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] } }, propertyNames: { $ref: "#" }, const: !0, enum: { type: "array", items: !0, minItems: 1, uniqueItems: !0 }, type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, { type: "array", items: { $ref: "#/definitions/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, format: { type: "string" }, contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, if: { $ref: "#" }, then: { $ref: "#" }, else: { $ref: "#" }, allOf: { $ref: "#/definitions/schemaArray" }, anyOf: { $ref: "#/definitions/schemaArray" }, oneOf: { $ref: "#/definitions/schemaArray" }, not: { $ref: "#" } }, id = {
  $schema: td,
  $id: rd,
  title: nd,
  definitions: sd,
  type: ad,
  properties: od,
  default: !0
};
var Xo;
function cd() {
  return Xo || (Xo = 1, (function(e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv = void 0;
    const a = $l(), r = Ql(), l = ed(), n = id, u = ["/properties"], o = "http://json-schema.org/draft-07/schema";
    class c extends a.default {
      _addVocabularies() {
        super._addVocabularies(), r.default.forEach((S) => this.addVocabulary(S)), this.opts.discriminator && this.addKeyword(l.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const S = this.opts.$data ? this.$dataMetaSchema(n, u) : n;
        this.addMetaSchema(S, o, !1), this.refs["http://json-schema.org/schema"] = o;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(o) ? o : void 0);
      }
    }
    t.Ajv = c, e.exports = t = c, e.exports.Ajv = c, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = c;
    var d = Nn();
    Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
      return d.KeywordCxt;
    } });
    var s = ne();
    Object.defineProperty(t, "_", { enumerable: !0, get: function() {
      return s._;
    } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
      return s.str;
    } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
      return s.stringify;
    } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
      return s.nil;
    } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
      return s.Name;
    } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
      return s.CodeGen;
    } });
    var _ = sa();
    Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
      return _.default;
    } });
    var $ = On();
    Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
      return $.default;
    } });
  })(Ht, Ht.exports)), Ht.exports;
}
var Tr = { exports: {} }, Qn = {}, Yo;
function ud() {
  return Yo || (Yo = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.formatNames = e.fastFormats = e.fullFormats = void 0;
    function t(A, M) {
      return { validate: A, compare: M };
    }
    e.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: t(n, u),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: t(c, d),
      "date-time": t(_, $),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri: E,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex: I,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte: y,
      // signed 32 bit integer
      int32: { type: "number", validate: w },
      // signed 64 bit integer
      int64: { type: "number", validate: m },
      // C-type float
      float: { type: "number", validate: g },
      // C-type double
      double: { type: "number", validate: g },
      // hint to the UI to hide input strings
      password: !0,
      // unchecked string payload
      binary: !0
    }, e.fastFormats = {
      ...e.fullFormats,
      date: t(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, u),
      time: t(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, d),
      "date-time": t(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, $),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    }, e.formatNames = Object.keys(e.fullFormats);
    function a(A) {
      return A % 4 === 0 && (A % 100 !== 0 || A % 400 === 0);
    }
    const r = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, l = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function n(A) {
      const M = r.exec(A);
      if (!M)
        return !1;
      const F = +M[1], W = +M[2], B = +M[3];
      return W >= 1 && W <= 12 && B >= 1 && B <= (W === 2 && a(F) ? 29 : l[W]);
    }
    function u(A, M) {
      if (A && M)
        return A > M ? 1 : A < M ? -1 : 0;
    }
    const o = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
    function c(A, M) {
      const F = o.exec(A);
      if (!F)
        return !1;
      const W = +F[1], B = +F[2], V = +F[3], z = F[5];
      return (W <= 23 && B <= 59 && V <= 59 || W === 23 && B === 59 && V === 60) && (!M || z !== "");
    }
    function d(A, M) {
      if (!(A && M))
        return;
      const F = o.exec(A), W = o.exec(M);
      if (F && W)
        return A = F[1] + F[2] + F[3] + (F[4] || ""), M = W[1] + W[2] + W[3] + (W[4] || ""), A > M ? 1 : A < M ? -1 : 0;
    }
    const s = /t|\s/i;
    function _(A) {
      const M = A.split(s);
      return M.length === 2 && n(M[0]) && c(M[1], !0);
    }
    function $(A, M) {
      if (!(A && M))
        return;
      const [F, W] = A.split(s), [B, V] = M.split(s), z = u(F, B);
      if (z !== void 0)
        return z || d(W, V);
    }
    const v = /\/|:/, S = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function E(A) {
      return v.test(A) && S.test(A);
    }
    const h = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function y(A) {
      return h.lastIndex = 0, h.test(A);
    }
    const i = -2147483648, p = 2 ** 31 - 1;
    function w(A) {
      return Number.isInteger(A) && A <= p && A >= i;
    }
    function m(A) {
      return Number.isInteger(A);
    }
    function g() {
      return !0;
    }
    const P = /[^\\]\\Z/;
    function I(A) {
      if (P.test(A))
        return !1;
      try {
        return new RegExp(A), !0;
      } catch {
        return !1;
      }
    }
  })(Qn)), Qn;
}
var Zn = {}, Ir = { exports: {} }, es = {}, We = {}, lt = {}, ts = {}, rs = {}, ns = {}, xo;
function wn() {
  return xo || (xo = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.regexpCode = e.getEsmExportName = e.getProperty = e.safeStringify = e.stringify = e.strConcat = e.addCodeArg = e.str = e._ = e.nil = e._Code = e.Name = e.IDENTIFIER = e._CodeOrName = void 0;
    class t {
    }
    e._CodeOrName = t, e.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    class a extends t {
      constructor(i) {
        if (super(), !e.IDENTIFIER.test(i))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = i;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return !1;
      }
      get names() {
        return { [this.str]: 1 };
      }
    }
    e.Name = a;
    class r extends t {
      constructor(i) {
        super(), this._items = typeof i == "string" ? [i] : i;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return !1;
        const i = this._items[0];
        return i === "" || i === '""';
      }
      get str() {
        var i;
        return (i = this._str) !== null && i !== void 0 ? i : this._str = this._items.reduce((p, w) => `${p}${w}`, "");
      }
      get names() {
        var i;
        return (i = this._names) !== null && i !== void 0 ? i : this._names = this._items.reduce((p, w) => (w instanceof a && (p[w.str] = (p[w.str] || 0) + 1), p), {});
      }
    }
    e._Code = r, e.nil = new r("");
    function l(y, ...i) {
      const p = [y[0]];
      let w = 0;
      for (; w < i.length; )
        o(p, i[w]), p.push(y[++w]);
      return new r(p);
    }
    e._ = l;
    const n = new r("+");
    function u(y, ...i) {
      const p = [v(y[0])];
      let w = 0;
      for (; w < i.length; )
        p.push(n), o(p, i[w]), p.push(n, v(y[++w]));
      return c(p), new r(p);
    }
    e.str = u;
    function o(y, i) {
      i instanceof r ? y.push(...i._items) : i instanceof a ? y.push(i) : y.push(_(i));
    }
    e.addCodeArg = o;
    function c(y) {
      let i = 1;
      for (; i < y.length - 1; ) {
        if (y[i] === n) {
          const p = d(y[i - 1], y[i + 1]);
          if (p !== void 0) {
            y.splice(i - 1, 3, p);
            continue;
          }
          y[i++] = "+";
        }
        i++;
      }
    }
    function d(y, i) {
      if (i === '""')
        return y;
      if (y === '""')
        return i;
      if (typeof y == "string")
        return i instanceof a || y[y.length - 1] !== '"' ? void 0 : typeof i != "string" ? `${y.slice(0, -1)}${i}"` : i[0] === '"' ? y.slice(0, -1) + i.slice(1) : void 0;
      if (typeof i == "string" && i[0] === '"' && !(y instanceof a))
        return `"${y}${i.slice(1)}`;
    }
    function s(y, i) {
      return i.emptyStr() ? y : y.emptyStr() ? i : u`${y}${i}`;
    }
    e.strConcat = s;
    function _(y) {
      return typeof y == "number" || typeof y == "boolean" || y === null ? y : v(Array.isArray(y) ? y.join(",") : y);
    }
    function $(y) {
      return new r(v(y));
    }
    e.stringify = $;
    function v(y) {
      return JSON.stringify(y).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    e.safeStringify = v;
    function S(y) {
      return typeof y == "string" && e.IDENTIFIER.test(y) ? new r(`.${y}`) : l`[${y}]`;
    }
    e.getProperty = S;
    function E(y) {
      if (typeof y == "string" && e.IDENTIFIER.test(y))
        return new r(`${y}`);
      throw new Error(`CodeGen: invalid export name: ${y}, use explicit $id name mapping`);
    }
    e.getEsmExportName = E;
    function h(y) {
      return new r(y.toString());
    }
    e.regexpCode = h;
  })(ns)), ns;
}
var ss = {}, Qo;
function Zo() {
  return Qo || (Qo = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.ValueScope = e.ValueScopeName = e.Scope = e.varKinds = e.UsedValueState = void 0;
    const t = wn();
    class a extends Error {
      constructor(d) {
        super(`CodeGen: "code" for ${d} not defined`), this.value = d.value;
      }
    }
    var r;
    (function(c) {
      c[c.Started = 0] = "Started", c[c.Completed = 1] = "Completed";
    })(r || (e.UsedValueState = r = {})), e.varKinds = {
      const: new t.Name("const"),
      let: new t.Name("let"),
      var: new t.Name("var")
    };
    class l {
      constructor({ prefixes: d, parent: s } = {}) {
        this._names = {}, this._prefixes = d, this._parent = s;
      }
      toName(d) {
        return d instanceof t.Name ? d : this.name(d);
      }
      name(d) {
        return new t.Name(this._newName(d));
      }
      _newName(d) {
        const s = this._names[d] || this._nameGroup(d);
        return `${d}${s.index++}`;
      }
      _nameGroup(d) {
        var s, _;
        if (!((_ = (s = this._parent) === null || s === void 0 ? void 0 : s._prefixes) === null || _ === void 0) && _.has(d) || this._prefixes && !this._prefixes.has(d))
          throw new Error(`CodeGen: prefix "${d}" is not allowed in this scope`);
        return this._names[d] = { prefix: d, index: 0 };
      }
    }
    e.Scope = l;
    class n extends t.Name {
      constructor(d, s) {
        super(s), this.prefix = d;
      }
      setValue(d, { property: s, itemIndex: _ }) {
        this.value = d, this.scopePath = (0, t._)`.${new t.Name(s)}[${_}]`;
      }
    }
    e.ValueScopeName = n;
    const u = (0, t._)`\n`;
    class o extends l {
      constructor(d) {
        super(d), this._values = {}, this._scope = d.scope, this.opts = { ...d, _n: d.lines ? u : t.nil };
      }
      get() {
        return this._scope;
      }
      name(d) {
        return new n(d, this._newName(d));
      }
      value(d, s) {
        var _;
        if (s.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const $ = this.toName(d), { prefix: v } = $, S = (_ = s.key) !== null && _ !== void 0 ? _ : s.ref;
        let E = this._values[v];
        if (E) {
          const i = E.get(S);
          if (i)
            return i;
        } else
          E = this._values[v] = /* @__PURE__ */ new Map();
        E.set(S, $);
        const h = this._scope[v] || (this._scope[v] = []), y = h.length;
        return h[y] = s.ref, $.setValue(s, { property: v, itemIndex: y }), $;
      }
      getValue(d, s) {
        const _ = this._values[d];
        if (_)
          return _.get(s);
      }
      scopeRefs(d, s = this._values) {
        return this._reduceValues(s, (_) => {
          if (_.scopePath === void 0)
            throw new Error(`CodeGen: name "${_}" has no value`);
          return (0, t._)`${d}${_.scopePath}`;
        });
      }
      scopeCode(d = this._values, s, _) {
        return this._reduceValues(d, ($) => {
          if ($.value === void 0)
            throw new Error(`CodeGen: name "${$}" has no value`);
          return $.value.code;
        }, s, _);
      }
      _reduceValues(d, s, _ = {}, $) {
        let v = t.nil;
        for (const S in d) {
          const E = d[S];
          if (!E)
            continue;
          const h = _[S] = _[S] || /* @__PURE__ */ new Map();
          E.forEach((y) => {
            if (h.has(y))
              return;
            h.set(y, r.Started);
            let i = s(y);
            if (i) {
              const p = this.opts.es5 ? e.varKinds.var : e.varKinds.const;
              v = (0, t._)`${v}${p} ${y} = ${i};${this.opts._n}`;
            } else if (i = $ == null ? void 0 : $(y))
              v = (0, t._)`${v}${i}${this.opts._n}`;
            else
              throw new a(y);
            h.set(y, r.Completed);
          });
        }
        return v;
      }
    }
    e.ValueScope = o;
  })(ss)), ss;
}
var ei;
function re() {
  return ei || (ei = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.or = e.and = e.not = e.CodeGen = e.operators = e.varKinds = e.ValueScopeName = e.ValueScope = e.Scope = e.Name = e.regexpCode = e.stringify = e.getProperty = e.nil = e.strConcat = e.str = e._ = void 0;
    const t = wn(), a = Zo();
    var r = wn();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return r._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return r.str;
    } }), Object.defineProperty(e, "strConcat", { enumerable: !0, get: function() {
      return r.strConcat;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return r.nil;
    } }), Object.defineProperty(e, "getProperty", { enumerable: !0, get: function() {
      return r.getProperty;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return r.stringify;
    } }), Object.defineProperty(e, "regexpCode", { enumerable: !0, get: function() {
      return r.regexpCode;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return r.Name;
    } });
    var l = Zo();
    Object.defineProperty(e, "Scope", { enumerable: !0, get: function() {
      return l.Scope;
    } }), Object.defineProperty(e, "ValueScope", { enumerable: !0, get: function() {
      return l.ValueScope;
    } }), Object.defineProperty(e, "ValueScopeName", { enumerable: !0, get: function() {
      return l.ValueScopeName;
    } }), Object.defineProperty(e, "varKinds", { enumerable: !0, get: function() {
      return l.varKinds;
    } }), e.operators = {
      GT: new t._Code(">"),
      GTE: new t._Code(">="),
      LT: new t._Code("<"),
      LTE: new t._Code("<="),
      EQ: new t._Code("==="),
      NEQ: new t._Code("!=="),
      NOT: new t._Code("!"),
      OR: new t._Code("||"),
      AND: new t._Code("&&"),
      ADD: new t._Code("+")
    };
    class n {
      optimizeNodes() {
        return this;
      }
      optimizeNames(f, b) {
        return this;
      }
    }
    class u extends n {
      constructor(f, b, C) {
        super(), this.varKind = f, this.name = b, this.rhs = C;
      }
      render({ es5: f, _n: b }) {
        const C = f ? a.varKinds.var : this.varKind, K = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${C} ${this.name}${K};` + b;
      }
      optimizeNames(f, b) {
        if (f[this.name.str])
          return this.rhs && (this.rhs = V(this.rhs, f, b)), this;
      }
      get names() {
        return this.rhs instanceof t._CodeOrName ? this.rhs.names : {};
      }
    }
    class o extends n {
      constructor(f, b, C) {
        super(), this.lhs = f, this.rhs = b, this.sideEffects = C;
      }
      render({ _n: f }) {
        return `${this.lhs} = ${this.rhs};` + f;
      }
      optimizeNames(f, b) {
        if (!(this.lhs instanceof t.Name && !f[this.lhs.str] && !this.sideEffects))
          return this.rhs = V(this.rhs, f, b), this;
      }
      get names() {
        const f = this.lhs instanceof t.Name ? {} : { ...this.lhs.names };
        return B(f, this.rhs);
      }
    }
    class c extends o {
      constructor(f, b, C, K) {
        super(f, C, K), this.op = b;
      }
      render({ _n: f }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + f;
      }
    }
    class d extends n {
      constructor(f) {
        super(), this.label = f, this.names = {};
      }
      render({ _n: f }) {
        return `${this.label}:` + f;
      }
    }
    class s extends n {
      constructor(f) {
        super(), this.label = f, this.names = {};
      }
      render({ _n: f }) {
        return `break${this.label ? ` ${this.label}` : ""};` + f;
      }
    }
    class _ extends n {
      constructor(f) {
        super(), this.error = f;
      }
      render({ _n: f }) {
        return `throw ${this.error};` + f;
      }
      get names() {
        return this.error.names;
      }
    }
    class $ extends n {
      constructor(f) {
        super(), this.code = f;
      }
      render({ _n: f }) {
        return `${this.code};` + f;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(f, b) {
        return this.code = V(this.code, f, b), this;
      }
      get names() {
        return this.code instanceof t._CodeOrName ? this.code.names : {};
      }
    }
    class v extends n {
      constructor(f = []) {
        super(), this.nodes = f;
      }
      render(f) {
        return this.nodes.reduce((b, C) => b + C.render(f), "");
      }
      optimizeNodes() {
        const { nodes: f } = this;
        let b = f.length;
        for (; b--; ) {
          const C = f[b].optimizeNodes();
          Array.isArray(C) ? f.splice(b, 1, ...C) : C ? f[b] = C : f.splice(b, 1);
        }
        return f.length > 0 ? this : void 0;
      }
      optimizeNames(f, b) {
        const { nodes: C } = this;
        let K = C.length;
        for (; K--; ) {
          const G = C[K];
          G.optimizeNames(f, b) || (z(f, G.names), C.splice(K, 1));
        }
        return C.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((f, b) => W(f, b.names), {});
      }
    }
    class S extends v {
      render(f) {
        return "{" + f._n + super.render(f) + "}" + f._n;
      }
    }
    class E extends v {
    }
    class h extends S {
    }
    h.kind = "else";
    class y extends S {
      constructor(f, b) {
        super(b), this.condition = f;
      }
      render(f) {
        let b = `if(${this.condition})` + super.render(f);
        return this.else && (b += "else " + this.else.render(f)), b;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const f = this.condition;
        if (f === !0)
          return this.nodes;
        let b = this.else;
        if (b) {
          const C = b.optimizeNodes();
          b = this.else = Array.isArray(C) ? new h(C) : C;
        }
        if (b)
          return f === !1 ? b instanceof y ? b : b.nodes : this.nodes.length ? this : new y(Y(f), b instanceof y ? [b] : b.nodes);
        if (!(f === !1 || !this.nodes.length))
          return this;
      }
      optimizeNames(f, b) {
        var C;
        if (this.else = (C = this.else) === null || C === void 0 ? void 0 : C.optimizeNames(f, b), !!(super.optimizeNames(f, b) || this.else))
          return this.condition = V(this.condition, f, b), this;
      }
      get names() {
        const f = super.names;
        return B(f, this.condition), this.else && W(f, this.else.names), f;
      }
    }
    y.kind = "if";
    class i extends S {
    }
    i.kind = "for";
    class p extends i {
      constructor(f) {
        super(), this.iteration = f;
      }
      render(f) {
        return `for(${this.iteration})` + super.render(f);
      }
      optimizeNames(f, b) {
        if (super.optimizeNames(f, b))
          return this.iteration = V(this.iteration, f, b), this;
      }
      get names() {
        return W(super.names, this.iteration.names);
      }
    }
    class w extends i {
      constructor(f, b, C, K) {
        super(), this.varKind = f, this.name = b, this.from = C, this.to = K;
      }
      render(f) {
        const b = f.es5 ? a.varKinds.var : this.varKind, { name: C, from: K, to: G } = this;
        return `for(${b} ${C}=${K}; ${C}<${G}; ${C}++)` + super.render(f);
      }
      get names() {
        const f = B(super.names, this.from);
        return B(f, this.to);
      }
    }
    class m extends i {
      constructor(f, b, C, K) {
        super(), this.loop = f, this.varKind = b, this.name = C, this.iterable = K;
      }
      render(f) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(f);
      }
      optimizeNames(f, b) {
        if (super.optimizeNames(f, b))
          return this.iterable = V(this.iterable, f, b), this;
      }
      get names() {
        return W(super.names, this.iterable.names);
      }
    }
    class g extends S {
      constructor(f, b, C) {
        super(), this.name = f, this.args = b, this.async = C;
      }
      render(f) {
        return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(f);
      }
    }
    g.kind = "func";
    class P extends v {
      render(f) {
        return "return " + super.render(f);
      }
    }
    P.kind = "return";
    class I extends S {
      render(f) {
        let b = "try" + super.render(f);
        return this.catch && (b += this.catch.render(f)), this.finally && (b += this.finally.render(f)), b;
      }
      optimizeNodes() {
        var f, b;
        return super.optimizeNodes(), (f = this.catch) === null || f === void 0 || f.optimizeNodes(), (b = this.finally) === null || b === void 0 || b.optimizeNodes(), this;
      }
      optimizeNames(f, b) {
        var C, K;
        return super.optimizeNames(f, b), (C = this.catch) === null || C === void 0 || C.optimizeNames(f, b), (K = this.finally) === null || K === void 0 || K.optimizeNames(f, b), this;
      }
      get names() {
        const f = super.names;
        return this.catch && W(f, this.catch.names), this.finally && W(f, this.finally.names), f;
      }
    }
    class A extends S {
      constructor(f) {
        super(), this.error = f;
      }
      render(f) {
        return `catch(${this.error})` + super.render(f);
      }
    }
    A.kind = "catch";
    class M extends S {
      render(f) {
        return "finally" + super.render(f);
      }
    }
    M.kind = "finally";
    class F {
      constructor(f, b = {}) {
        this._values = {}, this._blockStarts = [], this._constants = {}, this.opts = { ...b, _n: b.lines ? `
` : "" }, this._extScope = f, this._scope = new a.Scope({ parent: f }), this._nodes = [new E()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(f) {
        return this._scope.name(f);
      }
      // reserves unique name in the external scope
      scopeName(f) {
        return this._extScope.name(f);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(f, b) {
        const C = this._extScope.value(f, b);
        return (this._values[C.prefix] || (this._values[C.prefix] = /* @__PURE__ */ new Set())).add(C), C;
      }
      getScopeValue(f, b) {
        return this._extScope.getValue(f, b);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(f) {
        return this._extScope.scopeRefs(f, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(f, b, C, K) {
        const G = this._scope.toName(b);
        return C !== void 0 && K && (this._constants[G.str] = C), this._leafNode(new u(f, G, C)), G;
      }
      // `const` declaration (`var` in es5 mode)
      const(f, b, C) {
        return this._def(a.varKinds.const, f, b, C);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(f, b, C) {
        return this._def(a.varKinds.let, f, b, C);
      }
      // `var` declaration with optional assignment
      var(f, b, C) {
        return this._def(a.varKinds.var, f, b, C);
      }
      // assignment code
      assign(f, b, C) {
        return this._leafNode(new o(f, b, C));
      }
      // `+=` code
      add(f, b) {
        return this._leafNode(new c(f, e.operators.ADD, b));
      }
      // appends passed SafeExpr to code or executes Block
      code(f) {
        return typeof f == "function" ? f() : f !== t.nil && this._leafNode(new $(f)), this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...f) {
        const b = ["{"];
        for (const [C, K] of f)
          b.length > 1 && b.push(","), b.push(C), (C !== K || this.opts.es5) && (b.push(":"), (0, t.addCodeArg)(b, K));
        return b.push("}"), new t._Code(b);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(f, b, C) {
        if (this._blockNode(new y(f)), b && C)
          this.code(b).else().code(C).endIf();
        else if (b)
          this.code(b).endIf();
        else if (C)
          throw new Error('CodeGen: "else" body without "then" body');
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(f) {
        return this._elseNode(new y(f));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new h());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(y, h);
      }
      _for(f, b) {
        return this._blockNode(f), b && this.code(b).endFor(), this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(f, b) {
        return this._for(new p(f), b);
      }
      // `for` statement for a range of values
      forRange(f, b, C, K, G = this.opts.es5 ? a.varKinds.var : a.varKinds.let) {
        const Q = this._scope.toName(f);
        return this._for(new w(G, Q, b, C), () => K(Q));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(f, b, C, K = a.varKinds.const) {
        const G = this._scope.toName(f);
        if (this.opts.es5) {
          const Q = b instanceof t.Name ? b : this.var("_arr", b);
          return this.forRange("_i", 0, (0, t._)`${Q}.length`, (x) => {
            this.var(G, (0, t._)`${Q}[${x}]`), C(G);
          });
        }
        return this._for(new m("of", K, G, b), () => C(G));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(f, b, C, K = this.opts.es5 ? a.varKinds.var : a.varKinds.const) {
        if (this.opts.ownProperties)
          return this.forOf(f, (0, t._)`Object.keys(${b})`, C);
        const G = this._scope.toName(f);
        return this._for(new m("in", K, G, b), () => C(G));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(i);
      }
      // `label` statement
      label(f) {
        return this._leafNode(new d(f));
      }
      // `break` statement
      break(f) {
        return this._leafNode(new s(f));
      }
      // `return` statement
      return(f) {
        const b = new P();
        if (this._blockNode(b), this.code(f), b.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(P);
      }
      // `try` statement
      try(f, b, C) {
        if (!b && !C)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const K = new I();
        if (this._blockNode(K), this.code(f), b) {
          const G = this.name("e");
          this._currNode = K.catch = new A(G), b(G);
        }
        return C && (this._currNode = K.finally = new M(), this.code(C)), this._endBlockNode(A, M);
      }
      // `throw` statement
      throw(f) {
        return this._leafNode(new _(f));
      }
      // start self-balancing block
      block(f, b) {
        return this._blockStarts.push(this._nodes.length), f && this.code(f).endBlock(b), this;
      }
      // end the current self-balancing block
      endBlock(f) {
        const b = this._blockStarts.pop();
        if (b === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const C = this._nodes.length - b;
        if (C < 0 || f !== void 0 && C !== f)
          throw new Error(`CodeGen: wrong number of nodes: ${C} vs ${f} expected`);
        return this._nodes.length = b, this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(f, b = t.nil, C, K) {
        return this._blockNode(new g(f, b, C)), K && this.code(K).endFunc(), this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(g);
      }
      optimize(f = 1) {
        for (; f-- > 0; )
          this._root.optimizeNodes(), this._root.optimizeNames(this._root.names, this._constants);
      }
      _leafNode(f) {
        return this._currNode.nodes.push(f), this;
      }
      _blockNode(f) {
        this._currNode.nodes.push(f), this._nodes.push(f);
      }
      _endBlockNode(f, b) {
        const C = this._currNode;
        if (C instanceof f || b && C instanceof b)
          return this._nodes.pop(), this;
        throw new Error(`CodeGen: not in block "${b ? `${f.kind}/${b.kind}` : f.kind}"`);
      }
      _elseNode(f) {
        const b = this._currNode;
        if (!(b instanceof y))
          throw new Error('CodeGen: "else" without "if"');
        return this._currNode = b.else = f, this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const f = this._nodes;
        return f[f.length - 1];
      }
      set _currNode(f) {
        const b = this._nodes;
        b[b.length - 1] = f;
      }
    }
    e.CodeGen = F;
    function W(O, f) {
      for (const b in f)
        O[b] = (O[b] || 0) + (f[b] || 0);
      return O;
    }
    function B(O, f) {
      return f instanceof t._CodeOrName ? W(O, f.names) : O;
    }
    function V(O, f, b) {
      if (O instanceof t.Name)
        return C(O);
      if (!K(O))
        return O;
      return new t._Code(O._items.reduce((G, Q) => (Q instanceof t.Name && (Q = C(Q)), Q instanceof t._Code ? G.push(...Q._items) : G.push(Q), G), []));
      function C(G) {
        const Q = b[G.str];
        return Q === void 0 || f[G.str] !== 1 ? G : (delete f[G.str], Q);
      }
      function K(G) {
        return G instanceof t._Code && G._items.some((Q) => Q instanceof t.Name && f[Q.str] === 1 && b[Q.str] !== void 0);
      }
    }
    function z(O, f) {
      for (const b in f)
        O[b] = (O[b] || 0) - (f[b] || 0);
    }
    function Y(O) {
      return typeof O == "boolean" || typeof O == "number" || O === null ? !O : (0, t._)`!${k(O)}`;
    }
    e.not = Y;
    const J = R(e.operators.AND);
    function D(...O) {
      return O.reduce(J);
    }
    e.and = D;
    const U = R(e.operators.OR);
    function j(...O) {
      return O.reduce(U);
    }
    e.or = j;
    function R(O) {
      return (f, b) => f === t.nil ? b : b === t.nil ? f : (0, t._)`${k(f)} ${O} ${k(b)}`;
    }
    function k(O) {
      return O instanceof t.Name ? O : (0, t._)`(${O})`;
    }
  })(rs)), rs;
}
var te = {}, ti;
function ie() {
  if (ti) return te;
  ti = 1, Object.defineProperty(te, "__esModule", { value: !0 }), te.checkStrictMode = te.getErrorPath = te.Type = te.useFunc = te.setEvaluated = te.evaluatedPropsToName = te.mergeEvaluated = te.eachItem = te.unescapeJsonPointer = te.escapeJsonPointer = te.escapeFragment = te.unescapeFragment = te.schemaRefOrVal = te.schemaHasRulesButRef = te.schemaHasRules = te.checkUnknownRules = te.alwaysValidSchema = te.toHash = void 0;
  const e = re(), t = wn();
  function a(m) {
    const g = {};
    for (const P of m)
      g[P] = !0;
    return g;
  }
  te.toHash = a;
  function r(m, g) {
    return typeof g == "boolean" ? g : Object.keys(g).length === 0 ? !0 : (l(m, g), !n(g, m.self.RULES.all));
  }
  te.alwaysValidSchema = r;
  function l(m, g = m.schema) {
    const { opts: P, self: I } = m;
    if (!P.strictSchema || typeof g == "boolean")
      return;
    const A = I.RULES.keywords;
    for (const M in g)
      A[M] || w(m, `unknown keyword: "${M}"`);
  }
  te.checkUnknownRules = l;
  function n(m, g) {
    if (typeof m == "boolean")
      return !m;
    for (const P in m)
      if (g[P])
        return !0;
    return !1;
  }
  te.schemaHasRules = n;
  function u(m, g) {
    if (typeof m == "boolean")
      return !m;
    for (const P in m)
      if (P !== "$ref" && g.all[P])
        return !0;
    return !1;
  }
  te.schemaHasRulesButRef = u;
  function o({ topSchemaRef: m, schemaPath: g }, P, I, A) {
    if (!A) {
      if (typeof P == "number" || typeof P == "boolean")
        return P;
      if (typeof P == "string")
        return (0, e._)`${P}`;
    }
    return (0, e._)`${m}${g}${(0, e.getProperty)(I)}`;
  }
  te.schemaRefOrVal = o;
  function c(m) {
    return _(decodeURIComponent(m));
  }
  te.unescapeFragment = c;
  function d(m) {
    return encodeURIComponent(s(m));
  }
  te.escapeFragment = d;
  function s(m) {
    return typeof m == "number" ? `${m}` : m.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  te.escapeJsonPointer = s;
  function _(m) {
    return m.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  te.unescapeJsonPointer = _;
  function $(m, g) {
    if (Array.isArray(m))
      for (const P of m)
        g(P);
    else
      g(m);
  }
  te.eachItem = $;
  function v({ mergeNames: m, mergeToName: g, mergeValues: P, resultToName: I }) {
    return (A, M, F, W) => {
      const B = F === void 0 ? M : F instanceof e.Name ? (M instanceof e.Name ? m(A, M, F) : g(A, M, F), F) : M instanceof e.Name ? (g(A, F, M), M) : P(M, F);
      return W === e.Name && !(B instanceof e.Name) ? I(A, B) : B;
    };
  }
  te.mergeEvaluated = {
    props: v({
      mergeNames: (m, g, P) => m.if((0, e._)`${P} !== true && ${g} !== undefined`, () => {
        m.if((0, e._)`${g} === true`, () => m.assign(P, !0), () => m.assign(P, (0, e._)`${P} || {}`).code((0, e._)`Object.assign(${P}, ${g})`));
      }),
      mergeToName: (m, g, P) => m.if((0, e._)`${P} !== true`, () => {
        g === !0 ? m.assign(P, !0) : (m.assign(P, (0, e._)`${P} || {}`), E(m, P, g));
      }),
      mergeValues: (m, g) => m === !0 ? !0 : { ...m, ...g },
      resultToName: S
    }),
    items: v({
      mergeNames: (m, g, P) => m.if((0, e._)`${P} !== true && ${g} !== undefined`, () => m.assign(P, (0, e._)`${g} === true ? true : ${P} > ${g} ? ${P} : ${g}`)),
      mergeToName: (m, g, P) => m.if((0, e._)`${P} !== true`, () => m.assign(P, g === !0 ? !0 : (0, e._)`${P} > ${g} ? ${P} : ${g}`)),
      mergeValues: (m, g) => m === !0 ? !0 : Math.max(m, g),
      resultToName: (m, g) => m.var("items", g)
    })
  };
  function S(m, g) {
    if (g === !0)
      return m.var("props", !0);
    const P = m.var("props", (0, e._)`{}`);
    return g !== void 0 && E(m, P, g), P;
  }
  te.evaluatedPropsToName = S;
  function E(m, g, P) {
    Object.keys(P).forEach((I) => m.assign((0, e._)`${g}${(0, e.getProperty)(I)}`, !0));
  }
  te.setEvaluated = E;
  const h = {};
  function y(m, g) {
    return m.scopeValue("func", {
      ref: g,
      code: h[g.code] || (h[g.code] = new t._Code(g.code))
    });
  }
  te.useFunc = y;
  var i;
  (function(m) {
    m[m.Num = 0] = "Num", m[m.Str = 1] = "Str";
  })(i || (te.Type = i = {}));
  function p(m, g, P) {
    if (m instanceof e.Name) {
      const I = g === i.Num;
      return P ? I ? (0, e._)`"[" + ${m} + "]"` : (0, e._)`"['" + ${m} + "']"` : I ? (0, e._)`"/" + ${m}` : (0, e._)`"/" + ${m}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return P ? (0, e.getProperty)(m).toString() : "/" + s(m);
  }
  te.getErrorPath = p;
  function w(m, g, P = m.opts.strictSchema) {
    if (P) {
      if (g = `strict mode: ${g}`, P === !0)
        throw new Error(g);
      m.self.logger.warn(g);
    }
  }
  return te.checkStrictMode = w, te;
}
var jr = {}, ri;
function et() {
  if (ri) return jr;
  ri = 1, Object.defineProperty(jr, "__esModule", { value: !0 });
  const e = re(), t = {
    // validation function arguments
    data: new e.Name("data"),
    // data passed to validation function
    // args passed from referencing schema
    valCxt: new e.Name("valCxt"),
    // validation/data context - should not be used directly, it is destructured to the names below
    instancePath: new e.Name("instancePath"),
    parentData: new e.Name("parentData"),
    parentDataProperty: new e.Name("parentDataProperty"),
    rootData: new e.Name("rootData"),
    // root data - same as the data passed to the first/top validation function
    dynamicAnchors: new e.Name("dynamicAnchors"),
    // used to support recursiveRef and dynamicRef
    // function scoped variables
    vErrors: new e.Name("vErrors"),
    // null or array of validation errors
    errors: new e.Name("errors"),
    // counter of validation errors
    this: new e.Name("this"),
    // "globals"
    self: new e.Name("self"),
    scope: new e.Name("scope"),
    // JTD serialize/parse name for JSON string and position
    json: new e.Name("json"),
    jsonPos: new e.Name("jsonPos"),
    jsonLen: new e.Name("jsonLen"),
    jsonPart: new e.Name("jsonPart")
  };
  return jr.default = t, jr;
}
var ni;
function Tn() {
  return ni || (ni = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.extendErrors = e.resetErrorsCount = e.reportExtraError = e.reportError = e.keyword$DataError = e.keywordError = void 0;
    const t = re(), a = ie(), r = et();
    e.keywordError = {
      message: ({ keyword: h }) => (0, t.str)`must pass "${h}" keyword validation`
    }, e.keyword$DataError = {
      message: ({ keyword: h, schemaType: y }) => y ? (0, t.str)`"${h}" keyword must be ${y} ($data)` : (0, t.str)`"${h}" keyword is invalid ($data)`
    };
    function l(h, y = e.keywordError, i, p) {
      const { it: w } = h, { gen: m, compositeRule: g, allErrors: P } = w, I = _(h, y, i);
      p ?? (g || P) ? c(m, I) : d(w, (0, t._)`[${I}]`);
    }
    e.reportError = l;
    function n(h, y = e.keywordError, i) {
      const { it: p } = h, { gen: w, compositeRule: m, allErrors: g } = p, P = _(h, y, i);
      c(w, P), m || g || d(p, r.default.vErrors);
    }
    e.reportExtraError = n;
    function u(h, y) {
      h.assign(r.default.errors, y), h.if((0, t._)`${r.default.vErrors} !== null`, () => h.if(y, () => h.assign((0, t._)`${r.default.vErrors}.length`, y), () => h.assign(r.default.vErrors, null)));
    }
    e.resetErrorsCount = u;
    function o({ gen: h, keyword: y, schemaValue: i, data: p, errsCount: w, it: m }) {
      if (w === void 0)
        throw new Error("ajv implementation error");
      const g = h.name("err");
      h.forRange("i", w, r.default.errors, (P) => {
        h.const(g, (0, t._)`${r.default.vErrors}[${P}]`), h.if((0, t._)`${g}.instancePath === undefined`, () => h.assign((0, t._)`${g}.instancePath`, (0, t.strConcat)(r.default.instancePath, m.errorPath))), h.assign((0, t._)`${g}.schemaPath`, (0, t.str)`${m.errSchemaPath}/${y}`), m.opts.verbose && (h.assign((0, t._)`${g}.schema`, i), h.assign((0, t._)`${g}.data`, p));
      });
    }
    e.extendErrors = o;
    function c(h, y) {
      const i = h.const("err", y);
      h.if((0, t._)`${r.default.vErrors} === null`, () => h.assign(r.default.vErrors, (0, t._)`[${i}]`), (0, t._)`${r.default.vErrors}.push(${i})`), h.code((0, t._)`${r.default.errors}++`);
    }
    function d(h, y) {
      const { gen: i, validateName: p, schemaEnv: w } = h;
      w.$async ? i.throw((0, t._)`new ${h.ValidationError}(${y})`) : (i.assign((0, t._)`${p}.errors`, y), i.return(!1));
    }
    const s = {
      keyword: new t.Name("keyword"),
      schemaPath: new t.Name("schemaPath"),
      // also used in JTD errors
      params: new t.Name("params"),
      propertyName: new t.Name("propertyName"),
      message: new t.Name("message"),
      schema: new t.Name("schema"),
      parentSchema: new t.Name("parentSchema")
    };
    function _(h, y, i) {
      const { createErrors: p } = h.it;
      return p === !1 ? (0, t._)`{}` : $(h, y, i);
    }
    function $(h, y, i = {}) {
      const { gen: p, it: w } = h, m = [
        v(w, i),
        S(h, i)
      ];
      return E(h, y, m), p.object(...m);
    }
    function v({ errorPath: h }, { instancePath: y }) {
      const i = y ? (0, t.str)`${h}${(0, a.getErrorPath)(y, a.Type.Str)}` : h;
      return [r.default.instancePath, (0, t.strConcat)(r.default.instancePath, i)];
    }
    function S({ keyword: h, it: { errSchemaPath: y } }, { schemaPath: i, parentSchema: p }) {
      let w = p ? y : (0, t.str)`${y}/${h}`;
      return i && (w = (0, t.str)`${w}${(0, a.getErrorPath)(i, a.Type.Str)}`), [s.schemaPath, w];
    }
    function E(h, { params: y, message: i }, p) {
      const { keyword: w, data: m, schemaValue: g, it: P } = h, { opts: I, propertyName: A, topSchemaRef: M, schemaPath: F } = P;
      p.push([s.keyword, w], [s.params, typeof y == "function" ? y(h) : y || (0, t._)`{}`]), I.messages && p.push([s.message, typeof i == "function" ? i(h) : i]), I.verbose && p.push([s.schema, g], [s.parentSchema, (0, t._)`${M}${F}`], [r.default.data, m]), A && p.push([s.propertyName, A]);
    }
  })(ts)), ts;
}
var si;
function ld() {
  if (si) return lt;
  si = 1, Object.defineProperty(lt, "__esModule", { value: !0 }), lt.boolOrEmptySchema = lt.topBoolOrEmptySchema = void 0;
  const e = Tn(), t = re(), a = et(), r = {
    message: "boolean schema is false"
  };
  function l(o) {
    const { gen: c, schema: d, validateName: s } = o;
    d === !1 ? u(o, !1) : typeof d == "object" && d.$async === !0 ? c.return(a.default.data) : (c.assign((0, t._)`${s}.errors`, null), c.return(!0));
  }
  lt.topBoolOrEmptySchema = l;
  function n(o, c) {
    const { gen: d, schema: s } = o;
    s === !1 ? (d.var(c, !1), u(o)) : d.var(c, !0);
  }
  lt.boolOrEmptySchema = n;
  function u(o, c) {
    const { gen: d, data: s } = o, _ = {
      gen: d,
      keyword: "false schema",
      data: s,
      schema: !1,
      schemaCode: !1,
      schemaValue: !1,
      params: {},
      it: o
    };
    (0, e.reportError)(_, r, void 0, c);
  }
  return lt;
}
var we = {}, dt = {}, ai;
function yu() {
  if (ai) return dt;
  ai = 1, Object.defineProperty(dt, "__esModule", { value: !0 }), dt.getRules = dt.isJSONType = void 0;
  const e = ["string", "number", "integer", "boolean", "null", "object", "array"], t = new Set(e);
  function a(l) {
    return typeof l == "string" && t.has(l);
  }
  dt.isJSONType = a;
  function r() {
    const l = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...l, integer: !0, boolean: !0, null: !0 },
      rules: [{ rules: [] }, l.number, l.string, l.array, l.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  return dt.getRules = r, dt;
}
var Be = {}, oi;
function gu() {
  if (oi) return Be;
  oi = 1, Object.defineProperty(Be, "__esModule", { value: !0 }), Be.shouldUseRule = Be.shouldUseGroup = Be.schemaHasRulesForType = void 0;
  function e({ schema: r, self: l }, n) {
    const u = l.RULES.types[n];
    return u && u !== !0 && t(r, u);
  }
  Be.schemaHasRulesForType = e;
  function t(r, l) {
    return l.rules.some((n) => a(r, n));
  }
  Be.shouldUseGroup = t;
  function a(r, l) {
    var n;
    return r[l.keyword] !== void 0 || ((n = l.definition.implements) === null || n === void 0 ? void 0 : n.some((u) => r[u] !== void 0));
  }
  return Be.shouldUseRule = a, Be;
}
var ii;
function En() {
  if (ii) return we;
  ii = 1, Object.defineProperty(we, "__esModule", { value: !0 }), we.reportTypeError = we.checkDataTypes = we.checkDataType = we.coerceAndCheckDataType = we.getJSONTypes = we.getSchemaTypes = we.DataType = void 0;
  const e = yu(), t = gu(), a = Tn(), r = re(), l = ie();
  var n;
  (function(i) {
    i[i.Correct = 0] = "Correct", i[i.Wrong = 1] = "Wrong";
  })(n || (we.DataType = n = {}));
  function u(i) {
    const p = o(i.type);
    if (p.includes("null")) {
      if (i.nullable === !1)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!p.length && i.nullable !== void 0)
        throw new Error('"nullable" cannot be used without "type"');
      i.nullable === !0 && p.push("null");
    }
    return p;
  }
  we.getSchemaTypes = u;
  function o(i) {
    const p = Array.isArray(i) ? i : i ? [i] : [];
    if (p.every(e.isJSONType))
      return p;
    throw new Error("type must be JSONType or JSONType[]: " + p.join(","));
  }
  we.getJSONTypes = o;
  function c(i, p) {
    const { gen: w, data: m, opts: g } = i, P = s(p, g.coerceTypes), I = p.length > 0 && !(P.length === 0 && p.length === 1 && (0, t.schemaHasRulesForType)(i, p[0]));
    if (I) {
      const A = S(p, m, g.strictNumbers, n.Wrong);
      w.if(A, () => {
        P.length ? _(i, p, P) : h(i);
      });
    }
    return I;
  }
  we.coerceAndCheckDataType = c;
  const d = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
  function s(i, p) {
    return p ? i.filter((w) => d.has(w) || p === "array" && w === "array") : [];
  }
  function _(i, p, w) {
    const { gen: m, data: g, opts: P } = i, I = m.let("dataType", (0, r._)`typeof ${g}`), A = m.let("coerced", (0, r._)`undefined`);
    P.coerceTypes === "array" && m.if((0, r._)`${I} == 'object' && Array.isArray(${g}) && ${g}.length == 1`, () => m.assign(g, (0, r._)`${g}[0]`).assign(I, (0, r._)`typeof ${g}`).if(S(p, g, P.strictNumbers), () => m.assign(A, g))), m.if((0, r._)`${A} !== undefined`);
    for (const F of w)
      (d.has(F) || F === "array" && P.coerceTypes === "array") && M(F);
    m.else(), h(i), m.endIf(), m.if((0, r._)`${A} !== undefined`, () => {
      m.assign(g, A), $(i, A);
    });
    function M(F) {
      switch (F) {
        case "string":
          m.elseIf((0, r._)`${I} == "number" || ${I} == "boolean"`).assign(A, (0, r._)`"" + ${g}`).elseIf((0, r._)`${g} === null`).assign(A, (0, r._)`""`);
          return;
        case "number":
          m.elseIf((0, r._)`${I} == "boolean" || ${g} === null
              || (${I} == "string" && ${g} && ${g} == +${g})`).assign(A, (0, r._)`+${g}`);
          return;
        case "integer":
          m.elseIf((0, r._)`${I} === "boolean" || ${g} === null
              || (${I} === "string" && ${g} && ${g} == +${g} && !(${g} % 1))`).assign(A, (0, r._)`+${g}`);
          return;
        case "boolean":
          m.elseIf((0, r._)`${g} === "false" || ${g} === 0 || ${g} === null`).assign(A, !1).elseIf((0, r._)`${g} === "true" || ${g} === 1`).assign(A, !0);
          return;
        case "null":
          m.elseIf((0, r._)`${g} === "" || ${g} === 0 || ${g} === false`), m.assign(A, null);
          return;
        case "array":
          m.elseIf((0, r._)`${I} === "string" || ${I} === "number"
              || ${I} === "boolean" || ${g} === null`).assign(A, (0, r._)`[${g}]`);
      }
    }
  }
  function $({ gen: i, parentData: p, parentDataProperty: w }, m) {
    i.if((0, r._)`${p} !== undefined`, () => i.assign((0, r._)`${p}[${w}]`, m));
  }
  function v(i, p, w, m = n.Correct) {
    const g = m === n.Correct ? r.operators.EQ : r.operators.NEQ;
    let P;
    switch (i) {
      case "null":
        return (0, r._)`${p} ${g} null`;
      case "array":
        P = (0, r._)`Array.isArray(${p})`;
        break;
      case "object":
        P = (0, r._)`${p} && typeof ${p} == "object" && !Array.isArray(${p})`;
        break;
      case "integer":
        P = I((0, r._)`!(${p} % 1) && !isNaN(${p})`);
        break;
      case "number":
        P = I();
        break;
      default:
        return (0, r._)`typeof ${p} ${g} ${i}`;
    }
    return m === n.Correct ? P : (0, r.not)(P);
    function I(A = r.nil) {
      return (0, r.and)((0, r._)`typeof ${p} == "number"`, A, w ? (0, r._)`isFinite(${p})` : r.nil);
    }
  }
  we.checkDataType = v;
  function S(i, p, w, m) {
    if (i.length === 1)
      return v(i[0], p, w, m);
    let g;
    const P = (0, l.toHash)(i);
    if (P.array && P.object) {
      const I = (0, r._)`typeof ${p} != "object"`;
      g = P.null ? I : (0, r._)`!${p} || ${I}`, delete P.null, delete P.array, delete P.object;
    } else
      g = r.nil;
    P.number && delete P.integer;
    for (const I in P)
      g = (0, r.and)(g, v(I, p, w, m));
    return g;
  }
  we.checkDataTypes = S;
  const E = {
    message: ({ schema: i }) => `must be ${i}`,
    params: ({ schema: i, schemaValue: p }) => typeof i == "string" ? (0, r._)`{type: ${i}}` : (0, r._)`{type: ${p}}`
  };
  function h(i) {
    const p = y(i);
    (0, a.reportError)(p, E);
  }
  we.reportTypeError = h;
  function y(i) {
    const { gen: p, data: w, schema: m } = i, g = (0, l.schemaRefOrVal)(i, m, "type");
    return {
      gen: p,
      keyword: "type",
      data: w,
      schema: m.type,
      schemaCode: g,
      schemaValue: g,
      parentSchema: m,
      params: {},
      it: i
    };
  }
  return we;
}
var bt = {}, ci;
function dd() {
  if (ci) return bt;
  ci = 1, Object.defineProperty(bt, "__esModule", { value: !0 }), bt.assignDefaults = void 0;
  const e = re(), t = ie();
  function a(l, n) {
    const { properties: u, items: o } = l.schema;
    if (n === "object" && u)
      for (const c in u)
        r(l, c, u[c].default);
    else n === "array" && Array.isArray(o) && o.forEach((c, d) => r(l, d, c.default));
  }
  bt.assignDefaults = a;
  function r(l, n, u) {
    const { gen: o, compositeRule: c, data: d, opts: s } = l;
    if (u === void 0)
      return;
    const _ = (0, e._)`${d}${(0, e.getProperty)(n)}`;
    if (c) {
      (0, t.checkStrictMode)(l, `default is ignored for: ${_}`);
      return;
    }
    let $ = (0, e._)`${_} === undefined`;
    s.useDefaults === "empty" && ($ = (0, e._)`${$} || ${_} === null || ${_} === ""`), o.if($, (0, e._)`${_} = ${(0, e.stringify)(u)}`);
  }
  return bt;
}
var Me = {}, fe = {}, ui;
function Ve() {
  if (ui) return fe;
  ui = 1, Object.defineProperty(fe, "__esModule", { value: !0 }), fe.validateUnion = fe.validateArray = fe.usePattern = fe.callValidateCode = fe.schemaProperties = fe.allSchemaProperties = fe.noPropertyInData = fe.propertyInData = fe.isOwnProperty = fe.hasPropFunc = fe.reportMissingProp = fe.checkMissingProp = fe.checkReportMissingProp = void 0;
  const e = re(), t = ie(), a = et(), r = ie();
  function l(i, p) {
    const { gen: w, data: m, it: g } = i;
    w.if(s(w, m, p, g.opts.ownProperties), () => {
      i.setParams({ missingProperty: (0, e._)`${p}` }, !0), i.error();
    });
  }
  fe.checkReportMissingProp = l;
  function n({ gen: i, data: p, it: { opts: w } }, m, g) {
    return (0, e.or)(...m.map((P) => (0, e.and)(s(i, p, P, w.ownProperties), (0, e._)`${g} = ${P}`)));
  }
  fe.checkMissingProp = n;
  function u(i, p) {
    i.setParams({ missingProperty: p }, !0), i.error();
  }
  fe.reportMissingProp = u;
  function o(i) {
    return i.scopeValue("func", {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref: Object.prototype.hasOwnProperty,
      code: (0, e._)`Object.prototype.hasOwnProperty`
    });
  }
  fe.hasPropFunc = o;
  function c(i, p, w) {
    return (0, e._)`${o(i)}.call(${p}, ${w})`;
  }
  fe.isOwnProperty = c;
  function d(i, p, w, m) {
    const g = (0, e._)`${p}${(0, e.getProperty)(w)} !== undefined`;
    return m ? (0, e._)`${g} && ${c(i, p, w)}` : g;
  }
  fe.propertyInData = d;
  function s(i, p, w, m) {
    const g = (0, e._)`${p}${(0, e.getProperty)(w)} === undefined`;
    return m ? (0, e.or)(g, (0, e.not)(c(i, p, w))) : g;
  }
  fe.noPropertyInData = s;
  function _(i) {
    return i ? Object.keys(i).filter((p) => p !== "__proto__") : [];
  }
  fe.allSchemaProperties = _;
  function $(i, p) {
    return _(p).filter((w) => !(0, t.alwaysValidSchema)(i, p[w]));
  }
  fe.schemaProperties = $;
  function v({ schemaCode: i, data: p, it: { gen: w, topSchemaRef: m, schemaPath: g, errorPath: P }, it: I }, A, M, F) {
    const W = F ? (0, e._)`${i}, ${p}, ${m}${g}` : p, B = [
      [a.default.instancePath, (0, e.strConcat)(a.default.instancePath, P)],
      [a.default.parentData, I.parentData],
      [a.default.parentDataProperty, I.parentDataProperty],
      [a.default.rootData, a.default.rootData]
    ];
    I.opts.dynamicRef && B.push([a.default.dynamicAnchors, a.default.dynamicAnchors]);
    const V = (0, e._)`${W}, ${w.object(...B)}`;
    return M !== e.nil ? (0, e._)`${A}.call(${M}, ${V})` : (0, e._)`${A}(${V})`;
  }
  fe.callValidateCode = v;
  const S = (0, e._)`new RegExp`;
  function E({ gen: i, it: { opts: p } }, w) {
    const m = p.unicodeRegExp ? "u" : "", { regExp: g } = p.code, P = g(w, m);
    return i.scopeValue("pattern", {
      key: P.toString(),
      ref: P,
      code: (0, e._)`${g.code === "new RegExp" ? S : (0, r.useFunc)(i, g)}(${w}, ${m})`
    });
  }
  fe.usePattern = E;
  function h(i) {
    const { gen: p, data: w, keyword: m, it: g } = i, P = p.name("valid");
    if (g.allErrors) {
      const A = p.let("valid", !0);
      return I(() => p.assign(A, !1)), A;
    }
    return p.var(P, !0), I(() => p.break()), P;
    function I(A) {
      const M = p.const("len", (0, e._)`${w}.length`);
      p.forRange("i", 0, M, (F) => {
        i.subschema({
          keyword: m,
          dataProp: F,
          dataPropType: t.Type.Num
        }, P), p.if((0, e.not)(P), A);
      });
    }
  }
  fe.validateArray = h;
  function y(i) {
    const { gen: p, schema: w, keyword: m, it: g } = i;
    if (!Array.isArray(w))
      throw new Error("ajv implementation error");
    if (w.some((M) => (0, t.alwaysValidSchema)(g, M)) && !g.opts.unevaluated)
      return;
    const I = p.let("valid", !1), A = p.name("_valid");
    p.block(() => w.forEach((M, F) => {
      const W = i.subschema({
        keyword: m,
        schemaProp: F,
        compositeRule: !0
      }, A);
      p.assign(I, (0, e._)`${I} || ${A}`), i.mergeValidEvaluated(W, A) || p.if((0, e.not)(I));
    })), i.result(I, () => i.reset(), () => i.error(!0));
  }
  return fe.validateUnion = y, fe;
}
var li;
function fd() {
  if (li) return Me;
  li = 1, Object.defineProperty(Me, "__esModule", { value: !0 }), Me.validateKeywordUsage = Me.validSchemaType = Me.funcKeywordCode = Me.macroKeywordCode = void 0;
  const e = re(), t = et(), a = Ve(), r = Tn();
  function l($, v) {
    const { gen: S, keyword: E, schema: h, parentSchema: y, it: i } = $, p = v.macro.call(i.self, h, y, i), w = d(S, E, p);
    i.opts.validateSchema !== !1 && i.self.validateSchema(p, !0);
    const m = S.name("valid");
    $.subschema({
      schema: p,
      schemaPath: e.nil,
      errSchemaPath: `${i.errSchemaPath}/${E}`,
      topSchemaRef: w,
      compositeRule: !0
    }, m), $.pass(m, () => $.error(!0));
  }
  Me.macroKeywordCode = l;
  function n($, v) {
    var S;
    const { gen: E, keyword: h, schema: y, parentSchema: i, $data: p, it: w } = $;
    c(w, v);
    const m = !p && v.compile ? v.compile.call(w.self, y, i, w) : v.validate, g = d(E, h, m), P = E.let("valid");
    $.block$data(P, I), $.ok((S = v.valid) !== null && S !== void 0 ? S : P);
    function I() {
      if (v.errors === !1)
        F(), v.modifying && u($), W(() => $.error());
      else {
        const B = v.async ? A() : M();
        v.modifying && u($), W(() => o($, B));
      }
    }
    function A() {
      const B = E.let("ruleErrs", null);
      return E.try(() => F((0, e._)`await `), (V) => E.assign(P, !1).if((0, e._)`${V} instanceof ${w.ValidationError}`, () => E.assign(B, (0, e._)`${V}.errors`), () => E.throw(V))), B;
    }
    function M() {
      const B = (0, e._)`${g}.errors`;
      return E.assign(B, null), F(e.nil), B;
    }
    function F(B = v.async ? (0, e._)`await ` : e.nil) {
      const V = w.opts.passContext ? t.default.this : t.default.self, z = !("compile" in v && !p || v.schema === !1);
      E.assign(P, (0, e._)`${B}${(0, a.callValidateCode)($, g, V, z)}`, v.modifying);
    }
    function W(B) {
      var V;
      E.if((0, e.not)((V = v.valid) !== null && V !== void 0 ? V : P), B);
    }
  }
  Me.funcKeywordCode = n;
  function u($) {
    const { gen: v, data: S, it: E } = $;
    v.if(E.parentData, () => v.assign(S, (0, e._)`${E.parentData}[${E.parentDataProperty}]`));
  }
  function o($, v) {
    const { gen: S } = $;
    S.if((0, e._)`Array.isArray(${v})`, () => {
      S.assign(t.default.vErrors, (0, e._)`${t.default.vErrors} === null ? ${v} : ${t.default.vErrors}.concat(${v})`).assign(t.default.errors, (0, e._)`${t.default.vErrors}.length`), (0, r.extendErrors)($);
    }, () => $.error());
  }
  function c({ schemaEnv: $ }, v) {
    if (v.async && !$.$async)
      throw new Error("async keyword in sync schema");
  }
  function d($, v, S) {
    if (S === void 0)
      throw new Error(`keyword "${v}" failed to compile`);
    return $.scopeValue("keyword", typeof S == "function" ? { ref: S } : { ref: S, code: (0, e.stringify)(S) });
  }
  function s($, v, S = !1) {
    return !v.length || v.some((E) => E === "array" ? Array.isArray($) : E === "object" ? $ && typeof $ == "object" && !Array.isArray($) : typeof $ == E || S && typeof $ > "u");
  }
  Me.validSchemaType = s;
  function _({ schema: $, opts: v, self: S, errSchemaPath: E }, h, y) {
    if (Array.isArray(h.keyword) ? !h.keyword.includes(y) : h.keyword !== y)
      throw new Error("ajv implementation error");
    const i = h.dependencies;
    if (i != null && i.some((p) => !Object.prototype.hasOwnProperty.call($, p)))
      throw new Error(`parent schema must have dependencies of ${y}: ${i.join(",")}`);
    if (h.validateSchema && !h.validateSchema($[y])) {
      const w = `keyword "${y}" value is invalid at path "${E}": ` + S.errorsText(h.validateSchema.errors);
      if (v.validateSchema === "log")
        S.logger.error(w);
      else
        throw new Error(w);
    }
  }
  return Me.validateKeywordUsage = _, Me;
}
var Je = {}, di;
function hd() {
  if (di) return Je;
  di = 1, Object.defineProperty(Je, "__esModule", { value: !0 }), Je.extendSubschemaMode = Je.extendSubschemaData = Je.getSubschema = void 0;
  const e = re(), t = ie();
  function a(n, { keyword: u, schemaProp: o, schema: c, schemaPath: d, errSchemaPath: s, topSchemaRef: _ }) {
    if (u !== void 0 && c !== void 0)
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    if (u !== void 0) {
      const $ = n.schema[u];
      return o === void 0 ? {
        schema: $,
        schemaPath: (0, e._)`${n.schemaPath}${(0, e.getProperty)(u)}`,
        errSchemaPath: `${n.errSchemaPath}/${u}`
      } : {
        schema: $[o],
        schemaPath: (0, e._)`${n.schemaPath}${(0, e.getProperty)(u)}${(0, e.getProperty)(o)}`,
        errSchemaPath: `${n.errSchemaPath}/${u}/${(0, t.escapeFragment)(o)}`
      };
    }
    if (c !== void 0) {
      if (d === void 0 || s === void 0 || _ === void 0)
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      return {
        schema: c,
        schemaPath: d,
        topSchemaRef: _,
        errSchemaPath: s
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  Je.getSubschema = a;
  function r(n, u, { dataProp: o, dataPropType: c, data: d, dataTypes: s, propertyName: _ }) {
    if (d !== void 0 && o !== void 0)
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    const { gen: $ } = u;
    if (o !== void 0) {
      const { errorPath: S, dataPathArr: E, opts: h } = u, y = $.let("data", (0, e._)`${u.data}${(0, e.getProperty)(o)}`, !0);
      v(y), n.errorPath = (0, e.str)`${S}${(0, t.getErrorPath)(o, c, h.jsPropertySyntax)}`, n.parentDataProperty = (0, e._)`${o}`, n.dataPathArr = [...E, n.parentDataProperty];
    }
    if (d !== void 0) {
      const S = d instanceof e.Name ? d : $.let("data", d, !0);
      v(S), _ !== void 0 && (n.propertyName = _);
    }
    s && (n.dataTypes = s);
    function v(S) {
      n.data = S, n.dataLevel = u.dataLevel + 1, n.dataTypes = [], u.definedProperties = /* @__PURE__ */ new Set(), n.parentData = u.data, n.dataNames = [...u.dataNames, S];
    }
  }
  Je.extendSubschemaData = r;
  function l(n, { jtdDiscriminator: u, jtdMetadata: o, compositeRule: c, createErrors: d, allErrors: s }) {
    c !== void 0 && (n.compositeRule = c), d !== void 0 && (n.createErrors = d), s !== void 0 && (n.allErrors = s), n.jtdDiscriminator = u, n.jtdMetadata = o;
  }
  return Je.extendSubschemaMode = l, Je;
}
var be = {}, as = { exports: {} }, fi;
function pd() {
  if (fi) return as.exports;
  fi = 1;
  var e = as.exports = function(r, l, n) {
    typeof l == "function" && (n = l, l = {}), n = l.cb || n;
    var u = typeof n == "function" ? n : n.pre || function() {
    }, o = n.post || function() {
    };
    t(l, u, o, r, "", r);
  };
  e.keywords = {
    additionalItems: !0,
    items: !0,
    contains: !0,
    additionalProperties: !0,
    propertyNames: !0,
    not: !0,
    if: !0,
    then: !0,
    else: !0
  }, e.arrayKeywords = {
    items: !0,
    allOf: !0,
    anyOf: !0,
    oneOf: !0
  }, e.propsKeywords = {
    $defs: !0,
    definitions: !0,
    properties: !0,
    patternProperties: !0,
    dependencies: !0
  }, e.skipKeywords = {
    default: !0,
    enum: !0,
    const: !0,
    required: !0,
    maximum: !0,
    minimum: !0,
    exclusiveMaximum: !0,
    exclusiveMinimum: !0,
    multipleOf: !0,
    maxLength: !0,
    minLength: !0,
    pattern: !0,
    format: !0,
    maxItems: !0,
    minItems: !0,
    uniqueItems: !0,
    maxProperties: !0,
    minProperties: !0
  };
  function t(r, l, n, u, o, c, d, s, _, $) {
    if (u && typeof u == "object" && !Array.isArray(u)) {
      l(u, o, c, d, s, _, $);
      for (var v in u) {
        var S = u[v];
        if (Array.isArray(S)) {
          if (v in e.arrayKeywords)
            for (var E = 0; E < S.length; E++)
              t(r, l, n, S[E], o + "/" + v + "/" + E, c, o, v, u, E);
        } else if (v in e.propsKeywords) {
          if (S && typeof S == "object")
            for (var h in S)
              t(r, l, n, S[h], o + "/" + v + "/" + a(h), c, o, v, u, h);
        } else (v in e.keywords || r.allKeys && !(v in e.skipKeywords)) && t(r, l, n, S, o + "/" + v, c, o, v, u);
      }
      n(u, o, c, d, s, _, $);
    }
  }
  function a(r) {
    return r.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  return as.exports;
}
var hi;
function In() {
  if (hi) return be;
  hi = 1, Object.defineProperty(be, "__esModule", { value: !0 }), be.getSchemaRefs = be.resolveUrl = be.normalizeId = be._getFullPath = be.getFullPath = be.inlineRef = void 0;
  const e = ie(), t = Pn(), a = pd(), r = /* @__PURE__ */ new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function l(E, h = !0) {
    return typeof E == "boolean" ? !0 : h === !0 ? !u(E) : h ? o(E) <= h : !1;
  }
  be.inlineRef = l;
  const n = /* @__PURE__ */ new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function u(E) {
    for (const h in E) {
      if (n.has(h))
        return !0;
      const y = E[h];
      if (Array.isArray(y) && y.some(u) || typeof y == "object" && u(y))
        return !0;
    }
    return !1;
  }
  function o(E) {
    let h = 0;
    for (const y in E) {
      if (y === "$ref")
        return 1 / 0;
      if (h++, !r.has(y) && (typeof E[y] == "object" && (0, e.eachItem)(E[y], (i) => h += o(i)), h === 1 / 0))
        return 1 / 0;
    }
    return h;
  }
  function c(E, h = "", y) {
    y !== !1 && (h = _(h));
    const i = E.parse(h);
    return d(E, i);
  }
  be.getFullPath = c;
  function d(E, h) {
    return E.serialize(h).split("#")[0] + "#";
  }
  be._getFullPath = d;
  const s = /#\/?$/;
  function _(E) {
    return E ? E.replace(s, "") : "";
  }
  be.normalizeId = _;
  function $(E, h, y) {
    return y = _(y), E.resolve(h, y);
  }
  be.resolveUrl = $;
  const v = /^[a-z_][-a-z0-9._]*$/i;
  function S(E, h) {
    if (typeof E == "boolean")
      return {};
    const { schemaId: y, uriResolver: i } = this.opts, p = _(E[y] || h), w = { "": p }, m = c(i, p, !1), g = {}, P = /* @__PURE__ */ new Set();
    return a(E, { allKeys: !0 }, (M, F, W, B) => {
      if (B === void 0)
        return;
      const V = m + F;
      let z = w[B];
      typeof M[y] == "string" && (z = Y.call(this, M[y])), J.call(this, M.$anchor), J.call(this, M.$dynamicAnchor), w[F] = z;
      function Y(D) {
        const U = this.opts.uriResolver.resolve;
        if (D = _(z ? U(z, D) : D), P.has(D))
          throw A(D);
        P.add(D);
        let j = this.refs[D];
        return typeof j == "string" && (j = this.refs[j]), typeof j == "object" ? I(M, j.schema, D) : D !== _(V) && (D[0] === "#" ? (I(M, g[D], D), g[D] = M) : this.refs[D] = V), D;
      }
      function J(D) {
        if (typeof D == "string") {
          if (!v.test(D))
            throw new Error(`invalid anchor "${D}"`);
          Y.call(this, `#${D}`);
        }
      }
    }), g;
    function I(M, F, W) {
      if (F !== void 0 && !t(M, F))
        throw A(W);
    }
    function A(M) {
      return new Error(`reference "${M}" resolves to more than one schema`);
    }
  }
  return be.getSchemaRefs = S, be;
}
var pi;
function jn() {
  if (pi) return We;
  pi = 1, Object.defineProperty(We, "__esModule", { value: !0 }), We.getData = We.KeywordCxt = We.validateFunctionCode = void 0;
  const e = ld(), t = En(), a = gu(), r = En(), l = dd(), n = fd(), u = hd(), o = re(), c = et(), d = In(), s = ie(), _ = Tn();
  function $(N) {
    if (m(N) && (P(N), w(N))) {
      h(N);
      return;
    }
    v(N, () => (0, e.topBoolOrEmptySchema)(N));
  }
  We.validateFunctionCode = $;
  function v({ gen: N, validateName: T, schema: q, schemaEnv: L, opts: H }, X) {
    H.code.es5 ? N.func(T, (0, o._)`${c.default.data}, ${c.default.valCxt}`, L.$async, () => {
      N.code((0, o._)`"use strict"; ${i(q, H)}`), E(N, H), N.code(X);
    }) : N.func(T, (0, o._)`${c.default.data}, ${S(H)}`, L.$async, () => N.code(i(q, H)).code(X));
  }
  function S(N) {
    return (0, o._)`{${c.default.instancePath}="", ${c.default.parentData}, ${c.default.parentDataProperty}, ${c.default.rootData}=${c.default.data}${N.dynamicRef ? (0, o._)`, ${c.default.dynamicAnchors}={}` : o.nil}}={}`;
  }
  function E(N, T) {
    N.if(c.default.valCxt, () => {
      N.var(c.default.instancePath, (0, o._)`${c.default.valCxt}.${c.default.instancePath}`), N.var(c.default.parentData, (0, o._)`${c.default.valCxt}.${c.default.parentData}`), N.var(c.default.parentDataProperty, (0, o._)`${c.default.valCxt}.${c.default.parentDataProperty}`), N.var(c.default.rootData, (0, o._)`${c.default.valCxt}.${c.default.rootData}`), T.dynamicRef && N.var(c.default.dynamicAnchors, (0, o._)`${c.default.valCxt}.${c.default.dynamicAnchors}`);
    }, () => {
      N.var(c.default.instancePath, (0, o._)`""`), N.var(c.default.parentData, (0, o._)`undefined`), N.var(c.default.parentDataProperty, (0, o._)`undefined`), N.var(c.default.rootData, c.default.data), T.dynamicRef && N.var(c.default.dynamicAnchors, (0, o._)`{}`);
    });
  }
  function h(N) {
    const { schema: T, opts: q, gen: L } = N;
    v(N, () => {
      q.$comment && T.$comment && B(N), M(N), L.let(c.default.vErrors, null), L.let(c.default.errors, 0), q.unevaluated && y(N), I(N), V(N);
    });
  }
  function y(N) {
    const { gen: T, validateName: q } = N;
    N.evaluated = T.const("evaluated", (0, o._)`${q}.evaluated`), T.if((0, o._)`${N.evaluated}.dynamicProps`, () => T.assign((0, o._)`${N.evaluated}.props`, (0, o._)`undefined`)), T.if((0, o._)`${N.evaluated}.dynamicItems`, () => T.assign((0, o._)`${N.evaluated}.items`, (0, o._)`undefined`));
  }
  function i(N, T) {
    const q = typeof N == "object" && N[T.schemaId];
    return q && (T.code.source || T.code.process) ? (0, o._)`/*# sourceURL=${q} */` : o.nil;
  }
  function p(N, T) {
    if (m(N) && (P(N), w(N))) {
      g(N, T);
      return;
    }
    (0, e.boolOrEmptySchema)(N, T);
  }
  function w({ schema: N, self: T }) {
    if (typeof N == "boolean")
      return !N;
    for (const q in N)
      if (T.RULES.all[q])
        return !0;
    return !1;
  }
  function m(N) {
    return typeof N.schema != "boolean";
  }
  function g(N, T) {
    const { schema: q, gen: L, opts: H } = N;
    H.$comment && q.$comment && B(N), F(N), W(N);
    const X = L.const("_errs", c.default.errors);
    I(N, X), L.var(T, (0, o._)`${X} === ${c.default.errors}`);
  }
  function P(N) {
    (0, s.checkUnknownRules)(N), A(N);
  }
  function I(N, T) {
    if (N.opts.jtd)
      return Y(N, [], !1, T);
    const q = (0, t.getSchemaTypes)(N.schema), L = (0, t.coerceAndCheckDataType)(N, q);
    Y(N, q, !L, T);
  }
  function A(N) {
    const { schema: T, errSchemaPath: q, opts: L, self: H } = N;
    T.$ref && L.ignoreKeywordsWithRef && (0, s.schemaHasRulesButRef)(T, H.RULES) && H.logger.warn(`$ref: keywords ignored in schema at path "${q}"`);
  }
  function M(N) {
    const { schema: T, opts: q } = N;
    T.default !== void 0 && q.useDefaults && q.strictSchema && (0, s.checkStrictMode)(N, "default is ignored in the schema root");
  }
  function F(N) {
    const T = N.schema[N.opts.schemaId];
    T && (N.baseId = (0, d.resolveUrl)(N.opts.uriResolver, N.baseId, T));
  }
  function W(N) {
    if (N.schema.$async && !N.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function B({ gen: N, schemaEnv: T, schema: q, errSchemaPath: L, opts: H }) {
    const X = q.$comment;
    if (H.$comment === !0)
      N.code((0, o._)`${c.default.self}.logger.log(${X})`);
    else if (typeof H.$comment == "function") {
      const se = (0, o.str)`${L}/$comment`, ge = N.scopeValue("root", { ref: T.root });
      N.code((0, o._)`${c.default.self}.opts.$comment(${X}, ${se}, ${ge}.schema)`);
    }
  }
  function V(N) {
    const { gen: T, schemaEnv: q, validateName: L, ValidationError: H, opts: X } = N;
    q.$async ? T.if((0, o._)`${c.default.errors} === 0`, () => T.return(c.default.data), () => T.throw((0, o._)`new ${H}(${c.default.vErrors})`)) : (T.assign((0, o._)`${L}.errors`, c.default.vErrors), X.unevaluated && z(N), T.return((0, o._)`${c.default.errors} === 0`));
  }
  function z({ gen: N, evaluated: T, props: q, items: L }) {
    q instanceof o.Name && N.assign((0, o._)`${T}.props`, q), L instanceof o.Name && N.assign((0, o._)`${T}.items`, L);
  }
  function Y(N, T, q, L) {
    const { gen: H, schema: X, data: se, allErrors: ge, opts: ue, self: le } = N, { RULES: ae } = le;
    if (X.$ref && (ue.ignoreKeywordsWithRef || !(0, s.schemaHasRulesButRef)(X, ae))) {
      H.block(() => K(N, "$ref", ae.all.$ref.definition));
      return;
    }
    ue.jtd || D(N, T), H.block(() => {
      for (const me of ae.rules)
        Ie(me);
      Ie(ae.post);
    });
    function Ie(me) {
      (0, a.shouldUseGroup)(X, me) && (me.type ? (H.if((0, r.checkDataType)(me.type, se, ue.strictNumbers)), J(N, me), T.length === 1 && T[0] === me.type && q && (H.else(), (0, r.reportTypeError)(N)), H.endIf()) : J(N, me), ge || H.if((0, o._)`${c.default.errors} === ${L || 0}`));
    }
  }
  function J(N, T) {
    const { gen: q, schema: L, opts: { useDefaults: H } } = N;
    H && (0, l.assignDefaults)(N, T.type), q.block(() => {
      for (const X of T.rules)
        (0, a.shouldUseRule)(L, X) && K(N, X.keyword, X.definition, T.type);
    });
  }
  function D(N, T) {
    N.schemaEnv.meta || !N.opts.strictTypes || (U(N, T), N.opts.allowUnionTypes || j(N, T), R(N, N.dataTypes));
  }
  function U(N, T) {
    if (T.length) {
      if (!N.dataTypes.length) {
        N.dataTypes = T;
        return;
      }
      T.forEach((q) => {
        O(N.dataTypes, q) || b(N, `type "${q}" not allowed by context "${N.dataTypes.join(",")}"`);
      }), f(N, T);
    }
  }
  function j(N, T) {
    T.length > 1 && !(T.length === 2 && T.includes("null")) && b(N, "use allowUnionTypes to allow union type keyword");
  }
  function R(N, T) {
    const q = N.self.RULES.all;
    for (const L in q) {
      const H = q[L];
      if (typeof H == "object" && (0, a.shouldUseRule)(N.schema, H)) {
        const { type: X } = H.definition;
        X.length && !X.some((se) => k(T, se)) && b(N, `missing type "${X.join(",")}" for keyword "${L}"`);
      }
    }
  }
  function k(N, T) {
    return N.includes(T) || T === "number" && N.includes("integer");
  }
  function O(N, T) {
    return N.includes(T) || T === "integer" && N.includes("number");
  }
  function f(N, T) {
    const q = [];
    for (const L of N.dataTypes)
      O(T, L) ? q.push(L) : T.includes("integer") && L === "number" && q.push("integer");
    N.dataTypes = q;
  }
  function b(N, T) {
    const q = N.schemaEnv.baseId + N.errSchemaPath;
    T += ` at "${q}" (strictTypes)`, (0, s.checkStrictMode)(N, T, N.opts.strictTypes);
  }
  class C {
    constructor(T, q, L) {
      if ((0, n.validateKeywordUsage)(T, q, L), this.gen = T.gen, this.allErrors = T.allErrors, this.keyword = L, this.data = T.data, this.schema = T.schema[L], this.$data = q.$data && T.opts.$data && this.schema && this.schema.$data, this.schemaValue = (0, s.schemaRefOrVal)(T, this.schema, L, this.$data), this.schemaType = q.schemaType, this.parentSchema = T.schema, this.params = {}, this.it = T, this.def = q, this.$data)
        this.schemaCode = T.gen.const("vSchema", x(this.$data, T));
      else if (this.schemaCode = this.schemaValue, !(0, n.validSchemaType)(this.schema, q.schemaType, q.allowUndefined))
        throw new Error(`${L} value must be ${JSON.stringify(q.schemaType)}`);
      ("code" in q ? q.trackErrors : q.errors !== !1) && (this.errsCount = T.gen.const("_errs", c.default.errors));
    }
    result(T, q, L) {
      this.failResult((0, o.not)(T), q, L);
    }
    failResult(T, q, L) {
      this.gen.if(T), L ? L() : this.error(), q ? (this.gen.else(), q(), this.allErrors && this.gen.endIf()) : this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    pass(T, q) {
      this.failResult((0, o.not)(T), void 0, q);
    }
    fail(T) {
      if (T === void 0) {
        this.error(), this.allErrors || this.gen.if(!1);
        return;
      }
      this.gen.if(T), this.error(), this.allErrors ? this.gen.endIf() : this.gen.else();
    }
    fail$data(T) {
      if (!this.$data)
        return this.fail(T);
      const { schemaCode: q } = this;
      this.fail((0, o._)`${q} !== undefined && (${(0, o.or)(this.invalid$data(), T)})`);
    }
    error(T, q, L) {
      if (q) {
        this.setParams(q), this._error(T, L), this.setParams({});
        return;
      }
      this._error(T, L);
    }
    _error(T, q) {
      (T ? _.reportExtraError : _.reportError)(this, this.def.error, q);
    }
    $dataError() {
      (0, _.reportError)(this, this.def.$dataError || _.keyword$DataError);
    }
    reset() {
      if (this.errsCount === void 0)
        throw new Error('add "trackErrors" to keyword definition');
      (0, _.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(T) {
      this.allErrors || this.gen.if(T);
    }
    setParams(T, q) {
      q ? Object.assign(this.params, T) : this.params = T;
    }
    block$data(T, q, L = o.nil) {
      this.gen.block(() => {
        this.check$data(T, L), q();
      });
    }
    check$data(T = o.nil, q = o.nil) {
      if (!this.$data)
        return;
      const { gen: L, schemaCode: H, schemaType: X, def: se } = this;
      L.if((0, o.or)((0, o._)`${H} === undefined`, q)), T !== o.nil && L.assign(T, !0), (X.length || se.validateSchema) && (L.elseIf(this.invalid$data()), this.$dataError(), T !== o.nil && L.assign(T, !1)), L.else();
    }
    invalid$data() {
      const { gen: T, schemaCode: q, schemaType: L, def: H, it: X } = this;
      return (0, o.or)(se(), ge());
      function se() {
        if (L.length) {
          if (!(q instanceof o.Name))
            throw new Error("ajv implementation error");
          const ue = Array.isArray(L) ? L : [L];
          return (0, o._)`${(0, r.checkDataTypes)(ue, q, X.opts.strictNumbers, r.DataType.Wrong)}`;
        }
        return o.nil;
      }
      function ge() {
        if (H.validateSchema) {
          const ue = T.scopeValue("validate$data", { ref: H.validateSchema });
          return (0, o._)`!${ue}(${q})`;
        }
        return o.nil;
      }
    }
    subschema(T, q) {
      const L = (0, u.getSubschema)(this.it, T);
      (0, u.extendSubschemaData)(L, this.it, T), (0, u.extendSubschemaMode)(L, T);
      const H = { ...this.it, ...L, items: void 0, props: void 0 };
      return p(H, q), H;
    }
    mergeEvaluated(T, q) {
      const { it: L, gen: H } = this;
      L.opts.unevaluated && (L.props !== !0 && T.props !== void 0 && (L.props = s.mergeEvaluated.props(H, T.props, L.props, q)), L.items !== !0 && T.items !== void 0 && (L.items = s.mergeEvaluated.items(H, T.items, L.items, q)));
    }
    mergeValidEvaluated(T, q) {
      const { it: L, gen: H } = this;
      if (L.opts.unevaluated && (L.props !== !0 || L.items !== !0))
        return H.if(q, () => this.mergeEvaluated(T, o.Name)), !0;
    }
  }
  We.KeywordCxt = C;
  function K(N, T, q, L) {
    const H = new C(N, q, T);
    "code" in q ? q.code(H, L) : H.$data && q.validate ? (0, n.funcKeywordCode)(H, q) : "macro" in q ? (0, n.macroKeywordCode)(H, q) : (q.compile || q.validate) && (0, n.funcKeywordCode)(H, q);
  }
  const G = /^\/(?:[^~]|~0|~1)*$/, Q = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function x(N, { dataLevel: T, dataNames: q, dataPathArr: L }) {
    let H, X;
    if (N === "")
      return c.default.rootData;
    if (N[0] === "/") {
      if (!G.test(N))
        throw new Error(`Invalid JSON-pointer: ${N}`);
      H = N, X = c.default.rootData;
    } else {
      const le = Q.exec(N);
      if (!le)
        throw new Error(`Invalid JSON-pointer: ${N}`);
      const ae = +le[1];
      if (H = le[2], H === "#") {
        if (ae >= T)
          throw new Error(ue("property/index", ae));
        return L[T - ae];
      }
      if (ae > T)
        throw new Error(ue("data", ae));
      if (X = q[T - ae], !H)
        return X;
    }
    let se = X;
    const ge = H.split("/");
    for (const le of ge)
      le && (X = (0, o._)`${X}${(0, o.getProperty)((0, s.unescapeJsonPointer)(le))}`, se = (0, o._)`${se} && ${X}`);
    return se;
    function ue(le, ae) {
      return `Cannot access ${le} ${ae} levels up, current level is ${T}`;
    }
  }
  return We.getData = x, We;
}
var kr = {}, mi;
function ia() {
  if (mi) return kr;
  mi = 1, Object.defineProperty(kr, "__esModule", { value: !0 });
  class e extends Error {
    constructor(a) {
      super("validation failed"), this.errors = a, this.ajv = this.validation = !0;
    }
  }
  return kr.default = e, kr;
}
var Cr = {}, yi;
function kn() {
  if (yi) return Cr;
  yi = 1, Object.defineProperty(Cr, "__esModule", { value: !0 });
  const e = In();
  class t extends Error {
    constructor(r, l, n, u) {
      super(u || `can't resolve reference ${n} from id ${l}`), this.missingRef = (0, e.resolveUrl)(r, l, n), this.missingSchema = (0, e.normalizeId)((0, e.getFullPath)(r, this.missingRef));
    }
  }
  return Cr.default = t, Cr;
}
var ke = {}, gi;
function ca() {
  if (gi) return ke;
  gi = 1, Object.defineProperty(ke, "__esModule", { value: !0 }), ke.resolveSchema = ke.getCompilingSchema = ke.resolveRef = ke.compileSchema = ke.SchemaEnv = void 0;
  const e = re(), t = ia(), a = et(), r = In(), l = ie(), n = jn();
  class u {
    constructor(y) {
      var i;
      this.refs = {}, this.dynamicAnchors = {};
      let p;
      typeof y.schema == "object" && (p = y.schema), this.schema = y.schema, this.schemaId = y.schemaId, this.root = y.root || this, this.baseId = (i = y.baseId) !== null && i !== void 0 ? i : (0, r.normalizeId)(p == null ? void 0 : p[y.schemaId || "$id"]), this.schemaPath = y.schemaPath, this.localRefs = y.localRefs, this.meta = y.meta, this.$async = p == null ? void 0 : p.$async, this.refs = {};
    }
  }
  ke.SchemaEnv = u;
  function o(h) {
    const y = s.call(this, h);
    if (y)
      return y;
    const i = (0, r.getFullPath)(this.opts.uriResolver, h.root.baseId), { es5: p, lines: w } = this.opts.code, { ownProperties: m } = this.opts, g = new e.CodeGen(this.scope, { es5: p, lines: w, ownProperties: m });
    let P;
    h.$async && (P = g.scopeValue("Error", {
      ref: t.default,
      code: (0, e._)`require("ajv/dist/runtime/validation_error").default`
    }));
    const I = g.scopeName("validate");
    h.validateName = I;
    const A = {
      gen: g,
      allErrors: this.opts.allErrors,
      data: a.default.data,
      parentData: a.default.parentData,
      parentDataProperty: a.default.parentDataProperty,
      dataNames: [a.default.data],
      dataPathArr: [e.nil],
      // TODO can its length be used as dataLevel if nil is removed?
      dataLevel: 0,
      dataTypes: [],
      definedProperties: /* @__PURE__ */ new Set(),
      topSchemaRef: g.scopeValue("schema", this.opts.code.source === !0 ? { ref: h.schema, code: (0, e.stringify)(h.schema) } : { ref: h.schema }),
      validateName: I,
      ValidationError: P,
      schema: h.schema,
      schemaEnv: h,
      rootId: i,
      baseId: h.baseId || i,
      schemaPath: e.nil,
      errSchemaPath: h.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, e._)`""`,
      opts: this.opts,
      self: this
    };
    let M;
    try {
      this._compilations.add(h), (0, n.validateFunctionCode)(A), g.optimize(this.opts.code.optimize);
      const F = g.toString();
      M = `${g.scopeRefs(a.default.scope)}return ${F}`, this.opts.code.process && (M = this.opts.code.process(M, h));
      const B = new Function(`${a.default.self}`, `${a.default.scope}`, M)(this, this.scope.get());
      if (this.scope.value(I, { ref: B }), B.errors = null, B.schema = h.schema, B.schemaEnv = h, h.$async && (B.$async = !0), this.opts.code.source === !0 && (B.source = { validateName: I, validateCode: F, scopeValues: g._values }), this.opts.unevaluated) {
        const { props: V, items: z } = A;
        B.evaluated = {
          props: V instanceof e.Name ? void 0 : V,
          items: z instanceof e.Name ? void 0 : z,
          dynamicProps: V instanceof e.Name,
          dynamicItems: z instanceof e.Name
        }, B.source && (B.source.evaluated = (0, e.stringify)(B.evaluated));
      }
      return h.validate = B, h;
    } catch (F) {
      throw delete h.validate, delete h.validateName, M && this.logger.error("Error compiling schema, function code:", M), F;
    } finally {
      this._compilations.delete(h);
    }
  }
  ke.compileSchema = o;
  function c(h, y, i) {
    var p;
    i = (0, r.resolveUrl)(this.opts.uriResolver, y, i);
    const w = h.refs[i];
    if (w)
      return w;
    let m = $.call(this, h, i);
    if (m === void 0) {
      const g = (p = h.localRefs) === null || p === void 0 ? void 0 : p[i], { schemaId: P } = this.opts;
      g && (m = new u({ schema: g, schemaId: P, root: h, baseId: y }));
    }
    if (m !== void 0)
      return h.refs[i] = d.call(this, m);
  }
  ke.resolveRef = c;
  function d(h) {
    return (0, r.inlineRef)(h.schema, this.opts.inlineRefs) ? h.schema : h.validate ? h : o.call(this, h);
  }
  function s(h) {
    for (const y of this._compilations)
      if (_(y, h))
        return y;
  }
  ke.getCompilingSchema = s;
  function _(h, y) {
    return h.schema === y.schema && h.root === y.root && h.baseId === y.baseId;
  }
  function $(h, y) {
    let i;
    for (; typeof (i = this.refs[y]) == "string"; )
      y = i;
    return i || this.schemas[y] || v.call(this, h, y);
  }
  function v(h, y) {
    const i = this.opts.uriResolver.parse(y), p = (0, r._getFullPath)(this.opts.uriResolver, i);
    let w = (0, r.getFullPath)(this.opts.uriResolver, h.baseId, void 0);
    if (Object.keys(h.schema).length > 0 && p === w)
      return E.call(this, i, h);
    const m = (0, r.normalizeId)(p), g = this.refs[m] || this.schemas[m];
    if (typeof g == "string") {
      const P = v.call(this, h, g);
      return typeof (P == null ? void 0 : P.schema) != "object" ? void 0 : E.call(this, i, P);
    }
    if (typeof (g == null ? void 0 : g.schema) == "object") {
      if (g.validate || o.call(this, g), m === (0, r.normalizeId)(y)) {
        const { schema: P } = g, { schemaId: I } = this.opts, A = P[I];
        return A && (w = (0, r.resolveUrl)(this.opts.uriResolver, w, A)), new u({ schema: P, schemaId: I, root: h, baseId: w });
      }
      return E.call(this, i, g);
    }
  }
  ke.resolveSchema = v;
  const S = /* @__PURE__ */ new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function E(h, { baseId: y, schema: i, root: p }) {
    var w;
    if (((w = h.fragment) === null || w === void 0 ? void 0 : w[0]) !== "/")
      return;
    for (const P of h.fragment.slice(1).split("/")) {
      if (typeof i == "boolean")
        return;
      const I = i[(0, l.unescapeFragment)(P)];
      if (I === void 0)
        return;
      i = I;
      const A = typeof i == "object" && i[this.opts.schemaId];
      !S.has(P) && A && (y = (0, r.resolveUrl)(this.opts.uriResolver, y, A));
    }
    let m;
    if (typeof i != "boolean" && i.$ref && !(0, l.schemaHasRulesButRef)(i, this.RULES)) {
      const P = (0, r.resolveUrl)(this.opts.uriResolver, y, i.$ref);
      m = v.call(this, p, P);
    }
    const { schemaId: g } = this.opts;
    if (m = m || new u({ schema: i, schemaId: g, root: p, baseId: y }), m.schema !== m.root.schema)
      return m;
  }
  return ke;
}
const md = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#", yd = "Meta-schema for $data reference (JSON AnySchema extension proposal)", gd = "object", vd = ["$data"], $d = { $data: { type: "string", anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }] } }, _d = !1, wd = {
  $id: md,
  description: yd,
  type: gd,
  required: vd,
  properties: $d,
  additionalProperties: _d
};
var Ar = {}, vi;
function Ed() {
  if (vi) return Ar;
  vi = 1, Object.defineProperty(Ar, "__esModule", { value: !0 });
  const e = fu();
  return e.code = 'require("ajv/dist/runtime/uri").default', Ar.default = e, Ar;
}
var $i;
function Sd() {
  return $i || ($i = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.CodeGen = e.Name = e.nil = e.stringify = e.str = e._ = e.KeywordCxt = void 0;
    var t = jn();
    Object.defineProperty(e, "KeywordCxt", { enumerable: !0, get: function() {
      return t.KeywordCxt;
    } });
    var a = re();
    Object.defineProperty(e, "_", { enumerable: !0, get: function() {
      return a._;
    } }), Object.defineProperty(e, "str", { enumerable: !0, get: function() {
      return a.str;
    } }), Object.defineProperty(e, "stringify", { enumerable: !0, get: function() {
      return a.stringify;
    } }), Object.defineProperty(e, "nil", { enumerable: !0, get: function() {
      return a.nil;
    } }), Object.defineProperty(e, "Name", { enumerable: !0, get: function() {
      return a.Name;
    } }), Object.defineProperty(e, "CodeGen", { enumerable: !0, get: function() {
      return a.CodeGen;
    } });
    const r = ia(), l = kn(), n = yu(), u = ca(), o = re(), c = In(), d = En(), s = ie(), _ = wd, $ = Ed(), v = (j, R) => new RegExp(j, R);
    v.code = "new RegExp";
    const S = ["removeAdditional", "useDefaults", "coerceTypes"], E = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]), h = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    }, y = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    }, i = 200;
    function p(j) {
      var R, k, O, f, b, C, K, G, Q, x, N, T, q, L, H, X, se, ge, ue, le, ae, Ie, me, rt, nt;
      const Ae = j.strict, st = (R = j.code) === null || R === void 0 ? void 0 : R.optimize, $t = st === !0 || st === void 0 ? 1 : st || 0, _t = (O = (k = j.code) === null || k === void 0 ? void 0 : k.regExp) !== null && O !== void 0 ? O : v, Ln = (f = j.uriResolver) !== null && f !== void 0 ? f : $.default;
      return {
        strictSchema: (C = (b = j.strictSchema) !== null && b !== void 0 ? b : Ae) !== null && C !== void 0 ? C : !0,
        strictNumbers: (G = (K = j.strictNumbers) !== null && K !== void 0 ? K : Ae) !== null && G !== void 0 ? G : !0,
        strictTypes: (x = (Q = j.strictTypes) !== null && Q !== void 0 ? Q : Ae) !== null && x !== void 0 ? x : "log",
        strictTuples: (T = (N = j.strictTuples) !== null && N !== void 0 ? N : Ae) !== null && T !== void 0 ? T : "log",
        strictRequired: (L = (q = j.strictRequired) !== null && q !== void 0 ? q : Ae) !== null && L !== void 0 ? L : !1,
        code: j.code ? { ...j.code, optimize: $t, regExp: _t } : { optimize: $t, regExp: _t },
        loopRequired: (H = j.loopRequired) !== null && H !== void 0 ? H : i,
        loopEnum: (X = j.loopEnum) !== null && X !== void 0 ? X : i,
        meta: (se = j.meta) !== null && se !== void 0 ? se : !0,
        messages: (ge = j.messages) !== null && ge !== void 0 ? ge : !0,
        inlineRefs: (ue = j.inlineRefs) !== null && ue !== void 0 ? ue : !0,
        schemaId: (le = j.schemaId) !== null && le !== void 0 ? le : "$id",
        addUsedSchema: (ae = j.addUsedSchema) !== null && ae !== void 0 ? ae : !0,
        validateSchema: (Ie = j.validateSchema) !== null && Ie !== void 0 ? Ie : !0,
        validateFormats: (me = j.validateFormats) !== null && me !== void 0 ? me : !0,
        unicodeRegExp: (rt = j.unicodeRegExp) !== null && rt !== void 0 ? rt : !0,
        int32range: (nt = j.int32range) !== null && nt !== void 0 ? nt : !0,
        uriResolver: Ln
      };
    }
    class w {
      constructor(R = {}) {
        this.schemas = {}, this.refs = {}, this.formats = {}, this._compilations = /* @__PURE__ */ new Set(), this._loading = {}, this._cache = /* @__PURE__ */ new Map(), R = this.opts = { ...R, ...p(R) };
        const { es5: k, lines: O } = this.opts.code;
        this.scope = new o.ValueScope({ scope: {}, prefixes: E, es5: k, lines: O }), this.logger = W(R.logger);
        const f = R.validateFormats;
        R.validateFormats = !1, this.RULES = (0, n.getRules)(), m.call(this, h, R, "NOT SUPPORTED"), m.call(this, y, R, "DEPRECATED", "warn"), this._metaOpts = M.call(this), R.formats && I.call(this), this._addVocabularies(), this._addDefaultMetaSchema(), R.keywords && A.call(this, R.keywords), typeof R.meta == "object" && this.addMetaSchema(R.meta), P.call(this), R.validateFormats = f;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data: R, meta: k, schemaId: O } = this.opts;
        let f = _;
        O === "id" && (f = { ..._ }, f.id = f.$id, delete f.$id), k && R && this.addMetaSchema(f, f[O], !1);
      }
      defaultMeta() {
        const { meta: R, schemaId: k } = this.opts;
        return this.opts.defaultMeta = typeof R == "object" ? R[k] || R : void 0;
      }
      validate(R, k) {
        let O;
        if (typeof R == "string") {
          if (O = this.getSchema(R), !O)
            throw new Error(`no schema with key or ref "${R}"`);
        } else
          O = this.compile(R);
        const f = O(k);
        return "$async" in O || (this.errors = O.errors), f;
      }
      compile(R, k) {
        const O = this._addSchema(R, k);
        return O.validate || this._compileSchemaEnv(O);
      }
      compileAsync(R, k) {
        if (typeof this.opts.loadSchema != "function")
          throw new Error("options.loadSchema should be a function");
        const { loadSchema: O } = this.opts;
        return f.call(this, R, k);
        async function f(x, N) {
          await b.call(this, x.$schema);
          const T = this._addSchema(x, N);
          return T.validate || C.call(this, T);
        }
        async function b(x) {
          x && !this.getSchema(x) && await f.call(this, { $ref: x }, !0);
        }
        async function C(x) {
          try {
            return this._compileSchemaEnv(x);
          } catch (N) {
            if (!(N instanceof l.default))
              throw N;
            return K.call(this, N), await G.call(this, N.missingSchema), C.call(this, x);
          }
        }
        function K({ missingSchema: x, missingRef: N }) {
          if (this.refs[x])
            throw new Error(`AnySchema ${x} is loaded but ${N} cannot be resolved`);
        }
        async function G(x) {
          const N = await Q.call(this, x);
          this.refs[x] || await b.call(this, N.$schema), this.refs[x] || this.addSchema(N, x, k);
        }
        async function Q(x) {
          const N = this._loading[x];
          if (N)
            return N;
          try {
            return await (this._loading[x] = O(x));
          } finally {
            delete this._loading[x];
          }
        }
      }
      // Adds schema to the instance
      addSchema(R, k, O, f = this.opts.validateSchema) {
        if (Array.isArray(R)) {
          for (const C of R)
            this.addSchema(C, void 0, O, f);
          return this;
        }
        let b;
        if (typeof R == "object") {
          const { schemaId: C } = this.opts;
          if (b = R[C], b !== void 0 && typeof b != "string")
            throw new Error(`schema ${C} must be string`);
        }
        return k = (0, c.normalizeId)(k || b), this._checkUnique(k), this.schemas[k] = this._addSchema(R, O, k, f, !0), this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(R, k, O = this.opts.validateSchema) {
        return this.addSchema(R, k, !0, O), this;
      }
      //  Validate schema against its meta-schema
      validateSchema(R, k) {
        if (typeof R == "boolean")
          return !0;
        let O;
        if (O = R.$schema, O !== void 0 && typeof O != "string")
          throw new Error("$schema must be a string");
        if (O = O || this.opts.defaultMeta || this.defaultMeta(), !O)
          return this.logger.warn("meta-schema not available"), this.errors = null, !0;
        const f = this.validate(O, R);
        if (!f && k) {
          const b = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(b);
          else
            throw new Error(b);
        }
        return f;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(R) {
        let k;
        for (; typeof (k = g.call(this, R)) == "string"; )
          R = k;
        if (k === void 0) {
          const { schemaId: O } = this.opts, f = new u.SchemaEnv({ schema: {}, schemaId: O });
          if (k = u.resolveSchema.call(this, f, R), !k)
            return;
          this.refs[R] = k;
        }
        return k.validate || this._compileSchemaEnv(k);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(R) {
        if (R instanceof RegExp)
          return this._removeAllSchemas(this.schemas, R), this._removeAllSchemas(this.refs, R), this;
        switch (typeof R) {
          case "undefined":
            return this._removeAllSchemas(this.schemas), this._removeAllSchemas(this.refs), this._cache.clear(), this;
          case "string": {
            const k = g.call(this, R);
            return typeof k == "object" && this._cache.delete(k.schema), delete this.schemas[R], delete this.refs[R], this;
          }
          case "object": {
            const k = R;
            this._cache.delete(k);
            let O = R[this.opts.schemaId];
            return O && (O = (0, c.normalizeId)(O), delete this.schemas[O], delete this.refs[O]), this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(R) {
        for (const k of R)
          this.addKeyword(k);
        return this;
      }
      addKeyword(R, k) {
        let O;
        if (typeof R == "string")
          O = R, typeof k == "object" && (this.logger.warn("these parameters are deprecated, see docs for addKeyword"), k.keyword = O);
        else if (typeof R == "object" && k === void 0) {
          if (k = R, O = k.keyword, Array.isArray(O) && !O.length)
            throw new Error("addKeywords: keyword must be string or non-empty array");
        } else
          throw new Error("invalid addKeywords parameters");
        if (V.call(this, O, k), !k)
          return (0, s.eachItem)(O, (b) => z.call(this, b)), this;
        J.call(this, k);
        const f = {
          ...k,
          type: (0, d.getJSONTypes)(k.type),
          schemaType: (0, d.getJSONTypes)(k.schemaType)
        };
        return (0, s.eachItem)(O, f.type.length === 0 ? (b) => z.call(this, b, f) : (b) => f.type.forEach((C) => z.call(this, b, f, C))), this;
      }
      getKeyword(R) {
        const k = this.RULES.all[R];
        return typeof k == "object" ? k.definition : !!k;
      }
      // Remove keyword
      removeKeyword(R) {
        const { RULES: k } = this;
        delete k.keywords[R], delete k.all[R];
        for (const O of k.rules) {
          const f = O.rules.findIndex((b) => b.keyword === R);
          f >= 0 && O.rules.splice(f, 1);
        }
        return this;
      }
      // Add format
      addFormat(R, k) {
        return typeof k == "string" && (k = new RegExp(k)), this.formats[R] = k, this;
      }
      errorsText(R = this.errors, { separator: k = ", ", dataVar: O = "data" } = {}) {
        return !R || R.length === 0 ? "No errors" : R.map((f) => `${O}${f.instancePath} ${f.message}`).reduce((f, b) => f + k + b);
      }
      $dataMetaSchema(R, k) {
        const O = this.RULES.all;
        R = JSON.parse(JSON.stringify(R));
        for (const f of k) {
          const b = f.split("/").slice(1);
          let C = R;
          for (const K of b)
            C = C[K];
          for (const K in O) {
            const G = O[K];
            if (typeof G != "object")
              continue;
            const { $data: Q } = G.definition, x = C[K];
            Q && x && (C[K] = U(x));
          }
        }
        return R;
      }
      _removeAllSchemas(R, k) {
        for (const O in R) {
          const f = R[O];
          (!k || k.test(O)) && (typeof f == "string" ? delete R[O] : f && !f.meta && (this._cache.delete(f.schema), delete R[O]));
        }
      }
      _addSchema(R, k, O, f = this.opts.validateSchema, b = this.opts.addUsedSchema) {
        let C;
        const { schemaId: K } = this.opts;
        if (typeof R == "object")
          C = R[K];
        else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          if (typeof R != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let G = this._cache.get(R);
        if (G !== void 0)
          return G;
        O = (0, c.normalizeId)(C || O);
        const Q = c.getSchemaRefs.call(this, R, O);
        return G = new u.SchemaEnv({ schema: R, schemaId: K, meta: k, baseId: O, localRefs: Q }), this._cache.set(G.schema, G), b && !O.startsWith("#") && (O && this._checkUnique(O), this.refs[O] = G), f && this.validateSchema(R, !0), G;
      }
      _checkUnique(R) {
        if (this.schemas[R] || this.refs[R])
          throw new Error(`schema with key or id "${R}" already exists`);
      }
      _compileSchemaEnv(R) {
        if (R.meta ? this._compileMetaSchema(R) : u.compileSchema.call(this, R), !R.validate)
          throw new Error("ajv implementation error");
        return R.validate;
      }
      _compileMetaSchema(R) {
        const k = this.opts;
        this.opts = this._metaOpts;
        try {
          u.compileSchema.call(this, R);
        } finally {
          this.opts = k;
        }
      }
    }
    w.ValidationError = r.default, w.MissingRefError = l.default, e.default = w;
    function m(j, R, k, O = "error") {
      for (const f in j) {
        const b = f;
        b in R && this.logger[O](`${k}: option ${f}. ${j[b]}`);
      }
    }
    function g(j) {
      return j = (0, c.normalizeId)(j), this.schemas[j] || this.refs[j];
    }
    function P() {
      const j = this.opts.schemas;
      if (j)
        if (Array.isArray(j))
          this.addSchema(j);
        else
          for (const R in j)
            this.addSchema(j[R], R);
    }
    function I() {
      for (const j in this.opts.formats) {
        const R = this.opts.formats[j];
        R && this.addFormat(j, R);
      }
    }
    function A(j) {
      if (Array.isArray(j)) {
        this.addVocabulary(j);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const R in j) {
        const k = j[R];
        k.keyword || (k.keyword = R), this.addKeyword(k);
      }
    }
    function M() {
      const j = { ...this.opts };
      for (const R of S)
        delete j[R];
      return j;
    }
    const F = { log() {
    }, warn() {
    }, error() {
    } };
    function W(j) {
      if (j === !1)
        return F;
      if (j === void 0)
        return console;
      if (j.log && j.warn && j.error)
        return j;
      throw new Error("logger must implement log, warn and error methods");
    }
    const B = /^[a-z_$][a-z0-9_$:-]*$/i;
    function V(j, R) {
      const { RULES: k } = this;
      if ((0, s.eachItem)(j, (O) => {
        if (k.keywords[O])
          throw new Error(`Keyword ${O} is already defined`);
        if (!B.test(O))
          throw new Error(`Keyword ${O} has invalid name`);
      }), !!R && R.$data && !("code" in R || "validate" in R))
        throw new Error('$data keyword must have "code" or "validate" function');
    }
    function z(j, R, k) {
      var O;
      const f = R == null ? void 0 : R.post;
      if (k && f)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES: b } = this;
      let C = f ? b.post : b.rules.find(({ type: G }) => G === k);
      if (C || (C = { type: k, rules: [] }, b.rules.push(C)), b.keywords[j] = !0, !R)
        return;
      const K = {
        keyword: j,
        definition: {
          ...R,
          type: (0, d.getJSONTypes)(R.type),
          schemaType: (0, d.getJSONTypes)(R.schemaType)
        }
      };
      R.before ? Y.call(this, C, K, R.before) : C.rules.push(K), b.all[j] = K, (O = R.implements) === null || O === void 0 || O.forEach((G) => this.addKeyword(G));
    }
    function Y(j, R, k) {
      const O = j.rules.findIndex((f) => f.keyword === k);
      O >= 0 ? j.rules.splice(O, 0, R) : (j.rules.push(R), this.logger.warn(`rule ${k} is not defined`));
    }
    function J(j) {
      let { metaSchema: R } = j;
      R !== void 0 && (j.$data && this.opts.$data && (R = U(R)), j.validateSchema = this.compile(R, !0));
    }
    const D = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function U(j) {
      return { anyOf: [j, D] };
    }
  })(es)), es;
}
var qr = {}, Dr = {}, Mr = {}, _i;
function bd() {
  if (_i) return Mr;
  _i = 1, Object.defineProperty(Mr, "__esModule", { value: !0 });
  const e = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  return Mr.default = e, Mr;
}
var Ye = {}, wi;
function Pd() {
  if (wi) return Ye;
  wi = 1, Object.defineProperty(Ye, "__esModule", { value: !0 }), Ye.callRef = Ye.getValidate = void 0;
  const e = kn(), t = Ve(), a = re(), r = et(), l = ca(), n = ie(), u = {
    keyword: "$ref",
    schemaType: "string",
    code(d) {
      const { gen: s, schema: _, it: $ } = d, { baseId: v, schemaEnv: S, validateName: E, opts: h, self: y } = $, { root: i } = S;
      if ((_ === "#" || _ === "#/") && v === i.baseId)
        return w();
      const p = l.resolveRef.call(y, i, v, _);
      if (p === void 0)
        throw new e.default($.opts.uriResolver, v, _);
      if (p instanceof l.SchemaEnv)
        return m(p);
      return g(p);
      function w() {
        if (S === i)
          return c(d, E, S, S.$async);
        const P = s.scopeValue("root", { ref: i });
        return c(d, (0, a._)`${P}.validate`, i, i.$async);
      }
      function m(P) {
        const I = o(d, P);
        c(d, I, P, P.$async);
      }
      function g(P) {
        const I = s.scopeValue("schema", h.code.source === !0 ? { ref: P, code: (0, a.stringify)(P) } : { ref: P }), A = s.name("valid"), M = d.subschema({
          schema: P,
          dataTypes: [],
          schemaPath: a.nil,
          topSchemaRef: I,
          errSchemaPath: _
        }, A);
        d.mergeEvaluated(M), d.ok(A);
      }
    }
  };
  function o(d, s) {
    const { gen: _ } = d;
    return s.validate ? _.scopeValue("validate", { ref: s.validate }) : (0, a._)`${_.scopeValue("wrapper", { ref: s })}.validate`;
  }
  Ye.getValidate = o;
  function c(d, s, _, $) {
    const { gen: v, it: S } = d, { allErrors: E, schemaEnv: h, opts: y } = S, i = y.passContext ? r.default.this : a.nil;
    $ ? p() : w();
    function p() {
      if (!h.$async)
        throw new Error("async schema referenced by sync schema");
      const P = v.let("valid");
      v.try(() => {
        v.code((0, a._)`await ${(0, t.callValidateCode)(d, s, i)}`), g(s), E || v.assign(P, !0);
      }, (I) => {
        v.if((0, a._)`!(${I} instanceof ${S.ValidationError})`, () => v.throw(I)), m(I), E || v.assign(P, !1);
      }), d.ok(P);
    }
    function w() {
      d.result((0, t.callValidateCode)(d, s, i), () => g(s), () => m(s));
    }
    function m(P) {
      const I = (0, a._)`${P}.errors`;
      v.assign(r.default.vErrors, (0, a._)`${r.default.vErrors} === null ? ${I} : ${r.default.vErrors}.concat(${I})`), v.assign(r.default.errors, (0, a._)`${r.default.vErrors}.length`);
    }
    function g(P) {
      var I;
      if (!S.opts.unevaluated)
        return;
      const A = (I = _ == null ? void 0 : _.validate) === null || I === void 0 ? void 0 : I.evaluated;
      if (S.props !== !0)
        if (A && !A.dynamicProps)
          A.props !== void 0 && (S.props = n.mergeEvaluated.props(v, A.props, S.props));
        else {
          const M = v.var("props", (0, a._)`${P}.evaluated.props`);
          S.props = n.mergeEvaluated.props(v, M, S.props, a.Name);
        }
      if (S.items !== !0)
        if (A && !A.dynamicItems)
          A.items !== void 0 && (S.items = n.mergeEvaluated.items(v, A.items, S.items));
        else {
          const M = v.var("items", (0, a._)`${P}.evaluated.items`);
          S.items = n.mergeEvaluated.items(v, M, S.items, a.Name);
        }
    }
  }
  return Ye.callRef = c, Ye.default = u, Ye;
}
var Ei;
function Rd() {
  if (Ei) return Dr;
  Ei = 1, Object.defineProperty(Dr, "__esModule", { value: !0 });
  const e = bd(), t = Pd(), a = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    e.default,
    t.default
  ];
  return Dr.default = a, Dr;
}
var Lr = {}, Fr = {}, Si;
function Nd() {
  if (Si) return Fr;
  Si = 1, Object.defineProperty(Fr, "__esModule", { value: !0 });
  const e = re(), t = e.operators, a = {
    maximum: { okStr: "<=", ok: t.LTE, fail: t.GT },
    minimum: { okStr: ">=", ok: t.GTE, fail: t.LT },
    exclusiveMaximum: { okStr: "<", ok: t.LT, fail: t.GTE },
    exclusiveMinimum: { okStr: ">", ok: t.GT, fail: t.LTE }
  }, r = {
    message: ({ keyword: n, schemaCode: u }) => (0, e.str)`must be ${a[n].okStr} ${u}`,
    params: ({ keyword: n, schemaCode: u }) => (0, e._)`{comparison: ${a[n].okStr}, limit: ${u}}`
  }, l = {
    keyword: Object.keys(a),
    type: "number",
    schemaType: "number",
    $data: !0,
    error: r,
    code(n) {
      const { keyword: u, data: o, schemaCode: c } = n;
      n.fail$data((0, e._)`${o} ${a[u].fail} ${c} || isNaN(${o})`);
    }
  };
  return Fr.default = l, Fr;
}
var Vr = {}, bi;
function Od() {
  if (bi) return Vr;
  bi = 1, Object.defineProperty(Vr, "__esModule", { value: !0 });
  const e = re(), a = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: !0,
    error: {
      message: ({ schemaCode: r }) => (0, e.str)`must be multiple of ${r}`,
      params: ({ schemaCode: r }) => (0, e._)`{multipleOf: ${r}}`
    },
    code(r) {
      const { gen: l, data: n, schemaCode: u, it: o } = r, c = o.opts.multipleOfPrecision, d = l.let("res"), s = c ? (0, e._)`Math.abs(Math.round(${d}) - ${d}) > 1e-${c}` : (0, e._)`${d} !== parseInt(${d})`;
      r.fail$data((0, e._)`(${u} === 0 || (${d} = ${n}/${u}, ${s}))`);
    }
  };
  return Vr.default = a, Vr;
}
var Ur = {}, zr = {}, Pi;
function Td() {
  if (Pi) return zr;
  Pi = 1, Object.defineProperty(zr, "__esModule", { value: !0 });
  function e(t) {
    const a = t.length;
    let r = 0, l = 0, n;
    for (; l < a; )
      r++, n = t.charCodeAt(l++), n >= 55296 && n <= 56319 && l < a && (n = t.charCodeAt(l), (n & 64512) === 56320 && l++);
    return r;
  }
  return zr.default = e, e.code = 'require("ajv/dist/runtime/ucs2length").default', zr;
}
var Ri;
function Id() {
  if (Ri) return Ur;
  Ri = 1, Object.defineProperty(Ur, "__esModule", { value: !0 });
  const e = re(), t = ie(), a = Td(), l = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: n, schemaCode: u }) {
        const o = n === "maxLength" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${o} than ${u} characters`;
      },
      params: ({ schemaCode: n }) => (0, e._)`{limit: ${n}}`
    },
    code(n) {
      const { keyword: u, data: o, schemaCode: c, it: d } = n, s = u === "maxLength" ? e.operators.GT : e.operators.LT, _ = d.opts.unicode === !1 ? (0, e._)`${o}.length` : (0, e._)`${(0, t.useFunc)(n.gen, a.default)}(${o})`;
      n.fail$data((0, e._)`${_} ${s} ${c}`);
    }
  };
  return Ur.default = l, Ur;
}
var Kr = {}, Ni;
function jd() {
  if (Ni) return Kr;
  Ni = 1, Object.defineProperty(Kr, "__esModule", { value: !0 });
  const e = Ve(), t = re(), r = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: l }) => (0, t.str)`must match pattern "${l}"`,
      params: ({ schemaCode: l }) => (0, t._)`{pattern: ${l}}`
    },
    code(l) {
      const { data: n, $data: u, schema: o, schemaCode: c, it: d } = l, s = d.opts.unicodeRegExp ? "u" : "", _ = u ? (0, t._)`(new RegExp(${c}, ${s}))` : (0, e.usePattern)(l, o);
      l.fail$data((0, t._)`!${_}.test(${n})`);
    }
  };
  return Kr.default = r, Kr;
}
var Gr = {}, Oi;
function kd() {
  if (Oi) return Gr;
  Oi = 1, Object.defineProperty(Gr, "__esModule", { value: !0 });
  const e = re(), a = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: r, schemaCode: l }) {
        const n = r === "maxProperties" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${n} than ${l} properties`;
      },
      params: ({ schemaCode: r }) => (0, e._)`{limit: ${r}}`
    },
    code(r) {
      const { keyword: l, data: n, schemaCode: u } = r, o = l === "maxProperties" ? e.operators.GT : e.operators.LT;
      r.fail$data((0, e._)`Object.keys(${n}).length ${o} ${u}`);
    }
  };
  return Gr.default = a, Gr;
}
var Hr = {}, Ti;
function Cd() {
  if (Ti) return Hr;
  Ti = 1, Object.defineProperty(Hr, "__esModule", { value: !0 });
  const e = Ve(), t = re(), a = ie(), l = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: !0,
    error: {
      message: ({ params: { missingProperty: n } }) => (0, t.str)`must have required property '${n}'`,
      params: ({ params: { missingProperty: n } }) => (0, t._)`{missingProperty: ${n}}`
    },
    code(n) {
      const { gen: u, schema: o, schemaCode: c, data: d, $data: s, it: _ } = n, { opts: $ } = _;
      if (!s && o.length === 0)
        return;
      const v = o.length >= $.loopRequired;
      if (_.allErrors ? S() : E(), $.strictRequired) {
        const i = n.parentSchema.properties, { definedProperties: p } = n.it;
        for (const w of o)
          if ((i == null ? void 0 : i[w]) === void 0 && !p.has(w)) {
            const m = _.schemaEnv.baseId + _.errSchemaPath, g = `required property "${w}" is not defined at "${m}" (strictRequired)`;
            (0, a.checkStrictMode)(_, g, _.opts.strictRequired);
          }
      }
      function S() {
        if (v || s)
          n.block$data(t.nil, h);
        else
          for (const i of o)
            (0, e.checkReportMissingProp)(n, i);
      }
      function E() {
        const i = u.let("missing");
        if (v || s) {
          const p = u.let("valid", !0);
          n.block$data(p, () => y(i, p)), n.ok(p);
        } else
          u.if((0, e.checkMissingProp)(n, o, i)), (0, e.reportMissingProp)(n, i), u.else();
      }
      function h() {
        u.forOf("prop", c, (i) => {
          n.setParams({ missingProperty: i }), u.if((0, e.noPropertyInData)(u, d, i, $.ownProperties), () => n.error());
        });
      }
      function y(i, p) {
        n.setParams({ missingProperty: i }), u.forOf(i, c, () => {
          u.assign(p, (0, e.propertyInData)(u, d, i, $.ownProperties)), u.if((0, t.not)(p), () => {
            n.error(), u.break();
          });
        }, t.nil);
      }
    }
  };
  return Hr.default = l, Hr;
}
var Wr = {}, Ii;
function Ad() {
  if (Ii) return Wr;
  Ii = 1, Object.defineProperty(Wr, "__esModule", { value: !0 });
  const e = re(), a = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: !0,
    error: {
      message({ keyword: r, schemaCode: l }) {
        const n = r === "maxItems" ? "more" : "fewer";
        return (0, e.str)`must NOT have ${n} than ${l} items`;
      },
      params: ({ schemaCode: r }) => (0, e._)`{limit: ${r}}`
    },
    code(r) {
      const { keyword: l, data: n, schemaCode: u } = r, o = l === "maxItems" ? e.operators.GT : e.operators.LT;
      r.fail$data((0, e._)`${n}.length ${o} ${u}`);
    }
  };
  return Wr.default = a, Wr;
}
var Br = {}, Jr = {}, ji;
function ua() {
  if (ji) return Jr;
  ji = 1, Object.defineProperty(Jr, "__esModule", { value: !0 });
  const e = Pn();
  return e.code = 'require("ajv/dist/runtime/equal").default', Jr.default = e, Jr;
}
var ki;
function qd() {
  if (ki) return Br;
  ki = 1, Object.defineProperty(Br, "__esModule", { value: !0 });
  const e = En(), t = re(), a = ie(), r = ua(), n = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: !0,
    error: {
      message: ({ params: { i: u, j: o } }) => (0, t.str)`must NOT have duplicate items (items ## ${o} and ${u} are identical)`,
      params: ({ params: { i: u, j: o } }) => (0, t._)`{i: ${u}, j: ${o}}`
    },
    code(u) {
      const { gen: o, data: c, $data: d, schema: s, parentSchema: _, schemaCode: $, it: v } = u;
      if (!d && !s)
        return;
      const S = o.let("valid"), E = _.items ? (0, e.getSchemaTypes)(_.items) : [];
      u.block$data(S, h, (0, t._)`${$} === false`), u.ok(S);
      function h() {
        const w = o.let("i", (0, t._)`${c}.length`), m = o.let("j");
        u.setParams({ i: w, j: m }), o.assign(S, !0), o.if((0, t._)`${w} > 1`, () => (y() ? i : p)(w, m));
      }
      function y() {
        return E.length > 0 && !E.some((w) => w === "object" || w === "array");
      }
      function i(w, m) {
        const g = o.name("item"), P = (0, e.checkDataTypes)(E, g, v.opts.strictNumbers, e.DataType.Wrong), I = o.const("indices", (0, t._)`{}`);
        o.for((0, t._)`;${w}--;`, () => {
          o.let(g, (0, t._)`${c}[${w}]`), o.if(P, (0, t._)`continue`), E.length > 1 && o.if((0, t._)`typeof ${g} == "string"`, (0, t._)`${g} += "_"`), o.if((0, t._)`typeof ${I}[${g}] == "number"`, () => {
            o.assign(m, (0, t._)`${I}[${g}]`), u.error(), o.assign(S, !1).break();
          }).code((0, t._)`${I}[${g}] = ${w}`);
        });
      }
      function p(w, m) {
        const g = (0, a.useFunc)(o, r.default), P = o.name("outer");
        o.label(P).for((0, t._)`;${w}--;`, () => o.for((0, t._)`${m} = ${w}; ${m}--;`, () => o.if((0, t._)`${g}(${c}[${w}], ${c}[${m}])`, () => {
          u.error(), o.assign(S, !1).break(P);
        })));
      }
    }
  };
  return Br.default = n, Br;
}
var Xr = {}, Ci;
function Dd() {
  if (Ci) return Xr;
  Ci = 1, Object.defineProperty(Xr, "__esModule", { value: !0 });
  const e = re(), t = ie(), a = ua(), l = {
    keyword: "const",
    $data: !0,
    error: {
      message: "must be equal to constant",
      params: ({ schemaCode: n }) => (0, e._)`{allowedValue: ${n}}`
    },
    code(n) {
      const { gen: u, data: o, $data: c, schemaCode: d, schema: s } = n;
      c || s && typeof s == "object" ? n.fail$data((0, e._)`!${(0, t.useFunc)(u, a.default)}(${o}, ${d})`) : n.fail((0, e._)`${s} !== ${o}`);
    }
  };
  return Xr.default = l, Xr;
}
var Yr = {}, Ai;
function Md() {
  if (Ai) return Yr;
  Ai = 1, Object.defineProperty(Yr, "__esModule", { value: !0 });
  const e = re(), t = ie(), a = ua(), l = {
    keyword: "enum",
    schemaType: "array",
    $data: !0,
    error: {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode: n }) => (0, e._)`{allowedValues: ${n}}`
    },
    code(n) {
      const { gen: u, data: o, $data: c, schema: d, schemaCode: s, it: _ } = n;
      if (!c && d.length === 0)
        throw new Error("enum must have non-empty array");
      const $ = d.length >= _.opts.loopEnum;
      let v;
      const S = () => v ?? (v = (0, t.useFunc)(u, a.default));
      let E;
      if ($ || c)
        E = u.let("valid"), n.block$data(E, h);
      else {
        if (!Array.isArray(d))
          throw new Error("ajv implementation error");
        const i = u.const("vSchema", s);
        E = (0, e.or)(...d.map((p, w) => y(i, w)));
      }
      n.pass(E);
      function h() {
        u.assign(E, !1), u.forOf("v", s, (i) => u.if((0, e._)`${S()}(${o}, ${i})`, () => u.assign(E, !0).break()));
      }
      function y(i, p) {
        const w = d[p];
        return typeof w == "object" && w !== null ? (0, e._)`${S()}(${o}, ${i}[${p}])` : (0, e._)`${o} === ${w}`;
      }
    }
  };
  return Yr.default = l, Yr;
}
var qi;
function Ld() {
  if (qi) return Lr;
  qi = 1, Object.defineProperty(Lr, "__esModule", { value: !0 });
  const e = Nd(), t = Od(), a = Id(), r = jd(), l = kd(), n = Cd(), u = Ad(), o = qd(), c = Dd(), d = Md(), s = [
    // number
    e.default,
    t.default,
    // string
    a.default,
    r.default,
    // object
    l.default,
    n.default,
    // array
    u.default,
    o.default,
    // any
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    c.default,
    d.default
  ];
  return Lr.default = s, Lr;
}
var xr = {}, mt = {}, Di;
function vu() {
  if (Di) return mt;
  Di = 1, Object.defineProperty(mt, "__esModule", { value: !0 }), mt.validateAdditionalItems = void 0;
  const e = re(), t = ie(), r = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: n } }) => (0, e.str)`must NOT have more than ${n} items`,
      params: ({ params: { len: n } }) => (0, e._)`{limit: ${n}}`
    },
    code(n) {
      const { parentSchema: u, it: o } = n, { items: c } = u;
      if (!Array.isArray(c)) {
        (0, t.checkStrictMode)(o, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      l(n, c);
    }
  };
  function l(n, u) {
    const { gen: o, schema: c, data: d, keyword: s, it: _ } = n;
    _.items = !0;
    const $ = o.const("len", (0, e._)`${d}.length`);
    if (c === !1)
      n.setParams({ len: u.length }), n.pass((0, e._)`${$} <= ${u.length}`);
    else if (typeof c == "object" && !(0, t.alwaysValidSchema)(_, c)) {
      const S = o.var("valid", (0, e._)`${$} <= ${u.length}`);
      o.if((0, e.not)(S), () => v(S)), n.ok(S);
    }
    function v(S) {
      o.forRange("i", u.length, $, (E) => {
        n.subschema({ keyword: s, dataProp: E, dataPropType: t.Type.Num }, S), _.allErrors || o.if((0, e.not)(S), () => o.break());
      });
    }
  }
  return mt.validateAdditionalItems = l, mt.default = r, mt;
}
var Qr = {}, yt = {}, Mi;
function $u() {
  if (Mi) return yt;
  Mi = 1, Object.defineProperty(yt, "__esModule", { value: !0 }), yt.validateTuple = void 0;
  const e = re(), t = ie(), a = Ve(), r = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(n) {
      const { schema: u, it: o } = n;
      if (Array.isArray(u))
        return l(n, "additionalItems", u);
      o.items = !0, !(0, t.alwaysValidSchema)(o, u) && n.ok((0, a.validateArray)(n));
    }
  };
  function l(n, u, o = n.schema) {
    const { gen: c, parentSchema: d, data: s, keyword: _, it: $ } = n;
    E(d), $.opts.unevaluated && o.length && $.items !== !0 && ($.items = t.mergeEvaluated.items(c, o.length, $.items));
    const v = c.name("valid"), S = c.const("len", (0, e._)`${s}.length`);
    o.forEach((h, y) => {
      (0, t.alwaysValidSchema)($, h) || (c.if((0, e._)`${S} > ${y}`, () => n.subschema({
        keyword: _,
        schemaProp: y,
        dataProp: y
      }, v)), n.ok(v));
    });
    function E(h) {
      const { opts: y, errSchemaPath: i } = $, p = o.length, w = p === h.minItems && (p === h.maxItems || h[u] === !1);
      if (y.strictTuples && !w) {
        const m = `"${_}" is ${p}-tuple, but minItems or maxItems/${u} are not specified or different at path "${i}"`;
        (0, t.checkStrictMode)($, m, y.strictTuples);
      }
    }
  }
  return yt.validateTuple = l, yt.default = r, yt;
}
var Li;
function Fd() {
  if (Li) return Qr;
  Li = 1, Object.defineProperty(Qr, "__esModule", { value: !0 });
  const e = $u(), t = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (a) => (0, e.validateTuple)(a, "items")
  };
  return Qr.default = t, Qr;
}
var Zr = {}, Fi;
function Vd() {
  if (Fi) return Zr;
  Fi = 1, Object.defineProperty(Zr, "__esModule", { value: !0 });
  const e = re(), t = ie(), a = Ve(), r = vu(), n = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: {
      message: ({ params: { len: u } }) => (0, e.str)`must NOT have more than ${u} items`,
      params: ({ params: { len: u } }) => (0, e._)`{limit: ${u}}`
    },
    code(u) {
      const { schema: o, parentSchema: c, it: d } = u, { prefixItems: s } = c;
      d.items = !0, !(0, t.alwaysValidSchema)(d, o) && (s ? (0, r.validateAdditionalItems)(u, s) : u.ok((0, a.validateArray)(u)));
    }
  };
  return Zr.default = n, Zr;
}
var en = {}, Vi;
function Ud() {
  if (Vi) return en;
  Vi = 1, Object.defineProperty(en, "__esModule", { value: !0 });
  const e = re(), t = ie(), r = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: !0,
    error: {
      message: ({ params: { min: l, max: n } }) => n === void 0 ? (0, e.str)`must contain at least ${l} valid item(s)` : (0, e.str)`must contain at least ${l} and no more than ${n} valid item(s)`,
      params: ({ params: { min: l, max: n } }) => n === void 0 ? (0, e._)`{minContains: ${l}}` : (0, e._)`{minContains: ${l}, maxContains: ${n}}`
    },
    code(l) {
      const { gen: n, schema: u, parentSchema: o, data: c, it: d } = l;
      let s, _;
      const { minContains: $, maxContains: v } = o;
      d.opts.next ? (s = $ === void 0 ? 1 : $, _ = v) : s = 1;
      const S = n.const("len", (0, e._)`${c}.length`);
      if (l.setParams({ min: s, max: _ }), _ === void 0 && s === 0) {
        (0, t.checkStrictMode)(d, '"minContains" == 0 without "maxContains": "contains" keyword ignored');
        return;
      }
      if (_ !== void 0 && s > _) {
        (0, t.checkStrictMode)(d, '"minContains" > "maxContains" is always invalid'), l.fail();
        return;
      }
      if ((0, t.alwaysValidSchema)(d, u)) {
        let p = (0, e._)`${S} >= ${s}`;
        _ !== void 0 && (p = (0, e._)`${p} && ${S} <= ${_}`), l.pass(p);
        return;
      }
      d.items = !0;
      const E = n.name("valid");
      _ === void 0 && s === 1 ? y(E, () => n.if(E, () => n.break())) : s === 0 ? (n.let(E, !0), _ !== void 0 && n.if((0, e._)`${c}.length > 0`, h)) : (n.let(E, !1), h()), l.result(E, () => l.reset());
      function h() {
        const p = n.name("_valid"), w = n.let("count", 0);
        y(p, () => n.if(p, () => i(w)));
      }
      function y(p, w) {
        n.forRange("i", 0, S, (m) => {
          l.subschema({
            keyword: "contains",
            dataProp: m,
            dataPropType: t.Type.Num,
            compositeRule: !0
          }, p), w();
        });
      }
      function i(p) {
        n.code((0, e._)`${p}++`), _ === void 0 ? n.if((0, e._)`${p} >= ${s}`, () => n.assign(E, !0).break()) : (n.if((0, e._)`${p} > ${_}`, () => n.assign(E, !1).break()), s === 1 ? n.assign(E, !0) : n.if((0, e._)`${p} >= ${s}`, () => n.assign(E, !0)));
      }
    }
  };
  return en.default = r, en;
}
var os = {}, Ui;
function zd() {
  return Ui || (Ui = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.validateSchemaDeps = e.validatePropertyDeps = e.error = void 0;
    const t = re(), a = ie(), r = Ve();
    e.error = {
      message: ({ params: { property: c, depsCount: d, deps: s } }) => {
        const _ = d === 1 ? "property" : "properties";
        return (0, t.str)`must have ${_} ${s} when property ${c} is present`;
      },
      params: ({ params: { property: c, depsCount: d, deps: s, missingProperty: _ } }) => (0, t._)`{property: ${c},
    missingProperty: ${_},
    depsCount: ${d},
    deps: ${s}}`
      // TODO change to reference
    };
    const l = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: e.error,
      code(c) {
        const [d, s] = n(c);
        u(c, d), o(c, s);
      }
    };
    function n({ schema: c }) {
      const d = {}, s = {};
      for (const _ in c) {
        if (_ === "__proto__")
          continue;
        const $ = Array.isArray(c[_]) ? d : s;
        $[_] = c[_];
      }
      return [d, s];
    }
    function u(c, d = c.schema) {
      const { gen: s, data: _, it: $ } = c;
      if (Object.keys(d).length === 0)
        return;
      const v = s.let("missing");
      for (const S in d) {
        const E = d[S];
        if (E.length === 0)
          continue;
        const h = (0, r.propertyInData)(s, _, S, $.opts.ownProperties);
        c.setParams({
          property: S,
          depsCount: E.length,
          deps: E.join(", ")
        }), $.allErrors ? s.if(h, () => {
          for (const y of E)
            (0, r.checkReportMissingProp)(c, y);
        }) : (s.if((0, t._)`${h} && (${(0, r.checkMissingProp)(c, E, v)})`), (0, r.reportMissingProp)(c, v), s.else());
      }
    }
    e.validatePropertyDeps = u;
    function o(c, d = c.schema) {
      const { gen: s, data: _, keyword: $, it: v } = c, S = s.name("valid");
      for (const E in d)
        (0, a.alwaysValidSchema)(v, d[E]) || (s.if(
          (0, r.propertyInData)(s, _, E, v.opts.ownProperties),
          () => {
            const h = c.subschema({ keyword: $, schemaProp: E }, S);
            c.mergeValidEvaluated(h, S);
          },
          () => s.var(S, !0)
          // TODO var
        ), c.ok(S));
    }
    e.validateSchemaDeps = o, e.default = l;
  })(os)), os;
}
var tn = {}, zi;
function Kd() {
  if (zi) return tn;
  zi = 1, Object.defineProperty(tn, "__esModule", { value: !0 });
  const e = re(), t = ie(), r = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: {
      message: "property name must be valid",
      params: ({ params: l }) => (0, e._)`{propertyName: ${l.propertyName}}`
    },
    code(l) {
      const { gen: n, schema: u, data: o, it: c } = l;
      if ((0, t.alwaysValidSchema)(c, u))
        return;
      const d = n.name("valid");
      n.forIn("key", o, (s) => {
        l.setParams({ propertyName: s }), l.subschema({
          keyword: "propertyNames",
          data: s,
          dataTypes: ["string"],
          propertyName: s,
          compositeRule: !0
        }, d), n.if((0, e.not)(d), () => {
          l.error(!0), c.allErrors || n.break();
        });
      }), l.ok(d);
    }
  };
  return tn.default = r, tn;
}
var rn = {}, Ki;
function _u() {
  if (Ki) return rn;
  Ki = 1, Object.defineProperty(rn, "__esModule", { value: !0 });
  const e = Ve(), t = re(), a = et(), r = ie(), n = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: !0,
    trackErrors: !0,
    error: {
      message: "must NOT have additional properties",
      params: ({ params: u }) => (0, t._)`{additionalProperty: ${u.additionalProperty}}`
    },
    code(u) {
      const { gen: o, schema: c, parentSchema: d, data: s, errsCount: _, it: $ } = u;
      if (!_)
        throw new Error("ajv implementation error");
      const { allErrors: v, opts: S } = $;
      if ($.props = !0, S.removeAdditional !== "all" && (0, r.alwaysValidSchema)($, c))
        return;
      const E = (0, e.allSchemaProperties)(d.properties), h = (0, e.allSchemaProperties)(d.patternProperties);
      y(), u.ok((0, t._)`${_} === ${a.default.errors}`);
      function y() {
        o.forIn("key", s, (g) => {
          !E.length && !h.length ? w(g) : o.if(i(g), () => w(g));
        });
      }
      function i(g) {
        let P;
        if (E.length > 8) {
          const I = (0, r.schemaRefOrVal)($, d.properties, "properties");
          P = (0, e.isOwnProperty)(o, I, g);
        } else E.length ? P = (0, t.or)(...E.map((I) => (0, t._)`${g} === ${I}`)) : P = t.nil;
        return h.length && (P = (0, t.or)(P, ...h.map((I) => (0, t._)`${(0, e.usePattern)(u, I)}.test(${g})`))), (0, t.not)(P);
      }
      function p(g) {
        o.code((0, t._)`delete ${s}[${g}]`);
      }
      function w(g) {
        if (S.removeAdditional === "all" || S.removeAdditional && c === !1) {
          p(g);
          return;
        }
        if (c === !1) {
          u.setParams({ additionalProperty: g }), u.error(), v || o.break();
          return;
        }
        if (typeof c == "object" && !(0, r.alwaysValidSchema)($, c)) {
          const P = o.name("valid");
          S.removeAdditional === "failing" ? (m(g, P, !1), o.if((0, t.not)(P), () => {
            u.reset(), p(g);
          })) : (m(g, P), v || o.if((0, t.not)(P), () => o.break()));
        }
      }
      function m(g, P, I) {
        const A = {
          keyword: "additionalProperties",
          dataProp: g,
          dataPropType: r.Type.Str
        };
        I === !1 && Object.assign(A, {
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }), u.subschema(A, P);
      }
    }
  };
  return rn.default = n, rn;
}
var nn = {}, Gi;
function Gd() {
  if (Gi) return nn;
  Gi = 1, Object.defineProperty(nn, "__esModule", { value: !0 });
  const e = jn(), t = Ve(), a = ie(), r = _u(), l = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(n) {
      const { gen: u, schema: o, parentSchema: c, data: d, it: s } = n;
      s.opts.removeAdditional === "all" && c.additionalProperties === void 0 && r.default.code(new e.KeywordCxt(s, r.default, "additionalProperties"));
      const _ = (0, t.allSchemaProperties)(o);
      for (const h of _)
        s.definedProperties.add(h);
      s.opts.unevaluated && _.length && s.props !== !0 && (s.props = a.mergeEvaluated.props(u, (0, a.toHash)(_), s.props));
      const $ = _.filter((h) => !(0, a.alwaysValidSchema)(s, o[h]));
      if ($.length === 0)
        return;
      const v = u.name("valid");
      for (const h of $)
        S(h) ? E(h) : (u.if((0, t.propertyInData)(u, d, h, s.opts.ownProperties)), E(h), s.allErrors || u.else().var(v, !0), u.endIf()), n.it.definedProperties.add(h), n.ok(v);
      function S(h) {
        return s.opts.useDefaults && !s.compositeRule && o[h].default !== void 0;
      }
      function E(h) {
        n.subschema({
          keyword: "properties",
          schemaProp: h,
          dataProp: h
        }, v);
      }
    }
  };
  return nn.default = l, nn;
}
var sn = {}, Hi;
function Hd() {
  if (Hi) return sn;
  Hi = 1, Object.defineProperty(sn, "__esModule", { value: !0 });
  const e = Ve(), t = re(), a = ie(), r = ie(), l = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(n) {
      const { gen: u, schema: o, data: c, parentSchema: d, it: s } = n, { opts: _ } = s, $ = (0, e.allSchemaProperties)(o), v = $.filter((w) => (0, a.alwaysValidSchema)(s, o[w]));
      if ($.length === 0 || v.length === $.length && (!s.opts.unevaluated || s.props === !0))
        return;
      const S = _.strictSchema && !_.allowMatchingProperties && d.properties, E = u.name("valid");
      s.props !== !0 && !(s.props instanceof t.Name) && (s.props = (0, r.evaluatedPropsToName)(u, s.props));
      const { props: h } = s;
      y();
      function y() {
        for (const w of $)
          S && i(w), s.allErrors ? p(w) : (u.var(E, !0), p(w), u.if(E));
      }
      function i(w) {
        for (const m in S)
          new RegExp(w).test(m) && (0, a.checkStrictMode)(s, `property ${m} matches pattern ${w} (use allowMatchingProperties)`);
      }
      function p(w) {
        u.forIn("key", c, (m) => {
          u.if((0, t._)`${(0, e.usePattern)(n, w)}.test(${m})`, () => {
            const g = v.includes(w);
            g || n.subschema({
              keyword: "patternProperties",
              schemaProp: w,
              dataProp: m,
              dataPropType: r.Type.Str
            }, E), s.opts.unevaluated && h !== !0 ? u.assign((0, t._)`${h}[${m}]`, !0) : !g && !s.allErrors && u.if((0, t.not)(E), () => u.break());
          });
        });
      }
    }
  };
  return sn.default = l, sn;
}
var an = {}, Wi;
function Wd() {
  if (Wi) return an;
  Wi = 1, Object.defineProperty(an, "__esModule", { value: !0 });
  const e = ie(), t = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    code(a) {
      const { gen: r, schema: l, it: n } = a;
      if ((0, e.alwaysValidSchema)(n, l)) {
        a.fail();
        return;
      }
      const u = r.name("valid");
      a.subschema({
        keyword: "not",
        compositeRule: !0,
        createErrors: !1,
        allErrors: !1
      }, u), a.failResult(u, () => a.reset(), () => a.error());
    },
    error: { message: "must NOT be valid" }
  };
  return an.default = t, an;
}
var on = {}, Bi;
function Bd() {
  if (Bi) return on;
  Bi = 1, Object.defineProperty(on, "__esModule", { value: !0 });
  const t = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: !0,
    code: Ve().validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  return on.default = t, on;
}
var cn = {}, Ji;
function Jd() {
  if (Ji) return cn;
  Ji = 1, Object.defineProperty(cn, "__esModule", { value: !0 });
  const e = re(), t = ie(), r = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: !0,
    error: {
      message: "must match exactly one schema in oneOf",
      params: ({ params: l }) => (0, e._)`{passingSchemas: ${l.passing}}`
    },
    code(l) {
      const { gen: n, schema: u, parentSchema: o, it: c } = l;
      if (!Array.isArray(u))
        throw new Error("ajv implementation error");
      if (c.opts.discriminator && o.discriminator)
        return;
      const d = u, s = n.let("valid", !1), _ = n.let("passing", null), $ = n.name("_valid");
      l.setParams({ passing: _ }), n.block(v), l.result(s, () => l.reset(), () => l.error(!0));
      function v() {
        d.forEach((S, E) => {
          let h;
          (0, t.alwaysValidSchema)(c, S) ? n.var($, !0) : h = l.subschema({
            keyword: "oneOf",
            schemaProp: E,
            compositeRule: !0
          }, $), E > 0 && n.if((0, e._)`${$} && ${s}`).assign(s, !1).assign(_, (0, e._)`[${_}, ${E}]`).else(), n.if($, () => {
            n.assign(s, !0), n.assign(_, E), h && l.mergeEvaluated(h, e.Name);
          });
        });
      }
    }
  };
  return cn.default = r, cn;
}
var un = {}, Xi;
function Xd() {
  if (Xi) return un;
  Xi = 1, Object.defineProperty(un, "__esModule", { value: !0 });
  const e = ie(), t = {
    keyword: "allOf",
    schemaType: "array",
    code(a) {
      const { gen: r, schema: l, it: n } = a;
      if (!Array.isArray(l))
        throw new Error("ajv implementation error");
      const u = r.name("valid");
      l.forEach((o, c) => {
        if ((0, e.alwaysValidSchema)(n, o))
          return;
        const d = a.subschema({ keyword: "allOf", schemaProp: c }, u);
        a.ok(u), a.mergeEvaluated(d);
      });
    }
  };
  return un.default = t, un;
}
var ln = {}, Yi;
function Yd() {
  if (Yi) return ln;
  Yi = 1, Object.defineProperty(ln, "__esModule", { value: !0 });
  const e = re(), t = ie(), r = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: !0,
    error: {
      message: ({ params: n }) => (0, e.str)`must match "${n.ifClause}" schema`,
      params: ({ params: n }) => (0, e._)`{failingKeyword: ${n.ifClause}}`
    },
    code(n) {
      const { gen: u, parentSchema: o, it: c } = n;
      o.then === void 0 && o.else === void 0 && (0, t.checkStrictMode)(c, '"if" without "then" and "else" is ignored');
      const d = l(c, "then"), s = l(c, "else");
      if (!d && !s)
        return;
      const _ = u.let("valid", !0), $ = u.name("_valid");
      if (v(), n.reset(), d && s) {
        const E = u.let("ifClause");
        n.setParams({ ifClause: E }), u.if($, S("then", E), S("else", E));
      } else d ? u.if($, S("then")) : u.if((0, e.not)($), S("else"));
      n.pass(_, () => n.error(!0));
      function v() {
        const E = n.subschema({
          keyword: "if",
          compositeRule: !0,
          createErrors: !1,
          allErrors: !1
        }, $);
        n.mergeEvaluated(E);
      }
      function S(E, h) {
        return () => {
          const y = n.subschema({ keyword: E }, $);
          u.assign(_, $), n.mergeValidEvaluated(y, _), h ? u.assign(h, (0, e._)`${E}`) : n.setParams({ ifClause: E });
        };
      }
    }
  };
  function l(n, u) {
    const o = n.schema[u];
    return o !== void 0 && !(0, t.alwaysValidSchema)(n, o);
  }
  return ln.default = r, ln;
}
var dn = {}, xi;
function xd() {
  if (xi) return dn;
  xi = 1, Object.defineProperty(dn, "__esModule", { value: !0 });
  const e = ie(), t = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword: a, parentSchema: r, it: l }) {
      r.if === void 0 && (0, e.checkStrictMode)(l, `"${a}" without "if" is ignored`);
    }
  };
  return dn.default = t, dn;
}
var Qi;
function Qd() {
  if (Qi) return xr;
  Qi = 1, Object.defineProperty(xr, "__esModule", { value: !0 });
  const e = vu(), t = Fd(), a = $u(), r = Vd(), l = Ud(), n = zd(), u = Kd(), o = _u(), c = Gd(), d = Hd(), s = Wd(), _ = Bd(), $ = Jd(), v = Xd(), S = Yd(), E = xd();
  function h(y = !1) {
    const i = [
      // any
      s.default,
      _.default,
      $.default,
      v.default,
      S.default,
      E.default,
      // object
      u.default,
      o.default,
      n.default,
      c.default,
      d.default
    ];
    return y ? i.push(t.default, r.default) : i.push(e.default, a.default), i.push(l.default), i;
  }
  return xr.default = h, xr;
}
var fn = {}, hn = {}, Zi;
function Zd() {
  if (Zi) return hn;
  Zi = 1, Object.defineProperty(hn, "__esModule", { value: !0 });
  const e = re(), a = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: !0,
    error: {
      message: ({ schemaCode: r }) => (0, e.str)`must match format "${r}"`,
      params: ({ schemaCode: r }) => (0, e._)`{format: ${r}}`
    },
    code(r, l) {
      const { gen: n, data: u, $data: o, schema: c, schemaCode: d, it: s } = r, { opts: _, errSchemaPath: $, schemaEnv: v, self: S } = s;
      if (!_.validateFormats)
        return;
      o ? E() : h();
      function E() {
        const y = n.scopeValue("formats", {
          ref: S.formats,
          code: _.code.formats
        }), i = n.const("fDef", (0, e._)`${y}[${d}]`), p = n.let("fType"), w = n.let("format");
        n.if((0, e._)`typeof ${i} == "object" && !(${i} instanceof RegExp)`, () => n.assign(p, (0, e._)`${i}.type || "string"`).assign(w, (0, e._)`${i}.validate`), () => n.assign(p, (0, e._)`"string"`).assign(w, i)), r.fail$data((0, e.or)(m(), g()));
        function m() {
          return _.strictSchema === !1 ? e.nil : (0, e._)`${d} && !${w}`;
        }
        function g() {
          const P = v.$async ? (0, e._)`(${i}.async ? await ${w}(${u}) : ${w}(${u}))` : (0, e._)`${w}(${u})`, I = (0, e._)`(typeof ${w} == "function" ? ${P} : ${w}.test(${u}))`;
          return (0, e._)`${w} && ${w} !== true && ${p} === ${l} && !${I}`;
        }
      }
      function h() {
        const y = S.formats[c];
        if (!y) {
          m();
          return;
        }
        if (y === !0)
          return;
        const [i, p, w] = g(y);
        i === l && r.pass(P());
        function m() {
          if (_.strictSchema === !1) {
            S.logger.warn(I());
            return;
          }
          throw new Error(I());
          function I() {
            return `unknown format "${c}" ignored in schema at path "${$}"`;
          }
        }
        function g(I) {
          const A = I instanceof RegExp ? (0, e.regexpCode)(I) : _.code.formats ? (0, e._)`${_.code.formats}${(0, e.getProperty)(c)}` : void 0, M = n.scopeValue("formats", { key: c, ref: I, code: A });
          return typeof I == "object" && !(I instanceof RegExp) ? [I.type || "string", I.validate, (0, e._)`${M}.validate`] : ["string", I, M];
        }
        function P() {
          if (typeof y == "object" && !(y instanceof RegExp) && y.async) {
            if (!v.$async)
              throw new Error("async format in sync schema");
            return (0, e._)`await ${w}(${u})`;
          }
          return typeof p == "function" ? (0, e._)`${w}(${u})` : (0, e._)`${w}.test(${u})`;
        }
      }
    }
  };
  return hn.default = a, hn;
}
var ec;
function ef() {
  if (ec) return fn;
  ec = 1, Object.defineProperty(fn, "__esModule", { value: !0 });
  const t = [Zd().default];
  return fn.default = t, fn;
}
var ft = {}, tc;
function tf() {
  return tc || (tc = 1, Object.defineProperty(ft, "__esModule", { value: !0 }), ft.contentVocabulary = ft.metadataVocabulary = void 0, ft.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ], ft.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ]), ft;
}
var rc;
function rf() {
  if (rc) return qr;
  rc = 1, Object.defineProperty(qr, "__esModule", { value: !0 });
  const e = Rd(), t = Ld(), a = Qd(), r = ef(), l = tf(), n = [
    e.default,
    t.default,
    (0, a.default)(),
    r.default,
    l.metadataVocabulary,
    l.contentVocabulary
  ];
  return qr.default = n, qr;
}
var pn = {}, Pt = {}, nc;
function nf() {
  if (nc) return Pt;
  nc = 1, Object.defineProperty(Pt, "__esModule", { value: !0 }), Pt.DiscrError = void 0;
  var e;
  return (function(t) {
    t.Tag = "tag", t.Mapping = "mapping";
  })(e || (Pt.DiscrError = e = {})), Pt;
}
var sc;
function sf() {
  if (sc) return pn;
  sc = 1, Object.defineProperty(pn, "__esModule", { value: !0 });
  const e = re(), t = nf(), a = ca(), r = kn(), l = ie(), u = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error: {
      message: ({ params: { discrError: o, tagName: c } }) => o === t.DiscrError.Tag ? `tag "${c}" must be string` : `value of tag "${c}" must be in oneOf`,
      params: ({ params: { discrError: o, tag: c, tagName: d } }) => (0, e._)`{error: ${o}, tag: ${d}, tagValue: ${c}}`
    },
    code(o) {
      const { gen: c, data: d, schema: s, parentSchema: _, it: $ } = o, { oneOf: v } = _;
      if (!$.opts.discriminator)
        throw new Error("discriminator: requires discriminator option");
      const S = s.propertyName;
      if (typeof S != "string")
        throw new Error("discriminator: requires propertyName");
      if (s.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!v)
        throw new Error("discriminator: requires oneOf keyword");
      const E = c.let("valid", !1), h = c.const("tag", (0, e._)`${d}${(0, e.getProperty)(S)}`);
      c.if((0, e._)`typeof ${h} == "string"`, () => y(), () => o.error(!1, { discrError: t.DiscrError.Tag, tag: h, tagName: S })), o.ok(E);
      function y() {
        const w = p();
        c.if(!1);
        for (const m in w)
          c.elseIf((0, e._)`${h} === ${m}`), c.assign(E, i(w[m]));
        c.else(), o.error(!1, { discrError: t.DiscrError.Mapping, tag: h, tagName: S }), c.endIf();
      }
      function i(w) {
        const m = c.name("valid"), g = o.subschema({ keyword: "oneOf", schemaProp: w }, m);
        return o.mergeEvaluated(g, e.Name), m;
      }
      function p() {
        var w;
        const m = {}, g = I(_);
        let P = !0;
        for (let F = 0; F < v.length; F++) {
          let W = v[F];
          if (W != null && W.$ref && !(0, l.schemaHasRulesButRef)(W, $.self.RULES)) {
            const V = W.$ref;
            if (W = a.resolveRef.call($.self, $.schemaEnv.root, $.baseId, V), W instanceof a.SchemaEnv && (W = W.schema), W === void 0)
              throw new r.default($.opts.uriResolver, $.baseId, V);
          }
          const B = (w = W == null ? void 0 : W.properties) === null || w === void 0 ? void 0 : w[S];
          if (typeof B != "object")
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${S}"`);
          P = P && (g || I(W)), A(B, F);
        }
        if (!P)
          throw new Error(`discriminator: "${S}" must be required`);
        return m;
        function I({ required: F }) {
          return Array.isArray(F) && F.includes(S);
        }
        function A(F, W) {
          if (F.const)
            M(F.const, W);
          else if (F.enum)
            for (const B of F.enum)
              M(B, W);
          else
            throw new Error(`discriminator: "properties/${S}" must have "const" or "enum"`);
        }
        function M(F, W) {
          if (typeof F != "string" || F in m)
            throw new Error(`discriminator: "${S}" values must be unique strings`);
          m[F] = W;
        }
      }
    }
  };
  return pn.default = u, pn;
}
const af = "http://json-schema.org/draft-07/schema#", of = "http://json-schema.org/draft-07/schema#", cf = "Core schema meta-schema", uf = { schemaArray: { type: "array", minItems: 1, items: { $ref: "#" } }, nonNegativeInteger: { type: "integer", minimum: 0 }, nonNegativeIntegerDefault0: { allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }] }, simpleTypes: { enum: ["array", "boolean", "integer", "null", "number", "object", "string"] }, stringArray: { type: "array", items: { type: "string" }, uniqueItems: !0, default: [] } }, lf = ["object", "boolean"], df = { $id: { type: "string", format: "uri-reference" }, $schema: { type: "string", format: "uri" }, $ref: { type: "string", format: "uri-reference" }, $comment: { type: "string" }, title: { type: "string" }, description: { type: "string" }, default: !0, readOnly: { type: "boolean", default: !1 }, examples: { type: "array", items: !0 }, multipleOf: { type: "number", exclusiveMinimum: 0 }, maximum: { type: "number" }, exclusiveMaximum: { type: "number" }, minimum: { type: "number" }, exclusiveMinimum: { type: "number" }, maxLength: { $ref: "#/definitions/nonNegativeInteger" }, minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, pattern: { type: "string", format: "regex" }, additionalItems: { $ref: "#" }, items: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }], default: !0 }, maxItems: { $ref: "#/definitions/nonNegativeInteger" }, minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, uniqueItems: { type: "boolean", default: !1 }, contains: { $ref: "#" }, maxProperties: { $ref: "#/definitions/nonNegativeInteger" }, minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" }, required: { $ref: "#/definitions/stringArray" }, additionalProperties: { $ref: "#" }, definitions: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, properties: { type: "object", additionalProperties: { $ref: "#" }, default: {} }, patternProperties: { type: "object", additionalProperties: { $ref: "#" }, propertyNames: { format: "regex" }, default: {} }, dependencies: { type: "object", additionalProperties: { anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }] } }, propertyNames: { $ref: "#" }, const: !0, enum: { type: "array", items: !0, minItems: 1, uniqueItems: !0 }, type: { anyOf: [{ $ref: "#/definitions/simpleTypes" }, { type: "array", items: { $ref: "#/definitions/simpleTypes" }, minItems: 1, uniqueItems: !0 }] }, format: { type: "string" }, contentMediaType: { type: "string" }, contentEncoding: { type: "string" }, if: { $ref: "#" }, then: { $ref: "#" }, else: { $ref: "#" }, allOf: { $ref: "#/definitions/schemaArray" }, anyOf: { $ref: "#/definitions/schemaArray" }, oneOf: { $ref: "#/definitions/schemaArray" }, not: { $ref: "#" } }, ff = {
  $schema: af,
  $id: of,
  title: cf,
  definitions: uf,
  type: lf,
  properties: df,
  default: !0
};
var ac;
function hf() {
  return ac || (ac = 1, (function(e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.MissingRefError = t.ValidationError = t.CodeGen = t.Name = t.nil = t.stringify = t.str = t._ = t.KeywordCxt = t.Ajv = void 0;
    const a = Sd(), r = rf(), l = sf(), n = ff, u = ["/properties"], o = "http://json-schema.org/draft-07/schema";
    class c extends a.default {
      _addVocabularies() {
        super._addVocabularies(), r.default.forEach((S) => this.addVocabulary(S)), this.opts.discriminator && this.addKeyword(l.default);
      }
      _addDefaultMetaSchema() {
        if (super._addDefaultMetaSchema(), !this.opts.meta)
          return;
        const S = this.opts.$data ? this.$dataMetaSchema(n, u) : n;
        this.addMetaSchema(S, o, !1), this.refs["http://json-schema.org/schema"] = o;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(o) ? o : void 0);
      }
    }
    t.Ajv = c, e.exports = t = c, e.exports.Ajv = c, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = c;
    var d = jn();
    Object.defineProperty(t, "KeywordCxt", { enumerable: !0, get: function() {
      return d.KeywordCxt;
    } });
    var s = re();
    Object.defineProperty(t, "_", { enumerable: !0, get: function() {
      return s._;
    } }), Object.defineProperty(t, "str", { enumerable: !0, get: function() {
      return s.str;
    } }), Object.defineProperty(t, "stringify", { enumerable: !0, get: function() {
      return s.stringify;
    } }), Object.defineProperty(t, "nil", { enumerable: !0, get: function() {
      return s.nil;
    } }), Object.defineProperty(t, "Name", { enumerable: !0, get: function() {
      return s.Name;
    } }), Object.defineProperty(t, "CodeGen", { enumerable: !0, get: function() {
      return s.CodeGen;
    } });
    var _ = ia();
    Object.defineProperty(t, "ValidationError", { enumerable: !0, get: function() {
      return _.default;
    } });
    var $ = kn();
    Object.defineProperty(t, "MissingRefError", { enumerable: !0, get: function() {
      return $.default;
    } });
  })(Ir, Ir.exports)), Ir.exports;
}
var oc;
function pf() {
  return oc || (oc = 1, (function(e) {
    Object.defineProperty(e, "__esModule", { value: !0 }), e.formatLimitDefinition = void 0;
    const t = hf(), a = re(), r = a.operators, l = {
      formatMaximum: { okStr: "<=", ok: r.LTE, fail: r.GT },
      formatMinimum: { okStr: ">=", ok: r.GTE, fail: r.LT },
      formatExclusiveMaximum: { okStr: "<", ok: r.LT, fail: r.GTE },
      formatExclusiveMinimum: { okStr: ">", ok: r.GT, fail: r.LTE }
    }, n = {
      message: ({ keyword: o, schemaCode: c }) => a.str`should be ${l[o].okStr} ${c}`,
      params: ({ keyword: o, schemaCode: c }) => a._`{comparison: ${l[o].okStr}, limit: ${c}}`
    };
    e.formatLimitDefinition = {
      keyword: Object.keys(l),
      type: "string",
      schemaType: "string",
      $data: !0,
      error: n,
      code(o) {
        const { gen: c, data: d, schemaCode: s, keyword: _, it: $ } = o, { opts: v, self: S } = $;
        if (!v.validateFormats)
          return;
        const E = new t.KeywordCxt($, S.RULES.all.format.definition, "format");
        E.$data ? h() : y();
        function h() {
          const p = c.scopeValue("formats", {
            ref: S.formats,
            code: v.code.formats
          }), w = c.const("fmt", a._`${p}[${E.schemaCode}]`);
          o.fail$data(a.or(a._`typeof ${w} != "object"`, a._`${w} instanceof RegExp`, a._`typeof ${w}.compare != "function"`, i(w)));
        }
        function y() {
          const p = E.schema, w = S.formats[p];
          if (!w || w === !0)
            return;
          if (typeof w != "object" || w instanceof RegExp || typeof w.compare != "function")
            throw new Error(`"${_}": format "${p}" does not define "compare" function`);
          const m = c.scopeValue("formats", {
            key: p,
            ref: w,
            code: v.code.formats ? a._`${v.code.formats}${a.getProperty(p)}` : void 0
          });
          o.fail$data(i(m));
        }
        function i(p) {
          return a._`${p}.compare(${d}, ${s}) ${l[_].fail} 0`;
        }
      },
      dependencies: ["format"]
    };
    const u = (o) => (o.addKeyword(e.formatLimitDefinition), o);
    e.default = u;
  })(Zn)), Zn;
}
var ic;
function mf() {
  return ic || (ic = 1, (function(e, t) {
    Object.defineProperty(t, "__esModule", { value: !0 });
    const a = ud(), r = pf(), l = re(), n = new l.Name("fullFormats"), u = new l.Name("fastFormats"), o = (d, s = { keywords: !0 }) => {
      if (Array.isArray(s))
        return c(d, s, a.fullFormats, n), d;
      const [_, $] = s.mode === "fast" ? [a.fastFormats, u] : [a.fullFormats, n], v = s.formats || a.formatNames;
      return c(d, v, _, $), s.keywords && r.default(d), d;
    };
    o.get = (d, s = "full") => {
      const $ = (s === "fast" ? a.fastFormats : a.fullFormats)[d];
      if (!$)
        throw new Error(`Unknown format "${d}"`);
      return $;
    };
    function c(d, s, _, $) {
      var v, S;
      (v = (S = d.opts.code).formats) !== null && v !== void 0 || (S.formats = l._`require("ajv-formats/dist/formats").${$}`);
      for (const E of s)
        d.addFormat(E, _[E]);
    }
    e.exports = t = o, Object.defineProperty(t, "__esModule", { value: !0 }), t.default = o;
  })(Tr, Tr.exports)), Tr.exports;
}
var is, cc;
function yf() {
  if (cc) return is;
  cc = 1;
  const e = (c, d, s, _) => {
    if (s === "length" || s === "prototype" || s === "arguments" || s === "caller")
      return;
    const $ = Object.getOwnPropertyDescriptor(c, s), v = Object.getOwnPropertyDescriptor(d, s);
    !t($, v) && _ || Object.defineProperty(c, s, v);
  }, t = function(c, d) {
    return c === void 0 || c.configurable || c.writable === d.writable && c.enumerable === d.enumerable && c.configurable === d.configurable && (c.writable || c.value === d.value);
  }, a = (c, d) => {
    const s = Object.getPrototypeOf(d);
    s !== Object.getPrototypeOf(c) && Object.setPrototypeOf(c, s);
  }, r = (c, d) => `/* Wrapped ${c}*/
${d}`, l = Object.getOwnPropertyDescriptor(Function.prototype, "toString"), n = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name"), u = (c, d, s) => {
    const _ = s === "" ? "" : `with ${s.trim()}() `, $ = r.bind(null, _, d.toString());
    Object.defineProperty($, "name", n), Object.defineProperty(c, "toString", { ...l, value: $ });
  };
  return is = (c, d, { ignoreNonConfigurable: s = !1 } = {}) => {
    const { name: _ } = c;
    for (const $ of Reflect.ownKeys(d))
      e(c, d, $, s);
    return a(c, d), u(c, d, _), c;
  }, is;
}
var cs, uc;
function gf() {
  if (uc) return cs;
  uc = 1;
  const e = yf();
  return cs = (t, a = {}) => {
    if (typeof t != "function")
      throw new TypeError(`Expected the first argument to be a function, got \`${typeof t}\``);
    const {
      wait: r = 0,
      before: l = !1,
      after: n = !0
    } = a;
    if (!l && !n)
      throw new Error("Both `before` and `after` are false, function wouldn't be called.");
    let u, o;
    const c = function(...d) {
      const s = this, _ = () => {
        u = void 0, n && (o = t.apply(s, d));
      }, $ = l && !u;
      return clearTimeout(u), u = setTimeout(_, r), $ && (o = t.apply(s, d)), o;
    };
    return e(c, t), c.cancel = () => {
      u && (clearTimeout(u), u = void 0);
    }, c;
  }, cs;
}
var mn = { exports: {} }, us, lc;
function Cn() {
  if (lc) return us;
  lc = 1;
  const e = "2.0.0", t = 256, a = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991, r = 16, l = t - 6;
  return us = {
    MAX_LENGTH: t,
    MAX_SAFE_COMPONENT_LENGTH: r,
    MAX_SAFE_BUILD_LENGTH: l,
    MAX_SAFE_INTEGER: a,
    RELEASE_TYPES: [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ],
    SEMVER_SPEC_VERSION: e,
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  }, us;
}
var ls, dc;
function An() {
  return dc || (dc = 1, ls = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...t) => console.error("SEMVER", ...t) : () => {
  }), ls;
}
var fc;
function jt() {
  return fc || (fc = 1, (function(e, t) {
    const {
      MAX_SAFE_COMPONENT_LENGTH: a,
      MAX_SAFE_BUILD_LENGTH: r,
      MAX_LENGTH: l
    } = Cn(), n = An();
    t = e.exports = {};
    const u = t.re = [], o = t.safeRe = [], c = t.src = [], d = t.safeSrc = [], s = t.t = {};
    let _ = 0;
    const $ = "[a-zA-Z0-9-]", v = [
      ["\\s", 1],
      ["\\d", l],
      [$, r]
    ], S = (h) => {
      for (const [y, i] of v)
        h = h.split(`${y}*`).join(`${y}{0,${i}}`).split(`${y}+`).join(`${y}{1,${i}}`);
      return h;
    }, E = (h, y, i) => {
      const p = S(y), w = _++;
      n(h, w, y), s[h] = w, c[w] = y, d[w] = p, u[w] = new RegExp(y, i ? "g" : void 0), o[w] = new RegExp(p, i ? "g" : void 0);
    };
    E("NUMERICIDENTIFIER", "0|[1-9]\\d*"), E("NUMERICIDENTIFIERLOOSE", "\\d+"), E("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${$}*`), E("MAINVERSION", `(${c[s.NUMERICIDENTIFIER]})\\.(${c[s.NUMERICIDENTIFIER]})\\.(${c[s.NUMERICIDENTIFIER]})`), E("MAINVERSIONLOOSE", `(${c[s.NUMERICIDENTIFIERLOOSE]})\\.(${c[s.NUMERICIDENTIFIERLOOSE]})\\.(${c[s.NUMERICIDENTIFIERLOOSE]})`), E("PRERELEASEIDENTIFIER", `(?:${c[s.NONNUMERICIDENTIFIER]}|${c[s.NUMERICIDENTIFIER]})`), E("PRERELEASEIDENTIFIERLOOSE", `(?:${c[s.NONNUMERICIDENTIFIER]}|${c[s.NUMERICIDENTIFIERLOOSE]})`), E("PRERELEASE", `(?:-(${c[s.PRERELEASEIDENTIFIER]}(?:\\.${c[s.PRERELEASEIDENTIFIER]})*))`), E("PRERELEASELOOSE", `(?:-?(${c[s.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${c[s.PRERELEASEIDENTIFIERLOOSE]})*))`), E("BUILDIDENTIFIER", `${$}+`), E("BUILD", `(?:\\+(${c[s.BUILDIDENTIFIER]}(?:\\.${c[s.BUILDIDENTIFIER]})*))`), E("FULLPLAIN", `v?${c[s.MAINVERSION]}${c[s.PRERELEASE]}?${c[s.BUILD]}?`), E("FULL", `^${c[s.FULLPLAIN]}$`), E("LOOSEPLAIN", `[v=\\s]*${c[s.MAINVERSIONLOOSE]}${c[s.PRERELEASELOOSE]}?${c[s.BUILD]}?`), E("LOOSE", `^${c[s.LOOSEPLAIN]}$`), E("GTLT", "((?:<|>)?=?)"), E("XRANGEIDENTIFIERLOOSE", `${c[s.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), E("XRANGEIDENTIFIER", `${c[s.NUMERICIDENTIFIER]}|x|X|\\*`), E("XRANGEPLAIN", `[v=\\s]*(${c[s.XRANGEIDENTIFIER]})(?:\\.(${c[s.XRANGEIDENTIFIER]})(?:\\.(${c[s.XRANGEIDENTIFIER]})(?:${c[s.PRERELEASE]})?${c[s.BUILD]}?)?)?`), E("XRANGEPLAINLOOSE", `[v=\\s]*(${c[s.XRANGEIDENTIFIERLOOSE]})(?:\\.(${c[s.XRANGEIDENTIFIERLOOSE]})(?:\\.(${c[s.XRANGEIDENTIFIERLOOSE]})(?:${c[s.PRERELEASELOOSE]})?${c[s.BUILD]}?)?)?`), E("XRANGE", `^${c[s.GTLT]}\\s*${c[s.XRANGEPLAIN]}$`), E("XRANGELOOSE", `^${c[s.GTLT]}\\s*${c[s.XRANGEPLAINLOOSE]}$`), E("COERCEPLAIN", `(^|[^\\d])(\\d{1,${a}})(?:\\.(\\d{1,${a}}))?(?:\\.(\\d{1,${a}}))?`), E("COERCE", `${c[s.COERCEPLAIN]}(?:$|[^\\d])`), E("COERCEFULL", c[s.COERCEPLAIN] + `(?:${c[s.PRERELEASE]})?(?:${c[s.BUILD]})?(?:$|[^\\d])`), E("COERCERTL", c[s.COERCE], !0), E("COERCERTLFULL", c[s.COERCEFULL], !0), E("LONETILDE", "(?:~>?)"), E("TILDETRIM", `(\\s*)${c[s.LONETILDE]}\\s+`, !0), t.tildeTrimReplace = "$1~", E("TILDE", `^${c[s.LONETILDE]}${c[s.XRANGEPLAIN]}$`), E("TILDELOOSE", `^${c[s.LONETILDE]}${c[s.XRANGEPLAINLOOSE]}$`), E("LONECARET", "(?:\\^)"), E("CARETTRIM", `(\\s*)${c[s.LONECARET]}\\s+`, !0), t.caretTrimReplace = "$1^", E("CARET", `^${c[s.LONECARET]}${c[s.XRANGEPLAIN]}$`), E("CARETLOOSE", `^${c[s.LONECARET]}${c[s.XRANGEPLAINLOOSE]}$`), E("COMPARATORLOOSE", `^${c[s.GTLT]}\\s*(${c[s.LOOSEPLAIN]})$|^$`), E("COMPARATOR", `^${c[s.GTLT]}\\s*(${c[s.FULLPLAIN]})$|^$`), E("COMPARATORTRIM", `(\\s*)${c[s.GTLT]}\\s*(${c[s.LOOSEPLAIN]}|${c[s.XRANGEPLAIN]})`, !0), t.comparatorTrimReplace = "$1$2$3", E("HYPHENRANGE", `^\\s*(${c[s.XRANGEPLAIN]})\\s+-\\s+(${c[s.XRANGEPLAIN]})\\s*$`), E("HYPHENRANGELOOSE", `^\\s*(${c[s.XRANGEPLAINLOOSE]})\\s+-\\s+(${c[s.XRANGEPLAINLOOSE]})\\s*$`), E("STAR", "(<|>)?=?\\s*\\*"), E("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), E("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  })(mn, mn.exports)), mn.exports;
}
var ds, hc;
function la() {
  if (hc) return ds;
  hc = 1;
  const e = Object.freeze({ loose: !0 }), t = Object.freeze({});
  return ds = (r) => r ? typeof r != "object" ? e : r : t, ds;
}
var fs, pc;
function wu() {
  if (pc) return fs;
  pc = 1;
  const e = /^[0-9]+$/, t = (r, l) => {
    const n = e.test(r), u = e.test(l);
    return n && u && (r = +r, l = +l), r === l ? 0 : n && !u ? -1 : u && !n ? 1 : r < l ? -1 : 1;
  };
  return fs = {
    compareIdentifiers: t,
    rcompareIdentifiers: (r, l) => t(l, r)
  }, fs;
}
var hs, mc;
function Ne() {
  if (mc) return hs;
  mc = 1;
  const e = An(), { MAX_LENGTH: t, MAX_SAFE_INTEGER: a } = Cn(), { safeRe: r, t: l } = jt(), n = la(), { compareIdentifiers: u } = wu();
  class o {
    constructor(d, s) {
      if (s = n(s), d instanceof o) {
        if (d.loose === !!s.loose && d.includePrerelease === !!s.includePrerelease)
          return d;
        d = d.version;
      } else if (typeof d != "string")
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof d}".`);
      if (d.length > t)
        throw new TypeError(
          `version is longer than ${t} characters`
        );
      e("SemVer", d, s), this.options = s, this.loose = !!s.loose, this.includePrerelease = !!s.includePrerelease;
      const _ = d.trim().match(s.loose ? r[l.LOOSE] : r[l.FULL]);
      if (!_)
        throw new TypeError(`Invalid Version: ${d}`);
      if (this.raw = d, this.major = +_[1], this.minor = +_[2], this.patch = +_[3], this.major > a || this.major < 0)
        throw new TypeError("Invalid major version");
      if (this.minor > a || this.minor < 0)
        throw new TypeError("Invalid minor version");
      if (this.patch > a || this.patch < 0)
        throw new TypeError("Invalid patch version");
      _[4] ? this.prerelease = _[4].split(".").map(($) => {
        if (/^[0-9]+$/.test($)) {
          const v = +$;
          if (v >= 0 && v < a)
            return v;
        }
        return $;
      }) : this.prerelease = [], this.build = _[5] ? _[5].split(".") : [], this.format();
    }
    format() {
      return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
    }
    toString() {
      return this.version;
    }
    compare(d) {
      if (e("SemVer.compare", this.version, this.options, d), !(d instanceof o)) {
        if (typeof d == "string" && d === this.version)
          return 0;
        d = new o(d, this.options);
      }
      return d.version === this.version ? 0 : this.compareMain(d) || this.comparePre(d);
    }
    compareMain(d) {
      return d instanceof o || (d = new o(d, this.options)), u(this.major, d.major) || u(this.minor, d.minor) || u(this.patch, d.patch);
    }
    comparePre(d) {
      if (d instanceof o || (d = new o(d, this.options)), this.prerelease.length && !d.prerelease.length)
        return -1;
      if (!this.prerelease.length && d.prerelease.length)
        return 1;
      if (!this.prerelease.length && !d.prerelease.length)
        return 0;
      let s = 0;
      do {
        const _ = this.prerelease[s], $ = d.prerelease[s];
        if (e("prerelease compare", s, _, $), _ === void 0 && $ === void 0)
          return 0;
        if ($ === void 0)
          return 1;
        if (_ === void 0)
          return -1;
        if (_ === $)
          continue;
        return u(_, $);
      } while (++s);
    }
    compareBuild(d) {
      d instanceof o || (d = new o(d, this.options));
      let s = 0;
      do {
        const _ = this.build[s], $ = d.build[s];
        if (e("build compare", s, _, $), _ === void 0 && $ === void 0)
          return 0;
        if ($ === void 0)
          return 1;
        if (_ === void 0)
          return -1;
        if (_ === $)
          continue;
        return u(_, $);
      } while (++s);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(d, s, _) {
      if (d.startsWith("pre")) {
        if (!s && _ === !1)
          throw new Error("invalid increment argument: identifier is empty");
        if (s) {
          const $ = `-${s}`.match(this.options.loose ? r[l.PRERELEASELOOSE] : r[l.PRERELEASE]);
          if (!$ || $[1] !== s)
            throw new Error(`invalid identifier: ${s}`);
        }
      }
      switch (d) {
        case "premajor":
          this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", s, _);
          break;
        case "preminor":
          this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", s, _);
          break;
        case "prepatch":
          this.prerelease.length = 0, this.inc("patch", s, _), this.inc("pre", s, _);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          this.prerelease.length === 0 && this.inc("patch", s, _), this.inc("pre", s, _);
          break;
        case "release":
          if (this.prerelease.length === 0)
            throw new Error(`version ${this.raw} is not a prerelease`);
          this.prerelease.length = 0;
          break;
        case "major":
          (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
          break;
        case "minor":
          (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
          break;
        case "patch":
          this.prerelease.length === 0 && this.patch++, this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre": {
          const $ = Number(_) ? 1 : 0;
          if (this.prerelease.length === 0)
            this.prerelease = [$];
          else {
            let v = this.prerelease.length;
            for (; --v >= 0; )
              typeof this.prerelease[v] == "number" && (this.prerelease[v]++, v = -2);
            if (v === -1) {
              if (s === this.prerelease.join(".") && _ === !1)
                throw new Error("invalid increment argument: identifier already exists");
              this.prerelease.push($);
            }
          }
          if (s) {
            let v = [s, $];
            _ === !1 && (v = [s]), u(this.prerelease[0], s) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = v) : this.prerelease = v;
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${d}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
    }
  }
  return hs = o, hs;
}
var ps, yc;
function gt() {
  if (yc) return ps;
  yc = 1;
  const e = Ne();
  return ps = (a, r, l = !1) => {
    if (a instanceof e)
      return a;
    try {
      return new e(a, r);
    } catch (n) {
      if (!l)
        return null;
      throw n;
    }
  }, ps;
}
var ms, gc;
function vf() {
  if (gc) return ms;
  gc = 1;
  const e = gt();
  return ms = (a, r) => {
    const l = e(a, r);
    return l ? l.version : null;
  }, ms;
}
var ys, vc;
function $f() {
  if (vc) return ys;
  vc = 1;
  const e = gt();
  return ys = (a, r) => {
    const l = e(a.trim().replace(/^[=v]+/, ""), r);
    return l ? l.version : null;
  }, ys;
}
var gs, $c;
function _f() {
  if ($c) return gs;
  $c = 1;
  const e = Ne();
  return gs = (a, r, l, n, u) => {
    typeof l == "string" && (u = n, n = l, l = void 0);
    try {
      return new e(
        a instanceof e ? a.version : a,
        l
      ).inc(r, n, u).version;
    } catch {
      return null;
    }
  }, gs;
}
var vs, _c;
function wf() {
  if (_c) return vs;
  _c = 1;
  const e = gt();
  return vs = (a, r) => {
    const l = e(a, null, !0), n = e(r, null, !0), u = l.compare(n);
    if (u === 0)
      return null;
    const o = u > 0, c = o ? l : n, d = o ? n : l, s = !!c.prerelease.length;
    if (!!d.prerelease.length && !s) {
      if (!d.patch && !d.minor)
        return "major";
      if (d.compareMain(c) === 0)
        return d.minor && !d.patch ? "minor" : "patch";
    }
    const $ = s ? "pre" : "";
    return l.major !== n.major ? $ + "major" : l.minor !== n.minor ? $ + "minor" : l.patch !== n.patch ? $ + "patch" : "prerelease";
  }, vs;
}
var $s, wc;
function Ef() {
  if (wc) return $s;
  wc = 1;
  const e = Ne();
  return $s = (a, r) => new e(a, r).major, $s;
}
var _s, Ec;
function Sf() {
  if (Ec) return _s;
  Ec = 1;
  const e = Ne();
  return _s = (a, r) => new e(a, r).minor, _s;
}
var ws, Sc;
function bf() {
  if (Sc) return ws;
  Sc = 1;
  const e = Ne();
  return ws = (a, r) => new e(a, r).patch, ws;
}
var Es, bc;
function Pf() {
  if (bc) return Es;
  bc = 1;
  const e = gt();
  return Es = (a, r) => {
    const l = e(a, r);
    return l && l.prerelease.length ? l.prerelease : null;
  }, Es;
}
var Ss, Pc;
function Ue() {
  if (Pc) return Ss;
  Pc = 1;
  const e = Ne();
  return Ss = (a, r, l) => new e(a, l).compare(new e(r, l)), Ss;
}
var bs, Rc;
function Rf() {
  if (Rc) return bs;
  Rc = 1;
  const e = Ue();
  return bs = (a, r, l) => e(r, a, l), bs;
}
var Ps, Nc;
function Nf() {
  if (Nc) return Ps;
  Nc = 1;
  const e = Ue();
  return Ps = (a, r) => e(a, r, !0), Ps;
}
var Rs, Oc;
function da() {
  if (Oc) return Rs;
  Oc = 1;
  const e = Ne();
  return Rs = (a, r, l) => {
    const n = new e(a, l), u = new e(r, l);
    return n.compare(u) || n.compareBuild(u);
  }, Rs;
}
var Ns, Tc;
function Of() {
  if (Tc) return Ns;
  Tc = 1;
  const e = da();
  return Ns = (a, r) => a.sort((l, n) => e(l, n, r)), Ns;
}
var Os, Ic;
function Tf() {
  if (Ic) return Os;
  Ic = 1;
  const e = da();
  return Os = (a, r) => a.sort((l, n) => e(n, l, r)), Os;
}
var Ts, jc;
function qn() {
  if (jc) return Ts;
  jc = 1;
  const e = Ue();
  return Ts = (a, r, l) => e(a, r, l) > 0, Ts;
}
var Is, kc;
function fa() {
  if (kc) return Is;
  kc = 1;
  const e = Ue();
  return Is = (a, r, l) => e(a, r, l) < 0, Is;
}
var js, Cc;
function Eu() {
  if (Cc) return js;
  Cc = 1;
  const e = Ue();
  return js = (a, r, l) => e(a, r, l) === 0, js;
}
var ks, Ac;
function Su() {
  if (Ac) return ks;
  Ac = 1;
  const e = Ue();
  return ks = (a, r, l) => e(a, r, l) !== 0, ks;
}
var Cs, qc;
function ha() {
  if (qc) return Cs;
  qc = 1;
  const e = Ue();
  return Cs = (a, r, l) => e(a, r, l) >= 0, Cs;
}
var As, Dc;
function pa() {
  if (Dc) return As;
  Dc = 1;
  const e = Ue();
  return As = (a, r, l) => e(a, r, l) <= 0, As;
}
var qs, Mc;
function bu() {
  if (Mc) return qs;
  Mc = 1;
  const e = Eu(), t = Su(), a = qn(), r = ha(), l = fa(), n = pa();
  return qs = (o, c, d, s) => {
    switch (c) {
      case "===":
        return typeof o == "object" && (o = o.version), typeof d == "object" && (d = d.version), o === d;
      case "!==":
        return typeof o == "object" && (o = o.version), typeof d == "object" && (d = d.version), o !== d;
      case "":
      case "=":
      case "==":
        return e(o, d, s);
      case "!=":
        return t(o, d, s);
      case ">":
        return a(o, d, s);
      case ">=":
        return r(o, d, s);
      case "<":
        return l(o, d, s);
      case "<=":
        return n(o, d, s);
      default:
        throw new TypeError(`Invalid operator: ${c}`);
    }
  }, qs;
}
var Ds, Lc;
function If() {
  if (Lc) return Ds;
  Lc = 1;
  const e = Ne(), t = gt(), { safeRe: a, t: r } = jt();
  return Ds = (n, u) => {
    if (n instanceof e)
      return n;
    if (typeof n == "number" && (n = String(n)), typeof n != "string")
      return null;
    u = u || {};
    let o = null;
    if (!u.rtl)
      o = n.match(u.includePrerelease ? a[r.COERCEFULL] : a[r.COERCE]);
    else {
      const v = u.includePrerelease ? a[r.COERCERTLFULL] : a[r.COERCERTL];
      let S;
      for (; (S = v.exec(n)) && (!o || o.index + o[0].length !== n.length); )
        (!o || S.index + S[0].length !== o.index + o[0].length) && (o = S), v.lastIndex = S.index + S[1].length + S[2].length;
      v.lastIndex = -1;
    }
    if (o === null)
      return null;
    const c = o[2], d = o[3] || "0", s = o[4] || "0", _ = u.includePrerelease && o[5] ? `-${o[5]}` : "", $ = u.includePrerelease && o[6] ? `+${o[6]}` : "";
    return t(`${c}.${d}.${s}${_}${$}`, u);
  }, Ds;
}
var Ms, Fc;
function jf() {
  if (Fc) return Ms;
  Fc = 1;
  class e {
    constructor() {
      this.max = 1e3, this.map = /* @__PURE__ */ new Map();
    }
    get(a) {
      const r = this.map.get(a);
      if (r !== void 0)
        return this.map.delete(a), this.map.set(a, r), r;
    }
    delete(a) {
      return this.map.delete(a);
    }
    set(a, r) {
      if (!this.delete(a) && r !== void 0) {
        if (this.map.size >= this.max) {
          const n = this.map.keys().next().value;
          this.delete(n);
        }
        this.map.set(a, r);
      }
      return this;
    }
  }
  return Ms = e, Ms;
}
var Ls, Vc;
function ze() {
  if (Vc) return Ls;
  Vc = 1;
  const e = /\s+/g;
  class t {
    constructor(z, Y) {
      if (Y = l(Y), z instanceof t)
        return z.loose === !!Y.loose && z.includePrerelease === !!Y.includePrerelease ? z : new t(z.raw, Y);
      if (z instanceof n)
        return this.raw = z.value, this.set = [[z]], this.formatted = void 0, this;
      if (this.options = Y, this.loose = !!Y.loose, this.includePrerelease = !!Y.includePrerelease, this.raw = z.trim().replace(e, " "), this.set = this.raw.split("||").map((J) => this.parseRange(J.trim())).filter((J) => J.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const J = this.set[0];
        if (this.set = this.set.filter((D) => !E(D[0])), this.set.length === 0)
          this.set = [J];
        else if (this.set.length > 1) {
          for (const D of this.set)
            if (D.length === 1 && h(D[0])) {
              this.set = [D];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let z = 0; z < this.set.length; z++) {
          z > 0 && (this.formatted += "||");
          const Y = this.set[z];
          for (let J = 0; J < Y.length; J++)
            J > 0 && (this.formatted += " "), this.formatted += Y[J].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(z) {
      const J = ((this.options.includePrerelease && v) | (this.options.loose && S)) + ":" + z, D = r.get(J);
      if (D)
        return D;
      const U = this.options.loose, j = U ? c[d.HYPHENRANGELOOSE] : c[d.HYPHENRANGE];
      z = z.replace(j, W(this.options.includePrerelease)), u("hyphen replace", z), z = z.replace(c[d.COMPARATORTRIM], s), u("comparator trim", z), z = z.replace(c[d.TILDETRIM], _), u("tilde trim", z), z = z.replace(c[d.CARETTRIM], $), u("caret trim", z);
      let R = z.split(" ").map((b) => i(b, this.options)).join(" ").split(/\s+/).map((b) => F(b, this.options));
      U && (R = R.filter((b) => (u("loose invalid filter", b, this.options), !!b.match(c[d.COMPARATORLOOSE])))), u("range list", R);
      const k = /* @__PURE__ */ new Map(), O = R.map((b) => new n(b, this.options));
      for (const b of O) {
        if (E(b))
          return [b];
        k.set(b.value, b);
      }
      k.size > 1 && k.has("") && k.delete("");
      const f = [...k.values()];
      return r.set(J, f), f;
    }
    intersects(z, Y) {
      if (!(z instanceof t))
        throw new TypeError("a Range is required");
      return this.set.some((J) => y(J, Y) && z.set.some((D) => y(D, Y) && J.every((U) => D.every((j) => U.intersects(j, Y)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(z) {
      if (!z)
        return !1;
      if (typeof z == "string")
        try {
          z = new o(z, this.options);
        } catch {
          return !1;
        }
      for (let Y = 0; Y < this.set.length; Y++)
        if (B(this.set[Y], z, this.options))
          return !0;
      return !1;
    }
  }
  Ls = t;
  const a = jf(), r = new a(), l = la(), n = Dn(), u = An(), o = Ne(), {
    safeRe: c,
    t: d,
    comparatorTrimReplace: s,
    tildeTrimReplace: _,
    caretTrimReplace: $
  } = jt(), { FLAG_INCLUDE_PRERELEASE: v, FLAG_LOOSE: S } = Cn(), E = (V) => V.value === "<0.0.0-0", h = (V) => V.value === "", y = (V, z) => {
    let Y = !0;
    const J = V.slice();
    let D = J.pop();
    for (; Y && J.length; )
      Y = J.every((U) => D.intersects(U, z)), D = J.pop();
    return Y;
  }, i = (V, z) => (u("comp", V, z), V = g(V, z), u("caret", V), V = w(V, z), u("tildes", V), V = I(V, z), u("xrange", V), V = M(V, z), u("stars", V), V), p = (V) => !V || V.toLowerCase() === "x" || V === "*", w = (V, z) => V.trim().split(/\s+/).map((Y) => m(Y, z)).join(" "), m = (V, z) => {
    const Y = z.loose ? c[d.TILDELOOSE] : c[d.TILDE];
    return V.replace(Y, (J, D, U, j, R) => {
      u("tilde", V, J, D, U, j, R);
      let k;
      return p(D) ? k = "" : p(U) ? k = `>=${D}.0.0 <${+D + 1}.0.0-0` : p(j) ? k = `>=${D}.${U}.0 <${D}.${+U + 1}.0-0` : R ? (u("replaceTilde pr", R), k = `>=${D}.${U}.${j}-${R} <${D}.${+U + 1}.0-0`) : k = `>=${D}.${U}.${j} <${D}.${+U + 1}.0-0`, u("tilde return", k), k;
    });
  }, g = (V, z) => V.trim().split(/\s+/).map((Y) => P(Y, z)).join(" "), P = (V, z) => {
    u("caret", V, z);
    const Y = z.loose ? c[d.CARETLOOSE] : c[d.CARET], J = z.includePrerelease ? "-0" : "";
    return V.replace(Y, (D, U, j, R, k) => {
      u("caret", V, D, U, j, R, k);
      let O;
      return p(U) ? O = "" : p(j) ? O = `>=${U}.0.0${J} <${+U + 1}.0.0-0` : p(R) ? U === "0" ? O = `>=${U}.${j}.0${J} <${U}.${+j + 1}.0-0` : O = `>=${U}.${j}.0${J} <${+U + 1}.0.0-0` : k ? (u("replaceCaret pr", k), U === "0" ? j === "0" ? O = `>=${U}.${j}.${R}-${k} <${U}.${j}.${+R + 1}-0` : O = `>=${U}.${j}.${R}-${k} <${U}.${+j + 1}.0-0` : O = `>=${U}.${j}.${R}-${k} <${+U + 1}.0.0-0`) : (u("no pr"), U === "0" ? j === "0" ? O = `>=${U}.${j}.${R}${J} <${U}.${j}.${+R + 1}-0` : O = `>=${U}.${j}.${R}${J} <${U}.${+j + 1}.0-0` : O = `>=${U}.${j}.${R} <${+U + 1}.0.0-0`), u("caret return", O), O;
    });
  }, I = (V, z) => (u("replaceXRanges", V, z), V.split(/\s+/).map((Y) => A(Y, z)).join(" ")), A = (V, z) => {
    V = V.trim();
    const Y = z.loose ? c[d.XRANGELOOSE] : c[d.XRANGE];
    return V.replace(Y, (J, D, U, j, R, k) => {
      u("xRange", V, J, D, U, j, R, k);
      const O = p(U), f = O || p(j), b = f || p(R), C = b;
      return D === "=" && C && (D = ""), k = z.includePrerelease ? "-0" : "", O ? D === ">" || D === "<" ? J = "<0.0.0-0" : J = "*" : D && C ? (f && (j = 0), R = 0, D === ">" ? (D = ">=", f ? (U = +U + 1, j = 0, R = 0) : (j = +j + 1, R = 0)) : D === "<=" && (D = "<", f ? U = +U + 1 : j = +j + 1), D === "<" && (k = "-0"), J = `${D + U}.${j}.${R}${k}`) : f ? J = `>=${U}.0.0${k} <${+U + 1}.0.0-0` : b && (J = `>=${U}.${j}.0${k} <${U}.${+j + 1}.0-0`), u("xRange return", J), J;
    });
  }, M = (V, z) => (u("replaceStars", V, z), V.trim().replace(c[d.STAR], "")), F = (V, z) => (u("replaceGTE0", V, z), V.trim().replace(c[z.includePrerelease ? d.GTE0PRE : d.GTE0], "")), W = (V) => (z, Y, J, D, U, j, R, k, O, f, b, C) => (p(J) ? Y = "" : p(D) ? Y = `>=${J}.0.0${V ? "-0" : ""}` : p(U) ? Y = `>=${J}.${D}.0${V ? "-0" : ""}` : j ? Y = `>=${Y}` : Y = `>=${Y}${V ? "-0" : ""}`, p(O) ? k = "" : p(f) ? k = `<${+O + 1}.0.0-0` : p(b) ? k = `<${O}.${+f + 1}.0-0` : C ? k = `<=${O}.${f}.${b}-${C}` : V ? k = `<${O}.${f}.${+b + 1}-0` : k = `<=${k}`, `${Y} ${k}`.trim()), B = (V, z, Y) => {
    for (let J = 0; J < V.length; J++)
      if (!V[J].test(z))
        return !1;
    if (z.prerelease.length && !Y.includePrerelease) {
      for (let J = 0; J < V.length; J++)
        if (u(V[J].semver), V[J].semver !== n.ANY && V[J].semver.prerelease.length > 0) {
          const D = V[J].semver;
          if (D.major === z.major && D.minor === z.minor && D.patch === z.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Ls;
}
var Fs, Uc;
function Dn() {
  if (Uc) return Fs;
  Uc = 1;
  const e = Symbol("SemVer ANY");
  class t {
    static get ANY() {
      return e;
    }
    constructor(s, _) {
      if (_ = a(_), s instanceof t) {
        if (s.loose === !!_.loose)
          return s;
        s = s.value;
      }
      s = s.trim().split(/\s+/).join(" "), u("comparator", s, _), this.options = _, this.loose = !!_.loose, this.parse(s), this.semver === e ? this.value = "" : this.value = this.operator + this.semver.version, u("comp", this);
    }
    parse(s) {
      const _ = this.options.loose ? r[l.COMPARATORLOOSE] : r[l.COMPARATOR], $ = s.match(_);
      if (!$)
        throw new TypeError(`Invalid comparator: ${s}`);
      this.operator = $[1] !== void 0 ? $[1] : "", this.operator === "=" && (this.operator = ""), $[2] ? this.semver = new o($[2], this.options.loose) : this.semver = e;
    }
    toString() {
      return this.value;
    }
    test(s) {
      if (u("Comparator.test", s, this.options.loose), this.semver === e || s === e)
        return !0;
      if (typeof s == "string")
        try {
          s = new o(s, this.options);
        } catch {
          return !1;
        }
      return n(s, this.operator, this.semver, this.options);
    }
    intersects(s, _) {
      if (!(s instanceof t))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new c(s.value, _).test(this.value) : s.operator === "" ? s.value === "" ? !0 : new c(this.value, _).test(s.semver) : (_ = a(_), _.includePrerelease && (this.value === "<0.0.0-0" || s.value === "<0.0.0-0") || !_.includePrerelease && (this.value.startsWith("<0.0.0") || s.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && s.operator.startsWith(">") || this.operator.startsWith("<") && s.operator.startsWith("<") || this.semver.version === s.semver.version && this.operator.includes("=") && s.operator.includes("=") || n(this.semver, "<", s.semver, _) && this.operator.startsWith(">") && s.operator.startsWith("<") || n(this.semver, ">", s.semver, _) && this.operator.startsWith("<") && s.operator.startsWith(">")));
    }
  }
  Fs = t;
  const a = la(), { safeRe: r, t: l } = jt(), n = bu(), u = An(), o = Ne(), c = ze();
  return Fs;
}
var Vs, zc;
function Mn() {
  if (zc) return Vs;
  zc = 1;
  const e = ze();
  return Vs = (a, r, l) => {
    try {
      r = new e(r, l);
    } catch {
      return !1;
    }
    return r.test(a);
  }, Vs;
}
var Us, Kc;
function kf() {
  if (Kc) return Us;
  Kc = 1;
  const e = ze();
  return Us = (a, r) => new e(a, r).set.map((l) => l.map((n) => n.value).join(" ").trim().split(" ")), Us;
}
var zs, Gc;
function Cf() {
  if (Gc) return zs;
  Gc = 1;
  const e = Ne(), t = ze();
  return zs = (r, l, n) => {
    let u = null, o = null, c = null;
    try {
      c = new t(l, n);
    } catch {
      return null;
    }
    return r.forEach((d) => {
      c.test(d) && (!u || o.compare(d) === -1) && (u = d, o = new e(u, n));
    }), u;
  }, zs;
}
var Ks, Hc;
function Af() {
  if (Hc) return Ks;
  Hc = 1;
  const e = Ne(), t = ze();
  return Ks = (r, l, n) => {
    let u = null, o = null, c = null;
    try {
      c = new t(l, n);
    } catch {
      return null;
    }
    return r.forEach((d) => {
      c.test(d) && (!u || o.compare(d) === 1) && (u = d, o = new e(u, n));
    }), u;
  }, Ks;
}
var Gs, Wc;
function qf() {
  if (Wc) return Gs;
  Wc = 1;
  const e = Ne(), t = ze(), a = qn();
  return Gs = (l, n) => {
    l = new t(l, n);
    let u = new e("0.0.0");
    if (l.test(u) || (u = new e("0.0.0-0"), l.test(u)))
      return u;
    u = null;
    for (let o = 0; o < l.set.length; ++o) {
      const c = l.set[o];
      let d = null;
      c.forEach((s) => {
        const _ = new e(s.semver.version);
        switch (s.operator) {
          case ">":
            _.prerelease.length === 0 ? _.patch++ : _.prerelease.push(0), _.raw = _.format();
          /* fallthrough */
          case "":
          case ">=":
            (!d || a(_, d)) && (d = _);
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${s.operator}`);
        }
      }), d && (!u || a(u, d)) && (u = d);
    }
    return u && l.test(u) ? u : null;
  }, Gs;
}
var Hs, Bc;
function Df() {
  if (Bc) return Hs;
  Bc = 1;
  const e = ze();
  return Hs = (a, r) => {
    try {
      return new e(a, r).range || "*";
    } catch {
      return null;
    }
  }, Hs;
}
var Ws, Jc;
function ma() {
  if (Jc) return Ws;
  Jc = 1;
  const e = Ne(), t = Dn(), { ANY: a } = t, r = ze(), l = Mn(), n = qn(), u = fa(), o = pa(), c = ha();
  return Ws = (s, _, $, v) => {
    s = new e(s, v), _ = new r(_, v);
    let S, E, h, y, i;
    switch ($) {
      case ">":
        S = n, E = o, h = u, y = ">", i = ">=";
        break;
      case "<":
        S = u, E = c, h = n, y = "<", i = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (l(s, _, v))
      return !1;
    for (let p = 0; p < _.set.length; ++p) {
      const w = _.set[p];
      let m = null, g = null;
      if (w.forEach((P) => {
        P.semver === a && (P = new t(">=0.0.0")), m = m || P, g = g || P, S(P.semver, m.semver, v) ? m = P : h(P.semver, g.semver, v) && (g = P);
      }), m.operator === y || m.operator === i || (!g.operator || g.operator === y) && E(s, g.semver))
        return !1;
      if (g.operator === i && h(s, g.semver))
        return !1;
    }
    return !0;
  }, Ws;
}
var Bs, Xc;
function Mf() {
  if (Xc) return Bs;
  Xc = 1;
  const e = ma();
  return Bs = (a, r, l) => e(a, r, ">", l), Bs;
}
var Js, Yc;
function Lf() {
  if (Yc) return Js;
  Yc = 1;
  const e = ma();
  return Js = (a, r, l) => e(a, r, "<", l), Js;
}
var Xs, xc;
function Ff() {
  if (xc) return Xs;
  xc = 1;
  const e = ze();
  return Xs = (a, r, l) => (a = new e(a, l), r = new e(r, l), a.intersects(r, l)), Xs;
}
var Ys, Qc;
function Vf() {
  if (Qc) return Ys;
  Qc = 1;
  const e = Mn(), t = Ue();
  return Ys = (a, r, l) => {
    const n = [];
    let u = null, o = null;
    const c = a.sort(($, v) => t($, v, l));
    for (const $ of c)
      e($, r, l) ? (o = $, u || (u = $)) : (o && n.push([u, o]), o = null, u = null);
    u && n.push([u, null]);
    const d = [];
    for (const [$, v] of n)
      $ === v ? d.push($) : !v && $ === c[0] ? d.push("*") : v ? $ === c[0] ? d.push(`<=${v}`) : d.push(`${$} - ${v}`) : d.push(`>=${$}`);
    const s = d.join(" || "), _ = typeof r.raw == "string" ? r.raw : String(r);
    return s.length < _.length ? s : r;
  }, Ys;
}
var xs, Zc;
function Uf() {
  if (Zc) return xs;
  Zc = 1;
  const e = ze(), t = Dn(), { ANY: a } = t, r = Mn(), l = Ue(), n = (_, $, v = {}) => {
    if (_ === $)
      return !0;
    _ = new e(_, v), $ = new e($, v);
    let S = !1;
    e: for (const E of _.set) {
      for (const h of $.set) {
        const y = c(E, h, v);
        if (S = S || y !== null, y)
          continue e;
      }
      if (S)
        return !1;
    }
    return !0;
  }, u = [new t(">=0.0.0-0")], o = [new t(">=0.0.0")], c = (_, $, v) => {
    if (_ === $)
      return !0;
    if (_.length === 1 && _[0].semver === a) {
      if ($.length === 1 && $[0].semver === a)
        return !0;
      v.includePrerelease ? _ = u : _ = o;
    }
    if ($.length === 1 && $[0].semver === a) {
      if (v.includePrerelease)
        return !0;
      $ = o;
    }
    const S = /* @__PURE__ */ new Set();
    let E, h;
    for (const I of _)
      I.operator === ">" || I.operator === ">=" ? E = d(E, I, v) : I.operator === "<" || I.operator === "<=" ? h = s(h, I, v) : S.add(I.semver);
    if (S.size > 1)
      return null;
    let y;
    if (E && h) {
      if (y = l(E.semver, h.semver, v), y > 0)
        return null;
      if (y === 0 && (E.operator !== ">=" || h.operator !== "<="))
        return null;
    }
    for (const I of S) {
      if (E && !r(I, String(E), v) || h && !r(I, String(h), v))
        return null;
      for (const A of $)
        if (!r(I, String(A), v))
          return !1;
      return !0;
    }
    let i, p, w, m, g = h && !v.includePrerelease && h.semver.prerelease.length ? h.semver : !1, P = E && !v.includePrerelease && E.semver.prerelease.length ? E.semver : !1;
    g && g.prerelease.length === 1 && h.operator === "<" && g.prerelease[0] === 0 && (g = !1);
    for (const I of $) {
      if (m = m || I.operator === ">" || I.operator === ">=", w = w || I.operator === "<" || I.operator === "<=", E) {
        if (P && I.semver.prerelease && I.semver.prerelease.length && I.semver.major === P.major && I.semver.minor === P.minor && I.semver.patch === P.patch && (P = !1), I.operator === ">" || I.operator === ">=") {
          if (i = d(E, I, v), i === I && i !== E)
            return !1;
        } else if (E.operator === ">=" && !r(E.semver, String(I), v))
          return !1;
      }
      if (h) {
        if (g && I.semver.prerelease && I.semver.prerelease.length && I.semver.major === g.major && I.semver.minor === g.minor && I.semver.patch === g.patch && (g = !1), I.operator === "<" || I.operator === "<=") {
          if (p = s(h, I, v), p === I && p !== h)
            return !1;
        } else if (h.operator === "<=" && !r(h.semver, String(I), v))
          return !1;
      }
      if (!I.operator && (h || E) && y !== 0)
        return !1;
    }
    return !(E && w && !h && y !== 0 || h && m && !E && y !== 0 || P || g);
  }, d = (_, $, v) => {
    if (!_)
      return $;
    const S = l(_.semver, $.semver, v);
    return S > 0 ? _ : S < 0 || $.operator === ">" && _.operator === ">=" ? $ : _;
  }, s = (_, $, v) => {
    if (!_)
      return $;
    const S = l(_.semver, $.semver, v);
    return S < 0 ? _ : S > 0 || $.operator === "<" && _.operator === "<=" ? $ : _;
  };
  return xs = n, xs;
}
var Qs, eu;
function zf() {
  if (eu) return Qs;
  eu = 1;
  const e = jt(), t = Cn(), a = Ne(), r = wu(), l = gt(), n = vf(), u = $f(), o = _f(), c = wf(), d = Ef(), s = Sf(), _ = bf(), $ = Pf(), v = Ue(), S = Rf(), E = Nf(), h = da(), y = Of(), i = Tf(), p = qn(), w = fa(), m = Eu(), g = Su(), P = ha(), I = pa(), A = bu(), M = If(), F = Dn(), W = ze(), B = Mn(), V = kf(), z = Cf(), Y = Af(), J = qf(), D = Df(), U = ma(), j = Mf(), R = Lf(), k = Ff(), O = Vf(), f = Uf();
  return Qs = {
    parse: l,
    valid: n,
    clean: u,
    inc: o,
    diff: c,
    major: d,
    minor: s,
    patch: _,
    prerelease: $,
    compare: v,
    rcompare: S,
    compareLoose: E,
    compareBuild: h,
    sort: y,
    rsort: i,
    gt: p,
    lt: w,
    eq: m,
    neq: g,
    gte: P,
    lte: I,
    cmp: A,
    coerce: M,
    Comparator: F,
    Range: W,
    satisfies: B,
    toComparators: V,
    maxSatisfying: z,
    minSatisfying: Y,
    minVersion: J,
    validRange: D,
    outside: U,
    gtr: j,
    ltr: R,
    intersects: k,
    simplifyRange: O,
    subset: f,
    SemVer: a,
    re: e.re,
    src: e.src,
    tokens: e.t,
    SEMVER_SPEC_VERSION: t.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: t.RELEASE_TYPES,
    compareIdentifiers: r.compareIdentifiers,
    rcompareIdentifiers: r.rcompareIdentifiers
  }, Qs;
}
var Rt = { exports: {} }, yn = { exports: {} }, tu;
function Kf() {
  if (tu) return yn.exports;
  tu = 1;
  const e = (t, a) => {
    for (const r of Reflect.ownKeys(a))
      Object.defineProperty(t, r, Object.getOwnPropertyDescriptor(a, r));
    return t;
  };
  return yn.exports = e, yn.exports.default = e, yn.exports;
}
var ru;
function Gf() {
  if (ru) return Rt.exports;
  ru = 1;
  const e = Kf(), t = /* @__PURE__ */ new WeakMap(), a = (r, l = {}) => {
    if (typeof r != "function")
      throw new TypeError("Expected a function");
    let n, u = 0;
    const o = r.displayName || r.name || "<anonymous>", c = function(...d) {
      if (t.set(c, ++u), u === 1)
        n = r.apply(this, d), r = null;
      else if (l.throw === !0)
        throw new Error(`Function \`${o}\` can only be called once`);
      return n;
    };
    return e(c, r), t.set(c, u), c;
  };
  return Rt.exports = a, Rt.exports.default = a, Rt.exports.callCount = (r) => {
    if (!t.has(r))
      throw new Error(`The given function \`${r.name}\` is not wrapped by the \`onetime\` package`);
    return t.get(r);
  }, Rt.exports;
}
var gn = Nt.exports, nu;
function Hf() {
  return nu || (nu = 1, (function(e, t) {
    var a = gn && gn.__classPrivateFieldSet || function(J, D, U, j, R) {
      if (j === "m") throw new TypeError("Private method is not writable");
      if (j === "a" && !R) throw new TypeError("Private accessor was defined without a setter");
      if (typeof D == "function" ? J !== D || !R : !D.has(J)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return j === "a" ? R.call(J, U) : R ? R.value = U : D.set(J, U), U;
    }, r = gn && gn.__classPrivateFieldGet || function(J, D, U, j) {
      if (U === "a" && !j) throw new TypeError("Private accessor was defined without a getter");
      if (typeof D == "function" ? J !== D || !j : !D.has(J)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return U === "m" ? j : U === "a" ? j.call(J) : j ? j.value : D.get(J);
    }, l, n, u, o, c, d;
    Object.defineProperty(t, "__esModule", { value: !0 });
    const s = iu, _ = Ce, $ = he, v = qu, S = Du, E = Mu, h = zu(), y = Xu(), i = Yu(), p = sl(), w = cd(), m = mf(), g = gf(), P = zf(), I = Gf(), A = "aes-256-cbc", M = () => /* @__PURE__ */ Object.create(null), F = (J) => J != null;
    let W = "";
    try {
      delete require.cache[__filename], W = $.dirname((n = (l = e.parent) === null || l === void 0 ? void 0 : l.filename) !== null && n !== void 0 ? n : ".");
    } catch {
    }
    const B = (J, D) => {
      const U = /* @__PURE__ */ new Set([
        "undefined",
        "symbol",
        "function"
      ]), j = typeof D;
      if (U.has(j))
        throw new TypeError(`Setting a value of type \`${j}\` for key \`${J}\` is not allowed as it's not supported by JSON`);
    }, V = "__internal__", z = `${V}.migrations.version`;
    class Y {
      constructor(D = {}) {
        var U;
        u.set(this, void 0), o.set(this, void 0), c.set(this, void 0), d.set(this, {}), this._deserialize = (b) => JSON.parse(b), this._serialize = (b) => JSON.stringify(b, void 0, "	");
        const j = {
          configName: "config",
          fileExtension: "json",
          projectSuffix: "nodejs",
          clearInvalidConfig: !1,
          accessPropertiesByDotNotation: !0,
          configFileMode: 438,
          ...D
        }, R = I(() => {
          const b = y.sync({ cwd: W }), C = b && JSON.parse(_.readFileSync(b, "utf8"));
          return C ?? {};
        });
        if (!j.cwd) {
          if (j.projectName || (j.projectName = R().name), !j.projectName)
            throw new Error("Project name could not be inferred. Please specify the `projectName` option.");
          j.cwd = i(j.projectName, { suffix: j.projectSuffix }).config;
        }
        if (a(this, c, j, "f"), j.schema) {
          if (typeof j.schema != "object")
            throw new TypeError("The `schema` option must be an object.");
          const b = new w.default({
            allErrors: !0,
            useDefaults: !0
          });
          (0, m.default)(b);
          const C = {
            type: "object",
            properties: j.schema
          };
          a(this, u, b.compile(C), "f");
          for (const [K, G] of Object.entries(j.schema))
            G != null && G.default && (r(this, d, "f")[K] = G.default);
        }
        j.defaults && a(this, d, {
          ...r(this, d, "f"),
          ...j.defaults
        }, "f"), j.serialize && (this._serialize = j.serialize), j.deserialize && (this._deserialize = j.deserialize), this.events = new E.EventEmitter(), a(this, o, j.encryptionKey, "f");
        const k = j.fileExtension ? `.${j.fileExtension}` : "";
        this.path = $.resolve(j.cwd, `${(U = j.configName) !== null && U !== void 0 ? U : "config"}${k}`);
        const O = this.store, f = Object.assign(M(), j.defaults, O);
        this._validate(f);
        try {
          S.deepEqual(O, f);
        } catch {
          this.store = f;
        }
        if (j.watch && this._watch(), j.migrations) {
          if (j.projectVersion || (j.projectVersion = R().version), !j.projectVersion)
            throw new Error("Project version could not be inferred. Please specify the `projectVersion` option.");
          this._migrate(j.migrations, j.projectVersion, j.beforeEachMigration);
        }
      }
      get(D, U) {
        if (r(this, c, "f").accessPropertiesByDotNotation)
          return this._get(D, U);
        const { store: j } = this;
        return D in j ? j[D] : U;
      }
      set(D, U) {
        if (typeof D != "string" && typeof D != "object")
          throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got ${typeof D}`);
        if (typeof D != "object" && U === void 0)
          throw new TypeError("Use `delete()` to clear values");
        if (this._containsReservedKey(D))
          throw new TypeError(`Please don't use the ${V} key, as it's used to manage this module internal operations.`);
        const { store: j } = this, R = (k, O) => {
          B(k, O), r(this, c, "f").accessPropertiesByDotNotation ? h.set(j, k, O) : j[k] = O;
        };
        if (typeof D == "object") {
          const k = D;
          for (const [O, f] of Object.entries(k))
            R(O, f);
        } else
          R(D, U);
        this.store = j;
      }
      /**
          Check if an item exists.
      
          @param key - The key of the item to check.
          */
      has(D) {
        return r(this, c, "f").accessPropertiesByDotNotation ? h.has(this.store, D) : D in this.store;
      }
      /**
          Reset items to their default values, as defined by the `defaults` or `schema` option.
      
          @see `clear()` to reset all items.
      
          @param keys - The keys of the items to reset.
          */
      reset(...D) {
        for (const U of D)
          F(r(this, d, "f")[U]) && this.set(U, r(this, d, "f")[U]);
      }
      /**
          Delete an item.
      
          @param key - The key of the item to delete.
          */
      delete(D) {
        const { store: U } = this;
        r(this, c, "f").accessPropertiesByDotNotation ? h.delete(U, D) : delete U[D], this.store = U;
      }
      /**
          Delete all items.
      
          This resets known items to their default values, if defined by the `defaults` or `schema` option.
          */
      clear() {
        this.store = M();
        for (const D of Object.keys(r(this, d, "f")))
          this.reset(D);
      }
      /**
          Watches the given `key`, calling `callback` on any changes.
      
          @param key - The key wo watch.
          @param callback - A callback function that is called on any changes. When a `key` is first set `oldValue` will be `undefined`, and when a key is deleted `newValue` will be `undefined`.
          @returns A function, that when called, will unsubscribe.
          */
      onDidChange(D, U) {
        if (typeof D != "string")
          throw new TypeError(`Expected \`key\` to be of type \`string\`, got ${typeof D}`);
        if (typeof U != "function")
          throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof U}`);
        return this._handleChange(() => this.get(D), U);
      }
      /**
          Watches the whole config object, calling `callback` on any changes.
      
          @param callback - A callback function that is called on any changes. When a `key` is first set `oldValue` will be `undefined`, and when a key is deleted `newValue` will be `undefined`.
          @returns A function, that when called, will unsubscribe.
          */
      onDidAnyChange(D) {
        if (typeof D != "function")
          throw new TypeError(`Expected \`callback\` to be of type \`function\`, got ${typeof D}`);
        return this._handleChange(() => this.store, D);
      }
      get size() {
        return Object.keys(this.store).length;
      }
      get store() {
        try {
          const D = _.readFileSync(this.path, r(this, o, "f") ? null : "utf8"), U = this._encryptData(D), j = this._deserialize(U);
          return this._validate(j), Object.assign(M(), j);
        } catch (D) {
          if ((D == null ? void 0 : D.code) === "ENOENT")
            return this._ensureDirectory(), M();
          if (r(this, c, "f").clearInvalidConfig && D.name === "SyntaxError")
            return M();
          throw D;
        }
      }
      set store(D) {
        this._ensureDirectory(), this._validate(D), this._write(D), this.events.emit("change");
      }
      *[(u = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), d = /* @__PURE__ */ new WeakMap(), Symbol.iterator)]() {
        for (const [D, U] of Object.entries(this.store))
          yield [D, U];
      }
      _encryptData(D) {
        if (!r(this, o, "f"))
          return D.toString();
        try {
          if (r(this, o, "f"))
            try {
              if (D.slice(16, 17).toString() === ":") {
                const U = D.slice(0, 16), j = v.pbkdf2Sync(r(this, o, "f"), U.toString(), 1e4, 32, "sha512"), R = v.createDecipheriv(A, j, U);
                D = Buffer.concat([R.update(Buffer.from(D.slice(17))), R.final()]).toString("utf8");
              } else {
                const U = v.createDecipher(A, r(this, o, "f"));
                D = Buffer.concat([U.update(Buffer.from(D)), U.final()]).toString("utf8");
              }
            } catch {
            }
        } catch {
        }
        return D.toString();
      }
      _handleChange(D, U) {
        let j = D();
        const R = () => {
          const k = j, O = D();
          (0, s.isDeepStrictEqual)(O, k) || (j = O, U.call(this, O, k));
        };
        return this.events.on("change", R), () => this.events.removeListener("change", R);
      }
      _validate(D) {
        if (!r(this, u, "f") || r(this, u, "f").call(this, D) || !r(this, u, "f").errors)
          return;
        const j = r(this, u, "f").errors.map(({ instancePath: R, message: k = "" }) => `\`${R.slice(1)}\` ${k}`);
        throw new Error("Config schema violation: " + j.join("; "));
      }
      _ensureDirectory() {
        _.mkdirSync($.dirname(this.path), { recursive: !0 });
      }
      _write(D) {
        let U = this._serialize(D);
        if (r(this, o, "f")) {
          const j = v.randomBytes(16), R = v.pbkdf2Sync(r(this, o, "f"), j.toString(), 1e4, 32, "sha512"), k = v.createCipheriv(A, R, j);
          U = Buffer.concat([j, Buffer.from(":"), k.update(Buffer.from(U)), k.final()]);
        }
        if (process.env.SNAP)
          _.writeFileSync(this.path, U, { mode: r(this, c, "f").configFileMode });
        else
          try {
            p.writeFileSync(this.path, U, { mode: r(this, c, "f").configFileMode });
          } catch (j) {
            if ((j == null ? void 0 : j.code) === "EXDEV") {
              _.writeFileSync(this.path, U, { mode: r(this, c, "f").configFileMode });
              return;
            }
            throw j;
          }
      }
      _watch() {
        this._ensureDirectory(), _.existsSync(this.path) || this._write(M()), process.platform === "win32" ? _.watch(this.path, { persistent: !1 }, g(() => {
          this.events.emit("change");
        }, { wait: 100 })) : _.watchFile(this.path, { persistent: !1 }, g(() => {
          this.events.emit("change");
        }, { wait: 5e3 }));
      }
      _migrate(D, U, j) {
        let R = this._get(z, "0.0.0");
        const k = Object.keys(D).filter((f) => this._shouldPerformMigration(f, R, U));
        let O = { ...this.store };
        for (const f of k)
          try {
            j && j(this, {
              fromVersion: R,
              toVersion: f,
              finalVersion: U,
              versions: k
            });
            const b = D[f];
            b(this), this._set(z, f), R = f, O = { ...this.store };
          } catch (b) {
            throw this.store = O, new Error(`Something went wrong during the migration! Changes applied to the store until this failed migration will be restored. ${b}`);
          }
        (this._isVersionInRangeFormat(R) || !P.eq(R, U)) && this._set(z, U);
      }
      _containsReservedKey(D) {
        return typeof D == "object" && Object.keys(D)[0] === V ? !0 : typeof D != "string" ? !1 : r(this, c, "f").accessPropertiesByDotNotation ? !!D.startsWith(`${V}.`) : !1;
      }
      _isVersionInRangeFormat(D) {
        return P.clean(D) === null;
      }
      _shouldPerformMigration(D, U, j) {
        return this._isVersionInRangeFormat(D) ? U !== "0.0.0" && P.satisfies(U, D) ? !1 : P.satisfies(j, D) : !(P.lte(D, U) || P.gt(D, j));
      }
      _get(D, U) {
        return h.get(this.store, D, U);
      }
      _set(D, U) {
        const { store: j } = this;
        h.set(j, D, U), this.store = j;
      }
    }
    t.default = Y, e.exports = Y, e.exports.default = Y;
  })(Nt, Nt.exports)), Nt.exports;
}
var Zs, su;
function Wf() {
  if (su) return Zs;
  su = 1;
  const e = he, { app: t, ipcMain: a, ipcRenderer: r, shell: l } = ju, n = Hf();
  let u = !1;
  const o = () => {
    if (!a || !t)
      throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
    const d = {
      defaultCwd: t.getPath("userData"),
      appVersion: t.getVersion()
    };
    return u || (a.on("electron-store-get-data", (s) => {
      s.returnValue = d;
    }), u = !0), d;
  };
  class c extends n {
    constructor(s) {
      let _, $;
      if (r) {
        const v = r.sendSync("electron-store-get-data");
        if (!v)
          throw new Error("Electron Store: You need to call `.initRenderer()` from the main process.");
        ({ defaultCwd: _, appVersion: $ } = v);
      } else a && t && ({ defaultCwd: _, appVersion: $ } = o());
      s = {
        name: "config",
        ...s
      }, s.projectVersion || (s.projectVersion = $), s.cwd ? s.cwd = e.isAbsolute(s.cwd) ? s.cwd : e.join(_, s.cwd) : s.cwd = _, s.configName = s.name, delete s.name, super(s);
    }
    static initRenderer() {
      o();
    }
    async openInEditor() {
      const s = await l.openPath(this.path);
      if (s)
        throw new Error(s);
    }
  }
  return Zs = c, Zs;
}
var Bf = /* @__PURE__ */ Wf();
const Jf = /* @__PURE__ */ Vu(Bf), Xf = Fu(import.meta.url), Qe = Au(Xf), vt = new Jf();
let Z, ce, ye, Ee, ea, Le, ve, Pe = {
  isRecording: !1,
  isListening: !1,
  currentSessionId: null,
  elapsedTime: 0,
  displayText: "",
  sessionTranscript: "",
  partialText: "",
  isFinal: !1,
  isConnected: !1,
  audioSource: "microphone",
  waveformData: new Array(20).fill(0),
  currentSession: null,
  wordCount: 0,
  charCount: 0
};
const Pu = !Re.isPackaged;
function Ru() {
  return process.platform === "win32" ? he.join(process.env.APPDATA || vn.homedir(), "EchoTap", "settings.json") : process.platform === "darwin" ? he.join(vn.homedir(), "Library", "Application Support", "EchoTap", "settings.json") : he.join(vn.homedir(), ".config", "EchoTap", "settings.json");
}
function Nu() {
  const e = Ru(), t = he.dirname(e);
  return Ce.existsSync(t) || Ce.mkdirSync(t, { recursive: !0 }), e;
}
function ta() {
  return {
    theme: "system",
    transcriptionModel: "base",
    language: "auto"
  };
}
function Yf() {
  try {
    const e = Nu();
    if (Ce.existsSync(e)) {
      const t = Ce.readFileSync(e, "utf-8"), a = JSON.parse(t);
      return { ...ta(), ...a };
    } else {
      const t = ta();
      return Ce.writeFileSync(e, JSON.stringify(t, null, 2)), t;
    }
  } catch (e) {
    return console.error("Failed to load settings:", e), ta();
  }
}
function xf(e) {
  try {
    const t = Nu();
    return Ce.writeFileSync(t, JSON.stringify(e, null, 2)), !0;
  } catch (t) {
    return console.error("Failed to save settings:", t), !1;
  }
}
function Qf() {
  const e = Ru();
  return !Ce.existsSync(e);
}
let xe = Yf();
function Ou(e) {
  try {
    [Z, ce, ye].filter((a) => a && !a.isDestroyed()).forEach((a) => {
      a.webContents && !a.webContents.isDestroyed() && a.webContents.send("theme-changed", e);
    });
  } catch (t) {
    console.error("Error updating app theme:", t);
  }
}
function Oe(e) {
  Object.keys(e).forEach((a) => {
    e[a] !== void 0 && (Pe[a] = e[a]);
  });
  const t = Pe.sessionTranscript || Pe.displayText;
  Pe.wordCount = t ? t.trim().split(/\s+/).length : 0, Pe.charCount = t ? t.length : 0, Zf();
}
function Zf() {
  [Z, ce, ye].filter(
    (t) => t && !t.isDestroyed()
  ).forEach((t) => {
    try {
      if (t.webContents && !t.webContents.isDestroyed()) {
        if (t.webContents.isLoading())
          return;
        t.webContents.send("app-state-changed", Pe);
      }
    } catch (a) {
      console.warn("Failed to send state to window:", a.message);
    }
  });
}
function eh(e) {
  switch (e.type) {
    case "connection_status":
      Oe({ isConnected: e.connected });
      break;
    case "recording_started":
      Oe({
        isRecording: !0,
        currentSessionId: e.session_id,
        elapsedTime: 0,
        displayText: "",
        sessionTranscript: "",
        partialText: "",
        isFinal: !1
      });
      break;
    case "recording_stopped":
      Oe({
        isRecording: !1,
        currentSessionId: null
      }), [Z, ce, ye].filter(
        (n) => n && !n.isDestroyed()
      ).forEach((n) => {
        try {
          n.webContents && !n.webContents.isDestroyed() && n.webContents.send("backend-message", e);
        } catch (u) {
          console.warn("Failed to send recording_stopped to window:", u.message);
        }
      });
      break;
    case "partial_transcript":
      Oe({
        partialText: e.text,
        displayText: e.text,
        isFinal: !1
      }), [Z, ce, ye].filter((n) => n && !n.isDestroyed()).forEach((n) => {
        try {
          n.webContents && !n.webContents.isDestroyed() && n.webContents.send("backend-message", e);
        } catch (u) {
          console.warn("Failed to send partial_transcript to window:", u.message);
        }
      });
      break;
    case "final_transcript":
      const a = Pe.sessionTranscript, r = a ? a + " " + e.text : e.text;
      Oe({
        sessionTranscript: r,
        displayText: r,
        partialText: e.text,
        isFinal: !0
      }), [Z, ce, ye].filter((n) => n && !n.isDestroyed()).forEach((n) => {
        try {
          n.webContents && !n.webContents.isDestroyed() && n.webContents.send("backend-message", e);
        } catch (u) {
          console.warn("Failed to send final_transcript to window:", u.message);
        }
      });
      break;
    case "backend_status":
      Oe({
        isRecording: e.is_recording,
        currentSessionId: e.current_session_id,
        audioSource: e.audio_source,
        sessionTranscript: e.current_transcript || "",
        displayText: e.current_transcript || ""
      });
      break;
    case "waveform_data":
      Oe({
        waveformData: e.data || new Array(20).fill(0)
      });
      break;
    default:
      [Z, ce, ye].filter(
        (n) => n && !n.isDestroyed()
      ).forEach((n) => {
        try {
          n.webContents && !n.webContents.isDestroyed() && n.webContents.send("backend-message", e);
        } catch (u) {
          console.warn("Failed to send message to window:", u.message);
        }
      });
  }
}
function th() {
  if (Pu) {
    console.log("Development mode: Backend process handled by npm script");
    return;
  }
  const e = he.join(process.resourcesPath, "python"), t = he.join(e, "backend");
  let a;
  if (process.platform === "win32" ? a = he.join(e, "venv", "Scripts", "python.exe") : a = he.join(e, "venv", "bin", "python"), !Ce.existsSync(a)) {
    console.error("❌ Bundled Python not found at:", a), console.error("Please run: npm run build:python");
    return;
  }
  console.log("🐍 Starting bundled Python backend..."), console.log("Python executable:", a), console.log("Backend directory:", t), Le = Lu(a, [he.join(t, "main.py")], {
    cwd: t,
    detached: !1,
    env: {
      ...process.env,
      PYTHONPATH: t,
      PYTHONUNBUFFERED: "1"
    }
  }), Le.stdout.on("data", (r) => {
    console.log(`Backend stdout: ${r}`);
  }), Le.stderr.on("data", (r) => {
    console.error(`Backend stderr: ${r}`);
  }), Le.on("close", (r) => {
    console.log(`Backend process exited with code ${r}`);
  }), Le.on("error", (r) => {
    console.error("Failed to start backend process:", r);
  });
}
function au() {
  const { width: e, height: t } = Sn.getPrimaryDisplay().workAreaSize, a = vt.get("windowBounds", {
    x: Math.round((e - 420) / 2),
    y: 80,
    width: 420,
    height: 48
  });
  Z = new Tt({
    ...a,
    minWidth: 320,
    maxWidth: 500,
    minHeight: 48,
    maxHeight: 48,
    frame: !1,
    alwaysOnTop: !0,
    resizable: !1,
    movable: !0,
    minimizable: !1,
    maximizable: !1,
    fullscreenable: !1,
    show: !1,
    transparent: !0,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: he.join(Qe, "../preload/preload.js"),
      backgroundThrottling: !1
    }
  });
  async function r() {
    if (Re.isPackaged) {
      const l = he.join(process.resourcesPath, "app.asar", "dist", "renderer", "index.html");
      console.log("Loading HTML file in production:", l), Z.loadFile(l);
    } else {
      const l = process.env.ELECTRON_RENDERER_URL || "http://localhost:5173";
      console.log("Loading from Vite dev server:", l);
      try {
        await Z.loadURL(l), console.log("✅ Loaded from Vite dev server"), Z.webContents.openDevTools();
      } catch (n) {
        console.error("Failed to load from Vite dev server:", n);
        const u = he.resolve(Qe, "../../index.html");
        console.log("Fallback: Loading HTML file in dev mode:", u), Z.loadFile(u), Z.webContents.openDevTools();
      }
    }
  }
  r(), Z.once("ready-to-show", () => {
    Z.show(), Tu(), Qf() && (console.log("First run detected, opening settings window"), setTimeout(() => {
      Z && !Z.isDestroyed() && Z.webContents && !Z.webContents.isDestroyed() && Z.webContents.send("show-preferences-first-run");
    }, 1e3));
  }), Z.on("moved", ou), Z.on("resized", ou), Z.on("closed", () => {
    Z = null;
  });
}
async function rh() {
  if (ye && (ye.close(), ye = null), ce && !ce.isDestroyed()) {
    ce.focus();
    return;
  }
  const { width: e, height: t } = Sn.getPrimaryDisplay().workAreaSize;
  ce = new Tt({
    width: 600,
    height: 500,
    x: Math.round((e - 600) / 2),
    y: Math.round((t - 500) / 2),
    minWidth: 400,
    minHeight: 300,
    frame: !1,
    alwaysOnTop: !0,
    resizable: !1,
    movable: !0,
    minimizable: !1,
    maximizable: !1,
    fullscreenable: !1,
    show: !1,
    transparent: !0,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: he.join(Qe, "../preload/preload.js"),
      backgroundThrottling: !1
    }
  });
  const a = "transcript";
  try {
    if (Re.isPackaged) {
      const r = he.join(process.resourcesPath, "app.asar", "dist", "renderer", "index.html");
      console.log("Loading transcript from:", r, "with hash:", a), await ce.loadFile(r, { hash: a });
    } else {
      const l = `${process.env.ELECTRON_RENDERER_URL || "http://localhost:5173"}#${a}`;
      console.log("Loading transcript from:", l), await ce.loadURL(l);
    }
    ce.show();
  } catch (r) {
    console.error("Failed to load transcript window:", r), ce && (ce.close(), ce = null);
  }
  ce && (setTimeout(() => {
    try {
      ce && !ce.isDestroyed() && ce.webContents && !ce.webContents.isDestroyed() && ce.webContents.send("app-state-changed", Pe);
    } catch (r) {
      console.warn("Failed to send initial state to transcript window:", r.message);
    }
  }, 50), ce.on("closed", () => {
    if (Z && !Z.isDestroyed() && Z.webContents && !Z.webContents.isDestroyed())
      try {
        Z.webContents.send("transcript-window-closed");
      } catch (r) {
        console.warn("Failed to send transcript-window-closed event:", r.message);
      }
    ce = null;
  }), ce.webContents.setWindowOpenHandler(({ url: r }) => ((r.startsWith("https:") || r.startsWith("http:")) && na.openExternal(r), { action: "deny" })));
}
async function nh() {
  if (ce && (ce.close(), ce = null), ye && !ye.isDestroyed()) {
    ye.focus();
    return;
  }
  const { width: e, height: t } = Sn.getPrimaryDisplay().workAreaSize;
  ye = new Tt({
    width: 700,
    height: 600,
    x: Math.round((e - 700) / 2),
    y: Math.round((t - 600) / 2),
    minWidth: 500,
    minHeight: 400,
    frame: !1,
    alwaysOnTop: !0,
    resizable: !0,
    movable: !0,
    minimizable: !1,
    maximizable: !1,
    fullscreenable: !1,
    show: !1,
    transparent: !0,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: he.join(Qe, "../preload/preload.js"),
      backgroundThrottling: !1
    }
  });
  const a = "archive";
  try {
    if (Re.isPackaged) {
      const r = he.join(process.resourcesPath, "app.asar", "dist", "renderer", "index.html");
      console.log("Loading archive from:", r, "with hash:", a), await ye.loadFile(r, { hash: a });
    } else {
      const l = `${process.env.ELECTRON_RENDERER_URL || "http://localhost:5173"}#${a}`;
      console.log("Loading archive from:", l), await ye.loadURL(l);
    }
    ye.show();
  } catch (r) {
    console.error("Failed to load archive window:", r), ye && (ye.close(), ye = null);
  }
  ye && (ye.on("closed", () => {
    if (Z && !Z.isDestroyed() && Z.webContents && !Z.webContents.isDestroyed())
      try {
        Z.webContents.send("archive-window-closed");
      } catch (r) {
        console.warn("Failed to send archive-window-closed event:", r.message);
      }
    ye = null;
  }), ye.webContents.setWindowOpenHandler(({ url: r }) => ((r.startsWith("https:") || r.startsWith("http:")) && na.openExternal(r), { action: "deny" })));
}
async function sh() {
  if (Ee && !Ee.isDestroyed()) {
    Ee.focus();
    return;
  }
  const { width: e, height: t } = Sn.getPrimaryDisplay().workAreaSize;
  Ee = new Tt({
    width: 600,
    height: 500,
    x: Math.round((e - 600) / 2),
    y: Math.round((t - 500) / 2),
    minWidth: 500,
    minHeight: 400,
    frame: !1,
    alwaysOnTop: !0,
    resizable: !0,
    movable: !0,
    minimizable: !1,
    maximizable: !1,
    fullscreenable: !1,
    show: !1,
    transparent: !0,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      preload: he.join(Qe, "../preload/preload.js"),
      backgroundThrottling: !1
    }
  });
  const a = "settings";
  try {
    if (Re.isPackaged) {
      const r = he.join(process.resourcesPath, "app.asar", "dist", "renderer", "index.html");
      console.log("Loading settings from:", r, "with hash:", a), await Ee.loadFile(r, { hash: a });
    } else {
      const l = `${process.env.ELECTRON_RENDERER_URL || "http://localhost:5173"}#${a}`;
      console.log("Loading settings from:", l), await Ee.loadURL(l);
    }
    Ee.show();
  } catch (r) {
    console.error("Failed to load settings window:", r), Ee && (Ee.close(), Ee = null);
  }
  Ee && (Ee.on("closed", () => {
    if (Z && !Z.isDestroyed() && Z.webContents && !Z.webContents.isDestroyed())
      try {
        Z.webContents.send("settings-window-closed");
      } catch (r) {
        console.warn("Failed to send settings-window-closed event:", r.message);
      }
    Ee = null;
  }), Ee.webContents.setWindowOpenHandler(({ url: r }) => ((r.startsWith("https:") || r.startsWith("http:")) && na.openExternal(r), { action: "deny" })));
}
function ou() {
  Z && vt.set("windowBounds", Z.getBounds());
}
function Tu() {
  ve = new Ot("ws://127.0.0.1:8888/ws"), ve.on("open", () => {
    console.log("✅ Connected to backend WebSocket at ws://127.0.0.1:8888/ws"), Oe({ isConnected: !0 });
    try {
      ve.send(JSON.stringify({
        type: "update_settings",
        settings: {
          transcriptionModel: xe.transcriptionModel,
          language: xe.language
        }
      })), console.log(`📤 Sent settings to backend: model=${xe.transcriptionModel}, language=${xe.language}`);
    } catch (e) {
      console.error("Failed to send settings to backend:", e);
    }
  }), ve.on("message", (e) => {
    const t = JSON.parse(e.toString());
    eh(t);
  }), ve.on("error", (e) => {
    console.error("❌ WebSocket error:", e), console.log("Is backend running? Run: cd backend && python main.py"), Oe({ isConnected: !1 });
  }), ve.on("close", () => {
    console.log("WebSocket connection closed"), Oe({ isConnected: !1 }), setTimeout(Tu, 3e3);
  });
}
function ah() {
  try {
    const e = [
      he.join(Qe, "../renderer/assets/tray-icon.png"),
      he.join(Qe, "../../src/assets/tray-icon.png"),
      he.join(Qe, "../src/assets/tray-icon.png"),
      he.join(process.cwd(), "src/assets/tray-icon.png")
    ];
    let t = null;
    for (const r of e)
      if (Ce.existsSync(r)) {
        t = r, console.log("✅ Found tray icon at:", t);
        break;
      }
    if (!t) {
      console.log("⚠️ Tray icon not found in any expected location"), console.log("Searched paths:", e), console.log("ℹ️ Skipping tray creation");
      return;
    }
    ea = new ku(t);
    const a = Cu.buildFromTemplate([
      {
        label: "Show EchoTap",
        click: () => {
          Z && Z.show();
        }
      },
      {
        label: "Start Recording",
        click: () => {
          ve && ve.readyState === Ot.OPEN && ve.send(JSON.stringify({ type: "start_recording" }));
        }
      },
      {
        label: "Stop Recording",
        click: () => {
          ve && ve.readyState === Ot.OPEN && ve.send(JSON.stringify({ type: "stop_recording" }));
        }
      },
      { type: "separator" },
      {
        label: "Preferences",
        click: () => {
          if (Z && !Z.isDestroyed() && Z.webContents && !Z.webContents.isDestroyed())
            try {
              Z.webContents.send("show-preferences");
            } catch (r) {
              console.warn("Failed to send preferences message:", r.message);
            }
        }
      },
      {
        label: "Quit EchoTap",
        click: () => {
          Re.quit();
        }
      }
    ]);
    ea.setContextMenu(a), ea.setToolTip("EchoTap - Local Transcription"), console.log("✅ System tray created successfully");
  } catch (e) {
    console.error("❌ Failed to create system tray:", e.message), console.log("ℹ️ App will continue without system tray");
  }
}
function Iu() {
  const e = vt.get("shortcuts", {
    toggleRecording: "CommandOrControl+Shift+R"
    // More intuitive shortcut for toggle recording
  });
  try {
    e.toggleRecording && (ra.register(e.toggleRecording, () => {
      if (ve && ve.readyState === Ot.OPEN && (ve.send(JSON.stringify({ type: "toggle_recording" })), Z && !Z.isDestroyed())) {
        const a = Pe, r = !a.isRecording;
        Oe({
          isRecording: r,
          elapsedTime: r ? 0 : a.elapsedTime
        });
        try {
          Z.webContents.send("app-state-changed", Pe);
        } catch (l) {
          console.warn("Failed to send immediate state update to main window:", l.message);
        }
      }
    }) ? console.log(`✅ Global shortcut registered: ${e.toggleRecording} for toggle recording`) : console.warn(`⚠️ Failed to register shortcut ${e.toggleRecording} (may be in use by another app)`));
  } catch (t) {
    console.error("Failed to register global shortcuts:", t);
  }
}
Re.whenReady().then(() => {
  au(), ah(), Iu(), th(), Re.on("activate", () => {
    Tt.getAllWindows().length === 0 && au();
  });
});
Re.on("window-all-closed", async () => {
  process.platform !== "darwin" && (await tt(), Re.quit());
});
async function tt() {
  console.log("🧹 Starting cleanup process...");
  try {
    if (ve) {
      console.log("📡 Closing WebSocket connection...");
      try {
        ve.close(), await new Promise((a) => setTimeout(a, 500));
      } catch (a) {
        console.log("⚠️ WebSocket close error:", a.message);
      }
      ve = null;
    }
    if (Le && !Pu) {
      console.log("🛑 Terminating backend process...");
      try {
        Le.killed || (Le.kill("SIGTERM"), console.log("📡 Sent SIGTERM, waiting for graceful shutdown...")), await new Promise((a) => setTimeout(a, 3e3)), Le.killed || (console.log("💥 Force killing backend process..."), Le.kill("SIGKILL"), await new Promise((a) => setTimeout(a, 1e3)));
      } catch (a) {
        console.log("⚠️ Error killing backend process:", a.message);
      }
      Le = null;
    }
    console.log("🔍 Cleaning up any remaining Python processes...");
    const { spawn: e } = await import("child_process"), t = [];
    try {
      process.platform === "win32" ? (t.push(
        new Promise((a) => {
          const r = e("taskkill", ["/f", "/im", "python.exe"], {
            stdio: "ignore",
            timeout: 5e3
          });
          r.on("close", a), r.on("error", a);
        })
      ), t.push(
        new Promise((a) => {
          const r = e(
            "wmic",
            ["process", "where", 'CommandLine like "%main.py%"', "delete"],
            {
              stdio: "ignore",
              timeout: 5e3
            }
          );
          r.on("close", a), r.on("error", a);
        })
      )) : (t.push(
        new Promise((a) => {
          const r = e("pkill", ["-f", "main.py"], {
            stdio: "ignore",
            timeout: 5e3
          });
          r.on("close", a), r.on("error", a);
        })
      ), t.push(
        new Promise((a) => {
          const r = e("pkill", ["-f", "python.*main"], {
            stdio: "ignore",
            timeout: 5e3
          });
          r.on("close", a), r.on("error", a);
        })
      )), await Promise.race([
        Promise.all(t),
        new Promise((a) => setTimeout(a, 8e3))
        // 8 second max timeout
      ]);
    } catch (a) {
      console.log("⚠️ Could not cleanup background processes:", a.message);
    }
    try {
      if (console.log("🔍 Final verification of process cleanup..."), process.platform === "win32") {
        const a = e("tasklist", ["/fi", "ImageName eq python.exe"], {
          stdio: "pipe",
          timeout: 3e3
        });
        let r = "";
        a.stdout.on("data", (l) => r += l.toString()), await new Promise((l) => a.on("close", l)), r.includes("python.exe") ? console.log("⚠️ Some python processes may still be running") : console.log("✅ No python.exe processes detected");
      }
    } catch (a) {
      console.log("⚠️ Could not verify process cleanup:", a.message);
    }
    console.log("✅ Comprehensive cleanup completed");
  } catch (e) {
    console.error("❌ Error during cleanup:", e);
  }
}
let Te = !1;
Re.on("before-quit", async (e) => {
  if (!Te) {
    if (e.preventDefault(), Te = !0, console.log("🔄 App shutting down, starting cleanup..."), Z && !Z.isDestroyed())
      try {
        Oe({ status: "Closing..." }), Z.webContents.send("app-state-changed", Pe);
      } catch (t) {
        console.warn("Failed to update closing status:", t.message);
      }
    ra.unregisterAll(), await tt(), console.log("✅ Cleanup completed, exiting app"), Re.exit(0);
  }
});
Re.on("window-all-closed", async () => {
  process.platform !== "darwin" && !Te && (Te = !0, await tt(), Re.quit());
});
process.on("SIGINT", async () => {
  console.log("📡 Received SIGINT, cleaning up..."), Te || (Te = !0, await tt(), process.exit(0));
});
process.on("SIGTERM", async () => {
  console.log("📡 Received SIGTERM, cleaning up..."), Te || (Te = !0, await tt(), process.exit(0));
});
process.on("uncaughtException", async (e) => {
  console.error("💥 Uncaught exception:", e), Te || (Te = !0, await tt(), process.exit(1));
});
process.on("unhandledRejection", async (e, t) => {
  console.error("💥 Unhandled rejection at:", t, "reason:", e), Te || (Te = !0, await tt(), process.exit(1));
});
$e.handle("get-store-value", (e, t) => vt.get(t));
$e.handle("set-store-value", (e, t, a) => {
  vt.set(t, a);
});
$e.handle("send-to-backend", (e, t) => {
  try {
    return ve && ve.readyState === Ot.OPEN ? (ve.send(JSON.stringify(t)), { success: !0 }) : (console.warn("WebSocket not connected, message not sent:", t.type), { success: !1, error: "WebSocket not connected" });
  } catch (a) {
    return console.error("Error sending message to backend:", a), { success: !1, error: a.message };
  }
});
$e.handle("get-app-state", () => Pe);
$e.handle("update-app-state", (e, t) => (Oe(t), Pe));
$e.handle("get-state-property", (e, t) => Pe[t]);
$e.handle("set-state-property", (e, t, a) => (Oe({ [t]: a }), Pe[t]));
$e.handle("minimize-window", () => {
  Z && Z.hide();
});
$e.handle("close-window", async () => {
  Te || (Te = !0, await tt(), Re.quit());
});
$e.handle("show-transcript", async () => {
  await rh();
});
$e.handle("show-archive", async () => {
  await nh();
});
$e.handle("show-settings", async () => {
  await sh();
});
$e.handle("close-transcript", () => {
  ce && ce.close();
});
$e.handle("close-archive", () => {
  ye && ye.close();
});
$e.handle("close-settings", () => {
  Ee && Ee.close();
});
$e.handle("get-settings", () => xe);
$e.handle("save-settings", (e, t) => {
  try {
    return xe = { ...xe, ...t }, xf(xe) ? (Ou(t.theme), vt.get("shortcuts") && (ra.unregisterAll(), Iu(), console.log("🔄 Global shortcuts re-registered")), { success: !0 }) : { success: !1, error: "Failed to save settings to file" };
  } catch (a) {
    return console.error("Error saving settings:", a), { success: !1, error: a.message };
  }
});
$e.handle("apply-theme", (e, t) => {
  try {
    return Ou(t), { success: !0 };
  } catch (a) {
    return console.error("Error applying theme:", a), { success: !1, error: a.message };
  }
});
