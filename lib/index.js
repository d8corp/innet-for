'use strict';

var tslib = require('tslib');

let activeWatcher;
class Watch {
    constructor(watcher, freeParent, freeUpdate) {
        this.watcher = watcher;
        this.ran = false;
        if (!freeParent && activeWatcher) {
            activeWatcher.onDestroy(() => this.destroy());
        }
        if (!freeUpdate) {
            this.update();
        }
    }
    static get activeWatcher() {
        return activeWatcher;
    }
    run() {
        const { ran } = this;
        this.ran = true;
        return this.watcher(ran);
    }
    update() {
        this.destroy();
        const prevWatcher = activeWatcher;
        activeWatcher = this;
        this.run();
        activeWatcher = prevWatcher;
        return;
    }
    destroy() {
        const { destructors } = this;
        if (destructors) {
            this.destructors = undefined;
            destructors.forEach(e => e());
        }
        return;
    }
    onDestroy(callback) {
        if (this.destructors) {
            this.destructors.push(callback);
        }
        else {
            this.destructors = [callback];
        }
        return this;
    }
}

let activeEvent;
class Event {
    add(target) {
        let { watchers } = this;
        if (watchers) {
            if (watchers.has(target)) {
                return;
            }
            watchers.add(target);
        }
        else {
            watchers = this.watchers = new Set([target]);
        }
        target.onDestroy(() => watchers.delete(target));
    }
    start() {
        if (!activeEvent) {
            activeEvent = this;
            const { activeWatchers } = this;
            this.activeWatchers = this.watchers;
            this.watchers = activeWatchers;
        }
    }
    end() {
        var _a;
        if (activeEvent === this) {
            for (const watcher of this.activeWatchers) {
                // @ts-ignore
                (_a = watcher.clear) === null || _a === void 0 ? void 0 : _a.call(watcher);
            }
            for (const watcher of this.activeWatchers) {
                watcher.update();
            }
            activeEvent = undefined;
        }
    }
    pipe(watcher) {
        if (this.activeWatchers) {
            this.activeWatchers.add(watcher);
            watcher.onDestroy(() => this.activeWatchers.delete(watcher));
        }
        else {
            this.activeWatchers = new Set([watcher]);
        }
    }
    update() {
        var _a;
        if (!((_a = this.watchers) === null || _a === void 0 ? void 0 : _a.size)) {
            return;
        }
        if (activeEvent) {
            for (const target of this.watchers) {
                activeEvent.pipe(target);
            }
        }
        else {
            this.start();
            this.end();
        }
    }
}

class State extends Event {
    constructor(state) {
        super();
        this.state = state;
    }
    /**
     * the field returns current state.
     * ```typescript
     * const state = new State(1)
     * console.log(state.value) // 1
     * ```
     * */
    get value() {
        const { activeWatcher } = Watch;
        if (activeWatcher) {
            this.add(activeWatcher);
        }
        return this.state;
    }
    /**
     * Change the state.
     * ```typescript
     * const state = new State(1)
     * console.log(state.value) // 1
     *
     * state.value = 2
     * console.log(state.value) // 2
     * ```
     * */
    set value(value) {
        if (value !== this.state) {
            this.state = value;
            this.update();
        }
    }
}

class Cache extends Watch {
    constructor(watcher, freeParent, fireImmediately) {
        super(watcher, freeParent, !fireImmediately);
    }
    destroy() {
        this.updated = false;
        return super.destroy();
    }
    clear() {
        var _a, _b;
        if ((_b = (_a = this._state) === null || _a === void 0 ? void 0 : _a.watchers) === null || _b === void 0 ? void 0 : _b.size) {
            this.update();
        }
        else {
            this.destroy();
        }
    }
    run() {
        this.value = super.run();
        this.updated = true;
    }
    get state() {
        if (!this._state) {
            this._state = new State();
        }
        return this._state;
    }
    get value() {
        if (!this.updated) {
            this.update();
        }
        return this.state.value;
    }
    set value(value) {
        this.state.value = value;
    }
}

const scope = {
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
function dom(content, parent, plugins) {
    const { props, type, children } = content;
    const element = document.createElement(type);
    if (props) {
        for (let key in props) {
            if (key === 'ref') {
                scope.references[props.ref.key] = element;
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
function innet(content, parent = document.body, plugins = scope.currentPlugins, defaultPlugin = dom) {
    var _a;
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
                const prevPlugins = scope.currentPlugins;
                if (isComponent(type)) {
                    scope.currentPlugins = plugins;
                    const component = new type(props, children);
                    if ('destructor' in component) {
                        (_a = Watch.activeWatcher) === null || _a === void 0 ? void 0 : _a.onDestroy(() => component.destructor());
                    }
                    innet(component.render(props, children), parent, plugins, defaultPlugin);
                    if ('mounted' in component) {
                        component.mounted();
                    }
                }
                else {
                    scope.currentPlugins = plugins;
                    const prevMounted = currentMounted;
                    currentMounted = [];
                    innet(type(props, children), parent, plugins, defaultPlugin);
                    currentMounted.forEach(mounted => mounted());
                    currentMounted = prevMounted;
                }
                scope.currentPlugins = prevPlugins;
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
            const prevPlugins = scope.currentPlugins;
            scope.currentPlugins = plugins;
            innet(content(update), comment, plugins, defaultPlugin);
            scope.currentPlugins = prevPlugins;
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
function For(_a, parent, plugins, plugin) {
    var e_1, _b;
    var _c;
    var _d = tslib.__read(_a.children), callback = _d[0], elseProp = _d.slice(1), _e = _a.props, _f = _e.size, sizeProp = _f === void 0 ? Infinity : _f, key = _e.key, ofProp = _e.of;
    if (typeof ofProp === 'function' || typeof sizeProp === 'function') {
        var size_1 = typeof sizeProp === 'function' ? new Cache(sizeProp) : { value: sizeProp };
        var mainComment_1 = document.createComment('for');
        var elseWatcher_1;
        append(parent, mainComment_1);
        (_c = Watch.activeWatcher) === null || _c === void 0 ? void 0 : _c.onDestroy(function () {
            map_1.forEach(function (_a) {
                var watcher = _a.watcher;
                return watcher.destroy();
            });
            elseWatcher_1 === null || elseWatcher_1 === void 0 ? void 0 : elseWatcher_1.destroy();
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
                        elseWatcher_1.destroy();
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
                        var watcher = new Watch(function (update) {
                            if (update) {
                                clear(comment_1);
                            }
                            innet(callback(value, function () { return index_1.value; }), comment_1, plugins, plugin);
                        }, true);
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
                    watcher.destroy();
                    remove(comment);
                });
                if (!i && elseProp.length) {
                    elseWatcher_1 = new Watch(function () { return innet(elseProp, mainComment_1, plugins, plugin); }, true);
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
                    var watcher = new Watch(function (update) {
                        if (update) {
                            clear(comment);
                        }
                        innet(callback(value, function () { return index.value; }), comment, plugins, plugin);
                    }, true);
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
                if (!i && elseProp.length) {
                    elseWatcher_1 = new Watch(function () { return innet(elseProp, mainComment_1, plugins, plugin); }, true);
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
                if (ofProp_1_1 && !ofProp_1_1.done && (_b = ofProp_1.return)) _b.call(ofProp_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (!i) {
            if (elseProp.length) {
                innet(elseProp, parent, plugins, dom);
            }
        }
        else {
            innet(result, parent, plugins, dom);
        }
    }
}

module.exports = For;
