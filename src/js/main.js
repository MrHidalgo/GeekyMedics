$(document).ready(function(){

  //////////
  // Global variables
  //////////

  var _window = $(window);
  var _document = $(document);
  var lastClickEl;
  var easingSwing = [.02, .01, .47, 1]; // default jQuery easing for anime.js

  ////////////
  // READY - triggered when PJAX DONE
  ////////////

  // single time initialization
  legacySupport();
  // setTimeout(initAOS, 500);
  initAOS();
  initPreloader();

  // on transition change
  function pageReady(){
    changeImageSVG();
    titleCollapse();
    circleSvgProgress();
    closeAll();
  }

  // this is a master function which should have all functionality
  pageReady();


  //////////
  // COMMON
  //////////

  function initAOS() {
    AOS.init();
  }

  function initPreloader(){
    var $overlay = $('.js-transition-overlay');

    TweenLite.fromTo($overlay, 1, {
        x: "0%",
        overwrite: "all"
      },
      {
        x: "100%",
        ease: Expo.easeOut,
        delay: 0.2,
        onComplete: function() {
          $overlay.remove();
          $("body").removeClass("is-transitioning");
        }
      }
    );


  }

  function legacySupport(){
    // svg support for laggy browsers
    svg4everybody();

    // Viewport units buggyfill
    window.viewportUnitsBuggyfill.init({
      force: true,
      refreshDebounceWait: 150,
      appendToBody: true
    });
  }

  function closeAll(){
    closeUserDropdown();
  }


  // Prevent # behavior
  _document
    .on("click", '[href="#"]', function(e) {
      e.preventDefault();
    })
    .on("click", "a[href]", function(e) {
      if (Barba.Pjax.transitionProgress) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.currentTarget.href === window.location.href) {
        e.preventDefault();
        e.stopPropagation();
      }
    })
    .on("click", 'a[href^="#section"]', function(e) {
      // section scroll
      var el = $(this).attr("href");
      scrollToSection($(el));
      return false;
    });

  function scrollToSection(el) {
    var headerHeight = $(".header").height();
    var targetScroll = el.offset().top - headerHeight;

    TweenLite.to(window, 1, {
      scrollTo: targetScroll,
      ease: easingSwing
    });
  }


  /////////
  // header dropdown
  /////////
  _document.on('click', '[js-header-dropdown]', function(e){
    $(this).toggleClass('is-active');
  })


  function closeUserDropdown(){
    $('[js-header-dropdown]').removeClass('is-active');
  }



  // .img-svg
  function changeImageSVG() {
    document.querySelectorAll('img.svg-js').forEach(function (element) {
      var imgID = element.getAttribute('id'),
        imgClass = element.getAttribute('class'),
        imgURL = element.getAttribute('src');

      var xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var svg = xhr.responseXML.getElementsByTagName('svg')[0];

          if (imgID != null) {
            svg.setAttribute('id', imgID);
          }

          if (imgClass != null) {
            svg.setAttribute('class', imgClass + ' replaced-svg');
          }

          svg.removeAttribute('xmlns:a');

          if (!svg.hasAttribute('viewBox') && svg.hasAttribute('height') && svg.hasAttribute('width')) {
            svg.setAttribute('viewBox', '0 0 ' + svg.getAttribute('height') + ' ' + svg.getAttribute('width'))
          }
          element.parentElement.replaceChild(svg, element)
        }
      };

      xhr.open('GET', imgURL, true);
      xhr.send(null);
    })
  }

  function titleCollapse() {
    $("[titleHead-js]").on("click", function(e) {
      var elem = $(e.currentTarget),
        parentContainer = elem.closest("section").find("[titleBody-js]");

      elem.toggleClass("is-active");
      parentContainer.slideToggle(300);
    });
  }

  function circleSvgProgress() {
    var elemSvgArr = $(".progress svg");

    elemSvgArr.each(function(idx, val) {
      var elem = $(val),
        elemCircle = elem.find(".progress__circle"),
        elemPercentVal = parseInt(elem.data("val"));

      if (isNaN(elemPercentVal)) {
        elemPercentVal = 100;
      } else{
        var r = parseInt(elemCircle.attr('r')),
          c = Math.PI * (r * 2);

        if (elemPercentVal < 0) {
          elemPercentVal = 0;
        }
        if (elemPercentVal > 100) {
          elemPercentVal = 100;
        }

        var pct = ((100 - elemPercentVal) / 100) * c;

        elemCircle.css({"strokeDasharray": c });
        elemCircle.animate({"strokeDashoffset": pct}, 500);
      }
    });
  }


  //////////
  // BARBA PJAX
  //////////

  Barba.Pjax.Dom.containerClass = "page";

  var OverlayTransition = Barba.BaseTransition.extend({
    start: function() {
      Promise.all([this.newContainerLoading, this.fadeOut()]).then(
        this.fadeIn.bind(this)
      );
    },

    fadeOut: function() {
      var deferred = Barba.Utils.deferred();

      // store overlay globally to access in fadein
      this.$overlay = $('<div class="js-transition-overlay"></div>');
      this.$overlay.insertAfter(".header");
      $("body").addClass("is-transitioning");

      TweenLite.fromTo(this.$overlay, 0.6,
        {
          x: "0%"
        },
        {
          x: "100%",
          ease: Quart.easeIn,
          onComplete: function() {
            deferred.resolve();
          }
        }
      );

      return deferred.promise;
    },

    fadeIn: function() {
      var _this = this; // copy to acces inside animation callbacks
      var $el = $(this.newContainer);

      $(this.oldContainer).hide();

      $el.css({
        visibility: "visible"
      });

      TweenLite.to(window, 0.2, {
        scrollTo: 1,
        ease: easingSwing
      });

      AOS.refreshHard(); // refresh AOS instance

      TweenLite.fromTo(
        this.$overlay,
        1,
        {
          x: "100%",
          overwrite: "all"
        },
        {
          x: "200%",
          ease: Expo.easeOut,
          delay: 0.2,
          onComplete: function() {
            _this.$overlay.remove();
            triggerBody();
            $("body").removeClass("is-transitioning");
            _this.done();
          }
        }
      );
    }
  });

  // set barba transition
  Barba.Pjax.getTransition = function() {
    // return FadeTransition;
    return OverlayTransition;
  };

  Barba.Prefetch.init();
  Barba.Pjax.start();

  // event handlers
  Barba.Dispatcher.on("linkClicked", function(el) {
    lastClickEl = el; // save last click to detect transition type
  });

  Barba.Dispatcher.on("initStateChange", function(currentStatus) {
    var container = Barba.Pjax.Dom.getContainer();
    var haveContainer = $(container).find(".page__content").length > 0;

    if (!haveContainer) {
      // handle error - redirect ot page regular way
      window.location.href = currentStatus.url;
    }
  });

  Barba.Dispatcher.on("newPageReady", function(currentStatus, oldStatus, container,newPageRawHTML) {
    pageReady();
  });

  Barba.Dispatcher.on("transitionCompleted", function() {

  });

  // some plugins get bindings onNewPage only that way
  function triggerBody() {
    $(window).scroll();
    $(window).resize();
  }

});
