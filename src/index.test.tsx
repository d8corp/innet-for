import innet from 'innet'
import {State, Watch} from 'watch-state'
import renderElement from 'innet/utils/test/renderElement'
import getHTML from 'innet/utils/test/getHTML'

import forPlugin, {ForProps} from '.'

function render (content) {
  return renderElement(content, {
    for: forPlugin
  })
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      for: ForProps
    }
  }
}

describe('for', () => {
  describe('of', () => {
    test('simple', () => {
      const el = render(
        <for of={['foo', 'bar', 'baz']}>
          {(item, i) => <div>{i}: {item}</div>}
        </for>
      )
      expect(getHTML(el)).toBe('<div>0: foo</div><div>1: bar</div><div>2: baz</div>')
    })
    test('else', () => {
      const el = render(
        <for of={[]}>
          {(item, i) => <div>{i}: {item}</div>}
          test
        </for>
      )
      expect(getHTML(el)).toBe('test')
    })
    test('dynamic else', () => {
      const state = new State([])
      const el = render(
        <for of={() => state.value}>
          {(item, i) => <div>{i}: {item}</div>}
          test
        </for>
      )
      expect(getHTML(el)).toBe('test<!--for-->')

      state.value = ['foo']
      expect(getHTML(el)).toBe('<div>0<!---->: foo</div><!----><!--for-->')

      state.value = ['bar', 'foo']
      expect(getHTML(el)).toBe('<div>0<!---->: bar</div><!----><div>1<!---->: foo</div><!----><!--for-->')

      state.value = []
      expect(getHTML(el)).toBe('test<!--for-->')
    })
    test('template else', () => {
      let rendered = false
      function Else () {
        rendered = true
        Watch.activeWatcher?.onDestroy(() => rendered = false)
        return 'test'
      }

      const state = new State(['foo'])
      const el = render(
        <for of={() => state.value}>
          {(item, i) => <div>{i}: {item}</div>}
          <Else />
        </for>
      )
      expect(rendered).toBe(false)
      expect(getHTML(el)).toBe('<div>0<!---->: foo</div><!----><!--for-->')

      state.value = []
      expect(rendered).toBe(true)
      expect(getHTML(el)).toBe('test<!--for-->')

      state.value = ['foo']
      expect(rendered).toBe(false)
      expect(getHTML(el)).toBe('<div>0<!---->: foo</div><!----><!--for-->')

    })
    test('multiply else', () => {
      const el = render(
        <for of={[]}>
          {(item, i) => <div>{i}: {item}</div>}
          Test
          {[' #1']}
        </for>
      )
      expect(getHTML(el)).toBe('Test #1')
    })
    test('size', () => {
      const el = render(
        <for of={['foo', 'bar', 'baz']} size={2}>
          {(item, i) => <div>{i}: {item}</div>}
        </for>
      )
      expect(getHTML(el)).toBe('<div>0: foo</div><div>1: bar</div>')
    })
    test('dynamic size', () => {
      const size = new State(2)
      const el = render(
        <for of={['foo', 'bar', 'baz']} size={() => size.value}>
          {(item, i) => <div>{i}: {item}</div>}
        </for>
      )

      el.querySelector('div').dataset.test = 'test'
      expect(getHTML(el)).toBe('<div data-test="test">0<!---->: foo</div><!----><div>1<!---->: bar</div><!----><!--for-->')

      size.value = 3
      expect(getHTML(el)).toBe('<div data-test="test">0<!---->: foo</div><!----><div>1<!---->: bar</div><!----><div>2<!---->: baz</div><!----><!--for-->')

      size.value = 1
      expect(getHTML(el)).toBe('<div data-test="test">0<!---->: foo</div><!----><!--for-->')
    })
    test('state', () => {
      const todos = new State(['foo'])

      const el = render(
        <for of={() => todos.value}>
          {(item, i) => <div>{i}: {item}</div>}
        </for>
      )

      const divFoo = el.querySelector('div')

      expect(getHTML(el)).toBe('<div>0<!---->: foo</div><!----><!--for-->')

      todos.value = ['foo', 'bar']

      expect(getHTML(el)).toBe('<div>0<!---->: foo</div><!----><div>1<!---->: bar</div><!----><!--for-->')
      expect(el.querySelector('div')).toBe(divFoo)

      const divBar = el.querySelector('div:last-child')

      expect(divBar.innerHTML).toBe('1<!---->: bar')

      todos.value = ['foo', 'baz', 'bar']

      expect(getHTML(el)).toBe('<div>0<!---->: foo</div><!----><div>1<!---->: baz</div><!----><div>2<!---->: bar</div><!----><!--for-->')

      todos.value = ['baz', 'foo']

      expect(getHTML(el)).toBe('<div>0<!---->: baz</div><!----><div>1<!---->: foo</div><!----><!--for-->')
      expect(divFoo).toBe(el.querySelector('div:last-child'))
    })
    test('child watcher', () => {
      const todos = new State([])
      const el = render(
        <for of={() => todos.value}>
          {(item, i) => i() ? <div>{i}: {item}</div> : null}
        </for>
      )
      expect(getHTML(el)).toBe('<!--for-->')

      todos.value = ['foo']
      expect(getHTML(el)).toBe('<!----><!--for-->')

      todos.value = ['bar', 'foo']
      expect(getHTML(el)).toBe('<!----><div>1<!---->: foo</div><!----><!--for-->')
    })
    test('Set', () => {
      const el = render(
        <for of={new Set(['foo', 'bar'])}>
          {(item, i) => <div>{i}: {item}</div>}
        </for>
      )
      expect(getHTML(el)).toBe('<div>0: foo</div><div>1: bar</div>')
    })
    test('dynamic Set', () => {
      const todos = new State(new Set())

      const el = render(
        <for of={() => todos.value}>
          {(item, i) => <div>{i}: {item}</div>}
        </for>
      )
      expect(getHTML(el)).toBe('<!--for-->')

      todos.value.add('foo')
      todos.update()

      todos.value.add('bar')
      todos.update()
      expect(getHTML(el)).toBe('<div>0<!---->: foo</div><!----><div>1<!---->: bar</div><!----><!--for-->')

      todos.value.add('foo')
      todos.update()
      expect(getHTML(el)).toBe('<div>0<!---->: foo</div><!----><div>1<!---->: bar</div><!----><!--for-->')

      todos.value.delete('foo')
      todos.update()
      expect(getHTML(el)).toBe('<div>0<!---->: bar</div><!----><!--for-->')
    })
    test('string key', () => {
      const todos = new State<{title: string, id: number, done: boolean}[]>([])

      const el = render(
        <for of={() => todos.value} key='id'>
          {({title, done}) => <div>{done+''}: {title}</div>}
        </for>
      )
      expect(getHTML(el)).toBe('<!--for-->')

      todos.value.push({
        id: Math.random(),
        title: 'test',
        done: false
      })
      todos.update()

      expect(getHTML(el)).toBe('<div>false: test</div><!----><!--for-->')

      const div = el.querySelector('div')
      expect(div).toBeInstanceOf(HTMLDivElement)

      todos.value[0] = {...todos.value[0]}
      todos.update()

      expect(getHTML(el)).toBe('<div>false: test</div><!----><!--for-->')
      expect(el.querySelector('div') === div).toBe(true)
    })
    test('function key', () => {
      const todos = new State<{title: string, id: number, done: boolean}[]>([])

      const el = render(
        <for of={() => todos.value} key={todo => todo.id}>
          {({title, done}) => <div>{done+''}: {title}</div>}
        </for>
      )
      expect(getHTML(el)).toBe('<!--for-->')

      todos.value.push({
        id: Math.random(),
        title: 'test',
        done: false
      })
      todos.update()

      expect(getHTML(el)).toBe('<div>false: test</div><!----><!--for-->')

      const div = el.querySelector('div')
      expect(div).toBeInstanceOf(HTMLDivElement)

      todos.value = [{...todos.value[0]}]
      todos.update()

      expect(getHTML(el)).toBe('<div>false: test</div><!----><!--for-->')
      expect(el.querySelector('div') === div).toBe(true)
    })
  })
})
