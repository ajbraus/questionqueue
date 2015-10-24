/*
 * POST CONTROLLERS
 */

'use strict';

angular.module('question-cookie')
  .controller('PostIndexCtrl', function ($scope, $rootScope, Post, socket, $routeParams, $cookies, $location) {
    $scope.roomName = $routeParams.roomName

    //JOIN ROOM
    socket.emit('publish.join_room', { roomName: $routeParams.roomName });

    $scope.$on('socket:broadcast.join_room', function (event, clientsCount) {
      console.log(clientsCount)
      $scope.$apply(function() {
        $scope.clientsCount = clientsCount;
      })
    });

    // LEAVE ROOM
    window.onbeforeunload = leaveRoom;
    function leaveRoom() {
      socket.emit("publish.leave_room", { roomName: $routeParams.roomName });
      return null;
    }
    $scope.$on('socket:broadcast.leave_room', function (event, clientsCount) {
      $scope.$apply(function() {
        $scope.clientsCount = clientsCount;
      });
    });


    // POSTS // 

    $scope.posts = Post.query({ "roomName": $routeParams.roomName });
    
    // PUBLISH POST
    $scope.post = { "roomName": $routeParams.roomName };

    $scope.publishPost = function () {
      // console.log($scope.post)
      socket.emit('publish.post', $scope.post);
      $scope.post.body = ''     
    };

    $scope.$on('socket:broadcast.post', function (event, post) {
      console.log('publishing post:', post)
      // if (post.roomName.toLowerCase() == $routeParams.roomName.toLowerCase()) {
        $scope.$apply(function() {
          $scope.posts.unshift(post);     
        });
      // };
    });


    // COMMENTS //

    // PUBLISH COMMENT
    $scope.comment = {};
    $scope.createComment = function(post) {
      console.log(post)
      $scope.comment.post_id = post._id
      socket.emit('publish.comment', $scope.comment);
      $scope.comment.body = ''
      post.newComment = false;
    };

    // ON COMMENT PUBLISHED
    $scope.$on('socket:broadcast.comment', function (event, post) {
      if (post.room_name.toLowerCase() == $routeParams.roomName.toLowerCase()) {
        var comment = post.comments[0]
        console.log(comment)
        $scope.$apply(function() {
          post = _.findWhere($scope.posts, {_id: post._id});
          post.comments.unshift(comment);
        });
      };
    });

    // SWITCH ORDER NEWEST/VOTES
    $scope.order = '-created_at';
    $scope.orderButton = "Recent"

    $scope.switchOrder = function() {
      if ($scope.order == '-created_at') {
        console.log("vote_count")
        $scope.order = '-votes_count';
        $scope.orderButton = "Most Votes"
      }  else {
        console.log("created_at")
        $scope.order = '-created_at'
        $scope.orderButton = "Recent"
      }
    }



    // HANDLE VOTING WITH COOKIES

    // NO VOTING WITHOUT COOKIES
    $scope.hasCookiesEnabled = true;
    if (!navigator.cookieEnabled) {
      alert("You must enable Cookies in order to vote on questions.")
      $scope.hasCookiesEnabled = false;
    }

    $scope.alreadyVoted =  function(post, direction){
      if (direction === 'up') {
        return $scope.vup_ids.indexOf(post._id) > -1  
      } else if (direction === 'down') {
        return $scope.vdp_ids.indexOf(post._id) > -1
      }
    }

    if (!$cookies.vup_ids) {
      $scope.vup_ids = [];
    } else {
      $scope.vup_ids = JSON.parse($cookies.vup_ids);
    }

    if (!$cookies.vdp_ids) {
      $scope.vdp_ids = [];
    } else {
      $scope.vdp_ids = JSON.parse($cookies.vdp_ids);
    }

    // click vote up
    // if already voted up, return nil
    // else emit vote_up.post
    // on response 
    // if already voted down, remove from vdp_ids
    // else add to vup_ids

    // VOTE UP
    $scope.voteUp = function (post) {
      if ($scope.vup_ids.indexOf(post._id) > -1 ) {
        console.log('already voted up')
        console.log($scope.vup_ids)
      } else {
        socket.emit("vote_up.post", { id: post._id });

        if ($scope.vdp_ids.indexOf(post._id) > -1) {
          //remove from vote down ids
          $scope.vdp_ids = _.without($scope.vdp_ids, post._id);
          $cookies.vdp_ids = JSON.stringify($scope.vdp_ids);
        } else {
          // Add and save voted down ids to cookie
          $scope.vup_ids.push(post._id)
          $cookies.vup_ids = JSON.stringify($scope.vup_ids);
        }

      }
    }

    $scope.$on('socket:broadcast.vote_up', function (event, post) {
      var post = _.findWhere($scope.posts, {_id: post._id});
      // INCREMENT VOTE_COUNT
      post.votes_count = ++post.votes_count
    });

    $scope.voteDown = function (post) {
      if ($scope.vdp_ids.indexOf(post._id) > -1 ) {
        console.log('already voted down')
        console.log($scope.vdp_ids)
      } else {
        socket.emit("vote_down.post", { id: post._id });  

        if ($scope.vup_ids.indexOf(post._id) > -1) {
          //remove from vote up ids
          $scope.vup_ids = _.without($scope.vup_ids, post._id);
          $cookies.vup_ids = JSON.stringify($scope.vup_ids);
        } else {
          $scope.vdp_ids.push(post._id)
          $cookies.vdp_ids = JSON.stringify($scope.vdp_ids);
        }
      }
    }

    $scope.$on('socket:broadcast.vote_down', function (event, post) {
      var post = _.findWhere($scope.posts, {_id: post._id});
      // DECREMENT vote_count
      post.votes_count = --post.votes_count
    });
  });