import { mount } from '@vue/test-utils'
import { test, expect } from 'vitest'
import App from './App.vue'

test('App renders the ENTRY label', () => {
  const wrapper = mount(App)
  expect(wrapper.text()).toContain('ENTRY')
})
