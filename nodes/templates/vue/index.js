/* jshint browser: true, esversion: 5, asi: true */
/*globals Vue, uibuilder */
// @ts-nocheck
/*
  Copyright (c) 2019 Julian Knight (Totally Information)

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
'use strict'

/** @see https://github.com/TotallyInformation/node-red-contrib-uibuilder/wiki/Front-End-Library---available-properties-and-methods */

// eslint-disable-next-line no-unused-vars
var app1 = new Vue({
    el: '#app',
    data: {
        dev: {},
        data: {},
        // items: [
        //   { isActive: true, age: 40, name: { first: 'Dickerson', last: 'Macdonald' } },
        //   { isActive: false, age: 21, name: { first: 'Larsen', last: 'Shaw' } },
        //   {
        //     isActive: false,
        //     age: 9,
        //     name: { first: 'Mini', last: 'Navarro' },
        //     _rowVariant: 'success'
        //   },
        //   { isActive: false, age: 89, name: { first: 'Geneva', last: 'Wilson' } },
        //   { isActive: true, age: 38, name: { first: 'Jami', last: 'Carney' } },
        //   { isActive: false, age: 27, name: { first: 'Essie', last: 'Dunlap' } },
        //   { isActive: true, age: 40, name: { first: 'Thor', last: 'Macdonald' } },
        //   {
        //     isActive: true,
        //     age: 87,
        //     name: { first: 'Larsen', last: 'Shaw' },
        //     _cellVariants: { age: 'danger', isActive: 'warning' }
        //   },
        //   { isActive: false, age: 26, name: { first: 'Mitzi', last: 'Navarro' } },
        //   { isActive: false, age: 22, name: { first: 'Genevieve', last: 'Wilson' } },
        //   { isActive: true, age: 38, name: { first: 'John', last: 'Carney' } },
        //   { isActive: false, age: 29, name: { first: 'Dick', last: 'Dunlap' } }
        // ],
        fields: [],
        totalRows: 1,
        currentPage: 1,
        perPage: 50,
        pageOptions: [50, 100, 150, 200, 250, 300],
        sortBy: '',
        sortDesc: false,
        sortDirection: 'asc',
        filter: null,
        filterOn: [],
        options: [],

        socketConnectedState : false,
        serverTimeOffset     : '[unknown]',

        msgRecvd    : '[Nothing]',
        msgsReceived: 0,
        msgCtrl     : '[Nothing]',
        msgsControl : 0,

        msgSent     : '[Nothing]',
        msgsSent    : 0,
        msgCtrlSent : '[Nothing]',
        msgsCtrlSent: 0,
    }, // --- End of data --- //
    computed: {
        sortOptions() {
            // Create an options list from our fields
            return this.fields
                .filter(f => f.sortable)
                .map(f => {
                    return { text: f.label, value: f.key }
                })
        },
        items() {
            return Object.keys(this.dev).map(key => {
                return {...this.dev[key], ...(this.data[key] || {})}
            })
        }
    }, // --- End of computed --- //
    methods: {
        onFiltered(filteredItems) {
            // Trigger pagination to update the number of buttons/pages due to filtering
            this.totalRows = filteredItems.length
            this.currentPage = 1
        } // --- End of onFiltered --- //
    }, // --- End of methods --- //

    // Available hooks: init,mounted,updated,destroyed
    mounted: function(){
        //console.debug('[indexjs:Vue.mounted] app mounted - setting up uibuilder watchers')

        /** **REQUIRED** Start uibuilder comms with Node-RED @since v2.0.0-dev3
         * Pass the namespace and ioPath variables if hosting page is not in the instance root folder
         * e.g. If you get continual `uibuilderfe:ioSetup: SOCKET CONNECT ERROR` error messages.
         * e.g. uibuilder.start('/nr/uib', '/nr/uibuilder/vendor/socket.io') // change to use your paths/names
         */
        uibuilder.start()

        var vueApp = this

        /** You can use the following to help trace how messages flow back and forth.
         * You can then amend this processing to suite your requirements.
         */

        //#region ---- Trace Received Messages ---- //
        // If msg changes - msg is updated when a standard msg is received from Node-RED over Socket.IO
        // newVal relates to the attribute being listened to.
        uibuilder.onChange('msg', function(newVal){
            //console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', newVal)
            vueApp.msgRecvd = newVal
            if (newVal.topic === 'init') {
                vueApp.fields = newVal.payload.fields
                vueApp.options = newVal.payload.options
            } else if(newVal.topic === 'dev') {
                vueApp.dev = newVal.payload
            } else if(newVal.topic === 'data') {
                vueApp.data = newVal.payload
            }
        })
        // As we receive new messages, we get an updated count as well
        uibuilder.onChange('msgsReceived', function(newVal){
            //console.info('[indexjs:uibuilder.onChange] Updated count of received msgs:', newVal)
            vueApp.msgsReceived = newVal
        })

        // If we receive a control message from Node-RED, we can get the new data here - we pass it to a Vue variable
        uibuilder.onChange('ctrlMsg', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:ctrlMsg] CONTROL msg received from Node-RED server:', newVal)
            vueApp.msgCtrl = newVal
        })
        // Updated count of control messages received
        uibuilder.onChange('msgsCtrl', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:msgsCtrl] Updated count of received CONTROL msgs:', newVal)
            vueApp.msgsControl = newVal
        })
        //#endregion ---- End of Trace Received Messages ---- //

        //#region ---- Trace Sent Messages ---- //
        // You probably only need these to help you understand the order of processing //
        // If a message is sent back to Node-RED, we can grab a copy here if we want to
        uibuilder.onChange('sentMsg', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:sentMsg] msg sent to Node-RED server:', newVal)
            vueApp.msgSent = newVal
        })
        // Updated count of sent messages
        uibuilder.onChange('msgsSent', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:msgsSent] Updated count of msgs sent:', newVal)
            vueApp.msgsSent = newVal
        })

        // If we send a control message to Node-RED, we can get a copy of it here
        uibuilder.onChange('sentCtrlMsg', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:sentCtrlMsg] Control message sent to Node-RED server:', newVal)
            vueApp.msgCtrlSent = newVal
        })
        // And we can get an updated count
        uibuilder.onChange('msgsSentCtrl', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:msgsSentCtrl] Updated count of CONTROL msgs sent:', newVal)
            vueApp.msgsCtrlSent = newVal
        })
        //#endregion ---- End of Trace Sent Messages ---- //

        // If Socket.IO connects/disconnects, we get true/false here
        uibuilder.onChange('ioConnected', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:ioConnected] Socket.IO Connection Status Changed to:', newVal)
            vueApp.socketConnectedState = newVal
        })
        // If Server Time Offset changes
        uibuilder.onChange('serverTimeOffset', function(newVal){
            //console.info('[indexjs:uibuilder.onChange:serverTimeOffset] Offset of time between the browser and the server has changed to:', newVal)
            vueApp.serverTimeOffset = newVal
        })

    } // --- End of mounted hook --- //

}) // --- End of app1 --- //

// EOF
