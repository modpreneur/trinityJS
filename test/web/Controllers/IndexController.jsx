import Controller from 'trinity/src/Controller';
import _ from 'lodash';
import TrinityForm from 'trinity/src/components/TrinityForm';

export default class IndexController extends Controller {
    indexAction($scope){
        console.log($scope);
        console.log('SOMEHING');
    }

    formAction($scope){
        console.log('test');
        $scope.trinityF = new TrinityForm($scope['test-form']);
    }
}