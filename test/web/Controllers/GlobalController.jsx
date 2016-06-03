import Controller from 'trinity/src/Controller';
import _ from 'lodash';

export default class GlobalController extends Controller {
    indexAction($scope){
        console.log($scope);
        console.log('HELLO FROM GLOBAL');
    }
}