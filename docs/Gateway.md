## Gateway
Ajax request service. Provides set of static methods for sending common ajax requests.
___
### .send(*url*, *[method]*, *[data]*, *[successCallback]*, *[errorCallback]*, *[isManual]*)
Send ajax request and handles response. Also sets following headers: ('X-Requested-With' => 'XMLHttpRequest')

#### Arguments  
**url**  
Type: `string`

Address where to send request

**method**  
Type: `string`  
Default: "GET"  

Reques type

**data**  
Type: `Object`  
Default: null

Data to send with request. If method is 'GET' data are transformed into query string

**successCallback**  
Type: `Function`  
Default: () => {}

Called when response code is 200, 300. Callback receive `response` object which contains all data provided by Reponse object from [superagent](https://github.com/visionmedia/superagent) library

**errorCallback**  
Type: `Function` 
Default: () => {} 

Called when some error occurs (reponse codes 400+ or request timeout). Callback rececive *error_ object as parameter. Error object can contain _response_ and _timeout_ properties based on error type. However if _timeout_ property is set, _response_ is undefined!

**isManual**  
Type: `boolean`  
Default: `false`  

Override flag. If set, request will be prepared but not send. Its usefull if you need to set extra headers or have more fine granular controll about request like aborting.
___

#### Returns  
**request**  
Type: `Request`  

[superagent](https://github.com/visionmedia/superagent) Request instance