## Gateway
Ajax request service. Provides set of static methods for sending common ajax requests.
___
### Gateway.send(url, method = 'GET', data, successCallback, errorCallback, isManual = false)

  Send ajax request and handles response. Also sets following headers: ('X-Requested-With' => 'XMLHttpRequest')
___
### Arguments  
>`url {string}` - address where to send request

>`[method='GET'] {string}` - Reques type

>`[data] {object}` - Data to send with request. If method is 'GET' data are transformed into query string

>`[successCallback] {Function}` - called when response code is 200, 300. Callback receive *response* object which contains all data provided by Reponse object from [superagent]() library

>`[errorCallback] {Function}` - called when some error occurs (reponse codes 400+ or request timeout). Callback rececive *error_ object as parameter. Error object can contain _response_ and _timeout_ properties based on error type. However if _timeout_ property is set, _response_ is undefined!

>`[isManual=false] {boolean}` - Override flag. If set, request will be prepared but not send. Its usefull if you need to set extra headers or have more fine granular controll about request like aborting.
___

**Returns**  
    `{Request}` - [superagent]() Request instance