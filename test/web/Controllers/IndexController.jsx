import Controller from 'trinity/src/Controller';
import _ from 'lodash';
import TrinityForm from 'trinity/src/components/TrinityForm';
import Gateway from 'trinity/src/Gateway';
import Events from 'trinity/src/utils/Events';

export default class IndexController extends Controller {
    indexAction($scope){
        console.log($scope);
        console.log('SOMEHING');
    }

    formAction($scope){
        let tt = new TrinityForm($scope['test-form']);
        tt.success(function(res){
            console.log(res);
        });
        tt.error(function(err){
            console.log('ERROR');
            console.log(err);
        });
        tt.addListener('submit-data', (e)=>{
            console.log('DATA', e);
        });
        tt.on('progress', (e)=>{
            console.log(e);
        });
        console.log('REBUILD');
        let call = (e)=>{
            let fileList = $scope['testFile'].files;
            Gateway.sendFile('/process-file', 'POST', fileList, null, (res)=>{
                console.log('OK', res);
            }, (err, res)=>{
                console.log(res);
                console.log({'tt': err});
                console.error(err);
            });
        };
        Events.listen($scope.sendFileBtn, 'click', call);

        let cc = `sdgdsgsdgdsg
        dsgdsgsdgdsgsd
        gdsgdsgdsgsd
        gdsgdsgsdgsdgds
        gdsgsdgds`;
        console.log(cc);
    }

    beforeAction(){
        console.log('BEFORE ACTION');
    }

    afterAction(){
        console.log('AFTER ACTION');
    }
}