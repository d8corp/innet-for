import innet, { append, remove, after, prepend, clear, dom } from 'innet';
import { Cache, onClear, Watch, State, unwatch } from 'watch-state';

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
    const { props, children } = target;
    const { size: sizeProp = Infinity, key } = props;
    const callback = children[0];
    const ofProp = props.of;
    if (typeof ofProp === 'function' || typeof sizeProp === 'function') {
        const size = typeof sizeProp === 'function' ? new Cache(sizeProp) : { value: sizeProp };
        const mainComment = document.createComment('for');
        let elseWatcher;
        append(parent, mainComment);
        onClear(() => {
            map.forEach(({ watcher }) => watcher.destructor());
            elseWatcher === null || elseWatcher === void 0 ? void 0 : elseWatcher.destructor();
            remove(mainComment);
        });
        let map = new Map();
        let valuesList = [];
        new Watch(update => {
            const values = typeof ofProp === 'function' ? ofProp(update) : ofProp;
            if (update) {
                const oldValuesList = valuesList;
                const oldMap = map;
                map = new Map();
                valuesList = [];
                let i = 0;
                for (const value of values) {
                    if (size.value <= i) {
                        break;
                    }
                    if (elseWatcher) {
                        elseWatcher.destructor();
                        elseWatcher = undefined;
                        clear(mainComment);
                    }
                    const valueKey = getKey(key, value);
                    if (map.has(valueKey)) {
                        continue;
                    }
                    if (valueKey === oldValuesList[i]) {
                        map.set(valueKey, oldMap.get(valueKey));
                        oldMap.delete(valueKey);
                    }
                    else if (oldMap.has(value)) {
                        const data = oldMap.get(value);
                        oldMap.delete(valueKey);
                        data.index.value = i;
                        map.set(valueKey, data);
                        if (i) {
                            after(map.get(valuesList[i - 1]).comment, data.comment);
                        }
                        else {
                            prepend(mainComment, data.comment);
                        }
                    }
                    else {
                        const comment = document.createComment('');
                        const index = new State(i);
                        if (i) {
                            after(map.get(valuesList[i - 1]).comment, comment);
                        }
                        else {
                            prepend(mainComment, comment);
                        }
                        const watcher = unwatch(() => new Watch(update => {
                            if (update) {
                                clear(comment);
                            }
                            innet(callback(value, () => index.value), comment, plugins, plugin);
                        }));
                        map.set(valueKey, { comment, value, index, watcher });
                    }
                    valuesList.push(valueKey);
                    i++;
                }
                oldMap.forEach(({ comment, watcher }) => {
                    watcher.destructor();
                    remove(comment);
                });
                if (!i && props.else) {
                    unwatch(() => {
                        elseWatcher = new Watch(() => innet(props.else, mainComment, plugins, plugin));
                    });
                }
            }
            else {
                let i = 0;
                for (const value of values) {
                    if (size.value <= i) {
                        break;
                    }
                    const valueKey = getKey(key, value);
                    if (map.has(valueKey)) {
                        continue;
                    }
                    const comment = document.createComment('');
                    const index = new State(i++);
                    valuesList.push(valueKey);
                    append(mainComment, comment);
                    const watcher = unwatch(() => new Watch(update => {
                        if (update) {
                            clear(comment);
                        }
                        innet(callback(value, () => index.value), comment, plugins, plugin);
                    }));
                    map.set(getKey(key, value), { comment, value, index, watcher });
                }
                if (!i && props.else) {
                    unwatch(() => {
                        elseWatcher = new Watch(() => innet(props.else, mainComment, plugins, plugin));
                    });
                }
            }
        });
    }
    else {
        const result = [];
        let i = 0;
        for (const value of ofProp) {
            if (sizeProp <= i) {
                break;
            }
            result.push(callback(value, i++));
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

export default For;
