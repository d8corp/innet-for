'use strict';

var tslib = require('tslib');

const scope = {};

function createEvent(target) {
    return function () {
        if (scope.activeWatchers) {
            return target.apply(this, arguments);
        }
        else {
            const prevWatcher = scope.activeWatcher;
            scope.activeWatcher = undefined;
            const watchers = scope.activeWatchers = new Set();
            const result = target.apply(this, arguments);
            scope.activeWatchers = undefined;
            watchers.forEach(watcher => watcher.update());
            scope.activeWatcher = prevWatcher;
            return result;
        }
    };
}

function unwatch(target) {
    const prevWatcher = scope.activeWatcher;
    scope.activeWatcher = undefined;
    const result = target();
    scope.activeWatcher = prevWatcher;
    return result;
}

function onClear(callback) {
    if (scope.activeWatcher) {
        scope.activeWatcher.onClear(callback);
        return true;
    }
    return false;
}

class Watch {
    constructor(target) {
        this.target = target;
        this.rendered = false;
        this.updating = false;
        this.update();
    }
    update() {
        this.updating = true;
        this.clear(this.cleaners, this.rendered);
        onClear(() => this.destructor());
        const prevWatcher = scope.activeWatcher;
        scope.activeWatcher = this;
        this.target(this.rendered);
        scope.activeWatcher = prevWatcher;
        this.rendered = true;
        this.updating = false;
        return this;
    }
    destructor() {
        this.clear(this.destructors, false);
        return this;
    }
    clear(callbacks, update) {
        this.cleaners = undefined;
        this.destructors = undefined;
        if (callbacks) {
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](update);
            }
        }
        return this;
    }
    onDestructor(callback) {
        if (this.destructors) {
            this.destructors.push(callback);
        }
        else {
            this.destructors = [callback];
        }
        return this;
    }
    onUpdate(callback) {
        if (this.cleaners) {
            this.cleaners.push(callback);
        }
        else {
            this.cleaners = [callback];
        }
        return this;
    }
    onClear(callback) {
        this.onUpdate(callback);
        this.onDestructor(callback);
        return this;
    }
}

class State {
    constructor(value) {
        this.watchers = new Set();
        this.caches = new Set();
        this.target = value;
    }
    get value() {
        const { activeWatcher, activeCache } = scope;
        if (activeWatcher) {
            const { watchers } = this;
            if (activeCache) {
                const { caches } = this;
                if (!caches.has(activeCache)) {
                    caches.add(activeCache);
                    activeWatcher.onClear(update => {
                        if (!update || caches === this.caches) {
                            caches.delete(activeCache);
                        }
                    });
                }
            }
            else if (!watchers.has(activeWatcher)) {
                watchers.add(activeWatcher);
                activeWatcher.onClear(update => {
                    if (!update || watchers === this.watchers) {
                        watchers.delete(activeWatcher);
                    }
                });
            }
        }
        return this.target;
    }
    set value(value) {
        if (value !== this.target) {
            this.target = value;
            const { activeWatcher } = scope;
            scope.activeWatcher = undefined;
            this.update();
            scope.activeWatcher = activeWatcher;
        }
    }
    update() {
        const caches = this.updateCache();
        const { watchers } = this;
        if (watchers.size) {
            this.watchers = new Set();
            if (scope.activeWatchers) {
                watchers.forEach(watcher => scope.activeWatchers.add(watcher));
            }
            else {
                watchers.forEach(watcher => watcher.update());
            }
        }
        if (caches) {
            createEvent(() => caches.forEach(cache => cache.checkWatcher()))();
        }
    }
    updateCache() {
        const { caches } = this;
        if (caches.size) {
            this.caches = new Set();
            return checkCaches(caches);
        }
    }
}
function checkCaches(caches, watchers = []) {
    caches.forEach(cache => {
        const { watcher, state } = cache;
        if (watcher) {
            if (state.watchers.size) {
                watchers.push(cache);
            }
            if (state.caches.size) {
                checkCaches(state.caches, watchers);
            }
            cache.destructor();
        }
    });
    return watchers;
}

