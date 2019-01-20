import "../css/style.css"
import { default as Web3} from "web3"
import { default as contract } from "truffle-contract"

//导入智能合约
import votingArtifacts from "../../build/contracts/Voting.json"
var VotingContract = contract(votingArtifacts)

// 在window中运行
window.App = {
  //初始化
  start: function() { 
    // 提供合约支持
    VotingContract.setProvider(window.web3.currentProvider)
    VotingContract.defaults({from: window.web3.eth.accounts[0],gas:6721975})
    VotingContract.deployed().then(function(instance){

      // 调用 getNumOfCandidates()
      instance.getNumOfCandidates().then(function(numOfCandidates){

        // 加入新建候选人
        if (numOfCandidates == 0){
          instance.addCandidate("Frank","Democratic",true).then(function(result){ 
            $("#candidate-box").append(`<div class='form-check'><input class='form-check-input' type='checkbox' value='' id=${result.logs[0].args.candidateID}><label class='form-check-label' for=0>Frank</label></div>`)
          })
          instance.addCandidate("Sicilia","Republican",false).then(function(result){
            $("#candidate-box").append(`<div class='form-check'><input class='form-check-input' type='checkbox' value='' id=${result.logs[0].args.candidateID}><label class='form-check-label' for=0>Sicilia</label></div>`)
          })
          numOfCandidates = 2 
        }
        //如果有候选人，显示
        else { 
          for (var i = 0; i < numOfCandidates; i++ ){
            instance.getCandidate(i).then(function(data){
              $("#candidate-box").append(`<div class="form-check"><input class="form-check-input" type="checkbox" value="" id=${data[0]}><label class="form-check-label" for=${data[0]}>${window.web3.toAscii(data[1])}</label></div>`)
            })
          }
        }
        window.numOfCandidates = numOfCandidates 
      })
    }).catch(function(err){ 
      console.error("ERROR! " + err.message)
    })
  },


  //参选
  beCandidate: function(){
    var name = $("#name-input").val()
    var party = $("#party-input").val()
    var gender = $("#gender-input").val()
    if(gender == "male") gender = true
    else gender = false
    if (name == "" || party == "" || gender == "" ){
      $("#msg2").html("<p>Please enter information.</p>")
      return
    }
    VotingContract.deployed().then(function(instance){
        instance.addCandidate(name, party, gender)
        //刷新候选人数量
        window.numOfCandidates = numOfCandidates 
  })
    for (var i = 0; i < numOfCandidates; i++ ){
        instance.getCandidate(i).then(function(data){
              $("#candidate-box").append(`<div class="form-check"><input class="form-check-input" type="checkbox" value="" id=${data[0]}><label class="form-check-label" for=${data[0]}>${window.web3.toAscii(data[1])}</label></div>`)
            })
    }
},
  // 投票
  vote: function() {
    var uid = $("#id-input").val() //获取voterID
    if (uid == ""){
      $("#msg").html("<p>Please enter ID.</p>")
      return
    }
    if ($("#candidate-box :checkbox:checked").length > 0){ 
      //获取候选人ID
      var candidateID = $("#candidate-box :checkbox:checked")[0].id
    } 
    else {
      //如果没有选择
      $("#msg").html("<p>Please choose a candidate.</p>")
      return
    }
    // 显示投票成功
    VotingContract.deployed().then(function(instance){
      instance.vote(uid,parseInt(candidateID)).then(function(result){
        $("#msg").html("<p>Voted</p>")
      })
    }).catch(function(err){ 
      console.error("ERROR! " + err.message)
    })
  },

  //统计票数
  findNumOfVotes: function() {
    VotingContract.deployed().then(function(instance){
      var box = $("<section></section>") 

      // 循环统计
      for (var i = 0; i < window.numOfCandidates; i++){
        var candidatePromise = instance.getCandidate(i)
        var votesPromise = instance.totalVotes(i)
        Promise.all([candidatePromise,votesPromise]).then(function(data){
          box.append(`<p>${window.web3.toAscii(data[0][1])}: ${data[1]}</p>`)
        }).catch(function(err){ 
          console.error("ERROR! " + err.message)
        })
      }
      $("#vote-box").html(box) //显示box
    })
  }
}

//界面加载启动
window.addEventListener("load", function() {
  // 判断是Web3
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask")
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"))
  }
  window.App.start()
})