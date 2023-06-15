if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue, shared) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_LOAD = "onLoad";
  const ON_BACK_PRESS = "onBackPress";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return shared.isString(component) ? easycom : component;
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createHook(ON_SHOW);
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  const onBackPress = /* @__PURE__ */ createHook(ON_BACK_PRESS);
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = { ...defaultSettings };
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        }
      };
      hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
        if (pluginId === this.plugin.id) {
          this.fallbacks.setSettings(value);
        }
      });
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && pluginDescriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(pluginDescriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * vuex v4.1.0
   * (c) 2022 Evan You
   * @license MIT
   */
  var storeKey = "store";
  function useStore(key) {
    if (key === void 0)
      key = null;
    return vue.inject(key !== null ? key : storeKey);
  }
  function forEachValue(obj, fn) {
    Object.keys(obj).forEach(function(key) {
      return fn(obj[key], key);
    });
  }
  function isObject(obj) {
    return obj !== null && typeof obj === "object";
  }
  function isPromise(val) {
    return val && typeof val.then === "function";
  }
  function assert(condition, msg) {
    if (!condition) {
      throw new Error("[vuex] " + msg);
    }
  }
  function partial(fn, arg) {
    return function() {
      return fn(arg);
    };
  }
  function genericSubscribe(fn, subs, options) {
    if (subs.indexOf(fn) < 0) {
      options && options.prepend ? subs.unshift(fn) : subs.push(fn);
    }
    return function() {
      var i = subs.indexOf(fn);
      if (i > -1) {
        subs.splice(i, 1);
      }
    };
  }
  function resetStore(store2, hot) {
    store2._actions = /* @__PURE__ */ Object.create(null);
    store2._mutations = /* @__PURE__ */ Object.create(null);
    store2._wrappedGetters = /* @__PURE__ */ Object.create(null);
    store2._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    var state = store2.state;
    installModule(store2, state, [], store2._modules.root, true);
    resetStoreState(store2, state, hot);
  }
  function resetStoreState(store2, state, hot) {
    var oldState = store2._state;
    var oldScope = store2._scope;
    store2.getters = {};
    store2._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    var wrappedGetters = store2._wrappedGetters;
    var computedObj = {};
    var computedCache = {};
    var scope = vue.effectScope(true);
    scope.run(function() {
      forEachValue(wrappedGetters, function(fn, key) {
        computedObj[key] = partial(fn, store2);
        computedCache[key] = vue.computed(function() {
          return computedObj[key]();
        });
        Object.defineProperty(store2.getters, key, {
          get: function() {
            return computedCache[key].value;
          },
          enumerable: true
          // for local getters
        });
      });
    });
    store2._state = vue.reactive({
      data: state
    });
    store2._scope = scope;
    if (store2.strict) {
      enableStrictMode(store2);
    }
    if (oldState) {
      if (hot) {
        store2._withCommit(function() {
          oldState.data = null;
        });
      }
    }
    if (oldScope) {
      oldScope.stop();
    }
  }
  function installModule(store2, rootState, path, module, hot) {
    var isRoot = !path.length;
    var namespace = store2._modules.getNamespace(path);
    if (module.namespaced) {
      if (store2._modulesNamespaceMap[namespace] && true) {
        console.error("[vuex] duplicate namespace " + namespace + " for the namespaced module " + path.join("/"));
      }
      store2._modulesNamespaceMap[namespace] = module;
    }
    if (!isRoot && !hot) {
      var parentState = getNestedState(rootState, path.slice(0, -1));
      var moduleName = path[path.length - 1];
      store2._withCommit(function() {
        {
          if (moduleName in parentState) {
            console.warn(
              '[vuex] state field "' + moduleName + '" was overridden by a module with the same name at "' + path.join(".") + '"'
            );
          }
        }
        parentState[moduleName] = module.state;
      });
    }
    var local = module.context = makeLocalContext(store2, namespace, path);
    module.forEachMutation(function(mutation, key) {
      var namespacedType = namespace + key;
      registerMutation(store2, namespacedType, mutation, local);
    });
    module.forEachAction(function(action, key) {
      var type = action.root ? key : namespace + key;
      var handler = action.handler || action;
      registerAction(store2, type, handler, local);
    });
    module.forEachGetter(function(getter, key) {
      var namespacedType = namespace + key;
      registerGetter(store2, namespacedType, getter, local);
    });
    module.forEachChild(function(child, key) {
      installModule(store2, rootState, path.concat(key), child, hot);
    });
  }
  function makeLocalContext(store2, namespace, path) {
    var noNamespace = namespace === "";
    var local = {
      dispatch: noNamespace ? store2.dispatch : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._actions[type]) {
            console.error("[vuex] unknown local action type: " + args.type + ", global type: " + type);
            return;
          }
        }
        return store2.dispatch(type, payload);
      },
      commit: noNamespace ? store2.commit : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._mutations[type]) {
            console.error("[vuex] unknown local mutation type: " + args.type + ", global type: " + type);
            return;
          }
        }
        store2.commit(type, payload, options);
      }
    };
    Object.defineProperties(local, {
      getters: {
        get: noNamespace ? function() {
          return store2.getters;
        } : function() {
          return makeLocalGetters(store2, namespace);
        }
      },
      state: {
        get: function() {
          return getNestedState(store2.state, path);
        }
      }
    });
    return local;
  }
  function makeLocalGetters(store2, namespace) {
    if (!store2._makeLocalGettersCache[namespace]) {
      var gettersProxy = {};
      var splitPos = namespace.length;
      Object.keys(store2.getters).forEach(function(type) {
        if (type.slice(0, splitPos) !== namespace) {
          return;
        }
        var localType = type.slice(splitPos);
        Object.defineProperty(gettersProxy, localType, {
          get: function() {
            return store2.getters[type];
          },
          enumerable: true
        });
      });
      store2._makeLocalGettersCache[namespace] = gettersProxy;
    }
    return store2._makeLocalGettersCache[namespace];
  }
  function registerMutation(store2, type, handler, local) {
    var entry = store2._mutations[type] || (store2._mutations[type] = []);
    entry.push(function wrappedMutationHandler(payload) {
      handler.call(store2, local.state, payload);
    });
  }
  function registerAction(store2, type, handler, local) {
    var entry = store2._actions[type] || (store2._actions[type] = []);
    entry.push(function wrappedActionHandler(payload) {
      var res = handler.call(store2, {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store2.getters,
        rootState: store2.state
      }, payload);
      if (!isPromise(res)) {
        res = Promise.resolve(res);
      }
      if (store2._devtoolHook) {
        return res.catch(function(err) {
          store2._devtoolHook.emit("vuex:error", err);
          throw err;
        });
      } else {
        return res;
      }
    });
  }
  function registerGetter(store2, type, rawGetter, local) {
    if (store2._wrappedGetters[type]) {
      {
        console.error("[vuex] duplicate getter key: " + type);
      }
      return;
    }
    store2._wrappedGetters[type] = function wrappedGetter(store3) {
      return rawGetter(
        local.state,
        // local state
        local.getters,
        // local getters
        store3.state,
        // root state
        store3.getters
        // root getters
      );
    };
  }
  function enableStrictMode(store2) {
    vue.watch(function() {
      return store2._state.data;
    }, function() {
      {
        assert(store2._committing, "do not mutate vuex store state outside mutation handlers.");
      }
    }, { deep: true, flush: "sync" });
  }
  function getNestedState(state, path) {
    return path.reduce(function(state2, key) {
      return state2[key];
    }, state);
  }
  function unifyObjectStyle(type, payload, options) {
    if (isObject(type) && type.type) {
      options = payload;
      payload = type;
      type = type.type;
    }
    {
      assert(typeof type === "string", "expects string as the type, but found " + typeof type + ".");
    }
    return { type, payload, options };
  }
  var LABEL_VUEX_BINDINGS = "vuex bindings";
  var MUTATIONS_LAYER_ID = "vuex:mutations";
  var ACTIONS_LAYER_ID = "vuex:actions";
  var INSPECTOR_ID = "vuex";
  var actionId = 0;
  function addDevtools(app, store2) {
    setupDevtoolsPlugin(
      {
        id: "org.vuejs.vuex",
        app,
        label: "Vuex",
        homepage: "https://next.vuex.vuejs.org/",
        logo: "https://vuejs.org/images/icons/favicon-96x96.png",
        packageName: "vuex",
        componentStateTypes: [LABEL_VUEX_BINDINGS]
      },
      function(api) {
        api.addTimelineLayer({
          id: MUTATIONS_LAYER_ID,
          label: "Vuex Mutations",
          color: COLOR_LIME_500
        });
        api.addTimelineLayer({
          id: ACTIONS_LAYER_ID,
          label: "Vuex Actions",
          color: COLOR_LIME_500
        });
        api.addInspector({
          id: INSPECTOR_ID,
          label: "Vuex",
          icon: "storage",
          treeFilterPlaceholder: "Filter stores..."
        });
        api.on.getInspectorTree(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            if (payload.filter) {
              var nodes = [];
              flattenStoreForInspectorTree(nodes, store2._modules.root, payload.filter, "");
              payload.rootNodes = nodes;
            } else {
              payload.rootNodes = [
                formatStoreForInspectorTree(store2._modules.root, "")
              ];
            }
          }
        });
        api.on.getInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            makeLocalGetters(store2, modulePath);
            payload.state = formatStoreForInspectorState(
              getStoreModule(store2._modules, modulePath),
              modulePath === "root" ? store2.getters : store2._makeLocalGettersCache,
              modulePath
            );
          }
        });
        api.on.editInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            var path = payload.path;
            if (modulePath !== "root") {
              path = modulePath.split("/").filter(Boolean).concat(path);
            }
            store2._withCommit(function() {
              payload.set(store2._state.data, path, payload.state.value);
            });
          }
        });
        store2.subscribe(function(mutation, state) {
          var data = {};
          if (mutation.payload) {
            data.payload = mutation.payload;
          }
          data.state = state;
          api.notifyComponentUpdate();
          api.sendInspectorTree(INSPECTOR_ID);
          api.sendInspectorState(INSPECTOR_ID);
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: Date.now(),
              title: mutation.type,
              data
            }
          });
        });
        store2.subscribeAction({
          before: function(action, state) {
            var data = {};
            if (action.payload) {
              data.payload = action.payload;
            }
            action._id = actionId++;
            action._time = Date.now();
            data.state = state;
            api.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: action._time,
                title: action.type,
                groupId: action._id,
                subtitle: "start",
                data
              }
            });
          },
          after: function(action, state) {
            var data = {};
            var duration = Date.now() - action._time;
            data.duration = {
              _custom: {
                type: "duration",
                display: duration + "ms",
                tooltip: "Action duration",
                value: duration
              }
            };
            if (action.payload) {
              data.payload = action.payload;
            }
            data.state = state;
            api.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: Date.now(),
                title: action.type,
                groupId: action._id,
                subtitle: "end",
                data
              }
            });
          }
        });
      }
    );
  }
  var COLOR_LIME_500 = 8702998;
  var COLOR_DARK = 6710886;
  var COLOR_WHITE = 16777215;
  var TAG_NAMESPACED = {
    label: "namespaced",
    textColor: COLOR_WHITE,
    backgroundColor: COLOR_DARK
  };
  function extractNameFromPath(path) {
    return path && path !== "root" ? path.split("/").slice(-2, -1)[0] : "Root";
  }
  function formatStoreForInspectorTree(module, path) {
    return {
      id: path || "root",
      // all modules end with a `/`, we want the last segment only
      // cart/ -> cart
      // nested/cart/ -> cart
      label: extractNameFromPath(path),
      tags: module.namespaced ? [TAG_NAMESPACED] : [],
      children: Object.keys(module._children).map(
        function(moduleName) {
          return formatStoreForInspectorTree(
            module._children[moduleName],
            path + moduleName + "/"
          );
        }
      )
    };
  }
  function flattenStoreForInspectorTree(result, module, filter, path) {
    if (path.includes(filter)) {
      result.push({
        id: path || "root",
        label: path.endsWith("/") ? path.slice(0, path.length - 1) : path || "Root",
        tags: module.namespaced ? [TAG_NAMESPACED] : []
      });
    }
    Object.keys(module._children).forEach(function(moduleName) {
      flattenStoreForInspectorTree(result, module._children[moduleName], filter, path + moduleName + "/");
    });
  }
  function formatStoreForInspectorState(module, getters, path) {
    getters = path === "root" ? getters : getters[path];
    var gettersKeys = Object.keys(getters);
    var storeState = {
      state: Object.keys(module.state).map(function(key) {
        return {
          key,
          editable: true,
          value: module.state[key]
        };
      })
    };
    if (gettersKeys.length) {
      var tree = transformPathsToObjectTree(getters);
      storeState.getters = Object.keys(tree).map(function(key) {
        return {
          key: key.endsWith("/") ? extractNameFromPath(key) : key,
          editable: false,
          value: canThrow(function() {
            return tree[key];
          })
        };
      });
    }
    return storeState;
  }
  function transformPathsToObjectTree(getters) {
    var result = {};
    Object.keys(getters).forEach(function(key) {
      var path = key.split("/");
      if (path.length > 1) {
        var target = result;
        var leafKey = path.pop();
        path.forEach(function(p) {
          if (!target[p]) {
            target[p] = {
              _custom: {
                value: {},
                display: p,
                tooltip: "Module",
                abstract: true
              }
            };
          }
          target = target[p]._custom.value;
        });
        target[leafKey] = canThrow(function() {
          return getters[key];
        });
      } else {
        result[key] = canThrow(function() {
          return getters[key];
        });
      }
    });
    return result;
  }
  function getStoreModule(moduleMap, path) {
    var names = path.split("/").filter(function(n) {
      return n;
    });
    return names.reduce(
      function(module, moduleName, i) {
        var child = module[moduleName];
        if (!child) {
          throw new Error('Missing module "' + moduleName + '" for path "' + path + '".');
        }
        return i === names.length - 1 ? child : child._children;
      },
      path === "root" ? moduleMap : moduleMap.root._children
    );
  }
  function canThrow(cb) {
    try {
      return cb();
    } catch (e) {
      return e;
    }
  }
  var Module = function Module2(rawModule, runtime) {
    this.runtime = runtime;
    this._children = /* @__PURE__ */ Object.create(null);
    this._rawModule = rawModule;
    var rawState = rawModule.state;
    this.state = (typeof rawState === "function" ? rawState() : rawState) || {};
  };
  var prototypeAccessors$1 = { namespaced: { configurable: true } };
  prototypeAccessors$1.namespaced.get = function() {
    return !!this._rawModule.namespaced;
  };
  Module.prototype.addChild = function addChild(key, module) {
    this._children[key] = module;
  };
  Module.prototype.removeChild = function removeChild(key) {
    delete this._children[key];
  };
  Module.prototype.getChild = function getChild(key) {
    return this._children[key];
  };
  Module.prototype.hasChild = function hasChild(key) {
    return key in this._children;
  };
  Module.prototype.update = function update2(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  };
  Module.prototype.forEachChild = function forEachChild(fn) {
    forEachValue(this._children, fn);
  };
  Module.prototype.forEachGetter = function forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  };
  Module.prototype.forEachAction = function forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  };
  Module.prototype.forEachMutation = function forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  };
  Object.defineProperties(Module.prototype, prototypeAccessors$1);
  var ModuleCollection = function ModuleCollection2(rawRootModule) {
    this.register([], rawRootModule, false);
  };
  ModuleCollection.prototype.get = function get(path) {
    return path.reduce(function(module, key) {
      return module.getChild(key);
    }, this.root);
  };
  ModuleCollection.prototype.getNamespace = function getNamespace(path) {
    var module = this.root;
    return path.reduce(function(namespace, key) {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  };
  ModuleCollection.prototype.update = function update$1(rawRootModule) {
    update([], this.root, rawRootModule);
  };
  ModuleCollection.prototype.register = function register(path, rawModule, runtime) {
    var this$1$1 = this;
    if (runtime === void 0)
      runtime = true;
    {
      assertRawModule(path, rawModule);
    }
    var newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      var parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }
    if (rawModule.modules) {
      forEachValue(rawModule.modules, function(rawChildModule, key) {
        this$1$1.register(path.concat(key), rawChildModule, runtime);
      });
    }
  };
  ModuleCollection.prototype.unregister = function unregister(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    var child = parent.getChild(key);
    if (!child) {
      {
        console.warn(
          "[vuex] trying to unregister module '" + key + "', which is not registered"
        );
      }
      return;
    }
    if (!child.runtime) {
      return;
    }
    parent.removeChild(key);
  };
  ModuleCollection.prototype.isRegistered = function isRegistered(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    if (parent) {
      return parent.hasChild(key);
    }
    return false;
  };
  function update(path, targetModule, newModule) {
    {
      assertRawModule(path, newModule);
    }
    targetModule.update(newModule);
    if (newModule.modules) {
      for (var key in newModule.modules) {
        if (!targetModule.getChild(key)) {
          {
            console.warn(
              "[vuex] trying to add a new module '" + key + "' on hot reloading, manual reload is needed"
            );
          }
          return;
        }
        update(
          path.concat(key),
          targetModule.getChild(key),
          newModule.modules[key]
        );
      }
    }
  }
  var functionAssert = {
    assert: function(value) {
      return typeof value === "function";
    },
    expected: "function"
  };
  var objectAssert = {
    assert: function(value) {
      return typeof value === "function" || typeof value === "object" && typeof value.handler === "function";
    },
    expected: 'function or object with "handler" function'
  };
  var assertTypes = {
    getters: functionAssert,
    mutations: functionAssert,
    actions: objectAssert
  };
  function assertRawModule(path, rawModule) {
    Object.keys(assertTypes).forEach(function(key) {
      if (!rawModule[key]) {
        return;
      }
      var assertOptions = assertTypes[key];
      forEachValue(rawModule[key], function(value, type) {
        assert(
          assertOptions.assert(value),
          makeAssertionMessage(path, key, type, value, assertOptions.expected)
        );
      });
    });
  }
  function makeAssertionMessage(path, key, type, value, expected) {
    var buf = key + " should be " + expected + ' but "' + key + "." + type + '"';
    if (path.length > 0) {
      buf += ' in module "' + path.join(".") + '"';
    }
    buf += " is " + JSON.stringify(value) + ".";
    return buf;
  }
  function createStore(options) {
    return new Store(options);
  }
  var Store = function Store2(options) {
    var this$1$1 = this;
    if (options === void 0)
      options = {};
    {
      assert(typeof Promise !== "undefined", "vuex requires a Promise polyfill in this browser.");
      assert(this instanceof Store2, "store must be called with the new operator.");
    }
    var plugins = options.plugins;
    if (plugins === void 0)
      plugins = [];
    var strict = options.strict;
    if (strict === void 0)
      strict = false;
    var devtools = options.devtools;
    this._committing = false;
    this._actions = /* @__PURE__ */ Object.create(null);
    this._actionSubscribers = [];
    this._mutations = /* @__PURE__ */ Object.create(null);
    this._wrappedGetters = /* @__PURE__ */ Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    this._subscribers = [];
    this._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    this._scope = null;
    this._devtools = devtools;
    var store2 = this;
    var ref = this;
    var dispatch = ref.dispatch;
    var commit = ref.commit;
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store2, type, payload);
    };
    this.commit = function boundCommit(type, payload, options2) {
      return commit.call(store2, type, payload, options2);
    };
    this.strict = strict;
    var state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreState(this, state);
    plugins.forEach(function(plugin) {
      return plugin(this$1$1);
    });
  };
  var prototypeAccessors = { state: { configurable: true } };
  Store.prototype.install = function install(app, injectKey) {
    app.provide(injectKey || storeKey, this);
    app.config.globalProperties.$store = this;
    var useDevtools = this._devtools !== void 0 ? this._devtools : true;
    if (useDevtools) {
      addDevtools(app, this);
    }
  };
  prototypeAccessors.state.get = function() {
    return this._state.data;
  };
  prototypeAccessors.state.set = function(v) {
    {
      assert(false, "use store.replaceState() to explicit replace store state.");
    }
  };
  Store.prototype.commit = function commit(_type, _payload, _options) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload, _options);
    var type = ref.type;
    var payload = ref.payload;
    var options = ref.options;
    var mutation = { type, payload };
    var entry = this._mutations[type];
    if (!entry) {
      {
        console.error("[vuex] unknown mutation type: " + type);
      }
      return;
    }
    this._withCommit(function() {
      entry.forEach(function commitIterator(handler) {
        handler(payload);
      });
    });
    this._subscribers.slice().forEach(function(sub) {
      return sub(mutation, this$1$1.state);
    });
    if (options && options.silent) {
      console.warn(
        "[vuex] mutation type: " + type + ". Silent option has been removed. Use the filter functionality in the vue-devtools"
      );
    }
  };
  Store.prototype.dispatch = function dispatch(_type, _payload) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload);
    var type = ref.type;
    var payload = ref.payload;
    var action = { type, payload };
    var entry = this._actions[type];
    if (!entry) {
      {
        console.error("[vuex] unknown action type: " + type);
      }
      return;
    }
    try {
      this._actionSubscribers.slice().filter(function(sub) {
        return sub.before;
      }).forEach(function(sub) {
        return sub.before(action, this$1$1.state);
      });
    } catch (e) {
      {
        console.warn("[vuex] error in before action subscribers: ");
        console.error(e);
      }
    }
    var result = entry.length > 1 ? Promise.all(entry.map(function(handler) {
      return handler(payload);
    })) : entry[0](payload);
    return new Promise(function(resolve, reject) {
      result.then(function(res) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.after;
          }).forEach(function(sub) {
            return sub.after(action, this$1$1.state);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in after action subscribers: ");
            console.error(e);
          }
        }
        resolve(res);
      }, function(error) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.error;
          }).forEach(function(sub) {
            return sub.error(action, this$1$1.state, error);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in error action subscribers: ");
            console.error(e);
          }
        }
        reject(error);
      });
    });
  };
  Store.prototype.subscribe = function subscribe(fn, options) {
    return genericSubscribe(fn, this._subscribers, options);
  };
  Store.prototype.subscribeAction = function subscribeAction(fn, options) {
    var subs = typeof fn === "function" ? { before: fn } : fn;
    return genericSubscribe(subs, this._actionSubscribers, options);
  };
  Store.prototype.watch = function watch$1(getter, cb, options) {
    var this$1$1 = this;
    {
      assert(typeof getter === "function", "store.watch only accepts a function.");
    }
    return vue.watch(function() {
      return getter(this$1$1.state, this$1$1.getters);
    }, cb, Object.assign({}, options));
  };
  Store.prototype.replaceState = function replaceState(state) {
    var this$1$1 = this;
    this._withCommit(function() {
      this$1$1._state.data = state;
    });
  };
  Store.prototype.registerModule = function registerModule(path, rawModule, options) {
    if (options === void 0)
      options = {};
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
      assert(path.length > 0, "cannot register the root module by using registerModule.");
    }
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path), options.preserveState);
    resetStoreState(this, this.state);
  };
  Store.prototype.unregisterModule = function unregisterModule(path) {
    var this$1$1 = this;
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    this._modules.unregister(path);
    this._withCommit(function() {
      var parentState = getNestedState(this$1$1.state, path.slice(0, -1));
      delete parentState[path[path.length - 1]];
    });
    resetStore(this);
  };
  Store.prototype.hasModule = function hasModule(path) {
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    return this._modules.isRegistered(path);
  };
  Store.prototype.hotUpdate = function hotUpdate(newOptions) {
    this._modules.update(newOptions);
    resetStore(this, true);
  };
  Store.prototype._withCommit = function _withCommit(fn) {
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  };
  Object.defineProperties(Store.prototype, prototypeAccessors);
  const icons = {
    "id": "2852637",
    "name": "uniui图标库",
    "font_family": "uniicons",
    "css_prefix_text": "uniui-",
    "description": "",
    "glyphs": [
      {
        "icon_id": "25027049",
        "name": "yanse",
        "font_class": "color",
        "unicode": "e6cf",
        "unicode_decimal": 59087
      },
      {
        "icon_id": "25027048",
        "name": "wallet",
        "font_class": "wallet",
        "unicode": "e6b1",
        "unicode_decimal": 59057
      },
      {
        "icon_id": "25015720",
        "name": "settings-filled",
        "font_class": "settings-filled",
        "unicode": "e6ce",
        "unicode_decimal": 59086
      },
      {
        "icon_id": "25015434",
        "name": "shimingrenzheng-filled",
        "font_class": "auth-filled",
        "unicode": "e6cc",
        "unicode_decimal": 59084
      },
      {
        "icon_id": "24934246",
        "name": "shop-filled",
        "font_class": "shop-filled",
        "unicode": "e6cd",
        "unicode_decimal": 59085
      },
      {
        "icon_id": "24934159",
        "name": "staff-filled-01",
        "font_class": "staff-filled",
        "unicode": "e6cb",
        "unicode_decimal": 59083
      },
      {
        "icon_id": "24932461",
        "name": "VIP-filled",
        "font_class": "vip-filled",
        "unicode": "e6c6",
        "unicode_decimal": 59078
      },
      {
        "icon_id": "24932462",
        "name": "plus_circle_fill",
        "font_class": "plus-filled",
        "unicode": "e6c7",
        "unicode_decimal": 59079
      },
      {
        "icon_id": "24932463",
        "name": "folder_add-filled",
        "font_class": "folder-add-filled",
        "unicode": "e6c8",
        "unicode_decimal": 59080
      },
      {
        "icon_id": "24932464",
        "name": "yanse-filled",
        "font_class": "color-filled",
        "unicode": "e6c9",
        "unicode_decimal": 59081
      },
      {
        "icon_id": "24932465",
        "name": "tune-filled",
        "font_class": "tune-filled",
        "unicode": "e6ca",
        "unicode_decimal": 59082
      },
      {
        "icon_id": "24932455",
        "name": "a-rilidaka-filled",
        "font_class": "calendar-filled",
        "unicode": "e6c0",
        "unicode_decimal": 59072
      },
      {
        "icon_id": "24932456",
        "name": "notification-filled",
        "font_class": "notification-filled",
        "unicode": "e6c1",
        "unicode_decimal": 59073
      },
      {
        "icon_id": "24932457",
        "name": "wallet-filled",
        "font_class": "wallet-filled",
        "unicode": "e6c2",
        "unicode_decimal": 59074
      },
      {
        "icon_id": "24932458",
        "name": "paihangbang-filled",
        "font_class": "medal-filled",
        "unicode": "e6c3",
        "unicode_decimal": 59075
      },
      {
        "icon_id": "24932459",
        "name": "gift-filled",
        "font_class": "gift-filled",
        "unicode": "e6c4",
        "unicode_decimal": 59076
      },
      {
        "icon_id": "24932460",
        "name": "fire-filled",
        "font_class": "fire-filled",
        "unicode": "e6c5",
        "unicode_decimal": 59077
      },
      {
        "icon_id": "24928001",
        "name": "refreshempty",
        "font_class": "refreshempty",
        "unicode": "e6bf",
        "unicode_decimal": 59071
      },
      {
        "icon_id": "24926853",
        "name": "location-ellipse",
        "font_class": "location-filled",
        "unicode": "e6af",
        "unicode_decimal": 59055
      },
      {
        "icon_id": "24926735",
        "name": "person-filled",
        "font_class": "person-filled",
        "unicode": "e69d",
        "unicode_decimal": 59037
      },
      {
        "icon_id": "24926703",
        "name": "personadd-filled",
        "font_class": "personadd-filled",
        "unicode": "e698",
        "unicode_decimal": 59032
      },
      {
        "icon_id": "24923351",
        "name": "back",
        "font_class": "back",
        "unicode": "e6b9",
        "unicode_decimal": 59065
      },
      {
        "icon_id": "24923352",
        "name": "forward",
        "font_class": "forward",
        "unicode": "e6ba",
        "unicode_decimal": 59066
      },
      {
        "icon_id": "24923353",
        "name": "arrowthinright",
        "font_class": "arrow-right",
        "unicode": "e6bb",
        "unicode_decimal": 59067
      },
      {
        "icon_id": "24923353",
        "name": "arrowthinright",
        "font_class": "arrowthinright",
        "unicode": "e6bb",
        "unicode_decimal": 59067
      },
      {
        "icon_id": "24923354",
        "name": "arrowthinleft",
        "font_class": "arrow-left",
        "unicode": "e6bc",
        "unicode_decimal": 59068
      },
      {
        "icon_id": "24923354",
        "name": "arrowthinleft",
        "font_class": "arrowthinleft",
        "unicode": "e6bc",
        "unicode_decimal": 59068
      },
      {
        "icon_id": "24923355",
        "name": "arrowthinup",
        "font_class": "arrow-up",
        "unicode": "e6bd",
        "unicode_decimal": 59069
      },
      {
        "icon_id": "24923355",
        "name": "arrowthinup",
        "font_class": "arrowthinup",
        "unicode": "e6bd",
        "unicode_decimal": 59069
      },
      {
        "icon_id": "24923356",
        "name": "arrowthindown",
        "font_class": "arrow-down",
        "unicode": "e6be",
        "unicode_decimal": 59070
      },
      {
        "icon_id": "24923356",
        "name": "arrowthindown",
        "font_class": "arrowthindown",
        "unicode": "e6be",
        "unicode_decimal": 59070
      },
      {
        "icon_id": "24923349",
        "name": "arrowdown",
        "font_class": "bottom",
        "unicode": "e6b8",
        "unicode_decimal": 59064
      },
      {
        "icon_id": "24923349",
        "name": "arrowdown",
        "font_class": "arrowdown",
        "unicode": "e6b8",
        "unicode_decimal": 59064
      },
      {
        "icon_id": "24923346",
        "name": "arrowright",
        "font_class": "right",
        "unicode": "e6b5",
        "unicode_decimal": 59061
      },
      {
        "icon_id": "24923346",
        "name": "arrowright",
        "font_class": "arrowright",
        "unicode": "e6b5",
        "unicode_decimal": 59061
      },
      {
        "icon_id": "24923347",
        "name": "arrowup",
        "font_class": "top",
        "unicode": "e6b6",
        "unicode_decimal": 59062
      },
      {
        "icon_id": "24923347",
        "name": "arrowup",
        "font_class": "arrowup",
        "unicode": "e6b6",
        "unicode_decimal": 59062
      },
      {
        "icon_id": "24923348",
        "name": "arrowleft",
        "font_class": "left",
        "unicode": "e6b7",
        "unicode_decimal": 59063
      },
      {
        "icon_id": "24923348",
        "name": "arrowleft",
        "font_class": "arrowleft",
        "unicode": "e6b7",
        "unicode_decimal": 59063
      },
      {
        "icon_id": "24923334",
        "name": "eye",
        "font_class": "eye",
        "unicode": "e651",
        "unicode_decimal": 58961
      },
      {
        "icon_id": "24923335",
        "name": "eye-filled",
        "font_class": "eye-filled",
        "unicode": "e66a",
        "unicode_decimal": 58986
      },
      {
        "icon_id": "24923336",
        "name": "eye-slash",
        "font_class": "eye-slash",
        "unicode": "e6b3",
        "unicode_decimal": 59059
      },
      {
        "icon_id": "24923337",
        "name": "eye-slash-filled",
        "font_class": "eye-slash-filled",
        "unicode": "e6b4",
        "unicode_decimal": 59060
      },
      {
        "icon_id": "24923305",
        "name": "info-filled",
        "font_class": "info-filled",
        "unicode": "e649",
        "unicode_decimal": 58953
      },
      {
        "icon_id": "24923299",
        "name": "reload-01",
        "font_class": "reload",
        "unicode": "e6b2",
        "unicode_decimal": 59058
      },
      {
        "icon_id": "24923195",
        "name": "mic_slash_fill",
        "font_class": "micoff-filled",
        "unicode": "e6b0",
        "unicode_decimal": 59056
      },
      {
        "icon_id": "24923165",
        "name": "map-pin-ellipse",
        "font_class": "map-pin-ellipse",
        "unicode": "e6ac",
        "unicode_decimal": 59052
      },
      {
        "icon_id": "24923166",
        "name": "map-pin",
        "font_class": "map-pin",
        "unicode": "e6ad",
        "unicode_decimal": 59053
      },
      {
        "icon_id": "24923167",
        "name": "location",
        "font_class": "location",
        "unicode": "e6ae",
        "unicode_decimal": 59054
      },
      {
        "icon_id": "24923064",
        "name": "starhalf",
        "font_class": "starhalf",
        "unicode": "e683",
        "unicode_decimal": 59011
      },
      {
        "icon_id": "24923065",
        "name": "star",
        "font_class": "star",
        "unicode": "e688",
        "unicode_decimal": 59016
      },
      {
        "icon_id": "24923066",
        "name": "star-filled",
        "font_class": "star-filled",
        "unicode": "e68f",
        "unicode_decimal": 59023
      },
      {
        "icon_id": "24899646",
        "name": "a-rilidaka",
        "font_class": "calendar",
        "unicode": "e6a0",
        "unicode_decimal": 59040
      },
      {
        "icon_id": "24899647",
        "name": "fire",
        "font_class": "fire",
        "unicode": "e6a1",
        "unicode_decimal": 59041
      },
      {
        "icon_id": "24899648",
        "name": "paihangbang",
        "font_class": "medal",
        "unicode": "e6a2",
        "unicode_decimal": 59042
      },
      {
        "icon_id": "24899649",
        "name": "font",
        "font_class": "font",
        "unicode": "e6a3",
        "unicode_decimal": 59043
      },
      {
        "icon_id": "24899650",
        "name": "gift",
        "font_class": "gift",
        "unicode": "e6a4",
        "unicode_decimal": 59044
      },
      {
        "icon_id": "24899651",
        "name": "link",
        "font_class": "link",
        "unicode": "e6a5",
        "unicode_decimal": 59045
      },
      {
        "icon_id": "24899652",
        "name": "notification",
        "font_class": "notification",
        "unicode": "e6a6",
        "unicode_decimal": 59046
      },
      {
        "icon_id": "24899653",
        "name": "staff",
        "font_class": "staff",
        "unicode": "e6a7",
        "unicode_decimal": 59047
      },
      {
        "icon_id": "24899654",
        "name": "VIP",
        "font_class": "vip",
        "unicode": "e6a8",
        "unicode_decimal": 59048
      },
      {
        "icon_id": "24899655",
        "name": "folder_add",
        "font_class": "folder-add",
        "unicode": "e6a9",
        "unicode_decimal": 59049
      },
      {
        "icon_id": "24899656",
        "name": "tune",
        "font_class": "tune",
        "unicode": "e6aa",
        "unicode_decimal": 59050
      },
      {
        "icon_id": "24899657",
        "name": "shimingrenzheng",
        "font_class": "auth",
        "unicode": "e6ab",
        "unicode_decimal": 59051
      },
      {
        "icon_id": "24899565",
        "name": "person",
        "font_class": "person",
        "unicode": "e699",
        "unicode_decimal": 59033
      },
      {
        "icon_id": "24899566",
        "name": "email-filled",
        "font_class": "email-filled",
        "unicode": "e69a",
        "unicode_decimal": 59034
      },
      {
        "icon_id": "24899567",
        "name": "phone-filled",
        "font_class": "phone-filled",
        "unicode": "e69b",
        "unicode_decimal": 59035
      },
      {
        "icon_id": "24899568",
        "name": "phone",
        "font_class": "phone",
        "unicode": "e69c",
        "unicode_decimal": 59036
      },
      {
        "icon_id": "24899570",
        "name": "email",
        "font_class": "email",
        "unicode": "e69e",
        "unicode_decimal": 59038
      },
      {
        "icon_id": "24899571",
        "name": "personadd",
        "font_class": "personadd",
        "unicode": "e69f",
        "unicode_decimal": 59039
      },
      {
        "icon_id": "24899558",
        "name": "chatboxes-filled",
        "font_class": "chatboxes-filled",
        "unicode": "e692",
        "unicode_decimal": 59026
      },
      {
        "icon_id": "24899559",
        "name": "contact",
        "font_class": "contact",
        "unicode": "e693",
        "unicode_decimal": 59027
      },
      {
        "icon_id": "24899560",
        "name": "chatbubble-filled",
        "font_class": "chatbubble-filled",
        "unicode": "e694",
        "unicode_decimal": 59028
      },
      {
        "icon_id": "24899561",
        "name": "contact-filled",
        "font_class": "contact-filled",
        "unicode": "e695",
        "unicode_decimal": 59029
      },
      {
        "icon_id": "24899562",
        "name": "chatboxes",
        "font_class": "chatboxes",
        "unicode": "e696",
        "unicode_decimal": 59030
      },
      {
        "icon_id": "24899563",
        "name": "chatbubble",
        "font_class": "chatbubble",
        "unicode": "e697",
        "unicode_decimal": 59031
      },
      {
        "icon_id": "24881290",
        "name": "upload-filled",
        "font_class": "upload-filled",
        "unicode": "e68e",
        "unicode_decimal": 59022
      },
      {
        "icon_id": "24881292",
        "name": "upload",
        "font_class": "upload",
        "unicode": "e690",
        "unicode_decimal": 59024
      },
      {
        "icon_id": "24881293",
        "name": "weixin",
        "font_class": "weixin",
        "unicode": "e691",
        "unicode_decimal": 59025
      },
      {
        "icon_id": "24881274",
        "name": "compose",
        "font_class": "compose",
        "unicode": "e67f",
        "unicode_decimal": 59007
      },
      {
        "icon_id": "24881275",
        "name": "qq",
        "font_class": "qq",
        "unicode": "e680",
        "unicode_decimal": 59008
      },
      {
        "icon_id": "24881276",
        "name": "download-filled",
        "font_class": "download-filled",
        "unicode": "e681",
        "unicode_decimal": 59009
      },
      {
        "icon_id": "24881277",
        "name": "pengyouquan",
        "font_class": "pyq",
        "unicode": "e682",
        "unicode_decimal": 59010
      },
      {
        "icon_id": "24881279",
        "name": "sound",
        "font_class": "sound",
        "unicode": "e684",
        "unicode_decimal": 59012
      },
      {
        "icon_id": "24881280",
        "name": "trash-filled",
        "font_class": "trash-filled",
        "unicode": "e685",
        "unicode_decimal": 59013
      },
      {
        "icon_id": "24881281",
        "name": "sound-filled",
        "font_class": "sound-filled",
        "unicode": "e686",
        "unicode_decimal": 59014
      },
      {
        "icon_id": "24881282",
        "name": "trash",
        "font_class": "trash",
        "unicode": "e687",
        "unicode_decimal": 59015
      },
      {
        "icon_id": "24881284",
        "name": "videocam-filled",
        "font_class": "videocam-filled",
        "unicode": "e689",
        "unicode_decimal": 59017
      },
      {
        "icon_id": "24881285",
        "name": "spinner-cycle",
        "font_class": "spinner-cycle",
        "unicode": "e68a",
        "unicode_decimal": 59018
      },
      {
        "icon_id": "24881286",
        "name": "weibo",
        "font_class": "weibo",
        "unicode": "e68b",
        "unicode_decimal": 59019
      },
      {
        "icon_id": "24881288",
        "name": "videocam",
        "font_class": "videocam",
        "unicode": "e68c",
        "unicode_decimal": 59020
      },
      {
        "icon_id": "24881289",
        "name": "download",
        "font_class": "download",
        "unicode": "e68d",
        "unicode_decimal": 59021
      },
      {
        "icon_id": "24879601",
        "name": "help",
        "font_class": "help",
        "unicode": "e679",
        "unicode_decimal": 59001
      },
      {
        "icon_id": "24879602",
        "name": "navigate-filled",
        "font_class": "navigate-filled",
        "unicode": "e67a",
        "unicode_decimal": 59002
      },
      {
        "icon_id": "24879603",
        "name": "plusempty",
        "font_class": "plusempty",
        "unicode": "e67b",
        "unicode_decimal": 59003
      },
      {
        "icon_id": "24879604",
        "name": "smallcircle",
        "font_class": "smallcircle",
        "unicode": "e67c",
        "unicode_decimal": 59004
      },
      {
        "icon_id": "24879605",
        "name": "minus-filled",
        "font_class": "minus-filled",
        "unicode": "e67d",
        "unicode_decimal": 59005
      },
      {
        "icon_id": "24879606",
        "name": "micoff",
        "font_class": "micoff",
        "unicode": "e67e",
        "unicode_decimal": 59006
      },
      {
        "icon_id": "24879588",
        "name": "closeempty",
        "font_class": "closeempty",
        "unicode": "e66c",
        "unicode_decimal": 58988
      },
      {
        "icon_id": "24879589",
        "name": "clear",
        "font_class": "clear",
        "unicode": "e66d",
        "unicode_decimal": 58989
      },
      {
        "icon_id": "24879590",
        "name": "navigate",
        "font_class": "navigate",
        "unicode": "e66e",
        "unicode_decimal": 58990
      },
      {
        "icon_id": "24879591",
        "name": "minus",
        "font_class": "minus",
        "unicode": "e66f",
        "unicode_decimal": 58991
      },
      {
        "icon_id": "24879592",
        "name": "image",
        "font_class": "image",
        "unicode": "e670",
        "unicode_decimal": 58992
      },
      {
        "icon_id": "24879593",
        "name": "mic",
        "font_class": "mic",
        "unicode": "e671",
        "unicode_decimal": 58993
      },
      {
        "icon_id": "24879594",
        "name": "paperplane",
        "font_class": "paperplane",
        "unicode": "e672",
        "unicode_decimal": 58994
      },
      {
        "icon_id": "24879595",
        "name": "close",
        "font_class": "close",
        "unicode": "e673",
        "unicode_decimal": 58995
      },
      {
        "icon_id": "24879596",
        "name": "help-filled",
        "font_class": "help-filled",
        "unicode": "e674",
        "unicode_decimal": 58996
      },
      {
        "icon_id": "24879597",
        "name": "plus-filled",
        "font_class": "paperplane-filled",
        "unicode": "e675",
        "unicode_decimal": 58997
      },
      {
        "icon_id": "24879598",
        "name": "plus",
        "font_class": "plus",
        "unicode": "e676",
        "unicode_decimal": 58998
      },
      {
        "icon_id": "24879599",
        "name": "mic-filled",
        "font_class": "mic-filled",
        "unicode": "e677",
        "unicode_decimal": 58999
      },
      {
        "icon_id": "24879600",
        "name": "image-filled",
        "font_class": "image-filled",
        "unicode": "e678",
        "unicode_decimal": 59e3
      },
      {
        "icon_id": "24855900",
        "name": "locked-filled",
        "font_class": "locked-filled",
        "unicode": "e668",
        "unicode_decimal": 58984
      },
      {
        "icon_id": "24855901",
        "name": "info",
        "font_class": "info",
        "unicode": "e669",
        "unicode_decimal": 58985
      },
      {
        "icon_id": "24855903",
        "name": "locked",
        "font_class": "locked",
        "unicode": "e66b",
        "unicode_decimal": 58987
      },
      {
        "icon_id": "24855884",
        "name": "camera-filled",
        "font_class": "camera-filled",
        "unicode": "e658",
        "unicode_decimal": 58968
      },
      {
        "icon_id": "24855885",
        "name": "chat-filled",
        "font_class": "chat-filled",
        "unicode": "e659",
        "unicode_decimal": 58969
      },
      {
        "icon_id": "24855886",
        "name": "camera",
        "font_class": "camera",
        "unicode": "e65a",
        "unicode_decimal": 58970
      },
      {
        "icon_id": "24855887",
        "name": "circle",
        "font_class": "circle",
        "unicode": "e65b",
        "unicode_decimal": 58971
      },
      {
        "icon_id": "24855888",
        "name": "checkmarkempty",
        "font_class": "checkmarkempty",
        "unicode": "e65c",
        "unicode_decimal": 58972
      },
      {
        "icon_id": "24855889",
        "name": "chat",
        "font_class": "chat",
        "unicode": "e65d",
        "unicode_decimal": 58973
      },
      {
        "icon_id": "24855890",
        "name": "circle-filled",
        "font_class": "circle-filled",
        "unicode": "e65e",
        "unicode_decimal": 58974
      },
      {
        "icon_id": "24855891",
        "name": "flag",
        "font_class": "flag",
        "unicode": "e65f",
        "unicode_decimal": 58975
      },
      {
        "icon_id": "24855892",
        "name": "flag-filled",
        "font_class": "flag-filled",
        "unicode": "e660",
        "unicode_decimal": 58976
      },
      {
        "icon_id": "24855893",
        "name": "gear-filled",
        "font_class": "gear-filled",
        "unicode": "e661",
        "unicode_decimal": 58977
      },
      {
        "icon_id": "24855894",
        "name": "home",
        "font_class": "home",
        "unicode": "e662",
        "unicode_decimal": 58978
      },
      {
        "icon_id": "24855895",
        "name": "home-filled",
        "font_class": "home-filled",
        "unicode": "e663",
        "unicode_decimal": 58979
      },
      {
        "icon_id": "24855896",
        "name": "gear",
        "font_class": "gear",
        "unicode": "e664",
        "unicode_decimal": 58980
      },
      {
        "icon_id": "24855897",
        "name": "smallcircle-filled",
        "font_class": "smallcircle-filled",
        "unicode": "e665",
        "unicode_decimal": 58981
      },
      {
        "icon_id": "24855898",
        "name": "map-filled",
        "font_class": "map-filled",
        "unicode": "e666",
        "unicode_decimal": 58982
      },
      {
        "icon_id": "24855899",
        "name": "map",
        "font_class": "map",
        "unicode": "e667",
        "unicode_decimal": 58983
      },
      {
        "icon_id": "24855825",
        "name": "refresh-filled",
        "font_class": "refresh-filled",
        "unicode": "e656",
        "unicode_decimal": 58966
      },
      {
        "icon_id": "24855826",
        "name": "refresh",
        "font_class": "refresh",
        "unicode": "e657",
        "unicode_decimal": 58967
      },
      {
        "icon_id": "24855808",
        "name": "cloud-upload",
        "font_class": "cloud-upload",
        "unicode": "e645",
        "unicode_decimal": 58949
      },
      {
        "icon_id": "24855809",
        "name": "cloud-download-filled",
        "font_class": "cloud-download-filled",
        "unicode": "e646",
        "unicode_decimal": 58950
      },
      {
        "icon_id": "24855810",
        "name": "cloud-download",
        "font_class": "cloud-download",
        "unicode": "e647",
        "unicode_decimal": 58951
      },
      {
        "icon_id": "24855811",
        "name": "cloud-upload-filled",
        "font_class": "cloud-upload-filled",
        "unicode": "e648",
        "unicode_decimal": 58952
      },
      {
        "icon_id": "24855813",
        "name": "redo",
        "font_class": "redo",
        "unicode": "e64a",
        "unicode_decimal": 58954
      },
      {
        "icon_id": "24855814",
        "name": "images-filled",
        "font_class": "images-filled",
        "unicode": "e64b",
        "unicode_decimal": 58955
      },
      {
        "icon_id": "24855815",
        "name": "undo-filled",
        "font_class": "undo-filled",
        "unicode": "e64c",
        "unicode_decimal": 58956
      },
      {
        "icon_id": "24855816",
        "name": "more",
        "font_class": "more",
        "unicode": "e64d",
        "unicode_decimal": 58957
      },
      {
        "icon_id": "24855817",
        "name": "more-filled",
        "font_class": "more-filled",
        "unicode": "e64e",
        "unicode_decimal": 58958
      },
      {
        "icon_id": "24855818",
        "name": "undo",
        "font_class": "undo",
        "unicode": "e64f",
        "unicode_decimal": 58959
      },
      {
        "icon_id": "24855819",
        "name": "images",
        "font_class": "images",
        "unicode": "e650",
        "unicode_decimal": 58960
      },
      {
        "icon_id": "24855821",
        "name": "paperclip",
        "font_class": "paperclip",
        "unicode": "e652",
        "unicode_decimal": 58962
      },
      {
        "icon_id": "24855822",
        "name": "settings",
        "font_class": "settings",
        "unicode": "e653",
        "unicode_decimal": 58963
      },
      {
        "icon_id": "24855823",
        "name": "search",
        "font_class": "search",
        "unicode": "e654",
        "unicode_decimal": 58964
      },
      {
        "icon_id": "24855824",
        "name": "redo-filled",
        "font_class": "redo-filled",
        "unicode": "e655",
        "unicode_decimal": 58965
      },
      {
        "icon_id": "24841702",
        "name": "list",
        "font_class": "list",
        "unicode": "e644",
        "unicode_decimal": 58948
      },
      {
        "icon_id": "24841489",
        "name": "mail-open-filled",
        "font_class": "mail-open-filled",
        "unicode": "e63a",
        "unicode_decimal": 58938
      },
      {
        "icon_id": "24841491",
        "name": "hand-thumbsdown-filled",
        "font_class": "hand-down-filled",
        "unicode": "e63c",
        "unicode_decimal": 58940
      },
      {
        "icon_id": "24841492",
        "name": "hand-thumbsdown",
        "font_class": "hand-down",
        "unicode": "e63d",
        "unicode_decimal": 58941
      },
      {
        "icon_id": "24841493",
        "name": "hand-thumbsup-filled",
        "font_class": "hand-up-filled",
        "unicode": "e63e",
        "unicode_decimal": 58942
      },
      {
        "icon_id": "24841494",
        "name": "hand-thumbsup",
        "font_class": "hand-up",
        "unicode": "e63f",
        "unicode_decimal": 58943
      },
      {
        "icon_id": "24841496",
        "name": "heart-filled",
        "font_class": "heart-filled",
        "unicode": "e641",
        "unicode_decimal": 58945
      },
      {
        "icon_id": "24841498",
        "name": "mail-open",
        "font_class": "mail-open",
        "unicode": "e643",
        "unicode_decimal": 58947
      },
      {
        "icon_id": "24841488",
        "name": "heart",
        "font_class": "heart",
        "unicode": "e639",
        "unicode_decimal": 58937
      },
      {
        "icon_id": "24839963",
        "name": "loop",
        "font_class": "loop",
        "unicode": "e633",
        "unicode_decimal": 58931
      },
      {
        "icon_id": "24839866",
        "name": "pulldown",
        "font_class": "pulldown",
        "unicode": "e632",
        "unicode_decimal": 58930
      },
      {
        "icon_id": "24813798",
        "name": "scan",
        "font_class": "scan",
        "unicode": "e62a",
        "unicode_decimal": 58922
      },
      {
        "icon_id": "24813786",
        "name": "bars",
        "font_class": "bars",
        "unicode": "e627",
        "unicode_decimal": 58919
      },
      {
        "icon_id": "24813788",
        "name": "cart-filled",
        "font_class": "cart-filled",
        "unicode": "e629",
        "unicode_decimal": 58921
      },
      {
        "icon_id": "24813790",
        "name": "checkbox",
        "font_class": "checkbox",
        "unicode": "e62b",
        "unicode_decimal": 58923
      },
      {
        "icon_id": "24813791",
        "name": "checkbox-filled",
        "font_class": "checkbox-filled",
        "unicode": "e62c",
        "unicode_decimal": 58924
      },
      {
        "icon_id": "24813794",
        "name": "shop",
        "font_class": "shop",
        "unicode": "e62f",
        "unicode_decimal": 58927
      },
      {
        "icon_id": "24813795",
        "name": "headphones",
        "font_class": "headphones",
        "unicode": "e630",
        "unicode_decimal": 58928
      },
      {
        "icon_id": "24813796",
        "name": "cart",
        "font_class": "cart",
        "unicode": "e631",
        "unicode_decimal": 58929
      }
    ]
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const getVal = (val) => {
    const reg = /^[0-9]*$/g;
    return typeof val === "number" || reg.test(val) ? val + "px" : val;
  };
  const _sfc_main$s = {
    name: "UniIcons",
    emits: ["click"],
    props: {
      type: {
        type: String,
        default: ""
      },
      color: {
        type: String,
        default: "#333333"
      },
      size: {
        type: [Number, String],
        default: 16
      },
      customPrefix: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        icons: icons.glyphs
      };
    },
    computed: {
      unicode() {
        let code = this.icons.find((v) => v.font_class === this.type);
        if (code) {
          return unescape(`%u${code.unicode}`);
        }
        return "";
      },
      iconSize() {
        return getVal(this.size);
      }
    },
    methods: {
      _onClick() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$r(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "text",
      {
        style: vue.normalizeStyle({ color: $props.color, "font-size": $options.iconSize }),
        class: vue.normalizeClass(["uni-icons", ["uniui-" + $props.type, $props.customPrefix, $props.customPrefix ? $props.type : ""]]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
      },
      null,
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["render", _sfc_render$r], ["__scopeId", "data-v-d31e1c47"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
  const _sfc_main$r = {
    name: "TabBar",
    setup() {
      vue.onMounted(() => {
        uni.$emit("topBarBackgroundColor", { bg: "#016fce" });
      });
      let currentR = vue.ref("Home");
      let staticIconsColor = "#999797";
      let activityIconsColor = "#13dbf9";
      const useUniEmitCurrentRouterUpdate = (router) => {
        uni.$emit("currentRouterUpdate", { router });
        if (router !== "Publish") {
          currentR.value = router;
        } else {
          uni.$emit("tabBarCurrentRvalue", { router: currentR.value });
        }
      };
      const goHome = (router) => {
        useUniEmitCurrentRouterUpdate(router);
        uni.$emit("topBarBackgroundColor", { bg: "#016fce" });
      };
      const goDynamic = (router) => {
        useUniEmitCurrentRouterUpdate(router);
        uni.$emit("topBarBackgroundColor", { bg: "#ffffff" });
      };
      const goPublish = (router) => {
        uni.navigateTo({
          url: "/pages/publish/Publish",
          animationType: "slide-in-bottom",
          animationDuration: 150
        });
      };
      const goMessage = (router) => {
        useUniEmitCurrentRouterUpdate(router);
        uni.$emit("topBarBackgroundColor", { bg: "#ffffff" });
      };
      const goMine = (router) => {
        useUniEmitCurrentRouterUpdate(router);
        uni.$emit("topBarBackgroundColor", { bg: "#ffffff" });
      };
      return {
        currentR,
        staticIconsColor,
        activityIconsColor,
        goHome,
        goDynamic,
        goPublish,
        goMessage,
        goMine
      };
    }
  };
  function _sfc_render$q(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { id: "TabBar" }, [
      vue.createElementVNode("view", { class: "tabbar" }, [
        vue.createElementVNode("view", null, [
          vue.createVNode(_component_uni_icons, {
            type: "home",
            size: "30",
            color: $setup.currentR === "Home" ? $setup.activityIconsColor : $setup.staticIconsColor,
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.goHome("Home"))
          }, null, 8, ["color"]),
          vue.createElementVNode("text", null, "首页")
        ]),
        vue.createElementVNode("view", null, [
          vue.createVNode(_component_uni_icons, {
            type: "pyq",
            size: "30",
            color: $setup.currentR === "Dynamic" ? $setup.activityIconsColor : $setup.staticIconsColor,
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.goDynamic("Dynamic"))
          }, null, 8, ["color"]),
          vue.createElementVNode("text", null, "动态")
        ]),
        vue.createElementVNode("view", null, [
          vue.createVNode(_component_uni_icons, {
            type: "plus-filled",
            size: "45",
            color: "#13dbf9",
            onClick: _cache[2] || (_cache[2] = ($event) => $setup.goPublish("Publish"))
          })
        ]),
        vue.createElementVNode("view", null, [
          vue.createVNode(_component_uni_icons, {
            type: "chat",
            size: "30",
            color: $setup.currentR === "Message" ? $setup.activityIconsColor : $setup.staticIconsColor,
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.goMessage("Message"))
          }, null, 8, ["color"]),
          vue.createElementVNode("text", null, "消息")
        ]),
        vue.createElementVNode("view", null, [
          vue.createVNode(_component_uni_icons, {
            type: "person",
            size: "30",
            color: $setup.currentR === "Mine" ? $setup.activityIconsColor : $setup.staticIconsColor,
            onClick: _cache[4] || (_cache[4] = ($event) => $setup.goMine("Mine"))
          }, null, 8, ["color"]),
          vue.createElementVNode("text", null, "我的")
        ])
      ])
    ]);
  }
  const TabBar = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["render", _sfc_render$q], ["__scopeId", "data-v-270561e4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/common/TabBar.vue"]]);
  const _sfc_main$q = {
    name: "TopBar",
    setup() {
      let bgColor = vue.ref("#ffffff");
      uni.$on("topBarBackgroundColor", function(bg) {
        bgColor.value = bg.bg;
      });
      return {
        bgColor
      };
    }
  };
  function _sfc_render$p(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createElementVNode(
        "view",
        {
          class: "status_bar",
          style: vue.normalizeStyle("background:" + $setup.bgColor)
        },
        [
          vue.createCommentVNode(" 这里是状态栏 ")
        ],
        4
        /* STYLE */
      ),
      vue.createCommentVNode("    <view> 状态栏下的文字 </view>")
    ]);
  }
  const TopBar = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["render", _sfc_render$p], ["__scopeId", "data-v-35eb0c73"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/MainApp/TopBar.vue"]]);
  function loginUseUser(data) {
    return request({
      url: "user/login",
      method: "POST",
      data
    });
  }
  function getUserInfoById(id) {
    return request({
      url: "user/" + id
    });
  }
  function setUserAddConcern(data) {
    return request({
      url: "user/concern/add",
      method: "POST",
      data
    });
  }
  function setUserRemoveConcern(data) {
    return request({
      url: "user/concern/remove",
      method: "POST",
      data
    });
  }
  function getUser1AndUser2Concern(data) {
    return request({
      url: "user/concern",
      method: "GET",
      data
    });
  }
  function getUserDetailBy(id) {
    return request({
      url: "user/detail/" + id,
      method: "GET"
    });
  }
  const baseUrl = "http://192.168.85.1:3000/api/";
  function extractIP(url) {
    let pattern = /http:\/\/([\d\.]+):(\d+)/;
    let result = url.match(pattern);
    if (result && result.length >= 3) {
      return result[1] + ":" + result[2];
    } else {
      return null;
    }
  }
  const defaultHeadImgPath = "https://i2.hdslb.com/bfs/face/544c89e68f2b1f12ffcbb8b3c062a3328e8692d9.jpg@96w_96h.webp";
  const enterWord = " ";
  const sendMessageToScreen = (data) => {
    uni.showToast({
      icon: "error",
      title: data.message,
      duration: 2e3,
      mask: false
    });
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const diffInMs = new Date() - date;
    if (diffInMs < 864e5 && date.getDate() === new Date().getDate()) {
      if (diffInMs < 36e5 && date.getHours() === new Date().getHours()) {
        const diffInMinutes = Math.floor(diffInMs / 6e4);
        return `${diffInMinutes}分钟前`;
      } else {
        const diffInHours = Math.floor(diffInMs / 36e5);
        return `${diffInHours}小时前`;
      }
    } else {
      return `${month}-${day}`;
    }
  };
  const getUserNameByUid = async (uid) => {
    let res = await getUserInfoById(uid);
    if (res.code === 200) {
      return res.data[0].u_name;
    }
    return "err";
  };
  const replaceUrlIP = (url) => {
    let pattern = /http:\/\/([\d\.]+):(\d+)/;
    return url.replace(pattern, `http://${extractIP(baseUrl)}`);
  };
  const request = (req = "") => {
    formatAppLog("log", "at static/api/root/request.js:3", baseUrl);
    formatAppLog("log", "at static/api/root/request.js:4", req);
    return new Promise((resolve, reject) => {
      uni.request({
        method: req.method,
        url: baseUrl + req.url,
        data: req.data,
        header: {
          "authorization": uni.getStorageSync("token")
        },
        dataType: "json"
      }).then((response) => {
        resolve(response.data);
        setTimeout(function() {
          uni.hideLoading();
        }, 200);
      }).catch((error) => {
        reject(error);
      });
    });
  };
  function getCategoryList() {
    return request({
      url: "category/list"
    });
  }
  function pushNewArticle(data) {
    return request({
      url: "article",
      method: "POST",
      data
    });
  }
  /*!!!!!!!!!!这个接口的返回值千万不能变，一旦变了前端就炸了*/
  function getDetailedArticle(data) {
    return request({
      url: "article/filterArticleDel-filterUserDel-filterAcross-filterCategoryDel-detailed-pages-create",
      data
    });
  }
  function getConcernDetailedArticle(data) {
    return request({
      url: "article/filterArticleDel-filterUserDel-filterAcross-filterCategoryDel-detailed-concern-createTime",
      data
    });
  }
  function getArticleByID(id) {
    return request({
      url: "article/" + id
    });
  }
  function getArticleDetailByID(id) {
    return request({
      url: "article/detail/" + id
    });
  }
  function getArticleUserHandStateById(id) {
    return request({
      url: "article/user-hand-state/" + id
    });
  }
  function addWatchByArticleId(id) {
    return request({
      url: "act/watch",
      method: "POST",
      data: { "article_id": id }
    });
  }
  function getCommentSonById(id) {
    return request({
      url: "act/comment/son/" + id,
      method: "GET"
    });
  }
  function getCommentByArticleId(id) {
    return request({
      url: "act/comment/article/" + id,
      method: "GET"
    });
  }
  function addComment(comment_article_id, comment_father_id, comment_content) {
    return request({
      url: "act/comment",
      method: "POST",
      data: {
        "comment_article_id": comment_article_id,
        "comment_father_id": comment_father_id,
        "comment_content": comment_content
      }
    });
  }
  function getCommentPosterityById(id) {
    return request({
      url: "act/comment/posterity/" + id,
      method: "GET"
    });
  }
  function addHandArticleByArticleId(id) {
    return request({
      url: "act/hand/article/add",
      data: { article_id: id },
      method: "POST"
    });
  }
  function removeHandArticleByArticleId(id) {
    return request({
      url: "act/hand/article/remove",
      data: { article_id: id },
      method: "POST"
    });
  }
  const _sfc_main$p = {
    name: "Loading",
    data() {
      return {};
    },
    /**
     * 组件的属性列表
     */
    props: {
      loading: {
        type: Boolean,
        default: true
      },
      errmsg: {
        type: String,
        default: ""
      }
    },
    /**
     * 组件的方法列表
     */
    methods: {}
  };
  function _sfc_render$o(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "background": "#fff", "text-align": "center" } }, [
      $props.loading ? (vue.openBlock(), vue.createElementBlock("image", {
        key: 0,
        mode: "widthFix",
        src: "/static/images/utils/list_loading.gif",
        style: { "width": "90%", "height": "250rpx" }
      })) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const Loading = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["render", _sfc_render$o], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/loading/Loading.vue"]]);
  class ArticleFun {
    /**
     修改文章卡片的交互信息和用户关注状态
     @param {null} u_id 用户id
     @param {null} article_id 文章id
     @param {Object} Obj 包含要修改的交互信息和关注状态的对象，格式如下：
     {
    hand: number, // 是否点赞
    watch: number, // 是否收藏
    comment: number, // 评论内容
    concern_be: number // 是否关注该文章作者
    }
     @return {boolean} 修改是否成功，成功返回true，失败返回false */
    static setArticleCardUpdate(u_id = null, article_id = null, Obj) {
      formatAppLog("log", "at components/article/articleFun.js:15", Obj);
      try {
        if (article_id != null && Obj.hand != null) {
          let e = {
            article_id,
            hand: Obj.hand
          };
          uni.$emit("articleCard_interaction_hand_update", { data: e });
        }
        if (article_id != null && Obj.watch != null) {
          let e = {
            article_id,
            watch: Obj.watch
          };
          uni.$emit("articleCard_interaction_watch_update", { data: e });
        }
        if (article_id != null && Obj.comment != null) {
          let e = {
            article_id,
            comment: Obj.comment
          };
          uni.$emit("articleCard_interaction_comment_update", { data: e });
        }
        if (u_id != null && Obj.concern_be != null) {
          let e = {
            u_id,
            concern_be: Obj.concern_be
          };
          uni.$emit("articleCard_concern_update", { data: e });
        }
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  const _sfc_main$o = {
    name: "ArticleCard",
    components: { Loading },
    props: {
      articleData: Object,
      needFollowModel: Boolean
    },
    emits: ["update:item"],
    setup(props, { emit }) {
      let articleInfo = vue.ref({
        ...props.articleData
      });
      const articleLoading = vue.computed(() => {
        if (!articleInfo.value || Object.keys(articleInfo.value).length === 0) {
          return true;
        } else {
          return false;
        }
      });
      const store2 = useStore();
      let isSelf = store2.getters.getUser;
      isSelf = isSelf.u_id;
      uni.$on("home_articleList_change", function(e) {
        e.u_id;
        articleInfo.value.concern_be;
      });
      uni.$on("articleCard_concern_update", function(e) {
        formatAppLog("log", "at components/article/ArticleCard.vue:135", "123123");
        let data = e.data;
        if (articleInfo.value.article_user_id == data.u_id) {
          articleInfo.value.concern_be = data.concern_be;
        }
      });
      uni.$on("articleCard_interaction_hand_update", function(e) {
        let data = e.data;
        if (articleInfo.value.article_id == data.article_id) {
          articleInfo.value.article_hand_support_num = data.hand;
          if (article_user_handBe.value === 0) {
            article_user_handBe.value = 1;
          } else {
            article_user_handBe.value = 0;
          }
        }
      });
      uni.$on("articleCard_interaction_watch_update", function(e) {
        let data = e.data;
        if (articleInfo.value.article_id == data.article_id) {
          articleInfo.value.article_watch_num = data.watch;
        }
      });
      uni.$on("articleCard_interaction_comment_update", function(e) {
        let data = e.data;
        if (articleInfo.value.article_id == data.article_id) {
          articleInfo.value.article_comment_num = data.comment;
        }
      });
      let handStateLoading = vue.ref(true);
      let article_user_handBe = vue.ref(0);
      const initializeHand = async () => {
        let res = await getArticleUserHandStateById(articleInfo.value.article_id);
        if (res.code === 200) {
          formatAppLog("log", "at components/article/ArticleCard.vue:177", res.data);
          article_user_handBe.value = res.data.article_user_handBe;
        }
      };
      vue.onMounted(async () => {
        await initializeHand();
      });
      const needFollowModel = vue.ref(true);
      needFollowModel.value = props.needFollowModel;
      const tapArticleCard = (data) => {
        formatAppLog("log", "at components/article/ArticleCard.vue:195", "点击了文章卡");
        uni.navigateTo({
          url: "/pages/article/detail/ArticleDetailPage?id=" + data.article_id
        });
      };
      const tapAuthorCard = (data) => {
        formatAppLog("log", "at components/article/ArticleCard.vue:202", "点击了作者栏");
      };
      let canTapFollow = true;
      const tapFollowCard = (data) => {
        if (!canTapFollow) {
          plus.nativeUI.toast(`点的太快啦~`);
          return;
        }
        canTapFollow = false;
        setTimeout(() => {
          canTapFollow = true;
        }, 1e3);
        if (data.concern_be === 0) {
          setUserAddConcern({ "u_id": data.article_user_id }).then((res) => {
            formatAppLog("log", "at components/article/ArticleCard.vue:217", res);
            if (res.code === 200) {
              articleInfo.value.concern_be = 1;
              ArticleFun.setArticleCardUpdate(data.article_user_id, null, { concern_be: 1 });
              plus.nativeUI.toast(`关注成功`);
            }
          });
        } else {
          setUserRemoveConcern({ "u_id": data.article_user_id }).then((res) => {
            if (res.code === 200) {
              articleInfo.value.concern_be = 0;
              ArticleFun.setArticleCardUpdate(data.article_user_id, null, { concern_be: 0 });
              plus.nativeUI.toast(`取关成功`);
            }
          });
        }
        formatAppLog("log", "at components/article/ArticleCard.vue:237", "点击了关注");
      };
      const tapHandCard = (data) => {
        if (!canTapFollow) {
          plus.nativeUI.toast(`点的太快啦~`);
          return;
        }
        canTapFollow = false;
        setTimeout(() => {
          canTapFollow = true;
        }, 1e3);
        if (article_user_handBe.value === 0) {
          addHandArticleByArticleId(data.article_id).then((res) => {
            formatAppLog("log", "at components/article/ArticleCard.vue:251", res);
            if (res.code === 200) {
              ArticleFun.setArticleCardUpdate(null, data.article_id, { hand: ++articleInfo.value.article_hand_support_num });
              plus.nativeUI.toast(`点赞成功`);
            }
          });
        } else {
          removeHandArticleByArticleId(data.article_id).then((res) => {
            formatAppLog("log", "at components/article/ArticleCard.vue:262", res);
            if (res.code === 200) {
              ArticleFun.setArticleCardUpdate(null, data.article_id, { hand: --articleInfo.value.article_hand_support_num });
              plus.nativeUI.toast(`取消点赞成功`);
            }
          });
        }
        formatAppLog("log", "at components/article/ArticleCard.vue:272", "点击了点赞");
      };
      return {
        articleInfo,
        defaultHeadImgPath,
        needFollowModel,
        tapArticleCard,
        tapAuthorCard,
        tapFollowCard,
        tapHandCard,
        isSelf,
        formatDate,
        articleLoading,
        replaceUrlIP,
        article_user_handBe,
        handStateLoading
      };
    }
  };
  function _sfc_render$n(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "ArticleCard__container w100 h100" }, [
      vue.createCommentVNode("        单个       文章卡片"),
      vue.createElementVNode("view", { class: "active__cart w100 h100" }, [
        $setup.articleLoading && $setup.handStateLoading ? (vue.openBlock(), vue.createBlock(_component_Loading, { key: 0 })) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "active__cart__container",
          onClick: _cache[3] || (_cache[3] = ($event) => $setup.tapArticleCard($setup.articleInfo))
        }, [
          vue.createCommentVNode("-------------------------作者栏"),
          vue.createElementVNode("view", {
            class: "active__cart__container__title",
            onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.tapAuthorCard(), ["stop"]))
          }, [
            vue.createElementVNode("view", { class: "active__cart__container__title__container" }, [
              vue.createElementVNode("view", { class: "active__cart__container__title__container__img" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "active__cart__container__title__container__img--path",
                    style: vue.normalizeStyle($setup.articleInfo.u_head ? "background-image: url(" + $setup.articleInfo.u_head + ")" : "background-image: url(" + $setup.defaultHeadImgPath + ")")
                  },
                  null,
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "active__cart__container__title__container__text" }, [
                vue.createElementVNode("view", null, [
                  vue.createElementVNode("view", { class: "active__cart__container__title__container__text__basic" }, [
                    vue.createElementVNode(
                      "view",
                      { style: { "font-size": "0.95rem", "max-width": "80%", "overflow": "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", "display": "inline-block" } },
                      vue.toDisplayString($setup.articleInfo.u_name),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      { class: "active__cart__container__title__container__text__basic--level" },
                      vue.toDisplayString($setup.articleInfo.u_sgrade),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { style: { "display": "flex", "align-items": "center", "flex-direction": "row", "font-size": "0.8125rem", "color": "#bcbcbc" } }, [
                    vue.createElementVNode(
                      "view",
                      { class: "active__cart__container__title__container__text--time" },
                      vue.toDisplayString($setup.formatDate($setup.articleInfo.article_create_time)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      { class: "active__cart__container__title__container__text--className" },
                      vue.toDisplayString($setup.articleInfo.class_name),
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                $setup.needFollowModel ? vue.withDirectives((vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "active__cart__container__title__container__text__follow",
                    onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $setup.tapFollowCard($setup.articleInfo), ["stop"]))
                  },
                  [
                    vue.createElementVNode("view", { style: { "width": "100%", "height": "100%" } }, [
                      vue.withDirectives(vue.createElementVNode(
                        "view",
                        { class: "active__cart__container__title__container__text__follow--be" },
                        "已关注",
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vShow, $setup.articleInfo.concern_be === 1]
                      ]),
                      vue.withDirectives(vue.createElementVNode(
                        "view",
                        { class: "active__cart__container__title__container__text__follow--no" },
                        "+关注",
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vShow, $setup.articleInfo.concern_be === 0 || !$setup.articleInfo.concern_be]
                      ])
                    ])
                  ],
                  512
                  /* NEED_PATCH */
                )), [
                  [vue.vShow, $setup.isSelf != $setup.articleInfo.article_user_id]
                ]) : vue.createCommentVNode("v-if", true)
              ])
            ])
          ]),
          vue.createCommentVNode("                    主体文本"),
          vue.createElementVNode("view", { class: "active__cart__container__text w100 h100" }, [
            vue.createElementVNode("view", { class: "active__cart__container__text__container w100 h100" }, [
              vue.createElementVNode(
                "view",
                { class: "active__cart__container__text__container__title" },
                vue.toDisplayString($setup.articleInfo.article_title),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "active__cart__container__text__container__text" }, [
                vue.createElementVNode(
                  "view",
                  null,
                  vue.toDisplayString($setup.articleInfo.article_text),
                  1
                  /* TEXT */
                )
              ]),
              vue.createCommentVNode("                          封面"),
              vue.createElementVNode("view", { class: "active__cart__container__text__container__cover" }, [
                $setup.articleInfo.article_preview1_path ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "active__cart__container__text__container__cover__img",
                    style: vue.normalizeStyle("background-image: url(" + $setup.replaceUrlIP($setup.articleInfo.article_preview1_path) + ");margin-right: 1%;width:" + (!$setup.articleInfo.article_preview2_path ? "98%" : "49%"))
                  },
                  null,
                  4
                  /* STYLE */
                )) : vue.createCommentVNode("v-if", true),
                $setup.articleInfo.article_preview2_path ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 1,
                    class: "active__cart__container__text__container__cover__img",
                    style: vue.normalizeStyle("background-image: url(" + $setup.replaceUrlIP($setup.articleInfo.article_preview2_path) + ")")
                  },
                  null,
                  4
                  /* STYLE */
                )) : vue.createCommentVNode("v-if", true)
              ]),
              vue.createCommentVNode("                          点赞 评论 观看数量"),
              vue.createElementVNode("view", { class: "active__cart__container__text__container__interactInfo" }, [
                vue.createElementVNode("view", { class: "active__cart__container__text__container__interactInfo__container" }, [
                  vue.createElementVNode("view", { class: "active__cart__container__text__container__interactInfo__container--watch" }, [
                    vue.createVNode(_component_uni_icons, {
                      color: "#999999",
                      type: "eye",
                      size: "18"
                    }),
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.articleInfo.article_watch_num),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "active__cart__container__text__container__interactInfo__container--comment" }, [
                    vue.createVNode(_component_uni_icons, {
                      color: "#999999",
                      type: "chatbubble",
                      size: "18"
                    }),
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.articleInfo.article_comment_num),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", {
                    class: "active__cart__container__text__container__interactInfo__container--hand",
                    onClick: _cache[2] || (_cache[2] = vue.withModifiers(($event) => $setup.tapHandCard($setup.articleInfo), ["stop"]))
                  }, [
                    vue.createVNode(_component_uni_icons, {
                      color: $setup.article_user_handBe === 0 ? "#999999" : "#0091ff",
                      type: "hand-up",
                      size: "18"
                    }, null, 8, ["color"]),
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.articleInfo.article_hand_support_num),
                      1
                      /* TEXT */
                    )
                  ])
                ])
              ])
            ])
          ])
        ]))
      ])
    ]);
  }
  const ArticleCard = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["render", _sfc_render$n], ["__scopeId", "data-v-9eefd57b"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/ArticleCard.vue"]]);
  const getListSetConfig = (e) => {
    formatAppLog("log", "at components/home/articlesList/functions.js:72", e);
    const listSetConfig = {
      needSwiperSum: 3,
      aroundMove: true,
      //1 是首页
      static: 1
    };
    if (e === "pyq") {
      listSetConfig.needSwiperSum = 1;
      listSetConfig.aroundMove = false;
      listSetConfig.static = 2;
      return listSetConfig;
    } else {
      return listSetConfig;
    }
  };
  const _sfc_main$n = {
    components: {
      Loading,
      ArticleCard
    },
    props: {
      needFollowModel: Boolean,
      model_str_num: String
    },
    setup(props) {
      const needFollowModel = vue.ref(true);
      needFollowModel.value = props.needFollowModel;
      let classifyList = vue.ref();
      classifyList.value = [];
      let lateArticleList = vue.ref([]);
      let recommendArticleList = vue.ref([]);
      let hotArticleList = vue.ref([]);
      const getDetailedArticleByJsonData = async (data) => {
        let temp = await getDetailedArticle(data);
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:71", temp.data);
        let res = temp.data;
        if (temp.data.length < 1 || !temp || temp == "") {
          plus.nativeUI.toast(`没有更多数据`);
        }
        return res;
      };
      let clickNavIndex = vue.ref();
      uni.$on("home_article_follow_nav_change", function(e) {
        clickNavIndex.value = e.page;
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:84", clickNavIndex.value);
      });
      let currentIndex = vue.ref();
      const swiperItemChange = (e) => {
        currentIndex.value = e.detail.current;
        uni.$emit("home_article_nav_change", { currentNavIndex: currentIndex.value });
      };
      const initializeHomeData = async () => {
        for (let i = 0; i < 3; i++) {
          classifyList.value[i] = { categoryID: i, classifyTitle: "", classifyContent: "类别描述", currentPage: 1, articleList: [{}] };
        }
        lateArticleList.value = await getDetailedArticleByJsonData({
          "sort": 1,
          "page_number": 1,
          "articleContentMaxWord": 100,
          "select_title_num": 3
        });
        recommendArticleList.value = await getDetailedArticleByJsonData({
          "sort": 0,
          "page_number": 1,
          "articleContentMaxWord": 100,
          "select_title_num": 1
        });
        hotArticleList.value = await getDetailedArticleByJsonData({
          "sort": 1,
          "page_number": 1,
          "articleContentMaxWord": 100,
          "select_title_num": 2
        });
        classifyList.value[0].articleList = lateArticleList.value;
        classifyList.value[1].articleList = recommendArticleList.value;
        classifyList.value[2].articleList = hotArticleList.value;
      };
      const store2 = useStore();
      let login_u_id = store2.getters.getUser;
      login_u_id = login_u_id.u_id;
      formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:131", "ArticleList用户id" + login_u_id);
      let concernArticleList = vue.ref([]);
      const getConcernDetailedArticleByJsonData = async (data) => {
        let temp = await getConcernDetailedArticle(data);
        if (temp.data.length < 1 || !temp || temp == "") {
          concernArticleNULL.value = true;
        } else {
          concernArticleNULL.value = false;
        }
        let res = temp.data;
        return res;
      };
      const initializePyqData = async () => {
        classifyList.value[0] = { categoryID: 0, classifyTitle: "", classifyContent: "类别描述", currentPage: 1, articleList: [{}] };
        concernArticleList.value = await getConcernDetailedArticleByJsonData({
          "u_id": login_u_id,
          "articleContentMaxWord": 100
        });
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:155", concernArticleList.value);
        classifyList.value[0].articleList = concernArticleList.value;
      };
      let concernArticleNULL = vue.ref(false);
      let refreshOK = vue.ref(false);
      let canRefresh = true;
      const refreshListWithThrottle = async (index) => {
        refreshOK.value = true;
        setTimeout(() => {
          refreshOK.value = false;
          uni.$emit("home_articleList_change", { data: classifyList.value });
        }, 1100);
        if (!canRefresh) {
          formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:175", "当前不能刷新");
          return;
        }
        canRefresh = false;
        setTimeout(() => {
          canRefresh = true;
        }, 1e3);
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:184", "下拉刷新被触发");
        indexReFreshPage = [1, 1, 1];
        if (set.static === 2) {
          concernArticleList.value = await getConcernDetailedArticleByJsonData({
            "u_id": login_u_id,
            "articleContentMaxWord": 100
          });
          classifyList.value[index].articleList = concernArticleList.value;
        } else {
          formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:194", index);
          if (index === 0) {
            formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:196", "123123123213213122");
            lateArticleList.value = await getDetailedArticleByJsonData({
              "sort": 1,
              "page_number": 1,
              "articleContentMaxWord": 100,
              "select_title_num": 3
            });
            classifyList.value[index].articleList = lateArticleList.value;
          } else if (index === 1) {
            recommendArticleList.value = await getDetailedArticleByJsonData({
              "sort": 0,
              "page_number": 1,
              "articleContentMaxWord": 100,
              "select_title_num": 1
            });
            classifyList.value[index].articleList = recommendArticleList.value;
          } else if (index === 2) {
            hotArticleList.value = await getDetailedArticleByJsonData({
              "sort": 1,
              "page_number": 1,
              "articleContentMaxWord": 100,
              "select_title_num": 2
            });
            classifyList.value[index].articleList = hotArticleList.value;
          }
        }
      };
      let upRefreshOK = vue.ref(false);
      let indexReFreshPage = [1, 1, 1];
      let canUpRefresh = true;
      const upRefreshListWithThrottle = async (index) => {
        if (set.static === 2) {
          return;
        }
        upRefreshOK.value = true;
        setTimeout(() => {
          upRefreshOK.value = false;
          uni.$emit("home_articleList_change", { data: classifyList.value });
        }, 1100);
        if (!canUpRefresh) {
          formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:243", "当前不能上拉刷新");
          plus.nativeUI.toast(`载入中...`);
          return;
        }
        canUpRefresh = false;
        setTimeout(() => {
          canUpRefresh = true;
        }, 1e3);
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:253", "上拉刷新被触发");
        sendLoadingLogo();
        if (index === 0) {
          let lateArticleList2 = await getDetailedArticleByJsonData({
            "sort": 1,
            "page_number": indexReFreshPage[index] + 1,
            "articleContentMaxWord": 100,
            "select_title_num": 3
          });
          if (pushInClassifyListIndexByArticleList(index, lateArticleList2)) {
            indexReFreshPage[index]++;
          }
        } else if (index === 1) {
          let lateArticleList2 = await getDetailedArticleByJsonData({
            "sort": 1,
            "page_number": indexReFreshPage[index] + 1,
            "articleContentMaxWord": 100,
            "select_title_num": 1
          });
          if (pushInClassifyListIndexByArticleList(index, lateArticleList2)) {
            indexReFreshPage[index]++;
          }
        } else if (index === 2) {
          let lateArticleList2 = await getDetailedArticleByJsonData({
            "sort": 1,
            "page_number": indexReFreshPage[index] + 1,
            "articleContentMaxWord": 100,
            "select_title_num": 2
          });
          if (pushInClassifyListIndexByArticleList(index, lateArticleList2)) {
            indexReFreshPage[index]++;
          }
        }
      };
      const pushInClassifyListIndexByArticleList = (index, articleList) => {
        try {
          for (let i = 0; i < articleList.length; i++) {
            classifyList.value[index].articleList.push(articleList[i]);
          }
          return true;
        } catch (e) {
          return false;
        }
      };
      const sendLoadingLogo = () => {
        uni.showToast({
          icon: "loading",
          title: "加载中",
          duration: 350,
          mask: false
          // position:'bottom'
        });
      };
      const aroundMove = vue.ref(true);
      let model_str_num = "home";
      model_str_num = props.model_str_num;
      let set = getListSetConfig(model_str_num);
      vue.onMounted(async () => {
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:324", set);
        if (set.static === 2) {
          if (!login_u_id) {
            plus.nativeUI.toast(`用户没有登录`);
          } else {
            aroundMove.value = set.aroundMove;
            await initializePyqData();
          }
        } else {
          await initializeHomeData();
        }
      });
      let scrollViewLoading = vue.ref(true);
      vue.watch(classifyList, (newValue) => {
        let allArticleListHaveValue = newValue.every((item) => item.articleList.length > 1);
        if (allArticleListHaveValue) {
          scrollViewLoading.value = false;
        }
      }, { deep: true });
      return {
        scrollViewLoading,
        classifyList,
        swiperItemChange,
        clickNavIndex,
        needFollowModel,
        aroundMove,
        refreshListWithThrottle,
        refreshOK,
        concernArticleNULL,
        upRefreshListWithThrottle
      };
    }
  };
  function _sfc_render$m(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_ArticleCard = vue.resolveComponent("ArticleCard");
    return vue.openBlock(), vue.createElementBlock("view", { class: "w100 h100" }, [
      vue.createElementVNode("view", { class: "actives__container w100 h100" }, [
        vue.createElementVNode("swiper", {
          style: { "width": "100%", "height": "100%" },
          autoplay: false,
          onChange: _cache[0] || (_cache[0] = ($event) => $setup.swiperItemChange($event)),
          current: $setup.clickNavIndex
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.classifyList, (item1, index1) => {
              return vue.openBlock(), vue.createElementBlock("swiper-item", { key: index1 }, [
                vue.createCommentVNode('            <Loading v-if="scrollViewLoading"></Loading>'),
                vue.createElementVNode("scroll-view", {
                  class: "scrollview",
                  "scroll-y": "true",
                  style: `width: 100%;height: 100%;background: #f5f5f5;`,
                  "refresher-enabled": "true",
                  "refresher-background": "#f5f5f5",
                  onRefresherrefresh: ($event) => $setup.refreshListWithThrottle(item1.categoryID),
                  "refresher-triggered": $setup.refreshOK,
                  onScrolltolower: ($event) => $setup.upRefreshListWithThrottle(item1.categoryID)
                }, [
                  vue.createElementVNode("view", {
                    class: "articleList__container__body w100",
                    style: "padding-top: 2px;padding-bottom: 5px;"
                  }, [
                    $setup.concernArticleNULL ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "articleList__container__body__concern--blank disF-center",
                      style: { "flex-direction": "column", "margin-top": "40%" }
                    }, [
                      vue.createElementVNode("image", { src: "/static/images/utils/blank_page.png" }),
                      vue.createElementVNode("view", { style: { "color": "#a0a0a0" } }, "你还有没有关注任何人~~ 请刷新~")
                    ])) : vue.createCommentVNode("v-if", true),
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(item1.articleList, (item2, index2) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          key: item2.article_id,
                          style: { "margin-bottom": "5px" }
                        }, [
                          vue.createCommentVNode("                  文章卡片"),
                          vue.createVNode(_component_ArticleCard, {
                            "article-data": item2,
                            "need-follow-model": $setup.needFollowModel
                          }, null, 8, ["article-data", "need-follow-model"])
                        ]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ], 40, ["onRefresherrefresh", "refresher-triggered", "onScrolltolower"])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ], 40, ["current"])
      ])
    ]);
  }
  const ArticlesList = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["render", _sfc_render$m], ["__scopeId", "data-v-fc82db5d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/articlesList/ArticlesList.vue"]]);
  const _sfc_main$m = {
    components: {
      TopBar,
      ArticlesList
    },
    setup() {
      let articleNavIndex = vue.ref(0);
      let articleNavColor = "#131313";
      let unArticleNavColor = "#a2a3ab";
      uni.$on("home_article_nav_change", function(e) {
        articleNavIndex.value = e.currentNavIndex;
      });
      const changeCurrentNavPage = (page) => {
        uni.$emit("home_article_follow_nav_change", { page });
      };
      const store2 = useStore();
      const tapSearch = () => {
        let login_user = store2.getters.getUser;
        if (login_user) {
          uni.navigateTo({
            url: "/pages/search/search",
            animationType: "fade-in",
            animationDuration: 100
          });
          formatAppLog("log", "at pages/home/Home.vue:72", "用户已经登录 跳转搜索页");
        } else {
          formatAppLog("log", "at pages/home/Home.vue:74", "用户没有登录 无法搜索");
          plus.nativeUI.toast(`请先登录`);
        }
      };
      vue.onMounted(() => {
      });
      return {
        articleNavIndex,
        articleNavColor,
        unArticleNavColor,
        changeCurrentNavPage,
        tapSearch
      };
    },
    data() {
      return {
        title: "Hello"
      };
    },
    onLoad() {
    },
    methods: {}
  };
  function _sfc_render$l(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_ArticlesList = vue.resolveComponent("ArticlesList");
    return vue.openBlock(), vue.createElementBlock("view", {
      id: "Home",
      style: { "width": "100%" }
    }, [
      vue.createElementVNode("view", { class: "home" }, [
        vue.createElementVNode("view", { class: "home__container" }, [
          vue.createCommentVNode("        头部"),
          vue.createElementVNode("view", { class: "container__header pageTitle-top-fix-zindex999 w100" }, [
            vue.createElementVNode("view", {
              class: "status-bar-height",
              style: { "background": "#016fce" }
            }),
            vue.createCommentVNode("          搜索"),
            vue.createElementVNode("view", { class: "header__search" }, [
              vue.createElementVNode("view", { class: "header__search__container" }, [
                vue.createElementVNode("view", {
                  class: "header__search__container__input",
                  onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $setup.tapSearch(), ["stop"]))
                }, [
                  vue.createVNode(_component_uni_icons, {
                    type: "search",
                    style: { "margin-left": "10rpx" },
                    size: "25rpx"
                  }),
                  vue.createElementVNode("text", { space: "ensp" }, " 搜点什么...")
                ]),
                vue.createVNode(_component_uni_icons, {
                  type: "scan",
                  size: "55rpx",
                  color: "#002c52"
                })
              ])
            ]),
            vue.createCommentVNode("          导航"),
            vue.createElementVNode("view", { class: "header__nav" }, [
              vue.createElementVNode("view", { class: "header__nav__container" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--late",
                    onClick: _cache[1] || (_cache[1] = ($event) => $setup.changeCurrentNavPage(0)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 0 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  "最新",
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--recommend",
                    onClick: _cache[2] || (_cache[2] = ($event) => $setup.changeCurrentNavPage(1)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 1 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  "推荐",
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--hot",
                    onClick: _cache[3] || (_cache[3] = ($event) => $setup.changeCurrentNavPage(2)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 2 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  "热门",
                  4
                  /* STYLE */
                )
              ])
            ])
          ]),
          vue.createCommentVNode("        身体"),
          vue.createElementVNode("view", { class: "container__body" }, [
            vue.createElementVNode("view", { class: "w100 h100" }, [
              vue.createVNode(_component_ArticlesList, { "need-follow-model": true })
            ])
          ])
        ])
      ])
    ]);
  }
  const Home = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["render", _sfc_render$l], ["__scopeId", "data-v-a0df4f3d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/home/Home.vue"]]);
  const _sfc_main$l = {
    components: {
      ArticlesList,
      Loading
    },
    setup() {
      vue.onMounted(() => {
      });
      const loading = vue.computed(() => {
        const store2 = useStore();
        let login_u_id = store2.getters.getUser;
        login_u_id = login_u_id.u_id;
        if (!login_u_id) {
          return true;
        } else {
          return false;
        }
      });
      return {
        loading
      };
    }
  };
  function _sfc_render$k(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
    const _component_ArticlesList = vue.resolveComponent("ArticlesList");
    return vue.openBlock(), vue.createElementBlock("view", { class: "w100 h100" }, [
      vue.createElementVNode("view", { class: "w100 h100" }, [
        vue.createElementVNode("view", { class: "pyq__container w100 h100" }, [
          vue.createCommentVNode("        头部"),
          vue.createElementVNode("view", { class: "pyq__container__header bg-efefef pageTitle-height pageTitle-top-fix-zindex999 w100" }, [
            vue.createElementVNode("view", { class: "status-bar-height bg-efefef w100 disF-center" }),
            vue.createCommentVNode("          标题"),
            vue.createElementVNode("view", {
              class: "pyq__container__header__title my-h3 disF-center w100",
              style: { "padding": "5px 0" }
            }, " 关注 ")
          ]),
          vue.createCommentVNode("        身体"),
          vue.createElementVNode("view", { class: "pyq__container__body" }, [
            $setup.loading ? (vue.openBlock(), vue.createBlock(_component_Loading, { key: 0 })) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "w100 h100"
            }, [
              vue.createVNode(_component_ArticlesList, {
                "need-follow-model": false,
                model_str_num: "pyq"
              })
            ]))
          ])
        ])
      ])
    ]);
  }
  const Dynamic = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$k], ["__scopeId", "data-v-508725f9"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/pyq/Dynamic.vue"]]);
  const _sfc_main$k = {
    name: "messageCard"
  };
  function _sfc_render$j(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "width": "100%", "height": "120rpx", "background": "#F5F5F5", "padding": "10rpx", "display": "flex", "align-items": "center" } }, [
      vue.createElementVNode("view", { class: "messageCard__body" }, [
        vue.createElementVNode("view", { class: "messageCard__body__left" }, [
          vue.createElementVNode("view", { class: "messageCard__body__head" }, [
            vue.createElementVNode("view", { class: "messageCard__body__head--img" })
          ]),
          vue.createElementVNode("view", { class: "messageCard__body__info" }, [
            vue.createElementVNode("view", { class: "messageCard__body__info__name" }, [
              vue.createElementVNode("text", null, "新朋友")
            ]),
            vue.createElementVNode("view", { class: "messageCard__body__info__message" }, [
              vue.createElementVNode("text", null, "张三关注了你")
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "messageCard__body__right" }, [
          vue.createElementVNode("view", { class: "messageCard__body__right--time" }, [
            vue.createElementVNode("text", null, "5-9")
          ]),
          vue.createElementVNode("view", { class: "messageCard__body__right--num" }, [
            vue.createElementVNode("text", null, "99")
          ])
        ])
      ])
    ]);
  }
  const MessageCard = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["render", _sfc_render$j], ["__scopeId", "data-v-4762ac38"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/message/MessageCard.vue"]]);
  const _sfc_main$j = {
    components: {
      MessageCard
    },
    setup() {
      vue.onMounted(() => {
      });
      return {};
    }
  };
  function _sfc_render$i(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_MessageCard = vue.resolveComponent("MessageCard");
    return vue.openBlock(), vue.createElementBlock("view", { class: "w100 h100" }, [
      vue.createElementVNode("view", { class: "w100 h100" }, [
        vue.createElementVNode("view", { class: "message__container w100 h100" }, [
          vue.createCommentVNode("        头部"),
          vue.createElementVNode("view", { class: "message__container__header bg-efefef pageTitle-height pageTitle-top-fix-zindex999 w100" }, [
            vue.createElementVNode("view", { class: "status-bar-height bg-efefef w100 disF-center" }),
            vue.createCommentVNode("          标题"),
            vue.createElementVNode("view", {
              class: "message__container__header__title my-h3 disF-center w100",
              style: { "padding": "5px 0" }
            }, " 消息 ")
          ]),
          vue.createCommentVNode("        身体"),
          vue.createElementVNode("view", { class: "message__container__body" }, [
            vue.createElementVNode("view", { class: "w100 h100" }, [
              vue.createElementVNode("scroll-view", {
                class: "scrollview",
                "scroll-y": "true",
                style: `width: 100%;height: 100%;background: #ffffff;`,
                "refresher-enabled": "true",
                "refresher-background": "#ffffff"
              }, [
                vue.createVNode(_component_MessageCard)
              ])
            ])
          ])
        ])
      ])
    ]);
  }
  const Message = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$i], ["__scopeId", "data-v-6b9d1851"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/message/Message.vue"]]);
  const _sfc_main$i = {
    components: {},
    data() {
      return {
        title: "Hello"
      };
    },
    onLoad() {
    },
    methods: {}
  };
  function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { id: "Mine" }, " 这是我的页 ");
  }
  const Mine = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$h], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/mine/Mine.vue"]]);
  const _sfc_main$h = {
    components: {
      TabBar,
      Home,
      Dynamic,
      Message,
      Mine,
      TopBar
    },
    setup() {
      onShow(() => {
        if (currentR.value === "Home") {
          uni.$emit("topBarBackgroundColor", { bg: "#016fce" });
        }
      });
      vue.onMounted(() => {
        const store2 = useStore();
        loginUseUser({
          email: "1@qq.com",
          password: "1"
        }).then((res) => {
          formatAppLog("log", "at pages/MainApp.vue:48", res);
          if (res.code == 200) {
            try {
              uni.setStorageSync("token", res.token);
              const currentUser = res.data;
              store2.dispatch("addUser", currentUser);
              formatAppLog("log", "at pages/MainApp.vue:56", store2.getters.getUser);
              plus.nativeUI.toast(`登录成功，当前用户：${store2.getters.getUser.u_id}`);
            } catch (e) {
              formatAppLog("log", "at pages/MainApp.vue:59", e);
            }
          }
        });
      });
      let backButtonPress = vue.ref(0);
      let currentR = vue.ref("Home");
      let tabBarVisibility = vue.ref(true);
      uni.$on("currentRouterUpdate", function(data) {
        currentR.value = data.router;
      });
      uni.$on("tabBarVisibilityUpdate", function(b) {
        tabBarVisibility.value = b.tabBarVisibility;
      });
      onBackPress((e) => {
        backButtonPress.value++;
        if (backButtonPress.value > 1) {
          plus.runtime.quit();
        } else {
          plus.nativeUI.toast("再按一次退出应用");
        }
        setTimeout(() => {
          backButtonPress.value = 0;
        }, 1e3);
        return true;
      });
      return {
        currentR,
        tabBarVisibility
      };
    },
    data() {
      return {
        title: "Hello"
      };
    },
    created() {
    },
    methods: {}
  };
  function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Home = vue.resolveComponent("Home");
    const _component_Dynamic = vue.resolveComponent("Dynamic");
    const _component_Message = vue.resolveComponent("Message");
    const _component_Mine = vue.resolveComponent("Mine");
    const _component_TabBar = vue.resolveComponent("TabBar");
    return vue.openBlock(), vue.createElementBlock("view", {
      id: "Main",
      style: { "width": "100%", "height": "100vh", "overflow": "hidden" }
    }, [
      vue.createElementVNode("view", {
        class: "main__container",
        style: { "width": "100%", "height": "100%", "overflow": "hidden" }
      }, [
        vue.withDirectives(vue.createVNode(
          _component_Home,
          null,
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vShow, $setup.currentR === "Home"]
        ]),
        vue.withDirectives(vue.createVNode(
          _component_Dynamic,
          null,
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vShow, $setup.currentR === "Dynamic"]
        ]),
        vue.withDirectives(vue.createVNode(
          _component_Message,
          null,
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vShow, $setup.currentR === "Message"]
        ]),
        vue.withDirectives(vue.createVNode(
          _component_Mine,
          null,
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vShow, $setup.currentR === "Mine"]
        ])
      ]),
      vue.withDirectives(vue.createVNode(
        _component_TabBar,
        null,
        null,
        512
        /* NEED_PATCH */
      ), [
        [vue.vShow, $setup.tabBarVisibility]
      ])
    ]);
  }
  const PagesMainApp = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$g], ["__scopeId", "data-v-dc27c07e"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/MainApp.vue"]]);
  const _sfc_main$g = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/App.vue"]]);
  const _sfc_main$f = {
    components: { Loading },
    props: {
      commentObj: Object,
      floor_num: Number,
      province: String,
      need_small_window: Boolean
    },
    setup(props) {
      let loading = vue.ref(true);
      let commentObj = vue.ref();
      commentObj.value = props.commentObj;
      let floor_num = vue.ref(0);
      floor_num.value = props.floor_num;
      let province = vue.ref("");
      province.value = props.province;
      let need_small_window = vue.ref(true);
      need_small_window.value = props.need_small_window;
      let father_user = vue.ref();
      let comment_list = vue.ref([
        { comment_list_user_id: null, comment_list_user_name: null, comment_list_user_content: null },
        { comment_list_user_id: null, comment_list_user_name: null, comment_list_user_content: null },
        { comment_list_user_id: null, comment_list_user_name: null, comment_list_user_content: null }
      ]);
      const showExpand = (floor_num2) => {
        uni.$emit("commentCard_showExpand", {
          data: commentObj.value,
          floor_num: floor_num2
        });
      };
      const iReplyYourComment = () => {
        uni.$emit("commentCard_replyComment", {
          data: commentObj.value
        });
      };
      const getSonComment = async (id) => {
        let res = await getCommentSonById(id);
        formatAppLog("log", "at components/article/comments/CommentCard.vue:142", res);
        if (res.code === 200) {
          for (let i = 0; i < res.data.length; i++) {
            if (!res.data[i].comment_user_id) {
              continue;
            }
            if (i >= 3) {
              break;
            }
            comment_list.value[i].comment_list_user_id = res.data[i].comment_user_id;
            comment_list.value[i].comment_list_user_name = res.data[i].comment_user_u_name;
            comment_list.value[i].comment_list_user_content = res.data[i].comment_content;
          }
        }
      };
      vue.onMounted(async () => {
        await getSonComment(commentObj.value.comment_id);
        loading.value = false;
      });
      uni.$on("CommentCard_update", async function(e) {
        if (commentObj.value.comment_id === e.id && e.id != null) {
          formatAppLog("log", "at components/article/comments/CommentCard.vue:164", "更新" + e.id);
          await getSonComment(commentObj.value.comment_id);
          commentObj.value.comment_reply_num = ++commentObj.value.comment_reply_num;
        }
      });
      return {
        commentObj,
        floor_num,
        province,
        comment_list,
        defaultHeadImgPath,
        loading,
        formatDate,
        showExpand,
        father_user,
        iReplyYourComment
      };
    }
  };
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock(
      vue.Fragment,
      null,
      [
        vue.createCommentVNode("  这个 模板卡 需要传入 {是否需要关注按钮} {评论id}"),
        vue.createElementVNode("view", { class: "w100" }, [
          $setup.loading ? (vue.openBlock(), vue.createBlock(_component_Loading, { key: 0 })) : vue.createCommentVNode("v-if", true),
          !$setup.loading ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "commentCard__container"
          }, [
            vue.createElementVNode("view", { class: "commentCard__container__header" }, [
              vue.createElementVNode("view", { class: "commentCard__container__header--author" }, [
                vue.createElementVNode("view", { class: "commentCard__container__header--author--head" }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "commentCard__container__header--author--head--img",
                      style: vue.normalizeStyle($setup.commentObj.comment_user_u_head ? "background-image: url(" + $setup.commentObj.comment_user_u_head + ")" : "background-image: url(" + $setup.defaultHeadImgPath + ")")
                    },
                    null,
                    4
                    /* STYLE */
                  ),
                  vue.createElementVNode("view", { class: "commentCard__container__header--author--head--info" }, [
                    vue.createElementVNode("view", { class: "commentCard__container__header--author--head--info--top" }, [
                      vue.createElementVNode(
                        "view",
                        { class: "commentCard__container__header--author--head--info--top--name" },
                        vue.toDisplayString($setup.commentObj.comment_user_u_name),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        { class: "commentCard__container__header--author--head--info--top--level" },
                        vue.toDisplayString($setup.commentObj.comment_user_u_sgrade),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "commentCard__container__header--author--head--info--from" }, [
                      $setup.floor_num ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 }, [
                        vue.createTextVNode(
                          vue.toDisplayString($setup.floor_num) + "F",
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode("text", { space: "nbsp" }, " 来自 佛罗里达州")
                      ])) : vue.createCommentVNode("v-if", true)
                    ])
                  ])
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "commentCard__container__body" }, [
              vue.createElementVNode("view", { class: "commentCard__container__body__container" }, [
                vue.createElementVNode("view"),
                vue.createElementVNode("view", { class: "commentCard__container__body__container__content" }, [
                  vue.createElementVNode("view", {
                    class: "commentCard__container__body__container__content--main",
                    onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $setup.iReplyYourComment(), ["stop"]))
                  }, [
                    $setup.commentObj.comment_father_id != null ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "commentCard__container__body__container__content--main--reply"
                    }, [
                      vue.createTextVNode(" 回复 "),
                      vue.createElementVNode(
                        "text",
                        { class: "commentCard__container__body__container__content--main--reply--user" },
                        vue.toDisplayString($setup.commentObj.comment_user_father_name) + "： ",
                        1
                        /* TEXT */
                      )
                    ])) : vue.createCommentVNode("v-if", true),
                    vue.createTextVNode(
                      " " + vue.toDisplayString($setup.commentObj.comment_content),
                      1
                      /* TEXT */
                    )
                  ]),
                  $setup.comment_list[0].comment_list_user_id != null && $props.need_small_window ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "commentCard__container__body__container__content--reply",
                    style: { "margin-right": "10px" },
                    onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.showExpand($setup.floor_num), ["stop"]))
                  }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList($setup.comment_list, (item1, index1) => {
                        return vue.openBlock(), vue.createElementBlock("view", { key: index1 }, [
                          item1.comment_list_user_name ? (vue.openBlock(), vue.createElementBlock("view", {
                            key: 0,
                            class: "commentCard__container__body__container__content--reply--common"
                          }, [
                            vue.createElementVNode("view", { class: "commentCard__container__body__container__content--reply--common--author" }, [
                              vue.createTextVNode(
                                vue.toDisplayString(item1.comment_list_user_name) + " ",
                                1
                                /* TEXT */
                              ),
                              item1.comment_list_user_id === $setup.commentObj.comment_user_id ? (vue.openBlock(), vue.createElementBlock("view", {
                                key: 0,
                                class: "commentCard__container__body__container__content--reply--common--author--self"
                              }, " 作者 ")) : vue.createCommentVNode("v-if", true)
                            ]),
                            vue.createTextVNode(
                              " ：" + vue.toDisplayString(item1.comment_list_user_content),
                              1
                              /* TEXT */
                            )
                          ])) : vue.createCommentVNode("v-if", true)
                        ]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    )),
                    $setup.comment_list[0].comment_list_user_content != null ? (vue.openBlock(), vue.createElementBlock(
                      "view",
                      {
                        key: 0,
                        class: "commentCard__container__body__container__content--reply--more"
                      },
                      "全部" + vue.toDisplayString($setup.commentObj.comment_reply_num) + "条评论 >>",
                      1
                      /* TEXT */
                    )) : vue.createCommentVNode("v-if", true)
                  ])) : vue.createCommentVNode("v-if", true)
                ]),
                vue.createElementVNode("view", { class: "commentCard__container__body__container__interaction" }, [
                  vue.createElementVNode(
                    "view",
                    { class: "commentCard__container__body__container__interaction--time" },
                    vue.toDisplayString($setup.formatDate($setup.commentObj.comment_create_time)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "commentCard__container__body__container__interaction--act" }, [
                    vue.createElementVNode("view", { class: "commentCard__container__body__container__interaction--act--comment" }, [
                      vue.createVNode(_component_uni_icons, {
                        color: "#999999",
                        type: "chatbubble",
                        size: "16"
                      }),
                      vue.createCommentVNode("              <text>{{articleInfo.article_comment_num}}</text>"),
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString($setup.commentObj.comment_reply_num),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "commentCard__container__body__container__interaction--act--hand" }, [
                      vue.createVNode(_component_uni_icons, {
                        color: "#999999",
                        type: "hand-up",
                        size: "16"
                      }),
                      vue.createCommentVNode("              <text>{{articleInfo.article_hand_support_num}}</text>"),
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString($setup.commentObj.comment_hand_support_num),
                        1
                        /* TEXT */
                      )
                    ])
                  ])
                ])
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ])
      ],
      2112
      /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
    );
  }
  const CommentCard = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$f], ["__scopeId", "data-v-1acd372d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentCard.vue"]]);
  const _sfc_main$e = {
    components: { CommentCard },
    props: {
      commentObj: Object,
      floor_num: Number
    },
    setup(props) {
      let commentObj = vue.ref();
      commentObj.value = props.commentObj;
      let commentList = vue.ref();
      const initializeCommentList = async (id) => {
        let res = await getCommentPosterityById(id);
        if (res.code === 200) {
          formatAppLog("log", "at components/article/comments/CommentExpand.vue:52", res);
          commentList.value = res.data;
        }
      };
      let floor_num = vue.ref(0);
      floor_num.value = props.floor_num;
      const expandClose = () => {
        formatAppLog("log", "at components/article/comments/CommentExpand.vue:62", "用户在评论回复窗口界面 触发关闭");
        uni.$emit("commentExpand_close");
      };
      vue.onMounted(async () => {
        await initializeCommentList(commentObj.value.comment_id);
      });
      uni.$on("CommentExpand_update", async function(e) {
        await initializeCommentList(commentObj.value.comment_id);
      });
      return {
        expandClose,
        floor_num,
        commentList
      };
    }
  };
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_CommentCard = vue.resolveComponent("CommentCard");
    return vue.openBlock(), vue.createElementBlock("view", {
      style: { "height": "100vh", "width": "100vw", "background": "rgba(0,0,0,0.07)", "position": "fixed", "z-index": "99", "top": "0", "left": "0", "overflow": "hidden" },
      onClick: _cache[3] || (_cache[3] = ($event) => $setup.expandClose())
    }, [
      vue.createElementVNode("view", {
        class: "commentExpand",
        style: { "position": "relative" }
      }, [
        vue.createElementVNode("view", { class: "commentExpand__container" }, [
          vue.createElementVNode("view", {
            class: "commentExpand__container__header",
            onClick: _cache[1] || (_cache[1] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.createElementVNode("view", {
              class: "commentExpand__container__header--close",
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.expandClose())
            }, [
              vue.createVNode(_component_uni_icons, {
                type: "closeempty",
                size: "20"
              })
            ]),
            vue.createElementVNode(
              "view",
              { class: "commentExpand__container__header--floor" },
              vue.toDisplayString($setup.floor_num) + "楼评论",
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "commentExpand__container__header--more" }, [
              vue.createVNode(_component_uni_icons, {
                type: "more",
                size: "20"
              })
            ])
          ]),
          vue.createElementVNode("view", {
            class: "commentExpand__container__body",
            onClick: _cache[2] || (_cache[2] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.createElementVNode("scroll-view", {
              "scroll-y": "true",
              style: { "height": "100%" }
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.commentList, (item1, index1) => {
                  return vue.openBlock(), vue.createElementBlock("view", { key: index1 }, [
                    vue.createVNode(_component_CommentCard, {
                      need_small_window: false,
                      "comment-obj": item1
                    }, null, 8, ["comment-obj"])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              vue.createElementVNode("view", { style: { "color": "#a0a0a0", "width": "100px", "font-size": "0.875rem", "margin": "25px auto" } }, "已经到底了...")
            ])
          ])
        ])
      ])
    ]);
  }
  const CommentExpand = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$e], ["__scopeId", "data-v-b72a798a"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentExpand.vue"]]);
  const _sfc_main$d = {
    props: {
      article_id: String,
      commentObj: Object,
      articleObj: Object
    },
    setup(props) {
      let keyHeight = vue.ref();
      let commentObj = vue.ref();
      commentObj.value = props.commentObj;
      let articleObj = vue.ref();
      articleObj.value = props.articleObj;
      let reply_user_name = vue.ref();
      let sending = vue.ref(false);
      vue.onMounted(async () => {
        reply_user_name.value = await getUserNameByUid(commentObj.value.comment_user_id);
      });
      const windowClose = () => {
        if (sending.value === true)
          return;
        formatAppLog("log", "at components/article/comments/CommentReplyWindow.vue:72", "用户在评论回复窗口界面 触发关闭");
        uni.$emit("comment_reply_window_close", { data: true });
      };
      let input_value = vue.ref();
      const inputComment = (e) => {
        input_value.value = e.detail.value;
      };
      const sendComment = async () => {
        sending.value = true;
        let res = await addComment(props.article_id, commentObj.value.comment_id, input_value.value);
        formatAppLog("log", "at components/article/comments/CommentReplyWindow.vue:88", res);
        if (res.code === 200) {
          await setCommentByArticleId(props.article_id);
          if (res.data === commentObj.value.comment_id) {
            uni.$emit("CommentCard_update", { id: res.data });
            uni.$emit("CommentExpand_update", { id: commentObj.value.comment_id });
          } else {
            uni.$emit("CommentCard_update", { id: commentObj.value.comment_id });
            uni.$emit("CommentCard_update", { id: res.data });
            uni.$emit("CommentExpand_update", { id: commentObj.value.comment_id });
          }
          uni.$emit("CommentList_update", { id: commentObj.value.comment_id });
          plus.nativeUI.toast(`评论成功`);
          sending.value = false;
          windowClose();
        } else {
          plus.nativeUI.toast(`评论失败
        错误代码：${res.code}
        message:${res.message}`);
          sending.value = false;
          windowClose();
        }
        sending.value = false;
      };
      uni.onKeyboardHeightChange((obj) => {
        let _sysInfo = uni.getSystemInfoSync();
        let _heightDiff = _sysInfo.screenHeight - _sysInfo.windowHeight;
        let _diff = obj.height - _heightDiff;
        keyHeight.value = (_diff > 0 ? _diff : 0) - 2 + "px";
      });
      const setCommentByArticleId = async (id) => {
        try {
          ArticleFun.setArticleCardUpdate(null, id, { comment: ++articleObj.value.article_comment_num });
        } catch (e) {
          formatAppLog("log", "at components/article/comments/CommentReplyWindow.vue:129", "向文章卡 添加回复数 信息 记录失败");
        }
      };
      return {
        keyHeight,
        windowClose,
        getUserNameByUid,
        reply_user_name,
        inputComment,
        input_value,
        sendComment
      };
    }
  };
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      style: { "height": "100vh", "width": "100vw", "background": "rgba(0,0,0,0.15)", "position": "fixed", "z-index": "999", "top": "0", "left": "0", "overflow": "hidden" },
      onClick: _cache[3] || (_cache[3] = (...args) => $setup.windowClose && $setup.windowClose(...args))
    }, [
      vue.createElementVNode(
        "view",
        {
          class: "replyWindow",
          style: vue.normalizeStyle("margin-top:calc(100vh - 175px - " + $setup.keyHeight + ")")
        },
        [
          vue.createElementVNode("view", {
            class: "replyWindow__container",
            onClick: _cache[2] || (_cache[2] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.createElementVNode("view", { class: "replyWindow__container__header" }, [
              vue.createElementVNode(
                "view",
                { style: { "color": "silver", "font-size": "0.8125rem" } },
                vue.toDisplayString("回复：") + vue.toDisplayString($setup.reply_user_name),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "replyWindow__container__body" }, [
              vue.createElementVNode("view", { class: "replyWindow__container__body__input" }, [
                vue.createElementVNode(
                  "textarea",
                  {
                    class: "replyWindow__container__body__input--sub",
                    focus: "true",
                    "placeholder-class": "replyWindow__container__body__input--sub",
                    "adjust-position": false,
                    placeholder: "我有话想说...",
                    onInput: _cache[0] || (_cache[0] = (...args) => $setup.inputComment && $setup.inputComment(...args))
                  },
                  null,
                  32
                  /* HYDRATE_EVENTS */
                )
              ]),
              vue.createElementVNode("view", { class: "replyWindow__container__body__option" }, [
                vue.createElementVNode("view", { class: "replyWindow__container__body__option--other" }),
                vue.createElementVNode("view", {
                  class: "replyWindow__container__body__option--send",
                  onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.sendComment(), ["stop"]))
                }, "发布")
              ])
            ])
          ])
        ],
        4
        /* STYLE */
      )
    ]);
  }
  const CommentReplyWindow = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$d], ["__scopeId", "data-v-31eef9f2"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentReplyWindow.vue"]]);
  const _sfc_main$c = {
    components: {
      CommentReplyWindow,
      CommentCard,
      CommentExpand
    },
    props: {
      article_id: String
    },
    setup(props) {
      let isExpand = vue.ref(false);
      let isReply = vue.ref(false);
      let expand_floor_num = vue.ref(1);
      let expand_comment_obj = vue.ref();
      let reply_comment_obj = vue.ref();
      let articleInfo = vue.ref();
      uni.$on("commentCard_showExpand", function(e) {
        let data = e.data;
        expand_comment_obj.value = data;
        expand_floor_num.value = e.floor_num;
        isExpand.value = !isExpand.value;
      });
      uni.$on("commentExpand_close", function() {
        isExpand.value = !isExpand.value;
      });
      uni.$on("commentCard_replyComment", function(e) {
        let data = e.data;
        reply_comment_obj.value = data;
        isReply.value = !isReply.value;
      });
      uni.$on("comment_reply_window_close", function() {
        isReply.value = !isReply.value;
      });
      let article_id = vue.ref();
      article_id = props.article_id;
      let article_comment_list = vue.ref();
      let empty_comment = vue.ref(false);
      const initialize = async () => {
        let res = await getCommentByArticleId(article_id);
        formatAppLog("log", "at components/article/comments/CommentList.vue:121", res);
        if (res.code === 200) {
          article_comment_list.value = res.data.filter((item) => item.comment_father_id === null);
          empty_comment.value = false;
        } else if (res.code === 404) {
          empty_comment.value = true;
        } else {
          plus.nativeUI.toast(`加载评论列表出错
        代码：${res.code}
        信息:${res.message}`);
        }
        await getArticleByID(article_id).then((res2) => {
          formatAppLog("log", "at components/article/comments/CommentList.vue:135", res2);
          if (res2.code === 200) {
            articleInfo.value = res2.data[0];
          }
        });
      };
      const iWantSpeak = () => {
        let obj = {
          comment_id: null,
          comment_user_id: articleInfo.value.article_user_id
        };
        uni.$emit("commentCard_replyComment", {
          data: obj
        });
      };
      vue.onMounted(async () => {
        await initialize();
      });
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      onBackPress((e) => {
        formatAppLog("log", "at components/article/comments/CommentList.vue:166", e);
        formatAppLog("log", "at components/article/comments/CommentList.vue:167", "用户在详细文章界面按了返回键盘");
        if (e.from === "backbutton") {
          formatAppLog("log", "at components/article/comments/CommentList.vue:171", isReply.value);
          if (isReply.value) {
            uni.$emit("comment_reply_window_close", { data: true });
            return true;
          }
          if (isExpand.value) {
            uni.$emit("commentExpand_close");
            return true;
          }
          pageBack();
          return true;
        } else if (e.from === "navigateBack") {
          return false;
        }
      });
      uni.$on("CommentList_update", async function(e) {
        if (e.id == null) {
          await initialize();
        }
      });
      return {
        empty_comment,
        article_comment_list,
        formatDate,
        isExpand,
        expand_floor_num,
        expand_comment_obj,
        isReply,
        reply_comment_obj,
        article_id,
        articleInfo,
        iWantSpeak
      };
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_CommentReplyWindow = vue.resolveComponent("CommentReplyWindow");
    const _component_CommentExpand = vue.resolveComponent("CommentExpand");
    const _component_CommentCard = vue.resolveComponent("CommentCard");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "w100" }, [
      vue.createElementVNode("view", { class: "comment w100" }, [
        vue.createElementVNode("view", { class: "comment__container w100" }, [
          vue.createElementVNode("view", { class: "comment__container__header disF-center" }, [
            vue.createElementVNode("view", {
              class: "comment__container__header__option disF-center",
              style: { "justify-content": "space-between" }
            }, [
              vue.createElementVNode("view", { class: "comment__container__header__option--left disF-center" }, [
                vue.createElementVNode("view", { style: { "margin": "0 5px", "margin-left": "10px" } }, "全部评论"),
                vue.createElementVNode("view", { style: { "margin": "0 5px", "color": "silver" } }, "只看作者")
              ]),
              vue.createElementVNode("view", { class: "comment__container__header__option--right disF-center" }, [
                vue.createElementVNode("view", { style: { "margin": "0 5px" } }, "热门"),
                vue.createElementVNode("view", { style: { "margin": "0 5px", "color": "#1f1f1f" } }, "最早"),
                vue.createElementVNode("view", { style: { "margin": "0 5px", "margin-right": "10px" } }, "最热")
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "comment__container__body" }, [
            $setup.empty_comment ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "articleList__container__body__concern--blank disF-center",
              style: { "flex-direction": "column" }
            }, [
              vue.createElementVNode("image", {
                src: "/static/images/utils/blank_page.png",
                style: { "height": "150px" }
              }),
              vue.createElementVNode("view", { style: { "color": "#a0a0a0" } }, "目前无人评论...")
            ])) : vue.createCommentVNode("v-if", true),
            $setup.isReply ? (vue.openBlock(), vue.createBlock(_component_CommentReplyWindow, {
              key: 1,
              "comment-obj": $setup.reply_comment_obj,
              article_id: $setup.article_id,
              "article-obj": $setup.articleInfo
            }, null, 8, ["comment-obj", "article_id", "article-obj"])) : vue.createCommentVNode("v-if", true),
            $setup.isExpand ? (vue.openBlock(), vue.createBlock(_component_CommentExpand, {
              key: 2,
              floor_num: $setup.expand_floor_num,
              "comment-obj": $setup.expand_comment_obj
            }, null, 8, ["floor_num", "comment-obj"])) : vue.createCommentVNode("v-if", true),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.article_comment_list, (item1, index1) => {
                return vue.openBlock(), vue.createElementBlock("view", { key: index1 }, [
                  vue.createVNode(_component_CommentCard, {
                    need_small_window: true,
                    "comment-obj": item1,
                    floor_num: ++index1
                  }, null, 8, ["comment-obj", "floor_num"])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            !$setup.empty_comment ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 3,
              style: { "color": "#a0a0a0", "width": "100px", "font-size": "0.875rem", "margin": "25px auto" }
            }, "已经到底了...")) : vue.createCommentVNode("v-if", true)
          ]),
          !$setup.isReply && !$setup.isExpand ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "comment__container__footer"
          }, [
            vue.createElementVNode("view", { class: "comment__container__footer--comments" }, [
              vue.createElementVNode("view", {
                class: "comment__container__footer--comments--search",
                onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $setup.iWantSpeak(), ["stop"]))
              }, [
                vue.createElementVNode("view", null, " 我有话想说...")
              ])
            ]),
            vue.createElementVNode("view", { class: "comment__container__footer--util" }, [
              vue.createElementVNode("view", null, [
                vue.createVNode(_component_uni_icons, {
                  type: "chatbubble",
                  size: "23"
                }),
                vue.createTextVNode(
                  " " + vue.toDisplayString($setup.articleInfo.article_comment_num),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", null, [
                vue.createVNode(_component_uni_icons, {
                  type: "fire",
                  size: "23"
                }),
                vue.createTextVNode(
                  vue.toDisplayString(Number($setup.articleInfo.article_hand_support_num) + Number($setup.articleInfo.article_watch_num) + Number($setup.articleInfo.article_comment_num)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", null, [
                vue.createVNode(_component_uni_icons, {
                  type: "hand-up",
                  size: "23"
                }),
                vue.createTextVNode(
                  " " + vue.toDisplayString($setup.articleInfo.article_hand_support_num),
                  1
                  /* TEXT */
                )
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ])
      ])
    ]);
  }
  const Comment = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$c], ["__scopeId", "data-v-404a4e6d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentList.vue"]]);
  const _sfc_main$b = {
    props: {
      needFollowModel: Boolean
    },
    components: { CommentList: Comment, Loading, App },
    emits: ["update:item"],
    setup(props, { emit }) {
      const needFollowModel = vue.ref(true);
      needFollowModel.value = props.needFollowModel;
      let authorInfo = vue.ref();
      let articleInfo = vue.ref();
      let concern_be = vue.ref(false);
      const store2 = useStore();
      let selfId = store2.getters.getUser;
      selfId = selfId.u_id;
      const getAuthorInfo = async (id) => {
        try {
          const res = await getUserInfoById(id);
          if (res.code === 200) {
            return res.data[0];
          } else {
            plus.nativeUI.toast(`获取个人信息错误
          代码：${res.code}`, { duration: "long" });
          }
        } catch (error) {
          plus.nativeUI.toast(`获取个人信息错误
          代码：${error}`, { duration: "long" });
        }
      };
      const getUserConcern = async (id1, id2) => {
        try {
          const res = await getUser1AndUser2Concern({ "u_id": id1, "be_u_id": id2 });
          if (res.code === 200) {
            return res.data.concern_be === 1;
          } else {
            plus.nativeUI.toast(`获取关注状态错误
          代码：${res.code}`, { duration: "long" });
          }
        } catch (error) {
          plus.nativeUI.toast(`获取关注状态错误
          代码：${error}`, { duration: "long" });
        }
      };
      const setWatchByArticleId = async (id) => {
        try {
          await addWatchByArticleId(id);
          ArticleFun.setArticleCardUpdate(null, id, { watch: ++articleInfo.value.article_watch_num });
        } catch (e) {
          formatAppLog("log", "at components/article/ArticleDetailPage.vue:156", "添加历史观看记录失败");
        }
      };
      let html = vue.ref(`<div style='color:red' class='classTest'>文章加载失败</div>`);
      let articleId = vue.ref("1");
      onLoad(async (option) => {
        let id = option.id;
        articleId.value = id;
        await getArticleByID(articleId.value).then((res) => {
          formatAppLog("log", "at components/article/ArticleDetailPage.vue:168", res);
          if (res.code === 200) {
            articleInfo.value = res.data[0];
            html.value = replaceImgSrc(articleInfo.value.article_content);
          }
        });
        const regex = new RegExp("<img", "gi");
        html.value = html.value.replace(regex, `<img style="max-width:100% !important;height:auto;display:block;margin: 0 auto;width:98%;border-radius: 8px;"`);
        authorInfo.value = await getAuthorInfo(articleInfo.value.article_user_id);
        concern_be.value = await getUserConcern(selfId, articleInfo.value.article_user_id);
        await setWatchByArticleId(articleInfo.value.article_id);
      });
      const tapAuthorCard = (data) => {
        formatAppLog("log", "at components/article/ArticleDetailPage.vue:189", "点击了作者栏");
      };
      let canTapFollow = true;
      const tapFollowCard = (data) => {
        if (!canTapFollow) {
          plus.nativeUI.toast(`点的太快啦~`);
          return;
        }
        canTapFollow = false;
        setTimeout(() => {
          canTapFollow = true;
        }, 1e3);
        if (concern_be.value === false) {
          setUserAddConcern({ "u_id": data.u_id }).then((res) => {
            formatAppLog("log", "at components/article/ArticleDetailPage.vue:204", res);
            if (res.code === 200) {
              concern_be.value = true;
              ArticleFun.setArticleCardUpdate(data.u_id, null, { concern_be: 1 });
              plus.nativeUI.toast(`关注成功`);
            }
          });
        } else {
          setUserRemoveConcern({ "u_id": data.u_id }).then((res) => {
            if (res.code === 200) {
              concern_be.value = false;
              ArticleFun.setArticleCardUpdate(data.u_id, null, { concern_be: 0 });
              plus.nativeUI.toast(`取关成功`);
            }
          });
        }
        formatAppLog("log", "at components/article/ArticleDetailPage.vue:224", "点击了关注");
      };
      const replaceImgSrc = (data) => {
        const imgSrcReg = /<img.*?src=[\"|\']?(.*?)[\"|\']?\s.*?>/gi;
        return data.replace(imgSrcReg, (match, src) => {
          const newSrc = replaceUrlIP(src);
          return match.replace(src, newSrc);
        });
      };
      return {
        articleId,
        html,
        authorInfo,
        defaultHeadImgPath,
        articleInfo,
        needFollowModel,
        concern_be,
        tapAuthorCard,
        tapFollowCard,
        selfId,
        formatDate
      };
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
    resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_CommentList = vue.resolveComponent("CommentList");
    return vue.openBlock(), vue.createElementBlock("view", { style: { "padding": "0 5px 10px", "background": "#FFFFFF", "height": "100%" } }, [
      vue.createVNode(_component_Loading, { loading: false }),
      vue.createElementVNode("scroll-view", {
        "scroll-y": "true",
        style: { "width": "100%", "height": "100%" }
      }, [
        vue.createElementVNode("view", { class: "articleInfo" }, [
          vue.createElementVNode("view", { class: "articleInfo__container" }, [
            vue.createElementVNode("view", { class: "articleInfo__container__header" }, [
              vue.createElementVNode("view", { class: "articleInfo__container__header__authorInfo" }, [
                vue.createElementVNode("view", {
                  class: "articleInfo__container__header__authorInfo__head",
                  onClick: _cache[0] || (_cache[0] = ($event) => $setup.tapAuthorCard($setup.authorInfo))
                }, [
                  vue.createElementVNode("view", { class: "articleInfo__container__header__authorInfo__head--img" }, [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "articleInfo__container__header__authorInfo__head--img--path",
                        style: vue.normalizeStyle($setup.authorInfo.u_head ? "background-image: url(" + $setup.authorInfo.u_head + ")" : "background-image: url(" + $setup.defaultHeadImgPath + ")")
                      },
                      null,
                      4
                      /* STYLE */
                    )
                  ]),
                  vue.createElementVNode(
                    "view",
                    { class: "articleInfo__container__header__authorInfo__head--name" },
                    vue.toDisplayString($setup.authorInfo.u_name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "articleInfo__container__header__authorInfo__head--level" },
                    vue.toDisplayString($setup.authorInfo.u_sgrade),
                    1
                    /* TEXT */
                  )
                ]),
                $setup.needFollowModel ? vue.withDirectives((vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "articleInfo__container__header__authorInfo__follow",
                    onClick: _cache[1] || (_cache[1] = ($event) => $setup.tapFollowCard($setup.authorInfo))
                  },
                  [
                    vue.createElementVNode("view", { style: { "width": "100%", "height": "100%" } }, [
                      vue.withDirectives(vue.createElementVNode(
                        "view",
                        { class: "articleInfo__container__header__authorInfo__follow--be" },
                        "已关注",
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vShow, $setup.concern_be]
                      ]),
                      vue.withDirectives(vue.createElementVNode(
                        "view",
                        { class: "articleInfo__container__header__authorInfo__follow--no" },
                        "+关注",
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vShow, !$setup.concern_be]
                      ])
                    ])
                  ],
                  512
                  /* NEED_PATCH */
                )), [
                  [vue.vShow, $setup.selfId != $setup.authorInfo.u_id]
                ]) : vue.createCommentVNode("v-if", true)
              ]),
              vue.createElementVNode("view", { class: "articleInfo__container__header__title" }, [
                vue.createElementVNode(
                  "view",
                  { class: "articleInfo__container__header__title--text" },
                  vue.toDisplayString($setup.articleInfo.article_title),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "articleInfo__container__header__time" }, [
                vue.createElementVNode(
                  "view",
                  null,
                  vue.toDisplayString("文章发布于：") + vue.toDisplayString($setup.formatDate($setup.articleInfo.article_create_time)),
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "articleInfo__container__body" }, [
              vue.createElementVNode("view", { class: "articleInfo__container__body--html" }, [
                vue.createElementVNode("rich-text", {
                  nodes: $setup.html,
                  preview: "true",
                  selectable: "true",
                  space: "true"
                }, null, 8, ["nodes"])
              ])
            ]),
            vue.createCommentVNode("v-if", true)
          ])
        ]),
        vue.createVNode(_component_CommentList, {
          article_id: $setup.articleInfo.article_id
        }, null, 8, ["article_id"])
      ]),
      vue.createElementVNode("view")
    ]);
  }
  const ArticleDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$b], ["__scopeId", "data-v-388cd4fe"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/ArticleDetailPage.vue"]]);
  const _sfc_main$a = {
    components: {
      Loading,
      ArticleDetailPage,
      TopBar
    },
    setup() {
      let headerTitle = vue.ref("默认标题");
      vue.onMounted(() => {
      });
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      return {
        pageBack,
        headerTitle
      };
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_ArticleDetailPage = vue.resolveComponent("ArticleDetailPage", true);
    return vue.openBlock(), vue.createElementBlock("view", { class: "articleDetailPage" }, [
      vue.createElementVNode("view", { class: "articleDetailPage__container" }, [
        vue.createElementVNode("view", { class: "articleDetailPage__container__header" }, [
          vue.createElementVNode("view", { style: { "height": "var(--status-bar-height)" } }),
          vue.createElementVNode("view", { class: "articleDetailPage__container__header--main" }, [
            vue.createElementVNode("view", { class: "articleDetailPage__container__header--button" }, [
              vue.createElementVNode("view", {
                onClick: _cache[0] || (_cache[0] = ($event) => $setup.pageBack()),
                style: { "margin-left": "10px" }
              }, [
                vue.createVNode(_component_uni_icons, {
                  type: "left",
                  size: "20"
                })
              ])
            ]),
            vue.createElementVNode(
              "view",
              { class: "articleDetailPage__container__header--title" },
              vue.toDisplayString($setup.headerTitle),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "articleDetailPage__container__header--more" }, [
              vue.createVNode(_component_uni_icons, {
                type: "more",
                size: "20"
              })
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "articleDetailPage__container__body" }, [
          vue.createVNode(_component_ArticleDetailPage, { "need-follow-model": true })
        ]),
        vue.createElementVNode("view", { class: "articleDetailPage__container__footer" })
      ])
    ]);
  }
  const PagesArticleDetailArticleDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$a], ["__scopeId", "data-v-b0178992"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/article/detail/ArticleDetailPage.vue"]]);
  const _sfc_main$9 = {
    setup() {
      vue.onMounted(() => {
        const store2 = useStore();
        loginUseUser({
          email: "1@qq.com",
          password: "1"
        }).then((res) => {
          formatAppLog("log", "at pages/loginRegister/loginRegister.vue:43", res);
          if (res.code == 200) {
            try {
              uni.setStorageSync("token", res.token);
              const currentUser = res.data;
              store2.dispatch("addUser", currentUser);
              formatAppLog("log", "at pages/loginRegister/loginRegister.vue:51", store2.getters.getUser);
            } catch (e) {
              formatAppLog("log", "at pages/loginRegister/loginRegister.vue:53", e);
            }
            uni.reLaunch({
              url: "/pages/MainApp"
            });
          } else {
            uni.reLaunch({
              url: "/pages/loginRegister/loginRegister"
            });
          }
        });
      });
    }
    // data() {
    // 	return {
    // 		iphoneValue: '', //手机号码
    // 		passwordValue: '', //密码
    // 		testValue: '', //验证码
    // 		showPassword: true, //是否显示密码
    // 		showClearIcon: false, //是否显示清除按钮
    // 		type: 2, //登录的状态 - - - 1是验证码登录、2是密码登录
    // 		token: '',
    // 		timer: 0, //验证码时间
    // 		showTimer: true, //是否显示验证码时间
    // 	}
    // },
    //
    // methods: {
    // 	// 显示隐藏密码
    // 	changePassword: function() {
    // 		this.showPassword = !this.showPassword;
    // 	},
    // 	// 判断是否显示清除按钮
    // 	clearInput: function(event) {
    // 		this.iphoneValue = event.detail.value;
    // 		if (event.detail.value.length > 0) {
    // 			this.showClearIcon = true;
    // 		} else {
    // 			this.showClearIcon = false;
    // 		}
    // 	},
    // 	// 清除内容/隐藏按钮
    // 	clearIcon: function() {
    // 		this.iphoneValue = '';
    // 		this.showClearIcon = false;
    // 	},
    // 	// 切换登录的方式
    // 	setLoginType(type) {
    // 		this.type = type
    // 	},
    // 	// 密码登录
    // 	Login() {
    // 		// 登录成功后跳转到主页，然后将token保存到本地
    // 		loginUseUser({
    // 			email: '1@qq.com',
    // 			password: '1'
    // 		}).then(res => {
    // 			__f__('log','at pages/loginRegister/loginRegister.vue:111',res)
    // 			if (res.code == 200) {
    // 				try {
    // 					uni.setStorageSync('token', res.token);
    // 				} catch (e) {
    // 					__f__('log','at pages/loginRegister/loginRegister.vue:116',e)
    // 				}
    // 				uni.redirectTo({
    // 					url: '/pages/MainApp'
    // 				});
    // 			} else {
    //
    // 			}
    // 		})
    // 	},
    // 	// 获取验证码
    // 	getTest() {
    //
    // 	},
    // 	// 设置验证码时间动态减少
    // 	timeDown(num) {
    // 		let that = this;
    // 		// 当时间为0时,恢复为按钮,清除定时器
    // 		if (num == 0) {
    // 			that.showTimer = true;
    // 			return clearTimeout();
    // 		} else {
    // 			that.showTimer = false;
    // 			setTimeout(function() {
    // 				that.timer = num - 1
    // 				that.timeDown(num - 1)
    // 			}, 1000) //定时每秒减一
    // 		}
    // 	},
    // 	// 下面是可以封装起来引入的部分
    // 	// 判断是否是正确的手机号码
    // 	isMobile(str) {
    // 		// let reg = /^1\d{10}$/;
    // 		// return reg.test(str)
    // 	},
    // }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "login-content" }, [
      vue.createElementVNode("view", { class: "login-title" }, " 登录 "),
      vue.createElementVNode("view", { class: "iphone" }, [
        vue.createElementVNode("input", {
          placeholder: "输入手机号",
          value: _ctx.iphoneValue,
          onInput: _cache[0] || (_cache[0] = (...args) => _ctx.clearInput && _ctx.clearInput(...args))
        }, null, 40, ["value"]),
        _ctx.showClearIcon ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
          key: 0,
          type: "closeempty",
          color: "#808080",
          size: "25",
          onClick: _ctx.clearIcon
        }, null, 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
      ]),
      _ctx.type == 2 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "password"
      }, [
        vue.createCommentVNode(' <input type="password" placeholder="输入密码" /> 要显示密码就不要设置type="password"'),
        vue.withDirectives(vue.createElementVNode("input", {
          placeholder: "请输入密码",
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => _ctx.passwordValue = $event),
          password: _ctx.showPassword
        }, null, 8, ["password"]), [
          [vue.vModelText, _ctx.passwordValue]
        ]),
        vue.createVNode(_component_uni_icons, {
          type: "eye-filled",
          color: "#808080",
          size: "25",
          onClick: _ctx.changePassword
        }, null, 8, ["onClick"])
      ])) : vue.createCommentVNode("v-if", true),
      _ctx.type == 1 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "test"
      }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "text",
            placeholder: "输入验证码",
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => _ctx.testValue = $event)
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, _ctx.testValue]
        ]),
        _ctx.showTimer ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "get-test",
          type: "default",
          onClick: _cache[3] || (_cache[3] = ($event) => _ctx.getTest())
        }, "获取验证码")) : (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 1,
            class: "get-test",
            type: "default"
          },
          vue.toDisplayString(_ctx.timer + "s"),
          1
          /* TEXT */
        ))
      ])) : vue.createCommentVNode("v-if", true),
      _ctx.type == 2 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "test-btn",
        onClick: _cache[4] || (_cache[4] = ($event) => _ctx.setLoginType(1))
      }, "手机验证码登录>>")) : vue.createCommentVNode("v-if", true),
      _ctx.type == 1 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "password-btn",
        onClick: _cache[5] || (_cache[5] = ($event) => _ctx.setLoginType(2))
      }, "密码登录>>")) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode("view", {
        class: "login-btn",
        onClick: _cache[6] || (_cache[6] = ($event) => _ctx.Login())
      }, "登录")
    ]);
  }
  const PagesLoginRegisterLoginRegister = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$9], ["__scopeId", "data-v-ed6efab4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/loginRegister/loginRegister.vue"]]);
  const _sfc_main$8 = {
    props: {
      userObj: Object
    },
    setup(props) {
      const store2 = useStore();
      let isSelf = store2.getters.getUser;
      isSelf = isSelf.u_id;
      let canTapFollow = true;
      const tapFollowCard = (data) => {
        if (!canTapFollow) {
          plus.nativeUI.toast(`点的太快啦~`);
          return;
        }
        canTapFollow = false;
        setTimeout(() => {
          canTapFollow = true;
        }, 1e3);
        if (data.concern_be === 0) {
          setUserAddConcern({ "u_id": data.u_id }).then((res) => {
            formatAppLog("log", "at components/user/UserCard.vue:70", res);
            if (res.code === 200) {
              userObj.value.concern_be = 1;
              ArticleFun.setArticleCardUpdate(data.u_id, null, { concern_be: 1 });
              plus.nativeUI.toast(`关注成功`);
            }
          });
        } else {
          setUserRemoveConcern({ "u_id": data.u_id }).then((res) => {
            if (res.code === 200) {
              userObj.value.concern_be = 0;
              ArticleFun.setArticleCardUpdate(data.u_id, null, { concern_be: 0 });
              plus.nativeUI.toast(`取关成功`);
            }
          });
        }
        formatAppLog("log", "at components/user/UserCard.vue:90", "点击了关注");
      };
      let userObj = vue.ref();
      userObj.value = props.userObj;
      return {
        userObj,
        isSelf,
        defaultHeadImgPath,
        tapFollowCard
      };
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "width": "100%", "height": "120rpx", "background": "#FFFFFF" } }, [
      vue.createElementVNode("view", { class: "userCard__container" }, [
        vue.createElementVNode("view", { class: "userCard__container__body" }, [
          vue.createElementVNode("view", { class: "userCard__container__body__left" }, [
            vue.createElementVNode("view", { class: "userCard__container__body__left__head" }, [
              vue.createElementVNode(
                "view",
                {
                  class: "userCard__container__body__left__head--img",
                  style: vue.normalizeStyle($setup.userObj.u_head ? "background-image: url(" + $setup.userObj.u_head + ")" : "background-image: url(" + $setup.defaultHeadImgPath + ")")
                },
                null,
                4
                /* STYLE */
              )
            ]),
            vue.createElementVNode("view", { class: "userCard__container__body__left__info" }, [
              vue.createElementVNode("view", { class: "userCard__container__body__left__info--name" }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($setup.userObj.u_name),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "userCard__container__body__left__info--signature" }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($setup.userObj.u_signature),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "userCard__container__body__left__info--from" }, [
                vue.createElementVNode("text", { space: "nbsp" }, "来自：黑龙江")
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "userCard__container__body__right" }, [
            vue.withDirectives(vue.createElementVNode(
              "view",
              {
                class: "userCard__container__body__right__follow",
                onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $setup.tapFollowCard($setup.userObj), ["stop"]))
              },
              [
                vue.createElementVNode("view", { style: { "width": "100%", "height": "100%" } }, [
                  vue.withDirectives(vue.createElementVNode(
                    "view",
                    { class: "userCard__container__body__right__follow--be" },
                    "已关注",
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vShow, $setup.userObj.concern_be === 1]
                  ]),
                  vue.withDirectives(vue.createElementVNode(
                    "view",
                    { class: "userCard__container__body__right__follow--no" },
                    "+关注",
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vShow, $setup.userObj.concern_be === 0 || !$setup.userObj.concern_be]
                  ])
                ])
              ],
              512
              /* NEED_PATCH */
            ), [
              [vue.vShow, $setup.isSelf != $setup.userObj.u_id]
            ])
          ])
        ])
      ])
    ]);
  }
  const UserCard = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8], ["__scopeId", "data-v-c99219be"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/user/UserCard.vue"]]);
  const _sfc_main$7 = {
    components: {
      CommentReplyWindow,
      Comment,
      UserCard
    },
    data() {
      return {};
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_UserCard = vue.resolveComponent("UserCard");
    return vue.openBlock(), vue.createElementBlock("view", { style: { "background": "#bebebe", "padding": "5px" } }, [
      vue.createElementVNode("view", { class: "status-bar-height" }),
      vue.createCommentVNode("    <Comment></Comment>"),
      vue.createCommentVNode("驱蚊器问问去为额为邱琦雯顷刻间哈科进士第三空间活动空间哈后快"),
      vue.createCommentVNode("    <CommentExpand></CommentExpand>"),
      vue.createCommentVNode("    <CommentReplyWindow></CommentReplyWindow>"),
      vue.createVNode(_component_UserCard)
    ]);
  }
  const PagesTestPageTestPage = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/testPage/testPage.vue"]]);
  const _sfc_main$6 = {
    name: "UniGridItem",
    inject: ["grid"],
    props: {
      index: {
        type: Number,
        default: 0
      }
    },
    data() {
      return {
        column: 0,
        showBorder: true,
        square: true,
        highlight: true,
        left: 0,
        top: 0,
        openNum: 2,
        width: 0,
        borderColor: "#e5e5e5"
      };
    },
    created() {
      this.column = this.grid.column;
      this.showBorder = this.grid.showBorder;
      this.square = this.grid.square;
      this.highlight = this.grid.highlight;
      this.top = this.hor === 0 ? this.grid.hor : this.hor;
      this.left = this.ver === 0 ? this.grid.ver : this.ver;
      this.borderColor = this.grid.borderColor;
      this.grid.children.push(this);
      this.width = this.grid.width;
    },
    beforeDestroy() {
      this.grid.children.forEach((item, index) => {
        if (item === this) {
          this.grid.children.splice(index, 1);
        }
      });
    },
    methods: {
      _onClick() {
        this.grid.change({
          detail: {
            index: this.index
          }
        });
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return $data.width ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        style: vue.normalizeStyle("width:" + $data.width + ";" + ($data.square ? "height:" + $data.width : "")),
        class: "uni-grid-item"
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass([{ "uni-grid-item--border": $data.showBorder, "uni-grid-item--border-top": $data.showBorder && $props.index < $data.column, "uni-highlight": $data.highlight }, "uni-grid-item__box"]),
            style: vue.normalizeStyle({ "border-right-color": $data.borderColor, "border-bottom-color": $data.borderColor, "border-top-color": $data.borderColor }),
            onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
          },
          [
            vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
          ],
          6
          /* CLASS, STYLE */
        )
      ],
      4
      /* STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-7a807eb7"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-grid/components/uni-grid-item/uni-grid-item.vue"]]);
  const _sfc_main$5 = {
    name: "UniGrid",
    emits: ["change"],
    props: {
      // 每列显示个数
      column: {
        type: Number,
        default: 3
      },
      // 是否显示边框
      showBorder: {
        type: Boolean,
        default: true
      },
      // 边框颜色
      borderColor: {
        type: String,
        default: "#D2D2D2"
      },
      // 是否正方形显示,默认为 true
      square: {
        type: Boolean,
        default: true
      },
      highlight: {
        type: Boolean,
        default: true
      }
    },
    provide() {
      return {
        grid: this
      };
    },
    data() {
      const elId = `Uni_${Math.ceil(Math.random() * 1e6).toString(36)}`;
      return {
        elId,
        width: 0
      };
    },
    created() {
      this.children = [];
    },
    mounted() {
      this.$nextTick(() => {
        this.init();
      });
    },
    methods: {
      init() {
        setTimeout(() => {
          this._getSize((width) => {
            this.children.forEach((item, index) => {
              item.width = width;
            });
          });
        }, 50);
      },
      change(e) {
        this.$emit("change", e);
      },
      _getSize(fn) {
        uni.createSelectorQuery().in(this).select(`#${this.elId}`).boundingClientRect().exec((ret) => {
          this.width = parseInt((ret[0].width - 1) / this.column) + "px";
          fn(this.width);
        });
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-grid-wrap" }, [
      vue.createElementVNode("view", {
        id: $data.elId,
        ref: "uni-grid",
        class: vue.normalizeClass(["uni-grid", { "uni-grid--border": $props.showBorder }]),
        style: vue.normalizeStyle({ "border-left-color": $props.borderColor })
      }, [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ], 14, ["id"])
    ]);
  }
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-07acefee"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-grid/components/uni-grid/uni-grid.vue"]]);
  function getSearchUser(id) {
    return request({
      url: "search/user/" + id,
      method: "GET"
    });
  }
  function getSearchSystem() {
    return request({
      url: "search/system",
      method: "GET"
    });
  }
  function getSearchByTerm(search_term) {
    return request({
      url: "search/word/" + search_term,
      method: "GET"
    });
  }
  const _sfc_main$4 = {
    setup(props) {
      const store2 = useStore();
      let login_u_id = store2.getters.getUser;
      let u_id = login_u_id.u_id;
      let systemHotList = vue.ref();
      let userSearchList = vue.ref();
      const initialize = async () => {
        let res1 = await getSearchSystem();
        if (res1.code === 200) {
          systemHotList.value = res1.data;
        } else {
          plus.nativeUI.toast(`获取系统热搜失败`);
        }
        let res2 = await getSearchUser(u_id);
        formatAppLog("log", "at components/home/search/SearchHistory.vue:71", res2);
        if (res2.code === 200) {
          userSearchList.value = res2.data;
        } else {
          plus.nativeUI.toast(`获取用户热搜失败`);
        }
      };
      const tapSearchTerms = (search_terms) => {
        formatAppLog("log", "at components/home/search/SearchHistory.vue:81", "点击了搜索栏" + search_terms);
        uni.$emit("searchHistory_tap", { word: search_terms });
      };
      vue.onMounted(async () => {
        await initialize();
      });
      return {
        systemHotList,
        tapSearchTerms,
        userSearchList
      };
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_grid_item = resolveEasycom(vue.resolveDynamicComponent("uni-grid-item"), __easycom_0);
    const _component_uni_grid = resolveEasycom(vue.resolveDynamicComponent("uni-grid"), __easycom_1);
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { style: { "height": "20vh", "width": "100vw", "padding": "15rpx" } }, [
      vue.createElementVNode("view", { class: "searchHistory__container" }, [
        vue.createElementVNode("view", { class: "searchHistory__container__body" }, [
          vue.createElementVNode("view", { class: "searchHistory__container__body__history" }, [
            vue.createElementVNode("view", { class: "searchHistory__container__body__history__user" }, [
              vue.createElementVNode("view", { class: "searchHistory__container__body__history__user--header searchHistory__container__body__history--header" }, [
                vue.createElementVNode("text", null, "历史搜索")
              ]),
              vue.createElementVNode("view", { class: "searchHistory__container__body__history__user--body searchHistory__container__body__history--body" }, [
                vue.createVNode(_component_uni_grid, {
                  column: 3,
                  showBorder: false,
                  square: false,
                  highlight: false
                }, {
                  default: vue.withCtx(() => [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList($setup.userSearchList, (item, index) => {
                        return vue.openBlock(), vue.createBlock(
                          _component_uni_grid_item,
                          { key: index },
                          {
                            default: vue.withCtx(() => [
                              vue.createElementVNode("view", {
                                onClick: vue.withModifiers(($event) => $setup.tapSearchTerms(item.search_terms), ["stop"]),
                                class: "searchHistory__container__body__history--word bg-efefef",
                                style: { "width": "50%", "border-radius": "5rpx", "height": "1.3rem", "display": "flex", "align-items": "center", "justify-content": "center", "justify-items": "center", "margin-left": "20rpx" }
                              }, [
                                vue.createElementVNode(
                                  "text",
                                  { class: "uni-text-truncation" },
                                  vue.toDisplayString(item.search_terms),
                                  1
                                  /* TEXT */
                                )
                              ], 8, ["onClick"])
                            ]),
                            _: 2
                            /* DYNAMIC */
                          },
                          1024
                          /* DYNAMIC_SLOTS */
                        );
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ]),
                  _: 1
                  /* STABLE */
                })
              ])
            ]),
            vue.createElementVNode("view", { class: "searchHistory__container__body__history__system" }, [
              vue.createElementVNode("view", { class: "searchHistory__container__body__history__system--header searchHistory__container__body__history--header" }, [
                vue.createElementVNode("text", null, "系统热搜")
              ]),
              vue.createElementVNode("view", { class: "searchHistory__container__body__history__system--body searchHistory__container__body__history--body" }, [
                vue.createVNode(_component_uni_grid, {
                  column: 3,
                  showBorder: false,
                  square: false,
                  highlight: false
                }, {
                  default: vue.withCtx(() => [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList($setup.systemHotList, (item, index) => {
                        return vue.openBlock(), vue.createBlock(
                          _component_uni_grid_item,
                          { key: index },
                          {
                            default: vue.withCtx(() => [
                              vue.createElementVNode("view", { style: { "display": "flex", "align-items": "center" } }, [
                                vue.createElementVNode("view", {
                                  onClick: vue.withModifiers(($event) => $setup.tapSearchTerms(item.search_terms), ["stop"]),
                                  class: "searchHistory__container__body__history--word"
                                }, [
                                  vue.createElementVNode(
                                    "text",
                                    { class: "uni-text-truncation" },
                                    vue.toDisplayString(item.search_terms),
                                    1
                                    /* TEXT */
                                  ),
                                  vue.createVNode(_component_uni_icons, {
                                    type: "fire-filled",
                                    size: "0.8125rem",
                                    color: "red",
                                    style: { "margin-left": "10rpx" }
                                  })
                                ], 8, ["onClick"])
                              ])
                            ]),
                            _: 2
                            /* DYNAMIC */
                          },
                          1024
                          /* DYNAMIC_SLOTS */
                        );
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ]),
                  _: 1
                  /* STABLE */
                })
              ])
            ])
          ])
        ])
      ])
    ]);
  }
  const SearchHistory = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-54a2f8a1"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/search/SearchHistory.vue"]]);
  const _sfc_main$3 = {
    props: {
      searchResult: Object
    },
    components: {
      ArticleCard,
      UserCard
    },
    setup(props) {
      let searchResult = vue.ref();
      searchResult.value = props.searchResult;
      let userList = vue.ref([]);
      let articleList = vue.ref([]);
      const initialize = async () => {
        for (let i = 0; i < searchResult.value.user.length; i++) {
          let res = await getUserDetailBy(searchResult.value.user[i].u_id);
          userList.value.push(res.data);
        }
        for (let i = 0; i < searchResult.value.article.length; i++) {
          let res = await getArticleDetailByID(searchResult.value.article[i].article_id);
          articleList.value.push(res.data);
        }
        formatAppLog("log", "at components/home/search/SearchResult.vue:92", userList.value);
        formatAppLog("log", "at components/home/search/SearchResult.vue:93", articleList.value);
      };
      let loading = vue.ref(true);
      vue.onMounted(async () => {
        await initialize();
        loading.value = false;
      });
      uni.$on("search_change", async function(e) {
        loading.value = true;
        searchResult.value = e.searchResult;
        await initialize();
        loading.value = false;
      });
      let articleNavIndex = vue.ref(0);
      let articleNavColor = "#131313";
      let unArticleNavColor = "#a2a3ab";
      uni.$on("searchResult_follow_nav_change", function(e) {
        articleNavIndex.value = e.currentNavIndex;
      });
      const changeCurrentNavPage = (page) => {
        uni.$emit("searchResult_nav_change", { page });
      };
      let clickNavIndex = vue.ref();
      uni.$on("searchResult_nav_change", function(e) {
        clickNavIndex.value = e.page;
        formatAppLog("log", "at components/home/search/SearchResult.vue:126", clickNavIndex.value);
      });
      let currentIndex = vue.ref();
      const swiperItemChange = (e) => {
        currentIndex.value = e.detail.current;
        uni.$emit("searchResult_follow_nav_change", { currentNavIndex: currentIndex.value });
      };
      return {
        articleNavIndex,
        articleNavColor,
        unArticleNavColor,
        changeCurrentNavPage,
        clickNavIndex,
        swiperItemChange,
        searchResult,
        articleList,
        userList,
        loading
      };
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_ArticleCard = vue.resolveComponent("ArticleCard");
    const _component_UserCard = vue.resolveComponent("UserCard");
    return vue.openBlock(), vue.createElementBlock("view", { class: "w100 h100" }, [
      $setup.searchResult === " " ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "disF-center",
        style: { "flex-direction": "column", "margin-top": "40%" }
      }, [
        vue.createElementVNode("image", { src: "/static/images/utils/blank_page.png" }),
        vue.createElementVNode("view", { style: { "color": "#a0a0a0" } }, "没有任何搜索结果~...")
      ])) : vue.createCommentVNode("v-if", true),
      $setup.searchResult !== " " ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "actives__container w100 h100"
      }, [
        vue.createCommentVNode("          导航"),
        vue.createElementVNode("view", { class: "header__nav bg-efefef" }, [
          vue.createElementVNode("view", { class: "header__nav__container" }, [
            vue.createElementVNode(
              "view",
              {
                class: "header__nav__container--option",
                onClick: _cache[0] || (_cache[0] = ($event) => $setup.changeCurrentNavPage(0)),
                style: vue.normalizeStyle($setup.articleNavIndex === 0 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
              },
              " 文章 ",
              4
              /* STYLE */
            ),
            vue.createElementVNode(
              "view",
              {
                class: "header__nav__container--option",
                onClick: _cache[1] || (_cache[1] = ($event) => $setup.changeCurrentNavPage(1)),
                style: vue.normalizeStyle($setup.articleNavIndex === 1 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
              },
              " 用户 ",
              4
              /* STYLE */
            )
          ])
        ]),
        !$setup.loading ? (vue.openBlock(), vue.createElementBlock("swiper", {
          key: 0,
          style: { "width": "100%", "height": "100%" },
          autoplay: false,
          onChange: _cache[2] || (_cache[2] = ($event) => $setup.swiperItemChange($event)),
          current: $setup.clickNavIndex
        }, [
          vue.createElementVNode("swiper-item", null, [
            vue.createElementVNode("scroll-view", {
              class: "scrollview",
              "scroll-y": "true",
              style: `width: 100%;height: 100%;background: #f5f5f5;`
            }, [
              vue.createElementVNode("view", {
                class: "articleList__container__body w100",
                style: "padding-top: 2px;padding-bottom: 5px;"
              }, [
                $setup.articleList.length < 1 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "disF-center",
                  style: { "flex-direction": "column", "margin-top": "40%" }
                }, [
                  vue.createElementVNode("image", { src: "/static/images/utils/blank_page.png" }),
                  vue.createElementVNode("view", { style: { "color": "#a0a0a0" } }, "没有任何文章搜索结果~...")
                ])) : vue.createCommentVNode("v-if", true),
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.articleList, (item, index) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: index,
                      style: { "margin-bottom": "5px" }
                    }, [
                      vue.createVNode(_component_ArticleCard, {
                        "need-follow-model": true,
                        "article-data": item
                      }, null, 8, ["article-data"])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                vue.createElementVNode("view", {
                  class: "disF-center",
                  style: { "color": "#a0a0a0", "flex-direction": "column" }
                }, [
                  vue.createElementVNode("view", null, "已经到底了...")
                ])
              ])
            ])
          ]),
          vue.createElementVNode("swiper-item", null, [
            vue.createElementVNode("scroll-view", {
              class: "scrollview",
              "scroll-y": "true",
              style: `width: 100%;height: 100%;background: #f5f5f5;`
            }, [
              vue.createElementVNode("view", {
                class: "articleList__container__body w100",
                style: "padding-top: 2px;padding-bottom: 5px;"
              }, [
                $setup.userList.length < 1 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "disF-center",
                  style: { "flex-direction": "column", "margin-top": "40%" }
                }, [
                  vue.createElementVNode("image", { src: "/static/images/utils/blank_page.png" }),
                  vue.createElementVNode("view", { style: { "color": "#a0a0a0" } }, "没有任何用户搜索结果~...")
                ])) : vue.createCommentVNode("v-if", true),
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.userList, (item, index) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: index,
                      style: { "margin-bottom": "5px" }
                    }, [
                      vue.createVNode(_component_UserCard, { "user-obj": item }, null, 8, ["user-obj"])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                vue.createElementVNode("view", {
                  class: "disF-center",
                  style: { "color": "#a0a0a0", "flex-direction": "column" }
                }, [
                  vue.createElementVNode("view", null, "已经到底了...")
                ])
              ])
            ])
          ])
        ], 40, ["current"])) : vue.createCommentVNode("v-if", true)
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const SearchResult = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-7411b02c"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/search/SearchResult.vue"]]);
  const _sfc_main$2 = {
    components: {
      SearchHistory,
      SearchResult
    },
    setup() {
      let searching = vue.ref(true);
      let searchResult = vue.ref();
      let inputSearchDAta = vue.ref();
      const inputSearch = (e) => {
        inputSearchDAta.value = e.detail.value;
      };
      uni.$on("searchHistory_tap", async function(e) {
        inputSearchDAta.value = e.word;
        await sendSearch();
      });
      const sendSearch = async () => {
        if (!inputSearchDAta.value) {
          pageBack();
        } else {
          formatAppLog("log", "at pages/search/search.vue:73", "用户搜索" + inputSearchDAta.value);
          try {
            searching.value = false;
            let res = await getSearchByTerm(inputSearchDAta.value);
            if (res.code === 200) {
              searchResult.value = res.data;
              if (!searchResult.value) {
                searchResult.value = " ";
              }
              searching.value = true;
              uni.$emit("search_change", { searchResult: searchResult.value });
            } else {
              plus.nativeUI.toast(`搜索错误：${res.message}`);
            }
            inputSearchDAta.value = null;
          } catch (e) {
            plus.nativeUI.toast(`搜索报错：${e}`);
            inputSearchDAta.value = null;
          }
        }
      };
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      onBackPress((e) => {
        formatAppLog("log", "at pages/search/search.vue:105", "用户在搜索界面按了返回键盘");
        if (e.from === "backbutton") {
          pageBack();
          return true;
        } else if (e.from === "navigateBack") {
          return false;
        }
      });
      return {
        pageBack,
        inputSearch,
        sendSearch,
        inputSearchDAta,
        searchResult,
        searching
      };
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_SearchHistory = vue.resolveComponent("SearchHistory");
    const _component_SearchResult = vue.resolveComponent("SearchResult");
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createElementVNode("view", {
        class: "search__container",
        style: { "overflow": "hidden" }
      }, [
        vue.createCommentVNode("      头部"),
        vue.createElementVNode("view", { class: "search__container__header bg-efefef" }, [
          vue.createElementVNode("view", { class: "status-bar-height" }),
          vue.createElementVNode("view", { class: "search__container__header__input" }, [
            vue.createCommentVNode("        搜索图标"),
            vue.createElementVNode("view", { class: "search__container__header__input--icon" }, [
              vue.createVNode(_component_uni_icons, {
                type: "search",
                size: "30rpx",
                color: "#808080",
                style: { "margin-left": "20rpx" }
              })
            ]),
            vue.createElementVNode(
              "input",
              {
                class: "search__container__header__input--sub",
                focus: "true",
                "placeholder-class": "search__container__header__input--sub",
                "adjust-position": false,
                placeholder: "搜点什么...",
                onInput: _cache[0] || (_cache[0] = (...args) => $setup.inputSearch && $setup.inputSearch(...args))
              },
              null,
              32
              /* HYDRATE_EVENTS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: "search__container__header__input--cancel",
                onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $setup.sendSearch && $setup.sendSearch(...args), ["stop"]))
              },
              vue.toDisplayString($setup.inputSearchDAta ? "搜索" : "取消"),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "search__container__body" }, [
          !$setup.searchResult ? (vue.openBlock(), vue.createBlock(_component_SearchHistory, { key: 0 })) : vue.createCommentVNode("v-if", true),
          $setup.searchResult ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "search__container__body__result"
          }, [
            $setup.searching ? (vue.openBlock(), vue.createBlock(_component_SearchResult, {
              key: 0,
              "search-result": $setup.searchResult
            }, null, 8, ["search-result"])) : vue.createCommentVNode("v-if", true)
          ])) : vue.createCommentVNode("v-if", true)
        ])
      ])
    ]);
  }
  const PagesSearchSearch = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-c10c040c"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/search/search.vue"]]);
  const _sfc_main$1 = {
    components: {
      TopBar
    },
    setup() {
      let keyHeight = vue.ref(0);
      uni.onKeyboardHeightChange((obj) => {
        let _sysInfo = uni.getSystemInfoSync();
        let _heightDiff = _sysInfo.screenHeight - _sysInfo.windowHeight;
        let _diff = obj.height - _heightDiff;
        keyHeight.value = (_diff > 0 ? _diff : 0) - 2;
      });
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      let backButtonPress = vue.ref(0);
      onBackPress((e) => {
        formatAppLog("log", "at components/publish/Publish.vue:113", "用户在搜索界面按了返回键盘");
        if (e.from === "backbutton") {
          backButtonPress.value++;
          if (backButtonPress.value > 1) {
            pageBack();
          } else {
            plus.nativeUI.toast("再按一次退出编辑");
          }
          setTimeout(() => {
            backButtonPress.value = 0;
          }, 1500);
          return true;
        } else if (e.from === "navigateBack") {
          return false;
        }
      });
      vue.onMounted(() => {
        formatAppLog("log", "at components/publish/Publish.vue:136", "publish挂载完毕");
        getCategoryList().then((res) => {
          if (res.code == 200) {
            let tempList = res.data;
            categoryList.value = tempList.map((item) => ({
              value: item.class_id,
              text: item.class_name
            }));
            formatAppLog("log", "at components/publish/Publish.vue:145", categoryList.value);
          }
        });
      });
      let currentR = vue.ref("");
      const useUniEmitTabBarVisibilityUpdate = (b) => {
        uni.$emit("tabBarVisibilityUpdate", { tabBarVisibility: b });
        uni.$emit("currentRouterUpdate", { router: currentR.value });
      };
      let editorCtx = vue.ref();
      const onEditorReady = () => {
        uni.createSelectorQuery().in(this).select(".myEditor").fields({
          context: true
        }, (res) => {
          formatAppLog("log", "at components/publish/Publish.vue:165", res);
          editorCtx.value = res.context;
        }).exec();
      };
      let titleShow = vue.ref(false);
      const addTitle = () => {
        titleShow.value = !titleShow.value;
        editorCtx.value.format("header", titleShow.value ? "H2" : false);
      };
      let titleUnderline = vue.ref(false);
      const addUnderline = () => {
        titleUnderline.value = !titleUnderline.value;
        editorCtx.value.format("underline");
      };
      let titleBold = vue.ref(false);
      const addBold = () => {
        titleBold.value = !titleBold.value;
        editorCtx.value.format("bold");
      };
      const addImage = () => {
        uni.chooseImage({
          sizeType: ["original", "compressed"],
          count: 1,
          success(res) {
            formatAppLog("log", "at components/publish/Publish.vue:200", res.tempFilePaths[0]);
            uni.uploadFile({
              url: baseUrl + "upload/image",
              //域名+上传文件的请求接口 (根据你实际的接口来)
              filePath: res.tempFilePaths[0],
              // tempFilePath可以作为img标签的src属性显示图片 服务器图片的路径
              name: "image",
              //上传到服务器的参数，自定义
              header: {
                "Content-Type": "multipart/form-data",
                "authorization": uni.getStorageSync("token")
              },
              success(res2) {
                let data = JSON.parse(res2.data);
                formatAppLog("log", "at components/publish/Publish.vue:211", data);
                editorCtx.value.insertImage({
                  width: "100%",
                  //设置宽度为100%防止宽度溢出手机屏幕
                  height: "auto",
                  src: replaceUrlIP(data.imageUrl),
                  //服务端返回的url
                  alt: "图像",
                  success: function() {
                    formatAppLog("log", "at components/publish/Publish.vue:218", "insert image success");
                  }
                });
                formatAppLog("log", "at components/publish/Publish.vue:221", editorCtx.value);
              }
            });
          }
        });
      };
      const pushIt = () => {
        editorCtx.value.getContents({
          success: function(data) {
            data.text = data.text.replace(/[\r\n]+/g, enterWord);
            formatAppLog("log", "at components/publish/Publish.vue:234", data.text);
            let articleDataJson = {
              "title": titleValue.value,
              "text": data.text,
              "content": data.html,
              "category": categoryID.value
            };
            pushNewArticle(articleDataJson).then((res) => {
              formatAppLog("log", "at components/publish/Publish.vue:242", res);
              if (res.code == 200) {
                plus.nativeUI.toast(`发布成功`);
                pageBack();
              } else {
                plus.nativeUI.toast(`文章发布失败
              错误原因：${res.message}
              错误代码：${res.code}`);
              }
            }).catch((err) => {
              plus.nativeUI.toast(`文章发布发生异常
            原因：${err}`);
            });
          },
          fail: function(err) {
            formatAppLog("log", "at components/publish/Publish.vue:258", err);
          }
        });
      };
      let categoryID = vue.ref("1");
      let categoryList = vue.ref();
      const categoryChange = (e) => {
        formatAppLog("log", "at components/publish/Publish.vue:267", "类别发生了改变");
      };
      let titleValue = vue.ref();
      return {
        useUniEmitTabBarVisibilityUpdate,
        onEditorReady,
        pushIt,
        titleShow,
        addTitle,
        addUnderline,
        titleUnderline,
        addBold,
        titleBold,
        addImage,
        categoryID,
        categoryList,
        categoryChange,
        titleValue,
        keyHeight,
        pageBack
      };
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { id: "Publish" }, [
      vue.createElementVNode("view", { class: "publish" }, [
        vue.createElementVNode("view", { class: "publish__header" }, [
          vue.createElementVNode("view", { class: "publish__header__icon--back" }, [
            vue.createVNode(_component_uni_icons, {
              type: "back",
              size: "20",
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.pageBack())
            })
          ]),
          vue.createElementVNode("view", { class: "publish__header__button" }, [
            vue.createElementVNode("view", {
              class: "publish__header__button--publish",
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.pushIt($event))
            }, " 发布 ")
          ])
        ]),
        vue.createCommentVNode("      头部结束")
      ]),
      vue.createElementVNode("view", {
        class: "publish__body",
        style: { "padding": "10rpx 33rpx" }
      }, [
        vue.createElementVNode("view", null, [
          vue.createCommentVNode("        标题"),
          vue.createElementVNode("view", { class: "Title w100" }, [
            vue.createElementVNode("view", { class: "uni-input-wrapper" }, [
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "uni-input",
                  style: { "height": "3.125rem" },
                  placeholder: "标题（必填）",
                  onInput: _cache[2] || (_cache[2] = (...args) => _ctx.clearInput && _ctx.clearInput(...args)),
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.titleValue = $event),
                  "adjust-position": false
                },
                null,
                544
                /* HYDRATE_EVENTS, NEED_PATCH */
              ), [
                [vue.vModelText, $setup.titleValue]
              ])
            ])
          ]),
          vue.createCommentVNode("        编辑器"),
          vue.createElementVNode("view", { class: "content" }, [
            vue.createElementVNode(
              "editor",
              {
                class: "myEditor",
                placeholder: "请尽情发挥吧...",
                "show-img-size": "",
                "show-img-toolbar": "",
                "show-img-resize": "",
                onReady: _cache[4] || (_cache[4] = (...args) => $setup.onEditorReady && $setup.onEditorReady(...args)),
                style: vue.normalizeStyle(`height: calc(75vh - ${$setup.keyHeight}px);`)
              },
              null,
              36
              /* STYLE, HYDRATE_EVENTS */
            )
          ]),
          vue.createElementVNode("view", { class: "style__follow displayF displayJCSB border1S-surround" }, [
            vue.createElementVNode("view", { class: "editorStyle" }, [
              vue.createElementVNode("view", {
                class: "item",
                onClick: _cache[5] || (_cache[5] = (...args) => $setup.addTitle && $setup.addTitle(...args))
              }, [
                vue.createElementVNode("text", { class: "iconfont icon-zitibiaoti" })
              ]),
              vue.createElementVNode("view", {
                class: "item",
                onClick: _cache[6] || (_cache[6] = (...args) => $setup.addUnderline && $setup.addUnderline(...args))
              }, [
                vue.createElementVNode(
                  "text",
                  {
                    class: "iconfont icon-zitixiahuaxian",
                    style: vue.normalizeStyle($setup.titleUnderline ? "color:#0199fe;" : "color:#333333;")
                  },
                  null,
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", {
                class: "item",
                onClick: _cache[7] || (_cache[7] = (...args) => $setup.addBold && $setup.addBold(...args))
              }, [
                vue.createElementVNode(
                  "text",
                  {
                    class: "iconfont icon-zitijiacu",
                    style: vue.normalizeStyle($setup.titleBold ? "color:#0199fe;" : "color:#333333;")
                  },
                  null,
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", {
                class: "item",
                onClick: _cache[8] || (_cache[8] = (...args) => $setup.addImage && $setup.addImage(...args))
              }, [
                vue.createElementVNode("text", { class: "iconfont icon-shangchuantupian" })
              ])
            ]),
            vue.createCommentVNode("          类别"),
            vue.createElementVNode("view", { class: "category__select" }, [
              vue.createCommentVNode("            <uni-data-select"),
              vue.createCommentVNode('                v-model="categoryID"'),
              vue.createCommentVNode('                :localdata="categoryList"'),
              vue.createCommentVNode('                @change="categoryChange"'),
              vue.createCommentVNode('                placeholder="请选择类别"'),
              vue.createCommentVNode('                position="top"'),
              vue.createCommentVNode("            ></uni-data-select>")
            ])
          ])
        ])
      ])
    ]);
  }
  const Publish = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-42e07aa5"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/publish/Publish.vue"]]);
  const _sfc_main = {
    components: {
      Loading,
      Publish
    },
    setup() {
      vue.onMounted(() => {
      });
      return {};
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Publish = vue.resolveComponent("Publish", true);
    return vue.openBlock(), vue.createElementBlock("view", { class: "publishPage" }, [
      vue.createElementVNode("view", { class: "publishPage__container" }, [
        vue.createElementVNode("view", { class: "publishPage__container__header" }, [
          vue.createElementVNode("view", { style: { "height": "var(--status-bar-height)", "background": "#f9f9f9" } })
        ]),
        vue.createElementVNode("view", { class: "publishPage__container__body" }, [
          vue.createVNode(_component_Publish)
        ])
      ])
    ]);
  }
  const PagesPublishPublish = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-acfd9c67"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/publish/Publish.vue"]]);
  __definePage("pages/MainApp", PagesMainApp);
  __definePage("pages/article/detail/ArticleDetailPage", PagesArticleDetailArticleDetailPage);
  __definePage("pages/loginRegister/loginRegister", PagesLoginRegisterLoginRegister);
  __definePage("pages/testPage/testPage", PagesTestPageTestPage);
  __definePage("pages/search/search", PagesSearchSearch);
  __definePage("pages/publish/Publish", PagesPublishPublish);
  const store = createStore({
    state: {
      user: {}
    },
    getters: {
      getUser(state) {
        return state.user;
      }
    },
    mutations: {
      addUser(state, user) {
        state.user = user;
      }
    },
    actions: {
      addUser({ commit }, user) {
        commit("addUser", user);
      }
    },
    modules: {}
  });
  class myUtils {
    static sendMessageToScreen(data) {
      return sendMessageToScreen(data);
    }
  }
  function createApp() {
    const app = vue.createVueApp(App);
    app.config.globalProperties.myUtils = myUtils;
    app.use(store);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue, uni.VueShared);
