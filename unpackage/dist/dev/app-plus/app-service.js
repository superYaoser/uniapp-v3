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
  function resolveEasycom(component, easycom2) {
    return shared.isString(component) ? easycom2 : component;
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
  function isObject$1(obj) {
    return obj !== null && typeof obj === "object";
  }
  function isPromise(val) {
    return val && typeof val.then === "function";
  }
  function assert(condition2, msg) {
    if (!condition2) {
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
      var i2 = subs.indexOf(fn);
      if (i2 > -1) {
        subs.splice(i2, 1);
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
    if (isObject$1(type) && type.type) {
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
        path.forEach(function(p2) {
          if (!target[p2]) {
            target[p2] = {
              _custom: {
                value: {},
                display: p2,
                tooltip: "Module",
                abstract: true
              }
            };
          }
          target = target[p2]._custom.value;
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
    var names = path.split("/").filter(function(n2) {
      return n2;
    });
    return names.reduce(
      function(module, moduleName, i2) {
        var child = module[moduleName];
        if (!child) {
          throw new Error('Missing module "' + moduleName + '" for path "' + path + '".');
        }
        return i2 === names.length - 1 ? child : child._children;
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
  prototypeAccessors.state.set = function(v2) {
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
  const _sfc_main$l = {
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
        let code = this.icons.find((v2) => v2.font_class === this.type);
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
  function _sfc_render$k(_ctx, _cache, $props, $setup, $data, $options) {
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
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$k], ["__scopeId", "data-v-d31e1c47"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
  const _sfc_main$k = {
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
        useUniEmitCurrentRouterUpdate(router);
        uni.$emit("tabBarVisibilityUpdate", { tabBarVisibility: false });
        uni.$emit("topBarBackgroundColor", { bg: "#ffffff" });
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
  function _sfc_render$j(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
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
  const TabBar = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["render", _sfc_render$j], ["__scopeId", "data-v-270561e4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/common/TabBar.vue"]]);
  const _sfc_main$j = {
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
  function _sfc_render$i(_ctx, _cache, $props, $setup, $data, $options) {
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
  const TopBar = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$i], ["__scopeId", "data-v-35eb0c73"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/MainApp/TopBar.vue"]]);
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
  const _sfc_main$i = {
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
  function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { style: { "background": "#fff", "text-align": "center" } }, [
      $props.loading ? (vue.openBlock(), vue.createElementBlock("image", {
        key: 0,
        mode: "widthFix",
        src: "/static/images/utils/list_loading.gif",
        style: { "width": "90%", "height": "250rpx" }
      })) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const Loading = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$h], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/loading/Loading.vue"]]);
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
  const _sfc_main$h = {
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
        formatAppLog("log", "at components/article/ArticleCard.vue:133", "123123");
        let data = e.data;
        if (articleInfo.value.article_user_id == data.u_id) {
          articleInfo.value.concern_be = data.concern_be;
        }
      });
      uni.$on("articleCard_interaction_hand_update", function(e) {
        let data = e.data;
        if (articleInfo.value.article_id == data.article_id) {
          articleInfo.value.article_watch_num = data.watch;
          articleInfo.value.article_comment_num = data.comment;
          articleInfo.value.article_hand_support_num = data.hand;
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
      vue.onMounted(() => {
      });
      const needFollowModel = vue.ref(true);
      needFollowModel.value = props.needFollowModel;
      const tapArticleCard = (data) => {
        formatAppLog("log", "at components/article/ArticleCard.vue:173", "点击了文章卡");
        uni.navigateTo({
          url: "/pages/article/detail/ArticleDetailPage?id=" + data.article_id
        });
      };
      const tapAuthorCard = (data) => {
        formatAppLog("log", "at components/article/ArticleCard.vue:180", "点击了作者栏");
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
            formatAppLog("log", "at components/article/ArticleCard.vue:195", res);
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
        formatAppLog("log", "at components/article/ArticleCard.vue:215", "点击了关注");
      };
      const tapHandCard = (data) => {
        formatAppLog("log", "at components/article/ArticleCard.vue:219", "点击了点赞");
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
        replaceUrlIP
      };
    }
  };
  function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
    return vue.openBlock(), vue.createElementBlock("view", { class: "ArticleCard__container w100 h100" }, [
      vue.createCommentVNode("        单个       文章卡片"),
      vue.createElementVNode("view", { class: "active__cart w100 h100" }, [
        $setup.articleLoading ? (vue.openBlock(), vue.createBlock(_component_Loading, { key: 0 })) : (vue.openBlock(), vue.createElementBlock("view", {
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
                    onClick: _cache[2] || (_cache[2] = vue.withModifiers(($event) => $setup.tapHandCard(), ["stop"]))
                  }, [
                    vue.createVNode(_component_uni_icons, {
                      color: "#999999",
                      type: "hand-up",
                      size: "18"
                    }),
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
  const ArticleCard = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$g], ["__scopeId", "data-v-9eefd57b"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/ArticleCard.vue"]]);
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
  const _sfc_main$g = {
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
        for (let i2 = 0; i2 < 3; i2++) {
          classifyList.value[i2] = { categoryID: i2, classifyTitle: "", classifyContent: "类别描述", currentPage: 1, articleList: [{}] };
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
          for (let i2 = 0; i2 < articleList.length; i2++) {
            classifyList.value[index].articleList.push(articleList[i2]);
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
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
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
  const ArticlesList = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$f], ["__scopeId", "data-v-fc82db5d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/home/articlesList/ArticlesList.vue"]]);
  const _sfc_main$f = {
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
      vue.onMounted(() => {
      });
      return {
        articleNavIndex,
        articleNavColor,
        unArticleNavColor,
        changeCurrentNavPage
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
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
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
            vue.createElementVNode("view", { class: "header__search" }, " 搜索区域 "),
            vue.createCommentVNode("          导航"),
            vue.createElementVNode("view", { class: "header__nav" }, [
              vue.createElementVNode("view", { class: "header__nav__container" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "header__nav__container--late",
                    onClick: _cache[0] || (_cache[0] = ($event) => $setup.changeCurrentNavPage(0)),
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
                    onClick: _cache[1] || (_cache[1] = ($event) => $setup.changeCurrentNavPage(1)),
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
                    onClick: _cache[2] || (_cache[2] = ($event) => $setup.changeCurrentNavPage(2)),
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
  const Home = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$e], ["__scopeId", "data-v-a0df4f3d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/home/Home.vue"]]);
  const _sfc_main$e = {
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
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
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
  const Dynamic = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$d], ["__scopeId", "data-v-508725f9"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/pyq/Dynamic.vue"]]);
  const isObject = (val) => val !== null && typeof val === "object";
  const defaultDelimiters = ["{", "}"];
  class BaseFormatter {
    constructor() {
      this._caches = /* @__PURE__ */ Object.create(null);
    }
    interpolate(message, values, delimiters = defaultDelimiters) {
      if (!values) {
        return [message];
      }
      let tokens = this._caches[message];
      if (!tokens) {
        tokens = parse(message, delimiters);
        this._caches[message] = tokens;
      }
      return compile(tokens, values);
    }
  }
  const RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
  const RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;
  function parse(format, [startDelimiter, endDelimiter]) {
    const tokens = [];
    let position = 0;
    let text = "";
    while (position < format.length) {
      let char = format[position++];
      if (char === startDelimiter) {
        if (text) {
          tokens.push({ type: "text", value: text });
        }
        text = "";
        let sub = "";
        char = format[position++];
        while (char !== void 0 && char !== endDelimiter) {
          sub += char;
          char = format[position++];
        }
        const isClosed = char === endDelimiter;
        const type = RE_TOKEN_LIST_VALUE.test(sub) ? "list" : isClosed && RE_TOKEN_NAMED_VALUE.test(sub) ? "named" : "unknown";
        tokens.push({ value: sub, type });
      } else {
        text += char;
      }
    }
    text && tokens.push({ type: "text", value: text });
    return tokens;
  }
  function compile(tokens, values) {
    const compiled = [];
    let index = 0;
    const mode = Array.isArray(values) ? "list" : isObject(values) ? "named" : "unknown";
    if (mode === "unknown") {
      return compiled;
    }
    while (index < tokens.length) {
      const token = tokens[index];
      switch (token.type) {
        case "text":
          compiled.push(token.value);
          break;
        case "list":
          compiled.push(values[parseInt(token.value, 10)]);
          break;
        case "named":
          if (mode === "named") {
            compiled.push(values[token.value]);
          } else {
            {
              console.warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
            }
          }
          break;
        case "unknown":
          {
            console.warn(`Detect 'unknown' type of token!`);
          }
          break;
      }
      index++;
    }
    return compiled;
  }
  const LOCALE_ZH_HANS = "zh-Hans";
  const LOCALE_ZH_HANT = "zh-Hant";
  const LOCALE_EN = "en";
  const LOCALE_FR = "fr";
  const LOCALE_ES = "es";
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const defaultFormatter = new BaseFormatter();
  function include(str, parts) {
    return !!parts.find((part) => str.indexOf(part) !== -1);
  }
  function startsWith(str, parts) {
    return parts.find((part) => str.indexOf(part) === 0);
  }
  function normalizeLocale(locale, messages) {
    if (!locale) {
      return;
    }
    locale = locale.trim().replace(/_/g, "-");
    if (messages && messages[locale]) {
      return locale;
    }
    locale = locale.toLowerCase();
    if (locale === "chinese") {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf("zh") === 0) {
      if (locale.indexOf("-hans") > -1) {
        return LOCALE_ZH_HANS;
      }
      if (locale.indexOf("-hant") > -1) {
        return LOCALE_ZH_HANT;
      }
      if (include(locale, ["-tw", "-hk", "-mo", "-cht"])) {
        return LOCALE_ZH_HANT;
      }
      return LOCALE_ZH_HANS;
    }
    const lang = startsWith(locale, [LOCALE_EN, LOCALE_FR, LOCALE_ES]);
    if (lang) {
      return lang;
    }
  }
  class I18n {
    constructor({ locale, fallbackLocale, messages, watcher, formater }) {
      this.locale = LOCALE_EN;
      this.fallbackLocale = LOCALE_EN;
      this.message = {};
      this.messages = {};
      this.watchers = [];
      if (fallbackLocale) {
        this.fallbackLocale = fallbackLocale;
      }
      this.formater = formater || defaultFormatter;
      this.messages = messages || {};
      this.setLocale(locale || LOCALE_EN);
      if (watcher) {
        this.watchLocale(watcher);
      }
    }
    setLocale(locale) {
      const oldLocale = this.locale;
      this.locale = normalizeLocale(locale, this.messages) || this.fallbackLocale;
      if (!this.messages[this.locale]) {
        this.messages[this.locale] = {};
      }
      this.message = this.messages[this.locale];
      if (oldLocale !== this.locale) {
        this.watchers.forEach((watcher) => {
          watcher(this.locale, oldLocale);
        });
      }
    }
    getLocale() {
      return this.locale;
    }
    watchLocale(fn) {
      const index = this.watchers.push(fn) - 1;
      return () => {
        this.watchers.splice(index, 1);
      };
    }
    add(locale, message, override = true) {
      const curMessages = this.messages[locale];
      if (curMessages) {
        if (override) {
          Object.assign(curMessages, message);
        } else {
          Object.keys(message).forEach((key) => {
            if (!hasOwn(curMessages, key)) {
              curMessages[key] = message[key];
            }
          });
        }
      } else {
        this.messages[locale] = message;
      }
    }
    f(message, values, delimiters) {
      return this.formater.interpolate(message, values, delimiters).join("");
    }
    t(key, locale, values) {
      let message = this.message;
      if (typeof locale === "string") {
        locale = normalizeLocale(locale, this.messages);
        locale && (message = this.messages[locale]);
      } else {
        values = locale;
      }
      if (!hasOwn(message, key)) {
        console.warn(`Cannot translate the value of keypath ${key}. Use the value of keypath as default.`);
        return key;
      }
      return this.formater.interpolate(message[key], values).join("");
    }
  }
  function watchAppLocale(appVm, i18n) {
    if (appVm.$watchLocale) {
      appVm.$watchLocale((newLocale) => {
        i18n.setLocale(newLocale);
      });
    } else {
      appVm.$watch(() => appVm.$locale, (newLocale) => {
        i18n.setLocale(newLocale);
      });
    }
  }
  function getDefaultLocale() {
    if (typeof uni !== "undefined" && uni.getLocale) {
      return uni.getLocale();
    }
    if (typeof global !== "undefined" && global.getLocale) {
      return global.getLocale();
    }
    return LOCALE_EN;
  }
  function initVueI18n(locale, messages = {}, fallbackLocale, watcher) {
    if (typeof locale !== "string") {
      [locale, messages] = [
        messages,
        locale
      ];
    }
    if (typeof locale !== "string") {
      locale = getDefaultLocale();
    }
    if (typeof fallbackLocale !== "string") {
      fallbackLocale = typeof __uniConfig !== "undefined" && __uniConfig.fallbackLocale || LOCALE_EN;
    }
    const i18n = new I18n({
      locale,
      fallbackLocale,
      messages,
      watcher
    });
    let t2 = (key, values) => {
      if (typeof getApp !== "function") {
        t2 = function(key2, values2) {
          return i18n.t(key2, values2);
        };
      } else {
        let isWatchedAppLocale = false;
        t2 = function(key2, values2) {
          const appVm = getApp().$vm;
          if (appVm) {
            appVm.$locale;
            if (!isWatchedAppLocale) {
              isWatchedAppLocale = true;
              watchAppLocale(appVm, i18n);
            }
          }
          return i18n.t(key2, values2);
        };
      }
      return t2(key, values);
    };
    return {
      i18n,
      f(message, values, delimiters) {
        return i18n.f(message, values, delimiters);
      },
      t(key, values) {
        return t2(key, values);
      },
      add(locale2, message, override = true) {
        return i18n.add(locale2, message, override);
      },
      watch(fn) {
        return i18n.watchLocale(fn);
      },
      getLocale() {
        return i18n.getLocale();
      },
      setLocale(newLocale) {
        return i18n.setLocale(newLocale);
      }
    };
  }
  const easycom = {
    "^u-(.*)": "uview-ui/components/u-$1/u-$1.vue"
  };
  const pages = [
    {
      path: "pages/MainApp",
      style: {
        navigationBarTitleText: "首页",
        titleNView: false
      }
    },
    {
      path: "pages/article/detail/ArticleDetailPage",
      style: {
        navigationBarTitleText: "文章详细页",
        titleNView: false
      }
    },
    {
      path: "pages/loginRegister/loginRegister",
      style: {
        navigationBarTitleText: "",
        titleNView: false
      }
    },
    {
      path: "pages/testPage/testPage",
      style: {
        navigationBarTitleText: "",
        titleNView: false
      }
    }
  ];
  const globalStyle = {
    navigationBarTextStyle: "black",
    navigationBarTitleText: "uni-app",
    navigationBarBackgroundColor: "#F8F8F8",
    backgroundColor: "#F8F8F8"
  };
  const uniIdRouter = {};
  const condition = {
    current: 0,
    list: [
      {
        name: "",
        path: "pages/MainApp",
        query: ""
      }
    ]
  };
  const t = {
    easycom,
    pages,
    globalStyle,
    uniIdRouter,
    condition
  };
  function n(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
  }
  function s(e, t2, n2) {
    return e(n2 = { path: t2, exports: {}, require: function(e2, t3) {
      return function() {
        throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
      }(null == t3 && n2.path);
    } }, n2.exports), n2.exports;
  }
  var r = s(function(e, t2) {
    var n2;
    e.exports = (n2 = n2 || function(e2, t3) {
      var n3 = Object.create || function() {
        function e3() {
        }
        return function(t4) {
          var n4;
          return e3.prototype = t4, n4 = new e3(), e3.prototype = null, n4;
        };
      }(), s2 = {}, r2 = s2.lib = {}, i2 = r2.Base = { extend: function(e3) {
        var t4 = n3(this);
        return e3 && t4.mixIn(e3), t4.hasOwnProperty("init") && this.init !== t4.init || (t4.init = function() {
          t4.$super.init.apply(this, arguments);
        }), t4.init.prototype = t4, t4.$super = this, t4;
      }, create: function() {
        var e3 = this.extend();
        return e3.init.apply(e3, arguments), e3;
      }, init: function() {
      }, mixIn: function(e3) {
        for (var t4 in e3)
          e3.hasOwnProperty(t4) && (this[t4] = e3[t4]);
        e3.hasOwnProperty("toString") && (this.toString = e3.toString);
      }, clone: function() {
        return this.init.prototype.extend(this);
      } }, o2 = r2.WordArray = i2.extend({ init: function(e3, n4) {
        e3 = this.words = e3 || [], this.sigBytes = n4 != t3 ? n4 : 4 * e3.length;
      }, toString: function(e3) {
        return (e3 || c2).stringify(this);
      }, concat: function(e3) {
        var t4 = this.words, n4 = e3.words, s3 = this.sigBytes, r3 = e3.sigBytes;
        if (this.clamp(), s3 % 4)
          for (var i3 = 0; i3 < r3; i3++) {
            var o3 = n4[i3 >>> 2] >>> 24 - i3 % 4 * 8 & 255;
            t4[s3 + i3 >>> 2] |= o3 << 24 - (s3 + i3) % 4 * 8;
          }
        else
          for (i3 = 0; i3 < r3; i3 += 4)
            t4[s3 + i3 >>> 2] = n4[i3 >>> 2];
        return this.sigBytes += r3, this;
      }, clamp: function() {
        var t4 = this.words, n4 = this.sigBytes;
        t4[n4 >>> 2] &= 4294967295 << 32 - n4 % 4 * 8, t4.length = e2.ceil(n4 / 4);
      }, clone: function() {
        var e3 = i2.clone.call(this);
        return e3.words = this.words.slice(0), e3;
      }, random: function(t4) {
        for (var n4, s3 = [], r3 = function(t5) {
          t5 = t5;
          var n5 = 987654321, s4 = 4294967295;
          return function() {
            var r4 = ((n5 = 36969 * (65535 & n5) + (n5 >> 16) & s4) << 16) + (t5 = 18e3 * (65535 & t5) + (t5 >> 16) & s4) & s4;
            return r4 /= 4294967296, (r4 += 0.5) * (e2.random() > 0.5 ? 1 : -1);
          };
        }, i3 = 0; i3 < t4; i3 += 4) {
          var a3 = r3(4294967296 * (n4 || e2.random()));
          n4 = 987654071 * a3(), s3.push(4294967296 * a3() | 0);
        }
        return new o2.init(s3, t4);
      } }), a2 = s2.enc = {}, c2 = a2.Hex = { stringify: function(e3) {
        for (var t4 = e3.words, n4 = e3.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
          var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
          s3.push((i3 >>> 4).toString(16)), s3.push((15 & i3).toString(16));
        }
        return s3.join("");
      }, parse: function(e3) {
        for (var t4 = e3.length, n4 = [], s3 = 0; s3 < t4; s3 += 2)
          n4[s3 >>> 3] |= parseInt(e3.substr(s3, 2), 16) << 24 - s3 % 8 * 4;
        return new o2.init(n4, t4 / 2);
      } }, u2 = a2.Latin1 = { stringify: function(e3) {
        for (var t4 = e3.words, n4 = e3.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
          var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
          s3.push(String.fromCharCode(i3));
        }
        return s3.join("");
      }, parse: function(e3) {
        for (var t4 = e3.length, n4 = [], s3 = 0; s3 < t4; s3++)
          n4[s3 >>> 2] |= (255 & e3.charCodeAt(s3)) << 24 - s3 % 4 * 8;
        return new o2.init(n4, t4);
      } }, l2 = a2.Utf8 = { stringify: function(e3) {
        try {
          return decodeURIComponent(escape(u2.stringify(e3)));
        } catch (e4) {
          throw new Error("Malformed UTF-8 data");
        }
      }, parse: function(e3) {
        return u2.parse(unescape(encodeURIComponent(e3)));
      } }, h2 = r2.BufferedBlockAlgorithm = i2.extend({ reset: function() {
        this._data = new o2.init(), this._nDataBytes = 0;
      }, _append: function(e3) {
        "string" == typeof e3 && (e3 = l2.parse(e3)), this._data.concat(e3), this._nDataBytes += e3.sigBytes;
      }, _process: function(t4) {
        var n4 = this._data, s3 = n4.words, r3 = n4.sigBytes, i3 = this.blockSize, a3 = r3 / (4 * i3), c3 = (a3 = t4 ? e2.ceil(a3) : e2.max((0 | a3) - this._minBufferSize, 0)) * i3, u3 = e2.min(4 * c3, r3);
        if (c3) {
          for (var l3 = 0; l3 < c3; l3 += i3)
            this._doProcessBlock(s3, l3);
          var h3 = s3.splice(0, c3);
          n4.sigBytes -= u3;
        }
        return new o2.init(h3, u3);
      }, clone: function() {
        var e3 = i2.clone.call(this);
        return e3._data = this._data.clone(), e3;
      }, _minBufferSize: 0 });
      r2.Hasher = h2.extend({ cfg: i2.extend(), init: function(e3) {
        this.cfg = this.cfg.extend(e3), this.reset();
      }, reset: function() {
        h2.reset.call(this), this._doReset();
      }, update: function(e3) {
        return this._append(e3), this._process(), this;
      }, finalize: function(e3) {
        return e3 && this._append(e3), this._doFinalize();
      }, blockSize: 16, _createHelper: function(e3) {
        return function(t4, n4) {
          return new e3.init(n4).finalize(t4);
        };
      }, _createHmacHelper: function(e3) {
        return function(t4, n4) {
          return new d2.HMAC.init(e3, n4).finalize(t4);
        };
      } });
      var d2 = s2.algo = {};
      return s2;
    }(Math), n2);
  }), i = r, o = (s(function(e, t2) {
    var n2;
    e.exports = (n2 = i, function(e2) {
      var t3 = n2, s2 = t3.lib, r2 = s2.WordArray, i2 = s2.Hasher, o2 = t3.algo, a2 = [];
      !function() {
        for (var t4 = 0; t4 < 64; t4++)
          a2[t4] = 4294967296 * e2.abs(e2.sin(t4 + 1)) | 0;
      }();
      var c2 = o2.MD5 = i2.extend({ _doReset: function() {
        this._hash = new r2.init([1732584193, 4023233417, 2562383102, 271733878]);
      }, _doProcessBlock: function(e3, t4) {
        for (var n3 = 0; n3 < 16; n3++) {
          var s3 = t4 + n3, r3 = e3[s3];
          e3[s3] = 16711935 & (r3 << 8 | r3 >>> 24) | 4278255360 & (r3 << 24 | r3 >>> 8);
        }
        var i3 = this._hash.words, o3 = e3[t4 + 0], c3 = e3[t4 + 1], p2 = e3[t4 + 2], f2 = e3[t4 + 3], g2 = e3[t4 + 4], m2 = e3[t4 + 5], y2 = e3[t4 + 6], _2 = e3[t4 + 7], w2 = e3[t4 + 8], v2 = e3[t4 + 9], S2 = e3[t4 + 10], b2 = e3[t4 + 11], k2 = e3[t4 + 12], I2 = e3[t4 + 13], T = e3[t4 + 14], C2 = e3[t4 + 15], A2 = i3[0], P2 = i3[1], E2 = i3[2], O = i3[3];
        A2 = u2(A2, P2, E2, O, o3, 7, a2[0]), O = u2(O, A2, P2, E2, c3, 12, a2[1]), E2 = u2(E2, O, A2, P2, p2, 17, a2[2]), P2 = u2(P2, E2, O, A2, f2, 22, a2[3]), A2 = u2(A2, P2, E2, O, g2, 7, a2[4]), O = u2(O, A2, P2, E2, m2, 12, a2[5]), E2 = u2(E2, O, A2, P2, y2, 17, a2[6]), P2 = u2(P2, E2, O, A2, _2, 22, a2[7]), A2 = u2(A2, P2, E2, O, w2, 7, a2[8]), O = u2(O, A2, P2, E2, v2, 12, a2[9]), E2 = u2(E2, O, A2, P2, S2, 17, a2[10]), P2 = u2(P2, E2, O, A2, b2, 22, a2[11]), A2 = u2(A2, P2, E2, O, k2, 7, a2[12]), O = u2(O, A2, P2, E2, I2, 12, a2[13]), E2 = u2(E2, O, A2, P2, T, 17, a2[14]), A2 = l2(A2, P2 = u2(P2, E2, O, A2, C2, 22, a2[15]), E2, O, c3, 5, a2[16]), O = l2(O, A2, P2, E2, y2, 9, a2[17]), E2 = l2(E2, O, A2, P2, b2, 14, a2[18]), P2 = l2(P2, E2, O, A2, o3, 20, a2[19]), A2 = l2(A2, P2, E2, O, m2, 5, a2[20]), O = l2(O, A2, P2, E2, S2, 9, a2[21]), E2 = l2(E2, O, A2, P2, C2, 14, a2[22]), P2 = l2(P2, E2, O, A2, g2, 20, a2[23]), A2 = l2(A2, P2, E2, O, v2, 5, a2[24]), O = l2(O, A2, P2, E2, T, 9, a2[25]), E2 = l2(E2, O, A2, P2, f2, 14, a2[26]), P2 = l2(P2, E2, O, A2, w2, 20, a2[27]), A2 = l2(A2, P2, E2, O, I2, 5, a2[28]), O = l2(O, A2, P2, E2, p2, 9, a2[29]), E2 = l2(E2, O, A2, P2, _2, 14, a2[30]), A2 = h2(A2, P2 = l2(P2, E2, O, A2, k2, 20, a2[31]), E2, O, m2, 4, a2[32]), O = h2(O, A2, P2, E2, w2, 11, a2[33]), E2 = h2(E2, O, A2, P2, b2, 16, a2[34]), P2 = h2(P2, E2, O, A2, T, 23, a2[35]), A2 = h2(A2, P2, E2, O, c3, 4, a2[36]), O = h2(O, A2, P2, E2, g2, 11, a2[37]), E2 = h2(E2, O, A2, P2, _2, 16, a2[38]), P2 = h2(P2, E2, O, A2, S2, 23, a2[39]), A2 = h2(A2, P2, E2, O, I2, 4, a2[40]), O = h2(O, A2, P2, E2, o3, 11, a2[41]), E2 = h2(E2, O, A2, P2, f2, 16, a2[42]), P2 = h2(P2, E2, O, A2, y2, 23, a2[43]), A2 = h2(A2, P2, E2, O, v2, 4, a2[44]), O = h2(O, A2, P2, E2, k2, 11, a2[45]), E2 = h2(E2, O, A2, P2, C2, 16, a2[46]), A2 = d2(A2, P2 = h2(P2, E2, O, A2, p2, 23, a2[47]), E2, O, o3, 6, a2[48]), O = d2(O, A2, P2, E2, _2, 10, a2[49]), E2 = d2(E2, O, A2, P2, T, 15, a2[50]), P2 = d2(P2, E2, O, A2, m2, 21, a2[51]), A2 = d2(A2, P2, E2, O, k2, 6, a2[52]), O = d2(O, A2, P2, E2, f2, 10, a2[53]), E2 = d2(E2, O, A2, P2, S2, 15, a2[54]), P2 = d2(P2, E2, O, A2, c3, 21, a2[55]), A2 = d2(A2, P2, E2, O, w2, 6, a2[56]), O = d2(O, A2, P2, E2, C2, 10, a2[57]), E2 = d2(E2, O, A2, P2, y2, 15, a2[58]), P2 = d2(P2, E2, O, A2, I2, 21, a2[59]), A2 = d2(A2, P2, E2, O, g2, 6, a2[60]), O = d2(O, A2, P2, E2, b2, 10, a2[61]), E2 = d2(E2, O, A2, P2, p2, 15, a2[62]), P2 = d2(P2, E2, O, A2, v2, 21, a2[63]), i3[0] = i3[0] + A2 | 0, i3[1] = i3[1] + P2 | 0, i3[2] = i3[2] + E2 | 0, i3[3] = i3[3] + O | 0;
      }, _doFinalize: function() {
        var t4 = this._data, n3 = t4.words, s3 = 8 * this._nDataBytes, r3 = 8 * t4.sigBytes;
        n3[r3 >>> 5] |= 128 << 24 - r3 % 32;
        var i3 = e2.floor(s3 / 4294967296), o3 = s3;
        n3[15 + (r3 + 64 >>> 9 << 4)] = 16711935 & (i3 << 8 | i3 >>> 24) | 4278255360 & (i3 << 24 | i3 >>> 8), n3[14 + (r3 + 64 >>> 9 << 4)] = 16711935 & (o3 << 8 | o3 >>> 24) | 4278255360 & (o3 << 24 | o3 >>> 8), t4.sigBytes = 4 * (n3.length + 1), this._process();
        for (var a3 = this._hash, c3 = a3.words, u3 = 0; u3 < 4; u3++) {
          var l3 = c3[u3];
          c3[u3] = 16711935 & (l3 << 8 | l3 >>> 24) | 4278255360 & (l3 << 24 | l3 >>> 8);
        }
        return a3;
      }, clone: function() {
        var e3 = i2.clone.call(this);
        return e3._hash = this._hash.clone(), e3;
      } });
      function u2(e3, t4, n3, s3, r3, i3, o3) {
        var a3 = e3 + (t4 & n3 | ~t4 & s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function l2(e3, t4, n3, s3, r3, i3, o3) {
        var a3 = e3 + (t4 & s3 | n3 & ~s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function h2(e3, t4, n3, s3, r3, i3, o3) {
        var a3 = e3 + (t4 ^ n3 ^ s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function d2(e3, t4, n3, s3, r3, i3, o3) {
        var a3 = e3 + (n3 ^ (t4 | ~s3)) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      t3.MD5 = i2._createHelper(c2), t3.HmacMD5 = i2._createHmacHelper(c2);
    }(Math), n2.MD5);
  }), s(function(e, t2) {
    var n2;
    e.exports = (n2 = i, void function() {
      var e2 = n2, t3 = e2.lib.Base, s2 = e2.enc.Utf8;
      e2.algo.HMAC = t3.extend({ init: function(e3, t4) {
        e3 = this._hasher = new e3.init(), "string" == typeof t4 && (t4 = s2.parse(t4));
        var n3 = e3.blockSize, r2 = 4 * n3;
        t4.sigBytes > r2 && (t4 = e3.finalize(t4)), t4.clamp();
        for (var i2 = this._oKey = t4.clone(), o2 = this._iKey = t4.clone(), a2 = i2.words, c2 = o2.words, u2 = 0; u2 < n3; u2++)
          a2[u2] ^= 1549556828, c2[u2] ^= 909522486;
        i2.sigBytes = o2.sigBytes = r2, this.reset();
      }, reset: function() {
        var e3 = this._hasher;
        e3.reset(), e3.update(this._iKey);
      }, update: function(e3) {
        return this._hasher.update(e3), this;
      }, finalize: function(e3) {
        var t4 = this._hasher, n3 = t4.finalize(e3);
        return t4.reset(), t4.finalize(this._oKey.clone().concat(n3));
      } });
    }());
  }), s(function(e, t2) {
    e.exports = i.HmacMD5;
  })), a = s(function(e, t2) {
    e.exports = i.enc.Utf8;
  }), c = s(function(e, t2) {
    var n2;
    e.exports = (n2 = i, function() {
      var e2 = n2, t3 = e2.lib.WordArray;
      function s2(e3, n3, s3) {
        for (var r2 = [], i2 = 0, o2 = 0; o2 < n3; o2++)
          if (o2 % 4) {
            var a2 = s3[e3.charCodeAt(o2 - 1)] << o2 % 4 * 2, c2 = s3[e3.charCodeAt(o2)] >>> 6 - o2 % 4 * 2;
            r2[i2 >>> 2] |= (a2 | c2) << 24 - i2 % 4 * 8, i2++;
          }
        return t3.create(r2, i2);
      }
      e2.enc.Base64 = { stringify: function(e3) {
        var t4 = e3.words, n3 = e3.sigBytes, s3 = this._map;
        e3.clamp();
        for (var r2 = [], i2 = 0; i2 < n3; i2 += 3)
          for (var o2 = (t4[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255) << 16 | (t4[i2 + 1 >>> 2] >>> 24 - (i2 + 1) % 4 * 8 & 255) << 8 | t4[i2 + 2 >>> 2] >>> 24 - (i2 + 2) % 4 * 8 & 255, a2 = 0; a2 < 4 && i2 + 0.75 * a2 < n3; a2++)
            r2.push(s3.charAt(o2 >>> 6 * (3 - a2) & 63));
        var c2 = s3.charAt(64);
        if (c2)
          for (; r2.length % 4; )
            r2.push(c2);
        return r2.join("");
      }, parse: function(e3) {
        var t4 = e3.length, n3 = this._map, r2 = this._reverseMap;
        if (!r2) {
          r2 = this._reverseMap = [];
          for (var i2 = 0; i2 < n3.length; i2++)
            r2[n3.charCodeAt(i2)] = i2;
        }
        var o2 = n3.charAt(64);
        if (o2) {
          var a2 = e3.indexOf(o2);
          -1 !== a2 && (t4 = a2);
        }
        return s2(e3, t4, r2);
      }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" };
    }(), n2.enc.Base64);
  });
  const u = "FUNCTION", l = "OBJECT", h = "CLIENT_DB", d = "pending", p = "fullfilled", f = "rejected";
  function g(e) {
    return Object.prototype.toString.call(e).slice(8, -1).toLowerCase();
  }
  function m(e) {
    return "object" === g(e);
  }
  function y(e) {
    return "function" == typeof e;
  }
  function _(e) {
    return function() {
      try {
        return e.apply(e, arguments);
      } catch (e2) {
        console.error(e2);
      }
    };
  }
  const w = "REJECTED", v = "NOT_PENDING";
  class S {
    constructor({ createPromise: e, retryRule: t2 = w } = {}) {
      this.createPromise = e, this.status = null, this.promise = null, this.retryRule = t2;
    }
    get needRetry() {
      if (!this.status)
        return true;
      switch (this.retryRule) {
        case w:
          return this.status === f;
        case v:
          return this.status !== d;
      }
    }
    exec() {
      return this.needRetry ? (this.status = d, this.promise = this.createPromise().then((e) => (this.status = p, Promise.resolve(e)), (e) => (this.status = f, Promise.reject(e))), this.promise) : this.promise;
    }
  }
  function b(e) {
    return e && "string" == typeof e ? JSON.parse(e) : e;
  }
  const k = true, I = "app", C = b([]), A = I, P = b(""), E = b("[]") || [];
  let x = "";
  try {
    x = "";
  } catch (e) {
  }
  let R = {};
  function U(e, t2 = {}) {
    var n2, s2;
    return n2 = R, s2 = e, Object.prototype.hasOwnProperty.call(n2, s2) || (R[e] = t2), R[e];
  }
  R = uni._globalUniCloudObj ? uni._globalUniCloudObj : uni._globalUniCloudObj = {};
  const L = ["invoke", "success", "fail", "complete"], N = U("_globalUniCloudInterceptor");
  function D(e, t2) {
    N[e] || (N[e] = {}), m(t2) && Object.keys(t2).forEach((n2) => {
      L.indexOf(n2) > -1 && function(e2, t3, n3) {
        let s2 = N[e2][t3];
        s2 || (s2 = N[e2][t3] = []), -1 === s2.indexOf(n3) && y(n3) && s2.push(n3);
      }(e, n2, t2[n2]);
    });
  }
  function F(e, t2) {
    N[e] || (N[e] = {}), m(t2) ? Object.keys(t2).forEach((n2) => {
      L.indexOf(n2) > -1 && function(e2, t3, n3) {
        const s2 = N[e2][t3];
        if (!s2)
          return;
        const r2 = s2.indexOf(n3);
        r2 > -1 && s2.splice(r2, 1);
      }(e, n2, t2[n2]);
    }) : delete N[e];
  }
  function q(e, t2) {
    return e && 0 !== e.length ? e.reduce((e2, n2) => e2.then(() => n2(t2)), Promise.resolve()) : Promise.resolve();
  }
  function K(e, t2) {
    return N[e] && N[e][t2] || [];
  }
  function M(e) {
    D("callObject", e);
  }
  const j = U("_globalUniCloudListener"), B = "response", $ = "needLogin", W = "refreshToken", z = "clientdb", J = "cloudfunction", H = "cloudobject";
  function G(e) {
    return j[e] || (j[e] = []), j[e];
  }
  function V(e, t2) {
    const n2 = G(e);
    n2.includes(t2) || n2.push(t2);
  }
  function Y(e, t2) {
    const n2 = G(e), s2 = n2.indexOf(t2);
    -1 !== s2 && n2.splice(s2, 1);
  }
  function Q(e, t2) {
    const n2 = G(e);
    for (let e2 = 0; e2 < n2.length; e2++) {
      (0, n2[e2])(t2);
    }
  }
  let X, Z = false;
  function ee() {
    return X || (X = new Promise((e) => {
      Z && e(), function t2() {
        if ("function" == typeof getCurrentPages) {
          const t3 = getCurrentPages();
          t3 && t3[0] && (Z = true, e());
        }
        Z || setTimeout(() => {
          t2();
        }, 30);
      }();
    }), X);
  }
  function te(e) {
    const t2 = {};
    for (const n2 in e) {
      const s2 = e[n2];
      y(s2) && (t2[n2] = _(s2));
    }
    return t2;
  }
  class ne extends Error {
    constructor(e) {
      super(e.message), this.errMsg = e.message || e.errMsg || "unknown system error", this.code = this.errCode = e.code || e.errCode || "SYSTEM_ERROR", this.errSubject = this.subject = e.subject || e.errSubject, this.cause = e.cause, this.requestId = e.requestId;
    }
    toJson(e = 0) {
      if (!(e >= 10))
        return e++, { errCode: this.errCode, errMsg: this.errMsg, errSubject: this.errSubject, cause: this.cause && this.cause.toJson ? this.cause.toJson(e) : this.cause };
    }
  }
  var se = { request: (e) => uni.request(e), uploadFile: (e) => uni.uploadFile(e), setStorageSync: (e, t2) => uni.setStorageSync(e, t2), getStorageSync: (e) => uni.getStorageSync(e), removeStorageSync: (e) => uni.removeStorageSync(e), clearStorageSync: () => uni.clearStorageSync() };
  function re(e) {
    return e && re(e.__v_raw) || e;
  }
  function ie() {
    return { token: se.getStorageSync("uni_id_token") || se.getStorageSync("uniIdToken"), tokenExpired: se.getStorageSync("uni_id_token_expired") };
  }
  function oe({ token: e, tokenExpired: t2 } = {}) {
    e && se.setStorageSync("uni_id_token", e), t2 && se.setStorageSync("uni_id_token_expired", t2);
  }
  let ae, ce;
  function ue() {
    return ae || (ae = uni.getSystemInfoSync()), ae;
  }
  function le() {
    let e, t2;
    try {
      if (uni.getLaunchOptionsSync) {
        if (uni.getLaunchOptionsSync.toString().indexOf("not yet implemented") > -1)
          return;
        const { scene: n2, channel: s2 } = uni.getLaunchOptionsSync();
        e = s2, t2 = n2;
      }
    } catch (e2) {
    }
    return { channel: e, scene: t2 };
  }
  function he() {
    const e = uni.getLocale && uni.getLocale() || "en";
    if (ce)
      return { ...ce, locale: e, LOCALE: e };
    const t2 = ue(), { deviceId: n2, osName: s2, uniPlatform: r2, appId: i2 } = t2, o2 = ["pixelRatio", "brand", "model", "system", "language", "version", "platform", "host", "SDKVersion", "swanNativeVersion", "app", "AppPlatform", "fontSizeSetting"];
    for (let e2 = 0; e2 < o2.length; e2++) {
      delete t2[o2[e2]];
    }
    return ce = { PLATFORM: r2, OS: s2, APPID: i2, DEVICEID: n2, ...le(), ...t2 }, { ...ce, locale: e, LOCALE: e };
  }
  var de = { sign: function(e, t2) {
    let n2 = "";
    return Object.keys(e).sort().forEach(function(t3) {
      e[t3] && (n2 = n2 + "&" + t3 + "=" + e[t3]);
    }), n2 = n2.slice(1), o(n2, t2).toString();
  }, wrappedRequest: function(e, t2) {
    return new Promise((n2, s2) => {
      t2(Object.assign(e, { complete(e2) {
        e2 || (e2 = {});
        const t3 = e2.data && e2.data.header && e2.data.header["x-serverless-request-id"] || e2.header && e2.header["request-id"];
        if (!e2.statusCode || e2.statusCode >= 400)
          return s2(new ne({ code: "SYS_ERR", message: e2.errMsg || "request:fail", requestId: t3 }));
        const r2 = e2.data;
        if (r2.error)
          return s2(new ne({ code: r2.error.code, message: r2.error.message, requestId: t3 }));
        r2.result = r2.data, r2.requestId = t3, delete r2.data, n2(r2);
      } }));
    });
  }, toBase64: function(e) {
    return c.stringify(a.parse(e));
  } }, pe = { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" };
  const { t: fe } = initVueI18n({ "zh-Hans": { "uniCloud.init.paramRequired": "缺少参数：{param}", "uniCloud.uploadFile.fileError": "filePath应为File对象" }, "zh-Hant": { "uniCloud.init.paramRequired": "缺少参数：{param}", "uniCloud.uploadFile.fileError": "filePath应为File对象" }, en: pe, fr: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, es: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, ja: pe }, "zh-Hans");
  var ge = class {
    constructor(e) {
      ["spaceId", "clientSecret"].forEach((t2) => {
        if (!Object.prototype.hasOwnProperty.call(e, t2))
          throw new Error(fe("uniCloud.init.paramRequired", { param: t2 }));
      }), this.config = Object.assign({}, { endpoint: 0 === e.spaceId.indexOf("mp-") ? "https://api.next.bspapp.com" : "https://api.bspapp.com" }, e), this.config.provider = "aliyun", this.config.requestUrl = this.config.endpoint + "/client", this.config.envType = this.config.envType || "public", this.config.accessTokenKey = "access_token_" + this.config.spaceId, this.adapter = se, this._getAccessTokenPromiseHub = new S({ createPromise: () => this.requestAuth(this.setupRequest({ method: "serverless.auth.user.anonymousAuthorize", params: "{}" }, "auth")).then((e2) => {
        if (!e2.result || !e2.result.accessToken)
          throw new ne({ code: "AUTH_FAILED", message: "获取accessToken失败" });
        this.setAccessToken(e2.result.accessToken);
      }), retryRule: v });
    }
    get hasAccessToken() {
      return !!this.accessToken;
    }
    setAccessToken(e) {
      this.accessToken = e;
    }
    requestWrapped(e) {
      return de.wrappedRequest(e, this.adapter.request);
    }
    requestAuth(e) {
      return this.requestWrapped(e);
    }
    request(e, t2) {
      return Promise.resolve().then(() => this.hasAccessToken ? t2 ? this.requestWrapped(e) : this.requestWrapped(e).catch((t3) => new Promise((e2, n2) => {
        !t3 || "GATEWAY_INVALID_TOKEN" !== t3.code && "InvalidParameter.InvalidToken" !== t3.code ? n2(t3) : e2();
      }).then(() => this.getAccessToken()).then(() => {
        const t4 = this.rebuildRequest(e);
        return this.request(t4, true);
      })) : this.getAccessToken().then(() => {
        const t3 = this.rebuildRequest(e);
        return this.request(t3, true);
      }));
    }
    rebuildRequest(e) {
      const t2 = Object.assign({}, e);
      return t2.data.token = this.accessToken, t2.header["x-basement-token"] = this.accessToken, t2.header["x-serverless-sign"] = de.sign(t2.data, this.config.clientSecret), t2;
    }
    setupRequest(e, t2) {
      const n2 = Object.assign({}, e, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      return "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret), { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: s2 };
    }
    getAccessToken() {
      return this._getAccessTokenPromiseHub.exec();
    }
    async authorize() {
      await this.getAccessToken();
    }
    callFunction(e) {
      const t2 = { method: "serverless.function.runtime.invoke", params: JSON.stringify({ functionTarget: e.name, functionArgs: e.data || {} }) };
      return this.request(this.setupRequest(t2));
    }
    getOSSUploadOptionsFromPath(e) {
      const t2 = { method: "serverless.file.resource.generateProximalSign", params: JSON.stringify(e) };
      return this.request(this.setupRequest(t2));
    }
    uploadFileToOSS({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
      return new Promise((o2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, header: { "X-OSS-server-side-encrpytion": "AES256" }, success(e2) {
          e2 && e2.statusCode < 400 ? o2(e2) : a2(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
        }, fail(e2) {
          a2(new ne({ code: e2.code || "UPLOAD_FAILED", message: e2.message || e2.errMsg || "文件上传失败" }));
        } });
        "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e2) => {
          i2({ loaded: e2.totalBytesSent, total: e2.totalBytesExpectedToSend });
        });
      });
    }
    reportOSSUpload(e) {
      const t2 = { method: "serverless.file.resource.report", params: JSON.stringify(e) };
      return this.request(this.setupRequest(t2));
    }
    async uploadFile({ filePath: e, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2, config: r2 }) {
      if ("string" !== g(t2))
        throw new ne({ code: "INVALID_PARAM", message: "cloudPath必须为字符串类型" });
      if (!(t2 = t2.trim()))
        throw new ne({ code: "CLOUDPATH_REQUIRED", message: "cloudPath不可为空" });
      if (/:\/\//.test(t2))
        throw new ne({ code: "INVALID_PARAM", message: "cloudPath不合法" });
      const i2 = r2 && r2.envType || this.config.envType, o2 = (await this.getOSSUploadOptionsFromPath({ env: i2, filename: t2 })).result, a2 = "https://" + o2.cdnDomain + "/" + o2.ossPath, { securityToken: c2, accessKeyId: u2, signature: l2, host: h2, ossPath: d2, id: p2, policy: f2, ossCallbackUrl: m2 } = o2, y2 = { "Cache-Control": "max-age=2592000", "Content-Disposition": "attachment", OSSAccessKeyId: u2, Signature: l2, host: h2, id: p2, key: d2, policy: f2, success_action_status: 200 };
      if (c2 && (y2["x-oss-security-token"] = c2), m2) {
        const e2 = JSON.stringify({ callbackUrl: m2, callbackBody: JSON.stringify({ fileId: p2, spaceId: this.config.spaceId }), callbackBodyType: "application/json" });
        y2.callback = de.toBase64(e2);
      }
      const _2 = { url: "https://" + o2.host, formData: y2, fileName: "file", name: "file", filePath: e, fileType: n2 };
      if (await this.uploadFileToOSS(Object.assign({}, _2, { onUploadProgress: s2 })), m2)
        return { success: true, filePath: e, fileID: a2 };
      if ((await this.reportOSSUpload({ id: p2 })).success)
        return { success: true, filePath: e, fileID: a2 };
      throw new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" });
    }
    getTempFileURL({ fileList: e } = {}) {
      return new Promise((t2, n2) => {
        Array.isArray(e) && 0 !== e.length || n2(new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" })), t2({ fileList: e.map((e2) => ({ fileID: e2, tempFileURL: e2 })) });
      });
    }
    async getFileInfo({ fileList: e } = {}) {
      if (!Array.isArray(e) || 0 === e.length)
        throw new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
      const t2 = { method: "serverless.file.resource.info", params: JSON.stringify({ id: e.map((e2) => e2.split("?")[0]).join(",") }) };
      return { fileList: (await this.request(this.setupRequest(t2))).result };
    }
  };
  var me = { init(e) {
    const t2 = new ge(e), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  const ye = "undefined" != typeof location && "http:" === location.protocol ? "http:" : "https:";
  var _e;
  !function(e) {
    e.local = "local", e.none = "none", e.session = "session";
  }(_e || (_e = {}));
  var we = function() {
  };
  const ve = () => {
    let e;
    if (!Promise) {
      e = () => {
      }, e.promise = {};
      const t3 = () => {
        throw new ne({ message: 'Your Node runtime does support ES6 Promises. Set "global.Promise" to your preferred implementation of promises.' });
      };
      return Object.defineProperty(e.promise, "then", { get: t3 }), Object.defineProperty(e.promise, "catch", { get: t3 }), e;
    }
    const t2 = new Promise((t3, n2) => {
      e = (e2, s2) => e2 ? n2(e2) : t3(s2);
    });
    return e.promise = t2, e;
  };
  function Se(e) {
    return void 0 === e;
  }
  function be(e) {
    return "[object Null]" === Object.prototype.toString.call(e);
  }
  var ke;
  function Ie(e) {
    const t2 = (n2 = e, "[object Array]" === Object.prototype.toString.call(n2) ? e : [e]);
    var n2;
    for (const e2 of t2) {
      const { isMatch: t3, genAdapter: n3, runtime: s2 } = e2;
      if (t3())
        return { adapter: n3(), runtime: s2 };
    }
  }
  !function(e) {
    e.WEB = "web", e.WX_MP = "wx_mp";
  }(ke || (ke = {}));
  const Te = { adapter: null, runtime: void 0 }, Ce = ["anonymousUuidKey"];
  class Ae extends we {
    constructor() {
      super(), Te.adapter.root.tcbObject || (Te.adapter.root.tcbObject = {});
    }
    setItem(e, t2) {
      Te.adapter.root.tcbObject[e] = t2;
    }
    getItem(e) {
      return Te.adapter.root.tcbObject[e];
    }
    removeItem(e) {
      delete Te.adapter.root.tcbObject[e];
    }
    clear() {
      delete Te.adapter.root.tcbObject;
    }
  }
  function Pe(e, t2) {
    switch (e) {
      case "local":
        return t2.localStorage || new Ae();
      case "none":
        return new Ae();
      default:
        return t2.sessionStorage || new Ae();
    }
  }
  class Ee {
    constructor(e) {
      if (!this._storage) {
        this._persistence = Te.adapter.primaryStorage || e.persistence, this._storage = Pe(this._persistence, Te.adapter);
        const t2 = `access_token_${e.env}`, n2 = `access_token_expire_${e.env}`, s2 = `refresh_token_${e.env}`, r2 = `anonymous_uuid_${e.env}`, i2 = `login_type_${e.env}`, o2 = `user_info_${e.env}`;
        this.keys = { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2, anonymousUuidKey: r2, loginTypeKey: i2, userInfoKey: o2 };
      }
    }
    updatePersistence(e) {
      if (e === this._persistence)
        return;
      const t2 = "local" === this._persistence;
      this._persistence = e;
      const n2 = Pe(e, Te.adapter);
      for (const e2 in this.keys) {
        const s2 = this.keys[e2];
        if (t2 && Ce.includes(e2))
          continue;
        const r2 = this._storage.getItem(s2);
        Se(r2) || be(r2) || (n2.setItem(s2, r2), this._storage.removeItem(s2));
      }
      this._storage = n2;
    }
    setStore(e, t2, n2) {
      if (!this._storage)
        return;
      const s2 = { version: n2 || "localCachev1", content: t2 }, r2 = JSON.stringify(s2);
      try {
        this._storage.setItem(e, r2);
      } catch (e2) {
        throw e2;
      }
    }
    getStore(e, t2) {
      try {
        if (!this._storage)
          return;
      } catch (e2) {
        return "";
      }
      t2 = t2 || "localCachev1";
      const n2 = this._storage.getItem(e);
      if (!n2)
        return "";
      if (n2.indexOf(t2) >= 0) {
        return JSON.parse(n2).content;
      }
      return "";
    }
    removeStore(e) {
      this._storage.removeItem(e);
    }
  }
  const Oe = {}, xe = {};
  function Re(e) {
    return Oe[e];
  }
  class Ue {
    constructor(e, t2) {
      this.data = t2 || null, this.name = e;
    }
  }
  class Le extends Ue {
    constructor(e, t2) {
      super("error", { error: e, data: t2 }), this.error = e;
    }
  }
  const Ne = new class {
    constructor() {
      this._listeners = {};
    }
    on(e, t2) {
      return function(e2, t3, n2) {
        n2[e2] = n2[e2] || [], n2[e2].push(t3);
      }(e, t2, this._listeners), this;
    }
    off(e, t2) {
      return function(e2, t3, n2) {
        if (n2 && n2[e2]) {
          const s2 = n2[e2].indexOf(t3);
          -1 !== s2 && n2[e2].splice(s2, 1);
        }
      }(e, t2, this._listeners), this;
    }
    fire(e, t2) {
      if (e instanceof Le)
        return console.error(e.error), this;
      const n2 = "string" == typeof e ? new Ue(e, t2 || {}) : e;
      const s2 = n2.name;
      if (this._listens(s2)) {
        n2.target = this;
        const e2 = this._listeners[s2] ? [...this._listeners[s2]] : [];
        for (const t3 of e2)
          t3.call(this, n2);
      }
      return this;
    }
    _listens(e) {
      return this._listeners[e] && this._listeners[e].length > 0;
    }
  }();
  function De(e, t2) {
    Ne.on(e, t2);
  }
  function Fe(e, t2 = {}) {
    Ne.fire(e, t2);
  }
  function qe(e, t2) {
    Ne.off(e, t2);
  }
  const Ke = "loginStateChanged", Me = "loginStateExpire", je = "loginTypeChanged", Be = "anonymousConverted", $e = "refreshAccessToken";
  var We;
  !function(e) {
    e.ANONYMOUS = "ANONYMOUS", e.WECHAT = "WECHAT", e.WECHAT_PUBLIC = "WECHAT-PUBLIC", e.WECHAT_OPEN = "WECHAT-OPEN", e.CUSTOM = "CUSTOM", e.EMAIL = "EMAIL", e.USERNAME = "USERNAME", e.NULL = "NULL";
  }(We || (We = {}));
  const ze = ["auth.getJwt", "auth.logout", "auth.signInWithTicket", "auth.signInAnonymously", "auth.signIn", "auth.fetchAccessTokenWithRefreshToken", "auth.signUpWithEmailAndPassword", "auth.activateEndUserMail", "auth.sendPasswordResetEmail", "auth.resetPasswordWithToken", "auth.isUsernameRegistered"], Je = { "X-SDK-Version": "1.3.5" };
  function He(e, t2, n2) {
    const s2 = e[t2];
    e[t2] = function(t3) {
      const r2 = {}, i2 = {};
      n2.forEach((n3) => {
        const { data: s3, headers: o3 } = n3.call(e, t3);
        Object.assign(r2, s3), Object.assign(i2, o3);
      });
      const o2 = t3.data;
      return o2 && (() => {
        var e2;
        if (e2 = o2, "[object FormData]" !== Object.prototype.toString.call(e2))
          t3.data = { ...o2, ...r2 };
        else
          for (const e3 in r2)
            o2.append(e3, r2[e3]);
      })(), t3.headers = { ...t3.headers || {}, ...i2 }, s2.call(e, t3);
    };
  }
  function Ge() {
    const e = Math.random().toString(16).slice(2);
    return { data: { seqId: e }, headers: { ...Je, "x-seqid": e } };
  }
  class Ve {
    constructor(e = {}) {
      var t2;
      this.config = e, this._reqClass = new Te.adapter.reqClass({ timeout: this.config.timeout, timeoutMsg: `请求在${this.config.timeout / 1e3}s内未完成，已中断`, restrictedMethods: ["post"] }), this._cache = Re(this.config.env), this._localCache = (t2 = this.config.env, xe[t2]), He(this._reqClass, "post", [Ge]), He(this._reqClass, "upload", [Ge]), He(this._reqClass, "download", [Ge]);
    }
    async post(e) {
      return await this._reqClass.post(e);
    }
    async upload(e) {
      return await this._reqClass.upload(e);
    }
    async download(e) {
      return await this._reqClass.download(e);
    }
    async refreshAccessToken() {
      let e, t2;
      this._refreshAccessTokenPromise || (this._refreshAccessTokenPromise = this._refreshAccessToken());
      try {
        e = await this._refreshAccessTokenPromise;
      } catch (e2) {
        t2 = e2;
      }
      if (this._refreshAccessTokenPromise = null, this._shouldRefreshAccessTokenHook = null, t2)
        throw t2;
      return e;
    }
    async _refreshAccessToken() {
      const { accessTokenKey: e, accessTokenExpireKey: t2, refreshTokenKey: n2, loginTypeKey: s2, anonymousUuidKey: r2 } = this._cache.keys;
      this._cache.removeStore(e), this._cache.removeStore(t2);
      let i2 = this._cache.getStore(n2);
      if (!i2)
        throw new ne({ message: "未登录CloudBase" });
      const o2 = { refresh_token: i2 }, a2 = await this.request("auth.fetchAccessTokenWithRefreshToken", o2);
      if (a2.data.code) {
        const { code: e2 } = a2.data;
        if ("SIGN_PARAM_INVALID" === e2 || "REFRESH_TOKEN_EXPIRED" === e2 || "INVALID_REFRESH_TOKEN" === e2) {
          if (this._cache.getStore(s2) === We.ANONYMOUS && "INVALID_REFRESH_TOKEN" === e2) {
            const e3 = this._cache.getStore(r2), t3 = this._cache.getStore(n2), s3 = await this.send("auth.signInAnonymously", { anonymous_uuid: e3, refresh_token: t3 });
            return this.setRefreshToken(s3.refresh_token), this._refreshAccessToken();
          }
          Fe(Me), this._cache.removeStore(n2);
        }
        throw new ne({ code: a2.data.code, message: `刷新access token失败：${a2.data.code}` });
      }
      if (a2.data.access_token)
        return Fe($e), this._cache.setStore(e, a2.data.access_token), this._cache.setStore(t2, a2.data.access_token_expire + Date.now()), { accessToken: a2.data.access_token, accessTokenExpire: a2.data.access_token_expire };
      a2.data.refresh_token && (this._cache.removeStore(n2), this._cache.setStore(n2, a2.data.refresh_token), this._refreshAccessToken());
    }
    async getAccessToken() {
      const { accessTokenKey: e, accessTokenExpireKey: t2, refreshTokenKey: n2 } = this._cache.keys;
      if (!this._cache.getStore(n2))
        throw new ne({ message: "refresh token不存在，登录状态异常" });
      let s2 = this._cache.getStore(e), r2 = this._cache.getStore(t2), i2 = true;
      return this._shouldRefreshAccessTokenHook && !await this._shouldRefreshAccessTokenHook(s2, r2) && (i2 = false), (!s2 || !r2 || r2 < Date.now()) && i2 ? this.refreshAccessToken() : { accessToken: s2, accessTokenExpire: r2 };
    }
    async request(e, t2, n2) {
      const s2 = `x-tcb-trace_${this.config.env}`;
      let r2 = "application/x-www-form-urlencoded";
      const i2 = { action: e, env: this.config.env, dataVersion: "2019-08-16", ...t2 };
      if (-1 === ze.indexOf(e)) {
        const { refreshTokenKey: e2 } = this._cache.keys;
        this._cache.getStore(e2) && (i2.access_token = (await this.getAccessToken()).accessToken);
      }
      let o2;
      if ("storage.uploadFile" === e) {
        o2 = new FormData();
        for (let e2 in o2)
          o2.hasOwnProperty(e2) && void 0 !== o2[e2] && o2.append(e2, i2[e2]);
        r2 = "multipart/form-data";
      } else {
        r2 = "application/json", o2 = {};
        for (let e2 in i2)
          void 0 !== i2[e2] && (o2[e2] = i2[e2]);
      }
      let a2 = { headers: { "content-type": r2 } };
      n2 && n2.onUploadProgress && (a2.onUploadProgress = n2.onUploadProgress);
      const c2 = this._localCache.getStore(s2);
      c2 && (a2.headers["X-TCB-Trace"] = c2);
      const { parse: u2, inQuery: l2, search: h2 } = t2;
      let d2 = { env: this.config.env };
      u2 && (d2.parse = true), l2 && (d2 = { ...l2, ...d2 });
      let p2 = function(e2, t3, n3 = {}) {
        const s3 = /\?/.test(t3);
        let r3 = "";
        for (let e3 in n3)
          "" === r3 ? !s3 && (t3 += "?") : r3 += "&", r3 += `${e3}=${encodeURIComponent(n3[e3])}`;
        return /^http(s)?\:\/\//.test(t3 += r3) ? t3 : `${e2}${t3}`;
      }(ye, "//tcb-api.tencentcloudapi.com/web", d2);
      h2 && (p2 += h2);
      const f2 = await this.post({ url: p2, data: o2, ...a2 }), g2 = f2.header && f2.header["x-tcb-trace"];
      if (g2 && this._localCache.setStore(s2, g2), 200 !== Number(f2.status) && 200 !== Number(f2.statusCode) || !f2.data)
        throw new ne({ code: "NETWORK_ERROR", message: "network request error" });
      return f2;
    }
    async send(e, t2 = {}) {
      const n2 = await this.request(e, t2, { onUploadProgress: t2.onUploadProgress });
      if ("ACCESS_TOKEN_EXPIRED" === n2.data.code && -1 === ze.indexOf(e)) {
        await this.refreshAccessToken();
        const n3 = await this.request(e, t2, { onUploadProgress: t2.onUploadProgress });
        if (n3.data.code)
          throw new ne({ code: n3.data.code, message: n3.data.message });
        return n3.data;
      }
      if (n2.data.code)
        throw new ne({ code: n2.data.code, message: n2.data.message });
      return n2.data;
    }
    setRefreshToken(e) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e);
    }
  }
  const Ye = {};
  function Qe(e) {
    return Ye[e];
  }
  class Xe {
    constructor(e) {
      this.config = e, this._cache = Re(e.env), this._request = Qe(e.env);
    }
    setRefreshToken(e) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e);
    }
    setAccessToken(e, t2) {
      const { accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys;
      this._cache.setStore(n2, e), this._cache.setStore(s2, t2);
    }
    async refreshUserInfo() {
      const { data: e } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e), e;
    }
    setLocalUserInfo(e) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e);
    }
  }
  class Ze {
    constructor(e) {
      if (!e)
        throw new ne({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._envId = e, this._cache = Re(this._envId), this._request = Qe(this._envId), this.setUserInfo();
    }
    linkWithTicket(e) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "ticket must be string" });
      return this._request.send("auth.linkWithTicket", { ticket: e });
    }
    linkWithRedirect(e) {
      e.signInWithRedirect();
    }
    updatePassword(e, t2) {
      return this._request.send("auth.updatePassword", { oldPassword: t2, newPassword: e });
    }
    updateEmail(e) {
      return this._request.send("auth.updateEmail", { newEmail: e });
    }
    updateUsername(e) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      return this._request.send("auth.updateUsername", { username: e });
    }
    async getLinkedUidList() {
      const { data: e } = await this._request.send("auth.getLinkedUidList", {});
      let t2 = false;
      const { users: n2 } = e;
      return n2.forEach((e2) => {
        e2.wxOpenId && e2.wxPublicId && (t2 = true);
      }), { users: n2, hasPrimaryUid: t2 };
    }
    setPrimaryUid(e) {
      return this._request.send("auth.setPrimaryUid", { uid: e });
    }
    unlink(e) {
      return this._request.send("auth.unlink", { platform: e });
    }
    async update(e) {
      const { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 } = e, { data: a2 } = await this._request.send("auth.updateUserInfo", { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 });
      this.setLocalUserInfo(a2);
    }
    async refresh() {
      const { data: e } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e), e;
    }
    setUserInfo() {
      const { userInfoKey: e } = this._cache.keys, t2 = this._cache.getStore(e);
      ["uid", "loginType", "openid", "wxOpenId", "wxPublicId", "unionId", "qqMiniOpenId", "email", "hasPassword", "customUserId", "nickName", "gender", "avatarUrl"].forEach((e2) => {
        this[e2] = t2[e2];
      }), this.location = { country: t2.country, province: t2.province, city: t2.city };
    }
    setLocalUserInfo(e) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e), this.setUserInfo();
    }
  }
  class et {
    constructor(e) {
      if (!e)
        throw new ne({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._cache = Re(e);
      const { refreshTokenKey: t2, accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys, r2 = this._cache.getStore(t2), i2 = this._cache.getStore(n2), o2 = this._cache.getStore(s2);
      this.credential = { refreshToken: r2, accessToken: i2, accessTokenExpire: o2 }, this.user = new Ze(e);
    }
    get isAnonymousAuth() {
      return this.loginType === We.ANONYMOUS;
    }
    get isCustomAuth() {
      return this.loginType === We.CUSTOM;
    }
    get isWeixinAuth() {
      return this.loginType === We.WECHAT || this.loginType === We.WECHAT_OPEN || this.loginType === We.WECHAT_PUBLIC;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
  }
  class tt extends Xe {
    async signIn() {
      this._cache.updatePersistence("local");
      const { anonymousUuidKey: e, refreshTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e) || void 0, s2 = this._cache.getStore(t2) || void 0, r2 = await this._request.send("auth.signInAnonymously", { anonymous_uuid: n2, refresh_token: s2 });
      if (r2.uuid && r2.refresh_token) {
        this._setAnonymousUUID(r2.uuid), this.setRefreshToken(r2.refresh_token), await this._request.refreshAccessToken(), Fe(Ke), Fe(je, { env: this.config.env, loginType: We.ANONYMOUS, persistence: "local" });
        const e2 = new et(this.config.env);
        return await e2.user.refresh(), e2;
      }
      throw new ne({ message: "匿名登录失败" });
    }
    async linkAndRetrieveDataWithTicket(e) {
      const { anonymousUuidKey: t2, refreshTokenKey: n2 } = this._cache.keys, s2 = this._cache.getStore(t2), r2 = this._cache.getStore(n2), i2 = await this._request.send("auth.linkAndRetrieveDataWithTicket", { anonymous_uuid: s2, refresh_token: r2, ticket: e });
      if (i2.refresh_token)
        return this._clearAnonymousUUID(), this.setRefreshToken(i2.refresh_token), await this._request.refreshAccessToken(), Fe(Be, { env: this.config.env }), Fe(je, { loginType: We.CUSTOM, persistence: "local" }), { credential: { refreshToken: i2.refresh_token } };
      throw new ne({ message: "匿名转化失败" });
    }
    _setAnonymousUUID(e) {
      const { anonymousUuidKey: t2, loginTypeKey: n2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.setStore(t2, e), this._cache.setStore(n2, We.ANONYMOUS);
    }
    _clearAnonymousUUID() {
      this._cache.removeStore(this._cache.keys.anonymousUuidKey);
    }
  }
  class nt extends Xe {
    async signIn(e) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "ticket must be a string" });
      const { refreshTokenKey: t2 } = this._cache.keys, n2 = await this._request.send("auth.signInWithTicket", { ticket: e, refresh_token: this._cache.getStore(t2) || "" });
      if (n2.refresh_token)
        return this.setRefreshToken(n2.refresh_token), await this._request.refreshAccessToken(), Fe(Ke), Fe(je, { env: this.config.env, loginType: We.CUSTOM, persistence: this.config.persistence }), await this.refreshUserInfo(), new et(this.config.env);
      throw new ne({ message: "自定义登录失败" });
    }
  }
  class st extends Xe {
    async signIn(e, t2) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "email must be a string" });
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: "EMAIL", email: e, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token: i2, access_token_expire: o2 } = s2;
      if (r2)
        return this.setRefreshToken(r2), i2 && o2 ? this.setAccessToken(i2, o2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Fe(Ke), Fe(je, { env: this.config.env, loginType: We.EMAIL, persistence: this.config.persistence }), new et(this.config.env);
      throw s2.code ? new ne({ code: s2.code, message: `邮箱登录失败: ${s2.message}` }) : new ne({ message: "邮箱登录失败" });
    }
    async activate(e) {
      return this._request.send("auth.activateEndUserMail", { token: e });
    }
    async resetPasswordWithToken(e, t2) {
      return this._request.send("auth.resetPasswordWithToken", { token: e, newPassword: t2 });
    }
  }
  class rt extends Xe {
    async signIn(e, t2) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      "string" != typeof t2 && (t2 = "", console.warn("password is empty"));
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: We.USERNAME, username: e, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token_expire: i2, access_token: o2 } = s2;
      if (r2)
        return this.setRefreshToken(r2), o2 && i2 ? this.setAccessToken(o2, i2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Fe(Ke), Fe(je, { env: this.config.env, loginType: We.USERNAME, persistence: this.config.persistence }), new et(this.config.env);
      throw s2.code ? new ne({ code: s2.code, message: `用户名密码登录失败: ${s2.message}` }) : new ne({ message: "用户名密码登录失败" });
    }
  }
  class it {
    constructor(e) {
      this.config = e, this._cache = Re(e.env), this._request = Qe(e.env), this._onAnonymousConverted = this._onAnonymousConverted.bind(this), this._onLoginTypeChanged = this._onLoginTypeChanged.bind(this), De(je, this._onLoginTypeChanged);
    }
    get currentUser() {
      const e = this.hasLoginState();
      return e && e.user || null;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
    anonymousAuthProvider() {
      return new tt(this.config);
    }
    customAuthProvider() {
      return new nt(this.config);
    }
    emailAuthProvider() {
      return new st(this.config);
    }
    usernameAuthProvider() {
      return new rt(this.config);
    }
    async signInAnonymously() {
      return new tt(this.config).signIn();
    }
    async signInWithEmailAndPassword(e, t2) {
      return new st(this.config).signIn(e, t2);
    }
    signInWithUsernameAndPassword(e, t2) {
      return new rt(this.config).signIn(e, t2);
    }
    async linkAndRetrieveDataWithTicket(e) {
      this._anonymousAuthProvider || (this._anonymousAuthProvider = new tt(this.config)), De(Be, this._onAnonymousConverted);
      return await this._anonymousAuthProvider.linkAndRetrieveDataWithTicket(e);
    }
    async signOut() {
      if (this.loginType === We.ANONYMOUS)
        throw new ne({ message: "匿名用户不支持登出操作" });
      const { refreshTokenKey: e, accessTokenKey: t2, accessTokenExpireKey: n2 } = this._cache.keys, s2 = this._cache.getStore(e);
      if (!s2)
        return;
      const r2 = await this._request.send("auth.logout", { refresh_token: s2 });
      return this._cache.removeStore(e), this._cache.removeStore(t2), this._cache.removeStore(n2), Fe(Ke), Fe(je, { env: this.config.env, loginType: We.NULL, persistence: this.config.persistence }), r2;
    }
    async signUpWithEmailAndPassword(e, t2) {
      return this._request.send("auth.signUpWithEmailAndPassword", { email: e, password: t2 });
    }
    async sendPasswordResetEmail(e) {
      return this._request.send("auth.sendPasswordResetEmail", { email: e });
    }
    onLoginStateChanged(e) {
      De(Ke, () => {
        const t3 = this.hasLoginState();
        e.call(this, t3);
      });
      const t2 = this.hasLoginState();
      e.call(this, t2);
    }
    onLoginStateExpired(e) {
      De(Me, e.bind(this));
    }
    onAccessTokenRefreshed(e) {
      De($e, e.bind(this));
    }
    onAnonymousConverted(e) {
      De(Be, e.bind(this));
    }
    onLoginTypeChanged(e) {
      De(je, () => {
        const t2 = this.hasLoginState();
        e.call(this, t2);
      });
    }
    async getAccessToken() {
      return { accessToken: (await this._request.getAccessToken()).accessToken, env: this.config.env };
    }
    hasLoginState() {
      const { refreshTokenKey: e } = this._cache.keys;
      return this._cache.getStore(e) ? new et(this.config.env) : null;
    }
    async isUsernameRegistered(e) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      const { data: t2 } = await this._request.send("auth.isUsernameRegistered", { username: e });
      return t2 && t2.isRegistered;
    }
    getLoginState() {
      return Promise.resolve(this.hasLoginState());
    }
    async signInWithTicket(e) {
      return new nt(this.config).signIn(e);
    }
    shouldRefreshAccessToken(e) {
      this._request._shouldRefreshAccessTokenHook = e.bind(this);
    }
    getUserInfo() {
      return this._request.send("auth.getUserInfo", {}).then((e) => e.code ? e : { ...e.data, requestId: e.seqId });
    }
    getAuthHeader() {
      const { refreshTokenKey: e, accessTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e);
      return { "x-cloudbase-credentials": this._cache.getStore(t2) + "/@@/" + n2 };
    }
    _onAnonymousConverted(e) {
      const { env: t2 } = e.data;
      t2 === this.config.env && this._cache.updatePersistence(this.config.persistence);
    }
    _onLoginTypeChanged(e) {
      const { loginType: t2, persistence: n2, env: s2 } = e.data;
      s2 === this.config.env && (this._cache.updatePersistence(n2), this._cache.setStore(this._cache.keys.loginTypeKey, t2));
    }
  }
  const ot = function(e, t2) {
    t2 = t2 || ve();
    const n2 = Qe(this.config.env), { cloudPath: s2, filePath: r2, onUploadProgress: i2, fileType: o2 = "image" } = e;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e2) => {
      const { data: { url: a2, authorization: c2, token: u2, fileId: l2, cosFileId: h2 }, requestId: d2 } = e2, p2 = { key: s2, signature: c2, "x-cos-meta-fileid": h2, success_action_status: "201", "x-cos-security-token": u2 };
      n2.upload({ url: a2, data: p2, file: r2, name: s2, fileType: o2, onUploadProgress: i2 }).then((e3) => {
        201 === e3.statusCode ? t2(null, { fileID: l2, requestId: d2 }) : t2(new ne({ code: "STORAGE_REQUEST_FAIL", message: `STORAGE_REQUEST_FAIL: ${e3.data}` }));
      }).catch((e3) => {
        t2(e3);
      });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, at = function(e, t2) {
    t2 = t2 || ve();
    const n2 = Qe(this.config.env), { cloudPath: s2 } = e;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e2) => {
      t2(null, e2);
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, ct = function({ fileList: e }, t2) {
    if (t2 = t2 || ve(), !e || !Array.isArray(e))
      return { code: "INVALID_PARAM", message: "fileList必须是非空的数组" };
    for (let t3 of e)
      if (!t3 || "string" != typeof t3)
        return { code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" };
    const n2 = { fileid_list: e };
    return Qe(this.config.env).send("storage.batchDeleteFile", n2).then((e2) => {
      e2.code ? t2(null, e2) : t2(null, { fileList: e2.data.delete_list, requestId: e2.requestId });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, ut = function({ fileList: e }, t2) {
    t2 = t2 || ve(), e && Array.isArray(e) || t2(null, { code: "INVALID_PARAM", message: "fileList必须是非空的数组" });
    let n2 = [];
    for (let s3 of e)
      "object" == typeof s3 ? (s3.hasOwnProperty("fileID") && s3.hasOwnProperty("maxAge") || t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是包含fileID和maxAge的对象" }), n2.push({ fileid: s3.fileID, max_age: s3.maxAge })) : "string" == typeof s3 ? n2.push({ fileid: s3 }) : t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是字符串" });
    const s2 = { file_list: n2 };
    return Qe(this.config.env).send("storage.batchGetDownloadUrl", s2).then((e2) => {
      e2.code ? t2(null, e2) : t2(null, { fileList: e2.data.download_list, requestId: e2.requestId });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, lt = async function({ fileID: e }, t2) {
    const n2 = (await ut.call(this, { fileList: [{ fileID: e, maxAge: 600 }] })).fileList[0];
    if ("SUCCESS" !== n2.code)
      return t2 ? t2(n2) : new Promise((e2) => {
        e2(n2);
      });
    const s2 = Qe(this.config.env);
    let r2 = n2.download_url;
    if (r2 = encodeURI(r2), !t2)
      return s2.download({ url: r2 });
    t2(await s2.download({ url: r2 }));
  }, ht = function({ name: e, data: t2, query: n2, parse: s2, search: r2 }, i2) {
    const o2 = i2 || ve();
    let a2;
    try {
      a2 = t2 ? JSON.stringify(t2) : "";
    } catch (e2) {
      return Promise.reject(e2);
    }
    if (!e)
      return Promise.reject(new ne({ code: "PARAM_ERROR", message: "函数名不能为空" }));
    const c2 = { inQuery: n2, parse: s2, search: r2, function_name: e, request_data: a2 };
    return Qe(this.config.env).send("functions.invokeFunction", c2).then((e2) => {
      if (e2.code)
        o2(null, e2);
      else {
        let t3 = e2.data.response_data;
        if (s2)
          o2(null, { result: t3, requestId: e2.requestId });
        else
          try {
            t3 = JSON.parse(e2.data.response_data), o2(null, { result: t3, requestId: e2.requestId });
          } catch (e3) {
            o2(new ne({ message: "response data must be json" }));
          }
      }
      return o2.promise;
    }).catch((e2) => {
      o2(e2);
    }), o2.promise;
  }, dt = { timeout: 15e3, persistence: "session" }, pt = {};
  class ft {
    constructor(e) {
      this.config = e || this.config, this.authObj = void 0;
    }
    init(e) {
      switch (Te.adapter || (this.requestClient = new Te.adapter.reqClass({ timeout: e.timeout || 5e3, timeoutMsg: `请求在${(e.timeout || 5e3) / 1e3}s内未完成，已中断` })), this.config = { ...dt, ...e }, true) {
        case this.config.timeout > 6e5:
          console.warn("timeout大于可配置上限[10分钟]，已重置为上限数值"), this.config.timeout = 6e5;
          break;
        case this.config.timeout < 100:
          console.warn("timeout小于可配置下限[100ms]，已重置为下限数值"), this.config.timeout = 100;
      }
      return new ft(this.config);
    }
    auth({ persistence: e } = {}) {
      if (this.authObj)
        return this.authObj;
      const t2 = e || Te.adapter.primaryStorage || dt.persistence;
      var n2;
      return t2 !== this.config.persistence && (this.config.persistence = t2), function(e2) {
        const { env: t3 } = e2;
        Oe[t3] = new Ee(e2), xe[t3] = new Ee({ ...e2, persistence: "local" });
      }(this.config), n2 = this.config, Ye[n2.env] = new Ve(n2), this.authObj = new it(this.config), this.authObj;
    }
    on(e, t2) {
      return De.apply(this, [e, t2]);
    }
    off(e, t2) {
      return qe.apply(this, [e, t2]);
    }
    callFunction(e, t2) {
      return ht.apply(this, [e, t2]);
    }
    deleteFile(e, t2) {
      return ct.apply(this, [e, t2]);
    }
    getTempFileURL(e, t2) {
      return ut.apply(this, [e, t2]);
    }
    downloadFile(e, t2) {
      return lt.apply(this, [e, t2]);
    }
    uploadFile(e, t2) {
      return ot.apply(this, [e, t2]);
    }
    getUploadMetadata(e, t2) {
      return at.apply(this, [e, t2]);
    }
    registerExtension(e) {
      pt[e.name] = e;
    }
    async invokeExtension(e, t2) {
      const n2 = pt[e];
      if (!n2)
        throw new ne({ message: `扩展${e} 必须先注册` });
      return await n2.invoke(t2, this);
    }
    useAdapters(e) {
      const { adapter: t2, runtime: n2 } = Ie(e) || {};
      t2 && (Te.adapter = t2), n2 && (Te.runtime = n2);
    }
  }
  var gt = new ft();
  function mt(e, t2, n2) {
    void 0 === n2 && (n2 = {});
    var s2 = /\?/.test(t2), r2 = "";
    for (var i2 in n2)
      "" === r2 ? !s2 && (t2 += "?") : r2 += "&", r2 += i2 + "=" + encodeURIComponent(n2[i2]);
    return /^http(s)?:\/\//.test(t2 += r2) ? t2 : "" + e + t2;
  }
  class yt {
    post(e) {
      const { url: t2, data: n2, headers: s2 } = e;
      return new Promise((e2, r2) => {
        se.request({ url: mt("https:", t2), data: n2, method: "POST", header: s2, success(t3) {
          e2(t3);
        }, fail(e3) {
          r2(e3);
        } });
      });
    }
    upload(e) {
      return new Promise((t2, n2) => {
        const { url: s2, file: r2, data: i2, headers: o2, fileType: a2 } = e, c2 = se.uploadFile({ url: mt("https:", s2), name: "file", formData: Object.assign({}, i2), filePath: r2, fileType: a2, header: o2, success(e2) {
          const n3 = { statusCode: e2.statusCode, data: e2.data || {} };
          200 === e2.statusCode && i2.success_action_status && (n3.statusCode = parseInt(i2.success_action_status, 10)), t2(n3);
        }, fail(e2) {
          n2(new Error(e2.errMsg || "uploadFile:fail"));
        } });
        "function" == typeof e.onUploadProgress && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((t3) => {
          e.onUploadProgress({ loaded: t3.totalBytesSent, total: t3.totalBytesExpectedToSend });
        });
      });
    }
  }
  const _t = { setItem(e, t2) {
    se.setStorageSync(e, t2);
  }, getItem: (e) => se.getStorageSync(e), removeItem(e) {
    se.removeStorageSync(e);
  }, clear() {
    se.clearStorageSync();
  } };
  var wt = { genAdapter: function() {
    return { root: {}, reqClass: yt, localStorage: _t, primaryStorage: "local" };
  }, isMatch: function() {
    return true;
  }, runtime: "uni_app" };
  gt.useAdapters(wt);
  const vt = gt, St = vt.init;
  vt.init = function(e) {
    e.env = e.spaceId;
    const t2 = St.call(this, e);
    t2.config.provider = "tencent", t2.config.spaceId = e.spaceId;
    const n2 = t2.auth;
    return t2.auth = function(e2) {
      const t3 = n2.call(this, e2);
      return ["linkAndRetrieveDataWithTicket", "signInAnonymously", "signOut", "getAccessToken", "getLoginState", "signInWithTicket", "getUserInfo"].forEach((e3) => {
        var n3;
        t3[e3] = (n3 = t3[e3], function(e4) {
          e4 = e4 || {};
          const { success: t4, fail: s2, complete: r2 } = te(e4);
          if (!(t4 || s2 || r2))
            return n3.call(this, e4);
          n3.call(this, e4).then((e5) => {
            t4 && t4(e5), r2 && r2(e5);
          }, (e5) => {
            s2 && s2(e5), r2 && r2(e5);
          });
        }).bind(t3);
      }), t3;
    }, t2.customAuth = t2.auth, t2;
  };
  var bt = vt;
  var kt = class extends ge {
    getAccessToken() {
      return new Promise((e, t2) => {
        const n2 = "Anonymous_Access_token";
        this.setAccessToken(n2), e(n2);
      });
    }
    setupRequest(e, t2) {
      const n2 = Object.assign({}, e, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret);
      const r2 = he();
      s2["x-client-info"] = encodeURIComponent(JSON.stringify(r2));
      const { token: i2 } = ie();
      return s2["x-client-token"] = i2, { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: JSON.parse(JSON.stringify(s2)) };
    }
    uploadFileToOSS({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
      return new Promise((o2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, success(e2) {
          e2 && e2.statusCode < 400 ? o2(e2) : a2(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
        }, fail(e2) {
          a2(new ne({ code: e2.code || "UPLOAD_FAILED", message: e2.message || e2.errMsg || "文件上传失败" }));
        } });
        "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e2) => {
          i2({ loaded: e2.totalBytesSent, total: e2.totalBytesExpectedToSend });
        });
      });
    }
    uploadFile({ filePath: e, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2 }) {
      if (!t2)
        throw new ne({ code: "CLOUDPATH_REQUIRED", message: "cloudPath不可为空" });
      let r2;
      return this.getOSSUploadOptionsFromPath({ cloudPath: t2 }).then((t3) => {
        const { url: i2, formData: o2, name: a2 } = t3.result;
        r2 = t3.result.fileUrl;
        const c2 = { url: i2, formData: o2, name: a2, filePath: e, fileType: n2 };
        return this.uploadFileToOSS(Object.assign({}, c2, { onUploadProgress: s2 }));
      }).then(() => this.reportOSSUpload({ cloudPath: t2 })).then((t3) => new Promise((n3, s3) => {
        t3.success ? n3({ success: true, filePath: e, fileID: r2 }) : s3(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
      }));
    }
    deleteFile({ fileList: e }) {
      const t2 = { method: "serverless.file.resource.delete", params: JSON.stringify({ fileList: e }) };
      return this.request(this.setupRequest(t2)).then((e2) => {
        if (e2.success)
          return e2.result;
        throw new ne({ code: "DELETE_FILE_FAILED", message: "删除文件失败" });
      });
    }
    getTempFileURL({ fileList: e } = {}) {
      if (!Array.isArray(e) || 0 === e.length)
        throw new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
      const t2 = { method: "serverless.file.resource.getTempFileURL", params: JSON.stringify({ fileList: e }) };
      return this.request(this.setupRequest(t2)).then((e2) => {
        if (e2.success)
          return { fileList: e2.result.fileList.map((e3) => ({ fileID: e3.fileID, tempFileURL: e3.tempFileURL })) };
        throw new ne({ code: "GET_TEMP_FILE_URL_FAILED", message: "获取临时文件链接失败" });
      });
    }
  };
  var It = { init(e) {
    const t2 = new kt(e), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  function Tt({ data: e }) {
    let t2;
    t2 = he();
    const n2 = JSON.parse(JSON.stringify(e || {}));
    if (Object.assign(n2, { clientInfo: t2 }), !n2.uniIdToken) {
      const { token: e2 } = ie();
      e2 && (n2.uniIdToken = e2);
    }
    return n2;
  }
  async function Ct({ name: e, data: t2 } = {}) {
    await this.__dev__.initLocalNetwork();
    const { localAddress: n2, localPort: s2 } = this.__dev__, r2 = { aliyun: "aliyun", tencent: "tcb" }[this.config.provider], i2 = this.config.spaceId, o2 = `http://${n2}:${s2}/system/check-function`, a2 = `http://${n2}:${s2}/cloudfunctions/${e}`;
    return new Promise((t3, n3) => {
      se.request({ method: "POST", url: o2, data: { name: e, platform: A, provider: r2, spaceId: i2 }, timeout: 3e3, success(e2) {
        t3(e2);
      }, fail() {
        t3({ data: { code: "NETWORK_ERROR", message: "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下，自动切换为已部署的云函数。" } });
      } });
    }).then(({ data: e2 } = {}) => {
      const { code: t3, message: n3 } = e2 || {};
      return { code: 0 === t3 ? 0 : t3 || "SYS_ERR", message: n3 || "SYS_ERR" };
    }).then(({ code: n3, message: s3 }) => {
      if (0 !== n3) {
        switch (n3) {
          case "MODULE_ENCRYPTED":
            console.error(`此云函数（${e}）依赖加密公共模块不可本地调试，自动切换为云端已部署的云函数`);
            break;
          case "FUNCTION_ENCRYPTED":
            console.error(`此云函数（${e}）已加密不可本地调试，自动切换为云端已部署的云函数`);
            break;
          case "ACTION_ENCRYPTED":
            console.error(s3 || "需要访问加密的uni-clientDB-action，自动切换为云端环境");
            break;
          case "NETWORK_ERROR": {
            const e2 = "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下";
            throw console.error(e2), new Error(e2);
          }
          case "SWITCH_TO_CLOUD":
            break;
          default: {
            const e2 = `检测本地调试服务出现错误：${s3}，请检查网络环境或重启客户端再试`;
            throw console.error(e2), new Error(e2);
          }
        }
        return this._callCloudFunction({ name: e, data: t2 });
      }
      return new Promise((e2, n4) => {
        const s4 = Tt.call(this, { data: t2 });
        se.request({ method: "POST", url: a2, data: { provider: r2, platform: A, param: s4 }, success: ({ statusCode: t3, data: s5 } = {}) => !t3 || t3 >= 400 ? n4(new ne({ code: s5.code || "SYS_ERR", message: s5.message || "request:fail" })) : e2({ result: s5 }), fail(e3) {
          n4(new ne({ code: e3.code || e3.errCode || "SYS_ERR", message: e3.message || e3.errMsg || "request:fail" }));
        } });
      });
    });
  }
  const At = [{ rule: /fc_function_not_found|FUNCTION_NOT_FOUND/, content: "，云函数[{functionName}]在云端不存在，请检查此云函数名称是否正确以及该云函数是否已上传到服务空间", mode: "append" }];
  var Pt = /[\\^$.*+?()[\]{}|]/g, Et = RegExp(Pt.source);
  function Ot(e, t2, n2) {
    return e.replace(new RegExp((s2 = t2) && Et.test(s2) ? s2.replace(Pt, "\\$&") : s2, "g"), n2);
    var s2;
  }
  const Rt = "request", Ut = "response", Lt = "both";
  const yn = { code: 2e4, message: "System error" }, _n = { code: 20101, message: "Invalid client" };
  function Sn(e) {
    const { errSubject: t2, subject: n2, errCode: s2, errMsg: r2, code: i2, message: o2, cause: a2 } = e || {};
    return new ne({ subject: t2 || n2 || "uni-secure-network", code: s2 || i2 || yn.code, message: r2 || o2, cause: a2 });
  }
  let kn;
  function Pn({ secretType: e } = {}) {
    return e === Rt || e === Ut || e === Lt;
  }
  function En({ name: e, data: t2 = {} } = {}) {
    return "DCloud-clientDB" === e && "encryption" === t2.redirectTo && "getAppClientKey" === t2.action;
  }
  function On({ provider: e, spaceId: t2, functionName: n2 } = {}) {
    const { appId: s2, uniPlatform: r2, osName: i2 } = ue();
    let o2 = r2;
    "app" === r2 && (o2 = i2);
    const a2 = function({ provider: e2, spaceId: t3 } = {}) {
      const n3 = C;
      if (!n3)
        return {};
      e2 = function(e3) {
        return "tencent" === e3 ? "tcb" : e3;
      }(e2);
      const s3 = n3.find((n4) => n4.provider === e2 && n4.spaceId === t3);
      return s3 && s3.config;
    }({ provider: e, spaceId: t2 });
    if (!a2 || !a2.accessControl || !a2.accessControl.enable)
      return false;
    const c2 = a2.accessControl.function || {}, u2 = Object.keys(c2);
    if (0 === u2.length)
      return true;
    const l2 = function(e2, t3) {
      let n3, s3, r3;
      for (let i3 = 0; i3 < e2.length; i3++) {
        const o3 = e2[i3];
        o3 !== t3 ? "*" !== o3 ? o3.split(",").map((e3) => e3.trim()).indexOf(t3) > -1 && (s3 = o3) : r3 = o3 : n3 = o3;
      }
      return n3 || s3 || r3;
    }(u2, n2);
    if (!l2)
      return false;
    if ((c2[l2] || []).find((e2 = {}) => e2.appId === s2 && (e2.platform || "").toLowerCase() === o2.toLowerCase()))
      return true;
    throw console.error(`此应用[appId: ${s2}, platform: ${o2}]不在云端配置的允许访问的应用列表内，参考：https://uniapp.dcloud.net.cn/uniCloud/secure-network.html#verify-client`), Sn(_n);
  }
  function xn({ functionName: e, result: t2, logPvd: n2 }) {
    if (this.__dev__.debugLog && t2 && t2.requestId) {
      const s2 = JSON.stringify({ spaceId: this.config.spaceId, functionName: e, requestId: t2.requestId });
      console.log(`[${n2}-request]${s2}[/${n2}-request]`);
    }
  }
  function Rn(e) {
    const t2 = e.callFunction, n2 = function(n3) {
      const s2 = n3.name;
      n3.data = Tt.call(e, { data: n3.data });
      const r2 = { aliyun: "aliyun", tencent: "tcb", tcb: "tcb" }[this.config.provider], i2 = Pn(n3), o2 = En(n3), a2 = i2 || o2;
      return t2.call(this, n3).then((e2) => (e2.errCode = 0, !a2 && xn.call(this, { functionName: s2, result: e2, logPvd: r2 }), Promise.resolve(e2)), (e2) => (!a2 && xn.call(this, { functionName: s2, result: e2, logPvd: r2 }), e2 && e2.message && (e2.message = function({ message: e3 = "", extraInfo: t3 = {}, formatter: n4 = [] } = {}) {
        for (let s3 = 0; s3 < n4.length; s3++) {
          const { rule: r3, content: i3, mode: o3 } = n4[s3], a3 = e3.match(r3);
          if (!a3)
            continue;
          let c2 = i3;
          for (let e4 = 1; e4 < a3.length; e4++)
            c2 = Ot(c2, `{$${e4}}`, a3[e4]);
          for (const e4 in t3)
            c2 = Ot(c2, `{${e4}}`, t3[e4]);
          return "replace" === o3 ? c2 : e3 + c2;
        }
        return e3;
      }({ message: `[${n3.name}]: ${e2.message}`, formatter: At, extraInfo: { functionName: s2 } })), Promise.reject(e2)));
    };
    e.callFunction = function(t3) {
      const { provider: s2, spaceId: r2 } = e.config, i2 = t3.name;
      let o2, a2;
      if (t3.data = t3.data || {}, e.__dev__.debugInfo && !e.__dev__.debugInfo.forceRemote && E ? (e._callCloudFunction || (e._callCloudFunction = n2, e._callLocalFunction = Ct), o2 = Ct) : o2 = n2, o2 = o2.bind(e), En(t3))
        a2 = n2.call(e, t3);
      else if (Pn(t3)) {
        a2 = new kn({ secretType: t3.secretType, uniCloudIns: e }).wrapEncryptDataCallFunction(n2.bind(e))(t3);
      } else if (On({ provider: s2, spaceId: r2, functionName: i2 })) {
        a2 = new kn({ secretType: t3.secretType, uniCloudIns: e }).wrapVerifyClientCallFunction(n2.bind(e))(t3);
      } else
        a2 = o2(t3);
      return Object.defineProperty(a2, "result", { get: () => (console.warn("当前返回结果为Promise类型，不可直接访问其result属性，详情请参考：https://uniapp.dcloud.net.cn/uniCloud/faq?id=promise"), {}) }), a2;
    };
  }
  kn = class {
    constructor() {
      throw Sn({ message: `Platform ${A} is not enabled, please check whether secure network module is enabled in your manifest.json` });
    }
  };
  const Un = Symbol("CLIENT_DB_INTERNAL");
  function Ln(e, t2) {
    return e.then = "DoNotReturnProxyWithAFunctionNamedThen", e._internalType = Un, e.inspect = null, e.__v_raw = void 0, new Proxy(e, { get(e2, n2, s2) {
      if ("_uniClient" === n2)
        return null;
      if ("symbol" == typeof n2)
        return e2[n2];
      if (n2 in e2 || "string" != typeof n2) {
        const t3 = e2[n2];
        return "function" == typeof t3 ? t3.bind(e2) : t3;
      }
      return t2.get(e2, n2, s2);
    } });
  }
  function Nn(e) {
    return { on: (t2, n2) => {
      e[t2] = e[t2] || [], e[t2].indexOf(n2) > -1 || e[t2].push(n2);
    }, off: (t2, n2) => {
      e[t2] = e[t2] || [];
      const s2 = e[t2].indexOf(n2);
      -1 !== s2 && e[t2].splice(s2, 1);
    } };
  }
  const Dn = ["db.Geo", "db.command", "command.aggregate"];
  function Fn(e, t2) {
    return Dn.indexOf(`${e}.${t2}`) > -1;
  }
  function qn(e) {
    switch (g(e = re(e))) {
      case "array":
        return e.map((e2) => qn(e2));
      case "object":
        return e._internalType === Un || Object.keys(e).forEach((t2) => {
          e[t2] = qn(e[t2]);
        }), e;
      case "regexp":
        return { $regexp: { source: e.source, flags: e.flags } };
      case "date":
        return { $date: e.toISOString() };
      default:
        return e;
    }
  }
  function Kn(e) {
    return e && e.content && e.content.$method;
  }
  class Mn {
    constructor(e, t2, n2) {
      this.content = e, this.prevStage = t2 || null, this.udb = null, this._database = n2;
    }
    toJSON() {
      let e = this;
      const t2 = [e.content];
      for (; e.prevStage; )
        e = e.prevStage, t2.push(e.content);
      return { $db: t2.reverse().map((e2) => ({ $method: e2.$method, $param: qn(e2.$param) })) };
    }
    getAction() {
      const e = this.toJSON().$db.find((e2) => "action" === e2.$method);
      return e && e.$param && e.$param[0];
    }
    getCommand() {
      return { $db: this.toJSON().$db.filter((e) => "action" !== e.$method) };
    }
    get isAggregate() {
      let e = this;
      for (; e; ) {
        const t2 = Kn(e), n2 = Kn(e.prevStage);
        if ("aggregate" === t2 && "collection" === n2 || "pipeline" === t2)
          return true;
        e = e.prevStage;
      }
      return false;
    }
    get isCommand() {
      let e = this;
      for (; e; ) {
        if ("command" === Kn(e))
          return true;
        e = e.prevStage;
      }
      return false;
    }
    get isAggregateCommand() {
      let e = this;
      for (; e; ) {
        const t2 = Kn(e), n2 = Kn(e.prevStage);
        if ("aggregate" === t2 && "command" === n2)
          return true;
        e = e.prevStage;
      }
      return false;
    }
    getNextStageFn(e) {
      const t2 = this;
      return function() {
        return jn({ $method: e, $param: qn(Array.from(arguments)) }, t2, t2._database);
      };
    }
    get count() {
      return this.isAggregate ? this.getNextStageFn("count") : function() {
        return this._send("count", Array.from(arguments));
      };
    }
    get remove() {
      return this.isCommand ? this.getNextStageFn("remove") : function() {
        return this._send("remove", Array.from(arguments));
      };
    }
    get() {
      return this._send("get", Array.from(arguments));
    }
    get add() {
      return this.isCommand ? this.getNextStageFn("add") : function() {
        return this._send("add", Array.from(arguments));
      };
    }
    update() {
      return this._send("update", Array.from(arguments));
    }
    end() {
      return this._send("end", Array.from(arguments));
    }
    get set() {
      return this.isCommand ? this.getNextStageFn("set") : function() {
        throw new Error("JQL禁止使用set方法");
      };
    }
    _send(e, t2) {
      const n2 = this.getAction(), s2 = this.getCommand();
      if (s2.$db.push({ $method: e, $param: qn(t2) }), k) {
        const e2 = s2.$db.find((e3) => "collection" === e3.$method), t3 = e2 && e2.$param;
        t3 && 1 === t3.length && "string" == typeof e2.$param[0] && e2.$param[0].indexOf(",") > -1 && console.warn("检测到使用JQL语法联表查询时，未使用getTemp先过滤主表数据，在主表数据量大的情况下可能会查询缓慢。\n- 如何优化请参考此文档：https://uniapp.dcloud.net.cn/uniCloud/jql?id=lookup-with-temp \n- 如果主表数据量很小请忽略此信息，项目发行时不会出现此提示。");
      }
      return this._database._callCloudFunction({ action: n2, command: s2 });
    }
  }
  function jn(e, t2, n2) {
    return Ln(new Mn(e, t2, n2), { get(e2, t3) {
      let s2 = "db";
      return e2 && e2.content && (s2 = e2.content.$method), Fn(s2, t3) ? jn({ $method: t3 }, e2, n2) : function() {
        return jn({ $method: t3, $param: qn(Array.from(arguments)) }, e2, n2);
      };
    } });
  }
  function Bn({ path: e, method: t2 }) {
    return class {
      constructor() {
        this.param = Array.from(arguments);
      }
      toJSON() {
        return { $newDb: [...e.map((e2) => ({ $method: e2 })), { $method: t2, $param: this.param }] };
      }
    };
  }
  function $n(e, t2 = {}) {
    return Ln(new e(t2), { get: (e2, t3) => Fn("db", t3) ? jn({ $method: t3 }, null, e2) : function() {
      return jn({ $method: t3, $param: qn(Array.from(arguments)) }, null, e2);
    } });
  }
  class Wn extends class {
    constructor({ uniClient: e = {}, isJQL: t2 = false } = {}) {
      this._uniClient = e, this._authCallBacks = {}, this._dbCallBacks = {}, e._isDefault && (this._dbCallBacks = U("_globalUniCloudDatabaseCallback")), t2 || (this.auth = Nn(this._authCallBacks)), this._isJQL = t2, Object.assign(this, Nn(this._dbCallBacks)), this.env = Ln({}, { get: (e2, t3) => ({ $env: t3 }) }), this.Geo = Ln({}, { get: (e2, t3) => Bn({ path: ["Geo"], method: t3 }) }), this.serverDate = Bn({ path: [], method: "serverDate" }), this.RegExp = Bn({ path: [], method: "RegExp" });
    }
    getCloudEnv(e) {
      if ("string" != typeof e || !e.trim())
        throw new Error("getCloudEnv参数错误");
      return { $env: e.replace("$cloudEnv_", "") };
    }
    _callback(e, t2) {
      const n2 = this._dbCallBacks;
      n2[e] && n2[e].forEach((e2) => {
        e2(...t2);
      });
    }
    _callbackAuth(e, t2) {
      const n2 = this._authCallBacks;
      n2[e] && n2[e].forEach((e2) => {
        e2(...t2);
      });
    }
    multiSend() {
      const e = Array.from(arguments), t2 = e.map((e2) => {
        const t3 = e2.getAction(), n2 = e2.getCommand();
        if ("getTemp" !== n2.$db[n2.$db.length - 1].$method)
          throw new Error("multiSend只支持子命令内使用getTemp");
        return { action: t3, command: n2 };
      });
      return this._callCloudFunction({ multiCommand: t2, queryList: e });
    }
  } {
    _parseResult(e) {
      return this._isJQL ? e.result : e;
    }
    _callCloudFunction({ action: e, command: t2, multiCommand: n2, queryList: s2 }) {
      function r2(e2, t3) {
        if (n2 && s2)
          for (let n3 = 0; n3 < s2.length; n3++) {
            const r3 = s2[n3];
            r3.udb && "function" == typeof r3.udb.setResult && (t3 ? r3.udb.setResult(t3) : r3.udb.setResult(e2.result.dataList[n3]));
          }
      }
      const i2 = this, o2 = this._isJQL ? "databaseForJQL" : "database";
      function a2(e2) {
        return i2._callback("error", [e2]), q(K(o2, "fail"), e2).then(() => q(K(o2, "complete"), e2)).then(() => (r2(null, e2), Q(B, { type: z, content: e2 }), Promise.reject(e2)));
      }
      const c2 = q(K(o2, "invoke")), u2 = this._uniClient;
      return c2.then(() => u2.callFunction({ name: "DCloud-clientDB", type: h, data: { action: e, command: t2, multiCommand: n2 } })).then((e2) => {
        const { code: t3, message: n3, token: s3, tokenExpired: c3, systemInfo: u3 = [] } = e2.result;
        if (u3)
          for (let e3 = 0; e3 < u3.length; e3++) {
            const { level: t4, message: n4, detail: s4 } = u3[e3], r3 = console["warn" === t4 ? "error" : t4] || console.log;
            let i3 = "[System Info]" + n4;
            s4 && (i3 = `${i3}
详细信息：${s4}`), r3(i3);
          }
        if (t3) {
          return a2(new ne({ code: t3, message: n3, requestId: e2.requestId }));
        }
        e2.result.errCode = e2.result.errCode || e2.result.code, e2.result.errMsg = e2.result.errMsg || e2.result.message, s3 && c3 && (oe({ token: s3, tokenExpired: c3 }), this._callbackAuth("refreshToken", [{ token: s3, tokenExpired: c3 }]), this._callback("refreshToken", [{ token: s3, tokenExpired: c3 }]), Q(W, { token: s3, tokenExpired: c3 }));
        const l2 = [{ prop: "affectedDocs", tips: "affectedDocs不再推荐使用，请使用inserted/deleted/updated/data.length替代" }, { prop: "code", tips: "code不再推荐使用，请使用errCode替代" }, { prop: "message", tips: "message不再推荐使用，请使用errMsg替代" }];
        for (let t4 = 0; t4 < l2.length; t4++) {
          const { prop: n4, tips: s4 } = l2[t4];
          if (n4 in e2.result) {
            const t5 = e2.result[n4];
            Object.defineProperty(e2.result, n4, { get: () => (console.warn(s4), t5) });
          }
        }
        return function(e3) {
          return q(K(o2, "success"), e3).then(() => q(K(o2, "complete"), e3)).then(() => {
            r2(e3, null);
            const t4 = i2._parseResult(e3);
            return Q(B, { type: z, content: t4 }), Promise.resolve(t4);
          });
        }(e2);
      }, (e2) => {
        /fc_function_not_found|FUNCTION_NOT_FOUND/g.test(e2.message) && console.warn("clientDB未初始化，请在web控制台保存一次schema以开启clientDB");
        return a2(new ne({ code: e2.code || "SYSTEM_ERROR", message: e2.message, requestId: e2.requestId }));
      });
    }
  }
  const zn = "token无效，跳转登录页面", Jn = "token过期，跳转登录页面", Hn = { TOKEN_INVALID_TOKEN_EXPIRED: Jn, TOKEN_INVALID_INVALID_CLIENTID: zn, TOKEN_INVALID: zn, TOKEN_INVALID_WRONG_TOKEN: zn, TOKEN_INVALID_ANONYMOUS_USER: zn }, Gn = { "uni-id-token-expired": Jn, "uni-id-check-token-failed": zn, "uni-id-token-not-exist": zn, "uni-id-check-device-feature-failed": zn };
  function Vn(e, t2) {
    let n2 = "";
    return n2 = e ? `${e}/${t2}` : t2, n2.replace(/^\//, "");
  }
  function Yn(e = [], t2 = "") {
    const n2 = [], s2 = [];
    return e.forEach((e2) => {
      true === e2.needLogin ? n2.push(Vn(t2, e2.path)) : false === e2.needLogin && s2.push(Vn(t2, e2.path));
    }), { needLoginPage: n2, notNeedLoginPage: s2 };
  }
  function Qn(e) {
    return e.split("?")[0].replace(/^\//, "");
  }
  function Xn() {
    return function(e) {
      let t2 = e && e.$page && e.$page.fullPath || "";
      return t2 ? ("/" !== t2.charAt(0) && (t2 = "/" + t2), t2) : t2;
    }(function() {
      const e = getCurrentPages();
      return e[e.length - 1];
    }());
  }
  function Zn() {
    return Qn(Xn());
  }
  function es(e = "", t2 = {}) {
    if (!e)
      return false;
    if (!(t2 && t2.list && t2.list.length))
      return false;
    const n2 = t2.list, s2 = Qn(e);
    return n2.some((e2) => e2.pagePath === s2);
  }
  const ts = !!t.uniIdRouter;
  const { loginPage: ns, routerNeedLogin: ss, resToLogin: rs, needLoginPage: is, notNeedLoginPage: os, loginPageInTabBar: as } = function({ pages: e = [], subPackages: n2 = [], uniIdRouter: s2 = {}, tabBar: r2 = {} } = t) {
    const { loginPage: i2, needLogin: o2 = [], resToLogin: a2 = true } = s2, { needLoginPage: c2, notNeedLoginPage: u2 } = Yn(e), { needLoginPage: l2, notNeedLoginPage: h2 } = function(e2 = []) {
      const t2 = [], n3 = [];
      return e2.forEach((e3) => {
        const { root: s3, pages: r3 = [] } = e3, { needLoginPage: i3, notNeedLoginPage: o3 } = Yn(r3, s3);
        t2.push(...i3), n3.push(...o3);
      }), { needLoginPage: t2, notNeedLoginPage: n3 };
    }(n2);
    return { loginPage: i2, routerNeedLogin: o2, resToLogin: a2, needLoginPage: [...c2, ...l2], notNeedLoginPage: [...u2, ...h2], loginPageInTabBar: es(i2, r2) };
  }();
  if (is.indexOf(ns) > -1)
    throw new Error(`Login page [${ns}] should not be "needLogin", please check your pages.json`);
  function cs(e) {
    const t2 = Zn();
    if ("/" === e.charAt(0))
      return e;
    const [n2, s2] = e.split("?"), r2 = n2.replace(/^\//, "").split("/"), i2 = t2.split("/");
    i2.pop();
    for (let e2 = 0; e2 < r2.length; e2++) {
      const t3 = r2[e2];
      ".." === t3 ? i2.pop() : "." !== t3 && i2.push(t3);
    }
    return "" === i2[0] && i2.shift(), "/" + i2.join("/") + (s2 ? "?" + s2 : "");
  }
  function us(e) {
    const t2 = Qn(cs(e));
    return !(os.indexOf(t2) > -1) && (is.indexOf(t2) > -1 || ss.some((t3) => function(e2, t4) {
      return new RegExp(t4).test(e2);
    }(e, t3)));
  }
  function ls({ redirect: e }) {
    const t2 = Qn(e), n2 = Qn(ns);
    return Zn() !== n2 && t2 !== n2;
  }
  function hs({ api: e, redirect: t2 } = {}) {
    if (!t2 || !ls({ redirect: t2 }))
      return;
    const n2 = function(e2, t3) {
      return "/" !== e2.charAt(0) && (e2 = "/" + e2), t3 ? e2.indexOf("?") > -1 ? e2 + `&uniIdRedirectUrl=${encodeURIComponent(t3)}` : e2 + `?uniIdRedirectUrl=${encodeURIComponent(t3)}` : e2;
    }(ns, t2);
    as ? "navigateTo" !== e && "redirectTo" !== e || (e = "switchTab") : "switchTab" === e && (e = "navigateTo");
    const s2 = { navigateTo: uni.navigateTo, redirectTo: uni.redirectTo, switchTab: uni.switchTab, reLaunch: uni.reLaunch };
    setTimeout(() => {
      s2[e]({ url: n2 });
    });
  }
  function ds({ url: e } = {}) {
    const t2 = { abortLoginPageJump: false, autoToLoginPage: false }, n2 = function() {
      const { token: e2, tokenExpired: t3 } = ie();
      let n3;
      if (e2) {
        if (t3 < Date.now()) {
          const e3 = "uni-id-token-expired";
          n3 = { errCode: e3, errMsg: Gn[e3] };
        }
      } else {
        const e3 = "uni-id-check-token-failed";
        n3 = { errCode: e3, errMsg: Gn[e3] };
      }
      return n3;
    }();
    if (us(e) && n2) {
      n2.uniIdRedirectUrl = e;
      if (G($).length > 0)
        return setTimeout(() => {
          Q($, n2);
        }, 0), t2.abortLoginPageJump = true, t2;
      t2.autoToLoginPage = true;
    }
    return t2;
  }
  function ps() {
    !function() {
      const e2 = Xn(), { abortLoginPageJump: t2, autoToLoginPage: n2 } = ds({ url: e2 });
      t2 || n2 && hs({ api: "redirectTo", redirect: e2 });
    }();
    const e = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
    for (let t2 = 0; t2 < e.length; t2++) {
      const n2 = e[t2];
      uni.addInterceptor(n2, { invoke(e2) {
        const { abortLoginPageJump: t3, autoToLoginPage: s2 } = ds({ url: e2.url });
        return t3 ? e2 : s2 ? (hs({ api: n2, redirect: cs(e2.url) }), false) : e2;
      } });
    }
  }
  function fs() {
    this.onResponse((e) => {
      const { type: t2, content: n2 } = e;
      let s2 = false;
      switch (t2) {
        case "cloudobject":
          s2 = function(e2) {
            if ("object" != typeof e2)
              return false;
            const { errCode: t3 } = e2 || {};
            return t3 in Gn;
          }(n2);
          break;
        case "clientdb":
          s2 = function(e2) {
            if ("object" != typeof e2)
              return false;
            const { errCode: t3 } = e2 || {};
            return t3 in Hn;
          }(n2);
      }
      s2 && function(e2 = {}) {
        const t3 = G($);
        ee().then(() => {
          const n3 = Xn();
          if (n3 && ls({ redirect: n3 }))
            return t3.length > 0 ? Q($, Object.assign({ uniIdRedirectUrl: n3 }, e2)) : void (ns && hs({ api: "navigateTo", redirect: n3 }));
        });
      }(n2);
    });
  }
  function gs(e) {
    !function(e2) {
      e2.onResponse = function(e3) {
        V(B, e3);
      }, e2.offResponse = function(e3) {
        Y(B, e3);
      };
    }(e), function(e2) {
      e2.onNeedLogin = function(e3) {
        V($, e3);
      }, e2.offNeedLogin = function(e3) {
        Y($, e3);
      }, ts && (U("_globalUniCloudStatus").needLoginInit || (U("_globalUniCloudStatus").needLoginInit = true, ee().then(() => {
        ps.call(e2);
      }), rs && fs.call(e2)));
    }(e), function(e2) {
      e2.onRefreshToken = function(e3) {
        V(W, e3);
      }, e2.offRefreshToken = function(e3) {
        Y(W, e3);
      };
    }(e);
  }
  let ms;
  const ys = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", _s = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;
  function ws() {
    const e = ie().token || "", t2 = e.split(".");
    if (!e || 3 !== t2.length)
      return { uid: null, role: [], permission: [], tokenExpired: 0 };
    let n2;
    try {
      n2 = JSON.parse((s2 = t2[1], decodeURIComponent(ms(s2).split("").map(function(e2) {
        return "%" + ("00" + e2.charCodeAt(0).toString(16)).slice(-2);
      }).join(""))));
    } catch (e2) {
      throw new Error("获取当前用户信息出错，详细错误信息为：" + e2.message);
    }
    var s2;
    return n2.tokenExpired = 1e3 * n2.exp, delete n2.exp, delete n2.iat, n2;
  }
  ms = "function" != typeof atob ? function(e) {
    if (e = String(e).replace(/[\t\n\f\r ]+/g, ""), !_s.test(e))
      throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
    var t2;
    e += "==".slice(2 - (3 & e.length));
    for (var n2, s2, r2 = "", i2 = 0; i2 < e.length; )
      t2 = ys.indexOf(e.charAt(i2++)) << 18 | ys.indexOf(e.charAt(i2++)) << 12 | (n2 = ys.indexOf(e.charAt(i2++))) << 6 | (s2 = ys.indexOf(e.charAt(i2++))), r2 += 64 === n2 ? String.fromCharCode(t2 >> 16 & 255) : 64 === s2 ? String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255) : String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255, 255 & t2);
    return r2;
  } : atob;
  var vs = s(function(e, t2) {
    Object.defineProperty(t2, "__esModule", { value: true });
    const n2 = "chooseAndUploadFile:ok", s2 = "chooseAndUploadFile:fail";
    function r2(e2, t3) {
      return e2.tempFiles.forEach((e3, n3) => {
        e3.name || (e3.name = e3.path.substring(e3.path.lastIndexOf("/") + 1)), t3 && (e3.fileType = t3), e3.cloudPath = Date.now() + "_" + n3 + e3.name.substring(e3.name.lastIndexOf("."));
      }), e2.tempFilePaths || (e2.tempFilePaths = e2.tempFiles.map((e3) => e3.path)), e2;
    }
    function i2(e2, t3, { onChooseFile: s3, onUploadProgress: r3 }) {
      return t3.then((e3) => {
        if (s3) {
          const t4 = s3(e3);
          if (void 0 !== t4)
            return Promise.resolve(t4).then((t5) => void 0 === t5 ? e3 : t5);
        }
        return e3;
      }).then((t4) => false === t4 ? { errMsg: n2, tempFilePaths: [], tempFiles: [] } : function(e3, t5, s4 = 5, r4) {
        (t5 = Object.assign({}, t5)).errMsg = n2;
        const i3 = t5.tempFiles, o2 = i3.length;
        let a2 = 0;
        return new Promise((n3) => {
          for (; a2 < s4; )
            c2();
          function c2() {
            const s5 = a2++;
            if (s5 >= o2)
              return void (!i3.find((e4) => !e4.url && !e4.errMsg) && n3(t5));
            const u2 = i3[s5];
            e3.uploadFile({ filePath: u2.path, cloudPath: u2.cloudPath, fileType: u2.fileType, onUploadProgress(e4) {
              e4.index = s5, e4.tempFile = u2, e4.tempFilePath = u2.path, r4 && r4(e4);
            } }).then((e4) => {
              u2.url = e4.fileID, s5 < o2 && c2();
            }).catch((e4) => {
              u2.errMsg = e4.errMsg || e4.message, s5 < o2 && c2();
            });
          }
        });
      }(e2, t4, 5, r3));
    }
    t2.initChooseAndUploadFile = function(e2) {
      return function(t3 = { type: "all" }) {
        return "image" === t3.type ? i2(e2, function(e3) {
          const { count: t4, sizeType: n3, sourceType: i3 = ["album", "camera"], extension: o2 } = e3;
          return new Promise((e4, a2) => {
            uni.chooseImage({ count: t4, sizeType: n3, sourceType: i3, extension: o2, success(t5) {
              e4(r2(t5, "image"));
            }, fail(e5) {
              a2({ errMsg: e5.errMsg.replace("chooseImage:fail", s2) });
            } });
          });
        }(t3), t3) : "video" === t3.type ? i2(e2, function(e3) {
          const { camera: t4, compressed: n3, maxDuration: i3, sourceType: o2 = ["album", "camera"], extension: a2 } = e3;
          return new Promise((e4, c2) => {
            uni.chooseVideo({ camera: t4, compressed: n3, maxDuration: i3, sourceType: o2, extension: a2, success(t5) {
              const { tempFilePath: n4, duration: s3, size: i4, height: o3, width: a3 } = t5;
              e4(r2({ errMsg: "chooseVideo:ok", tempFilePaths: [n4], tempFiles: [{ name: t5.tempFile && t5.tempFile.name || "", path: n4, size: i4, type: t5.tempFile && t5.tempFile.type || "", width: a3, height: o3, duration: s3, fileType: "video", cloudPath: "" }] }, "video"));
            }, fail(e5) {
              c2({ errMsg: e5.errMsg.replace("chooseVideo:fail", s2) });
            } });
          });
        }(t3), t3) : i2(e2, function(e3) {
          const { count: t4, extension: n3 } = e3;
          return new Promise((e4, i3) => {
            let o2 = uni.chooseFile;
            if ("undefined" != typeof wx && "function" == typeof wx.chooseMessageFile && (o2 = wx.chooseMessageFile), "function" != typeof o2)
              return i3({ errMsg: s2 + " 请指定 type 类型，该平台仅支持选择 image 或 video。" });
            o2({ type: "all", count: t4, extension: n3, success(t5) {
              e4(r2(t5));
            }, fail(e5) {
              i3({ errMsg: e5.errMsg.replace("chooseFile:fail", s2) });
            } });
          });
        }(t3), t3);
      };
    };
  }), Ss = n(vs);
  const bs = "manual";
  function ks(e) {
    return { props: { localdata: { type: Array, default: () => [] }, options: { type: [Object, Array], default: () => ({}) }, spaceInfo: { type: Object, default: () => ({}) }, collection: { type: [String, Array], default: "" }, action: { type: String, default: "" }, field: { type: String, default: "" }, orderby: { type: String, default: "" }, where: { type: [String, Object], default: "" }, pageData: { type: String, default: "add" }, pageCurrent: { type: Number, default: 1 }, pageSize: { type: Number, default: 20 }, getcount: { type: [Boolean, String], default: false }, gettree: { type: [Boolean, String], default: false }, gettreepath: { type: [Boolean, String], default: false }, startwith: { type: String, default: "" }, limitlevel: { type: Number, default: 10 }, groupby: { type: String, default: "" }, groupField: { type: String, default: "" }, distinct: { type: [Boolean, String], default: false }, foreignKey: { type: String, default: "" }, loadtime: { type: String, default: "auto" }, manual: { type: Boolean, default: false } }, data: () => ({ mixinDatacomLoading: false, mixinDatacomHasMore: false, mixinDatacomResData: [], mixinDatacomErrorMessage: "", mixinDatacomPage: {} }), created() {
      this.mixinDatacomPage = { current: this.pageCurrent, size: this.pageSize, count: 0 }, this.$watch(() => {
        var e2 = [];
        return ["pageCurrent", "pageSize", "localdata", "collection", "action", "field", "orderby", "where", "getont", "getcount", "gettree", "groupby", "groupField", "distinct"].forEach((t2) => {
          e2.push(this[t2]);
        }), e2;
      }, (e2, t2) => {
        if (this.loadtime === bs)
          return;
        let n2 = false;
        const s2 = [];
        for (let r2 = 2; r2 < e2.length; r2++)
          e2[r2] !== t2[r2] && (s2.push(e2[r2]), n2 = true);
        e2[0] !== t2[0] && (this.mixinDatacomPage.current = this.pageCurrent), this.mixinDatacomPage.size = this.pageSize, this.onMixinDatacomPropsChange(n2, s2);
      });
    }, methods: { onMixinDatacomPropsChange(e2, t2) {
    }, mixinDatacomEasyGet({ getone: e2 = false, success: t2, fail: n2 } = {}) {
      this.mixinDatacomLoading || (this.mixinDatacomLoading = true, this.mixinDatacomErrorMessage = "", this.mixinDatacomGet().then((n3) => {
        this.mixinDatacomLoading = false;
        const { data: s2, count: r2 } = n3.result;
        this.getcount && (this.mixinDatacomPage.count = r2), this.mixinDatacomHasMore = s2.length < this.pageSize;
        const i2 = e2 ? s2.length ? s2[0] : void 0 : s2;
        this.mixinDatacomResData = i2, t2 && t2(i2);
      }).catch((e3) => {
        this.mixinDatacomLoading = false, this.mixinDatacomErrorMessage = e3, n2 && n2(e3);
      }));
    }, mixinDatacomGet(t2 = {}) {
      let n2 = e.database(this.spaceInfo);
      const s2 = t2.action || this.action;
      s2 && (n2 = n2.action(s2));
      const r2 = t2.collection || this.collection;
      n2 = Array.isArray(r2) ? n2.collection(...r2) : n2.collection(r2);
      const i2 = t2.where || this.where;
      i2 && Object.keys(i2).length && (n2 = n2.where(i2));
      const o2 = t2.field || this.field;
      o2 && (n2 = n2.field(o2));
      const a2 = t2.foreignKey || this.foreignKey;
      a2 && (n2 = n2.foreignKey(a2));
      const c2 = t2.groupby || this.groupby;
      c2 && (n2 = n2.groupBy(c2));
      const u2 = t2.groupField || this.groupField;
      u2 && (n2 = n2.groupField(u2));
      true === (void 0 !== t2.distinct ? t2.distinct : this.distinct) && (n2 = n2.distinct());
      const l2 = t2.orderby || this.orderby;
      l2 && (n2 = n2.orderBy(l2));
      const h2 = void 0 !== t2.pageCurrent ? t2.pageCurrent : this.mixinDatacomPage.current, d2 = void 0 !== t2.pageSize ? t2.pageSize : this.mixinDatacomPage.size, p2 = void 0 !== t2.getcount ? t2.getcount : this.getcount, f2 = void 0 !== t2.gettree ? t2.gettree : this.gettree, g2 = void 0 !== t2.gettreepath ? t2.gettreepath : this.gettreepath, m2 = { getCount: p2 }, y2 = { limitLevel: void 0 !== t2.limitlevel ? t2.limitlevel : this.limitlevel, startWith: void 0 !== t2.startwith ? t2.startwith : this.startwith };
      return f2 && (m2.getTree = y2), g2 && (m2.getTreePath = y2), n2 = n2.skip(d2 * (h2 - 1)).limit(d2).get(m2), n2;
    } } };
  }
  function Is(e) {
    return function(t2, n2 = {}) {
      n2 = function(e2, t3 = {}) {
        return e2.customUI = t3.customUI || e2.customUI, e2.parseSystemError = t3.parseSystemError || e2.parseSystemError, Object.assign(e2.loadingOptions, t3.loadingOptions), Object.assign(e2.errorOptions, t3.errorOptions), "object" == typeof t3.secretMethods && (e2.secretMethods = t3.secretMethods), e2;
      }({ customUI: false, loadingOptions: { title: "加载中...", mask: true }, errorOptions: { type: "modal", retry: false } }, n2);
      const { customUI: s2, loadingOptions: r2, errorOptions: i2, parseSystemError: o2 } = n2, a2 = !s2;
      return new Proxy({}, { get: (s3, c2) => function({ fn: e2, interceptorName: t3, getCallbackArgs: n3 } = {}) {
        return async function(...s4) {
          const r3 = n3 ? n3({ params: s4 }) : {};
          let i3, o3;
          try {
            return await q(K(t3, "invoke"), { ...r3 }), i3 = await e2(...s4), await q(K(t3, "success"), { ...r3, result: i3 }), i3;
          } catch (e3) {
            throw o3 = e3, await q(K(t3, "fail"), { ...r3, error: o3 }), o3;
          } finally {
            await q(K(t3, "complete"), o3 ? { ...r3, error: o3 } : { ...r3, result: i3 });
          }
        };
      }({ fn: async function s4(...u2) {
        let h2;
        a2 && uni.showLoading({ title: r2.title, mask: r2.mask });
        const d2 = { name: t2, type: l, data: { method: c2, params: u2 } };
        "object" == typeof n2.secretMethods && function(e2, t3) {
          const n3 = t3.data.method, s5 = e2.secretMethods || {}, r3 = s5[n3] || s5["*"];
          r3 && (t3.secretType = r3);
        }(n2, d2);
        let p2 = false;
        try {
          h2 = await e.callFunction(d2);
        } catch (e2) {
          p2 = true, h2 = { result: new ne(e2) };
        }
        const { errSubject: f2, errCode: g2, errMsg: m2, newToken: y2 } = h2.result || {};
        if (a2 && uni.hideLoading(), y2 && y2.token && y2.tokenExpired && (oe(y2), Q(W, { ...y2 })), g2) {
          let e2 = m2;
          if (p2 && o2) {
            e2 = (await o2({ objectName: t2, methodName: c2, params: u2, errSubject: f2, errCode: g2, errMsg: m2 })).errMsg || m2;
          }
          if (a2)
            if ("toast" === i2.type)
              uni.showToast({ title: e2, icon: "none" });
            else {
              if ("modal" !== i2.type)
                throw new Error(`Invalid errorOptions.type: ${i2.type}`);
              {
                const { confirm: t3 } = await async function({ title: e3, content: t4, showCancel: n4, cancelText: s5, confirmText: r3 } = {}) {
                  return new Promise((i3, o3) => {
                    uni.showModal({ title: e3, content: t4, showCancel: n4, cancelText: s5, confirmText: r3, success(e4) {
                      i3(e4);
                    }, fail() {
                      i3({ confirm: false, cancel: true });
                    } });
                  });
                }({ title: "提示", content: e2, showCancel: i2.retry, cancelText: "取消", confirmText: i2.retry ? "重试" : "确定" });
                if (i2.retry && t3)
                  return s4(...u2);
              }
            }
          const n3 = new ne({ subject: f2, code: g2, message: m2, requestId: h2.requestId });
          throw n3.detail = h2.result, Q(B, { type: H, content: n3 }), n3;
        }
        return Q(B, { type: H, content: h2.result }), h2.result;
      }, interceptorName: "callObject", getCallbackArgs: function({ params: e2 } = {}) {
        return { objectName: t2, methodName: c2, params: e2 };
      } }) });
    };
  }
  function Ts(e) {
    return U("_globalUniCloudSecureNetworkCache__{spaceId}".replace("{spaceId}", e.config.spaceId));
  }
  async function Cs({ openid: e, callLoginByWeixin: t2 = false } = {}) {
    Ts(this);
    throw new Error(`[SecureNetwork] API \`initSecureNetworkByWeixin\` is not supported on platform \`${A}\``);
  }
  async function As(e) {
    const t2 = Ts(this);
    return t2.initPromise || (t2.initPromise = Cs.call(this, e)), t2.initPromise;
  }
  function Ps(e) {
    return function({ openid: t2, callLoginByWeixin: n2 = false } = {}) {
      return As.call(e, { openid: t2, callLoginByWeixin: n2 });
    };
  }
  async function Es(e, t2) {
    const n2 = `http://${e}:${t2}/system/ping`;
    try {
      const e2 = await (s2 = { url: n2, timeout: 500 }, new Promise((e3, t3) => {
        se.request({ ...s2, success(t4) {
          e3(t4);
        }, fail(e4) {
          t3(e4);
        } });
      }));
      return !(!e2.data || 0 !== e2.data.code);
    } catch (e2) {
      return false;
    }
    var s2;
  }
  async function Os(e) {
    {
      const { osName: e2, osVersion: t3 } = ue();
      "ios" === e2 && function(e3) {
        if (!e3 || "string" != typeof e3)
          return 0;
        const t4 = e3.match(/^(\d+)./);
        return t4 && t4[1] ? parseInt(t4[1]) : 0;
      }(t3) >= 14 && console.warn("iOS 14及以上版本连接uniCloud本地调试服务需要允许客户端查找并连接到本地网络上的设备（仅开发模式生效，发行模式会连接uniCloud云端服务）");
    }
    const t2 = e.__dev__;
    if (!t2.debugInfo)
      return;
    const { address: n2, servePort: s2 } = t2.debugInfo, { address: r2 } = await async function(e2, t3) {
      let n3;
      for (let s3 = 0; s3 < e2.length; s3++) {
        const r3 = e2[s3];
        if (await Es(r3, t3)) {
          n3 = r3;
          break;
        }
      }
      return { address: n3, port: t3 };
    }(n2, s2);
    if (r2)
      return t2.localAddress = r2, void (t2.localPort = s2);
    const i2 = console["error"];
    let o2 = "";
    if ("remote" === t2.debugInfo.initialLaunchType ? (t2.debugInfo.forceRemote = true, o2 = "当前客户端和HBuilderX不在同一局域网下（或其他网络原因无法连接HBuilderX），uniCloud本地调试服务不对当前客户端生效。\n- 如果不使用uniCloud本地调试服务，请直接忽略此信息。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。") : o2 = "无法连接uniCloud本地调试服务，请检查当前客户端是否与主机在同一局域网下。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。", o2 += "\n- 如果在HBuilderX开启的状态下切换过网络环境，请重启HBuilderX后再试\n- 检查系统防火墙是否拦截了HBuilderX自带的nodejs\n- 检查是否错误的使用拦截器修改uni.request方法的参数", 0 === A.indexOf("mp-") && (o2 += "\n- 小程序中如何使用uniCloud，请参考：https://uniapp.dcloud.net.cn/uniCloud/publish.html#useinmp"), !t2.debugInfo.forceRemote)
      throw new Error(o2);
    i2(o2);
  }
  function xs(e) {
    e._initPromiseHub || (e._initPromiseHub = new S({ createPromise: function() {
      let t2 = Promise.resolve();
      var n2;
      n2 = 1, t2 = new Promise((e2) => {
        setTimeout(() => {
          e2();
        }, n2);
      });
      const s2 = e.auth();
      return t2.then(() => s2.getLoginState()).then((e2) => e2 ? Promise.resolve() : s2.signInAnonymously());
    } }));
  }
  const Rs = { tcb: bt, tencent: bt, aliyun: me, private: It };
  let Us = new class {
    init(e) {
      let t2 = {};
      const n2 = Rs[e.provider];
      if (!n2)
        throw new Error("未提供正确的provider参数");
      t2 = n2.init(e), function(e2) {
        const t3 = {};
        e2.__dev__ = t3, t3.debugLog = "app" === A;
        const n3 = P;
        n3 && !n3.code && (t3.debugInfo = n3);
        const s2 = new S({ createPromise: function() {
          return Os(e2);
        } });
        t3.initLocalNetwork = function() {
          return s2.exec();
        };
      }(t2), xs(t2), Rn(t2), function(e2) {
        const t3 = e2.uploadFile;
        e2.uploadFile = function(e3) {
          return t3.call(this, e3);
        };
      }(t2), function(e2) {
        e2.database = function(t3) {
          if (t3 && Object.keys(t3).length > 0)
            return e2.init(t3).database();
          if (this._database)
            return this._database;
          const n3 = $n(Wn, { uniClient: e2 });
          return this._database = n3, n3;
        }, e2.databaseForJQL = function(t3) {
          if (t3 && Object.keys(t3).length > 0)
            return e2.init(t3).databaseForJQL();
          if (this._databaseForJQL)
            return this._databaseForJQL;
          const n3 = $n(Wn, { uniClient: e2, isJQL: true });
          return this._databaseForJQL = n3, n3;
        };
      }(t2), function(e2) {
        e2.getCurrentUserInfo = ws, e2.chooseAndUploadFile = Ss.initChooseAndUploadFile(e2), Object.assign(e2, { get mixinDatacom() {
          return ks(e2);
        } }), e2.importObject = Is(e2), e2.initSecureNetworkByWeixin = Ps(e2);
      }(t2);
      return ["callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "chooseAndUploadFile"].forEach((e2) => {
        if (!t2[e2])
          return;
        const n3 = t2[e2];
        t2[e2] = function() {
          return n3.apply(t2, Array.from(arguments));
        }, t2[e2] = function(e3, t3) {
          return function(n4) {
            let s2 = false;
            if ("callFunction" === t3) {
              const e4 = n4 && n4.type || u;
              s2 = e4 !== u;
            }
            const r2 = "callFunction" === t3 && !s2, i2 = this._initPromiseHub.exec();
            n4 = n4 || {};
            const { success: o2, fail: a2, complete: c2 } = te(n4), l2 = i2.then(() => s2 ? Promise.resolve() : q(K(t3, "invoke"), n4)).then(() => e3.call(this, n4)).then((e4) => s2 ? Promise.resolve(e4) : q(K(t3, "success"), e4).then(() => q(K(t3, "complete"), e4)).then(() => (r2 && Q(B, { type: J, content: e4 }), Promise.resolve(e4))), (e4) => s2 ? Promise.reject(e4) : q(K(t3, "fail"), e4).then(() => q(K(t3, "complete"), e4)).then(() => (Q(B, { type: J, content: e4 }), Promise.reject(e4))));
            if (!(o2 || a2 || c2))
              return l2;
            l2.then((e4) => {
              o2 && o2(e4), c2 && c2(e4), r2 && Q(B, { type: J, content: e4 });
            }, (e4) => {
              a2 && a2(e4), c2 && c2(e4), r2 && Q(B, { type: J, content: e4 });
            });
          };
        }(t2[e2], e2).bind(t2);
      }), t2.init = this.init, t2;
    }
  }();
  (() => {
    const e = E;
    let t2 = {};
    if (e && 1 === e.length)
      t2 = e[0], Us = Us.init(t2), Us._isDefault = true;
    else {
      const t3 = ["auth", "callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "database", "getCurrentUSerInfo", "importObject"];
      let n2;
      n2 = e && e.length > 0 ? "应用有多个服务空间，请通过uniCloud.init方法指定要使用的服务空间" : "应用未关联服务空间，请在uniCloud目录右键关联服务空间", t3.forEach((e2) => {
        Us[e2] = function() {
          return console.error(n2), Promise.reject(new ne({ code: "SYS_ERR", message: n2 }));
        };
      });
    }
    Object.assign(Us, { get mixinDatacom() {
      return ks(Us);
    } }), gs(Us), Us.addInterceptor = D, Us.removeInterceptor = F, Us.interceptObject = M;
  })();
  var Ls = Us;
  const _sfc_main$d = {
    name: "uni-data-select",
    mixins: [Ls.mixinDatacom || {}],
    props: {
      localdata: {
        type: Array,
        default() {
          return [];
        }
      },
      value: {
        type: [String, Number],
        default: ""
      },
      modelValue: {
        type: [String, Number],
        default: ""
      },
      label: {
        type: String,
        default: ""
      },
      placeholder: {
        type: String,
        default: "请选择"
      },
      emptyTips: {
        type: String,
        default: "无选项"
      },
      clear: {
        type: Boolean,
        default: true
      },
      defItem: {
        type: Number,
        default: 0
      },
      disabled: {
        type: Boolean,
        default: false
      },
      // 格式化输出 用法 field="_id as value, version as text, uni_platform as label" format="{label} - {text}"
      format: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        showSelector: false,
        current: "",
        mixinDatacomResData: [],
        apps: [],
        channels: [],
        cacheKey: "uni-data-select-lastSelectedValue"
      };
    },
    created() {
      this.debounceGet = this.debounce(() => {
        this.query();
      }, 300);
      if (this.collection && !this.localdata.length) {
        this.debounceGet();
      }
    },
    computed: {
      typePlaceholder() {
        const text = {
          "opendb-stat-app-versions": "版本",
          "opendb-app-channels": "渠道",
          "opendb-app-list": "应用"
        };
        const common = this.placeholder;
        const placeholder = text[this.collection];
        return placeholder ? common + placeholder : common;
      },
      valueCom() {
        return this.modelValue;
      }
    },
    watch: {
      localdata: {
        immediate: true,
        handler(val, old) {
          if (Array.isArray(val) && old !== val) {
            this.mixinDatacomResData = val;
          }
        }
      },
      valueCom(val, old) {
        this.initDefVal();
      },
      mixinDatacomResData: {
        immediate: true,
        handler(val) {
          if (val.length) {
            this.initDefVal();
          }
        }
      }
    },
    methods: {
      debounce(fn, time = 100) {
        let timer = null;
        return function(...args) {
          if (timer)
            clearTimeout(timer);
          timer = setTimeout(() => {
            fn.apply(this, args);
          }, time);
        };
      },
      // 执行数据库查询
      query() {
        this.mixinDatacomEasyGet();
      },
      // 监听查询条件变更事件
      onMixinDatacomPropsChange() {
        if (this.collection) {
          this.debounceGet();
        }
      },
      initDefVal() {
        let defValue = "";
        if ((this.valueCom || this.valueCom === 0) && !this.isDisabled(this.valueCom)) {
          defValue = this.valueCom;
        } else {
          let strogeValue;
          if (this.collection) {
            strogeValue = this.getCache();
          }
          if (strogeValue || strogeValue === 0) {
            defValue = strogeValue;
          } else {
            let defItem = "";
            if (this.defItem > 0 && this.defItem <= this.mixinDatacomResData.length) {
              defItem = this.mixinDatacomResData[this.defItem - 1].value;
            }
            defValue = defItem;
          }
          if (defValue || defValue === 0) {
            this.emit(defValue);
          }
        }
        const def = this.mixinDatacomResData.find((item) => item.value === defValue);
        this.current = def ? this.formatItemName(def) : "";
      },
      /**
       * @param {[String, Number]} value
       * 判断用户给的 value 是否同时为禁用状态
       */
      isDisabled(value) {
        let isDisabled = false;
        this.mixinDatacomResData.forEach((item) => {
          if (item.value === value) {
            isDisabled = item.disable;
          }
        });
        return isDisabled;
      },
      clearVal() {
        this.emit("");
        if (this.collection) {
          this.removeCache();
        }
      },
      change(item) {
        if (!item.disable) {
          this.showSelector = false;
          this.current = this.formatItemName(item);
          this.emit(item.value);
        }
      },
      emit(val) {
        this.$emit("input", val);
        this.$emit("update:modelValue", val);
        this.$emit("change", val);
        if (this.collection) {
          this.setCache(val);
        }
      },
      toggleSelector() {
        if (this.disabled) {
          return;
        }
        this.showSelector = !this.showSelector;
      },
      formatItemName(item) {
        let {
          text,
          value,
          channel_code
        } = item;
        channel_code = channel_code ? `(${channel_code})` : "";
        if (this.format) {
          let str = "";
          str = this.format;
          for (let key in item) {
            str = str.replace(new RegExp(`{${key}}`, "g"), item[key]);
          }
          return str;
        } else {
          return this.collection.indexOf("app-list") > 0 ? `${text}(${value})` : text ? text : `未命名${channel_code}`;
        }
      },
      // 获取当前加载的数据
      getLoadData() {
        return this.mixinDatacomResData;
      },
      // 获取当前缓存key
      getCurrentCacheKey() {
        return this.collection;
      },
      // 获取缓存
      getCache(name = this.getCurrentCacheKey()) {
        let cacheData = uni.getStorageSync(this.cacheKey) || {};
        return cacheData[name];
      },
      // 设置缓存
      setCache(value, name = this.getCurrentCacheKey()) {
        let cacheData = uni.getStorageSync(this.cacheKey) || {};
        cacheData[name] = value;
        uni.setStorageSync(this.cacheKey, cacheData);
      },
      // 删除缓存
      removeCache(name = this.getCurrentCacheKey()) {
        let cacheData = uni.getStorageSync(this.cacheKey) || {};
        delete cacheData[name];
        uni.setStorageSync(this.cacheKey, cacheData);
      }
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
    return vue.openBlock(), vue.createElementBlock("view", { class: "uni-stat__select" }, [
      $props.label ? (vue.openBlock(), vue.createElementBlock(
        "span",
        {
          key: 0,
          class: "uni-label-text hide-on-phone"
        },
        vue.toDisplayString($props.label + "："),
        1
        /* TEXT */
      )) : vue.createCommentVNode("v-if", true),
      vue.createElementVNode(
        "view",
        {
          class: vue.normalizeClass(["uni-stat-box", { "uni-stat__actived": $data.current }])
        },
        [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["uni-select", { "uni-select--disabled": $props.disabled }])
            },
            [
              vue.createElementVNode("view", {
                class: "uni-select__input-box",
                onClick: _cache[1] || (_cache[1] = (...args) => $options.toggleSelector && $options.toggleSelector(...args))
              }, [
                $data.current ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "uni-select__input-text"
                  },
                  vue.toDisplayString($data.current),
                  1
                  /* TEXT */
                )) : (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 1,
                    class: "uni-select__input-text uni-select__input-placeholder"
                  },
                  vue.toDisplayString($options.typePlaceholder),
                  1
                  /* TEXT */
                )),
                $data.current && $props.clear && !$props.disabled ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 2,
                  onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $options.clearVal && $options.clearVal(...args), ["stop"]))
                }, [
                  vue.createVNode(_component_uni_icons, {
                    type: "clear",
                    color: "#c0c4cc",
                    size: "24"
                  })
                ])) : (vue.openBlock(), vue.createElementBlock("view", { key: 3 }, [
                  vue.createVNode(_component_uni_icons, {
                    type: $data.showSelector ? "top" : "bottom",
                    size: "14",
                    color: "#999"
                  }, null, 8, ["type"])
                ]))
              ]),
              $data.showSelector ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "uni-select--mask",
                onClick: _cache[2] || (_cache[2] = (...args) => $options.toggleSelector && $options.toggleSelector(...args))
              })) : vue.createCommentVNode("v-if", true),
              $data.showSelector ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "uni-select__selector"
              }, [
                vue.createElementVNode("view", { class: "uni-popper__arrow" }),
                vue.createElementVNode("scroll-view", {
                  "scroll-y": "true",
                  class: "uni-select__selector-scroll"
                }, [
                  $data.mixinDatacomResData.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "uni-select__selector-empty"
                  }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($props.emptyTips),
                      1
                      /* TEXT */
                    )
                  ])) : (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    { key: 1 },
                    vue.renderList($data.mixinDatacomResData, (item, index) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        class: "uni-select__selector-item",
                        key: index,
                        onClick: ($event) => $options.change(item)
                      }, [
                        vue.createElementVNode(
                          "text",
                          {
                            class: vue.normalizeClass({ "uni-select__selector__disabled": item.disable })
                          },
                          vue.toDisplayString($options.formatItemName(item)),
                          3
                          /* TEXT, CLASS */
                        )
                      ], 8, ["onClick"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ])) : vue.createCommentVNode("v-if", true)
            ],
            2
            /* CLASS */
          )
        ],
        2
        /* CLASS */
      )
    ]);
  }
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$c], ["__scopeId", "data-v-ddf9e0a2"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/uni_modules/uni-data-select/components/uni-data-select/uni-data-select.vue"]]);
  const _sfc_main$c = {
    components: {
      TopBar
    },
    setup() {
      vue.onMounted(() => {
        formatAppLog("log", "at pages/publish/Publish.vue:89", "publish挂载完毕");
        getCategoryList().then((res) => {
          if (res.code == 200) {
            let tempList = res.data;
            categoryList.value = tempList.map((item) => ({
              value: item.class_id,
              text: item.class_name
            }));
            formatAppLog("log", "at pages/publish/Publish.vue:98", categoryList.value);
          }
        });
      });
      let currentR = vue.ref("");
      const useUniEmitTabBarVisibilityUpdate = (b2) => {
        uni.$emit("tabBarVisibilityUpdate", { tabBarVisibility: b2 });
        uni.$emit("currentRouterUpdate", { router: currentR.value });
      };
      uni.$on("tabBarCurrentRvalue", function(data) {
        currentR.value = data.router;
      });
      let editorCtx = vue.ref();
      const onEditorReady = () => {
        uni.createSelectorQuery().in(this).select(".myEditor").fields({
          context: true
        }, (res) => {
          formatAppLog("log", "at pages/publish/Publish.vue:122", res);
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
            formatAppLog("log", "at pages/publish/Publish.vue:157", res.tempFilePaths[0]);
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
                formatAppLog("log", "at pages/publish/Publish.vue:168", data);
                editorCtx.value.insertImage({
                  width: "100%",
                  //设置宽度为100%防止宽度溢出手机屏幕
                  height: "auto",
                  src: replaceUrlIP(data.imageUrl),
                  //服务端返回的url
                  alt: "图像",
                  success: function() {
                    formatAppLog("log", "at pages/publish/Publish.vue:175", "insert image success");
                  }
                });
                formatAppLog("log", "at pages/publish/Publish.vue:178", editorCtx.value);
              }
            });
          }
        });
      };
      const pushIt = () => {
        editorCtx.value.getContents({
          success: function(data) {
            data.text = data.text.replace(/[\r\n]+/g, enterWord);
            formatAppLog("log", "at pages/publish/Publish.vue:191", data.text);
            let articleDataJson = {
              "title": titleValue.value,
              "text": data.text,
              "content": data.html,
              "category": categoryID.value
            };
            pushNewArticle(articleDataJson).then((res) => {
              formatAppLog("log", "at pages/publish/Publish.vue:199", res);
              if (res.code == 200) {
                formatAppLog("log", "at pages/publish/Publish.vue:201", "文章发布成功");
              } else {
                formatAppLog("log", "at pages/publish/Publish.vue:203", "文章发布失败");
              }
            }).catch((err) => {
              formatAppLog("log", "at pages/publish/Publish.vue:206", "文章上传发生异常" + err);
            });
          },
          fail: function(err) {
            formatAppLog("log", "at pages/publish/Publish.vue:211", err);
          }
        });
      };
      let categoryID = vue.ref("1");
      let categoryList = vue.ref();
      const categoryChange = (e) => {
        formatAppLog("log", "at pages/publish/Publish.vue:220", "类别发生了改变");
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
        titleValue
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
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_TopBar = vue.resolveComponent("TopBar");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
    const _component_uni_data_select = resolveEasycom(vue.resolveDynamicComponent("uni-data-select"), __easycom_1);
    return vue.openBlock(), vue.createElementBlock("view", { id: "Publish" }, [
      vue.createVNode(_component_TopBar),
      vue.createElementVNode("view", { class: "publish" }, [
        vue.createElementVNode("view", { class: "publish__header" }, [
          vue.createElementVNode("view", { class: "publish__header__icon--back" }, [
            vue.createVNode(_component_uni_icons, {
              type: "back",
              size: "20",
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.useUniEmitTabBarVisibilityUpdate(true))
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
      vue.createElementVNode("view", { class: "publish__body" }, [
        vue.createElementVNode("view", null, [
          vue.createCommentVNode("        标题"),
          vue.createElementVNode("view", { class: "Title w100" }, [
            vue.createElementVNode("view", { class: "uni-input-wrapper" }, [
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "uni-input",
                  style: { "height": "3.125rem", "border-bottom": "1px solid #f1f1f1" },
                  placeholder: "标题（必填）",
                  onInput: _cache[2] || (_cache[2] = (...args) => _ctx.clearInput && _ctx.clearInput(...args)),
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.titleValue = $event)
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
                onReady: _cache[4] || (_cache[4] = (...args) => $setup.onEditorReady && $setup.onEditorReady(...args))
              },
              null,
              32
              /* HYDRATE_EVENTS */
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
              vue.createVNode(_component_uni_data_select, {
                modelValue: $setup.categoryID,
                "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $setup.categoryID = $event),
                localdata: $setup.categoryList,
                onChange: $setup.categoryChange,
                placeholder: "请选择类别"
              }, null, 8, ["modelValue", "localdata", "onChange"])
            ])
          ])
        ])
      ])
    ]);
  }
  const Publish = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$b], ["__scopeId", "data-v-acfd9c67"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/publish/Publish.vue"]]);
  const _sfc_main$b = {
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
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { id: "Message" }, " 这是信息页 ");
  }
  const Message = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$a], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/message/Message.vue"]]);
  const _sfc_main$a = {
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
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { id: "Mine" }, " 这是我的页 ");
  }
  const Mine = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$9], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/mine/Mine.vue"]]);
  const _sfc_main$9 = {
    components: {
      TabBar,
      Home,
      Dynamic,
      Publish,
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
          email: "111@qq.com",
          password: "12312321"
        }).then((res) => {
          formatAppLog("log", "at pages/MainApp.vue:50", res);
          if (res.code == 200) {
            try {
              uni.setStorageSync("token", res.token);
              const currentUser = res.data;
              store2.dispatch("addUser", currentUser);
              formatAppLog("log", "at pages/MainApp.vue:58", store2.getters.getUser);
              plus.nativeUI.toast(`登录成功，当前用户：${store2.getters.getUser.u_id}`);
            } catch (e) {
              formatAppLog("log", "at pages/MainApp.vue:61", e);
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
      uni.$on("tabBarVisibilityUpdate", function(b2) {
        tabBarVisibility.value = b2.tabBarVisibility;
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
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Home = vue.resolveComponent("Home");
    const _component_Dynamic = vue.resolveComponent("Dynamic");
    const _component_Publish = vue.resolveComponent("Publish");
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
          _component_Publish,
          null,
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vShow, $setup.currentR === "Publish"]
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
  const PagesMainApp = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$8], ["__scopeId", "data-v-dc27c07e"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/MainApp.vue"]]);
  const _sfc_main$8 = {
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
  const App = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/App.vue"]]);
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
  const _sfc_main$7 = {
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
          for (let i2 = 0; i2 < res.data.length; i2++) {
            if (!res.data[i2].comment_user_id) {
              continue;
            }
            if (i2 >= 3) {
              break;
            }
            comment_list.value[i2].comment_list_user_id = res.data[i2].comment_user_id;
            comment_list.value[i2].comment_list_user_name = res.data[i2].comment_user_u_name;
            comment_list.value[i2].comment_list_user_content = res.data[i2].comment_content;
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
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
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
  const CommentCard = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7], ["__scopeId", "data-v-1acd372d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentCard.vue"]]);
  const _sfc_main$6 = {
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
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
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
  const CommentExpand = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-b72a798a"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentExpand.vue"]]);
  const _sfc_main$5 = {
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
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
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
  const CommentReplyWindow = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-31eef9f2"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentReplyWindow.vue"]]);
  const _sfc_main$4 = {
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
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_CommentReplyWindow = vue.resolveComponent("CommentReplyWindow");
    const _component_CommentExpand = vue.resolveComponent("CommentExpand");
    const _component_CommentCard = vue.resolveComponent("CommentCard");
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
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
  const Comment = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-404a4e6d"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/comments/CommentList.vue"]]);
  const _sfc_main$3 = {
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
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Loading = vue.resolveComponent("Loading");
    resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
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
  const ArticleDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-388cd4fe"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/components/article/ArticleDetailPage.vue"]]);
  const _sfc_main$2 = {
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
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
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
  const PagesArticleDetailArticleDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-b0178992"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/article/detail/ArticleDetailPage.vue"]]);
  const _sfc_main$1 = {
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
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
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
  const PagesLoginRegisterLoginRegister = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-ed6efab4"], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/loginRegister/loginRegister.vue"]]);
  const _sfc_main = {
    components: {
      CommentReplyWindow,
      Comment
    },
    data() {
      return {};
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_Comment = vue.resolveComponent("Comment");
    return vue.openBlock(), vue.createElementBlock("view", { style: { "background": "#bebebe", "padding": "5px" } }, [
      vue.createElementVNode("view", { class: "status-bar-height" }),
      vue.createVNode(_component_Comment),
      vue.createCommentVNode("驱蚊器问问去为额为邱琦雯顷刻间哈科进士第三空间活动空间哈后快"),
      vue.createCommentVNode("    <CommentExpand></CommentExpand>"),
      vue.createCommentVNode("    <CommentReplyWindow></CommentReplyWindow>")
    ]);
  }
  const PagesTestPageTestPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "G:/study/Full Stack developer/Project/uniapp/v3-uniapp/pages/testPage/testPage.vue"]]);
  __definePage("pages/MainApp", PagesMainApp);
  __definePage("pages/article/detail/ArticleDetailPage", PagesArticleDetailArticleDetailPage);
  __definePage("pages/loginRegister/loginRegister", PagesLoginRegisterLoginRegister);
  __definePage("pages/testPage/testPage", PagesTestPageTestPage);
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
