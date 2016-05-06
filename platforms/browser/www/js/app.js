/*!
 * Roots v 2.0.0
 * Follow me @adanarchila at Codecanyon.net
 * URL: http://codecanyon.net/item/roots-phonegapcordova-multipurpose-hybrid-app/9525999
 * Don't forget to rate Roots if you like it! :)
 */

// In this file we are goint to include all the Controllers our app it's going to need

(function() {
  'use strict';

  var app = angular.module('app', ['onsen', 'angular-images-loaded', 'ngMap', 'angular-carousel']);

  // Filter to convert HTML content to string by removing all HTML tags
  app.filter('htmlToPlaintext', function() {
    return function(text) {
      return String(text).replace(/<[^>]+>/gm, '');
    }
  });

  app.controller('networkController', function($scope) {

  });

  // This functions will help us save the JSON in the localStorage to read the website content offline

  Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
  }

  Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
  }

  // This directive will allow us to cache all the images that have the img-cache attribute in the <img> tag
  app.directive('imgCache', ['$document', function($document) {
    return {
      link: function(scope, ele, attrs) {
        var target = $(ele);

        scope.$on('ImgCacheReady', function() {

          ImgCache.isCached(attrs.src, function(path, success) {
            if (success) {
              ImgCache.useCachedFile(target);
            } else {
              ImgCache.cacheFile(attrs.src, function() {
                ImgCache.useCachedFile(target);
              });
            }
          });
        }, false);

      }
    };
  }]);

  app.controller('menuController', ['$http', '$scope', '$rootScope', function($http, $scope, $rootScope) {

    $scope.menuAPI = 'http://bougetafrance.fr/api/get_category_index/?cookie=paul|1460539984|l55e0mW4EBWPtVOvzQBKBNBsESHy8WPsAA0krKdlBxe|dc721e04380943012494d505b58e7a98626da2377414b1a52c8347f050ed60df';
    $scope.menuItems = [];
    $scope.isFetchingMenu = true;

    // This function pulls the menu from your website
    $scope.pullContent = function() {
      $.ajax({
        url: $scope.menuAPI,
        success: function(response) {
          $scope.menuItems = $scope.menuItems.concat(response.categories);
          window.localStorage.setObject('rootsMenu', $scope.menuItems); // we save the posts in localStorage
          window.localStorage.setItem('rootsMenuDate', new Date());

          // For dev purposes you can remove the comment for the line below to check on the console the size of your JSON in local Storage
          // for(var x in localStorage)console.log(x+"="+((localStorage[x].length * 2)/1024/1024).toFixed(2)+" MB");

          $scope.isFetchingMenu = false;
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log("########");
          console.log("ERROR");
          console.log(errorThrown);
          console.log(textStatus);
          console.log(jqXHR);
        }
      });
    };
    // This function opens the category.html and prints all the posts from the category you selected on the menu
    $scope.showCategory = function(index) {
      $rootScope.categoryID = $scope.menuItems[index];
      $scope.menu.setMainPage('category.html', {
        closeMenu: true
      });
    };

    if (window.localStorage.getItem("rootsMenuDate") != null && window.localStorage.getObject("rootsMenu") != null) {

      var now = new Date();
      var saved = new Date(window.localStorage.getItem('rootsMenuDate'));

      var difference = Math.abs(now.getTime() - saved.getTime()) / 3600000;

      // Lets compare the current dateTime with the one we saved when we got the menu items.
      // If the difference between the dates is more than 12 hours I think is time to get fresh content
      // You can change the 12 to something shorter or longer

      if (difference > 0) {

        window.localStorage.removeItem('rootsMenu');
        window.localStorage.removeItem('rootsMenuDate');

        $scope.pullContent();

      } else {

        $scope.menuItems = window.localStorage.getObject('rootsMenu');
        $scope.isFetchingMenu = false;

      }

    } else {

      $scope.pullContent();

    }


  }]);

  app.controller('categoryController', ['$http', '$scope', '$rootScope', function($http, $scope, $rootScope) {

    $scope.category = $rootScope.categoryID;
    $scope.categoryID = $rootScope.categoryID.id;
    $scope.catPrefix = 'cat' + $scope.categoryID;

    $scope.catAPI = 'http://bougetafrance.fr/api/get_category_posts/&id=' + $scope.categoryID;
    $scope.catItems = [];
    $scope.catTotalPages = 0;
    $scope.catCurrentPage = 1;
    $scope.catPageNumber = 1;
    $scope.isFetching = true;
    $scope.lastSavedPage = 0;

    $scope.imgLoadedEvents = {
      done: function(instance) {
        angular.element(instance.elements[0]).removeClass('is-loading').addClass('is-loaded');
      }
    };

    $scope.pullContent = function() {

      $http.jsonp($scope.catAPI + '&page=' + $scope.catPageNumber + '&callback=JSON_CALLBACK').success(function(response) {

        if ($scope.catPageNumber > response.pages) {

          // hide the more news button
          $('#moreButton[rel=' + $scope.catPrefix + ']').fadeOut('fast');

        } else {

          $scope.catItems = $scope.catItems.concat(response.posts);
          window.localStorage.setObject('rootsPosts' + $scope.catPrefix, $scope.catItems); // we save the posts in localStorage
          window.localStorage.setItem('rootsDate' + $scope.catPrefix, new Date());
          window.localStorage.setItem("rootsLastPage" + $scope.catPrefix, $scope.catCurrentPage);
          window.localStorage.setItem("rootsTotalPages" + $scope.catPrefix, response.pages);

          // For dev purposes you can remove the comment for the line below to check on the console the size of your JSON in local Storage
          // for(var x in localStorage)console.log(x+"="+((localStorage[x].length * 2)/1024/1024).toFixed(2)+" MB");

          $scope.catTotalPages = response.pages;
          $scope.isFetching = false;

          if ($scope.catPageNumber == response.pages) {

            // hide the more news button
            $('#moreButton[rel=' + $scope.catPrefix + ']').fadeOut('fast');

          }

        }

      });

    }

    $scope.showPost = function(index) {

      $rootScope.postContent = $scope.catItems[index];
      $scope.ons.navigator.pushPage('post.html');

    };

    $scope.nextPage = function() {

      $scope.catCurrentPage++;
      $scope.catPageNumber = $scope.catCurrentPage;
      $scope.getAllRecords($scope.catPageNumber);

    }

    $scope.getAllRecords = function(catPageNumber) {

      $scope.isFetching = true;

      if (window.localStorage.getItem("rootsLastPage" + $scope.catPrefix) == null) {

        console.log('pulling content for the first time');
        $scope.pullContent();

      } else {

        var now = new Date();
        var saved = new Date(window.localStorage.getItem("rootsDate" + $scope.catPrefix));

        var difference = Math.abs(now.getTime() - saved.getTime()) / 3600000;

        // Lets compare the current dateTime with the one we saved when we got the posts.
        // If the difference between the dates is more than 24 hours I think is time to get fresh content
        // You can change the 12 to something shorter or longer

        if (difference > 24) {
          // Let's reset everything and get new content from the site.
          $scope.catCurrentPage = 1;
          $scope.catPageNumber = 1;
          $scope.lastSavedPage = 0;
          window.localStorage.removeItem("rootsLastPage" + $scope.catPrefix);
          window.localStorage.removeItem("rootsPosts" + $scope.catPrefix);
          window.localStorage.removeItem("rootsTotalPages" + $scope.catPrefix);
          window.localStorage.removeItem("rootsDate" + $scope.catPrefix);
          console.log('lets start over again with fresh content')
          $scope.pullContent();

        } else {

          $scope.lastSavedPage = window.localStorage.getItem("rootsLastPage" + $scope.catPrefix);

          // If the page we want is greater than the last saved page, we need to pull content from the web
          if ($scope.catCurrentPage > $scope.lastSavedPage) {

            console.log('pulling new page content');
            $scope.pullContent();

            // else if the page we want is lower than the last saved page, we have it on local Storage, so just show it.
          } else {

            console.log('getting saved json');
            $scope.catItems = window.localStorage.getObject('rootsPosts' + $scope.catPrefix);
            $scope.catCurrentPage = $scope.lastSavedPage;
            $scope.catTotalPages = window.localStorage.getItem("rootsTotalPages" + $scope.catPrefix);
            $scope.isFetching = false;

          }

        }

      }

    };


  }]);

  app.controller('newsController', ['$http', '$scope', '$rootScope', function($http, $scope, $rootScope) {

    $scope.yourAPI = 'https://bougetafrance.fr/api/get_recent_posts/';
    $scope.items = [];
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.pageNumber = 1;
    $scope.isFetching = true;
    $scope.lastSavedPage = 0;

    // Let's initiate this on the first Controller that will be executed.
    ons.ready(function() {

      // Cache Images Setup
      // Set the debug to false before deploying your app
      ImgCache.options.debug = false;

      ImgCache.init(function() {

        //console.log('ImgCache init: success!');
        $rootScope.$broadcast('ImgCacheReady');
        // from within this function you're now able to call other ImgCache methods
        // or you can wait for the ImgCacheReady event

      }, function() {
        //console.log('ImgCache init: error! Check the log for errors');
      });

    });


    $scope.pullContent = function() {
      $http.jsonp($scope.yourAPI+'/?page='+$scope.pageNumber+'&callback=JSON_CALLBACK').success(function(response) {

        if($scope.pageNumber > response.pages){

          // hide the more news button
          $('#moreButton').fadeOut('fast');

        } else {

          $scope.items = $scope.items.concat(response.posts);
          window.localStorage.setObject('rootsPosts', $scope.items); // we save the posts in localStorage
          window.localStorage.setItem('rootsDate', new Date());
          window.localStorage.setItem("rootsLastPage", $scope.currentPage);
          window.localStorage.setItem("rootsTotalPages", response.pages);

          // For dev purposes you can remove the comment for the line below to check on the console the size of your JSON in local Storage
          // for(var x in localStorage)console.log(x+"="+((localStorage[x].length * 2)/1024/1024).toFixed(2)+" MB");

          $scope.totalPages = response.pages;
          $scope.isFetching = false;

          if($scope.pageNumber == response.pages){

            // hide the more news button
            $('#moreButton').fadeOut('fast');

          }

        }

      });

    }

    $scope.getAllRecords = function(pageNumber) {
      $scope.isFetching = true;
      if (window.localStorage.getItem("rootsLastPage") == null ) {
        $scope.pullContent();
      } else {
        var now = new Date();
        var saved = new Date(window.localStorage.getItem("rootsDate"));
        var difference = Math.abs( now.getTime() - saved.getTime() ) / 3600000;
        // Lets compare the current dateTime with the one we saved when we got the posts.
        // If the difference between the dates is more than 24 hours I think is time to get fresh content
        // You can change the 24 to something shorter or longer
        if(difference > 24){
          // Let's reset everything and get new content from the site.
          $scope.currentPage = 1;
          $scope.pageNumber = 1;
          $scope.lastSavedPage = 0;
          window.localStorage.removeItem("rootsLastPage");
          window.localStorage.removeItem("rootsPosts");
          window.localStorage.removeItem("rootsTotalPages");
          window.localStorage.removeItem("rootsDate");
          $scope.pullContent();
        } else {
          $scope.lastSavedPage = window.localStorage.getItem("rootsLastPage");
          // If the page we want is greater than the last saved page, we need to pull content from the web
          if($scope.currentPage > $scope.lastSavedPage){
            $scope.pullContent();
          // else if the page we want is lower than the last saved page, we have it on local Storage, so just show it.
          } else {
            $scope.items = window.localStorage.getObject('rootsPosts');
            $scope.currentPage = $scope.lastSavedPage;
            $scope.totalPages = window.localStorage.getItem("rootsTotalPages");
            $scope.isFetching = false;
          }
        }
      }
    };

    $scope.imgLoadedEvents = {
      done: function(instance) {
        angular.element(instance.elements[0]).removeClass('is-loading').addClass('is-loaded');
      }
    };

    $scope.showPost = function(index) {
      $rootScope.postContent = $scope.items[index];
      $scope.ons.navigator.pushPage('post.html');
    };

    $scope.nextPage = function() {
      $scope.currentPage++;
      $scope.pageNumber = $scope.currentPage;
      $scope.getAllRecords($scope.pageNumber);
    }

  }]);

  app.controller('speakersController', ['$http', '$scope', '$rootScope', function($http, $scope, $rootScope) {

    $scope.showSpeaker = function(page) {
      console.log(page);
      $scope.menu.setMainPage(page);
    };

  }]);

  app.controller('postController', ['$scope', '$rootScope', '$sce', function($scope, $rootScope, $sce) {

    $scope.item = $rootScope.postContent;

    $scope.renderHtml = function(htmlCode) {
      return $sce.trustAsHtml(htmlCode);
    };

    $scope.imgLoadedEvents = {
      done: function(instance) {
        angular.element(instance.elements[0]).removeClass('is-loading').addClass('is-loaded');
      }
    };

  }]);

  app.controller('mediasController', ['$scope', '$rootScope', '$http', '$sce', function($scope, $rootScope, $http, $sce) {

    $scope.yourAPI = "https://bougetafrance.fr/api/get_page/?slug=mediatheque&callback=JSON_CALLBACK"

    $scope.getPage = function() {
      console.log("ok");
      $http.jsonp($scope.yourAPI).success(function(response) {
        console.log(response);
        $scope.item =response.page;
      });
    }
    $scope.renderHtml = function(htmlCode) {
      return $sce.trustAsHtml(htmlCode);
    };

  }]);

  app.controller('contactController', ['$scope', function($scope) {
    document.addEventListener('deviceready', function() {
      $scope.sendEmail = function() {
        var data = {
          "email" : $('#email').val(),
          "name" : $('#name').val(),
          "subject" : $('#subject').val(),
          "message" : $('#message').val()
        };

        $('#email').val("");
        $('#name').val("");
        $('#subject').val("");
        $('#message').val("");

        $.ajax({
          url: "https://bougetafrance.fr/send_email/sending.php",
          method: 'POST',
          data: data,
          success: function(data) {
            console.log(data);
            alert("Votre message a été envoyé. Nous vous répondrons dans les meilleurs délais")
          },
          error: function() {
            alert("Impossible d'envoyer le message !");
          }
        });
      }
    }, false);
  }]);

  app.controller('markersController', function($scope, $compile) {

    $scope.infoWindow = {
      title: 'title',
      content: 'content'
    };

    $scope.markers = [{
      'title': 'Stade Océanne - Le Havre',
      'content': 'Lieu du rassemlement <br> <b>"Bouge Ta France 2017"</b>',
      'location': [49.499377, 0.169593]
    }];

    $scope.showMarker = function(event) {

      $scope.marker = $scope.markers[this.id];
      $scope.infoWindow = {
        title: $scope.marker.title,
        content: $scope.marker.content,
        animation: google.maps.Animation.BOUNCE,
        icon: '/images/icon.png'
      };
      $scope.$apply();
      $scope.showInfoWindow(event, 'marker-info', this.getPosition());

    }

  });

  app.controller('homeController', ['$scope', '$rootScope', function($scope, $rootScope) {
    $scope.init = function() {
      init_countdown();
      setInterval(init_countdown, 1000);
      new WOW().init();
    }
  }]);
})();
