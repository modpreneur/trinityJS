import Controller from 'trinity/src/Controller';

export default class IndexController extends Controller {
    indexAction($scope){
        console.log($scope);
    }
}