class Cache {
    constructor(target) {
        this.target = target;
        this.state = new State();
    }
    destructor() {
        const { watcher } = this;
        this.watcher = undefined;
        watcher === null || watcher === void 0 ? void 0 : watcher.destructor();
    }
    checkWatcher() {
        if (!this.watcher) {
            unwatch(() => {
                let watcher;
                watcher = this.watcher = new Watch(update => {
                    if (!watcher || this.watcher === watcher) {
                        if (!update || this.state.watchers.size || this.state.caches.size) {
                            const oldActiveCache = scope.activeCache;
                            scope.activeCache = this;
                            this.state.value = this.target();
                            scope.activeCache = oldActiveCache;
                        }
                        else {
                            this.destructor();
                        }
                    }
                });
            });
        }
    }
    get value() {
        this.checkWatcher();
        return this.state.value;
    }
}

const scope$1 = {
    currentPlugins: {},
    references: {}
};

function removeParentChild(target) {
    if (target._parent) {
        const children = target._parent._children;
        children.splice(children.indexOf(target), 1);
        target._parent = undefined;
    }
}
function removeElements(target) {
    target.remove();
    if (target instanceof Comment) {
        clear(target);
    }
}
function updateChildren(target) {
    if (target instanceof Comment) {
        if (target._children) {
            target.before.apply(target, target._children);
            target._children.forEach(updateChildren);
        }
        else {
            target._children = [];
        }
    }
}
function insertChild(target, node, offset = 0) {
    if (target._parent) {
        const parent = node._parent = target._parent;
        parent._children.splice(parent._children.indexOf(target) - offset, 0, node);
    }
}
function clear(target) {
    target._children.forEach(removeElements);
    target._children = [];
}
function remove(target) {
    removeParentChild(target);
    removeElements(target);
}
function prepend(target, node) {
    removeParentChild(node);
    if (target instanceof Comment) {
        node._parent = target;
        if (!target._children) {
            target._children = [];
        }
        target._children.unshift(node);
        (target._children[1] || target).before(node);
    }
    else {
        target.prepend(node);
    }
    updateChildren(node);
}
function append(target, node) {
    removeParentChild(node);
    if (target instanceof Comment) {
        node._parent = target;
        if (!target._children) {
            target._children = [];
        }
        target._children.push(node);
        target.before(node);
    }
    else {
        target.appendChild(node);
    }
    updateChildren(node);
}
function after(target, node) {
    removeParentChild(node);
    insertChild(target, node);
    target.after(node);
    updateChildren(node);
}

