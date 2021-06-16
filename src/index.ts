import innet, {append, dom, remove, prepend, after, clear, Content} from 'innet'
import {Watch, State, Cache} from 'watch-state'

interface ForMap {
  watcher: Watch
  comment: Comment
  index: State<number>
  value: any
}

// TODO: remove for the next version of watch-state
interface WatchTarget <R = any> {
  (update?: boolean): R;
}

type OfPropStatic<T = any> = T[] | Set<T>
type OfProp<T = any> = OfPropStatic<T> | WatchTarget<OfPropStatic<T>>

export interface ForProps<T = any> {
  of: OfProp<T>
  size?: number | WatchTarget<number>
  key?: keyof T | ((item: T) => any)
}

function getKey (key, value) {
  if (typeof key === 'function') {
    return key(value)
  } else if (key === undefined) {
    return value
  } else {
    return value[key]
  }
}

function For ({
  children: [
    callback,
    ...elseProp
  ],
  props: {
    size: sizeProp = Infinity,
    key,
    of: ofProp,
  }
}, parent, plugins, plugin) {
  if (typeof ofProp === 'function' || typeof sizeProp === 'function') {
    const size = typeof sizeProp === 'function' ? new Cache(sizeProp) : {value: sizeProp}
    const mainComment = document.createComment('for')
    let elseWatcher: Watch
    append(parent, mainComment)
    Watch.activeWatcher?.onDestroy(() => {
      map.forEach(({watcher}) => watcher.destroy())
      elseWatcher?.destroy()
      remove(mainComment)
    })

    let map = new Map<any, ForMap>()
    let valuesList: any[] = []

    new Watch(update => {
      const values = typeof ofProp === 'function' ? ofProp(update) : ofProp

      if (update) {
        const oldValuesList = valuesList
        const oldMap = map
        map = new Map()
        valuesList = []
        let i = 0
        for (const value of values) {
          if (size.value <= i) {
            break
          }
          if (elseWatcher) {
            elseWatcher.destroy()
            elseWatcher = undefined
            clear(mainComment)
          }

          const valueKey = getKey(key, value)

          if (map.has(valueKey)) {
            continue
          }
          if (valueKey === oldValuesList[i]) {
            map.set(valueKey, oldMap.get(valueKey))
            oldMap.delete(valueKey)
          } else if (oldMap.has(value)) {
            const data = oldMap.get(value)

            oldMap.delete(valueKey)
            data.index.value = i
            map.set(valueKey, data)
            if (i) {
              after(map.get(valuesList[i - 1]).comment, data.comment)
            } else {
              prepend(mainComment, data.comment)
            }

          } else {
            const comment = document.createComment('')

            const index = new State(i)

            if (i) {
              after(map.get(valuesList[i - 1]).comment, comment)
            } else {
              prepend(mainComment, comment)
            }

            const watcher = new Watch(update => {
              if (update) {
                clear(comment)
              }
              innet(callback(value, () => index.value), comment, plugins, plugin)
            }, true)

            map.set(valueKey, {comment, value, index, watcher})
          }

          valuesList.push(valueKey)
          i++
        }
        oldMap.forEach(({comment, watcher}) => {
          watcher.destroy()
          remove(comment)
        })
        if (!i && elseProp.length) {
          elseWatcher = new Watch(() => innet(elseProp, mainComment, plugins, plugin), true)
        }
      } else {
        let i = 0

        for (const value of values) {
          if (size.value <= i) {
            break
          }

          const valueKey = getKey(key, value)

          if (map.has(valueKey)) {
            continue
          }

          const comment = document.createComment('')

          const index = new State(i++)

          valuesList.push(valueKey)

          append(mainComment, comment)
          const watcher = new Watch(update => {
            if (update) {
              clear(comment)
            }
            innet(callback(value, () => index.value), comment, plugins, plugin)
          }, true)

          map.set(getKey(key, value), {comment, value, index, watcher})
        }
        if (!i && elseProp.length) {
          elseWatcher = new Watch(() => innet(elseProp, mainComment, plugins, plugin), true)
        }
      }
    })
  } else {
    const result = []
    let i = 0
    for (const value of ofProp) {
      if (sizeProp <= i) {
        break
      }
      result.push(callback(value, i++))
    }
    if (!i) {
      if (elseProp.length) {
        innet(elseProp, parent, plugins, dom)
      }
    } else {
      innet(result, parent, plugins, dom)
    }
  }
}

export default For
