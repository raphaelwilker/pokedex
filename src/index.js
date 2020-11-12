const { default: VueRouter } = require('vue-router');

require('jquery');
require('popper.js');
require('bootstrap');
require('./sass/index.sass');

define([],function(){
    'use strict';

    Vue.use(VueResource);
    Vue.use(VueRouter);

    Vue.http.options.emulateJSON = true;
    Vue.http.options.emulateHTTP = true;

    const components = [
        require('./components/menu'),
        require('./components/home')
    ]

    const mixins = [
        require('./mixins/service-get')
    ]

    const router = [
        require('./settings')
    ]

    new Vue({
        el: '#app',
        mixins : mixins,
        components : components,
        router : router
    })

});