function create(target, props, ...children) {
    const result = {};
    if (target) {
        result.type = target;
    }
    if (props) {
        result.props = props;
    }
    if (children.length) {
        result.children = children.flat(Infinity);
    }
    return result;
}
function isComponent(value) {
    return 'render' in (value === null || value === void 0 ? void 0 : value.prototype);
}
function isContextNode(value) {
    return 'context' in value;
}
let currentMounted;
const onDestructor = onClear;
function dom(content, parent, plugins) {
    const { props, type, children } = content;
    const element = document.createElement(type);
    if (props) {
        for (let key in props) {
            if (key === 'ref') {
                scope$1.references[props.ref.key] = element;
            }
            else {
                const value = props[key];
                if (key.startsWith('on')) {
                    element[key] = value;
                }
                else {
                    const bothSet = key[0] === '$';
                    const fieldSet = bothSet || key[0] === '_';
                    const attributeSet = bothSet || !fieldSet;
                    if (fieldSet) {
                        key = key.slice(1);
                    }
                    if (typeof value === 'function') {
                        new Watch(update => {
                            const result = value(update);
                            if (fieldSet) {
                                element[key] = result;
                            }
                            if (attributeSet) {
                                if (result === undefined) {
                                    element.removeAttribute(key);
                                }
                                else {
                                    element.setAttribute(key, result);
                                }
                            }
                        });
                    }
                    else {
                        if (fieldSet) {
                            element[key] = value;
                        }
                        if (attributeSet && value !== undefined) {
                            element.setAttribute(key, value);
                        }
                    }
                }
            }
        }
    }
    innet(element, parent);
    if (children) {
        for (let i = 0; i < children.length; i++) {
            innet(children[i], element, plugins, dom);
        }
    }
}
function innet(content, parent = document.body, plugins = scope$1.currentPlugins, defaultPlugin = dom) {
    if (content instanceof Node) {
        append(parent, content);
    }
    else if (Array.isArray(content)) {
        for (let i = 0; i < content.length; i++) {
            innet(content[i], parent, plugins, defaultPlugin);
        }
    }
    else if (typeof content === 'object' && content !== null) {
        if (isContextNode(content)) {
            innet(content.children, parent, content.context, defaultPlugin);
        }
        else {
            const { type, props, children } = content;
            if (!type) {
                innet(children, parent, plugins, defaultPlugin);
            }
            else if (typeof type === 'string') {
                if (type in plugins) {
                    plugins[type](content, parent, plugins, defaultPlugin);
                }
                else {
                    defaultPlugin(content, parent, plugins);
                }
            }
            else if (typeof type === 'function') {
                const prevPlugins = scope$1.currentPlugins;
                if (isComponent(type)) {
                    scope$1.currentPlugins = plugins;
                    const component = new type(props, children);
                    if ('destructor' in component) {
                        onDestructor(() => component.destructor());
                    }
                    innet(component.render(props, children), parent, plugins, defaultPlugin);
                    if ('mounted' in component) {
                        component.mounted();
                    }
                }
                else {
                    scope$1.currentPlugins = plugins;
                    const prevMounted = currentMounted;
                    currentMounted = [];
                    innet(type(props, children), parent, plugins, defaultPlugin);
                    currentMounted.forEach(mounted => mounted());
                    currentMounted = prevMounted;
                }
                scope$1.currentPlugins = prevPlugins;
            }
        }
    }
    else if (typeof content === 'function') {
        const comment = document.createComment(content.name);
        append(parent, comment);
        new Watch(update => {
            if (update) {
                clear(comment);
            }
            const prevPlugins = scope$1.currentPlugins;
            scope$1.currentPlugins = plugins;
            innet(content(update), comment, plugins, defaultPlugin);
            scope$1.currentPlugins = prevPlugins;
        });
    }
    else if (typeof content === 'string' || typeof content === 'number') {
        append(parent, document.createTextNode(content + ''));
    }
    return parent;
}
innet.create = create;

