import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { test, expect } from 'vitest'
import App from './App.vue'

test('App renders the ENTRY label', () => {
  const wrapper = mount(App, { global: { plugins: [createPinia()] } })
  expect(wrapper.text()).toContain('ENTRY')
})
