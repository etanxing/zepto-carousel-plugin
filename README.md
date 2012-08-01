# Zepto Carousel Plugin (Webkit only & Experimental)

A lightweight zepto plugin totally based on [SwipeView](https://github.com/cubiq/SwipeView).

``` html
<div class="container">
</div>
<div class="slides">
    <div class="slide">Page1</div>
    <div class="slide">Page2</div>
    <div class="slide">Page3</div>
    <div class="slide">Page4</div>
</div>
```

``` javascript
$('.container').carousel({slides: $('.slides').children()});
```