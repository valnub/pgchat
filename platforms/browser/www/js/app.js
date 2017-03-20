(function () {
    'use strict';

    var pubnub = new PubNub({
        publishKey: 'demo',
        subscribeKey: 'demo'
    });
    
    var states = {
        name: '',
        msgs: []
    };
    
    /**
     * Initializes pubnub service
     */
    function initPubNub() {

        // Call event listener when new msg comes in
        pubnub.addListener({
            message: function(data) {
                var type = data.message.name == states.name ? 'sent' : 'received';
                var name = type == 'send' ? states.name : data.message.name;
                states.msgs.push({name:name, text:data.message.text, type:type});
            }
        });

        // Subscribe to these channels
        pubnub.subscribe({
            channels: ['pgday']
        });
        
        // Load chat history
        pubnub.history(
            {
                channel : 'pgday',
                count : 20
            },
            function (status, response) {
                var history = response.messages;
                for (var i=0; i<history.length; i++) {
                    var type = history[i].entry.name == states.name ? 'sent' : 'received';
                    states.msgs.push({
                        name:history[i].entry.name,
                        text:history[i].entry.text,
                        type:type
                    });
                }
            }
        );
    }
    
    /**
     * Initializes all Vue templates
     */
    function initVue () {

        // Tell Vue that we want to use Framework7-Vue plugin
        Vue.use(Framework7Vue);
        
        // Init chat template
        Vue.component('page-chat', {
            template: '#page-chat',
            data: function() {
                return states;
            },
            methods: {
                /**
                 * Listener gets call when new msg should be sent
                 *
                 * @param {string} text The msg to send
                 * @param {function} clear Call this function to clear the message bar component
                 */
                onSend: function(text, clear) {
                    if (text.trim().length === 0) return;
                    pubnub.publish({
                        channel: 'pgday',
                        message: {
                            text:text,
                            name:this.name
                        }
                    });
                    if (typeof clear == 'function') clear();
                }
            }
        });

        // Init Vue
        new Vue({
            el: '#app',
            data: function() {
                return states;
            },
            methods: {
                /**
                 * Gets called when user name was entered and user enters chat
                 */
                enterChat: function () {
                    if (this.name.trim().length === 0) {
                        alert('Please enter your name');
                        return false;
                    }
                    this.msgs.length = 0;
                    this.$f7.mainView.router.load({url: '/chat/'});
                    initPubNub();
                }
            },
            framework7: {
                root: '#app',
                // material: true, // Remember to change css paths to ios/material theme!
                material: Framework7.prototype.device.android ? true : false,
                // Mapping of routes -> templates
                routes: [{
                    path: '/chat/',
                    component: 'page-chat'
                }]
            }
        });
    }

    // Wait until device is ready and then init the app
    document.addEventListener('DOMContentLoaded', function () {
        if (Framework7.prototype.device.android) {
            Dom7('.view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
            Dom7('.view .navbar').prependTo('.view .page');
        }

        initVue();
    }, false);

})();