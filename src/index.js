require('./sass/index.sass');

define([],function(){
    'use strict';

    Vue.use(VueResource);

    Vue.http.options.emulateJSON = true;
    Vue.http.options.emulateHTTP = true;

    const components = [
        require('./components/menu'),
        require('./components/home')
    ]

    const mixins = [
    
    ]

    new Vue({
        el: '#app',
        mixins : mixins,
        components : components,
        data : function(){
            return{
                str : "Hello World!"
            }
        }
    })

});