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
  function requireNativePlugin(name) {
    return weex.requireModule(name);
  }
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
  const _sfc_main$D = {
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
  function _sfc_render$C(_ctx, _cache, $props, $setup, $data, $options) {
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
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$D, [["render", _sfc_render$C], ["__scopeId", "data-v-d31e1c47"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
  const _sfc_main$C = {
    name: "TabBar",
    setup() {
      let haveNewInfo = vue.ref(false);
      uni.$on("received_new_information", function(e) {
        haveNewInfo.value = e.data;
        formatAppLog("log", "at components/common/TabBar.vue:42", haveNewInfo.value);
      });
      vue.onMounted(() => {
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
      };
      const goDynamic = (router) => {
        useUniEmitCurrentRouterUpdate(router);
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
      };
      const goMine = (router) => {
        useUniEmitCurrentRouterUpdate(router);
      };
      return {
        currentR,
        staticIconsColor,
        activityIconsColor,
        goHome,
        goDynamic,
        goPublish,
        goMessage,
        goMine,
        haveNewInfo
      };
    }
  };
  function _sfc_render$B(_ctx, _cache, $props, $setup, $data, $options) {
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
        vue.createElementVNode("view", { style: { "position": "relative" } }, [
          $setup.haveNewInfo ? (vue.openBlock(), vue.createBlock(_component_uni_icons, {
            key: 0,
            type: "smallcircle-filled",
            color: "red",
            size: "5rpx",
            style: { "position": "absolute", "top": "0", "right": "0" }
          })) : vue.createCommentVNode("v-if", true),
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
  const TabBar = /* @__PURE__ */ _export_sfc(_sfc_main$C, [["render", _sfc_render$B], ["__scopeId", "data-v-270561e4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/common/TabBar.vue"]]);
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
  function getUserConcernListByUid(id) {
    return request({
      url: "user/concern-list/" + id,
      method: "GET"
    });
  }
  function getUserFensListByUid(id) {
    return request({
      url: "user/fens-list/" + id,
      method: "GET"
    });
  }
  const IP = "192.168.85.1";
  const baseUrl = "http://" + IP + ":3000/api/";
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
  const PushMessageNotificationBar = (iconPath, content) => {
    let options = {
      cover: false,
      icon: iconPath,
      sound: "system"
    };
    plus.push.createMessage(content, "LocalMSG", options);
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
  function getArticleUserHandListByUserId(id) {
    return request({
      url: "article/user-hand-list/user/" + id
    });
  }
  function getArticleListByUserId(id) {
    return request({
      url: "article/list/user/" + id
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
  function getWatchByUid(id) {
    return request({
      url: "act/watch/user/" + id
    });
  }
  const _sfc_main$B = {
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
  function _sfc_render$A(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "background": "#fff", "text-align": "center" } }, [
      $props.loading ? (vue.openBlock(), vue.createElementBlock("image", {
        key: 0,
        mode: "widthFix",
        src: "/static/images/utils/list_loading.gif",
        style: { "width": "90%", "height": "250rpx" }
      })) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const Loading = /* @__PURE__ */ _export_sfc(_sfc_main$B, [["render", _sfc_render$A], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/loading/Loading.vue"]]);
  function getNMessageByReceiveUid(id) {
    return request({
      url: "message/action/user/" + id
    });
  }
  function getAllMessageByReceiveUid(id) {
    return request({
      url: "message/action/all/user/" + id
    });
  }
  function updateReadMessageByReceiveId(id) {
    return request({
      url: "message/action/read/user",
      method: "POST",
      data: { "u_id": id }
    });
  }
  function addActionMessage(data) {
    return request({
      url: "message/action",
      method: "POST",
      data: {
        "send_user_id": data.send_user_id,
        "send_user_name": data.send_user_name,
        "receive_user_id": data.receive_user_id,
        "receive_user_name": data.receive_user_name,
        "message_content": data.message_content,
        "article_id": data.article_id
      }
    });
  }
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
  const socket = io("ws://" + IP + ":3001", {
    query: {},
    transports: ["websocket", "polling"],
    timeout: 5e3
  });
  const emitActionMessage = (send_user_id, content, receive_user_id) => {
    socket.emit("action", {
      send_user_id,
      content,
      receive_user_id
    });
  };
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
      formatAppLog("log", "at components/article/articleFun.js:18", Obj);
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
  ArticleFun.addConcernMsg = async (send_user_id, send_user_name, receive_user_id, receive_user_name, article_id) => {
    if (send_user_id == receive_user_id) {
      return true;
    }
    let data = {
      send_user_id,
      send_user_name,
      receive_user_id,
      receive_user_name,
      message_content: `${send_user_name}关注了你`,
      article_id
    };
    emitActionMessage(send_user_id, data.message_content, receive_user_id);
    let res = await addActionMessage(data);
    return res.code === 200;
  };
  //添加评论消息 无论是评论文章还是评论评论 通用
  ArticleFun.addCommentMsg = async (send_user_id, send_user_name, receive_user_id, receive_user_name, message_content, article_id) => {
    if (send_user_id == receive_user_id) {
      return true;
    }
    let data = {
      send_user_id,
      send_user_name,
      receive_user_id,
      receive_user_name,
      message_content: `${send_user_name}评论了你:${message_content}`,
      article_id
    };
    emitActionMessage(send_user_id, data.message_content, receive_user_id);
    let res = await addActionMessage(data);
    return res.code === 200;
  };
  ArticleFun.addHandMsg = async (send_user_id, send_user_name, receive_user_id, receive_user_name, article_id) => {
    if (send_user_id == receive_user_id) {
      return true;
    }
    let data = {
      send_user_id,
      send_user_name,
      receive_user_id,
      receive_user_name,
      message_content: `${send_user_name}赞了你的文章`,
      article_id
    };
    emitActionMessage(send_user_id, data.message_content, receive_user_id);
    let res = await addActionMessage(data);
    return res.code === 200;
  };
  const _sfc_main$A = {
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
      let userObj = store2.getters.getUser;
      isSelf = isSelf.u_id;
      uni.$on("home_articleList_change", function(e) {
        e.u_id;
        articleInfo.value.concern_be;
      });
      uni.$on("articleCard_concern_update", function(e) {
        formatAppLog("log", "at components/article/ArticleCard.vue:137", "123123");
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
          formatAppLog("log", "at components/article/ArticleCard.vue:179", res.data);
          article_user_handBe.value = res.data.article_user_handBe;
        }
      };
      vue.onMounted(async () => {
        await initializeHand();
      });
      const needFollowModel = vue.ref(true);
      needFollowModel.value = props.needFollowModel;
      const tapArticleCard = (data) => {
        formatAppLog("log", "at components/article/ArticleCard.vue:197", "点击了文章卡");
        uni.navigateTo({
          url: "/pages/article/detail/ArticleDetailPage?id=" + data.article_id
        });
      };
      const tapAuthorCard = (data) => {
        formatAppLog("log", "at components/article/ArticleCard.vue:204", "点击了作者栏");
        uni.navigateTo({
          url: "/pages/user/user?id=" + data.article_user_id
        });
      };
      let canTapFollow = true;
      const tapFollowCard = (data) => {
        if (!userObj.u_id) {
          plus.nativeUI.toast(`用户未登录`);
          return;
        }
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
            formatAppLog("log", "at components/article/ArticleCard.vue:226", res);
            if (res.code === 200) {
              articleInfo.value.concern_be = 1;
              ArticleFun.setArticleCardUpdate(data.article_user_id, null, { concern_be: 1 });
              plus.nativeUI.toast(`关注成功`);
              ArticleFun.addConcernMsg(userObj.u_id, userObj.u_name, data.article_user_id, data.u_name, data.article_id);
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
        formatAppLog("log", "at components/article/ArticleCard.vue:247", "点击了关注");
      };
      const tapHandCard = (data) => {
        if (!userObj.u_id) {
          plus.nativeUI.toast(`用户未登录`);
          return;
        }
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
            formatAppLog("log", "at components/article/ArticleCard.vue:265", res);
            if (res.code === 200) {
              ArticleFun.setArticleCardUpdate(null, data.article_id, { hand: ++articleInfo.value.article_hand_support_num });
              plus.nativeUI.toast(`点赞成功`);
              ArticleFun.addHandMsg(userObj.u_id, userObj.u_name, data.article_user_id, data.u_name, data.article_id);
            }
          });
        } else {
          removeHandArticleByArticleId(data.article_id).then((res) => {
            formatAppLog("log", "at components/article/ArticleCard.vue:278", res);
            if (res.code === 200) {
              ArticleFun.setArticleCardUpdate(null, data.article_id, { hand: --articleInfo.value.article_hand_support_num });
              plus.nativeUI.toast(`取消点赞成功`);
            }
          });
        }
        formatAppLog("log", "at components/article/ArticleCard.vue:288", "点击了点赞");
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
  function _sfc_render$z(_ctx, _cache, $props, $setup, $data, $options) {
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
            onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.tapAuthorCard($setup.articleInfo), ["stop"]))
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
                { class: "active__cart__container__text__container__title textExceedsOneLineHiddenReplacedDots" },
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
  const ArticleCard = /* @__PURE__ */ _export_sfc(_sfc_main$A, [["render", _sfc_render$z], ["__scopeId", "data-v-9eefd57b"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/ArticleCard.vue"]]);
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
  const _sfc_main$z = {
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
      let classifyList2 = vue.ref();
      classifyList2.value = [];
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
        if (model_str_num === "pyq")
          return;
        clickNavIndex.value = e.page;
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:89", clickNavIndex.value);
      });
      let currentIndex = vue.ref();
      const swiperItemChange = (e) => {
        currentIndex.value = e.detail.current;
        uni.$emit("home_article_nav_change", { currentNavIndex: currentIndex.value });
      };
      const initializeHomeData = async () => {
        for (let i = 0; i < 3; i++) {
          classifyList2.value[i] = { categoryID: i, classifyTitle: "", classifyContent: "类别描述", currentPage: 1, articleList: [{}] };
        }
        lateArticleList.value = await getDetailedArticleByJsonData({
          "sort": 1,
          "page_number": 1,
          "articleContentMaxWord": 100,
          "select_title_num": 3
        });
        recommendArticleList.value = await getDetailedArticleByJsonData({
          "sort": 1,
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
        classifyList2.value[0].articleList = lateArticleList.value;
        classifyList2.value[1].articleList = recommendArticleList.value;
        classifyList2.value[2].articleList = hotArticleList.value;
      };
      const store2 = useStore();
      let login_u_id = store2.getters.getUser;
      login_u_id = login_u_id.u_id;
      formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:136", "ArticleList用户id" + login_u_id);
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
        classifyList2.value[0] = { categoryID: 0, classifyTitle: "", classifyContent: "类别描述", currentPage: 1, articleList: [{}] };
        concernArticleList.value = await getConcernDetailedArticleByJsonData({
          "u_id": login_u_id,
          "articleContentMaxWord": 100
        });
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:160", concernArticleList.value);
        classifyList2.value[0].articleList = concernArticleList.value;
      };
      let concernArticleNULL = vue.ref(false);
      let refreshOK = vue.ref(false);
      let canRefresh = true;
      const refreshListWithThrottle = async (index) => {
        refreshOK.value = true;
        setTimeout(() => {
          refreshOK.value = false;
          uni.$emit("home_articleList_change", { data: classifyList2.value });
        }, 1100);
        if (!canRefresh) {
          formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:180", "当前不能刷新");
          return;
        }
        canRefresh = false;
        setTimeout(() => {
          canRefresh = true;
        }, 1e3);
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:189", "下拉刷新被触发");
        indexReFreshPage = [1, 1, 1];
        if (set.static === 2) {
          concernArticleList.value = await getConcernDetailedArticleByJsonData({
            "u_id": login_u_id,
            "articleContentMaxWord": 100
          });
          classifyList2.value[index].articleList = concernArticleList.value;
          plus.nativeUI.toast(`已刷新`);
        } else {
          formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:199", index);
          if (index === 0) {
            formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:201", "123123123213213122");
            lateArticleList.value = await getDetailedArticleByJsonData({
              "sort": 1,
              "page_number": 1,
              "articleContentMaxWord": 100,
              "select_title_num": 3
            });
            classifyList2.value[index].articleList = lateArticleList.value;
          } else if (index === 1) {
            recommendArticleList.value = await getDetailedArticleByJsonData({
              "sort": 1,
              "page_number": 1,
              "articleContentMaxWord": 100,
              "select_title_num": 1
            });
            classifyList2.value[index].articleList = recommendArticleList.value;
          } else if (index === 2) {
            hotArticleList.value = await getDetailedArticleByJsonData({
              "sort": 1,
              "page_number": 1,
              "articleContentMaxWord": 100,
              "select_title_num": 2
            });
            classifyList2.value[index].articleList = hotArticleList.value;
          }
          plus.nativeUI.toast(`已刷新`);
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
          uni.$emit("home_articleList_change", { data: classifyList2.value });
        }, 1100);
        if (!canUpRefresh) {
          formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:248", "当前不能上拉刷新");
          plus.nativeUI.toast(`载入中...`);
          return;
        }
        canUpRefresh = false;
        setTimeout(() => {
          canUpRefresh = true;
        }, 1e3);
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:258", "上拉刷新被触发");
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
            classifyList2.value[index].articleList.push(articleList[i]);
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
        formatAppLog("log", "at components/home/articlesList/ArticlesList.vue:329", set);
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
      vue.watch(classifyList2, (newValue) => {
        let allArticleListHaveValue = newValue.every((item) => item.articleList.length > 1);
        if (allArticleListHaveValue) {
          scrollViewLoading.value = false;
        }
      }, { deep: true });
      return {
        scrollViewLoading,
        classifyList: classifyList2,
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
  function _sfc_render$y(_ctx, _cache, $props, $setup, $data, $options) {
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
                          style: { "margin-bottom": "10rpx" }
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
  const ArticlesList = /* @__PURE__ */ _export_sfc(_sfc_main$z, [["render", _sfc_render$y], ["__scopeId", "data-v-fc82db5d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/articlesList/ArticlesList.vue"]]);
  const _sfc_main$y = {
    components: {
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
        if (login_user.u_id) {
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
      const tapSan = () => {
        formatAppLog("log", "at pages/home/Home.vue:80", "点击扫描");
        plus.nativeUI.toast(`暂未开放`);
      };
      vue.onMounted(() => {
      });
      return {
        articleNavIndex,
        articleNavColor,
        unArticleNavColor,
        changeCurrentNavPage,
        tapSearch,
        tapSan
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
  function _sfc_render$x(_ctx, _cache, $props, $setup, $data, $options) {
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
                vue.createElementVNode("view", {
                  onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.tapSan(), ["stop"]))
                }, [
                  vue.createVNode(_component_uni_icons, {
                    type: "scan",
                    size: "55rpx",
                    color: "#002c52"
                  })
                ])
              ])
            ]),
            vue.createCommentVNode("          导航"),
            vue.createElementVNode("view", { class: "header__nav" }, [
              vue.createElementVNode("view", { class: "header__nav__container" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--option",
                    onClick: _cache[2] || (_cache[2] = ($event) => $setup.changeCurrentNavPage(0)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 0 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  [
                    vue.createTextVNode("最新"),
                    $setup.articleNavIndex === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "header__nav__container--option--a"
                    })) : vue.createCommentVNode("v-if", true)
                  ],
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--option",
                    onClick: _cache[3] || (_cache[3] = ($event) => $setup.changeCurrentNavPage(1)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 1 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  [
                    vue.createTextVNode("推荐"),
                    $setup.articleNavIndex === 1 ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "header__nav__container--option--a"
                    })) : vue.createCommentVNode("v-if", true)
                  ],
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--option",
                    onClick: _cache[4] || (_cache[4] = ($event) => $setup.changeCurrentNavPage(2)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 2 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  [
                    vue.createTextVNode("热门"),
                    $setup.articleNavIndex === 2 ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "header__nav__container--option--a"
                    })) : vue.createCommentVNode("v-if", true)
                  ],
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
  const Home = /* @__PURE__ */ _export_sfc(_sfc_main$y, [["render", _sfc_render$x], ["__scopeId", "data-v-a0df4f3d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/home/Home.vue"]]);
  const _sfc_main$x = {
    name: "Nologin",
    methods: {
      login: function() {
        uni.navigateTo({
          url: "/pages/loginRegister/loginRegister"
        });
      }
    },
    props: {
      imgChange: Number
    },
    setup(props) {
      let imgChangeNumber = vue.ref(1);
      if (props.imgChange) {
        imgChangeNumber.value = props.imgChange;
      }
      return {
        imgChangeNumber
      };
    }
  };
  function _sfc_render$w(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createElementVNode("view", { style: { "background": "#fff", "text-align": "center" } }, [
        $setup.imgChangeNumber === 1 ? (vue.openBlock(), vue.createElementBlock("image", {
          key: 0,
          mode: "widthFix",
          src: "/static/images/noTask.gif",
          style: { "width": "100%", "height": "auto" }
        })) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { style: { "font-size": "40rpx", "color": "#585858", "margin-bottom": "20rpx" } }, "您还没有登录"),
        vue.createElementVNode("view", { class: "nologin" }, [
          vue.createElementVNode("view", {
            class: "nologin--button",
            onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $options.login && $options.login(...args), ["stop"]))
          }, "去登录")
        ])
      ])
    ]);
  }
  const NoLogin = /* @__PURE__ */ _export_sfc(_sfc_main$x, [["render", _sfc_render$w], ["__scopeId", "data-v-26a25e63"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/noLogin/NoLogin.vue"]]);
  const _sfc_main$w = {
    components: {
      ArticlesList,
      Loading,
      NoLogin
    },
    props: {
      loginStatus: Boolean
    },
    setup(props) {
      let loginStatus = vue.ref(props.loginStatus);
      vue.onMounted(() => {
      });
      return {
        loginStatus
      };
    }
  };
  function _sfc_render$v(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_NoLogin = vue.resolveComponent("NoLogin");
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
            !$setup.loginStatus ? (vue.openBlock(), vue.createBlock(_component_NoLogin, {
              key: 0,
              "img-change": 1
            })) : (vue.openBlock(), vue.createElementBlock("view", {
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
  const Dynamic = /* @__PURE__ */ _export_sfc(_sfc_main$w, [["render", _sfc_render$v], ["__scopeId", "data-v-508725f9"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/pyq/Dynamic.vue"]]);
  const _sfc_main$v = {
    name: "messageCard",
    props: {
      data: Object,
      id: String,
      u_id: String
    },
    setup(props) {
      let messageCardInfo = vue.ref(props.data);
      let id = vue.ref(props.id);
      let store2 = useStore();
      let login_u_id = store2.getters.getUser;
      login_u_id = login_u_id.u_id;
      const tapMessageCard = () => {
        formatAppLog("log", "at components/message/MessageCard.vue:60", "用户点击信息卡");
        if (id.value === "action") {
          formatAppLog("log", "at components/message/MessageCard.vue:62", "打开互动消息");
          uni.navigateTo({
            url: "/pages/message/ReactionMessage/ReactionMessage?id=" + login_u_id
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
  function _sfc_render$u(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      style: { "width": "100%", "height": "120rpx", "background": "#F5F5F5", "padding": "10rpx", "display": "flex", "align-items": "centerl", "margin": "2rpx 0" },
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
          $setup.messageCardInfo.num !== null ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "messageCard__body__right--num"
          }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($setup.messageCardInfo.num),
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true)
        ])
      ])
    ]);
  }
  const MessageCard = /* @__PURE__ */ _export_sfc(_sfc_main$v, [["render", _sfc_render$u], ["__scopeId", "data-v-4762ac38"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/message/MessageCard.vue"]]);
  const _sfc_main$u = {
    components: {
      MessageCard,
      NoLogin
    },
    props: {
      loginStatus: Boolean
    },
    setup(props) {
      let loginStatus = vue.ref(props.loginStatus);
      let store2;
      store2 = useStore();
      let login_u_id = store2.getters.getUser;
      login_u_id = login_u_id.u_id;
      let refreshOK = vue.ref(false);
      let canRefresh = true;
      const refreshListWithThrottle = async () => {
        refreshOK.value = true;
        setTimeout(() => {
          refreshOK.value = false;
          uni.$emit("home_articleList_change", { data: classifyList.value });
        }, 1100);
        if (!canRefresh) {
          formatAppLog("log", "at pages/message/Message.vue:95", "当前不能刷新");
          return;
        }
        canRefresh = false;
        setTimeout(() => {
          canRefresh = true;
        }, 1e3);
        formatAppLog("log", "at pages/message/Message.vue:104", "下拉刷新被触发");
        await initializeInteractiveInformation();
        plus.nativeUI.toast(`已刷新`);
      };
      let actionMessageList = vue.ref();
      let leading = vue.ref(false);
      uni.$on("message_action", function(e) {
        let data = e.data;
        formatAppLog("log", "at pages/message/Message.vue:117", data);
        if (e.data.receive_user_id === login_u_id) {
          PushMessageNotificationBar("", data.content);
          plus.nativeUI.toast(`${data.content}`);
          initializeInteractiveInformation(login_u_id);
        }
      });
      const initializeInteractiveInformation = async (login_u_id2) => {
        leading.value = false;
        let res = await getNMessageByReceiveUid(login_u_id2);
        formatAppLog("log", "at pages/message/Message.vue:129", res);
        if (res.code === 200) {
          actionMessageList.value = res.data;
          formatAppLog("log", "at pages/message/Message.vue:132", actionMessageList);
          if (actionMessageList.value) {
            uni.$emit("received_new_information", {
              data: true
            });
          } else {
            uni.$emit("received_new_information", {
              data: false
            });
          }
        } else {
          uni.$emit("received_new_information", {
            data: false
          });
        }
        leading.value = true;
      };
      onShow(() => {
        initializeInteractiveInformation(login_u_id);
      });
      vue.onMounted(() => {
        initializeInteractiveInformation(login_u_id);
      });
      return {
        actionMessageList,
        formatDate,
        leading,
        loginStatus,
        refreshListWithThrottle,
        refreshOK
      };
    }
  };
  function _sfc_render$t(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_NoLogin = vue.resolveComponent("NoLogin");
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
            !$setup.loginStatus ? (vue.openBlock(), vue.createBlock(_component_NoLogin, { key: 0 })) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "w100 h100"
            }, [
              vue.createElementVNode("scroll-view", {
                class: "scrollview",
                "scroll-y": "true",
                style: `width: 100%;height: 100%;background: #ffffff;`,
                "refresher-enabled": "true",
                "refresher-background": "#f5f5f5",
                onRefresherrefresh: _cache[1] || (_cache[1] = ($event) => $setup.refreshListWithThrottle()),
                "refresher-triggered": $setup.refreshOK
              }, [
                $setup.leading ? (vue.openBlock(), vue.createBlock(_component_MessageCard, {
                  key: 0,
                  data: {
                    headImg: "http://114.115.220.47:3000/api/download/images/action.png",
                    name: "互动消息",
                    message: $setup.actionMessageList ? $setup.actionMessageList[$setup.actionMessageList.length - 1].message_content : "没有最新的信息",
                    time: $setup.actionMessageList ? $setup.formatDate($setup.actionMessageList[$setup.actionMessageList.length - 1].create_time) : "",
                    num: $setup.actionMessageList ? $setup.actionMessageList.length : null
                  },
                  id: "action"
                }, null, 8, ["data"])) : (vue.openBlock(), vue.createBlock(_component_MessageCard, {
                  key: 1,
                  onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
                  }, ["stop"])),
                  data: {
                    headImg: "http://114.115.220.47:3000/api/download/images/action.png",
                    name: "互动消息",
                    message: $setup.actionMessageList ? $setup.actionMessageList[$setup.actionMessageList.length - 1].message_content : "没有最新的信息",
                    time: $setup.actionMessageList ? $setup.formatDate($setup.actionMessageList[$setup.actionMessageList.length - 1].create_time) : "",
                    num: $setup.actionMessageList ? $setup.actionMessageList.length : null
                  },
                  id: "action"
                }, null, 8, ["data"])),
                vue.createCommentVNode("------------互动消息结束----------"),
                vue.createVNode(_component_MessageCard, {
                  data: {
                    headImg: "https://i0.hdslb.com/bfs/face/bd6d1a14ea10a3f7d2ca219544e03c929d2b823d.jpg@240w_240h_1c_1s_!web-avatar-space-header.webp",
                    name: "Yaoser",
                    message: "暂未开放私信功能",
                    time: "23-6-20",
                    num: 1
                  },
                  id: "123"
                }, null, 8, ["data"])
              ], 40, ["refresher-triggered"])
            ]))
          ])
        ])
      ])
    ]);
  }
  const Message = /* @__PURE__ */ _export_sfc(_sfc_main$u, [["render", _sfc_render$t], ["__scopeId", "data-v-6b9d1851"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/message/Message.vue"]]);
  const _sfc_main$t = {
    props: {
      u_id: String
    },
    components: {
      ArticleCard
    },
    setup(props) {
      let u_id = vue.ref();
      u_id.value = props.u_id;
      let articleList = vue.ref();
      const initialize = async (u_id2) => {
        let res = await getArticleListByUserId(u_id2);
        if (res.code === 200) {
          articleList.value = res.data;
        }
      };
      vue.onMounted(() => {
        initialize(u_id.value);
      });
      return {
        articleList
      };
    }
  };
  function _sfc_render$s(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_ArticleCard = vue.resolveComponent("ArticleCard");
    return vue.openBlock(), vue.createElementBlock("view", null, [
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($setup.articleList, (item, index) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: index,
            style: { "margin-bottom": "10rpx" }
          }, [
            vue.createVNode(_component_ArticleCard, {
              "article-data": item,
              "need-follow-model": false
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
    ]);
  }
  const UserArticleList = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["render", _sfc_render$s], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/user/UserArticleList.vue"]]);
  const _sfc_main$s = {
    props: {
      u_id: String
    },
    components: {
      ArticleCard
    },
    setup(props) {
      let u_id = vue.ref();
      u_id.value = props.u_id;
      let articleList = vue.ref();
      const initialize = async (u_id2) => {
        let res = await getArticleUserHandListByUserId(u_id2);
        if (res.code === 200) {
          articleList.value = res.data;
        }
      };
      vue.onMounted(() => {
        initialize(u_id.value);
      });
      return {
        articleList
      };
    }
  };
  function _sfc_render$r(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_ArticleCard = vue.resolveComponent("ArticleCard");
    return vue.openBlock(), vue.createElementBlock("view", null, [
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($setup.articleList, (item, index) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: index,
            style: { "margin-bottom": "10rpx" }
          }, [
            vue.createVNode(_component_ArticleCard, {
              "article-data": item,
              "need-follow-model": true
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
    ]);
  }
  const UserHandArticleList = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["render", _sfc_render$r], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/user/UserHandArticleList.vue"]]);
  const _sfc_main$r = {
    props: {
      u_id: String
    },
    components: {
      ArticleCard
    },
    setup(props) {
      let u_id = vue.ref();
      u_id.value = props.u_id;
      let articleList = vue.ref([]);
      let watchArticleIdData = [];
      let store2 = useStore();
      let userObj = vue.ref(store2.getters.getUser);
      const initialize = async (u_id2) => {
        let res = await getWatchByUid(u_id2);
        if (res.code === 200) {
          for (let i = 0; i < res.data.length; i++) {
            watchArticleIdData.push(res.data[i]);
            if (watchArticleIdData.length > 50) {
              break;
            }
          }
        }
        for (let i = 0; i < watchArticleIdData.length; i++) {
          let res1 = await getArticleDetailByID(watchArticleIdData[i].w_article_id);
          if (res1.code === 200) {
            res1.data.w_create_time = watchArticleIdData[i].w_create_time;
            formatAppLog("log", "at components/user/UerHistoryArticleList.vue:55", res1.data.w_create_time);
            articleList.value.push(res1.data);
          }
        }
      };
      vue.onMounted(async () => {
        if (userObj.value.u_id === u_id.value)
          await initialize(u_id.value);
      });
      return {
        articleList,
        formatTimestamp,
        userObj,
        u_id
      };
    }
  };
  function _sfc_render$q(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_ArticleCard = vue.resolveComponent("ArticleCard");
    return vue.openBlock(), vue.createElementBlock("view", null, [
      $setup.userObj.u_id !== $setup.u_id ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "disF-center",
        style: { "color": "#a0a0a0", "flex-direction": "column" }
      }, [
        vue.createElementVNode("view", null, "无法查看他/她人的历史记录")
      ])) : (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        vue.renderList($setup.articleList, (item, index) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: index,
            style: { "margin-bottom": "10rpx" }
          }, [
            vue.createElementVNode("view", {
              class: "disF-center",
              style: { "color": "#646464", "flex-direction": "column", "align-items": "flex-end", "font-size": "32rpx", "background": "#FFFFFF" }
            }, [
              vue.createElementVNode(
                "view",
                { style: { "margin-right": "30rpx" } },
                "查看时间：" + vue.toDisplayString(item.w_create_time = $setup.formatTimestamp(new Date(item.w_create_time)).slice(6, -7)),
                1
                /* TEXT */
              )
            ]),
            vue.createVNode(_component_ArticleCard, {
              "article-data": item,
              "need-follow-model": true
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
        vue.createElementVNode("view", null, "历史记录最多显示50条")
      ]),
      vue.createElementVNode("view", {
        class: "disF-center",
        style: { "color": "#a0a0a0", "flex-direction": "column" }
      }, [
        vue.createElementVNode("view", null, "已经到底了...")
      ])
    ]);
  }
  const UerHistoryArticleList = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["render", _sfc_render$q], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/user/UerHistoryArticleList.vue"]]);
  const _sfc_main$q = {
    name: "UserDetail",
    components: {
      UserArticleList,
      UserHandArticleList,
      UerHistoryArticleList,
      Loading
    },
    props: {
      userObj: Object,
      needFollow: Boolean,
      needEdit: Boolean,
      needBreak: Boolean,
      needLoginOut: Boolean
    },
    setup(props) {
      let userObj = vue.ref();
      userObj.value = props.userObj;
      let needFollow = vue.ref(false);
      needFollow.value = props.needFollow;
      let needEdit = vue.ref(false);
      needEdit.value = props.needEdit;
      let needBreak = vue.ref(false);
      needBreak.value = props.needBreak;
      let needLoginOut = vue.ref(false);
      needLoginOut.value = props.needLoginOut;
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      let fens_num = vue.ref();
      let concern_num = vue.ref();
      let loading = vue.ref(false);
      const initialize = async () => {
        loading.value = false;
        let res = await getUserConcernListByUid(userObj.value.u_id);
        let res1 = await getUserFensListByUid(userObj.value.u_id);
        if (res.code === 200 && res1.code === 200) {
          fens_num.value = res1.data.length;
          concern_num.value = res.data.length;
        }
        loading.value = true;
      };
      vue.onMounted(async () => {
        await initialize();
      });
      const loginOut = () => {
        uni.$emit("login_out", () => {
        });
      };
      let articleNavIndex = vue.ref(0);
      let articleNavColor = "#131313";
      let unArticleNavColor = "#a2a3ab";
      uni.$on("userDetail_follow_nav_change", function(e) {
        articleNavIndex.value = e.currentNavIndex;
      });
      const changeCurrentNavPage = (page) => {
        uni.$emit("userDetail_nav_change", { page });
      };
      let clickNavIndex = vue.ref();
      uni.$on("userDetail_nav_change", function(e) {
        clickNavIndex.value = e.page;
        formatAppLog("log", "at components/user/UserDetail.vue:210", clickNavIndex.value);
      });
      let currentIndex = vue.ref();
      const swiperItemChange = (e) => {
        currentIndex.value = e.detail.current;
        uni.$emit("userDetail_follow_nav_change", { currentNavIndex: currentIndex.value });
      };
      const store2 = useStore();
      let Self = store2.getters.getUser;
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
            formatAppLog("log", "at components/user/UserDetail.vue:238", res);
            if (res.code === 200) {
              userObj.value.concern_be = 1;
              ArticleFun.setArticleCardUpdate(data.u_id, null, { concern_be: 1 });
              plus.nativeUI.toast(`关注成功`);
              ArticleFun.addConcernMsg(Self.u_id, Self.u_name, data.u_id, data.u_name, null);
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
        formatAppLog("log", "at components/user/UserDetail.vue:259", "点击了关注");
      };
      const tapFans = (data) => {
        formatAppLog("log", "at components/user/UserDetail.vue:264", "点击了作者栏");
        uni.navigateTo({
          url: "/pages/user/fans?id=" + data.u_id
        });
      };
      const tapConcern = (data) => {
        formatAppLog("log", "at components/user/UserDetail.vue:271", "点击了作者栏");
        uni.navigateTo({
          url: "/pages/user/concern?id=" + data.u_id
        });
      };
      return {
        articleNavIndex,
        articleNavColor,
        unArticleNavColor,
        changeCurrentNavPage,
        clickNavIndex,
        currentIndex,
        swiperItemChange,
        userObj,
        needEdit,
        needFollow,
        defaultHeadImgPath,
        pageBack,
        needBreak,
        tapFollowCard,
        fens_num,
        concern_num,
        loading,
        loginOut,
        needLoginOut,
        tapFans,
        tapConcern
      };
    }
  };
  function _sfc_render$p(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_UserArticleList = vue.resolveComponent("UserArticleList");
    const _component_UserHandArticleList = vue.resolveComponent("UserHandArticleList");
    const _component_UerHistoryArticleList = vue.resolveComponent("UerHistoryArticleList");
    return vue.openBlock(), vue.createElementBlock("view", { style: { "width": "100vw", "height": "100%", "overflow": "hidden" } }, [
      vue.createElementVNode("scroll-view", {
        "scroll-y": "true",
        style: { "height": "100%", "overflow": "hidden" }
      }, [
        vue.createElementVNode("view", { class: "userDetail__container h100" }, [
          vue.createElementVNode("view", {
            class: "userDetail__container__header",
            style: { "height": "50%" }
          }, [
            vue.createElementVNode("view", {
              class: "userDetail__container__header__bg",
              style: { "height": "60%" }
            }, [
              vue.createElementVNode("view", {
                class: "userDetail__container__header__bg--img",
                style: { "height": "85%" }
              }, [
                $setup.needBreak ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "userDetail__container__header__bg__break",
                  onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $setup.pageBack && $setup.pageBack(...args), ["stop"]))
                }, [
                  vue.createVNode(_component_uni_icons, {
                    type: "left",
                    size: "50rpx",
                    color: "#ffffff"
                  })
                ])) : vue.createCommentVNode("v-if", true),
                $setup.needLoginOut ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $setup.loginOut && $setup.loginOut(...args), ["stop"])),
                  class: "loginOut"
                }, "注销")) : vue.createCommentVNode("v-if", true)
              ]),
              vue.createElementVNode("view", {
                class: "userDetail__container__header__bg__space",
                style: { "height": "15%" }
              }, [
                $setup.needFollow ? vue.withDirectives((vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "userDetail__container__header__bg__space--button",
                    onClick: _cache[2] || (_cache[2] = vue.withModifiers(($event) => $setup.tapFollowCard($setup.userObj), ["stop"]))
                  },
                  " 关注 ",
                  512
                  /* NEED_PATCH */
                )), [
                  [vue.vShow, $setup.userObj.concern_be === 0]
                ]) : vue.createCommentVNode("v-if", true),
                $setup.needFollow ? vue.withDirectives((vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 1,
                    class: "userDetail__container__header__bg__space--button",
                    style: { "border": "1px #929292 solid", "color": "#929292" },
                    onClick: _cache[3] || (_cache[3] = vue.withModifiers(($event) => $setup.tapFollowCard($setup.userObj), ["stop"]))
                  },
                  " 已关注 ",
                  512
                  /* NEED_PATCH */
                )), [
                  [vue.vShow, $setup.userObj.concern_be === 1]
                ]) : vue.createCommentVNode("v-if", true),
                $setup.needEdit ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 2,
                  class: "userDetail__container__header__bg__space--button"
                }, " 编辑 ")) : vue.createCommentVNode("v-if", true),
                vue.createCommentVNode("v-if", true)
              ]),
              vue.createElementVNode(
                "view",
                {
                  class: "userDetail__container__header__bg__headImg",
                  style: vue.normalizeStyle($setup.userObj.u_head ? "background-image: url(" + $setup.userObj.u_head + ")" : "background-image: url(" + $setup.defaultHeadImgPath + ")")
                },
                null,
                4
                /* STYLE */
              )
            ]),
            vue.createElementVNode("view", {
              class: "userDetail__container__header__info",
              style: { "height": "40%", "padding": "40rpx" }
            }, [
              vue.createElementVNode("view", { class: "userDetail__container__header__info__user" }, [
                vue.createElementVNode(
                  "view",
                  { class: "userDetail__container__header__info__user--name" },
                  vue.toDisplayString($setup.userObj.u_name),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "userDetail__container__header__info__user--nickname" }, [
                  vue.createVNode(_component_uni_icons, {
                    type: "color-filled",
                    size: "30rpx",
                    color: "#909090"
                  }),
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString($setup.userObj.u_signature),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "userDetail__container__header__info__user--ip" }, [
                  vue.createVNode(_component_uni_icons, {
                    type: "location-filled",
                    size: "30rpx",
                    color: "#909090"
                  }),
                  vue.createElementVNode("text", null, vue.toDisplayString("IP所属：黑龙江"))
                ])
              ]),
              vue.createCommentVNode('          <Loading v-if="!loading"></Loading>'),
              $setup.loading ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "userDetail__container__header__info__grades"
              }, [
                vue.createElementVNode("view", {
                  class: "userDetail__container__header__info__grades__option",
                  onClick: _cache[4] || (_cache[4] = vue.withModifiers(($event) => $setup.tapConcern($setup.userObj), ["stop"]))
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "userDetail__container__header__info__grades__option--num" },
                    vue.toDisplayString($setup.concern_num),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "userDetail__container__header__info__grades__option--word" }, vue.toDisplayString("关注"))
                ]),
                vue.createElementVNode("view", {
                  class: "userDetail__container__header__info__grades__option",
                  onClick: _cache[5] || (_cache[5] = vue.withModifiers(($event) => $setup.tapFans($setup.userObj), ["stop"]))
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "userDetail__container__header__info__grades__option--num" },
                    vue.toDisplayString($setup.fens_num),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "userDetail__container__header__info__grades__option--word" }, vue.toDisplayString("粉丝"))
                ]),
                vue.createElementVNode("view", { class: "userDetail__container__header__info__grades__option" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "userDetail__container__header__info__grades__option--num" },
                    vue.toDisplayString($setup.userObj.get_hand_num),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "userDetail__container__header__info__grades__option--word" }, vue.toDisplayString("获赞"))
                ])
              ])) : vue.createCommentVNode("v-if", true)
            ])
          ]),
          vue.createElementVNode("view", {
            class: "userDetail__container__body",
            style: { "height": "90%" }
          }, [
            vue.createElementVNode("view", {
              class: "header__nav",
              style: { "height": "6%" }
            }, [
              vue.createElementVNode("view", {
                style: { "height": "15%" },
                class: "bg-efefef"
              }),
              vue.createElementVNode("view", {
                class: "header__nav__container",
                style: { "height": "85%" }
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--option",
                    onClick: _cache[6] || (_cache[6] = ($event) => $setup.changeCurrentNavPage(0)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 0 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  [
                    vue.createElementVNode("text", null, "发布"),
                    $setup.articleNavIndex === 0 ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 })) : vue.createCommentVNode("v-if", true)
                  ],
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--option",
                    onClick: _cache[7] || (_cache[7] = ($event) => $setup.changeCurrentNavPage(1)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 1 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  [
                    vue.createElementVNode("text", null, "点赞"),
                    $setup.articleNavIndex === 1 ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 })) : vue.createCommentVNode("v-if", true)
                  ],
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--option",
                    onClick: _cache[8] || (_cache[8] = ($event) => $setup.changeCurrentNavPage(2)),
                    style: vue.normalizeStyle($setup.articleNavIndex === 2 ? "  color: " + $setup.articleNavColor + ";" : "color: " + $setup.unArticleNavColor + ";")
                  },
                  [
                    vue.createElementVNode("text", null, "历史"),
                    $setup.articleNavIndex === 2 ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 })) : vue.createCommentVNode("v-if", true)
                  ],
                  4
                  /* STYLE */
                )
              ])
            ]),
            vue.createElementVNode("view", {
              style: { "height": "5rpx" },
              class: "bg-efefef"
            }),
            vue.createElementVNode("swiper", {
              style: { "width": "100%", "height": "100%", "padding": "0 0" },
              autoplay: false,
              onChange: _cache[9] || (_cache[9] = ($event) => $setup.swiperItemChange($event)),
              current: $setup.clickNavIndex
            }, [
              vue.createCommentVNode("            发布"),
              vue.createElementVNode("swiper-item", null, [
                vue.createElementVNode("scroll-view", {
                  class: "scrollview",
                  "scroll-y": "true",
                  style: `width: 100%;height: 100%;background: #f5f5f5;`
                }, [
                  vue.createVNode(_component_UserArticleList, {
                    u_id: $setup.userObj.u_id
                  }, null, 8, ["u_id"])
                ])
              ]),
              vue.createCommentVNode("            点赞"),
              vue.createElementVNode("swiper-item", null, [
                vue.createElementVNode("scroll-view", {
                  class: "scrollview",
                  "scroll-y": "true",
                  style: `width: 100%;height: 100%;background: #f5f5f5;`
                }, [
                  vue.createVNode(_component_UserHandArticleList, {
                    u_id: $setup.userObj.u_id
                  }, null, 8, ["u_id"])
                ])
              ]),
              vue.createCommentVNode("            历史"),
              vue.createElementVNode("swiper-item", null, [
                vue.createElementVNode("scroll-view", {
                  class: "scrollview",
                  "scroll-y": "true",
                  style: `width: 100%;height: 100%;background: #f5f5f5;`
                }, [
                  $setup.articleNavIndex === 2 ? (vue.openBlock(), vue.createBlock(_component_UerHistoryArticleList, {
                    key: 0,
                    u_id: $setup.userObj.u_id
                  }, null, 8, ["u_id"])) : vue.createCommentVNode("v-if", true)
                ])
              ])
            ], 40, ["current"])
          ])
        ])
      ])
    ]);
  }
  const UserDetail = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["render", _sfc_render$p], ["__scopeId", "data-v-597bd1cc"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/user/UserDetail.vue"]]);
  const _sfc_main$p = {
    components: {
      NoLogin,
      UserDetail
    },
    props: {
      loginStatus: Boolean
    },
    setup(props) {
      let loginStatus = vue.ref(props.loginStatus);
      const loginOut = () => {
        uni.$emit("login_out", () => {
        });
      };
      let store2;
      let user = vue.ref();
      let loading = vue.ref(false);
      onShow(async () => {
        loading.value = false;
        store2 = useStore();
        let loginUser = store2.getters.getUser;
        let res = await getUserDetailBy(loginUser.u_id);
        formatAppLog("log", "at pages/mine/Mine.vue:48", res);
        if (res.code === 200) {
          user.value = res.data;
        }
        loading.value = true;
      });
      return {
        loginOut,
        loginStatus,
        user,
        loading
      };
    }
  };
  function _sfc_render$o(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_NoLogin = vue.resolveComponent("NoLogin");
    const _component_UserDetail = vue.resolveComponent("UserDetail");
    return vue.openBlock(), vue.createElementBlock("view", { id: "Mine" }, [
      $setup.loading ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "mine__container"
      }, [
        !$setup.loginStatus ? (vue.openBlock(), vue.createBlock(_component_NoLogin, {
          key: 0,
          "img-change": 1
        })) : vue.createCommentVNode("v-if", true),
        $setup.loginStatus ? (vue.openBlock(), vue.createBlock(_component_UserDetail, {
          key: 1,
          "need-break": false,
          "need-follow": false,
          "need-edit": true,
          "user-obj": $setup.user,
          "need-login-out": true
        }, null, 8, ["user-obj"])) : vue.createCommentVNode("v-if", true)
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const Mine = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["render", _sfc_render$o], ["__scopeId", "data-v-9bc331c6"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/mine/Mine.vue"]]);
  const _sfc_main$o = {
    components: {
      TabBar,
      Home,
      Dynamic,
      Message,
      Mine
    },
    setup() {
      const store2 = useStore();
      let loading = vue.ref(false);
      const initialize = () => {
        loading.value = false;
        loginUseUser({
          email: "测试token",
          password: "测试token"
        }).then((res) => {
          formatAppLog("log", "at pages/MainApp.vue:42", res);
          if (res.code == 200) {
            try {
              const currentUser = res.data;
              if (!saveVuex(currentUser)) {
                plus.nativeUI.toast(`MainApp设置缓存出现了错误，请尝试重新启动`);
                uni.removeStorageSync("token");
                return;
              }
              uni.setStorageSync("token", res.token);
              plus.nativeUI.toast(`登录成功，当前用户：${res.data.u_id}`);
              loginStatus.value = true;
            } catch (e) {
              plus.nativeUI.toast(`MainApp用户信息缓存登录出现了错误：${e}`);
            }
          } else {
            plus.nativeUI.toast(`用户未登录`);
            loginStatus.value = false;
          }
          loading.value = true;
        });
      };
      let loginStatus = vue.ref(false);
      uni.$on("login_out", () => {
        uni.removeStorageSync("token");
        store2.dispatch("resetUser");
        uni.showToast({
          title: "注销成功",
          icon: "success",
          // 可选值：'success', 'loading', 'none'
          duration: 1e3
          // 持续时间，默认为1500ms
        });
        initialize();
      });
      onShow(() => {
      });
      vue.onMounted(() => {
        initialize();
      });
      const saveVuex = (userData) => {
        try {
          store2.dispatch("addUser", userData);
          formatAppLog("log", "at pages/MainApp.vue:96", store2.getters.getUser);
          return true;
        } catch (e) {
          plus.nativeUI.toast(`MainApp报错：${e}`);
          formatAppLog("log", "at pages/MainApp.vue:100", e);
          return false;
        }
      };
      let backButtonPress = vue.ref(0);
      let currentR = vue.ref("Home");
      uni.$on("currentRouterUpdate", function(data) {
        currentR.value = data.router;
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
        loading,
        loginStatus
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
  function _sfc_render$n(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Home = vue.resolveComponent("Home");
    const _component_Dynamic = vue.resolveComponent("Dynamic");
    const _component_Message = vue.resolveComponent("Message");
    const _component_Mine = vue.resolveComponent("Mine");
    const _component_TabBar = vue.resolveComponent("TabBar");
    return vue.openBlock(), vue.createElementBlock("view", {
      id: "Main",
      style: { "width": "100%", "height": "100vh", "overflow": "hidden" }
    }, [
      $setup.loading ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
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
        vue.withDirectives(vue.createVNode(_component_Dynamic, { "login-status": $setup.loginStatus }, null, 8, ["login-status"]), [
          [vue.vShow, $setup.currentR === "Dynamic"]
        ]),
        vue.withDirectives(vue.createVNode(_component_Message, { "login-status": $setup.loginStatus }, null, 8, ["login-status"]), [
          [vue.vShow, $setup.currentR === "Message"]
        ]),
        vue.withDirectives(vue.createVNode(_component_Mine, { "login-status": $setup.loginStatus }, null, 8, ["login-status"]), [
          [vue.vShow, $setup.currentR === "Mine"]
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createVNode(_component_TabBar)
    ]);
  }
  const PagesMainApp = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["render", _sfc_render$n], ["__scopeId", "data-v-dc27c07e"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/MainApp.vue"]]);
  const _sfc_main$n = {
    setup() {
      socket.on("action", function(data) {
        uni.$emit("message_action", {
          data
        });
      });
    },
    onLaunch: function() {
      formatAppLog("log", "at App.vue:14", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:17", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:20", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/App.vue"]]);
  const _sfc_main$m = {
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
  function _sfc_render$m(_ctx, _cache, $props, $setup, $data, $options) {
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
                        vue.toDisplayString($setup.commentObj.comment_user_father_name),
                        1
                        /* TEXT */
                      ),
                      vue.createTextVNode("： ")
                    ])) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode(
                      "text",
                      { style: { "display": "inline-block", "white-space": "pre-wrap", "word-wrap": "break-word", "height": "auto", "overflow-wrap": "break-word", "word-break": "break-all" } },
                      vue.toDisplayString($setup.commentObj.comment_content),
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
                              }, " 作者 ")) : vue.createCommentVNode("v-if", true),
                              vue.createTextVNode("： ")
                            ]),
                            vue.createElementVNode(
                              "text",
                              { style: { "display": "inline-block", "white-space": "pre-wrap", "word-wrap": "break-word", "height": "auto", "overflow-wrap": "break-word", "word-break": "break-all" } },
                              vue.toDisplayString(item1.comment_list_user_content),
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
  const CommentCard = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["render", _sfc_render$m], ["__scopeId", "data-v-1acd372d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentCard.vue"]]);
  const _sfc_main$l = {
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
  function _sfc_render$l(_ctx, _cache, $props, $setup, $data, $options) {
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
  const CommentExpand = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$l], ["__scopeId", "data-v-b72a798a"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentExpand.vue"]]);
  const _sfc_main$k = {
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
      const store2 = useStore();
      let userObj = store2.getters.getUser;
      let sending = vue.ref(false);
      vue.onMounted(async () => {
        reply_user_name.value = await getUserNameByUid(commentObj.value.comment_user_id);
      });
      const windowClose = () => {
        if (sending.value === true)
          return;
        formatAppLog("log", "at components/article/comments/CommentReplyWindow.vue:76", "用户在评论回复窗口界面 触发关闭");
        uni.$emit("comment_reply_window_close", { data: true });
      };
      let input_value = vue.ref();
      const inputComment = (e) => {
        input_value.value = e.detail.value;
      };
      const sendComment = async () => {
        if (!userObj.u_id) {
          plus.nativeUI.toast(`请先登录后评论`);
          return;
        }
        sending.value = true;
        let res = await addComment(props.article_id, commentObj.value.comment_id, input_value.value);
        formatAppLog("log", "at components/article/comments/CommentReplyWindow.vue:96", res);
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
          let u_name = await getUserNameByUid(commentObj.value.comment_user_id);
          await ArticleFun.addCommentMsg(userObj.u_id, userObj.u_name, commentObj.value.comment_user_id, u_name, input_value.value, articleObj.value.article_id);
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
          formatAppLog("log", "at components/article/comments/CommentReplyWindow.vue:142", "向文章卡 添加回复数 信息 记录失败");
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
  function _sfc_render$k(_ctx, _cache, $props, $setup, $data, $options) {
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
                    placeholder: "我有话想说...(200字)",
                    maxlength: 150,
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
  const CommentReplyWindow = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["render", _sfc_render$k], ["__scopeId", "data-v-31eef9f2"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentReplyWindow.vue"]]);
  const _sfc_main$j = {
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
      const store2 = useStore();
      let userObj = store2.getters.getUser;
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
        formatAppLog("log", "at components/article/comments/CommentList.vue:131", res);
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
          formatAppLog("log", "at components/article/comments/CommentList.vue:145", res2);
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
        await initializeHand();
      });
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      onBackPress((e) => {
        formatAppLog("log", "at components/article/comments/CommentList.vue:177", e);
        formatAppLog("log", "at components/article/comments/CommentList.vue:178", "用户在详细文章界面按了返回键盘");
        if (e.from === "backbutton") {
          formatAppLog("log", "at components/article/comments/CommentList.vue:182", isReply.value);
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
      let canTapFollow = true;
      const tapHandCard = (data) => {
        formatAppLog("log", "at components/article/comments/CommentList.vue:208", "文章详细界面点击了 点赞 ");
        if (!userObj.u_id) {
          plus.nativeUI.toast(`用户未登录`);
          return;
        }
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
            formatAppLog("log", "at components/article/comments/CommentList.vue:223", res);
            if (res.code === 200) {
              ArticleFun.setArticleCardUpdate(null, data.article_id, { hand: ++articleInfo.value.article_hand_support_num });
              plus.nativeUI.toast(`点赞成功`);
              ArticleFun.addHandMsg(userObj.u_id, userObj.u_name, data.article_user_id, data.u_name, data.article_id);
              article_user_handBe.value = 1;
            }
          });
        } else {
          removeHandArticleByArticleId(data.article_id).then((res) => {
            formatAppLog("log", "at components/article/comments/CommentList.vue:237", res);
            if (res.code === 200) {
              ArticleFun.setArticleCardUpdate(null, data.article_id, { hand: --articleInfo.value.article_hand_support_num });
              plus.nativeUI.toast(`取消点赞成功`);
              article_user_handBe.value = 0;
            }
          });
        }
        formatAppLog("log", "at components/article/comments/CommentList.vue:248", "点击了点赞");
      };
      let article_user_handBe = vue.ref(0);
      const initializeHand = async () => {
        let res = await getArticleUserHandStateById(articleInfo.value.article_id);
        if (res.code === 200) {
          formatAppLog("log", "at components/article/comments/CommentList.vue:255", res.data);
          article_user_handBe.value = res.data.article_user_handBe;
        }
      };
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
        iWantSpeak,
        article_user_handBe,
        tapHandCard
      };
    }
  };
  function _sfc_render$j(_ctx, _cache, $props, $setup, $data, $options) {
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
              vue.createElementVNode("view", {
                onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.tapHandCard($setup.articleInfo), ["stop"]))
              }, [
                vue.createVNode(_component_uni_icons, {
                  color: $setup.article_user_handBe === 0 ? "#333333" : "#0091ff",
                  type: "hand-up",
                  size: "23"
                }, null, 8, ["color"]),
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
  const CommentList = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$j], ["__scopeId", "data-v-404a4e6d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentList.vue"]]);
  const _sfc_main$i = {
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
      let userObj = store2.getters.getUser;
      const getAuthorInfo = async (id) => {
        try {
          const res = await getUserInfoById(id);
          if (res.code === 200) {
            return res.data[0];
          } else {
            formatAppLog("log", "at components/article/ArticleDetailPage.vue:112", `获取个人信息错误
          代码：${res.code}`);
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
            formatAppLog("log", "at components/article/ArticleDetailPage.vue:134", `获取关注状态错误
          代码：${res.code}`);
          }
        } catch (error) {
          plus.nativeUI.toast(`获取关注状态错误
          代码：${error}`, { duration: "long" });
        }
      };
      const setWatchByArticleId = async (id) => {
        if (!userObj.u_id) {
          plus.nativeUI.toast(`用户未登录`);
          return;
        }
        try {
          await addWatchByArticleId(id);
          ArticleFun.setArticleCardUpdate(null, id, { watch: ++articleInfo.value.article_watch_num });
        } catch (e) {
          formatAppLog("log", "at components/article/ArticleDetailPage.vue:153", "添加历史观看记录失败");
        }
      };
      let html = vue.ref(`<div style='color:red' class='classTest'>文章加载失败</div>`);
      let articleId = vue.ref("1");
      onLoad(async (option) => {
        let id = option.id;
        articleId.value = id;
        await getArticleByID(articleId.value).then((res) => {
          formatAppLog("log", "at components/article/ArticleDetailPage.vue:165", res);
          if (res.code === 200) {
            articleInfo.value = res.data[0];
            html.value = replaceImgSrc(articleInfo.value.article_content);
          }
        });
        const regex = new RegExp("<img", "gi");
        html.value = html.value.replace(regex, `<img style="max-width:100% !important;height:auto;display:block;margin: 10px auto;width:98%;border-radius: 8px;"`);
        authorInfo.value = await getAuthorInfo(articleInfo.value.article_user_id);
        concern_be.value = await getUserConcern(selfId, articleInfo.value.article_user_id);
        await setWatchByArticleId(articleInfo.value.article_id);
      });
      const tapAuthorCard = (data) => {
        formatAppLog("log", "at components/article/ArticleDetailPage.vue:187", "点击了作者栏");
      };
      let canTapFollow = true;
      const tapFollowCard = (data) => {
        if (!userObj.u_id) {
          plus.nativeUI.toast(`用户未登录`);
          return;
        }
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
            formatAppLog("log", "at components/article/ArticleDetailPage.vue:206", res);
            if (res.code === 200) {
              concern_be.value = true;
              ArticleFun.setArticleCardUpdate(data.u_id, null, { concern_be: 1 });
              plus.nativeUI.toast(`关注成功`);
              ArticleFun.addConcernMsg(userObj.u_id, userObj.u_name, articleInfo.value.article_user_id, data.u_name, articleInfo.value.article_id);
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
        formatAppLog("log", "at components/article/ArticleDetailPage.vue:227", "点击了关注");
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
  function _sfc_render$i(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
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
  const ArticleDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$i], ["__scopeId", "data-v-388cd4fe"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/ArticleDetailPage.vue"]]);
  const _sfc_main$h = {
    components: {
      Loading,
      ArticleDetailPage
    },
    setup() {
      let headerTitle = vue.ref("文章详细");
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
  function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesArticleDetailArticleDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$h], ["__scopeId", "data-v-b0178992"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/article/detail/ArticleDetailPage.vue"]]);
  const _sfc_main$g = {
    setup() {
      let account = vue.ref();
      let password = vue.ref();
      const login = () => {
        if (!account.value || !password.value) {
          plus.nativeUI.toast(`请输入账号或者密码`);
          return;
        }
        if (account.value == "" || password.value == "") {
          plus.nativeUI.toast(`请输入账号或者密码`);
          return;
        }
        uni.removeStorageSync("token");
        loginUseUser({
          email: account.value,
          password: password.value
          // email: '111@qq.com',
          // password: '12312321'
        }).then((res) => {
          formatAppLog("log", "at pages/loginRegister/loginRegister.vue:90", res);
          if (res.code == 200) {
            try {
              uni.setStorageSync("token", res.token);
              uni.reLaunch({
                url: "/pages/MainApp"
              });
            } catch (e) {
              plus.nativeUI.toast(`登录发生异常：${e}`);
            }
          } else {
            plus.nativeUI.toast(`登录失败-原因：${res.message}-代码${res.code}`);
          }
        });
      };
      return {
        account,
        password,
        login
      };
    }
  };
  function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "width": "100vw", "height": "100vh" } }, [
      vue.createElementVNode("view", { class: "loginRegister__container" }, [
        vue.createElementVNode("view", { class: "loginRegister__container__header status-bar-height" }),
        vue.createElementVNode("view", { class: "loginRegister__container__body" }, [
          vue.createElementVNode("view", { class: "loginRegister__container__body__login" }, [
            vue.createElementVNode("view", { class: "loginRegister__container__body__login__title" }, [
              vue.createElementVNode("text", null, "账号密码登录")
            ]),
            vue.createElementVNode("view", { class: "loginRegister__container__body__login__email" }, [
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  type: "text",
                  maxlength: 20,
                  placeholder: "账号/邮箱/手机号",
                  "adjust-position": false,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.account = $event)
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.account]
              ])
            ]),
            vue.createElementVNode("view", { class: "loginRegister__container__body__login__password" }, [
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  type: "safe-password",
                  maxlength: 16,
                  placeholder: "密码",
                  password: true,
                  "adjust-position": false,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.password = $event)
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.password]
              ])
            ]),
            vue.createElementVNode("view", { class: "loginRegister__container__body__login__option" }, [
              vue.createElementVNode("view", { class: "loginRegister__container__body__login__option__remember" }, [
                vue.createElementVNode("view", null, [
                  vue.createElementVNode(
                    "radio-group",
                    {
                      onChange: _cache[2] || (_cache[2] = () => {
                      })
                    },
                    [
                      vue.createElementVNode("label", null, [
                        vue.createElementVNode("radio", {
                          value: true,
                          checked: true,
                          color: "#13dbf9",
                          class: "loginRegister__container__body__login__option__remember--radio"
                        })
                      ])
                    ],
                    32
                    /* HYDRATE_EVENTS */
                  )
                ]),
                vue.createElementVNode("text", null, "自动登录")
              ])
            ]),
            vue.createElementVNode("view", {
              class: "loginRegister__container__body__login--button",
              onClick: _cache[3] || (_cache[3] = vue.withModifiers((...args) => $setup.login && $setup.login(...args), ["stop"]))
            }, " 登录 ")
          ])
        ])
      ])
    ]);
  }
  const PagesLoginRegisterLoginRegister = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$g], ["__scopeId", "data-v-ed6efab4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/loginRegister/loginRegister.vue"]]);
  const _sfc_main$f = {
    props: {
      userObj: Object
    },
    setup(props) {
      const store2 = useStore();
      let isSelf = store2.getters.getUser;
      isSelf = isSelf.u_id;
      let userObj1 = store2.getters.getUser;
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
            formatAppLog("log", "at components/user/UserCard.vue:72", res);
            if (res.code === 200) {
              userObj.value.concern_be = 1;
              ArticleFun.setArticleCardUpdate(data.u_id, null, { concern_be: 1 });
              plus.nativeUI.toast(`关注成功`);
              ArticleFun.addConcernMsg(userObj1.u_id, userObj1.u_name, data.u_id, data.u_name, null);
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
        formatAppLog("log", "at components/user/UserCard.vue:93", "点击了关注");
      };
      const tapAuthorCard = (data) => {
        formatAppLog("log", "at components/user/UserCard.vue:97", "点击了作者栏");
        uni.navigateTo({
          url: "/pages/user/user?id=" + data.u_id
        });
      };
      let userObj = vue.ref();
      userObj.value = props.userObj;
      return {
        userObj,
        isSelf,
        defaultHeadImgPath,
        tapFollowCard,
        tapAuthorCard
      };
    }
  };
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "width": "100%", "height": "120rpx", "background": "#FFFFFF" } }, [
      vue.createElementVNode("view", { class: "userCard__container" }, [
        vue.createElementVNode("view", { class: "userCard__container__body" }, [
          vue.createElementVNode("view", {
            class: "userCard__container__body__left",
            onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $setup.tapAuthorCard($setup.userObj), ["stop"]))
          }, [
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
                onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.tapFollowCard($setup.userObj), ["stop"]))
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
  const UserCard = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$f], ["__scopeId", "data-v-c99219be"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/user/UserCard.vue"]]);
  const _sfc_main$e = {
    setup() {
      vue.onMounted(() => {
      });
      const a = () => {
      };
      return {
        a
      };
    }
  };
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesTestPageTestPage = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$e], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/testPage/testPage.vue"]]);
  const _sfc_main$d = {
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
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
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
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$d], ["__scopeId", "data-v-7a807eb7"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-grid/components/uni-grid-item/uni-grid-item.vue"]]);
  const _sfc_main$c = {
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
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
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
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$c], ["__scopeId", "data-v-07acefee"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-grid/components/uni-grid/uni-grid.vue"]]);
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
  const _sfc_main$b = {
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
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
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
  const SearchHistory = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$b], ["__scopeId", "data-v-54a2f8a1"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/search/SearchHistory.vue"]]);
  const _sfc_main$a = {
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
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
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
  const SearchResult = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$a], ["__scopeId", "data-v-7411b02c"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/search/SearchResult.vue"]]);
  const _sfc_main$9 = {
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
        formatAppLog("log", "at pages/search/search.vue:69", "监听到用户点击了搜索历史");
        inputSearchDAta.value = e.word;
      });
      const sendSearch = async () => {
        formatAppLog("log", "at pages/search/search.vue:75", "监听到用户点击了搜索历史");
        if (!inputSearchDAta.value) {
          pageBack();
        } else {
          formatAppLog("log", "at pages/search/search.vue:79", "用户搜索" + inputSearchDAta.value);
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
        formatAppLog("log", "at pages/search/search.vue:111", "用户在搜索界面按了返回键盘");
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
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
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
                maxlength: 20,
                "confirm-type": "done",
                type: "text",
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
  const PagesSearchSearch = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$9], ["__scopeId", "data-v-c10c040c"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/search/search.vue"]]);
  const _sfc_main$8 = {
    components: {},
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
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
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
                  "adjust-position": false,
                  maxlength: 30
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
  const Publish = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8], ["__scopeId", "data-v-42e07aa5"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/publish/Publish.vue"]]);
  const _sfc_main$7 = {
    components: {
      Loading,
      Publish
    },
    setup() {
      let store2 = useStore();
      let userObj = store2.getters.getUser;
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      vue.onMounted(() => {
        if (!userObj.u_id) {
          plus.nativeUI.toast(`请先登录`);
          pageBack();
        }
      });
      return {};
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesPublishPublish = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7], ["__scopeId", "data-v-acfd9c67"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/publish/Publish.vue"]]);
  const _sfc_main$6 = {
    name: "messageCard",
    props: {
      data: Object,
      id: String,
      u_id: String
    },
    setup(props) {
      let data = props.data;
      let messageCardInfo = vue.ref({
        name: data.send_user_name,
        message: data.message_content,
        time: formatDate(data.create_time),
        headImg: defaultHeadImgPath,
        article_path1: null,
        article_text: null
      });
      let user = vue.ref();
      vue.onMounted(async () => {
        let res = await getUserDetailBy(data.send_user_id);
        if (res.code === 200) {
          user.value = res.data;
          if (user.value.u_head) {
            messageCardInfo.value.headImg = user.value.u_head;
          }
        }
        if (data.article_id) {
          let res2 = await getArticleDetailByID(data.article_id);
          formatAppLog("log", "at components/message/ReactionMsgCard.vue:88", res2);
          if (res2.code === 200) {
            formatAppLog("log", "at components/message/ReactionMsgCard.vue:90", res2.data.article_preview1_path);
            if (res2.data.article_preview1_path) {
              messageCardInfo.value.article_path1 = replaceUrlIP(res2.data.article_preview1_path);
            } else {
              messageCardInfo.value.article_text = res2.data.article_title;
            }
          }
        }
      });
      let id = vue.ref(props.id);
      let u_id = vue.ref(props.u_id);
      const tapArticleCard = () => {
        if (!data.article_id) {
          return;
        }
        formatAppLog("log", "at components/message/ReactionMsgCard.vue:112", "点击了文章卡");
        uni.navigateTo({
          url: "/pages/article/detail/ArticleDetailPage?id=" + data.article_id
        });
      };
      const tapAuthorCard = () => {
        formatAppLog("log", "at components/message/ReactionMsgCard.vue:119", "点击了作者栏");
        uni.navigateTo({
          url: "/pages/user/user?id=" + data.send_user_id
        });
      };
      const tapMessageCard = () => {
        formatAppLog("log", "at components/message/ReactionMsgCard.vue:126", "用户点击信息卡");
        if (id.value === "action") {
          formatAppLog("log", "at components/message/ReactionMsgCard.vue:128", "打开互动消息");
          uni.navigateTo({
            // url: '/pages/message/ReactionMessage/ReactionMessage?id=' + u_id.value
          });
        } else {
          uni.navigateTo({
            // url: '/pages/message/PrivateMessage/PrivateMessage'
          });
        }
      };
      return {
        messageCardInfo,
        tapMessageCard,
        u_id,
        tapArticleCard,
        tapAuthorCard
      };
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "width": "100%", "height": "120rpx", "background": "#F5F5F5", "padding": "10rpx", "display": "flex", "align-items": "center", "margin": "2rpx 0" } }, [
      vue.createElementVNode("view", { class: "reactionMsgCard__body" }, [
        vue.createElementVNode("view", {
          class: "reactionMsgCard__body__left",
          onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $setup.tapAuthorCard && $setup.tapAuthorCard(...args), ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "reactionMsgCard__body__head" }, [
            vue.createElementVNode(
              "view",
              {
                class: "reactionMsgCard__body__head--img",
                style: vue.normalizeStyle("background-image: url(" + $setup.messageCardInfo.headImg + ")")
              },
              null,
              4
              /* STYLE */
            )
          ]),
          vue.createElementVNode("view", { class: "reactionMsgCard__body__info" }, [
            vue.createElementVNode("view", { class: "reactionMsgCard__body__info__name" }, [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($setup.messageCardInfo.name),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "reactionMsgCard__body__info__message" }, [
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
        vue.createElementVNode("view", {
          class: "reactionMsgCard__body__right",
          onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $setup.tapArticleCard && $setup.tapArticleCard(...args), ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "reactionMsgCard__body__right--time" }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($setup.messageCardInfo.time),
              1
              /* TEXT */
            )
          ]),
          $setup.messageCardInfo.article_path1 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "reactionMsgCard__body__right--img"
          }, [
            vue.createElementVNode(
              "view",
              {
                class: "reactionMsgCard__body__right--img--path",
                style: vue.normalizeStyle("background-image: url(" + $setup.messageCardInfo.article_path1 + ")")
              },
              null,
              4
              /* STYLE */
            )
          ])) : (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 1,
              class: "reactionMsgCard__body__right--text textExceedsTwoLineHiddenReplacedDots"
            },
            vue.toDisplayString($setup.messageCardInfo.article_text),
            1
            /* TEXT */
          ))
        ])
      ])
    ]);
  }
  const ReactionMsgCard = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-0963c887"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/message/ReactionMsgCard.vue"]]);
  const _sfc_main$5 = {
    components: {
      ReactionMsgCard
    },
    setup() {
      let u_id = vue.ref();
      let actionMessageList = vue.ref();
      vue.onMounted(() => {
      });
      onLoad(async (option) => {
        let id = option.id;
        formatAppLog("log", "at pages/message/ReactionMessage/ReactionMessage.vue:58", id);
        u_id.value = id;
        let res = await getAllMessageByReceiveUid(id);
        formatAppLog("log", "at pages/message/ReactionMessage/ReactionMessage.vue:61", res);
        if (res.code === 200) {
          actionMessageList.value = res.data;
          formatAppLog("log", "at pages/message/ReactionMessage/ReactionMessage.vue:64", actionMessageList);
        }
        let res1 = await updateReadMessageByReceiveId(id);
        if (res1.code === 200)
          ;
      });
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      return {
        pageBack,
        actionMessageList
      };
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
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
                style: `width: 100%;height: 100%;background: #ffffff;`
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.actionMessageList, (item, index) => {
                    return vue.openBlock(), vue.createBlock(_component_ReactionMsgCard, { data: item }, null, 8, ["data"]);
                  }),
                  256
                  /* UNKEYED_FRAGMENT */
                ))
              ])
            ])
          ])
        ])
      ])
    ]);
  }
  const PagesMessageReactionMessageReactionMessage = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-fa095b8d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/message/ReactionMessage/ReactionMessage.vue"]]);
  const _sfc_main$4 = {
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
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
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
                    style: { "background-image": "url('https://i0.hdslb.com/bfs/face/bd6d1a14ea10a3f7d2ca219544e03c929d2b823d.jpg@240w_240h_1c_1s_!web-avatar-space-header.webp')" }
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
                  vue.createElementVNode("text", null, " 你好~ ")
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
  const PrivateWindow = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-20951d9e"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/message/private/PrivateWindow.vue"]]);
  const _sfc_main$3 = {
    components: {
      Loading,
      ArticleDetailPage,
      PrivateWindow
    },
    setup() {
      let headerTitle = vue.ref("Yaoser");
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
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
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
                  style: vue.normalizeStyle("background-image: url(https://i0.hdslb.com/bfs/face/bd6d1a14ea10a3f7d2ca219544e03c929d2b823d.jpg@240w_240h_1c_1s_!web-avatar-space-header.webp);width: 30px;height: 30px;")
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
  const PagesMessagePrivateMessagePrivateMessage = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-d6363766"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/message/PrivateMessage/PrivateMessage.vue"]]);
  const _sfc_main$2 = {
    components: {
      UserDetail,
      Loading
    },
    setup() {
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      let loading = vue.ref(false);
      let u_id = vue.ref();
      let store2 = useStore();
      let userObj = store2.getters.getUser;
      let needUserObj = vue.ref();
      let needFollow = vue.ref(true);
      onLoad(async (option) => {
        loading.value = false;
        if (!userObj.u_id) {
          plus.nativeUI.toast(`请先登录`);
          formatAppLog("log", "at pages/user/user.vue:62", "用户未登录，需要返回");
          pageBack();
          return;
        }
        let id = option.id;
        u_id.value = id;
        if (u_id.value == userObj.u_id) {
          needFollow.value = false;
        }
        let res = await getUserDetailBy(u_id.value);
        formatAppLog("log", "at pages/user/user.vue:72", res);
        if (res.code === 200) {
          needUserObj.value = res.data;
        } else {
          plus.nativeUI.toast(`获取用户信息失败，原因:${res.message}`);
        }
        loading.value = true;
      });
      return {
        needUserObj,
        needFollow,
        loading
      };
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
    const _component_UserDetail = vue.resolveComponent("UserDetail");
    return vue.openBlock(), vue.createElementBlock("view", { style: { "width": "100vw" } }, [
      vue.createElementVNode("view", { class: "user__container" }, [
        vue.createElementVNode("view", { class: "user__container__header" }),
        vue.createElementVNode("view", {
          class: "user__container__body",
          style: { "height": "100vh", "overflow": "hidden" }
        }, [
          !$setup.loading ? (vue.openBlock(), vue.createBlock(_component_Loading, { key: 0 })) : vue.createCommentVNode("v-if", true),
          $setup.loading ? (vue.openBlock(), vue.createBlock(_component_UserDetail, {
            key: 1,
            "user-obj": $setup.needUserObj,
            "need-edit": false,
            "need-follow": $setup.needFollow,
            "need-break": true,
            "need-login-out": false
          }, null, 8, ["user-obj", "need-follow"])) : vue.createCommentVNode("v-if", true)
        ])
      ])
    ]);
  }
  const PagesUserUser = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/user/user.vue"]]);
  const _sfc_main$1 = {
    components: {
      UserCard,
      Loading
    },
    setup() {
      let u_id = vue.ref();
      let userList = vue.ref();
      let store2 = useStore();
      let userObj = store2.getters.getUser;
      let loading = vue.ref(false);
      onLoad(async (option) => {
        loading.value = false;
        if (!userObj.u_id) {
          plus.nativeUI.toast(`请先登录`);
          formatAppLog("log", "at pages/user/fans.vue:69", "用户未登录，需要返回");
          pageBack();
          return;
        }
        let id = option.id;
        formatAppLog("log", "at pages/user/fans.vue:74", id);
        u_id.value = id;
        let res = await getUserFensListByUid(u_id.value);
        formatAppLog("log", "at pages/user/fans.vue:77", res);
        if (res.code === 200) {
          userList.value = res.data;
          formatAppLog("log", "at pages/user/fans.vue:80", userList);
        } else {
          plus.nativeUI.toast(`获取粉丝信息失败，原因:${res.message}`);
        }
        loading.value = true;
      });
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      return {
        pageBack,
        userList,
        loading
      };
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_Loading = vue.resolveComponent("Loading");
    const _component_UserCard = vue.resolveComponent("UserCard");
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "w100 h100",
      style: { "overflow": "hidden" }
    }, [
      vue.createElementVNode("view", { class: "w100 h100" }, [
        vue.createElementVNode("view", { class: "userFens__container w100 h100" }, [
          vue.createCommentVNode("        头部"),
          vue.createElementVNode("view", { class: "userFens__container__header" }, [
            vue.createElementVNode("view", { style: { "height": "var(--status-bar-height)" } }),
            vue.createElementVNode("view", { class: "userFens__container__header--main" }, [
              vue.createElementVNode("view", { class: "userFens__container__header--button" }, [
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
              vue.createElementVNode("view", { class: "userFens__container__header--title" }, vue.toDisplayString("全部粉丝")),
              vue.createElementVNode("view", { class: "userFens__container__header--more" })
            ])
          ]),
          vue.createCommentVNode("        身体"),
          vue.createElementVNode("view", { class: "userFens__container__body" }, [
            vue.createElementVNode("view", { class: "w100 h100" }, [
              vue.createElementVNode("scroll-view", {
                class: "scrollview",
                "scroll-y": "true",
                style: `width: 100%;height: 100%;background: #f5f5f5;`
              }, [
                !$setup.loading ? (vue.openBlock(), vue.createBlock(_component_Loading, { key: 0 })) : vue.createCommentVNode("v-if", true),
                $setup.loading ? (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  { key: 1 },
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
                )) : vue.createCommentVNode("v-if", true),
                vue.createElementVNode("view", {
                  class: "disF-center",
                  style: { "color": "#a0a0a0", "flex-direction": "column" }
                }, [
                  vue.createElementVNode("view", null, "已经到底了...")
                ])
              ])
            ])
          ])
        ])
      ])
    ]);
  }
  const PagesUserFans = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-2e1e43a4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/user/fans.vue"]]);
  const _sfc_main = {
    components: {
      UserCard,
      Loading
    },
    setup() {
      let u_id = vue.ref();
      let userList = vue.ref();
      let store2 = useStore();
      let userObj = store2.getters.getUser;
      let loading = vue.ref(false);
      onLoad(async (option) => {
        loading.value = false;
        if (!userObj.u_id) {
          plus.nativeUI.toast(`请先登录`);
          formatAppLog("log", "at pages/user/concern.vue:69", "用户未登录，需要返回");
          pageBack();
          return;
        }
        let id = option.id;
        formatAppLog("log", "at pages/user/concern.vue:74", id);
        u_id.value = id;
        let res = await getUserConcernListByUid(u_id.value);
        formatAppLog("log", "at pages/user/concern.vue:77", res);
        if (res.code === 200) {
          userList.value = res.data;
          formatAppLog("log", "at pages/user/concern.vue:80", userList);
        } else {
          plus.nativeUI.toast(`获取关注信息失败，原因:${res.message}`);
        }
        loading.value = true;
      });
      const pageBack = () => {
        uni.navigateBack({
          delta: 1
          //返回的页面数，如果 delta 大于现有页面数，则返回到首页。
        });
      };
      return {
        pageBack,
        userList,
        loading
      };
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0$1);
    const _component_Loading = vue.resolveComponent("Loading");
    const _component_UserCard = vue.resolveComponent("UserCard");
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "w100 h100",
      style: { "overflow": "hidden" }
    }, [
      vue.createElementVNode("view", { class: "w100 h100" }, [
        vue.createElementVNode("view", { class: "userConcern__container w100 h100" }, [
          vue.createCommentVNode("        头部"),
          vue.createElementVNode("view", { class: "userConcern__container__header" }, [
            vue.createElementVNode("view", { style: { "height": "var(--status-bar-height)" } }),
            vue.createElementVNode("view", { class: "userConcern__container__header--main" }, [
              vue.createElementVNode("view", { class: "userConcern__container__header--button" }, [
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
              vue.createElementVNode("view", { class: "userConcern__container__header--title" }, vue.toDisplayString("全部关注")),
              vue.createElementVNode("view", { class: "userConcern__container__header--more" })
            ])
          ]),
          vue.createCommentVNode("        身体"),
          vue.createElementVNode("view", { class: "userConcern__container__body" }, [
            vue.createElementVNode("view", { class: "w100 h100" }, [
              vue.createElementVNode("scroll-view", {
                class: "scrollview",
                "scroll-y": "true",
                style: `width: 100%;height: 100%;background: #f5f5f5;`
              }, [
                !$setup.loading ? (vue.openBlock(), vue.createBlock(_component_Loading, { key: 0 })) : vue.createCommentVNode("v-if", true),
                $setup.loading ? (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  { key: 1 },
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
                )) : vue.createCommentVNode("v-if", true),
                vue.createElementVNode("view", {
                  class: "disF-center",
                  style: { "color": "#a0a0a0", "flex-direction": "column" }
                }, [
                  vue.createElementVNode("view", null, "已经到底了...")
                ])
              ])
            ])
          ])
        ])
      ])
    ]);
  }
  const PagesUserConcern = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7fa36418"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/user/concern.vue"]]);
  __definePage("pages/MainApp", PagesMainApp);
  __definePage("pages/article/detail/ArticleDetailPage", PagesArticleDetailArticleDetailPage);
  __definePage("pages/loginRegister/loginRegister", PagesLoginRegisterLoginRegister);
  __definePage("pages/testPage/testPage", PagesTestPageTestPage);
  __definePage("pages/search/search", PagesSearchSearch);
  __definePage("pages/publish/Publish", PagesPublishPublish);
  __definePage("pages/message/ReactionMessage/ReactionMessage", PagesMessageReactionMessageReactionMessage);
  __definePage("pages/message/PrivateMessage/PrivateMessage", PagesMessagePrivateMessagePrivateMessage);
  __definePage("pages/user/user", PagesUserUser);
  __definePage("pages/user/fans", PagesUserFans);
  __definePage("pages/user/concern", PagesUserConcern);
  var lookup = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    62,
    0,
    62,
    0,
    63,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    0,
    0,
    0,
    0,
    63,
    0,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51
  ];
  function base64Decode(source, target) {
    var sourceLength = source.length;
    var paddingLength = source[sourceLength - 2] === "=" ? 2 : source[sourceLength - 1] === "=" ? 1 : 0;
    var tmp;
    var byteIndex = 0;
    var baseLength = sourceLength - paddingLength & 4294967292;
    for (var i = 0; i < baseLength; i += 4) {
      tmp = lookup[source.charCodeAt(i)] << 18 | lookup[source.charCodeAt(i + 1)] << 12 | lookup[source.charCodeAt(i + 2)] << 6 | lookup[source.charCodeAt(i + 3)];
      target[byteIndex++] = tmp >> 16 & 255;
      target[byteIndex++] = tmp >> 8 & 255;
      target[byteIndex++] = tmp & 255;
    }
    if (paddingLength === 1) {
      tmp = lookup[source.charCodeAt(i)] << 10 | lookup[source.charCodeAt(i + 1)] << 4 | lookup[source.charCodeAt(i + 2)] >> 2;
      target[byteIndex++] = tmp >> 8 & 255;
      target[byteIndex++] = tmp & 255;
    }
    if (paddingLength === 2) {
      tmp = lookup[source.charCodeAt(i)] << 2 | lookup[source.charCodeAt(i + 1)] >> 4;
      target[byteIndex++] = tmp & 255;
    }
  }
  const $inject_window_crypto = {
    getRandomValues(arr) {
      if (!(arr instanceof Int8Array || arr instanceof Uint8Array || arr instanceof Int16Array || arr instanceof Uint16Array || arr instanceof Int32Array || arr instanceof Uint32Array || arr instanceof Uint8ClampedArray)) {
        throw new Error("Expected an integer array");
      }
      if (arr.byteLength > 65536) {
        throw new Error("Can only request a maximum of 65536 bytes");
      }
      var crypto = requireNativePlugin("DCloud-Crypto");
      base64Decode(crypto.getRandomValues(arr.byteLength), new Uint8Array(
        arr.buffer,
        arr.byteOffset,
        arr.byteLength
      ));
      return arr;
    }
  };
  var gtpushMinExports = {};
  var gtpushMin = {
    get exports() {
      return gtpushMinExports;
    },
    set exports(v) {
      gtpushMinExports = v;
    }
  };
  /*! For license information please see gtpush-min.js.LICENSE.txt */
  (function(module, exports) {
    (function t(e, r) {
      module.exports = r();
    })(self, () => (() => {
      var t = { 4736: (t2, e2, r2) => {
        t2 = r2.nmd(t2);
        var i2;
        var n = function(t3) {
          var e3 = 1e7, r3 = 7, i3 = 9007199254740992, s = d(i3), a = "0123456789abcdefghijklmnopqrstuvwxyz";
          var o = "function" === typeof BigInt;
          function u(t4, e4, r4, i4) {
            if ("undefined" === typeof t4)
              return u[0];
            if ("undefined" !== typeof e4)
              return 10 === +e4 && !r4 ? st(t4) : X(t4, e4, r4, i4);
            return st(t4);
          }
          function c(t4, e4) {
            this.value = t4;
            this.sign = e4;
            this.isSmall = false;
          }
          c.prototype = Object.create(u.prototype);
          function l(t4) {
            this.value = t4;
            this.sign = t4 < 0;
            this.isSmall = true;
          }
          l.prototype = Object.create(u.prototype);
          function f(t4) {
            this.value = t4;
          }
          f.prototype = Object.create(u.prototype);
          function h(t4) {
            return -i3 < t4 && t4 < i3;
          }
          function d(t4) {
            if (t4 < 1e7)
              return [t4];
            if (t4 < 1e14)
              return [t4 % 1e7, Math.floor(t4 / 1e7)];
            return [t4 % 1e7, Math.floor(t4 / 1e7) % 1e7, Math.floor(t4 / 1e14)];
          }
          function v(t4) {
            p(t4);
            var r4 = t4.length;
            if (r4 < 4 && N(t4, s) < 0)
              switch (r4) {
                case 0:
                  return 0;
                case 1:
                  return t4[0];
                case 2:
                  return t4[0] + t4[1] * e3;
                default:
                  return t4[0] + (t4[1] + t4[2] * e3) * e3;
              }
            return t4;
          }
          function p(t4) {
            var e4 = t4.length;
            while (0 === t4[--e4])
              ;
            t4.length = e4 + 1;
          }
          function g(t4) {
            var e4 = new Array(t4);
            var r4 = -1;
            while (++r4 < t4)
              e4[r4] = 0;
            return e4;
          }
          function y(t4) {
            if (t4 > 0)
              return Math.floor(t4);
            return Math.ceil(t4);
          }
          function m(t4, r4) {
            var i4 = t4.length, n2 = r4.length, s2 = new Array(i4), a2 = 0, o2 = e3, u2, c2;
            for (c2 = 0; c2 < n2; c2++) {
              u2 = t4[c2] + r4[c2] + a2;
              a2 = u2 >= o2 ? 1 : 0;
              s2[c2] = u2 - a2 * o2;
            }
            while (c2 < i4) {
              u2 = t4[c2] + a2;
              a2 = u2 === o2 ? 1 : 0;
              s2[c2++] = u2 - a2 * o2;
            }
            if (a2 > 0)
              s2.push(a2);
            return s2;
          }
          function w(t4, e4) {
            if (t4.length >= e4.length)
              return m(t4, e4);
            return m(e4, t4);
          }
          function _(t4, r4) {
            var i4 = t4.length, n2 = new Array(i4), s2 = e3, a2, o2;
            for (o2 = 0; o2 < i4; o2++) {
              a2 = t4[o2] - s2 + r4;
              r4 = Math.floor(a2 / s2);
              n2[o2] = a2 - r4 * s2;
              r4 += 1;
            }
            while (r4 > 0) {
              n2[o2++] = r4 % s2;
              r4 = Math.floor(r4 / s2);
            }
            return n2;
          }
          c.prototype.add = function(t4) {
            var e4 = st(t4);
            if (this.sign !== e4.sign)
              return this.subtract(e4.negate());
            var r4 = this.value, i4 = e4.value;
            if (e4.isSmall)
              return new c(_(r4, Math.abs(i4)), this.sign);
            return new c(w(r4, i4), this.sign);
          };
          c.prototype.plus = c.prototype.add;
          l.prototype.add = function(t4) {
            var e4 = st(t4);
            var r4 = this.value;
            if (r4 < 0 !== e4.sign)
              return this.subtract(e4.negate());
            var i4 = e4.value;
            if (e4.isSmall) {
              if (h(r4 + i4))
                return new l(r4 + i4);
              i4 = d(Math.abs(i4));
            }
            return new c(_(i4, Math.abs(r4)), r4 < 0);
          };
          l.prototype.plus = l.prototype.add;
          f.prototype.add = function(t4) {
            return new f(this.value + st(t4).value);
          };
          f.prototype.plus = f.prototype.add;
          function S(t4, r4) {
            var i4 = t4.length, n2 = r4.length, s2 = new Array(i4), a2 = 0, o2 = e3, u2, c2;
            for (u2 = 0; u2 < n2; u2++) {
              c2 = t4[u2] - a2 - r4[u2];
              if (c2 < 0) {
                c2 += o2;
                a2 = 1;
              } else
                a2 = 0;
              s2[u2] = c2;
            }
            for (u2 = n2; u2 < i4; u2++) {
              c2 = t4[u2] - a2;
              if (c2 < 0)
                c2 += o2;
              else {
                s2[u2++] = c2;
                break;
              }
              s2[u2] = c2;
            }
            for (; u2 < i4; u2++)
              s2[u2] = t4[u2];
            p(s2);
            return s2;
          }
          function b(t4, e4, r4) {
            var i4;
            if (N(t4, e4) >= 0)
              i4 = S(t4, e4);
            else {
              i4 = S(e4, t4);
              r4 = !r4;
            }
            i4 = v(i4);
            if ("number" === typeof i4) {
              if (r4)
                i4 = -i4;
              return new l(i4);
            }
            return new c(i4, r4);
          }
          function E(t4, r4, i4) {
            var n2 = t4.length, s2 = new Array(n2), a2 = -r4, o2 = e3, u2, f2;
            for (u2 = 0; u2 < n2; u2++) {
              f2 = t4[u2] + a2;
              a2 = Math.floor(f2 / o2);
              f2 %= o2;
              s2[u2] = f2 < 0 ? f2 + o2 : f2;
            }
            s2 = v(s2);
            if ("number" === typeof s2) {
              if (i4)
                s2 = -s2;
              return new l(s2);
            }
            return new c(s2, i4);
          }
          c.prototype.subtract = function(t4) {
            var e4 = st(t4);
            if (this.sign !== e4.sign)
              return this.add(e4.negate());
            var r4 = this.value, i4 = e4.value;
            if (e4.isSmall)
              return E(r4, Math.abs(i4), this.sign);
            return b(r4, i4, this.sign);
          };
          c.prototype.minus = c.prototype.subtract;
          l.prototype.subtract = function(t4) {
            var e4 = st(t4);
            var r4 = this.value;
            if (r4 < 0 !== e4.sign)
              return this.add(e4.negate());
            var i4 = e4.value;
            if (e4.isSmall)
              return new l(r4 - i4);
            return E(i4, Math.abs(r4), r4 >= 0);
          };
          l.prototype.minus = l.prototype.subtract;
          f.prototype.subtract = function(t4) {
            return new f(this.value - st(t4).value);
          };
          f.prototype.minus = f.prototype.subtract;
          c.prototype.negate = function() {
            return new c(this.value, !this.sign);
          };
          l.prototype.negate = function() {
            var t4 = this.sign;
            var e4 = new l(-this.value);
            e4.sign = !t4;
            return e4;
          };
          f.prototype.negate = function() {
            return new f(-this.value);
          };
          c.prototype.abs = function() {
            return new c(this.value, false);
          };
          l.prototype.abs = function() {
            return new l(Math.abs(this.value));
          };
          f.prototype.abs = function() {
            return new f(this.value >= 0 ? this.value : -this.value);
          };
          function D(t4, r4) {
            var i4 = t4.length, n2 = r4.length, s2 = i4 + n2, a2 = g(s2), o2 = e3, u2, c2, l2, f2, h2;
            for (l2 = 0; l2 < i4; ++l2) {
              f2 = t4[l2];
              for (var d2 = 0; d2 < n2; ++d2) {
                h2 = r4[d2];
                u2 = f2 * h2 + a2[l2 + d2];
                c2 = Math.floor(u2 / o2);
                a2[l2 + d2] = u2 - c2 * o2;
                a2[l2 + d2 + 1] += c2;
              }
            }
            p(a2);
            return a2;
          }
          function T(t4, r4) {
            var i4 = t4.length, n2 = new Array(i4), s2 = e3, a2 = 0, o2, u2;
            for (u2 = 0; u2 < i4; u2++) {
              o2 = t4[u2] * r4 + a2;
              a2 = Math.floor(o2 / s2);
              n2[u2] = o2 - a2 * s2;
            }
            while (a2 > 0) {
              n2[u2++] = a2 % s2;
              a2 = Math.floor(a2 / s2);
            }
            return n2;
          }
          function M(t4, e4) {
            var r4 = [];
            while (e4-- > 0)
              r4.push(0);
            return r4.concat(t4);
          }
          function I(t4, e4) {
            var r4 = Math.max(t4.length, e4.length);
            if (r4 <= 30)
              return D(t4, e4);
            r4 = Math.ceil(r4 / 2);
            var i4 = t4.slice(r4), n2 = t4.slice(0, r4), s2 = e4.slice(r4), a2 = e4.slice(0, r4);
            var o2 = I(n2, a2), u2 = I(i4, s2), c2 = I(w(n2, i4), w(a2, s2));
            var l2 = w(w(o2, M(S(S(c2, o2), u2), r4)), M(u2, 2 * r4));
            p(l2);
            return l2;
          }
          function A(t4, e4) {
            return -0.012 * t4 - 0.012 * e4 + 15e-6 * t4 * e4 > 0;
          }
          c.prototype.multiply = function(t4) {
            var r4 = st(t4), i4 = this.value, n2 = r4.value, s2 = this.sign !== r4.sign, a2;
            if (r4.isSmall) {
              if (0 === n2)
                return u[0];
              if (1 === n2)
                return this;
              if (-1 === n2)
                return this.negate();
              a2 = Math.abs(n2);
              if (a2 < e3)
                return new c(T(i4, a2), s2);
              n2 = d(a2);
            }
            if (A(i4.length, n2.length))
              return new c(I(i4, n2), s2);
            return new c(D(i4, n2), s2);
          };
          c.prototype.times = c.prototype.multiply;
          function x(t4, r4, i4) {
            if (t4 < e3)
              return new c(T(r4, t4), i4);
            return new c(D(r4, d(t4)), i4);
          }
          l.prototype._multiplyBySmall = function(t4) {
            if (h(t4.value * this.value))
              return new l(t4.value * this.value);
            return x(Math.abs(t4.value), d(Math.abs(this.value)), this.sign !== t4.sign);
          };
          c.prototype._multiplyBySmall = function(t4) {
            if (0 === t4.value)
              return u[0];
            if (1 === t4.value)
              return this;
            if (-1 === t4.value)
              return this.negate();
            return x(Math.abs(t4.value), this.value, this.sign !== t4.sign);
          };
          l.prototype.multiply = function(t4) {
            return st(t4)._multiplyBySmall(this);
          };
          l.prototype.times = l.prototype.multiply;
          f.prototype.multiply = function(t4) {
            return new f(this.value * st(t4).value);
          };
          f.prototype.times = f.prototype.multiply;
          function R(t4) {
            var r4 = t4.length, i4 = g(r4 + r4), n2 = e3, s2, a2, o2, u2, c2;
            for (o2 = 0; o2 < r4; o2++) {
              u2 = t4[o2];
              a2 = 0 - u2 * u2;
              for (var l2 = o2; l2 < r4; l2++) {
                c2 = t4[l2];
                s2 = 2 * (u2 * c2) + i4[o2 + l2] + a2;
                a2 = Math.floor(s2 / n2);
                i4[o2 + l2] = s2 - a2 * n2;
              }
              i4[o2 + r4] = a2;
            }
            p(i4);
            return i4;
          }
          c.prototype.square = function() {
            return new c(R(this.value), false);
          };
          l.prototype.square = function() {
            var t4 = this.value * this.value;
            if (h(t4))
              return new l(t4);
            return new c(R(d(Math.abs(this.value))), false);
          };
          f.prototype.square = function(t4) {
            return new f(this.value * this.value);
          };
          function B(t4, r4) {
            var i4 = t4.length, n2 = r4.length, s2 = e3, a2 = g(r4.length), o2 = r4[n2 - 1], u2 = Math.ceil(s2 / (2 * o2)), c2 = T(t4, u2), l2 = T(r4, u2), f2, h2, d2, p2, y2, m2, w2;
            if (c2.length <= i4)
              c2.push(0);
            l2.push(0);
            o2 = l2[n2 - 1];
            for (h2 = i4 - n2; h2 >= 0; h2--) {
              f2 = s2 - 1;
              if (c2[h2 + n2] !== o2)
                f2 = Math.floor((c2[h2 + n2] * s2 + c2[h2 + n2 - 1]) / o2);
              d2 = 0;
              p2 = 0;
              m2 = l2.length;
              for (y2 = 0; y2 < m2; y2++) {
                d2 += f2 * l2[y2];
                w2 = Math.floor(d2 / s2);
                p2 += c2[h2 + y2] - (d2 - w2 * s2);
                d2 = w2;
                if (p2 < 0) {
                  c2[h2 + y2] = p2 + s2;
                  p2 = -1;
                } else {
                  c2[h2 + y2] = p2;
                  p2 = 0;
                }
              }
              while (0 !== p2) {
                f2 -= 1;
                d2 = 0;
                for (y2 = 0; y2 < m2; y2++) {
                  d2 += c2[h2 + y2] - s2 + l2[y2];
                  if (d2 < 0) {
                    c2[h2 + y2] = d2 + s2;
                    d2 = 0;
                  } else {
                    c2[h2 + y2] = d2;
                    d2 = 1;
                  }
                }
                p2 += d2;
              }
              a2[h2] = f2;
            }
            c2 = k(c2, u2)[0];
            return [v(a2), v(c2)];
          }
          function O(t4, r4) {
            var i4 = t4.length, n2 = r4.length, s2 = [], a2 = [], o2 = e3, u2, c2, l2, f2, h2;
            while (i4) {
              a2.unshift(t4[--i4]);
              p(a2);
              if (N(a2, r4) < 0) {
                s2.push(0);
                continue;
              }
              c2 = a2.length;
              l2 = a2[c2 - 1] * o2 + a2[c2 - 2];
              f2 = r4[n2 - 1] * o2 + r4[n2 - 2];
              if (c2 > n2)
                l2 = (l2 + 1) * o2;
              u2 = Math.ceil(l2 / f2);
              do {
                h2 = T(r4, u2);
                if (N(h2, a2) <= 0)
                  break;
                u2--;
              } while (u2);
              s2.push(u2);
              a2 = S(a2, h2);
            }
            s2.reverse();
            return [v(s2), v(a2)];
          }
          function k(t4, r4) {
            var i4 = t4.length, n2 = g(i4), s2 = e3, a2, o2, u2, c2;
            u2 = 0;
            for (a2 = i4 - 1; a2 >= 0; --a2) {
              c2 = u2 * s2 + t4[a2];
              o2 = y(c2 / r4);
              u2 = c2 - o2 * r4;
              n2[a2] = 0 | o2;
            }
            return [n2, 0 | u2];
          }
          function C(t4, r4) {
            var i4, n2 = st(r4);
            if (o)
              return [new f(t4.value / n2.value), new f(t4.value % n2.value)];
            var s2 = t4.value, a2 = n2.value;
            var h2;
            if (0 === a2)
              throw new Error("Cannot divide by zero");
            if (t4.isSmall) {
              if (n2.isSmall)
                return [new l(y(s2 / a2)), new l(s2 % a2)];
              return [u[0], t4];
            }
            if (n2.isSmall) {
              if (1 === a2)
                return [t4, u[0]];
              if (-1 == a2)
                return [t4.negate(), u[0]];
              var p2 = Math.abs(a2);
              if (p2 < e3) {
                i4 = k(s2, p2);
                h2 = v(i4[0]);
                var g2 = i4[1];
                if (t4.sign)
                  g2 = -g2;
                if ("number" === typeof h2) {
                  if (t4.sign !== n2.sign)
                    h2 = -h2;
                  return [new l(h2), new l(g2)];
                }
                return [new c(h2, t4.sign !== n2.sign), new l(g2)];
              }
              a2 = d(p2);
            }
            var m2 = N(s2, a2);
            if (-1 === m2)
              return [u[0], t4];
            if (0 === m2)
              return [u[t4.sign === n2.sign ? 1 : -1], u[0]];
            if (s2.length + a2.length <= 200)
              i4 = B(s2, a2);
            else
              i4 = O(s2, a2);
            h2 = i4[0];
            var w2 = t4.sign !== n2.sign, _2 = i4[1], S2 = t4.sign;
            if ("number" === typeof h2) {
              if (w2)
                h2 = -h2;
              h2 = new l(h2);
            } else
              h2 = new c(h2, w2);
            if ("number" === typeof _2) {
              if (S2)
                _2 = -_2;
              _2 = new l(_2);
            } else
              _2 = new c(_2, S2);
            return [h2, _2];
          }
          c.prototype.divmod = function(t4) {
            var e4 = C(this, t4);
            return { quotient: e4[0], remainder: e4[1] };
          };
          f.prototype.divmod = l.prototype.divmod = c.prototype.divmod;
          c.prototype.divide = function(t4) {
            return C(this, t4)[0];
          };
          f.prototype.over = f.prototype.divide = function(t4) {
            return new f(this.value / st(t4).value);
          };
          l.prototype.over = l.prototype.divide = c.prototype.over = c.prototype.divide;
          c.prototype.mod = function(t4) {
            return C(this, t4)[1];
          };
          f.prototype.mod = f.prototype.remainder = function(t4) {
            return new f(this.value % st(t4).value);
          };
          l.prototype.remainder = l.prototype.mod = c.prototype.remainder = c.prototype.mod;
          c.prototype.pow = function(t4) {
            var e4 = st(t4), r4 = this.value, i4 = e4.value, n2, s2, a2;
            if (0 === i4)
              return u[1];
            if (0 === r4)
              return u[0];
            if (1 === r4)
              return u[1];
            if (-1 === r4)
              return e4.isEven() ? u[1] : u[-1];
            if (e4.sign)
              return u[0];
            if (!e4.isSmall)
              throw new Error("The exponent " + e4.toString() + " is too large.");
            if (this.isSmall) {
              if (h(n2 = Math.pow(r4, i4)))
                return new l(y(n2));
            }
            s2 = this;
            a2 = u[1];
            while (true) {
              if (i4 & true) {
                a2 = a2.times(s2);
                --i4;
              }
              if (0 === i4)
                break;
              i4 /= 2;
              s2 = s2.square();
            }
            return a2;
          };
          l.prototype.pow = c.prototype.pow;
          f.prototype.pow = function(t4) {
            var e4 = st(t4);
            var r4 = this.value, i4 = e4.value;
            var n2 = BigInt(0), s2 = BigInt(1), a2 = BigInt(2);
            if (i4 === n2)
              return u[1];
            if (r4 === n2)
              return u[0];
            if (r4 === s2)
              return u[1];
            if (r4 === BigInt(-1))
              return e4.isEven() ? u[1] : u[-1];
            if (e4.isNegative())
              return new f(n2);
            var o2 = this;
            var c2 = u[1];
            while (true) {
              if ((i4 & s2) === s2) {
                c2 = c2.times(o2);
                --i4;
              }
              if (i4 === n2)
                break;
              i4 /= a2;
              o2 = o2.square();
            }
            return c2;
          };
          c.prototype.modPow = function(t4, e4) {
            t4 = st(t4);
            e4 = st(e4);
            if (e4.isZero())
              throw new Error("Cannot take modPow with modulus 0");
            var r4 = u[1], i4 = this.mod(e4);
            if (t4.isNegative()) {
              t4 = t4.multiply(u[-1]);
              i4 = i4.modInv(e4);
            }
            while (t4.isPositive()) {
              if (i4.isZero())
                return u[0];
              if (t4.isOdd())
                r4 = r4.multiply(i4).mod(e4);
              t4 = t4.divide(2);
              i4 = i4.square().mod(e4);
            }
            return r4;
          };
          f.prototype.modPow = l.prototype.modPow = c.prototype.modPow;
          function N(t4, e4) {
            if (t4.length !== e4.length)
              return t4.length > e4.length ? 1 : -1;
            for (var r4 = t4.length - 1; r4 >= 0; r4--)
              if (t4[r4] !== e4[r4])
                return t4[r4] > e4[r4] ? 1 : -1;
            return 0;
          }
          c.prototype.compareAbs = function(t4) {
            var e4 = st(t4), r4 = this.value, i4 = e4.value;
            if (e4.isSmall)
              return 1;
            return N(r4, i4);
          };
          l.prototype.compareAbs = function(t4) {
            var e4 = st(t4), r4 = Math.abs(this.value), i4 = e4.value;
            if (e4.isSmall) {
              i4 = Math.abs(i4);
              return r4 === i4 ? 0 : r4 > i4 ? 1 : -1;
            }
            return -1;
          };
          f.prototype.compareAbs = function(t4) {
            var e4 = this.value;
            var r4 = st(t4).value;
            e4 = e4 >= 0 ? e4 : -e4;
            r4 = r4 >= 0 ? r4 : -r4;
            return e4 === r4 ? 0 : e4 > r4 ? 1 : -1;
          };
          c.prototype.compare = function(t4) {
            if (t4 === 1 / 0)
              return -1;
            if (t4 === -1 / 0)
              return 1;
            var e4 = st(t4), r4 = this.value, i4 = e4.value;
            if (this.sign !== e4.sign)
              return e4.sign ? 1 : -1;
            if (e4.isSmall)
              return this.sign ? -1 : 1;
            return N(r4, i4) * (this.sign ? -1 : 1);
          };
          c.prototype.compareTo = c.prototype.compare;
          l.prototype.compare = function(t4) {
            if (t4 === 1 / 0)
              return -1;
            if (t4 === -1 / 0)
              return 1;
            var e4 = st(t4), r4 = this.value, i4 = e4.value;
            if (e4.isSmall)
              return r4 == i4 ? 0 : r4 > i4 ? 1 : -1;
            if (r4 < 0 !== e4.sign)
              return r4 < 0 ? -1 : 1;
            return r4 < 0 ? 1 : -1;
          };
          l.prototype.compareTo = l.prototype.compare;
          f.prototype.compare = function(t4) {
            if (t4 === 1 / 0)
              return -1;
            if (t4 === -1 / 0)
              return 1;
            var e4 = this.value;
            var r4 = st(t4).value;
            return e4 === r4 ? 0 : e4 > r4 ? 1 : -1;
          };
          f.prototype.compareTo = f.prototype.compare;
          c.prototype.equals = function(t4) {
            return 0 === this.compare(t4);
          };
          f.prototype.eq = f.prototype.equals = l.prototype.eq = l.prototype.equals = c.prototype.eq = c.prototype.equals;
          c.prototype.notEquals = function(t4) {
            return 0 !== this.compare(t4);
          };
          f.prototype.neq = f.prototype.notEquals = l.prototype.neq = l.prototype.notEquals = c.prototype.neq = c.prototype.notEquals;
          c.prototype.greater = function(t4) {
            return this.compare(t4) > 0;
          };
          f.prototype.gt = f.prototype.greater = l.prototype.gt = l.prototype.greater = c.prototype.gt = c.prototype.greater;
          c.prototype.lesser = function(t4) {
            return this.compare(t4) < 0;
          };
          f.prototype.lt = f.prototype.lesser = l.prototype.lt = l.prototype.lesser = c.prototype.lt = c.prototype.lesser;
          c.prototype.greaterOrEquals = function(t4) {
            return this.compare(t4) >= 0;
          };
          f.prototype.geq = f.prototype.greaterOrEquals = l.prototype.geq = l.prototype.greaterOrEquals = c.prototype.geq = c.prototype.greaterOrEquals;
          c.prototype.lesserOrEquals = function(t4) {
            return this.compare(t4) <= 0;
          };
          f.prototype.leq = f.prototype.lesserOrEquals = l.prototype.leq = l.prototype.lesserOrEquals = c.prototype.leq = c.prototype.lesserOrEquals;
          c.prototype.isEven = function() {
            return 0 === (1 & this.value[0]);
          };
          l.prototype.isEven = function() {
            return 0 === (1 & this.value);
          };
          f.prototype.isEven = function() {
            return (this.value & BigInt(1)) === BigInt(0);
          };
          c.prototype.isOdd = function() {
            return 1 === (1 & this.value[0]);
          };
          l.prototype.isOdd = function() {
            return 1 === (1 & this.value);
          };
          f.prototype.isOdd = function() {
            return (this.value & BigInt(1)) === BigInt(1);
          };
          c.prototype.isPositive = function() {
            return !this.sign;
          };
          l.prototype.isPositive = function() {
            return this.value > 0;
          };
          f.prototype.isPositive = l.prototype.isPositive;
          c.prototype.isNegative = function() {
            return this.sign;
          };
          l.prototype.isNegative = function() {
            return this.value < 0;
          };
          f.prototype.isNegative = l.prototype.isNegative;
          c.prototype.isUnit = function() {
            return false;
          };
          l.prototype.isUnit = function() {
            return 1 === Math.abs(this.value);
          };
          f.prototype.isUnit = function() {
            return this.abs().value === BigInt(1);
          };
          c.prototype.isZero = function() {
            return false;
          };
          l.prototype.isZero = function() {
            return 0 === this.value;
          };
          f.prototype.isZero = function() {
            return this.value === BigInt(0);
          };
          c.prototype.isDivisibleBy = function(t4) {
            var e4 = st(t4);
            if (e4.isZero())
              return false;
            if (e4.isUnit())
              return true;
            if (0 === e4.compareAbs(2))
              return this.isEven();
            return this.mod(e4).isZero();
          };
          f.prototype.isDivisibleBy = l.prototype.isDivisibleBy = c.prototype.isDivisibleBy;
          function P(t4) {
            var e4 = t4.abs();
            if (e4.isUnit())
              return false;
            if (e4.equals(2) || e4.equals(3) || e4.equals(5))
              return true;
            if (e4.isEven() || e4.isDivisibleBy(3) || e4.isDivisibleBy(5))
              return false;
            if (e4.lesser(49))
              return true;
          }
          function V(t4, e4) {
            var r4 = t4.prev(), i4 = r4, s2 = 0, a2, u2, c2;
            while (i4.isEven())
              i4 = i4.divide(2), s2++;
            t:
              for (u2 = 0; u2 < e4.length; u2++) {
                if (t4.lesser(e4[u2]))
                  continue;
                c2 = n(e4[u2]).modPow(i4, t4);
                if (c2.isUnit() || c2.equals(r4))
                  continue;
                for (a2 = s2 - 1; 0 != a2; a2--) {
                  c2 = c2.square().mod(t4);
                  if (c2.isUnit())
                    return false;
                  if (c2.equals(r4))
                    continue t;
                }
                return false;
              }
            return true;
          }
          c.prototype.isPrime = function(e4) {
            var r4 = P(this);
            if (r4 !== t3)
              return r4;
            var i4 = this.abs();
            var s2 = i4.bitLength();
            if (s2 <= 64)
              return V(i4, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);
            var a2 = Math.log(2) * s2.toJSNumber();
            var o2 = Math.ceil(true === e4 ? 2 * Math.pow(a2, 2) : a2);
            for (var u2 = [], c2 = 0; c2 < o2; c2++)
              u2.push(n(c2 + 2));
            return V(i4, u2);
          };
          f.prototype.isPrime = l.prototype.isPrime = c.prototype.isPrime;
          c.prototype.isProbablePrime = function(e4, r4) {
            var i4 = P(this);
            if (i4 !== t3)
              return i4;
            var s2 = this.abs();
            var a2 = e4 === t3 ? 5 : e4;
            for (var o2 = [], u2 = 0; u2 < a2; u2++)
              o2.push(n.randBetween(2, s2.minus(2), r4));
            return V(s2, o2);
          };
          f.prototype.isProbablePrime = l.prototype.isProbablePrime = c.prototype.isProbablePrime;
          c.prototype.modInv = function(t4) {
            var e4 = n.zero, r4 = n.one, i4 = st(t4), s2 = this.abs(), a2, o2, u2;
            while (!s2.isZero()) {
              a2 = i4.divide(s2);
              o2 = e4;
              u2 = i4;
              e4 = r4;
              i4 = s2;
              r4 = o2.subtract(a2.multiply(r4));
              s2 = u2.subtract(a2.multiply(s2));
            }
            if (!i4.isUnit())
              throw new Error(this.toString() + " and " + t4.toString() + " are not co-prime");
            if (-1 === e4.compare(0))
              e4 = e4.add(t4);
            if (this.isNegative())
              return e4.negate();
            return e4;
          };
          f.prototype.modInv = l.prototype.modInv = c.prototype.modInv;
          c.prototype.next = function() {
            var t4 = this.value;
            if (this.sign)
              return E(t4, 1, this.sign);
            return new c(_(t4, 1), this.sign);
          };
          l.prototype.next = function() {
            var t4 = this.value;
            if (t4 + 1 < i3)
              return new l(t4 + 1);
            return new c(s, false);
          };
          f.prototype.next = function() {
            return new f(this.value + BigInt(1));
          };
          c.prototype.prev = function() {
            var t4 = this.value;
            if (this.sign)
              return new c(_(t4, 1), true);
            return E(t4, 1, this.sign);
          };
          l.prototype.prev = function() {
            var t4 = this.value;
            if (t4 - 1 > -i3)
              return new l(t4 - 1);
            return new c(s, true);
          };
          f.prototype.prev = function() {
            return new f(this.value - BigInt(1));
          };
          var L = [1];
          while (2 * L[L.length - 1] <= e3)
            L.push(2 * L[L.length - 1]);
          var H = L.length, U = L[H - 1];
          function K(t4) {
            return Math.abs(t4) <= e3;
          }
          c.prototype.shiftLeft = function(t4) {
            var e4 = st(t4).toJSNumber();
            if (!K(e4))
              throw new Error(String(e4) + " is too large for shifting.");
            if (e4 < 0)
              return this.shiftRight(-e4);
            var r4 = this;
            if (r4.isZero())
              return r4;
            while (e4 >= H) {
              r4 = r4.multiply(U);
              e4 -= H - 1;
            }
            return r4.multiply(L[e4]);
          };
          f.prototype.shiftLeft = l.prototype.shiftLeft = c.prototype.shiftLeft;
          c.prototype.shiftRight = function(t4) {
            var e4;
            var r4 = st(t4).toJSNumber();
            if (!K(r4))
              throw new Error(String(r4) + " is too large for shifting.");
            if (r4 < 0)
              return this.shiftLeft(-r4);
            var i4 = this;
            while (r4 >= H) {
              if (i4.isZero() || i4.isNegative() && i4.isUnit())
                return i4;
              e4 = C(i4, U);
              i4 = e4[1].isNegative() ? e4[0].prev() : e4[0];
              r4 -= H - 1;
            }
            e4 = C(i4, L[r4]);
            return e4[1].isNegative() ? e4[0].prev() : e4[0];
          };
          f.prototype.shiftRight = l.prototype.shiftRight = c.prototype.shiftRight;
          function j(t4, e4, r4) {
            e4 = st(e4);
            var i4 = t4.isNegative(), s2 = e4.isNegative();
            var a2 = i4 ? t4.not() : t4, o2 = s2 ? e4.not() : e4;
            var u2 = 0, c2 = 0;
            var l2 = null, f2 = null;
            var h2 = [];
            while (!a2.isZero() || !o2.isZero()) {
              l2 = C(a2, U);
              u2 = l2[1].toJSNumber();
              if (i4)
                u2 = U - 1 - u2;
              f2 = C(o2, U);
              c2 = f2[1].toJSNumber();
              if (s2)
                c2 = U - 1 - c2;
              a2 = l2[0];
              o2 = f2[0];
              h2.push(r4(u2, c2));
            }
            var d2 = 0 !== r4(i4 ? 1 : 0, s2 ? 1 : 0) ? n(-1) : n(0);
            for (var v2 = h2.length - 1; v2 >= 0; v2 -= 1)
              d2 = d2.multiply(U).add(n(h2[v2]));
            return d2;
          }
          c.prototype.not = function() {
            return this.negate().prev();
          };
          f.prototype.not = l.prototype.not = c.prototype.not;
          c.prototype.and = function(t4) {
            return j(this, t4, function(t5, e4) {
              return t5 & e4;
            });
          };
          f.prototype.and = l.prototype.and = c.prototype.and;
          c.prototype.or = function(t4) {
            return j(this, t4, function(t5, e4) {
              return t5 | e4;
            });
          };
          f.prototype.or = l.prototype.or = c.prototype.or;
          c.prototype.xor = function(t4) {
            return j(this, t4, function(t5, e4) {
              return t5 ^ e4;
            });
          };
          f.prototype.xor = l.prototype.xor = c.prototype.xor;
          var q = 1 << 30, F = (e3 & -e3) * (e3 & -e3) | q;
          function z(t4) {
            var r4 = t4.value, i4 = "number" === typeof r4 ? r4 | q : "bigint" === typeof r4 ? r4 | BigInt(q) : r4[0] + r4[1] * e3 | F;
            return i4 & -i4;
          }
          function G(t4, e4) {
            if (e4.compareTo(t4) <= 0) {
              var r4 = G(t4, e4.square(e4));
              var i4 = r4.p;
              var s2 = r4.e;
              var a2 = i4.multiply(e4);
              return a2.compareTo(t4) <= 0 ? { p: a2, e: 2 * s2 + 1 } : { p: i4, e: 2 * s2 };
            }
            return { p: n(1), e: 0 };
          }
          c.prototype.bitLength = function() {
            var t4 = this;
            if (t4.compareTo(n(0)) < 0)
              t4 = t4.negate().subtract(n(1));
            if (0 === t4.compareTo(n(0)))
              return n(0);
            return n(G(t4, n(2)).e).add(n(1));
          };
          f.prototype.bitLength = l.prototype.bitLength = c.prototype.bitLength;
          function Y(t4, e4) {
            t4 = st(t4);
            e4 = st(e4);
            return t4.greater(e4) ? t4 : e4;
          }
          function W(t4, e4) {
            t4 = st(t4);
            e4 = st(e4);
            return t4.lesser(e4) ? t4 : e4;
          }
          function J(t4, e4) {
            t4 = st(t4).abs();
            e4 = st(e4).abs();
            if (t4.equals(e4))
              return t4;
            if (t4.isZero())
              return e4;
            if (e4.isZero())
              return t4;
            var r4 = u[1], i4, n2;
            while (t4.isEven() && e4.isEven()) {
              i4 = W(z(t4), z(e4));
              t4 = t4.divide(i4);
              e4 = e4.divide(i4);
              r4 = r4.multiply(i4);
            }
            while (t4.isEven())
              t4 = t4.divide(z(t4));
            do {
              while (e4.isEven())
                e4 = e4.divide(z(e4));
              if (t4.greater(e4)) {
                n2 = e4;
                e4 = t4;
                t4 = n2;
              }
              e4 = e4.subtract(t4);
            } while (!e4.isZero());
            return r4.isUnit() ? t4 : t4.multiply(r4);
          }
          function Z(t4, e4) {
            t4 = st(t4).abs();
            e4 = st(e4).abs();
            return t4.divide(J(t4, e4)).multiply(e4);
          }
          function $(t4, r4, i4) {
            t4 = st(t4);
            r4 = st(r4);
            var n2 = i4 || Math.random;
            var s2 = W(t4, r4), a2 = Y(t4, r4);
            var o2 = a2.subtract(s2).add(1);
            if (o2.isSmall)
              return s2.add(Math.floor(n2() * o2));
            var c2 = et(o2, e3).value;
            var l2 = [], f2 = true;
            for (var h2 = 0; h2 < c2.length; h2++) {
              var d2 = f2 ? c2[h2] + (h2 + 1 < c2.length ? c2[h2 + 1] / e3 : 0) : e3;
              var v2 = y(n2() * d2);
              l2.push(v2);
              if (v2 < c2[h2])
                f2 = false;
            }
            return s2.add(u.fromArray(l2, e3, false));
          }
          var X = function(t4, e4, r4, i4) {
            r4 = r4 || a;
            t4 = String(t4);
            if (!i4) {
              t4 = t4.toLowerCase();
              r4 = r4.toLowerCase();
            }
            var n2 = t4.length;
            var s2;
            var o2 = Math.abs(e4);
            var u2 = {};
            for (s2 = 0; s2 < r4.length; s2++)
              u2[r4[s2]] = s2;
            for (s2 = 0; s2 < n2; s2++) {
              var c2 = t4[s2];
              if ("-" === c2)
                continue;
              if (c2 in u2) {
                if (u2[c2] >= o2) {
                  if ("1" === c2 && 1 === o2)
                    continue;
                  throw new Error(c2 + " is not a valid digit in base " + e4 + ".");
                }
              }
            }
            e4 = st(e4);
            var l2 = [];
            var f2 = "-" === t4[0];
            for (s2 = f2 ? 1 : 0; s2 < t4.length; s2++) {
              var c2 = t4[s2];
              if (c2 in u2)
                l2.push(st(u2[c2]));
              else if ("<" === c2) {
                var h2 = s2;
                do {
                  s2++;
                } while (">" !== t4[s2] && s2 < t4.length);
                l2.push(st(t4.slice(h2 + 1, s2)));
              } else
                throw new Error(c2 + " is not a valid character");
            }
            return Q(l2, e4, f2);
          };
          function Q(t4, e4, r4) {
            var i4 = u[0], n2 = u[1], s2;
            for (s2 = t4.length - 1; s2 >= 0; s2--) {
              i4 = i4.add(t4[s2].times(n2));
              n2 = n2.times(e4);
            }
            return r4 ? i4.negate() : i4;
          }
          function tt2(t4, e4) {
            e4 = e4 || a;
            if (t4 < e4.length)
              return e4[t4];
            return "<" + t4 + ">";
          }
          function et(t4, e4) {
            e4 = n(e4);
            if (e4.isZero()) {
              if (t4.isZero())
                return { value: [0], isNegative: false };
              throw new Error("Cannot convert nonzero numbers to base 0.");
            }
            if (e4.equals(-1)) {
              if (t4.isZero())
                return { value: [0], isNegative: false };
              if (t4.isNegative())
                return { value: [].concat.apply([], Array.apply(null, Array(-t4.toJSNumber())).map(Array.prototype.valueOf, [1, 0])), isNegative: false };
              var r4 = Array.apply(null, Array(t4.toJSNumber() - 1)).map(Array.prototype.valueOf, [0, 1]);
              r4.unshift([1]);
              return { value: [].concat.apply([], r4), isNegative: false };
            }
            var i4 = false;
            if (t4.isNegative() && e4.isPositive()) {
              i4 = true;
              t4 = t4.abs();
            }
            if (e4.isUnit()) {
              if (t4.isZero())
                return { value: [0], isNegative: false };
              return { value: Array.apply(null, Array(t4.toJSNumber())).map(Number.prototype.valueOf, 1), isNegative: i4 };
            }
            var s2 = [];
            var a2 = t4, o2;
            while (a2.isNegative() || a2.compareAbs(e4) >= 0) {
              o2 = a2.divmod(e4);
              a2 = o2.quotient;
              var u2 = o2.remainder;
              if (u2.isNegative()) {
                u2 = e4.minus(u2).abs();
                a2 = a2.next();
              }
              s2.push(u2.toJSNumber());
            }
            s2.push(a2.toJSNumber());
            return { value: s2.reverse(), isNegative: i4 };
          }
          function rt(t4, e4, r4) {
            var i4 = et(t4, e4);
            return (i4.isNegative ? "-" : "") + i4.value.map(function(t5) {
              return tt2(t5, r4);
            }).join("");
          }
          c.prototype.toArray = function(t4) {
            return et(this, t4);
          };
          l.prototype.toArray = function(t4) {
            return et(this, t4);
          };
          f.prototype.toArray = function(t4) {
            return et(this, t4);
          };
          c.prototype.toString = function(e4, r4) {
            if (e4 === t3)
              e4 = 10;
            if (10 !== e4)
              return rt(this, e4, r4);
            var i4 = this.value, n2 = i4.length, s2 = String(i4[--n2]), a2 = "0000000", o2;
            while (--n2 >= 0) {
              o2 = String(i4[n2]);
              s2 += a2.slice(o2.length) + o2;
            }
            var u2 = this.sign ? "-" : "";
            return u2 + s2;
          };
          l.prototype.toString = function(e4, r4) {
            if (e4 === t3)
              e4 = 10;
            if (10 != e4)
              return rt(this, e4, r4);
            return String(this.value);
          };
          f.prototype.toString = l.prototype.toString;
          f.prototype.toJSON = c.prototype.toJSON = l.prototype.toJSON = function() {
            return this.toString();
          };
          c.prototype.valueOf = function() {
            return parseInt(this.toString(), 10);
          };
          c.prototype.toJSNumber = c.prototype.valueOf;
          l.prototype.valueOf = function() {
            return this.value;
          };
          l.prototype.toJSNumber = l.prototype.valueOf;
          f.prototype.valueOf = f.prototype.toJSNumber = function() {
            return parseInt(this.toString(), 10);
          };
          function it(t4) {
            if (h(+t4)) {
              var e4 = +t4;
              if (e4 === y(e4))
                return o ? new f(BigInt(e4)) : new l(e4);
              throw new Error("Invalid integer: " + t4);
            }
            var i4 = "-" === t4[0];
            if (i4)
              t4 = t4.slice(1);
            var n2 = t4.split(/e/i);
            if (n2.length > 2)
              throw new Error("Invalid integer: " + n2.join("e"));
            if (2 === n2.length) {
              var s2 = n2[1];
              if ("+" === s2[0])
                s2 = s2.slice(1);
              s2 = +s2;
              if (s2 !== y(s2) || !h(s2))
                throw new Error("Invalid integer: " + s2 + " is not a valid exponent.");
              var a2 = n2[0];
              var u2 = a2.indexOf(".");
              if (u2 >= 0) {
                s2 -= a2.length - u2 - 1;
                a2 = a2.slice(0, u2) + a2.slice(u2 + 1);
              }
              if (s2 < 0)
                throw new Error("Cannot include negative exponent part for integers");
              a2 += new Array(s2 + 1).join("0");
              t4 = a2;
            }
            var d2 = /^([0-9][0-9]*)$/.test(t4);
            if (!d2)
              throw new Error("Invalid integer: " + t4);
            if (o)
              return new f(BigInt(i4 ? "-" + t4 : t4));
            var v2 = [], g2 = t4.length, m2 = r3, w2 = g2 - m2;
            while (g2 > 0) {
              v2.push(+t4.slice(w2, g2));
              w2 -= m2;
              if (w2 < 0)
                w2 = 0;
              g2 -= m2;
            }
            p(v2);
            return new c(v2, i4);
          }
          function nt(t4) {
            if (o)
              return new f(BigInt(t4));
            if (h(t4)) {
              if (t4 !== y(t4))
                throw new Error(t4 + " is not an integer.");
              return new l(t4);
            }
            return it(t4.toString());
          }
          function st(t4) {
            if ("number" === typeof t4)
              return nt(t4);
            if ("string" === typeof t4)
              return it(t4);
            if ("bigint" === typeof t4)
              return new f(t4);
            return t4;
          }
          for (var at = 0; at < 1e3; at++) {
            u[at] = st(at);
            if (at > 0)
              u[-at] = st(-at);
          }
          u.one = u[1];
          u.zero = u[0];
          u.minusOne = u[-1];
          u.max = Y;
          u.min = W;
          u.gcd = J;
          u.lcm = Z;
          u.isInstance = function(t4) {
            return t4 instanceof c || t4 instanceof l || t4 instanceof f;
          };
          u.randBetween = $;
          u.fromArray = function(t4, e4, r4) {
            return Q(t4.map(st), st(e4 || 10), r4);
          };
          return u;
        }();
        if (t2.hasOwnProperty("exports"))
          t2.exports = n;
        i2 = function() {
          return n;
        }.call(e2, r2, e2, t2), void 0 !== i2 && (t2.exports = i2);
      }, 452: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(8269), r2(8214), r2(888), r2(5109));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.BlockCipher;
            var n = e3.algo;
            var s = [];
            var a = [];
            var o = [];
            var u = [];
            var c = [];
            var l = [];
            var f = [];
            var h = [];
            var d = [];
            var v = [];
            (function() {
              var t4 = [];
              for (var e4 = 0; e4 < 256; e4++)
                if (e4 < 128)
                  t4[e4] = e4 << 1;
                else
                  t4[e4] = e4 << 1 ^ 283;
              var r4 = 0;
              var i3 = 0;
              for (var e4 = 0; e4 < 256; e4++) {
                var n2 = i3 ^ i3 << 1 ^ i3 << 2 ^ i3 << 3 ^ i3 << 4;
                n2 = n2 >>> 8 ^ 255 & n2 ^ 99;
                s[r4] = n2;
                a[n2] = r4;
                var p2 = t4[r4];
                var g2 = t4[p2];
                var y = t4[g2];
                var m = 257 * t4[n2] ^ 16843008 * n2;
                o[r4] = m << 24 | m >>> 8;
                u[r4] = m << 16 | m >>> 16;
                c[r4] = m << 8 | m >>> 24;
                l[r4] = m;
                var m = 16843009 * y ^ 65537 * g2 ^ 257 * p2 ^ 16843008 * r4;
                f[n2] = m << 24 | m >>> 8;
                h[n2] = m << 16 | m >>> 16;
                d[n2] = m << 8 | m >>> 24;
                v[n2] = m;
                if (!r4)
                  r4 = i3 = 1;
                else {
                  r4 = p2 ^ t4[t4[t4[y ^ p2]]];
                  i3 ^= t4[t4[i3]];
                }
              }
            })();
            var p = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
            var g = n.AES = i2.extend({ _doReset: function() {
              var t4;
              if (this._nRounds && this._keyPriorReset === this._key)
                return;
              var e4 = this._keyPriorReset = this._key;
              var r4 = e4.words;
              var i3 = e4.sigBytes / 4;
              var n2 = this._nRounds = i3 + 6;
              var a2 = 4 * (n2 + 1);
              var o2 = this._keySchedule = [];
              for (var u2 = 0; u2 < a2; u2++)
                if (u2 < i3)
                  o2[u2] = r4[u2];
                else {
                  t4 = o2[u2 - 1];
                  if (!(u2 % i3)) {
                    t4 = t4 << 8 | t4 >>> 24;
                    t4 = s[t4 >>> 24] << 24 | s[t4 >>> 16 & 255] << 16 | s[t4 >>> 8 & 255] << 8 | s[255 & t4];
                    t4 ^= p[u2 / i3 | 0] << 24;
                  } else if (i3 > 6 && u2 % i3 == 4)
                    t4 = s[t4 >>> 24] << 24 | s[t4 >>> 16 & 255] << 16 | s[t4 >>> 8 & 255] << 8 | s[255 & t4];
                  o2[u2] = o2[u2 - i3] ^ t4;
                }
              var c2 = this._invKeySchedule = [];
              for (var l2 = 0; l2 < a2; l2++) {
                var u2 = a2 - l2;
                if (l2 % 4)
                  var t4 = o2[u2];
                else
                  var t4 = o2[u2 - 4];
                if (l2 < 4 || u2 <= 4)
                  c2[l2] = t4;
                else
                  c2[l2] = f[s[t4 >>> 24]] ^ h[s[t4 >>> 16 & 255]] ^ d[s[t4 >>> 8 & 255]] ^ v[s[255 & t4]];
              }
            }, encryptBlock: function(t4, e4) {
              this._doCryptBlock(t4, e4, this._keySchedule, o, u, c, l, s);
            }, decryptBlock: function(t4, e4) {
              var r4 = t4[e4 + 1];
              t4[e4 + 1] = t4[e4 + 3];
              t4[e4 + 3] = r4;
              this._doCryptBlock(t4, e4, this._invKeySchedule, f, h, d, v, a);
              var r4 = t4[e4 + 1];
              t4[e4 + 1] = t4[e4 + 3];
              t4[e4 + 3] = r4;
            }, _doCryptBlock: function(t4, e4, r4, i3, n2, s2, a2, o2) {
              var u2 = this._nRounds;
              var c2 = t4[e4] ^ r4[0];
              var l2 = t4[e4 + 1] ^ r4[1];
              var f2 = t4[e4 + 2] ^ r4[2];
              var h2 = t4[e4 + 3] ^ r4[3];
              var d2 = 4;
              for (var v2 = 1; v2 < u2; v2++) {
                var p2 = i3[c2 >>> 24] ^ n2[l2 >>> 16 & 255] ^ s2[f2 >>> 8 & 255] ^ a2[255 & h2] ^ r4[d2++];
                var g2 = i3[l2 >>> 24] ^ n2[f2 >>> 16 & 255] ^ s2[h2 >>> 8 & 255] ^ a2[255 & c2] ^ r4[d2++];
                var y = i3[f2 >>> 24] ^ n2[h2 >>> 16 & 255] ^ s2[c2 >>> 8 & 255] ^ a2[255 & l2] ^ r4[d2++];
                var m = i3[h2 >>> 24] ^ n2[c2 >>> 16 & 255] ^ s2[l2 >>> 8 & 255] ^ a2[255 & f2] ^ r4[d2++];
                c2 = p2;
                l2 = g2;
                f2 = y;
                h2 = m;
              }
              var p2 = (o2[c2 >>> 24] << 24 | o2[l2 >>> 16 & 255] << 16 | o2[f2 >>> 8 & 255] << 8 | o2[255 & h2]) ^ r4[d2++];
              var g2 = (o2[l2 >>> 24] << 24 | o2[f2 >>> 16 & 255] << 16 | o2[h2 >>> 8 & 255] << 8 | o2[255 & c2]) ^ r4[d2++];
              var y = (o2[f2 >>> 24] << 24 | o2[h2 >>> 16 & 255] << 16 | o2[c2 >>> 8 & 255] << 8 | o2[255 & l2]) ^ r4[d2++];
              var m = (o2[h2 >>> 24] << 24 | o2[c2 >>> 16 & 255] << 16 | o2[l2 >>> 8 & 255] << 8 | o2[255 & f2]) ^ r4[d2++];
              t4[e4] = p2;
              t4[e4 + 1] = g2;
              t4[e4 + 2] = y;
              t4[e4 + 3] = m;
            }, keySize: 256 / 32 });
            e3.AES = i2._createHelper(g);
          })();
          return t3.AES;
        });
      }, 5109: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(888));
        })(this, function(t3) {
          t3.lib.Cipher || function(e3) {
            var r3 = t3;
            var i2 = r3.lib;
            var n = i2.Base;
            var s = i2.WordArray;
            var a = i2.BufferedBlockAlgorithm;
            var o = r3.enc;
            o.Utf8;
            var c = o.Base64;
            var l = r3.algo;
            var f = l.EvpKDF;
            var h = i2.Cipher = a.extend({ cfg: n.extend(), createEncryptor: function(t4, e4) {
              return this.create(this._ENC_XFORM_MODE, t4, e4);
            }, createDecryptor: function(t4, e4) {
              return this.create(this._DEC_XFORM_MODE, t4, e4);
            }, init: function(t4, e4, r4) {
              this.cfg = this.cfg.extend(r4);
              this._xformMode = t4;
              this._key = e4;
              this.reset();
            }, reset: function() {
              a.reset.call(this);
              this._doReset();
            }, process: function(t4) {
              this._append(t4);
              return this._process();
            }, finalize: function(t4) {
              if (t4)
                this._append(t4);
              var e4 = this._doFinalize();
              return e4;
            }, keySize: 128 / 32, ivSize: 128 / 32, _ENC_XFORM_MODE: 1, _DEC_XFORM_MODE: 2, _createHelper: function() {
              function t4(t5) {
                if ("string" == typeof t5)
                  return M;
                else
                  return E;
              }
              return function(e4) {
                return { encrypt: function(r4, i3, n2) {
                  return t4(i3).encrypt(e4, r4, i3, n2);
                }, decrypt: function(r4, i3, n2) {
                  return t4(i3).decrypt(e4, r4, i3, n2);
                } };
              };
            }() });
            i2.StreamCipher = h.extend({ _doFinalize: function() {
              var t4 = this._process(true);
              return t4;
            }, blockSize: 1 });
            var v = r3.mode = {};
            var p = i2.BlockCipherMode = n.extend({ createEncryptor: function(t4, e4) {
              return this.Encryptor.create(t4, e4);
            }, createDecryptor: function(t4, e4) {
              return this.Decryptor.create(t4, e4);
            }, init: function(t4, e4) {
              this._cipher = t4;
              this._iv = e4;
            } });
            var g = v.CBC = function() {
              var t4 = p.extend();
              t4.Encryptor = t4.extend({ processBlock: function(t5, e4) {
                var i3 = this._cipher;
                var n2 = i3.blockSize;
                r4.call(this, t5, e4, n2);
                i3.encryptBlock(t5, e4);
                this._prevBlock = t5.slice(e4, e4 + n2);
              } });
              t4.Decryptor = t4.extend({ processBlock: function(t5, e4) {
                var i3 = this._cipher;
                var n2 = i3.blockSize;
                var s2 = t5.slice(e4, e4 + n2);
                i3.decryptBlock(t5, e4);
                r4.call(this, t5, e4, n2);
                this._prevBlock = s2;
              } });
              function r4(t5, r5, i3) {
                var n2;
                var s2 = this._iv;
                if (s2) {
                  n2 = s2;
                  this._iv = e3;
                } else
                  n2 = this._prevBlock;
                for (var a2 = 0; a2 < i3; a2++)
                  t5[r5 + a2] ^= n2[a2];
              }
              return t4;
            }();
            var y = r3.pad = {};
            var m = y.Pkcs7 = { pad: function(t4, e4) {
              var r4 = 4 * e4;
              var i3 = r4 - t4.sigBytes % r4;
              var n2 = i3 << 24 | i3 << 16 | i3 << 8 | i3;
              var a2 = [];
              for (var o2 = 0; o2 < i3; o2 += 4)
                a2.push(n2);
              var u = s.create(a2, i3);
              t4.concat(u);
            }, unpad: function(t4) {
              var e4 = 255 & t4.words[t4.sigBytes - 1 >>> 2];
              t4.sigBytes -= e4;
            } };
            i2.BlockCipher = h.extend({ cfg: h.cfg.extend({ mode: g, padding: m }), reset: function() {
              var t4;
              h.reset.call(this);
              var e4 = this.cfg;
              var r4 = e4.iv;
              var i3 = e4.mode;
              if (this._xformMode == this._ENC_XFORM_MODE)
                t4 = i3.createEncryptor;
              else {
                t4 = i3.createDecryptor;
                this._minBufferSize = 1;
              }
              if (this._mode && this._mode.__creator == t4)
                this._mode.init(this, r4 && r4.words);
              else {
                this._mode = t4.call(i3, this, r4 && r4.words);
                this._mode.__creator = t4;
              }
            }, _doProcessBlock: function(t4, e4) {
              this._mode.processBlock(t4, e4);
            }, _doFinalize: function() {
              var t4;
              var e4 = this.cfg.padding;
              if (this._xformMode == this._ENC_XFORM_MODE) {
                e4.pad(this._data, this.blockSize);
                t4 = this._process(true);
              } else {
                t4 = this._process(true);
                e4.unpad(t4);
              }
              return t4;
            }, blockSize: 128 / 32 });
            var _ = i2.CipherParams = n.extend({ init: function(t4) {
              this.mixIn(t4);
            }, toString: function(t4) {
              return (t4 || this.formatter).stringify(this);
            } });
            var S = r3.format = {};
            var b = S.OpenSSL = { stringify: function(t4) {
              var e4;
              var r4 = t4.ciphertext;
              var i3 = t4.salt;
              if (i3)
                e4 = s.create([1398893684, 1701076831]).concat(i3).concat(r4);
              else
                e4 = r4;
              return e4.toString(c);
            }, parse: function(t4) {
              var e4;
              var r4 = c.parse(t4);
              var i3 = r4.words;
              if (1398893684 == i3[0] && 1701076831 == i3[1]) {
                e4 = s.create(i3.slice(2, 4));
                i3.splice(0, 4);
                r4.sigBytes -= 16;
              }
              return _.create({ ciphertext: r4, salt: e4 });
            } };
            var E = i2.SerializableCipher = n.extend({ cfg: n.extend({ format: b }), encrypt: function(t4, e4, r4, i3) {
              i3 = this.cfg.extend(i3);
              var n2 = t4.createEncryptor(r4, i3);
              var s2 = n2.finalize(e4);
              var a2 = n2.cfg;
              return _.create({ ciphertext: s2, key: r4, iv: a2.iv, algorithm: t4, mode: a2.mode, padding: a2.padding, blockSize: t4.blockSize, formatter: i3.format });
            }, decrypt: function(t4, e4, r4, i3) {
              i3 = this.cfg.extend(i3);
              e4 = this._parse(e4, i3.format);
              var n2 = t4.createDecryptor(r4, i3).finalize(e4.ciphertext);
              return n2;
            }, _parse: function(t4, e4) {
              if ("string" == typeof t4)
                return e4.parse(t4, this);
              else
                return t4;
            } });
            var D = r3.kdf = {};
            var T = D.OpenSSL = { execute: function(t4, e4, r4, i3) {
              if (!i3)
                i3 = s.random(64 / 8);
              var n2 = f.create({ keySize: e4 + r4 }).compute(t4, i3);
              var a2 = s.create(n2.words.slice(e4), 4 * r4);
              n2.sigBytes = 4 * e4;
              return _.create({ key: n2, iv: a2, salt: i3 });
            } };
            var M = i2.PasswordBasedCipher = E.extend({ cfg: E.cfg.extend({ kdf: T }), encrypt: function(t4, e4, r4, i3) {
              i3 = this.cfg.extend(i3);
              var n2 = i3.kdf.execute(r4, t4.keySize, t4.ivSize);
              i3.iv = n2.iv;
              var s2 = E.encrypt.call(this, t4, e4, n2.key, i3);
              s2.mixIn(n2);
              return s2;
            }, decrypt: function(t4, e4, r4, i3) {
              i3 = this.cfg.extend(i3);
              e4 = this._parse(e4, i3.format);
              var n2 = i3.kdf.execute(r4, t4.keySize, t4.ivSize, e4.salt);
              i3.iv = n2.iv;
              var s2 = E.decrypt.call(this, t4, e4, n2.key, i3);
              return s2;
            } });
          }();
        });
      }, 8249: function(t2, e2, r2) {
        (function(r3, i2) {
          t2.exports = i2();
        })(this, function() {
          var t3 = t3 || function(t4, e3) {
            var i2;
            if ("undefined" !== typeof window && $inject_window_crypto)
              i2 = $inject_window_crypto;
            if ("undefined" !== typeof self && self.crypto)
              i2 = self.crypto;
            if ("undefined" !== typeof globalThis && globalThis.crypto)
              i2 = globalThis.crypto;
            if (!i2 && "undefined" !== typeof window && window.msCrypto)
              i2 = window.msCrypto;
            if (!i2 && "undefined" !== typeof r2.g && r2.g.crypto)
              i2 = r2.g.crypto;
            if (!i2 && true)
              try {
                i2 = r2(2480);
              } catch (t5) {
              }
            var n = function() {
              if (i2) {
                if ("function" === typeof i2.getRandomValues)
                  try {
                    return i2.getRandomValues(new Uint32Array(1))[0];
                  } catch (t5) {
                  }
                if ("function" === typeof i2.randomBytes)
                  try {
                    return i2.randomBytes(4).readInt32LE();
                  } catch (t5) {
                  }
              }
              throw new Error("Native crypto module could not be used to get secure random number.");
            };
            var s = Object.create || function() {
              function t5() {
              }
              return function(e4) {
                var r3;
                t5.prototype = e4;
                r3 = new t5();
                t5.prototype = null;
                return r3;
              };
            }();
            var a = {};
            var o = a.lib = {};
            var u = o.Base = function() {
              return { extend: function(t5) {
                var e4 = s(this);
                if (t5)
                  e4.mixIn(t5);
                if (!e4.hasOwnProperty("init") || this.init === e4.init)
                  e4.init = function() {
                    e4.$super.init.apply(this, arguments);
                  };
                e4.init.prototype = e4;
                e4.$super = this;
                return e4;
              }, create: function() {
                var t5 = this.extend();
                t5.init.apply(t5, arguments);
                return t5;
              }, init: function() {
              }, mixIn: function(t5) {
                for (var e4 in t5)
                  if (t5.hasOwnProperty(e4))
                    this[e4] = t5[e4];
                if (t5.hasOwnProperty("toString"))
                  this.toString = t5.toString;
              }, clone: function() {
                return this.init.prototype.extend(this);
              } };
            }();
            var c = o.WordArray = u.extend({ init: function(t5, r3) {
              t5 = this.words = t5 || [];
              if (r3 != e3)
                this.sigBytes = r3;
              else
                this.sigBytes = 4 * t5.length;
            }, toString: function(t5) {
              return (t5 || f).stringify(this);
            }, concat: function(t5) {
              var e4 = this.words;
              var r3 = t5.words;
              var i3 = this.sigBytes;
              var n2 = t5.sigBytes;
              this.clamp();
              if (i3 % 4)
                for (var s2 = 0; s2 < n2; s2++) {
                  var a2 = r3[s2 >>> 2] >>> 24 - s2 % 4 * 8 & 255;
                  e4[i3 + s2 >>> 2] |= a2 << 24 - (i3 + s2) % 4 * 8;
                }
              else
                for (var o2 = 0; o2 < n2; o2 += 4)
                  e4[i3 + o2 >>> 2] = r3[o2 >>> 2];
              this.sigBytes += n2;
              return this;
            }, clamp: function() {
              var e4 = this.words;
              var r3 = this.sigBytes;
              e4[r3 >>> 2] &= 4294967295 << 32 - r3 % 4 * 8;
              e4.length = t4.ceil(r3 / 4);
            }, clone: function() {
              var t5 = u.clone.call(this);
              t5.words = this.words.slice(0);
              return t5;
            }, random: function(t5) {
              var e4 = [];
              for (var r3 = 0; r3 < t5; r3 += 4)
                e4.push(n());
              return new c.init(e4, t5);
            } });
            var l = a.enc = {};
            var f = l.Hex = { stringify: function(t5) {
              var e4 = t5.words;
              var r3 = t5.sigBytes;
              var i3 = [];
              for (var n2 = 0; n2 < r3; n2++) {
                var s2 = e4[n2 >>> 2] >>> 24 - n2 % 4 * 8 & 255;
                i3.push((s2 >>> 4).toString(16));
                i3.push((15 & s2).toString(16));
              }
              return i3.join("");
            }, parse: function(t5) {
              var e4 = t5.length;
              var r3 = [];
              for (var i3 = 0; i3 < e4; i3 += 2)
                r3[i3 >>> 3] |= parseInt(t5.substr(i3, 2), 16) << 24 - i3 % 8 * 4;
              return new c.init(r3, e4 / 2);
            } };
            var h = l.Latin1 = { stringify: function(t5) {
              var e4 = t5.words;
              var r3 = t5.sigBytes;
              var i3 = [];
              for (var n2 = 0; n2 < r3; n2++) {
                var s2 = e4[n2 >>> 2] >>> 24 - n2 % 4 * 8 & 255;
                i3.push(String.fromCharCode(s2));
              }
              return i3.join("");
            }, parse: function(t5) {
              var e4 = t5.length;
              var r3 = [];
              for (var i3 = 0; i3 < e4; i3++)
                r3[i3 >>> 2] |= (255 & t5.charCodeAt(i3)) << 24 - i3 % 4 * 8;
              return new c.init(r3, e4);
            } };
            var d = l.Utf8 = { stringify: function(t5) {
              try {
                return decodeURIComponent(escape(h.stringify(t5)));
              } catch (t6) {
                throw new Error("Malformed UTF-8 data");
              }
            }, parse: function(t5) {
              return h.parse(unescape(encodeURIComponent(t5)));
            } };
            var v = o.BufferedBlockAlgorithm = u.extend({ reset: function() {
              this._data = new c.init();
              this._nDataBytes = 0;
            }, _append: function(t5) {
              if ("string" == typeof t5)
                t5 = d.parse(t5);
              this._data.concat(t5);
              this._nDataBytes += t5.sigBytes;
            }, _process: function(e4) {
              var r3;
              var i3 = this._data;
              var n2 = i3.words;
              var s2 = i3.sigBytes;
              var a2 = this.blockSize;
              var o2 = 4 * a2;
              var u2 = s2 / o2;
              if (e4)
                u2 = t4.ceil(u2);
              else
                u2 = t4.max((0 | u2) - this._minBufferSize, 0);
              var l2 = u2 * a2;
              var f2 = t4.min(4 * l2, s2);
              if (l2) {
                for (var h2 = 0; h2 < l2; h2 += a2)
                  this._doProcessBlock(n2, h2);
                r3 = n2.splice(0, l2);
                i3.sigBytes -= f2;
              }
              return new c.init(r3, f2);
            }, clone: function() {
              var t5 = u.clone.call(this);
              t5._data = this._data.clone();
              return t5;
            }, _minBufferSize: 0 });
            o.Hasher = v.extend({ cfg: u.extend(), init: function(t5) {
              this.cfg = this.cfg.extend(t5);
              this.reset();
            }, reset: function() {
              v.reset.call(this);
              this._doReset();
            }, update: function(t5) {
              this._append(t5);
              this._process();
              return this;
            }, finalize: function(t5) {
              if (t5)
                this._append(t5);
              var e4 = this._doFinalize();
              return e4;
            }, blockSize: 512 / 32, _createHelper: function(t5) {
              return function(e4, r3) {
                return new t5.init(r3).finalize(e4);
              };
            }, _createHmacHelper: function(t5) {
              return function(e4, r3) {
                return new g.HMAC.init(t5, r3).finalize(e4);
              };
            } });
            var g = a.algo = {};
            return a;
          }(Math);
          return t3;
        });
      }, 8269: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.WordArray;
            var n = e3.enc;
            n.Base64 = { stringify: function(t4) {
              var e4 = t4.words;
              var r4 = t4.sigBytes;
              var i3 = this._map;
              t4.clamp();
              var n2 = [];
              for (var s = 0; s < r4; s += 3) {
                var a2 = e4[s >>> 2] >>> 24 - s % 4 * 8 & 255;
                var o = e4[s + 1 >>> 2] >>> 24 - (s + 1) % 4 * 8 & 255;
                var u = e4[s + 2 >>> 2] >>> 24 - (s + 2) % 4 * 8 & 255;
                var c = a2 << 16 | o << 8 | u;
                for (var l = 0; l < 4 && s + 0.75 * l < r4; l++)
                  n2.push(i3.charAt(c >>> 6 * (3 - l) & 63));
              }
              var f = i3.charAt(64);
              if (f)
                while (n2.length % 4)
                  n2.push(f);
              return n2.join("");
            }, parse: function(t4) {
              var e4 = t4.length;
              var r4 = this._map;
              var i3 = this._reverseMap;
              if (!i3) {
                i3 = this._reverseMap = [];
                for (var n2 = 0; n2 < r4.length; n2++)
                  i3[r4.charCodeAt(n2)] = n2;
              }
              var s = r4.charAt(64);
              if (s) {
                var o = t4.indexOf(s);
                if (-1 !== o)
                  e4 = o;
              }
              return a(t4, e4, i3);
            }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" };
            function a(t4, e4, r4) {
              var n2 = [];
              var s = 0;
              for (var a2 = 0; a2 < e4; a2++)
                if (a2 % 4) {
                  var o = r4[t4.charCodeAt(a2 - 1)] << a2 % 4 * 2;
                  var u = r4[t4.charCodeAt(a2)] >>> 6 - a2 % 4 * 2;
                  var c = o | u;
                  n2[s >>> 2] |= c << 24 - s % 4 * 8;
                  s++;
                }
              return i2.create(n2, s);
            }
          })();
          return t3.enc.Base64;
        });
      }, 3786: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.WordArray;
            var n = e3.enc;
            n.Base64url = { stringify: function(t4, e4 = true) {
              var r4 = t4.words;
              var i3 = t4.sigBytes;
              var n2 = e4 ? this._safe_map : this._map;
              t4.clamp();
              var s = [];
              for (var a2 = 0; a2 < i3; a2 += 3) {
                var o = r4[a2 >>> 2] >>> 24 - a2 % 4 * 8 & 255;
                var u = r4[a2 + 1 >>> 2] >>> 24 - (a2 + 1) % 4 * 8 & 255;
                var c = r4[a2 + 2 >>> 2] >>> 24 - (a2 + 2) % 4 * 8 & 255;
                var l = o << 16 | u << 8 | c;
                for (var f = 0; f < 4 && a2 + 0.75 * f < i3; f++)
                  s.push(n2.charAt(l >>> 6 * (3 - f) & 63));
              }
              var h = n2.charAt(64);
              if (h)
                while (s.length % 4)
                  s.push(h);
              return s.join("");
            }, parse: function(t4, e4 = true) {
              var r4 = t4.length;
              var i3 = e4 ? this._safe_map : this._map;
              var n2 = this._reverseMap;
              if (!n2) {
                n2 = this._reverseMap = [];
                for (var s = 0; s < i3.length; s++)
                  n2[i3.charCodeAt(s)] = s;
              }
              var o = i3.charAt(64);
              if (o) {
                var u = t4.indexOf(o);
                if (-1 !== u)
                  r4 = u;
              }
              return a(t4, r4, n2);
            }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", _safe_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" };
            function a(t4, e4, r4) {
              var n2 = [];
              var s = 0;
              for (var a2 = 0; a2 < e4; a2++)
                if (a2 % 4) {
                  var o = r4[t4.charCodeAt(a2 - 1)] << a2 % 4 * 2;
                  var u = r4[t4.charCodeAt(a2)] >>> 6 - a2 % 4 * 2;
                  var c = o | u;
                  n2[s >>> 2] |= c << 24 - s % 4 * 8;
                  s++;
                }
              return i2.create(n2, s);
            }
          })();
          return t3.enc.Base64url;
        });
      }, 298: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.WordArray;
            var n = e3.enc;
            n.Utf16 = n.Utf16BE = { stringify: function(t4) {
              var e4 = t4.words;
              var r4 = t4.sigBytes;
              var i3 = [];
              for (var n2 = 0; n2 < r4; n2 += 2) {
                var s = e4[n2 >>> 2] >>> 16 - n2 % 4 * 8 & 65535;
                i3.push(String.fromCharCode(s));
              }
              return i3.join("");
            }, parse: function(t4) {
              var e4 = t4.length;
              var r4 = [];
              for (var n2 = 0; n2 < e4; n2++)
                r4[n2 >>> 1] |= t4.charCodeAt(n2) << 16 - n2 % 2 * 16;
              return i2.create(r4, 2 * e4);
            } };
            n.Utf16LE = { stringify: function(t4) {
              var e4 = t4.words;
              var r4 = t4.sigBytes;
              var i3 = [];
              for (var n2 = 0; n2 < r4; n2 += 2) {
                var s = a(e4[n2 >>> 2] >>> 16 - n2 % 4 * 8 & 65535);
                i3.push(String.fromCharCode(s));
              }
              return i3.join("");
            }, parse: function(t4) {
              var e4 = t4.length;
              var r4 = [];
              for (var n2 = 0; n2 < e4; n2++)
                r4[n2 >>> 1] |= a(t4.charCodeAt(n2) << 16 - n2 % 2 * 16);
              return i2.create(r4, 2 * e4);
            } };
            function a(t4) {
              return t4 << 8 & 4278255360 | t4 >>> 8 & 16711935;
            }
          })();
          return t3.enc.Utf16;
        });
      }, 888: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(2783), r2(9824));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.Base;
            var n = r3.WordArray;
            var s = e3.algo;
            var a = s.MD5;
            var o = s.EvpKDF = i2.extend({ cfg: i2.extend({ keySize: 128 / 32, hasher: a, iterations: 1 }), init: function(t4) {
              this.cfg = this.cfg.extend(t4);
            }, compute: function(t4, e4) {
              var r4;
              var i3 = this.cfg;
              var s2 = i3.hasher.create();
              var a2 = n.create();
              var o2 = a2.words;
              var u = i3.keySize;
              var c = i3.iterations;
              while (o2.length < u) {
                if (r4)
                  s2.update(r4);
                r4 = s2.update(t4).finalize(e4);
                s2.reset();
                for (var l = 1; l < c; l++) {
                  r4 = s2.finalize(r4);
                  s2.reset();
                }
                a2.concat(r4);
              }
              a2.sigBytes = 4 * u;
              return a2;
            } });
            e3.EvpKDF = function(t4, e4, r4) {
              return o.create(r4).compute(t4, e4);
            };
          })();
          return t3.EvpKDF;
        });
      }, 2209: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          (function(e3) {
            var r3 = t3;
            var i2 = r3.lib;
            var n = i2.CipherParams;
            var s = r3.enc;
            var a = s.Hex;
            var o = r3.format;
            o.Hex = { stringify: function(t4) {
              return t4.ciphertext.toString(a);
            }, parse: function(t4) {
              var e4 = a.parse(t4);
              return n.create({ ciphertext: e4 });
            } };
          })();
          return t3.format.Hex;
        });
      }, 9824: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.Base;
            var n = e3.enc;
            var s = n.Utf8;
            var a = e3.algo;
            a.HMAC = i2.extend({ init: function(t4, e4) {
              t4 = this._hasher = new t4.init();
              if ("string" == typeof e4)
                e4 = s.parse(e4);
              var r4 = t4.blockSize;
              var i3 = 4 * r4;
              if (e4.sigBytes > i3)
                e4 = t4.finalize(e4);
              e4.clamp();
              var n2 = this._oKey = e4.clone();
              var a2 = this._iKey = e4.clone();
              var o = n2.words;
              var u = a2.words;
              for (var c = 0; c < r4; c++) {
                o[c] ^= 1549556828;
                u[c] ^= 909522486;
              }
              n2.sigBytes = a2.sigBytes = i3;
              this.reset();
            }, reset: function() {
              var t4 = this._hasher;
              t4.reset();
              t4.update(this._iKey);
            }, update: function(t4) {
              this._hasher.update(t4);
              return this;
            }, finalize: function(t4) {
              var e4 = this._hasher;
              var r4 = e4.finalize(t4);
              e4.reset();
              var i3 = e4.finalize(this._oKey.clone().concat(r4));
              return i3;
            } });
          })();
        });
      }, 1354: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(4938), r2(4433), r2(298), r2(8269), r2(3786), r2(8214), r2(2783), r2(2153), r2(7792), r2(34), r2(7460), r2(3327), r2(706), r2(9824), r2(2112), r2(888), r2(5109), r2(8568), r2(4242), r2(9968), r2(7660), r2(1148), r2(3615), r2(2807), r2(1077), r2(6475), r2(6991), r2(2209), r2(452), r2(4253), r2(1857), r2(4454), r2(3974));
        })(this, function(t3) {
          return t3;
        });
      }, 4433: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function() {
            if ("function" != typeof ArrayBuffer)
              return;
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.WordArray;
            var n = i2.init;
            var s = i2.init = function(t4) {
              if (t4 instanceof ArrayBuffer)
                t4 = new Uint8Array(t4);
              if (t4 instanceof Int8Array || "undefined" !== typeof Uint8ClampedArray && t4 instanceof Uint8ClampedArray || t4 instanceof Int16Array || t4 instanceof Uint16Array || t4 instanceof Int32Array || t4 instanceof Uint32Array || t4 instanceof Float32Array || t4 instanceof Float64Array)
                t4 = new Uint8Array(t4.buffer, t4.byteOffset, t4.byteLength);
              if (t4 instanceof Uint8Array) {
                var e4 = t4.byteLength;
                var r4 = [];
                for (var i3 = 0; i3 < e4; i3++)
                  r4[i3 >>> 2] |= t4[i3] << 24 - i3 % 4 * 8;
                n.call(this, r4, e4);
              } else
                n.apply(this, arguments);
            };
            s.prototype = i2;
          })();
          return t3.lib.WordArray;
        });
      }, 8214: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function(e3) {
            var r3 = t3;
            var i2 = r3.lib;
            var n = i2.WordArray;
            var s = i2.Hasher;
            var a = r3.algo;
            var o = [];
            (function() {
              for (var t4 = 0; t4 < 64; t4++)
                o[t4] = 4294967296 * e3.abs(e3.sin(t4 + 1)) | 0;
            })();
            var u = a.MD5 = s.extend({ _doReset: function() {
              this._hash = new n.init([1732584193, 4023233417, 2562383102, 271733878]);
            }, _doProcessBlock: function(t4, e4) {
              for (var r4 = 0; r4 < 16; r4++) {
                var i3 = e4 + r4;
                var n2 = t4[i3];
                t4[i3] = 16711935 & (n2 << 8 | n2 >>> 24) | 4278255360 & (n2 << 24 | n2 >>> 8);
              }
              var s2 = this._hash.words;
              var a2 = t4[e4 + 0];
              var u2 = t4[e4 + 1];
              var d = t4[e4 + 2];
              var v = t4[e4 + 3];
              var p = t4[e4 + 4];
              var g = t4[e4 + 5];
              var y = t4[e4 + 6];
              var m = t4[e4 + 7];
              var w = t4[e4 + 8];
              var _ = t4[e4 + 9];
              var S = t4[e4 + 10];
              var b = t4[e4 + 11];
              var E = t4[e4 + 12];
              var D = t4[e4 + 13];
              var T = t4[e4 + 14];
              var M = t4[e4 + 15];
              var I = s2[0];
              var A = s2[1];
              var x = s2[2];
              var R = s2[3];
              I = c(I, A, x, R, a2, 7, o[0]);
              R = c(R, I, A, x, u2, 12, o[1]);
              x = c(x, R, I, A, d, 17, o[2]);
              A = c(A, x, R, I, v, 22, o[3]);
              I = c(I, A, x, R, p, 7, o[4]);
              R = c(R, I, A, x, g, 12, o[5]);
              x = c(x, R, I, A, y, 17, o[6]);
              A = c(A, x, R, I, m, 22, o[7]);
              I = c(I, A, x, R, w, 7, o[8]);
              R = c(R, I, A, x, _, 12, o[9]);
              x = c(x, R, I, A, S, 17, o[10]);
              A = c(A, x, R, I, b, 22, o[11]);
              I = c(I, A, x, R, E, 7, o[12]);
              R = c(R, I, A, x, D, 12, o[13]);
              x = c(x, R, I, A, T, 17, o[14]);
              A = c(A, x, R, I, M, 22, o[15]);
              I = l(I, A, x, R, u2, 5, o[16]);
              R = l(R, I, A, x, y, 9, o[17]);
              x = l(x, R, I, A, b, 14, o[18]);
              A = l(A, x, R, I, a2, 20, o[19]);
              I = l(I, A, x, R, g, 5, o[20]);
              R = l(R, I, A, x, S, 9, o[21]);
              x = l(x, R, I, A, M, 14, o[22]);
              A = l(A, x, R, I, p, 20, o[23]);
              I = l(I, A, x, R, _, 5, o[24]);
              R = l(R, I, A, x, T, 9, o[25]);
              x = l(x, R, I, A, v, 14, o[26]);
              A = l(A, x, R, I, w, 20, o[27]);
              I = l(I, A, x, R, D, 5, o[28]);
              R = l(R, I, A, x, d, 9, o[29]);
              x = l(x, R, I, A, m, 14, o[30]);
              A = l(A, x, R, I, E, 20, o[31]);
              I = f(I, A, x, R, g, 4, o[32]);
              R = f(R, I, A, x, w, 11, o[33]);
              x = f(x, R, I, A, b, 16, o[34]);
              A = f(A, x, R, I, T, 23, o[35]);
              I = f(I, A, x, R, u2, 4, o[36]);
              R = f(R, I, A, x, p, 11, o[37]);
              x = f(x, R, I, A, m, 16, o[38]);
              A = f(A, x, R, I, S, 23, o[39]);
              I = f(I, A, x, R, D, 4, o[40]);
              R = f(R, I, A, x, a2, 11, o[41]);
              x = f(x, R, I, A, v, 16, o[42]);
              A = f(A, x, R, I, y, 23, o[43]);
              I = f(I, A, x, R, _, 4, o[44]);
              R = f(R, I, A, x, E, 11, o[45]);
              x = f(x, R, I, A, M, 16, o[46]);
              A = f(A, x, R, I, d, 23, o[47]);
              I = h(I, A, x, R, a2, 6, o[48]);
              R = h(R, I, A, x, m, 10, o[49]);
              x = h(x, R, I, A, T, 15, o[50]);
              A = h(A, x, R, I, g, 21, o[51]);
              I = h(I, A, x, R, E, 6, o[52]);
              R = h(R, I, A, x, v, 10, o[53]);
              x = h(x, R, I, A, S, 15, o[54]);
              A = h(A, x, R, I, u2, 21, o[55]);
              I = h(I, A, x, R, w, 6, o[56]);
              R = h(R, I, A, x, M, 10, o[57]);
              x = h(x, R, I, A, y, 15, o[58]);
              A = h(A, x, R, I, D, 21, o[59]);
              I = h(I, A, x, R, p, 6, o[60]);
              R = h(R, I, A, x, b, 10, o[61]);
              x = h(x, R, I, A, d, 15, o[62]);
              A = h(A, x, R, I, _, 21, o[63]);
              s2[0] = s2[0] + I | 0;
              s2[1] = s2[1] + A | 0;
              s2[2] = s2[2] + x | 0;
              s2[3] = s2[3] + R | 0;
            }, _doFinalize: function() {
              var t4 = this._data;
              var r4 = t4.words;
              var i3 = 8 * this._nDataBytes;
              var n2 = 8 * t4.sigBytes;
              r4[n2 >>> 5] |= 128 << 24 - n2 % 32;
              var s2 = e3.floor(i3 / 4294967296);
              var a2 = i3;
              r4[(n2 + 64 >>> 9 << 4) + 15] = 16711935 & (s2 << 8 | s2 >>> 24) | 4278255360 & (s2 << 24 | s2 >>> 8);
              r4[(n2 + 64 >>> 9 << 4) + 14] = 16711935 & (a2 << 8 | a2 >>> 24) | 4278255360 & (a2 << 24 | a2 >>> 8);
              t4.sigBytes = 4 * (r4.length + 1);
              this._process();
              var o2 = this._hash;
              var u2 = o2.words;
              for (var c2 = 0; c2 < 4; c2++) {
                var l2 = u2[c2];
                u2[c2] = 16711935 & (l2 << 8 | l2 >>> 24) | 4278255360 & (l2 << 24 | l2 >>> 8);
              }
              return o2;
            }, clone: function() {
              var t4 = s.clone.call(this);
              t4._hash = this._hash.clone();
              return t4;
            } });
            function c(t4, e4, r4, i3, n2, s2, a2) {
              var o2 = t4 + (e4 & r4 | ~e4 & i3) + n2 + a2;
              return (o2 << s2 | o2 >>> 32 - s2) + e4;
            }
            function l(t4, e4, r4, i3, n2, s2, a2) {
              var o2 = t4 + (e4 & i3 | r4 & ~i3) + n2 + a2;
              return (o2 << s2 | o2 >>> 32 - s2) + e4;
            }
            function f(t4, e4, r4, i3, n2, s2, a2) {
              var o2 = t4 + (e4 ^ r4 ^ i3) + n2 + a2;
              return (o2 << s2 | o2 >>> 32 - s2) + e4;
            }
            function h(t4, e4, r4, i3, n2, s2, a2) {
              var o2 = t4 + (r4 ^ (e4 | ~i3)) + n2 + a2;
              return (o2 << s2 | o2 >>> 32 - s2) + e4;
            }
            r3.MD5 = s._createHelper(u);
            r3.HmacMD5 = s._createHmacHelper(u);
          })(Math);
          return t3.MD5;
        });
      }, 8568: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.mode.CFB = function() {
            var e3 = t3.lib.BlockCipherMode.extend();
            e3.Encryptor = e3.extend({ processBlock: function(t4, e4) {
              var i2 = this._cipher;
              var n = i2.blockSize;
              r3.call(this, t4, e4, n, i2);
              this._prevBlock = t4.slice(e4, e4 + n);
            } });
            e3.Decryptor = e3.extend({ processBlock: function(t4, e4) {
              var i2 = this._cipher;
              var n = i2.blockSize;
              var s = t4.slice(e4, e4 + n);
              r3.call(this, t4, e4, n, i2);
              this._prevBlock = s;
            } });
            function r3(t4, e4, r4, i2) {
              var n;
              var s = this._iv;
              if (s) {
                n = s.slice(0);
                this._iv = void 0;
              } else
                n = this._prevBlock;
              i2.encryptBlock(n, 0);
              for (var a = 0; a < r4; a++)
                t4[e4 + a] ^= n[a];
            }
            return e3;
          }();
          return t3.mode.CFB;
        });
      }, 9968: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.mode.CTRGladman = function() {
            var e3 = t3.lib.BlockCipherMode.extend();
            function r3(t4) {
              if (255 === (t4 >> 24 & 255)) {
                var e4 = t4 >> 16 & 255;
                var r4 = t4 >> 8 & 255;
                var i3 = 255 & t4;
                if (255 === e4) {
                  e4 = 0;
                  if (255 === r4) {
                    r4 = 0;
                    if (255 === i3)
                      i3 = 0;
                    else
                      ++i3;
                  } else
                    ++r4;
                } else
                  ++e4;
                t4 = 0;
                t4 += e4 << 16;
                t4 += r4 << 8;
                t4 += i3;
              } else
                t4 += 1 << 24;
              return t4;
            }
            function i2(t4) {
              if (0 === (t4[0] = r3(t4[0])))
                t4[1] = r3(t4[1]);
              return t4;
            }
            var n = e3.Encryptor = e3.extend({ processBlock: function(t4, e4) {
              var r4 = this._cipher;
              var n2 = r4.blockSize;
              var s = this._iv;
              var a = this._counter;
              if (s) {
                a = this._counter = s.slice(0);
                this._iv = void 0;
              }
              i2(a);
              var o = a.slice(0);
              r4.encryptBlock(o, 0);
              for (var u = 0; u < n2; u++)
                t4[e4 + u] ^= o[u];
            } });
            e3.Decryptor = n;
            return e3;
          }();
          return t3.mode.CTRGladman;
        });
      }, 4242: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.mode.CTR = function() {
            var e3 = t3.lib.BlockCipherMode.extend();
            var r3 = e3.Encryptor = e3.extend({ processBlock: function(t4, e4) {
              var r4 = this._cipher;
              var i2 = r4.blockSize;
              var n = this._iv;
              var s = this._counter;
              if (n) {
                s = this._counter = n.slice(0);
                this._iv = void 0;
              }
              var a = s.slice(0);
              r4.encryptBlock(a, 0);
              s[i2 - 1] = s[i2 - 1] + 1 | 0;
              for (var o = 0; o < i2; o++)
                t4[e4 + o] ^= a[o];
            } });
            e3.Decryptor = r3;
            return e3;
          }();
          return t3.mode.CTR;
        });
      }, 1148: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.mode.ECB = function() {
            var e3 = t3.lib.BlockCipherMode.extend();
            e3.Encryptor = e3.extend({ processBlock: function(t4, e4) {
              this._cipher.encryptBlock(t4, e4);
            } });
            e3.Decryptor = e3.extend({ processBlock: function(t4, e4) {
              this._cipher.decryptBlock(t4, e4);
            } });
            return e3;
          }();
          return t3.mode.ECB;
        });
      }, 7660: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.mode.OFB = function() {
            var e3 = t3.lib.BlockCipherMode.extend();
            var r3 = e3.Encryptor = e3.extend({ processBlock: function(t4, e4) {
              var r4 = this._cipher;
              var i2 = r4.blockSize;
              var n = this._iv;
              var s = this._keystream;
              if (n) {
                s = this._keystream = n.slice(0);
                this._iv = void 0;
              }
              r4.encryptBlock(s, 0);
              for (var a = 0; a < i2; a++)
                t4[e4 + a] ^= s[a];
            } });
            e3.Decryptor = r3;
            return e3;
          }();
          return t3.mode.OFB;
        });
      }, 3615: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.pad.AnsiX923 = { pad: function(t4, e3) {
            var r3 = t4.sigBytes;
            var i2 = 4 * e3;
            var n = i2 - r3 % i2;
            var s = r3 + n - 1;
            t4.clamp();
            t4.words[s >>> 2] |= n << 24 - s % 4 * 8;
            t4.sigBytes += n;
          }, unpad: function(t4) {
            var e3 = 255 & t4.words[t4.sigBytes - 1 >>> 2];
            t4.sigBytes -= e3;
          } };
          return t3.pad.Ansix923;
        });
      }, 2807: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.pad.Iso10126 = { pad: function(e3, r3) {
            var i2 = 4 * r3;
            var n = i2 - e3.sigBytes % i2;
            e3.concat(t3.lib.WordArray.random(n - 1)).concat(t3.lib.WordArray.create([n << 24], 1));
          }, unpad: function(t4) {
            var e3 = 255 & t4.words[t4.sigBytes - 1 >>> 2];
            t4.sigBytes -= e3;
          } };
          return t3.pad.Iso10126;
        });
      }, 1077: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.pad.Iso97971 = { pad: function(e3, r3) {
            e3.concat(t3.lib.WordArray.create([2147483648], 1));
            t3.pad.ZeroPadding.pad(e3, r3);
          }, unpad: function(e3) {
            t3.pad.ZeroPadding.unpad(e3);
            e3.sigBytes--;
          } };
          return t3.pad.Iso97971;
        });
      }, 6991: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.pad.NoPadding = { pad: function() {
          }, unpad: function() {
          } };
          return t3.pad.NoPadding;
        });
      }, 6475: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(5109));
        })(this, function(t3) {
          t3.pad.ZeroPadding = { pad: function(t4, e3) {
            var r3 = 4 * e3;
            t4.clamp();
            t4.sigBytes += r3 - (t4.sigBytes % r3 || r3);
          }, unpad: function(t4) {
            var e3 = t4.words;
            var r3 = t4.sigBytes - 1;
            for (var r3 = t4.sigBytes - 1; r3 >= 0; r3--)
              if (e3[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255) {
                t4.sigBytes = r3 + 1;
                break;
              }
          } };
          return t3.pad.ZeroPadding;
        });
      }, 2112: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(2783), r2(9824));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.Base;
            var n = r3.WordArray;
            var s = e3.algo;
            var a = s.SHA1;
            var o = s.HMAC;
            var u = s.PBKDF2 = i2.extend({ cfg: i2.extend({ keySize: 128 / 32, hasher: a, iterations: 1 }), init: function(t4) {
              this.cfg = this.cfg.extend(t4);
            }, compute: function(t4, e4) {
              var r4 = this.cfg;
              var i3 = o.create(r4.hasher, t4);
              var s2 = n.create();
              var a2 = n.create([1]);
              var u2 = s2.words;
              var c = a2.words;
              var l = r4.keySize;
              var f = r4.iterations;
              while (u2.length < l) {
                var h = i3.update(e4).finalize(a2);
                i3.reset();
                var d = h.words;
                var v = d.length;
                var p = h;
                for (var g = 1; g < f; g++) {
                  p = i3.finalize(p);
                  i3.reset();
                  var y = p.words;
                  for (var m = 0; m < v; m++)
                    d[m] ^= y[m];
                }
                s2.concat(h);
                c[0]++;
              }
              s2.sigBytes = 4 * l;
              return s2;
            } });
            e3.PBKDF2 = function(t4, e4, r4) {
              return u.create(r4).compute(t4, e4);
            };
          })();
          return t3.PBKDF2;
        });
      }, 3974: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(8269), r2(8214), r2(888), r2(5109));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.StreamCipher;
            var n = e3.algo;
            var s = [];
            var a = [];
            var o = [];
            var u = n.RabbitLegacy = i2.extend({ _doReset: function() {
              var t4 = this._key.words;
              var e4 = this.cfg.iv;
              var r4 = this._X = [t4[0], t4[3] << 16 | t4[2] >>> 16, t4[1], t4[0] << 16 | t4[3] >>> 16, t4[2], t4[1] << 16 | t4[0] >>> 16, t4[3], t4[2] << 16 | t4[1] >>> 16];
              var i3 = this._C = [t4[2] << 16 | t4[2] >>> 16, 4294901760 & t4[0] | 65535 & t4[1], t4[3] << 16 | t4[3] >>> 16, 4294901760 & t4[1] | 65535 & t4[2], t4[0] << 16 | t4[0] >>> 16, 4294901760 & t4[2] | 65535 & t4[3], t4[1] << 16 | t4[1] >>> 16, 4294901760 & t4[3] | 65535 & t4[0]];
              this._b = 0;
              for (var n2 = 0; n2 < 4; n2++)
                c.call(this);
              for (var n2 = 0; n2 < 8; n2++)
                i3[n2] ^= r4[n2 + 4 & 7];
              if (e4) {
                var s2 = e4.words;
                var a2 = s2[0];
                var o2 = s2[1];
                var u2 = 16711935 & (a2 << 8 | a2 >>> 24) | 4278255360 & (a2 << 24 | a2 >>> 8);
                var l = 16711935 & (o2 << 8 | o2 >>> 24) | 4278255360 & (o2 << 24 | o2 >>> 8);
                var f = u2 >>> 16 | 4294901760 & l;
                var h = l << 16 | 65535 & u2;
                i3[0] ^= u2;
                i3[1] ^= f;
                i3[2] ^= l;
                i3[3] ^= h;
                i3[4] ^= u2;
                i3[5] ^= f;
                i3[6] ^= l;
                i3[7] ^= h;
                for (var n2 = 0; n2 < 4; n2++)
                  c.call(this);
              }
            }, _doProcessBlock: function(t4, e4) {
              var r4 = this._X;
              c.call(this);
              s[0] = r4[0] ^ r4[5] >>> 16 ^ r4[3] << 16;
              s[1] = r4[2] ^ r4[7] >>> 16 ^ r4[5] << 16;
              s[2] = r4[4] ^ r4[1] >>> 16 ^ r4[7] << 16;
              s[3] = r4[6] ^ r4[3] >>> 16 ^ r4[1] << 16;
              for (var i3 = 0; i3 < 4; i3++) {
                s[i3] = 16711935 & (s[i3] << 8 | s[i3] >>> 24) | 4278255360 & (s[i3] << 24 | s[i3] >>> 8);
                t4[e4 + i3] ^= s[i3];
              }
            }, blockSize: 128 / 32, ivSize: 64 / 32 });
            function c() {
              var t4 = this._X;
              var e4 = this._C;
              for (var r4 = 0; r4 < 8; r4++)
                a[r4] = e4[r4];
              e4[0] = e4[0] + 1295307597 + this._b | 0;
              e4[1] = e4[1] + 3545052371 + (e4[0] >>> 0 < a[0] >>> 0 ? 1 : 0) | 0;
              e4[2] = e4[2] + 886263092 + (e4[1] >>> 0 < a[1] >>> 0 ? 1 : 0) | 0;
              e4[3] = e4[3] + 1295307597 + (e4[2] >>> 0 < a[2] >>> 0 ? 1 : 0) | 0;
              e4[4] = e4[4] + 3545052371 + (e4[3] >>> 0 < a[3] >>> 0 ? 1 : 0) | 0;
              e4[5] = e4[5] + 886263092 + (e4[4] >>> 0 < a[4] >>> 0 ? 1 : 0) | 0;
              e4[6] = e4[6] + 1295307597 + (e4[5] >>> 0 < a[5] >>> 0 ? 1 : 0) | 0;
              e4[7] = e4[7] + 3545052371 + (e4[6] >>> 0 < a[6] >>> 0 ? 1 : 0) | 0;
              this._b = e4[7] >>> 0 < a[7] >>> 0 ? 1 : 0;
              for (var r4 = 0; r4 < 8; r4++) {
                var i3 = t4[r4] + e4[r4];
                var n2 = 65535 & i3;
                var s2 = i3 >>> 16;
                var u2 = ((n2 * n2 >>> 17) + n2 * s2 >>> 15) + s2 * s2;
                var c2 = ((4294901760 & i3) * i3 | 0) + ((65535 & i3) * i3 | 0);
                o[r4] = u2 ^ c2;
              }
              t4[0] = o[0] + (o[7] << 16 | o[7] >>> 16) + (o[6] << 16 | o[6] >>> 16) | 0;
              t4[1] = o[1] + (o[0] << 8 | o[0] >>> 24) + o[7] | 0;
              t4[2] = o[2] + (o[1] << 16 | o[1] >>> 16) + (o[0] << 16 | o[0] >>> 16) | 0;
              t4[3] = o[3] + (o[2] << 8 | o[2] >>> 24) + o[1] | 0;
              t4[4] = o[4] + (o[3] << 16 | o[3] >>> 16) + (o[2] << 16 | o[2] >>> 16) | 0;
              t4[5] = o[5] + (o[4] << 8 | o[4] >>> 24) + o[3] | 0;
              t4[6] = o[6] + (o[5] << 16 | o[5] >>> 16) + (o[4] << 16 | o[4] >>> 16) | 0;
              t4[7] = o[7] + (o[6] << 8 | o[6] >>> 24) + o[5] | 0;
            }
            e3.RabbitLegacy = i2._createHelper(u);
          })();
          return t3.RabbitLegacy;
        });
      }, 4454: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(8269), r2(8214), r2(888), r2(5109));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.StreamCipher;
            var n = e3.algo;
            var s = [];
            var a = [];
            var o = [];
            var u = n.Rabbit = i2.extend({ _doReset: function() {
              var t4 = this._key.words;
              var e4 = this.cfg.iv;
              for (var r4 = 0; r4 < 4; r4++)
                t4[r4] = 16711935 & (t4[r4] << 8 | t4[r4] >>> 24) | 4278255360 & (t4[r4] << 24 | t4[r4] >>> 8);
              var i3 = this._X = [t4[0], t4[3] << 16 | t4[2] >>> 16, t4[1], t4[0] << 16 | t4[3] >>> 16, t4[2], t4[1] << 16 | t4[0] >>> 16, t4[3], t4[2] << 16 | t4[1] >>> 16];
              var n2 = this._C = [t4[2] << 16 | t4[2] >>> 16, 4294901760 & t4[0] | 65535 & t4[1], t4[3] << 16 | t4[3] >>> 16, 4294901760 & t4[1] | 65535 & t4[2], t4[0] << 16 | t4[0] >>> 16, 4294901760 & t4[2] | 65535 & t4[3], t4[1] << 16 | t4[1] >>> 16, 4294901760 & t4[3] | 65535 & t4[0]];
              this._b = 0;
              for (var r4 = 0; r4 < 4; r4++)
                c.call(this);
              for (var r4 = 0; r4 < 8; r4++)
                n2[r4] ^= i3[r4 + 4 & 7];
              if (e4) {
                var s2 = e4.words;
                var a2 = s2[0];
                var o2 = s2[1];
                var u2 = 16711935 & (a2 << 8 | a2 >>> 24) | 4278255360 & (a2 << 24 | a2 >>> 8);
                var l = 16711935 & (o2 << 8 | o2 >>> 24) | 4278255360 & (o2 << 24 | o2 >>> 8);
                var f = u2 >>> 16 | 4294901760 & l;
                var h = l << 16 | 65535 & u2;
                n2[0] ^= u2;
                n2[1] ^= f;
                n2[2] ^= l;
                n2[3] ^= h;
                n2[4] ^= u2;
                n2[5] ^= f;
                n2[6] ^= l;
                n2[7] ^= h;
                for (var r4 = 0; r4 < 4; r4++)
                  c.call(this);
              }
            }, _doProcessBlock: function(t4, e4) {
              var r4 = this._X;
              c.call(this);
              s[0] = r4[0] ^ r4[5] >>> 16 ^ r4[3] << 16;
              s[1] = r4[2] ^ r4[7] >>> 16 ^ r4[5] << 16;
              s[2] = r4[4] ^ r4[1] >>> 16 ^ r4[7] << 16;
              s[3] = r4[6] ^ r4[3] >>> 16 ^ r4[1] << 16;
              for (var i3 = 0; i3 < 4; i3++) {
                s[i3] = 16711935 & (s[i3] << 8 | s[i3] >>> 24) | 4278255360 & (s[i3] << 24 | s[i3] >>> 8);
                t4[e4 + i3] ^= s[i3];
              }
            }, blockSize: 128 / 32, ivSize: 64 / 32 });
            function c() {
              var t4 = this._X;
              var e4 = this._C;
              for (var r4 = 0; r4 < 8; r4++)
                a[r4] = e4[r4];
              e4[0] = e4[0] + 1295307597 + this._b | 0;
              e4[1] = e4[1] + 3545052371 + (e4[0] >>> 0 < a[0] >>> 0 ? 1 : 0) | 0;
              e4[2] = e4[2] + 886263092 + (e4[1] >>> 0 < a[1] >>> 0 ? 1 : 0) | 0;
              e4[3] = e4[3] + 1295307597 + (e4[2] >>> 0 < a[2] >>> 0 ? 1 : 0) | 0;
              e4[4] = e4[4] + 3545052371 + (e4[3] >>> 0 < a[3] >>> 0 ? 1 : 0) | 0;
              e4[5] = e4[5] + 886263092 + (e4[4] >>> 0 < a[4] >>> 0 ? 1 : 0) | 0;
              e4[6] = e4[6] + 1295307597 + (e4[5] >>> 0 < a[5] >>> 0 ? 1 : 0) | 0;
              e4[7] = e4[7] + 3545052371 + (e4[6] >>> 0 < a[6] >>> 0 ? 1 : 0) | 0;
              this._b = e4[7] >>> 0 < a[7] >>> 0 ? 1 : 0;
              for (var r4 = 0; r4 < 8; r4++) {
                var i3 = t4[r4] + e4[r4];
                var n2 = 65535 & i3;
                var s2 = i3 >>> 16;
                var u2 = ((n2 * n2 >>> 17) + n2 * s2 >>> 15) + s2 * s2;
                var c2 = ((4294901760 & i3) * i3 | 0) + ((65535 & i3) * i3 | 0);
                o[r4] = u2 ^ c2;
              }
              t4[0] = o[0] + (o[7] << 16 | o[7] >>> 16) + (o[6] << 16 | o[6] >>> 16) | 0;
              t4[1] = o[1] + (o[0] << 8 | o[0] >>> 24) + o[7] | 0;
              t4[2] = o[2] + (o[1] << 16 | o[1] >>> 16) + (o[0] << 16 | o[0] >>> 16) | 0;
              t4[3] = o[3] + (o[2] << 8 | o[2] >>> 24) + o[1] | 0;
              t4[4] = o[4] + (o[3] << 16 | o[3] >>> 16) + (o[2] << 16 | o[2] >>> 16) | 0;
              t4[5] = o[5] + (o[4] << 8 | o[4] >>> 24) + o[3] | 0;
              t4[6] = o[6] + (o[5] << 16 | o[5] >>> 16) + (o[4] << 16 | o[4] >>> 16) | 0;
              t4[7] = o[7] + (o[6] << 8 | o[6] >>> 24) + o[5] | 0;
            }
            e3.Rabbit = i2._createHelper(u);
          })();
          return t3.Rabbit;
        });
      }, 1857: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(8269), r2(8214), r2(888), r2(5109));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.StreamCipher;
            var n = e3.algo;
            var s = n.RC4 = i2.extend({ _doReset: function() {
              var t4 = this._key;
              var e4 = t4.words;
              var r4 = t4.sigBytes;
              var i3 = this._S = [];
              for (var n2 = 0; n2 < 256; n2++)
                i3[n2] = n2;
              for (var n2 = 0, s2 = 0; n2 < 256; n2++) {
                var a2 = n2 % r4;
                var o2 = e4[a2 >>> 2] >>> 24 - a2 % 4 * 8 & 255;
                s2 = (s2 + i3[n2] + o2) % 256;
                var u = i3[n2];
                i3[n2] = i3[s2];
                i3[s2] = u;
              }
              this._i = this._j = 0;
            }, _doProcessBlock: function(t4, e4) {
              t4[e4] ^= a.call(this);
            }, keySize: 256 / 32, ivSize: 0 });
            function a() {
              var t4 = this._S;
              var e4 = this._i;
              var r4 = this._j;
              var i3 = 0;
              for (var n2 = 0; n2 < 4; n2++) {
                e4 = (e4 + 1) % 256;
                r4 = (r4 + t4[e4]) % 256;
                var s2 = t4[e4];
                t4[e4] = t4[r4];
                t4[r4] = s2;
                i3 |= t4[(t4[e4] + t4[r4]) % 256] << 24 - 8 * n2;
              }
              this._i = e4;
              this._j = r4;
              return i3;
            }
            e3.RC4 = i2._createHelper(s);
            var o = n.RC4Drop = s.extend({ cfg: s.cfg.extend({ drop: 192 }), _doReset: function() {
              s._doReset.call(this);
              for (var t4 = this.cfg.drop; t4 > 0; t4--)
                a.call(this);
            } });
            e3.RC4Drop = i2._createHelper(o);
          })();
          return t3.RC4;
        });
      }, 706: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function(e3) {
            var r3 = t3;
            var i2 = r3.lib;
            var n = i2.WordArray;
            var s = i2.Hasher;
            var a = r3.algo;
            var o = n.create([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13]);
            var u = n.create([5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11]);
            var c = n.create([11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6]);
            var l = n.create([8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11]);
            var f = n.create([0, 1518500249, 1859775393, 2400959708, 2840853838]);
            var h = n.create([1352829926, 1548603684, 1836072691, 2053994217, 0]);
            var d = a.RIPEMD160 = s.extend({ _doReset: function() {
              this._hash = n.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
            }, _doProcessBlock: function(t4, e4) {
              for (var r4 = 0; r4 < 16; r4++) {
                var i3 = e4 + r4;
                var n2 = t4[i3];
                t4[i3] = 16711935 & (n2 << 8 | n2 >>> 24) | 4278255360 & (n2 << 24 | n2 >>> 8);
              }
              var s2 = this._hash.words;
              var a2 = f.words;
              var d2 = h.words;
              var _ = o.words;
              var S = u.words;
              var b = c.words;
              var E = l.words;
              var D, T, M, I, A;
              var x, R, B, O, k;
              x = D = s2[0];
              R = T = s2[1];
              B = M = s2[2];
              O = I = s2[3];
              k = A = s2[4];
              var C;
              for (var r4 = 0; r4 < 80; r4 += 1) {
                C = D + t4[e4 + _[r4]] | 0;
                if (r4 < 16)
                  C += v(T, M, I) + a2[0];
                else if (r4 < 32)
                  C += p(T, M, I) + a2[1];
                else if (r4 < 48)
                  C += g(T, M, I) + a2[2];
                else if (r4 < 64)
                  C += y(T, M, I) + a2[3];
                else
                  C += m(T, M, I) + a2[4];
                C |= 0;
                C = w(C, b[r4]);
                C = C + A | 0;
                D = A;
                A = I;
                I = w(M, 10);
                M = T;
                T = C;
                C = x + t4[e4 + S[r4]] | 0;
                if (r4 < 16)
                  C += m(R, B, O) + d2[0];
                else if (r4 < 32)
                  C += y(R, B, O) + d2[1];
                else if (r4 < 48)
                  C += g(R, B, O) + d2[2];
                else if (r4 < 64)
                  C += p(R, B, O) + d2[3];
                else
                  C += v(R, B, O) + d2[4];
                C |= 0;
                C = w(C, E[r4]);
                C = C + k | 0;
                x = k;
                k = O;
                O = w(B, 10);
                B = R;
                R = C;
              }
              C = s2[1] + M + O | 0;
              s2[1] = s2[2] + I + k | 0;
              s2[2] = s2[3] + A + x | 0;
              s2[3] = s2[4] + D + R | 0;
              s2[4] = s2[0] + T + B | 0;
              s2[0] = C;
            }, _doFinalize: function() {
              var t4 = this._data;
              var e4 = t4.words;
              var r4 = 8 * this._nDataBytes;
              var i3 = 8 * t4.sigBytes;
              e4[i3 >>> 5] |= 128 << 24 - i3 % 32;
              e4[(i3 + 64 >>> 9 << 4) + 14] = 16711935 & (r4 << 8 | r4 >>> 24) | 4278255360 & (r4 << 24 | r4 >>> 8);
              t4.sigBytes = 4 * (e4.length + 1);
              this._process();
              var n2 = this._hash;
              var s2 = n2.words;
              for (var a2 = 0; a2 < 5; a2++) {
                var o2 = s2[a2];
                s2[a2] = 16711935 & (o2 << 8 | o2 >>> 24) | 4278255360 & (o2 << 24 | o2 >>> 8);
              }
              return n2;
            }, clone: function() {
              var t4 = s.clone.call(this);
              t4._hash = this._hash.clone();
              return t4;
            } });
            function v(t4, e4, r4) {
              return t4 ^ e4 ^ r4;
            }
            function p(t4, e4, r4) {
              return t4 & e4 | ~t4 & r4;
            }
            function g(t4, e4, r4) {
              return (t4 | ~e4) ^ r4;
            }
            function y(t4, e4, r4) {
              return t4 & r4 | e4 & ~r4;
            }
            function m(t4, e4, r4) {
              return t4 ^ (e4 | ~r4);
            }
            function w(t4, e4) {
              return t4 << e4 | t4 >>> 32 - e4;
            }
            r3.RIPEMD160 = s._createHelper(d);
            r3.HmacRIPEMD160 = s._createHmacHelper(d);
          })();
          return t3.RIPEMD160;
        });
      }, 2783: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.WordArray;
            var n = r3.Hasher;
            var s = e3.algo;
            var a = [];
            var o = s.SHA1 = n.extend({ _doReset: function() {
              this._hash = new i2.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
            }, _doProcessBlock: function(t4, e4) {
              var r4 = this._hash.words;
              var i3 = r4[0];
              var n2 = r4[1];
              var s2 = r4[2];
              var o2 = r4[3];
              var u = r4[4];
              for (var c = 0; c < 80; c++) {
                if (c < 16)
                  a[c] = 0 | t4[e4 + c];
                else {
                  var l = a[c - 3] ^ a[c - 8] ^ a[c - 14] ^ a[c - 16];
                  a[c] = l << 1 | l >>> 31;
                }
                var f = (i3 << 5 | i3 >>> 27) + u + a[c];
                if (c < 20)
                  f += (n2 & s2 | ~n2 & o2) + 1518500249;
                else if (c < 40)
                  f += (n2 ^ s2 ^ o2) + 1859775393;
                else if (c < 60)
                  f += (n2 & s2 | n2 & o2 | s2 & o2) - 1894007588;
                else
                  f += (n2 ^ s2 ^ o2) - 899497514;
                u = o2;
                o2 = s2;
                s2 = n2 << 30 | n2 >>> 2;
                n2 = i3;
                i3 = f;
              }
              r4[0] = r4[0] + i3 | 0;
              r4[1] = r4[1] + n2 | 0;
              r4[2] = r4[2] + s2 | 0;
              r4[3] = r4[3] + o2 | 0;
              r4[4] = r4[4] + u | 0;
            }, _doFinalize: function() {
              var t4 = this._data;
              var e4 = t4.words;
              var r4 = 8 * this._nDataBytes;
              var i3 = 8 * t4.sigBytes;
              e4[i3 >>> 5] |= 128 << 24 - i3 % 32;
              e4[(i3 + 64 >>> 9 << 4) + 14] = Math.floor(r4 / 4294967296);
              e4[(i3 + 64 >>> 9 << 4) + 15] = r4;
              t4.sigBytes = 4 * e4.length;
              this._process();
              return this._hash;
            }, clone: function() {
              var t4 = n.clone.call(this);
              t4._hash = this._hash.clone();
              return t4;
            } });
            e3.SHA1 = n._createHelper(o);
            e3.HmacSHA1 = n._createHmacHelper(o);
          })();
          return t3.SHA1;
        });
      }, 7792: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(2153));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.WordArray;
            var n = e3.algo;
            var s = n.SHA256;
            var a = n.SHA224 = s.extend({ _doReset: function() {
              this._hash = new i2.init([3238371032, 914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839, 3204075428]);
            }, _doFinalize: function() {
              var t4 = s._doFinalize.call(this);
              t4.sigBytes -= 4;
              return t4;
            } });
            e3.SHA224 = s._createHelper(a);
            e3.HmacSHA224 = s._createHmacHelper(a);
          })();
          return t3.SHA224;
        });
      }, 2153: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function(e3) {
            var r3 = t3;
            var i2 = r3.lib;
            var n = i2.WordArray;
            var s = i2.Hasher;
            var a = r3.algo;
            var o = [];
            var u = [];
            (function() {
              function t4(t5) {
                var r5 = e3.sqrt(t5);
                for (var i4 = 2; i4 <= r5; i4++)
                  if (!(t5 % i4))
                    return false;
                return true;
              }
              function r4(t5) {
                return 4294967296 * (t5 - (0 | t5)) | 0;
              }
              var i3 = 2;
              var n2 = 0;
              while (n2 < 64) {
                if (t4(i3)) {
                  if (n2 < 8)
                    o[n2] = r4(e3.pow(i3, 1 / 2));
                  u[n2] = r4(e3.pow(i3, 1 / 3));
                  n2++;
                }
                i3++;
              }
            })();
            var c = [];
            var l = a.SHA256 = s.extend({ _doReset: function() {
              this._hash = new n.init(o.slice(0));
            }, _doProcessBlock: function(t4, e4) {
              var r4 = this._hash.words;
              var i3 = r4[0];
              var n2 = r4[1];
              var s2 = r4[2];
              var a2 = r4[3];
              var o2 = r4[4];
              var l2 = r4[5];
              var f = r4[6];
              var h = r4[7];
              for (var d = 0; d < 64; d++) {
                if (d < 16)
                  c[d] = 0 | t4[e4 + d];
                else {
                  var v = c[d - 15];
                  var p = (v << 25 | v >>> 7) ^ (v << 14 | v >>> 18) ^ v >>> 3;
                  var g = c[d - 2];
                  var y = (g << 15 | g >>> 17) ^ (g << 13 | g >>> 19) ^ g >>> 10;
                  c[d] = p + c[d - 7] + y + c[d - 16];
                }
                var m = o2 & l2 ^ ~o2 & f;
                var w = i3 & n2 ^ i3 & s2 ^ n2 & s2;
                var _ = (i3 << 30 | i3 >>> 2) ^ (i3 << 19 | i3 >>> 13) ^ (i3 << 10 | i3 >>> 22);
                var S = (o2 << 26 | o2 >>> 6) ^ (o2 << 21 | o2 >>> 11) ^ (o2 << 7 | o2 >>> 25);
                var b = h + S + m + u[d] + c[d];
                var E = _ + w;
                h = f;
                f = l2;
                l2 = o2;
                o2 = a2 + b | 0;
                a2 = s2;
                s2 = n2;
                n2 = i3;
                i3 = b + E | 0;
              }
              r4[0] = r4[0] + i3 | 0;
              r4[1] = r4[1] + n2 | 0;
              r4[2] = r4[2] + s2 | 0;
              r4[3] = r4[3] + a2 | 0;
              r4[4] = r4[4] + o2 | 0;
              r4[5] = r4[5] + l2 | 0;
              r4[6] = r4[6] + f | 0;
              r4[7] = r4[7] + h | 0;
            }, _doFinalize: function() {
              var t4 = this._data;
              var r4 = t4.words;
              var i3 = 8 * this._nDataBytes;
              var n2 = 8 * t4.sigBytes;
              r4[n2 >>> 5] |= 128 << 24 - n2 % 32;
              r4[(n2 + 64 >>> 9 << 4) + 14] = e3.floor(i3 / 4294967296);
              r4[(n2 + 64 >>> 9 << 4) + 15] = i3;
              t4.sigBytes = 4 * r4.length;
              this._process();
              return this._hash;
            }, clone: function() {
              var t4 = s.clone.call(this);
              t4._hash = this._hash.clone();
              return t4;
            } });
            r3.SHA256 = s._createHelper(l);
            r3.HmacSHA256 = s._createHmacHelper(l);
          })(Math);
          return t3.SHA256;
        });
      }, 3327: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(4938));
        })(this, function(t3) {
          (function(e3) {
            var r3 = t3;
            var i2 = r3.lib;
            var n = i2.WordArray;
            var s = i2.Hasher;
            var a = r3.x64;
            var o = a.Word;
            var u = r3.algo;
            var c = [];
            var l = [];
            var f = [];
            (function() {
              var t4 = 1, e4 = 0;
              for (var r4 = 0; r4 < 24; r4++) {
                c[t4 + 5 * e4] = (r4 + 1) * (r4 + 2) / 2 % 64;
                var i3 = e4 % 5;
                var n2 = (2 * t4 + 3 * e4) % 5;
                t4 = i3;
                e4 = n2;
              }
              for (var t4 = 0; t4 < 5; t4++)
                for (var e4 = 0; e4 < 5; e4++)
                  l[t4 + 5 * e4] = e4 + (2 * t4 + 3 * e4) % 5 * 5;
              var s2 = 1;
              for (var a2 = 0; a2 < 24; a2++) {
                var u2 = 0;
                var h2 = 0;
                for (var d2 = 0; d2 < 7; d2++) {
                  if (1 & s2) {
                    var v = (1 << d2) - 1;
                    if (v < 32)
                      h2 ^= 1 << v;
                    else
                      u2 ^= 1 << v - 32;
                  }
                  if (128 & s2)
                    s2 = s2 << 1 ^ 113;
                  else
                    s2 <<= 1;
                }
                f[a2] = o.create(u2, h2);
              }
            })();
            var h = [];
            (function() {
              for (var t4 = 0; t4 < 25; t4++)
                h[t4] = o.create();
            })();
            var d = u.SHA3 = s.extend({ cfg: s.cfg.extend({ outputLength: 512 }), _doReset: function() {
              var t4 = this._state = [];
              for (var e4 = 0; e4 < 25; e4++)
                t4[e4] = new o.init();
              this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
            }, _doProcessBlock: function(t4, e4) {
              var r4 = this._state;
              var i3 = this.blockSize / 2;
              for (var n2 = 0; n2 < i3; n2++) {
                var s2 = t4[e4 + 2 * n2];
                var a2 = t4[e4 + 2 * n2 + 1];
                s2 = 16711935 & (s2 << 8 | s2 >>> 24) | 4278255360 & (s2 << 24 | s2 >>> 8);
                a2 = 16711935 & (a2 << 8 | a2 >>> 24) | 4278255360 & (a2 << 24 | a2 >>> 8);
                var o2 = r4[n2];
                o2.high ^= a2;
                o2.low ^= s2;
              }
              for (var u2 = 0; u2 < 24; u2++) {
                for (var d2 = 0; d2 < 5; d2++) {
                  var v = 0, p = 0;
                  for (var g = 0; g < 5; g++) {
                    var o2 = r4[d2 + 5 * g];
                    v ^= o2.high;
                    p ^= o2.low;
                  }
                  var y = h[d2];
                  y.high = v;
                  y.low = p;
                }
                for (var d2 = 0; d2 < 5; d2++) {
                  var m = h[(d2 + 4) % 5];
                  var w = h[(d2 + 1) % 5];
                  var _ = w.high;
                  var S = w.low;
                  var v = m.high ^ (_ << 1 | S >>> 31);
                  var p = m.low ^ (S << 1 | _ >>> 31);
                  for (var g = 0; g < 5; g++) {
                    var o2 = r4[d2 + 5 * g];
                    o2.high ^= v;
                    o2.low ^= p;
                  }
                }
                for (var b = 1; b < 25; b++) {
                  var v;
                  var p;
                  var o2 = r4[b];
                  var E = o2.high;
                  var D = o2.low;
                  var T = c[b];
                  if (T < 32) {
                    v = E << T | D >>> 32 - T;
                    p = D << T | E >>> 32 - T;
                  } else {
                    v = D << T - 32 | E >>> 64 - T;
                    p = E << T - 32 | D >>> 64 - T;
                  }
                  var M = h[l[b]];
                  M.high = v;
                  M.low = p;
                }
                var I = h[0];
                var A = r4[0];
                I.high = A.high;
                I.low = A.low;
                for (var d2 = 0; d2 < 5; d2++)
                  for (var g = 0; g < 5; g++) {
                    var b = d2 + 5 * g;
                    var o2 = r4[b];
                    var x = h[b];
                    var R = h[(d2 + 1) % 5 + 5 * g];
                    var B = h[(d2 + 2) % 5 + 5 * g];
                    o2.high = x.high ^ ~R.high & B.high;
                    o2.low = x.low ^ ~R.low & B.low;
                  }
                var o2 = r4[0];
                var O = f[u2];
                o2.high ^= O.high;
                o2.low ^= O.low;
              }
            }, _doFinalize: function() {
              var t4 = this._data;
              var r4 = t4.words;
              8 * this._nDataBytes;
              var s2 = 8 * t4.sigBytes;
              var a2 = 32 * this.blockSize;
              r4[s2 >>> 5] |= 1 << 24 - s2 % 32;
              r4[(e3.ceil((s2 + 1) / a2) * a2 >>> 5) - 1] |= 128;
              t4.sigBytes = 4 * r4.length;
              this._process();
              var o2 = this._state;
              var u2 = this.cfg.outputLength / 8;
              var c2 = u2 / 8;
              var l2 = [];
              for (var f2 = 0; f2 < c2; f2++) {
                var h2 = o2[f2];
                var d2 = h2.high;
                var v = h2.low;
                d2 = 16711935 & (d2 << 8 | d2 >>> 24) | 4278255360 & (d2 << 24 | d2 >>> 8);
                v = 16711935 & (v << 8 | v >>> 24) | 4278255360 & (v << 24 | v >>> 8);
                l2.push(v);
                l2.push(d2);
              }
              return new n.init(l2, u2);
            }, clone: function() {
              var t4 = s.clone.call(this);
              var e4 = t4._state = this._state.slice(0);
              for (var r4 = 0; r4 < 25; r4++)
                e4[r4] = e4[r4].clone();
              return t4;
            } });
            r3.SHA3 = s._createHelper(d);
            r3.HmacSHA3 = s._createHmacHelper(d);
          })(Math);
          return t3.SHA3;
        });
      }, 7460: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(4938), r2(34));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.x64;
            var i2 = r3.Word;
            var n = r3.WordArray;
            var s = e3.algo;
            var a = s.SHA512;
            var o = s.SHA384 = a.extend({ _doReset: function() {
              this._hash = new n.init([new i2.init(3418070365, 3238371032), new i2.init(1654270250, 914150663), new i2.init(2438529370, 812702999), new i2.init(355462360, 4144912697), new i2.init(1731405415, 4290775857), new i2.init(2394180231, 1750603025), new i2.init(3675008525, 1694076839), new i2.init(1203062813, 3204075428)]);
            }, _doFinalize: function() {
              var t4 = a._doFinalize.call(this);
              t4.sigBytes -= 16;
              return t4;
            } });
            e3.SHA384 = a._createHelper(o);
            e3.HmacSHA384 = a._createHmacHelper(o);
          })();
          return t3.SHA384;
        });
      }, 34: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(4938));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.Hasher;
            var n = e3.x64;
            var s = n.Word;
            var a = n.WordArray;
            var o = e3.algo;
            function u() {
              return s.create.apply(s, arguments);
            }
            var c = [u(1116352408, 3609767458), u(1899447441, 602891725), u(3049323471, 3964484399), u(3921009573, 2173295548), u(961987163, 4081628472), u(1508970993, 3053834265), u(2453635748, 2937671579), u(2870763221, 3664609560), u(3624381080, 2734883394), u(310598401, 1164996542), u(607225278, 1323610764), u(1426881987, 3590304994), u(1925078388, 4068182383), u(2162078206, 991336113), u(2614888103, 633803317), u(3248222580, 3479774868), u(3835390401, 2666613458), u(4022224774, 944711139), u(264347078, 2341262773), u(604807628, 2007800933), u(770255983, 1495990901), u(1249150122, 1856431235), u(1555081692, 3175218132), u(1996064986, 2198950837), u(2554220882, 3999719339), u(2821834349, 766784016), u(2952996808, 2566594879), u(3210313671, 3203337956), u(3336571891, 1034457026), u(3584528711, 2466948901), u(113926993, 3758326383), u(338241895, 168717936), u(666307205, 1188179964), u(773529912, 1546045734), u(1294757372, 1522805485), u(1396182291, 2643833823), u(1695183700, 2343527390), u(1986661051, 1014477480), u(2177026350, 1206759142), u(2456956037, 344077627), u(2730485921, 1290863460), u(2820302411, 3158454273), u(3259730800, 3505952657), u(3345764771, 106217008), u(3516065817, 3606008344), u(3600352804, 1432725776), u(4094571909, 1467031594), u(275423344, 851169720), u(430227734, 3100823752), u(506948616, 1363258195), u(659060556, 3750685593), u(883997877, 3785050280), u(958139571, 3318307427), u(1322822218, 3812723403), u(1537002063, 2003034995), u(1747873779, 3602036899), u(1955562222, 1575990012), u(2024104815, 1125592928), u(2227730452, 2716904306), u(2361852424, 442776044), u(2428436474, 593698344), u(2756734187, 3733110249), u(3204031479, 2999351573), u(3329325298, 3815920427), u(3391569614, 3928383900), u(3515267271, 566280711), u(3940187606, 3454069534), u(4118630271, 4000239992), u(116418474, 1914138554), u(174292421, 2731055270), u(289380356, 3203993006), u(460393269, 320620315), u(685471733, 587496836), u(852142971, 1086792851), u(1017036298, 365543100), u(1126000580, 2618297676), u(1288033470, 3409855158), u(1501505948, 4234509866), u(1607167915, 987167468), u(1816402316, 1246189591)];
            var l = [];
            (function() {
              for (var t4 = 0; t4 < 80; t4++)
                l[t4] = u();
            })();
            var f = o.SHA512 = i2.extend({ _doReset: function() {
              this._hash = new a.init([new s.init(1779033703, 4089235720), new s.init(3144134277, 2227873595), new s.init(1013904242, 4271175723), new s.init(2773480762, 1595750129), new s.init(1359893119, 2917565137), new s.init(2600822924, 725511199), new s.init(528734635, 4215389547), new s.init(1541459225, 327033209)]);
            }, _doProcessBlock: function(t4, e4) {
              var r4 = this._hash.words;
              var i3 = r4[0];
              var n2 = r4[1];
              var s2 = r4[2];
              var a2 = r4[3];
              var o2 = r4[4];
              var u2 = r4[5];
              var f2 = r4[6];
              var h = r4[7];
              var d = i3.high;
              var v = i3.low;
              var p = n2.high;
              var g = n2.low;
              var y = s2.high;
              var m = s2.low;
              var w = a2.high;
              var _ = a2.low;
              var S = o2.high;
              var b = o2.low;
              var E = u2.high;
              var D = u2.low;
              var T = f2.high;
              var M = f2.low;
              var I = h.high;
              var A = h.low;
              var x = d;
              var R = v;
              var B = p;
              var O = g;
              var k = y;
              var C = m;
              var N = w;
              var P = _;
              var V = S;
              var L = b;
              var H = E;
              var U = D;
              var K = T;
              var j = M;
              var q = I;
              var F = A;
              for (var z = 0; z < 80; z++) {
                var G;
                var Y;
                var W = l[z];
                if (z < 16) {
                  Y = W.high = 0 | t4[e4 + 2 * z];
                  G = W.low = 0 | t4[e4 + 2 * z + 1];
                } else {
                  var J = l[z - 15];
                  var Z = J.high;
                  var $ = J.low;
                  var X = (Z >>> 1 | $ << 31) ^ (Z >>> 8 | $ << 24) ^ Z >>> 7;
                  var Q = ($ >>> 1 | Z << 31) ^ ($ >>> 8 | Z << 24) ^ ($ >>> 7 | Z << 25);
                  var tt2 = l[z - 2];
                  var et = tt2.high;
                  var rt = tt2.low;
                  var it = (et >>> 19 | rt << 13) ^ (et << 3 | rt >>> 29) ^ et >>> 6;
                  var nt = (rt >>> 19 | et << 13) ^ (rt << 3 | et >>> 29) ^ (rt >>> 6 | et << 26);
                  var st = l[z - 7];
                  var at = st.high;
                  var ot = st.low;
                  var ut = l[z - 16];
                  var ct = ut.high;
                  var lt = ut.low;
                  G = Q + ot;
                  Y = X + at + (G >>> 0 < Q >>> 0 ? 1 : 0);
                  G += nt;
                  Y = Y + it + (G >>> 0 < nt >>> 0 ? 1 : 0);
                  G += lt;
                  Y = Y + ct + (G >>> 0 < lt >>> 0 ? 1 : 0);
                  W.high = Y;
                  W.low = G;
                }
                var ft = V & H ^ ~V & K;
                var ht = L & U ^ ~L & j;
                var dt = x & B ^ x & k ^ B & k;
                var vt = R & O ^ R & C ^ O & C;
                var pt = (x >>> 28 | R << 4) ^ (x << 30 | R >>> 2) ^ (x << 25 | R >>> 7);
                var gt = (R >>> 28 | x << 4) ^ (R << 30 | x >>> 2) ^ (R << 25 | x >>> 7);
                var yt = (V >>> 14 | L << 18) ^ (V >>> 18 | L << 14) ^ (V << 23 | L >>> 9);
                var mt = (L >>> 14 | V << 18) ^ (L >>> 18 | V << 14) ^ (L << 23 | V >>> 9);
                var wt = c[z];
                var _t = wt.high;
                var St = wt.low;
                var bt = F + mt;
                var Et = q + yt + (bt >>> 0 < F >>> 0 ? 1 : 0);
                var bt = bt + ht;
                var Et = Et + ft + (bt >>> 0 < ht >>> 0 ? 1 : 0);
                var bt = bt + St;
                var Et = Et + _t + (bt >>> 0 < St >>> 0 ? 1 : 0);
                var bt = bt + G;
                var Et = Et + Y + (bt >>> 0 < G >>> 0 ? 1 : 0);
                var Dt = gt + vt;
                var Tt = pt + dt + (Dt >>> 0 < gt >>> 0 ? 1 : 0);
                q = K;
                F = j;
                K = H;
                j = U;
                H = V;
                U = L;
                L = P + bt | 0;
                V = N + Et + (L >>> 0 < P >>> 0 ? 1 : 0) | 0;
                N = k;
                P = C;
                k = B;
                C = O;
                B = x;
                O = R;
                R = bt + Dt | 0;
                x = Et + Tt + (R >>> 0 < bt >>> 0 ? 1 : 0) | 0;
              }
              v = i3.low = v + R;
              i3.high = d + x + (v >>> 0 < R >>> 0 ? 1 : 0);
              g = n2.low = g + O;
              n2.high = p + B + (g >>> 0 < O >>> 0 ? 1 : 0);
              m = s2.low = m + C;
              s2.high = y + k + (m >>> 0 < C >>> 0 ? 1 : 0);
              _ = a2.low = _ + P;
              a2.high = w + N + (_ >>> 0 < P >>> 0 ? 1 : 0);
              b = o2.low = b + L;
              o2.high = S + V + (b >>> 0 < L >>> 0 ? 1 : 0);
              D = u2.low = D + U;
              u2.high = E + H + (D >>> 0 < U >>> 0 ? 1 : 0);
              M = f2.low = M + j;
              f2.high = T + K + (M >>> 0 < j >>> 0 ? 1 : 0);
              A = h.low = A + F;
              h.high = I + q + (A >>> 0 < F >>> 0 ? 1 : 0);
            }, _doFinalize: function() {
              var t4 = this._data;
              var e4 = t4.words;
              var r4 = 8 * this._nDataBytes;
              var i3 = 8 * t4.sigBytes;
              e4[i3 >>> 5] |= 128 << 24 - i3 % 32;
              e4[(i3 + 128 >>> 10 << 5) + 30] = Math.floor(r4 / 4294967296);
              e4[(i3 + 128 >>> 10 << 5) + 31] = r4;
              t4.sigBytes = 4 * e4.length;
              this._process();
              var n2 = this._hash.toX32();
              return n2;
            }, clone: function() {
              var t4 = i2.clone.call(this);
              t4._hash = this._hash.clone();
              return t4;
            }, blockSize: 1024 / 32 });
            e3.SHA512 = i2._createHelper(f);
            e3.HmacSHA512 = i2._createHmacHelper(f);
          })();
          return t3.SHA512;
        });
      }, 4253: function(t2, e2, r2) {
        (function(i2, n, s) {
          t2.exports = n(r2(8249), r2(8269), r2(8214), r2(888), r2(5109));
        })(this, function(t3) {
          (function() {
            var e3 = t3;
            var r3 = e3.lib;
            var i2 = r3.WordArray;
            var n = r3.BlockCipher;
            var s = e3.algo;
            var a = [57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36, 63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4];
            var o = [14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32];
            var u = [1, 2, 4, 6, 8, 10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];
            var c = [{ 0: 8421888, 268435456: 32768, 536870912: 8421378, 805306368: 2, 1073741824: 512, 1342177280: 8421890, 1610612736: 8389122, 1879048192: 8388608, 2147483648: 514, 2415919104: 8389120, 2684354560: 33280, 2952790016: 8421376, 3221225472: 32770, 3489660928: 8388610, 3758096384: 0, 4026531840: 33282, 134217728: 0, 402653184: 8421890, 671088640: 33282, 939524096: 32768, 1207959552: 8421888, 1476395008: 512, 1744830464: 8421378, 2013265920: 2, 2281701376: 8389120, 2550136832: 33280, 2818572288: 8421376, 3087007744: 8389122, 3355443200: 8388610, 3623878656: 32770, 3892314112: 514, 4160749568: 8388608, 1: 32768, 268435457: 2, 536870913: 8421888, 805306369: 8388608, 1073741825: 8421378, 1342177281: 33280, 1610612737: 512, 1879048193: 8389122, 2147483649: 8421890, 2415919105: 8421376, 2684354561: 8388610, 2952790017: 33282, 3221225473: 514, 3489660929: 8389120, 3758096385: 32770, 4026531841: 0, 134217729: 8421890, 402653185: 8421376, 671088641: 8388608, 939524097: 512, 1207959553: 32768, 1476395009: 8388610, 1744830465: 2, 2013265921: 33282, 2281701377: 32770, 2550136833: 8389122, 2818572289: 514, 3087007745: 8421888, 3355443201: 8389120, 3623878657: 0, 3892314113: 33280, 4160749569: 8421378 }, { 0: 1074282512, 16777216: 16384, 33554432: 524288, 50331648: 1074266128, 67108864: 1073741840, 83886080: 1074282496, 100663296: 1073758208, 117440512: 16, 134217728: 540672, 150994944: 1073758224, 167772160: 1073741824, 184549376: 540688, 201326592: 524304, 218103808: 0, 234881024: 16400, 251658240: 1074266112, 8388608: 1073758208, 25165824: 540688, 41943040: 16, 58720256: 1073758224, 75497472: 1074282512, 92274688: 1073741824, 109051904: 524288, 125829120: 1074266128, 142606336: 524304, 159383552: 0, 176160768: 16384, 192937984: 1074266112, 209715200: 1073741840, 226492416: 540672, 243269632: 1074282496, 260046848: 16400, 268435456: 0, 285212672: 1074266128, 301989888: 1073758224, 318767104: 1074282496, 335544320: 1074266112, 352321536: 16, 369098752: 540688, 385875968: 16384, 402653184: 16400, 419430400: 524288, 436207616: 524304, 452984832: 1073741840, 469762048: 540672, 486539264: 1073758208, 503316480: 1073741824, 520093696: 1074282512, 276824064: 540688, 293601280: 524288, 310378496: 1074266112, 327155712: 16384, 343932928: 1073758208, 360710144: 1074282512, 377487360: 16, 394264576: 1073741824, 411041792: 1074282496, 427819008: 1073741840, 444596224: 1073758224, 461373440: 524304, 478150656: 0, 494927872: 16400, 511705088: 1074266128, 528482304: 540672 }, { 0: 260, 1048576: 0, 2097152: 67109120, 3145728: 65796, 4194304: 65540, 5242880: 67108868, 6291456: 67174660, 7340032: 67174400, 8388608: 67108864, 9437184: 67174656, 10485760: 65792, 11534336: 67174404, 12582912: 67109124, 13631488: 65536, 14680064: 4, 15728640: 256, 524288: 67174656, 1572864: 67174404, 2621440: 0, 3670016: 67109120, 4718592: 67108868, 5767168: 65536, 6815744: 65540, 7864320: 260, 8912896: 4, 9961472: 256, 11010048: 67174400, 12058624: 65796, 13107200: 65792, 14155776: 67109124, 15204352: 67174660, 16252928: 67108864, 16777216: 67174656, 17825792: 65540, 18874368: 65536, 19922944: 67109120, 20971520: 256, 22020096: 67174660, 23068672: 67108868, 24117248: 0, 25165824: 67109124, 26214400: 67108864, 27262976: 4, 28311552: 65792, 29360128: 67174400, 30408704: 260, 31457280: 65796, 32505856: 67174404, 17301504: 67108864, 18350080: 260, 19398656: 67174656, 20447232: 0, 21495808: 65540, 22544384: 67109120, 23592960: 256, 24641536: 67174404, 25690112: 65536, 26738688: 67174660, 27787264: 65796, 28835840: 67108868, 29884416: 67109124, 30932992: 67174400, 31981568: 4, 33030144: 65792 }, { 0: 2151682048, 65536: 2147487808, 131072: 4198464, 196608: 2151677952, 262144: 0, 327680: 4198400, 393216: 2147483712, 458752: 4194368, 524288: 2147483648, 589824: 4194304, 655360: 64, 720896: 2147487744, 786432: 2151678016, 851968: 4160, 917504: 4096, 983040: 2151682112, 32768: 2147487808, 98304: 64, 163840: 2151678016, 229376: 2147487744, 294912: 4198400, 360448: 2151682112, 425984: 0, 491520: 2151677952, 557056: 4096, 622592: 2151682048, 688128: 4194304, 753664: 4160, 819200: 2147483648, 884736: 4194368, 950272: 4198464, 1015808: 2147483712, 1048576: 4194368, 1114112: 4198400, 1179648: 2147483712, 1245184: 0, 1310720: 4160, 1376256: 2151678016, 1441792: 2151682048, 1507328: 2147487808, 1572864: 2151682112, 1638400: 2147483648, 1703936: 2151677952, 1769472: 4198464, 1835008: 2147487744, 1900544: 4194304, 1966080: 64, 2031616: 4096, 1081344: 2151677952, 1146880: 2151682112, 1212416: 0, 1277952: 4198400, 1343488: 4194368, 1409024: 2147483648, 1474560: 2147487808, 1540096: 64, 1605632: 2147483712, 1671168: 4096, 1736704: 2147487744, 1802240: 2151678016, 1867776: 4160, 1933312: 2151682048, 1998848: 4194304, 2064384: 4198464 }, { 0: 128, 4096: 17039360, 8192: 262144, 12288: 536870912, 16384: 537133184, 20480: 16777344, 24576: 553648256, 28672: 262272, 32768: 16777216, 36864: 537133056, 40960: 536871040, 45056: 553910400, 49152: 553910272, 53248: 0, 57344: 17039488, 61440: 553648128, 2048: 17039488, 6144: 553648256, 10240: 128, 14336: 17039360, 18432: 262144, 22528: 537133184, 26624: 553910272, 30720: 536870912, 34816: 537133056, 38912: 0, 43008: 553910400, 47104: 16777344, 51200: 536871040, 55296: 553648128, 59392: 16777216, 63488: 262272, 65536: 262144, 69632: 128, 73728: 536870912, 77824: 553648256, 81920: 16777344, 86016: 553910272, 90112: 537133184, 94208: 16777216, 98304: 553910400, 102400: 553648128, 106496: 17039360, 110592: 537133056, 114688: 262272, 118784: 536871040, 122880: 0, 126976: 17039488, 67584: 553648256, 71680: 16777216, 75776: 17039360, 79872: 537133184, 83968: 536870912, 88064: 17039488, 92160: 128, 96256: 553910272, 100352: 262272, 104448: 553910400, 108544: 0, 112640: 553648128, 116736: 16777344, 120832: 262144, 124928: 537133056, 129024: 536871040 }, { 0: 268435464, 256: 8192, 512: 270532608, 768: 270540808, 1024: 268443648, 1280: 2097152, 1536: 2097160, 1792: 268435456, 2048: 0, 2304: 268443656, 2560: 2105344, 2816: 8, 3072: 270532616, 3328: 2105352, 3584: 8200, 3840: 270540800, 128: 270532608, 384: 270540808, 640: 8, 896: 2097152, 1152: 2105352, 1408: 268435464, 1664: 268443648, 1920: 8200, 2176: 2097160, 2432: 8192, 2688: 268443656, 2944: 270532616, 3200: 0, 3456: 270540800, 3712: 2105344, 3968: 268435456, 4096: 268443648, 4352: 270532616, 4608: 270540808, 4864: 8200, 5120: 2097152, 5376: 268435456, 5632: 268435464, 5888: 2105344, 6144: 2105352, 6400: 0, 6656: 8, 6912: 270532608, 7168: 8192, 7424: 268443656, 7680: 270540800, 7936: 2097160, 4224: 8, 4480: 2105344, 4736: 2097152, 4992: 268435464, 5248: 268443648, 5504: 8200, 5760: 270540808, 6016: 270532608, 6272: 270540800, 6528: 270532616, 6784: 8192, 7040: 2105352, 7296: 2097160, 7552: 0, 7808: 268435456, 8064: 268443656 }, { 0: 1048576, 16: 33555457, 32: 1024, 48: 1049601, 64: 34604033, 80: 0, 96: 1, 112: 34603009, 128: 33555456, 144: 1048577, 160: 33554433, 176: 34604032, 192: 34603008, 208: 1025, 224: 1049600, 240: 33554432, 8: 34603009, 24: 0, 40: 33555457, 56: 34604032, 72: 1048576, 88: 33554433, 104: 33554432, 120: 1025, 136: 1049601, 152: 33555456, 168: 34603008, 184: 1048577, 200: 1024, 216: 34604033, 232: 1, 248: 1049600, 256: 33554432, 272: 1048576, 288: 33555457, 304: 34603009, 320: 1048577, 336: 33555456, 352: 34604032, 368: 1049601, 384: 1025, 400: 34604033, 416: 1049600, 432: 1, 448: 0, 464: 34603008, 480: 33554433, 496: 1024, 264: 1049600, 280: 33555457, 296: 34603009, 312: 1, 328: 33554432, 344: 1048576, 360: 1025, 376: 34604032, 392: 33554433, 408: 34603008, 424: 0, 440: 34604033, 456: 1049601, 472: 1024, 488: 33555456, 504: 1048577 }, { 0: 134219808, 1: 131072, 2: 134217728, 3: 32, 4: 131104, 5: 134350880, 6: 134350848, 7: 2048, 8: 134348800, 9: 134219776, 10: 133120, 11: 134348832, 12: 2080, 13: 0, 14: 134217760, 15: 133152, 2147483648: 2048, 2147483649: 134350880, 2147483650: 134219808, 2147483651: 134217728, 2147483652: 134348800, 2147483653: 133120, 2147483654: 133152, 2147483655: 32, 2147483656: 134217760, 2147483657: 2080, 2147483658: 131104, 2147483659: 134350848, 2147483660: 0, 2147483661: 134348832, 2147483662: 134219776, 2147483663: 131072, 16: 133152, 17: 134350848, 18: 32, 19: 2048, 20: 134219776, 21: 134217760, 22: 134348832, 23: 131072, 24: 0, 25: 131104, 26: 134348800, 27: 134219808, 28: 134350880, 29: 133120, 30: 2080, 31: 134217728, 2147483664: 131072, 2147483665: 2048, 2147483666: 134348832, 2147483667: 133152, 2147483668: 32, 2147483669: 134348800, 2147483670: 134217728, 2147483671: 134219808, 2147483672: 134350880, 2147483673: 134217760, 2147483674: 134219776, 2147483675: 0, 2147483676: 133120, 2147483677: 2080, 2147483678: 131104, 2147483679: 134350848 }];
            var l = [4160749569, 528482304, 33030144, 2064384, 129024, 8064, 504, 2147483679];
            var f = s.DES = n.extend({ _doReset: function() {
              var t4 = this._key;
              var e4 = t4.words;
              var r4 = [];
              for (var i3 = 0; i3 < 56; i3++) {
                var n2 = a[i3] - 1;
                r4[i3] = e4[n2 >>> 5] >>> 31 - n2 % 32 & 1;
              }
              var s2 = this._subKeys = [];
              for (var c2 = 0; c2 < 16; c2++) {
                var l2 = s2[c2] = [];
                var f2 = u[c2];
                for (var i3 = 0; i3 < 24; i3++) {
                  l2[i3 / 6 | 0] |= r4[(o[i3] - 1 + f2) % 28] << 31 - i3 % 6;
                  l2[4 + (i3 / 6 | 0)] |= r4[28 + (o[i3 + 24] - 1 + f2) % 28] << 31 - i3 % 6;
                }
                l2[0] = l2[0] << 1 | l2[0] >>> 31;
                for (var i3 = 1; i3 < 7; i3++)
                  l2[i3] = l2[i3] >>> 4 * (i3 - 1) + 3;
                l2[7] = l2[7] << 5 | l2[7] >>> 27;
              }
              var h2 = this._invSubKeys = [];
              for (var i3 = 0; i3 < 16; i3++)
                h2[i3] = s2[15 - i3];
            }, encryptBlock: function(t4, e4) {
              this._doCryptBlock(t4, e4, this._subKeys);
            }, decryptBlock: function(t4, e4) {
              this._doCryptBlock(t4, e4, this._invSubKeys);
            }, _doCryptBlock: function(t4, e4, r4) {
              this._lBlock = t4[e4];
              this._rBlock = t4[e4 + 1];
              h.call(this, 4, 252645135);
              h.call(this, 16, 65535);
              d.call(this, 2, 858993459);
              d.call(this, 8, 16711935);
              h.call(this, 1, 1431655765);
              for (var i3 = 0; i3 < 16; i3++) {
                var n2 = r4[i3];
                var s2 = this._lBlock;
                var a2 = this._rBlock;
                var o2 = 0;
                for (var u2 = 0; u2 < 8; u2++)
                  o2 |= c[u2][((a2 ^ n2[u2]) & l[u2]) >>> 0];
                this._lBlock = a2;
                this._rBlock = s2 ^ o2;
              }
              var f2 = this._lBlock;
              this._lBlock = this._rBlock;
              this._rBlock = f2;
              h.call(this, 1, 1431655765);
              d.call(this, 8, 16711935);
              d.call(this, 2, 858993459);
              h.call(this, 16, 65535);
              h.call(this, 4, 252645135);
              t4[e4] = this._lBlock;
              t4[e4 + 1] = this._rBlock;
            }, keySize: 64 / 32, ivSize: 64 / 32, blockSize: 64 / 32 });
            function h(t4, e4) {
              var r4 = (this._lBlock >>> t4 ^ this._rBlock) & e4;
              this._rBlock ^= r4;
              this._lBlock ^= r4 << t4;
            }
            function d(t4, e4) {
              var r4 = (this._rBlock >>> t4 ^ this._lBlock) & e4;
              this._lBlock ^= r4;
              this._rBlock ^= r4 << t4;
            }
            e3.DES = n._createHelper(f);
            var v = s.TripleDES = n.extend({ _doReset: function() {
              var t4 = this._key;
              var e4 = t4.words;
              if (2 !== e4.length && 4 !== e4.length && e4.length < 6)
                throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");
              var r4 = e4.slice(0, 2);
              var n2 = e4.length < 4 ? e4.slice(0, 2) : e4.slice(2, 4);
              var s2 = e4.length < 6 ? e4.slice(0, 2) : e4.slice(4, 6);
              this._des1 = f.createEncryptor(i2.create(r4));
              this._des2 = f.createEncryptor(i2.create(n2));
              this._des3 = f.createEncryptor(i2.create(s2));
            }, encryptBlock: function(t4, e4) {
              this._des1.encryptBlock(t4, e4);
              this._des2.decryptBlock(t4, e4);
              this._des3.encryptBlock(t4, e4);
            }, decryptBlock: function(t4, e4) {
              this._des3.decryptBlock(t4, e4);
              this._des2.encryptBlock(t4, e4);
              this._des1.decryptBlock(t4, e4);
            }, keySize: 192 / 32, ivSize: 64 / 32, blockSize: 64 / 32 });
            e3.TripleDES = n._createHelper(v);
          })();
          return t3.TripleDES;
        });
      }, 4938: function(t2, e2, r2) {
        (function(i2, n) {
          t2.exports = n(r2(8249));
        })(this, function(t3) {
          (function(e3) {
            var r3 = t3;
            var i2 = r3.lib;
            var n = i2.Base;
            var s = i2.WordArray;
            var a = r3.x64 = {};
            a.Word = n.extend({ init: function(t4, e4) {
              this.high = t4;
              this.low = e4;
            } });
            a.WordArray = n.extend({ init: function(t4, r4) {
              t4 = this.words = t4 || [];
              if (r4 != e3)
                this.sigBytes = r4;
              else
                this.sigBytes = 8 * t4.length;
            }, toX32: function() {
              var t4 = this.words;
              var e4 = t4.length;
              var r4 = [];
              for (var i3 = 0; i3 < e4; i3++) {
                var n2 = t4[i3];
                r4.push(n2.high);
                r4.push(n2.low);
              }
              return s.create(r4, this.sigBytes);
            }, clone: function() {
              var t4 = n.clone.call(this);
              var e4 = t4.words = this.words.slice(0);
              var r4 = e4.length;
              for (var i3 = 0; i3 < r4; i3++)
                e4[i3] = e4[i3].clone();
              return t4;
            } });
          })();
          return t3;
        });
      }, 4198: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        e2.ErrorCode = void 0;
        (function(t3) {
          t3[t3["SUCCESS"] = 0] = "SUCCESS";
          t3[t3["CLIENT_ID_NOT_FOUND"] = 1] = "CLIENT_ID_NOT_FOUND";
          t3[t3["OPERATION_TOO_OFTEN"] = 2] = "OPERATION_TOO_OFTEN";
          t3[t3["REPEAT_MESSAGE"] = 3] = "REPEAT_MESSAGE";
          t3[t3["TIME_OUT"] = 4] = "TIME_OUT";
        })(e2.ErrorCode || (e2.ErrorCode = {}));
      }, 9021: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        const n = i2(r2(6893));
        const s = i2(r2(7555));
        const a = i2(r2(6379));
        const o = i2(r2(529));
        var u;
        (function(t3) {
          function e3(t4) {
            o.default.debugMode = t4;
            o.default.info(`setDebugMode: ${t4}`);
          }
          t3.setDebugMode = e3;
          function r3(t4) {
            try {
              s.default.init(t4);
            } catch (t5) {
              o.default.error(`init error`, t5);
            }
          }
          t3.init = r3;
          function i3(t4) {
            try {
              if (!t4.url)
                throw new Error("invalid url");
              if (!t4.key || !t4.keyId)
                throw new Error("invalid key or keyId");
              a.default.socketUrl = t4.url;
              a.default.publicKeyId = t4.keyId;
              a.default.publicKey = t4.key;
            } catch (t5) {
              o.default.error(`setSocketServer error`, t5);
            }
          }
          t3.setSocketServer = i3;
          function u2(t4) {
            try {
              s.default.enableSocket(t4);
            } catch (t5) {
              o.default.error(`enableSocket error`, t5);
            }
          }
          t3.enableSocket = u2;
          function c() {
            return n.default.SDK_VERSION;
          }
          t3.getVersion = c;
        })(u || (u = {}));
        t2.exports = u;
      }, 9478: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(496));
        const s = i2(r2(3555));
        const a = i2(r2(1929));
        const o = i2(r2(4379));
        const u = i2(r2(6899));
        const c = i2(r2(776));
        const l = i2(r2(2002));
        const f = i2(r2(5807));
        const h = i2(r2(9704));
        const d = i2(r2(6545));
        const v = i2(r2(3680));
        const p = i2(r2(7706));
        const g = i2(r2(4486));
        const y = i2(r2(5867));
        const m = i2(r2(7006));
        var w;
        (function(t3) {
          let e3;
          let r3;
          let i3;
          function w2() {
            if ("undefined" != typeof uni) {
              e3 = new d.default();
              r3 = new v.default();
              i3 = new p.default();
            } else if ("undefined" != typeof tt) {
              e3 = new l.default();
              r3 = new f.default();
              i3 = new h.default();
            } else if ("undefined" != typeof my) {
              e3 = new n.default();
              r3 = new s.default();
              i3 = new a.default();
            } else if ("undefined" != typeof wx) {
              e3 = new g.default();
              r3 = new y.default();
              i3 = new m.default();
            } else if ("undefined" != typeof window) {
              e3 = new o.default();
              r3 = new u.default();
              i3 = new c.default();
            }
          }
          function _() {
            if (!e3)
              w2();
            return e3;
          }
          t3.getDevice = _;
          function S() {
            if (!r3)
              w2();
            return r3;
          }
          t3.getStorage = S;
          function b() {
            if (!i3)
              w2();
            return i3;
          }
          t3.getWebSocket = b;
        })(w || (w = {}));
        e2["default"] = w;
      }, 4685: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(9478));
        var s;
        (function(t3) {
          function e3() {
            return n.default.getDevice().os();
          }
          t3.os = e3;
          function r3() {
            return n.default.getDevice().osVersion();
          }
          t3.osVersion = r3;
          function i3() {
            return n.default.getDevice().model();
          }
          t3.model = i3;
          function s2() {
            return n.default.getDevice().brand();
          }
          t3.brand = s2;
          function a() {
            return n.default.getDevice().platform();
          }
          t3.platform = a;
          function o() {
            return n.default.getDevice().platformVersion();
          }
          t3.platformVersion = o;
          function u() {
            return n.default.getDevice().platformId();
          }
          t3.platformId = u;
          function c() {
            return n.default.getDevice().language();
          }
          t3.language = c;
          function l() {
            let t4 = n.default.getDevice().userAgent;
            if (t4)
              return t4();
            return "";
          }
          t3.userAgent = l;
          function f(t4) {
            n.default.getDevice().getNetworkType(t4);
          }
          t3.getNetworkType = f;
          function h(t4) {
            n.default.getDevice().onNetworkStatusChange(t4);
          }
          t3.onNetworkStatusChange = h;
        })(s || (s = {}));
        e2["default"] = s;
      }, 7002: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(6379));
        const s = i2(r2(1386));
        const a = i2(r2(4054));
        const o = r2(2918);
        const u = i2(r2(7167));
        const c = i2(r2(529));
        const l = i2(r2(9478));
        const f = i2(r2(8506));
        var h;
        (function(t3) {
          let e3;
          let r3 = false;
          let i3 = false;
          let h2 = false;
          let d = [];
          const v = 10;
          let p = 0;
          t3.allowReconnect = true;
          function g() {
            return r3 && i3;
          }
          t3.isAvailable = g;
          function y(e4) {
            let r4 = new Date().getTime();
            if (r4 - p < 1e3) {
              c.default.warn(`enableSocket ${e4} fail: this function can only be called once a second`);
              return;
            }
            p = r4;
            t3.allowReconnect = e4;
            if (e4)
              t3.reconnect(10);
            else
              t3.close(`enableSocket ${e4}`);
          }
          t3.enableSocket = y;
          function m(e4 = 0) {
            if (!t3.allowReconnect)
              return;
            if (!S())
              return;
            setTimeout(function() {
              w();
            }, e4);
          }
          t3.reconnect = m;
          function w() {
            t3.allowReconnect = true;
            if (!S())
              return;
            if (!b())
              return;
            h2 = true;
            let r4 = n.default.socketUrl;
            try {
              let t4 = f.default.getSync(f.default.KEY_REDIRECT_SERVER, "");
              if (t4) {
                let e4 = o.RedirectServerData.parse(t4);
                let i4 = e4.addressList[0].split(",");
                let n2 = i4[0];
                let s2 = Number(i4[1]);
                let a2 = new Date().getTime();
                if (a2 - e4.time < 1e3 * s2)
                  r4 = n2;
              }
            } catch (t4) {
            }
            e3 = l.default.getWebSocket().connect({ url: r4, success: function() {
              i3 = true;
              _();
            }, fail: function() {
              i3 = false;
              T();
              m(100);
            } });
            e3.onOpen(M);
            e3.onClose(x);
            e3.onError(A);
            e3.onMessage(I);
          }
          t3.connect = w;
          function _() {
            if (i3 && r3) {
              h2 = false;
              s.default.create().send();
              u.default.getInstance().start();
            }
          }
          function S() {
            if (!n.default.networkConnected) {
              c.default.error(`connect failed, network is not available`);
              return false;
            }
            if (h2) {
              c.default.warn(`connecting`);
              return false;
            }
            if (g()) {
              c.default.warn(`already connected`);
              return false;
            }
            return true;
          }
          function b() {
            var t4 = d.length;
            let e4 = new Date().getTime();
            if (t4 > 0) {
              for (var r4 = t4 - 1; r4 >= 0; r4--)
                if (e4 - d[r4] > 5e3) {
                  d.splice(0, r4 + 1);
                  break;
                }
            }
            t4 = d.length;
            d.push(e4);
            if (t4 >= v) {
              c.default.error("connect failed, connection limit reached");
              return false;
            }
            return true;
          }
          function E(t4 = "") {
            null === e3 || void 0 === e3 || e3.close({ code: 1e3, reason: t4, success: function(t5) {
            }, fail: function(t5) {
            } });
            T();
          }
          t3.close = E;
          function D(t4) {
            if (r3 && r3)
              null === e3 || void 0 === e3 || e3.send({ data: t4, success: function(t5) {
              }, fail: function(t5) {
              } });
            else
              throw new Error(`socket not connect`);
          }
          t3.send = D;
          function T(t4) {
            var e4;
            i3 = false;
            r3 = false;
            h2 = false;
            u.default.getInstance().cancel();
            if (n.default.online) {
              n.default.online = false;
              null === (e4 = n.default.onlineState) || void 0 === e4 || e4.call(n.default.onlineState, { online: n.default.online });
            }
          }
          let M = function(t4) {
            r3 = true;
            _();
          };
          let I = function(t4) {
            try {
              t4.data;
              u.default.getInstance().refresh();
              a.default.receiveMessage(t4.data);
            } catch (t5) {
            }
          };
          let A = function(t4) {
            E(`socket error`);
          };
          let x = function(t4) {
            T();
          };
        })(h || (h = {}));
        e2["default"] = h;
      }, 8506: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(9478));
        var s;
        (function(t3) {
          t3.KEY_APPID = "getui_appid";
          t3.KEY_CID = "getui_cid";
          t3.KEY_SESSION = "getui_session";
          t3.KEY_REGID = "getui_regid";
          t3.KEY_SOCKET_URL = "getui_socket_url";
          t3.KEY_DEVICE_ID = "getui_deviceid";
          t3.KEY_ADD_PHONE_INFO_TIME = "getui_api_time";
          t3.KEY_BIND_ALIAS_TIME = "getui_ba_time";
          t3.KEY_SET_TAG_TIME = "getui_st_time";
          t3.KEY_REDIRECT_SERVER = "getui_redirect_server";
          t3.KEY_LAST_CONNECT_TIME = "getui_last_connect_time";
          function e3(t4) {
            n.default.getStorage().set(t4);
          }
          t3.set = e3;
          function r3(t4, e4) {
            n.default.getStorage().setSync(t4, e4);
          }
          t3.setSync = r3;
          function i3(t4) {
            n.default.getStorage().get(t4);
          }
          t3.get = i3;
          function s2(t4, e4) {
            let r4 = n.default.getStorage().getSync(t4);
            return r4 ? r4 : e4;
          }
          t3.getSync = s2;
        })(s || (s = {}));
        e2["default"] = s;
      }, 496: (t2) => {
        class e2 {
          constructor() {
            this.systemInfo = my.getSystemInfoSync();
          }
          os() {
            var t3;
            return null === (t3 = this.systemInfo) || void 0 === t3 ? void 0 : t3.platform;
          }
          osVersion() {
            var t3;
            return null === (t3 = this.systemInfo) || void 0 === t3 ? void 0 : t3.system;
          }
          model() {
            var t3;
            return null === (t3 = this.systemInfo) || void 0 === t3 ? void 0 : t3.model;
          }
          brand() {
            var t3;
            return null === (t3 = this.systemInfo) || void 0 === t3 ? void 0 : t3.brand;
          }
          platform() {
            return "MP-ALIPAY";
          }
          platformVersion() {
            return this.systemInfo.app + " " + this.systemInfo.version;
          }
          platformId() {
            return my.getAppIdSync();
          }
          language() {
            var t3;
            return null === (t3 = this.systemInfo) || void 0 === t3 ? void 0 : t3.language;
          }
          getNetworkType(t3) {
            my.getNetworkType({ success: (e3) => {
              var r2;
              null === (r2 = t3.success) || void 0 === r2 || r2.call(t3.success, { networkType: e3.networkType });
            }, fail: () => {
              var e3;
              null === (e3 = t3.fail) || void 0 === e3 || e3.call(t3.fail, "");
            } });
          }
          onNetworkStatusChange(t3) {
            my.onNetworkStatusChange(t3);
          }
        }
        t2.exports = e2;
      }, 3555: (t2) => {
        class e2 {
          set(t3) {
            my.setStorage({ key: t3.key, data: t3.data, success: t3.success, fail: t3.fail });
          }
          setSync(t3, e3) {
            my.setStorageSync({ key: t3, data: e3 });
          }
          get(t3) {
            my.getStorage({ key: t3.key, success: t3.success, fail: t3.fail, complete: t3.complete });
          }
          getSync(t3) {
            return my.getStorageSync({ key: t3 }).data;
          }
        }
        t2.exports = e2;
      }, 1929: (t2) => {
        class e2 {
          connect(t3) {
            my.connectSocket({ url: t3.url, header: t3.header, method: t3.method, success: t3.success, fail: t3.fail, complete: t3.complete });
            return { onOpen: my.onSocketOpen, send: my.sendSocketMessage, onMessage: (t4) => {
              my.onSocketMessage.call(my.onSocketMessage, (e3) => {
                t4.call(t4, { data: e3 ? e3.data : "" });
              });
            }, onError: my.onSocketError, onClose: my.onSocketClose, close: my.closeSocket };
          }
        }
        t2.exports = e2;
      }, 4379: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          os() {
            let t3 = window.navigator.userAgent.toLowerCase();
            if (t3.indexOf("android") > 0 || t3.indexOf("adr") > 0)
              return "android";
            if (!!t3.match(/\(i[^;]+;( u;)? cpu.+mac os x/))
              return "ios";
            if (t3.indexOf("windows") > 0 || t3.indexOf("win32") > 0 || t3.indexOf("win64") > 0)
              return "windows";
            if (t3.indexOf("macintosh") > 0 || t3.indexOf("mac os") > 0)
              return "mac os";
            if (t3.indexOf("linux") > 0)
              return "linux";
            if (t3.indexOf("unix") > 0)
              return "linux";
            return "other";
          }
          osVersion() {
            let t3 = window.navigator.userAgent.toLowerCase();
            let e3 = t3.substring(t3.indexOf(";") + 1).trim();
            if (e3.indexOf(";") > 0)
              return e3.substring(0, e3.indexOf(";")).trim();
            return e3.substring(0, e3.indexOf(")")).trim();
          }
          model() {
            return "";
          }
          brand() {
            return "";
          }
          platform() {
            return "H5";
          }
          platformVersion() {
            return "";
          }
          platformId() {
            return "";
          }
          language() {
            return window.navigator.language;
          }
          userAgent() {
            return window.navigator.userAgent;
          }
          getNetworkType(t3) {
            var e3;
            null === (e3 = t3.success) || void 0 === e3 || e3.call(t3.success, { networkType: window.navigator.onLine ? "unknown" : "none" });
          }
          onNetworkStatusChange(t3) {
          }
        }
        e2["default"] = r2;
      }, 6899: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          set(t3) {
            var e3;
            window.localStorage.setItem(t3.key, t3.data);
            null === (e3 = t3.success) || void 0 === e3 || e3.call(t3.success, "");
          }
          setSync(t3, e3) {
            window.localStorage.setItem(t3, e3);
          }
          get(t3) {
            var e3;
            let r3 = window.localStorage.getItem(t3.key);
            null === (e3 = t3.success) || void 0 === e3 || e3.call(t3.success, r3);
          }
          getSync(t3) {
            return window.localStorage.getItem(t3);
          }
        }
        e2["default"] = r2;
      }, 776: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          connect(t3) {
            let e3 = new WebSocket(t3.url);
            return { send: (t4) => {
              var r3, i2;
              try {
                e3.send(t4.data);
                null === (r3 = t4.success) || void 0 === r3 || r3.call(t4.success, { errMsg: "" });
              } catch (e4) {
                null === (i2 = t4.fail) || void 0 === i2 || i2.call(t4.fail, { errMsg: e4 + "" });
              }
            }, close: (t4) => {
              var r3, i2;
              try {
                e3.close(t4.code, t4.reason);
                null === (r3 = t4.success) || void 0 === r3 || r3.call(t4.success, { errMsg: "" });
              } catch (e4) {
                null === (i2 = t4.fail) || void 0 === i2 || i2.call(t4.fail, { errMsg: e4 + "" });
              }
            }, onOpen: (r3) => {
              e3.onopen = (e4) => {
                var i2;
                null === (i2 = t3.success) || void 0 === i2 || i2.call(t3.success, "");
                r3({ header: "" });
              };
            }, onError: (r3) => {
              e3.onerror = (e4) => {
                var i2;
                null === (i2 = t3.fail) || void 0 === i2 || i2.call(t3.fail, "");
                r3({ errMsg: "" });
              };
            }, onMessage: (t4) => {
              e3.onmessage = (e4) => {
                t4({ data: e4.data });
              };
            }, onClose: (t4) => {
              e3.onclose = (e4) => {
                t4(e4);
              };
            } };
          }
        }
        e2["default"] = r2;
      }, 2002: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          constructor() {
            this.systemInfo = tt.getSystemInfoSync();
          }
          os() {
            return this.systemInfo.platform;
          }
          osVersion() {
            return this.systemInfo.system;
          }
          model() {
            return this.systemInfo.model;
          }
          brand() {
            return this.systemInfo.brand;
          }
          platform() {
            return "MP-TOUTIAO";
          }
          platformVersion() {
            return this.systemInfo.appName + " " + this.systemInfo.version;
          }
          language() {
            return "";
          }
          platformId() {
            return "";
          }
          getNetworkType(t3) {
            tt.getNetworkType(t3);
          }
          onNetworkStatusChange(t3) {
            tt.onNetworkStatusChange(t3);
          }
        }
        e2["default"] = r2;
      }, 5807: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          set(t3) {
            tt.setStorage(t3);
          }
          setSync(t3, e3) {
            tt.setStorageSync(t3, e3);
          }
          get(t3) {
            tt.getStorage(t3);
          }
          getSync(t3) {
            return tt.getStorageSync(t3);
          }
        }
        e2["default"] = r2;
      }, 9704: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          connect(t3) {
            let e3 = tt.connectSocket({ url: t3.url, header: t3.header, protocols: t3.protocols, success: t3.success, fail: t3.fail, complete: t3.complete });
            return { onOpen: e3.onOpen, send: e3.send, onMessage: e3.onMessage, onError: e3.onError, onClose: e3.onClose, close: e3.close };
          }
        }
        e2["default"] = r2;
      }, 6545: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          constructor() {
            try {
              this.systemInfo = uni.getSystemInfoSync();
              this.accountInfo = uni.getAccountInfoSync();
            } catch (t3) {
            }
          }
          os() {
            return this.systemInfo ? this.systemInfo.platform : "";
          }
          model() {
            return this.systemInfo ? this.systemInfo.model : "";
          }
          brand() {
            var t3;
            return (null === (t3 = this.systemInfo) || void 0 === t3 ? void 0 : t3.brand) ? this.systemInfo.brand : "";
          }
          osVersion() {
            return this.systemInfo ? this.systemInfo.system : "";
          }
          platform() {
            let t3 = "";
            t3 = "APP-PLUS";
            return t3;
          }
          platformVersion() {
            return this.systemInfo ? this.systemInfo.version : "";
          }
          platformId() {
            return this.accountInfo ? this.accountInfo.miniProgram.appId : "";
          }
          language() {
            var t3;
            return (null === (t3 = this.systemInfo) || void 0 === t3 ? void 0 : t3.language) ? this.systemInfo.language : "";
          }
          userAgent() {
            return window ? window.navigator.userAgent : "";
          }
          getNetworkType(t3) {
            uni.getNetworkType(t3);
          }
          onNetworkStatusChange(t3) {
            uni.onNetworkStatusChange(t3);
          }
        }
        e2["default"] = r2;
      }, 3680: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          set(t3) {
            uni.setStorage(t3);
          }
          setSync(t3, e3) {
            uni.setStorageSync(t3, e3);
          }
          get(t3) {
            uni.getStorage(t3);
          }
          getSync(t3) {
            return uni.getStorageSync(t3);
          }
        }
        e2["default"] = r2;
      }, 7706: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          connect(t3) {
            let e3 = uni.connectSocket(t3);
            return { send: (t4) => {
              null === e3 || void 0 === e3 || e3.send(t4);
            }, close: (t4) => {
              null === e3 || void 0 === e3 || e3.close(t4);
            }, onOpen: (t4) => {
              null === e3 || void 0 === e3 || e3.onOpen(t4);
            }, onError: (t4) => {
              null === e3 || void 0 === e3 || e3.onError(t4);
            }, onMessage: (t4) => {
              null === e3 || void 0 === e3 || e3.onMessage(t4);
            }, onClose: (t4) => {
              null === e3 || void 0 === e3 || e3.onClose(t4);
            } };
          }
        }
        e2["default"] = r2;
      }, 4486: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          constructor() {
            this.systemInfo = wx.getSystemInfoSync();
          }
          os() {
            return this.systemInfo.platform;
          }
          osVersion() {
            return this.systemInfo.system;
          }
          model() {
            return this.systemInfo.model;
          }
          brand() {
            return this.systemInfo.brand;
          }
          platform() {
            return "MP-WEIXIN";
          }
          platformVersion() {
            return this.systemInfo.version;
          }
          language() {
            return this.systemInfo.language;
          }
          platformId() {
            if (wx.canIUse("getAccountInfoSync"))
              return wx.getAccountInfoSync().miniProgram.appId;
            return "";
          }
          getNetworkType(t3) {
            wx.getNetworkType({ success: (e3) => {
              var r3;
              null === (r3 = t3.success) || void 0 === r3 || r3.call(t3.success, { networkType: e3.networkType });
            }, fail: t3.fail });
          }
          onNetworkStatusChange(t3) {
            wx.onNetworkStatusChange(t3);
          }
        }
        e2["default"] = r2;
      }, 5867: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          set(t3) {
            wx.setStorage(t3);
          }
          setSync(t3, e3) {
            wx.setStorageSync(t3, e3);
          }
          get(t3) {
            wx.getStorage(t3);
          }
          getSync(t3) {
            return wx.getStorageSync(t3);
          }
        }
        e2["default"] = r2;
      }, 7006: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          connect(t3) {
            let e3 = wx.connectSocket({ url: t3.url, header: t3.header, protocols: t3.protocols, success: t3.success, fail: t3.fail, complete: t3.complete });
            return { onOpen: e3.onOpen, send: e3.send, onMessage: e3.onMessage, onError: e3.onError, onClose: e3.onClose, close: e3.close };
          }
        }
        e2["default"] = r2;
      }, 6893: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        var r2;
        (function(t3) {
          t3.SDK_VERSION = "GTMP-2.0.3.dcloud";
          t3.DEFAULT_SOCKET_URL = "wss://wshzn.gepush.com:5223/nws";
          t3.SOCKET_PROTOCOL_VERSION = "1.0";
          t3.SERVER_PUBLIC_KEY = "MHwwDQYJKoZIhvcNAQEBBQADawAwaAJhAJp1rROuvBF7sBSnvLaesj2iFhMcY8aXyLvpnNLKs2wjL3JmEnyr++SlVa35liUlzi83tnAFkn3A9GB7pHBNzawyUkBh8WUhq5bnFIkk2RaDa6+5MpG84DEv52p7RR+aWwIDAQAB";
          t3.SERVER_PUBLIC_KEY_ID = "69d747c4b9f641baf4004be4297e9f3b";
          t3.ID_U_2_G = true;
        })(r2 || (r2 = {}));
        e2["default"] = r2;
      }, 7555: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(7002));
        const s = i2(r2(529));
        const a = i2(r2(6379));
        class o {
          static init(t3) {
            var e3;
            if (this.inited)
              return;
            try {
              this.checkAppid(t3.appid);
              this.inited = true;
              s.default.info(`init: appid=${t3.appid}`);
              a.default.init(t3);
              n.default.connect();
            } catch (r3) {
              this.inited = false;
              null === (e3 = t3.onError) || void 0 === e3 || e3.call(t3.onError, { error: r3 });
              throw r3;
            }
          }
          static enableSocket(t3) {
            this.checkInit();
            n.default.enableSocket(t3);
          }
          static checkInit() {
            if (!this.inited)
              throw new Error(`not init, please invoke init method firstly`);
          }
          static checkAppid(t3) {
            if (null == t3 || void 0 == t3 || "" == t3.trim())
              throw new Error(`invalid appid ${t3}`);
          }
        }
        o.inited = false;
        e2["default"] = o;
      }, 6379: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(6667));
        const s = i2(r2(8506));
        const a = i2(r2(6893));
        const o = i2(r2(7002));
        const u = i2(r2(529));
        const c = i2(r2(4685));
        const l = i2(r2(2323));
        class f {
          static init(t3) {
            var e3;
            if (a.default.ID_U_2_G)
              this.appid = l.default.to_getui(t3.appid);
            else
              this.appid = t3.appid;
            this.onError = t3.onError;
            this.onClientId = t3.onClientId;
            this.onlineState = t3.onlineState;
            this.onPushMsg = t3.onPushMsg;
            if (this.appid != s.default.getSync(s.default.KEY_APPID, this.appid)) {
              u.default.info("appid changed, clear session and cid");
              s.default.setSync(s.default.KEY_CID, "");
              s.default.setSync(s.default.KEY_SESSION, "");
            }
            s.default.setSync(s.default.KEY_APPID, this.appid);
            this.cid = s.default.getSync(s.default.KEY_CID, this.cid);
            if (this.cid)
              null === (e3 = this.onClientId) || void 0 === e3 || e3.call(this.onClientId, { cid: f.cid });
            this.session = s.default.getSync(s.default.KEY_SESSION, this.session);
            this.deviceId = s.default.getSync(s.default.KEY_DEVICE_ID, this.deviceId);
            this.regId = s.default.getSync(s.default.KEY_REGID, this.regId);
            if (!this.regId) {
              this.regId = this.createRegId();
              s.default.set({ key: s.default.KEY_REGID, data: this.regId });
            }
            this.socketUrl = s.default.getSync(s.default.KEY_SOCKET_URL, this.socketUrl);
            let r3 = this;
            c.default.getNetworkType({ success: (t4) => {
              r3.networkType = t4.networkType;
              r3.networkConnected = "none" != r3.networkType && "" != r3.networkType;
            } });
            c.default.onNetworkStatusChange((t4) => {
              r3.networkConnected = t4.isConnected;
              r3.networkType = t4.networkType;
              if (r3.networkConnected)
                o.default.reconnect(100);
            });
          }
          static createRegId() {
            return `M-V${n.default.md5Hex(this.getUuid())}-${new Date().getTime()}`;
          }
          static getUuid() {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(t3) {
              let e3 = 16 * Math.random() | 0, r3 = "x" === t3 ? e3 : 3 & e3 | 8;
              return r3.toString(16);
            });
          }
        }
        f.appid = "";
        f.cid = "";
        f.regId = "";
        f.session = "";
        f.deviceId = "";
        f.packetId = 1;
        f.online = false;
        f.socketUrl = a.default.DEFAULT_SOCKET_URL;
        f.publicKeyId = a.default.SERVER_PUBLIC_KEY_ID;
        f.publicKey = a.default.SERVER_PUBLIC_KEY;
        f.lastAliasTime = 0;
        f.networkConnected = true;
        f.networkType = "none";
        e2["default"] = f;
      }, 9586: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        var n, s;
        Object.defineProperty(e2, "__esModule", { value: true });
        const a = i2(r2(661));
        const o = r2(4198);
        const u = i2(r2(6379));
        class c extends a.default {
          constructor() {
            super(...arguments);
            this.actionMsgData = new l();
          }
          static initActionMsg(t3, ...e3) {
            super.initMsg(t3);
            t3.command = a.default.Command.CLIENT_MSG;
            t3.data = t3.actionMsgData = l.create();
            return t3;
          }
          static parseActionMsg(t3, e3) {
            super.parseMsg(t3, e3);
            t3.actionMsgData = l.parse(t3.data);
            return t3;
          }
          send() {
            setTimeout(() => {
              var t3;
              if (c.waitingLoginMsgMap.has(this.actionMsgData.msgId) || c.waitingResponseMsgMap.has(this.actionMsgData.msgId)) {
                c.waitingLoginMsgMap.delete(this.actionMsgData.msgId);
                c.waitingResponseMsgMap.delete(this.actionMsgData.msgId);
                null === (t3 = this.callback) || void 0 === t3 || t3.call(this.callback, { resultCode: o.ErrorCode.TIME_OUT, message: "waiting time out" });
              }
            }, 1e4);
            if (!u.default.online) {
              c.waitingLoginMsgMap.set(this.actionMsgData.msgId, this);
              return;
            }
            if (this.actionMsgData.msgAction != c.ClientAction.RECEIVED)
              c.waitingResponseMsgMap.set(this.actionMsgData.msgId, this);
            super.send();
          }
          receive() {
          }
          static sendWaitingMessages() {
            let t3 = this.waitingLoginMsgMap.keys();
            let e3;
            while (e3 = t3.next(), !e3.done) {
              let t4 = this.waitingLoginMsgMap.get(e3.value);
              this.waitingLoginMsgMap.delete(e3.value);
              null === t4 || void 0 === t4 || t4.send();
            }
          }
          static getWaitingResponseMessage(t3) {
            return c.waitingResponseMsgMap.get(t3);
          }
          static removeWaitingResponseMessage(t3) {
            let e3 = c.waitingResponseMsgMap.get(t3);
            if (e3)
              c.waitingResponseMsgMap.delete(t3);
            return e3;
          }
        }
        c.ServerAction = (n = class {
        }, n.PUSH_MESSAGE = "pushmessage", n.REDIRECT_SERVER = "redirect_server", n.ADD_PHONE_INFO_RESULT = "addphoneinfo", n.SET_MODE_RESULT = "set_mode_result", n.SET_TAG_RESULT = "settag_result", n.BIND_ALIAS_RESULT = "response_bind", n.UNBIND_ALIAS_RESULT = "response_unbind", n.FEED_BACK_RESULT = "pushmessage_feedback", n.RECEIVED = "received", n);
        c.ClientAction = (s = class {
        }, s.ADD_PHONE_INFO = "addphoneinfo", s.SET_MODE = "set_mode", s.FEED_BACK = "pushmessage_feedback", s.SET_TAGS = "set_tag", s.BIND_ALIAS = "bind_alias", s.UNBIND_ALIAS = "unbind_alias", s.RECEIVED = "received", s);
        c.waitingLoginMsgMap = /* @__PURE__ */ new Map();
        c.waitingResponseMsgMap = /* @__PURE__ */ new Map();
        class l {
          constructor() {
            this.appId = "";
            this.cid = "";
            this.msgId = "";
            this.msgAction = "";
            this.msgData = "";
            this.msgExtraData = "";
          }
          static create() {
            let t3 = new l();
            t3.appId = u.default.appid;
            t3.cid = u.default.cid;
            t3.msgId = (2147483647 & new Date().getTime()).toString();
            return t3;
          }
          static parse(t3) {
            let e3 = new l();
            let r3 = JSON.parse(t3);
            e3.appId = r3.appId;
            e3.cid = r3.cid;
            e3.msgId = r3.msgId;
            e3.msgAction = r3.msgAction;
            e3.msgData = r3.msgData;
            e3.msgExtraData = r3.msgExtraData;
            return e3;
          }
        }
        e2["default"] = c;
      }, 4516: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(4685));
        const s = i2(r2(8506));
        const a = i2(r2(6893));
        const o = r2(4198);
        const u = i2(r2(9586));
        const c = i2(r2(6379));
        class l extends u.default {
          constructor() {
            super(...arguments);
            this.addPhoneInfoData = new f();
          }
          static create() {
            let t3 = new l();
            super.initActionMsg(t3);
            t3.callback = (e3) => {
              if (e3.resultCode != o.ErrorCode.SUCCESS && e3.resultCode != o.ErrorCode.REPEAT_MESSAGE)
                setTimeout(function() {
                  t3.send();
                }, 30 * 1e3);
              else
                s.default.set({ key: s.default.KEY_ADD_PHONE_INFO_TIME, data: new Date().getTime() });
            };
            t3.actionMsgData.msgAction = u.default.ClientAction.ADD_PHONE_INFO;
            t3.addPhoneInfoData = f.create();
            t3.actionMsgData.msgData = JSON.stringify(t3.addPhoneInfoData);
            return t3;
          }
          send() {
            let t3 = new Date().getTime();
            let e3 = s.default.getSync(s.default.KEY_ADD_PHONE_INFO_TIME, 0);
            if (t3 - e3 < 24 * 60 * 60 * 1e3)
              return;
            super.send();
          }
        }
        class f {
          constructor() {
            this.model = "";
            this.brand = "";
            this.system_version = "";
            this.version = "";
            this.deviceid = "";
            this.type = "";
          }
          static create() {
            let t3 = new f();
            t3.model = n.default.model();
            t3.brand = n.default.brand();
            t3.system_version = n.default.osVersion();
            t3.version = a.default.SDK_VERSION;
            t3.device_token = "";
            t3.imei = "";
            t3.oaid = "";
            t3.mac = "";
            t3.idfa = "";
            t3.type = "MINIPROGRAM";
            t3.deviceid = `${t3.type}-${c.default.deviceId}`;
            t3.extra = { os: n.default.os(), platform: n.default.platform(), platformVersion: n.default.platformVersion(), platformId: n.default.platformId(), language: n.default.language(), userAgent: n.default.userAgent() };
            return t3;
          }
        }
        e2["default"] = l;
      }, 8723: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        var n, s;
        Object.defineProperty(e2, "__esModule", { value: true });
        const a = i2(r2(6379));
        const o = r2(4198);
        const u = i2(r2(9586));
        class c extends u.default {
          constructor() {
            super(...arguments);
            this.feedbackData = new l();
          }
          static create(t3, e3) {
            let r3 = new c();
            super.initActionMsg(r3);
            r3.callback = (t4) => {
              if (t4.resultCode != o.ErrorCode.SUCCESS && t4.resultCode != o.ErrorCode.REPEAT_MESSAGE)
                setTimeout(function() {
                  r3.send();
                }, 30 * 1e3);
            };
            r3.feedbackData = l.create(t3, e3);
            r3.actionMsgData.msgAction = u.default.ClientAction.FEED_BACK;
            r3.actionMsgData.msgData = JSON.stringify(r3.feedbackData);
            return r3;
          }
          send() {
            super.send();
          }
        }
        c.ActionId = (n = class {
        }, n.RECEIVE = "0", n.MP_RECEIVE = "210000", n.WEB_RECEIVE = "220000", n.BEGIN = "1", n);
        c.RESULT = (s = class {
        }, s.OK = "ok", s);
        class l {
          constructor() {
            this.messageid = "";
            this.appkey = "";
            this.appid = "";
            this.taskid = "";
            this.actionid = "";
            this.result = "";
            this.timestamp = "";
          }
          static create(t3, e3) {
            let r3 = new l();
            r3.messageid = t3.pushMessageData.messageid;
            r3.appkey = t3.pushMessageData.appKey;
            r3.appid = a.default.appid;
            r3.taskid = t3.pushMessageData.taskId;
            r3.actionid = e3;
            r3.result = c.RESULT.OK;
            r3.timestamp = new Date().getTime().toString();
            return r3;
          }
        }
        e2["default"] = c;
      }, 6362: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(661));
        class s extends n.default {
          static create() {
            let t3 = new s();
            super.initMsg(t3);
            t3.command = n.default.Command.HEART_BEAT;
            return t3;
          }
        }
        e2["default"] = s;
      }, 1386: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(6667));
        const s = i2(r2(6379));
        const a = i2(r2(661));
        class o extends a.default {
          constructor() {
            super(...arguments);
            this.keyNegotiateData = new u();
          }
          static create() {
            let t3 = new o();
            super.initMsg(t3);
            t3.command = a.default.Command.KEY_NEGOTIATE;
            n.default.resetKey();
            t3.data = t3.keyNegotiateData = u.create();
            return t3;
          }
          send() {
            super.send();
          }
        }
        class u {
          constructor() {
            this.appId = "";
            this.rsaPublicKeyId = "";
            this.algorithm = "";
            this.secretKey = "";
            this.iv = "";
          }
          static create() {
            let t3 = new u();
            t3.appId = s.default.appid;
            t3.rsaPublicKeyId = s.default.publicKeyId;
            t3.algorithm = "AES";
            t3.secretKey = n.default.getEncryptedSecretKey();
            t3.iv = n.default.getEncryptedIV();
            return t3;
          }
        }
        e2["default"] = o;
      }, 1280: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(661));
        const s = i2(r2(6667));
        const a = i2(r2(8858));
        const o = i2(r2(529));
        const u = i2(r2(6379));
        class c extends n.default {
          constructor() {
            super(...arguments);
            this.keyNegotiateResultData = new l();
          }
          static parse(t3) {
            let e3 = new c();
            super.parseMsg(e3, t3);
            e3.keyNegotiateResultData = l.parse(e3.data);
            return e3;
          }
          receive() {
            var t3, e3;
            if (0 != this.keyNegotiateResultData.errorCode) {
              o.default.error(`key negotiate fail: ${this.data}`);
              null === (t3 = u.default.onError) || void 0 === t3 || t3.call(u.default.onError, { error: `key negotiate fail: ${this.data}` });
              return;
            }
            let r3 = this.keyNegotiateResultData.encryptType.split("/");
            if (!s.default.algorithmMap.has(r3[0].trim().toLowerCase()) || !s.default.modeMap.has(r3[1].trim().toLowerCase()) || !s.default.paddingMap.has(r3[2].trim().toLowerCase())) {
              o.default.error(`key negotiate fail: ${this.data}`);
              null === (e3 = u.default.onError) || void 0 === e3 || e3.call(u.default.onError, { error: `key negotiate fail: ${this.data}` });
              return;
            }
            s.default.setEncryptParams(r3[0].trim().toLowerCase(), r3[1].trim().toLowerCase(), r3[2].trim().toLowerCase());
            a.default.create().send();
          }
        }
        class l {
          constructor() {
            this.errorCode = -1;
            this.errorMsg = "";
            this.encryptType = "";
          }
          static parse(t3) {
            let e3 = new l();
            let r3 = JSON.parse(t3);
            e3.errorCode = r3.errorCode;
            e3.errorMsg = r3.errorMsg;
            e3.encryptType = r3.encryptType;
            return e3;
          }
        }
        e2["default"] = c;
      }, 8858: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(6379));
        const s = i2(r2(6667));
        const a = i2(r2(661));
        const o = i2(r2(4534));
        class u extends a.default {
          constructor() {
            super(...arguments);
            this.loginData = new c();
          }
          static create() {
            let t3 = new u();
            super.initMsg(t3);
            t3.command = a.default.Command.LOGIN;
            t3.data = t3.loginData = c.create();
            return t3;
          }
          send() {
            if (!this.loginData.session || n.default.cid != s.default.md5Hex(this.loginData.session)) {
              o.default.create().send();
              return;
            }
            super.send();
          }
        }
        class c {
          constructor() {
            this.appId = "";
            this.session = "";
          }
          static create() {
            let t3 = new c();
            t3.appId = n.default.appid;
            t3.session = n.default.session;
            return t3;
          }
        }
        e2["default"] = u;
      }, 1606: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(8506));
        const s = i2(r2(661));
        const a = i2(r2(6379));
        const o = i2(r2(9586));
        const u = i2(r2(4516));
        const c = i2(r2(8858));
        class l extends s.default {
          constructor() {
            super(...arguments);
            this.loginResultData = new f();
          }
          static parse(t3) {
            let e3 = new l();
            super.parseMsg(e3, t3);
            e3.loginResultData = f.parse(e3.data);
            return e3;
          }
          receive() {
            var t3;
            if (0 != this.loginResultData.errorCode) {
              this.data;
              a.default.session = a.default.cid = "";
              n.default.setSync(n.default.KEY_CID, "");
              n.default.setSync(n.default.KEY_SESSION, "");
              c.default.create().send();
              return;
            }
            if (!a.default.online) {
              a.default.online = true;
              null === (t3 = a.default.onlineState) || void 0 === t3 || t3.call(a.default.onlineState, { online: a.default.online });
            }
            o.default.sendWaitingMessages();
            u.default.create().send();
          }
        }
        class f {
          constructor() {
            this.errorCode = -1;
            this.errorMsg = "";
            this.session = "";
          }
          static parse(t3) {
            let e3 = new f();
            let r3 = JSON.parse(t3);
            e3.errorCode = r3.errorCode;
            e3.errorMsg = r3.errorMsg;
            e3.session = r3.session;
            return e3;
          }
        }
        e2["default"] = l;
      }, 661: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        var n;
        Object.defineProperty(e2, "__esModule", { value: true });
        const s = i2(r2(9593));
        const a = i2(r2(7002));
        const o = i2(r2(6893));
        const u = i2(r2(6379));
        class c {
          constructor() {
            this.version = "";
            this.command = 0;
            this.packetId = 0;
            this.timeStamp = 0;
            this.data = "";
            this.signature = "";
          }
          static initMsg(t3, ...e3) {
            t3.version = o.default.SOCKET_PROTOCOL_VERSION;
            t3.command = 0;
            t3.timeStamp = new Date().getTime();
            return t3;
          }
          static parseMsg(t3, e3) {
            let r3 = JSON.parse(e3);
            t3.version = r3.version;
            t3.command = r3.command;
            t3.packetId = r3.packetId;
            t3.timeStamp = r3.timeStamp;
            t3.data = r3.data;
            t3.signature = r3.signature;
            return t3;
          }
          stringify() {
            return JSON.stringify(this, ["version", "command", "packetId", "timeStamp", "data", "signature"]);
          }
          send() {
            if (!a.default.isAvailable())
              return;
            this.packetId = u.default.packetId++;
            this.data = JSON.stringify(this.data);
            this.stringify();
            if (this.command != c.Command.HEART_BEAT) {
              s.default.sign(this);
              if (this.data && this.command != c.Command.KEY_NEGOTIATE)
                s.default.encrypt(this);
            }
            a.default.send(this.stringify());
          }
        }
        c.Command = (n = class {
        }, n.HEART_BEAT = 0, n.KEY_NEGOTIATE = 1, n.KEY_NEGOTIATE_RESULT = 16, n.REGISTER = 2, n.REGISTER_RESULT = 32, n.LOGIN = 3, n.LOGIN_RESULT = 48, n.LOGOUT = 4, n.LOGOUT_RESULT = 64, n.CLIENT_MSG = 5, n.SERVER_MSG = 80, n.SERVER_CLOSE = 96, n.REDIRECT_SERVER = 112, n);
        e2["default"] = c;
      }, 9593: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(6667));
        var s;
        (function(t3) {
          function e3(t4) {
            t4.data = n.default.encrypt(t4.data);
          }
          t3.encrypt = e3;
          function r3(t4) {
            t4.data = n.default.decrypt(t4.data);
          }
          t3.decrypt = r3;
          function i3(t4) {
            t4.signature = n.default.sha256(`${t4.timeStamp}${t4.packetId}${t4.command}${t4.data}`);
          }
          t3.sign = i3;
          function s2(t4) {
            let e4 = n.default.sha256(`${t4.timeStamp}${t4.packetId}${t4.command}${t4.data}`);
            if (t4.signature != e4)
              throw new Error(`msg signature vierfy failed`);
          }
          t3.verify = s2;
        })(s || (s = {}));
        e2["default"] = s;
      }, 4054: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(1280));
        const s = i2(r2(1606));
        const a = i2(r2(661));
        const o = i2(r2(1277));
        const u = i2(r2(910));
        const c = i2(r2(9538));
        const l = i2(r2(9479));
        const f = i2(r2(6755));
        const h = i2(r2(2918));
        const d = i2(r2(9586));
        const v = i2(r2(9510));
        const p = i2(r2(4626));
        const g = i2(r2(7562));
        const y = i2(r2(9593));
        const m = i2(r2(9586));
        const w = i2(r2(9519));
        const _ = i2(r2(8947));
        class S {
          static receiveMessage(t3) {
            let e3 = a.default.parseMsg(new a.default(), t3);
            if (e3.command == a.default.Command.HEART_BEAT)
              return;
            if (e3.command != a.default.Command.KEY_NEGOTIATE_RESULT && e3.command != a.default.Command.SERVER_CLOSE && e3.command != a.default.Command.REDIRECT_SERVER)
              y.default.decrypt(e3);
            if (e3.command != a.default.Command.SERVER_CLOSE && e3.command != a.default.Command.REDIRECT_SERVER)
              y.default.verify(e3);
            switch (e3.command) {
              case a.default.Command.KEY_NEGOTIATE_RESULT:
                n.default.parse(e3.stringify()).receive();
                break;
              case a.default.Command.REGISTER_RESULT:
                o.default.parse(e3.stringify()).receive();
                break;
              case a.default.Command.LOGIN_RESULT:
                s.default.parse(e3.stringify()).receive();
                break;
              case a.default.Command.SERVER_MSG:
                this.receiveActionMsg(e3.stringify());
                break;
              case a.default.Command.SERVER_CLOSE:
                _.default.parse(e3.stringify()).receive();
                break;
              case a.default.Command.REDIRECT_SERVER:
                h.default.parse(e3.stringify()).receive();
                break;
            }
          }
          static receiveActionMsg(t3) {
            let e3 = m.default.parseActionMsg(new m.default(), t3);
            if (e3.actionMsgData.msgAction != d.default.ServerAction.RECEIVED && e3.actionMsgData.msgAction != d.default.ServerAction.REDIRECT_SERVER) {
              let t4 = JSON.parse(e3.actionMsgData.msgData);
              w.default.create(t4.id).send();
            }
            switch (e3.actionMsgData.msgAction) {
              case d.default.ServerAction.PUSH_MESSAGE:
                f.default.parse(t3).receive();
                break;
              case d.default.ServerAction.ADD_PHONE_INFO_RESULT:
                u.default.parse(t3).receive();
                break;
              case d.default.ServerAction.SET_MODE_RESULT:
                v.default.parse(t3).receive();
                break;
              case d.default.ServerAction.SET_TAG_RESULT:
                p.default.parse(t3).receive();
                break;
              case d.default.ServerAction.BIND_ALIAS_RESULT:
                c.default.parse(t3).receive();
                break;
              case d.default.ServerAction.UNBIND_ALIAS_RESULT:
                g.default.parse(t3).receive();
                break;
              case d.default.ServerAction.FEED_BACK_RESULT:
                l.default.parse(t3).receive();
                break;
              case d.default.ServerAction.RECEIVED:
                w.default.parse(t3).receive();
                break;
            }
          }
        }
        e2["default"] = S;
      }, 9519: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = r2(4198);
        const s = i2(r2(6379));
        const a = i2(r2(9586));
        class o extends a.default {
          constructor() {
            super(...arguments);
            this.receivedData = new u();
          }
          static create(t3) {
            let e3 = new o();
            super.initActionMsg(e3);
            e3.callback = (t4) => {
              if (t4.resultCode != n.ErrorCode.SUCCESS && t4.resultCode != n.ErrorCode.REPEAT_MESSAGE)
                setTimeout(function() {
                  e3.send();
                }, 3 * 1e3);
            };
            e3.actionMsgData.msgAction = a.default.ClientAction.RECEIVED;
            e3.receivedData = u.create(t3);
            e3.actionMsgData.msgData = JSON.stringify(e3.receivedData);
            return e3;
          }
          static parse(t3) {
            let e3 = new o();
            super.parseActionMsg(e3, t3);
            e3.receivedData = u.parse(e3.data);
            return e3;
          }
          receive() {
            var t3;
            let e3 = a.default.getWaitingResponseMessage(this.actionMsgData.msgId);
            if (e3 && e3.actionMsgData.msgAction == a.default.ClientAction.ADD_PHONE_INFO || e3 && e3.actionMsgData.msgAction == a.default.ClientAction.FEED_BACK) {
              a.default.removeWaitingResponseMessage(e3.actionMsgData.msgId);
              null === (t3 = e3.callback) || void 0 === t3 || t3.call(e3.callback, { resultCode: n.ErrorCode.SUCCESS, message: "received" });
            }
          }
          send() {
            super.send();
          }
        }
        class u {
          constructor() {
            this.msgId = "";
            this.cid = "";
          }
          static create(t3) {
            let e3 = new u();
            e3.cid = s.default.cid;
            e3.msgId = t3;
            return e3;
          }
          static parse(t3) {
            let e3 = new u();
            let r3 = JSON.parse(t3);
            e3.cid = r3.cid;
            e3.msgId = r3.msgId;
            return e3;
          }
        }
        e2["default"] = o;
      }, 2918: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        e2.RedirectServerData = void 0;
        const n = i2(r2(7002));
        const s = i2(r2(8506));
        const a = i2(r2(661));
        class o extends a.default {
          constructor() {
            super(...arguments);
            this.redirectServerData = new u();
          }
          static parse(t3) {
            let e3 = new o();
            super.parseMsg(e3, t3);
            e3.redirectServerData = u.parse(e3.data);
            return e3;
          }
          receive() {
            this.redirectServerData;
            s.default.setSync(s.default.KEY_REDIRECT_SERVER, JSON.stringify(this.redirectServerData));
            n.default.close("redirect server");
            n.default.reconnect(this.redirectServerData.delay);
          }
        }
        class u {
          constructor() {
            this.addressList = [];
            this.delay = 0;
            this.loc = "";
            this.conf = "";
            this.time = 0;
          }
          static parse(t3) {
            let e3 = new u();
            let r3 = JSON.parse(t3);
            e3.addressList = r3.addressList;
            e3.delay = r3.delay;
            e3.loc = r3.loc;
            e3.conf = r3.conf;
            e3.time = r3.time ? r3.time : new Date().getTime();
            return e3;
          }
        }
        e2.RedirectServerData = u;
        e2["default"] = o;
      }, 4534: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(6379));
        const s = i2(r2(661));
        class a extends s.default {
          constructor() {
            super(...arguments);
            this.registerData = new o();
          }
          static create() {
            let t3 = new a();
            super.initMsg(t3);
            t3.command = s.default.Command.REGISTER;
            t3.data = t3.registerData = o.create();
            return t3;
          }
          send() {
            super.send();
          }
        }
        class o {
          constructor() {
            this.appId = "";
            this.regId = "";
          }
          static create() {
            let t3 = new o();
            t3.appId = n.default.appid;
            t3.regId = n.default.regId;
            return t3;
          }
        }
        e2["default"] = a;
      }, 1277: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(661));
        const s = i2(r2(8506));
        const a = i2(r2(6379));
        const o = i2(r2(8858));
        const u = i2(r2(529));
        class c extends n.default {
          constructor() {
            super(...arguments);
            this.registerResultData = new l();
          }
          static parse(t3) {
            let e3 = new c();
            super.parseMsg(e3, t3);
            e3.registerResultData = l.parse(e3.data);
            return e3;
          }
          receive() {
            var t3, e3;
            if (0 != this.registerResultData.errorCode || !this.registerResultData.cid || !this.registerResultData.session) {
              u.default.error(`register fail: ${this.data}`);
              null === (t3 = a.default.onError) || void 0 === t3 || t3.call(a.default.onError, { error: `register fail: ${this.data}` });
              return;
            }
            if (a.default.cid != this.registerResultData.cid)
              s.default.setSync(s.default.KEY_ADD_PHONE_INFO_TIME, 0);
            a.default.cid = this.registerResultData.cid;
            null === (e3 = a.default.onClientId) || void 0 === e3 || e3.call(a.default.onClientId, { cid: a.default.cid });
            s.default.set({ key: s.default.KEY_CID, data: a.default.cid });
            a.default.session = this.registerResultData.session;
            s.default.set({ key: s.default.KEY_SESSION, data: a.default.session });
            a.default.deviceId = this.registerResultData.deviceId;
            s.default.set({ key: s.default.KEY_DEVICE_ID, data: a.default.deviceId });
            o.default.create().send();
          }
        }
        class l {
          constructor() {
            this.errorCode = -1;
            this.errorMsg = "";
            this.cid = "";
            this.session = "";
            this.deviceId = "";
            this.regId = "";
          }
          static parse(t3) {
            let e3 = new l();
            let r3 = JSON.parse(t3);
            e3.errorCode = r3.errorCode;
            e3.errorMsg = r3.errorMsg;
            e3.cid = r3.cid;
            e3.session = r3.session;
            e3.deviceId = r3.deviceId;
            e3.regId = r3.regId;
            return e3;
          }
        }
        e2["default"] = c;
      }, 8947: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(7002));
        const s = i2(r2(529));
        const a = i2(r2(661));
        class o extends a.default {
          constructor() {
            super(...arguments);
            this.serverCloseData = new u();
          }
          static parse(t3) {
            let e3 = new o();
            super.parseMsg(e3, t3);
            e3.serverCloseData = u.parse(e3.data);
            return e3;
          }
          receive() {
            JSON.stringify(this.serverCloseData);
            let t3 = `server close ${this.serverCloseData.code}`;
            if (20 == this.serverCloseData.code || 23 == this.serverCloseData.code || 24 == this.serverCloseData.code) {
              n.default.allowReconnect = false;
              n.default.close(t3);
            } else if (21 == this.serverCloseData.code)
              this.safeClose21(t3);
            else {
              n.default.allowReconnect = true;
              n.default.close(t3);
              n.default.reconnect(10);
            }
          }
          safeClose21(t3) {
            try {
              if ("undefined" != typeof document) {
                if (document.hasFocus() && "visible" == document.visibilityState) {
                  n.default.allowReconnect = true;
                  n.default.close(t3);
                  n.default.reconnect(10);
                  return;
                }
              }
              n.default.allowReconnect = false;
              n.default.close(t3);
            } catch (e3) {
              s.default.error(`ServerClose t1`, e3);
              n.default.allowReconnect = false;
              n.default.close(`${t3} error`);
            }
          }
        }
        class u {
          constructor() {
            this.code = -1;
            this.msg = "";
          }
          static parse(t3) {
            let e3 = new u();
            let r3 = JSON.parse(t3);
            e3.code = r3.code;
            e3.msg = r3.msg;
            return e3;
          }
        }
        e2["default"] = o;
      }, 910: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(8506));
        const s = i2(r2(9586));
        class a extends s.default {
          constructor() {
            super(...arguments);
            this.addPhoneInfoResultData = new o();
          }
          static parse(t3) {
            let e3 = new a();
            super.parseActionMsg(e3, t3);
            e3.addPhoneInfoResultData = o.parse(e3.actionMsgData.msgData);
            return e3;
          }
          receive() {
            var t3;
            this.addPhoneInfoResultData;
            let e3 = s.default.removeWaitingResponseMessage(this.actionMsgData.msgId);
            if (e3)
              null === (t3 = e3.callback) || void 0 === t3 || t3.call(e3.callback, { resultCode: this.addPhoneInfoResultData.errorCode, message: this.addPhoneInfoResultData.errorMsg });
            n.default.set({ key: n.default.KEY_ADD_PHONE_INFO_TIME, data: new Date().getTime() });
          }
        }
        class o {
          constructor() {
            this.errorCode = -1;
            this.errorMsg = "";
          }
          static parse(t3) {
            let e3 = new o();
            let r3 = JSON.parse(t3);
            e3.errorCode = r3.errorCode;
            e3.errorMsg = r3.errorMsg;
            return e3;
          }
        }
        e2["default"] = a;
      }, 9538: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(8506));
        const s = i2(r2(529));
        const a = i2(r2(9586));
        class o extends a.default {
          constructor() {
            super(...arguments);
            this.bindAliasResultData = new u();
          }
          static parse(t3) {
            let e3 = new o();
            super.parseActionMsg(e3, t3);
            e3.bindAliasResultData = u.parse(e3.actionMsgData.msgData);
            return e3;
          }
          receive() {
            var t3;
            s.default.info(`bind alias result`, this.bindAliasResultData);
            let e3 = a.default.removeWaitingResponseMessage(this.actionMsgData.msgId);
            if (e3)
              null === (t3 = e3.callback) || void 0 === t3 || t3.call(e3.callback, { resultCode: this.bindAliasResultData.errorCode, message: this.bindAliasResultData.errorMsg });
            n.default.set({ key: n.default.KEY_BIND_ALIAS_TIME, data: new Date().getTime() });
          }
        }
        class u {
          constructor() {
            this.errorCode = -1;
            this.errorMsg = "";
          }
          static parse(t3) {
            let e3 = new u();
            let r3 = JSON.parse(t3);
            e3.errorCode = r3.errorCode;
            e3.errorMsg = r3.errorMsg;
            return e3;
          }
        }
        e2["default"] = o;
      }, 9479: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = r2(4198);
        const s = i2(r2(9586));
        class a extends s.default {
          constructor() {
            super(...arguments);
            this.feedbackResultData = new o();
          }
          static parse(t3) {
            let e3 = new a();
            super.parseActionMsg(e3, t3);
            e3.feedbackResultData = o.parse(e3.actionMsgData.msgData);
            return e3;
          }
          receive() {
            var t3;
            this.feedbackResultData;
            let e3 = s.default.removeWaitingResponseMessage(this.actionMsgData.msgId);
            if (e3)
              null === (t3 = e3.callback) || void 0 === t3 || t3.call(e3.callback, { resultCode: n.ErrorCode.SUCCESS, message: "received" });
          }
        }
        class o {
          constructor() {
            this.actionId = "";
            this.taskId = "";
            this.result = "";
          }
          static parse(t3) {
            let e3 = new o();
            let r3 = JSON.parse(t3);
            e3.actionId = r3.actionId;
            e3.taskId = r3.taskId;
            e3.result = r3.result;
            return e3;
          }
        }
        e2["default"] = a;
      }, 6755: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        var n;
        Object.defineProperty(e2, "__esModule", { value: true });
        const s = i2(r2(6379));
        const a = i2(r2(9586));
        const o = i2(r2(8723));
        class u extends a.default {
          constructor() {
            super(...arguments);
            this.pushMessageData = new c();
          }
          static parse(t3) {
            let e3 = new u();
            super.parseActionMsg(e3, t3);
            e3.pushMessageData = c.parse(e3.actionMsgData.msgData);
            return e3;
          }
          receive() {
            var t3;
            this.pushMessageData;
            if (this.pushMessageData.appId != s.default.appid || !this.pushMessageData.messageid || !this.pushMessageData.taskId)
              this.stringify();
            o.default.create(this, o.default.ActionId.RECEIVE).send();
            o.default.create(this, o.default.ActionId.MP_RECEIVE).send();
            if (this.actionMsgData.msgExtraData && s.default.onPushMsg)
              null === (t3 = s.default.onPushMsg) || void 0 === t3 || t3.call(s.default.onPushMsg, { message: this.actionMsgData.msgExtraData });
          }
        }
        class c {
          constructor() {
            this.id = "";
            this.appKey = "";
            this.appId = "";
            this.messageid = "";
            this.taskId = "";
            this.actionChain = [];
            this.cdnType = "";
          }
          static parse(t3) {
            let e3 = new c();
            let r3 = JSON.parse(t3);
            e3.id = r3.id;
            e3.appKey = r3.appKey;
            e3.appId = r3.appId;
            e3.messageid = r3.messageid;
            e3.taskId = r3.taskId;
            e3.actionChain = r3.actionChain;
            e3.cdnType = r3.cdnType;
            return e3;
          }
        }
        n = class {
        }, n.GO_TO = "goto", n.TRANSMIT = "transmit";
        e2["default"] = u;
      }, 9510: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(9586));
        class s extends n.default {
          constructor() {
            super(...arguments);
            this.setModeResultData = new a();
          }
          static parse(t3) {
            let e3 = new s();
            super.parseActionMsg(e3, t3);
            e3.setModeResultData = a.parse(e3.actionMsgData.msgData);
            return e3;
          }
          receive() {
            var t3;
            this.setModeResultData;
            let e3 = n.default.removeWaitingResponseMessage(this.actionMsgData.msgId);
            if (e3)
              null === (t3 = e3.callback) || void 0 === t3 || t3.call(e3.callback, { resultCode: this.setModeResultData.errorCode, message: this.setModeResultData.errorMsg });
          }
        }
        class a {
          constructor() {
            this.errorCode = -1;
            this.errorMsg = "";
          }
          static parse(t3) {
            let e3 = new a();
            let r3 = JSON.parse(t3);
            e3.errorCode = r3.errorCode;
            e3.errorMsg = r3.errorMsg;
            return e3;
          }
        }
        e2["default"] = s;
      }, 4626: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(8506));
        const s = i2(r2(529));
        const a = i2(r2(9586));
        class o extends a.default {
          constructor() {
            super(...arguments);
            this.setTagResultData = new u();
          }
          static parse(t3) {
            let e3 = new o();
            super.parseActionMsg(e3, t3);
            e3.setTagResultData = u.parse(e3.actionMsgData.msgData);
            return e3;
          }
          receive() {
            var t3;
            s.default.info(`set tag result`, this.setTagResultData);
            let e3 = a.default.removeWaitingResponseMessage(this.actionMsgData.msgId);
            if (e3)
              null === (t3 = e3.callback) || void 0 === t3 || t3.call(e3.callback, { resultCode: this.setTagResultData.errorCode, message: this.setTagResultData.errorMsg });
            n.default.set({ key: n.default.KEY_SET_TAG_TIME, data: new Date().getTime() });
          }
        }
        class u {
          constructor() {
            this.errorCode = 0;
            this.errorMsg = "";
          }
          static parse(t3) {
            let e3 = new u();
            let r3 = JSON.parse(t3);
            e3.errorCode = r3.errorCode;
            e3.errorMsg = r3.errorMsg;
            return e3;
          }
        }
        e2["default"] = o;
      }, 7562: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(8506));
        const s = i2(r2(529));
        const a = i2(r2(9586));
        class o extends a.default {
          constructor() {
            super(...arguments);
            this.unbindAliasResultData = new u();
          }
          static parse(t3) {
            let e3 = new o();
            super.parseActionMsg(e3, t3);
            e3.unbindAliasResultData = u.parse(e3.actionMsgData.msgData);
            return e3;
          }
          receive() {
            var t3;
            s.default.info(`unbind alias result`, this.unbindAliasResultData);
            let e3 = a.default.removeWaitingResponseMessage(this.actionMsgData.msgId);
            if (e3)
              null === (t3 = e3.callback) || void 0 === t3 || t3.call(e3.callback, { resultCode: this.unbindAliasResultData.errorCode, message: this.unbindAliasResultData.errorMsg });
            n.default.set({ key: n.default.KEY_BIND_ALIAS_TIME, data: new Date().getTime() });
          }
        }
        class u {
          constructor() {
            this.errorCode = -1;
            this.errorMsg = "";
          }
          static parse(t3) {
            let e3 = new u();
            let r3 = JSON.parse(t3);
            e3.errorCode = r3.errorCode;
            e3.errorMsg = r3.errorMsg;
            return e3;
          }
        }
        e2["default"] = o;
      }, 8227: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          constructor(t3) {
            this.delay = 10;
            this.delay = t3;
          }
          start() {
            this.cancel();
            let t3 = this;
            this.timer = setInterval(function() {
              t3.run();
            }, this.delay);
          }
          cancel() {
            if (this.timer)
              clearInterval(this.timer);
          }
        }
        e2["default"] = r2;
      }, 7167: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        var n;
        Object.defineProperty(e2, "__esModule", { value: true });
        const s = i2(r2(6362));
        const a = i2(r2(8227));
        class o extends a.default {
          static getInstance() {
            return o.InstanceHolder.instance;
          }
          run() {
            s.default.create().send();
          }
          refresh() {
            this.delay = 60 * 1e3;
            this.start();
          }
        }
        o.INTERVAL = 60 * 1e3;
        o.InstanceHolder = (n = class {
        }, n.instance = new o(o.INTERVAL), n);
        e2["default"] = o;
      }, 2323: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(4736));
        const s = i2(r2(6667));
        var a;
        (function(t3) {
          let e3 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
          let r3 = (0, n.default)("9223372036854775808");
          function i3(t4) {
            let e4 = a2(t4);
            let r4 = o(e4);
            let i4 = r4[1];
            let n2 = r4[0];
            return u(i4) + u(n2);
          }
          t3.to_getui = i3;
          function a2(t4) {
            let e4 = s.default.md5Hex(t4);
            let r4 = c(e4);
            r4[6] &= 15;
            r4[6] |= 48;
            r4[8] &= 63;
            r4[8] |= 128;
            return r4;
          }
          function o(t4) {
            let e4 = (0, n.default)(0);
            let r4 = (0, n.default)(0);
            for (let r5 = 0; r5 < 8; r5++)
              e4 = e4.multiply(256).plus((0, n.default)(255 & t4[r5]));
            for (let e5 = 8; e5 < 16; e5++)
              r4 = r4.multiply(256).plus((0, n.default)(255 & t4[e5]));
            return [e4, r4];
          }
          function u(t4) {
            if (t4 >= r3)
              t4 = r3.multiply(2).minus(t4);
            let i4 = "";
            for (; t4 > (0, n.default)(0); t4 = t4.divide(62))
              i4 += e3.charAt(Number(t4.divmod(62).remainder));
            return i4;
          }
          function c(t4) {
            let e4 = t4.length;
            if (e4 % 2 != 0)
              return [];
            let r4 = new Array();
            for (let i4 = 0; i4 < e4; i4 += 2)
              r4.push(parseInt(t4.substring(i4, i4 + 2), 16));
            return r4;
          }
        })(a || (a = {}));
        e2["default"] = a;
      }, 6667: function(t2, e2, r2) {
        var i2 = this && this.__importDefault || function(t3) {
          return t3 && t3.__esModule ? t3 : { default: t3 };
        };
        Object.defineProperty(e2, "__esModule", { value: true });
        const n = i2(r2(2620));
        const s = i2(r2(1354));
        const a = i2(r2(6379));
        var o;
        (function(t3) {
          let e3;
          let r3;
          let i3;
          let o2;
          let u = new n.default();
          let c = s.default.mode.CBC;
          let l = s.default.pad.Pkcs7;
          let f = s.default.AES;
          t3.algorithmMap = /* @__PURE__ */ new Map([["aes", s.default.AES]]);
          t3.modeMap = /* @__PURE__ */ new Map([["cbc", s.default.mode.CBC], ["cfb", s.default.mode.CFB], ["cfb128", s.default.mode.CFB], ["ecb", s.default.mode.ECB], ["ofb", s.default.mode.OFB]]);
          t3.paddingMap = /* @__PURE__ */ new Map([["nopadding", s.default.pad.NoPadding], ["pkcs7", s.default.pad.Pkcs7]]);
          function h() {
            e3 = s.default.MD5(new Date().getTime().toString());
            r3 = s.default.MD5(e3);
            u.setPublicKey(a.default.publicKey);
            e3.toString(s.default.enc.Hex);
            r3.toString(s.default.enc.Hex);
            i3 = u.encrypt(e3.toString(s.default.enc.Hex));
            o2 = u.encrypt(r3.toString(s.default.enc.Hex));
          }
          t3.resetKey = h;
          function d(e4, r4, i4) {
            f = t3.algorithmMap.get(e4);
            c = t3.modeMap.get(r4);
            l = t3.paddingMap.get(i4);
          }
          t3.setEncryptParams = d;
          function v(t4) {
            return f.encrypt(t4, e3, { iv: r3, mode: c, padding: l }).toString();
          }
          t3.encrypt = v;
          function p(t4) {
            return f.decrypt(t4, e3, { iv: r3, mode: c, padding: l }).toString(s.default.enc.Utf8);
          }
          t3.decrypt = p;
          function g(t4) {
            return s.default.SHA256(t4).toString(s.default.enc.Base64);
          }
          t3.sha256 = g;
          function y(t4) {
            return s.default.MD5(t4).toString(s.default.enc.Hex);
          }
          t3.md5Hex = y;
          function m() {
            return i3 ? i3 : "";
          }
          t3.getEncryptedSecretKey = m;
          function w() {
            return o2 ? o2 : "";
          }
          t3.getEncryptedIV = w;
        })(o || (o = {}));
        e2["default"] = o;
      }, 529: (t2, e2) => {
        Object.defineProperty(e2, "__esModule", { value: true });
        class r2 {
          static info(...t3) {
            if (this.debugMode)
              console.info(`[GtPush]`, t3);
          }
          static warn(...t3) {
            console.warn(`[GtPush]`, t3);
          }
          static error(...t3) {
            console.error(`[GtPush]`, t3);
          }
        }
        r2.debugMode = false;
        e2["default"] = r2;
      }, 2620: (t2, e2, r2) => {
        r2.r(e2);
        r2.d(e2, { JSEncrypt: () => wt, default: () => _t });
        var i2 = "0123456789abcdefghijklmnopqrstuvwxyz";
        function n(t3) {
          return i2.charAt(t3);
        }
        function s(t3, e3) {
          return t3 & e3;
        }
        function a(t3, e3) {
          return t3 | e3;
        }
        function o(t3, e3) {
          return t3 ^ e3;
        }
        function u(t3, e3) {
          return t3 & ~e3;
        }
        function c(t3) {
          if (0 == t3)
            return -1;
          var e3 = 0;
          if (0 == (65535 & t3)) {
            t3 >>= 16;
            e3 += 16;
          }
          if (0 == (255 & t3)) {
            t3 >>= 8;
            e3 += 8;
          }
          if (0 == (15 & t3)) {
            t3 >>= 4;
            e3 += 4;
          }
          if (0 == (3 & t3)) {
            t3 >>= 2;
            e3 += 2;
          }
          if (0 == (1 & t3))
            ++e3;
          return e3;
        }
        function l(t3) {
          var e3 = 0;
          while (0 != t3) {
            t3 &= t3 - 1;
            ++e3;
          }
          return e3;
        }
        var f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var h = "=";
        function d(t3) {
          var e3;
          var r3;
          var i3 = "";
          for (e3 = 0; e3 + 3 <= t3.length; e3 += 3) {
            r3 = parseInt(t3.substring(e3, e3 + 3), 16);
            i3 += f.charAt(r3 >> 6) + f.charAt(63 & r3);
          }
          if (e3 + 1 == t3.length) {
            r3 = parseInt(t3.substring(e3, e3 + 1), 16);
            i3 += f.charAt(r3 << 2);
          } else if (e3 + 2 == t3.length) {
            r3 = parseInt(t3.substring(e3, e3 + 2), 16);
            i3 += f.charAt(r3 >> 2) + f.charAt((3 & r3) << 4);
          }
          while ((3 & i3.length) > 0)
            i3 += h;
          return i3;
        }
        function v(t3) {
          var e3 = "";
          var r3;
          var i3 = 0;
          var s2 = 0;
          for (r3 = 0; r3 < t3.length; ++r3) {
            if (t3.charAt(r3) == h)
              break;
            var a2 = f.indexOf(t3.charAt(r3));
            if (a2 < 0)
              continue;
            if (0 == i3) {
              e3 += n(a2 >> 2);
              s2 = 3 & a2;
              i3 = 1;
            } else if (1 == i3) {
              e3 += n(s2 << 2 | a2 >> 4);
              s2 = 15 & a2;
              i3 = 2;
            } else if (2 == i3) {
              e3 += n(s2);
              e3 += n(a2 >> 2);
              s2 = 3 & a2;
              i3 = 3;
            } else {
              e3 += n(s2 << 2 | a2 >> 4);
              e3 += n(15 & a2);
              i3 = 0;
            }
          }
          if (1 == i3)
            e3 += n(s2 << 2);
          return e3;
        }
        var g;
        var y = { decode: function(t3) {
          var e3;
          if (void 0 === g) {
            var r3 = "0123456789ABCDEF";
            var i3 = " \f\n\r	 \u2028\u2029";
            g = {};
            for (e3 = 0; e3 < 16; ++e3)
              g[r3.charAt(e3)] = e3;
            r3 = r3.toLowerCase();
            for (e3 = 10; e3 < 16; ++e3)
              g[r3.charAt(e3)] = e3;
            for (e3 = 0; e3 < i3.length; ++e3)
              g[i3.charAt(e3)] = -1;
          }
          var n2 = [];
          var s2 = 0;
          var a2 = 0;
          for (e3 = 0; e3 < t3.length; ++e3) {
            var o2 = t3.charAt(e3);
            if ("=" == o2)
              break;
            o2 = g[o2];
            if (-1 == o2)
              continue;
            if (void 0 === o2)
              throw new Error("Illegal character at offset " + e3);
            s2 |= o2;
            if (++a2 >= 2) {
              n2[n2.length] = s2;
              s2 = 0;
              a2 = 0;
            } else
              s2 <<= 4;
          }
          if (a2)
            throw new Error("Hex encoding incomplete: 4 bits missing");
          return n2;
        } };
        var m;
        var w = { decode: function(t3) {
          var e3;
          if (void 0 === m) {
            var r3 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            var i3 = "= \f\n\r	 \u2028\u2029";
            m = /* @__PURE__ */ Object.create(null);
            for (e3 = 0; e3 < 64; ++e3)
              m[r3.charAt(e3)] = e3;
            m["-"] = 62;
            m["_"] = 63;
            for (e3 = 0; e3 < i3.length; ++e3)
              m[i3.charAt(e3)] = -1;
          }
          var n2 = [];
          var s2 = 0;
          var a2 = 0;
          for (e3 = 0; e3 < t3.length; ++e3) {
            var o2 = t3.charAt(e3);
            if ("=" == o2)
              break;
            o2 = m[o2];
            if (-1 == o2)
              continue;
            if (void 0 === o2)
              throw new Error("Illegal character at offset " + e3);
            s2 |= o2;
            if (++a2 >= 4) {
              n2[n2.length] = s2 >> 16;
              n2[n2.length] = s2 >> 8 & 255;
              n2[n2.length] = 255 & s2;
              s2 = 0;
              a2 = 0;
            } else
              s2 <<= 6;
          }
          switch (a2) {
            case 1:
              throw new Error("Base64 encoding incomplete: at least 2 bits missing");
            case 2:
              n2[n2.length] = s2 >> 10;
              break;
            case 3:
              n2[n2.length] = s2 >> 16;
              n2[n2.length] = s2 >> 8 & 255;
              break;
          }
          return n2;
        }, re: /-----BEGIN [^-]+-----([A-Za-z0-9+\/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+\/=\s]+)====/, unarmor: function(t3) {
          var e3 = w.re.exec(t3);
          if (e3)
            if (e3[1])
              t3 = e3[1];
            else if (e3[2])
              t3 = e3[2];
            else
              throw new Error("RegExp out of sync");
          return w.decode(t3);
        } };
        var _ = 1e13;
        var S = function() {
          function t3(t4) {
            this.buf = [+t4 || 0];
          }
          t3.prototype.mulAdd = function(t4, e3) {
            var r3 = this.buf;
            var i3 = r3.length;
            var n2;
            var s2;
            for (n2 = 0; n2 < i3; ++n2) {
              s2 = r3[n2] * t4 + e3;
              if (s2 < _)
                e3 = 0;
              else {
                e3 = 0 | s2 / _;
                s2 -= e3 * _;
              }
              r3[n2] = s2;
            }
            if (e3 > 0)
              r3[n2] = e3;
          };
          t3.prototype.sub = function(t4) {
            var e3 = this.buf;
            var r3 = e3.length;
            var i3;
            var n2;
            for (i3 = 0; i3 < r3; ++i3) {
              n2 = e3[i3] - t4;
              if (n2 < 0) {
                n2 += _;
                t4 = 1;
              } else
                t4 = 0;
              e3[i3] = n2;
            }
            while (0 === e3[e3.length - 1])
              e3.pop();
          };
          t3.prototype.toString = function(t4) {
            if (10 != (t4 || 10))
              throw new Error("only base 10 is supported");
            var e3 = this.buf;
            var r3 = e3[e3.length - 1].toString();
            for (var i3 = e3.length - 2; i3 >= 0; --i3)
              r3 += (_ + e3[i3]).toString().substring(1);
            return r3;
          };
          t3.prototype.valueOf = function() {
            var t4 = this.buf;
            var e3 = 0;
            for (var r3 = t4.length - 1; r3 >= 0; --r3)
              e3 = e3 * _ + t4[r3];
            return e3;
          };
          t3.prototype.simplify = function() {
            var t4 = this.buf;
            return 1 == t4.length ? t4[0] : this;
          };
          return t3;
        }();
        var b = "…";
        var E = /^(\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
        var D = /^(\d\d\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
        function T(t3, e3) {
          if (t3.length > e3)
            t3 = t3.substring(0, e3) + b;
          return t3;
        }
        var M = function() {
          function t3(e3, r3) {
            this.hexDigits = "0123456789ABCDEF";
            if (e3 instanceof t3) {
              this.enc = e3.enc;
              this.pos = e3.pos;
            } else {
              this.enc = e3;
              this.pos = r3;
            }
          }
          t3.prototype.get = function(t4) {
            if (void 0 === t4)
              t4 = this.pos++;
            if (t4 >= this.enc.length)
              throw new Error("Requesting byte offset " + t4 + " on a stream of length " + this.enc.length);
            return "string" === typeof this.enc ? this.enc.charCodeAt(t4) : this.enc[t4];
          };
          t3.prototype.hexByte = function(t4) {
            return this.hexDigits.charAt(t4 >> 4 & 15) + this.hexDigits.charAt(15 & t4);
          };
          t3.prototype.hexDump = function(t4, e3, r3) {
            var i3 = "";
            for (var n2 = t4; n2 < e3; ++n2) {
              i3 += this.hexByte(this.get(n2));
              if (true !== r3)
                switch (15 & n2) {
                  case 7:
                    i3 += "  ";
                    break;
                  case 15:
                    i3 += "\n";
                    break;
                  default:
                    i3 += " ";
                }
            }
            return i3;
          };
          t3.prototype.isASCII = function(t4, e3) {
            for (var r3 = t4; r3 < e3; ++r3) {
              var i3 = this.get(r3);
              if (i3 < 32 || i3 > 176)
                return false;
            }
            return true;
          };
          t3.prototype.parseStringISO = function(t4, e3) {
            var r3 = "";
            for (var i3 = t4; i3 < e3; ++i3)
              r3 += String.fromCharCode(this.get(i3));
            return r3;
          };
          t3.prototype.parseStringUTF = function(t4, e3) {
            var r3 = "";
            for (var i3 = t4; i3 < e3; ) {
              var n2 = this.get(i3++);
              if (n2 < 128)
                r3 += String.fromCharCode(n2);
              else if (n2 > 191 && n2 < 224)
                r3 += String.fromCharCode((31 & n2) << 6 | 63 & this.get(i3++));
              else
                r3 += String.fromCharCode((15 & n2) << 12 | (63 & this.get(i3++)) << 6 | 63 & this.get(i3++));
            }
            return r3;
          };
          t3.prototype.parseStringBMP = function(t4, e3) {
            var r3 = "";
            var i3;
            var n2;
            for (var s2 = t4; s2 < e3; ) {
              i3 = this.get(s2++);
              n2 = this.get(s2++);
              r3 += String.fromCharCode(i3 << 8 | n2);
            }
            return r3;
          };
          t3.prototype.parseTime = function(t4, e3, r3) {
            var i3 = this.parseStringISO(t4, e3);
            var n2 = (r3 ? E : D).exec(i3);
            if (!n2)
              return "Unrecognized time: " + i3;
            if (r3) {
              n2[1] = +n2[1];
              n2[1] += +n2[1] < 70 ? 2e3 : 1900;
            }
            i3 = n2[1] + "-" + n2[2] + "-" + n2[3] + " " + n2[4];
            if (n2[5]) {
              i3 += ":" + n2[5];
              if (n2[6]) {
                i3 += ":" + n2[6];
                if (n2[7])
                  i3 += "." + n2[7];
              }
            }
            if (n2[8]) {
              i3 += " UTC";
              if ("Z" != n2[8]) {
                i3 += n2[8];
                if (n2[9])
                  i3 += ":" + n2[9];
              }
            }
            return i3;
          };
          t3.prototype.parseInteger = function(t4, e3) {
            var r3 = this.get(t4);
            var i3 = r3 > 127;
            var n2 = i3 ? 255 : 0;
            var s2;
            var a2 = "";
            while (r3 == n2 && ++t4 < e3)
              r3 = this.get(t4);
            s2 = e3 - t4;
            if (0 === s2)
              return i3 ? -1 : 0;
            if (s2 > 4) {
              a2 = r3;
              s2 <<= 3;
              while (0 == (128 & (+a2 ^ n2))) {
                a2 = +a2 << 1;
                --s2;
              }
              a2 = "(" + s2 + " bit)\n";
            }
            if (i3)
              r3 -= 256;
            var o2 = new S(r3);
            for (var u2 = t4 + 1; u2 < e3; ++u2)
              o2.mulAdd(256, this.get(u2));
            return a2 + o2.toString();
          };
          t3.prototype.parseBitString = function(t4, e3, r3) {
            var i3 = this.get(t4);
            var n2 = (e3 - t4 - 1 << 3) - i3;
            var s2 = "(" + n2 + " bit)\n";
            var a2 = "";
            for (var o2 = t4 + 1; o2 < e3; ++o2) {
              var u2 = this.get(o2);
              var c2 = o2 == e3 - 1 ? i3 : 0;
              for (var l2 = 7; l2 >= c2; --l2)
                a2 += u2 >> l2 & 1 ? "1" : "0";
              if (a2.length > r3)
                return s2 + T(a2, r3);
            }
            return s2 + a2;
          };
          t3.prototype.parseOctetString = function(t4, e3, r3) {
            if (this.isASCII(t4, e3))
              return T(this.parseStringISO(t4, e3), r3);
            var i3 = e3 - t4;
            var n2 = "(" + i3 + " byte)\n";
            r3 /= 2;
            if (i3 > r3)
              e3 = t4 + r3;
            for (var s2 = t4; s2 < e3; ++s2)
              n2 += this.hexByte(this.get(s2));
            if (i3 > r3)
              n2 += b;
            return n2;
          };
          t3.prototype.parseOID = function(t4, e3, r3) {
            var i3 = "";
            var n2 = new S();
            var s2 = 0;
            for (var a2 = t4; a2 < e3; ++a2) {
              var o2 = this.get(a2);
              n2.mulAdd(128, 127 & o2);
              s2 += 7;
              if (!(128 & o2)) {
                if ("" === i3) {
                  n2 = n2.simplify();
                  if (n2 instanceof S) {
                    n2.sub(80);
                    i3 = "2." + n2.toString();
                  } else {
                    var u2 = n2 < 80 ? n2 < 40 ? 0 : 1 : 2;
                    i3 = u2 + "." + (n2 - 40 * u2);
                  }
                } else
                  i3 += "." + n2.toString();
                if (i3.length > r3)
                  return T(i3, r3);
                n2 = new S();
                s2 = 0;
              }
            }
            if (s2 > 0)
              i3 += ".incomplete";
            return i3;
          };
          return t3;
        }();
        var I = function() {
          function t3(t4, e3, r3, i3, n2) {
            if (!(i3 instanceof A))
              throw new Error("Invalid tag value.");
            this.stream = t4;
            this.header = e3;
            this.length = r3;
            this.tag = i3;
            this.sub = n2;
          }
          t3.prototype.typeName = function() {
            switch (this.tag.tagClass) {
              case 0:
                switch (this.tag.tagNumber) {
                  case 0:
                    return "EOC";
                  case 1:
                    return "BOOLEAN";
                  case 2:
                    return "INTEGER";
                  case 3:
                    return "BIT_STRING";
                  case 4:
                    return "OCTET_STRING";
                  case 5:
                    return "NULL";
                  case 6:
                    return "OBJECT_IDENTIFIER";
                  case 7:
                    return "ObjectDescriptor";
                  case 8:
                    return "EXTERNAL";
                  case 9:
                    return "REAL";
                  case 10:
                    return "ENUMERATED";
                  case 11:
                    return "EMBEDDED_PDV";
                  case 12:
                    return "UTF8String";
                  case 16:
                    return "SEQUENCE";
                  case 17:
                    return "SET";
                  case 18:
                    return "NumericString";
                  case 19:
                    return "PrintableString";
                  case 20:
                    return "TeletexString";
                  case 21:
                    return "VideotexString";
                  case 22:
                    return "IA5String";
                  case 23:
                    return "UTCTime";
                  case 24:
                    return "GeneralizedTime";
                  case 25:
                    return "GraphicString";
                  case 26:
                    return "VisibleString";
                  case 27:
                    return "GeneralString";
                  case 28:
                    return "UniversalString";
                  case 30:
                    return "BMPString";
                }
                return "Universal_" + this.tag.tagNumber.toString();
              case 1:
                return "Application_" + this.tag.tagNumber.toString();
              case 2:
                return "[" + this.tag.tagNumber.toString() + "]";
              case 3:
                return "Private_" + this.tag.tagNumber.toString();
            }
          };
          t3.prototype.content = function(t4) {
            if (void 0 === this.tag)
              return null;
            if (void 0 === t4)
              t4 = 1 / 0;
            var e3 = this.posContent();
            var r3 = Math.abs(this.length);
            if (!this.tag.isUniversal()) {
              if (null !== this.sub)
                return "(" + this.sub.length + " elem)";
              return this.stream.parseOctetString(e3, e3 + r3, t4);
            }
            switch (this.tag.tagNumber) {
              case 1:
                return 0 === this.stream.get(e3) ? "false" : "true";
              case 2:
                return this.stream.parseInteger(e3, e3 + r3);
              case 3:
                return this.sub ? "(" + this.sub.length + " elem)" : this.stream.parseBitString(e3, e3 + r3, t4);
              case 4:
                return this.sub ? "(" + this.sub.length + " elem)" : this.stream.parseOctetString(e3, e3 + r3, t4);
              case 6:
                return this.stream.parseOID(e3, e3 + r3, t4);
              case 16:
              case 17:
                if (null !== this.sub)
                  return "(" + this.sub.length + " elem)";
                else
                  return "(no elem)";
              case 12:
                return T(this.stream.parseStringUTF(e3, e3 + r3), t4);
              case 18:
              case 19:
              case 20:
              case 21:
              case 22:
              case 26:
                return T(this.stream.parseStringISO(e3, e3 + r3), t4);
              case 30:
                return T(this.stream.parseStringBMP(e3, e3 + r3), t4);
              case 23:
              case 24:
                return this.stream.parseTime(e3, e3 + r3, 23 == this.tag.tagNumber);
            }
            return null;
          };
          t3.prototype.toString = function() {
            return this.typeName() + "@" + this.stream.pos + "[header:" + this.header + ",length:" + this.length + ",sub:" + (null === this.sub ? "null" : this.sub.length) + "]";
          };
          t3.prototype.toPrettyString = function(t4) {
            if (void 0 === t4)
              t4 = "";
            var e3 = t4 + this.typeName() + " @" + this.stream.pos;
            if (this.length >= 0)
              e3 += "+";
            e3 += this.length;
            if (this.tag.tagConstructed)
              e3 += " (constructed)";
            else if (this.tag.isUniversal() && (3 == this.tag.tagNumber || 4 == this.tag.tagNumber) && null !== this.sub)
              e3 += " (encapsulates)";
            e3 += "\n";
            if (null !== this.sub) {
              t4 += "  ";
              for (var r3 = 0, i3 = this.sub.length; r3 < i3; ++r3)
                e3 += this.sub[r3].toPrettyString(t4);
            }
            return e3;
          };
          t3.prototype.posStart = function() {
            return this.stream.pos;
          };
          t3.prototype.posContent = function() {
            return this.stream.pos + this.header;
          };
          t3.prototype.posEnd = function() {
            return this.stream.pos + this.header + Math.abs(this.length);
          };
          t3.prototype.toHexString = function() {
            return this.stream.hexDump(this.posStart(), this.posEnd(), true);
          };
          t3.decodeLength = function(t4) {
            var e3 = t4.get();
            var r3 = 127 & e3;
            if (r3 == e3)
              return r3;
            if (r3 > 6)
              throw new Error("Length over 48 bits not supported at position " + (t4.pos - 1));
            if (0 === r3)
              return null;
            e3 = 0;
            for (var i3 = 0; i3 < r3; ++i3)
              e3 = 256 * e3 + t4.get();
            return e3;
          };
          t3.prototype.getHexStringValue = function() {
            var t4 = this.toHexString();
            var e3 = 2 * this.header;
            var r3 = 2 * this.length;
            return t4.substr(e3, r3);
          };
          t3.decode = function(e3) {
            var r3;
            if (!(e3 instanceof M))
              r3 = new M(e3, 0);
            else
              r3 = e3;
            var i3 = new M(r3);
            var n2 = new A(r3);
            var s2 = t3.decodeLength(r3);
            var a2 = r3.pos;
            var o2 = a2 - i3.pos;
            var u2 = null;
            var c2 = function() {
              var e4 = [];
              if (null !== s2) {
                var i4 = a2 + s2;
                while (r3.pos < i4)
                  e4[e4.length] = t3.decode(r3);
                if (r3.pos != i4)
                  throw new Error("Content size is not correct for container starting at offset " + a2);
              } else
                try {
                  for (; ; ) {
                    var n3 = t3.decode(r3);
                    if (n3.tag.isEOC())
                      break;
                    e4[e4.length] = n3;
                  }
                  s2 = a2 - r3.pos;
                } catch (t4) {
                  throw new Error("Exception while decoding undefined length content: " + t4);
                }
              return e4;
            };
            if (n2.tagConstructed)
              u2 = c2();
            else if (n2.isUniversal() && (3 == n2.tagNumber || 4 == n2.tagNumber))
              try {
                if (3 == n2.tagNumber) {
                  if (0 != r3.get())
                    throw new Error("BIT STRINGs with unused bits cannot encapsulate.");
                }
                u2 = c2();
                for (var l2 = 0; l2 < u2.length; ++l2)
                  if (u2[l2].tag.isEOC())
                    throw new Error("EOC is not supposed to be actual content.");
              } catch (t4) {
                u2 = null;
              }
            if (null === u2) {
              if (null === s2)
                throw new Error("We can't skip over an invalid tag with undefined length at offset " + a2);
              r3.pos = a2 + Math.abs(s2);
            }
            return new t3(i3, o2, s2, n2, u2);
          };
          return t3;
        }();
        var A = function() {
          function t3(t4) {
            var e3 = t4.get();
            this.tagClass = e3 >> 6;
            this.tagConstructed = 0 !== (32 & e3);
            this.tagNumber = 31 & e3;
            if (31 == this.tagNumber) {
              var r3 = new S();
              do {
                e3 = t4.get();
                r3.mulAdd(128, 127 & e3);
              } while (128 & e3);
              this.tagNumber = r3.simplify();
            }
          }
          t3.prototype.isUniversal = function() {
            return 0 === this.tagClass;
          };
          t3.prototype.isEOC = function() {
            return 0 === this.tagClass && 0 === this.tagNumber;
          };
          return t3;
        }();
        var x;
        var R = 244837814094590;
        var B = 15715070 == (16777215 & R);
        var O = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
        var k = (1 << 26) / O[O.length - 1];
        var C = function() {
          function t3(t4, e3, r3) {
            if (null != t4)
              if ("number" == typeof t4)
                this.fromNumber(t4, e3, r3);
              else if (null == e3 && "string" != typeof t4)
                this.fromString(t4, 256);
              else
                this.fromString(t4, e3);
          }
          t3.prototype.toString = function(t4) {
            if (this.s < 0)
              return "-" + this.negate().toString(t4);
            var e3;
            if (16 == t4)
              e3 = 4;
            else if (8 == t4)
              e3 = 3;
            else if (2 == t4)
              e3 = 1;
            else if (32 == t4)
              e3 = 5;
            else if (4 == t4)
              e3 = 2;
            else
              return this.toRadix(t4);
            var r3 = (1 << e3) - 1;
            var i3;
            var s2 = false;
            var a2 = "";
            var o2 = this.t;
            var u2 = this.DB - o2 * this.DB % e3;
            if (o2-- > 0) {
              if (u2 < this.DB && (i3 = this[o2] >> u2) > 0) {
                s2 = true;
                a2 = n(i3);
              }
              while (o2 >= 0) {
                if (u2 < e3) {
                  i3 = (this[o2] & (1 << u2) - 1) << e3 - u2;
                  i3 |= this[--o2] >> (u2 += this.DB - e3);
                } else {
                  i3 = this[o2] >> (u2 -= e3) & r3;
                  if (u2 <= 0) {
                    u2 += this.DB;
                    --o2;
                  }
                }
                if (i3 > 0)
                  s2 = true;
                if (s2)
                  a2 += n(i3);
              }
            }
            return s2 ? a2 : "0";
          };
          t3.prototype.negate = function() {
            var e3 = H();
            t3.ZERO.subTo(this, e3);
            return e3;
          };
          t3.prototype.abs = function() {
            return this.s < 0 ? this.negate() : this;
          };
          t3.prototype.compareTo = function(t4) {
            var e3 = this.s - t4.s;
            if (0 != e3)
              return e3;
            var r3 = this.t;
            e3 = r3 - t4.t;
            if (0 != e3)
              return this.s < 0 ? -e3 : e3;
            while (--r3 >= 0)
              if (0 != (e3 = this[r3] - t4[r3]))
                return e3;
            return 0;
          };
          t3.prototype.bitLength = function() {
            if (this.t <= 0)
              return 0;
            return this.DB * (this.t - 1) + W(this[this.t - 1] ^ this.s & this.DM);
          };
          t3.prototype.mod = function(e3) {
            var r3 = H();
            this.abs().divRemTo(e3, null, r3);
            if (this.s < 0 && r3.compareTo(t3.ZERO) > 0)
              e3.subTo(r3, r3);
            return r3;
          };
          t3.prototype.modPowInt = function(t4, e3) {
            var r3;
            if (t4 < 256 || e3.isEven())
              r3 = new P(e3);
            else
              r3 = new V(e3);
            return this.exp(t4, r3);
          };
          t3.prototype.clone = function() {
            var t4 = H();
            this.copyTo(t4);
            return t4;
          };
          t3.prototype.intValue = function() {
            if (this.s < 0) {
              if (1 == this.t)
                return this[0] - this.DV;
              else if (0 == this.t)
                return -1;
            } else if (1 == this.t)
              return this[0];
            else if (0 == this.t)
              return 0;
            return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
          };
          t3.prototype.byteValue = function() {
            return 0 == this.t ? this.s : this[0] << 24 >> 24;
          };
          t3.prototype.shortValue = function() {
            return 0 == this.t ? this.s : this[0] << 16 >> 16;
          };
          t3.prototype.signum = function() {
            if (this.s < 0)
              return -1;
            else if (this.t <= 0 || 1 == this.t && this[0] <= 0)
              return 0;
            else
              return 1;
          };
          t3.prototype.toByteArray = function() {
            var t4 = this.t;
            var e3 = [];
            e3[0] = this.s;
            var r3 = this.DB - t4 * this.DB % 8;
            var i3;
            var n2 = 0;
            if (t4-- > 0) {
              if (r3 < this.DB && (i3 = this[t4] >> r3) != (this.s & this.DM) >> r3)
                e3[n2++] = i3 | this.s << this.DB - r3;
              while (t4 >= 0) {
                if (r3 < 8) {
                  i3 = (this[t4] & (1 << r3) - 1) << 8 - r3;
                  i3 |= this[--t4] >> (r3 += this.DB - 8);
                } else {
                  i3 = this[t4] >> (r3 -= 8) & 255;
                  if (r3 <= 0) {
                    r3 += this.DB;
                    --t4;
                  }
                }
                if (0 != (128 & i3))
                  i3 |= -256;
                if (0 == n2 && (128 & this.s) != (128 & i3))
                  ++n2;
                if (n2 > 0 || i3 != this.s)
                  e3[n2++] = i3;
              }
            }
            return e3;
          };
          t3.prototype.equals = function(t4) {
            return 0 == this.compareTo(t4);
          };
          t3.prototype.min = function(t4) {
            return this.compareTo(t4) < 0 ? this : t4;
          };
          t3.prototype.max = function(t4) {
            return this.compareTo(t4) > 0 ? this : t4;
          };
          t3.prototype.and = function(t4) {
            var e3 = H();
            this.bitwiseTo(t4, s, e3);
            return e3;
          };
          t3.prototype.or = function(t4) {
            var e3 = H();
            this.bitwiseTo(t4, a, e3);
            return e3;
          };
          t3.prototype.xor = function(t4) {
            var e3 = H();
            this.bitwiseTo(t4, o, e3);
            return e3;
          };
          t3.prototype.andNot = function(t4) {
            var e3 = H();
            this.bitwiseTo(t4, u, e3);
            return e3;
          };
          t3.prototype.not = function() {
            var t4 = H();
            for (var e3 = 0; e3 < this.t; ++e3)
              t4[e3] = this.DM & ~this[e3];
            t4.t = this.t;
            t4.s = ~this.s;
            return t4;
          };
          t3.prototype.shiftLeft = function(t4) {
            var e3 = H();
            if (t4 < 0)
              this.rShiftTo(-t4, e3);
            else
              this.lShiftTo(t4, e3);
            return e3;
          };
          t3.prototype.shiftRight = function(t4) {
            var e3 = H();
            if (t4 < 0)
              this.lShiftTo(-t4, e3);
            else
              this.rShiftTo(t4, e3);
            return e3;
          };
          t3.prototype.getLowestSetBit = function() {
            for (var t4 = 0; t4 < this.t; ++t4)
              if (0 != this[t4])
                return t4 * this.DB + c(this[t4]);
            if (this.s < 0)
              return this.t * this.DB;
            return -1;
          };
          t3.prototype.bitCount = function() {
            var t4 = 0;
            var e3 = this.s & this.DM;
            for (var r3 = 0; r3 < this.t; ++r3)
              t4 += l(this[r3] ^ e3);
            return t4;
          };
          t3.prototype.testBit = function(t4) {
            var e3 = Math.floor(t4 / this.DB);
            if (e3 >= this.t)
              return 0 != this.s;
            return 0 != (this[e3] & 1 << t4 % this.DB);
          };
          t3.prototype.setBit = function(t4) {
            return this.changeBit(t4, a);
          };
          t3.prototype.clearBit = function(t4) {
            return this.changeBit(t4, u);
          };
          t3.prototype.flipBit = function(t4) {
            return this.changeBit(t4, o);
          };
          t3.prototype.add = function(t4) {
            var e3 = H();
            this.addTo(t4, e3);
            return e3;
          };
          t3.prototype.subtract = function(t4) {
            var e3 = H();
            this.subTo(t4, e3);
            return e3;
          };
          t3.prototype.multiply = function(t4) {
            var e3 = H();
            this.multiplyTo(t4, e3);
            return e3;
          };
          t3.prototype.divide = function(t4) {
            var e3 = H();
            this.divRemTo(t4, e3, null);
            return e3;
          };
          t3.prototype.remainder = function(t4) {
            var e3 = H();
            this.divRemTo(t4, null, e3);
            return e3;
          };
          t3.prototype.divideAndRemainder = function(t4) {
            var e3 = H();
            var r3 = H();
            this.divRemTo(t4, e3, r3);
            return [e3, r3];
          };
          t3.prototype.modPow = function(t4, e3) {
            var r3 = t4.bitLength();
            var i3;
            var n2 = Y(1);
            var s2;
            if (r3 <= 0)
              return n2;
            else if (r3 < 18)
              i3 = 1;
            else if (r3 < 48)
              i3 = 3;
            else if (r3 < 144)
              i3 = 4;
            else if (r3 < 768)
              i3 = 5;
            else
              i3 = 6;
            if (r3 < 8)
              s2 = new P(e3);
            else if (e3.isEven())
              s2 = new L(e3);
            else
              s2 = new V(e3);
            var a2 = [];
            var o2 = 3;
            var u2 = i3 - 1;
            var c2 = (1 << i3) - 1;
            a2[1] = s2.convert(this);
            if (i3 > 1) {
              var l2 = H();
              s2.sqrTo(a2[1], l2);
              while (o2 <= c2) {
                a2[o2] = H();
                s2.mulTo(l2, a2[o2 - 2], a2[o2]);
                o2 += 2;
              }
            }
            var f2 = t4.t - 1;
            var h2;
            var d2 = true;
            var v2 = H();
            var p;
            r3 = W(t4[f2]) - 1;
            while (f2 >= 0) {
              if (r3 >= u2)
                h2 = t4[f2] >> r3 - u2 & c2;
              else {
                h2 = (t4[f2] & (1 << r3 + 1) - 1) << u2 - r3;
                if (f2 > 0)
                  h2 |= t4[f2 - 1] >> this.DB + r3 - u2;
              }
              o2 = i3;
              while (0 == (1 & h2)) {
                h2 >>= 1;
                --o2;
              }
              if ((r3 -= o2) < 0) {
                r3 += this.DB;
                --f2;
              }
              if (d2) {
                a2[h2].copyTo(n2);
                d2 = false;
              } else {
                while (o2 > 1) {
                  s2.sqrTo(n2, v2);
                  s2.sqrTo(v2, n2);
                  o2 -= 2;
                }
                if (o2 > 0)
                  s2.sqrTo(n2, v2);
                else {
                  p = n2;
                  n2 = v2;
                  v2 = p;
                }
                s2.mulTo(v2, a2[h2], n2);
              }
              while (f2 >= 0 && 0 == (t4[f2] & 1 << r3)) {
                s2.sqrTo(n2, v2);
                p = n2;
                n2 = v2;
                v2 = p;
                if (--r3 < 0) {
                  r3 = this.DB - 1;
                  --f2;
                }
              }
            }
            return s2.revert(n2);
          };
          t3.prototype.modInverse = function(e3) {
            var r3 = e3.isEven();
            if (this.isEven() && r3 || 0 == e3.signum())
              return t3.ZERO;
            var i3 = e3.clone();
            var n2 = this.clone();
            var s2 = Y(1);
            var a2 = Y(0);
            var o2 = Y(0);
            var u2 = Y(1);
            while (0 != i3.signum()) {
              while (i3.isEven()) {
                i3.rShiftTo(1, i3);
                if (r3) {
                  if (!s2.isEven() || !a2.isEven()) {
                    s2.addTo(this, s2);
                    a2.subTo(e3, a2);
                  }
                  s2.rShiftTo(1, s2);
                } else if (!a2.isEven())
                  a2.subTo(e3, a2);
                a2.rShiftTo(1, a2);
              }
              while (n2.isEven()) {
                n2.rShiftTo(1, n2);
                if (r3) {
                  if (!o2.isEven() || !u2.isEven()) {
                    o2.addTo(this, o2);
                    u2.subTo(e3, u2);
                  }
                  o2.rShiftTo(1, o2);
                } else if (!u2.isEven())
                  u2.subTo(e3, u2);
                u2.rShiftTo(1, u2);
              }
              if (i3.compareTo(n2) >= 0) {
                i3.subTo(n2, i3);
                if (r3)
                  s2.subTo(o2, s2);
                a2.subTo(u2, a2);
              } else {
                n2.subTo(i3, n2);
                if (r3)
                  o2.subTo(s2, o2);
                u2.subTo(a2, u2);
              }
            }
            if (0 != n2.compareTo(t3.ONE))
              return t3.ZERO;
            if (u2.compareTo(e3) >= 0)
              return u2.subtract(e3);
            if (u2.signum() < 0)
              u2.addTo(e3, u2);
            else
              return u2;
            if (u2.signum() < 0)
              return u2.add(e3);
            else
              return u2;
          };
          t3.prototype.pow = function(t4) {
            return this.exp(t4, new N());
          };
          t3.prototype.gcd = function(t4) {
            var e3 = this.s < 0 ? this.negate() : this.clone();
            var r3 = t4.s < 0 ? t4.negate() : t4.clone();
            if (e3.compareTo(r3) < 0) {
              var i3 = e3;
              e3 = r3;
              r3 = i3;
            }
            var n2 = e3.getLowestSetBit();
            var s2 = r3.getLowestSetBit();
            if (s2 < 0)
              return e3;
            if (n2 < s2)
              s2 = n2;
            if (s2 > 0) {
              e3.rShiftTo(s2, e3);
              r3.rShiftTo(s2, r3);
            }
            while (e3.signum() > 0) {
              if ((n2 = e3.getLowestSetBit()) > 0)
                e3.rShiftTo(n2, e3);
              if ((n2 = r3.getLowestSetBit()) > 0)
                r3.rShiftTo(n2, r3);
              if (e3.compareTo(r3) >= 0) {
                e3.subTo(r3, e3);
                e3.rShiftTo(1, e3);
              } else {
                r3.subTo(e3, r3);
                r3.rShiftTo(1, r3);
              }
            }
            if (s2 > 0)
              r3.lShiftTo(s2, r3);
            return r3;
          };
          t3.prototype.isProbablePrime = function(t4) {
            var e3;
            var r3 = this.abs();
            if (1 == r3.t && r3[0] <= O[O.length - 1]) {
              for (e3 = 0; e3 < O.length; ++e3)
                if (r3[0] == O[e3])
                  return true;
              return false;
            }
            if (r3.isEven())
              return false;
            e3 = 1;
            while (e3 < O.length) {
              var i3 = O[e3];
              var n2 = e3 + 1;
              while (n2 < O.length && i3 < k)
                i3 *= O[n2++];
              i3 = r3.modInt(i3);
              while (e3 < n2)
                if (i3 % O[e3++] == 0)
                  return false;
            }
            return r3.millerRabin(t4);
          };
          t3.prototype.copyTo = function(t4) {
            for (var e3 = this.t - 1; e3 >= 0; --e3)
              t4[e3] = this[e3];
            t4.t = this.t;
            t4.s = this.s;
          };
          t3.prototype.fromInt = function(t4) {
            this.t = 1;
            this.s = t4 < 0 ? -1 : 0;
            if (t4 > 0)
              this[0] = t4;
            else if (t4 < -1)
              this[0] = t4 + this.DV;
            else
              this.t = 0;
          };
          t3.prototype.fromString = function(e3, r3) {
            var i3;
            if (16 == r3)
              i3 = 4;
            else if (8 == r3)
              i3 = 3;
            else if (256 == r3)
              i3 = 8;
            else if (2 == r3)
              i3 = 1;
            else if (32 == r3)
              i3 = 5;
            else if (4 == r3)
              i3 = 2;
            else {
              this.fromRadix(e3, r3);
              return;
            }
            this.t = 0;
            this.s = 0;
            var n2 = e3.length;
            var s2 = false;
            var a2 = 0;
            while (--n2 >= 0) {
              var o2 = 8 == i3 ? 255 & +e3[n2] : G(e3, n2);
              if (o2 < 0) {
                if ("-" == e3.charAt(n2))
                  s2 = true;
                continue;
              }
              s2 = false;
              if (0 == a2)
                this[this.t++] = o2;
              else if (a2 + i3 > this.DB) {
                this[this.t - 1] |= (o2 & (1 << this.DB - a2) - 1) << a2;
                this[this.t++] = o2 >> this.DB - a2;
              } else
                this[this.t - 1] |= o2 << a2;
              a2 += i3;
              if (a2 >= this.DB)
                a2 -= this.DB;
            }
            if (8 == i3 && 0 != (128 & +e3[0])) {
              this.s = -1;
              if (a2 > 0)
                this[this.t - 1] |= (1 << this.DB - a2) - 1 << a2;
            }
            this.clamp();
            if (s2)
              t3.ZERO.subTo(this, this);
          };
          t3.prototype.clamp = function() {
            var t4 = this.s & this.DM;
            while (this.t > 0 && this[this.t - 1] == t4)
              --this.t;
          };
          t3.prototype.dlShiftTo = function(t4, e3) {
            var r3;
            for (r3 = this.t - 1; r3 >= 0; --r3)
              e3[r3 + t4] = this[r3];
            for (r3 = t4 - 1; r3 >= 0; --r3)
              e3[r3] = 0;
            e3.t = this.t + t4;
            e3.s = this.s;
          };
          t3.prototype.drShiftTo = function(t4, e3) {
            for (var r3 = t4; r3 < this.t; ++r3)
              e3[r3 - t4] = this[r3];
            e3.t = Math.max(this.t - t4, 0);
            e3.s = this.s;
          };
          t3.prototype.lShiftTo = function(t4, e3) {
            var r3 = t4 % this.DB;
            var i3 = this.DB - r3;
            var n2 = (1 << i3) - 1;
            var s2 = Math.floor(t4 / this.DB);
            var a2 = this.s << r3 & this.DM;
            for (var o2 = this.t - 1; o2 >= 0; --o2) {
              e3[o2 + s2 + 1] = this[o2] >> i3 | a2;
              a2 = (this[o2] & n2) << r3;
            }
            for (var o2 = s2 - 1; o2 >= 0; --o2)
              e3[o2] = 0;
            e3[s2] = a2;
            e3.t = this.t + s2 + 1;
            e3.s = this.s;
            e3.clamp();
          };
          t3.prototype.rShiftTo = function(t4, e3) {
            e3.s = this.s;
            var r3 = Math.floor(t4 / this.DB);
            if (r3 >= this.t) {
              e3.t = 0;
              return;
            }
            var i3 = t4 % this.DB;
            var n2 = this.DB - i3;
            var s2 = (1 << i3) - 1;
            e3[0] = this[r3] >> i3;
            for (var a2 = r3 + 1; a2 < this.t; ++a2) {
              e3[a2 - r3 - 1] |= (this[a2] & s2) << n2;
              e3[a2 - r3] = this[a2] >> i3;
            }
            if (i3 > 0)
              e3[this.t - r3 - 1] |= (this.s & s2) << n2;
            e3.t = this.t - r3;
            e3.clamp();
          };
          t3.prototype.subTo = function(t4, e3) {
            var r3 = 0;
            var i3 = 0;
            var n2 = Math.min(t4.t, this.t);
            while (r3 < n2) {
              i3 += this[r3] - t4[r3];
              e3[r3++] = i3 & this.DM;
              i3 >>= this.DB;
            }
            if (t4.t < this.t) {
              i3 -= t4.s;
              while (r3 < this.t) {
                i3 += this[r3];
                e3[r3++] = i3 & this.DM;
                i3 >>= this.DB;
              }
              i3 += this.s;
            } else {
              i3 += this.s;
              while (r3 < t4.t) {
                i3 -= t4[r3];
                e3[r3++] = i3 & this.DM;
                i3 >>= this.DB;
              }
              i3 -= t4.s;
            }
            e3.s = i3 < 0 ? -1 : 0;
            if (i3 < -1)
              e3[r3++] = this.DV + i3;
            else if (i3 > 0)
              e3[r3++] = i3;
            e3.t = r3;
            e3.clamp();
          };
          t3.prototype.multiplyTo = function(e3, r3) {
            var i3 = this.abs();
            var n2 = e3.abs();
            var s2 = i3.t;
            r3.t = s2 + n2.t;
            while (--s2 >= 0)
              r3[s2] = 0;
            for (s2 = 0; s2 < n2.t; ++s2)
              r3[s2 + i3.t] = i3.am(0, n2[s2], r3, s2, 0, i3.t);
            r3.s = 0;
            r3.clamp();
            if (this.s != e3.s)
              t3.ZERO.subTo(r3, r3);
          };
          t3.prototype.squareTo = function(t4) {
            var e3 = this.abs();
            var r3 = t4.t = 2 * e3.t;
            while (--r3 >= 0)
              t4[r3] = 0;
            for (r3 = 0; r3 < e3.t - 1; ++r3) {
              var i3 = e3.am(r3, e3[r3], t4, 2 * r3, 0, 1);
              if ((t4[r3 + e3.t] += e3.am(r3 + 1, 2 * e3[r3], t4, 2 * r3 + 1, i3, e3.t - r3 - 1)) >= e3.DV) {
                t4[r3 + e3.t] -= e3.DV;
                t4[r3 + e3.t + 1] = 1;
              }
            }
            if (t4.t > 0)
              t4[t4.t - 1] += e3.am(r3, e3[r3], t4, 2 * r3, 0, 1);
            t4.s = 0;
            t4.clamp();
          };
          t3.prototype.divRemTo = function(e3, r3, i3) {
            var n2 = e3.abs();
            if (n2.t <= 0)
              return;
            var s2 = this.abs();
            if (s2.t < n2.t) {
              if (null != r3)
                r3.fromInt(0);
              if (null != i3)
                this.copyTo(i3);
              return;
            }
            if (null == i3)
              i3 = H();
            var a2 = H();
            var o2 = this.s;
            var u2 = e3.s;
            var c2 = this.DB - W(n2[n2.t - 1]);
            if (c2 > 0) {
              n2.lShiftTo(c2, a2);
              s2.lShiftTo(c2, i3);
            } else {
              n2.copyTo(a2);
              s2.copyTo(i3);
            }
            var l2 = a2.t;
            var f2 = a2[l2 - 1];
            if (0 == f2)
              return;
            var h2 = f2 * (1 << this.F1) + (l2 > 1 ? a2[l2 - 2] >> this.F2 : 0);
            var d2 = this.FV / h2;
            var v2 = (1 << this.F1) / h2;
            var p = 1 << this.F2;
            var g2 = i3.t;
            var y2 = g2 - l2;
            var m2 = null == r3 ? H() : r3;
            a2.dlShiftTo(y2, m2);
            if (i3.compareTo(m2) >= 0) {
              i3[i3.t++] = 1;
              i3.subTo(m2, i3);
            }
            t3.ONE.dlShiftTo(l2, m2);
            m2.subTo(a2, a2);
            while (a2.t < l2)
              a2[a2.t++] = 0;
            while (--y2 >= 0) {
              var w2 = i3[--g2] == f2 ? this.DM : Math.floor(i3[g2] * d2 + (i3[g2 - 1] + p) * v2);
              if ((i3[g2] += a2.am(0, w2, i3, y2, 0, l2)) < w2) {
                a2.dlShiftTo(y2, m2);
                i3.subTo(m2, i3);
                while (i3[g2] < --w2)
                  i3.subTo(m2, i3);
              }
            }
            if (null != r3) {
              i3.drShiftTo(l2, r3);
              if (o2 != u2)
                t3.ZERO.subTo(r3, r3);
            }
            i3.t = l2;
            i3.clamp();
            if (c2 > 0)
              i3.rShiftTo(c2, i3);
            if (o2 < 0)
              t3.ZERO.subTo(i3, i3);
          };
          t3.prototype.invDigit = function() {
            if (this.t < 1)
              return 0;
            var t4 = this[0];
            if (0 == (1 & t4))
              return 0;
            var e3 = 3 & t4;
            e3 = e3 * (2 - (15 & t4) * e3) & 15;
            e3 = e3 * (2 - (255 & t4) * e3) & 255;
            e3 = e3 * (2 - ((65535 & t4) * e3 & 65535)) & 65535;
            e3 = e3 * (2 - t4 * e3 % this.DV) % this.DV;
            return e3 > 0 ? this.DV - e3 : -e3;
          };
          t3.prototype.isEven = function() {
            return 0 == (this.t > 0 ? 1 & this[0] : this.s);
          };
          t3.prototype.exp = function(e3, r3) {
            if (e3 > 4294967295 || e3 < 1)
              return t3.ONE;
            var i3 = H();
            var n2 = H();
            var s2 = r3.convert(this);
            var a2 = W(e3) - 1;
            s2.copyTo(i3);
            while (--a2 >= 0) {
              r3.sqrTo(i3, n2);
              if ((e3 & 1 << a2) > 0)
                r3.mulTo(n2, s2, i3);
              else {
                var o2 = i3;
                i3 = n2;
                n2 = o2;
              }
            }
            return r3.revert(i3);
          };
          t3.prototype.chunkSize = function(t4) {
            return Math.floor(Math.LN2 * this.DB / Math.log(t4));
          };
          t3.prototype.toRadix = function(t4) {
            if (null == t4)
              t4 = 10;
            if (0 == this.signum() || t4 < 2 || t4 > 36)
              return "0";
            var e3 = this.chunkSize(t4);
            var r3 = Math.pow(t4, e3);
            var i3 = Y(r3);
            var n2 = H();
            var s2 = H();
            var a2 = "";
            this.divRemTo(i3, n2, s2);
            while (n2.signum() > 0) {
              a2 = (r3 + s2.intValue()).toString(t4).substr(1) + a2;
              n2.divRemTo(i3, n2, s2);
            }
            return s2.intValue().toString(t4) + a2;
          };
          t3.prototype.fromRadix = function(e3, r3) {
            this.fromInt(0);
            if (null == r3)
              r3 = 10;
            var i3 = this.chunkSize(r3);
            var n2 = Math.pow(r3, i3);
            var s2 = false;
            var a2 = 0;
            var o2 = 0;
            for (var u2 = 0; u2 < e3.length; ++u2) {
              var c2 = G(e3, u2);
              if (c2 < 0) {
                if ("-" == e3.charAt(u2) && 0 == this.signum())
                  s2 = true;
                continue;
              }
              o2 = r3 * o2 + c2;
              if (++a2 >= i3) {
                this.dMultiply(n2);
                this.dAddOffset(o2, 0);
                a2 = 0;
                o2 = 0;
              }
            }
            if (a2 > 0) {
              this.dMultiply(Math.pow(r3, a2));
              this.dAddOffset(o2, 0);
            }
            if (s2)
              t3.ZERO.subTo(this, this);
          };
          t3.prototype.fromNumber = function(e3, r3, i3) {
            if ("number" == typeof r3)
              if (e3 < 2)
                this.fromInt(1);
              else {
                this.fromNumber(e3, i3);
                if (!this.testBit(e3 - 1))
                  this.bitwiseTo(t3.ONE.shiftLeft(e3 - 1), a, this);
                if (this.isEven())
                  this.dAddOffset(1, 0);
                while (!this.isProbablePrime(r3)) {
                  this.dAddOffset(2, 0);
                  if (this.bitLength() > e3)
                    this.subTo(t3.ONE.shiftLeft(e3 - 1), this);
                }
              }
            else {
              var n2 = [];
              var s2 = 7 & e3;
              n2.length = (e3 >> 3) + 1;
              r3.nextBytes(n2);
              if (s2 > 0)
                n2[0] &= (1 << s2) - 1;
              else
                n2[0] = 0;
              this.fromString(n2, 256);
            }
          };
          t3.prototype.bitwiseTo = function(t4, e3, r3) {
            var i3;
            var n2;
            var s2 = Math.min(t4.t, this.t);
            for (i3 = 0; i3 < s2; ++i3)
              r3[i3] = e3(this[i3], t4[i3]);
            if (t4.t < this.t) {
              n2 = t4.s & this.DM;
              for (i3 = s2; i3 < this.t; ++i3)
                r3[i3] = e3(this[i3], n2);
              r3.t = this.t;
            } else {
              n2 = this.s & this.DM;
              for (i3 = s2; i3 < t4.t; ++i3)
                r3[i3] = e3(n2, t4[i3]);
              r3.t = t4.t;
            }
            r3.s = e3(this.s, t4.s);
            r3.clamp();
          };
          t3.prototype.changeBit = function(e3, r3) {
            var i3 = t3.ONE.shiftLeft(e3);
            this.bitwiseTo(i3, r3, i3);
            return i3;
          };
          t3.prototype.addTo = function(t4, e3) {
            var r3 = 0;
            var i3 = 0;
            var n2 = Math.min(t4.t, this.t);
            while (r3 < n2) {
              i3 += this[r3] + t4[r3];
              e3[r3++] = i3 & this.DM;
              i3 >>= this.DB;
            }
            if (t4.t < this.t) {
              i3 += t4.s;
              while (r3 < this.t) {
                i3 += this[r3];
                e3[r3++] = i3 & this.DM;
                i3 >>= this.DB;
              }
              i3 += this.s;
            } else {
              i3 += this.s;
              while (r3 < t4.t) {
                i3 += t4[r3];
                e3[r3++] = i3 & this.DM;
                i3 >>= this.DB;
              }
              i3 += t4.s;
            }
            e3.s = i3 < 0 ? -1 : 0;
            if (i3 > 0)
              e3[r3++] = i3;
            else if (i3 < -1)
              e3[r3++] = this.DV + i3;
            e3.t = r3;
            e3.clamp();
          };
          t3.prototype.dMultiply = function(t4) {
            this[this.t] = this.am(0, t4 - 1, this, 0, 0, this.t);
            ++this.t;
            this.clamp();
          };
          t3.prototype.dAddOffset = function(t4, e3) {
            if (0 == t4)
              return;
            while (this.t <= e3)
              this[this.t++] = 0;
            this[e3] += t4;
            while (this[e3] >= this.DV) {
              this[e3] -= this.DV;
              if (++e3 >= this.t)
                this[this.t++] = 0;
              ++this[e3];
            }
          };
          t3.prototype.multiplyLowerTo = function(t4, e3, r3) {
            var i3 = Math.min(this.t + t4.t, e3);
            r3.s = 0;
            r3.t = i3;
            while (i3 > 0)
              r3[--i3] = 0;
            for (var n2 = r3.t - this.t; i3 < n2; ++i3)
              r3[i3 + this.t] = this.am(0, t4[i3], r3, i3, 0, this.t);
            for (var n2 = Math.min(t4.t, e3); i3 < n2; ++i3)
              this.am(0, t4[i3], r3, i3, 0, e3 - i3);
            r3.clamp();
          };
          t3.prototype.multiplyUpperTo = function(t4, e3, r3) {
            --e3;
            var i3 = r3.t = this.t + t4.t - e3;
            r3.s = 0;
            while (--i3 >= 0)
              r3[i3] = 0;
            for (i3 = Math.max(e3 - this.t, 0); i3 < t4.t; ++i3)
              r3[this.t + i3 - e3] = this.am(e3 - i3, t4[i3], r3, 0, 0, this.t + i3 - e3);
            r3.clamp();
            r3.drShiftTo(1, r3);
          };
          t3.prototype.modInt = function(t4) {
            if (t4 <= 0)
              return 0;
            var e3 = this.DV % t4;
            var r3 = this.s < 0 ? t4 - 1 : 0;
            if (this.t > 0)
              if (0 == e3)
                r3 = this[0] % t4;
              else
                for (var i3 = this.t - 1; i3 >= 0; --i3)
                  r3 = (e3 * r3 + this[i3]) % t4;
            return r3;
          };
          t3.prototype.millerRabin = function(e3) {
            var r3 = this.subtract(t3.ONE);
            var i3 = r3.getLowestSetBit();
            if (i3 <= 0)
              return false;
            var n2 = r3.shiftRight(i3);
            e3 = e3 + 1 >> 1;
            if (e3 > O.length)
              e3 = O.length;
            var s2 = H();
            for (var a2 = 0; a2 < e3; ++a2) {
              s2.fromInt(O[Math.floor(Math.random() * O.length)]);
              var o2 = s2.modPow(n2, this);
              if (0 != o2.compareTo(t3.ONE) && 0 != o2.compareTo(r3)) {
                var u2 = 1;
                while (u2++ < i3 && 0 != o2.compareTo(r3)) {
                  o2 = o2.modPowInt(2, this);
                  if (0 == o2.compareTo(t3.ONE))
                    return false;
                }
                if (0 != o2.compareTo(r3))
                  return false;
              }
            }
            return true;
          };
          t3.prototype.square = function() {
            var t4 = H();
            this.squareTo(t4);
            return t4;
          };
          t3.prototype.gcda = function(t4, e3) {
            var r3 = this.s < 0 ? this.negate() : this.clone();
            var i3 = t4.s < 0 ? t4.negate() : t4.clone();
            if (r3.compareTo(i3) < 0) {
              var n2 = r3;
              r3 = i3;
              i3 = n2;
            }
            var s2 = r3.getLowestSetBit();
            var a2 = i3.getLowestSetBit();
            if (a2 < 0) {
              e3(r3);
              return;
            }
            if (s2 < a2)
              a2 = s2;
            if (a2 > 0) {
              r3.rShiftTo(a2, r3);
              i3.rShiftTo(a2, i3);
            }
            var o2 = function() {
              if ((s2 = r3.getLowestSetBit()) > 0)
                r3.rShiftTo(s2, r3);
              if ((s2 = i3.getLowestSetBit()) > 0)
                i3.rShiftTo(s2, i3);
              if (r3.compareTo(i3) >= 0) {
                r3.subTo(i3, r3);
                r3.rShiftTo(1, r3);
              } else {
                i3.subTo(r3, i3);
                i3.rShiftTo(1, i3);
              }
              if (!(r3.signum() > 0)) {
                if (a2 > 0)
                  i3.lShiftTo(a2, i3);
                setTimeout(function() {
                  e3(i3);
                }, 0);
              } else
                setTimeout(o2, 0);
            };
            setTimeout(o2, 10);
          };
          t3.prototype.fromNumberAsync = function(e3, r3, i3, n2) {
            if ("number" == typeof r3)
              if (e3 < 2)
                this.fromInt(1);
              else {
                this.fromNumber(e3, i3);
                if (!this.testBit(e3 - 1))
                  this.bitwiseTo(t3.ONE.shiftLeft(e3 - 1), a, this);
                if (this.isEven())
                  this.dAddOffset(1, 0);
                var s2 = this;
                var o2 = function() {
                  s2.dAddOffset(2, 0);
                  if (s2.bitLength() > e3)
                    s2.subTo(t3.ONE.shiftLeft(e3 - 1), s2);
                  if (s2.isProbablePrime(r3))
                    setTimeout(function() {
                      n2();
                    }, 0);
                  else
                    setTimeout(o2, 0);
                };
                setTimeout(o2, 0);
              }
            else {
              var u2 = [];
              var c2 = 7 & e3;
              u2.length = (e3 >> 3) + 1;
              r3.nextBytes(u2);
              if (c2 > 0)
                u2[0] &= (1 << c2) - 1;
              else
                u2[0] = 0;
              this.fromString(u2, 256);
            }
          };
          return t3;
        }();
        var N = function() {
          function t3() {
          }
          t3.prototype.convert = function(t4) {
            return t4;
          };
          t3.prototype.revert = function(t4) {
            return t4;
          };
          t3.prototype.mulTo = function(t4, e3, r3) {
            t4.multiplyTo(e3, r3);
          };
          t3.prototype.sqrTo = function(t4, e3) {
            t4.squareTo(e3);
          };
          return t3;
        }();
        var P = function() {
          function t3(t4) {
            this.m = t4;
          }
          t3.prototype.convert = function(t4) {
            if (t4.s < 0 || t4.compareTo(this.m) >= 0)
              return t4.mod(this.m);
            else
              return t4;
          };
          t3.prototype.revert = function(t4) {
            return t4;
          };
          t3.prototype.reduce = function(t4) {
            t4.divRemTo(this.m, null, t4);
          };
          t3.prototype.mulTo = function(t4, e3, r3) {
            t4.multiplyTo(e3, r3);
            this.reduce(r3);
          };
          t3.prototype.sqrTo = function(t4, e3) {
            t4.squareTo(e3);
            this.reduce(e3);
          };
          return t3;
        }();
        var V = function() {
          function t3(t4) {
            this.m = t4;
            this.mp = t4.invDigit();
            this.mpl = 32767 & this.mp;
            this.mph = this.mp >> 15;
            this.um = (1 << t4.DB - 15) - 1;
            this.mt2 = 2 * t4.t;
          }
          t3.prototype.convert = function(t4) {
            var e3 = H();
            t4.abs().dlShiftTo(this.m.t, e3);
            e3.divRemTo(this.m, null, e3);
            if (t4.s < 0 && e3.compareTo(C.ZERO) > 0)
              this.m.subTo(e3, e3);
            return e3;
          };
          t3.prototype.revert = function(t4) {
            var e3 = H();
            t4.copyTo(e3);
            this.reduce(e3);
            return e3;
          };
          t3.prototype.reduce = function(t4) {
            while (t4.t <= this.mt2)
              t4[t4.t++] = 0;
            for (var e3 = 0; e3 < this.m.t; ++e3) {
              var r3 = 32767 & t4[e3];
              var i3 = r3 * this.mpl + ((r3 * this.mph + (t4[e3] >> 15) * this.mpl & this.um) << 15) & t4.DM;
              r3 = e3 + this.m.t;
              t4[r3] += this.m.am(0, i3, t4, e3, 0, this.m.t);
              while (t4[r3] >= t4.DV) {
                t4[r3] -= t4.DV;
                t4[++r3]++;
              }
            }
            t4.clamp();
            t4.drShiftTo(this.m.t, t4);
            if (t4.compareTo(this.m) >= 0)
              t4.subTo(this.m, t4);
          };
          t3.prototype.mulTo = function(t4, e3, r3) {
            t4.multiplyTo(e3, r3);
            this.reduce(r3);
          };
          t3.prototype.sqrTo = function(t4, e3) {
            t4.squareTo(e3);
            this.reduce(e3);
          };
          return t3;
        }();
        var L = function() {
          function t3(t4) {
            this.m = t4;
            this.r2 = H();
            this.q3 = H();
            C.ONE.dlShiftTo(2 * t4.t, this.r2);
            this.mu = this.r2.divide(t4);
          }
          t3.prototype.convert = function(t4) {
            if (t4.s < 0 || t4.t > 2 * this.m.t)
              return t4.mod(this.m);
            else if (t4.compareTo(this.m) < 0)
              return t4;
            else {
              var e3 = H();
              t4.copyTo(e3);
              this.reduce(e3);
              return e3;
            }
          };
          t3.prototype.revert = function(t4) {
            return t4;
          };
          t3.prototype.reduce = function(t4) {
            t4.drShiftTo(this.m.t - 1, this.r2);
            if (t4.t > this.m.t + 1) {
              t4.t = this.m.t + 1;
              t4.clamp();
            }
            this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
            this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
            while (t4.compareTo(this.r2) < 0)
              t4.dAddOffset(1, this.m.t + 1);
            t4.subTo(this.r2, t4);
            while (t4.compareTo(this.m) >= 0)
              t4.subTo(this.m, t4);
          };
          t3.prototype.mulTo = function(t4, e3, r3) {
            t4.multiplyTo(e3, r3);
            this.reduce(r3);
          };
          t3.prototype.sqrTo = function(t4, e3) {
            t4.squareTo(e3);
            this.reduce(e3);
          };
          return t3;
        }();
        function H() {
          return new C(null);
        }
        function U(t3, e3) {
          return new C(t3, e3);
        }
        var K = "undefined" !== typeof navigator;
        if (K && B && "Microsoft Internet Explorer" == navigator.appName) {
          C.prototype.am = function t3(e3, r3, i3, n2, s2, a2) {
            var o2 = 32767 & r3;
            var u2 = r3 >> 15;
            while (--a2 >= 0) {
              var c2 = 32767 & this[e3];
              var l2 = this[e3++] >> 15;
              var f2 = u2 * c2 + l2 * o2;
              c2 = o2 * c2 + ((32767 & f2) << 15) + i3[n2] + (1073741823 & s2);
              s2 = (c2 >>> 30) + (f2 >>> 15) + u2 * l2 + (s2 >>> 30);
              i3[n2++] = 1073741823 & c2;
            }
            return s2;
          };
          x = 30;
        } else if (K && B && "Netscape" != navigator.appName) {
          C.prototype.am = function t3(e3, r3, i3, n2, s2, a2) {
            while (--a2 >= 0) {
              var o2 = r3 * this[e3++] + i3[n2] + s2;
              s2 = Math.floor(o2 / 67108864);
              i3[n2++] = 67108863 & o2;
            }
            return s2;
          };
          x = 26;
        } else {
          C.prototype.am = function t3(e3, r3, i3, n2, s2, a2) {
            var o2 = 16383 & r3;
            var u2 = r3 >> 14;
            while (--a2 >= 0) {
              var c2 = 16383 & this[e3];
              var l2 = this[e3++] >> 14;
              var f2 = u2 * c2 + l2 * o2;
              c2 = o2 * c2 + ((16383 & f2) << 14) + i3[n2] + s2;
              s2 = (c2 >> 28) + (f2 >> 14) + u2 * l2;
              i3[n2++] = 268435455 & c2;
            }
            return s2;
          };
          x = 28;
        }
        C.prototype.DB = x;
        C.prototype.DM = (1 << x) - 1;
        C.prototype.DV = 1 << x;
        var j = 52;
        C.prototype.FV = Math.pow(2, j);
        C.prototype.F1 = j - x;
        C.prototype.F2 = 2 * x - j;
        var q = [];
        var F;
        var z;
        F = "0".charCodeAt(0);
        for (z = 0; z <= 9; ++z)
          q[F++] = z;
        F = "a".charCodeAt(0);
        for (z = 10; z < 36; ++z)
          q[F++] = z;
        F = "A".charCodeAt(0);
        for (z = 10; z < 36; ++z)
          q[F++] = z;
        function G(t3, e3) {
          var r3 = q[t3.charCodeAt(e3)];
          return null == r3 ? -1 : r3;
        }
        function Y(t3) {
          var e3 = H();
          e3.fromInt(t3);
          return e3;
        }
        function W(t3) {
          var e3 = 1;
          var r3;
          if (0 != (r3 = t3 >>> 16)) {
            t3 = r3;
            e3 += 16;
          }
          if (0 != (r3 = t3 >> 8)) {
            t3 = r3;
            e3 += 8;
          }
          if (0 != (r3 = t3 >> 4)) {
            t3 = r3;
            e3 += 4;
          }
          if (0 != (r3 = t3 >> 2)) {
            t3 = r3;
            e3 += 2;
          }
          if (0 != (r3 = t3 >> 1)) {
            t3 = r3;
            e3 += 1;
          }
          return e3;
        }
        C.ZERO = Y(0);
        C.ONE = Y(1);
        var J = function() {
          function t3() {
            this.i = 0;
            this.j = 0;
            this.S = [];
          }
          t3.prototype.init = function(t4) {
            var e3;
            var r3;
            var i3;
            for (e3 = 0; e3 < 256; ++e3)
              this.S[e3] = e3;
            r3 = 0;
            for (e3 = 0; e3 < 256; ++e3) {
              r3 = r3 + this.S[e3] + t4[e3 % t4.length] & 255;
              i3 = this.S[e3];
              this.S[e3] = this.S[r3];
              this.S[r3] = i3;
            }
            this.i = 0;
            this.j = 0;
          };
          t3.prototype.next = function() {
            var t4;
            this.i = this.i + 1 & 255;
            this.j = this.j + this.S[this.i] & 255;
            t4 = this.S[this.i];
            this.S[this.i] = this.S[this.j];
            this.S[this.j] = t4;
            return this.S[t4 + this.S[this.i] & 255];
          };
          return t3;
        }();
        function Z() {
          return new J();
        }
        var $ = 256;
        var X;
        var Q = null;
        var tt2;
        if (null == Q) {
          Q = [];
          tt2 = 0;
        }
        function nt() {
          if (null == X) {
            X = Z();
            while (tt2 < $) {
              var t3 = Math.floor(65536 * Math.random());
              Q[tt2++] = 255 & t3;
            }
            X.init(Q);
            for (tt2 = 0; tt2 < Q.length; ++tt2)
              Q[tt2] = 0;
            tt2 = 0;
          }
          return X.next();
        }
        var st = function() {
          function t3() {
          }
          t3.prototype.nextBytes = function(t4) {
            for (var e3 = 0; e3 < t4.length; ++e3)
              t4[e3] = nt();
          };
          return t3;
        }();
        function at(t3, e3) {
          if (e3 < t3.length + 22) {
            console.error("Message too long for RSA");
            return null;
          }
          var r3 = e3 - t3.length - 6;
          var i3 = "";
          for (var n2 = 0; n2 < r3; n2 += 2)
            i3 += "ff";
          var s2 = "0001" + i3 + "00" + t3;
          return U(s2, 16);
        }
        function ot(t3, e3) {
          if (e3 < t3.length + 11) {
            console.error("Message too long for RSA");
            return null;
          }
          var r3 = [];
          var i3 = t3.length - 1;
          while (i3 >= 0 && e3 > 0) {
            var n2 = t3.charCodeAt(i3--);
            if (n2 < 128)
              r3[--e3] = n2;
            else if (n2 > 127 && n2 < 2048) {
              r3[--e3] = 63 & n2 | 128;
              r3[--e3] = n2 >> 6 | 192;
            } else {
              r3[--e3] = 63 & n2 | 128;
              r3[--e3] = n2 >> 6 & 63 | 128;
              r3[--e3] = n2 >> 12 | 224;
            }
          }
          r3[--e3] = 0;
          var s2 = new st();
          var a2 = [];
          while (e3 > 2) {
            a2[0] = 0;
            while (0 == a2[0])
              s2.nextBytes(a2);
            r3[--e3] = a2[0];
          }
          r3[--e3] = 2;
          r3[--e3] = 0;
          return new C(r3);
        }
        var ut = function() {
          function t3() {
            this.n = null;
            this.e = 0;
            this.d = null;
            this.p = null;
            this.q = null;
            this.dmp1 = null;
            this.dmq1 = null;
            this.coeff = null;
          }
          t3.prototype.doPublic = function(t4) {
            return t4.modPowInt(this.e, this.n);
          };
          t3.prototype.doPrivate = function(t4) {
            if (null == this.p || null == this.q)
              return t4.modPow(this.d, this.n);
            var e3 = t4.mod(this.p).modPow(this.dmp1, this.p);
            var r3 = t4.mod(this.q).modPow(this.dmq1, this.q);
            while (e3.compareTo(r3) < 0)
              e3 = e3.add(this.p);
            return e3.subtract(r3).multiply(this.coeff).mod(this.p).multiply(this.q).add(r3);
          };
          t3.prototype.setPublic = function(t4, e3) {
            if (null != t4 && null != e3 && t4.length > 0 && e3.length > 0) {
              this.n = U(t4, 16);
              this.e = parseInt(e3, 16);
            } else
              console.error("Invalid RSA public key");
          };
          t3.prototype.encrypt = function(t4) {
            var e3 = this.n.bitLength() + 7 >> 3;
            var r3 = ot(t4, e3);
            if (null == r3)
              return null;
            var i3 = this.doPublic(r3);
            if (null == i3)
              return null;
            var n2 = i3.toString(16);
            var s2 = n2.length;
            for (var a2 = 0; a2 < 2 * e3 - s2; a2++)
              n2 = "0" + n2;
            return n2;
          };
          t3.prototype.setPrivate = function(t4, e3, r3) {
            if (null != t4 && null != e3 && t4.length > 0 && e3.length > 0) {
              this.n = U(t4, 16);
              this.e = parseInt(e3, 16);
              this.d = U(r3, 16);
            } else
              console.error("Invalid RSA private key");
          };
          t3.prototype.setPrivateEx = function(t4, e3, r3, i3, n2, s2, a2, o2) {
            if (null != t4 && null != e3 && t4.length > 0 && e3.length > 0) {
              this.n = U(t4, 16);
              this.e = parseInt(e3, 16);
              this.d = U(r3, 16);
              this.p = U(i3, 16);
              this.q = U(n2, 16);
              this.dmp1 = U(s2, 16);
              this.dmq1 = U(a2, 16);
              this.coeff = U(o2, 16);
            } else
              console.error("Invalid RSA private key");
          };
          t3.prototype.generate = function(t4, e3) {
            var r3 = new st();
            var i3 = t4 >> 1;
            this.e = parseInt(e3, 16);
            var n2 = new C(e3, 16);
            for (; ; ) {
              for (; ; ) {
                this.p = new C(t4 - i3, 1, r3);
                if (0 == this.p.subtract(C.ONE).gcd(n2).compareTo(C.ONE) && this.p.isProbablePrime(10))
                  break;
              }
              for (; ; ) {
                this.q = new C(i3, 1, r3);
                if (0 == this.q.subtract(C.ONE).gcd(n2).compareTo(C.ONE) && this.q.isProbablePrime(10))
                  break;
              }
              if (this.p.compareTo(this.q) <= 0) {
                var s2 = this.p;
                this.p = this.q;
                this.q = s2;
              }
              var a2 = this.p.subtract(C.ONE);
              var o2 = this.q.subtract(C.ONE);
              var u2 = a2.multiply(o2);
              if (0 == u2.gcd(n2).compareTo(C.ONE)) {
                this.n = this.p.multiply(this.q);
                this.d = n2.modInverse(u2);
                this.dmp1 = this.d.mod(a2);
                this.dmq1 = this.d.mod(o2);
                this.coeff = this.q.modInverse(this.p);
                break;
              }
            }
          };
          t3.prototype.decrypt = function(t4) {
            var e3 = U(t4, 16);
            var r3 = this.doPrivate(e3);
            if (null == r3)
              return null;
            return ct(r3, this.n.bitLength() + 7 >> 3);
          };
          t3.prototype.generateAsync = function(t4, e3, r3) {
            var i3 = new st();
            var n2 = t4 >> 1;
            this.e = parseInt(e3, 16);
            var s2 = new C(e3, 16);
            var a2 = this;
            var o2 = function() {
              var e4 = function() {
                if (a2.p.compareTo(a2.q) <= 0) {
                  var t5 = a2.p;
                  a2.p = a2.q;
                  a2.q = t5;
                }
                var e5 = a2.p.subtract(C.ONE);
                var i4 = a2.q.subtract(C.ONE);
                var n3 = e5.multiply(i4);
                if (0 == n3.gcd(s2).compareTo(C.ONE)) {
                  a2.n = a2.p.multiply(a2.q);
                  a2.d = s2.modInverse(n3);
                  a2.dmp1 = a2.d.mod(e5);
                  a2.dmq1 = a2.d.mod(i4);
                  a2.coeff = a2.q.modInverse(a2.p);
                  setTimeout(function() {
                    r3();
                  }, 0);
                } else
                  setTimeout(o2, 0);
              };
              var u2 = function() {
                a2.q = H();
                a2.q.fromNumberAsync(n2, 1, i3, function() {
                  a2.q.subtract(C.ONE).gcda(s2, function(t5) {
                    if (0 == t5.compareTo(C.ONE) && a2.q.isProbablePrime(10))
                      setTimeout(e4, 0);
                    else
                      setTimeout(u2, 0);
                  });
                });
              };
              var c2 = function() {
                a2.p = H();
                a2.p.fromNumberAsync(t4 - n2, 1, i3, function() {
                  a2.p.subtract(C.ONE).gcda(s2, function(t5) {
                    if (0 == t5.compareTo(C.ONE) && a2.p.isProbablePrime(10))
                      setTimeout(u2, 0);
                    else
                      setTimeout(c2, 0);
                  });
                });
              };
              setTimeout(c2, 0);
            };
            setTimeout(o2, 0);
          };
          t3.prototype.sign = function(t4, e3, r3) {
            var i3 = ht(r3);
            var n2 = i3 + e3(t4).toString();
            var s2 = at(n2, this.n.bitLength() / 4);
            if (null == s2)
              return null;
            var a2 = this.doPrivate(s2);
            if (null == a2)
              return null;
            var o2 = a2.toString(16);
            if (0 == (1 & o2.length))
              return o2;
            else
              return "0" + o2;
          };
          t3.prototype.verify = function(t4, e3, r3) {
            var i3 = U(e3, 16);
            var n2 = this.doPublic(i3);
            if (null == n2)
              return null;
            var s2 = n2.toString(16).replace(/^1f+00/, "");
            var a2 = dt(s2);
            return a2 == r3(t4).toString();
          };
          t3.prototype.encryptLong = function(t4) {
            var e3 = this;
            var r3 = "";
            var i3 = (this.n.bitLength() + 7 >> 3) - 11;
            var n2 = this.setSplitChn(t4, i3);
            n2.forEach(function(t5) {
              r3 += e3.encrypt(t5);
            });
            return r3;
          };
          t3.prototype.decryptLong = function(t4) {
            var e3 = "";
            var r3 = this.n.bitLength() + 7 >> 3;
            var i3 = 2 * r3;
            if (t4.length > i3) {
              var n2 = t4.match(new RegExp(".{1," + i3 + "}", "g")) || [];
              var s2 = [];
              for (var a2 = 0; a2 < n2.length; a2++) {
                var o2 = U(n2[a2], 16);
                var u2 = this.doPrivate(o2);
                if (null == u2)
                  return null;
                s2.push(u2);
              }
              e3 = lt(s2, r3);
            } else
              e3 = this.decrypt(t4);
            return e3;
          };
          t3.prototype.setSplitChn = function(t4, e3, r3) {
            if (void 0 === r3)
              r3 = [];
            var i3 = t4.split("");
            var n2 = 0;
            for (var s2 = 0; s2 < i3.length; s2++) {
              var a2 = i3[s2].charCodeAt(0);
              if (a2 <= 127)
                n2 += 1;
              else if (a2 <= 2047)
                n2 += 2;
              else if (a2 <= 65535)
                n2 += 3;
              else
                n2 += 4;
              if (n2 > e3) {
                var o2 = t4.substring(0, s2);
                r3.push(o2);
                return this.setSplitChn(t4.substring(s2), e3, r3);
              }
            }
            r3.push(t4);
            return r3;
          };
          return t3;
        }();
        function ct(t3, e3) {
          var r3 = t3.toByteArray();
          var i3 = 0;
          while (i3 < r3.length && 0 == r3[i3])
            ++i3;
          if (r3.length - i3 != e3 - 1 || 2 != r3[i3])
            return null;
          ++i3;
          while (0 != r3[i3])
            if (++i3 >= r3.length)
              return null;
          var n2 = "";
          while (++i3 < r3.length) {
            var s2 = 255 & r3[i3];
            if (s2 < 128)
              n2 += String.fromCharCode(s2);
            else if (s2 > 191 && s2 < 224) {
              n2 += String.fromCharCode((31 & s2) << 6 | 63 & r3[i3 + 1]);
              ++i3;
            } else {
              n2 += String.fromCharCode((15 & s2) << 12 | (63 & r3[i3 + 1]) << 6 | 63 & r3[i3 + 2]);
              i3 += 2;
            }
          }
          return n2;
        }
        function lt(t3, e3) {
          var r3 = [];
          for (var i3 = 0; i3 < t3.length; i3++) {
            var n2 = t3[i3];
            var s2 = n2.toByteArray();
            var a2 = 0;
            while (a2 < s2.length && 0 == s2[a2])
              ++a2;
            if (s2.length - a2 != e3 - 1 || 2 != s2[a2])
              return null;
            ++a2;
            while (0 != s2[a2])
              if (++a2 >= s2.length)
                return null;
            r3 = r3.concat(s2.slice(a2 + 1));
          }
          var o2 = r3;
          var u2 = -1;
          var c2 = "";
          while (++u2 < o2.length) {
            var l2 = 255 & o2[u2];
            if (l2 < 128)
              c2 += String.fromCharCode(l2);
            else if (l2 > 191 && l2 < 224) {
              c2 += String.fromCharCode((31 & l2) << 6 | 63 & o2[u2 + 1]);
              ++u2;
            } else {
              c2 += String.fromCharCode((15 & l2) << 12 | (63 & o2[u2 + 1]) << 6 | 63 & o2[u2 + 2]);
              u2 += 2;
            }
          }
          return c2;
        }
        var ft = { md2: "3020300c06082a864886f70d020205000410", md5: "3020300c06082a864886f70d020505000410", sha1: "3021300906052b0e03021a05000414", sha224: "302d300d06096086480165030402040500041c", sha256: "3031300d060960864801650304020105000420", sha384: "3041300d060960864801650304020205000430", sha512: "3051300d060960864801650304020305000440", ripemd160: "3021300906052b2403020105000414" };
        function ht(t3) {
          return ft[t3] || "";
        }
        function dt(t3) {
          for (var e3 in ft)
            if (ft.hasOwnProperty(e3)) {
              var r3 = ft[e3];
              var i3 = r3.length;
              if (t3.substr(0, i3) == r3)
                return t3.substr(i3);
            }
          return t3;
        }
        var vt = {};
        vt.lang = { extend: function(t3, e3, r3) {
          if (!e3 || !t3)
            throw new Error("YAHOO.lang.extend failed, please check that all dependencies are included.");
          var i3 = function() {
          };
          i3.prototype = e3.prototype;
          t3.prototype = new i3();
          t3.prototype.constructor = t3;
          t3.superclass = e3.prototype;
          if (e3.prototype.constructor == Object.prototype.constructor)
            e3.prototype.constructor = e3;
          if (r3) {
            var n2;
            for (n2 in r3)
              t3.prototype[n2] = r3[n2];
            var s2 = function() {
            }, a2 = ["toString", "valueOf"];
            try {
              if (/MSIE/.test(navigator.userAgent))
                s2 = function(t4, e4) {
                  for (n2 = 0; n2 < a2.length; n2 += 1) {
                    var r4 = a2[n2], i4 = e4[r4];
                    if ("function" === typeof i4 && i4 != Object.prototype[r4])
                      t4[r4] = i4;
                  }
                };
            } catch (t4) {
            }
            s2(t3.prototype, r3);
          }
        } };
        var pt = {};
        if ("undefined" == typeof pt.asn1 || !pt.asn1)
          pt.asn1 = {};
        pt.asn1.ASN1Util = new function() {
          this.integerToByteHex = function(t3) {
            var e3 = t3.toString(16);
            if (e3.length % 2 == 1)
              e3 = "0" + e3;
            return e3;
          };
          this.bigIntToMinTwosComplementsHex = function(t3) {
            var e3 = t3.toString(16);
            if ("-" != e3.substr(0, 1)) {
              if (e3.length % 2 == 1)
                e3 = "0" + e3;
              else if (!e3.match(/^[0-7]/))
                e3 = "00" + e3;
            } else {
              var r3 = e3.substr(1);
              var i3 = r3.length;
              if (i3 % 2 == 1)
                i3 += 1;
              else if (!e3.match(/^[0-7]/))
                i3 += 2;
              var n2 = "";
              for (var s2 = 0; s2 < i3; s2++)
                n2 += "f";
              var a2 = new C(n2, 16);
              var o2 = a2.xor(t3).add(C.ONE);
              e3 = o2.toString(16).replace(/^-/, "");
            }
            return e3;
          };
          this.getPEMStringFromHex = function(t3, e3) {
            return hextopem(t3, e3);
          };
          this.newObject = function(t3) {
            var e3 = pt, r3 = e3.asn1, i3 = r3.DERBoolean, n2 = r3.DERInteger, s2 = r3.DERBitString, a2 = r3.DEROctetString, o2 = r3.DERNull, u2 = r3.DERObjectIdentifier, c2 = r3.DEREnumerated, l2 = r3.DERUTF8String, f2 = r3.DERNumericString, h2 = r3.DERPrintableString, d2 = r3.DERTeletexString, v2 = r3.DERIA5String, p = r3.DERUTCTime, g2 = r3.DERGeneralizedTime, y2 = r3.DERSequence, m2 = r3.DERSet, w2 = r3.DERTaggedObject, _2 = r3.ASN1Util.newObject;
            var S2 = Object.keys(t3);
            if (1 != S2.length)
              throw "key of param shall be only one.";
            var b2 = S2[0];
            if (-1 == ":bool:int:bitstr:octstr:null:oid:enum:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:seq:set:tag:".indexOf(":" + b2 + ":"))
              throw "undefined key: " + b2;
            if ("bool" == b2)
              return new i3(t3[b2]);
            if ("int" == b2)
              return new n2(t3[b2]);
            if ("bitstr" == b2)
              return new s2(t3[b2]);
            if ("octstr" == b2)
              return new a2(t3[b2]);
            if ("null" == b2)
              return new o2(t3[b2]);
            if ("oid" == b2)
              return new u2(t3[b2]);
            if ("enum" == b2)
              return new c2(t3[b2]);
            if ("utf8str" == b2)
              return new l2(t3[b2]);
            if ("numstr" == b2)
              return new f2(t3[b2]);
            if ("prnstr" == b2)
              return new h2(t3[b2]);
            if ("telstr" == b2)
              return new d2(t3[b2]);
            if ("ia5str" == b2)
              return new v2(t3[b2]);
            if ("utctime" == b2)
              return new p(t3[b2]);
            if ("gentime" == b2)
              return new g2(t3[b2]);
            if ("seq" == b2) {
              var E2 = t3[b2];
              var D2 = [];
              for (var T2 = 0; T2 < E2.length; T2++) {
                var M2 = _2(E2[T2]);
                D2.push(M2);
              }
              return new y2({ array: D2 });
            }
            if ("set" == b2) {
              var E2 = t3[b2];
              var D2 = [];
              for (var T2 = 0; T2 < E2.length; T2++) {
                var M2 = _2(E2[T2]);
                D2.push(M2);
              }
              return new m2({ array: D2 });
            }
            if ("tag" == b2) {
              var I2 = t3[b2];
              if ("[object Array]" === Object.prototype.toString.call(I2) && 3 == I2.length) {
                var A2 = _2(I2[2]);
                return new w2({ tag: I2[0], explicit: I2[1], obj: A2 });
              } else {
                var x2 = {};
                if (void 0 !== I2.explicit)
                  x2.explicit = I2.explicit;
                if (void 0 !== I2.tag)
                  x2.tag = I2.tag;
                if (void 0 === I2.obj)
                  throw "obj shall be specified for 'tag'.";
                x2.obj = _2(I2.obj);
                return new w2(x2);
              }
            }
          };
          this.jsonToASN1HEX = function(t3) {
            var e3 = this.newObject(t3);
            return e3.getEncodedHex();
          };
        }();
        pt.asn1.ASN1Util.oidHexToInt = function(t3) {
          var e3 = "";
          var r3 = parseInt(t3.substr(0, 2), 16);
          var i3 = Math.floor(r3 / 40);
          var n2 = r3 % 40;
          var e3 = i3 + "." + n2;
          var s2 = "";
          for (var a2 = 2; a2 < t3.length; a2 += 2) {
            var o2 = parseInt(t3.substr(a2, 2), 16);
            var u2 = ("00000000" + o2.toString(2)).slice(-8);
            s2 += u2.substr(1, 7);
            if ("0" == u2.substr(0, 1)) {
              var c2 = new C(s2, 2);
              e3 = e3 + "." + c2.toString(10);
              s2 = "";
            }
          }
          return e3;
        };
        pt.asn1.ASN1Util.oidIntToHex = function(t3) {
          var e3 = function(t4) {
            var e4 = t4.toString(16);
            if (1 == e4.length)
              e4 = "0" + e4;
            return e4;
          };
          var r3 = function(t4) {
            var r4 = "";
            var i4 = new C(t4, 10);
            var n3 = i4.toString(2);
            var s3 = 7 - n3.length % 7;
            if (7 == s3)
              s3 = 0;
            var a3 = "";
            for (var o2 = 0; o2 < s3; o2++)
              a3 += "0";
            n3 = a3 + n3;
            for (var o2 = 0; o2 < n3.length - 1; o2 += 7) {
              var u2 = n3.substr(o2, 7);
              if (o2 != n3.length - 7)
                u2 = "1" + u2;
              r4 += e3(parseInt(u2, 2));
            }
            return r4;
          };
          if (!t3.match(/^[0-9.]+$/))
            throw "malformed oid string: " + t3;
          var i3 = "";
          var n2 = t3.split(".");
          var s2 = 40 * parseInt(n2[0]) + parseInt(n2[1]);
          i3 += e3(s2);
          n2.splice(0, 2);
          for (var a2 = 0; a2 < n2.length; a2++)
            i3 += r3(n2[a2]);
          return i3;
        };
        pt.asn1.ASN1Object = function() {
          var n2 = "";
          this.getLengthHexFromValue = function() {
            if ("undefined" == typeof this.hV || null == this.hV)
              throw "this.hV is null or undefined.";
            if (this.hV.length % 2 == 1)
              throw "value hex must be even length: n=" + n2.length + ",v=" + this.hV;
            var t3 = this.hV.length / 2;
            var e3 = t3.toString(16);
            if (e3.length % 2 == 1)
              e3 = "0" + e3;
            if (t3 < 128)
              return e3;
            else {
              var r3 = e3.length / 2;
              if (r3 > 15)
                throw "ASN.1 length too long to represent by 8x: n = " + t3.toString(16);
              var i3 = 128 + r3;
              return i3.toString(16) + e3;
            }
          };
          this.getEncodedHex = function() {
            if (null == this.hTLV || this.isModified) {
              this.hV = this.getFreshValueHex();
              this.hL = this.getLengthHexFromValue();
              this.hTLV = this.hT + this.hL + this.hV;
              this.isModified = false;
            }
            return this.hTLV;
          };
          this.getValueHex = function() {
            this.getEncodedHex();
            return this.hV;
          };
          this.getFreshValueHex = function() {
            return "";
          };
        };
        pt.asn1.DERAbstractString = function(t3) {
          pt.asn1.DERAbstractString.superclass.constructor.call(this);
          this.getString = function() {
            return this.s;
          };
          this.setString = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.s = t4;
            this.hV = stohex(this.s);
          };
          this.setStringHex = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.s = null;
            this.hV = t4;
          };
          this.getFreshValueHex = function() {
            return this.hV;
          };
          if ("undefined" != typeof t3) {
            if ("string" == typeof t3)
              this.setString(t3);
            else if ("undefined" != typeof t3["str"])
              this.setString(t3["str"]);
            else if ("undefined" != typeof t3["hex"])
              this.setStringHex(t3["hex"]);
          }
        };
        vt.lang.extend(pt.asn1.DERAbstractString, pt.asn1.ASN1Object);
        pt.asn1.DERAbstractTime = function(t3) {
          pt.asn1.DERAbstractTime.superclass.constructor.call(this);
          this.localDateToUTC = function(t4) {
            utc = t4.getTime() + 6e4 * t4.getTimezoneOffset();
            var e3 = new Date(utc);
            return e3;
          };
          this.formatDate = function(t4, e3, r3) {
            var i3 = this.zeroPadding;
            var n2 = this.localDateToUTC(t4);
            var s2 = String(n2.getFullYear());
            if ("utc" == e3)
              s2 = s2.substr(2, 2);
            var a2 = i3(String(n2.getMonth() + 1), 2);
            var o2 = i3(String(n2.getDate()), 2);
            var u2 = i3(String(n2.getHours()), 2);
            var c2 = i3(String(n2.getMinutes()), 2);
            var l2 = i3(String(n2.getSeconds()), 2);
            var f2 = s2 + a2 + o2 + u2 + c2 + l2;
            if (true === r3) {
              var h2 = n2.getMilliseconds();
              if (0 != h2) {
                var d2 = i3(String(h2), 3);
                d2 = d2.replace(/[0]+$/, "");
                f2 = f2 + "." + d2;
              }
            }
            return f2 + "Z";
          };
          this.zeroPadding = function(t4, e3) {
            if (t4.length >= e3)
              return t4;
            return new Array(e3 - t4.length + 1).join("0") + t4;
          };
          this.getString = function() {
            return this.s;
          };
          this.setString = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.s = t4;
            this.hV = stohex(t4);
          };
          this.setByDateValue = function(t4, e3, r3, i3, n2, s2) {
            var a2 = new Date(Date.UTC(t4, e3 - 1, r3, i3, n2, s2, 0));
            this.setByDate(a2);
          };
          this.getFreshValueHex = function() {
            return this.hV;
          };
        };
        vt.lang.extend(pt.asn1.DERAbstractTime, pt.asn1.ASN1Object);
        pt.asn1.DERAbstractStructured = function(t3) {
          pt.asn1.DERAbstractString.superclass.constructor.call(this);
          this.setByASN1ObjectArray = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.asn1Array = t4;
          };
          this.appendASN1Object = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.asn1Array.push(t4);
          };
          this.asn1Array = new Array();
          if ("undefined" != typeof t3) {
            if ("undefined" != typeof t3["array"])
              this.asn1Array = t3["array"];
          }
        };
        vt.lang.extend(pt.asn1.DERAbstractStructured, pt.asn1.ASN1Object);
        pt.asn1.DERBoolean = function() {
          pt.asn1.DERBoolean.superclass.constructor.call(this);
          this.hT = "01";
          this.hTLV = "0101ff";
        };
        vt.lang.extend(pt.asn1.DERBoolean, pt.asn1.ASN1Object);
        pt.asn1.DERInteger = function(t3) {
          pt.asn1.DERInteger.superclass.constructor.call(this);
          this.hT = "02";
          this.setByBigInteger = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.hV = pt.asn1.ASN1Util.bigIntToMinTwosComplementsHex(t4);
          };
          this.setByInteger = function(t4) {
            var e3 = new C(String(t4), 10);
            this.setByBigInteger(e3);
          };
          this.setValueHex = function(t4) {
            this.hV = t4;
          };
          this.getFreshValueHex = function() {
            return this.hV;
          };
          if ("undefined" != typeof t3) {
            if ("undefined" != typeof t3["bigint"])
              this.setByBigInteger(t3["bigint"]);
            else if ("undefined" != typeof t3["int"])
              this.setByInteger(t3["int"]);
            else if ("number" == typeof t3)
              this.setByInteger(t3);
            else if ("undefined" != typeof t3["hex"])
              this.setValueHex(t3["hex"]);
          }
        };
        vt.lang.extend(pt.asn1.DERInteger, pt.asn1.ASN1Object);
        pt.asn1.DERBitString = function(t3) {
          if (void 0 !== t3 && "undefined" !== typeof t3.obj) {
            var e3 = pt.asn1.ASN1Util.newObject(t3.obj);
            t3.hex = "00" + e3.getEncodedHex();
          }
          pt.asn1.DERBitString.superclass.constructor.call(this);
          this.hT = "03";
          this.setHexValueIncludingUnusedBits = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.hV = t4;
          };
          this.setUnusedBitsAndHexValue = function(t4, e4) {
            if (t4 < 0 || 7 < t4)
              throw "unused bits shall be from 0 to 7: u = " + t4;
            var r3 = "0" + t4;
            this.hTLV = null;
            this.isModified = true;
            this.hV = r3 + e4;
          };
          this.setByBinaryString = function(t4) {
            t4 = t4.replace(/0+$/, "");
            var e4 = 8 - t4.length % 8;
            if (8 == e4)
              e4 = 0;
            for (var r3 = 0; r3 <= e4; r3++)
              t4 += "0";
            var i3 = "";
            for (var r3 = 0; r3 < t4.length - 1; r3 += 8) {
              var n2 = t4.substr(r3, 8);
              var s2 = parseInt(n2, 2).toString(16);
              if (1 == s2.length)
                s2 = "0" + s2;
              i3 += s2;
            }
            this.hTLV = null;
            this.isModified = true;
            this.hV = "0" + e4 + i3;
          };
          this.setByBooleanArray = function(t4) {
            var e4 = "";
            for (var r3 = 0; r3 < t4.length; r3++)
              if (true == t4[r3])
                e4 += "1";
              else
                e4 += "0";
            this.setByBinaryString(e4);
          };
          this.newFalseArray = function(t4) {
            var e4 = new Array(t4);
            for (var r3 = 0; r3 < t4; r3++)
              e4[r3] = false;
            return e4;
          };
          this.getFreshValueHex = function() {
            return this.hV;
          };
          if ("undefined" != typeof t3) {
            if ("string" == typeof t3 && t3.toLowerCase().match(/^[0-9a-f]+$/))
              this.setHexValueIncludingUnusedBits(t3);
            else if ("undefined" != typeof t3["hex"])
              this.setHexValueIncludingUnusedBits(t3["hex"]);
            else if ("undefined" != typeof t3["bin"])
              this.setByBinaryString(t3["bin"]);
            else if ("undefined" != typeof t3["array"])
              this.setByBooleanArray(t3["array"]);
          }
        };
        vt.lang.extend(pt.asn1.DERBitString, pt.asn1.ASN1Object);
        pt.asn1.DEROctetString = function(t3) {
          if (void 0 !== t3 && "undefined" !== typeof t3.obj) {
            var e3 = pt.asn1.ASN1Util.newObject(t3.obj);
            t3.hex = e3.getEncodedHex();
          }
          pt.asn1.DEROctetString.superclass.constructor.call(this, t3);
          this.hT = "04";
        };
        vt.lang.extend(pt.asn1.DEROctetString, pt.asn1.DERAbstractString);
        pt.asn1.DERNull = function() {
          pt.asn1.DERNull.superclass.constructor.call(this);
          this.hT = "05";
          this.hTLV = "0500";
        };
        vt.lang.extend(pt.asn1.DERNull, pt.asn1.ASN1Object);
        pt.asn1.DERObjectIdentifier = function(t3) {
          var e3 = function(t4) {
            var e4 = t4.toString(16);
            if (1 == e4.length)
              e4 = "0" + e4;
            return e4;
          };
          var r3 = function(t4) {
            var r4 = "";
            var i3 = new C(t4, 10);
            var n2 = i3.toString(2);
            var s2 = 7 - n2.length % 7;
            if (7 == s2)
              s2 = 0;
            var a2 = "";
            for (var o2 = 0; o2 < s2; o2++)
              a2 += "0";
            n2 = a2 + n2;
            for (var o2 = 0; o2 < n2.length - 1; o2 += 7) {
              var u2 = n2.substr(o2, 7);
              if (o2 != n2.length - 7)
                u2 = "1" + u2;
              r4 += e3(parseInt(u2, 2));
            }
            return r4;
          };
          pt.asn1.DERObjectIdentifier.superclass.constructor.call(this);
          this.hT = "06";
          this.setValueHex = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.s = null;
            this.hV = t4;
          };
          this.setValueOidString = function(t4) {
            if (!t4.match(/^[0-9.]+$/))
              throw "malformed oid string: " + t4;
            var i3 = "";
            var n2 = t4.split(".");
            var s2 = 40 * parseInt(n2[0]) + parseInt(n2[1]);
            i3 += e3(s2);
            n2.splice(0, 2);
            for (var a2 = 0; a2 < n2.length; a2++)
              i3 += r3(n2[a2]);
            this.hTLV = null;
            this.isModified = true;
            this.s = null;
            this.hV = i3;
          };
          this.setValueName = function(t4) {
            var e4 = pt.asn1.x509.OID.name2oid(t4);
            if ("" !== e4)
              this.setValueOidString(e4);
            else
              throw "DERObjectIdentifier oidName undefined: " + t4;
          };
          this.getFreshValueHex = function() {
            return this.hV;
          };
          if (void 0 !== t3) {
            if ("string" === typeof t3)
              if (t3.match(/^[0-2].[0-9.]+$/))
                this.setValueOidString(t3);
              else
                this.setValueName(t3);
            else if (void 0 !== t3.oid)
              this.setValueOidString(t3.oid);
            else if (void 0 !== t3.hex)
              this.setValueHex(t3.hex);
            else if (void 0 !== t3.name)
              this.setValueName(t3.name);
          }
        };
        vt.lang.extend(pt.asn1.DERObjectIdentifier, pt.asn1.ASN1Object);
        pt.asn1.DEREnumerated = function(t3) {
          pt.asn1.DEREnumerated.superclass.constructor.call(this);
          this.hT = "0a";
          this.setByBigInteger = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.hV = pt.asn1.ASN1Util.bigIntToMinTwosComplementsHex(t4);
          };
          this.setByInteger = function(t4) {
            var e3 = new C(String(t4), 10);
            this.setByBigInteger(e3);
          };
          this.setValueHex = function(t4) {
            this.hV = t4;
          };
          this.getFreshValueHex = function() {
            return this.hV;
          };
          if ("undefined" != typeof t3) {
            if ("undefined" != typeof t3["int"])
              this.setByInteger(t3["int"]);
            else if ("number" == typeof t3)
              this.setByInteger(t3);
            else if ("undefined" != typeof t3["hex"])
              this.setValueHex(t3["hex"]);
          }
        };
        vt.lang.extend(pt.asn1.DEREnumerated, pt.asn1.ASN1Object);
        pt.asn1.DERUTF8String = function(t3) {
          pt.asn1.DERUTF8String.superclass.constructor.call(this, t3);
          this.hT = "0c";
        };
        vt.lang.extend(pt.asn1.DERUTF8String, pt.asn1.DERAbstractString);
        pt.asn1.DERNumericString = function(t3) {
          pt.asn1.DERNumericString.superclass.constructor.call(this, t3);
          this.hT = "12";
        };
        vt.lang.extend(pt.asn1.DERNumericString, pt.asn1.DERAbstractString);
        pt.asn1.DERPrintableString = function(t3) {
          pt.asn1.DERPrintableString.superclass.constructor.call(this, t3);
          this.hT = "13";
        };
        vt.lang.extend(pt.asn1.DERPrintableString, pt.asn1.DERAbstractString);
        pt.asn1.DERTeletexString = function(t3) {
          pt.asn1.DERTeletexString.superclass.constructor.call(this, t3);
          this.hT = "14";
        };
        vt.lang.extend(pt.asn1.DERTeletexString, pt.asn1.DERAbstractString);
        pt.asn1.DERIA5String = function(t3) {
          pt.asn1.DERIA5String.superclass.constructor.call(this, t3);
          this.hT = "16";
        };
        vt.lang.extend(pt.asn1.DERIA5String, pt.asn1.DERAbstractString);
        pt.asn1.DERUTCTime = function(t3) {
          pt.asn1.DERUTCTime.superclass.constructor.call(this, t3);
          this.hT = "17";
          this.setByDate = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.date = t4;
            this.s = this.formatDate(this.date, "utc");
            this.hV = stohex(this.s);
          };
          this.getFreshValueHex = function() {
            if ("undefined" == typeof this.date && "undefined" == typeof this.s) {
              this.date = new Date();
              this.s = this.formatDate(this.date, "utc");
              this.hV = stohex(this.s);
            }
            return this.hV;
          };
          if (void 0 !== t3) {
            if (void 0 !== t3.str)
              this.setString(t3.str);
            else if ("string" == typeof t3 && t3.match(/^[0-9]{12}Z$/))
              this.setString(t3);
            else if (void 0 !== t3.hex)
              this.setStringHex(t3.hex);
            else if (void 0 !== t3.date)
              this.setByDate(t3.date);
          }
        };
        vt.lang.extend(pt.asn1.DERUTCTime, pt.asn1.DERAbstractTime);
        pt.asn1.DERGeneralizedTime = function(t3) {
          pt.asn1.DERGeneralizedTime.superclass.constructor.call(this, t3);
          this.hT = "18";
          this.withMillis = false;
          this.setByDate = function(t4) {
            this.hTLV = null;
            this.isModified = true;
            this.date = t4;
            this.s = this.formatDate(this.date, "gen", this.withMillis);
            this.hV = stohex(this.s);
          };
          this.getFreshValueHex = function() {
            if (void 0 === this.date && void 0 === this.s) {
              this.date = new Date();
              this.s = this.formatDate(this.date, "gen", this.withMillis);
              this.hV = stohex(this.s);
            }
            return this.hV;
          };
          if (void 0 !== t3) {
            if (void 0 !== t3.str)
              this.setString(t3.str);
            else if ("string" == typeof t3 && t3.match(/^[0-9]{14}Z$/))
              this.setString(t3);
            else if (void 0 !== t3.hex)
              this.setStringHex(t3.hex);
            else if (void 0 !== t3.date)
              this.setByDate(t3.date);
            if (true === t3.millis)
              this.withMillis = true;
          }
        };
        vt.lang.extend(pt.asn1.DERGeneralizedTime, pt.asn1.DERAbstractTime);
        pt.asn1.DERSequence = function(t3) {
          pt.asn1.DERSequence.superclass.constructor.call(this, t3);
          this.hT = "30";
          this.getFreshValueHex = function() {
            var t4 = "";
            for (var e3 = 0; e3 < this.asn1Array.length; e3++) {
              var r3 = this.asn1Array[e3];
              t4 += r3.getEncodedHex();
            }
            this.hV = t4;
            return this.hV;
          };
        };
        vt.lang.extend(pt.asn1.DERSequence, pt.asn1.DERAbstractStructured);
        pt.asn1.DERSet = function(t3) {
          pt.asn1.DERSet.superclass.constructor.call(this, t3);
          this.hT = "31";
          this.sortFlag = true;
          this.getFreshValueHex = function() {
            var t4 = new Array();
            for (var e3 = 0; e3 < this.asn1Array.length; e3++) {
              var r3 = this.asn1Array[e3];
              t4.push(r3.getEncodedHex());
            }
            if (true == this.sortFlag)
              t4.sort();
            this.hV = t4.join("");
            return this.hV;
          };
          if ("undefined" != typeof t3) {
            if ("undefined" != typeof t3.sortflag && false == t3.sortflag)
              this.sortFlag = false;
          }
        };
        vt.lang.extend(pt.asn1.DERSet, pt.asn1.DERAbstractStructured);
        pt.asn1.DERTaggedObject = function(t3) {
          pt.asn1.DERTaggedObject.superclass.constructor.call(this);
          this.hT = "a0";
          this.hV = "";
          this.isExplicit = true;
          this.asn1Object = null;
          this.setASN1Object = function(t4, e3, r3) {
            this.hT = e3;
            this.isExplicit = t4;
            this.asn1Object = r3;
            if (this.isExplicit) {
              this.hV = this.asn1Object.getEncodedHex();
              this.hTLV = null;
              this.isModified = true;
            } else {
              this.hV = null;
              this.hTLV = r3.getEncodedHex();
              this.hTLV = this.hTLV.replace(/^../, e3);
              this.isModified = false;
            }
          };
          this.getFreshValueHex = function() {
            return this.hV;
          };
          if ("undefined" != typeof t3) {
            if ("undefined" != typeof t3["tag"])
              this.hT = t3["tag"];
            if ("undefined" != typeof t3["explicit"])
              this.isExplicit = t3["explicit"];
            if ("undefined" != typeof t3["obj"]) {
              this.asn1Object = t3["obj"];
              this.setASN1Object(this.isExplicit, this.hT, this.asn1Object);
            }
          }
        };
        vt.lang.extend(pt.asn1.DERTaggedObject, pt.asn1.ASN1Object);
        var gt = function() {
          var t3 = function(e3, r3) {
            t3 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t4, e4) {
              t4.__proto__ = e4;
            } || function(t4, e4) {
              for (var r4 in e4)
                if (Object.prototype.hasOwnProperty.call(e4, r4))
                  t4[r4] = e4[r4];
            };
            return t3(e3, r3);
          };
          return function(e3, r3) {
            if ("function" !== typeof r3 && null !== r3)
              throw new TypeError("Class extends value " + String(r3) + " is not a constructor or null");
            t3(e3, r3);
            function i3() {
              this.constructor = e3;
            }
            e3.prototype = null === r3 ? Object.create(r3) : (i3.prototype = r3.prototype, new i3());
          };
        }();
        var yt = function(t3) {
          gt(e3, t3);
          function e3(r3) {
            var i3 = t3.call(this) || this;
            if (r3) {
              if ("string" === typeof r3)
                i3.parseKey(r3);
              else if (e3.hasPrivateKeyProperty(r3) || e3.hasPublicKeyProperty(r3))
                i3.parsePropertiesFrom(r3);
            }
            return i3;
          }
          e3.prototype.parseKey = function(t4) {
            try {
              var e4 = 0;
              var r3 = 0;
              var i3 = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
              var n2 = i3.test(t4) ? y.decode(t4) : w.unarmor(t4);
              var s2 = I.decode(n2);
              if (3 === s2.sub.length)
                s2 = s2.sub[2].sub[0];
              if (9 === s2.sub.length) {
                e4 = s2.sub[1].getHexStringValue();
                this.n = U(e4, 16);
                r3 = s2.sub[2].getHexStringValue();
                this.e = parseInt(r3, 16);
                var a2 = s2.sub[3].getHexStringValue();
                this.d = U(a2, 16);
                var o2 = s2.sub[4].getHexStringValue();
                this.p = U(o2, 16);
                var u2 = s2.sub[5].getHexStringValue();
                this.q = U(u2, 16);
                var c2 = s2.sub[6].getHexStringValue();
                this.dmp1 = U(c2, 16);
                var l2 = s2.sub[7].getHexStringValue();
                this.dmq1 = U(l2, 16);
                var f2 = s2.sub[8].getHexStringValue();
                this.coeff = U(f2, 16);
              } else if (2 === s2.sub.length) {
                var h2 = s2.sub[1];
                var d2 = h2.sub[0];
                e4 = d2.sub[0].getHexStringValue();
                this.n = U(e4, 16);
                r3 = d2.sub[1].getHexStringValue();
                this.e = parseInt(r3, 16);
              } else
                return false;
              return true;
            } catch (t5) {
              return false;
            }
          };
          e3.prototype.getPrivateBaseKey = function() {
            var t4 = { array: [new pt.asn1.DERInteger({ int: 0 }), new pt.asn1.DERInteger({ bigint: this.n }), new pt.asn1.DERInteger({ int: this.e }), new pt.asn1.DERInteger({ bigint: this.d }), new pt.asn1.DERInteger({ bigint: this.p }), new pt.asn1.DERInteger({ bigint: this.q }), new pt.asn1.DERInteger({ bigint: this.dmp1 }), new pt.asn1.DERInteger({ bigint: this.dmq1 }), new pt.asn1.DERInteger({ bigint: this.coeff })] };
            var e4 = new pt.asn1.DERSequence(t4);
            return e4.getEncodedHex();
          };
          e3.prototype.getPrivateBaseKeyB64 = function() {
            return d(this.getPrivateBaseKey());
          };
          e3.prototype.getPublicBaseKey = function() {
            var t4 = new pt.asn1.DERSequence({ array: [new pt.asn1.DERObjectIdentifier({ oid: "1.2.840.113549.1.1.1" }), new pt.asn1.DERNull()] });
            var e4 = new pt.asn1.DERSequence({ array: [new pt.asn1.DERInteger({ bigint: this.n }), new pt.asn1.DERInteger({ int: this.e })] });
            var r3 = new pt.asn1.DERBitString({ hex: "00" + e4.getEncodedHex() });
            var i3 = new pt.asn1.DERSequence({ array: [t4, r3] });
            return i3.getEncodedHex();
          };
          e3.prototype.getPublicBaseKeyB64 = function() {
            return d(this.getPublicBaseKey());
          };
          e3.wordwrap = function(t4, e4) {
            e4 = e4 || 64;
            if (!t4)
              return t4;
            var r3 = "(.{1," + e4 + "})( +|$\n?)|(.{1," + e4 + "})";
            return t4.match(RegExp(r3, "g")).join("\n");
          };
          e3.prototype.getPrivateKey = function() {
            var t4 = "-----BEGIN RSA PRIVATE KEY-----\n";
            t4 += e3.wordwrap(this.getPrivateBaseKeyB64()) + "\n";
            t4 += "-----END RSA PRIVATE KEY-----";
            return t4;
          };
          e3.prototype.getPublicKey = function() {
            var t4 = "-----BEGIN PUBLIC KEY-----\n";
            t4 += e3.wordwrap(this.getPublicBaseKeyB64()) + "\n";
            t4 += "-----END PUBLIC KEY-----";
            return t4;
          };
          e3.hasPublicKeyProperty = function(t4) {
            t4 = t4 || {};
            return t4.hasOwnProperty("n") && t4.hasOwnProperty("e");
          };
          e3.hasPrivateKeyProperty = function(t4) {
            t4 = t4 || {};
            return t4.hasOwnProperty("n") && t4.hasOwnProperty("e") && t4.hasOwnProperty("d") && t4.hasOwnProperty("p") && t4.hasOwnProperty("q") && t4.hasOwnProperty("dmp1") && t4.hasOwnProperty("dmq1") && t4.hasOwnProperty("coeff");
          };
          e3.prototype.parsePropertiesFrom = function(t4) {
            this.n = t4.n;
            this.e = t4.e;
            if (t4.hasOwnProperty("d")) {
              this.d = t4.d;
              this.p = t4.p;
              this.q = t4.q;
              this.dmp1 = t4.dmp1;
              this.dmq1 = t4.dmq1;
              this.coeff = t4.coeff;
            }
          };
          return e3;
        }(ut);
        const mt = { i: "3.2.1" };
        var wt = function() {
          function t3(t4) {
            if (void 0 === t4)
              t4 = {};
            t4 = t4 || {};
            this.default_key_size = t4.default_key_size ? parseInt(t4.default_key_size, 10) : 1024;
            this.default_public_exponent = t4.default_public_exponent || "010001";
            this.log = t4.log || false;
            this.key = null;
          }
          t3.prototype.setKey = function(t4) {
            if (this.log && this.key)
              console.warn("A key was already set, overriding existing.");
            this.key = new yt(t4);
          };
          t3.prototype.setPrivateKey = function(t4) {
            this.setKey(t4);
          };
          t3.prototype.setPublicKey = function(t4) {
            this.setKey(t4);
          };
          t3.prototype.decrypt = function(t4) {
            try {
              return this.getKey().decrypt(t4);
            } catch (t5) {
              return false;
            }
          };
          t3.prototype.encrypt = function(t4) {
            try {
              return this.getKey().encrypt(t4);
            } catch (t5) {
              return false;
            }
          };
          t3.prototype.encryptLong = function(t4) {
            try {
              return d(this.getKey().encryptLong(t4));
            } catch (t5) {
              return false;
            }
          };
          t3.prototype.decryptLong = function(t4) {
            try {
              return this.getKey().decryptLong(t4);
            } catch (t5) {
              return false;
            }
          };
          t3.prototype.sign = function(t4, e3, r3) {
            try {
              return d(this.getKey().sign(t4, e3, r3));
            } catch (t5) {
              return false;
            }
          };
          t3.prototype.verify = function(t4, e3, r3) {
            try {
              return this.getKey().verify(t4, v(e3), r3);
            } catch (t5) {
              return false;
            }
          };
          t3.prototype.getKey = function(t4) {
            if (!this.key) {
              this.key = new yt();
              if (t4 && "[object Function]" === {}.toString.call(t4)) {
                this.key.generateAsync(this.default_key_size, this.default_public_exponent, t4);
                return;
              }
              this.key.generate(this.default_key_size, this.default_public_exponent);
            }
            return this.key;
          };
          t3.prototype.getPrivateKey = function() {
            return this.getKey().getPrivateKey();
          };
          t3.prototype.getPrivateKeyB64 = function() {
            return this.getKey().getPrivateBaseKeyB64();
          };
          t3.prototype.getPublicKey = function() {
            return this.getKey().getPublicKey();
          };
          t3.prototype.getPublicKeyB64 = function() {
            return this.getKey().getPublicBaseKeyB64();
          };
          t3.version = mt.i;
          return t3;
        }();
        const _t = wt;
      }, 2480: () => {
      } };
      var e = {};
      function r(i2) {
        var n = e[i2];
        if (void 0 !== n)
          return n.exports;
        var s = e[i2] = { id: i2, loaded: false, exports: {} };
        t[i2].call(s.exports, s, s.exports, r);
        s.loaded = true;
        return s.exports;
      }
      (() => {
        r.d = (t2, e2) => {
          for (var i2 in e2)
            if (r.o(e2, i2) && !r.o(t2, i2))
              Object.defineProperty(t2, i2, { enumerable: true, get: e2[i2] });
        };
      })();
      (() => {
        r.g = function() {
          if ("object" === typeof globalThis)
            return globalThis;
          try {
            return this || new Function("return this")();
          } catch (t2) {
            if ("object" === typeof window)
              return window;
          }
        }();
      })();
      (() => {
        r.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2);
      })();
      (() => {
        r.r = (t2) => {
          if ("undefined" !== typeof Symbol && Symbol.toStringTag)
            Object.defineProperty(t2, Symbol.toStringTag, { value: "Module" });
          Object.defineProperty(t2, "__esModule", { value: true });
        };
      })();
      (() => {
        r.nmd = (t2) => {
          t2.paths = [];
          if (!t2.children)
            t2.children = [];
          return t2;
        };
      })();
      var i = r(9021);
      return i;
    })());
  })(gtpushMin);
  uni.invokePushCallback({
    type: "enabled"
  });
  {
    Promise.resolve().then(() => {
      uni.invokePushCallback({
        type: "clientId",
        cid: "",
        errMsg: "manifest.json->appid is required"
      });
    });
  }
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
      },
      resetUser(state) {
        state.user = {};
      }
    },
    actions: {
      addUser({ commit }, user) {
        commit("addUser", user);
      },
      resetUser({ commit }) {
        commit("resetUser");
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