function getKey(key, value) {
    if (typeof key === 'function') {
        return key(value);
    }
    else if (key === undefined) {
        return value;
    }
    else {
        return value[key];
    }
}
function For(target, parent, plugins, plugin) {
    var e_1, _a;
    var props = target.props, children = target.children;
    var _b = props.size, sizeProp = _b === void 0 ? Infinity : _b, key = props.key;
    var callback = children[0];
    var ofProp = props.of;
    if (typeof ofProp === 'function' || typeof sizeProp === 'function') {
        var size_1 = typeof sizeProp === 'function' ? new Cache(sizeProp) : { value: sizeProp };
        var mainComment_1 = document.createComment('for');
        var elseWatcher_1;
        append(parent, mainComment_1);
        onClear(function () {
            map_1.forEach(function (_a) {
                var watcher = _a.watcher;
                return watcher.destructor();
            });
            elseWatcher_1 === null || elseWatcher_1 === void 0 ? void 0 : elseWatcher_1.destructor();
            remove(mainComment_1);
        });
        var map_1 = new Map();
        var valuesList_1 = [];
        new Watch(function (update) {
            var e_2, _a, e_3, _b;
            var values = typeof ofProp === 'function' ? ofProp(update) : ofProp;
            if (update) {
                var oldValuesList = valuesList_1;
                var oldMap = map_1;
                map_1 = new Map();
                valuesList_1 = [];
                var i = 0;
                var _loop_1 = function (value) {
                    if (size_1.value <= i) {
                        return "break";
                    }
                    if (elseWatcher_1) {
                        elseWatcher_1.destructor();
                        elseWatcher_1 = undefined;
                        clear(mainComment_1);
                    }
                    var valueKey = getKey(key, value);
                    if (map_1.has(valueKey)) {
                        return "continue";
                    }
                    if (valueKey === oldValuesList[i]) {
                        map_1.set(valueKey, oldMap.get(valueKey));
                        oldMap.delete(valueKey);
                    }
                    else if (oldMap.has(value)) {
                        var data = oldMap.get(value);
                        oldMap.delete(valueKey);
                        data.index.value = i;
                        map_1.set(valueKey, data);
                        if (i) {
                            after(map_1.get(valuesList_1[i - 1]).comment, data.comment);
                        }
                        else {
                            prepend(mainComment_1, data.comment);
                        }
                    }
                    else {
                        var comment_1 = document.createComment('');
                        var index_1 = new State(i);
                        if (i) {
                            after(map_1.get(valuesList_1[i - 1]).comment, comment_1);
                        }
                        else {
                            prepend(mainComment_1, comment_1);
                        }
                        var watcher = unwatch(function () { return new Watch(function (update) {
                            if (update) {
                                clear(comment_1);
                            }
                            innet(callback(value, function () { return index_1.value; }), comment_1, plugins, plugin);
                        }); });
                        map_1.set(valueKey, { comment: comment_1, value: value, index: index_1, watcher: watcher });
                    }
                    valuesList_1.push(valueKey);
                    i++;
                };
                try {
                    for (var values_1 = tslib.__values(values), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
                        var value = values_1_1.value;
                        var state_1 = _loop_1(value);
                        if (state_1 === "break")
                            break;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (values_1_1 && !values_1_1.done && (_a = values_1.return)) _a.call(values_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                oldMap.forEach(function (_a) {
                    var comment = _a.comment, watcher = _a.watcher;
                    watcher.destructor();
                    remove(comment);
                });
                if (!i && props.else) {
                    unwatch(function () {
                        elseWatcher_1 = new Watch(function () { return innet(props.else, mainComment_1, plugins, plugin); });
                    });
                }
            }
            else {
                var i = 0;
                var _loop_2 = function (value) {
                    if (size_1.value <= i) {
                        return "break";
                    }
                    var valueKey = getKey(key, value);
                    if (map_1.has(valueKey)) {
                        return "continue";
                    }
                    var comment = document.createComment('');
                    var index = new State(i++);
                    valuesList_1.push(valueKey);
                    append(mainComment_1, comment);
                    var watcher = unwatch(function () { return new Watch(function (update) {
                        if (update) {
                            clear(comment);
                        }
                        innet(callback(value, function () { return index.value; }), comment, plugins, plugin);
                    }); });
                    map_1.set(getKey(key, value), { comment: comment, value: value, index: index, watcher: watcher });
                };
                try {
                    for (var values_2 = tslib.__values(values), values_2_1 = values_2.next(); !values_2_1.done; values_2_1 = values_2.next()) {
                        var value = values_2_1.value;
                        var state_2 = _loop_2(value);
                        if (state_2 === "break")
                            break;
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (values_2_1 && !values_2_1.done && (_b = values_2.return)) _b.call(values_2);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                if (!i && props.else) {
                    unwatch(function () {
                        elseWatcher_1 = new Watch(function () { return innet(props.else, mainComment_1, plugins, plugin); });
                    });
                }
            }
        });
    }
    else {
        var result = [];
        var i = 0;
        try {
            for (var ofProp_1 = tslib.__values(ofProp), ofProp_1_1 = ofProp_1.next(); !ofProp_1_1.done; ofProp_1_1 = ofProp_1.next()) {
                var value = ofProp_1_1.value;
                if (sizeProp <= i) {
                    break;
                }
                result.push(callback(value, i++));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (ofProp_1_1 && !ofProp_1_1.done && (_a = ofProp_1.return)) _a.call(ofProp_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (!i) {
            if (props.else) {
                innet(props.else, parent, plugins, dom);
            }
        }
        else {
            innet(result, parent, plugins, dom);
        }
    }
}

module.exports = For;