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
  const _sfc_main$w = {
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
  function _sfc_render$v(_ctx, _cache, $props, $setup, $data, $options) {
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
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$w, [["render", _sfc_render$v], ["__scopeId", "data-v-d31e1c47"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
  const _sfc_main$v = {
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
  function _sfc_render$u(_ctx, _cache, $props, $setup, $data, $options) {
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
  const TabBar = /* @__PURE__ */ _export_sfc(_sfc_main$v, [["render", _sfc_render$u], ["__scopeId", "data-v-270561e4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/common/TabBar.vue"]]);
  const _sfc_main$u = {
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
  function _sfc_render$t(_ctx, _cache, $props, $setup, $data, $options) {
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
  const TopBar = /* @__PURE__ */ _export_sfc(_sfc_main$u, [["render", _sfc_render$t], ["__scopeId", "data-v-35eb0c73"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/MainApp/TopBar.vue"]]);
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
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    const second = date.getSeconds().toString().padStart(2, "0");
    const millisecond = date.getMilliseconds().toString().padStart(3, "0");
    const formattedTime = `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}`;
    return formattedTime;
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
  const _sfc_main$t = {
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
  function _sfc_render$s(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "background": "#fff", "text-align": "center" } }, [
      $props.loading ? (vue.openBlock(), vue.createElementBlock("image", {
        key: 0,
        mode: "widthFix",
        src: "/static/images/utils/list_loading.gif",
        style: { "width": "90%", "height": "250rpx" }
      })) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const Loading = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["render", _sfc_render$s], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/loading/Loading.vue"]]);
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
  const _sfc_main$s = {
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
  function _sfc_render$r(_ctx, _cache, $props, $setup, $data, $options) {
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
  const ArticleCard = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["render", _sfc_render$r], ["__scopeId", "data-v-9eefd57b"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/ArticleCard.vue"]]);
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
  const _sfc_main$r = {
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
  function _sfc_render$q(_ctx, _cache, $props, $setup, $data, $options) {
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
  const ArticlesList = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["render", _sfc_render$q], ["__scopeId", "data-v-fc82db5d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/articlesList/ArticlesList.vue"]]);
  const _sfc_main$q = {
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
  function _sfc_render$p(_ctx, _cache, $props, $setup, $data, $options) {
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
  const Home = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["render", _sfc_render$p], ["__scopeId", "data-v-a0df4f3d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/home/Home.vue"]]);
  const _sfc_main$p = {
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
  function _sfc_render$o(_ctx, _cache, $props, $setup, $data, $options) {
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
  const Dynamic = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["render", _sfc_render$o], ["__scopeId", "data-v-508725f9"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/pyq/Dynamic.vue"]]);
  const _sfc_main$o = {
    name: "messageCard",
    props: {
      data: Object,
      id: String
    },
    setup(props) {
      let messageCardInfo = vue.ref(props.data);
      let id = vue.ref(props.id);
      const tapMessageCard = () => {
        formatAppLog("log", "at components/message/MessageCard.vue:52", "用户点击信息卡");
        if (id.value === "action") {
          formatAppLog("log", "at components/message/MessageCard.vue:54", "打开互动消息");
          uni.navigateTo({
            url: "/pages/message/ReactionMessage/ReactionMessage"
          });
        } else {
          uni.navigateTo({
            url: "/pages/message/PrivateMessage/PrivateMessage"
          });
        }
      };
      return {
        messageCardInfo,
        tapMessageCard
      };
    }
  };
  function _sfc_render$n(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      style: { "width": "100%", "height": "120rpx", "background": "#F5F5F5", "padding": "10rpx", "display": "flex", "align-items": "center" },
      onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $setup.tapMessageCard && $setup.tapMessageCard(...args), ["stop"]))
    }, [
      vue.createElementVNode("view", { class: "messageCard__body" }, [
        vue.createElementVNode("view", { class: "messageCard__body__left" }, [
          vue.createElementVNode("view", { class: "messageCard__body__head" }, [
            vue.createElementVNode(
              "view",
              {
                class: "messageCard__body__head--img",
                style: vue.normalizeStyle("background-image: url(" + $setup.messageCardInfo.headImg + ")")
              },
              null,
              4
              /* STYLE */
            )
          ]),
          vue.createElementVNode("view", { class: "messageCard__body__info" }, [
            vue.createElementVNode("view", { class: "messageCard__body__info__name" }, [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($setup.messageCardInfo.name),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "messageCard__body__info__message" }, [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($setup.messageCardInfo.message),
                1
                /* TEXT */
              )
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "messageCard__body__right" }, [
          vue.createElementVNode("view", { class: "messageCard__body__right--time" }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($setup.messageCardInfo.time),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "messageCard__body__right--num" }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($setup.messageCardInfo.num),
              1
              /* TEXT */
            )
          ])
        ])
      ])
    ]);
  }
  const MessageCard = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["render", _sfc_render$n], ["__scopeId", "data-v-4762ac38"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/message/MessageCard.vue"]]);
  const _sfc_main$n = {
    components: {
      MessageCard
    },
    setup() {
      vue.onMounted(() => {
      });
      return {};
    }
  };
  function _sfc_render$m(_ctx, _cache, $props, $setup, $data, $options) {
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
                vue.createVNode(_component_MessageCard, {
                  data: {
                    headImg: "http://114.115.220.47:3000/api/download/images/action.png",
                    name: "互动消息",
                    message: "xx关注了你",
                    time: "2023-6-19",
                    num: 4
                  },
                  id: "action"
                }, null, 8, ["data"]),
                vue.createVNode(_component_MessageCard, {
                  data: {
                    headImg: "http://114.115.220.47:3000/api/download/images/action.png",
                    name: "气温",
                    message: "气温",
                    time: "2023-6-19",
                    num: 4
                  },
                  id: "123"
                }, null, 8, ["data"])
              ])
            ])
          ])
        ])
      ])
    ]);
  }
  const Message = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["render", _sfc_render$m], ["__scopeId", "data-v-6b9d1851"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/message/Message.vue"]]);
  const _sfc_main$m = {
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
  function _sfc_render$l(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { id: "Mine" }, " 这是我的页 ");
  }
  const Mine = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["render", _sfc_render$l], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/mine/Mine.vue"]]);
  const _sfc_main$l = {
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
  function _sfc_render$k(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesMainApp = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$k], ["__scopeId", "data-v-dc27c07e"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/MainApp.vue"]]);
  const _sfc_main$k = {
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
  const App = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/App.vue"]]);
  const _sfc_main$j = {
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
  function _sfc_render$j(_ctx, _cache, $props, $setup, $data, $options) {
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
  const CommentCard = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$j], ["__scopeId", "data-v-1acd372d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentCard.vue"]]);
  const _sfc_main$i = {
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
  function _sfc_render$i(_ctx, _cache, $props, $setup, $data, $options) {
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
  const CommentExpand = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$i], ["__scopeId", "data-v-b72a798a"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentExpand.vue"]]);
  const _sfc_main$h = {
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
  function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
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
  const CommentReplyWindow = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$h], ["__scopeId", "data-v-31eef9f2"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentReplyWindow.vue"]]);
  const _sfc_main$g = {
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
  function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
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
  const CommentList = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$g], ["__scopeId", "data-v-404a4e6d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentList.vue"]]);
  const _sfc_main$f = {
    props: {
      needFollowModel: Boolean
    },
    components: { CommentList, Loading, App },
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
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
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
  const ArticleDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$f], ["__scopeId", "data-v-388cd4fe"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/ArticleDetailPage.vue"]]);
  const _sfc_main$e = {
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
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesArticleDetailArticleDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$e], ["__scopeId", "data-v-b0178992"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/article/detail/ArticleDetailPage.vue"]]);
  const _sfc_main$d = {
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
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesLoginRegisterLoginRegister = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$d], ["__scopeId", "data-v-ed6efab4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/loginRegister/loginRegister.vue"]]);
  const _sfc_main$c = {
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
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
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
  const UserCard = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$c], ["__scopeId", "data-v-c99219be"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/user/UserCard.vue"]]);
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var uniSocket_ioExports = {};
  var uniSocket_io = {
    get exports() {
      return uniSocket_ioExports;
    },
    set exports(v) {
      uniSocket_ioExports = v;
    }
  };
  (function(module, exports) {
    !function(t, e) {
      module.exports = e();
    }(window, function() {
      return function(t) {
        var e = {};
        function n(r) {
          if (e[r])
            return e[r].exports;
          var o = e[r] = { i: r, l: false, exports: {} };
          return t[r].call(o.exports, o, o.exports, n), o.l = true, o.exports;
        }
        return n.m = t, n.c = e, n.d = function(t2, e2, r) {
          n.o(t2, e2) || Object.defineProperty(t2, e2, { enumerable: true, get: r });
        }, n.r = function(t2) {
          "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t2, "__esModule", { value: true });
        }, n.t = function(t2, e2) {
          if (1 & e2 && (t2 = n(t2)), 8 & e2)
            return t2;
          if (4 & e2 && "object" == typeof t2 && t2 && t2.__esModule)
            return t2;
          var r = /* @__PURE__ */ Object.create(null);
          if (n.r(r), Object.defineProperty(r, "default", { enumerable: true, value: t2 }), 2 & e2 && "string" != typeof t2)
            for (var o in t2)
              n.d(r, o, function(e3) {
                return t2[e3];
              }.bind(null, o));
          return r;
        }, n.n = function(t2) {
          var e2 = t2 && t2.__esModule ? function() {
            return t2.default;
          } : function() {
            return t2;
          };
          return n.d(e2, "a", e2), e2;
        }, n.o = function(t2, e2) {
          return Object.prototype.hasOwnProperty.call(t2, e2);
        }, n.p = "", n(n.s = 18);
      }([function(t, e) {
        t.exports = function() {
          return function() {
          };
        };
      }, function(t, e, n) {
        function r(t2) {
          if (t2)
            return function(t3) {
              for (var e2 in r.prototype)
                t3[e2] = r.prototype[e2];
              return t3;
            }(t2);
        }
        t.exports = r, r.prototype.on = r.prototype.addEventListener = function(t2, e2) {
          return this._callbacks = this._callbacks || {}, (this._callbacks["$" + t2] = this._callbacks["$" + t2] || []).push(e2), this;
        }, r.prototype.once = function(t2, e2) {
          function n2() {
            this.off(t2, n2), e2.apply(this, arguments);
          }
          return n2.fn = e2, this.on(t2, n2), this;
        }, r.prototype.off = r.prototype.removeListener = r.prototype.removeAllListeners = r.prototype.removeEventListener = function(t2, e2) {
          if (this._callbacks = this._callbacks || {}, 0 == arguments.length)
            return this._callbacks = {}, this;
          var n2, r2 = this._callbacks["$" + t2];
          if (!r2)
            return this;
          if (1 == arguments.length)
            return delete this._callbacks["$" + t2], this;
          for (var o = 0; o < r2.length; o++)
            if ((n2 = r2[o]) === e2 || n2.fn === e2) {
              r2.splice(o, 1);
              break;
            }
          return 0 === r2.length && delete this._callbacks["$" + t2], this;
        }, r.prototype.emit = function(t2) {
          this._callbacks = this._callbacks || {};
          for (var e2 = new Array(arguments.length - 1), n2 = this._callbacks["$" + t2], r2 = 1; r2 < arguments.length; r2++)
            e2[r2 - 1] = arguments[r2];
          if (n2) {
            r2 = 0;
            for (var o = (n2 = n2.slice(0)).length; r2 < o; ++r2)
              n2[r2].apply(this, e2);
          }
          return this;
        }, r.prototype.listeners = function(t2) {
          return this._callbacks = this._callbacks || {}, this._callbacks["$" + t2] || [];
        }, r.prototype.hasListeners = function(t2) {
          return !!this.listeners(t2).length;
        };
      }, function(t, e, n) {
        const r = n(25), o = n(26), s = String.fromCharCode(30);
        t.exports = { protocol: 4, encodePacket: r, encodePayload: (t2, e2) => {
          const n2 = t2.length, o2 = new Array(n2);
          let i = 0;
          t2.forEach((t3, a) => {
            r(t3, false, (t4) => {
              o2[a] = t4, ++i === n2 && e2(o2.join(s));
            });
          });
        }, decodePacket: o, decodePayload: (t2, e2) => {
          const n2 = t2.split(s), r2 = [];
          for (let t3 = 0; t3 < n2.length; t3++) {
            const s2 = o(n2[t3], e2);
            if (r2.push(s2), "error" === s2.type)
              break;
          }
          return r2;
        } };
      }, function(t, e) {
        t.exports = "undefined" != typeof self ? self : "undefined" != typeof window ? window : Function("return this")();
      }, function(t, e, n) {
        const r = n(2), o = n(1), s = n(0)("engine.io-client:transport");
        t.exports = class extends o {
          constructor(t2) {
            super(), this.opts = t2, this.query = t2.query, this.readyState = "", this.socket = t2.socket;
          }
          onError(t2, e2) {
            const n2 = new Error(t2);
            return n2.type = "TransportError", n2.description = e2, this.emit("error", n2), this;
          }
          open() {
            return "closed" !== this.readyState && "" !== this.readyState || (this.readyState = "opening", this.doOpen()), this;
          }
          close() {
            return "opening" !== this.readyState && "open" !== this.readyState || (this.doClose(), this.onClose()), this;
          }
          send(t2) {
            "open" === this.readyState ? this.write(t2) : s("transport is not open, discarding packets");
          }
          onOpen() {
            this.readyState = "open", this.writable = true, this.emit("open");
          }
          onData(t2) {
            const e2 = r.decodePacket(t2, this.socket.binaryType);
            this.onPacket(e2);
          }
          onPacket(t2) {
            this.emit("packet", t2);
          }
          onClose() {
            this.readyState = "closed", this.emit("close");
          }
        };
      }, function(t, e) {
        e.encode = function(t2) {
          var e2 = "";
          for (var n in t2)
            t2.hasOwnProperty(n) && (e2.length && (e2 += "&"), e2 += encodeURIComponent(n) + "=" + encodeURIComponent(t2[n]));
          return e2;
        }, e.decode = function(t2) {
          for (var e2 = {}, n = t2.split("&"), r = 0, o = n.length; r < o; r++) {
            var s = n[r].split("=");
            e2[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
          }
          return e2;
        };
      }, function(t, e, n) {
        Object.defineProperty(e, "__esModule", { value: true }), e.Decoder = e.Encoder = e.PacketType = e.protocol = void 0;
        const r = n(1), o = n(38), s = n(16), i = n(0)("socket.io-parser");
        var a;
        e.protocol = 5, function(t2) {
          t2[t2.CONNECT = 0] = "CONNECT", t2[t2.DISCONNECT = 1] = "DISCONNECT", t2[t2.EVENT = 2] = "EVENT", t2[t2.ACK = 3] = "ACK", t2[t2.CONNECT_ERROR = 4] = "CONNECT_ERROR", t2[t2.BINARY_EVENT = 5] = "BINARY_EVENT", t2[t2.BINARY_ACK = 6] = "BINARY_ACK";
        }(a = e.PacketType || (e.PacketType = {}));
        e.Encoder = class {
          encode(t2) {
            return i("encoding packet %j", t2), t2.type !== a.EVENT && t2.type !== a.ACK || !s.hasBinary(t2) ? [this.encodeAsString(t2)] : (t2.type = t2.type === a.EVENT ? a.BINARY_EVENT : a.BINARY_ACK, this.encodeAsBinary(t2));
          }
          encodeAsString(t2) {
            let e2 = "" + t2.type;
            return t2.type !== a.BINARY_EVENT && t2.type !== a.BINARY_ACK || (e2 += t2.attachments + "-"), t2.nsp && "/" !== t2.nsp && (e2 += t2.nsp + ","), null != t2.id && (e2 += t2.id), null != t2.data && (e2 += JSON.stringify(t2.data)), i("encoded %j as %s", t2, e2), e2;
          }
          encodeAsBinary(t2) {
            const e2 = o.deconstructPacket(t2), n2 = this.encodeAsString(e2.packet), r2 = e2.buffers;
            return r2.unshift(n2), r2;
          }
        };
        class c extends r {
          constructor() {
            super();
          }
          add(t2) {
            let e2;
            if ("string" == typeof t2)
              e2 = this.decodeString(t2), e2.type === a.BINARY_EVENT || e2.type === a.BINARY_ACK ? (this.reconstructor = new h(e2), 0 === e2.attachments && super.emit("decoded", e2)) : super.emit("decoded", e2);
            else {
              if (!s.isBinary(t2) && !t2.base64)
                throw new Error("Unknown type: " + t2);
              if (!this.reconstructor)
                throw new Error("got binary data when not reconstructing a packet");
              e2 = this.reconstructor.takeBinaryData(t2), e2 && (this.reconstructor = null, super.emit("decoded", e2));
            }
          }
          decodeString(t2) {
            let e2 = 0;
            const n2 = { type: Number(t2.charAt(0)) };
            if (void 0 === a[n2.type])
              throw new Error("unknown packet type " + n2.type);
            if (n2.type === a.BINARY_EVENT || n2.type === a.BINARY_ACK) {
              const r3 = e2 + 1;
              for (; "-" !== t2.charAt(++e2) && e2 != t2.length; )
                ;
              const o2 = t2.substring(r3, e2);
              if (o2 != Number(o2) || "-" !== t2.charAt(e2))
                throw new Error("Illegal attachments");
              n2.attachments = Number(o2);
            }
            if ("/" === t2.charAt(e2 + 1)) {
              const r3 = e2 + 1;
              for (; ++e2; ) {
                if ("," === t2.charAt(e2))
                  break;
                if (e2 === t2.length)
                  break;
              }
              n2.nsp = t2.substring(r3, e2);
            } else
              n2.nsp = "/";
            const r2 = t2.charAt(e2 + 1);
            if ("" !== r2 && Number(r2) == r2) {
              const r3 = e2 + 1;
              for (; ++e2; ) {
                const n3 = t2.charAt(e2);
                if (null == n3 || Number(n3) != n3) {
                  --e2;
                  break;
                }
                if (e2 === t2.length)
                  break;
              }
              n2.id = Number(t2.substring(r3, e2 + 1));
            }
            if (t2.charAt(++e2)) {
              const r3 = function(t3) {
                try {
                  return JSON.parse(t3);
                } catch (t4) {
                  return false;
                }
              }(t2.substr(e2));
              if (!c.isPayloadValid(n2.type, r3))
                throw new Error("invalid payload");
              n2.data = r3;
            }
            return i("decoded %s as %j", t2, n2), n2;
          }
          static isPayloadValid(t2, e2) {
            switch (t2) {
              case a.CONNECT:
                return "object" == typeof e2;
              case a.DISCONNECT:
                return void 0 === e2;
              case a.CONNECT_ERROR:
                return "string" == typeof e2 || "object" == typeof e2;
              case a.EVENT:
              case a.BINARY_EVENT:
                return Array.isArray(e2) && "string" == typeof e2[0];
              case a.ACK:
              case a.BINARY_ACK:
                return Array.isArray(e2);
            }
          }
          destroy() {
            this.reconstructor && this.reconstructor.finishedReconstruction();
          }
        }
        e.Decoder = c;
        class h {
          constructor(t2) {
            this.packet = t2, this.buffers = [], this.reconPack = t2;
          }
          takeBinaryData(t2) {
            if (this.buffers.push(t2), this.buffers.length === this.reconPack.attachments) {
              const t3 = o.reconstructPacket(this.reconPack, this.buffers);
              return this.finishedReconstruction(), t3;
            }
            return null;
          }
          finishedReconstruction() {
            this.reconPack = null, this.buffers = [];
          }
        }
      }, function(t, e) {
        var n = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, r = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
        t.exports = function(t2) {
          var e2 = t2, o = t2.indexOf("["), s = t2.indexOf("]");
          -1 != o && -1 != s && (t2 = t2.substring(0, o) + t2.substring(o, s).replace(/:/g, ";") + t2.substring(s, t2.length));
          for (var i, a, c = n.exec(t2 || ""), h = {}, u = 14; u--; )
            h[r[u]] = c[u] || "";
          return -1 != o && -1 != s && (h.source = e2, h.host = h.host.substring(1, h.host.length - 1).replace(/;/g, ":"), h.authority = h.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), h.ipv6uri = true), h.pathNames = function(t3, e3) {
            var n2 = e3.replace(/\/{2,9}/g, "/").split("/");
            "/" != e3.substr(0, 1) && 0 !== e3.length || n2.splice(0, 1);
            "/" == e3.substr(e3.length - 1, 1) && n2.splice(n2.length - 1, 1);
            return n2;
          }(0, h.path), h.queryKey = (i = h.query, a = {}, i.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(t3, e3, n2) {
            e3 && (a[e3] = n2);
          }), a), h;
        };
      }, function(t, e, n) {
        Object.defineProperty(e, "__esModule", { value: true }), e.Manager = void 0;
        const r = n(21), o = n(15), s = n(1), i = n(6), a = n(17), c = n(39), h = n(0)("socket.io-client:manager");
        e.Manager = class extends s {
          constructor(t2, e2) {
            super(), this.nsps = {}, this.subs = [], t2 && "object" == typeof t2 && (e2 = t2, t2 = void 0), (e2 = e2 || {}).path = e2.path || "/socket.io", this.opts = e2, this.reconnection(false !== e2.reconnection), this.reconnectionAttempts(e2.reconnectionAttempts || 1 / 0), this.reconnectionDelay(e2.reconnectionDelay || 1e3), this.reconnectionDelayMax(e2.reconnectionDelayMax || 5e3), this.randomizationFactor(e2.randomizationFactor || 0.5), this.backoff = new c({ min: this.reconnectionDelay(), max: this.reconnectionDelayMax(), jitter: this.randomizationFactor() }), this.timeout(null == e2.timeout ? 2e4 : e2.timeout), this._readyState = "closed", this.uri = t2;
            const n2 = e2.parser || i;
            this.encoder = new n2.Encoder(), this.decoder = new n2.Decoder(), this._autoConnect = false !== e2.autoConnect, this._autoConnect && this.open();
          }
          reconnection(t2) {
            return arguments.length ? (this._reconnection = !!t2, this) : this._reconnection;
          }
          reconnectionAttempts(t2) {
            return void 0 === t2 ? this._reconnectionAttempts : (this._reconnectionAttempts = t2, this);
          }
          reconnectionDelay(t2) {
            var e2;
            return void 0 === t2 ? this._reconnectionDelay : (this._reconnectionDelay = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setMin(t2), this);
          }
          randomizationFactor(t2) {
            var e2;
            return void 0 === t2 ? this._randomizationFactor : (this._randomizationFactor = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setJitter(t2), this);
          }
          reconnectionDelayMax(t2) {
            var e2;
            return void 0 === t2 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setMax(t2), this);
          }
          timeout(t2) {
            return arguments.length ? (this._timeout = t2, this) : this._timeout;
          }
          maybeReconnectOnOpen() {
            !this._reconnecting && this._reconnection && 0 === this.backoff.attempts && this.reconnect();
          }
          open(t2) {
            if (h("readyState %s", this._readyState), ~this._readyState.indexOf("open"))
              return this;
            h("opening %s", this.uri), this.engine = r(this.uri, this.opts);
            const e2 = this.engine, n2 = this;
            this._readyState = "opening", this.skipReconnect = false;
            const o2 = a.on(e2, "open", function() {
              n2.onopen(), t2 && t2();
            }), s2 = a.on(e2, "error", (e3) => {
              h("error"), n2.cleanup(), n2._readyState = "closed", super.emit("error", e3), t2 ? t2(e3) : n2.maybeReconnectOnOpen();
            });
            if (false !== this._timeout) {
              const t3 = this._timeout;
              h("connect attempt will timeout after %d", t3), 0 === t3 && o2();
              const n3 = setTimeout(() => {
                h("connect attempt timed out after %d", t3), o2(), e2.close(), e2.emit("error", new Error("timeout"));
              }, t3);
              this.subs.push(function() {
                clearTimeout(n3);
              });
            }
            return this.subs.push(o2), this.subs.push(s2), this;
          }
          connect(t2) {
            return this.open(t2);
          }
          onopen() {
            h("open"), this.cleanup(), this._readyState = "open", super.emit("open");
            const t2 = this.engine;
            this.subs.push(a.on(t2, "ping", this.onping.bind(this)), a.on(t2, "data", this.ondata.bind(this)), a.on(t2, "error", this.onerror.bind(this)), a.on(t2, "close", this.onclose.bind(this)), a.on(this.decoder, "decoded", this.ondecoded.bind(this)));
          }
          onping() {
            super.emit("ping");
          }
          ondata(t2) {
            this.decoder.add(t2);
          }
          ondecoded(t2) {
            super.emit("packet", t2);
          }
          onerror(t2) {
            h("error", t2), super.emit("error", t2);
          }
          socket(t2, e2) {
            let n2 = this.nsps[t2];
            return n2 || (n2 = new o.Socket(this, t2, e2), this.nsps[t2] = n2), n2;
          }
          _destroy(t2) {
            const e2 = Object.keys(this.nsps);
            for (const t3 of e2) {
              if (this.nsps[t3].active)
                return void h("socket %s is still active, skipping close", t3);
            }
            this._close();
          }
          _packet(t2) {
            h("writing packet %j", t2), t2.query && 0 === t2.type && (t2.nsp += "?" + t2.query);
            const e2 = this.encoder.encode(t2);
            for (let n2 = 0; n2 < e2.length; n2++)
              this.engine.write(e2[n2], t2.options);
          }
          cleanup() {
            h("cleanup"), this.subs.forEach((t2) => t2()), this.subs.length = 0, this.decoder.destroy();
          }
          _close() {
            h("disconnect"), this.skipReconnect = true, this._reconnecting = false, "opening" === this._readyState && this.cleanup(), this.backoff.reset(), this._readyState = "closed", this.engine && this.engine.close();
          }
          disconnect() {
            return this._close();
          }
          onclose(t2) {
            h("onclose"), this.cleanup(), this.backoff.reset(), this._readyState = "closed", super.emit("close", t2), this._reconnection && !this.skipReconnect && this.reconnect();
          }
          reconnect() {
            if (this._reconnecting || this.skipReconnect)
              return this;
            const t2 = this;
            if (this.backoff.attempts >= this._reconnectionAttempts)
              h("reconnect failed"), this.backoff.reset(), super.emit("reconnect_failed"), this._reconnecting = false;
            else {
              const e2 = this.backoff.duration();
              h("will wait %dms before reconnect attempt", e2), this._reconnecting = true;
              const n2 = setTimeout(() => {
                t2.skipReconnect || (h("attempting reconnect"), super.emit("reconnect_attempt", t2.backoff.attempts), t2.skipReconnect || t2.open((e3) => {
                  e3 ? (h("reconnect attempt error"), t2._reconnecting = false, t2.reconnect(), super.emit("reconnect_error", e3)) : (h("reconnect success"), t2.onreconnect());
                }));
              }, e2);
              this.subs.push(function() {
                clearTimeout(n2);
              });
            }
          }
          onreconnect() {
            const t2 = this.backoff.attempts;
            this._reconnecting = false, this.backoff.reset(), super.emit("reconnect", t2);
          }
        };
      }, function(t, e, n) {
        const r = n(10), o = n(24), s = n(28), i = n(29);
        e.polling = function(t2) {
          let e2, n2 = false, i2 = false;
          const a = false !== t2.jsonp;
          if ("undefined" != typeof location) {
            const e3 = "https:" === location.protocol;
            let r2 = location.port;
            r2 || (r2 = e3 ? 443 : 80), n2 = t2.hostname !== location.hostname || r2 !== t2.port, i2 = t2.secure !== e3;
          }
          if (t2.xdomain = n2, t2.xscheme = i2, e2 = new r(t2), "open" in e2 && !t2.forceJSONP)
            return new o(t2);
          if (!a)
            throw new Error("JSONP disabled");
          return new s(t2);
        }, e.websocket = i;
      }, function(t, e, n) {
        const r = n(23), o = n(3);
        t.exports = function(t2) {
          const e2 = t2.xdomain, n2 = t2.xscheme, s = t2.enablesXDR;
          try {
            if ("undefined" != typeof XMLHttpRequest && (!e2 || r))
              return new XMLHttpRequest();
          } catch (t3) {
          }
          try {
            if ("undefined" != typeof XDomainRequest && !n2 && s)
              return new XDomainRequest();
          } catch (t3) {
          }
          if (!e2)
            try {
              return new o[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
            } catch (t3) {
            }
        };
      }, function(t, e, n) {
        const r = n(4), o = n(5), s = n(2), i = n(13), a = n(0)("engine.io-client:polling");
        t.exports = class extends r {
          get name() {
            return "polling";
          }
          doOpen() {
            this.poll();
          }
          pause(t2) {
            const e2 = this;
            function n2() {
              a("paused"), e2.readyState = "paused", t2();
            }
            if (this.readyState = "pausing", this.polling || !this.writable) {
              let t3 = 0;
              this.polling && (a("we are currently polling - waiting to pause"), t3++, this.once("pollComplete", function() {
                a("pre-pause polling complete"), --t3 || n2();
              })), this.writable || (a("we are currently writing - waiting to pause"), t3++, this.once("drain", function() {
                a("pre-pause writing complete"), --t3 || n2();
              }));
            } else
              n2();
          }
          poll() {
            a("polling"), this.polling = true, this.doPoll(), this.emit("poll");
          }
          onData(t2) {
            const e2 = this;
            a("polling got data %s", t2);
            s.decodePayload(t2, this.socket.binaryType).forEach(function(t3, n2, r2) {
              if ("opening" === e2.readyState && "open" === t3.type && e2.onOpen(), "close" === t3.type)
                return e2.onClose(), false;
              e2.onPacket(t3);
            }), "closed" !== this.readyState && (this.polling = false, this.emit("pollComplete"), "open" === this.readyState ? this.poll() : a('ignoring poll - transport state "%s"', this.readyState));
          }
          doClose() {
            const t2 = this;
            function e2() {
              a("writing close packet"), t2.write([{ type: "close" }]);
            }
            "open" === this.readyState ? (a("transport open - closing"), e2()) : (a("transport not open - deferring close"), this.once("open", e2));
          }
          write(t2) {
            this.writable = false, s.encodePayload(t2, (t3) => {
              this.doWrite(t3, () => {
                this.writable = true, this.emit("drain");
              });
            });
          }
          uri() {
            let t2 = this.query || {};
            const e2 = this.opts.secure ? "https" : "http";
            let n2 = "";
            false !== this.opts.timestampRequests && (t2[this.opts.timestampParam] = i()), this.supportsBinary || t2.sid || (t2.b64 = 1), t2 = o.encode(t2), this.opts.port && ("https" === e2 && 443 !== Number(this.opts.port) || "http" === e2 && 80 !== Number(this.opts.port)) && (n2 = ":" + this.opts.port), t2.length && (t2 = "?" + t2);
            return e2 + "://" + (-1 !== this.opts.hostname.indexOf(":") ? "[" + this.opts.hostname + "]" : this.opts.hostname) + n2 + this.opts.path + t2;
          }
        };
      }, function(t, e) {
        const n = /* @__PURE__ */ Object.create(null);
        n.open = "0", n.close = "1", n.ping = "2", n.pong = "3", n.message = "4", n.upgrade = "5", n.noop = "6";
        const r = /* @__PURE__ */ Object.create(null);
        Object.keys(n).forEach((t2) => {
          r[n[t2]] = t2;
        });
        t.exports = { PACKET_TYPES: n, PACKET_TYPES_REVERSE: r, ERROR_PACKET: { type: "error", data: "parser error" } };
      }, function(t, e, n) {
        var r, o = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""), s = {}, i = 0, a = 0;
        function c(t2) {
          var e2 = "";
          do {
            e2 = o[t2 % 64] + e2, t2 = Math.floor(t2 / 64);
          } while (t2 > 0);
          return e2;
        }
        function h() {
          var t2 = c(+new Date());
          return t2 !== r ? (i = 0, r = t2) : t2 + "." + c(i++);
        }
        for (; a < 64; a++)
          s[o[a]] = a;
        h.encode = c, h.decode = function(t2) {
          var e2 = 0;
          for (a = 0; a < t2.length; a++)
            e2 = 64 * e2 + s[t2.charAt(a)];
          return e2;
        }, t.exports = h;
      }, function(t, e) {
        t.exports.pick = (t2, ...e2) => e2.reduce((e3, n) => (t2.hasOwnProperty(n) && (e3[n] = t2[n]), e3), {});
      }, function(t, e, n) {
        Object.defineProperty(e, "__esModule", { value: true }), e.Socket = void 0;
        const r = n(6), o = n(1), s = n(17), i = n(0)("socket.io-client:socket"), a = Object.freeze({ connect: 1, connect_error: 1, disconnect: 1, disconnecting: 1, newListener: 1, removeListener: 1 });
        e.Socket = class extends o {
          constructor(t2, e2, n2) {
            super(), this.receiveBuffer = [], this.sendBuffer = [], this.ids = 0, this.acks = {}, this.flags = {}, this.io = t2, this.nsp = e2, this.ids = 0, this.acks = {}, this.receiveBuffer = [], this.sendBuffer = [], this.connected = false, this.disconnected = true, this.flags = {}, n2 && n2.auth && (this.auth = n2.auth), this.io._autoConnect && this.open();
          }
          subEvents() {
            if (this.subs)
              return;
            const t2 = this.io;
            this.subs = [s.on(t2, "open", this.onopen.bind(this)), s.on(t2, "packet", this.onpacket.bind(this)), s.on(t2, "error", this.onerror.bind(this)), s.on(t2, "close", this.onclose.bind(this))];
          }
          get active() {
            return !!this.subs;
          }
          connect() {
            return this.connected || (this.subEvents(), this.io._reconnecting || this.io.open(), "open" === this.io._readyState && this.onopen()), this;
          }
          open() {
            return this.connect();
          }
          send(...t2) {
            return t2.unshift("message"), this.emit.apply(this, t2), this;
          }
          emit(t2, ...e2) {
            if (a.hasOwnProperty(t2))
              throw new Error('"' + t2 + '" is a reserved event name');
            e2.unshift(t2);
            const n2 = { type: r.PacketType.EVENT, data: e2, options: {} };
            n2.options.compress = false !== this.flags.compress, "function" == typeof e2[e2.length - 1] && (i("emitting packet with ack id %d", this.ids), this.acks[this.ids] = e2.pop(), n2.id = this.ids++);
            const o2 = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
            return this.flags.volatile && (!o2 || !this.connected) ? i("discard packet as the transport is not currently writable") : this.connected ? this.packet(n2) : this.sendBuffer.push(n2), this.flags = {}, this;
          }
          packet(t2) {
            t2.nsp = this.nsp, this.io._packet(t2);
          }
          onopen() {
            i("transport is open - connecting"), "function" == typeof this.auth ? this.auth((t2) => {
              this.packet({ type: r.PacketType.CONNECT, data: t2 });
            }) : this.packet({ type: r.PacketType.CONNECT, data: this.auth });
          }
          onerror(t2) {
            this.connected || super.emit("connect_error", t2);
          }
          onclose(t2) {
            i("close (%s)", t2), this.connected = false, this.disconnected = true, delete this.id, super.emit("disconnect", t2);
          }
          onpacket(t2) {
            if (t2.nsp === this.nsp)
              switch (t2.type) {
                case r.PacketType.CONNECT:
                  if (t2.data && t2.data.sid) {
                    const e3 = t2.data.sid;
                    this.onconnect(e3);
                  } else
                    super.emit("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                  break;
                case r.PacketType.EVENT:
                case r.PacketType.BINARY_EVENT:
                  this.onevent(t2);
                  break;
                case r.PacketType.ACK:
                case r.PacketType.BINARY_ACK:
                  this.onack(t2);
                  break;
                case r.PacketType.DISCONNECT:
                  this.ondisconnect();
                  break;
                case r.PacketType.CONNECT_ERROR:
                  const e2 = new Error(t2.data.message);
                  e2.data = t2.data.data, super.emit("connect_error", e2);
              }
          }
          onevent(t2) {
            const e2 = t2.data || [];
            i("emitting event %j", e2), null != t2.id && (i("attaching ack callback to event"), e2.push(this.ack(t2.id))), this.connected ? this.emitEvent(e2) : this.receiveBuffer.push(Object.freeze(e2));
          }
          emitEvent(t2) {
            if (this._anyListeners && this._anyListeners.length) {
              const e2 = this._anyListeners.slice();
              for (const n2 of e2)
                n2.apply(this, t2);
            }
            super.emit.apply(this, t2);
          }
          ack(t2) {
            const e2 = this;
            let n2 = false;
            return function(...o2) {
              n2 || (n2 = true, i("sending ack %j", o2), e2.packet({ type: r.PacketType.ACK, id: t2, data: o2 }));
            };
          }
          onack(t2) {
            const e2 = this.acks[t2.id];
            "function" == typeof e2 ? (i("calling ack %s with %j", t2.id, t2.data), e2.apply(this, t2.data), delete this.acks[t2.id]) : i("bad ack %s", t2.id);
          }
          onconnect(t2) {
            i("socket connected with id %s", t2), this.id = t2, this.connected = true, this.disconnected = false, super.emit("connect"), this.emitBuffered();
          }
          emitBuffered() {
            this.receiveBuffer.forEach((t2) => this.emitEvent(t2)), this.receiveBuffer = [], this.sendBuffer.forEach((t2) => this.packet(t2)), this.sendBuffer = [];
          }
          ondisconnect() {
            i("server disconnect (%s)", this.nsp), this.destroy(), this.onclose("io server disconnect");
          }
          destroy() {
            this.subs && (this.subs.forEach((t2) => t2()), this.subs = void 0), this.io._destroy(this);
          }
          disconnect() {
            return this.connected && (i("performing disconnect (%s)", this.nsp), this.packet({ type: r.PacketType.DISCONNECT })), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
          }
          close() {
            return this.disconnect();
          }
          compress(t2) {
            return this.flags.compress = t2, this;
          }
          get volatile() {
            return this.flags.volatile = true, this;
          }
          onAny(t2) {
            return this._anyListeners = this._anyListeners || [], this._anyListeners.push(t2), this;
          }
          prependAny(t2) {
            return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(t2), this;
          }
          offAny(t2) {
            if (!this._anyListeners)
              return this;
            if (t2) {
              const e2 = this._anyListeners;
              for (let n2 = 0; n2 < e2.length; n2++)
                if (t2 === e2[n2])
                  return e2.splice(n2, 1), this;
            } else
              this._anyListeners = [];
            return this;
          }
          listenersAny() {
            return this._anyListeners || [];
          }
        };
      }, function(t, e, n) {
        Object.defineProperty(e, "__esModule", { value: true }), e.hasBinary = e.isBinary = void 0;
        const r = "function" == typeof ArrayBuffer, o = Object.prototype.toString, s = "function" == typeof Blob || "undefined" != typeof Blob && "[object BlobConstructor]" === o.call(Blob), i = "function" == typeof File || "undefined" != typeof File && "[object FileConstructor]" === o.call(File);
        function a(t2) {
          return r && (t2 instanceof ArrayBuffer || ((t3) => "function" == typeof ArrayBuffer.isView ? ArrayBuffer.isView(t3) : t3.buffer instanceof ArrayBuffer)(t2)) || s && t2 instanceof Blob || i && t2 instanceof File;
        }
        e.isBinary = a, e.hasBinary = function t2(e2, n2) {
          if (!e2 || "object" != typeof e2)
            return false;
          if (Array.isArray(e2)) {
            for (let n3 = 0, r2 = e2.length; n3 < r2; n3++)
              if (t2(e2[n3]))
                return true;
            return false;
          }
          if (a(e2))
            return true;
          if (e2.toJSON && "function" == typeof e2.toJSON && 1 === arguments.length)
            return t2(e2.toJSON(), true);
          for (const n3 in e2)
            if (Object.prototype.hasOwnProperty.call(e2, n3) && t2(e2[n3]))
              return true;
          return false;
        };
      }, function(t, e, n) {
        Object.defineProperty(e, "__esModule", { value: true }), e.on = void 0, e.on = function(t2, e2, n2) {
          return t2.on(e2, n2), function() {
            t2.off(e2, n2);
          };
        };
      }, function(t, e, n) {
        t.exports = n(19);
      }, function(t, e, n) {
        Object.defineProperty(e, "__esModule", { value: true }), e.Socket = e.io = e.Manager = e.protocol = void 0;
        const r = n(20), o = n(8), s = n(15);
        Object.defineProperty(e, "Socket", { enumerable: true, get: function() {
          return s.Socket;
        } });
        const i = n(0)("socket.io-client");
        t.exports = e = c;
        const a = e.managers = {};
        function c(t2, e2) {
          "object" == typeof t2 && (e2 = t2, t2 = void 0), e2 = e2 || {};
          const n2 = r.url(t2), s2 = n2.source, c2 = n2.id, h2 = n2.path, u2 = a[c2] && h2 in a[c2].nsps;
          let p;
          return e2.forceNew || e2["force new connection"] || false === e2.multiplex || u2 ? (i("ignoring socket cache for %s", s2), p = new o.Manager(s2, e2)) : (a[c2] || (i("new io instance for %s", s2), a[c2] = new o.Manager(s2, e2)), p = a[c2]), n2.query && !e2.query && (e2.query = n2.query), p.socket(n2.path, e2);
        }
        e.io = c;
        var h = n(6);
        Object.defineProperty(e, "protocol", { enumerable: true, get: function() {
          return h.protocol;
        } }), e.connect = c;
        var u = n(8);
        Object.defineProperty(e, "Manager", { enumerable: true, get: function() {
          return u.Manager;
        } });
      }, function(t, e, n) {
        Object.defineProperty(e, "__esModule", { value: true }), e.url = void 0;
        const r = n(7), o = n(0)("socket.io-client:url");
        e.url = function(t2, e2) {
          let n2 = t2;
          e2 = e2 || "undefined" != typeof location && location, null == t2 && (t2 = e2.protocol + "//" + e2.host), "string" == typeof t2 && ("/" === t2.charAt(0) && (t2 = "/" === t2.charAt(1) ? e2.protocol + t2 : e2.host + t2), /^(https?|wss?):\/\//.test(t2) || (o("protocol-less url %s", t2), t2 = void 0 !== e2 ? e2.protocol + "//" + t2 : "https://" + t2), o("parse %s", t2), n2 = r(t2)), n2.port || (/^(http|ws)$/.test(n2.protocol) ? n2.port = "80" : /^(http|ws)s$/.test(n2.protocol) && (n2.port = "443")), n2.path = n2.path || "/";
          const s = -1 !== n2.host.indexOf(":") ? "[" + n2.host + "]" : n2.host;
          return n2.id = n2.protocol + "://" + s + ":" + n2.port, n2.href = n2.protocol + "://" + s + (e2 && e2.port === n2.port ? "" : ":" + n2.port), n2;
        };
      }, function(t, e, n) {
        const r = n(22);
        t.exports = (t2, e2) => new r(t2, e2), t.exports.Socket = r, t.exports.protocol = r.protocol, t.exports.Transport = n(4), t.exports.transports = n(9), t.exports.parser = n(2);
      }, function(t, e, n) {
        const r = n(9), o = n(1), s = n(0)("engine.io-client:socket"), i = n(2), a = n(7), c = n(5);
        class h extends o {
          constructor(t2, e2 = {}) {
            super(), t2 && "object" == typeof t2 && (e2 = t2, t2 = null), t2 ? (t2 = a(t2), e2.hostname = t2.host, e2.secure = "https" === t2.protocol || "wss" === t2.protocol, e2.port = t2.port, t2.query && (e2.query = t2.query)) : e2.host && (e2.hostname = a(e2.host).host), this.secure = null != e2.secure ? e2.secure : "undefined" != typeof location && "https:" === location.protocol, e2.hostname && !e2.port && (e2.port = this.secure ? "443" : "80"), this.hostname = e2.hostname || ("undefined" != typeof location ? location.hostname : "localhost"), this.port = e2.port || ("undefined" != typeof location && location.port ? location.port : this.secure ? 443 : 80), this.transports = e2.transports || ["polling", "websocket"], this.readyState = "", this.writeBuffer = [], this.prevBufferLen = 0, this.opts = Object.assign({ path: "/engine.io", agent: false, withCredentials: false, upgrade: true, jsonp: true, timestampParam: "t", rememberUpgrade: false, rejectUnauthorized: true, perMessageDeflate: { threshold: 1024 }, transportOptions: {} }, e2), this.opts.path = this.opts.path.replace(/\/$/, "") + "/", "string" == typeof this.opts.query && (this.opts.query = c.decode(this.opts.query)), this.id = null, this.upgrades = null, this.pingInterval = null, this.pingTimeout = null, this.pingTimeoutTimer = null, "function" == typeof addEventListener && (addEventListener("beforeunload", () => {
              this.transport && (this.transport.removeAllListeners(), this.transport.close());
            }, false), "localhost" !== this.hostname && (this.offlineEventListener = () => {
              this.onClose("transport close");
            }, addEventListener("offline", this.offlineEventListener, false))), this.open();
          }
          createTransport(t2) {
            s('creating transport "%s"', t2);
            const e2 = function(t3) {
              const e3 = {};
              for (let n3 in t3)
                t3.hasOwnProperty(n3) && (e3[n3] = t3[n3]);
              return e3;
            }(this.opts.query);
            e2.EIO = i.protocol, e2.transport = t2, this.id && (e2.sid = this.id);
            const n2 = Object.assign({}, this.opts.transportOptions[t2], this.opts, { query: e2, socket: this, hostname: this.hostname, secure: this.secure, port: this.port });
            return s("options: %j", n2), new r[t2](n2);
          }
          open() {
            let t2;
            if (this.opts.rememberUpgrade && h.priorWebsocketSuccess && -1 !== this.transports.indexOf("websocket"))
              t2 = "websocket";
            else {
              if (0 === this.transports.length) {
                const t3 = this;
                return void setTimeout(function() {
                  t3.emit("error", "No transports available");
                }, 0);
              }
              t2 = this.transports[0];
            }
            this.readyState = "opening";
            try {
              t2 = this.createTransport(t2);
            } catch (t3) {
              return s("error while creating transport: %s", t3), this.transports.shift(), void this.open();
            }
            t2.open(), this.setTransport(t2);
          }
          setTransport(t2) {
            s("setting transport %s", t2.name);
            const e2 = this;
            this.transport && (s("clearing existing transport %s", this.transport.name), this.transport.removeAllListeners()), this.transport = t2, t2.on("drain", function() {
              e2.onDrain();
            }).on("packet", function(t3) {
              e2.onPacket(t3);
            }).on("error", function(t3) {
              e2.onError(t3);
            }).on("close", function() {
              e2.onClose("transport close");
            });
          }
          probe(t2) {
            s('probing transport "%s"', t2);
            let e2 = this.createTransport(t2, { probe: 1 }), n2 = false;
            const r2 = this;
            function o2() {
              if (r2.onlyBinaryUpgrades) {
                const t3 = !this.supportsBinary && r2.transport.supportsBinary;
                n2 = n2 || t3;
              }
              n2 || (s('probe transport "%s" opened', t2), e2.send([{ type: "ping", data: "probe" }]), e2.once("packet", function(o3) {
                if (!n2)
                  if ("pong" === o3.type && "probe" === o3.data) {
                    if (s('probe transport "%s" pong', t2), r2.upgrading = true, r2.emit("upgrading", e2), !e2)
                      return;
                    h.priorWebsocketSuccess = "websocket" === e2.name, s('pausing current transport "%s"', r2.transport.name), r2.transport.pause(function() {
                      n2 || "closed" !== r2.readyState && (s("changing transport and sending upgrade packet"), f(), r2.setTransport(e2), e2.send([{ type: "upgrade" }]), r2.emit("upgrade", e2), e2 = null, r2.upgrading = false, r2.flush());
                    });
                  } else {
                    s('probe transport "%s" failed', t2);
                    const n3 = new Error("probe error");
                    n3.transport = e2.name, r2.emit("upgradeError", n3);
                  }
              }));
            }
            function i2() {
              n2 || (n2 = true, f(), e2.close(), e2 = null);
            }
            function a2(n3) {
              const o3 = new Error("probe error: " + n3);
              o3.transport = e2.name, i2(), s('probe transport "%s" failed because of error: %s', t2, n3), r2.emit("upgradeError", o3);
            }
            function c2() {
              a2("transport closed");
            }
            function u() {
              a2("socket closed");
            }
            function p(t3) {
              e2 && t3.name !== e2.name && (s('"%s" works - aborting "%s"', t3.name, e2.name), i2());
            }
            function f() {
              e2.removeListener("open", o2), e2.removeListener("error", a2), e2.removeListener("close", c2), r2.removeListener("close", u), r2.removeListener("upgrading", p);
            }
            h.priorWebsocketSuccess = false, e2.once("open", o2), e2.once("error", a2), e2.once("close", c2), this.once("close", u), this.once("upgrading", p), e2.open();
          }
          onOpen() {
            if (s("socket open"), this.readyState = "open", h.priorWebsocketSuccess = "websocket" === this.transport.name, this.emit("open"), this.flush(), "open" === this.readyState && this.opts.upgrade && this.transport.pause) {
              s("starting upgrade probes");
              let t2 = 0;
              const e2 = this.upgrades.length;
              for (; t2 < e2; t2++)
                this.probe(this.upgrades[t2]);
            }
          }
          onPacket(t2) {
            if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState)
              switch (s('socket receive: type "%s", data "%s"', t2.type, t2.data), this.emit("packet", t2), this.emit("heartbeat"), t2.type) {
                case "open":
                  this.onHandshake(JSON.parse(t2.data));
                  break;
                case "ping":
                  this.resetPingTimeout(), this.sendPacket("pong"), this.emit("pong");
                  break;
                case "error":
                  const e2 = new Error("server error");
                  e2.code = t2.data, this.onError(e2);
                  break;
                case "message":
                  this.emit("data", t2.data), this.emit("message", t2.data);
              }
            else
              s('packet received with socket readyState "%s"', this.readyState);
          }
          onHandshake(t2) {
            this.emit("handshake", t2), this.id = t2.sid, this.transport.query.sid = t2.sid, this.upgrades = this.filterUpgrades(t2.upgrades), this.pingInterval = t2.pingInterval, this.pingTimeout = t2.pingTimeout, this.onOpen(), "closed" !== this.readyState && this.resetPingTimeout();
          }
          resetPingTimeout() {
            clearTimeout(this.pingTimeoutTimer), this.pingTimeoutTimer = setTimeout(() => {
              this.onClose("ping timeout");
            }, this.pingInterval + this.pingTimeout), this.opts.autoUnref && this.pingTimeoutTimer.unref();
          }
          onDrain() {
            this.writeBuffer.splice(0, this.prevBufferLen), this.prevBufferLen = 0, 0 === this.writeBuffer.length ? this.emit("drain") : this.flush();
          }
          flush() {
            "closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length && (s("flushing %d packets in socket", this.writeBuffer.length), this.transport.send(this.writeBuffer), this.prevBufferLen = this.writeBuffer.length, this.emit("flush"));
          }
          write(t2, e2, n2) {
            return this.sendPacket("message", t2, e2, n2), this;
          }
          send(t2, e2, n2) {
            return this.sendPacket("message", t2, e2, n2), this;
          }
          sendPacket(t2, e2, n2, r2) {
            if ("function" == typeof e2 && (r2 = e2, e2 = void 0), "function" == typeof n2 && (r2 = n2, n2 = null), "closing" === this.readyState || "closed" === this.readyState)
              return;
            (n2 = n2 || {}).compress = false !== n2.compress;
            const o2 = { type: t2, data: e2, options: n2 };
            this.emit("packetCreate", o2), this.writeBuffer.push(o2), r2 && this.once("flush", r2), this.flush();
          }
          close() {
            const t2 = this;
            function e2() {
              t2.onClose("forced close"), s("socket closing - telling transport to close"), t2.transport.close();
            }
            function n2() {
              t2.removeListener("upgrade", n2), t2.removeListener("upgradeError", n2), e2();
            }
            function r2() {
              t2.once("upgrade", n2), t2.once("upgradeError", n2);
            }
            return "opening" !== this.readyState && "open" !== this.readyState || (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", function() {
              this.upgrading ? r2() : e2();
            }) : this.upgrading ? r2() : e2()), this;
          }
          onError(t2) {
            s("socket error %j", t2), h.priorWebsocketSuccess = false, this.emit("error", t2), this.onClose("transport error", t2);
          }
          onClose(t2, e2) {
            if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
              s('socket close with reason: "%s"', t2);
              const n2 = this;
              clearTimeout(this.pingIntervalTimer), clearTimeout(this.pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), "function" == typeof removeEventListener && removeEventListener("offline", this.offlineEventListener, false), this.readyState = "closed", this.id = null, this.emit("close", t2, e2), n2.writeBuffer = [], n2.prevBufferLen = 0;
            }
          }
          filterUpgrades(t2) {
            const e2 = [];
            let n2 = 0;
            const r2 = t2.length;
            for (; n2 < r2; n2++)
              ~this.transports.indexOf(t2[n2]) && e2.push(t2[n2]);
            return e2;
          }
        }
        h.priorWebsocketSuccess = false, h.protocol = i.protocol, t.exports = h;
      }, function(t, e) {
        try {
          t.exports = "undefined" != typeof XMLHttpRequest && "withCredentials" in new XMLHttpRequest();
        } catch (e2) {
          t.exports = false;
        }
      }, function(t, e, n) {
        const r = n(10), o = n(11), s = n(1), { pick: i } = n(14), a = n(3), c = n(0)("engine.io-client:polling-xhr");
        function h() {
        }
        const u = null != new r({ xdomain: false }).responseType;
        class p extends s {
          constructor(t2, e2) {
            super(), this.opts = e2, this.method = e2.method || "GET", this.uri = t2, this.async = false !== e2.async, this.data = void 0 !== e2.data ? e2.data : null, this.create();
          }
          create() {
            const t2 = i(this.opts, "agent", "enablesXDR", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
            t2.xdomain = !!this.opts.xd, t2.xscheme = !!this.opts.xs;
            const e2 = this.xhr = new r(t2), n2 = this;
            try {
              c("xhr open %s: %s", this.method, this.uri), e2.open(this.method, this.uri, this.async);
              try {
                if (this.opts.extraHeaders) {
                  e2.setDisableHeaderCheck && e2.setDisableHeaderCheck(true);
                  for (let t3 in this.opts.extraHeaders)
                    this.opts.extraHeaders.hasOwnProperty(t3) && e2.setRequestHeader(t3, this.opts.extraHeaders[t3]);
                }
              } catch (t3) {
              }
              if ("POST" === this.method)
                try {
                  e2.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                } catch (t3) {
                }
              try {
                e2.setRequestHeader("Accept", "*/*");
              } catch (t3) {
              }
              "withCredentials" in e2 && (e2.withCredentials = this.opts.withCredentials), this.opts.requestTimeout && (e2.timeout = this.opts.requestTimeout), this.hasXDR() ? (e2.onload = function() {
                n2.onLoad();
              }, e2.onerror = function() {
                n2.onError(e2.responseText);
              }) : e2.onreadystatechange = function() {
                4 === e2.readyState && (200 === e2.status || 1223 === e2.status ? n2.onLoad() : setTimeout(function() {
                  n2.onError("number" == typeof e2.status ? e2.status : 0);
                }, 0));
              }, c("xhr data %s", this.data), e2.send(this.data);
            } catch (t3) {
              return void setTimeout(function() {
                n2.onError(t3);
              }, 0);
            }
            "undefined" != typeof document && (this.index = p.requestsCount++, p.requests[this.index] = this);
          }
          onSuccess() {
            this.emit("success"), this.cleanup();
          }
          onData(t2) {
            this.emit("data", t2), this.onSuccess();
          }
          onError(t2) {
            this.emit("error", t2), this.cleanup(true);
          }
          cleanup(t2) {
            if (void 0 !== this.xhr && null !== this.xhr) {
              if (this.hasXDR() ? this.xhr.onload = this.xhr.onerror = h : this.xhr.onreadystatechange = h, t2)
                try {
                  this.xhr.abort();
                } catch (t3) {
                }
              "undefined" != typeof document && delete p.requests[this.index], this.xhr = null;
            }
          }
          onLoad() {
            const t2 = this.xhr.responseText;
            null !== t2 && this.onData(t2);
          }
          hasXDR() {
            return "undefined" != typeof XDomainRequest && !this.xs && this.enablesXDR;
          }
          abort() {
            this.cleanup();
          }
        }
        if (p.requestsCount = 0, p.requests = {}, "undefined" != typeof document) {
          if ("function" == typeof attachEvent)
            attachEvent("onunload", f);
          else if ("function" == typeof addEventListener) {
            addEventListener("onpagehide" in a ? "pagehide" : "unload", f, false);
          }
        }
        function f() {
          for (let t2 in p.requests)
            p.requests.hasOwnProperty(t2) && p.requests[t2].abort();
        }
        t.exports = class extends o {
          constructor(t2) {
            if (super(t2), "undefined" != typeof location) {
              const e3 = "https:" === location.protocol;
              let n2 = location.port;
              n2 || (n2 = e3 ? 443 : 80), this.xd = "undefined" != typeof location && t2.hostname !== location.hostname || n2 !== t2.port, this.xs = t2.secure !== e3;
            }
            const e2 = t2 && t2.forceBase64;
            this.supportsBinary = u && !e2;
          }
          request(t2 = {}) {
            return Object.assign(t2, { xd: this.xd, xs: this.xs }, this.opts), new p(this.uri(), t2);
          }
          doWrite(t2, e2) {
            const n2 = this.request({ method: "POST", data: t2 }), r2 = this;
            n2.on("success", e2), n2.on("error", function(t3) {
              r2.onError("xhr post error", t3);
            });
          }
          doPoll() {
            c("xhr poll");
            const t2 = this.request(), e2 = this;
            t2.on("data", function(t3) {
              e2.onData(t3);
            }), t2.on("error", function(t3) {
              e2.onError("xhr poll error", t3);
            }), this.pollXhr = t2;
          }
        }, t.exports.Request = p;
      }, function(t, e, n) {
        const { PACKET_TYPES: r } = n(12), o = "function" == typeof Blob || "undefined" != typeof Blob && "[object BlobConstructor]" === Object.prototype.toString.call(Blob), s = "function" == typeof ArrayBuffer, i = (t2, e2) => {
          const n2 = new FileReader();
          return n2.onload = function() {
            const t3 = n2.result.split(",")[1];
            e2("b" + t3);
          }, n2.readAsDataURL(t2);
        };
        t.exports = ({ type: t2, data: e2 }, n2, a) => {
          return o && e2 instanceof Blob ? n2 ? a(e2) : i(e2, a) : s && (e2 instanceof ArrayBuffer || (c = e2, "function" == typeof ArrayBuffer.isView ? ArrayBuffer.isView(c) : c && c.buffer instanceof ArrayBuffer)) ? n2 ? a(e2 instanceof ArrayBuffer ? e2 : e2.buffer) : i(new Blob([e2]), a) : a(r[t2] + (e2 || ""));
          var c;
        };
      }, function(t, e, n) {
        const { PACKET_TYPES_REVERSE: r, ERROR_PACKET: o } = n(12);
        let s;
        "function" == typeof ArrayBuffer && (s = n(27));
        const i = (t2, e2) => {
          if (s) {
            const n2 = s.decode(t2);
            return a(n2, e2);
          }
          return { base64: true, data: t2 };
        }, a = (t2, e2) => {
          switch (e2) {
            case "blob":
              return t2 instanceof ArrayBuffer ? new Blob([t2]) : t2;
            case "arraybuffer":
            default:
              return t2;
          }
        };
        t.exports = (t2, e2) => {
          if ("string" != typeof t2)
            return { type: "message", data: a(t2, e2) };
          const n2 = t2.charAt(0);
          if ("b" === n2)
            return { type: "message", data: i(t2.substring(1), e2) };
          return r[n2] ? t2.length > 1 ? { type: r[n2], data: t2.substring(1) } : { type: r[n2] } : o;
        };
      }, function(t, e) {
        !function(t2) {
          e.encode = function(e2) {
            var n, r = new Uint8Array(e2), o = r.length, s = "";
            for (n = 0; n < o; n += 3)
              s += t2[r[n] >> 2], s += t2[(3 & r[n]) << 4 | r[n + 1] >> 4], s += t2[(15 & r[n + 1]) << 2 | r[n + 2] >> 6], s += t2[63 & r[n + 2]];
            return o % 3 == 2 ? s = s.substring(0, s.length - 1) + "=" : o % 3 == 1 && (s = s.substring(0, s.length - 2) + "=="), s;
          }, e.decode = function(e2) {
            var n, r, o, s, i, a = 0.75 * e2.length, c = e2.length, h = 0;
            "=" === e2[e2.length - 1] && (a--, "=" === e2[e2.length - 2] && a--);
            var u = new ArrayBuffer(a), p = new Uint8Array(u);
            for (n = 0; n < c; n += 4)
              r = t2.indexOf(e2[n]), o = t2.indexOf(e2[n + 1]), s = t2.indexOf(e2[n + 2]), i = t2.indexOf(e2[n + 3]), p[h++] = r << 2 | o >> 4, p[h++] = (15 & o) << 4 | s >> 2, p[h++] = (3 & s) << 6 | 63 & i;
            return u;
          };
        }("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
      }, function(t, e, n) {
        const r = n(11), o = n(3), s = /\n/g, i = /\\n/g;
        let a;
        t.exports = class extends r {
          constructor(t2) {
            super(t2), this.query = this.query || {}, a || (a = o.___eio = o.___eio || []), this.index = a.length;
            const e2 = this;
            a.push(function(t3) {
              e2.onData(t3);
            }), this.query.j = this.index;
          }
          get supportsBinary() {
            return false;
          }
          doClose() {
            this.script && (this.script.onerror = () => {
            }, this.script.parentNode.removeChild(this.script), this.script = null), this.form && (this.form.parentNode.removeChild(this.form), this.form = null, this.iframe = null), super.doClose();
          }
          doPoll() {
            const t2 = this, e2 = document.createElement("script");
            this.script && (this.script.parentNode.removeChild(this.script), this.script = null), e2.async = true, e2.src = this.uri(), e2.onerror = function(e3) {
              t2.onError("jsonp poll error", e3);
            };
            const n2 = document.getElementsByTagName("script")[0];
            n2 ? n2.parentNode.insertBefore(e2, n2) : (document.head || document.body).appendChild(e2), this.script = e2;
            "undefined" != typeof navigator && /gecko/i.test(navigator.userAgent) && setTimeout(function() {
              const t3 = document.createElement("iframe");
              document.body.appendChild(t3), document.body.removeChild(t3);
            }, 100);
          }
          doWrite(t2, e2) {
            const n2 = this;
            let r2;
            if (!this.form) {
              const t3 = document.createElement("form"), e3 = document.createElement("textarea"), n3 = this.iframeId = "eio_iframe_" + this.index;
              t3.className = "socketio", t3.style.position = "absolute", t3.style.top = "-1000px", t3.style.left = "-1000px", t3.target = n3, t3.method = "POST", t3.setAttribute("accept-charset", "utf-8"), e3.name = "d", t3.appendChild(e3), document.body.appendChild(t3), this.form = t3, this.area = e3;
            }
            function o2() {
              a2(), e2();
            }
            function a2() {
              if (n2.iframe)
                try {
                  n2.form.removeChild(n2.iframe);
                } catch (t3) {
                  n2.onError("jsonp polling iframe removal error", t3);
                }
              try {
                const t3 = '<iframe src="javascript:0" name="' + n2.iframeId + '">';
                r2 = document.createElement(t3);
              } catch (t3) {
                r2 = document.createElement("iframe"), r2.name = n2.iframeId, r2.src = "javascript:0";
              }
              r2.id = n2.iframeId, n2.form.appendChild(r2), n2.iframe = r2;
            }
            this.form.action = this.uri(), a2(), t2 = t2.replace(i, "\\\n"), this.area.value = t2.replace(s, "\\n");
            try {
              this.form.submit();
            } catch (t3) {
            }
            this.iframe.attachEvent ? this.iframe.onreadystatechange = function() {
              "complete" === n2.iframe.readyState && o2();
            } : this.iframe.onload = o2;
          }
        };
      }, function(t, e, n) {
        (function(e2) {
          const r = n(2), o = n(5), s = n(13), i = n(4), { pick: a } = n(14), c = n(3), h = n(0)("engine.io-client:websocket");
          let u = c.WebSocket || c.MozWebSocket, p = true, f = "arraybuffer";
          "undefined" == typeof window && (u = n(35), p = false, f = "nodebuffer");
          const l = "undefined" != typeof navigator && "string" == typeof navigator.product && "reactnative" === navigator.product.toLowerCase();
          class d extends i {
            constructor(t2) {
              super(t2), this.supportsBinary = !t2.forceBase64;
            }
            get name() {
              return "websocket";
            }
            doOpen() {
              if (!this.check())
                return;
              const t2 = this.uri(), e3 = this.opts.protocols, n2 = l ? {} : a(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
              this.opts.extraHeaders && (n2.headers = this.opts.extraHeaders);
              try {
                this.ws = p && !l ? e3 ? new u(t2, e3) : new u(t2) : new u(t2, e3, n2);
              } catch (t3) {
                return formatAppLog("log", "at node_modules/@hyoga/uni-socket.io/dist/uni-socket.io.js:1", "error", t3), this.emit("error", t3);
              }
              this.ws.binaryType = this.socket.binaryType || f, this.addEventListeners();
            }
            addEventListeners() {
              this.ws.onopen = () => {
                this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
              }, this.ws.onclose = this.onClose.bind(this), this.ws.onmessage = (t2) => this.onData(t2.data), this.ws.onerror = (t2) => this.onError("websocket error", t2);
            }
            write(t2) {
              const n2 = this;
              this.writable = false;
              let o2 = t2.length, s2 = 0;
              const i2 = o2;
              for (; s2 < i2; s2++)
                !function(t3) {
                  r.encodePacket(t3, n2.supportsBinary, function(r2) {
                    const s3 = {};
                    if (!p && (t3.options && (s3.compress = t3.options.compress), n2.opts.perMessageDeflate)) {
                      ("string" == typeof r2 ? e2.byteLength(r2) : r2.length) < n2.opts.perMessageDeflate.threshold && (s3.compress = false);
                    }
                    try {
                      p ? n2.ws.send(r2) : n2.ws.send(r2, s3);
                    } catch (t4) {
                      h("websocket closed before onclose event");
                    }
                    --o2 || a2();
                  });
                }(t2[s2]);
              function a2() {
                n2.emit("flush"), setTimeout(function() {
                  n2.writable = true, n2.emit("drain");
                }, 0);
              }
            }
            onClose() {
              i.prototype.onClose.call(this);
            }
            doClose() {
              void 0 !== this.ws && (this.ws.close(), this.ws = null);
            }
            uri() {
              let t2 = this.query || {};
              const e3 = this.opts.secure ? "wss" : "ws";
              let n2 = "";
              this.opts.port && ("wss" === e3 && 443 !== Number(this.opts.port) || "ws" === e3 && 80 !== Number(this.opts.port)) && (n2 = ":" + this.opts.port), this.opts.timestampRequests && (t2[this.opts.timestampParam] = s()), this.supportsBinary || (t2.b64 = 1), t2 = o.encode(t2), t2.length && (t2 = "?" + t2);
              return e3 + "://" + (-1 !== this.opts.hostname.indexOf(":") ? "[" + this.opts.hostname + "]" : this.opts.hostname) + n2 + this.opts.path + t2;
            }
            check() {
              return !(!u || "__initialize" in u && this.name === d.prototype.name);
            }
          }
          t.exports = d;
        }).call(this, n(30).Buffer);
      }, function(t, e, n) {
        (function(t2) {
          /*!
           * The buffer module from node.js, for the browser.
           *
           * @author   Feross Aboukhadijeh <http://feross.org>
           * @license  MIT
           */
          var r = n(32), o = n(33), s = n(34);
          function i() {
            return c.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
          }
          function a(t3, e2) {
            if (i() < e2)
              throw new RangeError("Invalid typed array length");
            return c.TYPED_ARRAY_SUPPORT ? (t3 = new Uint8Array(e2)).__proto__ = c.prototype : (null === t3 && (t3 = new c(e2)), t3.length = e2), t3;
          }
          function c(t3, e2, n2) {
            if (!(c.TYPED_ARRAY_SUPPORT || this instanceof c))
              return new c(t3, e2, n2);
            if ("number" == typeof t3) {
              if ("string" == typeof e2)
                throw new Error("If encoding is specified then the first argument must be a string");
              return p(this, t3);
            }
            return h(this, t3, e2, n2);
          }
          function h(t3, e2, n2, r2) {
            if ("number" == typeof e2)
              throw new TypeError('"value" argument must not be a number');
            return "undefined" != typeof ArrayBuffer && e2 instanceof ArrayBuffer ? function(t4, e3, n3, r3) {
              if (e3.byteLength, n3 < 0 || e3.byteLength < n3)
                throw new RangeError("'offset' is out of bounds");
              if (e3.byteLength < n3 + (r3 || 0))
                throw new RangeError("'length' is out of bounds");
              e3 = void 0 === n3 && void 0 === r3 ? new Uint8Array(e3) : void 0 === r3 ? new Uint8Array(e3, n3) : new Uint8Array(e3, n3, r3);
              c.TYPED_ARRAY_SUPPORT ? (t4 = e3).__proto__ = c.prototype : t4 = f(t4, e3);
              return t4;
            }(t3, e2, n2, r2) : "string" == typeof e2 ? function(t4, e3, n3) {
              "string" == typeof n3 && "" !== n3 || (n3 = "utf8");
              if (!c.isEncoding(n3))
                throw new TypeError('"encoding" must be a valid string encoding');
              var r3 = 0 | d(e3, n3), o2 = (t4 = a(t4, r3)).write(e3, n3);
              o2 !== r3 && (t4 = t4.slice(0, o2));
              return t4;
            }(t3, e2, n2) : function(t4, e3) {
              if (c.isBuffer(e3)) {
                var n3 = 0 | l(e3.length);
                return 0 === (t4 = a(t4, n3)).length || e3.copy(t4, 0, 0, n3), t4;
              }
              if (e3) {
                if ("undefined" != typeof ArrayBuffer && e3.buffer instanceof ArrayBuffer || "length" in e3)
                  return "number" != typeof e3.length || (r3 = e3.length) != r3 ? a(t4, 0) : f(t4, e3);
                if ("Buffer" === e3.type && s(e3.data))
                  return f(t4, e3.data);
              }
              var r3;
              throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
            }(t3, e2);
          }
          function u(t3) {
            if ("number" != typeof t3)
              throw new TypeError('"size" argument must be a number');
            if (t3 < 0)
              throw new RangeError('"size" argument must not be negative');
          }
          function p(t3, e2) {
            if (u(e2), t3 = a(t3, e2 < 0 ? 0 : 0 | l(e2)), !c.TYPED_ARRAY_SUPPORT)
              for (var n2 = 0; n2 < e2; ++n2)
                t3[n2] = 0;
            return t3;
          }
          function f(t3, e2) {
            var n2 = e2.length < 0 ? 0 : 0 | l(e2.length);
            t3 = a(t3, n2);
            for (var r2 = 0; r2 < n2; r2 += 1)
              t3[r2] = 255 & e2[r2];
            return t3;
          }
          function l(t3) {
            if (t3 >= i())
              throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + i().toString(16) + " bytes");
            return 0 | t3;
          }
          function d(t3, e2) {
            if (c.isBuffer(t3))
              return t3.length;
            if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(t3) || t3 instanceof ArrayBuffer))
              return t3.byteLength;
            "string" != typeof t3 && (t3 = "" + t3);
            var n2 = t3.length;
            if (0 === n2)
              return 0;
            for (var r2 = false; ; )
              switch (e2) {
                case "ascii":
                case "latin1":
                case "binary":
                  return n2;
                case "utf8":
                case "utf-8":
                case void 0:
                  return Y(t3).length;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return 2 * n2;
                case "hex":
                  return n2 >>> 1;
                case "base64":
                  return q(t3).length;
                default:
                  if (r2)
                    return Y(t3).length;
                  e2 = ("" + e2).toLowerCase(), r2 = true;
              }
          }
          function y(t3, e2, n2) {
            var r2 = false;
            if ((void 0 === e2 || e2 < 0) && (e2 = 0), e2 > this.length)
              return "";
            if ((void 0 === n2 || n2 > this.length) && (n2 = this.length), n2 <= 0)
              return "";
            if ((n2 >>>= 0) <= (e2 >>>= 0))
              return "";
            for (t3 || (t3 = "utf8"); ; )
              switch (t3) {
                case "hex":
                  return C(this, e2, n2);
                case "utf8":
                case "utf-8":
                  return x(this, e2, n2);
                case "ascii":
                  return S(this, e2, n2);
                case "latin1":
                case "binary":
                  return P(this, e2, n2);
                case "base64":
                  return T(this, e2, n2);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return R(this, e2, n2);
                default:
                  if (r2)
                    throw new TypeError("Unknown encoding: " + t3);
                  t3 = (t3 + "").toLowerCase(), r2 = true;
              }
          }
          function g(t3, e2, n2) {
            var r2 = t3[e2];
            t3[e2] = t3[n2], t3[n2] = r2;
          }
          function m(t3, e2, n2, r2, o2) {
            if (0 === t3.length)
              return -1;
            if ("string" == typeof n2 ? (r2 = n2, n2 = 0) : n2 > 2147483647 ? n2 = 2147483647 : n2 < -2147483648 && (n2 = -2147483648), n2 = +n2, isNaN(n2) && (n2 = o2 ? 0 : t3.length - 1), n2 < 0 && (n2 = t3.length + n2), n2 >= t3.length) {
              if (o2)
                return -1;
              n2 = t3.length - 1;
            } else if (n2 < 0) {
              if (!o2)
                return -1;
              n2 = 0;
            }
            if ("string" == typeof e2 && (e2 = c.from(e2, r2)), c.isBuffer(e2))
              return 0 === e2.length ? -1 : v(t3, e2, n2, r2, o2);
            if ("number" == typeof e2)
              return e2 &= 255, c.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? o2 ? Uint8Array.prototype.indexOf.call(t3, e2, n2) : Uint8Array.prototype.lastIndexOf.call(t3, e2, n2) : v(t3, [e2], n2, r2, o2);
            throw new TypeError("val must be string, number or Buffer");
          }
          function v(t3, e2, n2, r2, o2) {
            var s2, i2 = 1, a2 = t3.length, c2 = e2.length;
            if (void 0 !== r2 && ("ucs2" === (r2 = String(r2).toLowerCase()) || "ucs-2" === r2 || "utf16le" === r2 || "utf-16le" === r2)) {
              if (t3.length < 2 || e2.length < 2)
                return -1;
              i2 = 2, a2 /= 2, c2 /= 2, n2 /= 2;
            }
            function h2(t4, e3) {
              return 1 === i2 ? t4[e3] : t4.readUInt16BE(e3 * i2);
            }
            if (o2) {
              var u2 = -1;
              for (s2 = n2; s2 < a2; s2++)
                if (h2(t3, s2) === h2(e2, -1 === u2 ? 0 : s2 - u2)) {
                  if (-1 === u2 && (u2 = s2), s2 - u2 + 1 === c2)
                    return u2 * i2;
                } else
                  -1 !== u2 && (s2 -= s2 - u2), u2 = -1;
            } else
              for (n2 + c2 > a2 && (n2 = a2 - c2), s2 = n2; s2 >= 0; s2--) {
                for (var p2 = true, f2 = 0; f2 < c2; f2++)
                  if (h2(t3, s2 + f2) !== h2(e2, f2)) {
                    p2 = false;
                    break;
                  }
                if (p2)
                  return s2;
              }
            return -1;
          }
          function b(t3, e2, n2, r2) {
            n2 = Number(n2) || 0;
            var o2 = t3.length - n2;
            r2 ? (r2 = Number(r2)) > o2 && (r2 = o2) : r2 = o2;
            var s2 = e2.length;
            if (s2 % 2 != 0)
              throw new TypeError("Invalid hex string");
            r2 > s2 / 2 && (r2 = s2 / 2);
            for (var i2 = 0; i2 < r2; ++i2) {
              var a2 = parseInt(e2.substr(2 * i2, 2), 16);
              if (isNaN(a2))
                return i2;
              t3[n2 + i2] = a2;
            }
            return i2;
          }
          function w(t3, e2, n2, r2) {
            return F(Y(e2, t3.length - n2), t3, n2, r2);
          }
          function _(t3, e2, n2, r2) {
            return F(function(t4) {
              for (var e3 = [], n3 = 0; n3 < t4.length; ++n3)
                e3.push(255 & t4.charCodeAt(n3));
              return e3;
            }(e2), t3, n2, r2);
          }
          function E(t3, e2, n2, r2) {
            return _(t3, e2, n2, r2);
          }
          function k(t3, e2, n2, r2) {
            return F(q(e2), t3, n2, r2);
          }
          function A(t3, e2, n2, r2) {
            return F(function(t4, e3) {
              for (var n3, r3, o2, s2 = [], i2 = 0; i2 < t4.length && !((e3 -= 2) < 0); ++i2)
                n3 = t4.charCodeAt(i2), r3 = n3 >> 8, o2 = n3 % 256, s2.push(o2), s2.push(r3);
              return s2;
            }(e2, t3.length - n2), t3, n2, r2);
          }
          function T(t3, e2, n2) {
            return 0 === e2 && n2 === t3.length ? r.fromByteArray(t3) : r.fromByteArray(t3.slice(e2, n2));
          }
          function x(t3, e2, n2) {
            n2 = Math.min(t3.length, n2);
            for (var r2 = [], o2 = e2; o2 < n2; ) {
              var s2, i2, a2, c2, h2 = t3[o2], u2 = null, p2 = h2 > 239 ? 4 : h2 > 223 ? 3 : h2 > 191 ? 2 : 1;
              if (o2 + p2 <= n2)
                switch (p2) {
                  case 1:
                    h2 < 128 && (u2 = h2);
                    break;
                  case 2:
                    128 == (192 & (s2 = t3[o2 + 1])) && (c2 = (31 & h2) << 6 | 63 & s2) > 127 && (u2 = c2);
                    break;
                  case 3:
                    s2 = t3[o2 + 1], i2 = t3[o2 + 2], 128 == (192 & s2) && 128 == (192 & i2) && (c2 = (15 & h2) << 12 | (63 & s2) << 6 | 63 & i2) > 2047 && (c2 < 55296 || c2 > 57343) && (u2 = c2);
                    break;
                  case 4:
                    s2 = t3[o2 + 1], i2 = t3[o2 + 2], a2 = t3[o2 + 3], 128 == (192 & s2) && 128 == (192 & i2) && 128 == (192 & a2) && (c2 = (15 & h2) << 18 | (63 & s2) << 12 | (63 & i2) << 6 | 63 & a2) > 65535 && c2 < 1114112 && (u2 = c2);
                }
              null === u2 ? (u2 = 65533, p2 = 1) : u2 > 65535 && (u2 -= 65536, r2.push(u2 >>> 10 & 1023 | 55296), u2 = 56320 | 1023 & u2), r2.push(u2), o2 += p2;
            }
            return function(t4) {
              var e3 = t4.length;
              if (e3 <= 4096)
                return String.fromCharCode.apply(String, t4);
              var n3 = "", r3 = 0;
              for (; r3 < e3; )
                n3 += String.fromCharCode.apply(String, t4.slice(r3, r3 += 4096));
              return n3;
            }(r2);
          }
          e.Buffer = c, e.SlowBuffer = function(t3) {
            +t3 != t3 && (t3 = 0);
            return c.alloc(+t3);
          }, e.INSPECT_MAX_BYTES = 50, c.TYPED_ARRAY_SUPPORT = void 0 !== t2.TYPED_ARRAY_SUPPORT ? t2.TYPED_ARRAY_SUPPORT : function() {
            try {
              var t3 = new Uint8Array(1);
              return t3.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, 42 === t3.foo() && "function" == typeof t3.subarray && 0 === t3.subarray(1, 1).byteLength;
            } catch (t4) {
              return false;
            }
          }(), e.kMaxLength = i(), c.poolSize = 8192, c._augment = function(t3) {
            return t3.__proto__ = c.prototype, t3;
          }, c.from = function(t3, e2, n2) {
            return h(null, t3, e2, n2);
          }, c.TYPED_ARRAY_SUPPORT && (c.prototype.__proto__ = Uint8Array.prototype, c.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && c[Symbol.species] === c && Object.defineProperty(c, Symbol.species, { value: null, configurable: true })), c.alloc = function(t3, e2, n2) {
            return function(t4, e3, n3, r2) {
              return u(e3), e3 <= 0 ? a(t4, e3) : void 0 !== n3 ? "string" == typeof r2 ? a(t4, e3).fill(n3, r2) : a(t4, e3).fill(n3) : a(t4, e3);
            }(null, t3, e2, n2);
          }, c.allocUnsafe = function(t3) {
            return p(null, t3);
          }, c.allocUnsafeSlow = function(t3) {
            return p(null, t3);
          }, c.isBuffer = function(t3) {
            return !(null == t3 || !t3._isBuffer);
          }, c.compare = function(t3, e2) {
            if (!c.isBuffer(t3) || !c.isBuffer(e2))
              throw new TypeError("Arguments must be Buffers");
            if (t3 === e2)
              return 0;
            for (var n2 = t3.length, r2 = e2.length, o2 = 0, s2 = Math.min(n2, r2); o2 < s2; ++o2)
              if (t3[o2] !== e2[o2]) {
                n2 = t3[o2], r2 = e2[o2];
                break;
              }
            return n2 < r2 ? -1 : r2 < n2 ? 1 : 0;
          }, c.isEncoding = function(t3) {
            switch (String(t3).toLowerCase()) {
              case "hex":
              case "utf8":
              case "utf-8":
              case "ascii":
              case "latin1":
              case "binary":
              case "base64":
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return true;
              default:
                return false;
            }
          }, c.concat = function(t3, e2) {
            if (!s(t3))
              throw new TypeError('"list" argument must be an Array of Buffers');
            if (0 === t3.length)
              return c.alloc(0);
            var n2;
            if (void 0 === e2)
              for (e2 = 0, n2 = 0; n2 < t3.length; ++n2)
                e2 += t3[n2].length;
            var r2 = c.allocUnsafe(e2), o2 = 0;
            for (n2 = 0; n2 < t3.length; ++n2) {
              var i2 = t3[n2];
              if (!c.isBuffer(i2))
                throw new TypeError('"list" argument must be an Array of Buffers');
              i2.copy(r2, o2), o2 += i2.length;
            }
            return r2;
          }, c.byteLength = d, c.prototype._isBuffer = true, c.prototype.swap16 = function() {
            var t3 = this.length;
            if (t3 % 2 != 0)
              throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var e2 = 0; e2 < t3; e2 += 2)
              g(this, e2, e2 + 1);
            return this;
          }, c.prototype.swap32 = function() {
            var t3 = this.length;
            if (t3 % 4 != 0)
              throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var e2 = 0; e2 < t3; e2 += 4)
              g(this, e2, e2 + 3), g(this, e2 + 1, e2 + 2);
            return this;
          }, c.prototype.swap64 = function() {
            var t3 = this.length;
            if (t3 % 8 != 0)
              throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var e2 = 0; e2 < t3; e2 += 8)
              g(this, e2, e2 + 7), g(this, e2 + 1, e2 + 6), g(this, e2 + 2, e2 + 5), g(this, e2 + 3, e2 + 4);
            return this;
          }, c.prototype.toString = function() {
            var t3 = 0 | this.length;
            return 0 === t3 ? "" : 0 === arguments.length ? x(this, 0, t3) : y.apply(this, arguments);
          }, c.prototype.equals = function(t3) {
            if (!c.isBuffer(t3))
              throw new TypeError("Argument must be a Buffer");
            return this === t3 || 0 === c.compare(this, t3);
          }, c.prototype.inspect = function() {
            var t3 = "", n2 = e.INSPECT_MAX_BYTES;
            return this.length > 0 && (t3 = this.toString("hex", 0, n2).match(/.{2}/g).join(" "), this.length > n2 && (t3 += " ... ")), "<Buffer " + t3 + ">";
          }, c.prototype.compare = function(t3, e2, n2, r2, o2) {
            if (!c.isBuffer(t3))
              throw new TypeError("Argument must be a Buffer");
            if (void 0 === e2 && (e2 = 0), void 0 === n2 && (n2 = t3 ? t3.length : 0), void 0 === r2 && (r2 = 0), void 0 === o2 && (o2 = this.length), e2 < 0 || n2 > t3.length || r2 < 0 || o2 > this.length)
              throw new RangeError("out of range index");
            if (r2 >= o2 && e2 >= n2)
              return 0;
            if (r2 >= o2)
              return -1;
            if (e2 >= n2)
              return 1;
            if (this === t3)
              return 0;
            for (var s2 = (o2 >>>= 0) - (r2 >>>= 0), i2 = (n2 >>>= 0) - (e2 >>>= 0), a2 = Math.min(s2, i2), h2 = this.slice(r2, o2), u2 = t3.slice(e2, n2), p2 = 0; p2 < a2; ++p2)
              if (h2[p2] !== u2[p2]) {
                s2 = h2[p2], i2 = u2[p2];
                break;
              }
            return s2 < i2 ? -1 : i2 < s2 ? 1 : 0;
          }, c.prototype.includes = function(t3, e2, n2) {
            return -1 !== this.indexOf(t3, e2, n2);
          }, c.prototype.indexOf = function(t3, e2, n2) {
            return m(this, t3, e2, n2, true);
          }, c.prototype.lastIndexOf = function(t3, e2, n2) {
            return m(this, t3, e2, n2, false);
          }, c.prototype.write = function(t3, e2, n2, r2) {
            if (void 0 === e2)
              r2 = "utf8", n2 = this.length, e2 = 0;
            else if (void 0 === n2 && "string" == typeof e2)
              r2 = e2, n2 = this.length, e2 = 0;
            else {
              if (!isFinite(e2))
                throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
              e2 |= 0, isFinite(n2) ? (n2 |= 0, void 0 === r2 && (r2 = "utf8")) : (r2 = n2, n2 = void 0);
            }
            var o2 = this.length - e2;
            if ((void 0 === n2 || n2 > o2) && (n2 = o2), t3.length > 0 && (n2 < 0 || e2 < 0) || e2 > this.length)
              throw new RangeError("Attempt to write outside buffer bounds");
            r2 || (r2 = "utf8");
            for (var s2 = false; ; )
              switch (r2) {
                case "hex":
                  return b(this, t3, e2, n2);
                case "utf8":
                case "utf-8":
                  return w(this, t3, e2, n2);
                case "ascii":
                  return _(this, t3, e2, n2);
                case "latin1":
                case "binary":
                  return E(this, t3, e2, n2);
                case "base64":
                  return k(this, t3, e2, n2);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return A(this, t3, e2, n2);
                default:
                  if (s2)
                    throw new TypeError("Unknown encoding: " + r2);
                  r2 = ("" + r2).toLowerCase(), s2 = true;
              }
          }, c.prototype.toJSON = function() {
            return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
          };
          function S(t3, e2, n2) {
            var r2 = "";
            n2 = Math.min(t3.length, n2);
            for (var o2 = e2; o2 < n2; ++o2)
              r2 += String.fromCharCode(127 & t3[o2]);
            return r2;
          }
          function P(t3, e2, n2) {
            var r2 = "";
            n2 = Math.min(t3.length, n2);
            for (var o2 = e2; o2 < n2; ++o2)
              r2 += String.fromCharCode(t3[o2]);
            return r2;
          }
          function C(t3, e2, n2) {
            var r2 = t3.length;
            (!e2 || e2 < 0) && (e2 = 0), (!n2 || n2 < 0 || n2 > r2) && (n2 = r2);
            for (var o2 = "", s2 = e2; s2 < n2; ++s2)
              o2 += D(t3[s2]);
            return o2;
          }
          function R(t3, e2, n2) {
            for (var r2 = t3.slice(e2, n2), o2 = "", s2 = 0; s2 < r2.length; s2 += 2)
              o2 += String.fromCharCode(r2[s2] + 256 * r2[s2 + 1]);
            return o2;
          }
          function O(t3, e2, n2) {
            if (t3 % 1 != 0 || t3 < 0)
              throw new RangeError("offset is not uint");
            if (t3 + e2 > n2)
              throw new RangeError("Trying to access beyond buffer length");
          }
          function B(t3, e2, n2, r2, o2, s2) {
            if (!c.isBuffer(t3))
              throw new TypeError('"buffer" argument must be a Buffer instance');
            if (e2 > o2 || e2 < s2)
              throw new RangeError('"value" argument is out of bounds');
            if (n2 + r2 > t3.length)
              throw new RangeError("Index out of range");
          }
          function L(t3, e2, n2, r2) {
            e2 < 0 && (e2 = 65535 + e2 + 1);
            for (var o2 = 0, s2 = Math.min(t3.length - n2, 2); o2 < s2; ++o2)
              t3[n2 + o2] = (e2 & 255 << 8 * (r2 ? o2 : 1 - o2)) >>> 8 * (r2 ? o2 : 1 - o2);
          }
          function N(t3, e2, n2, r2) {
            e2 < 0 && (e2 = 4294967295 + e2 + 1);
            for (var o2 = 0, s2 = Math.min(t3.length - n2, 4); o2 < s2; ++o2)
              t3[n2 + o2] = e2 >>> 8 * (r2 ? o2 : 3 - o2) & 255;
          }
          function j(t3, e2, n2, r2, o2, s2) {
            if (n2 + r2 > t3.length)
              throw new RangeError("Index out of range");
            if (n2 < 0)
              throw new RangeError("Index out of range");
          }
          function I(t3, e2, n2, r2, s2) {
            return s2 || j(t3, 0, n2, 4), o.write(t3, e2, n2, r2, 23, 4), n2 + 4;
          }
          function M(t3, e2, n2, r2, s2) {
            return s2 || j(t3, 0, n2, 8), o.write(t3, e2, n2, r2, 52, 8), n2 + 8;
          }
          c.prototype.slice = function(t3, e2) {
            var n2, r2 = this.length;
            if ((t3 = ~~t3) < 0 ? (t3 += r2) < 0 && (t3 = 0) : t3 > r2 && (t3 = r2), (e2 = void 0 === e2 ? r2 : ~~e2) < 0 ? (e2 += r2) < 0 && (e2 = 0) : e2 > r2 && (e2 = r2), e2 < t3 && (e2 = t3), c.TYPED_ARRAY_SUPPORT)
              (n2 = this.subarray(t3, e2)).__proto__ = c.prototype;
            else {
              var o2 = e2 - t3;
              n2 = new c(o2, void 0);
              for (var s2 = 0; s2 < o2; ++s2)
                n2[s2] = this[s2 + t3];
            }
            return n2;
          }, c.prototype.readUIntLE = function(t3, e2, n2) {
            t3 |= 0, e2 |= 0, n2 || O(t3, e2, this.length);
            for (var r2 = this[t3], o2 = 1, s2 = 0; ++s2 < e2 && (o2 *= 256); )
              r2 += this[t3 + s2] * o2;
            return r2;
          }, c.prototype.readUIntBE = function(t3, e2, n2) {
            t3 |= 0, e2 |= 0, n2 || O(t3, e2, this.length);
            for (var r2 = this[t3 + --e2], o2 = 1; e2 > 0 && (o2 *= 256); )
              r2 += this[t3 + --e2] * o2;
            return r2;
          }, c.prototype.readUInt8 = function(t3, e2) {
            return e2 || O(t3, 1, this.length), this[t3];
          }, c.prototype.readUInt16LE = function(t3, e2) {
            return e2 || O(t3, 2, this.length), this[t3] | this[t3 + 1] << 8;
          }, c.prototype.readUInt16BE = function(t3, e2) {
            return e2 || O(t3, 2, this.length), this[t3] << 8 | this[t3 + 1];
          }, c.prototype.readUInt32LE = function(t3, e2) {
            return e2 || O(t3, 4, this.length), (this[t3] | this[t3 + 1] << 8 | this[t3 + 2] << 16) + 16777216 * this[t3 + 3];
          }, c.prototype.readUInt32BE = function(t3, e2) {
            return e2 || O(t3, 4, this.length), 16777216 * this[t3] + (this[t3 + 1] << 16 | this[t3 + 2] << 8 | this[t3 + 3]);
          }, c.prototype.readIntLE = function(t3, e2, n2) {
            t3 |= 0, e2 |= 0, n2 || O(t3, e2, this.length);
            for (var r2 = this[t3], o2 = 1, s2 = 0; ++s2 < e2 && (o2 *= 256); )
              r2 += this[t3 + s2] * o2;
            return r2 >= (o2 *= 128) && (r2 -= Math.pow(2, 8 * e2)), r2;
          }, c.prototype.readIntBE = function(t3, e2, n2) {
            t3 |= 0, e2 |= 0, n2 || O(t3, e2, this.length);
            for (var r2 = e2, o2 = 1, s2 = this[t3 + --r2]; r2 > 0 && (o2 *= 256); )
              s2 += this[t3 + --r2] * o2;
            return s2 >= (o2 *= 128) && (s2 -= Math.pow(2, 8 * e2)), s2;
          }, c.prototype.readInt8 = function(t3, e2) {
            return e2 || O(t3, 1, this.length), 128 & this[t3] ? -1 * (255 - this[t3] + 1) : this[t3];
          }, c.prototype.readInt16LE = function(t3, e2) {
            e2 || O(t3, 2, this.length);
            var n2 = this[t3] | this[t3 + 1] << 8;
            return 32768 & n2 ? 4294901760 | n2 : n2;
          }, c.prototype.readInt16BE = function(t3, e2) {
            e2 || O(t3, 2, this.length);
            var n2 = this[t3 + 1] | this[t3] << 8;
            return 32768 & n2 ? 4294901760 | n2 : n2;
          }, c.prototype.readInt32LE = function(t3, e2) {
            return e2 || O(t3, 4, this.length), this[t3] | this[t3 + 1] << 8 | this[t3 + 2] << 16 | this[t3 + 3] << 24;
          }, c.prototype.readInt32BE = function(t3, e2) {
            return e2 || O(t3, 4, this.length), this[t3] << 24 | this[t3 + 1] << 16 | this[t3 + 2] << 8 | this[t3 + 3];
          }, c.prototype.readFloatLE = function(t3, e2) {
            return e2 || O(t3, 4, this.length), o.read(this, t3, true, 23, 4);
          }, c.prototype.readFloatBE = function(t3, e2) {
            return e2 || O(t3, 4, this.length), o.read(this, t3, false, 23, 4);
          }, c.prototype.readDoubleLE = function(t3, e2) {
            return e2 || O(t3, 8, this.length), o.read(this, t3, true, 52, 8);
          }, c.prototype.readDoubleBE = function(t3, e2) {
            return e2 || O(t3, 8, this.length), o.read(this, t3, false, 52, 8);
          }, c.prototype.writeUIntLE = function(t3, e2, n2, r2) {
            (t3 = +t3, e2 |= 0, n2 |= 0, r2) || B(this, t3, e2, n2, Math.pow(2, 8 * n2) - 1, 0);
            var o2 = 1, s2 = 0;
            for (this[e2] = 255 & t3; ++s2 < n2 && (o2 *= 256); )
              this[e2 + s2] = t3 / o2 & 255;
            return e2 + n2;
          }, c.prototype.writeUIntBE = function(t3, e2, n2, r2) {
            (t3 = +t3, e2 |= 0, n2 |= 0, r2) || B(this, t3, e2, n2, Math.pow(2, 8 * n2) - 1, 0);
            var o2 = n2 - 1, s2 = 1;
            for (this[e2 + o2] = 255 & t3; --o2 >= 0 && (s2 *= 256); )
              this[e2 + o2] = t3 / s2 & 255;
            return e2 + n2;
          }, c.prototype.writeUInt8 = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 1, 255, 0), c.TYPED_ARRAY_SUPPORT || (t3 = Math.floor(t3)), this[e2] = 255 & t3, e2 + 1;
          }, c.prototype.writeUInt16LE = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 2, 65535, 0), c.TYPED_ARRAY_SUPPORT ? (this[e2] = 255 & t3, this[e2 + 1] = t3 >>> 8) : L(this, t3, e2, true), e2 + 2;
          }, c.prototype.writeUInt16BE = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 2, 65535, 0), c.TYPED_ARRAY_SUPPORT ? (this[e2] = t3 >>> 8, this[e2 + 1] = 255 & t3) : L(this, t3, e2, false), e2 + 2;
          }, c.prototype.writeUInt32LE = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 4, 4294967295, 0), c.TYPED_ARRAY_SUPPORT ? (this[e2 + 3] = t3 >>> 24, this[e2 + 2] = t3 >>> 16, this[e2 + 1] = t3 >>> 8, this[e2] = 255 & t3) : N(this, t3, e2, true), e2 + 4;
          }, c.prototype.writeUInt32BE = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 4, 4294967295, 0), c.TYPED_ARRAY_SUPPORT ? (this[e2] = t3 >>> 24, this[e2 + 1] = t3 >>> 16, this[e2 + 2] = t3 >>> 8, this[e2 + 3] = 255 & t3) : N(this, t3, e2, false), e2 + 4;
          }, c.prototype.writeIntLE = function(t3, e2, n2, r2) {
            if (t3 = +t3, e2 |= 0, !r2) {
              var o2 = Math.pow(2, 8 * n2 - 1);
              B(this, t3, e2, n2, o2 - 1, -o2);
            }
            var s2 = 0, i2 = 1, a2 = 0;
            for (this[e2] = 255 & t3; ++s2 < n2 && (i2 *= 256); )
              t3 < 0 && 0 === a2 && 0 !== this[e2 + s2 - 1] && (a2 = 1), this[e2 + s2] = (t3 / i2 >> 0) - a2 & 255;
            return e2 + n2;
          }, c.prototype.writeIntBE = function(t3, e2, n2, r2) {
            if (t3 = +t3, e2 |= 0, !r2) {
              var o2 = Math.pow(2, 8 * n2 - 1);
              B(this, t3, e2, n2, o2 - 1, -o2);
            }
            var s2 = n2 - 1, i2 = 1, a2 = 0;
            for (this[e2 + s2] = 255 & t3; --s2 >= 0 && (i2 *= 256); )
              t3 < 0 && 0 === a2 && 0 !== this[e2 + s2 + 1] && (a2 = 1), this[e2 + s2] = (t3 / i2 >> 0) - a2 & 255;
            return e2 + n2;
          }, c.prototype.writeInt8 = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 1, 127, -128), c.TYPED_ARRAY_SUPPORT || (t3 = Math.floor(t3)), t3 < 0 && (t3 = 255 + t3 + 1), this[e2] = 255 & t3, e2 + 1;
          }, c.prototype.writeInt16LE = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 2, 32767, -32768), c.TYPED_ARRAY_SUPPORT ? (this[e2] = 255 & t3, this[e2 + 1] = t3 >>> 8) : L(this, t3, e2, true), e2 + 2;
          }, c.prototype.writeInt16BE = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 2, 32767, -32768), c.TYPED_ARRAY_SUPPORT ? (this[e2] = t3 >>> 8, this[e2 + 1] = 255 & t3) : L(this, t3, e2, false), e2 + 2;
          }, c.prototype.writeInt32LE = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 4, 2147483647, -2147483648), c.TYPED_ARRAY_SUPPORT ? (this[e2] = 255 & t3, this[e2 + 1] = t3 >>> 8, this[e2 + 2] = t3 >>> 16, this[e2 + 3] = t3 >>> 24) : N(this, t3, e2, true), e2 + 4;
          }, c.prototype.writeInt32BE = function(t3, e2, n2) {
            return t3 = +t3, e2 |= 0, n2 || B(this, t3, e2, 4, 2147483647, -2147483648), t3 < 0 && (t3 = 4294967295 + t3 + 1), c.TYPED_ARRAY_SUPPORT ? (this[e2] = t3 >>> 24, this[e2 + 1] = t3 >>> 16, this[e2 + 2] = t3 >>> 8, this[e2 + 3] = 255 & t3) : N(this, t3, e2, false), e2 + 4;
          }, c.prototype.writeFloatLE = function(t3, e2, n2) {
            return I(this, t3, e2, true, n2);
          }, c.prototype.writeFloatBE = function(t3, e2, n2) {
            return I(this, t3, e2, false, n2);
          }, c.prototype.writeDoubleLE = function(t3, e2, n2) {
            return M(this, t3, e2, true, n2);
          }, c.prototype.writeDoubleBE = function(t3, e2, n2) {
            return M(this, t3, e2, false, n2);
          }, c.prototype.copy = function(t3, e2, n2, r2) {
            if (n2 || (n2 = 0), r2 || 0 === r2 || (r2 = this.length), e2 >= t3.length && (e2 = t3.length), e2 || (e2 = 0), r2 > 0 && r2 < n2 && (r2 = n2), r2 === n2)
              return 0;
            if (0 === t3.length || 0 === this.length)
              return 0;
            if (e2 < 0)
              throw new RangeError("targetStart out of bounds");
            if (n2 < 0 || n2 >= this.length)
              throw new RangeError("sourceStart out of bounds");
            if (r2 < 0)
              throw new RangeError("sourceEnd out of bounds");
            r2 > this.length && (r2 = this.length), t3.length - e2 < r2 - n2 && (r2 = t3.length - e2 + n2);
            var o2, s2 = r2 - n2;
            if (this === t3 && n2 < e2 && e2 < r2)
              for (o2 = s2 - 1; o2 >= 0; --o2)
                t3[o2 + e2] = this[o2 + n2];
            else if (s2 < 1e3 || !c.TYPED_ARRAY_SUPPORT)
              for (o2 = 0; o2 < s2; ++o2)
                t3[o2 + e2] = this[o2 + n2];
            else
              Uint8Array.prototype.set.call(t3, this.subarray(n2, n2 + s2), e2);
            return s2;
          }, c.prototype.fill = function(t3, e2, n2, r2) {
            if ("string" == typeof t3) {
              if ("string" == typeof e2 ? (r2 = e2, e2 = 0, n2 = this.length) : "string" == typeof n2 && (r2 = n2, n2 = this.length), 1 === t3.length) {
                var o2 = t3.charCodeAt(0);
                o2 < 256 && (t3 = o2);
              }
              if (void 0 !== r2 && "string" != typeof r2)
                throw new TypeError("encoding must be a string");
              if ("string" == typeof r2 && !c.isEncoding(r2))
                throw new TypeError("Unknown encoding: " + r2);
            } else
              "number" == typeof t3 && (t3 &= 255);
            if (e2 < 0 || this.length < e2 || this.length < n2)
              throw new RangeError("Out of range index");
            if (n2 <= e2)
              return this;
            var s2;
            if (e2 >>>= 0, n2 = void 0 === n2 ? this.length : n2 >>> 0, t3 || (t3 = 0), "number" == typeof t3)
              for (s2 = e2; s2 < n2; ++s2)
                this[s2] = t3;
            else {
              var i2 = c.isBuffer(t3) ? t3 : Y(new c(t3, r2).toString()), a2 = i2.length;
              for (s2 = 0; s2 < n2 - e2; ++s2)
                this[s2 + e2] = i2[s2 % a2];
            }
            return this;
          };
          var U = /[^+\/0-9A-Za-z-_]/g;
          function D(t3) {
            return t3 < 16 ? "0" + t3.toString(16) : t3.toString(16);
          }
          function Y(t3, e2) {
            var n2;
            e2 = e2 || 1 / 0;
            for (var r2 = t3.length, o2 = null, s2 = [], i2 = 0; i2 < r2; ++i2) {
              if ((n2 = t3.charCodeAt(i2)) > 55295 && n2 < 57344) {
                if (!o2) {
                  if (n2 > 56319) {
                    (e2 -= 3) > -1 && s2.push(239, 191, 189);
                    continue;
                  }
                  if (i2 + 1 === r2) {
                    (e2 -= 3) > -1 && s2.push(239, 191, 189);
                    continue;
                  }
                  o2 = n2;
                  continue;
                }
                if (n2 < 56320) {
                  (e2 -= 3) > -1 && s2.push(239, 191, 189), o2 = n2;
                  continue;
                }
                n2 = 65536 + (o2 - 55296 << 10 | n2 - 56320);
              } else
                o2 && (e2 -= 3) > -1 && s2.push(239, 191, 189);
              if (o2 = null, n2 < 128) {
                if ((e2 -= 1) < 0)
                  break;
                s2.push(n2);
              } else if (n2 < 2048) {
                if ((e2 -= 2) < 0)
                  break;
                s2.push(n2 >> 6 | 192, 63 & n2 | 128);
              } else if (n2 < 65536) {
                if ((e2 -= 3) < 0)
                  break;
                s2.push(n2 >> 12 | 224, n2 >> 6 & 63 | 128, 63 & n2 | 128);
              } else {
                if (!(n2 < 1114112))
                  throw new Error("Invalid code point");
                if ((e2 -= 4) < 0)
                  break;
                s2.push(n2 >> 18 | 240, n2 >> 12 & 63 | 128, n2 >> 6 & 63 | 128, 63 & n2 | 128);
              }
            }
            return s2;
          }
          function q(t3) {
            return r.toByteArray(function(t4) {
              if ((t4 = function(t5) {
                return t5.trim ? t5.trim() : t5.replace(/^\s+|\s+$/g, "");
              }(t4).replace(U, "")).length < 2)
                return "";
              for (; t4.length % 4 != 0; )
                t4 += "=";
              return t4;
            }(t3));
          }
          function F(t3, e2, n2, r2) {
            for (var o2 = 0; o2 < r2 && !(o2 + n2 >= e2.length || o2 >= t3.length); ++o2)
              e2[o2 + n2] = t3[o2];
            return o2;
          }
        }).call(this, n(31));
      }, function(t, e) {
        var n;
        n = function() {
          return this;
        }();
        try {
          n = n || new Function("return this")();
        } catch (t2) {
          "object" == typeof window && (n = window);
        }
        t.exports = n;
      }, function(t, e, n) {
        e.byteLength = function(t2) {
          var e2 = h(t2), n2 = e2[0], r2 = e2[1];
          return 3 * (n2 + r2) / 4 - r2;
        }, e.toByteArray = function(t2) {
          var e2, n2, r2 = h(t2), i2 = r2[0], a2 = r2[1], c2 = new s(function(t3, e3, n3) {
            return 3 * (e3 + n3) / 4 - n3;
          }(0, i2, a2)), u2 = 0, p = a2 > 0 ? i2 - 4 : i2;
          for (n2 = 0; n2 < p; n2 += 4)
            e2 = o[t2.charCodeAt(n2)] << 18 | o[t2.charCodeAt(n2 + 1)] << 12 | o[t2.charCodeAt(n2 + 2)] << 6 | o[t2.charCodeAt(n2 + 3)], c2[u2++] = e2 >> 16 & 255, c2[u2++] = e2 >> 8 & 255, c2[u2++] = 255 & e2;
          2 === a2 && (e2 = o[t2.charCodeAt(n2)] << 2 | o[t2.charCodeAt(n2 + 1)] >> 4, c2[u2++] = 255 & e2);
          1 === a2 && (e2 = o[t2.charCodeAt(n2)] << 10 | o[t2.charCodeAt(n2 + 1)] << 4 | o[t2.charCodeAt(n2 + 2)] >> 2, c2[u2++] = e2 >> 8 & 255, c2[u2++] = 255 & e2);
          return c2;
        }, e.fromByteArray = function(t2) {
          for (var e2, n2 = t2.length, o2 = n2 % 3, s2 = [], i2 = 0, a2 = n2 - o2; i2 < a2; i2 += 16383)
            s2.push(u(t2, i2, i2 + 16383 > a2 ? a2 : i2 + 16383));
          1 === o2 ? (e2 = t2[n2 - 1], s2.push(r[e2 >> 2] + r[e2 << 4 & 63] + "==")) : 2 === o2 && (e2 = (t2[n2 - 2] << 8) + t2[n2 - 1], s2.push(r[e2 >> 10] + r[e2 >> 4 & 63] + r[e2 << 2 & 63] + "="));
          return s2.join("");
        };
        for (var r = [], o = [], s = "undefined" != typeof Uint8Array ? Uint8Array : Array, i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", a = 0, c = i.length; a < c; ++a)
          r[a] = i[a], o[i.charCodeAt(a)] = a;
        function h(t2) {
          var e2 = t2.length;
          if (e2 % 4 > 0)
            throw new Error("Invalid string. Length must be a multiple of 4");
          var n2 = t2.indexOf("=");
          return -1 === n2 && (n2 = e2), [n2, n2 === e2 ? 0 : 4 - n2 % 4];
        }
        function u(t2, e2, n2) {
          for (var o2, s2, i2 = [], a2 = e2; a2 < n2; a2 += 3)
            o2 = (t2[a2] << 16 & 16711680) + (t2[a2 + 1] << 8 & 65280) + (255 & t2[a2 + 2]), i2.push(r[(s2 = o2) >> 18 & 63] + r[s2 >> 12 & 63] + r[s2 >> 6 & 63] + r[63 & s2]);
          return i2.join("");
        }
        o["-".charCodeAt(0)] = 62, o["_".charCodeAt(0)] = 63;
      }, function(t, e) {
        /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
        e.read = function(t2, e2, n, r, o) {
          var s, i, a = 8 * o - r - 1, c = (1 << a) - 1, h = c >> 1, u = -7, p = n ? o - 1 : 0, f = n ? -1 : 1, l = t2[e2 + p];
          for (p += f, s = l & (1 << -u) - 1, l >>= -u, u += a; u > 0; s = 256 * s + t2[e2 + p], p += f, u -= 8)
            ;
          for (i = s & (1 << -u) - 1, s >>= -u, u += r; u > 0; i = 256 * i + t2[e2 + p], p += f, u -= 8)
            ;
          if (0 === s)
            s = 1 - h;
          else {
            if (s === c)
              return i ? NaN : 1 / 0 * (l ? -1 : 1);
            i += Math.pow(2, r), s -= h;
          }
          return (l ? -1 : 1) * i * Math.pow(2, s - r);
        }, e.write = function(t2, e2, n, r, o, s) {
          var i, a, c, h = 8 * s - o - 1, u = (1 << h) - 1, p = u >> 1, f = 23 === o ? Math.pow(2, -24) - Math.pow(2, -77) : 0, l = r ? 0 : s - 1, d = r ? 1 : -1, y = e2 < 0 || 0 === e2 && 1 / e2 < 0 ? 1 : 0;
          for (e2 = Math.abs(e2), isNaN(e2) || e2 === 1 / 0 ? (a = isNaN(e2) ? 1 : 0, i = u) : (i = Math.floor(Math.log(e2) / Math.LN2), e2 * (c = Math.pow(2, -i)) < 1 && (i--, c *= 2), (e2 += i + p >= 1 ? f / c : f * Math.pow(2, 1 - p)) * c >= 2 && (i++, c /= 2), i + p >= u ? (a = 0, i = u) : i + p >= 1 ? (a = (e2 * c - 1) * Math.pow(2, o), i += p) : (a = e2 * Math.pow(2, p - 1) * Math.pow(2, o), i = 0)); o >= 8; t2[n + l] = 255 & a, l += d, a /= 256, o -= 8)
            ;
          for (i = i << o | a, h += o; h > 0; t2[n + l] = 255 & i, l += d, i /= 256, h -= 8)
            ;
          t2[n + l - d] |= 128 * y;
        };
      }, function(t, e) {
        var n = {}.toString;
        t.exports = Array.isArray || function(t2) {
          return "[object Array]" == n.call(t2);
        };
      }, function(t, e, n) {
        const r = n(36), o = n(37), s = n(0)("@hyoga/uni-socket"), i = uni || wx;
        class a extends r {
          constructor(t2, e2, n2) {
            super(), this._readyState = a.CONNECTING, this._socket = null, null !== t2 && (Array.isArray(e2) ? e2 = e2.join(", ") : "object" == typeof e2 && null !== e2 && (n2 = e2, e2 = void 0), this.initAsClient(t2, e2, n2));
          }
          initAsClient(t2, e2, n2) {
            Object.assign(n2, { url: t2, header: { "content-type": "application/json" }, protocols: e2, timeout: 25e3 }), this._socket = this.createConnection(n2), this.addSocketEventListeners();
          }
          createConnection(t2) {
            return i.connectSocket({ complete: () => {
            }, ...t2 });
          }
          addSocketEventListeners() {
            this._socket.onOpen(() => {
              this._readyState = a.OPEN, this.onopen();
            }), this._socket.onClose((t2) => {
              s("onclose: ", t2), this._readyState = a.CLOSED, this.onclose(t2.code, t2.reason);
            }), this._socket.onError((t2) => {
              s("onerror: ", t2), this.onerror(t2);
            }), this._socket.onMessage((t2) => {
              this.onmessage(t2);
            });
          }
          send(t2) {
            if (s("send data: ", t2, this._readyState), this._readyState === a.CONNECTING)
              throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
            "number" == typeof t2 && (t2 = t2.toString()), this._readyState === a.OPEN && this._socket.send({ data: t2 });
          }
          close(t2, e2) {
            s("close socket: ", t2, e2), this._readyState = a.CLOSING, this._socket.close({ code: t2, reason: e2 });
          }
        }
        ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach((t2, e2) => {
          a[t2] = e2;
        });
        ["open", "error", "close", "message"].forEach((t2) => {
          Object.defineProperty(a.prototype, "on" + t2, { get() {
            const e2 = this.listeners(t2);
            for (var n2 = 0; n2 < e2.length; n2++)
              if (e2[n2]._listener)
                return e2[n2]._listener;
          }, set(e2) {
            const n2 = this.listeners(t2);
            for (var r2 = 0; r2 < n2.length; r2++)
              n2[r2]._listener && this.removeListener(t2, n2[r2]);
            this.addEventListener(t2, e2);
          } });
        }), a.prototype.addEventListener = o.addEventListener, a.prototype.removeEventListener = o.removeEventListener, t.exports = a;
      }, function(t, e, n) {
        var r, o = "object" == typeof Reflect ? Reflect : null, s = o && "function" == typeof o.apply ? o.apply : function(t2, e2, n2) {
          return Function.prototype.apply.call(t2, e2, n2);
        };
        r = o && "function" == typeof o.ownKeys ? o.ownKeys : Object.getOwnPropertySymbols ? function(t2) {
          return Object.getOwnPropertyNames(t2).concat(Object.getOwnPropertySymbols(t2));
        } : function(t2) {
          return Object.getOwnPropertyNames(t2);
        };
        var i = Number.isNaN || function(t2) {
          return t2 != t2;
        };
        function a() {
          a.init.call(this);
        }
        t.exports = a, t.exports.once = function(t2, e2) {
          return new Promise(function(n2, r2) {
            function o2() {
              void 0 !== s2 && t2.removeListener("error", s2), n2([].slice.call(arguments));
            }
            var s2;
            "error" !== e2 && (s2 = function(n3) {
              t2.removeListener(e2, o2), r2(n3);
            }, t2.once("error", s2)), t2.once(e2, o2);
          });
        }, a.EventEmitter = a, a.prototype._events = void 0, a.prototype._eventsCount = 0, a.prototype._maxListeners = void 0;
        var c = 10;
        function h(t2) {
          if ("function" != typeof t2)
            throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof t2);
        }
        function u(t2) {
          return void 0 === t2._maxListeners ? a.defaultMaxListeners : t2._maxListeners;
        }
        function p(t2, e2, n2, r2) {
          var o2, s2, i2, a2;
          if (h(n2), void 0 === (s2 = t2._events) ? (s2 = t2._events = /* @__PURE__ */ Object.create(null), t2._eventsCount = 0) : (void 0 !== s2.newListener && (t2.emit("newListener", e2, n2.listener ? n2.listener : n2), s2 = t2._events), i2 = s2[e2]), void 0 === i2)
            i2 = s2[e2] = n2, ++t2._eventsCount;
          else if ("function" == typeof i2 ? i2 = s2[e2] = r2 ? [n2, i2] : [i2, n2] : r2 ? i2.unshift(n2) : i2.push(n2), (o2 = u(t2)) > 0 && i2.length > o2 && !i2.warned) {
            i2.warned = true;
            var c2 = new Error("Possible EventEmitter memory leak detected. " + i2.length + " " + String(e2) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            c2.name = "MaxListenersExceededWarning", c2.emitter = t2, c2.type = e2, c2.count = i2.length, a2 = c2, console && console.warn && formatAppLog("warn", "at node_modules/@hyoga/uni-socket.io/dist/uni-socket.io.js:10", a2);
          }
          return t2;
        }
        function f() {
          if (!this.fired)
            return this.target.removeListener(this.type, this.wrapFn), this.fired = true, 0 === arguments.length ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
        }
        function l(t2, e2, n2) {
          var r2 = { fired: false, wrapFn: void 0, target: t2, type: e2, listener: n2 }, o2 = f.bind(r2);
          return o2.listener = n2, r2.wrapFn = o2, o2;
        }
        function d(t2, e2, n2) {
          var r2 = t2._events;
          if (void 0 === r2)
            return [];
          var o2 = r2[e2];
          return void 0 === o2 ? [] : "function" == typeof o2 ? n2 ? [o2.listener || o2] : [o2] : n2 ? function(t3) {
            for (var e3 = new Array(t3.length), n3 = 0; n3 < e3.length; ++n3)
              e3[n3] = t3[n3].listener || t3[n3];
            return e3;
          }(o2) : g(o2, o2.length);
        }
        function y(t2) {
          var e2 = this._events;
          if (void 0 !== e2) {
            var n2 = e2[t2];
            if ("function" == typeof n2)
              return 1;
            if (void 0 !== n2)
              return n2.length;
          }
          return 0;
        }
        function g(t2, e2) {
          for (var n2 = new Array(e2), r2 = 0; r2 < e2; ++r2)
            n2[r2] = t2[r2];
          return n2;
        }
        Object.defineProperty(a, "defaultMaxListeners", { enumerable: true, get: function() {
          return c;
        }, set: function(t2) {
          if ("number" != typeof t2 || t2 < 0 || i(t2))
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + t2 + ".");
          c = t2;
        } }), a.init = function() {
          void 0 !== this._events && this._events !== Object.getPrototypeOf(this)._events || (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
        }, a.prototype.setMaxListeners = function(t2) {
          if ("number" != typeof t2 || t2 < 0 || i(t2))
            throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + t2 + ".");
          return this._maxListeners = t2, this;
        }, a.prototype.getMaxListeners = function() {
          return u(this);
        }, a.prototype.emit = function(t2) {
          for (var e2 = [], n2 = 1; n2 < arguments.length; n2++)
            e2.push(arguments[n2]);
          var r2 = "error" === t2, o2 = this._events;
          if (void 0 !== o2)
            r2 = r2 && void 0 === o2.error;
          else if (!r2)
            return false;
          if (r2) {
            var i2;
            if (e2.length > 0 && (i2 = e2[0]), i2 instanceof Error)
              throw i2;
            var a2 = new Error("Unhandled error." + (i2 ? " (" + i2.message + ")" : ""));
            throw a2.context = i2, a2;
          }
          var c2 = o2[t2];
          if (void 0 === c2)
            return false;
          if ("function" == typeof c2)
            s(c2, this, e2);
          else {
            var h2 = c2.length, u2 = g(c2, h2);
            for (n2 = 0; n2 < h2; ++n2)
              s(u2[n2], this, e2);
          }
          return true;
        }, a.prototype.addListener = function(t2, e2) {
          return p(this, t2, e2, false);
        }, a.prototype.on = a.prototype.addListener, a.prototype.prependListener = function(t2, e2) {
          return p(this, t2, e2, true);
        }, a.prototype.once = function(t2, e2) {
          return h(e2), this.on(t2, l(this, t2, e2)), this;
        }, a.prototype.prependOnceListener = function(t2, e2) {
          return h(e2), this.prependListener(t2, l(this, t2, e2)), this;
        }, a.prototype.removeListener = function(t2, e2) {
          var n2, r2, o2, s2, i2;
          if (h(e2), void 0 === (r2 = this._events))
            return this;
          if (void 0 === (n2 = r2[t2]))
            return this;
          if (n2 === e2 || n2.listener === e2)
            0 == --this._eventsCount ? this._events = /* @__PURE__ */ Object.create(null) : (delete r2[t2], r2.removeListener && this.emit("removeListener", t2, n2.listener || e2));
          else if ("function" != typeof n2) {
            for (o2 = -1, s2 = n2.length - 1; s2 >= 0; s2--)
              if (n2[s2] === e2 || n2[s2].listener === e2) {
                i2 = n2[s2].listener, o2 = s2;
                break;
              }
            if (o2 < 0)
              return this;
            0 === o2 ? n2.shift() : function(t3, e3) {
              for (; e3 + 1 < t3.length; e3++)
                t3[e3] = t3[e3 + 1];
              t3.pop();
            }(n2, o2), 1 === n2.length && (r2[t2] = n2[0]), void 0 !== r2.removeListener && this.emit("removeListener", t2, i2 || e2);
          }
          return this;
        }, a.prototype.off = a.prototype.removeListener, a.prototype.removeAllListeners = function(t2) {
          var e2, n2, r2;
          if (void 0 === (n2 = this._events))
            return this;
          if (void 0 === n2.removeListener)
            return 0 === arguments.length ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : void 0 !== n2[t2] && (0 == --this._eventsCount ? this._events = /* @__PURE__ */ Object.create(null) : delete n2[t2]), this;
          if (0 === arguments.length) {
            var o2, s2 = Object.keys(n2);
            for (r2 = 0; r2 < s2.length; ++r2)
              "removeListener" !== (o2 = s2[r2]) && this.removeAllListeners(o2);
            return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
          }
          if ("function" == typeof (e2 = n2[t2]))
            this.removeListener(t2, e2);
          else if (void 0 !== e2)
            for (r2 = e2.length - 1; r2 >= 0; r2--)
              this.removeListener(t2, e2[r2]);
          return this;
        }, a.prototype.listeners = function(t2) {
          return d(this, t2, true);
        }, a.prototype.rawListeners = function(t2) {
          return d(this, t2, false);
        }, a.listenerCount = function(t2, e2) {
          return "function" == typeof t2.listenerCount ? t2.listenerCount(e2) : y.call(t2, e2);
        }, a.prototype.listenerCount = y, a.prototype.eventNames = function() {
          return this._eventsCount > 0 ? r(this._events) : [];
        };
      }, function(t, e, n) {
        class r {
          constructor(t2, e2) {
            this.target = e2, this.type = t2;
          }
        }
        class o extends r {
          constructor(t2, e2) {
            super("message", e2), this.data = t2;
          }
        }
        class s extends r {
          constructor(t2, e2, n2) {
            super("close", n2), this.wasClean = n2._closeFrameReceived && n2._closeFrameSent, this.reason = e2, this.code = t2;
          }
        }
        class i extends r {
          constructor(t2) {
            super("open", t2);
          }
        }
        class a extends r {
          constructor(t2, e2) {
            super("error", e2), this.message = t2.message, this.error = t2;
          }
        }
        const c = { addEventListener(t2, e2) {
          function n2(t3) {
            e2.call(this, new o(t3, this));
          }
          function r2(t3, n3) {
            e2.call(this, new s(t3, n3, this));
          }
          function c2(t3) {
            e2.call(this, new a(t3, this));
          }
          function h() {
            e2.call(this, new i(this));
          }
          "function" == typeof e2 && ("message" === t2 ? (n2._listener = e2, this.on(t2, n2)) : "close" === t2 ? (r2._listener = e2, this.on(t2, r2)) : "error" === t2 ? (c2._listener = e2, this.on(t2, c2)) : "open" === t2 ? (h._listener = e2, this.on(t2, h)) : this.on(t2, e2));
        }, removeEventListener(t2, e2) {
          const n2 = this.listeners(t2);
          for (var r2 = 0; r2 < n2.length; r2++)
            n2[r2] !== e2 && n2[r2]._listener !== e2 || this.removeListener(t2, n2[r2]);
        } };
        t.exports = c;
      }, function(t, e, n) {
        Object.defineProperty(e, "__esModule", { value: true }), e.reconstructPacket = e.deconstructPacket = void 0;
        const r = n(16);
        e.deconstructPacket = function(t2) {
          const e2 = [], n2 = t2.data, o = t2;
          return o.data = function t3(e3, n3) {
            if (!e3)
              return e3;
            if (r.isBinary(e3)) {
              const t4 = { _placeholder: true, num: n3.length };
              return n3.push(e3), t4;
            }
            if (Array.isArray(e3)) {
              const r2 = new Array(e3.length);
              for (let o2 = 0; o2 < e3.length; o2++)
                r2[o2] = t3(e3[o2], n3);
              return r2;
            }
            if ("object" == typeof e3 && !(e3 instanceof Date)) {
              const r2 = {};
              for (const o2 in e3)
                e3.hasOwnProperty(o2) && (r2[o2] = t3(e3[o2], n3));
              return r2;
            }
            return e3;
          }(n2, e2), o.attachments = e2.length, { packet: o, buffers: e2 };
        }, e.reconstructPacket = function(t2, e2) {
          return t2.data = function t3(e3, n2) {
            if (!e3)
              return e3;
            if (e3 && e3._placeholder)
              return n2[e3.num];
            if (Array.isArray(e3))
              for (let r2 = 0; r2 < e3.length; r2++)
                e3[r2] = t3(e3[r2], n2);
            else if ("object" == typeof e3)
              for (const r2 in e3)
                e3.hasOwnProperty(r2) && (e3[r2] = t3(e3[r2], n2));
            return e3;
          }(t2.data, e2), t2.attachments = void 0, t2;
        };
      }, function(t, e) {
        function n(t2) {
          t2 = t2 || {}, this.ms = t2.min || 100, this.max = t2.max || 1e4, this.factor = t2.factor || 2, this.jitter = t2.jitter > 0 && t2.jitter <= 1 ? t2.jitter : 0, this.attempts = 0;
        }
        t.exports = n, n.prototype.duration = function() {
          var t2 = this.ms * Math.pow(this.factor, this.attempts++);
          if (this.jitter) {
            var e2 = Math.random(), n2 = Math.floor(e2 * this.jitter * t2);
            t2 = 0 == (1 & Math.floor(10 * e2)) ? t2 - n2 : t2 + n2;
          }
          return 0 | Math.min(t2, this.max);
        }, n.prototype.reset = function() {
          this.attempts = 0;
        }, n.prototype.setMin = function(t2) {
          this.ms = t2;
        }, n.prototype.setMax = function(t2) {
          this.max = t2;
        }, n.prototype.setJitter = function(t2) {
          this.jitter = t2;
        };
      }]);
    });
  })(uniSocket_io);
  const io = /* @__PURE__ */ getDefaultExportFromCjs(uniSocket_ioExports);
  const currentTimestamp = Date.now();
  formatTimestamp(currentTimestamp);
  const socket = io("ws://192.168.85.1:3001", {
    query: {},
    transports: ["websocket", "polling"],
    timeout: 5e3
  });
  const _sfc_main$b = {
    setup() {
      vue.onMounted(() => {
        socket.emit("message", "测试");
      });
      socket.on("allC", (data) => {
        formatAppLog("log", "at pages/testPage/testPage.vue:51", data);
      });
      const a = () => {
        socket.emit("message", { id: "qweqwe", age: 12 });
      };
      return {
        a
      };
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "background": "#bebebe", "padding": "5px" } }, [
      vue.createElementVNode("view", { class: "status-bar-height" }),
      vue.createCommentVNode("    <Comment></Comment>"),
      vue.createCommentVNode("驱蚊器问问去为额为邱琦雯顷刻间哈科进士第三空间活动空间哈后快"),
      vue.createCommentVNode("    <CommentExpand></CommentExpand>"),
      vue.createCommentVNode("    <CommentReplyWindow></CommentReplyWindow>"),
      vue.createCommentVNode("    <UserCard></UserCard>"),
      vue.createCommentVNode('    <view @tap="a">qweqweqwe</view>'),
      vue.createCommentVNode(" Left "),
      vue.createElementVNode("view", { class: "User1" }, [
        vue.createElementVNode("view", null, [
          vue.createElementVNode("image", { src: "https://static.runoob.com/images/mix/img_avatar.png" })
        ]),
        vue.createElementVNode("view", null, [
          vue.createElementVNode("view", { class: "left_triangle" }),
          vue.createElementVNode("text", null, " hello, man! ")
        ])
      ]),
      vue.createCommentVNode(" Right "),
      vue.createElementVNode("view", { class: "User2" }, [
        vue.createElementVNode("view", null, [
          vue.createElementVNode("image", { src: "https://static.runoob.com/images/mix/img_avatar.png" })
        ]),
        vue.createElementVNode("view", null, [
          vue.createElementVNode("view", { class: "right_triangle" }),
          vue.createElementVNode("text", null, " hello world ")
        ])
      ])
    ]);
  }
  const PagesTestPageTestPage = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$b], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/testPage/testPage.vue"]]);
  const _sfc_main$a = {
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
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
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
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$a], ["__scopeId", "data-v-7a807eb7"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-grid/components/uni-grid-item/uni-grid-item.vue"]]);
  const _sfc_main$9 = {
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
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
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
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$9], ["__scopeId", "data-v-07acefee"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-grid/components/uni-grid/uni-grid.vue"]]);
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
  const _sfc_main$8 = {
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
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
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
  const SearchHistory = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8], ["__scopeId", "data-v-54a2f8a1"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/search/SearchHistory.vue"]]);
  const _sfc_main$7 = {
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
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
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
  const SearchResult = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7], ["__scopeId", "data-v-7411b02c"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/search/SearchResult.vue"]]);
  const _sfc_main$6 = {
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
        formatAppLog("log", "at pages/search/search.vue:66", "监听到用户点击了搜索历史");
        inputSearchDAta.value = e.word;
      });
      const sendSearch = async () => {
        formatAppLog("log", "at pages/search/search.vue:72", "监听到用户点击了搜索历史");
        if (!inputSearchDAta.value) {
          pageBack();
        } else {
          formatAppLog("log", "at pages/search/search.vue:76", "用户搜索" + inputSearchDAta.value);
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
        formatAppLog("log", "at pages/search/search.vue:108", "用户在搜索界面按了返回键盘");
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
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
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
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "search__container__header__input--sub",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.inputSearchDAta = $event),
                focus: "true",
                "placeholder-class": "search__container__header__input--sub",
                "adjust-position": false,
                placeholder: "搜点什么...",
                onInput: _cache[1] || (_cache[1] = (...args) => $setup.inputSearch && $setup.inputSearch(...args)),
                onConfirm: _cache[2] || (_cache[2] = ($event) => $setup.inputSearchDAta ? $setup.sendSearch : null)
              },
              null,
              544
              /* HYDRATE_EVENTS, NEED_PATCH */
            ), [
              [vue.vModelText, $setup.inputSearchDAta]
            ]),
            vue.createElementVNode(
              "view",
              {
                class: "search__container__header__input--cancel",
                onClick: _cache[3] || (_cache[3] = vue.withModifiers((...args) => $setup.sendSearch && $setup.sendSearch(...args), ["stop"]))
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
  const PagesSearchSearch = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-c10c040c"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/search/search.vue"]]);
  const _sfc_main$5 = {
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
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
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
  const Publish = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-42e07aa5"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/publish/Publish.vue"]]);
  const _sfc_main$4 = {
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
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesPublishPublish = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-acfd9c67"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/publish/Publish.vue"]]);
  const _sfc_main$3 = {
    name: "reactionMsgCard"
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "width": "100%", "height": "120rpx", "background": "#F5F5F5", "padding": "10rpx", "display": "flex", "align-items": "center" } }, [
      vue.createElementVNode("view", { class: "reactionMsgCard__body" }, [
        vue.createElementVNode("view", { class: "reactionMsgCard__body__left" }, [
          vue.createElementVNode("view", { class: "reactionMsgCard__body__head" }, [
            vue.createElementVNode("view", { class: "reactionMsgCard__body__head--img" })
          ]),
          vue.createElementVNode("view", { class: "reactionMsgCard__body__info" }, [
            vue.createElementVNode("view", { class: "reactionMsgCard__body__info__name" }, [
              vue.createElementVNode("text", null, "阳光男孩")
            ]),
            vue.createElementVNode("view", { class: "reactionMsgCard__body__info__message" }, [
              vue.createElementVNode("text", null, "关注了你")
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "reactionMsgCard__body__right" }, [
          vue.createElementVNode("view", { class: "reactionMsgCard__body__right--time" }, [
            vue.createElementVNode("text", null, "5-9")
          ]),
          vue.createElementVNode("view", { class: "reactionMsgCard__body__right--img" }, [
            vue.createElementVNode("view", {
              class: "reactionMsgCard__body__right--img--path",
              style: { "background-image": "url('https://i2.hdslb.com/bfs/archive/38821fd5d4513d0626f99e328e424a3f15fb8118.jpg@672w_378h_1c_!web-home-common-cover.webp')" }
            })
          ])
        ])
      ])
    ]);
  }
  const ReactionMsgCard = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-0963c887"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/message/ReactionMsgCard.vue"]]);
  const _sfc_main$2 = {
    components: {
      ReactionMsgCard
    },
    setup() {
      vue.onMounted(() => {
      });
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      return {
        pageBack
      };
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_ReactionMsgCard = vue.resolveComponent("ReactionMsgCard");
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "w100 h100",
      style: { "overflow": "hidden" }
    }, [
      vue.createElementVNode("view", { class: "w100 h100" }, [
        vue.createElementVNode("view", { class: "reactionMsg__container w100 h100" }, [
          vue.createCommentVNode("        头部"),
          vue.createElementVNode("view", { class: "reactionMsg__container__header" }, [
            vue.createElementVNode("view", { style: { "height": "var(--status-bar-height)" } }),
            vue.createElementVNode("view", { class: "reactionMsg__container__header--main" }, [
              vue.createElementVNode("view", { class: "reactionMsg__container__header--button" }, [
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
              vue.createElementVNode("view", { class: "reactionMsg__container__header--title" }, vue.toDisplayString("全部消息")),
              vue.createElementVNode("view", { class: "reactionMsg__container__header--more" })
            ])
          ]),
          vue.createCommentVNode("        身体"),
          vue.createElementVNode("view", { class: "reactionMsg__container__body" }, [
            vue.createElementVNode("view", { class: "w100 h100" }, [
              vue.createElementVNode("scroll-view", {
                class: "scrollview",
                "scroll-y": "true",
                style: `width: 100%;height: 100%;background: #ffffff;`,
                "refresher-enabled": "true",
                "refresher-background": "#ffffff"
              }, [
                vue.createVNode(_component_ReactionMsgCard)
              ])
            ])
          ])
        ])
      ])
    ]);
  }
  const PagesMessageReactionMessageReactionMessage = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-fa095b8d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/message/ReactionMessage/ReactionMessage.vue"]]);
  const _sfc_main$1 = {
    name: "PrivateWindow",
    props: {
      position: Number,
      user: Object,
      time: String
    },
    setup(props) {
      let position = vue.ref(props.position);
      return {
        position
      };
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "margin-top": "30rpx", "padding": "20rpx" } }, [
      vue.createElementVNode("view", { class: "privateWindow" }, [
        vue.createElementVNode("view", { class: "privateWindow__container" }, [
          vue.createElementVNode("view", { class: "privateWindow__container__header" }),
          vue.createElementVNode("view", { class: "privateWindow__container__body" }, [
            vue.createCommentVNode(" Left "),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass($setup.position === 1 ? "User1" : "User2")
              },
              [
                vue.createElementVNode("view", null, [
                  vue.createElementVNode("view", {
                    class: "privateWindow__container__body--img",
                    style: { "background-image": "url('https://static.runoob.com/images/mix/img_avatar.png')" }
                  })
                ]),
                vue.createElementVNode("view", null, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass($setup.position === 1 ? "left_triangle" : "right_triangle")
                    },
                    null,
                    2
                    /* CLASS */
                  ),
                  vue.createElementVNode("text", null, " hello, man! ")
                ])
              ],
              2
              /* CLASS */
            )
          ])
        ])
      ])
    ]);
  }
  const PrivateWindow = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-20951d9e"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/message/private/PrivateWindow.vue"]]);
  const _sfc_main = {
    components: {
      Loading,
      ArticleDetailPage,
      TopBar,
      PrivateWindow
    },
    setup() {
      let headerTitle = vue.ref("91天王");
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
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_PrivateWindow = vue.resolveComponent("PrivateWindow");
    return vue.openBlock(), vue.createElementBlock("view", { class: "privateMessage" }, [
      vue.createElementVNode("view", { class: "privateMessage__container" }, [
        vue.createElementVNode("view", { class: "privateMessage__container__header" }, [
          vue.createElementVNode("view", { style: { "height": "var(--status-bar-height)" } }),
          vue.createElementVNode("view", { class: "privateMessage__container__header--main" }, [
            vue.createElementVNode("view", { class: "privateMessage__container__header--button" }, [
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
            vue.createElementVNode("view", { class: "privateMessage__container__header--title" }, [
              vue.createElementVNode(
                "view",
                {
                  class: "privateMessage__container__header--img",
                  style: vue.normalizeStyle("background-image: url(https://i0.hdslb.com/bfs/face/9827d2901925e8efaf27fbf077e13668f749798a.jpg@240w_240h_1c_1s_!web-avatar-space-header.webp);width: 30px;height: 30px;")
                },
                null,
                4
                /* STYLE */
              ),
              vue.createTextVNode(
                " " + vue.toDisplayString($setup.headerTitle),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "privateMessage__container__header--more" }, [
              vue.createVNode(_component_uni_icons, {
                type: "more",
                size: "20"
              })
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "privateMessage__container__body" }, [
          vue.createElementVNode("scroll-view", {
            "scroll-y": "true",
            style: { "width": "100%", "height": "100%" }
          }, [
            vue.createVNode(_component_PrivateWindow, { position: 1 }),
            vue.createVNode(_component_PrivateWindow, { position: 2 })
          ])
        ]),
        vue.createElementVNode("view", { class: "privateMessage__container__footer" })
      ])
    ]);
  }
  const PagesMessagePrivateMessagePrivateMessage = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d6363766"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/message/PrivateMessage/PrivateMessage.vue"]]);
  __definePage("pages/MainApp", PagesMainApp);
  __definePage("pages/article/detail/ArticleDetailPage", PagesArticleDetailArticleDetailPage);
  __definePage("pages/loginRegister/loginRegister", PagesLoginRegisterLoginRegister);
  __definePage("pages/testPage/testPage", PagesTestPageTestPage);
  __definePage("pages/search/search", PagesSearchSearch);
  __definePage("pages/publish/Publish", PagesPublishPublish);
  __definePage("pages/message/ReactionMessage/ReactionMessage", PagesMessageReactionMessageReactionMessage);
  __definePage("pages/message/PrivateMessage/PrivateMessage", PagesMessagePrivateMessagePrivateMessage);
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
