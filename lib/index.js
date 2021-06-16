'use strict';

var tslib = require('tslib');
var innet = require('innet');
var watchState = require('watch-state');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var innet__default = /*#__PURE__*/_interopDefaultLegacy(innet);

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
        var size_1 = typeof sizeProp === 'function' ? new watchState.Cache(sizeProp) : { value: sizeProp };
        var mainComment_1 = document.createComment('for');
        var elseWatcher_1;
        innet.append(parent, mainComment_1);
        (_c = watchState.Watch.activeWatcher) === null || _c === void 0 ? void 0 : _c.onDestroy(function () {
            map_1.forEach(function (_a) {
                var watcher = _a.watcher;
                return watcher.destroy();
            });
            elseWatcher_1 === null || elseWatcher_1 === void 0 ? void 0 : elseWatcher_1.destroy();
            innet.remove(mainComment_1);
        });
        var map_1 = new Map();
        var valuesList_1 = [];
        new watchState.Watch(function (update) {
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
                        innet.clear(mainComment_1);
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
                            innet.after(map_1.get(valuesList_1[i - 1]).comment, data.comment);
                        }
                        else {
                            innet.prepend(mainComment_1, data.comment);
                        }
                    }
                    else {
                        var comment_1 = document.createComment('');
                        var index_1 = new watchState.State(i);
                        if (i) {
                            innet.after(map_1.get(valuesList_1[i - 1]).comment, comment_1);
                        }
                        else {
                            innet.prepend(mainComment_1, comment_1);
                        }
                        var watcher = new watchState.Watch(function (update) {
                            if (update) {
                                innet.clear(comment_1);
                            }
                            innet__default['default'](callback(value, function () { return index_1.value; }), comment_1, plugins, plugin);
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
                    innet.remove(comment);
                });
                if (!i && elseProp.length) {
                    elseWatcher_1 = new watchState.Watch(function () { return innet__default['default'](elseProp, mainComment_1, plugins, plugin); }, true);
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
                    var index = new watchState.State(i++);
                    valuesList_1.push(valueKey);
                    innet.append(mainComment_1, comment);
                    var watcher = new watchState.Watch(function (update) {
                        if (update) {
                            innet.clear(comment);
                        }
                        innet__default['default'](callback(value, function () { return index.value; }), comment, plugins, plugin);
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
                    elseWatcher_1 = new watchState.Watch(function () { return innet__default['default'](elseProp, mainComment_1, plugins, plugin); }, true);
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
                innet__default['default'](elseProp, parent, plugins, innet.dom);
            }
        }
        else {
            innet__default['default'](result, parent, plugins, innet.dom);
        }
    }
}

module.exports = For;
