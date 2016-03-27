import Controller from 'trinity/src/Controller';
//import _ from 'lodash';

export default class IndexController extends Controller {
    indexAction($scope){
        console.log($scope);
        console.log('SOMEHING');
    }
}