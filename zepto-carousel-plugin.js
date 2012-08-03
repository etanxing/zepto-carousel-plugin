;(function($){
    'use strict';

    var hasTouch = 'ontouchstart' in window,
        resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize',
        startEvent = hasTouch ? 'touchstart' : 'mousedown',
        moveEvent = hasTouch ? 'touchmove' : 'mousemove',
        endEvent = hasTouch ? 'touchend' : 'mouseup',
        cancelEvent = hasTouch ? 'touchcancel' : 'mouseup',
        SwipeView = function (el, options) {
            this.options = {
                text: null,
                numberOfPages: 3,
                snapThreshold: null,
                hastyPageFlip: false,
                loop: true,
                slides : [],
                prev: '.prev',
                next: '.next'
            }

            // User defined options
            this.options = $.extend({}, this.options, options)    

            var i,
                div,
                className,
                pageIndex,
                btn = { prev: $(this.options.prev), next: $(this.options.next) };

            this.wrapper = $(el).css({ overflow: 'hidden', position: 'relative' });      
            
            this.masterPages = [];
            
            div = document.createElement('div');
            div.id = 'swipeview-slider';
            div.style.cssText = 'position:relative;top:0;height:100%;width:100%;-webkit-transition-duration:0;-webkit-transform:translate3d(0,0,0);-webkit-transition-timing-function:ease-out';
            this.wrapper.append(div);
            this.slider = div;

            this.refreshSize();

            for (i=-1; i<2; i++) {
                div = document.createElement('div');
                div.id = 'swipeview-masterpage-' + (i+1);
                div.style.cssText = '-webkit-transform:translateZ(0);position:absolute;top:0;height:100%;width:100%;left:' + i*100 + '%';
                if (!div.dataset) div.dataset = {};
                pageIndex = i == -1 ? this.options.numberOfPages - 1 : i;
                div.dataset.pageIndex = pageIndex;
                div.dataset.upcomingPageIndex = pageIndex;
                
                if (!this.options.loop && i == -1) div.style.visibility = 'hidden';

                this.slider.appendChild(div);
                this.masterPages.push(div);
            }

            // Load initial data
            (function initLoad(slides, ms){
                var el,
                    page;

                if (slides.length >= 3) {
                    for (i=0; i<3; i++) {
                        page = i==0 ? slides.length-1 : i-1;
                        el = document.createElement('div')
                        el.innerHTML = slides[page].innerHTML
                        ms[i].appendChild(el)
                    }
                }
            })(this.options.slides, this.masterPages)

            className = this.masterPages[1].className;
            this.masterPages[1].className = !className ? 'swipeview-active' : className + ' swipeview-active';

            window.addEventListener(resizeEvent, this, false);
            this.wrapper.on(startEvent, $.proxy(this.handleEvent, this))
            this.wrapper.on(startEvent, $.proxy(this.handleEvent, this));
            this.wrapper.on(moveEvent, $.proxy(this.handleEvent, this));
            this.wrapper.on(endEvent, $.proxy(this.handleEvent, this));
            $(this.slider).on('webkitTransitionEnd', $.proxy(this.handleEvent, this));

            // BTNS
            btn.prev.on('tap, click', $.proxy(this.prev, this));
            btn.next.on('tap, click', $.proxy(this.next, this));
        };

        SwipeView.prototype = {
            currentMasterPage: 1,
            x: 0,
            page: 0,
            pageIndex: 0,
            customEvents: [],
            destroy: function () {
                while ( this.customEvents.length ) {
                    this.wrapper.off('swipeview-' + this.customEvents[0][0], this.customEvents[0][1]);
                    this.customEvents.shift();
                }
                
                // Remove the event listeners
                window.removeEventListener(resizeEvent, this, false);
                this.wrapper.off(startEvent, $.proxy(this.handleEvent, this))
                this.wrapper.off(startEvent, $.proxy(this.handleEvent, this));
                this.wrapper.off(moveEvent, $.proxy(this.handleEvent, this));
                this.wrapper.off(endEvent, $.proxy(this.handleEvent, this));
                $(this.slider).off('webkitTransitionEnd', $.proxy(this.handleEvent, this));
            },

            refreshSize: function () {
                this.wrapperWidth = this.wrapper[0].clientWidth;
                this.wrapperHeight = this.wrapper[0].clientHeight;
                this.pageWidth = this.wrapperWidth;
                this.maxX = -this.options.numberOfPages * this.pageWidth + this.wrapperWidth;
                this.snapThreshold = this.options.snapThreshold === null ?
                    Math.round(this.pageWidth * 0.15) :
                    /%/.test(this.options.snapThreshold) ?
                        Math.round(this.pageWidth * this.options.snapThreshold.replace('%', '') / 100) :
                        this.options.snapThreshold;
            },
            
            updatePageCount: function (n) {
                this.options.numberOfPages = n;
                this.maxX = -this.options.numberOfPages * this.pageWidth + this.wrapperWidth;
            },
            
            goToPage: function (p) {
                var i;

                this.masterPages[this.currentMasterPage].className = this.masterPages[this.currentMasterPage].className.replace(/(^|\s)swipeview-active(\s|$)/, '');
                for (i=0; i<3; i++) {
                    className = this.masterPages[i].className;
                    /(^|\s)swipeview-loading(\s|$)/.test(className) || (this.masterPages[i].className = !className ? 'swipeview-loading' : className + ' swipeview-loading');
                }
                
                p = p < 0 ? 0 : p > this.options.numberOfPages-1 ? this.options.numberOfPages-1 : p;
                this.page = p;
                this.pageIndex = p;
                this.slider.style.webkitTransitionDuration = '0';
                this.__pos(-p * this.pageWidth);

                this.currentMasterPage = (this.page + 1) - Math.floor((this.page + 1) / 3) * 3;

                this.masterPages[this.currentMasterPage].className = this.masterPages[this.currentMasterPage].className + ' swipeview-active';

                if (this.currentMasterPage == 0) {
                    this.masterPages[2].style.left = this.page * 100 - 100 + '%';
                    this.masterPages[0].style.left = this.page * 100 + '%';
                    this.masterPages[1].style.left = this.page * 100 + 100 + '%';
                    
                    this.masterPages[2].dataset.upcomingPageIndex = this.page === 0 ? this.options.numberOfPages-1 : this.page - 1;
                    this.masterPages[0].dataset.upcomingPageIndex = this.page;
                    this.masterPages[1].dataset.upcomingPageIndex = this.page == this.options.numberOfPages-1 ? 0 : this.page + 1;
                } else if (this.currentMasterPage == 1) {
                    this.masterPages[0].style.left = this.page * 100 - 100 + '%';
                    this.masterPages[1].style.left = this.page * 100 + '%';
                    this.masterPages[2].style.left = this.page * 100 + 100 + '%';

                    this.masterPages[0].dataset.upcomingPageIndex = this.page === 0 ? this.options.numberOfPages-1 : this.page - 1;
                    this.masterPages[1].dataset.upcomingPageIndex = this.page;
                    this.masterPages[2].dataset.upcomingPageIndex = this.page == this.options.numberOfPages-1 ? 0 : this.page + 1;
                } else {
                    this.masterPages[1].style.left = this.page * 100 - 100 + '%';
                    this.masterPages[2].style.left = this.page * 100 + '%';
                    this.masterPages[0].style.left = this.page * 100 + 100 + '%';

                    this.masterPages[1].dataset.upcomingPageIndex = this.page === 0 ? this.options.numberOfPages-1 : this.page - 1;
                    this.masterPages[2].dataset.upcomingPageIndex = this.page;
                    this.masterPages[0].dataset.upcomingPageIndex = this.page == this.options.numberOfPages-1 ? 0 : this.page + 1;
                }
                
                this.__flip();
            },
            
            next: function () {
                if (!this.options.loop && this.x == this.maxX) return;
                
                this.directionX = -1;
                this.x -= 1;
                this.__checkPosition();
            },

            prev: function () {
                if (!this.options.loop && this.x === 0) return;

                this.directionX = 1;
                this.x += 1;
                this.__checkPosition();
            },

            handleEvent: function (e) {
                //output("HandleEvent:" + e.type);
                switch (e.type) {
                    case startEvent:
                        this.__start(e);
                        break;
                    case moveEvent:
                        this.__move(e);
                        break;
                    case cancelEvent:
                    case endEvent:
                        this.__end(e);
                        break;
                    case resizeEvent:
                        this.__resize();
                        break;
                    case 'webkitTransitionEnd':
                        if (e.target == this.slider && !this.options.hastyPageFlip) this.__flip();
                        break;
                }
            },


            /**
            *
            * Pseudo private methods
            *
            */
            __pos: function (x) {
                //output("Event: __pos" );
                this.x = x;
                this.slider.style.webkitTransform = 'translate3d(' + x + 'px,0,0)';
            },

            __resize: function () {
                this.refreshSize();
                this.slider.style.webkitTransitionDuration = '0';
                this.__pos(-this.page * this.pageWidth);
            },

            __start: function (e) {
                //e.preventDefault();           
                if (this.initiated) return;

                var point = hasTouch ? e.touches[0] : e;
                
                this.initiated = true;
                this.moved = false;
                this.thresholdExceeded = false;
                this.startX = point.pageX;
                this.startY = point.pageY;
                this.pointX = point.pageX;
                this.pointY = point.pageY;
                this.stepsX = 0;
                this.stepsY = 0;
                this.directionX = 0;
                this.directionLocked = false;
            
                this.slider.style.webkitTransitionDuration = '0';
                
                this.__event('touchstart');
            },
            
            __move: function (e) {                  
                if (!this.initiated) return;

                var point = hasTouch ? e.touches[0] : e,
                    deltaX = point.pageX - this.pointX,
                    deltaY = point.pageY - this.pointY,
                    newX = this.x + deltaX,
                    dist = Math.abs(point.pageX - this.startX);

                this.moved = true;
                this.pointX = point.pageX;
                this.pointY = point.pageY;
                this.directionX = deltaX > 0 ? 1 : deltaX < 0 ? -1 : 0;
                this.stepsX += Math.abs(deltaX);
                this.stepsY += Math.abs(deltaY);

                // We take a 10px buffer to figure out the direction of the swipe
                if (this.stepsX < 10 && this.stepsY < 10) {
                    // e.preventDefault();
                    return;
                }

                // We are scrolling vertically, so skip SwipeView and give the control back to the browser
                if (!this.directionLocked && this.stepsY > this.stepsX) {
                    this.initiated = false;
                    return;
                }

                e.preventDefault();

                this.directionLocked = true;

                if (!this.options.loop && (newX > 0 || newX < this.maxX)) {
                    newX = this.x + (deltaX / 2);
                }

                if (!this.thresholdExceeded && dist >= this.snapThreshold) {
                    this.thresholdExceeded = true;
                    this.__event('moveout');
                } else if (this.thresholdExceeded && dist < this.snapThreshold) {
                    this.thresholdExceeded = false;
                    this.__event('movein');
                }

                this.__pos(newX);
            },
            
            __end: function (e) {
                if (!this.initiated) return;
                
                var point = hasTouch ? e.changedTouches[0] : e,
                    dist = Math.abs(point.pageX - this.startX);

                this.initiated = false;
                
                if (!this.moved) {
                    return;
                }

                if (!this.options.loop && (this.x > 0 || this.x < this.maxX)) {
                    dist = 0;
                    this.__event('movein');
                }

                // Check if we exceeded the snap threshold
                if (dist < this.snapThreshold) {                
                    this.slider.style.webkitTransitionDuration = Math.floor(300 * dist / this.snapThreshold) + 'ms';
                    this.__pos(-this.page * this.pageWidth);
                    return;
                }

                this.__checkPosition();
            },
            
            __checkPosition: function () {
                var pageFlip,
                    pageFlipIndex,
                    className,
                    newX;

                this.masterPages[this.currentMasterPage].className = this.masterPages[this.currentMasterPage].className.replace(/(^|\s)swipeview-active(\s|$)/, '');

                // Flip the page
                if (this.directionX > 0) {
                    this.page = -Math.ceil(this.x / this.pageWidth);
                    this.currentMasterPage = (this.page + 1) - Math.floor((this.page + 1) / 3) * 3;
                    this.pageIndex = this.pageIndex === 0 ? this.options.numberOfPages - 1 : this.pageIndex - 1;

                    pageFlip = this.currentMasterPage - 1;
                    pageFlip = pageFlip < 0 ? 2 : pageFlip;
                    this.masterPages[pageFlip].style.left = this.page * 100 - 100 + '%';

                    pageFlipIndex = this.page - 1;
                } else {
                    this.page = -Math.floor(this.x / this.pageWidth);
                    this.currentMasterPage = (this.page + 1) - Math.floor((this.page + 1) / 3) * 3;
                    this.pageIndex = this.pageIndex == this.options.numberOfPages - 1 ? 0 : this.pageIndex + 1;

                    pageFlip = this.currentMasterPage + 1;
                    pageFlip = pageFlip > 2 ? 0 : pageFlip;
                    this.masterPages[pageFlip].style.left = this.page * 100 + 100 + '%';

                    pageFlipIndex = this.page + 1;
                }

                // Add active class to current page
                className = this.masterPages[this.currentMasterPage].className;
                /(^|\s)swipeview-active(\s|$)/.test(className) || (this.masterPages[this.currentMasterPage].className = !className ? 'swipeview-active' : className + ' swipeview-active');

                // Add loading class to flipped page
                className = this.masterPages[pageFlip].className;
                /(^|\s)swipeview-loading(\s|$)/.test(className) || (this.masterPages[pageFlip].className = !className ? 'swipeview-loading' : className + ' swipeview-loading');
                
                pageFlipIndex = pageFlipIndex - Math.floor(pageFlipIndex / this.options.numberOfPages) * this.options.numberOfPages;
                this.masterPages[pageFlip].dataset.upcomingPageIndex = pageFlipIndex;       // Index to be loaded in the newly flipped page

                newX = -this.page * this.pageWidth;
                
                this.slider.style.webkitTransitionDuration = Math.floor(500 * Math.abs(this.x - newX) / this.pageWidth) + 'ms';

                // Hide the next page if we decided to disable looping
                if (!this.options.loop) {
                    this.masterPages[pageFlip].style.visibility = newX === 0 || newX == this.maxX ? 'hidden' : '';
                }

                if (this.x == newX) {
                    this.__flip();      // If we swiped all the way long to the next page (extremely rare but still)
                } else {
                    this.__pos(newX);
                    if (this.options.hastyPageFlip) this.__flip();
                }
            },
            
            __flip: function () {                
                this.__event('flip');
                var el, upcoming, i;

                for (i = 0; i < 3; i++) {
                    upcoming = this.masterPages[i].dataset.upcomingPageIndex;
                    if (upcoming != this.masterPages[i].dataset.pageIndex) {
                        el = this.masterPages[i].querySelector('div')
                        el.innerHTML = this.options.slides[upcoming].innerHTML
                    }
                }

                for (var i=0; i<3; i++) {
                    this.masterPages[i].className = this.masterPages[i].className.replace(/(^|\s)swipeview-loading(\s|$)/, '');     // Remove the loading class
                    this.masterPages[i].dataset.pageIndex = this.masterPages[i].dataset.upcomingPageIndex;
                }
            },
            
            __event: function (type) {
                this.wrapper.trigger('swipeview-' + type, [this.masterPages, this.options, this.currentMasterPage])
            }
        };

    $.fn.carousel = function(opts) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('carousel')
            if (!data) $this.data('carousel', (data = new SwipeView(this, opts)))
            if (typeof option == 'string') data[option].call($this)
        })
    }

})(Zepto);