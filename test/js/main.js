/**
 * Created by fisa on 3/3/16.
 */
'use strict';

function uploadFile(){
    console.log('uploading');
    let fileInput = q.id('file-input');
    if(fileInput.files.length === 0){
        return;
    }
    let file = fileInput.files[0];

    let reader = new FileReader();
    reader.onloadstart = (event)=>{
        console.log('LOAD STARTED', event);
    };
    reader.onprogress= (event)=>{
        console.log('PROGRESS', event);
    };
    reader.onload = (event)=>{
        console.log(event);
    };
    reader.readAsText(file, 'UTF-8');
}

