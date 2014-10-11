var DocsApp = angular.module('docsApp', ['ngMaterial', 'ngRoute', 'angularytics'])

.config([
  'COMPONENTS',
  '$routeProvider',
function(COMPONENTS, $routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/home.tmpl.html'
    })
    .when('/layout/:tmpl', {
      templateUrl: function(params){
        return 'partials/layout-' + params.tmpl + '.tmpl.html';
      }
    });

  angular.forEach(COMPONENTS, function(component) {

    angular.forEach(component.docs, function(doc) {
      doc.url = '/' + doc.url;
      $routeProvider.when(doc.url, {
        templateUrl: doc.outputPath,
        resolve: {
          component: function() { return component; },
          doc: function() { return doc; }
        },
        controller: 'ComponentDocCtrl'
      });
    });

  });

  $routeProvider.otherwise('/');
}])

.config(['AngularyticsProvider', function(AngularyticsProvider) {
  AngularyticsProvider.setEventHandlers(['Console', 'GoogleUniversal']);
}])

.run([
  'Angularytics',
  '$rootScope',
function(Angularytics, $rootScope) {
  Angularytics.init();
}])

.factory('menu', [
  'COMPONENTS',
  '$location',
  '$rootScope',
function(COMPONENTS, $location, $rootScope) {

  var menuDocs = {};
  COMPONENTS.forEach(function(component) {
    component.docs.forEach(function(doc) {
      menuDocs[doc.type] = menuDocs[doc.type] || [];
      menuDocs[doc.type].push(doc);
    });
  });
  angular.forEach(menuDocs, function(docs, docType) {
    menuDocs[docType] = docs.sort(function(a, b) {
      return a.name < b.name ? -1 : 1;
    });
  });
  var menuDocsFinal = [];
  Object.keys(menuDocs).sort(function(a, b) {
    return a.name < b.name ? -1 : 1;
  }).forEach(function(docType) {
    menuDocsFinal = menuDocsFinal.concat(menuDocs[docType]);
  });

  var sections = [/* {
    name: 'Demos',
    pages: demoDocs
    } */, {
    name: 'Layout',
    pages: [{
      name: 'Container Elements',
      id: 'layoutContainers',
      url: '/layout/container'
    },{
      name: 'Grid System',
      id: 'layoutGrid',
      url: '/layout/grid'
    },{
      name: 'Child Alignment',
      id: 'layoutAlign',
      url: '/layout/alignment'
    },{
      name: 'Options',
      id: 'layoutOptions',
      url: '/layout/options'
    }]
  }, {
    name: 'API',
    pages: menuDocsFinal
  }];
  var self;

  $rootScope.$on('$locationChangeSuccess', onLocationChange);

  return self = {
    sections: sections,

    selectSection: function(section) {
      self.openedSection = section;
    },
    toggleSelectSection: function(section) {
      self.openedSection = (self.openedSection === section ? null : section);
    },
    isSectionSelected: function(section) {
      return self.openedSection === section;
    },

    selectPage: function(section, page) {
      page && page.url && $location.path(page.url);
      self.currentSection = section;
      self.currentPage = page;
    },
    isPageSelected: function(section, page) {
      return self.currentPage === page;
    }
  };

  function sortByHumanName(a,b) {
    return (a.humanName < b.humanName) ? -1 :
      (a.humanName > b.humanName) ? 1 : 0;
  }

  function onLocationChange() {
    var activated = false;
    var path = $location.path();
    sections.forEach(function(section) {
      section.pages.forEach(function(page) {
        if (path === page.url) {
          self.selectSection(section);
          self.selectPage(section, page);
          activated = true;
        }
      });
    });
    if (!activated) {
      self.selectSection(sections[2]);
    }
  }
}])

.controller('DocsCtrl', [
  '$scope',
  'COMPONENTS',
  '$materialSidenav',
  '$timeout',
  '$materialDialog',
  'menu',
  '$location',
function($scope, COMPONENTS, $materialSidenav, $timeout, $materialDialog, menu, $location ) {

  $scope.COMPONENTS = COMPONENTS;

  $scope.menu = menu;

  var mainContentArea = document.querySelector("[role='main']");

  $scope.toggleMenu = function() {
    $timeout(function() {
      $materialSidenav('left').toggle();
    });
  };

  $scope.openPage = function(section, page) {
    menu.selectPage(section, page);
    $scope.toggleMenu();
    mainContentArea.focus();
  };

  $scope.goHome = function($event) {
    menu.selectPage(null, null);
    $location.path( '/' );
  };
}])

.controller('HomeCtrl', [
  '$scope',
  '$rootScope',
  '$http',
function($scope, $rootScope, $http) {
  $rootScope.currentComponent = $rootScope.currentDoc = null;

  $scope.version = "";
  $scope.versionURL = "";

  // Load build version information; to be
  // used in the header bar area
  var now = Math.round(new Date().getTime()/1000);
  var versionFile = "version.json" + "?ts=" + now;

  $http.get("version.json")
    .then(function(response){
      var sha = response.data.sha || "";
      var url = response.data.url;

      if (sha) {
        $scope.versionURL = url + sha;
        $scope.version = sha.substr(0,6);
      }
    });


}])

.controller('LayoutCtrl', [
  '$scope',
  '$attrs',
  '$location',
  '$rootScope',
function($scope, $attrs, $location, $rootScope) {
  $rootScope.currentComponent = $rootScope.currentDoc = null;
}])

.controller('ComponentDocCtrl', [
  '$scope',
  'doc',
  'component',
  '$rootScope',
  '$templateCache',
  '$http',
  '$q',
function($scope, doc, component, $rootScope, $templateCache, $http, $q) {
  $rootScope.currentComponent = component;
  $rootScope.currentDoc = doc;

  false && component.demos.forEach(function(demo) {

    var demoFiles = [demo.indexFile]
      .concat( (demo.files || []).sort(sortByJs) );

    var promises = demoFiles.map(function(file) {
      return $http.get(file.outputPath, {cache: $templateCache}).then(
        function(response) {
          file.content = response.data;
          return file;
        }, 
        function(err) {
          file.content = 'Failed to load ' + file.outputPath + '.';
          return file;
        }
      );
    });

    $q.all(promises).then(function(files) {
      demo.$files = files;
      demo.$selectedFile = files[0];
    });

  });

  function sortByJs(file) {
    return file.fileType == 'js' ? -1 : 1;
  }

}])

.filter('humanizeDoc', function() {
  return function(doc) {
    if (!doc || !doc.type) return doc;
    if (doc.type === 'directive') {
      return doc.name.replace(/([A-Z])/g, function($1) {
        return '-'+$1.toLowerCase();
      }); 
    }
    return doc.name;
  };
})
;
