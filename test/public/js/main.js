/**
 * Created by fisa on 3/8/16.
 */
'use strict';
import _ from 'lodash';
import Gateway from 'trinity/Gateway';

Gateway.settings.debug = true;

let button = q.id('file-submit');
let fileInput = q.id('file-input');
let progressBar = q.id('file-progress');

button.addEventListener('click', (e)=>{
    console.log('WORKS');
    let file = fileInput.files[0];
    if(file){
        let fData = new FormData();
        fData.append(file.name, file);
        Gateway.sendFile(
            '/process-file',
            'POST',
            file,
            'photos',
            (resp)=>{
                console.log(resp);
                let tId = setTimeout((e)=>{
                    clearTimeout(tId);
                    progressBar.style.width = 0;
                }, 3000);

            }, (error)=>{
                console.error(error);
            }, (progress)=>{
                let percentage = Math.round(progress.loaded / progress.total * 100);
                progressBar.style.width = percentage +'%';
                console.log( percentage  );
            }
        )
    }
});

console.log('App Loaded');